"use client"

import { useEffect, useRef } from "react"

// Drifting smoke drawn on a canvas, framing the screen: soft fog rising up the left
// and right edges, slow fog along the bottom, and sharper, faster wisps in front.
// Everything curls as it drifts and swirls away from the cursor.

type Puff = {
  x: number
  y: number
  vx: number
  vy: number
  drift: number
  r: number
  grow: number
  rot: number
  spin: number
  life: number
  maxLife: number
  alpha: number
  layer: Layer
}

export type Layer = {
  count: number
  band: [number, number] // vertical range, as fractions of screen height
  size: [number, number] // radius range, as fractions of the larger screen side
  drift: [number, number] // rightward speed range (px per frame); some puffs roll back left
  life: [number, number] // frames
  stretch: number // horizontal stretch, so front wisps read as streaks
  sway: number
  wispy: boolean
  sides?: boolean // rise up the left and right edges instead of rolling along the floor
}

// Default: smoke in front of the photo, framing the screen
export const FRONT_SMOKE: Layer[] = [
  // sides: fog curling up the left and right edges of the screen
  { count: 30, band: [0.15, 1.05], size: [0.06, 0.1], drift: [0.05, 0.25], life: [900, 1500], stretch: 1.7, sway: 0.003, wispy: true, sides: true },
  // back: big, soft, slow fog
  { count: 40, band: [0.82, 1.04], size: [0.06, 0.12], drift: [0.35, 0.9], life: [900, 1600], stretch: 1, sway: 0.002, wispy: false },
  // front: smaller, more defined wisps rolling faster along the very bottom
  { count: 34, band: [0.9, 1.03], size: [0.035, 0.065], drift: [1.1, 2.3], life: [500, 900], stretch: 1.9, sway: 0.006, wispy: true },
]

// Behind the photo: faint, slow wisps drifting across the whole scene
export const BACKGROUND_SMOKE: Layer[] = [
  { count: 22, band: [0.05, 0.95], size: [0.1, 0.18], drift: [0.15, 0.45], life: [1400, 2200], stretch: 2.2, sway: 0.002, wispy: true },
  { count: 16, band: [0.4, 1.0], size: [0.12, 0.2], drift: [0.1, 0.3], life: [1400, 2200], stretch: 1, sway: 0.0015, wispy: false },
]

// One soft, slightly lumpy puff, pre-rendered once and stamped for every particle
function makePuffSprite(size: number) {
  const c = document.createElement("canvas")
  c.width = c.height = size
  const g = c.getContext("2d")!
  const blobs = 9
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2
    const d = size * 0.12 * Math.random()
    const cx = size / 2 + Math.cos(a) * d
    const cy = size / 2 + Math.sin(a) * d
    const rad = size * (0.28 + Math.random() * 0.18)
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, rad)
    grad.addColorStop(0, "rgba(215, 225, 235, 0.09)")
    grad.addColorStop(0.5, "rgba(200, 212, 225, 0.04)")
    grad.addColorStop(1, "rgba(190, 205, 220, 0)")
    g.fillStyle = grad
    g.fillRect(0, 0, size, size)
  }
  return c
}

// A curling wisp: a chain of small, brighter blobs along a wavy line, with a soft halo
function makeWispSprite(size: number) {
  const c = document.createElement("canvas")
  c.width = c.height = size
  const g = c.getContext("2d")!
  const phase = Math.random() * Math.PI * 2
  const steps = 26
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const cx = size * (0.12 + t * 0.76)
    const cy = size / 2 + Math.sin(t * Math.PI * 2.2 + phase) * size * 0.12
    // thickest in the middle, thinning toward both ends
    const rad = size * (0.05 + Math.sin(t * Math.PI) * 0.13) * (0.8 + Math.random() * 0.4)
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, rad)
    grad.addColorStop(0, "rgba(232, 238, 245, 0.16)")
    grad.addColorStop(0.45, "rgba(214, 224, 236, 0.07)")
    grad.addColorStop(1, "rgba(200, 212, 225, 0)")
    g.fillStyle = grad
    g.fillRect(0, 0, size, size)
  }
  return c
}

const between = ([a, b]: [number, number]) => a + Math.random() * (b - a)

export default function SmokeField({
  layers = FRONT_SMOKE,
  className = "z-20",
}: {
  layers?: Layer[]
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const speed = reduce ? 0.25 : 1

    const puffSprites = [makePuffSprite(256), makePuffSprite(256), makePuffSprite(256)]
    const wispSprites = [makeWispSprite(256), makeWispSprite(256), makeWispSprite(256), makeWispSprite(256)]
    let w = 0
    let h = 0
    const mouse = { x: -9999, y: -9999 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    // Spawn in the layer's band; most puffs drift right, some roll back left
    const spawn = (layer: Layer, p?: Puff, initial = false): Puff => {
      if (layer.sides) return spawnSide(layer, p, initial)
      const speedRight = between(layer.drift)
      const drift = Math.random() < 0.7 ? speedRight : -speedRight * 0.5
      const r = Math.max(w, h) * between(layer.size)
      const x = initial ? Math.random() * w : drift > 0 ? -r * layer.stretch * 0.5 : w + r * layer.stretch * 0.5
      const maxLife = between(layer.life)
      const puff = p ?? ({} as Puff)
      Object.assign(puff, {
        x,
        y: h * between(layer.band),
        vx: drift,
        vy: -0.02 - Math.random() * 0.06,
        drift,
        r,
        grow: 0.01 + Math.random() * 0.03,
        rot: layer.wispy ? (Math.random() - 0.5) * 0.3 : Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * (layer.wispy ? 0.001 : 0.002),
        life: initial ? Math.random() * maxLife : 0,
        maxLife,
        alpha: 0.6 + Math.random() * 0.4,
        layer,
      })
      return puff
    }

    // Side fog starts near the left or right edge, leans slightly inward, and rises
    const spawnSide = (layer: Layer, p?: Puff, initial = false): Puff => {
      const left = Math.random() < 0.5
      const r = Math.max(w, h) * between(layer.size)
      const inward = between(layer.drift)
      const maxLife = between(layer.life)
      const puff = p ?? ({} as Puff)
      Object.assign(puff, {
        x: left ? -r * 0.3 + Math.random() * w * 0.1 : w + r * 0.3 - Math.random() * w * 0.1,
        y: initial ? h * between(layer.band) : h * (0.7 + Math.random() * 0.35),
        vx: left ? inward : -inward,
        vy: -0.15 - Math.random() * 0.25,
        drift: left ? inward : -inward,
        r,
        grow: 0.02 + Math.random() * 0.04,
        // stand the wisp upright, leaning a little, so it reads as smoke rising
        rot: -Math.PI / 2 + (Math.random() - 0.5) * 0.7,
        spin: (Math.random() - 0.5) * 0.002,
        life: initial ? Math.random() * maxLife : 0,
        maxLife,
        alpha: 0.5 + Math.random() * 0.4,
        layer,
      })
      return puff
    }

    resize()
    // back layers first so the front wisps draw over it
    const puffs = layers.flatMap((layer) =>
      Array.from({ length: layer.count }, () => spawn(layer, undefined, true))
    )
    const sprite = (p: Puff, i: number) =>
      p.layer.wispy ? wispSprites[i % wispSprites.length] : puffSprites[i % puffSprites.length]

    let raf = 0
    let t = 0
    const frame = () => {
      t += speed
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = "screen"

      puffs.forEach((p, i) => {
        // slow sideways sway so the smoke curls instead of sliding
        p.vx += Math.sin((t + i * 37) * 0.004) * p.layer.sway * speed

        // swirl away from the cursor
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.hypot(dx, dy)
        const reach = p.r * 1.6 * p.layer.stretch
        if (dist < reach && dist > 0.1) {
          const f = (1 - dist / reach) * 0.35 * speed
          p.vx += (dx / dist) * f - (dy / dist) * f * 0.6
          p.vy += (dy / dist) * f + (dx / dist) * f * 0.6
        }

        // ease back toward the puff's own drift after being pushed
        p.vx += (p.drift - p.vx) * 0.02
        if (!p.layer.sides) p.vy *= 0.985
        p.x += p.vx * speed
        p.y += p.vy * speed
        p.r += p.grow * speed
        p.rot += p.spin * speed
        p.life += speed

        // fade in, hold, fade out
        const k = p.life / p.maxLife
        const fade = k < 0.2 ? k / 0.2 : k > 0.7 ? (1 - k) / 0.3 : 1
        const edge = p.r * p.layer.stretch * 1.2
        if (k >= 1 || p.x < -edge || p.x > w + edge || p.y < -p.r) spawn(p.layer, p)

        ctx.globalAlpha = Math.max(0, fade) * p.alpha
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        const sw = p.r * 2 * p.layer.stretch
        const sh = p.r * 2
        ctx.drawImage(sprite(p, i), -sw / 2, -sh / 2, sw, sh)
        ctx.restore()
      })

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse.x = mouse.y = -9999
    }

    window.addEventListener("resize", resize)
    window.addEventListener("pointermove", onMove)
    document.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerleave", onLeave)
    }
  }, [layers])

  return <canvas ref={canvasRef} className={`pointer-events-none fixed inset-0 h-full w-full ${className}`} aria-hidden />
}
