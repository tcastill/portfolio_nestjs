"use client"

import Image from "next/image"
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { audio, noise, setMuted, tone } from "@/components/nes"

// Jurassic: the T-Rex paddock, on a stormy night, from inside the tour Jeep.
// The shoes ride on the dashboard, looking out through the rain-streaked windshield at the
// T-Rex. Beside the car, the park's security terminal runs on a beige 90s computer:
// - "access main security grid": PERMISSION DENIED... YOU DIDN'T SAY THE MAGIC WORD! (ah ah ah)
// - "fences: power down": the fence dies, impact tremors ripple the glass of water on the dash
//   and he gets closer in the windshield with every step, his eye lights up, he ROARS, and the
//   side mirror swings in (objects in mirror are closer than they appear). MUST GO FASTER.
// Sounds are made on the fly with Web Audio.
//
// jurassic_view.jpg is the photo above the shoes (the T-Rex), seen through the windshield;
// jurassic_shoes.png is the shoes cut out of the photo.

const VIEW = "/shoes/jurassic/jurassic_view.jpg"
const SHOES = "/shoes/jurassic/jurassic_shoes.png"

// the T-Rex's eye, as % of the windshield view box (the view is object-cover, 45% down)
const EYE = { x: 81.8, y: 52 }

type Phase = "idle" | "tremor" | "roar" | "chase" | "escaped" | "denied"

type Line = { id: number; text: string; tone?: "warn" | "ok" | "cmd" }

/* =========================
   SOUND
========================= */
function thud(power = 1) {
  tone(58, 0.5, { type: "sine", vol: 0.55 * power, to: 28 })
  noise(0.12, 0.08 * power)
}

function roar() {
  const a = audio()
  if (!a) return
  const t = a.currentTime
  const out = a.createGain()
  out.gain.setValueAtTime(0.0001, t)
  out.gain.exponentialRampToValueAtTime(0.5, t + 0.25)
  out.gain.setValueAtTime(0.5, t + 1.4)
  out.gain.exponentialRampToValueAtTime(0.0001, t + 2.4)
  const lp = a.createBiquadFilter()
  lp.type = "lowpass"
  lp.frequency.setValueAtTime(500, t)
  lp.frequency.linearRampToValueAtTime(1400, t + 0.5)
  lp.frequency.linearRampToValueAtTime(350, t + 2.4)
  lp.connect(out).connect(a.destination)

  // growl: detuned saws wobbling against each other
  ;[92, 97, 61].forEach((f) => {
    const o = a.createOscillator()
    o.type = "sawtooth"
    o.frequency.setValueAtTime(f, t)
    o.frequency.linearRampToValueAtTime(f * 1.35, t + 0.4)
    o.frequency.linearRampToValueAtTime(f * 0.8, t + 2.4)
    const lfo = a.createOscillator()
    const depth = a.createGain()
    lfo.frequency.value = 23
    depth.gain.value = f * 0.12
    lfo.connect(depth).connect(o.frequency)
    o.connect(lp)
    o.start(t)
    lfo.start(t)
    o.stop(t + 2.5)
    lfo.stop(t + 2.5)
  })

  // breath: noise through a sweeping band
  const buf = a.createBuffer(1, a.sampleRate * 2.4, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = a.createBufferSource()
  src.buffer = buf
  const bp = a.createBiquadFilter()
  bp.type = "bandpass"
  bp.Q.value = 1.2
  bp.frequency.setValueAtTime(700, t)
  bp.frequency.linearRampToValueAtTime(1600, t + 0.5)
  bp.frequency.linearRampToValueAtTime(400, t + 2.4)
  const g = a.createGain()
  g.gain.value = 0.9
  src.connect(bp).connect(g).connect(out)
  src.start(t)
}

const beep = (f = 880) => tone(f, 0.06, { type: "square", vol: 0.03 })
const ahAhAh = () => [0, 0.22, 0.44].forEach((at) => tone(620, 0.13, { type: "triangle", vol: 0.07, at }))
const powerDown = () => tone(440, 1.2, { type: "sawtooth", vol: 0.05, to: 40 })
const engine = () => {
  tone(70, 1.4, { type: "sawtooth", vol: 0.08, to: 190 })
  tone(105, 1.4, { type: "square", vol: 0.03, to: 280 })
}

const RAIN = "repeating-linear-gradient(100deg, transparent 0 22px, rgba(190,220,255,0.35) 22px 23px, transparent 23px 47px)"

/* =========================
   PAGE-WIDE STORM
========================= */
export function JurassicStorm({ image, heavy }: { image: string; heavy: boolean }) {
  const reduce = useReducedMotion()
  const flash = useAnimationControls()

  // lightning, every so often
  useEffect(() => {
    if (reduce) return
    let id = 0
    const strike = () => {
      void flash.start({ opacity: [0, 0.7, 0.1, 0.5, 0], transition: { duration: 0.6, times: [0, 0.1, 0.3, 0.4, 1] } })
      id = window.setTimeout(strike, 7000 + Math.random() * 9000)
    }
    id = window.setTimeout(strike, 3500)
    return () => window.clearTimeout(id)
  }, [flash, reduce])

  return (
    <>
      <div className="fixed inset-0 -z-50 bg-[#040705]">
        <div className="absolute inset-0 scale-110 bg-cover bg-center opacity-35 blur-3xl" style={{ backgroundImage: `url(${image})` }} />
      </div>

      {/* rain behind the car and the computer: two sheets of streaks at slightly different speeds */}
      {!reduce &&
        [0, 1].map((i) => (
          <motion.div
            key={i}
            className="pointer-events-none fixed inset-[-20vh_0_0_0] -z-40"
            style={{
              opacity: heavy ? 0.55 : 0.3,
              backgroundImage: RAIN,
              backgroundSize: i ? "180px 140px" : "120px 90px",
            }}
            animate={{ backgroundPositionY: ["0px", i ? "140px" : "90px"], backgroundPositionX: ["0px", "-14px"] }}
            transition={{ duration: (i ? 0.35 : 0.28) / (heavy ? 1.6 : 1), repeat: Infinity, ease: "linear" }}
          />
        ))}

      <motion.div className="pointer-events-none fixed inset-0 z-[46] bg-[#dfe8ff]" initial={{ opacity: 0 }} animate={flash} />
    </>
  )
}

/* =========================
   THE SCENE (inside the frame): the Jeep, and the computer beside it
========================= */
export default function JurassicFX({ onStorm }: { onStorm?: (heavy: boolean) => void }) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>("idle")
  const [fenceOn, setFenceOn] = useState(true)
  const [lines, setLines] = useState<Line[]>([])
  const [ripple, setRipple] = useState(0) // bumps on every tremor
  const [nearness, setNearness] = useState(0) // 0..1, how close he is
  const [typed, setTyped] = useState(0) // bumps on every command, to tap the keyboard
  const [sound, setSound] = useState(true)
  const timers = useRef<number[]>([])
  const nextId = useRef(1)
  const shake = useAnimationControls()

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const print = useCallback((text: string, kind?: Line["tone"]) => {
    setLines((l) => [...l.slice(-6), { id: nextId.current++, text, tone: kind }])
    if (kind === "cmd") setTyped((t) => t + 1)
    beep(kind === "warn" ? 440 : 880)
  }, [])

  // the terminal boots up
  useEffect(() => {
    const boot = ["Jurassic Park, System Security Interface", "Version 4.0.5, Alpha E", "Ready..."]
    boot.forEach((text, i) => timers.current.push(window.setTimeout(() => setLines((l) => [...l, { id: nextId.current++, text }]), 400 + i * 500)))
  }, [])

  const quake = useCallback(
    (power: number) => {
      thud(power)
      setRipple((r) => r + 1)
      if (!reduce) {
        const main = document.querySelector("main")
        main?.animate(
          [
            { transform: "translate(0,0)" },
            { transform: `translate(${-4 * power}px, ${6 * power}px)` },
            { transform: `translate(${3 * power}px, ${-3 * power}px)` },
            { transform: "translate(0,0)" },
          ],
          { duration: 260, easing: "ease-out" }
        )
      }
    },
    [reduce]
  )

  const fencesDown = useCallback(() => {
    if (phase !== "idle") return
    print("> fences: power down", "cmd")
    later(500, () => {
      setFenceOn(false)
      powerDown()
      print("PADDOCK 9 FENCE ... OFFLINE", "warn")
    })
    setPhase("tremor")
    onStorm?.(true)
    // impact tremors, getting closer
    const steps = [1800, 3200, 4400, 5400, 6200]
    steps.forEach((ms, i) =>
      later(ms, () => {
        quake(0.5 + i * 0.15)
        setNearness((i + 1) / steps.length)
      })
    )
    later(4600, () => print("IMPACT TREMOR DETECTED", "warn"))
    later(7000, () => {
      setPhase("roar")
      roar()
      print("!!! T-REX OUT OF PADDOCK !!!", "warn")
      if (!reduce) shake.start({ x: [0, -18, 16, -14, 12, -9, 7, -4, 0], y: [0, 10, -8, 7, -5, 3, 0], transition: { duration: 1.4 } })
    })
    later(9400, () => {
      setPhase("chase")
      print("RUN.", "warn")
    })
    // keep stomping while he chases you
    ;[10200, 10900, 11500, 12000, 12400, 12750, 13050].forEach((ms) => later(ms, () => quake(1)))
  }, [phase, print, later, quake, shake, reduce, onStorm])

  const escape = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    engine()
    setPhase("escaped")
    setNearness(0)
    print("> MUST GO FASTER", "cmd")
    later(1200, () => print("Vehicle clear of paddock. You made it.", "ok"))
    later(2600, () => {
      print("> fences: power up", "cmd")
      setFenceOn(true)
      tone(60, 0.9, { type: "sawtooth", vol: 0.05, to: 440 })
    })
    later(3600, () => {
      setPhase("idle")
      onStorm?.(false)
    })
  }, [print, later, onStorm])

  // if you don't hit MUST GO FASTER, you get away anyway... barely
  useEffect(() => {
    if (phase !== "chase") return
    const id = window.setTimeout(escape, 6500)
    return () => window.clearTimeout(id)
  }, [phase, escape])

  const grid = useCallback(() => {
    if (phase !== "idle") return
    print("> access main security grid", "cmd")
    later(700, () => print("access: PERMISSION DENIED....and....", "warn"))
    later(1500, () => {
      setPhase("denied")
      ;[0, 700, 1400, 2100, 2800, 3500].forEach((ms) => later(ms, ahAhAh))
    })
    later(6000, () => setPhase("idle"))
  }, [phase, print, later])

  const security = useCallback(() => {
    if (phase !== "idle") return
    print("> access security", "cmd")
    later(700, () => print("access: PERMISSION DENIED.", "warn"))
  }, [phase, print, later])

  const busy = phase !== "idle"
  const eyeLit = phase === "roar" || (phase === "tremor" && nearness >= 1)
  // he fills more of the windshield with every step
  const zoom = phase === "roar" ? 1.6 : phase === "tremor" ? 1 + nearness * 0.45 : 1

  return (
    <motion.div className="absolute inset-0 @container" animate={shake}>
      {/* =========================
          THE JEEP
      ========================= */}
      <div className="absolute inset-y-0 left-0 w-full overflow-hidden rounded-[1.6cqw] bg-[#121311] shadow-[0_2cqw_5cqw_rgba(0,0,0,0.7)] @3xl:w-[62%]">
        {/* the windshield: the T-Rex outside, rain on the glass, wipers */}
        <div className="absolute inset-0" style={{ clipPath: "polygon(10% 8%, 90% 8%, 97% 76%, 3% 76%)" }}>
          <div className="absolute left-[3%] top-[8%] h-[68%] w-[94%] overflow-hidden">
            <motion.div
              className="absolute inset-0"
              style={{ transformOrigin: `${EYE.x}% ${EYE.y}%` }}
              animate={{ scale: zoom }}
              transition={{ duration: phase === "roar" ? 0.6 : 0.5, ease: "easeOut" }}
            >
              <Image
                src={VIEW}
                alt="The T-Rex, outside the windshield"
                fill
                priority
                draggable={false}
                className="object-cover select-none"
                style={{ objectPosition: "50% 45%" }}
              />
              {/* his eye catches the light */}
              <AnimatePresence>
                {eyeLit && (
                  <motion.span
                    className="pointer-events-none absolute h-[1.4cqw] w-[1.4cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffe14a] mix-blend-screen blur-[1px]"
                    style={{ left: `${EYE.x}%`, top: `${EYE.y}%`, boxShadow: "0 0 1.6cqw 0.8cqw rgba(255,210,40,0.7)" }}
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: [0, 1, 0.7, 1], scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* night tint and glass sheen */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1420]/40 via-transparent to-[#0a1420]/30" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.07)_45%,transparent_55%)]" />

          {/* rain on the glass */}
          <RainOnGlass reduce={!!reduce} heavy={busy && phase !== "denied"} />

          {/* wipers, sweeping now and then */}
          {[
            { left: "18%", delay: 0 },
            { left: "54%", delay: 0.12 },
          ].map((w) => (
            <motion.div
              key={w.left}
              className="absolute top-[75%] h-[0.7cqw] w-[38%] origin-left rounded-full bg-[#050505] shadow-[0_0.2cqw_0.4cqw_rgba(0,0,0,0.6)]"
              style={{ left: w.left }}
              initial={{ rotate: -6 }}
              animate={reduce ? undefined : { rotate: [-6, -62, -6] }}
              transition={{ duration: busy ? 0.9 : 1.6, delay: w.delay, repeat: Infinity, repeatDelay: busy ? 0.2 : 3.4, ease: "easeInOut" }}
            />
          ))}
        </div>

        {/* the cabin around the windshield */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="jp-cabin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0b0c0b" />
              <stop offset="1" stopColor="#1b1d1a" />
            </linearGradient>
            <linearGradient id="jp-dash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3a342a" />
              <stop offset="0.12" stopColor="#262219" />
              <stop offset="1" stopColor="#0f0e0b" />
            </linearGradient>
          </defs>
          {/* roof, pillars and doors: everything that isn't windshield */}
          <path fillRule="evenodd" fill="url(#jp-cabin)" d="M0 0 H100 V100 H0 Z M10 8 L90 8 L97 76 L3 76 Z" />
          {/* rubber seal round the glass */}
          <path d="M10 8 L90 8 L97 76 L3 76 Z" fill="none" stroke="#000" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          {/* roll bar across the top */}
          <rect x="0" y="0" width="100" height="5" fill="#070807" />
          <rect x="0" y="4.4" width="100" height="0.6" fill="#2b2d2a" />
          {/* rear-view mirror */}
          <rect x="49.4" y="5" width="1.2" height="4" fill="#070807" />
          <rect x="41" y="8.5" width="18" height="7" rx="1.6" fill="#0a0b0a" stroke="#2b2d2a" strokeWidth="0.4" />
          <rect x="42" y="9.4" width="16" height="5.2" rx="1.1" fill="#1c2733" opacity="0.9" />
          {/* dashboard */}
          <path d="M0 79 Q50 69 100 79 L100 100 L0 100 Z" fill="url(#jp-dash)" />
          <path d="M0 79 Q50 69 100 79" fill="none" stroke="#5a5040" strokeWidth="0.5" opacity="0.7" />
          {/* the passenger grab bar */}
          <path d="M86 84 Q92 76 99 81" fill="none" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M86 84 Q92 76 99 81" fill="none" stroke="#3d3a33" strokeWidth="0.6" strokeLinecap="round" />
          {/* vents */}
          {[14, 22, 30].map((x) => (
            <rect key={x} x={x} y="89" width="6" height="2.4" rx="0.6" fill="#0a0a09" />
          ))}
        </svg>

        {/* the shoes, riding on the dash */}
        <div className="pointer-events-none absolute bottom-[23%] left-[16%] w-[54%]">
          <div className="absolute inset-x-[6%] bottom-[-4%] h-[18%] rounded-[50%] bg-black/70 blur-md" />
          <motion.div
            key={`shoes-${ripple}`}
            initial={{ y: 0 }}
            animate={ripple && !reduce ? { y: ["0%", "-5%", "0%", "-2%", "0%"] } : { y: "0%" }}
            transition={{ duration: 0.45 }}
          >
            <Image
              src={SHOES}
              alt="Jurassic shoes on the dashboard"
              width={1200}
              height={506}
              priority
              draggable={false}
              className="relative h-auto w-full select-none"
            />
          </motion.div>
        </div>

        {/* the glass of water on the dash */}
        <div className="pointer-events-none absolute bottom-[23%] left-[76%] w-[9%]">
          <WaterGlass ripple={ripple} reduce={!!reduce} />
        </div>

        {/* the roar: a dark red pulse closing in */}
        <AnimatePresence>
          {phase === "roar" && (
            <motion.div
              key="roar"
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(circle at center, transparent 30%, rgba(120,10,0,0.6) 75%)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
            />
          )}
        </AnimatePresence>

        {/* objects in mirror are closer than they appear */}
        <AnimatePresence>
          {phase === "chase" && (
            <motion.div
              key="mirror"
              className="absolute left-[2%] top-[10%] w-[38%] origin-left"
              initial={{ x: "-110%", rotate: -8 }}
              animate={{ x: 0, rotate: reduce ? -3 : [-3, -1.5, -3.5, -2, -3] }}
              exit={{ x: "-120%", opacity: 0 }}
              transition={{ x: { duration: 0.5, ease: "easeOut" }, rotate: { duration: 0.4, repeat: Infinity } }}
            >
              <div className="rounded-[3cqw] bg-gradient-to-b from-[#3a3d42] to-[#16181b] p-[1cqw] shadow-[0_1.5cqw_3cqw_rgba(0,0,0,0.7)]">
                <div className="relative aspect-[1.6] overflow-hidden rounded-[2.2cqw] border-[0.3cqw] border-[#0c0d0f]">
                  <motion.div
                    className="absolute inset-0"
                    animate={{ scale: [1, 1.15, 1.25, 1.4, 1.6, 1.85], y: reduce ? 0 : ["0%", "-2%", "1%", "-3%", "2%", "0%"] }}
                    transition={{ duration: 6.5, ease: "easeIn" }}
                  >
                    {/* mirrors flip things */}
                    <div
                      className="absolute inset-0 -scale-x-100"
                      style={{ backgroundImage: `url(${VIEW})`, backgroundSize: "260%", backgroundPosition: "92% 48%" }}
                    />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/30" />
                  <p className="absolute inset-x-0 bottom-[7%] px-[4%] text-center font-sans text-[1.05cqw] font-semibold uppercase tracking-wider text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                    Objects in mirror are closer than they appear
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {phase === "chase" && (
            <motion.button
              key="faster"
              type="button"
              className="absolute bottom-[7%] right-[5%] rounded-sm border-[0.25cqw] border-[#ffe14a] bg-[#c8102e] px-[2.4cqw] py-[1cqw] font-sans text-[1.8cqw] font-black uppercase tracking-wider text-[#ffe14a] shadow-[0_0_2cqw_rgba(255,60,40,0.6)]"
              initial={{ opacity: 0, y: 10 }}
              animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: [1, 1.06, 1] }}
              exit={{ opacity: 0 }}
              transition={{ scale: { duration: 0.5, repeat: Infinity } }}
              onClick={(e) => {
                e.stopPropagation()
                escape()
              }}
            >
              Must go faster!
            </motion.button>
          )}
        </AnimatePresence>

        {/* small screens: no room for the computer, so one button on the dash */}
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation()
            fencesDown()
          }}
          className="absolute bottom-[6%] left-1/2 -translate-x-1/2 border border-[#ffb347] bg-black/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[#ffb347] disabled:opacity-0 @3xl:hidden"
        >
          &gt; fences: power down
        </button>
      </div>

      {/* =========================
          THE COMPUTER
      ========================= */}
      <div className="absolute right-0 top-[4%] hidden w-[35%] @3xl:block" onClick={(e) => e.stopPropagation()}>
        {/* monitor */}
        <div className="relative rounded-[1.4cqw] bg-gradient-to-b from-[#e2dac6] via-[#d3c9b1] to-[#b9ae94] p-[1.6cqw] pb-[2.6cqw] shadow-[0_1.5cqw_3cqw_rgba(0,0,0,0.6),inset_0_0.2cqw_0_rgba(255,255,255,0.6)]">
          {/* bezel */}
          <div className="rounded-[0.9cqw] bg-[#a89e86] p-[0.9cqw] shadow-[inset_0_0.3cqw_0.6cqw_rgba(0,0,0,0.35)]">
            {/* screen */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4cqw/1.8cqw] bg-[#020603] font-mono text-[1.02cqw] leading-[1.6] text-[#7dff9a] shadow-[inset_0_0_2.5cqw_rgba(0,0,0,0.9),0_0_1.2cqw_rgba(60,255,120,0.15)]">
              <div className="absolute inset-0 flex flex-col">
                <div className="flex items-center justify-between border-b border-[#1f3d24] px-[1.2cqw] py-[0.6cqw] text-[0.85cqw] uppercase tracking-widest text-[#7dff9a]/70">
                  <span>Park security</span>
                  <span className="flex items-center gap-[0.5cqw]">
                    Fence
                    <motion.span
                      className={`h-[0.8cqw] w-[0.8cqw] rounded-full ${fenceOn ? "bg-[#3dff6e] shadow-[0_0_0.8cqw_#3dff6e]" : "bg-[#ff3030] shadow-[0_0_0.8cqw_#ff3030]"}`}
                      animate={fenceOn ? { opacity: 1 } : { opacity: [1, 0.2, 1] }}
                      transition={{ duration: 0.6, repeat: fenceOn ? 0 : Infinity }}
                    />
                    {fenceOn ? "On" : "Off"}
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden px-[1.2cqw] py-[0.8cqw]">
                  {lines.map((l) => (
                    <motion.p
                      key={l.id}
                      className={l.tone === "warn" ? "text-[#ff5a4a]" : l.tone === "cmd" ? "text-white" : l.tone === "ok" ? "text-[#ffe14a]" : ""}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {l.text}
                    </motion.p>
                  ))}
                  <motion.span
                    className="inline-block h-[1cqw] w-[0.55cqw] translate-y-[0.15cqw] bg-[#7dff9a]"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                </div>

                <div className="flex flex-col items-start gap-[0.2cqw] border-t border-[#1f3d24] px-[1.2cqw] py-[0.8cqw]">
                  <Command label="access security" disabled={busy} onRun={security} />
                  <Command label="access main security grid" disabled={busy} onRun={grid} />
                  <Command label="fences: power down" disabled={busy} onRun={fencesDown} danger />
                </div>
              </div>

              {/* YOU DIDN'T SAY THE MAGIC WORD! */}
              <AnimatePresence>
                {phase === "denied" && (
                  <motion.div
                    key="denied"
                    className="absolute inset-0 overflow-hidden bg-[#020603] p-[1.2cqw] text-[1.15cqw] font-bold uppercase leading-[1.45]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {Array.from({ length: 16 }, (_, i) => (
                      <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2, duration: 0 }}>
                        You didn&apos;t say the magic word!
                      </motion.p>
                    ))}
                    <motion.span
                      className="absolute bottom-[6%] right-[6%] text-[6cqw] [transform-origin:50%_90%]"
                      animate={{ rotate: [-18, 18, -18] }}
                      transition={{ duration: 0.45, repeat: Infinity }}
                    >
                      ☝️
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CRT: scanlines and glass glare */}
              <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.28)_0px,rgba(0,0,0,0.28)_1px,transparent_2px,transparent_3px)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_15%,rgba(255,255,255,0.08),transparent_45%)]" />
            </div>
          </div>

          {/* badge, power light and a sticky note */}
          <span className="absolute bottom-[0.7cqw] left-[1.8cqw] font-sans text-[0.8cqw] font-bold uppercase tracking-[0.3em] text-[#6f6652]">InGen</span>
          <span className="absolute bottom-[0.95cqw] right-[2cqw] h-[0.6cqw] w-[0.6cqw] rounded-full bg-[#3dff6e] shadow-[0_0_0.6cqw_#3dff6e]" />
          <span className="absolute -right-[1cqw] -top-[1.2cqw] w-[6.5cqw] rotate-[8deg] bg-[#fff27a] p-[0.6cqw] font-mono text-[0.75cqw] leading-tight text-[#4a3f12] shadow-[0_0.4cqw_0.8cqw_rgba(0,0,0,0.4)]">
            don&apos;t forget the magic word!!
          </span>
        </div>

        {/* stand */}
        <div className="mx-auto h-[1.6cqw] w-[30%] bg-gradient-to-b from-[#b2a78d] to-[#8f866f] [clip-path:polygon(12%_0,88%_0,100%_100%,0_100%)]" />
        <div className="mx-auto h-[0.7cqw] w-[55%] rounded-t-[0.4cqw] bg-[#c4ba9f]" />

        {/* keyboard: three rows of keys and a space bar; a few keys tap when a command runs */}
        <div className="mt-[1.4cqw] rounded-[0.8cqw] bg-gradient-to-b from-[#d9d0ba] to-[#b5aa90] p-[0.8cqw] shadow-[0_1cqw_2cqw_rgba(0,0,0,0.5)] [transform:perspective(40cqw)_rotateX(28deg)]">
          <div className="grid grid-cols-[repeat(15,1fr)] gap-[0.25cqw]">
            {Array.from({ length: 45 }, (_, i) => (
              <motion.span
                key={`${i}-${typed}`}
                className={`h-[1.3cqw] rounded-[0.2cqw] shadow-[inset_0_-0.15cqw_0_rgba(0,0,0,0.25)] ${i % 15 === 0 || i % 15 === 14 ? "bg-[#a69c84]" : "bg-[#e8e1cd]"}`}
                animate={typed && (i * 7 + typed * 13) % 9 === 0 ? { y: [0, 2, 0] } : { y: 0 }}
                transition={{ duration: 0.15, delay: ((i * 37) % 11) * 0.03 }}
              />
            ))}
          </div>
          <div className="mx-auto mt-[0.25cqw] h-[1.3cqw] w-[45%] rounded-[0.2cqw] bg-[#e8e1cd] shadow-[inset_0_-0.15cqw_0_rgba(0,0,0,0.25)]" />
        </div>

        <button
          type="button"
          className="mt-[1.2cqw] block w-full text-right font-mono text-[0.85cqw] uppercase tracking-widest text-white/40 hover:text-white"
          onClick={() => {
            setMuted(sound)
            setSound(!sound)
          }}
        >
          Sound {sound ? "on" : "off"}
        </button>
      </div>
    </motion.div>
  )
}

function Command({ label, disabled, onRun, danger }: { label: string; disabled: boolean; onRun: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onRun}
      className={`text-left transition hover:translate-x-[0.4cqw] disabled:opacity-30 disabled:hover:translate-x-0 ${danger ? "text-[#ffb347] hover:text-[#ffd18a]" : "hover:text-white"}`}
    >
      &gt; {label}
    </button>
  )
}

/* =========================
   RAIN ON THE WINDSHIELD
========================= */
function seeded(n: number) {
  const s = Math.sin(n * 9301 + 49297) * 233280
  return s - Math.floor(s)
}

// rounded so the server and the browser print the same style strings
const r2 = (n: number) => Math.round(n * 100) / 100

const DROPS = Array.from({ length: 46 }, (_, i) => ({
  left: r2(3 + seeded(i) * 94),
  top: r2(8 + seeded(i + 70) * 66),
  size: r2(0.3 + seeded(i + 140) * 0.7),
  run: seeded(i + 210) > 0.7,
  duration: 2 + seeded(i + 280) * 3,
  delay: seeded(i + 350) * 4,
}))

function RainOnGlass({ reduce, heavy }: { reduce: boolean; heavy: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {!reduce && (
        <motion.div
          className="absolute inset-0"
          style={{ backgroundImage: RAIN, backgroundSize: "90px 70px", opacity: heavy ? 0.5 : 0.25 }}
          animate={{ backgroundPositionY: ["0px", "70px"] }}
          transition={{ duration: heavy ? 0.18 : 0.3, repeat: Infinity, ease: "linear" }}
        />
      )}
      {DROPS.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-white/30 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.55),rgba(160,190,220,0.12)_60%)]"
          style={{ left: `${d.left}%`, top: `${d.top}%`, width: `${d.size}cqw`, height: `${r2(d.size * 1.15)}cqw` }}
          animate={d.run && !reduce ? { y: ["0cqw", "6cqw"], opacity: [0.9, 0.9, 0] } : undefined}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "easeIn" }}
        />
      ))}
    </div>
  )
}

/* =========================
   THE GLASS OF WATER
========================= */
function WaterGlass({ ripple, reduce }: { ripple: number; reduce: boolean }) {
  return (
    <svg viewBox="0 0 120 150" className="w-full overflow-visible" aria-label="A glass of water">
      <defs>
        <linearGradient id="jp-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fd4ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3a7bb8" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="jp-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.25" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.25" />
        </linearGradient>
        <clipPath id="jp-surface">
          <ellipse cx="60" cy="48" rx="39" ry="9" />
        </clipPath>
      </defs>

      <ellipse cx="60" cy="144" rx="38" ry="5" fill="black" opacity="0.5" />
      <path d="M21 48 L28 138 Q60 146 92 138 L99 48 Z" fill="url(#jp-water)" />
      <ellipse cx="60" cy="48" rx="39" ry="9" fill="#bfe4ff" opacity="0.55" />
      <g clipPath="url(#jp-surface)">
        {!reduce &&
          [0, 1, 2].map((i) => (
            <motion.ellipse
              key={`${ripple}-${i}`}
              cx="60"
              cy="48"
              fill="none"
              stroke="#ffffff"
              strokeWidth={1.4}
              initial={{ rx: 2, ry: 0.5, opacity: ripple ? 0.95 : 0 }}
              animate={{ rx: 42, ry: 10, opacity: 0 }}
              transition={{ duration: 0.9, delay: i * 0.12, ease: "easeOut" }}
            />
          ))}
      </g>
      <path d="M14 14 L26 140 Q60 150 94 140 L106 14" fill="url(#jp-glass)" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" />
      <ellipse cx="60" cy="14" rx="46" ry="9" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" />
    </svg>
  )
}
