"use client"

import { motion } from "framer-motion"

type Props = {
  active: boolean
}

export default function PowerGlowShape({ active }: Props) {
  return (
    <motion.svg
      width="150"
      height="180"
      viewBox="0 0 100 210"
      className="pointer-events-none"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={
        active
          ? {
              opacity: [0.75, 1, 0.9],
              scale: [0.95, 1.45, 1.15],
            }
          : {
              opacity: 0,
              scale: 0.8,
            }
      }
      transition={{ duration: 1.05, ease: "easeOut" }}
    >
      <defs>
        <filter id="arrowGlow">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ARROW SHAPE — fully visible */}
        <path
        d="
            M88 12
            H136
            V82
            L154 82
            L120 175
            L72 88
            H88
            Z
        "
        fill="rgba(255, 255, 255, 1)"
        filter="url(#arrowGlow)"
        transform="translate(-20 15) rotate(-20 100 110)"
        style={{ mixBlendMode: "screen" }}
        />
    </motion.svg>
  )
}
