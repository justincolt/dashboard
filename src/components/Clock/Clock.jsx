import { useState, useEffect, useRef } from 'react'
import styles from './Clock.module.css'

const HOUR_NUMBERS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const TICK_HOURS = [1, 2, 4, 5, 7, 8, 10, 11]

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
      setSize(Math.max(80, Math.min(width, height)))
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
  const markerR = r * 0.82
  const tickR = r * 0.9
  const tickLen = r * 0.06

  return (
    <div className={styles.wrapper}>
      <div className={styles.dateBlock}>
        <div className={styles.dateNum}>{month}/{day}</div>
        <div className={styles.timePeriod}>{displayHour} {period}</div>
      </div>

      <div className={styles.clockRow} ref={wrapRef}>
        <div className={styles.analog} style={{ width: size, height: size }}>
          <div className={styles.face}>
            {HOUR_NUMBERS.map((n, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180)
              const x = r + markerR * Math.cos(angle)
              const y = r + markerR * Math.sin(angle)
              const isCardinal = n === 12 || n === 3 || n === 6 || n === 9
              if (!isCardinal) return null
              return (
                <span
                  key={n}
                  className={styles.marker}
                  style={{ left: x, top: y }}
                >
                  {String(n).padStart(2, '0')}
                </span>
              )
            })}
            {TICK_HOURS.map(n => {
              const angle = (n * 30 - 90) * (Math.PI / 180)
              const x1 = r + tickR * Math.cos(angle)
              const y1 = r + tickR * Math.sin(angle)
              return (
                <span
                  key={n}
                  className={styles.tick}
                  style={{
                    left: x1,
                    top: y1,
                    width: 1,
                    height: tickLen,
                    transform: `translate(-50%, -50%) rotate(${n * 30}deg)`,
                  }}
                />
              )
            })}
          </div>
          <div
            className={styles.handHour}
            style={{ transform: `rotate(${hourDeg}deg)`, height: handHour }}
          />
          <div
            className={styles.handMin}
            style={{ transform: `rotate(${minDeg}deg)`, height: handMin }}
          />
          <div
            className={styles.handSec}
            style={{
              transform: `rotate(${secDeg}deg)`,
              height: handSec + secTail,
              bottom: `calc(50% - ${secTail}px)`,
              transformOrigin: `50% calc(100% - ${secTail}px)`,
            }}
          />
          <div className={styles.centerDot} />
        </div>
      </div>
    </div>
  )
}
