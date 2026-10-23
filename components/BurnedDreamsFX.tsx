"use client"

import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import type { CSSProperties } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { BlinkArrow, CrtScreen, PixelGrid, SCANLINES, pixel, setMuted, sfx as nes, noise, tone, Typed } from "@/components/nes"

// Burned Dreams: an NES Elm Street nightmare. "STAY AWAKE."
// - PRESS START, and your SLEEP meter starts filling. Drink coffee (click the cup or press C)
//   to push it back down, but there are only so many cups.
// - The sleepier you get, the more the photo warps and sours, as the dream creeps in.
// - Fall asleep and you're in his world: mash (click / any key) to WAKE UP! before time runs out.
//   Make it and you wake, a little harder each time. Don't, and the claws come out:
//   slashes across the screen, he lunges, GAME OVER, CONTINUE?
// Around it: firelight flickering, embers rising and a CRT screen. Sounds, sprites and
// the CRT come from components/nes.tsx.

// where things sit in burned_dreams.jpg (3000x2000), as % of the photo
const FIRE = { x: 22, y: 24 }
const HEART = { x: 41, y: 60 }
const BOX = { left: 64, top: 4, width: 33, height: 19 }

const FILL_SECONDS = 7 // a full SLEEP meter from empty, on the first round
const COFFEE_START = 3
const MASH_SECONDS = 4

type Phase = "title" | "awake" | "dream" | "woke" | "slash" | "scare" | "gameover" | "sweet"

const sfx = {
  ...nes,
  sip: () => [700, 900, 1200].forEach((f, i) => tone(f, 0.07, { at: i * 0.06, vol: 0.05 })),
  empty: () => tone(140, 0.25, { vol: 0.06 }),
  // music-box lullaby notes, one per SLEEP segment
  lull: (step: number) => tone([659, 587, 523, 494, 440, 494, 523, 415][step % 8] * 2, 0.6, { type: "triangle", vol: 0.05 }),
  musicBox: () =>
    [659, 659, 587, 523, 587, 494, 440, 0, 659, 659, 587, 523, 415, 440].forEach((f, i) =>
      f ? tone(f * 2, 0.35, { type: "triangle", vol: 0.05, at: i * 0.27 }) : null
    ),
  mash: (p: number) => tone(300 + p * 900, 0.05, { vol: 0.05 }),
  slash: (i: number) => {
    noise(0.18, 0.3)
    tone(2400 - i * 300, 0.18, { type: "sawtooth", vol: 0.07, to: 300 })
  },
}

/* =========================
   PIXEL ART
========================= */
// Freddy, NES style. h/H hat, F face, f scars, E eyes, B black, T teeth, R/G sweater stripes
const FREDDY = [
  "....hhhhhhhh....",
  "...hHHHHHHHHh...",
  "...hHHHHHHHHh...",
  "..hhhhhhhhhhhh..",
  "hhHHHHHHHHHHHHhh",
  "..FFfFFFFFfFFF..",
  "..FfFFFfFFFFfF..",
  ".FFEEFFFFFFEEFF.",
  ".FFEBFfFFFFBEfF.",
  ".fFFFFFFFFFFFFF.",
  ".FFfFFFBBFFFfFF.",
  "..FFFFFFFFFFfF..",
  "..FFTBTBTBTBFF..",
  "..FFBBBBBBBBFF..",
  "...fFFFFFFFFf...",
  "..RRRGGGRRRGGG..",
  ".RRRGGGRRRGGGRR.",
  "RRRGGGRRRGGGRRRG",
]
const FREDDY_COLORS: Record<string, string> = {
  h: "#2e2014",
  H: "#5e4128",
  F: "#b5503c",
  f: "#7a2a1f",
  E: "#f2d230",
  B: "#0a0606",
  T: "#e8dcc0",
  R: "#b3201c",
  G: "#1f6b2a",
}

const CUP = ["..s.s...", ".s.s....", "WWWWWW..", "WCCCCWWW", "WCCCCW.W", "WWWWWWWW", "WWWWWW..", ".WWWW..."]
const CUP_COLORS = { s: "#9aa0a8", W: "#f4f0e8", C: "#5a3216" }

/* =========================
   PAGE-WIDE ATMOSPHERE
========================= */
function seeded(n: number) {
  const s = Math.sin(n * 9301 + 49297) * 233280
  return s - Math.floor(s)
}

const EMBERS = Array.from({ length: 26 }, (_, i) => ({
  left: seeded(i) * 100,
  size: 3 + Math.round(seeded(i + 50) * 3),
  duration: 6 + seeded(i + 100) * 7,
  delay: seeded(i + 150) * 8,
  drift: (seeded(i + 200) - 0.5) * 12,
}))

// Warm dark room behind the photo, embers drifting up the page, CRT over everything
export function BurnedDreamsAtmosphere({ image }: { image: string }) {
  const reduce = useReducedMotion()
  return (
    <>
      <div className="fixed inset-0 -z-50 bg-[#0d0604]">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-55 blur-3xl"
          style={{ backgroundImage: `url(${image})` }}
        />
      </div>

      {!reduce && (
        <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
          {EMBERS.map((e, i) => (
            <motion.span
              key={i}
              className="absolute bottom-[-2vh] bg-orange-400 shadow-[0_0_6px_rgba(255,140,40,0.9)]"
              style={{ left: `${e.left}%`, width: e.size, height: e.size }}
              animate={{ y: ["0vh", "-105vh"], x: ["0vw", `${e.drift}vw`], opacity: [0, 1, 1, 0] }}
              transition={{ duration: e.duration, delay: e.delay, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </div>
      )}

      <CrtScreen reduce={reduce} />
    </>
  )
}

/* =========================
   THE GAME (inside the photo frame)
========================= */
export default function BurnedDreamsFX({ image, fade }: { image: string; fade?: CSSProperties }) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>("title")
  const [sleep, setSleep] = useState(0)
  const [coffee, setCoffee] = useState(COFFEE_START)
  const [round, setRound] = useState(0) // times you've woken up
  const [mash, setMash] = useState(0) // 0..1 progress toward waking
  const [cont, setCont] = useState(0) // GAME OVER: 0 = YES, 1 = NO
  const [sound, setSound] = useState(true)
  const [sipKey, setSipKey] = useState(0)

  const sleepRef = useRef(0)
  const mashRef = useRef(0)
  const roundRef = useRef(0)
  const timers = useRef<number[]>([])

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const need = 10 + round * 4 // clicks to wake up this round

  const start = useCallback(() => {
    sfx.itemGet()
    sleepRef.current = 0
    roundRef.current = 0
    setSleep(0)
    setRound(0)
    setCoffee(COFFEE_START)
    setPhase("awake")
  }, [])

  const fallAsleep = useCallback(() => {
    setPhase("dream")
    mashRef.current = 0
    setMash(0)
    sfx.sting()
    sfx.musicBox()
    ;[0, 700, 1300, 1800, 2200, 2550, 2850, 3100, 3350].forEach((ms) => later(ms, sfx.heartbeat))
  }, [later])

  // the SLEEP meter fills on its own, a little faster every time you wake
  useEffect(() => {
    if (phase !== "awake") return
    const id = window.setInterval(() => {
      const before = sleepRef.current
      const after = Math.min(1, before + (0.1 / FILL_SECONDS) * (1 + roundRef.current * 0.3))
      sleepRef.current = after
      setSleep(after)
      if (Math.floor(after * 8) > Math.floor(before * 8)) sfx.lull(Math.floor(after * 8))
      if (after >= 1) {
        window.clearInterval(id)
        fallAsleep()
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [phase, fallAsleep])

  // in the dream: wake up in time, or he gets you
  useEffect(() => {
    if (phase !== "dream") return
    const id = window.setTimeout(() => {
      setPhase("slash")
      ;[0, 1, 2, 3].forEach((i) => later(i * 110, () => sfx.slash(i)))
      later(900, () => {
        setPhase("scare")
        sfx.scare()
      })
      later(900 + 1300, () => {
        setPhase("gameover")
        setCont(0)
        sfx.gameOver()
      })
    }, MASH_SECONDS * 1000)
    return () => window.clearTimeout(id)
  }, [phase, later])

  const drink = useCallback(() => {
    if (coffee <= 0) {
      sfx.empty()
      return
    }
    sfx.sip()
    setCoffee((c) => c - 1)
    setSipKey((k) => k + 1)
    sleepRef.current = Math.max(0, sleepRef.current - 0.45)
    setSleep(sleepRef.current)
  }, [coffee])

  const struggle = useCallback(() => {
    mashRef.current = Math.min(1, mashRef.current + 1 / need)
    setMash(mashRef.current)
    sfx.mash(mashRef.current)
    if (mashRef.current >= 1) {
      setPhase("woke")
      sfx.itemGet()
      roundRef.current += 1
      setRound(roundRef.current)
      sleepRef.current = 0
      setSleep(0)
      setCoffee((c) => c + 1) // a fresh cup for making it out
      later(1700, () => setPhase("awake"))
    }
  }, [need, later])

  const answer = useCallback(
    (which: number) => {
      sfx.select()
      if (which === 0) {
        setPhase("title")
        sleepRef.current = 0
        setSleep(0)
      } else {
        setPhase("sweet")
        later(3000, () => {
          setPhase("title")
          sleepRef.current = 0
          setSleep(0)
        })
      }
    },
    [later]
  )

  // mash anywhere on the page while dreaming
  useEffect(() => {
    if (phase !== "dream") return
    const onDown = (e: PointerEvent) => {
      e.preventDefault()
      struggle()
    }
    window.addEventListener("pointerdown", onDown)
    return () => window.removeEventListener("pointerdown", onDown)
  }, [phase, struggle])

  // keyboard: Enter / Space starts, C (or Space) drinks coffee, any key mashes, arrows + Enter for CONTINUE
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return
      const k = e.key.toLowerCase()
      const go = k === "enter" || k === " " || k === "z"
      if (phase === "title" && go) {
        e.preventDefault()
        start()
      } else if (phase === "awake" && (k === "c" || k === " ")) {
        e.preventDefault()
        drink()
      } else if (phase === "dream" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        struggle()
      } else if (phase === "gameover") {
        if (k === "arrowleft" || k === "arrowup" || k === "arrowright" || k === "arrowdown") {
          e.preventDefault()
          setCont(k === "arrowleft" || k === "arrowup" ? 0 : 1)
          sfx.move()
        } else if (go) {
          e.preventDefault()
          answer(cont)
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, cont, start, drink, struggle, answer])

  const dreaming = phase === "dream" || phase === "slash"
  // how far the dream has crept into the photo
  const creep = dreaming ? 1 : phase === "awake" ? Math.max(0, (sleep - 0.25) / 0.75) : 0
  const fullscreen = phase === "slash" || phase === "scare" || phase === "gameover" || phase === "sweet"

  return (
    <div className={`${pixel.className} absolute inset-0 @container`}>
      {/* firelight flickering out of the fireplace */}
      <motion.div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
        style={{
          left: `${FIRE.x}%`,
          top: `${FIRE.y}%`,
          width: "60cqw",
          height: "45cqw",
          background: "radial-gradient(ellipse, rgba(255,150,40,0.35), rgba(255,80,10,0.12) 45%, transparent 70%)",
        }}
        animate={reduce ? { opacity: 0.8 } : { opacity: [0.6, 1, 0.7, 0.95, 0.55, 0.9], scale: [1, 1.04, 0.98, 1.03, 0.97, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
      />

      {/* the dream creeping in: a warped, soured copy of the photo fading over it */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id="bd-warp">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.014" numOctaves="2" seed="7">
            {!reduce && (
              <animate attributeName="baseFrequency" dur="5s" values="0.006 0.014;0.01 0.022;0.006 0.014" repeatCount="indefinite" />
            )}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale={dreaming ? 70 : 6 + creep * 30} />
        </filter>
      </svg>
      {creep > 0 && (
        <div className="pointer-events-none absolute inset-0" style={{ opacity: dreaming ? 1 : creep * 0.85 }}>
          <Image
            src={image}
            alt=""
            fill
            draggable={false}
            className="object-contain select-none"
            style={{ ...fade, filter: `url(#bd-warp) hue-rotate(${dreaming ? 150 : creep * 90}deg) saturate(${1 + creep}) contrast(1.15)` }}
          />
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{
              ...fade,
              background: dreaming
                ? "linear-gradient(180deg, rgba(120,0,20,0.75), rgba(10,60,20,0.75))"
                : "linear-gradient(180deg, rgba(80,40,120,0.5), rgba(20,70,40,0.5))",
            }}
          />
        </div>
      )}

      {/* Zzz drifting up as you nod off */}
      {phase === "awake" && sleep > 0.35 && !reduce && (
        <div className="pointer-events-none absolute" style={{ left: "52%", top: "30%" }}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute text-[2cqw] text-white/80"
              animate={{ y: ["0cqw", "-10cqw"], x: ["0cqw", `${2 + i}cqw`], opacity: [0, 1, 0], scale: [0.6, 1.2] }}
              transition={{ duration: 2.4 - sleep, delay: i * 0.6, repeat: Infinity, ease: "easeOut" }}
            >
              Z
            </motion.span>
          ))}
        </div>
      )}

      {/* the pixel heart on the shoe beats along in the dream */}
      {dreaming && (
        <motion.div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/60 blur-xl mix-blend-screen"
          style={{ left: `${HEART.x}%`, top: `${HEART.y}%`, width: "9cqw", height: "9cqw" }}
          animate={{ scale: [0.8, 1.3, 0.9, 1.25, 0.8], opacity: [0.4, 1, 0.5, 0.9, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity }}
        />
      )}

      {/* NES box: title card, then the HUD */}
      <div
        className="absolute flex flex-col justify-center gap-[1.2cqw] border-[0.4cqw] border-[#f4f0e8] bg-[#0b0605] px-[1.6cqw] text-[#f4f0e8]"
        style={{ left: `${BOX.left}%`, top: `${BOX.top}%`, width: `${BOX.width}%`, height: `${BOX.height}%` }}
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "title" || phase === "gameover" || phase === "sweet" ? (
          <>
            <p className="text-[2.1cqw] leading-none text-orange-400">BURNED DREAMS</p>
            <p className="text-[1.2cqw] leading-[1.8cqw] text-white/80">
              STAY AWAKE.
              <br />
              DON&apos;T FALL ASLEEP.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-[1cqw] text-[1.3cqw]">
              <span>SLEEP</span>
              <div className="flex flex-1 gap-[0.3cqw]">
                {Array.from({ length: 8 }, (_, i) => (
                  <span
                    key={i}
                    className="h-[1.6cqw] flex-1 border-[0.15cqw] border-[#f4f0e8]"
                    style={{
                      background: (dreaming ? 1 : sleep) * 8 > i ? (i < 4 ? "#8a5cd0" : i < 6 ? "#d07a20" : "#e02020") : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-[1.3cqw]">
              <button
                type="button"
                className="flex cursor-pointer items-center gap-[0.8cqw] outline-none disabled:cursor-default"
                onClick={drink}
                disabled={phase !== "awake"}
                aria-label={`Drink coffee, ${coffee} left`}
              >
                <motion.span key={sipKey} className="block w-[2.6cqw]" animate={sipKey ? { y: [0, -6, 0], rotate: [0, -20, 0] } : undefined}>
                  <PixelGrid rows={CUP} colors={CUP_COLORS} className="block h-auto w-full" />
                </motion.span>
                <span className={coffee === 0 ? "text-red-500" : ""}>x{coffee}</span>
              </button>
              <span className="text-[1cqw] text-white/60">WOKE x{round}</span>
            </div>
            <p className="text-[0.9cqw] text-white/50">
              {phase === "awake" ? (coffee ? "C / CLICK CUP = COFFEE" : "NO COFFEE LEFT...") : phase === "woke" ? "" : "WAKE UP!!"}
            </p>
          </>
        )}
      </div>

      {/* PRESS START */}
      {phase === "title" && (
        <button
          type="button"
          className="absolute bottom-[6%] left-1/2 -translate-x-1/2 cursor-pointer bg-black/70 px-[2cqw] py-[1cqw] text-[1.8cqw] text-[#f4f0e8] outline-none"
          onClick={(e) => {
            e.stopPropagation()
            start()
          }}
        >
          <motion.span
            className="inline-block"
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, times: [0, 0.6, 0.61, 1] }}
          >
            PRESS START
          </motion.span>
        </button>
      )}

      {/* the dream: mash to wake up */}
      {phase === "dream" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[2cqw]">
          <motion.p
            className="text-[5cqw] text-[#f2d230] [text-shadow:0.3cqw_0.3cqw_0_#7a0a0a]"
            animate={reduce ? undefined : { scale: [1, 1.12, 1], rotate: [-2, 2, -2] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            WAKE UP!
          </motion.p>
          <div className="h-[2cqw] w-[40cqw] border-[0.3cqw] border-[#f4f0e8] bg-black/70">
            <div className="h-full bg-[#f2d230]" style={{ width: `${mash * 100}%` }} />
          </div>
          <p className="text-[1.3cqw] text-white">CLICK! CLICK! CLICK!</p>
        </div>
      )}

      {/* made it out */}
      <AnimatePresence>
        {phase === "woke" && (
          <motion.div
            key="woke"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            initial={{ backgroundColor: "rgba(255,255,255,1)" }}
            animate={{ backgroundColor: "rgba(255,255,255,0)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="bg-black/80 px-[2cqw] py-[1.2cqw] text-[2.4cqw] text-[#f2d230]">
              <Typed text="YOU WOKE UP!" perChar={0.04} />
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* sound toggle */}
      <button
        type="button"
        className="absolute bottom-[2%] right-[3%] text-[1cqw] text-white/60 hover:text-white"
        onClick={(e) => {
          e.stopPropagation()
          setMuted(sound)
          setSound(!sound)
        }}
      >
        SOUND {sound ? "ON" : "OFF"}
      </button>

      {/* claws, the jump scare and GAME OVER take over the whole screen */}
      {fullscreen &&
        createPortal(
          <div className={`${pixel.className} fixed inset-0 z-[100] select-none`}>
            <AnimatePresence mode="wait">
              {phase === "slash" && (
                <motion.div key="slash" className="absolute inset-0 overflow-hidden" exit={{ opacity: 0 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute left-[-5vw] h-[4.5vh] w-[125vw] origin-left"
                      style={{
                        top: `${68 + i * 11}%`,
                        rotate: -24,
                        background: "linear-gradient(180deg, transparent, #2a0000 20%, #d01010 45%, #ffd0c0 50%, #d01010 55%, #2a0000 80%, transparent)",
                        boxShadow: "0 0 30px rgba(255,0,0,0.6)",
                      }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.12, delay: i * 0.11, ease: "easeIn" }}
                    />
                  ))}
                  <motion.div
                    className="absolute inset-0 bg-red-700 mix-blend-multiply"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.6, 0.2, 0.7] }}
                    transition={{ duration: 0.8 }}
                  />
                </motion.div>
              )}

              {phase === "scare" && (
                <motion.div
                  key="scare"
                  className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black"
                  animate={reduce ? undefined : { x: [0, -24, 22, -18, 16, -10, 8, 0], y: [0, 14, -12, 10, -8, 4, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.div
                    className="absolute inset-0"
                    animate={{ backgroundColor: ["#fff", "#a33", "#000", "#1f6b2a", "#000", "#b3201c", "#000"] }}
                    transition={{ duration: 0.7, ease: "linear" }}
                  />
                  <motion.div
                    initial={{ scale: 0.15, rotate: 8 }}
                    animate={{ scale: [0.15, 1.15, 1.05, 1.25], rotate: [8, -3, 2, 0] }}
                    transition={{ duration: 0.9, times: [0, 0.25, 0.5, 1], ease: "easeOut" }}
                    className="relative h-[88vh] [filter:drop-shadow(0_0_40px_rgba(255,120,0,0.6))]"
                  >
                    <PixelGrid rows={FREDDY} colors={FREDDY_COLORS} className="h-full w-auto" />
                  </motion.div>
                </motion.div>
              )}

              {phase === "gameover" && (
                <motion.div
                  key="over"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-12 bg-black text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <PixelGrid rows={FREDDY} colors={FREDDY_COLORS} className="h-24 w-auto" />
                  <h2 className="text-4xl text-orange-500 [text-shadow:0_0_18px_rgba(255,90,0,0.7)] md:text-6xl">GAME OVER</h2>
                  <p className="text-xs leading-6 text-white/70 md:text-sm">
                    YOU FELL ASLEEP.
                    <br />
                    TIMES YOU WOKE UP: {round}
                  </p>
                  <div className="text-lg text-white md:text-xl">
                    <p className="mb-6">CONTINUE?</p>
                    <div className="flex justify-center gap-14">
                      {["YES", "NO"].map((label, i) => (
                        <button
                          key={label}
                          type="button"
                          className="relative cursor-pointer outline-none"
                          onMouseEnter={() => {
                            if (cont !== i) sfx.move()
                            setCont(i)
                          }}
                          onClick={() => answer(i)}
                        >
                          {cont === i && <BlinkArrow color="#fff" className="absolute -left-10 top-1/2 w-7 -translate-y-1/2" />}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {phase === "sweet" && (
                <motion.div
                  key="sweet"
                  className="absolute inset-0 flex items-center justify-center bg-black px-6 text-center text-sm leading-8 text-orange-500 md:text-base"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p>
                    <Typed text="SWEET DREAMS." perChar={0.09} />
                    <br />
                    <Typed text="SEE YOU TONIGHT." delay={1.3} perChar={0.09} />
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-0" style={{ background: SCANLINES }} />
          </div>,
          document.body
        )}
    </div>
  )
}
