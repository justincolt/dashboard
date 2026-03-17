import { useState, useEffect } from 'react'
import styles from './YearProgress.module.css'

function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now - start) / (1000 * 60 * 60 * 24))
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function isFriday(dayIndex, year) {
  // dayIndex is 1-based (day 1 = Jan 1)
  const date = new Date(year, 0, dayIndex)
  return date.getDay() === 5
}

export default function YearProgress() {
  const [dayOfYear, setDayOfYear] = useState(getDayOfYear)
  const year = new Date().getFullYear()
  const totalDays = isLeapYear(year) ? 366 : 365
  const pct = ((dayOfYear / totalDays) * 100).toFixed(1)

  useEffect(() => {
    const id = setInterval(() => setDayOfYear(getDayOfYear()), 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.yearProgress}>
      <div className={styles.header}>
        <span className={styles.label}>Year Progress</span>
        <span className={styles.pct}>{pct}%</span>
      </div>
      <div className={styles.grid}>
        {Array.from({ length: totalDays }, (_, i) => {
          const dayNum = i + 1
          const friday = isFriday(dayNum, year)
          const filled = i < dayOfYear
          let cls = styles.dot
          if (filled && friday) cls += ' ' + styles.filledFriday
          else if (filled) cls += ' ' + styles.filled
          else if (friday) cls += ' ' + styles.friday
          return <span key={i} className={cls} />
        })}
      </div>
      <div className={styles.footer}>
        <span>Day {dayOfYear}</span>
        <span>{totalDays - dayOfYear} remaining</span>
      </div>
    </div>
  )
}
