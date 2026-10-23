"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

// Night-sky graphics for the Batman '89 page: the film's Bat-Signal (a cream disc with the
// bat's shadow, cast up by a beam from below) in the upper left, and the Joker's parade
// balloons bobbing on their strings in the upper right.

// Bat shadow, measured from a still of the 1989 film's signal and mirrored for symmetry.
// It fills the dark oval (rx 98 / ry 88) inside the lit disc; the wing tips run past the
// oval and get clipped to it, leaving the blade-shaped top lobes, the four scallops and the
// long center point at the bottom.
const BAT_PATH = "M 0.0 -71.2 L 2.9 -71.8 L 5.4 -74.1 L 7.3 -78.4 L 8.9 -83.7 L 10.5 -89.0 L 12.1 -95.0 L 13.1 -90.4 L 14.0 -84.4 L 15.0 -74.5 L 16.0 -61.2 L 17.2 -46.3 L 19.1 -35.4 L 25.2 -30.1 L 31.9 -32.1 L 39.6 -35.4 L 47.2 -40.7 L 52.6 -46.7 L 55.8 -54.0 L 56.5 -61.9 L 54.2 -69.5 L 49.1 -76.5 L 43.4 -81.1 L 37.0 -84.7 L 53.6 -104.3 L 136.5 -64.5 L 136.5 54.6 L 111.0 97.6 L 56.8 78.4 L 60.3 70.5 L 62.8 61.2 L 63.8 50.6 L 61.9 40.7 L 57.7 33.4 L 51.7 29.5 L 48.2 29.1 L 42.7 34.8 L 38.9 42.0 L 36.7 49.0 L 34.1 41.4 L 30.9 33.4 L 26.2 26.1 L 23.0 22.8 L 19.1 24.8 L 12.8 32.1 L 9.6 41.4 L 6.4 53.0 L 3.2 63.9 L 0.0 71.8 L -3.2 63.9 L -6.4 53.0 L -9.6 41.4 L -12.8 32.1 L -19.1 24.8 L -23.0 22.8 L -26.2 26.1 L -30.9 33.4 L -34.1 41.4 L -36.7 49.0 L -38.9 42.0 L -42.7 34.8 L -48.2 29.1 L -51.7 29.5 L -57.7 33.4 L -61.9 40.7 L -63.8 50.6 L -62.8 61.2 L -60.3 70.5 L -56.8 78.4 L -111.0 97.6 L -136.5 54.6 L -136.5 -64.5 L -53.6 -104.3 L -37.0 -84.7 L -43.4 -81.1 L -49.1 -76.5 L -54.2 -69.5 L -56.5 -61.9 L -55.8 -54.0 L -52.6 -46.7 L -47.2 -40.7 L -39.6 -35.4 L -31.9 -32.1 L -25.2 -30.1 L -19.1 -35.4 L -17.2 -46.3 L -16.0 -61.2 L -15.0 -74.5 L -14.0 -84.4 L -13.1 -90.4 L -12.1 -95.0 L -10.5 -89.0 L -8.9 -83.7 L -7.3 -78.4 L -5.4 -74.1 L -2.9 -71.8 Z"

const LIGHT = "#f4ead0"
const NIGHT = "#0d1424"

function BatSignal() {
  return (
    <>
      {/* the signal on the clouds */}
      <motion.div
        className="absolute"
        style={{ left: "15%", top: "17%", width: "clamp(130px, 12vw, 230px)", aspectRatio: "260 / 236", translate: "-50% -50%" }}
        animate={{ opacity: [0.92, 1, 0.94, 1, 0.92] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* light spilling onto the clouds */}
        <div
          className="absolute -inset-[45%] rounded-full mix-blend-screen"
          style={{ background: `radial-gradient(closest-side, ${LIGHT}55, ${LIGHT}18 60%, transparent)` }}
        />
        <svg viewBox="-130 -118 260 236" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            {/* the dark oval, plus room above it so the ear tips keep their points */}
            <clipPath id="signal-disc">
              <ellipse rx="98" ry="88" />
              <rect x="-22" y="-110" width="44" height="40" />
            </clipPath>
            <radialGradient id="signal-fill">
              <stop offset="0" stopColor="#fffaf0" />
              <stop offset="0.8" stopColor={LIGHT} />
              <stop offset="1" stopColor="#e6d8b4" />
            </radialGradient>
            <radialGradient id="signal-halo">
              <stop offset="0.6" stopColor={LIGHT} stopOpacity="0.35" />
              <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
            </radialGradient>
            {/* beam: bright near the disc, fading toward its source */}
            <linearGradient id="signal-beam" x1="0" y1="0" x2="143" y2="402" gradientUnits="userSpaceOnUse">
              <stop offset="0.2" stopColor={LIGHT} stopOpacity="0.5" />
              <stop offset="0.75" stopColor={LIGHT} stopOpacity="0.3" />
              <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
            </linearGradient>
            <filter id="signal-soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.1" />
            </filter>
            <filter id="signal-beam-blur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          {/* beam angling up from the lower right, as wide as the disc where it meets it */}
          <g className="mix-blend-screen">
            <polygon points="-92,33 92,-33 160,392 86,418" fill="url(#signal-beam)" filter="url(#signal-beam-blur)" />
          </g>

          <ellipse rx="130" ry="118" fill="url(#signal-halo)" />
          <g filter="url(#signal-soft)">
            <ellipse rx="105" ry="104" fill="url(#signal-fill)" />
            <path d={BAT_PATH} fill={NIGHT} opacity="0.94" clipPath="url(#signal-disc)" />
          </g>
        </svg>
      </motion.div>
    </>
  )
}

// ───── Joker parade balloons ─────

const SKIN = "#dbe4ef"
const SHADE = "#9eacbf"
const INK = "#141a24"

// Long, slightly wavy strings hanging from a balloon, swaying gently
function Strings({ count, spread, length, delay }: { count: number; spread: number; length: number; delay: number }) {
  return (
    <motion.g
      style={{ transformOrigin: "50px 0px" }}
      animate={{ rotate: [-3, 3, -3] }}
      transition={{ duration: 4.5, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {Array.from({ length: count }, (_, i) => {
        const x = 50 + (i - (count - 1) / 2) * spread
        return (
          <path
            key={i}
            d={`M ${x} 0 C ${x + 4} ${length * 0.3}, ${x - 5} ${length * 0.6}, ${x + 2} ${length}`}
            stroke="#5b6676"
            strokeWidth="1.1"
            fill="none"
            opacity="0.85"
          />
        )
      })}
    </motion.g>
  )
}

function Balloon({
  x,
  y,
  width,
  bob,
  delay,
  children,
}: {
  x: string
  y: string
  width: string
  bob: number
  delay: number
  children: ReactNode
}) {
  return (
    <motion.div
      className="absolute"
      style={{
        left: x,
        top: y,
        width,
        translate: "-50% 0",
        opacity: 0.82,
        filter: "blur(0.6px) drop-shadow(0 0 14px rgba(190,210,240,0.4))",
      }}
      animate={{ y: [0, -bob, 0, bob * 0.5, 0], rotate: [-2, 2, -1, 1.5, -2] }}
      transition={{ duration: 6 + delay, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  )
}

// Clown head with a dotted party hat, ringed eyes, a toothy grin and a ruffled collar
function ClownBalloon() {
  return (
    <svg viewBox="0 0 100 230" className="w-full overflow-visible">
      <g transform="translate(0 112)">
        <Strings count={3} spread={10} length={115} delay={0} />
      </g>
      {/* hat */}
      <path d="M 40 30 L 54 2 L 66 28 Z" fill={SKIN} stroke={SHADE} strokeWidth="1.5" />
      {[[52, 12], [57, 20], [48, 22]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.2" fill={INK} />
      ))}
      <circle cx="54" cy="2" r="3.5" fill={SKIN} />
      {/* arms */}
      <path d="M 24 70 Q 10 66 6 58 M 76 70 Q 90 66 94 60" stroke={SKIN} strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* head */}
      <ellipse cx="50" cy="58" rx="26" ry="27" fill={SKIN} />
      <ellipse cx="56" cy="64" rx="20" ry="20" fill={SHADE} opacity="0.25" />
      {/* eyes */}
      {[40, 60].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="52" r="7" fill="none" stroke={INK} strokeWidth="2.5" />
          <circle cx={cx} cy="52" r="2.5" fill={INK} />
        </g>
      ))}
      {/* grin */}
      <path d="M 34 66 Q 50 84 66 66 Q 50 74 34 66 Z" fill={INK} />
      <path d="M 38 68 L 62 68" stroke={SKIN} strokeWidth="2" strokeDasharray="3 2" />
      {/* ruffled collar and striped body */}
      <path d="M 26 86 Q 32 80 38 86 Q 44 80 50 86 Q 56 80 62 86 Q 68 80 74 86 L 70 92 L 30 92 Z" fill={SKIN} stroke={SHADE} />
      <path d="M 32 92 L 68 92 L 62 112 L 38 112 Z" fill={SKIN} />
      <path d="M 36 98 L 64 98 M 38 105 L 62 105" stroke={INK} strokeWidth="2.5" />
    </svg>
  )
}

// Jellyfish-like blob with a round head and long trailing fins
function JellyBalloon() {
  return (
    <svg viewBox="0 0 100 230" className="w-full overflow-visible">
      <g transform="translate(0 70)">
        <Strings count={4} spread={8} length={150} delay={0.6} />
      </g>
      <motion.path
        d="M 30 50 Q 14 70 4 86 Q 22 78 34 66 Q 30 84 22 100 Q 40 86 46 68 Z"
        fill={SKIN}
        opacity="0.9"
        animate={{ d: [
          "M 30 50 Q 14 70 4 86 Q 22 78 34 66 Q 30 84 22 100 Q 40 86 46 68 Z",
          "M 30 50 Q 16 72 8 92 Q 24 80 34 66 Q 32 86 28 104 Q 42 86 46 68 Z",
          "M 30 50 Q 14 70 4 86 Q 22 78 34 66 Q 30 84 22 100 Q 40 86 46 68 Z",
        ] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <ellipse cx="54" cy="44" rx="24" ry="22" fill={SKIN} />
      <ellipse cx="60" cy="50" rx="16" ry="14" fill={SHADE} opacity="0.3" />
      <circle cx="62" cy="40" r="5" fill={INK} />
      <circle cx="63.5" cy="38.5" r="1.5" fill={SKIN} />
    </svg>
  )
}

// Round face with pointy horns and a wide row of teeth
function HornBalloon() {
  return (
    <svg viewBox="0 0 100 230" className="w-full overflow-visible">
      <g transform="translate(0 78)">
        <Strings count={3} spread={14} length={140} delay={1.1} />
      </g>
      <path d="M 30 28 L 26 4 L 42 22 Z M 70 28 L 74 4 L 58 22 Z" fill={SKIN} stroke={SHADE} strokeWidth="1.2" />
      <ellipse cx="50" cy="48" rx="26" ry="30" fill={SKIN} />
      <ellipse cx="56" cy="54" rx="19" ry="22" fill={SHADE} opacity="0.25" />
      <path d="M 36 36 Q 41 32 46 36 M 54 36 Q 59 32 64 36" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="30" y="46" width="40" height="16" rx="7" fill={INK} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={32 + i * 5.3} y="48" width="4" height="12" rx="1" fill={SKIN} />
      ))}
    </svg>
  )
}

// Small round head with floppy ears and a nose
function PupBalloon() {
  return (
    <svg viewBox="0 0 100 230" className="w-full overflow-visible">
      <g transform="translate(0 64)">
        <Strings count={2} spread={14} length={140} delay={1.6} />
      </g>
      <ellipse cx="26" cy="40" rx="9" ry="14" fill={SKIN} transform="rotate(-25 26 40)" />
      <ellipse cx="50" cy="42" rx="24" ry="22" fill={SKIN} />
      <ellipse cx="56" cy="48" rx="16" ry="14" fill={SHADE} opacity="0.3" />
      <circle cx="44" cy="38" r="3.5" fill={INK} />
      <circle cx="60" cy="38" r="3.5" fill={INK} />
      <ellipse cx="53" cy="50" rx="5" ry="3.5" fill={INK} />
      <path d="M 66 30 Q 76 18 82 26" stroke={SKIN} strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function BatmanSky() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[15] overflow-hidden" aria-hidden>
      <BatSignal />

      {/* Joker's parade balloons drifting over the upper right */}
      <Balloon x="73.5%" y="1%" width="clamp(100px, 10vw, 180px)" bob={14} delay={0}>
        <ClownBalloon />
      </Balloon>
      <Balloon x="82%" y="9%" width="clamp(80px, 8vw, 145px)" bob={10} delay={0.8}>
        <JellyBalloon />
      </Balloon>
      <Balloon x="90%" y="4%" width="clamp(80px, 8vw, 145px)" bob={12} delay={1.5}>
        <HornBalloon />
      </Balloon>
      <Balloon x="96.5%" y="14%" width="clamp(58px, 5.5vw, 100px)" bob={9} delay={2.2}>
        <PupBalloon />
      </Balloon>
    </div>
  )
}
