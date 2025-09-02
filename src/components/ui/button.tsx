import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "tactical-button ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Intelligence-themed variants
        intel: "bg-gradient-intel text-primary-foreground hover:shadow-2xl hover:scale-105 font-semibold tracking-wide shadow-lg border border-intel-cyan/20",
        tactical: "bg-background-secondary text-intel-cyan border border-intel-cyan hover:bg-intel-cyan hover:text-primary-foreground shadow-lg hover:shadow-intel-cyan/50",
        command: "bg-intel-blue text-white hover:bg-intel-blue-dark shadow-xl font-bold tracking-wide",
        threat: "bg-threat-high text-white hover:bg-threat-high/90 shadow-lg animate-pulse-glow",
        secure: "bg-background-tertiary text-foreground border border-border hover:border-intel-cyan hover:text-intel-cyan shadow-md",
        stealth: "bg-black/50 text-intel-cyan border border-intel-cyan/30 hover:bg-intel-cyan/10 backdrop-blur-sm"
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg font-bold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
