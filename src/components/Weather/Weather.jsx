import { useState, useEffect, useRef } from 'react'
import styles from './Weather.module.css'
import { weather } from '../../data/mockData'

function getTimeOfDay(hour) {
  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 20) return 'sunset'
  if (hour >= 20 && hour < 22) return 'dusk'
  return 'night'
}

function getGradientColors(timeOfDay, condition) {
  const lower = condition.toLowerCase()
  const isRainy = lower.includes('rain') || lower.includes('storm')
  const isCloudy = lower.includes('cloud') || lower.includes('overcast')

  const palettes = {
    dawn: ['#ff9a9e', '#fad0c4', '#ffecd2'],
    morning: isCloudy
      ? ['#a8c0d6', '#c4d4e0', '#dce6ef']
      : ['#89CFF0', '#a0d2f0', '#ffecd2'],
    afternoon: isRainy
      ? ['#636e8a', '#8e99b0', '#a3adc2']
      : isCloudy
        ? ['#87a5c0', '#a8c4db', '#c0d6e8']
        : ['#56CCF2', '#2F80ED', '#a8d8f0'],
    sunset: ['#f093fb', '#f5576c', '#fda085'],
    dusk: ['#a18cd1', '#5b4a9e', '#fbc2eb'],
    night: ['#0c1445', '#1a1a4e', '#2d1b69'],
  }

  return palettes[timeOfDay] || palettes.afternoon
}

function getLabel(timeOfDay) {
  const labels = {
    dawn: 'Dawn',
    morning: 'Morning',
    afternoon: 'Afternoon',
    sunset: 'Sunset',
    dusk: 'Dusk',
    night: 'Night',
  }
  return labels[timeOfDay] || 'Now'
}

export default function Weather() {
  const { current, forecast } = weather
  const [time, setTime] = useState(new Date())
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const hour = time.getHours()
  const timeOfDay = getTimeOfDay(hour)
  const colors = getGradientColors(timeOfDay, current.condition)
  const timeLabel = getLabel(timeOfDay)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let t = 0

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      t += 0.003

      // Fill with base color first
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = colors[0]
      ctx.fillRect(0, 0, w, h)

      // Layer saturated blobs on top
      for (let i = 0; i < colors.length; i++) {
        const cx = w * (0.3 + 0.4 * Math.sin(t + i * 2.1))
        const cy = h * (0.3 + 0.4 * Math.cos(t * 0.7 + i * 1.8))
        const r = Math.max(w, h) * (0.5 + 0.15 * Math.sin(t * 0.5 + i))

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        grad.addColorStop(0, colors[i])
        grad.addColorStop(1, colors[i] + '00')

        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 0.7
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      ctx.globalAlpha = 1

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [colors])

  return (
    <div className={styles.weather}>
      <div className={styles.label}>Weather</div>
      <div className={styles.current}>
        <span className={styles.temp}>{current.temp}°</span>
        <span className={styles.condition}>{current.condition}</span>
      </div>
      <div className={styles.details}>
        <span>H {current.high}°</span>
        <span>L {current.low}°</span>
        <span>{current.humidity}% hum</span>
      </div>
      <div className={styles.gradientWrap}>
        <canvas ref={canvasRef} className={styles.gradientCanvas} />
        <span className={styles.timeLabel}>{timeLabel}</span>
      </div>
      <div className={styles.forecast}>
        {forecast.map((day) => (
          <div key={day.day} className={styles.forecastDay}>
            <span className={styles.dayName}>{day.day}</span>
            <span className={styles.dayIcon}>{day.icon}</span>
            <span className={styles.dayTemps}>{day.high}/{day.low}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
