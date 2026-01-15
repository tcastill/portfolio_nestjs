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
}

export default function ShoeStage({
  image,
  x,
  y,
  children,
  imageClassName,
}: Props) {
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
        className={`object-contain ${imageClassName ?? ""}`}
      />

      {children}
    </motion.div>
  )
}
