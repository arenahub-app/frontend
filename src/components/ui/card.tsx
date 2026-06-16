import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  pressable = false,
  padded = true,
  ...props
}: React.ComponentProps<"div"> & {
  pressable?: boolean
  padded?: boolean
}) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col overflow-hidden rounded-card bg-arena-surface border border-arena-border text-arena-text",
        padded && "p-4",
        pressable && "cursor-pointer transition-transform active:scale-[0.98]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-display text-title text-arena-text", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-caption text-arena-muted", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("flex flex-col gap-3", className)} {...props} />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center border-t border-arena-border pt-3 mt-3", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
