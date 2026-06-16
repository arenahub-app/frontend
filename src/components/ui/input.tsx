import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-arena-border bg-arena-raised px-3 text-body text-arena-text transition-colors outline-none placeholder:text-arena-muted focus-visible:border-arena-accent focus-visible:ring-2 focus-visible:ring-arena-accent/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-arena-danger aria-invalid:ring-2 aria-invalid:ring-arena-danger/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
