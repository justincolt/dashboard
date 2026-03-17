import { useState, useEffect, useRef, useCallback } from 'react'
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
  const date = new Date(year, 0, dayIndex)
  return date.getDay() === 5
}

export default function YearProgress() {
  const [dayOfYear, setDayOfYear] = useState(getDayOfYear)
  const [dotSize, setDotSize] = useState(4)
  const [gap, setGap] = useState(2)
  const gridRef = useRef(null)
  const year = new Date().getFullYear()
  const totalDays = isLeapYear(year) ? 366 : 365
  const pct = ((dayOfYear / totalDays) * 100).toFixed(1)
  const now = new Date()
  const monthName = now.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const dayNum = now.getDate()

  useEffect(() => {
    const id = setInterval(() => setDayOfYear(getDayOfYear()), 60000)
    return () => clearInterval(id)
  }, [])

  const calcSize = useCallback(() => {
    const el = gridRef.current
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    if (w === 0 || h === 0) return

    // Try different dot sizes to find the largest that fits all 365 dots
    for (let s = 20; s >= 3; s--) {
      const g = Math.max(1, Math.round(s * 0.3))
      const cols = Math.floor((w + g) / (s + g))
      const rows = Math.ceil(totalDays / cols)
      const neededH = rows * (s + g) - g
      if (neededH <= h && cols > 0) {
        setDotSize(s)
        setGap(g)
        return
      }
    }
    setDotSize(3)
    setGap(1)
  }, [totalDays])

  useEffect(() => {
    calcSize()
    const el = gridRef.current
    if (!el) return
    const ro = new ResizeObserver(calcSize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [calcSize])

  return (
    <div className={styles.yearProgress}>
      <div className={styles.header}>
        <div className={styles.dateBlock}>
          <span className={styles.dateNum}>{dayNum}</span>
          <span className={styles.dateMonth}>{monthName}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.label}>Year Progress</span>
          <span className={styles.pct}>{pct}%</span>
        </div>
      </div>
      <div className={styles.grid} ref={gridRef} style={{ gap: `${gap}px` }}>
        {Array.from({ length: totalDays }, (_, i) => {
          const dayNum = i + 1
          const friday = isFriday(dayNum, year)
          const filled = i < dayOfYear
          let cls = styles.dot
          if (filled && friday) cls += ' ' + styles.filledFriday
          else if (filled) cls += ' ' + styles.filled
          else if (friday) cls += ' ' + styles.friday
          return (
            <span
              key={i}
              className={cls}
              style={{ width: dotSize, height: dotSize }}
            />
          )
        })}
      </div>
      <div className={styles.footer}>
        <span>Day {dayOfYear}</span>
        <span>{totalDays - dayOfYear} remaining</span>
      </div>
    </div>
  )
}
