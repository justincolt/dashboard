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

function loadOrder() {
  try {
    const saved = localStorage.getItem('dashboard-order')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) return parsed
    }
  } catch {}
  return DEFAULT_ORDER
}

function App() {
  const [loading, setLoading] = useState(true)
  const [entered, setEntered] = useState(false)
  const [order, setOrder] = useState(loadOrder)
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const dashRef = useRef(null)

  const onLoadComplete = useCallback(() => {
    setLoading(false)
    requestAnimationFrame(() => setEntered(true))
  }, [])

  useEffect(() => {
    localStorage.setItem('dashboard-order', JSON.stringify(order))
  }, [order])

  const onDragStart = (e, idx) => {
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

  if (loading) return <LoadingScreen onComplete={onLoadComplete} />

  return (
    <div className={styles.dashboard} ref={dashRef}>
      <div className={styles.grid}>
        {order.map((key, i) => {
          const mod = MODULES[key]
          if (!mod) return null
          const Comp = mod.component
          const isDragging = dragIdx === i
          const isOver = overIdx === i && dragIdx !== i

          return (
            <div
              key={key}
              className={`${styles.cell} ${isDragging ? styles.dragging : ''} ${isOver ? styles.dropTarget : ''} ${entered ? styles.entered : styles.preEnter}`}
              style={{ animationDelay: entered ? `${i * 80}ms` : undefined }}
              draggable
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDrop={(e) => onDrop(e, i)}
              onDragEnd={onDragEnd}
            >
              <Comp />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App
