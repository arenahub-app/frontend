import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-badge border border-transparent px-2 text-label whitespace-nowrap transition-all",
  {
    variants: {
      variant: {
        /* shadcn/ui — mantidos para compatibilidade */
        default:     "bg-primary text-primary-foreground",
        secondary:   "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline:     "border-border text-foreground",
        ghost:       "text-muted-foreground",
        link:        "text-primary underline-offset-4 hover:underline",
        /* Arena — semânticos */
        success: "bg-arena-success/15 text-arena-success border-arena-success/20",
        warning: "bg-arena-warning/15 text-arena-warning border-arena-warning/20",
        danger:  "bg-arena-danger/15 text-arena-danger border-arena-danger/20",
        neutral: "bg-arena-surface text-arena-muted border-arena-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      { className: cn(badgeVariants({ variant }), className) },
      props
    ),
    render,
    state: { slot: "badge", variant },
  })
}

export { Badge, badgeVariants }
