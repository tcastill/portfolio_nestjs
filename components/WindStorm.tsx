"use client"

import { motion, MotionValue } from "framer-motion"
import { useMemo } from "react"

type Props = {
  active: boolean
  x: MotionValue<number>
  y: MotionValue<number>
}

export default function WindStorm({ active, x, y }: Props) {
  const spirals = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        size: 140 + Math.random() * 260,
        delay: Math.random() * 1.4,
        duration: 2.4 + Math.random() * 1.6,
        rotationOffset: Math.random() * 360,
        opacity: 0.15 + Math.random() * 0.35,
      })),
    []
  )

  if (!active) return null

  return (
    <motion.div
      className="fixed inset-0 z-[999] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* =========================
          MOVABLE VORTEX GROUP
         ========================= */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{
          x,
          y,
          translateX: "-50%",
          translateY: "-50%",
          marginTop: "-205px",
          marginLeft: "-220px",
          scale: 2.0,
          rotate: -8,
        }}
      >
        {/* =========================
            CIRCULAR PRESSURE GLOW
            (NO BOX — TRUE CIRCLE)
           ========================= */}
        <motion.div
          className="absolute left-1/2 top-1/2 rounded-full overflow-hidden"
          style={{
            width: "900px",
            height: "900px",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.22), rgba(255,255,255,0.08) 45%, transparent 75%)",
            filter: "blur(40px)",
          }}
          animate={{
            scale: [0.95, 1.05, 0.95],
            opacity: [0.4, 0.65, 0.4],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* =========================
            SPIRAL RINGS
           ========================= */}
        {spirals.map(sp => (
          <motion.div
            key={sp.id}
            className="absolute left-1/2 top-1/2 rounded-full border border-white/60"
            style={{
              width: sp.size,
              height: sp.size,
              transform: "translate(-50%, -50%)",
              opacity: sp.opacity,
            }}
            initial={{
              rotate: sp.rotationOffset,
              scale: 0.6,
            }}
            animate={{
              rotate: sp.rotationOffset + 360,
              scale: [0.6, 0.22],
            }}
            transition={{
              duration: sp.duration,
              delay: sp.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

        {/* =========================
            CORE UPDRAFT
           ========================= */}
        <motion.div
          className="absolute left-1/2 top-1/2 w-[220px] h-[520px] rounded-full"
          style={{
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.35), transparent 65%)",
          }}
          animate={{
            scaleY: [1, 1.25, 1],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </motion.div>
  )
}
