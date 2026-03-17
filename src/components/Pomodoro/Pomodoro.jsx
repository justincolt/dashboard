import { useState, useEffect, useRef } from 'react'
import styles from './Pomodoro.module.css'

const WORK_SECS = 25 * 60
const BREAK_SECS = 5 * 60

export default function Pomodoro() {
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECS)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const intervalRef = useRef(null)

  const totalSecs = isBreak ? BREAK_SECS : WORK_SECS
  const progress = ((totalSecs - secondsLeft) / totalSecs) * 100

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setIsRunning(false)
            setIsBreak((b) => !b)
            return prev <= 1 ? (isBreak ? WORK_SECS : BREAK_SECS) : prev - 1
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning, isBreak])

  const toggle = () => setIsRunning((r) => !r)

  const reset = () => {
    setIsRunning(false)
    setIsBreak(false)
    setSecondsLeft(WORK_SECS)
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')

  // Generate minute markers (every 5 minutes)
  const totalMins = totalSecs / 60
  const markers = []
  for (let m = 0; m <= totalMins; m += 5) {
    markers.push(m)
  }

  return (
    <div className={styles.pomodoro}>
      <div className={styles.header}>
        <span className={styles.label}>{isBreak ? 'Break' : 'Pomodoro'}</span>
        <span className={styles.time}>{mins}:{secs}</span>
      </div>
      <div className={styles.barSection}>
        <div className={styles.bar}>
          <div className={styles.elapsed} style={{ width: `${progress}%` }} />
          {progress > 0 && progress < 100 && (
            <div className={styles.indicator} style={{ left: `${progress}%` }} />
          )}
        </div>
        <div className={styles.markers}>
          {markers.map(m => (
            <span key={m}>{m}m</span>
          ))}
        </div>
      </div>
      <div className={styles.controls}>
        <button className={styles.btn} onClick={toggle}>
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  )
}
