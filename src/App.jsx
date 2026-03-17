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

const MODULES = {
  clock: { component: Clock, label: 'Clock' },
  weather: { component: Weather, label: 'Weather' },
  countdown: { component: Countdown, label: 'Countdown' },
  meetings: { component: Meetings, label: 'Meetings' },
  mta: { component: MtaSchedule, label: 'MTA' },
  nowPlaying: { component: NowPlaying, label: 'Now Playing' },
  version: { component: VersionBadge, label: 'Version' },
  pomodoro: { component: Pomodoro, label: 'Pomodoro' },
}

const DEFAULT_ORDER = ['clock', 'weather', 'countdown', 'meetings', 'mta', 'nowPlaying', 'version', 'pomodoro']
const DEFAULT_SIZES = {}
DEFAULT_ORDER.forEach(k => { DEFAULT_SIZES[k] = { col: 1, row: 1 } })

const GRID_COLS = 4

function loadState(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    if (saved) return JSON.parse(saved)
  } catch {}
  return fallback
}

function App() {
  const [loading, setLoading] = useState(true)
  const [entered, setEntered] = useState(false)
  const [order, setOrder] = useState(() => {
    const saved = loadState('dashboard-order', null)
    if (Array.isArray(saved) && saved.length === DEFAULT_ORDER.length) return saved
    return DEFAULT_ORDER
  })
  const [sizes, setSizes] = useState(() => {
    const saved = loadState('dashboard-sizes', null)
    return saved && typeof saved === 'object' ? { ...DEFAULT_SIZES, ...saved } : DEFAULT_SIZES
  })
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const resizeRef = useRef(null)
  const gridRef = useRef(null)
  const dashRef = useRef(null)

  const onLoadComplete = useCallback(() => {
    setLoading(false)
    requestAnimationFrame(() => setEntered(true))
  }, [])

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
    const rect = grid.getBoundingClientRect()
    const gap = 24
    const colW = (rect.width - gap * (GRID_COLS - 1)) / GRID_COLS
    const totalRows = Math.max(2, Math.ceil(order.length / GRID_COLS))
    const rowH = (rect.height - gap * (totalRows - 1)) / totalRows
    const startSizes = { ...sizes[key] }

    resizeRef.current = { key, handle, startSizes }
    document.body.style.cursor =
      handle === 'right' ? 'col-resize' :
      handle === 'bottom' ? 'row-resize' : 'nwse-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev) => {
      // Find the cell element for this key
      const cellEl = grid.querySelector(`[data-key="${key}"]`)
      if (!cellEl) return
      const cellRect = cellEl.getBoundingClientRect()

      let col = startSizes.col
      let row = startSizes.row

      if (handle === 'right' || handle === 'corner') {
        const dx = ev.clientX - cellRect.left
        col = Math.max(1, Math.min(GRID_COLS, Math.round(dx / (colW + gap) + 0.2)))
      }
      if (handle === 'bottom' || handle === 'corner') {
        const dy = ev.clientY - cellRect.top
        row = Math.max(1, Math.min(4, Math.round(dy / (rowH + gap) + 0.2)))
      }

      if (col !== sizes[key]?.col || row !== sizes[key]?.row) {
        setSizes(prev => ({ ...prev, [key]: { col, row } }))
      }
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
          const s = sizes[key] || { col: 1, row: 1 }

          return (
            <div
              key={key}
              data-key={key}
              className={`${styles.cell} ${isDragging ? styles.dragging : ''} ${isOver ? styles.dropTarget : ''} ${entered ? styles.entered : styles.preEnter}`}
              style={{
                animationDelay: entered ? `${i * 143}ms` : undefined,
                gridColumn: `span ${s.col}`,
                gridRow: `span ${s.row}`,
              }}
              draggable={!resizeRef.current}
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDrop={(e) => onDrop(e, i)}
              onDragEnd={onDragEnd}
            >
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
    </div>
  )
}

export default App
