"use client"

import { motion } from "framer-motion"

type Props = {
  active: boolean
}

export default function GroundCrackGlow({ active }: Props) {
  if (!active) return null

  return (
    <motion.div
      className="absolute inset-0 z-30 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* 🔒 IMAGE-LOCKED FLOOR ZONE */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          height: "100%",        // 🔧 how high glow reaches (tied to image)
          overflow: "hidden",
        }}
      >
        {/* 🔥 CRACK GLOW — MASKED TO SVG */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.45, 0.8, 0.55] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            /* 🔥 Lava color gradient */
            background: `
              radial-gradient(
                ellipse at 50% 70%,
                rgba(255, 220, 120, 0.65) 0%,
                rgba(255, 170, 60, 0.45) 35%,
                rgba(255, 120, 20, 0.2) 55%,
                transparent 75%
              )
            `,

            /* 🧠 SVG CRACK MASK (WHITE = visible) */
            WebkitMaskImage: "url('/masks/bulldokai-crack.svg')",
            maskImage: "url('/masks/bulldokai-crack.svg')",

            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",

            /* 🔑 CRITICAL: match image space */
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",

            /* 🔧 micro-alignment only */
            WebkitMaskPosition: "50% 100%",
            maskPosition: "50% 100%",

            /* 🔥 glow softness */
            filter: "blur(1px)",

            /* 🔥 additive glow (best for lava) */
            mixBlendMode: "plus-lighter",
          }}
        />
      </div>
    </motion.div>
  )
}
