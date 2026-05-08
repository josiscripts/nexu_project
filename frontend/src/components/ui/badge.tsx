import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2",
        variant === "default" && "border border-brand-red bg-brand-red/10 text-brand-red",
        variant === "secondary" && "border border-brand-navy bg-brand-navy/10 text-brand-navy",
        variant === "destructive" && "border border-red-500 bg-red-500/10 text-red-600",
        variant === "outline" && "border border-brand-navy/20 text-brand-navy",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
