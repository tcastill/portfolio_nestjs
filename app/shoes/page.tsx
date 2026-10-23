"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import shoeMap from "@/data/shoe-map.json"
import shoes from "@/data/shoes.json"

type ShoeHotspot = {
  slug: string
  x: number
  y: number
  w: number
  h: number
}

const map = shoeMap as ShoeHotspot[]

const names: Record<string, string> = Object.fromEntries(
  (shoes as { slug: string; name: string }[]).map((s) => [s.slug, s.name])
)

// shoewall-newface.png is 1360x768
const IMAGE_RATIO = 1360 / 768

export default function ShoeMapPage() {
  // unlinked shoes start greyed out; the switch shows the whole wall in colour
  const [greyOut, setGreyOut] = useState(true)

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-black">
      {/* top bar: just the grey-out switch (no way back to the home page while the link is shared) */}
      <div className="flex h-20 shrink-0 items-center justify-end px-6 md:px-10">
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

      {/* Image area with breathing room on every side */}
      <div className="flex min-h-0 flex-1 items-center justify-center pb-10">
        {/* Box matching the image's aspect ratio so hotspots stay locked to the shoes */}
        <div
          className="relative @container"
          style={{
            width: `min(88vw, calc((100vh - 7.5rem) * ${IMAGE_RATIO}))`,
            aspectRatio: `${IMAGE_RATIO}`,
          }}
        >
          {/* 🗺️ Shoe Map Background */}
          <Image
            src="/landing/shoewall-newface.png"
            alt="Shoe Map"
            fill
            priority
            className="object-contain"
          />

          {/* grey out every shoe except the linked ones, leaving the shelves in colour.
              shoewall-newface-shoes.png is a white-on-black cut-out of the shoes on the wall */}
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
            <mask id="unlinked-shoes">
              <image href="/masks/shoewall-newface-shoes.png" width="100" height="100" preserveAspectRatio="none" />
              {map.map((item) => (
                <rect key={item.slug} x={item.x} y={item.y} width={item.w} height={item.h} rx="0.6" fill="black" />
              ))}
            </mask>
            <image
              href="/landing/shoewall-newface.png"
              width="100"
              height="100"
              preserveAspectRatio="none"
              filter="url(#grey-shoes)"
              mask="url(#unlinked-shoes)"
            />
          </svg>

          {/* 👟 Shoe Hotspots */}
          {map.map((item) => {
            const name = names[item.slug] ?? item.slug
            // keep the tag inside the wall for shoes at the left and right edges
            const tagAlign =
              item.x + item.w > 90 ? "right-0" : item.x < 8 ? "left-0" : "left-1/2 -translate-x-1/2"

            return (
              <Link
                key={item.slug}
                href={`/shoes/${item.slug}`}
                aria-label={`Open ${name}`}
                className="group absolute cursor-pointer outline-none"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.w}%`,
                  height: `${item.h}%`,
                }}
              >
                {/* frame on hover */}
                <span className="pointer-events-none absolute -inset-[4%] rounded-[0.6cqw] border-[0.12cqw] border-white shadow-[0_0_1.4cqw_rgba(208,156,177,0.9)] opacity-0 scale-95 transition duration-300 group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100" />

                {/* name tag */}
                <span className={`pointer-events-none absolute bottom-[100%] ${tagAlign} mb-[0.5cqw] translate-y-[0.4cqw] whitespace-nowrap rounded-full bg-white px-[0.8cqw] py-[0.25cqw] text-[0.85cqw] font-semibold uppercase tracking-wider text-black opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100`}>
                  {name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
