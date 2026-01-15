import Image from "next/image"
import Link from "next/link"
import rawMap from "@/data/landing-map.json"

type LandingItem = {
  slug: string
  x: number
  y: number
  w: number
  h: number
}

const map = rawMap as LandingItem[]

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 🎨 Portfolio Background */}
      <Image
        src="/landing/maglanding.jpg"
        alt="Portfolio"
        fill
        priority
        className="object-contain"
      />

      {/* 🔗 Portfolio Hotspots */}
      {map.map((item) => {
        // Only KICKS should navigate right now
        if (item.slug !== "kicks") return null

        return (
          <Link
            key={item.slug}
            href="/shoes"
            aria-label="View Kicks"
            className="absolute cursor-pointer"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.w}%`,
              height: `${item.h}%`,
            }}
          />
        )
      })}
    </main>
  )
}
