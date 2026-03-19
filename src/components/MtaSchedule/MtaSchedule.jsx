import { useState, useEffect } from 'react'
import styles from './MtaSchedule.module.css'
import { useMta, MNR_FEED_URL } from '../../hooks/useMta'
import { MNR_LINES } from '../../data/mnrStations'
import { SUBWAY_LINES } from '../../data/subwayStations'

// ── Default route ────────────────────────────────────────────────
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

// ── Mock data fallback ────────────────────────────────────────────
const DEPARTURE_MINS = [7, 37, 52, 17, 47, 22]
function getMockDepartures() {
  const now = new Date()
  const h = now.getHours(), m = now.getMinutes()
  const deps = []
  for (let offset = 0; offset < 4 && deps.length < 3; offset++) {
    for (const bm of DEPARTURE_MINS) {
      const depH = h + offset
      if (depH >= 24) break
      if (offset === 0 && bm <= m) continue
      const depTime = `${depH > 12 ? depH - 12 : depH || 12}:${String(bm).padStart(2, '0')} ${depH >= 12 ? 'PM' : 'AM'}`
      const dur = 75 + Math.floor(Math.random() * 15)
      const minsAway = (depH - h) * 60 + (bm - m)
      const type = dur <= 78 ? 'Express' : 'Local'
      deps.push({ depTime, minsAway, type })
      if (deps.length >= 3) break
    }
  }
  return deps
}

// ── Helpers ───────────────────────────────────────────────────────
function migrateSavedRoutes(routes) {
  return routes.map(r => ({
    feedUrl: MNR_FEED_URL,
    direction: null,
    network: 'mnr',
    ...r,
  }))
}

function routeLabel(r) {
  if (r.network === 'subway') {
    const dir = r.direction === 'N' ? '↑ Uptown' : '↓ Downtown'
    return `[${r.line}] ${r.fromName} ${dir}`
  }
  return `${r.fromName} → ${r.toName}`
}

function lineColor(r) {
  if (r.network === 'subway') return SUBWAY_LINES[r.line]?.color ?? '#888'
  return MNR_LINES[r.line]?.color ?? '#00843D'
}

// ── Component ─────────────────────────────────────────────────────
export default function MtaSchedule() {
  const [routes, setRoutes] = useState(() => {
    try {
      const saved = localStorage.getItem('mta-routes')
      return saved ? migrateSavedRoutes(JSON.parse(saved)) : DEFAULT_ROUTES
    } catch { return DEFAULT_ROUTES }
  })
  const [activeIdx, setActiveIdx] = useState(0)
  const [editMode,  setEditMode]  = useState(false)
  const [showAdd,   setShowAdd]   = useState(false)
  const [mockDeps,  setMockDeps]  = useState(getMockDepartures)

  // Add-form state
  const [newNetwork,   setNewNetwork]   = useState('subway')
  const [newLine,      setNewLine]      = useState('1')
  const [newFrom,      setNewFrom]      = useState('')
  const [newTo,        setNewTo]        = useState('')
  const [newDirection, setNewDirection] = useState('N')

  const { results } = useMta(routes)

  useEffect(() => {
    localStorage.setItem('mta-routes', JSON.stringify(routes))
    if (activeIdx >= routes.length) setActiveIdx(Math.max(0, routes.length - 1))
  }, [routes]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setInterval(() => setMockDeps(getMockDepartures()), 60000)
    return () => clearInterval(id)
  }, [])

  const safeIdx      = Math.min(activeIdx, Math.max(0, routes.length - 1))
  const activeRoute  = routes[safeIdx]
  const liveDeps     = results?.[activeRoute?.id]
  const departures   = liveDeps ?? mockDeps
  const isLive       = !!liveDeps
  const color        = lineColor(activeRoute ?? {})

  // Form helpers
  const lineStops = newNetwork === 'subway'
    ? (SUBWAY_LINES[newLine]?.stops ?? [])
    : (MNR_LINES[newLine]?.stops ?? [])

  const resetForm = () => {
    setNewNetwork('subway')
    setNewLine('1')
    setNewFrom('')
    setNewTo('')
    setNewDirection('N')
  }

  const handleAdd = () => {
    if (newNetwork === 'subway') {
      const fromStop = lineStops.find(s => s.name === newFrom)
      if (!fromStop) return
      setRoutes(prev => [...prev, {
        id: `route-${Date.now()}`,
        network: 'subway',
        line: newLine,
        fromName: newFrom,
        fromId: fromStop.id,
        toName: null,
        toId: null,
        feedUrl: SUBWAY_LINES[newLine].feedUrl,
        direction: newDirection,
      }])
    } else {
      const fromStop = lineStops.find(s => s.name === newFrom)
      const toStop   = lineStops.find(s => s.name === newTo)
      if (!fromStop || !toStop || newFrom === newTo) return
      setRoutes(prev => [...prev, {
        id: `route-${Date.now()}`,
        network: 'mnr',
        line: newLine,
        fromName: newFrom,
        fromId: fromStop.id,
        toName: newTo,
        toId: toStop.id,
        feedUrl: MNR_FEED_URL,
        direction: null,
      }])
    }
    setActiveIdx(routes.length)
    setShowAdd(false)
    resetForm()
  }

  const canAdd = newNetwork === 'subway'
    ? !!newFrom
    : !!(newFrom && newTo && newFrom !== newTo)

  const toggleEdit = () => {
    setEditMode(e => !e)
    setShowAdd(false)
    resetForm()
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className={styles.mta}>

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.label}>
          {activeRoute?.network === 'subway' ? 'NYC Subway' : 'Metro-North'}
        </span>
        <div className={styles.headerRight}>
          {activeRoute?.network === 'subway' ? (
            <span className={styles.subwayBullet} style={{ background: color }}>
              {activeRoute.line}
            </span>
          ) : (
            <span className={styles.route} style={{ color }}>
              {activeRoute?.line}
            </span>
          )}
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
                    : null}
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
              {/* Network toggle */}
              <div className={styles.networkToggle}>
                <button
                  className={`${styles.networkBtn} ${newNetwork === 'subway' ? styles.networkBtnActive : ''}`}
                  onClick={() => { setNewNetwork('subway'); setNewLine('1'); setNewFrom(''); setNewTo('') }}
                >NYC Subway</button>
                <button
                  className={`${styles.networkBtn} ${newNetwork === 'mnr' ? styles.networkBtnActive : ''}`}
                  onClick={() => { setNewNetwork('mnr'); setNewLine('New Haven'); setNewFrom(''); setNewTo('') }}
                >Metro-North</button>
              </div>

              {newNetwork === 'subway' ? (
                <>
                  {/* Subway line pills */}
                  <div className={styles.linePills}>
                    {Object.entries(SUBWAY_LINES).map(([l, meta]) => (
                      <button
                        key={l}
                        className={`${styles.linePill} ${newLine === l ? styles.linePillActive : ''}`}
                        style={newLine === l ? { background: meta.color } : {}}
                        onClick={() => { setNewLine(l); setNewFrom('') }}
                      >{l}</button>
                    ))}
                  </div>

                  {/* Station */}
                  <div className={styles.formRow}>
                    <label>Stop</label>
                    <select value={newFrom} onChange={e => setNewFrom(e.target.value)}>
                      <option value="">Select…</option>
                      {lineStops.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>

                  {/* Direction */}
                  <div className={styles.formRow}>
                    <label>Dir</label>
                    <div className={styles.dirToggle}>
                      <button
                        className={`${styles.dirBtn} ${newDirection === 'N' ? styles.dirBtnActive : ''}`}
                        onClick={() => setNewDirection('N')}
                      >↑ Uptown</button>
                      <button
                        className={`${styles.dirBtn} ${newDirection === 'S' ? styles.dirBtnActive : ''}`}
                        onClick={() => setNewDirection('S')}
                      >↓ Downtown</button>
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
        /* ── Normal view ── */
        <>
          <div className={styles.stationsRow}>
            <div className={styles.stationInfo}>
              {activeRoute?.network === 'subway' ? (
                <span className={styles.stationName}>
                  {activeRoute.fromName}
                  <span className={styles.dirLabel}>
                    {activeRoute.direction === 'N' ? ' ↑ Uptown' : ' ↓ Downtown'}
                  </span>
                </span>
              ) : (
                <div className={styles.stations}>
                  <span className={styles.from}>{activeRoute?.fromName}</span>
                  <span className={styles.arrow}>→</span>
                  <span className={styles.to}>{activeRoute?.toName}</span>
                </div>
              )}
            </div>
            {routes.length > 1 && (
              <div className={styles.navRow}>
                <button className={styles.navBtn} onClick={() => setActiveIdx(i => Math.max(0, i - 1))} disabled={safeIdx === 0}>‹</button>
                <div className={styles.dots}>
                  {routes.map((_, i) => (
                    <button key={i} className={`${styles.dot} ${i === safeIdx ? styles.dotActive : ''}`} onClick={() => setActiveIdx(i)} />
                  ))}
                </div>
                <button className={styles.navBtn} onClick={() => setActiveIdx(i => Math.min(routes.length - 1, i + 1))} disabled={safeIdx === routes.length - 1}>›</button>
              </div>
            )}
          </div>

          <div className={styles.trains}>
            {departures.map((dep, i) => (
              <div key={i} className={styles.train}>
                <div className={styles.trainLeft}>
                  {activeRoute?.network === 'subway' ? (
                    <span className={styles.subwayBulletSm} style={{ background: color }}>{activeRoute.line}</span>
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
        </>
      )}
    </div>
  )
}
