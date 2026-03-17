import { useState } from 'react'
import styles from './VersionBadge.module.css'
import { VERSION, CHANGELOG } from '../../version'

export default function VersionBadge() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`${styles.badge} ${expanded ? styles.expanded : ''}`}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className={styles.version}>v{VERSION}</div>
      {expanded && <div className={styles.changelog}>{CHANGELOG}</div>}
    </div>
  )
}
