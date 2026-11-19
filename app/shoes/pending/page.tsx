// Shown for shoes on the wall that don't have their own page yet: an empty spot on a lit black shelf.

export const metadata = { title: "Picture pending" }

export default function PicturePendingPage() {
  return (
    <main className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-black text-white">
      {/* the spotlight from above */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[75vh] w-[min(70vw,700px)] -translate-x-1/2 bg-[radial-gradient(ellipse_40%_90%_at_50%_0%,rgba(255,214,170,0.3),rgba(255,200,150,0.08)_50%,transparent_80%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-2 w-16 -translate-x-1/2 rounded-b-full bg-[#ffe9cc] shadow-[0_0_24px_6px_rgba(255,214,170,0.7)]" />

      {/* where the shoe will go: an outline on the shelf */}
      <div className="relative w-[min(70vw,420px)]">
        <svg viewBox="0 6 300 124" className="w-full" aria-hidden>
          <path
            d="M18 118 C14 100 20 86 34 80 L92 58 C104 40 112 22 128 16 L150 12 C160 30 176 44 198 52 L252 70 C276 78 288 92 286 108 L284 118 Z"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2"
            strokeDasharray="7 6"
            strokeLinejoin="round"
          />
          <path d="M18 118 L284 118 C286 124 282 128 274 128 L28 128 C20 128 16 124 18 118 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="7 6" />
        </svg>
        {/* the pool of light on the shelf */}
        <div className="absolute inset-x-[10%] -bottom-5 h-10 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(255,214,170,0.25),transparent_70%)]" />
      </div>
      {/* the shelf */}
      <div className="relative h-4 w-[min(90vw,720px)] bg-[linear-gradient(to_bottom,#2a2a2d,#151517_18%,#0b0b0c_60%,#050505)] shadow-[0_10px_20px_rgba(0,0,0,0.9)]">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,rgba(255,255,255,0.15),rgba(255,255,255,0.7)_50%,rgba(255,255,255,0.15))]" />
      </div>

      <h1 className="mt-12 text-2xl font-semibold uppercase tracking-[0.3em] md:text-3xl">Picture pending</h1>
      <p className="mt-3 text-sm uppercase tracking-[0.2em] text-white/50">This pair&apos;s photo is on its way</p>
    </main>
  )
}
