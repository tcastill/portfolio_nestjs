"use client"

import { useEffect, useState } from "react"

// Types the word out, waits, deletes it, and repeats, with a blinking bar cursor.
export default function Typewriter({ text }: { text: string }) {
  const [count, setCount] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      const t = setTimeout(() => setCount(text.length), 0)
      return () => clearTimeout(t)
    }

    let delay = deleting ? 70 : 160
    if (!deleting && count === text.length) delay = 2600
    if (deleting && count === 0) delay = 500

    const t = setTimeout(() => {
      if (!deleting && count === text.length) setDeleting(true)
      else if (deleting && count === 0) setDeleting(false)
      else setCount((c) => c + (deleting ? -1 : 1))
    }, delay)

    return () => clearTimeout(t)
  }, [count, deleting, text])

  return (
    <span aria-label={text} className="inline-flex items-stretch">
      <span aria-hidden>{text.slice(0, count)}</span>
      <span aria-hidden className="home-caret ml-[0.06em] w-[0.05em] min-w-[3px] bg-current" />
    </span>
  )
}
