"use client"

import Image from "next/image"
import { motion, MotionValue } from "framer-motion"

type Props = {
  x: MotionValue<number>
  y: MotionValue<number>
}

export default function ShoeClouds({ x, y }: Props) {
  return (
    <motion.div
      style={{ x, y }}
      className="fixed inset-0 z-20 pointer-events-none"
    >
      <Image
        src="/overlays/cloud2.png"
        alt="Cloud overlay"
        fill
        priority
        className="object-cover"
      />
    </motion.div>
  )
}
