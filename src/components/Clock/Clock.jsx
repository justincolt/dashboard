import { useState, useEffect } from 'react'
import styles from './Clock.module.css'

export default function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
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

  return (
    <div className={styles.wrapper}>
      <div className={styles.dateBlock}>
        <div className={styles.dateNum}>{month}/{day}</div>
        <div className={styles.timePeriod}>{displayHour} {period}</div>
      </div>

      <div className={styles.clockRow}>
        <div className={styles.analogWrap}>
          <div className={styles.analog}>
            <div className={styles.face}>
              <span className={styles.marker} style={{ transform: 'rotate(0deg) translateY(-44%)' }}>12</span>
              <span className={styles.marker} style={{ transform: 'rotate(90deg) translateY(-44%)' }}>03</span>
              <span className={styles.marker} style={{ transform: 'rotate(180deg) translateY(-44%)' }}>06</span>
              <span className={styles.marker} style={{ transform: 'rotate(270deg) translateY(-44%)' }}>09</span>
              {[1,2,4,5,7,8,10,11].map(n => (
                <span key={n} className={styles.tick} style={{ transform: `rotate(${n * 30}deg)` }} />
              ))}
            </div>
            <div className={styles.handHour} style={{ transform: `rotate(${hourDeg}deg)` }} />
            <div className={styles.handMin} style={{ transform: `rotate(${minDeg}deg)` }} />
            <div className={styles.handSec} style={{ transform: `rotate(${secDeg}deg)` }} />
            <div className={styles.centerDot} />
          </div>
        </div>
      </div>
    </div>
  )
}
