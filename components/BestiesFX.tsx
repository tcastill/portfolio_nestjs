"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Bangers } from "next/font/google"
import { useCallback, useEffect, useRef, useState } from "react"

// Comic effects for the Besties (Wolverine × Deadpool) page:
// - on load the shoes "collide": impact flash, spark ring, screen shake and a WHAM!
// - click the right side to slash three glowing claw marks with a SNIKT!,
//   which then heal
// - click the left side to fire a shot: muzzle flash, bullet hole, BLAM!
//   and a curl of comic smoke rising from the hole

const comic = Bangers({ subsets: ["latin"], weight: "400" })

type Slash = { id: number; x: number; y: number; angle: number; flip: boolean }

type Shot = { id: number; x: number; y: number; tilt: number }

const HEAL_MS = 2600
const SHOT_MS = 3200
const WORDS = ["SNIKT!", "SNIKT!", "SHHNK!", "SNIKT!"]
const SHOT_WORDS = ["BLAM!", "BANG!", "BLAM!", "BAKOOM!"]

function shakeMain(strength: number) {
  const main = document.querySelector("main")
  if (!main || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const s = strength
  main.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: `translate(${-s}px, ${s * 0.6}px)` },
      { transform: `translate(${s}px, ${-s * 0.6}px)` },
      { transform: `translate(${-s * 0.6}px, ${s * 0.4}px)` },
      { transform: `translate(${s * 0.4}px, 0)` },
      { transform: "translate(0, 0)" },
    ],
    { duration: 380, easing: "ease-out" }
  )
}

// Three curved claw marks, drawn on quickly then left to heal
function ClawMarks({ slash }: { slash: Slash }) {
  const paths = [
    "M 10 0 C 40 60, 70 120, 95 190",
    "M 45 -10 C 75 55, 105 120, 130 195",
    "M 80 -5 C 110 60, 140 125, 165 185",
  ]

  return (
    <motion.svg
      viewBox="-10 -20 190 230"
      className="pointer-events-none absolute h-[260px] w-[220px] overflow-visible"
      style={{
        left: slash.x,
        top: slash.y,
        translateX: "-50%",
        translateY: "-50%",
        rotate: slash.angle,
        scaleX: slash.flip ? -1 : 1,
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0], scale: [1, 1, 0.92] }}
      transition={{ duration: HEAL_MS / 1000, times: [0, 0.55, 1], ease: "easeIn" }}
    >
      <defs>
        <filter id={`glow-${slash.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {paths.map((d, i) => (
        <g key={i} filter={`url(#glow-${slash.id})`}>
          {/* glowing yellow gash */}
          <motion.path
            d={d}
            fill="none"
            stroke="#ffd21f"
            strokeWidth={11}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.13, delay: i * 0.035, ease: "easeOut" }}
          />
          {/* hot white core */}
          <motion.path
            d={d}
            fill="none"
            stroke="#fffbe6"
            strokeWidth={4}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.13, delay: i * 0.035, ease: "easeOut" }}
          />
        </g>
      ))}
    </motion.svg>
  )
}

// Bullet hole with a muzzle flash and comic smoke curling up out of it
function Gunshot({ shot }: { shot: Shot }) {
  // wavy ribbons of smoke, drawn upward from the hole (0,0)
  const wisps = [
    "M 0 0 C -22 -30, 26 -60, 2 -95 S -30 -140, -6 -180",
    "M 2 -6 C 28 -36, -8 -66, 18 -100 S 40 -140, 20 -170",
  ]
  // billows that swell along the ribbons
  const puffs = [
    { cx: -4, cy: -40, r: 16, d: 0.15 },
    { cx: 10, cy: -82, r: 20, d: 0.35 },
    { cx: -12, cy: -125, r: 23, d: 0.55 },
    { cx: 8, cy: -160, r: 19, d: 0.75 },
  ]

  return (
    <div className="pointer-events-none absolute" style={{ left: shot.x, top: shot.y }}>
      {/* muzzle flash */}
      <motion.svg
        viewBox="-60 -60 120 120"
        className="absolute h-[170px] w-[170px]"
        style={{ translateX: "-50%", translateY: "-50%" }}
        initial={{ scale: 0.3, opacity: 1, rotate: shot.tilt }}
        animate={{ scale: [0.3, 1.2, 1.4], opacity: [1, 1, 0] }}
        transition={{ duration: 0.32, times: [0, 0.5, 1], ease: "easeOut" }}
      >
        <polygon
          points="0,-58 12,-18 52,-30 22,0 56,26 14,16 0,58 -12,16 -54,24 -20,0 -50,-32 -12,-18"
          fill="#ffe14d"
          stroke="#111"
          strokeWidth="4"
        />
        <polygon points="0,-30 7,-9 28,-14 11,0 28,14 7,9 0,30 -7,9 -28,14 -11,0 -28,-14 -7,-9" fill="#fff" />
      </motion.svg>

      {/* bullet hole */}
      <motion.svg
        viewBox="-40 -40 80 80"
        className="absolute h-[70px] w-[70px]"
        style={{ rotate: shot.tilt, translateX: "-50%", translateY: "-50%" }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.1, 1, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: SHOT_MS / 1000, times: [0, 0.04, 0.7, 1] }}
      >
        <g stroke="#111" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M 0 0 L 30 -10 M 0 0 L 22 26 M 0 0 L -12 32 M 0 0 L -32 6 M 0 0 L -18 -28 M 0 0 L 8 -34" />
        </g>
        <circle r="13" fill="#2a2a2a" stroke="#111" strokeWidth="3" />
        <circle r="7" fill="#000" />
        <circle cx="-4" cy="-4" r="3" fill="#ffffff55" />
      </motion.svg>

      {/* comic smoke curling up out of the hole */}
      <motion.svg
        viewBox="-70 -200 140 210"
        className="absolute h-[210px] w-[140px]"
        style={{ top: -200, translateX: "-50%" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, -30, -70] }}
        transition={{ duration: SHOT_MS / 1000, times: [0, 0.08, 0.6, 1], ease: "easeOut" }}
      >
        {/* outline pass, then fill pass, so overlapping billows read as one cloud */}
        {(["#4a4a4a", "#d6d6d6"] as const).map((color, pass) => (
          <g key={color}>
            {wisps.map((d, i) => (
              <motion.path
                key={i}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={(pass === 0 ? 22 : 15) - i * 4}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9 + i * 0.25, delay: 0.06 + i * 0.12, ease: "easeOut" }}
              />
            ))}
            {puffs.map((p, i) => (
              <motion.circle
                key={i}
                cx={p.cx}
                cy={p.cy}
                fill={color}
                initial={{ r: 0 }}
                animate={{ r: pass === 0 ? p.r + 4 : p.r }}
                transition={{ duration: 0.7, delay: p.d, ease: "easeOut" }}
              />
            ))}
          </g>
        ))}
        {/* soft highlight */}
        {puffs.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.cx - p.r * 0.3}
            cy={p.cy - p.r * 0.3}
            fill="#f4f4f4"
            initial={{ r: 0 }}
            animate={{ r: p.r * 0.35 }}
            transition={{ duration: 0.7, delay: p.d + 0.1, ease: "easeOut" }}
          />
        ))}
      </motion.svg>
    </div>
  )
}

function ComicWord({
  text,
  x,
  y,
  size,
  rotate,
  fill,
}: {
  text: string
  x: number | string
  y: number | string
  size: string
  rotate: number
  fill: string
}) {
  return (
    <motion.div
      className={`${comic.className} pointer-events-none absolute select-none whitespace-nowrap leading-none`}
      style={{
        left: x,
        top: y,
        translateX: "-50%",
        translateY: "-50%",
        fontSize: size,
        color: fill,
        WebkitTextStroke: "0.06em #111",
        paintOrder: "stroke fill",
        textShadow: "0.08em 0.08em 0 #111",
        letterSpacing: "0.02em",
      }}
      initial={{ scale: 0.2, rotate: rotate - 25, opacity: 0 }}
      animate={{ scale: [0.2, 1.25, 1], rotate, opacity: 1 }}
      exit={{ scale: 1.4, opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {text}
    </motion.div>
  )
}

export default function BestiesFX() {
  const [intro, setIntro] = useState(true)
  const [showWham, setShowWham] = useState(false)
  const [slashes, setSlashes] = useState<Slash[]>([])
  const [shots, setShots] = useState<Shot[]>([])
  const [words, setWords] = useState<{ id: number; x: number; y: number; text: string; rotate: number }[]>([])
  const [hint, setHint] = useState(false)
  const idRef = useRef(0)

  // Collision intro
  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setShowWham(true)
        shakeMain(14)
      }, 250),
      setTimeout(() => setShowWham(false), 1500),
      setTimeout(() => setIntro(false), 900),
      setTimeout(() => setHint(true), 1700),
      setTimeout(() => setHint(false), 6500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const slash = useCallback((e: PointerEvent) => {
    // leave links and buttons alone
    if ((e.target as HTMLElement).closest("a, button")) return

    const id = idRef.current++

    // left half: gunshot
    if (e.clientX < window.innerWidth / 2) {
      setShots((list) => [...list.slice(-8), { id, x: e.clientX, y: e.clientY, tilt: Math.random() * 360 }])
      setWords((list) => [
        ...list.slice(-3),
        {
          id,
          x: e.clientX + 110,
          y: e.clientY - 80,
          text: SHOT_WORDS[id % SHOT_WORDS.length],
          rotate: -14 + Math.random() * 28,
        },
      ])
      setHint(false)
      shakeMain(8)
      setTimeout(() => setWords((list) => list.filter((w) => w.id !== id)), 900)
      setTimeout(() => setShots((list) => list.filter((x) => x.id !== id)), SHOT_MS)
      return
    }

    // right half: claw slash
    const s: Slash = {
      id,
      x: e.clientX,
      y: e.clientY,
      angle: -35 + Math.random() * 50,
      flip: Math.random() < 0.5,
    }
    setSlashes((list) => [...list.slice(-6), s])
    setWords((list) => [
      ...list.slice(-3),
      {
        id,
        x: e.clientX + (s.flip ? -120 : 120),
        y: e.clientY - 90,
        text: WORDS[id % WORDS.length],
        rotate: -12 + Math.random() * 24,
      },
    ])
    setHint(false)
    shakeMain(6)

    setTimeout(() => setWords((list) => list.filter((w) => w.id !== id)), 900)
    setTimeout(() => setSlashes((list) => list.filter((x) => x.id !== id)), HEAL_MS)
  }, [])

  useEffect(() => {
    window.addEventListener("pointerdown", slash)
    return () => window.removeEventListener("pointerdown", slash)
  }, [slash])

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {/* impact flash from the spark between the shoes */}
      <AnimatePresence>
        {intro && (
          <motion.div
            key="flash"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 48%, rgba(255,255,255,1) 0%, rgba(255,240,170,0.85) 18%, rgba(255,200,40,0.35) 40%, transparent 70%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 0] }}
            transition={{ duration: 0.75, times: [0, 0.3, 0.42, 1], ease: "easeOut" }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* spark ring bursting out of the impact point */}
      <AnimatePresence>
        {intro && (
          <motion.div
            key="ring"
            className="absolute left-1/2 top-[48%] size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-[6px] border-[#ffe14d]"
            style={{ boxShadow: "0 0 30px #ffd21f, inset 0 0 30px #ffd21f" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 0, 6], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, times: [0, 0.32, 1], ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* WHAM! as the shoes collide */}
      <AnimatePresence>
        {showWham && (
          <ComicWord key="wham" text="WHAM!" x="50%" y="16%" size="clamp(4rem, 11vw, 10rem)" rotate={-8} fill="#ffe14d" />
        )}
      </AnimatePresence>

      {/* gunshots */}
      {shots.map((shot) => (
        <Gunshot key={shot.id} shot={shot} />
      ))}

      {/* claw slashes */}
      <AnimatePresence>
        {slashes.map((s) => (
          <ClawMarks key={s.id} slash={s} />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {words.map((w) => (
          <ComicWord
            key={w.id}
            text={w.text}
            x={w.x}
            y={w.y}
            size="clamp(2.5rem, 5vw, 4.5rem)"
            rotate={w.rotate}
            fill={SHOT_WORDS.includes(w.text) ? "#ff4d3d" : "#fff4d6"}
          />
        ))}
      </AnimatePresence>

      {/* hint */}
      <AnimatePresence>
        {hint && (
          <motion.div
            className={`${comic.className} absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border-2 border-black bg-[#ffe14d] px-5 py-1.5 text-xl tracking-wide text-black shadow-[3px_3px_0_#000]`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            Click left to BLAM! · Click right to SNIKT!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Comic backdrop behind the photo: Wolverine yellow on the left, Deadpool red on the
// right, slowly turning speed lines from the center, halftone dots and twinkling stars
const STARS = [
  { x: 6, y: 14, s: 34, d: 0 },
  { x: 92, y: 10, s: 28, d: 0.8 },
  { x: 4, y: 72, s: 26, d: 1.6 },
  { x: 95, y: 64, s: 36, d: 0.4 },
  { x: 14, y: 92, s: 22, d: 1.2 },
  { x: 86, y: 90, s: 24, d: 2 },
  { x: 50, y: 4, s: 20, d: 1 },
]

export function BestiesBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden" aria-hidden>
      {/* yellow / red split */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, #f2a900 0%, #ffd21f 38%, #ff9a1f 49%, #e8291c 53%, #b5100f 78%, #7a0808 100%)",
        }}
      />

      {/* speed lines bursting from the center, slowly turning */}
      <motion.div
        className="absolute left-1/2 top-1/2 aspect-square w-[250vmax]"
        style={{
          translateX: "-50%",
          translateY: "-50%",
          background:
            "repeating-conic-gradient(from 0deg, rgba(0,0,0,0.28) 0deg 3deg, transparent 3deg 9deg, rgba(255,255,255,0.12) 9deg 10.5deg, transparent 10.5deg 15deg)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 240, ease: "linear", repeat: Infinity }}
      />

      {/* halftone dots */}
      <div
        className="absolute inset-0 mix-blend-multiply"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.35) 1.4px, transparent 1.9px)",
          backgroundSize: "11px 11px",
        }}
      />

      {/* glow at the impact point and darker edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 48%, rgba(255,245,200,0.45) 0%, transparent 35%), radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* twinkling comic stars */}
      {STARS.map((star, i) => (
        <motion.svg
          key={i}
          viewBox="-50 -50 100 100"
          className="absolute"
          style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.s * 2, height: star.s * 2, translateX: "-50%", translateY: "-50%" }}
          animate={{ scale: [0.7, 1.1, 0.7], rotate: [0, 20, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4, delay: star.d, repeat: Infinity, ease: "easeInOut" }}
        >
          <polygon points="0,-48 11,-11 48,0 11,11 0,48 -11,11 -48,0 -11,-11" fill="#fff6c8" stroke="#111" strokeWidth="5" />
        </motion.svg>
      ))}
    </div>
  )
}
