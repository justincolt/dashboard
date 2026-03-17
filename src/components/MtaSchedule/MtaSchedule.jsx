import { useState, useEffect } from 'react'
import styles from './MtaSchedule.module.css'

const DEPARTURE_MINS = [7, 37, 52, 17, 47, 22]

function getSchedule() {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()

  const departures = []
  for (let offset = 0; offset < 4 && departures.length < 3; offset++) {
    for (const bm of DEPARTURE_MINS) {
      const depH = h + offset
      if (depH >= 24) break
      if (offset === 0 && bm <= m) continue
      const depTime = `${depH > 12 ? depH - 12 : depH || 12}:${String(bm).padStart(2, '0')} ${depH >= 12 ? 'PM' : 'AM'}`
      const dur = 75 + Math.floor(Math.random() * 15)
      const arrH = depH + Math.floor((bm + dur) / 60)
      const arrM = (bm + dur) % 60
      const arrTime = `${arrH > 12 ? arrH - 12 : arrH || 12}:${String(arrM).padStart(2, '0')} ${arrH >= 12 ? 'PM' : 'AM'}`
      const minsAway = (depH - h) * 60 + (bm - m)
      const type = dur <= 78 ? 'Express' : 'Local'
      departures.push({ depTime, arrTime, minsAway, duration: `${dur} min`, type })
      if (departures.length >= 3) break
    }
  }
  return departures
}

export default function MtaSchedule() {
  const [departures, setDepartures] = useState(getSchedule)

  useEffect(() => {
    const id = setInterval(() => setDepartures(getSchedule()), 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.mta}>
      <div className={styles.header}>
        <span className={styles.label}>Metro-North</span>
        <span className={styles.route}>New Haven Line</span>
      </div>
      <div className={styles.stations}>
        <span className={styles.from}>Grand Central</span>
        <span className={styles.arrow}>→</span>
        <span className={styles.to}>Fairfield, CT</span>
      </div>
      <div className={styles.trains}>
        {departures.map((dep, i) => (
          <div key={i} className={styles.train}>
            <div className={styles.trainLeft}>
              <span className={styles.badge} data-type={dep.type}>
                {dep.type === 'Express' ? 'EXP' : 'LOC'}
              </span>
              <div className={styles.trainTimes}>
                <span className={styles.depTime}>{dep.depTime}</span>
                <span className={styles.arrTime}>→ {dep.arrTime}</span>
              </div>
            </div>
            <div className={styles.trainRight}>
              <span className={styles.minsAway}>
                {dep.minsAway <= 1 ? 'Now' : `${dep.minsAway} min`}
              </span>
              <span className={styles.duration}>{dep.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
