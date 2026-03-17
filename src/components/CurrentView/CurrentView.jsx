import { useState, useEffect, useRef } from 'react'
import styles from './CurrentView.module.css'
import { weather as mockWeather } from '../../data/mockData'

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

export default function CurrentView() {
  const [time, setTime] = useState(new Date())
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const hour = time.getHours()
  const timeOfDay = getTimeOfDay(hour)
  const colors = getGradientColors(timeOfDay, mockWeather.current.condition)
  const label = getLabel(timeOfDay)

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

      // Layer blobs with shifting positions
      for (let i = 0; i < colors.length; i++) {
        const cx = w * (0.3 + 0.4 * Math.sin(t + i * 2.1))
        const cy = h * (0.3 + 0.4 * Math.cos(t * 0.7 + i * 1.8))
        const r = Math.max(w, h) * (0.5 + 0.15 * Math.sin(t * 0.5 + i))

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        grad.addColorStop(0, colors[i] + 'cc')
        grad.addColorStop(1, colors[i] + '00')

        ctx.globalCompositeOperation = i === 0 ? 'source-over' : 'lighter'
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      // Soft overlay to blend
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = colors[0] + '30'
      ctx.fillRect(0, 0, w, h)

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [colors])

  return (
    <div className={styles.currentView}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.overlay}>
        <span className={styles.label}>Current View</span>
        <span className={styles.condition}>{mockWeather.current.condition}</span>
        <span className={styles.time}>{label}</span>
      </div>
    </div>
  )
}
