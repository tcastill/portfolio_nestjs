"use client"

import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { setMuted, tone } from "@/components/nes"

// Astromech: Star Wars on the shoe page.
// - Click R2: he chirps and whistles, his dome light flickers, the lights go down and he
//   projects a flickering blue hologram of the shoes with a message. Click again to cut it.
// - EPISODE IV: an opening crawl over a starfield, with an original sneaker story.
// hologram.png is the shoes cut out of the photo and turned into blue hologram light.
// R2's voice is made on the fly with Web Audio (tone() from components/nes.tsx).

const HOLOGRAM = "/shoes/astromech/hologram.png"
const HOLO_RATIO = 1000 / 682
const FRAME_RATIO = 6000 / 3376

// where things sit in astromech.jpg (6000x3376), as % of the photo
const PROJECTOR = { x: 60.75, y: 20.9 }
const R2_SHAPE = "47.5,7.5 64.5,7.5 68,27 68,80 55,80 55,60 44,58 43.5,27"
const HOLO = { left: 9, top: 9, width: 28 }
const HOLO_HEIGHT = (HOLO.width * FRAME_RATIO) / HOLO_RATIO // as % of the frame's height

const HOLO_MS = 8000

type Phase = "idle" | "beep" | "holo"

// R2's chatter: quick sine chirps that slide between random pitches
function chirps(count: number, start = 0) {
  let t = start
  for (let i = 0; i < count; i++) {
    const f = 900 + Math.random() * 2200
    const d = 0.04 + Math.random() * 0.1
    tone(f, d, { type: "sine", vol: 0.07, to: 700 + Math.random() * 2600, at: t })
    t += d + Math.random() * 0.05
  }
  return t
}

function whistle(at: number) {
  tone(1200, 0.35, { type: "sine", vol: 0.06, to: 3200, at })
  tone(3200, 0.25, { type: "sine", vol: 0.05, to: 1800, at: at + 0.36 })
}

/* =========================
   OPENING CRAWL
========================= */
function seeded(n: number) {
  const s = Math.sin(n * 9301 + 49297) * 233280
  return s - Math.floor(s)
}

const STARS = Array.from({ length: 160 }, (_, i) => ({
  left: seeded(i) * 100,
  top: seeded(i + 500) * 100,
  size: seeded(i + 1000) > 0.92 ? 2 : 1,
  twinkle: seeded(i + 1500) > 0.8,
}))

const CRAWL = [
  "The galaxy's closets are in turmoil. Sold-out drops and sinister RESELLER BOTS have left collectors barefoot across a thousand star systems.",
  "Hidden aboard a small blue-and-white astromech droid is the last pair of BULLAIRS ASTROMECH high-tops, wrapped in chrome and blue and signed by legends.",
  "Now the loyal droid must race across the stars to deliver the kicks to the one collector worthy of wearing them, before the Empire's sneaker bots track him down....",
]

function Crawl({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    const end = window.setTimeout(onClose, reduce ? 20000 : 62000)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.clearTimeout(end)
    }
  }, [onClose, reduce])

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden bg-black select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      onClick={onClose}
    >
      {STARS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size }}
          animate={s.twinkle && !reduce ? { opacity: [1, 0.3, 1] } : undefined}
          transition={{ duration: 2 + (i % 5), repeat: Infinity }}
        />
      ))}

      {/* A long time ago... */}
      <motion.p
        className="absolute inset-x-0 top-[40%] px-6 text-center text-xl leading-relaxed text-[#4bd5ee] md:text-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 6, times: [0, 0.15, 0.8, 1] }}
      >
        A long time ago, in a sneaker closet
        <br />
        far, far away....
      </motion.p>

      {/* the title, falling away into space */}
      <motion.h2
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[16vw] font-black leading-none tracking-tight text-transparent [-webkit-text-stroke:3px_#ffe81f]"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [1, 0.7, 0.3, 0.02] }}
        transition={{ delay: 6.5, duration: 8, ease: "easeIn", times: [0, 0.05, 0.7, 1] }}
      >
        ASTROMECH
      </motion.h2>

      {/* the crawl */}
      <div className="absolute inset-0 flex justify-center [perspective:380px]">
        <motion.div
          className="w-[min(92vw,54rem)] text-justify text-xl font-bold leading-[1.45] text-[#ffe81f] [transform-origin:50%_100%] md:text-[2.2rem]"
          style={{ rotateX: 24 }}
          initial={{ y: "160vh" }}
          animate={{ y: "-260vh" }}
          transition={{ delay: 12, duration: reduce ? 10 : 50, ease: "linear" }}
        >
          <p className="mb-2 text-center text-xl md:text-3xl">Episode IV</p>
          <p className="mb-10 text-center text-3xl uppercase md:text-6xl">A New Sole</p>
          {CRAWL.map((para) => (
            <p key={para} className="mb-10">
              {para}
            </p>
          ))}
        </motion.div>
      </div>

      <button
        type="button"
        className="absolute right-6 top-6 rounded-full border border-[#ffe81f]/60 px-4 py-1.5 text-xs uppercase tracking-widest text-[#ffe81f] hover:bg-[#ffe81f] hover:text-black"
        onClick={onClose}
      >
        Skip ✕
      </button>
    </motion.div>,
    document.body
  )
}

// Soft studio light behind the photo so its edges melt into the page
export function AstromechBackdrop({ image }: { image: string }) {
  return (
    <div className="fixed inset-0 -z-50 bg-[#dfe3ea]">
      <div className="absolute inset-0 scale-110 bg-cover bg-center opacity-80 blur-3xl" style={{ backgroundImage: `url(${image})` }} />
    </div>
  )
}

/* =========================
   R2 AND THE HOLOGRAM (inside the photo frame)
========================= */
export default function AstromechFX() {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>("idle")
  const [crawl, setCrawl] = useState(false)
  const [sound, setSound] = useState(true)
  const [hover, setHover] = useState(false)
  const timers = useRef<number[]>([])

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (phase !== "idle") {
      // cut the transmission
      chirps(3)
      setPhase("idle")
      return
    }
    setPhase("beep")
    const t = chirps(9)
    whistle(t + 0.05)
    later(1300, () => {
      setPhase("holo")
      chirps(4, 0.2)
    })
    later(1300 + HOLO_MS, () => {
      setPhase("idle")
      chirps(5)
    })
  }, [phase, later])

  const closeCrawl = useCallback(() => setCrawl(false), [])

  const holo = phase === "holo"
  const lit = phase !== "idle"

  return (
    <div className="absolute inset-0 @container">
      {/* lights down while the message plays */}
      <motion.div
        className="pointer-events-none absolute -inset-[150vmax] bg-[#020611]"
        animate={{ opacity: holo ? 0.78 : phase === "beep" ? 0.2 : 0 }}
        transition={{ duration: 0.8 }}
      />

      {/* R2's dome light: flickers red and blue while he talks */}
      <motion.div
        className="pointer-events-none absolute h-[5cqw] w-[5cqw] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen blur-md"
        style={{ left: `${PROJECTOR.x}%`, top: `${PROJECTOR.y}%` }}
        animate={
          lit
            ? { backgroundColor: ["#4a7dff", "#ff3a3a", "#4a7dff", "#9cc8ff"], opacity: [0.9, 0.5, 1, 0.8] }
            : { backgroundColor: "#4a7dff", opacity: hover ? 0.7 : 0.25 }
        }
        transition={lit ? { duration: 0.5, repeat: Infinity } : { duration: 0.3 }}
      />

      {/* the projector beam and the hologram */}
      <AnimatePresence>
        {holo && (
          <motion.div key="holo" className="pointer-events-none absolute inset-0" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="r2-beam" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0" stopColor="#bfe6ff" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#6ab8ff" stopOpacity="0.04" />
                </linearGradient>
              </defs>
              <motion.polygon
                points={`${PROJECTOR.x},${PROJECTOR.y} ${HOLO.left + HOLO.width * 0.55},${HOLO.top} ${HOLO.left + HOLO.width * 0.55},${HOLO.top + HOLO_HEIGHT}`}
                fill="url(#r2-beam)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.6, 1, 0.75, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            </svg>

            <motion.div
              className="absolute"
              style={{ left: `${HOLO.left}%`, top: `${HOLO.top}%`, width: `${HOLO.width}%`, aspectRatio: `${HOLO_RATIO}` }}
              initial={{ scaleY: 0.02, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              {/* flicker and the odd glitch */}
              <motion.div
                className="absolute inset-0"
                animate={
                  reduce
                    ? { opacity: 0.85 }
                    : { opacity: [0.85, 0.6, 0.9, 0.75, 0.95, 0.4, 0.85], x: ["0cqw", "0cqw", "0.6cqw", "0cqw", "0cqw", "-0.8cqw", "0cqw"] }
                }
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                <Image src={HOLOGRAM} alt="" fill className="object-contain mix-blend-screen" />
                {/* scanlines, only where there's hologram */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "repeating-linear-gradient(to bottom, rgba(2,6,17,0.55) 0px, rgba(2,6,17,0.55) 2px, transparent 2px, transparent 5px)",
                    WebkitMaskImage: `url(${HOLOGRAM})`,
                    maskImage: `url(${HOLOGRAM})`,
                    WebkitMaskSize: "100% 100%",
                    maskSize: "100% 100%",
                  }}
                />
                {!reduce && (
                  <motion.div
                    className="absolute inset-x-0 h-[12%] bg-gradient-to-b from-transparent via-[#bfe6ff]/30 to-transparent mix-blend-screen"
                    animate={{ top: ["-15%", "105%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.div>

              {/* the message */}
              <div className="absolute inset-x-0 top-full mt-[1cqw] text-center font-mono text-[1.35cqw] uppercase leading-[2cqw] tracking-[0.25em] text-[#9fdcff] [text-shadow:0_0_0.8cqw_rgba(100,190,255,0.9)]">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.7, 1] }} transition={{ delay: 1.2, duration: 0.8 }}>
                  Help me, Bullairs.
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.7, 1] }} transition={{ delay: 3, duration: 0.8 }}>
                  You&apos;re my only hope.
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* clickable R2 */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon
          points={R2_SHAPE}
          fill="transparent"
          role="button"
          tabIndex={0}
          aria-label={holo ? "Stop R2's message" : "Ask R2 to play his message"}
          className="cursor-pointer outline-none"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          onClick={(e) => {
            e.stopPropagation()
            play()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              play()
            }
          }}
        />
      </svg>

      {/* nudge to click him */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.span
            className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1d3fbf] px-[1.1cqw] py-[0.45cqw] text-[0.95cqw] font-semibold uppercase tracking-widest text-white shadow-lg"
            style={{ left: "56%", top: "2%" }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: hover ? 1 : 0.85, y: hover ? -4 : 0 }}
            exit={{ opacity: 0 }}
          >
            Beep boop? Click R2
          </motion.span>
        )}
      </AnimatePresence>

      {/* opening crawl + sound */}
      <div className="absolute bottom-[3%] right-[2.5%] flex items-center gap-[1.2cqw]">
        <button
          type="button"
          className="text-[0.9cqw] uppercase tracking-widest text-white/70 hover:text-white"
          onClick={(e) => {
            e.stopPropagation()
            setMuted(sound)
            setSound(!sound)
          }}
        >
          Sound {sound ? "on" : "off"}
        </button>
        <button
          type="button"
          className="rounded-full border-[0.12cqw] border-[#ffe81f] bg-black/80 px-[1.4cqw] py-[0.6cqw] text-[1cqw] font-bold uppercase tracking-[0.2em] text-[#ffe81f] transition hover:bg-[#ffe81f] hover:text-black"
          onClick={(e) => {
            e.stopPropagation()
            setCrawl(true)
          }}
        >
          ▶ Episode IV
        </button>
      </div>

      <AnimatePresence>{crawl && <Crawl key="crawl" onClose={closeCrawl} />}</AnimatePresence>
    </div>
  )
}
