"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: React.ReactNode
}

interface TooltipContentProps {
  children: React.ReactNode
  className?: string
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const Tooltip = ({ children }: TooltipProps) => {
  return <div className="tooltip">{children}</div>
}

const TooltipContent = ({ children, className }: TooltipContentProps) => {
  return (
    <div className={cn("tooltip-content", className)}>
      {children}
    </div>
  )
}

const TooltipTrigger = ({ children, asChild }: TooltipTriggerProps) => {
  return <div className="tooltip-trigger">{children}</div>
}

const TooltipProvider = ({ children }: TooltipProps) => {
  return <div className="tooltip-provider">{children}</div>
}

export {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
}






