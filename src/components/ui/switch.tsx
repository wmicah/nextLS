"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn("switch", className)}
        {...props}
      />
    )
  }
)
Switch.displayName = "Switch"

export { Switch }




