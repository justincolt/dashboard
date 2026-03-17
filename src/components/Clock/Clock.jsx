import { useState, useEffect, useRef } from 'react'
import styles from './Clock.module.css'

const CARDINAL = { 12: '12', 3: '03', 6: '06', 9: '09' }
const TICK_HOURS = [1, 2, 4, 5, 7, 8, 10, 11]

function getTimeInTZ(tz) {
  const now = new Date()
  const str = now.toLocaleString('en-US', { timeZone: tz, hour12: false })
  const parts = str.split(', ')[1].split(':')
  const h = parseInt(parts[0]), m = parseInt(parts[1]), s = parseInt(parts[2])
  return { hours: h % 12, minutes: m, seconds: s, h24: h }
}

function AnalogClock({ tz, label }) {
  const [time, setTime] = useState(() => getTimeInTZ(tz))
  const [size, setSize] = useState(100)
  const wrapRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeInTZ(tz)), 1000)
    return () => clearInterval(id)
  }, [tz])

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize(Math.max(60, Math.min(width, height)))
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const { hours, minutes, seconds, h24 } = time
  const hourDeg = hours * 30 + minutes * 0.5
  const minDeg = minutes * 6
  const secDeg = seconds * 6
  const period = h24 >= 12 ? 'PM' : 'AM'
  const displayHour = h24 % 12 || 12

  const r = size / 2
  const markerR = r * 0.82
  const tickR = r * 0.9
  const tickLen = r * 0.06

  return (
    <div className={styles.clockModule}>
      <div className={styles.clockLabel}>{label}</div>
      <div className={styles.clockArea} ref={wrapRef}>
        <div className={styles.analog} style={{ width: size, height: size }}>
          <div className={styles.face}>
            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180)
              const x = r + markerR * Math.cos(angle)
              const y = r + markerR * Math.sin(angle)
              if (!CARDINAL[n]) return null
              return (
                <span key={n} className={styles.marker} style={{ left: x, top: y }}>
                  {CARDINAL[n]}
                </span>
              )
            })}
            {TICK_HOURS.map(n => {
              const angle = (n * 30 - 90) * (Math.PI / 180)
              return (
                <span
                  key={n}
                  className={styles.tick}
                  style={{
                    left: r + tickR * Math.cos(angle),
                    top: r + tickR * Math.sin(angle),
                    width: 1, height: tickLen,
                    transform: `translate(-50%, -50%) rotate(${n * 30}deg)`,
                  }}
                />
              )
            })}
          </div>
          <div className={styles.handHour} style={{ transform: `rotate(${hourDeg}deg)`, height: r * 0.45 }} />
          <div className={styles.handMin} style={{ transform: `rotate(${minDeg}deg)`, height: r * 0.62 }} />
          <div
            className={styles.handSec}
            style={{
              transform: `rotate(${secDeg}deg)`,
              height: r * 0.72 + r * 0.2,
              bottom: `calc(50% - ${r * 0.2}px)`,
              transformOrigin: `50% calc(100% - ${r * 0.2}px)`,
            }}
          />
          <div className={styles.centerDot} />
        </div>
      </div>
      <div className={styles.digitalTime}>{displayHour}:{String(minutes).padStart(2, '0')} {period}</div>
    </div>
  )
}

export default function Clock() {
  return (
    <div className={styles.wrapper}>
      <AnalogClock tz="America/New_York" label="NYC" />
      <AnalogClock tz="America/Chicago" label="NOLA" />
    </div>
  )
}
