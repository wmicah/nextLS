"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { trpc } from "@/app/_trpc/client"
import { useState, useRef, useEffect } from "react"
import {
  FiSettings,
  FiBell,
  FiMessageSquare,
  FiSearch,
  FiUsers,
  FiBookOpen,
  FiClipboard,
  FiCalendar,
  FiHome,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiBarChart2,
  FiVideo,
} from "react-icons/fi"
import { LogOut, Settings, UserIcon, MessageCircle } from "lucide-react"
import MessagePopup from "./MessagePopup"
import NotificationPopup from "./NotificationPopup"
import ProfilePictureUploader from "./ProfilePictureUploader"
import ClientSearchModal from "./ClientSearchModal"

// navLinks will be defined inside the component to access unreadCount

const bottomLinks = [
  { name: "Settings", icon: <FiSettings />, href: "/settings" },
  { name: "Notifications", icon: <FiBell />, href: "/notifications" },
  { name: "Search", icon: <FiSearch />, href: "/search" },
]

interface SidebarProps {
  user?: { name?: string; email?: string }
  children: React.ReactNode
}

export default function Sidebar({ user, children }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { data: authData } = trpc.authCallback.useQuery()
  const [isOpen, setIsOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showRecentMessages, setShowRecentMessages] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showClientSearch, setShowClientSearch] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const messagePopupRef = useRef<HTMLDivElement>(null)

  // Get unread message count and conversations
  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 3000, // Real-time updates every 3 seconds
      staleTime: 1000, // Consider data stale after 1 second
    }
  )
  const { data: conversations = [] } = trpc.messaging.getConversations.useQuery(
    undefined,
    {
      enabled: showRecentMessages,
      refetchInterval: 10000, // Increased from 5s to 10s for better performance
      staleTime: 5000, // Add stale time to reduce unnecessary refetches
    }
  )

  // Get unread notification count
  const { data: unreadNotificationCount = 0 } =
    trpc.notifications.getUnreadCount.useQuery(undefined, {
      refetchInterval: 3000, // Real-time updates every 3 seconds
      staleTime: 1000, // Consider data stale after 1 second
    })

  // Get user settings for avatar
  const { data: userSettings } = trpc.settings.getSettings.useQuery()

  // Define navLinks inside component to access unreadCount
  const navLinks = [
    {
      name: "Dashboard",
      icon: <FiHome />,
      href: "/dashboard",
      description: "Overview & analytics",
      badge: null,
      gradient: "from-blue-500 to-cyan-500",
    },

    {
      name: "Clients",
      icon: <FiUsers />,
      href: "/clients",
      description: "Manage athletes",
      badge: null,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      name: "Library",
      icon: <FiBookOpen />,
      href: "/library",
      description: "Training resources",
      badge: null,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      name: "Programs",
      icon: <FiClipboard />,
      href: "/programs",
      description: "Workout plans",
      badge: null,
      gradient: "from-orange-500 to-red-500",
    },
    {
      name: "Schedule",
      icon: <FiCalendar />,
      href: "/schedule",
      description: "Lesson planning",
      badge: null,
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      name: "Analytics",
      icon: <FiBarChart2 />,
      href: "/analytics",
      description: "Data insights",
      badge: null,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      name: "Videos",
      icon: <FiVideo />,
      href: "/videos",
      description: "Video feedback system",
      badge: null,
      gradient: "from-red-500 to-pink-500",
    },
  ]

  // Keyboard shortcut for client search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setShowClientSearch(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // ---- Persist sidebar open/closed state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nls_sidebar_open")
      if (saved !== null) setIsOpen(saved === "1")
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("nls_sidebar_open", isOpen ? "1" : "0")
    } catch {}
  }, [isOpen])

  // ---- Keyboard shortcut: Ctrl/Cmd + B to toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac")
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault()
        toggleDesktopSidebar()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const userInitials =
    user?.name || authData?.user?.name
      ? ((user?.name ?? authData?.user?.name) || "")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : (user?.email || authData?.user?.email)?.[0]?.toUpperCase() || "U"

  const isActiveLink = (href: string) => pathname === href

  const toggleDesktopSidebar = () => setIsOpen((o) => !o)
  const toggleMobileSidebar = () => setIsMobileOpen((o) => !o)

  const handleUserClick = () => setUserDropdownOpen((o) => !o)

  const handleMessageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (showRecentMessages) {
      setIsAnimating(true)
      setTimeout(() => {
        setShowRecentMessages(false)
        setIsAnimating(false)
      }, 200)
    } else {
      setShowRecentMessages(true)
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  const handleNotificationClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (showNotifications) {
      setIsAnimating(true)
      setTimeout(() => {
        setShowNotifications(false)
        setIsAnimating(false)
      }, 200)
    } else {
      setShowNotifications(true)
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setUserDropdownOpen(false)
    try {
      window.location.href = "/api/auth/logout"
    } catch (error) {
      console.error("Logout failed:", error)
      setIsLoggingOut(false)
    }
  }

  const handleSettingsClick = () => {
    setUserDropdownOpen(false)
    router.push("/settings")
  }

  const formatTime = (date: string) => {
    const messageDate = new Date(date)
    const now = new Date()
    const diffInHours =
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`
    if (diffInHours < 48) return "Yesterday"
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false)
      }
      if (
        messagePopupRef.current &&
        !messagePopupRef.current.contains(event.target as Node)
      ) {
        if (showRecentMessages) {
          setIsAnimating(true)
          setTimeout(() => {
            setShowRecentMessages(false)
            setIsAnimating(false)
          }, 200)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showRecentMessages])

  const currentUserId = authData?.user?.id

  return (
    <div
      className='flex min-h-screen'
      style={{ backgroundColor: "#2A3133" }}
    >
      {/* Mobile hamburger button */}
      <button
        onClick={toggleMobileSidebar}
        className='fixed top-4 left-4 z-30 md:hidden p-3 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg bg-sidebar text-sidebar-foreground border border-sidebar-border'
        aria-label={isMobileOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isMobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-60 z-10 md:hidden transition-opacity duration-300 backdrop-blur-sm'
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`flex flex-col justify-between h-screen fixed left-0 top-0 z-20 transition-[width,transform] duration-500 ease-in-out backdrop-blur-sm bg-sidebar text-sidebar-foreground shadow-lg ${
          isOpen ? "md:w-64" : "md:w-20"
        } ${
          isMobileOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
        } md:translate-x-0`}
      >
        <div>
          {/* Header */}
          <div className='flex items-center justify-center h-24 px-4 font-bold text-xl transition-all duration-300 overflow-hidden relative'>
            {/* Background gradient effect */}
            <div
              className='absolute inset-0 opacity-10'
              style={{
                background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
              }}
            />

            <span
              className={`hover:scale-105 transition-all duration-500 cursor-default whitespace-nowrap relative z-10 text-sidebar-foreground ${
                isOpen
                  ? "opacity-100 translate-x-0 delay-150"
                  : "opacity-0 -translate-x-4"
              }`}
            >
              <div className='flex items-center gap-2'>
                {/* Logo is a secondary toggle via double-click */}
                <div
                  className='w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer group'
                  onDoubleClick={toggleDesktopSidebar}
                  title='Double-click to collapse/expand'
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <img
                    src='/logo image.png'
                    alt='Next Level Softball'
                    className='w-full h-full object-cover group-active:scale-95 transition-transform'
                  />
                </div>
                Next Level Softball
              </div>
            </span>
            <span
              className={`hover:scale-105 transition-all duration-500 cursor-default absolute z-10 text-sidebar-foreground ${
                isOpen
                  ? "opacity-0 translate-x-4"
                  : "opacity-100 translate-x-0 delay-150"
              }`}
            >
              <div
                className='w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer'
                onDoubleClick={toggleDesktopSidebar}
                title='Double-click to expand'
                style={{ backgroundColor: "#4A5A70" }}
              >
                <img
                  src='/logo image.png'
                  alt='Next Level Softball'
                  className='w-full h-full object-cover'
                />
              </div>
            </span>
          </div>

          {/* Navigation */}
          <nav
            className={`mt-6 px-3 ${
              isOpen
                ? "flex flex-col gap-1"
                : "grid grid-cols-1 gap-1 place-items-center"
            }`}
          >
            {navLinks.map((link, index) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => {
                  setIsMobileOpen(false)
                  startTransition(() => {
                    // This will show loading state during navigation
                  })
                }}
                className={`transition-all duration-300 ease-in-out transform hover:scale-105 group relative ${
                  isOpen
                    ? "flex items-center gap-3 px-4 py-3 hover:shadow-lg overflow-hidden rounded-xl"
                    : "flex items-center justify-center p-3 text-xl rounded-xl"
                } ${
                  isActiveLink(link.href) ? "text-white" : "hover:text-white"
                }`}
                style={{
                  backgroundColor: isActiveLink(link.href)
                    ? "#353A3A"
                    : "transparent",
                  color: isActiveLink(link.href) ? "#C3BCC2" : "#606364",
                  boxShadow: isActiveLink(link.href)
                    ? "0 4px 20px rgba(0, 0, 0, 0.3)"
                    : "none",
                  animationDelay: `${index * 100}ms`,
                  border: isActiveLink(link.href)
                    ? "1px solid #4A5A70"
                    : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  setHoveredLink(link.name)
                  if (!isActiveLink(link.href)) {
                    e.currentTarget.style.backgroundColor = isOpen
                      ? "#353A3A"
                      : "rgba(74, 90, 112, 0.1)"
                    e.currentTarget.style.color = "#C3BCC2"
                    e.currentTarget.style.borderColor = "#4A5A70"
                    if (isOpen) {
                      e.currentTarget.style.boxShadow =
                        "0 4px 20px rgba(0, 0, 0, 0.3)"
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  setHoveredLink(null)
                  if (!isActiveLink(link.href)) {
                    e.currentTarget.style.backgroundColor = "transparent"
                    e.currentTarget.style.color = "#606364"
                    e.currentTarget.style.borderColor = "transparent"
                    e.currentTarget.style.boxShadow = "none"
                  }
                }}
              >
                <span
                  className={`transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${
                    isOpen ? "text-xl" : "text-xl"
                  }`}
                >
                  {link.icon}
                </span>
                {isOpen && (
                  <div className='flex-1 flex items-center justify-between'>
                    <div className='flex flex-col'>
                      <span className='font-medium transition-all duration-500 whitespace-nowrap opacity-100 translate-x-0 delay-150'>
                        {link.name}
                      </span>
                      <span
                        className='text-xs transition-all duration-500 opacity-60'
                        style={{ color: "#ABA4AA" }}
                      >
                        {link.description}
                      </span>
                    </div>
                    {link.badge && (
                      <span
                        className='px-2 py-1 text-xs rounded-full font-medium transition-all duration-300'
                        style={{ backgroundColor: "#10B981", color: "#DCFCE7" }}
                      >
                        {link.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Enhanced Tooltip for collapsed state */}
                {!isOpen && (
                  <div
                    className='absolute left-full ml-4 px-4 py-3 text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl border'
                    style={{
                      backgroundColor: "#353A3A",
                      color: "#C3BCC2",
                      borderColor: "#606364",
                      transform: "translateY(-50%)",
                      top: "50%",
                      minWidth: "200px",
                    }}
                  >
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-medium'>{link.name}</span>
                        {link.badge && (
                          <span
                            className='px-2 py-1 text-xs rounded-full font-medium'
                            style={{
                              backgroundColor: "#10B981",
                              color: "#DCFCE7",
                            }}
                          >
                            {link.badge}
                          </span>
                        )}
                      </div>
                      <span
                        className='text-xs opacity-60'
                        style={{ color: "#ABA4AA" }}
                      >
                        {link.description}
                      </span>
                    </div>
                    <div className='absolute right-full top-1/2 transform -translate-y-1/2'>
                      <div className='w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]'></div>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom section */}
        <div className='flex flex-col gap-4 mb-6 px-3'>
          {/* Bottom links */}
          <div
            className={`grid gap-2 ${
              isOpen ? "grid-cols-4" : "grid-cols-1 place-items-center"
            }`}
          >
            {bottomLinks.map((link) => {
              // Special handling for search
              if (link.name === "Search") {
                return (
                  <div
                    key={link.name}
                    className='relative'
                  >
                    <button
                      onClick={() => setShowClientSearch(true)}
                      className='text-xl transition-all duration-300 ease-in-out transform hover:scale-125 p-3 relative group flex items-center justify-center rounded-xl'
                      style={{ color: "#606364" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#4A5A70"
                        e.currentTarget.style.backgroundColor =
                          "rgba(74, 90, 112, 0.1)"
                        e.currentTarget.style.borderColor = "#4A5A70"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#606364"
                        e.currentTarget.style.backgroundColor = "transparent"
                        e.currentTarget.style.borderColor = "transparent"
                      }}
                      aria-label='Jump to client'
                      title='Jump to Client (⌘K)'
                    >
                      {link.icon}

                      {!isOpen && (
                        <div
                          className='absolute left-full ml-4 px-3 py-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg border'
                          style={{
                            backgroundColor: "#353A3A",
                            color: "#C3BCC2",
                            borderColor: "#606364",
                            transform: "translateY(-50%)",
                            top: "50%",
                          }}
                        >
                          Jump to Client
                          <div className='absolute right-full top-1/2 transform -translate-y-1/2'>
                            <div className='w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]'></div>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                )
              }

              // Special handling for notifications
              if (link.name === "Notifications") {
                return (
                  <div
                    key={link.name}
                    className='relative'
                  >
                    <button
                      onClick={handleNotificationClick}
                      className={`text-xl transition-all duration-300 ease-in-out transform hover:scale-125 p-3 relative group flex items-center justify-center rounded-xl ${
                        showNotifications ? "scale-110" : ""
                      }`}
                      style={{ color: "#606364" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#4A5A70"
                        e.currentTarget.style.backgroundColor =
                          "rgba(74, 90, 112, 0.1)"
                        e.currentTarget.style.borderColor = "#4A5A70"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#606364"
                        e.currentTarget.style.backgroundColor = "transparent"
                        e.currentTarget.style.borderColor = "transparent"
                      }}
                      aria-label='Toggle notifications'
                      title='Notifications'
                    >
                      <div className='relative'>
                        {link.icon}
                        {unreadNotificationCount > 0 && (
                          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]'>
                            {unreadNotificationCount > 9
                              ? "9+"
                              : unreadNotificationCount}
                          </span>
                        )}
                      </div>

                      {!isOpen && !showNotifications && (
                        <div
                          className='absolute left-full ml-4 px-3 py-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg border'
                          style={{
                            backgroundColor: "#353A3A",
                            color: "#C3BCC2",
                            borderColor: "#606364",
                            transform: "translateY(-50%)",
                            top: "50%",
                          }}
                        >
                          {link.name}
                          {unreadNotificationCount > 0 && (
                            <span className='ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5'>
                              {unreadNotificationCount}
                            </span>
                          )}
                          <div className='absolute right-full top-1/2 transform -translate-y-1/2'>
                            <div className='w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]'></div>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Notification Popup */}
                    <NotificationPopup
                      isOpen={showNotifications}
                      onClose={() => {
                        setIsAnimating(true)
                        setTimeout(() => {
                          setShowNotifications(false)
                          setIsAnimating(false)
                        }, 200)
                      }}
                    />
                  </div>
                )
              }

              // Regular links
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className='text-xl transition-all duration-300 ease-in-out transform hover:scale-125 p-3 relative group flex items-center justify-center rounded-xl'
                  style={{ color: "#606364" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#4A5A70"
                    e.currentTarget.style.backgroundColor =
                      "rgba(74, 90, 112, 0.1)"
                    e.currentTarget.style.borderColor = "#4A5A70"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#606364"
                    e.currentTarget.style.backgroundColor = "transparent"
                    e.currentTarget.style.borderColor = "transparent"
                  }}
                >
                  {link.icon}

                  {!isOpen && (
                    <div
                      className='absolute left-full ml-4 px-3 py-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg border'
                      style={{
                        backgroundColor: "#353A3A",
                        color: "#C3BCC2",
                        borderColor: "#606364",
                        transform: "translateY(-50%)",
                        top: "50%",
                      }}
                    >
                      {link.name}
                      <div className='absolute right-full top-1/2 transform -translate-y-1/2'>
                        <div className='w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]'></div>
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}

            {/* Messages Button with Popup */}
            <div
              className='relative'
              ref={messagePopupRef}
            >
              <button
                onClick={handleMessageClick}
                className={`text-xl transition-all duration-300 ease-in-out transform hover:scale-125 p-3 relative group flex items-center justify-center rounded-xl ${
                  showRecentMessages ? "scale-110" : ""
                }`}
                style={{ color: "#606364" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#4A5A70"
                  e.currentTarget.style.backgroundColor =
                    "rgba(74, 90, 112, 0.1)"
                  e.currentTarget.style.borderColor = "#4A5A70"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#606364"
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.borderColor = "transparent"
                }}
                aria-label='Toggle recent messages'
                title='Recent messages'
              >
                <div className='relative'>
                  <FiMessageSquare />
                  {unreadCount > 0 && (
                    <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]'>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>

                {!isOpen && !showRecentMessages && (
                  <div
                    className='absolute left-full ml-4 px-3 py-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg border'
                    style={{
                      backgroundColor: "#353A3A",
                      color: "#C3BCC2",
                      borderColor: "#606364",
                      transform: "translateY(-50%)",
                      top: "50%",
                    }}
                  >
                    Messages
                    {unreadCount > 0 && (
                      <span className='ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5'>
                        {unreadCount}
                      </span>
                    )}
                    <div className='absolute right-full top-1/2 transform -translate-y-1/2'>
                      <div className='w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]'></div>
                    </div>
                  </div>
                )}
              </button>

              {/* Recent Messages Popup with Animation */}
              {showRecentMessages && (
                <div
                  className={`absolute bottom-full mb-2 w-96 h-96 rounded-xl shadow-xl border ${
                    isOpen ? "left-0" : "left-12"
                  } ${
                    isAnimating && !showRecentMessages
                      ? "animate-[fadeOut_0.2s_ease-in-out_forwards]"
                      : isAnimating
                      ? "animate-[slideInUp_0.3s_ease-out_forwards]"
                      : "transform scale-100 opacity-100"
                  }`}
                  style={{
                    backgroundColor: "#353A3A",
                    borderColor: "#606364",
                    transformOrigin: "bottom center",
                    animation:
                      !isAnimating && showRecentMessages
                        ? "slideInUp 0.3s ease-out"
                        : undefined,
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  <div className='flex flex-col h-full'>
                    {/* Header */}
                    <div
                      className='flex items-center justify-between p-4 border-b'
                      style={{ borderColor: "#606364" }}
                    >
                      <div className='flex items-center gap-2'>
                        <MessageCircle
                          className='h-5 w-5'
                          style={{ color: "#C3BCC2" }}
                        />
                        <span
                          className='font-medium'
                          style={{ color: "#C3BCC2" }}
                        >
                          Recent Messages
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setIsAnimating(true)
                          setTimeout(() => {
                            setShowRecentMessages(false)
                            setIsAnimating(false)
                          }, 200)
                        }}
                        className='p-1 rounded-md transition-colors'
                        style={{ color: "#ABA4AA" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#606364"
                          e.currentTarget.style.color = "#C3BCC2"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent"
                          e.currentTarget.style.color = "#ABA4AA"
                        }}
                        aria-label='Close'
                      >
                        <FiX className='h-4 w-4' />
                      </button>
                    </div>

                    {/* Messages List */}
                    <div className='flex-1 overflow-y-auto'>
                      {conversations.length === 0 ? (
                        <div className='p-4 text-center'>
                          <MessageCircle
                            className='h-8 w-8 mx-auto mb-2 opacity-50'
                            style={{ color: "#ABA4AA" }}
                          />
                          <p
                            className='text-sm'
                            style={{ color: "#ABA4AA" }}
                          >
                            No messages yet
                          </p>
                        </div>
                      ) : (
                        conversations.map(
                          (conversation: any, index: number) => {
                            const otherUser =
                              conversation.coach.id !== currentUserId
                                ? conversation.coach
                                : conversation.client
                            const lastMessage = conversation.messages[0]
                            const unreadCount =
                              conversation._count?.messages || 0

                            return (
                              <Link
                                key={conversation.id}
                                href={`/messages/${conversation.id}`}
                                onClick={() => {
                                  setIsAnimating(true)
                                  setTimeout(() => {
                                    setShowRecentMessages(false)
                                    setIsAnimating(false)
                                  }, 200)
                                }}
                                className='flex items-center gap-3 p-3 border-b transition-all duration-200 hover:transform hover:translate-x-1'
                                style={{
                                  borderColor: "#606364",
                                  color: "#C3BCC2",
                                  animationDelay: `${index * 50}ms`,
                                  animation:
                                    showRecentMessages && !isAnimating
                                      ? `slideInLeft 0.3s ease-out ${
                                          index * 50
                                        }ms both`
                                      : undefined,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "#2A3133"
                                  e.currentTarget.style.boxShadow =
                                    "0 2px 8px rgba(0, 0, 0, 0.2)"
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent"
                                  e.currentTarget.style.boxShadow = "none"
                                }}
                              >
                                <div
                                  className='w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 transition-transform duration-200 hover:scale-110'
                                  style={{
                                    backgroundColor: "#4A5A70",
                                    color: "white",
                                  }}
                                >
                                  {(otherUser.name || otherUser.email)
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <div className='flex items-center justify-between'>
                                    <p
                                      className='text-sm font-medium truncate'
                                      style={{ color: "#C3BCC2" }}
                                    >
                                      {otherUser.name ||
                                        otherUser.email.split("@")[0]}
                                    </p>
                                    {lastMessage && (
                                      <span
                                        className='text-xs flex-shrink-0 ml-2'
                                        style={{ color: "#ABA4AA" }}
                                      >
                                        {formatTime(lastMessage.createdAt)}
                                      </span>
                                    )}
                                  </div>
                                  <div className='flex items-center justify-between'>
                                    {lastMessage && (
                                      <p
                                        className='text-xs truncate'
                                        style={{ color: "#ABA4AA" }}
                                      >
                                        {lastMessage.content}
                                      </p>
                                    )}
                                    {unreadCount > 0 && (
                                      <span className='bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center ml-2 animate-pulse'>
                                        {unreadCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            )
                          }
                        )
                      )}
                    </div>

                    {/* Footer */}
                    <div
                      className='p-3 border-t'
                      style={{ borderColor: "#606364" }}
                    >
                      <div className='flex gap-2'>
                        <Link
                          href='/messages/new'
                          onClick={() => {
                            setIsAnimating(true)
                            setTimeout(() => {
                              setShowRecentMessages(false)
                              setIsAnimating(false)
                            }, 200)
                          }}
                          className='flex-1 text-center py-2 px-3 text-sm rounded-md transition-all duration-200 hover:scale-105 hover:shadow-lg'
                          style={{
                            backgroundColor: "#4A5A70",
                            color: "#C3BCC2",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#606364"
                            e.currentTarget.style.boxShadow =
                              "0 4px 15px rgba(0, 0, 0, 0.2)"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#4A5A70"
                            e.currentTarget.style.boxShadow = "none"
                          }}
                        >
                          New message
                        </Link>
                        <Link
                          href='/messages'
                          onClick={() => {
                            setIsAnimating(true)
                            setTimeout(() => {
                              setShowRecentMessages(false)
                              setIsAnimating(false)
                            }, 200)
                          }}
                          className='flex-1 text-center py-2 px-3 text-sm rounded-md border transition-all duration-200 hover:scale-105 hover:shadow-lg'
                          style={{ borderColor: "#606364", color: "#C3BCC2" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#606364"
                            e.currentTarget.style.boxShadow =
                              "0 4px 15px rgba(0, 0, 0, 0.2)"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent"
                            e.currentTarget.style.boxShadow = "none"
                          }}
                        >
                          See all
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User section with dropdown */}
          <div
            className='relative'
            ref={dropdownRef}
          >
            <div className='flex items-center justify-center mt-4'>
              <button
                onClick={handleUserClick}
                disabled={isLoggingOut}
                className='rounded-full w-12 h-12 flex items-center justify-center font-bold text-white transition-all duration-300 hover:scale-110 relative group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
                style={{
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 6px 25px rgba(0, 0, 0, 0.5)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(0, 0, 0, 0.4)"
                }}
                aria-haspopup='menu'
                aria-expanded={userDropdownOpen}
              >
                {isLoggingOut ? (
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white' />
                ) : (
                  <ProfilePictureUploader
                    currentAvatarUrl={userSettings?.avatarUrl}
                    userName={user?.name || authData?.user?.name || "User"}
                    onAvatarChange={() => {}} // No-op for sidebar
                    size='sm'
                    readOnly={true}
                  />
                )}

                {/* User tooltip when collapsed and dropdown closed */}
                {!isOpen && !userDropdownOpen && !isLoggingOut && (
                  <div
                    className='absolute left-full ml-4 px-4 py-3 text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl border'
                    style={{
                      backgroundColor: "#353A3A",
                      color: "#C3BCC2",
                      borderColor: "#606364",
                      transform: "translateY(-50%)",
                      top: "50%",
                      minWidth: "200px",
                    }}
                  >
                    <div className='flex flex-col gap-1'>
                      <span className='font-medium'>
                        {user?.name || authData?.user?.name || "User"}
                      </span>
                      <span className='text-xs opacity-70'>
                        {user?.email || authData?.user?.email}
                      </span>
                    </div>
                    <div className='absolute right-full top-1/2 transform -translate-y-1/2'>
                      <div className='w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]'></div>
                    </div>
                  </div>
                )}
              </button>

              {/* User info when expanded */}
              {isOpen && (
                <div className='flex flex-col ml-3 transition-all duration-500 opacity-100 translate-x-0 delay-150'>
                  <span
                    className='font-medium text-sm whitespace-nowrap'
                    style={{ color: "#ABA4AA" }}
                  >
                    {user?.name || authData?.user?.name || "User"}
                  </span>
                  <span
                    className='text-xs opacity-70 whitespace-nowrap'
                    style={{ color: "#ABA4AA" }}
                  >
                    {user?.email || authData?.user?.email}
                  </span>
                </div>
              )}
            </div>

            {/* User Dropdown Menu */}
            {userDropdownOpen && !isLoggingOut && (
              <div
                className={`absolute bottom-full mb-2 w-64 rounded-xl shadow-xl border transition-all duration-300 ${
                  isOpen ? "left-0" : "left-16"
                }`}
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                }}
                role='menu'
              >
                <div className='p-4'>
                  <div
                    className='flex items-center gap-3 pb-3 border-b'
                    style={{ borderColor: "#606364" }}
                  >
                    <ProfilePictureUploader
                      currentAvatarUrl={userSettings?.avatarUrl}
                      userName={user?.name || authData?.user?.name || "User"}
                      onAvatarChange={() => {}} // No-op for dropdown
                      size='sm'
                      readOnly={true}
                    />
                    <div>
                      <p
                        className='font-medium'
                        style={{ color: "#C3BCC2" }}
                      >
                        {user?.name || authData?.user?.name || "User"}
                      </p>
                      <p
                        className='text-sm'
                        style={{ color: "#ABA4AA" }}
                      >
                        {user?.email || authData?.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className='mt-3 space-y-1'>
                    <button
                      onClick={handleSettingsClick}
                      className='w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105'
                      style={{ color: "#ABA4AA" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#606364"
                        e.currentTarget.style.color = "#C3BCC2"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                        e.currentTarget.style.color = "#ABA4AA"
                      }}
                      role='menuitem'
                    >
                      <Settings className='h-4 w-4' />
                      <span className='text-sm'>Settings</span>
                    </button>

                    <div
                      className='border-t pt-2 mt-2'
                      style={{ borderColor: "#606364" }}
                    >
                      <button
                        onClick={handleLogout}
                        className='w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105'
                        style={{ color: "#ABA4AA" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#606364"
                          e.currentTarget.style.color = "#EF4444"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent"
                          e.currentTarget.style.color = "#ABA4AA"
                        }}
                        role='menuitem'
                      >
                        <LogOut className='h-4 w-4' />
                        <span className='text-sm'>Log Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Edge Handle (Desktop only) */}
          <button
            onClick={toggleDesktopSidebar}
            className='hidden md:flex items-center justify-center absolute -right-3 top-24 h-10 w-6 rounded-full border transition-all duration-200 hover:scale-105'
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            title='Collapse/Expand (Ctrl/Cmd + B)'
            style={{
              backgroundColor: "#141718",
              color: "#C3BCC2",
              borderColor: "#606364",
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
              opacity: 0.85,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.opacity = "1"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.opacity = "0.85"
            }}
          >
            {isOpen ? (
              <FiChevronLeft size={16} />
            ) : (
              <FiChevronRight size={16} />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area with proper margins */}
      <div
        className={`flex-1 p-8 transition-all duration-500 ease-in-out ${
          isOpen ? "ml-20 md:ml-64" : "ml-20"
        }`}
      >
        {children}
      </div>

      {/* Client Search Modal */}
      <ClientSearchModal
        isOpen={showClientSearch}
        onClose={() => setShowClientSearch(false)}
      />

      {/* Add custom keyframes for animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  )
}
