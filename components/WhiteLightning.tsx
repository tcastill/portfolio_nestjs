"use client"

import { motion } from "framer-motion"

export default function WhiteLightning({
  active,
  surge = false,
}: {
  active: boolean
  surge?: boolean
}) {
  if (!active) return null

  // Scale everything up during MAX POWER surge
  const core = surge ? 6 : 4
  const halo = surge ? 18 : 12
  const branch = surge ? 4 : 3

  return (
    <motion.svg
      viewBox="0 0 800 600"
      className="absolute z-40 pointer-events-none"
      style={{
        width: "520px",
        height: "460px",
        left: "66%",
        transform: "translateX(-50%)",
        bottom: "16%",
      }}
    >
      <defs>
        {/* CORE GLOW */}
        <filter id="coreGlow">
          <feGaussianBlur stdDeviation={halo} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* SOFT HALO */}
        <filter id="haloGlow">
          <feGaussianBlur stdDeviation={halo * 1.4} />
        </filter>
      </defs>

      {/* =========================
          LEFT ZONE (BLUE AREA)
         ========================= */}
      <g>
        {/* HALO */}
        <motion.path
          d="M 120 40 L 90 160 L 150 260 L 110 380"
          fill="none"
          stroke="rgba(180,220,255,0.65)"
          strokeWidth={halo}
          filter="url(#haloGlow)"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.18, repeat: Infinity, repeatDelay: 0.9 }}
          style={{ mixBlendMode: "screen" }}
        />

        {/* CORE */}
        <motion.path
          d="M 120 40 L 90 160 L 150 260 L 110 380"
          fill="none"
          stroke="white"
          strokeWidth={core}
          filter="url(#coreGlow)"
          strokeLinecap="round"
          animate={{
            opacity: [0, 1, 0.4, 1, 0],
            stroke: ["#fff", "#cce6ff", "#d8c8ff"],
          }}
          transition={{ duration: 0.16, repeat: Infinity, repeatDelay: 0.9 }}
          style={{ mixBlendMode: "plus-lighter" }}
        />

        {/* BRANCH */}
        <motion.path
          d="M 150 260 L 210 320 L 190 420"
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={branch}
          filter="url(#coreGlow)"
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 1.1 }}
          style={{ mixBlendMode: "screen" }}
        />
      </g>

      {/* =========================
          CENTER (MAIN POWER BOLT)
         ========================= */}
      <g>
        {/* MASSIVE HALO */}
        <motion.path
          d="M 400 0 L 360 140 L 440 240 L 390 380 L 450 560"
          fill="none"
          stroke="rgba(200,235,255,0.8)"
          strokeWidth={halo * 1.2}
          filter="url(#haloGlow)"
          animate={{
            opacity: surge ? [0, 1, 1, 0] : [0, 1, 0],
          }}
          transition={{
            duration: surge ? 0.12 : 0.18,
            repeat: Infinity,
            repeatDelay: 0.55,
          }}
          style={{ mixBlendMode: "screen" }}
        />

        {/* CORE BOLT */}
        <motion.path
          d="M 400 0 L 360 140 L 440 240 L 390 380 L 450 560"
          fill="none"
          stroke="white"
          strokeWidth={core * 1.4}
          filter="url(#coreGlow)"
          strokeLinecap="round"
          animate={{
            opacity: [0, 1, 0.35, 1, 0],
            x: [0, -2, 2, -1, 0],
            stroke: ["#ffffff", "#bfe7ff", "#d7c7ff"],
          }}
          transition={{
            duration: surge ? 0.12 : 0.18,
            repeat: Infinity,
            repeatDelay: 0.55,
          }}
          style={{ mixBlendMode: "plus-lighter" }}
        />

        {/* SIDE BRANCH */}
        <motion.path
          d="M 440 240 L 520 300 L 500 420"
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={branch * 1.2}
          filter="url(#coreGlow)"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.18, repeat: Infinity, repeatDelay: 0.8 }}
          style={{ mixBlendMode: "screen" }}
        />
      </g>

      {/* =========================
          RIGHT ZONE (RED AREA)
         ========================= */}
      <g>
        <motion.path
          d="M 620 80 L 580 220 L 640 340 L 600 480"
          fill="none"
          stroke="rgba(190,220,255,0.7)"
          strokeWidth={halo}
          filter="url(#haloGlow)"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.16, repeat: Infinity, repeatDelay: 0.75 }}
          style={{ mixBlendMode: "screen" }}
        />

        <motion.path
          d="M 620 80 L 580 220 L 640 340 L 600 480"
          fill="none"
          stroke="white"
          strokeWidth={core}
          filter="url(#coreGlow)"
          strokeLinecap="round"
          animate={{
            opacity: [0, 1, 0.4, 1, 0],
            stroke: ["#fff", "#cde6ff", "#dccbff"],
          }}
          transition={{ duration: 0.16, repeat: Infinity, repeatDelay: 0.75 }}
          style={{ mixBlendMode: "plus-lighter" }}
        />
      </g>
    </motion.svg>
  )
}
