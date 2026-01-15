"use client"

import { motion, useMotionValue, useSpring } from "framer-motion"
import { useEffect } from "react"

export default function CursorTriangle() {
  // Raw mouse position (instant)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring-smoothed position (lag)
  const x = useSpring(mouseX, {
    stiffness: 150,   // lower = more lag
    damping: 20,      // higher = heavier feel
    mass: 0.5,
  })

  const y = useSpring(mouseY, {
    stiffness: 150,
    damping: 20,
    mass: 0.5,
  })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener("mousemove", move)
    return () => window.removeEventListener("mousemove", move)
  }, [mouseX, mouseY])

  return (
    <motion.div
      style={{
        x,
        y,
        translateX: "-50%",
        translateY: "-50%",
      }}
      className="
        fixed
        z-[9999]
        pointer-events-none
        w-0 h-0
        border-l-[6px] border-l-transparent
        border-r-[6px] border-r-transparent
        border-b-[10px] border-b-black
        drop-shadow-md
      "
    />
  )
}
