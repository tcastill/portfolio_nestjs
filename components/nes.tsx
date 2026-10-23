"use client"

import { motion } from "framer-motion"
import { Press_Start_2P } from "next/font/google"

// Shared 8-bit pieces for the NES-themed shoe pages (Camp Killer, Burned Dreams):
// the pixel font, chiptune sounds made on the fly with Web Audio (no files),
// pixel-art sprites drawn from text grids, typewriter text and CRT scanlines.

export const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400" })

/* =========================
   CHIPTUNE SOUND
========================= */
let ctx: AudioContext | null = null
let muted = false

export function setMuted(m: boolean) {
  muted = m
}

// the shared AudioContext (null when muted or on the server), for pages that build their own sounds
export function audio() {
  if (muted || typeof window === "undefined") return null
  ctx ??= new AudioContext()
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

export function tone(freq: number, dur: number, opts: { type?: OscillatorType; vol?: number; to?: number; at?: number } = {}) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + (opts.at ?? 0)
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = opts.type ?? "square"
  osc.frequency.setValueAtTime(freq, t)
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t + dur)
  gain.gain.setValueAtTime(opts.vol ?? 0.06, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

export function noise(dur: number, vol = 0.25) {
  const a = audio()
  if (!a) return
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate)
  const data = buf.getChannelData(0)
  // crunchy NES-style noise: hold each random value for a few samples
  let v = 0
  for (let i = 0; i < data.length; i++) {
    if (i % 6 === 0) v = Math.random() * 2 - 1
    data[i] = v * (1 - i / data.length)
  }
  const src = a.createBufferSource()
  const gain = a.createGain()
  gain.gain.value = vol
  src.buffer = buf
  src.connect(gain).connect(a.destination)
  src.start()
}

export const sfx = {
  move: () => tone(880, 0.05, { vol: 0.04 }),
  select: () => tone(660, 0.08, { vol: 0.05 }),
  itemGet: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { at: i * 0.09, vol: 0.05 })),
  heartbeat: () => {
    tone(70, 0.18, { type: "sine", vol: 0.5, to: 40 })
    tone(60, 0.16, { type: "sine", vol: 0.35, to: 35, at: 0.2 })
  },
  scare: () => {
    noise(0.9, 0.35)
    tone(1400, 0.8, { type: "sawtooth", vol: 0.12, to: 60 })
    tone(90, 0.9, { type: "square", vol: 0.15, to: 30 })
  },
  gameOver: () => [392, 370, 349, 330, 196].forEach((f, i) => tone(f, i === 4 ? 0.7 : 0.22, { at: i * 0.24, vol: 0.06, type: "triangle" })),
  sting: () => {
    tone(110, 0.9, { type: "sawtooth", vol: 0.06, to: 104 })
    tone(116, 0.9, { type: "sawtooth", vol: 0.06, to: 110 })
  },
}

/* =========================
   PIXEL ART + TEXT
========================= */
// Draws a sprite from rows of characters; each character maps to a colour (unmapped = empty)
export function PixelGrid({ rows, colors, className }: { rows: string[]; colors: Record<string, string>; className?: string }) {
  return (
    <svg viewBox={`0 0 ${rows[0].length} ${rows.length}`} shapeRendering="crispEdges" className={className} aria-hidden>
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          colors[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={colors[c]} /> : null
        )
      )}
    </svg>
  )
}

export const ARROW = ["....X...", "....XX..", "XXXXXXX.", "XXXXXXXX", "XXXXXXX.", "....XX..", "....X..."]

// The blinking menu cursor
export function BlinkArrow({ color, className }: { color: string; className?: string }) {
  return (
    <motion.span
      className={className}
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, times: [0, 0.6, 0.61, 1] }}
    >
      <PixelGrid rows={ARROW} colors={{ X: color }} className="block h-auto w-full" />
    </motion.span>
  )
}

// Text that types itself out, one character per step
export function Typed({ text, delay = 0, perChar = 0.05 }: { text: string; delay?: number; perChar?: number }) {
  const n = text.length
  return (
    <motion.span
      className="inline-block overflow-hidden whitespace-pre align-bottom"
      initial={{ width: "0ch" }}
      animate={{ width: `${n}ch` }}
      transition={{ delay, duration: n * perChar, ease: (t) => Math.floor(t * n) / n }}
    >
      {text}
    </motion.span>
  )
}

export const SCANLINES = "repeating-linear-gradient(to bottom, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 2px, transparent 3px)"

// CRT over the whole page: scanlines, vignette and a faint roll bar
export function CrtScreen({ reduce }: { reduce: boolean | null }) {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[45]"
        style={{ background: `${SCANLINES}, radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)` }}
      />
      {!reduce && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 z-[45] h-[18vh] bg-gradient-to-b from-transparent via-white/[0.035] to-transparent"
          animate={{ top: ["-20vh", "110vh"] }}
          transition={{ duration: 7, ease: "linear", repeat: Infinity }}
        />
      )}
    </>
  )
}
