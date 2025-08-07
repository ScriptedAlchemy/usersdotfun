import * as React from "react"

import { cn } from "~/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "flex h-10 w-full min-w-0 px-3 py-2 text-sm font-mono",
        "bg-input border-2 border-border shadow-sm",
        "transition-all outline-none",
        "focus:border-primary focus:shadow-md focus:translate-x-[-1px] focus:translate-y-[-1px]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "dark:bg-input dark:border-border",
        className
      )}
      {...props}
    />
  )
}

export { Input }
