import { useState, useEffect } from 'react'
import styles from './Countdown.module.css'
import { countdown as mockData } from '../../data/mockData'

function getTimeLeft(target) {
  const diff = new Date(target) - new Date()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(mockData.date))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(mockData.date)), 1000)
    return () => clearInterval(id)
  }, [])

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds },
  ]

  return (
    <div className={styles.countdown}>
      <div className={styles.label}>Countdown</div>
      <div className={styles.event}>{mockData.event}</div>
      <div className={styles.units}>
        {units.map((u) => (
          <div key={u.label} className={styles.unit}>
            <span className={styles.value}>{String(u.value).padStart(2, '0')}</span>
            <span className={styles.unitLabel}>{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
