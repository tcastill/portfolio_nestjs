"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState, type MouseEvent } from "react"
import shoeMap from "@/data/shoe-map.json"
import pendingMap from "@/data/shoe-pending.json"
import shoes from "@/data/shoes.json"

type ShoeHotspot = {
  slug: string
  x: number
  y: number
  w: number
  h: number
}

const map = shoeMap as ShoeHotspot[]

// shoes on the wall without a page yet: clickable and in colour, but they open the "picture pending" page
const pending = pendingMap as ShoeHotspot[]

const names: Record<string, string> = Object.fromEntries(
  (shoes as { slug: string; name: string }[]).map((s) => [s.slug, s.name])
)

// shoewall-v2.jpg is 3135x1255
const IMAGE_RATIO = 3135 / 1255

// where the soles of each row of shoes meet their shelf, as % of the wall's height
const SHELVES = [13.0, 25.0, 36.6, 48.9, 60.9, 73.0, 84.6, 96.8]

// satin black, drawn over the photo so the shoes stand on real-looking shelves
const BLACK =
  "linear-gradient(to bottom, #2a2a2d 0%, #151517 18%, #0b0b0c 60%, #050505 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0 0.4cqw, transparent 0.4cqw 1.1cqw)"

// the middle of each shoe along its shelf, as % of the wall's width: a spotlight hangs above each one.
// Every row follows the same grid except the bottom one, which holds pairs.
const GRID = [4.6, 12.3, 19.6, 26.7, 34.2, 42.1, 49.9, 58.0, 65.9, 73.6, 81.5, 89.4, 96.3]
const BOTTOM_ROW = [6.2, 16.2, 26.5, 36.8, 48.0, 57.8, 67.0, 74.6, 82.0, 89.4, 96.3]

// whether a clickable shoe stands under the spotlight at x on the shelf at y
const CLICKABLE = [...map, ...pending]
const isLit = (x: number, y: number) =>
  CLICKABLE.some((s) => Math.abs(s.x + s.w / 2 - x) < 4 && s.y < y && s.y + s.h > y - 6)

function Shelves({ dimUnlinked }: { dimUnlinked: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {SHELVES.map((y, i) => {
        // the spotlights for this row are set into the underside of the shelf above (or the top of the unit)
        const light = i === 0 ? 0 : SHELVES[i - 1] + 1.9
        const drop = y - light
        return (
          <div key={y}>
            {(i === SHELVES.length - 1 ? BOTTOM_ROW : GRID).map((x) => (
              // the spotlights over greyed-out shoes are turned down too
              <div
                key={x}
                className="transition-opacity duration-500"
                style={{ opacity: dimUnlinked && !isLit(x, y) ? 0.25 : 1 }}
              >
                {/* a soft cone of warm light down the back wall and over the shoe */}
                <div
                  className="absolute mix-blend-screen"
                  style={{
                    left: `${x - 4.5}%`,
                    width: "9%",
                    top: `${light}%`,
                    height: `${drop}%`,
                    background:
                      "radial-gradient(ellipse 34% 95% at 50% 0%, rgba(255,214,170,0.34), rgba(255,200,150,0.12) 50%, transparent 80%), radial-gradient(ellipse 50% 120% at 50% 0%, rgba(255,200,150,0.1), transparent 70%)",
                  }}
                />
                {/* the pool of light where it lands on the shelf */}
                <div
                  className="absolute mix-blend-screen"
                  style={{
                    left: `${x - 4}%`,
                    width: "8%",
                    top: `${y - 1.6}%`,
                    height: "2.2%",
                    background: "radial-gradient(ellipse 50% 50% at 50% 60%, rgba(255,214,170,0.22), transparent 70%)",
                  }}
                />
                {/* the light itself, a small warm spot set into the shelf above */}
                <div
                  className="absolute h-[0.35%] w-[1.1%] -translate-x-1/2 rounded-b-full bg-[#ffe9cc] shadow-[0_0.1cqw_0.5cqw_0.1cqw_rgba(255,214,170,0.8)]"
                  style={{ left: `${x}%`, top: `${light}%` }}
                />
              </div>
            ))}
            {/* the top of the shelf: lifts only the dark wall behind the shoes, so the shoes stay in front;
                brighter toward the front, where the light lands */}
            <div
              className="absolute inset-x-0 mix-blend-lighten"
              style={{ top: `${y - 2.4}%`, height: "2.5%", background: "linear-gradient(to bottom, #050505, #1c1c1e 65%, #3a3a3d)" }}
            />
            {/* the front edge, in front of the soles */}
            <div
              className="absolute inset-x-0 shadow-[0_0.5cqw_1cqw_rgba(0,0,0,0.9)]"
              style={{ top: `${y}%`, height: "1.9%", background: BLACK }}
            >
              {/* the light catching its rounded top edge */}
              <div className="absolute inset-x-0 top-0 h-[0.09cqw] bg-[linear-gradient(to_right,rgba(255,255,255,0.15),rgba(255,255,255,0.7)_50%,rgba(255,255,255,0.15))]" />
            </div>
          </div>
        )
      })}
      {/* the sides of the unit */}
      {["right-full", "left-full"].map((side) => (
        <div
          key={side}
          className={`absolute ${side} -top-[2.2%] -bottom-[3%] w-[1.1%] shadow-[0_0_1cqw_rgba(0,0,0,0.9)]`}
          style={{ background: "linear-gradient(to right, #050505, #222225 45%, #0a0a0b)" }}
        />
      ))}
      {/* the top of the unit */}
      <div className="absolute -inset-x-[1.3%] -top-[2.2%] h-[2.2%] shadow-[0_0.4cqw_0.8cqw_rgba(0,0,0,0.8)]" style={{ background: BLACK }}>
        <div className="absolute inset-x-0 top-0 h-[0.09cqw] bg-white/25" />
      </div>
      {/* and its base */}
      <div className="absolute -inset-x-[1.3%] top-full h-[3%] shadow-[0_0.6cqw_1.2cqw_rgba(0,0,0,0.9)]" style={{ background: BLACK }}>
        <div className="absolute inset-x-0 top-0 h-[0.09cqw] bg-white/40" />
      </div>
    </div>
  )
}

// every hotspot: the shoes with a page, then the ones still waiting for their photo
const HOTSPOTS = [
  ...map.map((item) => ({ ...item, name: names[item.slug] ?? item.slug, href: `/shoes/${item.slug}` })),
  ...pending.map((item) => ({ ...item, name: "Picture pending", href: "/shoes/pending" })),
]

export default function ShoeMapPage() {
  // unlinked shoes start greyed out; the switch shows the whole wall in colour
  const [greyOut, setGreyOut] = useState(true)
  // on touch screens the first tap on a shoe shows its name, the second opens it
  const [active, setActive] = useState<string | null>(null)
  // phones scroll the wall sideways: a hint shows while there's more wall off to the side, until the first swipe
  const scroller = useRef<HTMLDivElement>(null)
  const [canSwipe, setCanSwipe] = useState(false)
  const [swiped, setSwiped] = useState(false)

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const check = () => setCanSwipe(el.scrollWidth > el.clientWidth + 8)
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const onShoeClick = (e: MouseEvent, slug: string) => {
    e.stopPropagation()
    if (active !== slug && window.matchMedia("(hover: none)").matches) {
      e.preventDefault()
      setActive(slug)
    }
  }

  return (
    <main className="flex h-dvh w-screen flex-col overflow-hidden bg-black" onClick={() => setActive(null)}>
      {/* top bar: just the grey-out switch (no way back to the home page while the link is shared) */}
      <div className="flex h-20 shrink-0 items-center justify-end gap-4 px-6 md:px-10 phone:h-14 phone:px-4">
        {/* on phones: a hint that the wall goes on to the right, gone after the first swipe */}
        <span
          className={`mr-auto text-xs font-semibold uppercase tracking-widest text-white/60 transition-opacity duration-500 ${
            canSwipe && !swiped ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden
        >
          Swipe →
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={greyOut}
          onClick={() => setGreyOut((g) => !g)}
          className="group flex items-center gap-3 rounded-full px-1 py-2 text-sm font-semibold uppercase tracking-wider text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Not received
          <span
            className={`relative h-6 w-11 rounded-full border border-white transition-colors duration-300 ${
              greyOut ? "bg-white" : "bg-black"
            }`}
          >
            <span
              className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-300 ${
                greyOut ? "left-[calc(100%-1.25rem)] bg-black" : "left-1 bg-white"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Image area with breathing room on every side. On phones the wall fills the height instead,
          so the shoes are big enough to tap, and scrolls sideways */}
      <div
        ref={scroller}
        className="relative flex min-h-0 flex-1 items-center justify-center pb-10 phone:justify-start phone:overflow-x-auto phone:overflow-y-hidden phone:overscroll-x-contain phone:pb-5 phone:pt-3"
        onScroll={(e) => {
          if (!swiped && e.currentTarget.scrollLeft > 24) setSwiped(true)
        }}
      >
        {/* on phones: room for the frame of the unit, which sits just outside the wall. The wall is at most
            34rem tall there, which keeps about five shoes on screen at a time */}
        <div className="phone:mx-auto phone:h-[min(100%,34rem)] phone:shrink-0 phone:px-6">
          {/* Box matching the image's aspect ratio so hotspots stay locked to the shoes */}
          <div
            className="relative @container phone:h-full phone:w-auto!"
            style={{
              width: `min(88vw, calc((100dvh - 7.5rem) * ${IMAGE_RATIO}))`,
              aspectRatio: `${IMAGE_RATIO}`,
            }}
          >
            {/* 🗺️ Shoe Map Background */}
            <Image
              src="/landing/shoewall-v2.jpg"
              alt="Shoe Map"
              fill
              priority
              sizes="(max-width: 767px) 2000px, (max-height: 500px) 2000px, 88vw"
              className="object-contain"
            />

            {/* grey out the whole wall except the clickable shoes. shoewall-v2-shoes-c.png is a white-on-black
                cut-out of the shoes, so inside each hotspot only the shoe itself keeps its colour */}
            <svg
              className="wall-fade pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-500"
              style={{ opacity: greyOut ? 1 : 0 }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <filter id="grey-shoes" colorInterpolationFilters="sRGB">
                <feColorMatrix
                  type="matrix"
                  values="0.16 0.54 0.05 0 0  0.16 0.54 0.05 0 0  0.16 0.54 0.05 0 0  0 0 0 1 0"
                />
              </filter>
              <mask id="shoe-shapes">
                <image href="/masks/shoewall-v2-shoes-c.png" width="100" height="100" preserveAspectRatio="none" />
              </mask>
              <mask id="unlinked-shoes">
                <rect width="100" height="100" fill="white" />
                <g mask="url(#shoe-shapes)">
                  {HOTSPOTS.map((item) => (
                    <rect key={item.slug} x={item.x} y={item.y} width={item.w} height={item.h} fill="black" />
                  ))}
                </g>
              </mask>
              <image
                href="/landing/shoewall-v2.jpg"
                width="100"
                height="100"
                preserveAspectRatio="none"
                filter="url(#grey-shoes)"
                mask="url(#unlinked-shoes)"
              />
            </svg>

            <Shelves dimUnlinked={greyOut} />

            {/* 👟 Shoe Hotspots */}
            {HOTSPOTS.map((item) => {
              const name = item.name
              // keep the tag inside the wall for shoes at the left and right edges
              const tagAlign =
                item.x + item.w > 90 ? "right-0" : item.x < 8 ? "left-0" : "left-1/2 -translate-x-1/2"
              // the top row's tags go under the shoe, so they aren't cut off at the top of the wall
              const tagSide = item.y < 10 ? "top-full mt-[0.5cqw] -translate-y-[0.4cqw]" : "bottom-full mb-[0.5cqw] translate-y-[0.4cqw]"

              return (
                <Link
                  key={item.slug}
                  href={item.href}
                  aria-label={`Open ${name}`}
                  data-active={active === item.slug}
                  onClick={(e) => onShoeClick(e, item.slug)}
                  className="group absolute cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]"
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    width: `${item.w}%`,
                    height: `${item.h}%`,
                  }}
                >
                  {/* frame on hover (or on the first tap) */}
                  <span className="pointer-events-none absolute -inset-[4%] rounded-[0.6cqw] border-[max(0.12cqw,1.5px)] border-white shadow-[0_0_1.4cqw_rgba(208,156,177,0.9)] opacity-0 scale-95 transition duration-300 group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100 group-data-[active=true]:opacity-100 group-data-[active=true]:scale-100" />

                  {/* name tag; never smaller than readable */}
                  <span
                    className={`pointer-events-none absolute z-10 ${tagSide} ${tagAlign} whitespace-nowrap rounded-full bg-white px-[max(0.8cqw,8px)] py-[max(0.25cqw,3px)] text-[max(0.85cqw,11px)] font-semibold uppercase tracking-wider text-black opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-data-[active=true]:translate-y-0 group-data-[active=true]:opacity-100`}
                  >
                    {name}
                    {/* on touch screens: tap again to open */}
                    <span className="hidden group-data-[active=true]:inline"> ›</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

    </main>
  )
}
