"use client"

import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

// Hoverboard Highs: click the photo and the board takes off.
// The rider (jeans, shoes and board, cut out of the photo) stays put and bobs
// while a sideways-streaked copy of the street rushes past behind it, filling the
// whole page, with speed lines, kicked-up dust and a pulsing glow under the board.
//
// hoverboard_highs_rider3.png is the cut-out; hoverboard_highs_streak4.jpg is the street
// with the rider filled in, motion-blurred, and its ends cross-faded so it loops seamlessly.
// hoverboard_highs_legs.png carries the jeans on above the top of the photo

const RIDER = "/shoes/hoverboard_highs/hoverboard_highs_rider3.png"
const STREAK = "/shoes/hoverboard_highs/hoverboard_highs_streak4.jpg"
const LEGS = "/shoes/hoverboard_highs/hoverboard_highs_legs.png"
const STREAK_RATIO = 1004 / 848
const TILES = 5

// fixed pseudo-random values so server and client render the same thing
function seeded(n: number) {
  const s = Math.sin(n * 9301 + 49297) * 233280
  return s - Math.floor(s)
}

const LINES = Array.from({ length: 22 }, (_, i) => ({
  top: 4 + seeded(i) * 92,
  width: 12 + seeded(i + 40) * 22,
  delay: seeded(i + 80) * 0.9,
  duration: 0.35 + seeded(i + 120) * 0.35,
  opacity: 0.35 + seeded(i + 160) * 0.5,
}))

const DUST = Array.from({ length: 22 }, (_, i) => ({
  top: 66 + seeded(i + 200) * 22,
  size: 2 + seeded(i + 240) * 4,
  delay: seeded(i + 280) * 0.8,
  duration: 0.45 + seeded(i + 320) * 0.4,
  rise: -10 - seeded(i + 360) * 40,
}))

// The street rushing past behind everything, full page. TILES copies side by side,
// each the full screen height, sliding right by one tile and looping.
export function HoverboardStreet({ riding }: { riding: boolean }) {
  const speed = useReducedMotion() ? 4 : 1

  return (
    <AnimatePresence>
      {riding && (
        <motion.div
          key="street"
          className="pointer-events-none fixed inset-0 -z-40 overflow-hidden bg-neutral-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 flex"
            initial={{ x: `${-100 / TILES}%` }}
            animate={{ x: "0%" }}
            transition={{ duration: 0.45 * speed, ease: "linear", repeat: Infinity }}
          >
            {Array.from({ length: TILES }, (_, i) => (
              <div
                key={i}
                className="h-full shrink-0"
                style={{
                  aspectRatio: `${STREAK_RATIO}`,
                  backgroundImage: `url(${STREAK})`,
                  backgroundSize: "100% 100%",
                }}
              />
            ))}
          </motion.div>

          {/* speed lines */}
          {LINES.map((l, i) => (
            <motion.span
              key={i}
              className="absolute left-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white to-transparent"
              style={{ top: `${l.top}%`, width: `${l.width}%` }}
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: "800%", opacity: [0, l.opacity, 0] }}
              transition={{ duration: l.duration * speed, delay: l.delay, ease: "linear", repeat: Infinity }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// The rider, inside the photo frame so it lines up with the photo it was cut from
export default function HoverboardRide({ riding }: { riding: boolean }) {
  const reduce = useReducedMotion()
  const speed = reduce ? 4 : 1

  return (
    <AnimatePresence>
      {riding && (
        <motion.div
          key="ride"
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* the board's shadow stays under it, breathing with the bob */}
          <motion.div
            className="absolute rounded-[50%] bg-black/45 blur-xl"
            style={{ left: "26%", top: "76%", width: "58%", height: "8%" }}
            animate={reduce ? undefined : { scaleX: [1, 0.9, 1], opacity: [0.9, 0.6, 0.9] }}
            transition={{ duration: 0.6, ease: "easeInOut", repeat: Infinity }}
          />

          {/* blue thruster glow under the board */}
          <motion.div
            className="absolute rounded-[50%] bg-sky-400/70 blur-2xl mix-blend-screen"
            style={{ left: "32%", top: "68%", width: "50%", height: "9%" }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.3, ease: "easeInOut", repeat: Infinity }}
          />

          {/* dust kicked up behind the board */}
          {DUST.map((d, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-stone-700/80"
              style={{ top: `${d.top}%`, left: "62%", width: d.size, height: d.size }}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x: "45vw", y: d.rise, opacity: [0, 1, 0] }}
              transition={{ duration: d.duration * speed, delay: d.delay, ease: "easeOut", repeat: Infinity }}
            />
          ))}

          {/* the rider, hovering */}
          <motion.div
            className="absolute inset-0"
            initial={{ y: 0 }}
            animate={reduce ? { y: -4 } : { y: [0, -9, 0], rotate: [0, -0.4, 0] }}
            transition={{ duration: 0.6, ease: "easeInOut", repeat: reduce ? 0 : Infinity }}
          >
            {/* the photo cuts the jeans off at the top, so carry them on up the page */}
            <div
              className="absolute inset-x-0 bottom-full h-[100vh] -mb-px"
              style={{ backgroundImage: `url(${LEGS})`, backgroundSize: "100% 100%" }}
            />
            <Image src={RIDER} alt="" fill priority draggable={false} className="object-contain select-none" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
