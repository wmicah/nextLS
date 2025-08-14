"use client"

import { usePathname } from "next/navigation"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import Navbar from "./Navbar"

export default function ConditionalNavbar() {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useKindeBrowserClient()

  // Pages that should have no navbar at all
  const noNavbarPages = ["/auth-callback", "/role-selection"]

  // Don't show anything while loading auth state
  if (isLoading) {
    return null
  }

  // No navbar on specific pages
  if (noNavbarPages.some((route) => pathname.startsWith(route))) {
    return null
  }

  // If user is authenticated, don't show any navbar
  if (isAuthenticated) {
    return null
  }

  // Only show navbar for unauthenticated users (landing page)
  return <Navbar />
}
