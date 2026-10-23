"use client"

import Image from "next/image"
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
import SmokeField, { BACKGROUND_SMOKE } from "@/components/SmokeField"
import BestiesFX, { BestiesBackground } from "@/components/BestiesFX"
import BatmanSky from "@/components/BatmanSky"
import HoverboardRide, { HoverboardStreet } from "@/components/HoverboardRide"
import CampKillerFX, { CampKillerAtmosphere } from "@/components/CampKillerFX"
import BurnedDreamsFX, { BurnedDreamsAtmosphere } from "@/components/BurnedDreamsFX"
import HeroFX, { HeroAtmosphere } from "@/components/HeroFX"
import AstromechFX, { AstromechBackdrop } from "@/components/AstromechFX"
import JurassicFX, { JurassicStorm } from "@/components/JurassicFX"

import styles from "./page.module.css"

type Shoe = {
  slug: string
  name: string
  brand: string
  year: number
  images: string[]
  swapOnClick?: boolean // clicking the photo steps through all the images, then loops back
}

// Fades a photo's edges into the background behind it; `inner` is where it reaches full opacity
function edgeFade(inner: number) {
  const stops = `transparent 0%, transparent 1.5%, rgba(0,0,0,0.35) ${inner * 0.32}%, rgba(0,0,0,0.75) ${inner * 0.64}%, black ${inner}%, black ${100 - inner}%, rgba(0,0,0,0.75) ${100 - inner * 0.64}%, rgba(0,0,0,0.35) ${100 - inner * 0.32}%, transparent 98.5%, transparent 100%`
  const mask = `linear-gradient(to right, ${stops}), linear-gradient(to bottom, ${stops})`
  return {
    WebkitMaskImage: mask,
    WebkitMaskComposite: "source-in",
    maskImage: mask,
    maskComposite: "intersect",
    // trim the outermost pixels: browsers can leave a faint hairline at a masked, scaled image's edge
    clipPath: "inset(2px)",
  } as const
}

const BATMAN_FADE = edgeFade(22)
const BESTIES_FADE = edgeFade(9)

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
  const isBatman = slug === "batman89"
  const isBesties = slug === "besties"
  const isHoverboard = slug === "hoverboard_highs"
  const isCampKiller = slug === "camp_killer"
  const isBurnedDreams = slug === "burned_dreams"
  const isHero = slug === "hero"
  const isAstromech = slug === "astromech"
  const isJurassic = slug === "jurassic"
  const [storm, setStorm] = useState(false)
  const isNes = isCampKiller || isBurnedDreams || isHero // the 8-bit game pages
  const [heroPowered, setHeroPowered] = useState(false)
  const [photo, setPhoto] = useState(0)
  const [riding, setRiding] = useState(false)

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

      {/* BATMAN BACKGROUND: the photo continued past its frame (blurred copy behind it) */}
      {isBatman && (
        <div className="fixed inset-0 -z-50 bg-[#0b0f14]">
          <Image
            src={shoe.images[0]}
            alt=""
            fill
            priority
            className="scale-110 object-cover blur-3xl brightness-90"
          />
        </div>
      )}

      {/* BATMAN BACKGROUND SMOKE: drifts behind the photo */}
      {isBatman && <SmokeField layers={BACKGROUND_SMOKE} className="z-0" />}

      {/* HOVERBOARD: the street rushing past fills the page while riding */}
      {isHoverboard && <HoverboardStreet riding={riding} />}

      {/* CAMP KILLER: dark cave, fog and a CRT screen */}
      {isCampKiller && <CampKillerAtmosphere image={shoe.images[0]} />}

      {/* BURNED DREAMS: warm dark room, embers and a CRT screen */}
      {isBurnedDreams && <BurnedDreamsAtmosphere image={shoe.images[0]} />}

      {/* LEGEND: dark forest, fairies and a CRT screen */}
      {isHero && <HeroAtmosphere image={shoe.images[0]} powered={heroPowered} />}

      {/* ASTROMECH: soft studio light behind the photo */}
      {isAstromech && <AstromechBackdrop image={shoe.images[0]} />}

      {/* JURASSIC: a stormy night, rain and lightning */}
      {isJurassic && <JurassicStorm image={shoe.images[0]} heavy={storm} />}

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
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center ${shoe.swapOnClick || isHoverboard ? "cursor-pointer" : ""}`}
          onClick={
            shoe.swapOnClick
              ? () => setPhoto((i) => (i + 1) % shoe.images.length)
              : isHoverboard
                ? () => setRiding((r) => !r)
                : undefined
          }
        >
          <ShoeStage
            image={shoe.images[0]}
            extraImages={shoe.swapOnClick ? shoe.images.slice(1) : undefined}
            active={photo}
            x={x}
            y={y}
            fullscreen={isLabullbu}   // ✅ only Labullbu is fullscreen
            aspect={isBatman || isHoverboard ? "1264 / 848" : isBesties || isNes ? "1536 / 1024" : isAstromech ? "6000 / 3376" : isJurassic ? "1999 / 3000" : undefined}   // frame matches the photo so its edges can fade
            scale={isBatman || isBesties ? 1.15 : undefined}
            width={isNes ? "min(98vw, calc(98vh * 1.5))" : isAstromech ? "min(98vw, calc(94vh * 6000 / 3376))" : isJurassic ? "min(92vw, calc(92vh * 1999 / 3000))" : undefined}   // as big as the screen allows
            imageClassName={isWindWalker ? styles.shoeFeather : undefined}
            imageStyle={isBatman ? BATMAN_FADE : isBesties || isNes || isAstromech || isJurassic ? BESTIES_FADE : isHoverboard && riding ? { opacity: 0 } : undefined}
          >
            {isHoverboard && <HoverboardRide riding={riding} />}
            {isCampKiller && <CampKillerFX />}
            {isBurnedDreams && <BurnedDreamsFX image={shoe.images[0]} fade={BESTIES_FADE} />}
            {isAstromech && <AstromechFX />}
            {isJurassic && <JurassicFX image={shoe.images[0]} onStorm={setStorm} />}
            {isHero && <HeroFX final="/shoes/hero/herofinal.png" fade={BESTIES_FADE} onPowered={setHeroPowered} />}

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

      {/* SWAP HINT */}
      {shoe.swapOnClick && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/75 px-4 py-1.5 text-xs uppercase tracking-widest text-white backdrop-blur">
          Click the photo to switch views · {photo + 1} / {shoe.images.length}
        </div>
      )}

      {/* HOVERBOARD HINT */}
      {isHoverboard && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/75 px-4 py-1.5 text-xs uppercase tracking-widest text-white backdrop-blur">
          {riding ? "Click to stop" : "Click to ride"}
        </div>
      )}

      {/* BESTIES COMIC FX: comic backdrop, collision intro, claws + gunshots */}
      {isBesties && <BestiesBackground />}
      {isBesties && <BestiesFX />}

      {/* BATMAN SKY: Bat-Signal, moon and Batwing */}
      {isBatman && <BatmanSky />}

      {/* BATMAN SMOKE */}
      {isBatman && <SmokeField />}

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
            : isLabullbu || isBatman || isNes || isJurassic || (isHoverboard && riding)
            ? "text-white drop-shadow-md"
            : "text-black"
        }`}
      >
        <h1 className="text-2xl font-semibold">{shoe.name}</h1>
        <p className="text-sm opacity-70">
          {shoe.brand} · {shoe.year}
        </p>
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
