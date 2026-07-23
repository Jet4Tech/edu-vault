import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Two bugs lived here. ring-3 is a Tailwind v4 class and this project
        // is on v3, so no ring was generated at all. And an opacity modifier on
        // a theme colour (ring-ring/50) can't resolve, because the palette maps
        // to complete oklch() values rather than the channel + <alpha-value>
        // form Tailwind needs — so it fell back to the default ring colour,
        // blue-500, which is where the stray blue focus glow came from.
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive md:text-sm dark:aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
