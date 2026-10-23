// Endlessly scrolling band of text. The items are rendered twice so the loop is seamless.

type Props = {
  items: string[]
  className?: string
  itemClassName?: string
  vertical?: boolean
  reverse?: boolean
  seconds?: number
}

export default function Marquee({
  items,
  className = "",
  itemClassName = "",
  vertical = false,
  reverse = false,
  seconds = 30,
}: Props) {
  const track = vertical ? "flex flex-col" : "flex"

  return (
    <div className={`overflow-hidden ${className}`} aria-label={items.join(", ")}>
      <div
        aria-hidden
        className={`${track} w-max ${vertical ? "home-marquee-y h-max w-full" : "home-marquee-x"}`}
        style={{
          animationDuration: `${seconds}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className={`${track} shrink-0`}>
            {Array.from({ length: 4 }, () => items)
              .flat()
              .map((item, i) => (
                <span key={i} className={`shrink-0 whitespace-nowrap ${itemClassName}`}>
                  {item}
                </span>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
