"use client"

import { usePathname } from "next/navigation"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import Navbar from "./Navbar" // Your landing page navbar
import LoggedInNavbar from "./LoggedInNavbar" // Your dashboard navbar

export default function ConditionalNavbar() {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useKindeBrowserClient()

  // Pages that should use the logged-in navbar
  const loggedInPages = [
    "/dashboard",
    "/client-dashboard",
    "/clients",
    "/library",
    "/programs",
    "/settings",
    "/notifications",
    "/messages",
    "/search",
    "/referrals",
    "/teams",
    "/marketing",
  ]

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

  // Logged-in navbar for dashboard and app pages
  if (loggedInPages.some((route) => pathname.startsWith(route))) {
    return <LoggedInNavbar />
  }

  // Default landing page navbar for marketing pages
  return <Navbar />
}
