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

  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference - (progress / 100) * circumference

  return (
    <div className={styles.pomodoro}>
      <div className={styles.label}>{isBreak ? 'Break' : 'Pomodoro'}</div>
      <div className={styles.timerWrap}>
        <svg className={styles.ring} viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" className={styles.trackCircle} />
          <circle
            cx="60"
            cy="60"
            r="54"
            className={styles.progressCircle}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: dashOffset,
            }}
          />
        </svg>
        <div className={styles.display}>
          {mins}:{secs}
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
