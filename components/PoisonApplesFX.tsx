"use client"

import Image from "next/image"
import { Creepster, IM_Fell_English } from "next/font/google"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useId, useRef, useState } from "react"

// Poison Apples: the Queen's dungeon. The shoes stand on her worktable with the cauldron
// bubbling behind them, and around them everything that goes into the brew:
// - bottles of black of night, an old hag's cackle, a scream of fright, a blast of wind and a
//   thunderbolt, and a jar of mummy dust. Click one to pour it in: it arcs into the cauldron,
//   the brew flares its colour and the line from the recipe appears. Add all six for a finale.
// - an apple on a string is dipped into the brew over and over, comes out green with a skull
//   on its skin, then turns red again.
// - a raven on a skull, candles, the open spellbook and a basket of apples.
//
// shoes_cutout.png is the shoes cut out of poison_apples.jpg (same size); the photo itself is
// hidden and the cut-out is placed on the table.

const CUTOUT = "/shoes/poison_apples/shoes_cutout.png"

const creepy = Creepster({ subsets: ["latin"], weight: "400" })
const fell = IM_Fell_English({ subsets: ["latin"], weight: "400" })

function seeded(n: number) {
  const s = Math.sin(n * 9301 + 49297) * 233280
  return s - Math.floor(s)
}

// rounded so the server and the browser print the same style strings
const r2 = (n: number) => Math.round(n * 100) / 100

// where the brew's surface is, as % of the frame
const MOUTH = { x: 50, y: 22.9 }

/* =========================
   APPLES
========================= */
function AppleArt({ poison, className }: { poison: boolean; className?: string }) {
  const body = poison ? "#7bd400" : "#e0242c"
  const shade = poison ? "#3f7a00" : "#8f0f16"
  // ids differ per variant: the first definition of an id on the page is the one every copy uses
  const id = `pa-${poison ? "p" : "r"}`
  return (
    <svg viewBox="0 0 100 110" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}-g`} cx="35%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.25" stopColor={body} />
          <stop offset="1" stopColor={shade} />
        </radialGradient>
      </defs>
      <path
        d="M50 28 C30 14 6 22 6 52 C6 82 28 104 42 104 C47 104 48 101 50 101 C52 101 53 104 58 104 C72 104 94 82 94 52 C94 22 70 14 50 28 Z"
        fill={`url(#${id}-g)`}
      />
      {poison && (
        // the skull on the skin
        <g fill="#1d3a00" opacity="0.75">
          <path d="M50 46 C38 46 33 54 33 61 C33 67 37 70 40 71 L40 78 L60 78 L60 71 C63 70 67 67 67 61 C67 54 62 46 50 46 Z" />
          <circle cx="43" cy="61" r="4.5" fill={body} />
          <circle cx="57" cy="61" r="4.5" fill={body} />
          <path d="M48 68 L50 64 L52 68 Z" fill={body} />
        </g>
      )}
      <path d="M50 30 C50 20 52 12 56 6" stroke="#5a3418" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M55 14 C64 4 78 6 82 10 C76 18 64 20 55 14 Z" fill={poison ? "#2d4a10" : "#3c9a2a"} />
    </svg>
  )
}

const SKULL =
  "M50 8 C26 8 12 24 12 44 C12 58 20 66 28 70 L28 82 C28 86 31 88 35 88 L65 88 C69 88 72 86 72 82 L72 70 C80 66 88 58 88 44 C88 24 74 8 50 8 Z M34 40 C40 40 44 44 44 50 C44 56 40 58 34 58 C28 58 26 54 26 50 C26 44 29 40 34 40 Z M66 40 C72 40 74 44 74 50 C74 54 72 58 66 58 C60 58 56 56 56 50 C56 44 60 40 66 40 Z M50 60 L55 70 L45 70 Z"

/* =========================
   PAGE BACKDROP: the dungeon wall
========================= */
const MOTES = Array.from({ length: 24 }, (_, i) => ({
  left: r2(seeded(i) * 100),
  top: r2(30 + seeded(i + 50) * 70),
  size: r2(2 + seeded(i + 100) * 3),
  duration: r2(10 + seeded(i + 150) * 12),
  delay: r2(seeded(i + 200) * 10),
  drift: r2((seeded(i + 250) - 0.5) * 60),
}))

export function PoisonBackdrop() {
  const reduce = useReducedMotion()
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#0d0a10]">
      {/* stone blocks */}
      <svg className="absolute inset-0 h-full w-full opacity-90" aria-hidden>
        <defs>
          <pattern id="pa-stones" width="180" height="90" patternUnits="userSpaceOnUse">
            <rect width="180" height="90" fill="#0b080d" />
            <rect x="3" y="3" width="84" height="39" rx="7" fill="#231c27" />
            <rect x="93" y="3" width="84" height="39" rx="7" fill="#1e1822" />
            <rect x="-42" y="48" width="84" height="39" rx="7" fill="#1c1720" />
            <rect x="48" y="48" width="84" height="39" rx="7" fill="#251e29" />
            <rect x="138" y="48" width="84" height="39" rx="7" fill="#1c1720" />
            <path d="M10 10 L40 8 M100 12 L130 10 M56 56 L90 54" stroke="#2f2733" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pa-stones)" />
      </svg>
      {/* the cauldron's green light on the wall, and torchlight at the sides */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_55%_at_50%_45%,rgba(110,255,40,0.22),transparent_70%)]" />
      {[8, 92].map((x, i) => (
        <motion.div
          key={x}
          className="absolute top-[18%] h-[60vh] w-[45vw] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(255,140,40,0.22),transparent_65%)]"
          style={{ left: `${x}%` }}
          animate={reduce ? undefined : { opacity: [0.7, 1, 0.8, 1, 0.75] }}
          transition={{ duration: 2.4 + i * 0.7, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {/* cobwebs in the top corners */}
      {[false, true].map((flip) => (
        <svg
          key={String(flip)}
          viewBox="0 0 100 100"
          className={`absolute top-0 w-[16vmax] opacity-30 ${flip ? "right-0 -scale-x-100" : "left-0"}`}
          aria-hidden
        >
          <g stroke="#cfc8d8" strokeWidth="0.5" fill="none">
            <path d="M0 0 L100 30 M0 0 L80 70 M0 0 L35 100 M0 0 L60 90" />
            <path d="M20 6 Q18 16 16 20 Q12 18 7 18 M40 12 Q36 28 32 40 Q22 38 14 40 M62 19 Q54 40 48 60 Q34 58 22 64" />
          </g>
        </svg>
      ))}
      {/* dust drifting in the light */}
      {!reduce &&
        MOTES.map((m, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-[#c8ff9a]"
            style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.size, height: m.size, boxShadow: "0 0 6px rgba(160,255,80,0.8)" }}
            animate={{ y: [0, -160], x: [0, m.drift], opacity: [0, 0.7, 0] }}
            transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, ease: "linear" }}
          />
        ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.85)_100%)]" />
    </div>
  )
}

/* =========================
   THE INGREDIENTS
========================= */
type Shape = "tall" | "round" | "skinny" | "cone" | "jar"

const BOTTLE: Record<Shape, string> = {
  tall: "M16 8 L16 24 C8 26 6 30 6 36 L6 72 C6 76 9 78 13 78 L27 78 C31 78 34 76 34 72 L34 36 C34 30 32 26 24 24 L24 8 Z",
  round: "M16 8 L16 30 C6 34 2 44 2 54 C2 68 10 78 20 78 C30 78 38 68 38 54 C38 44 34 34 24 30 L24 8 Z",
  skinny: "M17 4 L17 30 C11 34 10 40 10 46 L10 74 C10 77 12 78 15 78 L25 78 C28 78 30 77 30 74 L30 46 C30 40 29 34 23 30 L23 4 Z",
  cone: "M15 8 L15 34 L3 74 C2 77 4 78 7 78 L33 78 C36 78 38 77 37 74 L25 34 L25 8 Z",
  jar: "M6 22 L34 22 L34 26 C36 28 36 30 36 34 L36 72 C36 76 33 78 29 78 L11 78 C7 78 4 76 4 72 L4 34 C4 30 4 28 6 26 Z",
}

type Ingredient = {
  id: string
  name: string
  label: string[] // lines on the label
  line: string // from the recipe
  shape: Shape
  color: string
  glow: string
  level: number // liquid surface, in the bottle's 0-80 units
  x: number // left, % of the frame
  bottom: number // where it stands, % of the frame from the top
  w: number // width, cqw
}

const INGREDIENTS: Ingredient[] = [
  { id: "dust", name: "mummy dust", label: ["Mummy", "Dust"], line: "Mummy dust, to make me old", shape: "jar", color: "#c9b083", glow: "rgba(230,200,140,0.9)", level: 40, x: 20.5, bottom: 61, w: 4.6 },
  { id: "night", name: "black of night", label: ["Black", "of Night"], line: "To shroud my clothes, the black of night", shape: "tall", color: "#1b0f2e", glow: "rgba(140,90,255,0.9)", level: 34, x: 73.6, bottom: 59, w: 4 },
  { id: "cackle", name: "an old hag's cackle", label: ["Old Hag's", "Cackle"], line: "To age my voice, an old hag's cackle", shape: "round", color: "#8c3cff", glow: "rgba(170,90,255,0.9)", level: 46, x: 77.9, bottom: 60.5, w: 4.4 },
  { id: "scream", name: "a scream of fright", label: ["Scream", "of Fright"], line: "To whiten my hair, a scream of fright", shape: "skinny", color: "#eeeadb", glow: "rgba(255,255,240,0.95)", level: 40, x: 82.6, bottom: 59, w: 3.6 },
  { id: "wind", name: "a blast of wind", label: ["Blast", "of Wind"], line: "A blast of wind, to fan my hate", shape: "round", color: "#9fd8ff", glow: "rgba(160,220,255,0.9)", level: 50, x: 86.4, bottom: 60.5, w: 4.6 },
  { id: "bolt", name: "a thunderbolt", label: ["Thunder-", "bolt"], line: "A thunderbolt, to mix it well", shape: "cone", color: "#2f7dff", glow: "rgba(110,190,255,0.95)", level: 50, x: 91.4, bottom: 59, w: 4.4 },
]

function Bottle({ ing }: { ing: Ingredient }) {
  const reduce = useReducedMotion()
  const uid = useId().replace(/:/g, "")
  const path = BOTTLE[ing.shape]
  const labelY = ing.shape === "round" ? 50 : ing.shape === "cone" ? 56 : 46
  return (
    <svg viewBox="0 0 40 80" className="h-auto w-full overflow-visible" aria-hidden>
      <defs>
        <clipPath id={`${uid}-c`}>
          <path d={path} />
        </clipPath>
        <linearGradient id={`${uid}-l`} x1="0" x2="1">
          <stop offset="0" stopColor={ing.color} stopOpacity="0.75" />
          <stop offset="0.5" stopColor={ing.color} />
          <stop offset="1" stopColor="#000" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* the liquid, and what's in it */}
      <g clipPath={`url(#${uid}-c)`}>
        <rect x="0" y={ing.level} width="40" height="80" fill={`url(#${uid}-l)`} />
        {ing.id === "night" &&
          [8, 14, 22, 28, 12, 26].map((x, i) => (
            <motion.circle
              key={i}
              cx={x + 2}
              cy={42 + ((i * 7) % 30)}
              r="0.8"
              fill="#fff"
              animate={reduce ? undefined : { opacity: [0, 1, 0] }}
              transition={{ duration: 1.6 + i * 0.3, delay: i * 0.4, repeat: Infinity }}
            />
          ))}
        {(ing.id === "cackle" || ing.id === "scream") &&
          [12, 20, 27].map((x, i) => (
            <motion.circle
              key={i}
              cx={x}
              r={1.2 + (i % 2)}
              fill="rgba(255,255,255,0.5)"
              initial={{ cy: 76 }}
              animate={reduce ? undefined : { cy: [76, ing.level + 2], opacity: [0, 1, 0] }}
              transition={{ duration: 2 + i * 0.5, delay: i * 0.7, repeat: Infinity, ease: "easeIn" }}
            />
          ))}
        {ing.id === "wind" && (
          <motion.g
            style={{ transformOrigin: "20px 60px" }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <path d="M20 60 C26 54 32 60 28 66 C24 72 12 70 12 60 C12 50 26 46 32 52" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.4" fill="none" />
          </motion.g>
        )}
        {ing.id === "bolt" && (
          <motion.path
            d="M22 52 L15 64 L21 64 L16 76 L27 61 L21 61 L26 52 Z"
            fill="#fff8b0"
            animate={reduce ? undefined : { opacity: [0, 1, 0, 0, 1, 0, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, times: [0, 0.05, 0.1, 0.5, 0.55, 0.6, 1] }}
          />
        )}
        {ing.id === "dust" &&
          [10, 18, 26, 31].map((x, i) => (
            <motion.circle
              key={i}
              cx={x}
              r="0.7"
              fill="#f5e6c0"
              initial={{ cy: 38 }}
              animate={reduce ? undefined : { cy: [38, 30], opacity: [0, 0.9, 0] }}
              transition={{ duration: 2.5, delay: i * 0.6, repeat: Infinity }}
            />
          ))}
      </g>
      {/* the glass */}
      <path d={path} fill="rgba(255,255,255,0.06)" stroke="rgba(230,255,220,0.45)" strokeWidth="1" />
      <path d={ing.shape === "jar" ? "M9 32 L9 68" : "M10 40 L10 66"} stroke="#fff" strokeOpacity="0.4" strokeWidth="1.6" strokeLinecap="round" />
      {/* cork or lid */}
      {ing.shape === "jar" ? (
        <rect x="3" y="15" width="34" height="8" rx="2" fill="#5a3a22" stroke="#2a180c" strokeWidth="0.8" />
      ) : (
        <rect x={ing.shape === "skinny" ? 16 : 15} y={ing.shape === "skinny" ? 0 : 3} width={ing.shape === "skinny" ? 8 : 10} height="8" rx="1.5" fill="#9a6a3c" />
      )}
      {/* a parchment label */}
      <g transform={`rotate(-4 20 ${labelY})`}>
        <path d={`M5 ${labelY - 7} L35 ${labelY - 8} L34 ${labelY + 8} L6 ${labelY + 7} Z`} fill="#e6d4a8" stroke="#6b4a26" strokeWidth="0.5" />
        {ing.label.map((t, i) => (
          <text
            key={i}
            x="20"
            y={labelY - 1.5 + i * 6}
            textAnchor="middle"
            fontSize={t.length > 6 ? 4.4 : 5.4}
            fill="#3a2410"
            style={{ fontFamily: fell.style.fontFamily }}
          >
            {t}
          </text>
        ))}
      </g>
    </svg>
  )
}

/* =========================
   THE TABLE AND ITS THINGS
========================= */
function Table() {
  // planks converge toward the cauldron
  const seams = [80, 210, 340, 460, 540, 660, 790, 920]
  return (
    <div
      className="pointer-events-none absolute left-[-30%] top-[56%] z-[12] h-[44%] w-[160%]"
      style={{
        maskImage: "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)",
        // let the front edge reach down past the frame
        maskSize: "100% 300%",
        WebkitMaskSize: "100% 300%",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskClip: "no-clip",
        WebkitMaskClip: "no-clip",
      }}
    >
      <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="pa-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c110a" />
            <stop offset="1" stopColor="#4d301b" />
          </linearGradient>
          <radialGradient id="pa-lit" cx="50%" cy="0%" r="45%">
            <stop offset="0" stopColor="#9dff4a" stopOpacity="0.28" />
            <stop offset="1" stopColor="#9dff4a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1000" height="235" fill="url(#pa-top)" />
        {seams.map((x) => (
          <line key={x} x1={500 + (x - 500) * 0.55} y1="0" x2={x} y2="235" stroke="#120a05" strokeWidth="2.5" />
        ))}
        {/* grain */}
        {[30, 70, 110, 150, 190, 215].map((y, i) => (
          <path key={y} d={`M0 ${y} C200 ${y - 6} 350 ${y + 6} 500 ${y} S800 ${y - 5} 1000 ${y + 3}`} stroke="#2a190d" strokeWidth={i % 2 ? 1 : 1.6} fill="none" opacity="0.7" />
        ))}
        <rect width="1000" height="235" fill="url(#pa-lit)" />
        {/* the front edge */}
        <rect y="235" width="1000" height="65" fill="#160d07" />
        <rect y="233" width="1000" height="5" fill="#7a4f2c" />
      </svg>
      {/* the front of the table carries on down the page */}
      <div className="absolute inset-x-0 top-[99%] h-[40cqw] bg-[linear-gradient(to_bottom,#160d07,rgba(10,6,4,0.6)_40%,transparent)]" />
    </div>
  )
}

function Candle({ x, bottom, h, delay }: { x: number; bottom: number; h: number; delay: number }) {
  const reduce = useReducedMotion()
  return (
    <div className="pointer-events-none absolute z-[14] w-[1.5cqw] -translate-x-1/2" style={{ left: `${x}%`, bottom: `${100 - bottom}%` }}>
      {/* the light it throws */}
      <motion.div
        className="absolute bottom-full left-1/2 h-[14cqw] w-[14cqw] -translate-x-1/2 translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,170,60,0.35),transparent_65%)]"
        animate={reduce ? undefined : { opacity: [0.7, 1, 0.8, 1] }}
        transition={{ duration: 1.4, delay, repeat: Infinity }}
      />
      {/* flame */}
      <motion.div
        className="absolute bottom-[calc(100%+0.15cqw)] left-1/2 h-[1.6cqw] w-[0.7cqw] -translate-x-1/2 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-[radial-gradient(ellipse_at_50%_75%,#fff6c0,#ffb030_55%,rgba(255,80,0,0.2))] shadow-[0_0_1cqw_rgba(255,170,60,0.9)]"
        style={{ transformOrigin: "50% 100%" }}
        animate={reduce ? undefined : { scaleY: [1, 1.25, 0.9, 1.15, 1], skewX: [0, 4, -3, 2, 0] }}
        transition={{ duration: 0.9 + delay * 0.3, delay, repeat: Infinity }}
      />
      <div className="absolute bottom-full left-1/2 h-[0.4cqw] w-[0.12cqw] -translate-x-1/2 bg-black" />
      {/* wax with drips */}
      <div className="relative w-full rounded-t-[0.3cqw] bg-[linear-gradient(90deg,#8f8670,#efe6c8_40%,#b8ad8e)]" style={{ height: `${h}cqw` }}>
        <div className="absolute left-[10%] top-0 h-[1.4cqw] w-[0.4cqw] rounded-b-full bg-[#e8dfc0]" />
        <div className="absolute right-[15%] top-0 h-[0.8cqw] w-[0.35cqw] rounded-b-full bg-[#d8cfae]" />
      </div>
      <div className="mx-[-0.4cqw] h-[0.5cqw] rounded-[50%] bg-[#d8cfae]" />
    </div>
  )
}

function Raven() {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 100 120" className="h-auto w-full overflow-visible" aria-hidden>
      {/* tail and body */}
      <path d="M32 52 C20 62 18 82 26 98 L8 118 L22 113 L18 120 L36 104 C50 106 64 96 67 80 C70 66 64 54 54 48 Z" fill="#0e0e16" />
      <path d="M36 58 C48 56 60 66 60 80 C56 94 42 100 31 98 C35 84 33 70 36 58 Z" fill="#1b1b2a" />
      <path d="M40 66 C46 70 50 78 50 88 M44 62 C52 68 56 76 56 84" stroke="#2c2c44" strokeWidth="1.2" fill="none" />
      {/* feet on the skull */}
      <path d="M42 100 L40 112 M40 112 L35 114 M40 112 L44 115 M52 100 L52 112 M52 112 L47 114 M52 112 L56 115" stroke="#3a3328" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* the head turns to look around now and then */}
      <motion.g
        style={{ transformOrigin: "56px 50px" }}
        animate={reduce ? undefined : { rotate: [0, 0, -14, -14, 8, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, times: [0, 0.4, 0.45, 0.6, 0.65, 0.85, 0.9] }}
      >
        <circle cx="60" cy="38" r="15" fill="#0e0e16" />
        <path d="M71 33 L93 40 L72 46 Z" fill="#1f1f28" />
        <path d="M72 40 L93 40" stroke="#000" strokeWidth="0.8" />
        <motion.circle
          cx="65"
          cy="35"
          r="2.6"
          fill="#ffcf3a"
          animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.92, 0.96, 1] }}
        />
        <circle cx="65.6" cy="34.4" r="0.8" fill="#000" />
      </motion.g>
    </svg>
  )
}

function TableSkull() {
  return (
    <svg viewBox="0 0 100 90" className="h-auto w-full" aria-hidden>
      <defs>
        <radialGradient id="pa-bone" cx="40%" cy="30%" r="75%">
          <stop offset="0" stopColor="#efe6cc" />
          <stop offset="0.6" stopColor="#bcae88" />
          <stop offset="1" stopColor="#5e5238" />
        </radialGradient>
      </defs>
      <path d="M50 4 C24 4 8 22 8 42 C8 56 16 64 24 68 L24 80 C24 85 28 88 33 88 L67 88 C72 88 76 85 76 80 L76 68 C84 64 92 56 92 42 C92 22 76 4 50 4 Z" fill="url(#pa-bone)" />
      <path d="M32 38 C40 38 44 44 44 50 C44 57 38 60 32 60 C25 60 22 55 22 50 C22 44 26 38 32 38 Z M68 38 C74 38 78 44 78 50 C78 55 75 60 68 60 C62 60 56 57 56 50 C56 44 60 38 68 38 Z" fill="#140c08" />
      <path d="M50 60 L55 71 L45 71 Z" fill="#140c08" />
      <path d="M32 78 L68 78 M38 74 L38 86 M44 74 L44 87 M50 74 L50 87 M56 74 L56 87 M62 74 L62 86" stroke="#3a2f1e" strokeWidth="1.4" />
      <path d="M22 26 C30 16 40 12 50 12" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function SpellBook() {
  const reduce = useReducedMotion()
  const ink = { fontFamily: fell.style.fontFamily }
  return (
    <div className="pointer-events-none absolute left-[0.5%] top-[69%] z-[22] w-[23cqw] [perspective:60cqw]">
      <div className="origin-bottom [transform:rotateX(48deg)_rotateZ(-6deg)]">
        <svg viewBox="0 0 200 120" className="h-auto w-full overflow-visible drop-shadow-[0_1.2cqw_1cqw_rgba(0,0,0,0.7)]" aria-hidden>
          {/* cover */}
          <path d="M4 14 L100 22 L196 14 L198 112 L100 118 L2 112 Z" fill="#3b1410" />
          {/* pages */}
          <path d="M10 10 C40 4 80 8 100 18 L100 112 C80 102 40 100 10 106 Z" fill="#e8d7ad" />
          <path d="M190 10 C160 4 120 8 100 18 L100 112 C120 102 160 100 190 106 Z" fill="#dcc99c" />
          <path d="M100 18 L100 112" stroke="#8a6a3a" strokeWidth="1.5" />
          <text x="55" y="30" textAnchor="middle" fontSize="10" fill="#3a1408" style={ink}>
            Sleeping Death
          </text>
          {[44, 54, 64, 74, 84, 94].map((y, i) => (
            <path key={y} d={`M20 ${y} C40 ${y - 2} 70 ${y - 1} ${i % 3 === 2 ? 70 : 90} ${y + 2}`} stroke="#5a3a1e" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="7 3 12 2" fill="none" />
          ))}
          <text x="146" y="30" textAnchor="middle" fontSize="7.5" fill="#3a1408" style={ink}>
            dip the apple in the brew
          </text>
          {/* a sketch of the apple and its skull */}
          <g transform="translate(124 38) scale(0.48)" fill="none" stroke="#4a2a12" strokeWidth="2.5">
            <path d="M50 28 C30 14 6 22 6 52 C6 82 28 104 42 104 C47 104 48 101 50 101 C52 101 53 104 58 104 C72 104 94 82 94 52 C94 22 70 14 50 28 Z" />
            <path d="M50 30 C50 20 52 12 56 6" />
            <path d="M50 46 C38 46 33 54 33 61 C33 67 37 70 40 71 L40 78 L60 78 L60 71 C63 70 67 67 67 61 C67 54 62 46 50 46 Z" />
          </g>
          <path d="M120 98 C140 96 160 97 180 99" stroke="#5a3a1e" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="6 3" fill="none" />
          {/* a page lifts in the draught */}
          <motion.path
            d="M190 10 C160 4 120 8 100 18 L100 112 C120 102 160 100 190 106 Z"
            fill="#efe1bc"
            style={{ transformOrigin: "100px 60px", transformBox: "view-box" }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={reduce ? undefined : { scaleX: [0, 0, 0.25, 0], opacity: [0, 0, 0.9, 0] }}
            transition={{ duration: 9, repeat: Infinity, times: [0, 0.8, 0.88, 0.96] }}
          />
        </svg>
      </div>
    </div>
  )
}

// apples heaped in the basket: left %, top cqw, rotation
const BASKET_APPLES = [
  { l: 6, t: 1.8, r: -12 },
  { l: 22, t: 0.4, r: 8 },
  { l: 40, t: -0.6, r: -4 },
  { l: 58, t: 0.6, r: 14 },
  { l: 74, t: 2, r: -8 },
  { l: 32, t: 2.4, r: 20 },
  { l: 50, t: 2.6, r: -18 },
]

function Basket() {
  return (
    <div className="pointer-events-none absolute left-[78.5%] top-[66%] z-[22] w-[19cqw]">
      <div className="relative h-[6cqw]">
        {BASKET_APPLES.map((a, i) => (
          <div key={i} className="absolute w-[4.6cqw]" style={{ left: `${a.l}%`, top: `${a.t}cqw`, transform: `rotate(${a.r}deg)` }}>
            <AppleArt poison={false} className="h-auto w-full drop-shadow-[0_0.3cqw_0.4cqw_rgba(0,0,0,0.6)]" />
          </div>
        ))}
      </div>
      <svg viewBox="0 0 200 90" className="relative -mt-[2.6cqw] h-auto w-full drop-shadow-[0_1cqw_0.8cqw_rgba(0,0,0,0.7)]" aria-hidden>
        <path d="M4 10 L196 10 L176 86 L24 86 Z" fill="#6b4220" />
        {[22, 38, 54, 70].map((y, i) => (
          <path key={y} d={`M${8 + i * 5} ${y} L${192 - i * 5} ${y}`} stroke="#3e230f" strokeWidth="5" />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M${14 + i * 16} 12 L${30 + i * 13} 84`} stroke="#8a5a2c" strokeWidth="2.5" opacity="0.8" />
        ))}
        <rect x="0" y="4" width="200" height="12" rx="6" fill="#8a5a2c" stroke="#3e230f" strokeWidth="2" />
      </svg>
    </div>
  )
}

/* =========================
   THE CAULDRON
========================= */
function Cauldron({ tint, reduce }: { tint: string | null; reduce: boolean }) {
  return (
    <div className="pointer-events-none absolute left-[25%] top-[13%] z-[8] w-[50cqw]">
      <svg viewBox="0 0 200 160" className="h-auto w-full overflow-visible" aria-hidden>
        <defs>
          <radialGradient id="pa-iron" cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor="#3a3a42" />
            <stop offset="0.5" stopColor="#141418" />
            <stop offset="1" stopColor="#050506" />
          </radialGradient>
          <linearGradient id="pa-rimlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9dff4a" stopOpacity="0.5" />
            <stop offset="0.25" stopColor="#9dff4a" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="pa-brew" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#d8ff7a" />
            <stop offset="0.5" stopColor="#7bd400" />
            <stop offset="1" stopColor="#2f5c00" />
          </radialGradient>
          <clipPath id="pa-brewclip">
            <ellipse cx="100" cy="22" rx="78" ry="10" />
          </clipPath>
        </defs>
        {/* handles */}
        <path d="M14 34 C-4 34 -6 56 10 60" stroke="#1a1a20" strokeWidth="5" fill="none" />
        <path d="M186 34 C204 34 206 56 190 60" stroke="#1a1a20" strokeWidth="5" fill="none" />
        {/* body, lit green from the brew */}
        <path d="M12 24 C-4 60 0 120 50 148 C80 162 120 162 150 148 C200 120 204 60 188 24 Z" fill="url(#pa-iron)" />
        <path d="M12 24 C-4 60 0 120 50 148 C80 162 120 162 150 148 C200 120 204 60 188 24 Z" fill="url(#pa-rimlight)" />
        <path d="M30 60 C26 90 36 120 60 138" stroke="#fff" strokeOpacity="0.08" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* the rim, back half, then the brew, then the front of the rim */}
        <ellipse cx="100" cy="22" rx="90" ry="15" fill="#1e1e24" />
        <ellipse cx="100" cy="22" rx="80" ry="11" fill="#0a0a0c" />
        <ellipse cx="100" cy="23" rx="78" ry="10" fill="url(#pa-brew)" />
        <g clipPath="url(#pa-brewclip)">
          {/* a colour flare when something is poured in */}
          <motion.ellipse
            cx="100"
            cy="22"
            rx="78"
            ry="10"
            fill={tint ?? "#7bd400"}
            initial={{ opacity: 0 }}
            animate={{ opacity: tint ? 0.85 : 0 }}
            transition={{ duration: tint ? 0.25 : 1.2 }}
          />
          {/* the brew swirls */}
          <motion.g
            style={{ transformOrigin: "100px 22px" }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          >
            <path d="M60 22 C70 14 96 14 104 20 M120 26 C134 30 150 26 150 20 M80 28 C90 31 100 30 108 27" stroke="#eaffb0" strokeOpacity="0.5" strokeWidth="1.6" fill="none" />
          </motion.g>
          {/* bubbles swell and pop */}
          {!reduce &&
            [40, 62, 88, 112, 136, 156, 74, 124].map((x, i) => (
              <motion.circle
                key={i}
                cx={x}
                cy={18 + (i % 3) * 3}
                fill="#c8ff6a"
                stroke="#eaffb0"
                strokeWidth="0.6"
                initial={{ r: 0 }}
                animate={{ r: [0, 3 + (i % 3), 0], opacity: [1, 1, 0] }}
                transition={{ duration: 1.4 + (i % 4) * 0.3, delay: i * 0.35, repeat: Infinity, times: [0, 0.85, 1] }}
              />
            ))}
        </g>
        <path d="M10 22 A90 15 0 0 0 190 22 L180 22 A80 11 0 0 1 20 22 Z" fill="#26262e" />
        <path d="M14 26 A88 14 0 0 0 186 26" stroke="#9dff4a" strokeOpacity="0.35" strokeWidth="1.2" fill="none" />
      </svg>
    </div>
  )
}

function Flames({ reduce }: { reduce: boolean }) {
  // fire under the cauldron, glowing up from behind the table and licking its sides
  const tongues = [
    { x: 24.5, h: 9, d: 0 },
    { x: 27, h: 12, d: 0.2 },
    { x: 29.5, h: 7, d: 0.45 },
    { x: 70.5, h: 8, d: 0.1 },
    { x: 73, h: 12, d: 0.35 },
    { x: 75.5, h: 9, d: 0.55 },
  ]
  return (
    <>
      <motion.div
        className="pointer-events-none absolute left-[20%] top-[44%] z-[7] h-[18%] w-[60%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(255,120,30,0.55),transparent_70%)] blur-md"
        animate={reduce ? undefined : { opacity: [0.7, 1, 0.75, 0.95, 0.7] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      {tongues.map((t, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute z-[11] w-[2.4cqw] -translate-x-1/2 rounded-[50%_50%_40%_40%/70%_70%_30%_30%] bg-[linear-gradient(to_top,#fff0a0,#ff9a1f_40%,rgba(255,60,0,0))] mix-blend-screen blur-[1px]"
          style={{ left: `${t.x}%`, bottom: "43.5%", height: `${t.h}%`, transformOrigin: "50% 100%" }}
          animate={reduce ? undefined : { scaleY: [0.7, 1.15, 0.85, 1.05, 0.7], skewX: [0, 6, -5, 3, 0], opacity: [0.8, 1, 0.85, 1, 0.8] }}
          transition={{ duration: 0.8 + (i % 3) * 0.15, delay: t.d, repeat: Infinity }}
        />
      ))}
    </>
  )
}

const STEAM = Array.from({ length: 7 }, (_, i) => ({
  x: r2(36 + seeded(i + 700) * 28),
  w: r2(7 + seeded(i + 720) * 6),
  drift: r2((seeded(i + 740) - 0.5) * 12),
  duration: r2(5 + seeded(i + 760) * 3),
  delay: r2(i * 0.9),
}))

/* =========================
   THE APPLE ON A STRING
========================= */
const DIP = 12 // seconds per dip
// the apple's drop, in cqw: hanging above the cauldron, then under the surface
const HANG = 18.5
const UNDER = 30.5
const DIP_TIMES = [0, 0.1, 0.25, 0.35, 0.5, 1]
const CAPTIONS = [
  { from: 0.08, to: 0.36, text: "Dip the apple in the brew…" },
  { from: 0.36, to: 0.48, text: "Let the Sleeping Death seep through" },
  { from: 0.48, to: 0.7, text: "Look! On the skin, the symbol of what lies within" },
  { from: 0.7, to: 0.92, text: "Now turn red, to tempt Snow White" },
]

function DippingApple({ reduce }: { reduce: boolean }) {
  if (reduce) return null
  return (
    <>
      {/* clipped at the brew's surface, so the apple sinks into it */}
      <div className="pointer-events-none absolute left-[40%] top-[-30%] z-[9] h-[52.9%] w-[10%] overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-0 w-[5.4cqw] -translate-x-1/2"
          initial={{ y: `${HANG}cqw` }}
          animate={{ y: [`${HANG}cqw`, `${HANG}cqw`, `${UNDER}cqw`, `${UNDER}cqw`, `${HANG}cqw`, `${HANG}cqw`], rotate: [0, 4, 0, 0, -6, 0] }}
          transition={{ duration: DIP, repeat: Infinity, times: DIP_TIMES, ease: "easeInOut" }}
        >
          {/* the string */}
          <div className="absolute bottom-[92%] left-1/2 h-[30cqw] w-[0.14cqw] -translate-x-1/2 bg-[linear-gradient(to_top,#c9b48a,rgba(201,180,138,0))]" />
          <div className="relative aspect-[100/110]">
            <AppleArt poison={false} className="absolute inset-0 h-full w-full" />
            {/* comes out poisoned, then turns red again */}
            <motion.div
              className="absolute inset-0"
              style={{ filter: "drop-shadow(0 0 1cqw rgba(150,255,40,0.9))" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
              transition={{ duration: DIP, repeat: Infinity, times: [0, 0.28, 0.3, 0.7, 0.78, 1] }}
            >
              <AppleArt poison className="h-full w-full" />
            </motion.div>
          </div>
        </motion.div>
      </div>
      {/* drips falling back into the brew */}
      {[0, 1, 2, 3].map((i) => {
        const t = 0.4 + i * 0.06
        return (
          <motion.span
            key={i}
            className="pointer-events-none absolute left-[45%] z-[9] h-[0.8cqw] w-[0.5cqw] -translate-x-1/2 rounded-[50%_50%_50%_50%/30%_30%_70%_70%] bg-[#9dff2e] shadow-[0_0_0.6cqw_rgba(150,255,40,0.9)]"
            style={{ top: "13.5%", marginLeft: `${(i % 2 ? 1 : -1) * 0.6}cqw` }}
            initial={{ opacity: 0 }}
            animate={{ y: ["0cqw", "0cqw", "5cqw", "5cqw"], opacity: [0, 1, 0.8, 0] }}
            transition={{ duration: DIP, repeat: Infinity, times: [0, t, t + 0.04, t + 0.045], ease: "easeIn" }}
          />
        )
      })}
      {/* ripples where it goes in and comes out */}
      {[0.17, 0.4].map((t, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute left-[45%] z-[9] h-[1.6cqw] w-[6cqw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-[0.25cqw] border-[#eaffb0]"
          style={{ top: `${MOUTH.y}%` }}
          initial={{ opacity: 0 }}
          animate={{ scale: [0.3, 0.3, 2.2, 2.2], opacity: [0, 0.9, 0, 0] }}
          transition={{ duration: DIP, repeat: Infinity, times: [0, t, t + 0.08, 1], ease: "easeOut" }}
        />
      ))}
    </>
  )
}

/* =========================
   THE SCENE
========================= */
type Pour = { key: number; ing: Ingredient }
type Said = { key: number; text: string; big?: boolean }

export default function PoisonApplesFX() {
  const reduce = !!useReducedMotion()
  const [pours, setPours] = useState<Pour[]>([])
  const [tint, setTint] = useState<string | null>(null)
  const [puffs, setPuffs] = useState<{ key: number; color: string }[]>([])
  const [added, setAdded] = useState<string[]>([])
  const [said, setSaid] = useState<Said | null>(null)
  const [finale, setFinale] = useState(0)
  const [flash, setFlash] = useState<{ key: number; green: boolean } | null>(null)
  const [phase, setPhase] = useState(0) // where the dipping apple is in its loop, 0-1
  const keyRef = useRef(0)
  const addedRef = useRef<string[]>([])
  const timers = useRef<number[]>([])

  // follow the dip so its captions line up
  useEffect(() => {
    const start = performance.now()
    const id = window.setInterval(() => setPhase((((performance.now() - start) / 1000) % DIP) / DIP), 250)
    const pending = timers.current
    return () => {
      window.clearInterval(id)
      pending.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const say = (s: Said, ms: number) => {
    setSaid(s)
    later(() => setSaid((now) => (now?.key === s.key ? null : now)), ms)
  }

  const pour = (ing: Ingredient) => {
    const key = ++keyRef.current
    setPours((p) => [...p, { key, ing }])
    // it lands in the cauldron
    later(() => {
      setPours((p) => p.filter((x) => x.key !== key))
      setTint(ing.id === "night" ? "#4a2a8a" : ing.color)
      later(() => setTint(null), 700)
      setPuffs((p) => [...p, { key, color: ing.glow }])
      later(() => setPuffs((p) => p.filter((x) => x.key !== key)), 3000)
      if (ing.id === "bolt") setFlash({ key, green: false })
      say({ key, text: ing.line }, 3200)

      const next = addedRef.current.includes(ing.id) ? addedRef.current : [...addedRef.current, ing.id]
      if (next.length < INGREDIENTS.length) {
        addedRef.current = next
        setAdded(next)
        return
      }
      // everything is in: the brew is ready
      addedRef.current = []
      setAdded(next)
      later(() => {
        setAdded([])
        setFinale(key)
        setFlash({ key: key + 0.5, green: true })
        say({ key: key + 0.5, text: "Now… the poison apple!", big: true }, 3600)
      }, 1600)
    }, 750)
  }

  const appleLine = reduce ? undefined : CAPTIONS.find((c) => phase >= c.from && phase < c.to)
  const caption: Said | null = said ?? (appleLine ? { key: -1 - CAPTIONS.indexOf(appleLine), text: appleLine.text } : null)

  return (
    <div className="absolute inset-0 @container">
      {/* the cauldron, the fire under it and its steam */}
      <Flames reduce={reduce} />
      <Cauldron tint={tint} reduce={reduce} />
      <div className="pointer-events-none absolute left-[25%] top-[-6%] z-[9] h-[30%] w-[50%] rounded-[50%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(150,255,50,0.45),transparent_65%)] blur-lg" />
      {!reduce &&
        STEAM.map((s, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute z-[9] h-[7cqw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(190,255,150,0.35),transparent_70%)] blur-md"
            style={{ left: `${s.x}%`, top: "14%", width: `${s.w}cqw` }}
            animate={{ y: ["0cqw", "-22cqw"], x: ["0cqw", `${s.drift}cqw`], opacity: [0, 0.9, 0], scale: [0.6, 1.6] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
      {/* now and then the steam takes the shape of a skull */}
      {!reduce && (
        <motion.svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute left-[56%] top-[4%] z-[9] w-[9cqw] -translate-x-1/2 blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ y: ["0cqw", "0cqw", "-10cqw"], opacity: [0, 0, 0.55, 0], scale: [0.6, 0.6, 1.3] }}
          transition={{ duration: 11, repeat: Infinity, times: [0, 0.6, 0.8, 1], delay: 3 }}
          aria-hidden
        >
          <path d={SKULL} fill="rgba(200,255,160,0.9)" fillRule="evenodd" />
        </motion.svg>
      )}
      <DippingApple reduce={reduce} />

      {/* coloured smoke from each pour */}
      {puffs.map((p) =>
        [0, 1, 2].map((j) => (
          <motion.div
            key={`${p.key}-${j}`}
            className="pointer-events-none absolute z-[9] h-[10cqw] w-[12cqw] -translate-x-1/2 rounded-full blur-xl"
            style={{ left: `${44 + j * 6}%`, top: "12%", background: `radial-gradient(circle, ${p.color}, transparent 70%)` }}
            initial={{ opacity: 0, scale: 0.4, y: "0cqw" }}
            animate={{ opacity: [0, 0.9, 0], scale: 1.8, y: "-14cqw" }}
            transition={{ duration: 2.6, delay: j * 0.15, ease: "easeOut" }}
          />
        )),
      )}

      {/* the finale: skulls of smoke rise out of the cauldron */}
      {finale > 0 && (
        <div key={finale} className="pointer-events-none absolute inset-0 z-[9]">
          {[-12, 0, 12].map((dx, i) => (
            <motion.svg
              key={i}
              viewBox="0 0 100 100"
              className="absolute top-[2%] w-[12cqw] -translate-x-1/2 blur-[1.5px]"
              style={{ left: `${50 + dx}%` }}
              initial={{ opacity: 0, y: "6cqw", scale: 0.4 }}
              animate={{ opacity: [0, 0.9, 0], y: "-14cqw", scale: 1.4 }}
              transition={{ duration: 3.2, delay: i * 0.3, ease: "easeOut" }}
              onAnimationComplete={i === 2 ? () => setFinale(0) : undefined}
              aria-hidden
            >
              <path d={SKULL} fill="rgba(170,255,90,0.95)" fillRule="evenodd" />
            </motion.svg>
          ))}
        </div>
      )}

      <Table />

      {/* back of the table: candles, the raven on its skull */}
      <Candle x={3} bottom={62} h={7} delay={0} />
      <Candle x={6.2} bottom={63} h={10} delay={0.4} />
      <Candle x={9.2} bottom={61.5} h={5} delay={0.8} />
      <Candle x={97} bottom={62} h={8} delay={0.2} />
      <div className="pointer-events-none absolute left-[11.5%] top-[58.5%] z-[13] h-[4%] w-[11%] rounded-[50%] bg-black/60 blur-sm" />
      <div className="pointer-events-none absolute left-[12.5%] z-[14] w-[8.5cqw]" style={{ bottom: "38.5%" }}>
        <TableSkull />
      </div>
      <div className="pointer-events-none absolute left-[12%] z-[15] w-[8cqw]" style={{ bottom: "50%" }}>
        <Raven />
      </div>

      {/* the ingredients: click one to pour it in */}
      {INGREDIENTS.map((ing) => (
        <motion.button
          key={ing.id}
          type="button"
          aria-label={`Add ${ing.name} to the cauldron`}
          onClick={() => pour(ing)}
          className="group absolute z-[16] -translate-x-1/2 cursor-pointer outline-none"
          style={{ left: `${r2(ing.x + ing.w / 2)}%`, bottom: `${r2(100 - ing.bottom)}%`, width: `${ing.w}cqw` }}
          whileHover={{ y: "-0.6cqw" }}
          whileTap={{ rotate: ing.x < 50 ? 25 : -25, y: "-1.6cqw" }}
        >
          <span
            className="pointer-events-none absolute inset-[-20%] rounded-full opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
            style={{ background: `radial-gradient(circle, ${ing.glow}, transparent 65%)` }}
          />
          <span className="relative block">
            <Bottle ing={ing} />
          </span>
          {/* ticked off once it's in the brew */}
          {added.includes(ing.id) && (
            <span className="absolute -top-[1.6cqw] left-1/2 -translate-x-1/2 text-[1.2cqw] text-[#b6ff5c] drop-shadow-[0_0_0.4cqw_#7bd400]">✦</span>
          )}
          <span className="absolute left-[15%] top-full -mt-[0.3cqw] h-[0.6cqw] w-[70%] rounded-[50%] bg-black/60 blur-[2px]" />
        </motion.button>
      ))}

      {/* each pour arcs from its bottle into the cauldron */}
      {pours.map(({ key, ing }) => {
        const fromX = r2(ing.x + ing.w / 2)
        const fromY = ing.bottom - 12
        return (
          <motion.span
            key={key}
            className="pointer-events-none absolute z-[10] h-[1.6cqw] w-[1.6cqw] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: ing.color, boxShadow: `0 0 1.4cqw 0.4cqw ${ing.glow}` }}
            initial={{ left: `${fromX}%`, top: `${fromY}%`, scale: 0.6 }}
            animate={{ left: [`${fromX}%`, `${r2((fromX + MOUTH.x) / 2)}%`, `${MOUTH.x}%`], top: [`${fromY}%`, "-4%", `${MOUTH.y}%`], scale: [0.6, 1.2, 0.4] }}
            transition={{ duration: 0.75, ease: "easeInOut" }}
          />
        )
      })}

      {/* the shoes on the table */}
      <div className="pointer-events-none absolute left-[27%] top-[74.5%] z-[18] h-[7%] w-[30%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(0,0,0,0.8),transparent_70%)] blur-sm" />
      <div className="pointer-events-none absolute left-[47%] top-[75%] z-[18] h-[8%] w-[27%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(0,0,0,0.8),transparent_70%)] blur-sm" />
      <div className="pointer-events-none absolute left-[20%] top-[30%] z-20 h-[60%] w-[60%]">
        <Image src={CUTOUT} alt="" fill priority draggable={false} className="select-none object-contain" />
        {/* green light from the cauldron on their tops */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(140,255,60,0.35),transparent_45%)] mix-blend-soft-light"
          style={{
            maskImage: `url(${CUTOUT})`,
            WebkitMaskImage: `url(${CUTOUT})`,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
        />
      </div>

      {/* front of the table */}
      <SpellBook />
      <Basket />
      <div className="pointer-events-none absolute left-[23%] top-[83%] z-[22] w-[3.6cqw] rotate-[-20deg]" style={{ filter: "drop-shadow(0 0 1cqw rgba(150,255,40,0.8))" }}>
        <AppleArt poison className="h-auto w-full" />
      </div>

      {/* a thunderbolt lights up the room; the finale turns it green */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.key}
            className={`pointer-events-none absolute -inset-[150vmax] z-40 ${flash.green ? "bg-[#7bd400] mix-blend-color" : "bg-[#dfefff]"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0, 0.4, 0] }}
            transition={{ duration: 0.9 }}
            onAnimationComplete={() => setFlash(null)}
          />
        )}
      </AnimatePresence>

      {/* the recipe, line by line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[1.5%] z-40 flex justify-center">
        <AnimatePresence mode="wait">
          {caption ? (
            <motion.p
              key={caption.key}
              className={`${creepy.className} px-[2cqw] text-center tracking-wide text-[#b6ff5c] [text-shadow:0_0_1cqw_rgba(120,255,30,0.8),0_0.2cqw_0.3cqw_#000] ${caption.big ? "text-[3.4cqw]" : "text-[2cqw]"}`}
              initial={{ opacity: 0, y: "0.8cqw", filter: "blur(4px)" }}
              animate={{ opacity: 1, y: "0cqw", filter: "blur(0px)" }}
              exit={{ opacity: 0, y: "-0.6cqw", filter: "blur(4px)" }}
              transition={{ duration: 0.45 }}
            >
              {caption.text}
            </motion.p>
          ) : (
            <motion.p
              key="hint"
              className="rounded-full bg-black/40 px-[1.4cqw] py-[0.5cqw] text-[0.95cqw] font-semibold uppercase tracking-[0.25em] text-white/85 backdrop-blur"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Click a bottle to add it to the brew ✦
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
