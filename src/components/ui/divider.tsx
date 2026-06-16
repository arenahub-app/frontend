import * as React from "react"
import { cn } from "@/lib/utils"

interface DividerProps {
  label?: string
  className?: string
}

function Divider({ label, className }: DividerProps) {
  if (!label) {
    return (
      <hr
        className={cn(
          "w-full border-none h-px bg-arena-border rounded-full",
          className
        )}
      />
    )
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex-1 h-px bg-arena-border rounded-full" />
      <span className="text-label text-arena-muted shrink-0">{label}</span>
      <span className="flex-1 h-px bg-arena-border rounded-full" />
    </div>
  )
}

export { Divider }
