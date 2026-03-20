import styles from './NowPlaying.module.css'
import { useSpotify, initiateSpotifyAuth } from '../../hooks/useSpotify'

// ── Icons ─────────────────────────────────────────────────────────
const IconPrev = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
  </svg>
)
const IconNext = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
)
const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
)
const IconPause = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
  </svg>
)
const IconMusic = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
)
const IconSpotify = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
)

// ── Component ─────────────────────────────────────────────────────
export default function NowPlaying() {
  const { connected, authChecked, track, progressPct, elapsed, togglePlay, nextTrack, prevTrack, disconnect } = useSpotify()

  // ── Not yet checked auth ──
  if (!authChecked) {
    return (
      <div className={styles.player}>
        <div className={styles.label}>Now Playing</div>
        <div className={styles.centerState}>
          <span className={styles.dimText}>Connecting…</span>
        </div>
      </div>
    )
  }

  // ── Not connected ──
  if (!connected) {
    return (
      <div className={styles.player}>
        <div className={styles.label}>Now Playing</div>
        <div className={styles.centerState}>
          <button className={styles.connectBtn} onClick={initiateSpotifyAuth}>
            <IconSpotify />
            Connect Spotify
          </button>
        </div>
      </div>
    )
  }

  // ── Connected but nothing playing ──
  if (!track) {
    return (
      <div className={styles.player}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Now Playing</span>
          <button className={styles.disconnectBtn} onClick={disconnect} title="Disconnect Spotify">✕</button>
        </div>
        <div className={styles.centerState}>
          <IconMusic />
          <span className={styles.dimText}>Nothing playing</span>
        </div>
      </div>
    )
  }

  // ── Playing ──
  return (
    <div className={styles.player}>
      <div className={styles.labelRow}>
        <span className={styles.label}>Now Playing</span>
        <button className={styles.disconnectBtn} onClick={disconnect} title="Disconnect Spotify">✕</button>
      </div>

      <div className={styles.content}>
        <div className={styles.albumArt}>
          {track.albumArt
            ? <img src={track.albumArt} alt={track.album} className={styles.albumImg} />
            : <div className={styles.albumPlaceholder}><IconMusic /></div>
          }
        </div>
        <div className={styles.info}>
          <span className={styles.track}>{track.name}</span>
          <span className={styles.artist}>{track.artist}</span>
          <span className={styles.album}>{track.album}</span>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.controls}>
          <button className={styles.controlBtn} title="Previous" onClick={prevTrack}><IconPrev /></button>
          <button className={`${styles.controlBtn} ${styles.playBtn}`} onClick={togglePlay}
            title={track.isPlaying ? 'Pause' : 'Play'}>
            {track.isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button className={styles.controlBtn} title="Next" onClick={nextTrack}><IconNext /></button>
        </div>
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
          <div className={styles.times}>
            <span>{elapsed}</span>
            <span>{track.duration}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
