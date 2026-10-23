"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { BlinkArrow, CrtScreen, PixelGrid, SCANLINES, pixel, setMuted, sfx as nes, tone, Typed } from "@/components/nes"

// 8Bit Camp Killer: an NES survival-horror moment.
// The photo's PASS / TAKE box becomes a real menu (hover or arrow keys, click or Enter).
// - TAKE: you get the shoes... the torches die, the mask's eyes light up in the dark,
//   a heartbeat speeds up, "ki ki ki... ma ma ma..." and then he's in your face.
//   GAME OVER, CONTINUE?
// - PASS: you walk away. He noticed anyway.
// Around it: flickering torch light, rising embers, fog and a CRT screen.
// Sounds, sprites and the CRT come from components/nes.tsx.

// where things sit in 1.png (1536x1024), as % of the photo
const BOX = { left: 68.7, top: 4.6, width: 28.1, height: 21 }
const TORCHES = [
  { x: 9.9, y: 38.5 },
  { x: 91.3, y: 42 },
]
const EYES = [
  { x: 43.4, y: 26.4 },
  { x: 47.6, y: 26.4 },
]

type Phase = "menu" | "took" | "dark" | "scare" | "gameover" | "stay" | "passed" | "watched"

const sfx = {
  ...nes,
  whisper: () => [0, 0.18, 0.36].forEach((at) => tone(1900, 0.06, { type: "sawtooth", vol: 0.015, at })),
}

/* =========================
   PIXEL ART
========================= */
// Jason's hockey mask, NES style. X bone, S shade, R red chevrons, B holes, E eyes
const MASK = [
  ".....XXXXXX.....",
  "...XXXXXXXXXX...",
  "..XXXXXXXXXXXXS.",
  ".XXXRXXXXXXRXXXS",
  ".XXRRXXXXXXRRXXS",
  "XXXXXXXXXXXXXXXS",
  "XXBBBBXXXXBBBBXS",
  "XXBBEBXXXXBEBBXS",
  "XXBBBBXXXXBBBBXS",
  "XXXXXXXXXXXXXXXS",
  "XXRXXXXBBXXXXRXS",
  ".XRRXXXXXXXXRRS.",
  ".XXXXBXXXXBXXXS.",
  "..XXXXXXXXXXXS..",
  "..XXBXXBBXXBXS..",
  "...XXXXXXXXXS...",
  "....XXBXXBXS....",
  ".....XXXXXS.....",
]
const MASK_COLORS: Record<string, string> = { X: "#ece6d6", S: "#b9b09a", R: "#d42020", B: "#08060a", E: "#ff2a2a" }

/* =========================
   PAGE-WIDE ATMOSPHERE
========================= */
// Dark cave behind the photo, drifting fog and a CRT screen over everything
export function CampKillerAtmosphere({ image }: { image: string }) {
  const reduce = useReducedMotion()
  return (
    <>
      <div className="fixed inset-0 -z-50 bg-[#05060a]">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-60 blur-3xl"
          style={{ backgroundImage: `url(${image})` }}
        />
      </div>

      {/* fog rolling along the floor */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-[40vh] overflow-hidden">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="absolute bottom-[-10vh] h-[40vh] w-[160vw] blur-2xl"
            style={{
              left: i ? "-20vw" : "-60vw",
              background:
                "radial-gradient(ellipse 30% 50% at 25% 60%, rgba(150,170,200,0.18), transparent), radial-gradient(ellipse 25% 45% at 70% 70%, rgba(130,110,170,0.16), transparent)",
            }}
            animate={reduce ? undefined : { x: i ? ["0vw", "-30vw", "0vw"] : ["0vw", "30vw", "0vw"] }}
            transition={{ duration: 26 + i * 8, ease: "easeInOut", repeat: Infinity }}
          />
        ))}
      </div>

      <CrtScreen reduce={reduce} />
    </>
  )
}

/* =========================
   THE GAME (inside the photo frame)
========================= */
export default function CampKillerFX() {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>("menu")
  const [cursor, setCursor] = useState(1) // 0 = PASS, 1 = TAKE, like the photo
  const [cont, setCont] = useState(0) // GAME OVER: 0 = YES, 1 = NO
  const [sound, setSound] = useState(true)
  const [glint, setGlint] = useState(false)
  const timers = useRef<number[]>([])

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // every so often, while you're browsing, his eyes catch the light
  useEffect(() => {
    if (phase !== "menu") return
    const id = window.setInterval(() => {
      setGlint(true)
      window.setTimeout(() => setGlint(false), 260)
    }, 7000)
    return () => clearInterval(id)
  }, [phase])

  const choose = useCallback(
    (which: number) => {
      if (which === 1) {
        sfx.itemGet()
        setPhase("took")
        later(1700, () => {
          setPhase("dark")
          sfx.sting()
          ;[300, 1100, 1700, 2150, 2500, 2780].forEach((ms) => later(ms, sfx.heartbeat))
          ;[900, 1900].forEach((ms) => later(ms, sfx.whisper))
        })
        later(1700 + 3100, () => {
          setPhase("scare")
          sfx.scare()
        })
        later(1700 + 3100 + 1300, () => {
          setPhase("gameover")
          setCont(0)
          sfx.gameOver()
        })
      } else {
        sfx.select()
        setPhase("passed")
        later(1800, () => {
          setPhase("watched")
          sfx.sting()
        })
        later(1800 + 2600, () => setPhase("menu"))
      }
    },
    [later]
  )

  const answer = useCallback(
    (which: number) => {
      sfx.select()
      if (which === 0) {
        setPhase("menu")
        setCursor(1)
      } else {
        setPhase("stay")
        later(3200, () => {
          setPhase("menu")
          setCursor(1)
        })
      }
    },
    [later]
  )

  // keyboard: arrows move, Enter / Space / Z picks
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const up = e.key === "ArrowUp" || e.key === "ArrowLeft"
      const down = e.key === "ArrowDown" || e.key === "ArrowRight"
      const go = e.key === "Enter" || e.key === " " || e.key.toLowerCase() === "z"
      if (phase === "menu") {
        if (up || down) {
          e.preventDefault()
          setCursor((c) => (up ? 0 : down ? 1 : c))
          sfx.move()
        } else if (go) {
          e.preventDefault()
          choose(cursor)
        }
      } else if (phase === "gameover") {
        if (up || down) {
          e.preventDefault()
          setCont(up ? 0 : 1)
          sfx.move()
        } else if (go) {
          e.preventDefault()
          answer(cont)
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, cursor, cont, choose, answer])

  const dark = phase === "dark"
  const eyesLit = dark || phase === "watched" || glint
  const fullscreen = phase === "scare" || phase === "gameover" || phase === "stay"

  return (
    <div className={`${pixel.className} absolute inset-0 @container`}>
      {/* torch light, flickering; snuffed out when he's coming */}
      {TORCHES.map((t, i) => (
        <div key={i} className="pointer-events-none absolute" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
          <motion.div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
            style={{
              width: "22cqw",
              height: "22cqw",
              background: "radial-gradient(circle, rgba(255,150,40,0.38), rgba(255,90,20,0.12) 40%, transparent 70%)",
            }}
            animate={
              dark
                ? { opacity: 0, scale: 0.4 }
                : reduce
                  ? { opacity: 0.8 }
                  : { opacity: [0.75, 1, 0.6, 0.95, 0.7, 0.9], scale: [1, 1.05, 0.97, 1.03, 0.98, 1] }
            }
            transition={dark ? { duration: 0.5 } : { duration: 1.6 + i * 0.3, repeat: Infinity, ease: "linear" }}
          />
          {/* embers */}
          {!dark &&
            !reduce &&
            [0, 1, 2, 3].map((e) => (
              <motion.span
                key={e}
                className="absolute h-[0.35cqw] w-[0.35cqw] bg-orange-400"
                style={{ left: `${(e - 1.5) * 0.6}cqw`, top: "-3cqw" }}
                animate={{ y: ["0cqw", "-9cqw"], x: ["0cqw", `${(e % 2 ? 1 : -1) * 1.5}cqw`], opacity: [0, 1, 0] }}
                transition={{ duration: 1.8 + e * 0.35, delay: e * 0.5 + i * 0.2, repeat: Infinity, ease: "easeOut" }}
              />
            ))}
        </div>
      ))}

      {/* lights out, across the whole page (it spills far past the frame; the page clips it) */}
      <motion.div
        className="pointer-events-none absolute -inset-[150vmax] bg-[#020104]"
        animate={{ opacity: dark ? 0.9 : phase === "watched" ? 0.45 : 0 }}
        transition={{ duration: dark ? 0.6 : 0.4 }}
      />
      {/* red pulse in the dark, in time with the heartbeat */}
      {(dark || phase === "watched") && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 45% 30%, rgba(160,0,0,0.35), transparent 60%)" }}
          animate={{ opacity: [0, 1, 0.2, 0.9, 0] }}
          transition={{ duration: dark ? 0.9 : 1.3, repeat: Infinity }}
        />
      )}

      {/* the eyes */}
      <AnimatePresence>
        {eyesLit &&
          EYES.map((e, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute h-[0.9cqw] w-[0.9cqw] -translate-x-1/2 -translate-y-1/2 bg-red-500"
              style={{ left: `${e.x}%`, top: `${e.y}%`, boxShadow: "0 0 1cqw 0.4cqw rgba(255,30,30,0.9)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: glint && !dark ? 0.08 : 0.5 }}
            />
          ))}
      </AnimatePresence>

      {/* ki ki ki... ma ma ma... */}
      {dark && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[8%] text-center text-[1.6cqw] tracking-widest text-red-500 [text-shadow:0_0_0.8cqw_rgba(255,0,0,0.8)]">
          <Typed text="ki ki ki..." delay={0.8} perChar={0.09} />
          <br />
          <Typed text="ma ma ma..." delay={1.9} perChar={0.09} />
        </div>
      )}

      {/* the PASS / TAKE box, painted over the one in the photo */}
      <div
        className="absolute border-[0.45cqw] border-[#f4f0e8] bg-[#06070b] text-[#f4f0e8]"
        style={{ left: `${BOX.left}%`, top: `${BOX.top}%`, width: `${BOX.width}%`, height: `${BOX.height}%` }}
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "menu" ? (
          <ul className="flex h-full flex-col justify-center gap-[2.2cqw] pl-[11cqw] text-[3cqw] leading-none" role="menu">
            {["PASS", "TAKE"].map((label, i) => (
              <li key={label} role="none" className="relative">
                {cursor === i && (
                  <BlinkArrow color="#f4f0e8" className="absolute -left-[7cqw] top-1/2 w-[4.6cqw] -translate-y-1/2" />
                )}
                <button
                  type="button"
                  role="menuitem"
                  className="cursor-pointer outline-none"
                  onMouseEnter={() => {
                    if (cursor !== i) sfx.move()
                    setCursor(i)
                  }}
                  onFocus={() => setCursor(i)}
                  onClick={() => choose(i)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full flex-col justify-center px-[2cqw] text-[1.55cqw] leading-[2.4cqw]">
            {phase === "took" && (
              <>
                <Typed text="YOU TOOK" />
                <Typed text="THE SHOES." delay={0.45} />
              </>
            )}
            {(phase === "dark" || phase === "scare") && <Typed text="...RUN." perChar={0.18} />}
            {phase === "passed" && (
              <>
                <Typed text="YOU LEFT" />
                <Typed text="THE SHOES." delay={0.45} />
              </>
            )}
            {phase === "watched" && (
              <div className="flex flex-col text-red-500">
                <Typed text="BUT HE SAW" />
                <Typed text="YOU LOOK." delay={0.6} />
              </div>
            )}
            {(phase === "gameover" || phase === "stay") && <span className="opacity-40">. . .</span>}
          </div>
        )}
      </div>

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

      {/* the jump scare and GAME OVER take over the whole screen */}
      {fullscreen &&
        createPortal(
          <div className={`${pixel.className} fixed inset-0 z-[100] select-none`}>
            <AnimatePresence mode="wait">
              {phase === "scare" && (
                <motion.div
                  key="scare"
                  className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black"
                  animate={reduce ? undefined : { x: [0, -24, 22, -18, 16, -10, 8, 0], y: [0, 14, -12, 10, -8, 4, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  {/* red / white strobe */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{ backgroundColor: ["#fff", "#900", "#000", "#c00", "#000", "#600", "#000"] }}
                    transition={{ duration: 0.7, ease: "linear" }}
                  />
                  <motion.div
                    initial={{ scale: 0.15, rotate: -6 }}
                    animate={{ scale: [0.15, 1.15, 1.05, 1.25], rotate: [-6, 3, -2, 0] }}
                    transition={{ duration: 0.9, times: [0, 0.25, 0.5, 1], ease: "easeOut" }}
                    className="relative h-[85vh] [filter:drop-shadow(0_0_40px_rgba(255,0,0,0.7))]"
                  >
                    <PixelGrid rows={MASK} colors={MASK_COLORS} className="h-full w-auto" />
                  </motion.div>
                  {/* glitch bars */}
                  {!reduce &&
                    [18, 47, 71].map((top, i) => (
                      <motion.div
                        key={top}
                        className="absolute inset-x-0 h-[3vh] bg-red-600/50 mix-blend-screen"
                        style={{ top: `${top}%` }}
                        animate={{ x: ["-30vw", "30vw", "-10vw"], opacity: [0, 1, 0] }}
                        transition={{ duration: 0.25, delay: 0.2 + i * 0.15, repeat: 2 }}
                      />
                    ))}
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
                  <PixelGrid rows={MASK} colors={{ ...MASK_COLORS, E: "#ff0000" }} className="h-24 w-auto opacity-80" />
                  <h2 className="text-4xl text-red-600 [text-shadow:0_0_18px_rgba(255,0,0,0.7)] md:text-6xl">
                    GAME OVER
                  </h2>
                  <p className="text-xs leading-6 text-white/70 md:text-sm">
                    JASON GOT YOU.
                    <br />
                    THE SHOES STAY AT CAMP.
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
                          {cont === i && (
                            <BlinkArrow color="#fff" className="absolute -left-10 top-1/2 w-7 -translate-y-1/2" />
                          )}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {phase === "stay" && (
                <motion.div
                  key="stay"
                  className="absolute inset-0 flex items-center justify-center bg-black px-6 text-center text-sm leading-8 text-red-500 md:text-base"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p>
                    <Typed text="THEN STAY." perChar={0.08} />
                    <br />
                    <Typed text="FOREVER." delay={1} perChar={0.12} />
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {/* CRT lines over the takeover too */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: SCANLINES }}
            />
          </div>,
          document.body
        )}
    </div>
  )
}
