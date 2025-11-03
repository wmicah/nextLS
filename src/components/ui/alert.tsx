"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AlertProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "destructive"
}

interface AlertDescriptionProps {
  children: React.ReactNode
  className?: string
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "alert",
          variant === "destructive" && "alert-destructive",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("alert-description", className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }



















