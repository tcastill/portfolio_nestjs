"use client"

import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { audio, noise, setMuted, tone } from "@/components/nes"

// Jurassic: the T-Rex paddock, on a stormy night.
// A park security terminal sits beside the photo:
// - "access main security grid": PERMISSION DENIED... YOU DIDN'T SAY THE MAGIC WORD! (ah ah ah)
// - "fences: power down": the fence dies, then impact tremors ripple the glass of water and
//   shake the page, closer and closer, his eye lights up, he ROARS, and the side mirror slides
//   in (objects in mirror are closer than they appear). MUST GO FASTER to get away.
// Rain and lightning all the while. Sounds are made on the fly with Web Audio.

// where things sit in jurassic.jpg (1999x3000), as % of the photo
const EYE = { x: 81.2, y: 30.6 }

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

      {/* rain: two sheets of streaks falling at slightly different speeds */}
      {!reduce &&
        [0, 1].map((i) => (
          <motion.div
            key={i}
            className="pointer-events-none fixed inset-[-20vh_0_0_0] z-20"
            style={{
              opacity: heavy ? 0.55 : 0.3,
              backgroundImage:
                "repeating-linear-gradient(100deg, transparent 0 22px, rgba(190,220,255,0.35) 22px 23px, transparent 23px 47px)",
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
   THE PADDOCK (inside the photo frame)
========================= */
export default function JurassicFX({ image, onStorm }: { image: string; onStorm?: (heavy: boolean) => void }) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>("idle")
  const [fenceOn, setFenceOn] = useState(true)
  const [lines, setLines] = useState<Line[]>([])
  const [ripple, setRipple] = useState(0) // bumps on every tremor
  const [nearness, setNearness] = useState(0) // 0..1, how close he is
  const [sound, setSound] = useState(true)
  const timers = useRef<number[]>([])
  const nextId = useRef(1)
  const shake = useAnimationControls()

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const print = useCallback((text: string, kind?: Line["tone"]) => {
    setLines((l) => [...l.slice(-9), { id: nextId.current++, text, tone: kind }])
    beep(kind === "warn" ? 440 : 880)
  }, [])

  // the terminal boots up
  useEffect(() => {
    const boot = [
      "Jurassic Park, System Security Interface",
      "Version 4.0.5, Alpha E",
      "Ready...",
    ]
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
    print("> MUST GO FASTER", "cmd")
    later(1200, () => print("Vehicle clear of paddock. You made it.", "ok"))
    later(2600, () => {
      print("> fences: power up", "cmd")
      setFenceOn(true)
      tone(60, 0.9, { type: "sawtooth", vol: 0.05, to: 440 })
    })
    later(3600, () => {
      setPhase("idle")
      setNearness(0)
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
  const eyeLit = phase === "roar" || phase === "chase" || (phase === "tremor" && nearness >= 1)

  return (
    <motion.div className="absolute inset-0 @container" animate={shake}>
      {/* his eye catches the light */}
      <AnimatePresence>
        {eyeLit && (
          <motion.span
            className="pointer-events-none absolute h-[3cqw] w-[3cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffe14a] mix-blend-screen blur-[2px]"
            style={{ left: `${EYE.x}%`, top: `${EYE.y}%`, boxShadow: "0 0 3cqw 1.5cqw rgba(255,210,40,0.7)" }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 0.7, 1], scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* the roar: a hot flash and a dark pulse at the edges */}
      <AnimatePresence>
        {phase === "roar" && (
          <motion.div
            key="roar"
            className="pointer-events-none absolute -inset-[150vmax]"
            style={{ background: "radial-gradient(circle at center, transparent 25%, rgba(120,10,0,0.55) 60%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.5, 1, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          />
        )}
      </AnimatePresence>

      {/* the glass of water, left of the photo */}
      <div className="absolute bottom-[10%] right-[104%] hidden w-[34cqw] flex-col items-center gap-[2cqw] md:flex">
        <WaterGlass ripple={ripple} nearness={nearness} reduce={!!reduce} />
        <p className="text-center font-mono text-[2.4cqw] uppercase tracking-[0.3em] text-white/40">Impact tremor</p>
      </div>

      {/* the security terminal, right of the photo */}
      <div
        className="absolute left-[103%] top-[8%] hidden w-[64cqw] border border-[#1f3d24] bg-black/90 font-mono text-[2.3cqw] leading-[1.55] text-[#7dff9a] shadow-[0_0_4cqw_rgba(40,255,120,0.12)] md:block"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#1f3d24] px-[2.5cqw] py-[1.5cqw] text-[2.2cqw] uppercase tracking-widest text-[#7dff9a]/70">
          <span>Park security</span>
          <span className="flex items-center gap-[1cqw]">
            Fence
            <motion.span
              className={`h-[1.8cqw] w-[1.8cqw] rounded-full ${fenceOn ? "bg-[#3dff6e] shadow-[0_0_1.5cqw_#3dff6e]" : "bg-[#ff3030] shadow-[0_0_1.5cqw_#ff3030]"}`}
              animate={fenceOn ? { opacity: 1 } : { opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.6, repeat: fenceOn ? 0 : Infinity }}
            />
            {fenceOn ? "On" : "Off"}
          </span>
        </div>

        <div className="h-[52cqw] overflow-hidden px-[2.5cqw] py-[2cqw]">
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
          <motion.span className="inline-block h-[2.6cqw] w-[1.4cqw] translate-y-[0.4cqw] bg-[#7dff9a]" animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
        </div>

        <div className="flex flex-col gap-[0.8cqw] border-t border-[#1f3d24] px-[2.5cqw] py-[2cqw]">
          <Command label="access security" disabled={busy} onRun={security} />
          <Command label="access main security grid" disabled={busy} onRun={grid} />
          <Command label="fences: power down" disabled={busy} onRun={fencesDown} danger />
          <button
            type="button"
            className="mt-[1cqw] self-end text-[2cqw] uppercase tracking-widest text-white/40 hover:text-white"
            onClick={() => {
              setMuted(sound)
              setSound(!sound)
            }}
          >
            Sound {sound ? "on" : "off"}
          </button>
        </div>
      </div>

      {/* small screens: no room beside the photo, so one big button on it */}
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation()
          fencesDown()
        }}
        className="absolute bottom-[3%] left-1/2 -translate-x-1/2 border border-[#ffb347] bg-black/80 px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#ffb347] disabled:opacity-30 md:hidden"
      >
        &gt; fences: power down
      </button>

      {/* objects in mirror are closer than they appear */}
      <AnimatePresence>
        {phase === "chase" && (
          <motion.div
            key="mirror"
            className="absolute bottom-[6%] left-1/2 w-[92cqw] -translate-x-1/2"
            initial={{ y: "60%", opacity: 0, rotate: -4 }}
            animate={{ y: 0, opacity: 1, rotate: reduce ? 0 : [-4, -2.5, -4.5, -3, -4] }}
            exit={{ x: "-120%", opacity: 0, rotate: -12 }}
            transition={{ y: { duration: 0.5, ease: "easeOut" }, rotate: { duration: 0.4, repeat: Infinity }, x: { duration: 0.6 } }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-[7cqw] bg-gradient-to-b from-[#3a3d42] to-[#16181b] p-[2.2cqw] shadow-[0_3cqw_6cqw_rgba(0,0,0,0.7)]">
              <div className="relative aspect-[1.6] overflow-hidden rounded-[5cqw] border-[0.6cqw] border-[#0c0d0f]">
                <motion.div
                  className="absolute inset-0"
                  animate={{ scale: [1, 1.15, 1.25, 1.4, 1.6, 1.85], y: reduce ? 0 : ["0%", "-2%", "1%", "-3%", "2%", "0%"] }}
                  transition={{ duration: 6.5, ease: "easeIn" }}
                >
                  {/* mirrors flip things */}
                  <div
                    className="absolute inset-0 -scale-x-100"
                    style={{ backgroundImage: `url(${image})`, backgroundSize: "250%", backgroundPosition: "95% 30%" }}
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/30" />
                <p className="absolute inset-x-0 bottom-[7%] text-center font-sans text-[2.6cqw] font-semibold uppercase tracking-wider text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
                  Objects in mirror are closer than they appear
                </p>
              </div>
            </div>
            <motion.button
              type="button"
              className="mx-auto mt-[3cqw] block rounded-sm border-[0.4cqw] border-[#ffe14a] bg-[#c8102e] px-[5cqw] py-[2cqw] font-sans text-[4cqw] font-black uppercase tracking-wider text-[#ffe14a] shadow-[0_0_3cqw_rgba(255,60,40,0.6)]"
              animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              onClick={escape}
            >
              Must go faster!
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YOU DIDN'T SAY THE MAGIC WORD! */}
      <AnimatePresence>
        {phase === "denied" && (
          <motion.div
            key="denied"
            className="absolute inset-0 z-10 overflow-hidden bg-black/90 p-[4cqw] font-mono text-[3.4cqw] font-bold uppercase leading-[1.5] text-[#7dff9a]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {Array.from({ length: 30 }, (_, i) => (
              <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12, duration: 0 }}>
                You didn&apos;t say the magic word!
              </motion.p>
            ))}
            <motion.span
              className="absolute bottom-[8%] right-[8%] text-[22cqw] [transform-origin:50%_90%]"
              animate={{ rotate: [-18, 18, -18] }}
              transition={{ duration: 0.45, repeat: Infinity }}
            >
              ☝️
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Command({ label, disabled, onRun, danger }: { label: string; disabled: boolean; onRun: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onRun}
      className={`text-left transition hover:translate-x-[0.6cqw] disabled:opacity-30 disabled:hover:translate-x-0 ${danger ? "text-[#ffb347] hover:text-[#ffd18a]" : "hover:text-white"}`}
    >
      &gt; {label}
    </button>
  )
}

/* =========================
   THE GLASS OF WATER
========================= */
function WaterGlass({ ripple, nearness, reduce }: { ripple: number; nearness: number; reduce: boolean }) {
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

      {/* shadow */}
      <ellipse cx="60" cy="144" rx="38" ry="5" fill="black" opacity="0.5" />
      {/* water body */}
      <path d="M21 48 L28 138 Q60 146 92 138 L99 48 Z" fill="url(#jp-water)" />
      {/* surface + ripples */}
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
      {/* the glass */}
      <path d="M14 14 L26 140 Q60 150 94 140 L106 14" fill="url(#jp-glass)" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" />
      <ellipse cx="60" cy="14" rx="46" ry="9" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" />
      {/* how close: a little bar under the glass */}
      <rect x="20" y="152" width="80" height="3" fill="#ffffff" opacity="0.12" />
      <motion.rect x="20" y="152" height="3" fill="#ff5a4a" animate={{ width: 80 * nearness }} transition={{ duration: 0.4 }} />
    </svg>
  )
}
