"use client"

import { motion } from "framer-motion"

type Props = {
  active: boolean
}

export default function DragonBallGlow({ active }: Props) {
  if (!active) return null

  return (
    <motion.div
      className="absolute inset-0 z-30 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* 🔒 IMAGE-LOCKED CONTAINER */}
      <div className="absolute inset-0 overflow-hidden">
        
        {/* =========================
            OUTER BLOOM (BIG + SOFT)
           ========================= */}
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.55, 0.95, 0.6],
          }}
          transition={{
            duration: 1.3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: `
              radial-gradient(
                circle at center,
                rgba(255, 255, 220, 1.8) 0%,
                rgba(255, 210, 120, 1.2) 30%,
                rgba(255, 160, 60, 0.75) 55%,
                rgba(255, 120, 30, 0.35) 70%,
                transparent 85%
              )
            `,

            WebkitMaskImage: "url('/masks/bulldokai-ball1.svg')",
            maskImage: "url('/masks/bulldokai-ball1.svg')",

            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",

            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",

            WebkitMaskPosition: "center",
            maskPosition: "center",

            filter: "blur(36px)",
            mixBlendMode: "plus-lighter",
          }}
        />

        {/* =========================
            INNER CORE (HOT CENTER)
           ========================= */}
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.85, 1.2, 0.9],
          }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: `
              radial-gradient(
                circle at center,
                rgba(255, 255, 255, 2.2) 0%,
                rgba(255, 240, 180, 1.6) 35%,
                rgba(255, 180, 80, 0.9) 55%,
                transparent 70%
              )
            `,

            WebkitMaskImage: "url('/masks/bulldokai-1.svg')",
            maskImage: "url('/masks/bulldokai-1.svg')",

            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",

            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",

            WebkitMaskPosition: "center",
            maskPosition: "center",

            filter: "blur(12px)",
            mixBlendMode: "screen",
          }}
        />

      </div>
    </motion.div>
  )
}
