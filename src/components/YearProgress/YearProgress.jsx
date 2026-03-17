import { useState, useEffect } from 'react'
import styles from './YearProgress.module.css'

function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
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
        {Array.from({ length: totalDays }, (_, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i < dayOfYear ? styles.filled : ''}`}
          />
        ))}
      </div>
      <div className={styles.footer}>
        <span>Day {dayOfYear}</span>
        <span>{totalDays - dayOfYear} remaining</span>
      </div>
    </div>
  )
}
