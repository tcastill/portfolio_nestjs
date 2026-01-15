"use client"

import { motion } from "framer-motion"

type Props = {
  active: boolean
}

export default function PowerGlow({ active }: Props) {
  return (
    <motion.div
      className="pointer-events-none"
      style={{
        width: 180,
        height: 180,
        borderRadius: "50%",
        background: `
          radial-gradient(
            circle,
            rgba(120,200,255,1) 0%,
            rgba(120,200,255,0.8) 25%,
            rgba(120,200,255,0.4) 45%,
            transparent 70%
          )
        `,
        filter: "blur(10px)",
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={
        active
          ? {
              opacity: [0.3, 1, 0.8],
              scale: [0.7, 1.4, 1.15],
            }
          : {
              opacity: 0,
              scale: 0.6,
            }
      }
      transition={{
        duration: 1.2,
        ease: "easeOut",
      }}
    />
  )
}
