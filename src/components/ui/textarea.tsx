import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[80px] w-full rounded-lg border border-arena-border bg-arena-raised px-3 py-2 text-body text-arena-text transition-colors outline-none placeholder:text-arena-muted resize-none focus-visible:border-arena-accent focus-visible:ring-2 focus-visible:ring-arena-accent/20 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
