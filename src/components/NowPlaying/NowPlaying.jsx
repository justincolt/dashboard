import { useState } from 'react'
import styles from './NowPlaying.module.css'
import { nowPlaying as mockData } from '../../data/mockData'

export default function NowPlaying() {
  const [playing, setPlaying] = useState(mockData.isPlaying)

  return (
    <div className={styles.player}>
      <div className={styles.label}>Now Playing</div>
      <div className={styles.content}>
        <div className={styles.albumArt}>
          <div className={styles.albumPlaceholder}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        </div>
        <div className={styles.info}>
          <span className={styles.track}>{mockData.track}</span>
          <span className={styles.artist}>{mockData.artist}</span>
          <span className={styles.album}>{mockData.album}</span>
        </div>
      </div>
      <div className={styles.progressWrap}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${mockData.progress}%` }} />
        </div>
        <div className={styles.times}>
          <span>{mockData.elapsed}</span>
          <span>{mockData.duration}</span>
        </div>
      </div>
      <div className={styles.controls}>
        <button className={styles.controlBtn} title="Previous">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>
        <button
          className={`${styles.controlBtn} ${styles.playBtn}`}
          onClick={() => setPlaying((p) => !p)}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button className={styles.controlBtn} title="Next">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
