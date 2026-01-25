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
import { useState, useEffect, useRef } from "react"
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

type Order = {
  id: number
  type: "cake" | "coffee"
  x: number
  y: number
}

export default function ShoePage() {
  const { slug } = useParams<{ slug: string }>()
  const shoe = (shoes as Shoe[]).find(s => s.slug === slug)
  if (!shoe) notFound()

  const isWindWalker = slug === "wind-walker"
  const isBulldokai = slug === "bulldokai"
  const isLabullbu = slug === "labullbu_blue"

  /* =========================
     LABULLBU GAME STATE
  ========================= */
  const [serveFlash, setServeFlash] = useState(false)
  const [servePos, setServePos] = useState<{ x: number; y: number } | null>(null)

  const [cafeGameActive, setCafeGameActive] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [showGameOver, setShowGameOver] = useState(false)

  const [orders, setOrders] = useState<Order[]>([])
  const idRef = useRef(1)

  const [showFoodVideo, setShowFoodVideo] = useState(false)
  const [cafeMode, setCafeMode] = useState(false)

  /* =========================
     WIND WALKER STATE
  ========================= */
  const [avatarState, setAvatarState] = useState(false)

  /* =========================
     BULLDOKAI STATE
  ========================= */
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
    if (!isWindWalker) return

    const { innerWidth, innerHeight } = window
    rawX.set((e.clientX / innerWidth - 0.5) * (avatarState ? 70 : 40))
    rawY.set((e.clientY / innerHeight - 0.5) * (avatarState ? 70 : 40))
  }

  function resetMotion() {
    rawX.set(0)
    rawY.set(0)
  }

  /* =========================
     LABULLBU GAME EFFECTS
  ========================= */

  // Spawn 10 orders at a time
  useEffect(() => {
    if (!isLabullbu) return
    if (!cafeGameActive) return

    const spawnOrders = () => {
      const batch: Order[] = []
      for (let i = 0; i < 10; i++) {
        const id = idRef.current++
        batch.push({
          id,
          type: Math.random() > 0.5 ? "cake" : "coffee",
          // keep in a reasonable central band so it feels connected to the image
          x: 35 + Math.random() * 30,
          y: 45 + Math.random() * 30,
        })
      }
      setOrders(batch)
    }

    spawnOrders()
    const interval = setInterval(spawnOrders, 3500)
    return () => clearInterval(interval)
  }, [isLabullbu, cafeGameActive])

  // Game timer
  useEffect(() => {
    if (!isLabullbu) return
    if (!cafeGameActive) return

    if (timeLeft === 0) {
      setCafeGameActive(false)
      setOrders([])
      setShowGameOver(true)
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft(t => t - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [isLabullbu, cafeGameActive, timeLeft])

  /* =========================
     BULLDOKAI EFFECTS
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

  const shake =
    wishPhase === "quake"
      ? {
          x: [0, -10, 10, -8, 8, -4, 4, 0],
          y: [0, 6, -6, 4, -4, 0],
        }
      : { x: 0, y: 0 }

  return (
    <motion.main
      className={`relative w-screen h-screen overflow-hidden select-none ${
        isWindWalker ? "cursor-none" : "cursor-auto"
      } ${isBulldokai ? "bg-black" : ""}`}
      onDragStart={(e) => e.preventDefault()}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetMotion}
      animate={shake}
      transition={{ duration: 0.35 }}
    >
      {/* LABULLBU GLOW */}
      {isLabullbu && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: cafeMode || cafeGameActive ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background:
              "radial-gradient(circle at center, rgba(255,220,200,0.15), rgba(255,180,220,0.08), transparent)",
            backdropFilter: "saturate(115%) brightness(105%)",
          }}
        />
      )}

      {/* WIND WALKER BACKGROUND */}
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

      {isWindWalker && <CursorTriangle />}

      {/* =========================
          BUTTONS
      ========================= */}

      {isLabullbu && !cafeGameActive && !showGameOver && (
        <motion.button
          onClick={() => {
            setCafeGameActive(true)
            setShowGameOver(false)
            setScore(0)
            setTimeLeft(15)
            setCafeMode(true)
            setOrders([])
          }}
          className="
            absolute
            left-1/2
            top-[2.5%]
            -translate-x-1/2
            -translate-y-1/2
            z-50
            px-4
            py-1
            text-sm
            font-semibold
            rounded-full
            bg-gradient-to-r from-sky-300 to-blue-400
            text-black
            shadow-xl
            backdrop-blur
            select-none
          "
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut",
          }}
          whileHover={{
            scale: 1.1,
          }}
          whileTap={{
            scale: 0.95,
          }}
        >
          🍰 Start Cafe Game
        </motion.button>
      )}

      {isWindWalker && (
        <button
          onClick={() => setAvatarState(s => !s)}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 text-xs rounded-full bg-black/80 text-white backdrop-blur"
        >
          {avatarState ? "Exit Avatar State" : "Enter Avatar State"}
        </button>
      )}

      {isBulldokai && (
        <button
          onClick={() =>
            wishPhase === "idle" ? setWishPhase("quake") : resetWish()
          }
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 text-xs rounded-full bg-black/80 text-white backdrop-blur"
        >
          {wishPhase === "idle" ? "KAIO-KEN ×4" : "POWER DOWN"}
        </button>
      )}

      {/* HUD */}
      {isLabullbu && cafeGameActive && (
        <div className="
            absolute
            top-20
            right-6
            z-50
            bg-white/90
            backdrop-blur
            rounded-xl
            px-4
            py-2
            text-sm
            font-semibold
            text-slate-900
            shadow-lg
          ">
          ⏱ {timeLeft}s | 🍪 {score}
        </div>
      )}

      {/* SERVE +1 POPUP (at last clicked order position) */}
      {isLabullbu && serveFlash && servePos && (
        <motion.div
          className="absolute z-[999] text-green-500 font-bold select-none pointer-events-none"
          style={{
            left: `${servePos.x}%`,
            top: `${servePos.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ opacity: 0, y: 0, scale: 0.9 }}
          animate={{ opacity: 1, y: -18, scale: 1 }}
          transition={{ duration: 0.25 }}
        >
          +1
        </motion.div>
      )}

      {/* 10 FLOATING ORDERS (click THESE for points) */}
      {isLabullbu &&
        cafeGameActive &&
        orders.map(order => (
          <motion.button
            key={order.id}
            onClick={() => {
              setScore(s => s + 1)

              setServePos({ x: order.x, y: order.y })
              setServeFlash(true)
              setTimeout(() => setServeFlash(false), 180)

              setOrders(prev => prev.filter(o => o.id !== order.id))
            }}
            className="absolute z-50 bg-white rounded-full px-3 py-2 shadow-lg text-lg cursor-pointer select-none"
            style={{
              left: `${order.x}%`,
              top: `${order.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            {order.type === "cake" ? "🍰" : "☕"}
          </motion.button>
        ))}

      {/* =========================
          MAIN CONTENT
      ========================= */}

      {isBulldokai ? (
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
                onAnimationComplete={() => setSwipeCount(c => c + 1)}
              >
                <Image src={shoe.images[0]} alt="Swipe" fill />
              </motion.div>
            )}
          </AnimatePresence>

          {wishPhase === "dragon" && (
            <>
              <Image src={shoe.images[1] ?? shoe.images[0]} alt="Dragon" fill />
              <DragonBallGlow active />
              <GroundCrackGlow active />
              <WhiteLightning active />
              <EnergyMotes active />
            </>
          )}

          {blackout && (
            <motion.div
              className="absolute inset-0 z-50 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <ShoeStage
            image={shoe.images[0]}
            x={x}
            y={y}
            fullscreen={isLabullbu}   // ✅ only Labullbu is fullscreen
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
            
          {/* MOVIE PLAY BUTTON (only opens video; disabled during game) */}
          {isLabullbu && (
            <div
              className="absolute z-[999]"
              style={{
                left: "88%",
                top: "80%",
                transform: "translate(-50%, -50%)",
                pointerEvents: cafeGameActive ? "none" : "auto",
                opacity: cafeGameActive ? 0.45 : 1,
              }}
            >
              <motion.button
                onClick={() => {
                  if (!cafeGameActive) {
                    setShowFoodVideo(true)
                  }
                }}
                className="flex items-center justify-center rounded-full bg-white/85 backdrop-blur shadow-lg cursor-pointer select-none w-[28px] h-[28px]"
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" fill="#60A5FA" />
                </svg>
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* WIND EFFECTS */}
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
          isBulldokai
            ? "text-white"
            : isLabullbu
            ? "text-white drop-shadow-md"
            : "text-black"
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
            isBulldokai
              ? "text-white/70 hover:text-white"
              : isLabullbu
              ? "text-white hover:text-white drop-shadow-sm"
              : "text-black/70 hover:text-black"
          }`}
        >
          ← Back to shoes
        </Link>

        <Link
          href="/"
          className={`text-xs transition ${
            isBulldokai
              ? "text-white/70 hover:text-white"
              : isLabullbu
              ? "text-white hover:text-sky-200 drop-shadow-sm"
              : "text-black/70 hover:text-black"
          }`}
        >
          ← Back to main page
        </Link>
      </div>

      {/* GAME OVER */}
      {isLabullbu && showGameOver && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <motion.div className="bg-white rounded-2xl p-6 text-center shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-slate-900 drop-shadow-sm">
              ☕ Cafe Closed!
            </h2>

            <p className="mb-4 text-slate-700 font-medium">
              You served <span className="text-blue-600 font-bold">{score}</span> orders
            </p>
            <button
              onClick={() => setShowGameOver(false)}
              className="px-4 py-2 bg-sky-300 rounded-full text-sm"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* FOOD VIDEO */}
      {isLabullbu && showFoodVideo && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <motion.div className="bg-sky-200 p-2 rounded-xl">
            <video
              src="/videos/food.mov"
              autoPlay
              playsInline
              controls
              onEnded={() => setShowFoodVideo(false)}
              className="max-w-[80vw] max-h-[70vh]"
            />
          </motion.div>
        </motion.div>
      )}
    </motion.main>
  )
}
