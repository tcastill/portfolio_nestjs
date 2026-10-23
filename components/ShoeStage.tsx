"use client"

import Image from "next/image"
import { motion, MotionValue } from "framer-motion"
import { CSSProperties, ReactNode } from "react"

type Props = {
  image: string
  x: MotionValue<number>
  y: MotionValue<number>
  children?: ReactNode
  imageClassName?: string
  imageStyle?: CSSProperties
  fullscreen?: boolean
  aspect?: string // frame shape, e.g. "1264 / 848"; defaults to 4:3
  scale?: number // enlarge the framed image, e.g. 1.15 for 15% bigger
  width?: string // frame width (CSS), overriding the default 82vw capped at 1100px
  extraImages?: string[] // more photos layered on top; `active` picks which one shows (0 = main image)
  active?: number
}

export default function ShoeStage({
  image,
  x,
  y,
  children,
  imageClassName,
  imageStyle,
  fullscreen = false,
  aspect = "4 / 3",
  scale = 1,
  width,
  extraImages = [],
  active = 0,
}: Props) {

  // ===== NORMAL MODE (Wind Walker + Bulldokai) =====
  if (!fullscreen) {
    return (
      <motion.div
        style={{ x, y, scale, aspectRatio: aspect, ...(width && { width, maxWidth: "none" }) }}
        className="
          relative
          w-[82vw]
          max-w-[1100px]
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
          className={`object-contain select-none pointer-events-none transition-opacity duration-500 ${
            active === 0 ? "opacity-100" : "opacity-0"
          } ${imageClassName ?? ""}`}
          style={imageStyle}
        />

        {extraImages.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            draggable={false}
            className={`object-contain select-none pointer-events-none transition-opacity duration-500 ${
              active === i + 1 ? "opacity-100" : "opacity-0"
            } ${imageClassName ?? ""}`}
            style={imageStyle}
          />
        ))}

        {children}
      </motion.div>
    )
  }

  // ===== FULLSCREEN MODE (Labullbu ONLY) =====
  // The whole photo shows uncropped; a blurred copy fills the rest of the screen
  return (
    <motion.div className="fixed inset-0 z-0 overflow-hidden">
      <Image
        src={image}
        alt=""
        fill
        priority
        draggable={false}
        className="object-cover scale-110 blur-2xl brightness-90 select-none pointer-events-none"
      />
      <Image
        src={image}
        alt=""
        fill
        priority
        draggable={false}
        className="object-contain select-none pointer-events-none"
      />

      {children}
    </motion.div>
  )
}
