"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DrawerProps {
  children: React.ReactNode
}

interface DrawerContentProps {
  children: React.ReactNode
  className?: string
}

interface DrawerHeaderProps {
  children: React.ReactNode
  className?: string
}

interface DrawerTitleProps {
  children: React.ReactNode
  className?: string
}

interface DrawerDescriptionProps {
  children: React.ReactNode
  className?: string
}

interface DrawerTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const Drawer = ({ children }: DrawerProps) => {
  return <div className='drawer'>{children}</div>
}

const DrawerContent = ({ children, className }: DrawerContentProps) => {
  return <div className={cn("drawer-content", className)}>{children}</div>
}

const DrawerHeader = ({ children, className }: DrawerHeaderProps) => {
  return <div className={cn("drawer-header", className)}>{children}</div>
}

const DrawerTitle = ({ children, className }: DrawerTitleProps) => {
  return <h2 className={cn("drawer-title", className)}>{children}</h2>
}

const DrawerDescription = ({ children, className }: DrawerDescriptionProps) => {
  return <p className={cn("drawer-description", className)}>{children}</p>
}

const DrawerTrigger = ({ children, asChild }: DrawerTriggerProps) => {
  return <div className='drawer-trigger'>{children}</div>
}

export {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
}
