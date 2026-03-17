import styles from './VersionBadge.module.css'
import { VERSION, CHANGES } from '../../version'

export default function VersionBadge() {
  return (
    <div className={styles.version}>
      <div className={styles.label}>Version {VERSION}</div>
      <ul className={styles.list}>
        {CHANGES.map((item, i) => (
          <li key={i} className={styles.item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
