import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "nexu"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-brand-navy text-white hover:bg-brand-navy/90",
          variant === "nexu" && "bg-brand-red text-white hover:bg-brand-red/90 active:scale-95",
          variant === "destructive" && "bg-red-500 text-white hover:bg-red-600",
          variant === "outline" && "border border-brand-navy bg-white text-brand-navy hover:bg-brand-navy/10",
          variant === "secondary" && "bg-brand-gray text-brand-navy hover:bg-brand-gray/80",
          variant === "ghost" && "hover:bg-brand-gray/20 text-brand-navy",
          variant === "link" && "text-brand-red underline-offset-4 hover:underline",
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-9 rounded-md px-3",
          size === "lg" && "h-11 rounded-md px-8",
          size === "icon" && "h-10 w-10",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
