import { useState, useEffect } from 'react'
import styles from './WorkProgress.module.css'

const WORK_START = 10 // 10 AM
const WORK_END = 18   // 6 PM
const WORK_HOURS = WORK_END - WORK_START
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function getDayProgress() {
  const now = new Date()
  const hours = now.getHours() + now.getMinutes() / 60
  if (hours < WORK_START) return 0
  if (hours >= WORK_END) return 1
  return (hours - WORK_START) / WORK_HOURS
}

function getWeekProgress() {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon...5=Fri, 6=Sat
  if (day === 0 || day === 6) return day === 6 ? 1 : 0
  const hours = now.getHours() + now.getMinutes() / 60
  // Each workday is 1/5 of the week
  const completedDays = day - 1 // Mon=0, Tue=1...
  const dayFraction = hours < WORK_START ? 0 : hours >= WORK_END ? 1 : (hours - WORK_START) / WORK_HOURS
  return (completedDays + dayFraction) / 5
}

function formatTime(h24) {
  const h = h24 % 12 || 12
  const p = h24 >= 12 ? 'PM' : 'AM'
  return `${h} ${p}`
}

export default function WorkProgress() {
  const [dayProgress, setDayProgress] = useState(getDayProgress)
  const [weekProgress, setWeekProgress] = useState(getWeekProgress)

  useEffect(() => {
    const id = setInterval(() => {
      setDayProgress(getDayProgress())
      setWeekProgress(getWeekProgress())
    }, 10000)
    return () => clearInterval(id)
  }, [])

  const now = new Date()
  const hours = now.getHours() + now.getMinutes() / 60
  const isWorkHours = hours >= WORK_START && hours < WORK_END
  const dayPct = Math.round(dayProgress * 100)
  const weekPct = Math.round(weekProgress * 100)
  const dayOfWeek = now.getDay()
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

  return (
    <div className={styles.workProgress}>
      <div className={styles.section}>
        <div className={styles.header}>
          <span className={styles.label}>Work Day</span>
          <span className={styles.pct}>
            {isWorkHours ? `${dayPct}%` : dayProgress >= 1 ? 'Done' : 'Not started'}
          </span>
        </div>
        <div className={styles.barWrap}>
          <div className={styles.bar}>
            <div className={styles.elapsed} style={{ width: `${dayProgress * 100}%` }} />
            {dayProgress > 0 && dayProgress < 1 && (
              <div className={styles.indicator} style={{ left: `${dayProgress * 100}%` }} />
            )}
          </div>
          <div className={styles.times}>
            <span>{formatTime(WORK_START)}</span>
            <span>{formatTime(12)}</span>
            <span>{formatTime(14)}</span>
            <span>{formatTime(16)}</span>
            <span>{formatTime(WORK_END)}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.header}>
          <span className={styles.label}>Work Week</span>
          <span className={styles.pct}>
            {isWeekday ? `${weekPct}%` : weekProgress >= 1 ? 'Done' : 'Not started'}
          </span>
        </div>
        <div className={styles.barWrap}>
          <div className={styles.bar}>
            <div className={styles.elapsed} style={{ width: `${weekProgress * 100}%` }} />
            {weekProgress > 0 && weekProgress < 1 && (
              <div className={styles.indicator} style={{ left: `${weekProgress * 100}%` }} />
            )}
          </div>
          <div className={styles.times}>
            {WEEKDAYS.map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
