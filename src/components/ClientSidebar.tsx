"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { trpc } from "@/app/_trpc/client";
import { useState, useRef, useEffect } from "react";
import { useMobileDetection } from "@/lib/mobile-detection";
import {
  FiSettings,
  FiBell,
  FiMessageSquare,
  FiSearch,
  FiBookOpen,
  FiClipboard,
  FiCalendar,
  FiHome,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiTarget,
  FiTrendingUp,
  FiPlay,
  FiUpload,
  FiUser,
} from "react-icons/fi";
import {
  LogOut,
  Settings,
  MessageCircle,
  User,
  Target,
  TrendingUp,
  PlayCircle,
  Upload,
  Calendar,
  Send,
  ArrowLeft,
} from "lucide-react";
import MessagePopup from "./MessagePopup";
import NotificationPopup from "./NotificationPopup";
import ProfilePictureUploader from "./ProfilePictureUploader";
import { COLORS } from "@/lib/colors";
import FormattedMessage from "./FormattedMessage";

const navLinks = [
  {
    name: "Dashboard",
    icon: <FiHome />,
    href: "/client-dashboard",
    description: "Program & progress",
    badge: null,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Schedule",
    icon: <Calendar />,
    href: "/client-schedule",
    description: "Training calendar",
    badge: null,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    name: "Messages",
    icon: <MessageCircle />,
    href: "/client-messages",
    description: "Coach communication",
    badge: null,
    gradient: "from-orange-500 to-red-500",
  },
];

const bottomLinks = [
  { name: "Settings", icon: <FiSettings />, href: "/client-settings" },
  { name: "Notifications", icon: <FiBell />, href: "/notifications" },
  { name: "Search", icon: <FiSearch />, href: "/search" },
];

interface ClientSidebarProps {
  user?: { name?: string; email?: string };
  children: React.ReactNode;
}

export default function ClientSidebar({ user, children }: ClientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { isMobile } = useMobileDetection();
  const { data: authData } = trpc.authCallback.useQuery();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [rippleActive, setRippleActive] = useState(false);
  const [mobileLogoutConfirm, setMobileLogoutConfirm] = useState(false);
  const [showRecentMessages, setShowRecentMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagePopupRef = useRef<HTMLDivElement>(null);

  // Use the optimized unread counts endpoint
  const { data: unreadCountsObj = {} } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      refetchInterval: 60000, // Poll every 60 seconds (reduced from 10 seconds)
      refetchOnWindowFocus: false, // Disabled to reduce unnecessary calls
      refetchOnReconnect: true,
    });

  // Calculate total unread count from the object
  const unreadCount = Object.values(unreadCountsObj).reduce(
    (sum, count) => sum + count,
    0
  );

  const { data: conversationsData, refetch: refetchConversations } =
    trpc.messaging.getConversations.useQuery(undefined, {
      enabled: showRecentMessages,
      refetchInterval: 60000, // Poll every minute
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 0, // Don't cache - always get fresh data
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    });

  const conversations = conversationsData?.conversations || [];

  const { data: unreadNotificationCount = 0 } =
    trpc.notifications.getUnreadCount.useQuery(undefined, {
      refetchInterval: 60000, // Poll every 60 seconds (reduced from 10 seconds)
      refetchOnWindowFocus: false, // Disabled to reduce unnecessary calls
      refetchOnReconnect: true,
    });

  // Get user settings for avatar
  const { data: userSettings } = trpc.settings.getSettings.useQuery();

  const userInitials =
    user?.name || authData?.user?.name
      ? ((user?.name ?? authData?.user?.name) || "")
          .split(" ")
          .map(n => n[0])
          .join("")
          .toUpperCase()
      : (user?.email || authData?.user?.email)?.[0]?.toUpperCase() || "U";

  // Keyboard shortcut for sidebar toggle (Cmd/Ctrl + B)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleDesktopSidebar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Persist sidebar open/closed state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nls_sidebar_open");
      if (saved !== null) setIsOpen(saved === "1");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("nls_sidebar_open", isOpen ? "1" : "0");
      // Dispatch custom event for same-tab listeners
      window.dispatchEvent(new CustomEvent("sidebarToggle"));
    } catch {}
  }, [isOpen]);

  // Get messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } =
    trpc.messaging.getMessages.useQuery(
      { conversationId: selectedConversationId! },
      {
        enabled: !!selectedConversationId && showRecentMessages,
        refetchInterval: 3000, // Poll every 3 seconds when in conversation
      }
    );

  // Send message mutation
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation();
  const utils = trpc.useUtils();

  // Handle sending message
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim() || !selectedConversationId || isSending) return;

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversationId,
        content: messageText.trim(),
      });
      setMessageText("");
      refetchMessages();
      // Invalidate and refetch conversations to update the last message
      await utils.messaging.getConversations.invalidate();
      refetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Auto-scroll to bottom when messages change
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesEndRef.current && selectedConversationId) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversationId]);

  // Refresh conversation list when exiting conversation view
  useEffect(() => {
    if (!selectedConversationId && showRecentMessages) {
      utils.messaging.getConversations.invalidate();
      refetchConversations();
    }
  }, [selectedConversationId, showRecentMessages, utils, refetchConversations]);

  const isActiveLink = (href: string) => pathname === href;

  const toggleDesktopSidebar = () => setIsOpen(o => !o);
  const toggleMobileSidebar = () => setIsMobileOpen(o => !o);

  const handleUserClick = () => {
    // Trigger ripple effect
    setRippleActive(true);
    setTimeout(() => setRippleActive(false), 300);

    if (userDropdownOpen) {
      // If already showing logout, perform logout
      handleLogout();
    } else {
      // Show logout button
      setUserDropdownOpen(true);
      // Auto-reset after 2 seconds if not clicked
      setTimeout(() => {
        setUserDropdownOpen(false);
      }, 2000);
    }
  };

  const handleMobileLogoutClick = () => {
    if (mobileLogoutConfirm) {
      // Second click - actually logout
      handleLogout();
    } else {
      // First click - show confirmation
      setMobileLogoutConfirm(true);
      // Auto-reset after 3 seconds if not clicked again
      setTimeout(() => {
        setMobileLogoutConfirm(false);
      }, 3000);
    }
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // On mobile, navigate directly to client messages page
    if (isMobile) {
      router.push("/client-messages");
      return;
    }

    if (showRecentMessages) {
      // Closing animation
      setIsAnimating(true);
      setTimeout(() => {
        setShowRecentMessages(false);
        setIsAnimating(false);
      }, 200);
    } else {
      // Opening animation
      setShowRecentMessages(true);
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleNotificationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // On mobile, navigate directly to notifications page
    if (isMobile) {
      router.push("/notifications");
      return;
    }

    // On desktop, show popup
    if (showNotifications) {
      // Closing animation
      setIsAnimating(true);
      setTimeout(() => {
        setShowNotifications(false);
        setIsAnimating(false);
      }, 200);
    } else {
      // Opening animation
      setShowNotifications(true);
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setUserDropdownOpen(false);

    try {
      // Use Kinde's proper logout URL
      window.location.href = "/api/auth/logout";
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours =
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        messagePopupRef.current &&
        !messagePopupRef.current.contains(event.target as Node)
      ) {
        if (showRecentMessages) {
          setIsAnimating(true);
          setTimeout(() => {
            setShowRecentMessages(false);
            setIsAnimating(false);
          }, 200);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRecentMessages]);

  const currentUserId = authData?.user?.id;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile hamburger button - improved positioning and design */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 left-4 z-50 md:hidden p-3 rounded-xl transition-all duration-300 hover:scale-110 shadow-xl bg-gradient-to-br from-[#4A5A70] to-[#353A3A] text-white border border-[#606364] backdrop-blur-sm"
        aria-label={isMobileOpen ? "Close sidebar" : "Open sidebar"}
        style={{
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="relative">
          {isMobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          {/* Pulse animation for unread notifications */}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </button>

      {/* Mobile logout button - only visible when sidebar is open */}
      {isMobileOpen && (
        <button
          onClick={handleMobileLogoutClick}
          disabled={isLoggingOut}
          className={`fixed top-4 right-4 z-50 md:hidden p-3 rounded-xl transition-all duration-300 hover:scale-110 shadow-xl text-white border backdrop-blur-sm ${
            mobileLogoutConfirm
              ? "bg-gradient-to-br from-green-600 to-green-700 border-green-500"
              : "bg-gradient-to-br from-red-600 to-red-700 border-red-500"
          }`}
          aria-label={mobileLogoutConfirm ? "Confirm logout" : "Logout"}
          style={{
            boxShadow: mobileLogoutConfirm
              ? "0 8px 32px rgba(34, 197, 94, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)"
              : "0 8px 32px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            animation: "slideInRight 0.3s ease-out",
          }}
        >
          {isLoggingOut ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : mobileLogoutConfirm ? (
            <div className="relative">
              <svg
                className="w-5 h-5 text-white transition-all duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  animation: "checkmark 0.5s ease-out",
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ) : (
            <LogOut size={20} />
          )}
        </button>
      )}

      {/* Mobile overlay - improved with better blur and animation */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden transition-all duration-300 backdrop-blur-md"
          onClick={() => setIsMobileOpen(false)}
          onKeyDown={e => {
            if (e.key === "Escape") {
              setIsMobileOpen(false);
            }
          }}
          tabIndex={-1}
          role="button"
          aria-label="Close mobile menu"
          style={{
            animation: "fadeIn 0.3s ease-out",
          }}
        />
      )}

      {/* Sidebar - improved mobile animations */}
      <aside
        className={`flex flex-col justify-between h-screen fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out backdrop-blur-sm bg-sidebar text-sidebar-foreground shadow-2xl ${
          isOpen ? "md:w-64" : "md:w-20"
        } ${
          isMobileOpen
            ? "w-80 translate-x-0 opacity-100"
            : "w-80 -translate-x-full opacity-0 md:opacity-100"
        } md:translate-x-0 md:z-20`}
        style={{
          background: "linear-gradient(180deg, #1A1D1E 0%, #0F1112 100%)",
          boxShadow: isMobileOpen
            ? "0 0 0 1px rgba(255, 255, 255, 0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            : "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-center h-24 px-4 font-bold text-xl transition-all duration-300 overflow-hidden relative">
            {/* Background gradient effect */}
            <div
              className="absolute inset-0 opacity-10"
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
              <div className="flex items-center gap-2">
                {/* Logo is a secondary toggle via double-click */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer group"
                  onDoubleClick={toggleDesktopSidebar}
                  title="Double-click to collapse/expand"
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <Image
                    src="/logo image.png"
                    alt="Next Level Softball"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover group-active:scale-95 transition-transform"
                    priority
                  />
                </div>
                My Training Hub
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
                className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
                onDoubleClick={toggleDesktopSidebar}
                title="Double-click to expand"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Image
                  src="/logo image.png"
                  alt="Next Level Softball"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  priority
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
                  setIsMobileOpen(false);
                  startTransition(() => {
                    // This will show loading state during navigation
                  });
                }}
                className={`transition-all duration-300 ease-in-out transform hover:scale-105 group relative ${
                  isOpen
                    ? "flex items-center gap-3 px-4 py-4 hover:shadow-lg overflow-hidden rounded-xl md:py-3"
                    : "flex items-center justify-center p-4 text-xl rounded-xl md:p-3"
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
                onMouseEnter={e => {
                  setHoveredLink(link.name);
                  if (!isActiveLink(link.href)) {
                    e.currentTarget.style.backgroundColor = isOpen
                      ? "#353A3A"
                      : "rgba(74, 90, 112, 0.1)";
                    e.currentTarget.style.color = "#C3BCC2";
                    e.currentTarget.style.borderColor = "#4A5A70";
                    if (isOpen) {
                      e.currentTarget.style.boxShadow =
                        "0 4px 20px rgba(0, 0, 0, 0.3)";
                    }
                  }
                }}
                onMouseLeave={e => {
                  setHoveredLink(null);
                  if (!isActiveLink(link.href)) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#606364";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.boxShadow = "none";
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
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium transition-all duration-500 whitespace-nowrap opacity-100 translate-x-0 delay-150">
                        {link.name}
                      </span>
                      <span
                        className="text-xs transition-all duration-500 opacity-60"
                        style={{ color: "#ABA4AA" }}
                      >
                        {link.description}
                      </span>
                    </div>
                    {link.badge && (
                      <span
                        className="px-2 py-1 text-xs rounded-full font-medium transition-all duration-300"
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
                    className="absolute left-full ml-4 px-4 py-3 text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl border"
                    style={{
                      backgroundColor: "#353A3A",
                      color: "#C3BCC2",
                      borderColor: "#606364",
                      transform: "translateY(-50%)",
                      top: "50%",
                      minWidth: "200px",
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{link.name}</span>
                      </div>
                    </div>
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                      <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]" />
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col gap-4 mb-6 px-3">
          {/* Bottom links */}
          <div
            className={`grid gap-2 ${
              isOpen ? "grid-cols-4" : "grid-cols-1 place-items-center"
            }`}
          >
            {bottomLinks.map(link => {
              // Special handling for notifications
              if (link.name === "Notifications") {
                return (
                  <div key={link.name} className="relative">
                    <button
                      onClick={handleNotificationClick}
                      className={`text-xl transition-all duration-300 ease-in-out transform hover:scale-125 p-3 relative group flex items-center justify-center rounded-xl ${
                        showNotifications ? "scale-110" : ""
                      }`}
                      style={{ color: "#606364" }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = "#4A5A70";
                        e.currentTarget.style.backgroundColor =
                          "rgba(74, 90, 112, 0.1)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = "#606364";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      aria-label="Toggle notifications"
                      title="Notifications"
                    >
                      <div className="relative">
                        {link.icon}
                        {unreadNotificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                            {unreadNotificationCount > 9
                              ? "9+"
                              : unreadNotificationCount}
                          </span>
                        )}
                      </div>

                      {!isOpen && !showNotifications && (
                        <div
                          className="absolute left-full ml-4 px-3 py-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg border"
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
                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                              {unreadNotificationCount}
                            </span>
                          )}
                          <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                            <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]" />
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Notification Popup */}
                    <NotificationPopup
                      isOpen={showNotifications}
                      onClose={() => {
                        setIsAnimating(true);
                        setTimeout(() => {
                          setShowNotifications(false);
                          setIsAnimating(false);
                        }, 200);
                      }}
                    />
                  </div>
                );
              }

              // Regular links
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-xl transition-all duration-300 ease-in-out transform hover:scale-125 p-3 relative group flex items-center justify-center rounded-xl"
                  style={{ color: "#606364" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = "#4A5A70";
                    e.currentTarget.style.backgroundColor =
                      "rgba(74, 90, 112, 0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = "#606364";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {link.icon}

                  {!isOpen && (
                    <div
                      className="absolute left-full ml-4 px-3 py-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg border"
                      style={{
                        backgroundColor: "#353A3A",
                        color: "#C3BCC2",
                        borderColor: "#606364",
                        transform: "translateY(-50%)",
                        top: "50%",
                      }}
                    >
                      {link.name}
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                        <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]" />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}

            {/* Messages Button with Popup */}
            <div className="relative" ref={messagePopupRef}>
              <button
                onClick={handleMessageClick}
                className={`text-xl transition-all duration-300 ease-in-out transform hover:scale-125 p-3 relative group flex items-center justify-center rounded-xl ${
                  showRecentMessages ? "scale-110" : ""
                }`}
                style={{ color: "#606364" }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#4A5A70";
                  e.currentTarget.style.backgroundColor =
                    "rgba(74, 90, 112, 0.1)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "#606364";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div className="relative">
                  <FiMessageSquare />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>

                {!isOpen && !showRecentMessages && (
                  <div
                    className="absolute left-full ml-4 px-3 py-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg border"
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
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                      <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]" />
                    </div>
                  </div>
                )}
              </button>

              {/* Recent Messages Popup with Animation */}
              {showRecentMessages && (
                <div
                  className={`absolute bottom-full mb-2 w-96 h-[500px] max-h-[80vh] rounded-xl shadow-2xl border backdrop-blur-sm ${
                    isOpen ? "left-0" : "left-12"
                  } ${
                    isAnimating && !showRecentMessages
                      ? "animate-[fadeOut_0.2s_ease-in-out_forwards]"
                      : isAnimating
                      ? "animate-[slideInUp_0.3s_ease-out_forwards]"
                      : "transform scale-100 opacity-100"
                  }`}
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                    transformOrigin: "bottom center",
                    animation:
                      !isAnimating && showRecentMessages
                        ? "slideInUp 0.3s ease-out"
                        : undefined,
                    boxShadow:
                      "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(229, 178, 50, 0.1)",
                  }}
                >
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 border-b"
                      style={{
                        borderColor: COLORS.BORDER_SUBTLE,
                        backgroundColor: COLORS.BACKGROUND_CARD,
                      }}
                    >
                      <div className="flex flex-col">
                        <span
                          className="text-sm font-semibold leading-tight"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          Recent Messages
                        </span>
                        <span
                          className="text-[10px] leading-tight"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          {conversations.length} conversation
                          {conversations.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setIsAnimating(true);
                          setTimeout(() => {
                            setShowRecentMessages(false);
                            setIsAnimating(false);
                          }, 200);
                        }}
                        className="p-1.5 rounded-lg transition-all duration-200"
                        style={{
                          color: COLORS.TEXT_SECONDARY,
                          backgroundColor: "transparent",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.BACKGROUND_CARD_HOVER;
                          e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                        }}
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Content Area */}
                    <div
                      className="flex-1 overflow-y-auto"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        scrollbarWidth: "thin",
                        scrollbarColor: `${COLORS.BORDER_SUBTLE} transparent`,
                      }}
                    >
                      {selectedConversationId ? (
                        // Conversation View
                        <div className="flex flex-col h-full">
                          {/* Messages */}
                          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                            {messages.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full py-8">
                                <p
                                  className="text-sm"
                                  style={{ color: COLORS.TEXT_MUTED }}
                                >
                                  No messages yet. Start the conversation!
                                </p>
                              </div>
                            ) : (
                              messages.map((message: any) => {
                                const isCurrentUser =
                                  message.senderId === currentUserId;
                                return (
                                  <div
                                    key={message.id}
                                    className={`flex ${
                                      isCurrentUser
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                                  >
                                    <div
                                      className={`max-w-[75%] px-3 py-2 rounded-xl ${
                                        isCurrentUser
                                          ? "rounded-br-md"
                                          : "rounded-bl-md"
                                      }`}
                                      style={{
                                        backgroundColor: isCurrentUser
                                          ? COLORS.GOLDEN_ACCENT
                                          : COLORS.BACKGROUND_CARD,
                                        color: isCurrentUser
                                          ? COLORS.BACKGROUND_DARK
                                          : COLORS.TEXT_PRIMARY,
                                        border: `1px solid ${
                                          isCurrentUser
                                            ? "rgba(229, 178, 50, 0.3)"
                                            : COLORS.BORDER_SUBTLE
                                        }`,
                                        boxShadow: isCurrentUser
                                          ? `0 2px 8px rgba(229, 178, 50, 0.2)`
                                          : "0 1px 3px rgba(0, 0, 0, 0.2)",
                                      }}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 text-xs leading-relaxed break-words">
                                          <FormattedMessage
                                            content={message.content}
                                          />
                                        </div>
                                        <span
                                          className="text-[10px] flex-shrink-0 opacity-70 mt-0.5"
                                          style={{
                                            color: isCurrentUser
                                              ? COLORS.BACKGROUND_DARK
                                              : COLORS.TEXT_MUTED,
                                          }}
                                        >
                                          {formatTime(message.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                            <div ref={messagesEndRef} />
                          </div>

                          {/* Message Input */}
                          <div
                            className="px-4 py-3 border-t"
                            style={{
                              borderColor: COLORS.BORDER_SUBTLE,
                              backgroundColor: COLORS.BACKGROUND_CARD,
                            }}
                          >
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={messageText}
                                onChange={e => setMessageText(e.target.value)}
                                onKeyPress={e => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                  }
                                }}
                                placeholder="Type a message..."
                                className="flex-1 px-3 py-2 rounded-lg border text-sm transition-all duration-200 focus:outline-none"
                                style={{
                                  backgroundColor: COLORS.BACKGROUND_DARK,
                                  borderColor: COLORS.BORDER_SUBTLE,
                                  color: COLORS.TEXT_PRIMARY,
                                }}
                                onFocus={e => {
                                  e.currentTarget.style.borderColor =
                                    "rgba(229, 178, 50, 0.4)";
                                  e.currentTarget.style.boxShadow = `0 0 0 2px rgba(229, 178, 50, 0.1)`;
                                }}
                                onBlur={e => {
                                  e.currentTarget.style.borderColor =
                                    COLORS.BORDER_SUBTLE;
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                                disabled={isSending}
                              />
                              <button
                                onClick={handleSendMessage}
                                disabled={!messageText.trim() || isSending}
                                className="px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[44px]"
                                style={{
                                  backgroundColor:
                                    messageText.trim() && !isSending
                                      ? COLORS.GOLDEN_ACCENT
                                      : COLORS.BACKGROUND_CARD,
                                  color:
                                    messageText.trim() && !isSending
                                      ? COLORS.BACKGROUND_DARK
                                      : COLORS.TEXT_MUTED,
                                  border: `1px solid ${
                                    messageText.trim() && !isSending
                                      ? "rgba(229, 178, 50, 0.3)"
                                      : COLORS.BORDER_SUBTLE
                                  }`,
                                }}
                                onMouseEnter={e => {
                                  if (
                                    !e.currentTarget.disabled &&
                                    messageText.trim()
                                  ) {
                                    e.currentTarget.style.backgroundColor =
                                      COLORS.GOLDEN_HOVER;
                                    e.currentTarget.style.transform =
                                      "scale(1.05)";
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!e.currentTarget.disabled) {
                                    e.currentTarget.style.backgroundColor =
                                      messageText.trim()
                                        ? COLORS.GOLDEN_ACCENT
                                        : COLORS.BACKGROUND_CARD;
                                    e.currentTarget.style.transform =
                                      "scale(1)";
                                  }
                                }}
                              >
                                {isSending ? (
                                  <div
                                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                                    style={{
                                      borderColor: COLORS.BACKGROUND_DARK,
                                    }}
                                  />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Conversations List
                        <>
                          {conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-8">
                              <div
                                className="p-3 rounded-full mb-3"
                                style={{
                                  backgroundColor: "rgba(229, 178, 50, 0.1)",
                                  border: "1px solid rgba(229, 178, 50, 0.2)",
                                }}
                              >
                                <MessageCircle
                                  className="h-6 w-6"
                                  style={{ color: COLORS.GOLDEN_ACCENT }}
                                />
                              </div>
                              <p
                                className="text-sm font-medium"
                                style={{ color: COLORS.TEXT_SECONDARY }}
                              >
                                No messages yet
                              </p>
                              <p
                                className="text-xs mt-1"
                                style={{ color: COLORS.TEXT_MUTED }}
                              >
                                Start a conversation to get started
                              </p>
                            </div>
                          ) : (
                            conversations.map(
                              (conversation: any, index: number) => {
                                // Determine the other user based on conversation type
                                let otherUser;
                                if (conversation.type === "COACH_CLIENT") {
                                  // Coach-client conversation
                                  otherUser =
                                    conversation.coach?.id !== currentUserId
                                      ? conversation.coach
                                      : conversation.client;
                                } else if (
                                  conversation.type === "CLIENT_CLIENT"
                                ) {
                                  // Client-client conversation
                                  otherUser =
                                    conversation.client1?.id !== currentUserId
                                      ? conversation.client1
                                      : conversation.client2;
                                } else {
                                  // Fallback to old logic
                                  otherUser =
                                    conversation.coach?.id !== currentUserId
                                      ? conversation.coach
                                      : conversation.client;
                                }
                                const lastMessage = conversation.messages[0];
                                const unreadCount =
                                  conversation._count?.messages || 0;

                                const hasUnread = unreadCount > 0;
                                return (
                                  <button
                                    key={conversation.id}
                                    onClick={e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedConversationId(
                                        conversation.id
                                      );
                                    }}
                                    type="button"
                                    className="flex items-center gap-3 px-4 py-3 border-b transition-all duration-200 relative animate-[messageSlideIn_0.3s_ease-out] w-full text-left"
                                    style={{
                                      borderColor: COLORS.BORDER_SUBTLE,
                                      backgroundColor: hasUnread
                                        ? "rgba(217, 83, 79, 0.1)"
                                        : "transparent",
                                      borderLeft: hasUnread
                                        ? `4px solid ${COLORS.RED_ALERT}`
                                        : "none",
                                      animationDelay: `${index * 30}ms`,
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.backgroundColor =
                                        COLORS.BACKGROUND_CARD;
                                      e.currentTarget.style.transform =
                                        "translateX(2px)";
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.backgroundColor =
                                        hasUnread
                                          ? "rgba(217, 83, 79, 0.1)"
                                          : "transparent";
                                      e.currentTarget.style.transform =
                                        "translateX(0)";
                                    }}
                                  >
                                    <div
                                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-transform duration-200"
                                      style={{
                                        backgroundColor:
                                          "rgba(229, 178, 50, 0.2)",
                                        color: COLORS.GOLDEN_ACCENT,
                                        border:
                                          "1px solid rgba(229, 178, 50, 0.3)",
                                      }}
                                    >
                                      {conversation.type === "CLIENT_CLIENT"
                                        ? "C"
                                        : (otherUser?.name || otherUser?.email)
                                            ?.charAt(0)
                                            ?.toUpperCase() || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <p
                                          className="text-sm font-semibold truncate"
                                          style={{ color: COLORS.TEXT_PRIMARY }}
                                        >
                                          {conversation.type === "CLIENT_CLIENT"
                                            ? "Another Client"
                                            : otherUser?.name ||
                                              otherUser?.email?.split("@")[0] ||
                                              "Unknown"}
                                        </p>
                                        {lastMessage && (
                                          <span
                                            className="text-[10px] flex-shrink-0"
                                            style={{ color: COLORS.TEXT_MUTED }}
                                          >
                                            {formatTime(lastMessage.createdAt)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between gap-2">
                                        {lastMessage && (
                                          <p
                                            className="text-xs truncate flex-1"
                                            style={{
                                              color: COLORS.TEXT_SECONDARY,
                                            }}
                                          >
                                            {lastMessage.content}
                                          </p>
                                        )}
                                        {hasUnread && (
                                          <span
                                            className="text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center font-semibold flex-shrink-0"
                                            style={{
                                              backgroundColor: COLORS.RED_ALERT,
                                              color: "white",
                                            }}
                                          >
                                            {unreadCount > 9
                                              ? "9+"
                                              : unreadCount}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              }
                            )
                          )}
                        </>
                      )}
                    </div>

                    {/* Footer - Only show when not in conversation */}
                    {!selectedConversationId && (
                      <div
                        className="px-4 py-3 border-t flex gap-2"
                        style={{
                          borderColor: COLORS.BORDER_SUBTLE,
                          backgroundColor: COLORS.BACKGROUND_CARD,
                        }}
                      >
                        <Link
                          href="/client-messages?new=true"
                          onClick={() => {
                            setIsAnimating(true);
                            setTimeout(() => {
                              setShowRecentMessages(false);
                              setIsAnimating(false);
                            }, 200);
                          }}
                          className="flex-1 text-center py-2.5 px-4 rounded-lg transition-all duration-200 text-sm font-medium"
                          style={{
                            backgroundColor: COLORS.GOLDEN_ACCENT,
                            color: COLORS.BACKGROUND_DARK,
                            border: `1px solid rgba(229, 178, 50, 0.3)`,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor =
                              COLORS.GOLDEN_HOVER;
                            e.currentTarget.style.transform = "scale(1.02)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                              COLORS.GOLDEN_ACCENT;
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          New message
                        </Link>
                        <Link
                          href="/client-messages"
                          onClick={() => {
                            setIsAnimating(true);
                            setTimeout(() => {
                              setShowRecentMessages(false);
                              setIsAnimating(false);
                            }, 200);
                          }}
                          className="flex-1 text-center py-2.5 px-4 rounded-lg transition-all duration-200 text-sm font-medium"
                          style={{
                            backgroundColor: "transparent",
                            color: COLORS.TEXT_SECONDARY,
                            border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor =
                              COLORS.BACKGROUND_CARD_HOVER;
                            e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                            e.currentTarget.style.borderColor =
                              "rgba(229, 178, 50, 0.3)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                            e.currentTarget.style.borderColor =
                              COLORS.BORDER_SUBTLE;
                          }}
                        >
                          See all
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User section with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-center mt-4">
              <button
                onClick={handleUserClick}
                disabled={isLoggingOut}
                className={`rounded-full w-12 h-12 md:w-10 md:h-10 flex items-center justify-center font-bold text-white transition-all duration-300 ease-out hover:scale-105 relative group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md touch-manipulation ${
                  userDropdownOpen ? "ring-1 ring-red-400/30 animate-pulse" : ""
                }`}
                style={{
                  boxShadow: userDropdownOpen
                    ? "0 2px 8px rgba(239, 68, 68, 0.2)"
                    : "0 2px 8px rgba(0, 0, 0, 0.2)",
                  minWidth: "48px",
                  minHeight: "48px",
                  backgroundColor: userDropdownOpen
                    ? "rgba(239, 68, 68, 0.9)"
                    : "transparent",
                  backdropFilter: userDropdownOpen ? "blur(8px)" : "none",
                }}
                onMouseEnter={e => {
                  if (!userDropdownOpen) {
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 0, 0, 0.3)";
                  } else {
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(239, 68, 68, 0.3)";
                  }
                }}
                onMouseLeave={e => {
                  if (!userDropdownOpen) {
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0, 0, 0, 0.2)";
                  } else {
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(239, 68, 68, 0.2)";
                  }
                }}
                onTouchStart={e => {
                  e.currentTarget.style.transform = "scale(0.98)";
                }}
                onTouchEnd={e => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                aria-label={userDropdownOpen ? "Logout" : "User profile"}
              >
                {isLoggingOut ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Profile Picture - rotates out and scales down */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                        userDropdownOpen
                          ? "rotate-180 scale-0 opacity-0"
                          : "rotate-0 scale-100 opacity-100"
                      }`}
                    >
                      <ProfilePictureUploader
                        currentAvatarUrl={userSettings?.avatarUrl}
                        userName={user?.name || authData?.user?.name || "User"}
                        onAvatarChange={() => {}} // No-op for sidebar
                        size="sm"
                        readOnly={true}
                      />
                    </div>

                    {/* Logout Icon - scales up from center */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                        userDropdownOpen
                          ? "scale-100 opacity-100 rotate-0"
                          : "scale-0 opacity-0 rotate-180"
                      }`}
                    >
                      <LogOut className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Ripple Effect */}
                {rippleActive && (
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                )}

                {/* User tooltip when collapsed and dropdown closed */}
                {!isOpen && !userDropdownOpen && !isLoggingOut && (
                  <div
                    className="absolute left-full ml-4 px-4 py-3 text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl border"
                    style={{
                      backgroundColor: "#353A3A",
                      color: "#C3BCC2",
                      borderColor: "#606364",
                      transform: "translateY(-50%)",
                      top: "50%",
                      minWidth: "200px",
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {user?.name || authData?.user?.name || "User"}
                      </span>
                      <span className="text-xs opacity-70">
                        {user?.email || authData?.user?.email}
                      </span>
                    </div>
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                      <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]" />
                    </div>
                  </div>
                )}
              </button>

              {/* User info when expanded */}
              {isOpen && (
                <div className="flex flex-col ml-3 transition-all duration-500 opacity-100 translate-x-0 delay-150">
                  <span
                    className="font-medium text-sm whitespace-nowrap"
                    style={{ color: "#ABA4AA" }}
                  >
                    {user?.name || authData?.user?.name || "User"}
                  </span>
                  <span
                    className="text-xs opacity-70 whitespace-nowrap"
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
                role="menu"
              >
                <div className="p-4">
                  <div
                    className="flex items-center gap-3 pb-3 border-b"
                    style={{ borderColor: "#606364" }}
                  >
                    <ProfilePictureUploader
                      currentAvatarUrl={userSettings?.avatarUrl}
                      userName={user?.name || authData?.user?.name || "User"}
                      onAvatarChange={() => {}} // No-op for dropdown
                      size="sm"
                      readOnly={true}
                    />
                    <div>
                      <p className="font-medium" style={{ color: "#C3BCC2" }}>
                        {user?.name || authData?.user?.name || "User"}
                      </p>
                      <p className="text-sm" style={{ color: "#ABA4AA" }}>
                        {user?.email || authData?.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg transition-all duration-200 hover:scale-105 touch-manipulation"
                      style={{
                        color: "#ABA4AA",
                        minHeight: "44px", // Ensure minimum touch target
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "#606364";
                        e.currentTarget.style.color = "#EF4444";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#ABA4AA";
                      }}
                      onTouchStart={e => {
                        e.currentTarget.style.backgroundColor = "#606364";
                        e.currentTarget.style.color = "#EF4444";
                      }}
                      onTouchEnd={e => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#ABA4AA";
                      }}
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm">Log Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Edge Handle (Desktop only) */}
          <button
            onClick={toggleDesktopSidebar}
            className="hidden md:flex items-center justify-center absolute -right-3 top-24 h-10 w-6 rounded-full border transition-all duration-200 hover:scale-105"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            title="Collapse/Expand (Ctrl/Cmd + B)"
            style={{
              backgroundColor: "#141718",
              color: "#C3BCC2",
              borderColor: "#606364",
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
              opacity: 0.85,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
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

      {/* Main Content Area - improved mobile responsiveness */}
      <div
        className={`flex-1 transition-all duration-500 ease-in-out ${
          isOpen ? "ml-0 md:ml-20 lg:ml-64" : "ml-0 md:ml-20"
        }`}
        style={{
          padding: "1rem",
          paddingTop: "5rem", // Space for mobile hamburger button
        }}
      >
        <div className="max-w-full mx-auto pb-20">{children}</div>
      </div>

      {/* Add custom keyframes for animations - improved mobile animations */}
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
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOutToLeft {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-100%);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes checkmark {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Mobile-specific improvements */
        @media (max-width: 768px) {
          .mobile-sidebar-enter {
            animation: slideInFromLeft 0.3s ease-out;
          }
          .mobile-sidebar-exit {
            animation: slideOutToLeft 0.3s ease-in;
          }
        }
      `}</style>
    </div>
  );
}
