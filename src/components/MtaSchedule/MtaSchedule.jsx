import styles from './MtaSchedule.module.css'
import { mtaSchedule } from '../../data/mockData'

export default function MtaSchedule() {
  return (
    <div className={styles.mta}>
      <div className={styles.label}>MTA Schedule</div>
      <div className={styles.lines}>
        {mtaSchedule.map((line) => (
          <div key={line.line} className={styles.line}>
            <span
              className={styles.badge}
              style={{ backgroundColor: line.color }}
            >
              {line.line}
            </span>
            <div className={styles.info}>
              <span className={styles.destination}>{line.destination}</span>
              <div className={styles.arrivals}>
                {line.arrivals.map((min, i) => (
                  <span key={i} className={styles.arrival}>
                    {min} min
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
