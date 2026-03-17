import { useEffect, useRef } from 'react'
import styles from './FishTank.module.css'

function rand(a, b) { return a + Math.random() * (b - a) }

const FISH_SPRITES = [
  // Angelfish — tall
  [
    [0,0,0,1,0,0,0],
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [1,1,1,0,1,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0],
    [0,0,1,0,1,0,0],
  ],
  // Pufferfish
  [
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [1,1,0,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,0,1,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
  ],
  // Classic
  [
    [0,0,0,1,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,0],
  ],
  // Tiny minnow
  [
    [0,0,1,0,0,0],
    [1,1,1,0,1,1],
    [1,1,1,1,1,1],
    [1,1,1,0,1,1],
    [0,0,1,0,0,0],
  ],
  // Swordfish
  [
    [0,0,0,0,0,1,0,0,0,0,0,0,0],
    [1,0,0,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,0,1,1,1,1,1,1,1,0],
    [1,0,0,1,1,1,1,1,1,1,1,1,1],
    [0,0,0,0,0,1,0,0,0,0,0,0,0],
  ],
  // Chubby
  [
    [0,0,0,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,0],
    [1,1,1,0,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1],
    [1,1,1,0,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0,0],
  ],
]

function createFish(w, h) {
  const dir = Math.random() > 0.5 ? 1 : -1
  return {
    x: rand(w * 0.1, w * 0.9),
    y: rand(h * 0.1, h * 0.72),
    vx: dir * rand(0.4, 1.0),
    vy: 0,
    targetY: rand(h * 0.1, h * 0.72),
    sprite: FISH_SPRITES[Math.floor(Math.random() * FISH_SPRITES.length)],
    pixelSize: Math.floor(rand(3, 6)),
    shade: Math.random() > 0.5 ? '#1a1a1a' : '#4a4a4a',
    phase: Math.random() * Math.PI * 2,
    turnTimer: rand(120, 400),
    turnCount: 0,
  }
}

function createBubble(w, h) {
  return {
    x: rand(w * 0.1, w * 0.9), y: h + 5,
    size: Math.floor(rand(2, 5)), speed: rand(0.3, 0.7),
    wobble: rand(0, Math.PI * 2),
  }
}

function drawPixelSprite(ctx, sprite, x, y, px, flip, shade) {
  ctx.fillStyle = shade
  const rows = sprite.length, cols = sprite[0].length
  const offX = x - (cols * px) / 2, offY = y - (rows * px) / 2
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (sprite[r][c]) {
        const col = flip ? (cols - 1 - c) : c
        ctx.fillRect(Math.round(offX + col * px), Math.round(offY + r * px), px, px)
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
          fish: Array.from({ length: 7 }, () => createFish(canvas.width, canvas.height)),
          bubbles: Array.from({ length: 3 }, () => createBubble(canvas.width, canvas.height)),
        }
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)

    let t = 0
    const draw = () => {
      const w = canvas.width, h = canvas.height
      const state = stateRef.current
      t += 0.016

      // Water
      ctx.clearRect(0, 0, w, h)
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, 'rgba(140, 200, 240, 0.05)')
      bg.addColorStop(1, 'rgba(80, 140, 200, 0.12)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const groundY = h - 20

      // Sand bed
      ctx.fillStyle = 'rgba(160, 155, 140, 0.2)'
      for (let gx = 0; gx < w; gx += 6) {
        const gy = groundY + Math.sin(gx * 0.08) * 4 + Math.sin(gx * 0.2) * 2
        ctx.fillRect(gx, gy, 5, h - gy)
      }

      // Rocks
      ctx.fillStyle = 'rgba(120, 115, 110, 0.3)'
      for (const rx of [w*0.08, w*0.25, w*0.52, w*0.78, w*0.93]) {
        const rw = 10 + Math.sin(rx) * 6, rh = 6 + Math.cos(rx) * 3
        ctx.fillRect(Math.round(rx - rw/2), Math.round(groundY - rh + 2), rw, rh)
      }

      // Seaweed varieties
      const weeds = [
        { x: w*0.07, h: 0.30, n: 10, sw: 5 }, { x: w*0.15, h: 0.18, n: 6, sw: 4 },
        { x: w*0.32, h: 0.35, n: 12, sw: 6 }, { x: w*0.45, h: 0.15, n: 5, sw: 4 },
        { x: w*0.60, h: 0.28, n: 9, sw: 5 }, { x: w*0.75, h: 0.22, n: 7, sw: 4 },
        { x: w*0.88, h: 0.32, n: 11, sw: 5 }, { x: w*0.95, h: 0.14, n: 5, sw: 4 },
      ]
      for (const wd of weeds) {
        ctx.fillStyle = `rgba(100, 160, 100, ${0.25 + Math.sin(wd.x) * 0.1})`
        const wh = h * wd.h
        for (let j = 0; j < wd.n; j++) {
          const sy = groundY - (wh * j) / wd.n
          const sway = Math.sin(t * 1.0 + j * 0.4 + wd.x * 0.005) * (4 + j * 0.5)
          ctx.fillRect(Math.round(wd.x + sway), Math.round(sy), wd.sw, 8)
        }
      }

      // Coral clusters
      ctx.fillStyle = 'rgba(140, 130, 120, 0.25)'
      for (const cx of [w*0.20, w*0.55, w*0.82]) {
        for (let i = 0; i < 4; i++) {
          const bx = cx + (i - 1.5) * 8, bh = 8 + Math.sin(cx + i) * 6
          ctx.fillRect(Math.round(bx), Math.round(groundY - bh), 6, bh)
        }
      }

      // Fish — fluid swimming with steering
      ctx.imageSmoothingEnabled = false
      for (const f of state.fish) {
        f.phase += 0.03
        f.turnCount++

        // Steer toward target depth
        const dy = f.targetY - f.y
        f.vy += dy * 0.0008
        f.vy *= 0.97
        f.y += f.vy + Math.sin(f.phase) * 0.3
        f.x += f.vx

        // Pick new target periodically
        if (f.turnCount > f.turnTimer) {
          f.targetY = rand(h * 0.08, h * 0.7)
          f.turnTimer = rand(120, 400)
          f.turnCount = 0
          f.vx = (f.vx > 0 ? 1 : -1) * rand(0.4, 1.0)
        }

        // Wrap
        const sw = f.sprite[0].length * f.pixelSize
        if (f.x < -sw * 2) { f.x = w + sw; f.y = rand(h * 0.1, h * 0.7) }
        if (f.x > w + sw * 2) { f.x = -sw; f.y = rand(h * 0.1, h * 0.7) }
        f.y = Math.max(h * 0.04, Math.min(h * 0.74, f.y))

        drawPixelSprite(ctx, f.sprite, f.x, f.y, f.pixelSize, f.vx > 0, f.shade)
      }

      // Bubbles
      ctx.fillStyle = 'rgba(180, 220, 255, 0.3)'
      for (const b of state.bubbles) {
        b.y -= b.speed
        b.wobble += 0.025
        ctx.fillRect(Math.round(b.x + Math.sin(b.wobble) * 4), Math.round(b.y), b.size, b.size)
        if (b.y < -10) Object.assign(b, createBubble(w, h))
      }
      if (Math.random() < 0.015) {
        state.bubbles.push(createBubble(w, h))
        if (state.bubbles.length > 10) state.bubbles.shift()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect() }
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
