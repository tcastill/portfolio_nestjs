"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams, notFound } from "next/navigation"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion"
import { useState, useEffect } from "react"
import type { MouseEvent } from "react"

import shoes from "@/data/shoes.json"
import CursorTriangle from "@/components/CursorTriangle"
import ShoeStage from "@/components/ShoeStage"
import ShoeHotspot from "@/components/ShoeHotspot"
import ShoeClouds from "@/components/ShoeClouds"
import PowerGlowShape from "@/components/PowerGlowShape"
import WindStorm from "@/components/WindStorm"
import DragonBallGlow from "@/components/DragonBallGlow"
import GroundCrackGlow from "@/components/GroundCrackGlow"
import WhiteLightning from "@/components/WhiteLightning"
import EnergyMotes from "@/components/EnergyMotes"

import styles from "./page.module.css"

type Shoe = {
  slug: string
  name: string
  brand: string
  year: number
  images: string[]
}

type WishPhase = "idle" | "quake" | "swipe" | "dragon"

export default function ShoePage() {
  const { slug } = useParams<{ slug: string }>()
  const shoe = (shoes as Shoe[]).find(s => s.slug === slug)
  if (!shoe) notFound()

  const isWindWalker = slug === "wind-walker"
  const isBudokai = slug === "budokai"

  /* =========================
     STATES
     ========================= */
  const [avatarState, setAvatarState] = useState(false)

  // Budokai only
  const [wishPhase, setWishPhase] = useState<WishPhase>("idle")
  const [swipeCount, setSwipeCount] = useState(0)
  const [blackout, setBlackout] = useState(false)

  /* =========================
     PARALLAX (Wind Walker)
     ========================= */
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  const x = useSpring(rawX, { stiffness: 90, damping: 18 })
  const y = useSpring(rawY, { stiffness: 90, damping: 18 })

  const cloudX = useTransform(x, v => v * 0.2)
  const cloudY = useTransform(y, v => v * 0.2)

  const stormX = useTransform(x, v => v * 0.45)
  const stormY = useTransform(y, v => v * 0.45)

  function handleMouseMove(e: MouseEvent) {
    if (isBudokai) return

    const { innerWidth, innerHeight } = window
    rawX.set((e.clientX / innerWidth - 0.5) * (avatarState ? 70 : 40))
    rawY.set((e.clientY / innerHeight - 0.5) * (avatarState ? 70 : 40))
  }

  function resetMotion() {
    rawX.set(0)
    rawY.set(0)
  }

  /* =========================
     BUDOKAI SEQUENCE
     ========================= */
  useEffect(() => {
    if (wishPhase === "quake") {
      setSwipeCount(0)
      const t = setTimeout(() => setWishPhase("swipe"), 280)
      return () => clearTimeout(t)
    }
  }, [wishPhase])

  useEffect(() => {
    if (swipeCount === 3) {
      setWishPhase("dragon")
    }
  }, [swipeCount])

  function resetWish() {
    setBlackout(true)
    setTimeout(() => {
      setWishPhase("idle")
      setSwipeCount(0)
      setBlackout(false)
    }, 400)
  }

  /* =========================
     SHAKE (quake only)
     ========================= */
  const shake =
    wishPhase === "quake"
      ? {
          x: [0, -10, 10, -8, 8, -4, 4, 0],
          y: [0, 6, -6, 4, -4, 0],
        }
      : { x: 0, y: 0 }

  return (
    <motion.main
      className={`relative w-screen h-screen overflow-hidden cursor-none ${
        isBudokai ? "bg-black" : ""
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetMotion}
      animate={shake}
      transition={{ duration: 0.35 }}
    >
      {/* =========================
          WIND WALKER BACKGROUND
         ========================= */}
      {isWindWalker && (
        <div className="fixed inset-0 -z-50">
          <Image
            src="/backgrounds/windback.png"
            alt="Wind background"
            fill
            priority
            className="object-cover"
          />
        </div>
      )}

      <CursorTriangle />

      {/* =========================
          BUTTONS
         ========================= */}
      {isWindWalker && (
        <button
          onClick={() => setAvatarState(s => !s)}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 text-xs rounded-full bg-black/80 text-white backdrop-blur"
        >
          {avatarState ? "Exit Avatar State" : "Enter Avatar State"}
        </button>
      )}

      {isBudokai && (
        <button
          onClick={() =>
            wishPhase === "idle"
              ? setWishPhase("quake")
              : resetWish()
          }
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 text-xs rounded-full bg-black/80 text-white backdrop-blur"
        >
          {wishPhase === "idle" ? "KAIO-KEN ×4" : "POWER DOWN"}
        </button>
      )}

      {/* =========================
          MAIN CONTENT
         ========================= */}
      {isBudokai ? (
        <div className="absolute inset-0 z-10 overflow-hidden">
          <Image
            src={shoe.images[0]}
            alt={shoe.name}
            fill
            priority
            className="object-contain"
          />

          <AnimatePresence>
            {wishPhase === "swipe" && swipeCount < 3 && (
              <motion.div
                key={`swipe-${swipeCount}`}
                className="absolute inset-0 z-20"
                initial={{ x: "-120%", y: "30%" }}
                animate={{ x: "120%", y: "-30%" }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                onAnimationComplete={() =>
                  setSwipeCount(c => c + 1)
                }
              >
                <Image
                  src={shoe.images[0]}
                  alt="Swipe"
                  fill
                  className="object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {wishPhase === "dragon" && (
            <>
              <Image
                src={shoe.images[1] ?? shoe.images[0]}
                alt="Wish Fulfilled"
                fill
                priority
                className="object-contain"
              />

              <DragonBallGlow active />
              <GroundCrackGlow active />
              <WhiteLightning active />
              <EnergyMotes active />
            </>
          )}

          {blackout && (
            <motion.div
              className="absolute inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              style={{ background: "black" }}
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 z-10 flex items-center justify-center scale-[1.2]">
          <ShoeStage
            image={shoe.images[0]}
            x={x}
            y={y}
            imageClassName={isWindWalker ? styles.shoeFeather : undefined}
          >
            {isWindWalker && (
              <>
                <div
                  className="absolute z-40 pointer-events-none"
                  style={{
                    left: "35%",
                    top: "30%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <PowerGlowShape active={avatarState} />
                </div>

                <ShoeHotspot
                  xPercent={59}
                  yPercent={31}
                  title="Autographed at AnimeFest"
                  subtitle="Dante Basco • Zuko"
                />
              </>
            )}
          </ShoeStage>
        </div>
      )}

      {/* =========================
          WIND EFFECTS
         ========================= */}
      {isWindWalker && (
        <>
          <WindStorm active={avatarState} x={stormX} y={stormY} />
          <ShoeClouds x={cloudX} y={cloudY} />
        </>
      )}

      {/* =========================
          TEXT
         ========================= */}
      <div
        className={`absolute top-10 left-10 z-40 ${
          isBudokai ? "text-white" : "text-black"
        }`}
      >
        <h1 className="text-2xl font-semibold">{shoe.name}</h1>
        <p className="text-sm opacity-70">
          {shoe.brand} · {shoe.year}
        </p>
      </div>

      {/* =========================
          NAVIGATION
         ========================= */}
      <div className="absolute bottom-8 left-8 z-40 flex flex-col gap-2">
        <Link
          href="/shoes"
          className={`text-xs transition ${
            isBudokai
              ? "text-white/70 hover:text-white"
              : "text-black/70 hover:text-black"
          }`}
        >
          ← Back to shoes
        </Link>

        <Link
          href="/"
          className={`text-xs transition ${
            isBudokai
              ? "text-white/70 hover:text-white"
              : "text-black/70 hover:text-black"
          }`}
        >
          ← Back to main page
        </Link>
      </div>
    </motion.main>
  )
}
