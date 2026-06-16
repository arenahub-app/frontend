import * as React from "react"
import { cn } from "@/lib/utils"

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-11 w-full appearance-none rounded-lg border border-arena-border bg-arena-raised px-3 text-body text-arena-text transition-colors outline-none focus-visible:border-arena-accent focus-visible:ring-2 focus-visible:ring-arena-accent/20 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Select }
