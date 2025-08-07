import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none border-2 relative active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-mono tracking-wide uppercase",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-primary shadow-md hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        destructive:
          "bg-destructive text-destructive-foreground border-destructive shadow-md hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50",
        outline:
          "border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent focus-visible:ring-2 focus-visible:ring-ring",
        secondary:
          "bg-secondary text-secondary-foreground border-secondary shadow-md hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-secondary/50",
        ghost:
          "border-transparent hover:bg-accent hover:text-accent-foreground hover:border-accent",
        link: "text-primary underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 px-3 gap-1.5 text-xs has-[>svg]:px-2.5",
        lg: "h-12 px-6 text-base has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
