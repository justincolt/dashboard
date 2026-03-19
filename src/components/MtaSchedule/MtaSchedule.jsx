import { useState, useEffect } from 'react'
import styles from './MtaSchedule.module.css'
import { useMta, MNR_FEED_URL } from '../../hooks/useMta'
import { MNR_LINES } from '../../data/mnrStations'
import { SUBWAY_LINES } from '../../data/subwayStations'

// ── Default routes ────────────────────────────────────────────────
const DEFAULT_ROUTES = [
  {
    id: 'default',
    network: 'mnr',
    line: 'New Haven',
    fromName: 'Grand Central',
    fromId: '1',
    toName: 'Fairfield',
    toId: '28',
    feedUrl: MNR_FEED_URL,
    direction: null,
  },
]

// ── Mock departures (per-route offset so they look different) ─────
const BASE_OFFSETS = [7, 22, 37, 14, 29, 52]
function fmt(h, m) {
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
function getMockForRoute(seed) {
  const now  = new Date()
  const h    = now.getHours()
  const m    = now.getMinutes()
  const off  = seed % 6
  const mins = BASE_OFFSETS.map((bm, i) => BASE_OFFSETS[(i + off) % BASE_OFFSETS.length])
  const deps = []
  outer: for (let dh = 0; dh <= 3; dh++) {
    for (const bm of mins) {
      const depH = h + dh
      if (depH >= 24) break outer
      if (dh === 0 && bm <= m) continue
      const minsAway = (depH - h) * 60 + (bm - m)
      deps.push({ depTime: fmt(depH, bm), minsAway, type: minsAway < 20 ? 'Express' : 'Local' })
      if (deps.length >= 3) break outer
    }
  }
  return deps
}

// ── Helpers ───────────────────────────────────────────────────────
function migrateSavedRoutes(routes) {
  return routes.map(r => ({ feedUrl: MNR_FEED_URL, direction: null, network: 'mnr', ...r }))
}

function lineColor(r) {
  if (r.network === 'subway') return SUBWAY_LINES[r.line]?.color ?? '#888'
  return MNR_LINES[r.line]?.color ?? '#00843D'
}

function routeLabel(r) {
  if (r.network === 'subway') {
    const dir = r.direction === 'N' ? '↑ Uptown' : '↓ Downtown'
    return `[${r.line}] ${r.fromName} ${dir}`
  }
  return `${r.fromName} → ${r.toName}`
}

// ── RouteRow ──────────────────────────────────────────────────────
function RouteRow({ route, departures }) {
  const color = lineColor(route)

  return (
    <div className={styles.routeGroup}>
      {/* Station header */}
      <div className={styles.stations}>
        {route.network === 'subway' ? (
          <>
            <span className={styles.from}>{route.fromName}</span>
            <span className={styles.dirLabel}>{route.direction === 'N' ? '↑ Uptown' : '↓ Downtown'}</span>
          </>
        ) : (
          <>
            <span className={styles.from}>{route.fromName}</span>
            <span className={styles.arrow}>→</span>
            <span className={styles.to}>{route.toName}</span>
          </>
        )}
      </div>

      {/* Stacked departure rows */}
      {departures.slice(0, 3).map((dep, i) => (
        <div key={i} className={styles.train}>
          <div className={styles.trainLeft}>
            {route.network === 'subway' ? (
              <span className={styles.subwayBulletSm} style={{ background: color }}>{route.line}</span>
            ) : (
              <span className={styles.badge} data-type={dep.type}
                style={dep.type === 'Express' ? { background: color } : {}}>
                {dep.type === 'Express' ? 'EXP' : 'LOC'}
              </span>
            )}
            <span className={styles.depTime}>{dep.depTime}</span>
          </div>
          <span className={styles.minsAway}>{dep.minsAway <= 1 ? 'Now' : `${dep.minsAway} min`}</span>
        </div>
      ))}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────
export default function MtaSchedule() {
  const [routes, setRoutes] = useState(() => {
    try {
      const saved = localStorage.getItem('mta-routes')
      return saved ? migrateSavedRoutes(JSON.parse(saved)) : DEFAULT_ROUTES
    } catch { return DEFAULT_ROUTES }
  })
  const [editMode,  setEditMode]  = useState(false)
  const [showAdd,   setShowAdd]   = useState(false)
  const [tick,      setTick]      = useState(0)

  // Add-form state
  const [newNetwork,   setNewNetwork]   = useState('subway')
  const [newLine,      setNewLine]      = useState('1')
  const [newFrom,      setNewFrom]      = useState('')
  const [newTo,        setNewTo]        = useState('')
  const [newDirection, setNewDirection] = useState('N')

  const { results } = useMta(routes)

  // Refresh mock every minute
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    localStorage.setItem('mta-routes', JSON.stringify(routes))
  }, [routes])

  const subwayRoutes = routes.filter(r => r.network === 'subway')
  const mnrRoutes    = routes.filter(r => r.network === 'mnr')
  const isLive       = results !== null

  // Per-route departures
  function getDeps(route, idx) {
    return results?.[route.id] ?? getMockForRoute(idx + tick)
  }

  // Form helpers
  const lineStops = newNetwork === 'subway'
    ? (SUBWAY_LINES[newLine]?.stops ?? [])
    : (MNR_LINES[newLine]?.stops ?? [])

  const resetForm = () => { setNewNetwork('subway'); setNewLine('1'); setNewFrom(''); setNewTo(''); setNewDirection('N') }

  const handleAdd = () => {
    if (newNetwork === 'subway') {
      const fromStop = lineStops.find(s => s.name === newFrom)
      if (!fromStop) return
      setRoutes(prev => [...prev, {
        id: `route-${Date.now()}`, network: 'subway', line: newLine,
        fromName: newFrom, fromId: fromStop.id, toName: null, toId: null,
        feedUrl: SUBWAY_LINES[newLine].feedUrl, direction: newDirection,
      }])
    } else {
      const fromStop = lineStops.find(s => s.name === newFrom)
      const toStop   = lineStops.find(s => s.name === newTo)
      if (!fromStop || !toStop || newFrom === newTo) return
      setRoutes(prev => [...prev, {
        id: `route-${Date.now()}`, network: 'mnr', line: newLine,
        fromName: newFrom, fromId: fromStop.id, toName: newTo, toId: toStop.id,
        feedUrl: MNR_FEED_URL, direction: null,
      }])
    }
    setShowAdd(false)
    resetForm()
  }

  const canAdd = newNetwork === 'subway'
    ? !!newFrom
    : !!(newFrom && newTo && newFrom !== newTo)

  const toggleEdit = () => { setEditMode(e => !e); setShowAdd(false); resetForm() }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className={styles.mta}>

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.label}>Transit</span>
        <div className={styles.headerRight}>
          {isLive && <span className={styles.live}>●</span>}
          <button
            className={`${styles.editBtn} ${editMode ? styles.editBtnActive : ''}`}
            onClick={toggleEdit}
            title="Manage routes"
          >✎</button>
        </div>
      </div>

      {editMode ? (
        /* ── Edit panel ── */
        <div className={styles.editPanel}>
          <div className={styles.routeList}>
            {routes.map(r => (
              <div key={r.id} className={styles.routeItem}>
                <div className={styles.routeItemInfo}>
                  {r.network === 'subway'
                    ? <span className={styles.subwayBulletSm} style={{ background: lineColor(r) }}>{r.line}</span>
                    : <span className={styles.mnrTag} style={{ background: lineColor(r) }}>{r.line.slice(0,2).toUpperCase()}</span>}
                  <span className={styles.routeItemStations}>{routeLabel(r)}</span>
                </div>
                {routes.length > 1 && (
                  <button className={styles.removeBtn} onClick={() => setRoutes(rs => rs.filter(x => x.id !== r.id))}>×</button>
                )}
              </div>
            ))}
          </div>

          {showAdd ? (
            <div className={styles.addForm}>
              <div className={styles.networkToggle}>
                <button className={`${styles.networkBtn} ${newNetwork === 'subway' ? styles.networkBtnActive : ''}`}
                  onClick={() => { setNewNetwork('subway'); setNewLine('1'); setNewFrom(''); setNewTo('') }}>NYC Subway</button>
                <button className={`${styles.networkBtn} ${newNetwork === 'mnr' ? styles.networkBtnActive : ''}`}
                  onClick={() => { setNewNetwork('mnr'); setNewLine('New Haven'); setNewFrom(''); setNewTo('') }}>Metro-North</button>
              </div>

              {newNetwork === 'subway' ? (
                <>
                  <div className={styles.linePills}>
                    {Object.entries(SUBWAY_LINES).map(([l, meta]) => (
                      <button key={l}
                        className={`${styles.linePill} ${newLine === l ? styles.linePillActive : ''}`}
                        style={newLine === l ? { background: meta.color } : {}}
                        onClick={() => { setNewLine(l); setNewFrom('') }}>{l}</button>
                    ))}
                  </div>
                  <div className={styles.formRow}>
                    <label>Stop</label>
                    <select value={newFrom} onChange={e => setNewFrom(e.target.value)}>
                      <option value="">Select…</option>
                      {lineStops.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.formRow}>
                    <label>Dir</label>
                    <div className={styles.dirToggle}>
                      <button className={`${styles.dirBtn} ${newDirection === 'N' ? styles.dirBtnActive : ''}`}
                        onClick={() => setNewDirection('N')}>↑ Uptown</button>
                      <button className={`${styles.dirBtn} ${newDirection === 'S' ? styles.dirBtnActive : ''}`}
                        onClick={() => setNewDirection('S')}>↓ Downtown</button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.formRow}>
                    <label>Line</label>
                    <select value={newLine} onChange={e => { setNewLine(e.target.value); setNewFrom(''); setNewTo('') }}>
                      {Object.keys(MNR_LINES).map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className={styles.formRow}>
                    <label>From</label>
                    <select value={newFrom} onChange={e => setNewFrom(e.target.value)}>
                      <option value="">Select…</option>
                      {lineStops.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.formRow}>
                    <label>To</label>
                    <select value={newTo} onChange={e => setNewTo(e.target.value)}>
                      <option value="">Select…</option>
                      {lineStops.filter(s => s.name !== newFrom).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className={styles.formActions}>
                <button className={styles.addConfirmBtn} onClick={handleAdd} disabled={!canAdd}>Add</button>
                <button className={styles.cancelBtn} onClick={() => { setShowAdd(false); resetForm() }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className={styles.addRouteBtn} onClick={() => setShowAdd(true)}>+ Add route</button>
          )}
        </div>

      ) : (
        /* ── Schedule board view ── */
        <div className={styles.board}>

          {subwayRoutes.length > 0 && (
            <div className={styles.section}>
              <span className={styles.sectionLabel}>NYC Subway</span>
              {subwayRoutes.map((r, i) => (
                <RouteRow key={r.id} route={r} departures={getDeps(r, i)} />
              ))}
            </div>
          )}

          {subwayRoutes.length > 0 && mnrRoutes.length > 0 && (
            <div className={styles.divider} />
          )}

          {mnrRoutes.length > 0 && (
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Metro-North</span>
              {mnrRoutes.map((r, i) => (
                <RouteRow key={r.id} route={r} departures={getDeps(r, subwayRoutes.length + i)} />
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
