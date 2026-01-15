"use client"

import { motion } from "framer-motion"
import { useMemo } from "react"

type Mote = {
  id: number
  x: number
  yStart: number
  size: number
  blur: number
  travel: number
  duration: number
  delay: number
  opacity: number
}

export default function EnergyMotes({ active }: { active: boolean }) {
  if (!active) return null

  const motes = useMemo<Mote[]>(() => {
    return Array.from({ length: 60 }).map((_, i) => {
      const depth = Math.random() // depth illusion (0 back → 1 front)

      return {
        id: i,

        // 🌍 FULL PAGE SPAWN
        x: Math.random() * 100,
        yStart: Math.random() * 100,

        // 🔥 depth-driven look
        size: 4 + depth * 12,
        blur: 1 + (1 - depth) * 5,
        travel: 30 + depth * 90,
        duration: 2 + (1 - depth) * 3,
        opacity: 0.25 + depth * 0.65,

        delay: Math.random() * 2,
      }
    })
  }, [])

  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
       {motes.map(m => (
        <motion.div
          key={m.id}
          className="absolute rounded-full"
          style={{
            left: `${m.x}%`,
            top: `${m.yStart}%`,
            width: m.size,
            height: m.size,
            opacity: m.opacity,

            background: `
              radial-gradient(
                circle,
                rgba(255,255,255,1),
                rgba(180,220,255,0.75) 55%,
                transparent 80%
              )
            `,

            filter: `blur(${m.blur}px)`,
            mixBlendMode: "screen",
          }}
          animate={{
            y: [`0%`, `-${m.travel}%`],
            opacity: [0, m.opacity, 0],
            scale: [0.5, 1.15, 0.3],
          }}
          transition={{
            delay: m.delay,
            duration: m.duration,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}
