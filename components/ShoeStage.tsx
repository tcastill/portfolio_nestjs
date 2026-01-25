"use client"

import Image from "next/image"
import { motion, MotionValue } from "framer-motion"
import { ReactNode } from "react"

type Props = {
  image: string
  x: MotionValue<number>
  y: MotionValue<number>
  children?: ReactNode
  imageClassName?: string
  fullscreen?: boolean
}

export default function ShoeStage({
  image,
  x,
  y,
  children,
  imageClassName,
  fullscreen = false,
}: Props) {

  // ===== NORMAL MODE (Wind Walker + Bulldokai) =====
  if (!fullscreen) {
    return (
      <motion.div
        style={{ x, y }}
        className="
          relative
          w-[82vw]
          max-w-[1100px]
          aspect-[4/3]
          flex
          items-center
          justify-center
        "
      >
        <Image
          src={image}
          alt=""
          fill
          priority
          draggable={false}
          className={`object-contain select-none pointer-events-none ${imageClassName ?? ""}`}
        />

        {children}
      </motion.div>
    )
  }

  // ===== FULLSCREEN MODE (Labullbu ONLY) =====
  return (
    <motion.div
      style={{ scale: 1.04 }}   // tiny overscale prevents black edges
      className="fixed inset-0 z-0 overflow-hidden"
    >
      <Image
        src={image}
        alt=""
        fill
        priority
        draggable={false}
        className="object-cover select-none pointer-events-none"
      />

      {children}
    </motion.div>
  )
}
