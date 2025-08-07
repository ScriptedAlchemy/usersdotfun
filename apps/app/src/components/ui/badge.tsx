import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all overflow-hidden border-2 font-mono uppercase tracking-wide",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-sm",
        secondary:
          "border-secondary bg-secondary text-secondary-foreground shadow-sm",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground shadow-sm",
        outline:
          "text-foreground border-border bg-transparent",
        success:
          "border-green-600 bg-green-500 text-white shadow-sm dark:border-green-500 dark:bg-green-600",
        warning:
          "border-yellow-600 bg-yellow-500 text-white shadow-sm dark:border-yellow-500 dark:bg-yellow-600",
        cancelled:
          "border-gray-500 bg-gray-400 text-white shadow-sm dark:border-gray-400 dark:bg-gray-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
