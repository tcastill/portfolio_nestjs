"use client"

type Props = {
  xPercent: number
  yPercent: number
  title: string
  subtitle: string
}

export default function ShoeHotspot({
  xPercent,
  yPercent,
  title,
  subtitle,
}: Props) {
  return (
    <div
      className="absolute z-50 group"
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Marker */}
      <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-lg">
        –
      </div>

      {/* Info */}
      <div className="
        absolute
        right-24
        top-[40%]
        -translate-y-1/2
        min-w-[260px]
        px-4
        py-3
        rounded-xl
        backdrop-blur-md
        bg-white/40
        border border-white/50
        shadow-lg
        opacity-0
        group-hover:opacity-100
        transition-opacity
        duration-300
        pointer-events-none
      ">
        <div className="text-center text-black">
          <div className="text-sm font-semibold mb-1">{title}</div>
          <div className="text-xs opacity-80">{subtitle}</div>
        </div>

        {/* Diagonal connector */}
        <div
          className="
            absolute
            right-[-90px]
            top-[65%]
            w-28
            border-t-2
            border-dashed
            border-black/70
            rotate-[35deg]
            origin-left
          "
        />
      </div>
    </div>
  )
}
