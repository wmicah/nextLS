"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SheetProps {
  children: React.ReactNode
}

interface SheetContentProps {
  children: React.ReactNode
  className?: string
}

interface SheetHeaderProps {
  children: React.ReactNode
  className?: string
}

interface SheetTitleProps {
  children: React.ReactNode
  className?: string
}

interface SheetDescriptionProps {
  children: React.ReactNode
  className?: string
}

interface SheetTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const Sheet = ({ children }: SheetProps) => {
  return <div className="sheet">{children}</div>
}

const SheetContent = ({ children, className }: SheetContentProps) => {
  return (
    <div className={cn("sheet-content", className)}>
      {children}
    </div>
  )
}

const SheetHeader = ({ children, className }: SheetHeaderProps) => {
  return (
    <div className={cn("sheet-header", className)}>
      {children}
    </div>
  )
}

const SheetTitle = ({ children, className }: SheetTitleProps) => {
  return (
    <h2 className={cn("sheet-title", className)}>
      {children}
    </h2>
  )
}

const SheetDescription = ({ children, className }: SheetDescriptionProps) => {
  return (
    <p className={cn("sheet-description", className)}>
      {children}
    </p>
  )
}

const SheetTrigger = ({ children, asChild }: SheetTriggerProps) => {
  return <div className="sheet-trigger">{children}</div>
}

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
}


















