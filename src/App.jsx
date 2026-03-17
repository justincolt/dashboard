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

function App() {
  const [loading, setLoading] = useState(true)
  const [colSplit, setColSplit] = useState(50)
  const [rowSplit, setRowSplit] = useState(50)
  const dashRef = useRef(null)
  const dragRef = useRef(null)

  const onLoadComplete = useCallback(() => setLoading(false), [])

  useEffect(() => {
    const onPointerMove = (e) => {
      const d = dragRef.current
      if (!d) return
      const rect = dashRef.current.getBoundingClientRect()
      const pad = 48
      if (d === 'col') {
        const x = e.clientX - rect.left - pad
        const w = rect.width - pad * 2
        setColSplit(Math.min(75, Math.max(25, (x / w) * 100)))
      } else {
        const y = e.clientY - rect.top - pad
        const h = rect.height - pad * 2
        setRowSplit(Math.min(75, Math.max(25, (y / h) * 100)))
      }
    }
    const onPointerUp = () => {
      dragRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [])

  const startDrag = (axis) => (e) => {
    e.preventDefault()
    dragRef.current = axis
    document.body.style.cursor = axis === 'col' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }

  const gridStyle = {
    gridTemplateColumns: `${colSplit}fr ${100 - colSplit}fr`,
    gridTemplateRows: `${rowSplit}fr ${100 - rowSplit}fr`,
  }

  if (loading) return <LoadingScreen onComplete={onLoadComplete} />

  return (
    <div className={styles.dashboard} ref={dashRef}>
      <div className={styles.grid} style={gridStyle}>
        <div className={styles.cell}>
          <Clock />
        </div>
        <div className={styles.splitV}>
          <div className={styles.cell}>
            <Weather />
          </div>
          <div className={styles.cell}>
            <Countdown />
          </div>
        </div>

        <div className={styles.cell}>
          <Meetings />
        </div>
        <div className={styles.splitV}>
          <div className={styles.splitH}>
            <div className={styles.cell}>
              <MtaSchedule />
            </div>
            <div className={styles.splitV}>
              <div className={styles.cell}>
                <NowPlaying />
              </div>
              <div className={styles.cell}>
                <VersionBadge />
              </div>
            </div>
          </div>
          <div className={styles.cell}>
            <Pomodoro />
          </div>
        </div>
      </div>

      <div
        className={styles.colHandle}
        style={{ left: `calc(${colSplit}% * (100% - 96px) / 100% + 48px)` }}
        onPointerDown={startDrag('col')}
      />
      <div
        className={styles.rowHandle}
        style={{ top: `calc(${rowSplit}% * (100% - 96px) / 100% + 48px)` }}
        onPointerDown={startDrag('row')}
      />
    </div>
  )
}

export default App
