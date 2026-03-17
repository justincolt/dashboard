import { useState, useEffect, useRef } from 'react'
import styles from './Clock.module.css'

export default function Clock() {
  const [now, setNow] = useState(new Date())
  const [size, setSize] = useState(160)
  const wrapRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const available = Math.min(width, height)
      setSize(Math.max(80, available))
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const hours = now.getHours() % 12
  const minutes = now.getMinutes()
  const seconds = now.getSeconds()

  const hourDeg = hours * 30 + minutes * 0.5
  const minDeg = minutes * 6
  const secDeg = seconds * 6

  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const h = now.getHours()
  const period = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 || 12

  const r = size / 2
  const handHour = r * 0.45
  const handMin = r * 0.62
  const handSec = r * 0.72
  const secTail = r * 0.2

  return (
    <div className={styles.wrapper}>
      <div className={styles.dateBlock}>
        <div className={styles.dateNum}>{month}/{day}</div>
        <div className={styles.timePeriod}>{displayHour} {period}</div>
      </div>

      <div className={styles.clockRow} ref={wrapRef}>
        <div className={styles.analog} style={{ width: size, height: size }}>
          <div className={styles.face}>
            <span className={styles.marker} style={{ transform: 'rotate(0deg) translateY(-44%)' }}>12</span>
            <span className={styles.marker} style={{ transform: 'rotate(90deg) translateY(-44%)' }}>03</span>
            <span className={styles.marker} style={{ transform: 'rotate(180deg) translateY(-44%)' }}>06</span>
            <span className={styles.marker} style={{ transform: 'rotate(270deg) translateY(-44%)' }}>09</span>
            {[1,2,4,5,7,8,10,11].map(n => (
              <span key={n} className={styles.tick} style={{ transform: `rotate(${n * 30}deg)` }} />
            ))}
          </div>
          <div
            className={styles.handHour}
            style={{ transform: `rotate(${hourDeg}deg)`, height: handHour, marginLeft: -1.25 }}
          />
          <div
            className={styles.handMin}
            style={{ transform: `rotate(${minDeg}deg)`, height: handMin, marginLeft: -0.75 }}
          />
          <div
            className={styles.handSec}
            style={{
              transform: `rotate(${secDeg}deg)`,
              height: handSec + secTail,
              bottom: `calc(50% - ${secTail}px)`,
              transformOrigin: `50% calc(100% - ${secTail}px)`,
              marginLeft: -0.5,
            }}
          />
          <div className={styles.centerDot} />
        </div>
      </div>
    </div>
  )
}
