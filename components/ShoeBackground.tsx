import Image from "next/image"

export default function ShoeBackground({ src }: { src?: string }) {
  if (!src) return null

  return (
    <div className="fixed inset-0 -z-50">
      <Image src={src} alt="" fill priority className="object-cover" />
    </div>
  )
}