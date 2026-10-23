"use client"

import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import type { CSSProperties } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { CrtScreen, PixelGrid, pixel, setMuted, sfx as nes, noise, tone, Typed } from "@/components/nes"

// Legend: an NES Zelda quest on the shoe page.
// "IT'S DANGEROUS TO GO ALONE!" Find the sword and both shoes hidden in the photo (click them,
// or Tab + Enter). Each one is an item get: flash, the item held up, a jingle, a heart container.
// The coin on the stump is a bonus rupee. With all three found, the sword's power flows into
// the shoes: hearts refill, a flash, the photo becomes the powered-up shot (herofinal.png),
// the Triforce appears and gold sparks burst out.
// Sounds, sprites and the CRT come from components/nes.tsx.

type Item = "sword" | "left" | "right"
type Phase = "quest" | "get" | "power" | "done"

// shapes and centres in hero.png (6000x4000), as % of the photo
const ITEMS: Record<Item, { name: string[]; points: string; cx: number; cy: number }> = {
  sword: {
    name: ["YOU GOT THE", "MASTER SWORD!"],
    points: "4.6,25.6 20.5,34.1 31.9,31.9 44,32.4 42.4,42.1 62.1,57.9 68.1,57.9 84.8,64.7 98.4,71.5 98.4,98.8 90,98.8 77.2,85.1 61.3,71.5 58.3,68.1 31.1,47.7 20.5,39.2 4.6,31.3",
    cx: 38,
    cy: 42,
  },
  left: {
    name: ["YOU FOUND THE", "HERO'S BOOT!"],
    points: "8,52 14,44 22,41 32,44 40,52 48,63 50.5,72 49,80 40,83 25,79 12,70 8,62",
    cx: 29,
    cy: 62,
  },
  right: {
    name: ["YOU FOUND THE", "FOREST BOOT!"],
    points: "52,40 54,33 62,28 72,26.5 80,26 86,30 89.5,40 89.5,52 85,60 72,57 60,52 53,47",
    cx: 70,
    cy: 42,
  },
}
const ORDER: Item[] = ["sword", "left", "right"]
const COIN = { x: 56.5, y: 80.8, r: 3.2 }
const BOX = { left: 62, top: 3, width: 35, height: 17 }

const GET_MS = 2400
const POWER_MS = 2600

const sfx = {
  ...nes,
  fanfare: () => {
    ;[440, 554, 659].forEach((f, i) => tone(f, 0.14, { at: i * 0.13, vol: 0.06 }))
    tone(880, 0.9, { at: 0.42, vol: 0.06 })
    tone(554, 0.9, { at: 0.42, vol: 0.04, type: "triangle" })
  },
  rupee: () => [1319, 1568, 1976].forEach((f, i) => tone(f, 0.06, { at: i * 0.05, vol: 0.04 })),
  hey: () => [1568, 2093].forEach((f, i) => tone(f, 0.07, { at: i * 0.07, vol: 0.025, type: "triangle" })),
  heart: () => tone(1760, 0.08, { vol: 0.04, type: "triangle" }),
  charge: () => tone(180, POWER_MS / 1000, { type: "sawtooth", vol: 0.05, to: 1600 }),
  powerUp: () => {
    noise(0.5, 0.15)
    ;[523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i === 5 ? 1.2 : 0.16, { at: i * 0.09, vol: 0.06 }))
    tone(262, 1.4, { type: "triangle", vol: 0.08, at: 0.45 })
  },
}

/* =========================
   PIXEL ART
========================= */
const SWORD = [
  "...W...",
  "..WWW..",
  "..WBW..",
  "..WBW..",
  "..WBW..",
  "..WBW..",
  "..WBW..",
  "..WBW..",
  "P.WBW.P",
  "PPPPPPP",
  "...H...",
  "...H...",
  "..YYY..",
]
const SWORD_COLORS = { W: "#f4f0e8", B: "#9cc8ff", P: "#5a4ad0", H: "#7a4a1e", Y: "#f2c230" }
const BOOT = ["....SSS.....", "....SSS.....", "....SSSS....", "...SSSSSS...", "..SSSSSSSSS.", ".SSSSSSSSSSS", "BBBBBBBBBBBB"]
const BOOT_COLORS: Record<"left" | "right", Record<string, string>> = {
  left: { S: "#2f8fb0", B: "#c8e04a" },
  right: { S: "#3aa83a", B: "#b05a30" },
}
const HEART = [".RR.RR.", "RRRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."]
const RUPEE = ["..G..", ".GLG.", "GGLGG", "GGLGG", "GGLGG", "GGLGG", ".GLG.", "..G.."]
const STAR = ["...W...", "...W...", "..WWW..", "WWWWWWW", "..WWW..", "...W...", "...W..."]

// the Triforce: a big triangle with an upside-down one cut out of its lower half
const TRIFORCE = (() => {
  const n = 8
  const w = 4 * n - 1
  return Array.from({ length: 2 * n }, (_, y) =>
    Array.from({ length: w }, (_, x) => {
      const d = Math.abs(x - (2 * n - 1))
      const inBig = d <= y
      const inHole = y >= n && d <= 2 * n - 1 - y
      return inBig && !inHole ? "T" : "."
    }).join("")
  )
})()

function Sprite({ item, className }: { item: Item; className?: string }) {
  return item === "sword" ? (
    <PixelGrid rows={SWORD} colors={SWORD_COLORS} className={className} />
  ) : (
    <PixelGrid rows={BOOT} colors={BOOT_COLORS[item]} className={className} />
  )
}

/* =========================
   PAGE-WIDE ATMOSPHERE
========================= */
function seeded(n: number) {
  const s = Math.sin(n * 9301 + 49297) * 233280
  return s - Math.floor(s)
}

const FAIRIES = Array.from({ length: 14 }, (_, i) => ({
  left: seeded(i) * 100,
  top: seeded(i + 30) * 100,
  size: 6 + seeded(i + 60) * 10,
  dx: (seeded(i + 90) - 0.5) * 16,
  dy: (seeded(i + 120) - 0.5) * 14,
  duration: 7 + seeded(i + 150) * 8,
}))

// Dark forest behind the photo, fairies drifting about the page, CRT over everything
export function HeroAtmosphere({ image, powered }: { image: string; powered: boolean }) {
  const reduce = useReducedMotion()
  return (
    <>
      <div className="fixed inset-0 -z-50 bg-[#03120a]">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-60 blur-3xl"
          style={{ backgroundImage: `url(${image})` }}
        />
      </div>

      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        {FAIRIES.map((f, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${f.left}%`,
              top: `${f.top}%`,
              width: f.size,
              height: f.size,
              background: powered ? "#ffe680" : "#c8ff8a",
              boxShadow: `0 0 ${f.size * 2}px ${f.size / 2}px ${powered ? "rgba(255,200,60,0.55)" : "rgba(160,255,120,0.45)"}`,
            }}
            animate={reduce ? { opacity: 0.7 } : { x: [0, `${f.dx}vw`, 0], y: [0, `${f.dy}vh`, 0], opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: f.duration, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <CrtScreen reduce={reduce} />
    </>
  )
}

/* =========================
   THE QUEST (inside the photo frame)
========================= */
export default function HeroFX({
  final,
  fade,
  onPowered,
}: {
  final: string
  fade?: CSSProperties
  onPowered?: (powered: boolean) => void
}) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>("quest")
  const [found, setFound] = useState<Item[]>([])
  const [getting, setGetting] = useState<Item | null>(null)
  const [hearts, setHearts] = useState(0)
  const [rupees, setRupees] = useState(0)
  const [coinTaken, setCoinTaken] = useState(false)
  const [toast, setToast] = useState<string[] | null>(null)
  const [hover, setHover] = useState<Item | null>(null)
  const [glint, setGlint] = useState<Item | null>(null)
  const [sound, setSound] = useState(true)
  const timers = useRef<number[]>([])

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // now and then, something you haven't found yet catches the light
  useEffect(() => {
    if (phase !== "quest") return
    const left = ORDER.filter((i) => !found.includes(i))
    if (!left.length) return
    let n = 0
    const id = window.setInterval(() => {
      setGlint(left[n++ % left.length])
      window.setTimeout(() => setGlint(null), 700)
    }, 2600)
    return () => clearInterval(id)
  }, [phase, found])

  const powerUp = useCallback(() => {
    setPhase("power")
    sfx.charge()
    ;[400, 900, 1400].forEach((ms, i) =>
      later(ms, () => {
        setHearts(i + 1)
        sfx.heart()
      })
    )
    later(POWER_MS, () => {
      setPhase("done")
      onPowered?.(true)
      sfx.powerUp()
    })
  }, [later, onPowered])

  const take = useCallback(
    (item: Item) => {
      if (phase !== "quest" || found.includes(item)) return
      const next = [...found, item]
      setFound(next)
      setGetting(item)
      setPhase("get")
      setHearts(next.length)
      sfx.fanfare()
      later(GET_MS, () => {
        setGetting(null)
        if (next.length === ORDER.length) powerUp()
        else setPhase("quest")
      })
    },
    [phase, found, later, powerUp]
  )

  const takeCoin = useCallback(() => {
    if (coinTaken) return
    setCoinTaken(true)
    sfx.rupee()
    ;[0, 1, 2, 3, 4].forEach((i) => later(i * 70, () => setRupees((r) => r + 10)))
    setToast(["A BULLAIRS COIN!", "+50 RUPEES"])
    later(2200, () => setToast(null))
  }, [coinTaken, later])

  const replay = useCallback(() => {
    sfx.select()
    setPhase("quest")
    setFound([])
    setHearts(0)
    setRupees(0)
    setCoinTaken(false)
    onPowered?.(false)
  }, [onPowered])

  const done = phase === "done"
  const powering = phase === "power"
  const item = getting ? ITEMS[getting] : null

  return (
    <div className={`${pixel.className} absolute inset-0 @container`}>
      {/* the powered-up photo, loaded from the start so the swap is instant */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{ opacity: done ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        <Image src={final} alt="" fill priority draggable={false} className="object-contain select-none" style={fade} />
      </motion.div>

      {/* clickable sword and shoes */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {ORDER.map((key) => {
          const open = phase === "quest" && !found.includes(key)
          return (
            <polygon
              key={key}
              points={ITEMS[key].points}
              role={open ? "button" : undefined}
              aria-label={open ? `Search the ${key === "sword" ? "sword" : `${key} shoe`}` : undefined}
              tabIndex={open ? 0 : -1}
              className={`outline-none ${open ? "cursor-pointer" : "pointer-events-none"}`}
              fill="transparent"
              onMouseEnter={() => {
                if (open && hover !== key) sfx.hey()
                setHover(key)
              }}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(key)}
              onBlur={() => setHover(null)}
              onClick={(e) => {
                e.stopPropagation()
                take(key)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  take(key)
                }
              }}
            />
          )
        })}
        {!coinTaken && phase !== "power" && (
          <ellipse
            cx={COIN.x}
            cy={COIN.y}
            rx={COIN.r * 0.75}
            ry={COIN.r}
            role="button"
            aria-label="Pick up the coin"
            tabIndex={0}
            className="cursor-pointer outline-none"
            fill="transparent"
            onClick={(e) => {
              e.stopPropagation()
              takeCoin()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                takeCoin()
              }
            }}
          />
        )}

        {/* power flowing from the sword into each shoe */}
        {powering &&
          (["left", "right"] as const).map((k, i) => (
            <motion.line
              key={k}
              x1={ITEMS.sword.cx}
              y1={ITEMS.sword.cy}
              x2={ITEMS[k].cx}
              y2={ITEMS[k].cy}
              stroke="#ffd84a"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray="4 10"
              vectorEffect="non-scaling-stroke"
              className="[filter:drop-shadow(0_0_6px_#ffb000)]"
              initial={{ pathLength: 0, strokeDashoffset: 0 }}
              animate={{ pathLength: 1, strokeDashoffset: -140 }}
              transition={{ pathLength: { duration: 0.6, delay: i * 0.2 }, strokeDashoffset: { duration: 1, repeat: Infinity, ease: "linear" } }}
            />
          ))}
      </svg>

      {/* the fairy: flies to whatever you're pointing at and lights it up */}
      {(() => {
        const target = hover && phase === "quest" && !found.includes(hover) ? ITEMS[hover] : null
        return (
          <>
            <motion.div
              className="pointer-events-none absolute h-[22cqw] w-[30cqw] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen blur-2xl"
              style={{ background: "radial-gradient(ellipse, rgba(210,255,190,0.6), rgba(160,230,255,0.2) 45%, transparent 68%)" }}
              initial={false}
              animate={target ? { left: `${target.cx}%`, top: `${target.cy}%`, opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.35 }}
            />
            <motion.div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              initial={false}
              animate={
                target
                  ? { left: `${target.cx}%`, top: `${target.cy - 14}%`, opacity: 1, scale: 1 }
                  : { left: "50%", top: "8%", opacity: 0, scale: 0.4 }
              }
              transition={{ type: "spring", stiffness: 140, damping: 16 }}
            >
              <motion.div
                className="relative h-[2.6cqw] w-[2.6cqw]"
                animate={reduce ? undefined : { y: ["0cqw", "-1.2cqw", "0cqw"], x: ["0cqw", "0.8cqw", "0cqw"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* wings */}
                {[-1, 1].map((side) => (
                  <motion.span
                    key={side}
                    className="absolute top-[-10%] h-[2.2cqw] w-[1.8cqw] rounded-[50%] bg-[#d8f4ff]/60"
                    style={{ [side < 0 ? "right" : "left"]: "60%", originX: side < 0 ? 1 : 0, rotate: side * 25 }}
                    animate={reduce ? undefined : { scaleX: [1, 0.25, 1] }}
                    transition={{ duration: 0.16, repeat: Infinity }}
                  />
                ))}
                <span className="absolute inset-0 rounded-full bg-white shadow-[0_0_2cqw_1cqw_rgba(150,230,255,0.85)]" />
                {/* HEY! */}
                <span className="absolute bottom-[130%] left-[80%] whitespace-nowrap border-[0.25cqw] border-[#f4f0e8] bg-[#06080a] px-[0.7cqw] py-[0.4cqw] text-[1.1cqw] text-[#f4f0e8]">
                  HEY!
                </span>
              </motion.div>
            </motion.div>
          </>
        )
      })()}

      {/* glints on the things still hidden */}
      <AnimatePresence>
        {glint && phase === "quest" && (
          <motion.span
            key={glint}
            className="pointer-events-none absolute w-[2.4cqw] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${ITEMS[glint].cx}%`, top: `${ITEMS[glint].cy - 6}%` }}
            initial={{ scale: 0, rotate: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 0.9], rotate: 90, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PixelGrid rows={STAR} colors={{ W: "#fff" }} className="block h-auto w-full [filter:drop-shadow(0_0_6px_#fff)]" />
          </motion.span>
        )}
      </AnimatePresence>

      {/* golden aura on the shoes while they power up, and after */}
      {(powering || done) &&
        (["left", "right", "sword"] as const).map((k, i) => (
          <motion.div
            key={k}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen blur-2xl"
            style={{
              left: `${ITEMS[k].cx}%`,
              top: `${ITEMS[k].cy}%`,
              width: "30cqw",
              height: "20cqw",
              background: "radial-gradient(ellipse, rgba(255,210,80,0.55), transparent 65%)",
            }}
            animate={reduce ? { opacity: 0.7 } : { opacity: [0.35, 0.9, 0.35], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: powering ? 0.5 : 2.4, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}

      {/* item get: a flash where it was found, and the item held up high */}
      <AnimatePresence>
        {getting && item && (
          <motion.div key={getting} className="pointer-events-none absolute inset-0" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white mix-blend-screen blur-xl"
              style={{ left: `${item.cx}%`, top: `${item.cy}%`, width: "26cqw", height: "26cqw" }}
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
            <motion.div
              className="absolute -translate-x-1/2"
              style={{ left: `${item.cx}%`, top: `${item.cy - 26}%` }}
              initial={{ y: "8cqw", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <motion.div
                className="absolute left-1/2 top-1/2 h-[16cqw] w-[16cqw] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,240,180,0.7), transparent 65%)" }}
                animate={{ scale: [0.9, 1.15, 0.9] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
              <Sprite
                item={getting}
                className={`relative block h-auto [filter:drop-shadow(0_0_0.6cqw_#fff)] ${getting === "sword" ? "w-[5cqw]" : "w-[9cqw]"}`}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the moment it all powers up: white flash, a ring and the Triforce */}
      <AnimatePresence>
        {done && (
          <motion.div key="burst" className="pointer-events-none absolute inset-0">
            <motion.div
              className="absolute inset-[-50vmax] bg-white"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
            />
            <motion.div
              className="absolute left-[38%] top-[42%] h-[10cqw] w-[10cqw] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.6cqw] border-[#ffe680]"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 9, opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            {!reduce &&
              Array.from({ length: 18 }, (_, i) => {
                const a = (i / 18) * Math.PI * 2
                return (
                  <motion.span
                    key={i}
                    className="absolute h-[0.7cqw] w-[0.7cqw] bg-[#ffe680] shadow-[0_0_1cqw_#ffb000]"
                    style={{ left: "38%", top: "42%" }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{ x: `${Math.cos(a) * 40}cqw`, y: `${Math.sin(a) * 26}cqw`, opacity: 0 }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                  />
                )
              })}
            <motion.div
              className="absolute left-1/2 top-[6%] w-[12cqw] -translate-x-1/2"
              initial={{ y: "-6cqw", opacity: 0, scale: 0.6 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
            >
              <motion.div
                animate={reduce ? undefined : { y: ["0cqw", "-0.8cqw", "0cqw"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <PixelGrid
                  rows={TRIFORCE}
                  colors={{ T: "#ffd84a" }}
                  className="block h-auto w-full [filter:drop-shadow(0_0_1.2cqw_#ffb000)_drop-shadow(0_0_0.3cqw_#fff6c0)]"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zelda-style status box: life, rupees and the items you hold */}
      <div
        className="absolute flex items-center justify-between gap-[1.4cqw] border-[0.4cqw] border-[#f4f0e8] bg-[#06080a] px-[1.6cqw] text-[#f4f0e8]"
        style={{ left: `${BOX.left}%`, top: `${BOX.top}%`, width: `${BOX.width}%`, height: `${BOX.height}%` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-[1cqw]">
          <span className="text-[1.2cqw] text-[#e04040]">-LIFE-</span>
          <div className="flex gap-[0.5cqw]">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={`${i}-${hearts > i}`}
                className="block w-[1.9cqw]"
                initial={hearts > i ? { scale: 1.6 } : false}
                animate={{ scale: 1 }}
              >
                <PixelGrid rows={HEART} colors={{ R: hearts > i ? (done ? "#ffd84a" : "#e02828") : "#3a3a3a" }} className="block h-auto w-full" />
              </motion.span>
            ))}
          </div>
          <span className="flex items-center gap-[0.6cqw] text-[1.1cqw]">
            <PixelGrid rows={RUPEE} colors={{ G: "#2fbf4a", L: "#b8ffb0" }} className="block h-auto w-[1cqw]" />x{rupees}
          </span>
        </div>
        <div className="flex gap-[1cqw]">
          {(["sword", "left", "right"] as const).map((k) => (
            <div key={k} className="flex flex-col items-center gap-[0.4cqw]">
              <div className="flex h-[6cqw] w-[4.6cqw] items-center justify-center border-[0.3cqw] border-[#3a5adc]">
                {found.includes(k) && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={k === "sword" ? "block w-[1.8cqw]" : "block w-[3.4cqw]"}>
                    <Sprite item={k} className="block h-auto w-full" />
                  </motion.span>
                )}
              </div>
              <span className="text-[0.8cqw] text-white/60">{k === "sword" ? "A" : k === "left" ? "B" : "C"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* dialog box */}
      <div
        className="absolute bottom-[4%] left-1/2 w-[58%] -translate-x-1/2 border-[0.4cqw] border-[#f4f0e8] bg-[#06080a]/95 px-[2cqw] py-[1.4cqw] text-center text-[1.5cqw] leading-[2.4cqw] text-[#f4f0e8]"
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "quest" && !toast && (
          <div key={`quest-${found.length}`}>
            {found.length === 0 ? (
              <>
                <Typed text="IT'S DANGEROUS TO GO ALONE!" perChar={0.04} />
                <br />
                <Typed text="FIND THE SWORD AND THE SHOES." delay={1.2} perChar={0.04} />
              </>
            ) : (
              <Typed text={`${ORDER.length - found.length} MORE TO FIND...`} perChar={0.05} />
            )}
          </div>
        )}
        {toast && phase === "quest" && (
          <div key="toast" className="text-[#b8ffb0]">
            <Typed text={toast[0]} perChar={0.03} />
            <br />
            <Typed text={toast[1]} delay={0.5} perChar={0.03} />
          </div>
        )}
        {phase === "get" && item && (
          <div key={`get-${getting}`}>
            <Typed text={item.name[0]} perChar={0.04} />
            <br />
            <span className="text-[#ffd84a]">
              <Typed text={item.name[1]} delay={0.55} perChar={0.04} />
            </span>
          </div>
        )}
        {powering && (
          <div key="power" className="text-[#ffd84a]">
            <Typed text="THE SWORD AWAKENS..." perChar={0.06} />
            <br />
            <Typed text="ITS POWER FLOWS INTO THE SHOES!" delay={1.2} perChar={0.035} />
          </div>
        )}
        {done && (
          <div key="done" className="flex flex-col items-center gap-[0.8cqw]">
            <p className="text-[2.2cqw] text-[#ffd84a] [text-shadow:0_0_1cqw_rgba(255,190,0,0.8)]">
              <Typed text="POWER UP!" perChar={0.07} />
            </p>
            <Typed text="THE LEGEND SHOES ARE AWAKE." delay={0.7} perChar={0.035} />
            <button type="button" className="mt-[0.4cqw] text-[1cqw] text-white/60 underline-offset-4 hover:text-white hover:underline" onClick={replay}>
              PLAY AGAIN
            </button>
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
    </div>
  )
}
