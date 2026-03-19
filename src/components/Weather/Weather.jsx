import { useState, useEffect, useRef } from 'react'
import styles from './Weather.module.css'
import { weather as mockWeather } from '../../data/mockData'
import { useWeather } from '../../hooks/useWeather'

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
  const isRainy = lower.includes('rain') || lower.includes('storm') || lower.includes('drizzle') || lower.includes('shower')
  const isPartly = lower.includes('partly') || (lower.includes('few') && lower.includes('cloud')) || lower.includes('scattered')
  const isCloudy = !isPartly && (lower.includes('cloud') || lower.includes('overcast'))

  const palettes = {
    dawn: ['#ff6b6b', '#ee5a24', '#ffd32a', '#ff9ff3', '#f8a5c2'],
    morning: isCloudy
      ? ['#576574', '#8395a7', '#c8d6e5', '#54a0ff']
      : ['#0abde3', '#48dbfb', '#ff9f43', '#feca57', '#00d2d3'],
    afternoon: isRainy
      ? ['#2c3e50', '#636e72', '#4834d4', '#6c5ce7', '#a29bfe']
      : isCloudy
        ? ['#4a69bd', '#6a89cc', '#82ccdd', '#b8e994']
        : isPartly
          ? ['#4a69bd', '#6a89cc', '#ffd32a', '#feca57', '#0abde3']
          : ['#0652DD', '#1289A7', '#12CBC4', '#FDA7DF', '#ED4C67'],
    sunset: ['#e55039', '#f39c12', '#e056fd', '#6F1E51', '#fc427b'],
    dusk: ['#5f27cd', '#341f97', '#e056fd', '#0c2461', '#ff6b81'],
    night: ['#0c1445', '#1B1464', '#6F1E51', '#0a3d62', '#3c1874'],
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
  const { data: liveWeather } = useWeather()
  const { current, forecast } = liveWeather ?? mockWeather
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

      // Fill with base color
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = colors[0]
      ctx.fillRect(0, 0, w, h)

      // Layer bold, saturated blobs with varied speeds
      for (let i = 0; i < colors.length; i++) {
        const speed = 0.8 + i * 0.3
        const cx = w * (0.2 + 0.6 * Math.sin(t * speed + i * 1.9))
        const cy = h * (0.2 + 0.6 * Math.cos(t * (speed * 0.6) + i * 2.3))
        const r = Math.max(w, h) * (0.35 + 0.2 * Math.sin(t * 0.4 + i * 1.2))

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        grad.addColorStop(0, colors[i])
        grad.addColorStop(0.6, colors[i] + 'AA')
        grad.addColorStop(1, colors[i] + '00')

        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 0.8
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
