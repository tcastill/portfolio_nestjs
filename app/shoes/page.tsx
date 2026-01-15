"use client"

import Image from "next/image"
import Link from "next/link"
import shoeMap from "@/data/shoe-map.json"

type ShoeHotspot = {
  slug: string
  x: number
  y: number
  w: number
  h: number
}

const map = shoeMap as ShoeHotspot[]

export default function ShoeMapPage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 🗺️ Shoe Map Background */}
      <Image
        src="/landing/shoewall.png"
        alt="Shoe Map"
        fill
        priority
        className="object-contain"
      />

      {/* 👟 Shoe Hotspots */}
      {map.map((item) => (
        <Link
          key={item.slug}
          href={`/shoes/${item.slug}`}
          aria-label={`Open ${item.slug}`}
          className="absolute cursor-pointer"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${item.w}%`,
            height: `${item.h}%`,
          }}
        />
      ))}
    </main>
  )
}
