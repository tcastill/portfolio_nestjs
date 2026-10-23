import Image from "next/image"
import Link from "next/link"
import { Archivo, BenchNine } from "next/font/google"

import shoes from "@/data/shoes.json"
import {
  about,
  brand,
  collections,
  drops,
  featured,
  footer,
  hero,
  nav,
  quote,
} from "@/data/home"
import FeaturedList, { type FeaturedShoe } from "@/components/home/FeaturedList"
import Marquee from "@/components/home/Marquee"
import Reveal from "@/components/home/Reveal"
import Typewriter from "@/components/home/Typewriter"

const display = BenchNine({ subsets: ["latin"], weight: ["300", "400"], variable: "--font-display" })
const body = Archivo({ subsets: ["latin"], variable: "--font-body" })

type Shoe = {
  slug: string
  name: string
  brand: string
  year: number
  cover?: string
  images: string[]
}

const bySlug = new Map((shoes as Shoe[]).map((s) => [s.slug, s]))

const pick = (slugs: string[]): FeaturedShoe[] =>
  slugs.flatMap((slug) => {
    const s = bySlug.get(slug)
    return s ? [{ slug, name: s.name, brand: s.brand, year: s.year, image: s.cover ?? s.images[0] }] : []
  })

function MarqueeBand({ text }: { text: string }) {
  return (
    <Marquee
      items={[text]}
      className="border-y border-black py-4"
      itemClassName="home-display px-10 text-5xl uppercase md:text-7xl"
      seconds={40}
    />
  )
}

export default function Home() {
  const featuredShoes = pick(featured.slugs)
  const dropShoes = pick(drops.slugs)
  const footerShoes = pick(footer.slugs)

  return (
    <main
      className={`${display.variable} ${body.variable} home-page min-h-screen overflow-x-hidden bg-white text-black`}
    >
      {/* ───────────── Hero ───────────── */}
      <section className="relative flex min-h-screen flex-col bg-[var(--home-sage)]">
        <header className="relative z-10 flex items-center justify-end px-6 py-6 md:px-14">
          <nav className="flex gap-5 text-sm uppercase md:gap-8">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-black after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-12 md:px-28">
          <h1 className="home-display text-[clamp(3.5rem,15vw,16rem)] font-light leading-[0.85] tracking-tight">
            <Typewriter text={hero.title} />
          </h1>

          <div className="mt-10 grid items-end gap-10 md:grid-cols-[1fr_auto]">
            <div>
              <Reveal delay={0.2}>
                <p className="max-w-xl text-sm uppercase leading-relaxed md:text-base">{hero.tagline}</p>
              </Reveal>

              <Reveal delay={0.35}>
                <Link
                  href={hero.cta.href}
                  className="mt-10 flex h-32 w-72 items-center justify-center rounded-[50%] border border-black text-sm uppercase transition-colors duration-500 hover:bg-black hover:text-[var(--home-sage)] md:h-36 md:w-80"
                >
                  {hero.cta.label}
                </Link>
              </Reveal>
            </div>

            {/* round photo of the shoes: as big as the space left under the title allows */}
            <Reveal delay={0.3} className="justify-self-end">
              <div className="relative aspect-square w-[min(88vw,420px)] overflow-hidden rounded-full border border-black md:w-[clamp(240px,calc(100svh-12.75vw-190px),42vw)]">
                <Image src={hero.image} alt="Signed and custom sneakers" fill priority sizes="(min-width: 768px) 42vw, 88vw" className="object-cover object-[50%_45%]" />
              </div>
            </Reveal>
          </div>
        </div>

        {/* scroll cue: answers the title with a trail of sneaker prints walking down */}
        <a
          href="#about"
          aria-label="Scroll down to find out"
          className="group absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        >
          <span className="text-[11px] uppercase tracking-[0.3em] transition-opacity group-hover:opacity-60">
            Scroll to find out
          </span>
          <span className="relative h-16 w-8" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <svg
                key={i}
                viewBox="0 0 10 20"
                className="home-step absolute h-4 w-2"
                style={{
                  left: i % 2 === 0 ? "4px" : "18px",
                  top: `${i * 13}px`,
                  transform: `rotate(${i % 2 === 0 ? -8 : 8}deg)${i % 2 === 0 ? "" : " scaleX(-1)"}`,
                  animationDelay: `${i * 0.35}s`,
                }}
              >
                {/* sole + heel */}
                <path d="M5 0C8 0 9.5 3 9.5 6.5S8 12 5 12 0.5 9.5 0.5 6.5 2 0 5 0Z" />
                <ellipse cx="5" cy="16.5" rx="3.6" ry="3.2" />
              </svg>
            ))}
          </span>
        </a>
      </section>

      {/* ───────────── About ───────────── */}
      <section id="about" className="grid scroll-mt-0 border-y border-black md:grid-cols-[1fr_auto_1.15fr]">
        <div className="relative min-h-[60vh] md:min-h-[90vh]">
          <Image src={about.image} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
        </div>

        <Marquee
          vertical
          items={[about.marquee]}
          className="hidden h-[90vh] w-14 border-x border-black bg-[var(--home-pink)] md:block"
          itemClassName="home-display rotate-180 pt-8 pb-8 text-2xl [writing-mode:vertical-rl]"
          seconds={25}
        />

        <div className="relative flex flex-col justify-center px-6 py-16 md:px-16">
          <Reveal>
            <h2 className="home-display max-w-md text-6xl leading-[0.95] md:text-7xl">{about.heading}</h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-8 max-w-md text-sm uppercase leading-relaxed">{about.body}</p>
          </Reveal>
          <div className="relative mt-10 aspect-[3/4] w-40 self-end overflow-hidden md:absolute md:bottom-0 md:right-12 md:mt-0">
            <Image src={about.smallImage} alt="" fill sizes="160px" className="object-cover" />
          </div>
        </div>
      </section>

      {/* ───────────── Collections ───────────── */}
      <section>
        {collections.map((c) => {
          const row = (
            <>
              <h3 className="home-display text-6xl leading-[0.9] md:text-8xl">{c.title}</h3>
              <div className="relative h-40 overflow-hidden md:h-full">
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 20vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="text-xs uppercase leading-relaxed">
                <p className="italic">{c.lead}</p>
                <p className="mt-1">{c.body}</p>
                {!c.href && (
                  <span className="mt-3 inline-block rounded-full border border-black px-3 py-1 text-[10px] tracking-widest">
                    Coming soon
                  </span>
                )}
              </div>
            </>
          )

          const rowClass =
            "group grid min-h-48 gap-6 border-b border-black px-6 py-6 transition-colors duration-500 md:grid-cols-[1.3fr_0.6fr_1fr] md:items-stretch md:px-14"

          return c.href ? (
            <Link key={c.title} id={c.id} href={c.href} className={`${rowClass} hover:bg-[var(--home-pink)]`}>
              {row}
            </Link>
          ) : (
            <div key={c.title} id={c.id} className={rowClass}>
              {row}
            </div>
          )
        })}
      </section>

      {/* ───────────── Quote ───────────── */}
      <section className="px-6 py-32 text-center">
        <Reveal>
          <h2 className="home-display text-7xl md:text-9xl">{quote.heading}</h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mx-auto mt-10 max-w-xl text-sm uppercase italic leading-relaxed">{quote.text}</p>
          <p className="mt-3 text-sm font-bold uppercase">— {quote.by}</p>
        </Reveal>
      </section>

      {/* ───────────── Featured kicks ───────────── */}
      <section className="pb-28">
        <MarqueeBand text={featured.marquee} />
        <div className="mx-auto mt-16 max-w-6xl px-6">
          <FeaturedList shoes={featuredShoes} />
        </div>
      </section>

      {/* ───────────── Latest drops ───────────── */}
      <section className="pb-32">
        <MarqueeBand text={drops.marquee} />
        <div className="mx-auto mt-10 grid max-w-6xl gap-12 px-6 md:grid-cols-3 md:gap-16">
          {dropShoes.map((shoe, i) => (
            <Reveal key={shoe.slug} delay={i * 0.12} className={i === 1 ? "md:mt-28" : ""}>
              <Link href={`/shoes/${shoe.slug}`} className="group block">
                <span className="text-xs">{String(i + 1).padStart(2, "0")}</span>
                <div className="mt-4 border border-black p-1.5">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={shoe.image}
                      alt={shoe.name}
                      fill
                      sizes="(min-width: 768px) 30vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>
                <p className="home-display mt-3 text-xl">{shoe.name}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────── Footer ───────────── */}
      <footer className="border-t border-black bg-[var(--home-pink)]">
        <Marquee
          items={footer.marquee}
          className="border-b border-black/20 py-4"
          itemClassName="px-10 text-lg uppercase"
          seconds={35}
          reverse
        />
        <div className="grid grid-cols-3 gap-3 p-6 md:grid-cols-6">
          {footerShoes.map((shoe) => (
            <Link key={shoe.slug} href={`/shoes/${shoe.slug}`} className="group relative aspect-square overflow-hidden">
              <Image
                src={shoe.image}
                alt={shoe.name}
                fill
                sizes="(min-width: 768px) 16vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </Link>
          ))}
        </div>
        <div className="flex justify-between px-6 pb-6 text-xs uppercase md:px-14">
          <span>© {new Date().getFullYear()} {brand}</span>
          <a href="#" className="hover:underline">
            Back to top ↑
          </a>
        </div>
      </footer>
    </main>
  )
}
