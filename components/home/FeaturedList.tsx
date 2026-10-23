"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

export type FeaturedShoe = {
  slug: string
  name: string
  brand: string
  year: number
  image: string
}

// List of shoes on the left; hovering a row highlights it and swaps the photo on the right.
export default function FeaturedList({ shoes }: { shoes: FeaturedShoe[] }) {
  const [active, setActive] = useState(0)
  const current = shoes[active]

  return (
    <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
      <ul className="self-start border border-black">
        {shoes.map((shoe, i) => (
          <li key={shoe.slug} className="border-b border-black last:border-b-0">
            <Link
              href={`/shoes/${shoe.slug}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`group flex items-center justify-between gap-4 px-4 py-5 text-sm uppercase tracking-wide transition-colors duration-300 md:text-base ${
                i === active ? "bg-[var(--home-pink)]" : "bg-white"
              }`}
            >
              <span>{shoe.name}</span>
              <span className="flex items-center gap-3 text-xs opacity-70">
                {shoe.brand} · {shoe.year}
                <span className="translate-x-[-4px] opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                  →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={current.slug}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={current.image}
              alt={current.name}
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
