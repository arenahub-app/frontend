import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-btn border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* shadcn/ui — mantidos para compatibilidade */
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
        /* Arena */
        primary:
          "bg-arena-accent text-white hover:bg-arena-accent-dim shadow-sm",
        danger:
          "bg-arena-danger/10 text-arena-danger hover:bg-arena-danger/20 border-arena-danger/20",
      },
      size: {
        /* shadcn/ui — mantidos */
        default: "h-8 gap-1.5 px-3 text-sm",
        xs:      "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        /* Arena — mobile-safe (min 44 px) */
        sm: "h-[44px] px-4 text-sm",
        md: "h-[44px] px-5 text-base",
        lg: "h-12 px-6 text-base",
        icon:    "size-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
  }

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={loading || disabled}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin size-4" /> : children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
