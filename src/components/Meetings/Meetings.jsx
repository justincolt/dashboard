import styles from './Meetings.module.css'
import { meetings } from '../../data/mockData'

export default function Meetings() {
  return (
    <div className={styles.meetings}>
      <div className={styles.label}>Today's Meetings</div>
      <div className={styles.list}>
        {meetings.map((m) => (
          <div key={m.id} className={styles.meeting}>
            <div className={styles.timeBlock}>
              <span className={styles.time}>{m.time}</span>
            </div>
            <div className={styles.info}>
              <span className={styles.title}>{m.title}</span>
              <span className={styles.meta}>
                {m.endTime} · {m.type === 'video' ? 'Video call' : 'In person'}
              </span>
            </div>
            {m.link && (
              <a href={m.link} className={styles.joinBtn}>Join</a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
