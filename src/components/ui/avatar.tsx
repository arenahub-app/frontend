import * as React from "react"
import { cn } from "@/lib/utils"

const JERSEY_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#8b5cf6", "#ec4899", "#0ea5e9",
]

function getAvatarColor(name: string): string {
  if (!name) return JERSEY_COLORS[0]
  const code = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return JERSEY_COLORS[code % JERSEY_COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const sizeMap = {
  sm: { outer: "size-8",  text: "text-[11px]", number: "text-[13px]" },
  md: { outer: "size-10", text: "text-[13px]", number: "text-[15px]" },
  lg: { outer: "size-14", text: "text-[18px]", number: "text-[22px]" },
}

type AvatarSize = keyof typeof sizeMap

interface AvatarProps {
  name: string
  src?: string
  size?: AvatarSize
  number?: number
  className?: string
}

function Avatar({ name, src, size = "md", number, className }: AvatarProps) {
  const { outer, text, number: numberSize } = sizeMap[size]
  const bg = getAvatarColor(name)

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover shrink-0", outer, className)}
      />
    )
  }

  return (
    <span
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold select-none",
        outer,
        className
      )}
      style={{ backgroundColor: bg }}
    >
      {number !== undefined ? (
        <span className={cn("text-white leading-none", numberSize)}>
          {number}
        </span>
      ) : (
        <span className={cn("text-white leading-none", text)}>
          {getInitials(name)}
        </span>
      )}
    </span>
  )
}

export { Avatar }
