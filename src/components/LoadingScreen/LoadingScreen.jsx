import { useState, useEffect } from 'react'
import styles from './LoadingScreen.module.css'

export default function LoadingScreen({ onComplete }) {
  const [phase, setPhase] = useState('loading')

  useEffect(() => {
    const fillTimer = setTimeout(() => setPhase('done'), 900)
    const fadeTimer = setTimeout(() => onComplete(), 1400)
    return () => {
      clearTimeout(fillTimer)
      clearTimeout(fadeTimer)
    }
  }, [onComplete])

  return (
    <div className={`${styles.screen} ${phase === 'done' ? styles.fadeOut : ''}`}>
      <div className={styles.fill} />
      <div className={styles.labelWrap}>
        <div className={styles.labelBlack}>LOADING</div>
        <div className={styles.labelWhite}>LOADING</div>
      </div>
    </div>
  )
}
