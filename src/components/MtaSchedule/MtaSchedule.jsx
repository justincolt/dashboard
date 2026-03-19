import { useState, useEffect } from 'react'
import styles from './MtaSchedule.module.css'
import { useMta } from '../../hooks/useMta'
import { MNR_LINES } from '../../data/mnrStations'

const DEFAULT_ROUTES = [
  { id: 'default', line: 'New Haven', fromName: 'Grand Central', fromId: '1', toName: 'Fairfield', toId: '28' },
]

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

export default function MtaSchedule() {
  const [routes, setRoutes] = useState(() => {
    try {
      const saved = localStorage.getItem('mta-routes')
      return saved ? JSON.parse(saved) : DEFAULT_ROUTES
    } catch { return DEFAULT_ROUTES }
  })
  const [activeIdx, setActiveIdx] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newLine, setNewLine] = useState('New Haven')
  const [newFrom, setNewFrom] = useState('')
  const [newTo, setNewTo] = useState('')
  const [mockDeps, setMockDeps] = useState(getMockDepartures)

  const { results } = useMta(routes)

  useEffect(() => {
    localStorage.setItem('mta-routes', JSON.stringify(routes))
    if (activeIdx >= routes.length) setActiveIdx(Math.max(0, routes.length - 1))
  }, [routes]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setInterval(() => setMockDeps(getMockDepartures()), 60000)
    return () => clearInterval(id)
  }, [])

  const safeIdx = Math.min(activeIdx, Math.max(0, routes.length - 1))
  const activeRoute = routes[safeIdx]
  const liveDeps = results?.[activeRoute?.id]
  const departures = liveDeps ?? mockDeps
  const isLive = !!liveDeps

  const lineColor = MNR_LINES[activeRoute?.line]?.color ?? '#00843D'
  const lineStops = MNR_LINES[newLine]?.stops ?? []

  const handleAdd = () => {
    const fromStop = lineStops.find(s => s.name === newFrom)
    const toStop = lineStops.find(s => s.name === newTo)
    if (!fromStop || !toStop || newFrom === newTo) return
    const r = {
      id: `route-${Date.now()}`,
      line: newLine,
      fromName: newFrom,
      fromId: fromStop.id,
      toName: newTo,
      toId: toStop.id,
    }
    setRoutes(prev => [...prev, r])
    setActiveIdx(routes.length)
    setShowAdd(false)
    setNewFrom('')
    setNewTo('')
  }

  const toggleEdit = () => {
    setEditMode(e => !e)
    setShowAdd(false)
  }

  return (
    <div className={styles.mta}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.label}>Metro-North</span>
        <div className={styles.headerRight}>
          <span className={styles.route} style={{ color: lineColor }}>
            {activeRoute?.line} {isLive && <span className={styles.live}>●</span>}
          </span>
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
            {routes.map((r) => (
              <div key={r.id} className={styles.routeItem}>
                <div className={styles.routeItemInfo}>
                  <span className={styles.routeItemStations}>{r.fromName} → {r.toName}</span>
                  <span className={styles.routeItemLine} style={{ color: MNR_LINES[r.line]?.color }}>{r.line}</span>
                </div>
                {routes.length > 1 && (
                  <button className={styles.removeBtn} onClick={() => setRoutes(rs => rs.filter(x => x.id !== r.id))}>×</button>
                )}
              </div>
            ))}
          </div>

          {showAdd ? (
            <div className={styles.addForm}>
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
              <div className={styles.formActions}>
                <button className={styles.addConfirmBtn} onClick={handleAdd} disabled={!newFrom || !newTo}>Add</button>
                <button className={styles.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
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
            <div className={styles.stations}>
              <span className={styles.from}>{activeRoute?.fromName}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.to}>{activeRoute?.toName}</span>
            </div>
            {routes.length > 1 && (
              <div className={styles.navRow}>
                <button
                  className={styles.navBtn}
                  onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
                  disabled={safeIdx === 0}
                >‹</button>
                <div className={styles.dots}>
                  {routes.map((_, i) => (
                    <button
                      key={i}
                      className={`${styles.dot} ${i === safeIdx ? styles.dotActive : ''}`}
                      onClick={() => setActiveIdx(i)}
                    />
                  ))}
                </div>
                <button
                  className={styles.navBtn}
                  onClick={() => setActiveIdx(i => Math.min(routes.length - 1, i + 1))}
                  disabled={safeIdx === routes.length - 1}
                >›</button>
              </div>
            )}
          </div>

          <div className={styles.trains}>
            {departures.map((dep, i) => (
              <div key={i} className={styles.train}>
                <div className={styles.trainLeft}>
                  <span className={styles.badge} data-type={dep.type}
                    style={dep.type === 'Express' ? { background: lineColor } : {}}>
                    {dep.type === 'Express' ? 'EXP' : 'LOC'}
                  </span>
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
