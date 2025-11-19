"use client"

import { useState, useEffect } from "react"
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { trpc } from "@/app/_trpc/client"
import { User, LogOut, Menu, X } from "lucide-react"

export default function LoggedInNavbar() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Get user data directly
  const { user, isLoading } = useKindeBrowserClient()
  const { data: userProfile } = trpc.user.getProfile.useQuery()

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show navbar when mouse is within 50px of the top
      setIsVisible(e.clientY <= 50)
    }

    // Also hide when mouse leaves the window
    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  // Get display name
  const displayName =
    userProfile?.name ||
    user?.given_name ||
    user?.email?.split("@")[0] ||
    "User"

  // Get role for navbar title
  const navbarTitle =
    userProfile?.role === "CLIENT" ? "Athlete View" : "Coach View"

  if (isLoading) {
    return null // Don't show navbar while loading
  }

  return (
    <>
      {/* Invisible trigger area at the top */}
      <div
        className='fixed top-0 left-0 right-0 h-12 z-40 pointer-events-none'
        onMouseEnter={() => setIsVisible(true)}
      />

      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-zinc-800/75 backdrop-blur-sm border-b border-gray-200 transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
        onMouseLeave={() => setIsVisible(false)}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            {/* Logo */}
            <div className='flex items-center'>
              <h1 className='text-xl font-bold text-zinc-100'>{navbarTitle}</h1>
            </div>

            {/* Desktop Menu */}
            <div className='hidden md:flex items-center space-x-4'>
              <div className='flex items-center space-x-2'>
                <User className='h-5 w-5 text-white' />
                <span className='text-sm text-white'>{displayName}</span>
              </div>
              <LogoutLink className='flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-white hover:text-white hover:bg-black transition-colors'>
                <LogOut className='h-4 w-4' />
                <span>Sign out</span>
              </LogoutLink>
            </div>

            {/* Mobile menu button */}
            <div className='md:hidden'>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className='p-2 rounded-md text-white hover:text-gray-300 hover:bg-zinc-700'
              >
                {isMenuOpen ? (
                  <X className='h-6 w-6' />
                ) : (
                  <Menu className='h-6 w-6' />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className='md:hidden'>
              <div className='px-2 pt-2 pb-3 space-y-1 border-t border-zinc-600'>
                <div className='flex items-center space-x-2 px-3 py-2'>
                  <User className='h-5 w-5 text-white' />
                  <span className='text-sm text-white'>{displayName}</span>
                </div>
                <LogoutLink className='flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-white hover:text-gray-300 hover:bg-zinc-700 transition-colors w-full'>
                  <LogOut className='h-4 w-4' />
                  <span>Sign out</span>
                </LogoutLink>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
