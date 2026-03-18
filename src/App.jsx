import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './App.module.css'
import Clock from './components/Clock/Clock'
import Meetings from './components/Meetings/Meetings'
import Weather from './components/Weather/Weather'
import MtaSchedule from './components/MtaSchedule/MtaSchedule'
import Pomodoro from './components/Pomodoro/Pomodoro'
import NowPlaying from './components/NowPlaying/NowPlaying'
import Countdown from './components/Countdown/Countdown'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import VersionBadge from './components/VersionBadge/VersionBadge'
import YearProgress from './components/YearProgress/YearProgress'
import FishTank from './components/FishTank/FishTank'
import WorkProgress from './components/WorkProgress/WorkProgress'
import ChaosWave from './components/ChaosWave/ChaosWave'

const MODULES = {
  clock: { component: Clock, label: 'Clock' },
  weather: { component: Weather, label: 'Weather' },
  countdown: { component: Countdown, label: 'Countdown' },
  meetings: { component: Meetings, label: 'Meetings' },
  mta: { component: MtaSchedule, label: 'MTA' },
  nowPlaying: { component: NowPlaying, label: 'Now Playing' },
  version: { component: VersionBadge, label: 'Version' },
  pomodoro: { component: Pomodoro, label: 'Pomodoro' },
  yearProgress: { component: YearProgress, label: 'Year Progress' },
  fishTank: { component: FishTank, label: 'Fish Tank' },
  workProgress: { component: WorkProgress, label: 'Work Progress' },
  chaosWave: { component: ChaosWave, label: 'Chaos Wave' },
}

const DEFAULT_ORDER = ['clock', 'weather', 'meetings', 'mta', 'nowPlaying', 'countdown', 'pomodoro', 'version', 'workProgress', 'chaosWave', 'yearProgress', 'fishTank']
const DEFAULT_SIZES = {
  clock:        { col: 2, row: 2 },
  weather:      { col: 2, row: 2 },
  countdown:    { col: 2, row: 1 },
  meetings:     { col: 2, row: 2 },
  mta:          { col: 2, row: 2 },
  nowPlaying:   { col: 2, row: 1 },
  version:      { col: 2, row: 1 },
  pomodoro:     { col: 2, row: 1 },
  yearProgress: { col: 2, row: 2 },
  fishTank:     { col: 2, row: 2 },
  workProgress: { col: 2, row: 1 },  // 2×1 to make room for chaosWave
  chaosWave:    { col: 2, row: 1 },
  // 6×(2×2) + 6×(2×1) = 24+12 = 36 = 6×6 ✓
}

const LAYOUT_VERSION = 6 // bump to reset saved sizes/order
const GRID_COLS = 6
const THEMES = ['light', 'dark', 'orange']

function loadState(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    if (saved) return JSON.parse(saved)
  } catch {}
  return fallback
}

function App() {
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => loadState('dashboard-theme', 'light'))
  const [order, setOrder] = useState(() => {
    const savedVersion = loadState('dashboard-layout-version', 0)
    if (savedVersion < LAYOUT_VERSION) {
      localStorage.removeItem('dashboard-order')
      localStorage.removeItem('dashboard-sizes')
      localStorage.setItem('dashboard-layout-version', JSON.stringify(LAYOUT_VERSION))
      return DEFAULT_ORDER
    }
    const saved = loadState('dashboard-order', null)
    if (Array.isArray(saved)) {
      const valid = saved.filter(k => MODULES[k])
      const missing = DEFAULT_ORDER.filter(k => !valid.includes(k))
      const merged = [...valid, ...missing]
      if (merged.length === DEFAULT_ORDER.length) return merged
    }
    return DEFAULT_ORDER
  })
  const [sizes, setSizes] = useState(() => {
    const savedVersion = loadState('dashboard-layout-version', 0)
    if (savedVersion < LAYOUT_VERSION) return DEFAULT_SIZES
    const saved = loadState('dashboard-sizes', null)
    return saved && typeof saved === 'object' ? { ...DEFAULT_SIZES, ...saved } : DEFAULT_SIZES
  })
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const resizeRef = useRef(null)
  const gridRef = useRef(null)
  const dashRef = useRef(null)

  const onLoadComplete = useCallback(() => setLoading(false), [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('dashboard-theme', JSON.stringify(theme))
  }, [theme])

  useEffect(() => {
    localStorage.setItem('dashboard-order', JSON.stringify(order))
  }, [order])

  useEffect(() => {
    localStorage.setItem('dashboard-sizes', JSON.stringify(sizes))
  }, [sizes])

  // Drag to reorder
  const onDragStart = (e, idx) => {
    if (resizeRef.current) return e.preventDefault()
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', idx)
  }

  const onDragOver = (e, idx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (idx !== overIdx) setOverIdx(idx)
  }

  const onDrop = (e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null)
      setOverIdx(null)
      return
    }
    setOrder(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(idx, 0, moved)
      return next
    })
    setDragIdx(null)
    setOverIdx(null)
  }

  const onDragEnd = () => {
    setDragIdx(null)
    setOverIdx(null)
  }

  // Resize via pointer events on handles
  const onResizeStart = (e, key, handle) => {
    e.preventDefault()
    e.stopPropagation()
    const grid = gridRef.current
    if (!grid) return

    const gridRect = grid.getBoundingClientRect()
    const unitW = gridRect.width / GRID_COLS
    const rowTracks = window.getComputedStyle(grid).gridTemplateRows.split(' ')
    const numRows = rowTracks.length || 2
    const unitH = gridRect.height / numRows

    const cellEl = grid.querySelector(`[data-key="${key}"]`)
    if (!cellEl) return
    const cellRect = cellEl.getBoundingClientRect()
    const originX = cellRect.left
    const originY = cellRect.top

    resizeRef.current = { key, handle }
    document.body.style.cursor =
      handle === 'right' ? 'col-resize' :
      handle === 'bottom' ? 'row-resize' : 'nwse-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev) => {
      let col = 1
      let row = 1

      if (handle === 'right' || handle === 'corner') {
        const dx = ev.clientX - originX
        col = Math.max(1, Math.min(GRID_COLS, Math.ceil(dx / unitW)))
      }
      if (handle === 'bottom' || handle === 'corner') {
        const dy = ev.clientY - originY
        row = Math.max(1, Math.min(6, Math.ceil(dy / unitH)))
      }

      setSizes(prev => {
        const cur = prev[key] || { col: 1, row: 1 }
        const newCol = (handle === 'right' || handle === 'corner') ? col : cur.col
        const newRow = (handle === 'bottom' || handle === 'corner') ? row : cur.row
        if (cur.col === newCol && cur.row === newRow) return prev
        return { ...prev, [key]: { col: newCol, row: newRow } }
      })
    }

    const onUp = () => {
      resizeRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const shuffleOrder = () => {
    setOrder(prev => {
      const next = [...prev]
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[next[i], next[j]] = [next[j], next[i]]
      }
      return next
    })
  }

  if (loading) return <LoadingScreen onComplete={onLoadComplete} />

  return (
    <div className={styles.dashboard} ref={dashRef}>
      <div className={styles.grid} ref={gridRef}>
        {order.map((key, i) => {
          const mod = MODULES[key]
          if (!mod) return null
          const Comp = mod.component
          const isDragging = dragIdx === i
          const isOver = overIdx === i && dragIdx !== i
          const s = sizes[key] || { col: 2, row: 1 }

          return (
            <div
              key={key}
              data-key={key}
              className={`${styles.cell} ${isDragging ? styles.dragging : ''} ${isOver ? styles.dropTarget : ''}`}
              style={{
                gridColumn: `span ${s.col}`,
                gridRow: `span ${s.row}`,
              }}
              draggable={!resizeRef.current}
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDrop={(e) => onDrop(e, i)}
              onDragEnd={onDragEnd}
            >
              <span className={styles.orderBadge}>{i + 1}</span>
              <Comp />
              <div
                className={styles.resizeRight}
                onPointerDown={(e) => onResizeStart(e, key, 'right')}
              />
              <div
                className={styles.resizeBottom}
                onPointerDown={(e) => onResizeStart(e, key, 'bottom')}
              />
              <div
                className={styles.resizeCorner}
                onPointerDown={(e) => onResizeStart(e, key, 'corner')}
              />
            </div>
          )
        })}
      </div>

      <div className={styles.sideControls}>
        <button
          className={styles.shuffleBtn}
          onClick={shuffleOrder}
          title="Shuffle layout"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
        </button>
        {THEMES.map(t => (
          <button
            key={t}
            className={`${styles.themeBtn} ${styles[`themeBtn${t.charAt(0).toUpperCase() + t.slice(1)}`]} ${theme === t ? styles.themeBtnActive : ''}`}
            onClick={() => setTheme(t)}
            title={`${t} theme`}
          />
        ))}
      </div>
    </div>
  )
}

export default App
