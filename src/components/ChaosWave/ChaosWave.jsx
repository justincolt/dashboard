import { useRef, useEffect } from 'react'
import styles from './ChaosWave.module.css'
import { meetings, weather } from '../../data/mockData'

const DAY_SCORES = [0, 1, 2, 3, 2, 1, 0] // Sun Mon Tue Wed Thu Fri Sat
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getWeatherScore(condition) {
  const c = condition.toLowerCase()
  if (c.includes('storm') || c.includes('thunder')) return 1
  if (c.includes('rain') || c.includes('shower')) return 0.75
  if (c.includes('overcast') || (c.includes('cloud') && !c.includes('partly'))) return 0.5
  if (c.includes('partly')) return 0.3
  return 0.1
}

function computeChaos() {
  const day = new Date().getDay()
  const dayScore = DAY_SCORES[day] / 3
  const meetingScore = Math.min(meetings.length / 5, 1)
  const weatherScore = getWeatherScore(weather.current.condition)
  const chaos = dayScore * 0.4 + meetingScore * 0.35 + weatherScore * 0.25
  return { chaos, day, meetingCount: meetings.length, condition: weather.current.condition }
}

function chaosLabel(c) {
  if (c < 0.2) return 'CALM'
  if (c < 0.45) return 'LOW'
  if (c < 0.65) return 'MODERATE'
  if (c < 0.82) return 'HIGH'
  return 'CRITICAL'
}

export default function ChaosWave() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  const { chaos, day, meetingCount, condition } = computeChaos()
  const label = chaosLabel(chaos)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let cssW = 0, cssH = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      cssW = rect.width
      cssH = rect.height
      const dpr = window.devicePixelRatio || 1
      canvas.width = cssW * dpr
      canvas.height = cssH * dpr
    }

    const draw = () => {
      if (!cssW || !cssH) { animRef.current = requestAnimationFrame(draw); return }

      const dpr = window.devicePixelRatio || 1
      ctx.clearRect(0, 0, cssW * dpr, cssH * dpr)

      tRef.current += 0.0015 + chaos * 0.0055
      const t = tRef.current

      const baseAmp = cssH * 0.12 + chaos * cssH * 0.28

      // teal (#4ecdc4) → orange (#e8740e) as chaos increases
      const r = Math.round(78 + (232 - 78) * chaos)
      const g = Math.round(205 + (116 - 205) * chaos)
      const b = Math.round(196 + (14 - 196) * chaos)

      ctx.save()
      ctx.scale(dpr, dpr)

      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`

      const freq = 1.5 + chaos * 2.5
      for (let x = 0; x <= cssW; x += 1.5) {
        const xNorm = x / cssW
        const y = cssH / 2
          + Math.sin(t * freq * 1.8 + xNorm * Math.PI * freq * 3) * baseAmp
          + (chaos > 0.5 ? Math.sin(t * freq * 3.1 + xNorm * Math.PI * 7) * baseAmp * 0.2 : 0)

        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      ctx.restore()
      animRef.current = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [chaos])

  return (
    <div className={styles.chaos}>
      <div className={styles.header}>
        <span className={styles.label}>Chaos Index</span>
        <span className={styles.level} data-level={label.toLowerCase()}>{label}</span>
      </div>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      <div className={styles.factors}>
        <span>{DAY_NAMES[day]}</span>
        <span>{meetingCount} meetings</span>
        <span>{condition}</span>
      </div>
    </div>
  )
}
