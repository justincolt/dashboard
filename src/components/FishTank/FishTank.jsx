import { useEffect, useRef } from 'react'
import styles from './FishTank.module.css'

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

// Pixel art fish sprites (each row is a line of the sprite, 1 = filled, 0 = empty)
const FISH_SPRITES = [
  // Fish A — classic shape
  [
    [0,0,0,1,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,0],
  ],
  // Fish B — rounder
  [
    [0,0,1,1,0,0,0,0,0],
    [0,1,1,1,1,1,1,0,0],
    [1,1,1,0,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1],
    [1,1,1,0,1,1,1,1,0],
    [0,1,1,1,1,1,1,0,0],
    [0,0,1,1,0,0,0,0,0],
  ],
  // Fish C — slim
  [
    [0,0,0,0,1,0,0,0,0,0],
    [1,0,1,1,1,1,1,1,0,0],
    [1,1,1,1,0,1,1,1,1,1],
    [1,0,1,1,1,1,1,1,0,0],
    [0,0,0,0,1,0,0,0,0,0],
  ],
]

function createFish(w, h) {
  const goingRight = Math.random() > 0.5
  return {
    x: randomBetween(w * 0.1, w * 0.9),
    y: randomBetween(h * 0.15, h * 0.8),
    vx: (goingRight ? 1 : -1) * randomBetween(0.3, 0.7),
    vy: randomBetween(-0.1, 0.1),
    sprite: FISH_SPRITES[Math.floor(Math.random() * FISH_SPRITES.length)],
    pixelSize: Math.floor(randomBetween(4, 7)),
    shade: Math.random() > 0.5 ? '#222' : '#555',
    wobblePhase: Math.random() * Math.PI * 2,
  }
}

function createBubble(w, h) {
  return {
    x: randomBetween(w * 0.1, w * 0.9),
    y: h + 5,
    size: Math.floor(randomBetween(3, 6)),
    speed: randomBetween(0.3, 0.7),
    wobble: randomBetween(0, Math.PI * 2),
  }
}

function drawPixelSprite(ctx, sprite, x, y, px, flip, shade) {
  ctx.fillStyle = shade
  const rows = sprite.length
  const cols = sprite[0].length
  const offX = x - (cols * px) / 2
  const offY = y - (rows * px) / 2

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (sprite[r][c]) {
        const col = flip ? (cols - 1 - c) : c
        ctx.fillRect(
          Math.round(offX + col * px),
          Math.round(offY + r * px),
          px,
          px
        )
      }
    }
  }
}

export default function FishTank() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'

      if (!stateRef.current) {
        stateRef.current = {
          fish: Array.from({ length: 5 }, () => createFish(canvas.width, canvas.height)),
          bubbles: Array.from({ length: 3 }, () => createBubble(canvas.width, canvas.height)),
        }
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)

    let t = 0
    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      const state = stateRef.current
      t += 0.02

      // Background
      ctx.clearRect(0, 0, w, h)
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, 'rgba(140, 200, 240, 0.06)')
      bg.addColorStop(1, 'rgba(100, 160, 220, 0.12)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Pixel ground
      ctx.fillStyle = 'rgba(160, 160, 160, 0.25)'
      const groundY = h - 16
      for (let gx = 0; gx < w; gx += 8) {
        const gy = groundY + (Math.sin(gx * 0.15) > 0.3 ? -4 : 0)
        ctx.fillRect(gx, gy, 6, 6)
      }

      // Pixel seaweed
      ctx.fillStyle = 'rgba(120, 170, 120, 0.35)'
      const weeds = [w * 0.12, w * 0.35, w * 0.65, w * 0.85]
      for (const wx of weeds) {
        const segments = 6 + Math.floor(Math.sin(wx) * 2)
        for (let j = 0; j < segments; j++) {
          const sy = groundY - j * 10
          const sx = wx + Math.sin(t * 1.2 + j * 0.5 + wx * 0.01) * 4
          ctx.fillRect(Math.round(sx), Math.round(sy), 6, 8)
        }
      }

      // Fish
      ctx.imageSmoothingEnabled = false
      for (const f of state.fish) {
        f.wobblePhase += 0.015
        f.x += f.vx
        f.y += f.vy + Math.sin(f.wobblePhase) * 0.15

        // Wrap around
        const spriteW = f.sprite[0].length * f.pixelSize
        if (f.x < -spriteW) { f.x = w + spriteW; f.y = randomBetween(h * 0.12, h * 0.72) }
        if (f.x > w + spriteW) { f.x = -spriteW; f.y = randomBetween(h * 0.12, h * 0.72) }
        if (f.y < h * 0.06 || f.y > h * 0.78) f.vy *= -1

        const flip = f.vx > 0
        drawPixelSprite(ctx, f.sprite, f.x, f.y, f.pixelSize, flip, f.shade)
      }

      // Pixel bubbles
      ctx.fillStyle = 'rgba(180, 220, 255, 0.35)'
      for (const b of state.bubbles) {
        b.y -= b.speed
        b.wobble += 0.03
        const bx = b.x + Math.sin(b.wobble) * 3
        ctx.fillRect(Math.round(bx), Math.round(b.y), b.size, b.size)

        if (b.y < -10) Object.assign(b, createBubble(w, h))
      }

      if (Math.random() < 0.01) {
        state.bubbles.push(createBubble(w, h))
        if (state.bubbles.length > 8) state.bubbles.shift()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [])

  return (
    <div className={styles.fishTank}>
      <span className={styles.label}>Fish Tank</span>
      <div className={styles.tankWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </div>
  )
}
