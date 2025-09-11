"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
// Removed complex SSE hooks - using simple polling instead
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
} from "lucide-react";
import MessagePopup from "./MessagePopup";
import NotificationPopup from "./NotificationPopup";
import ProfilePictureUploader from "./ProfilePictureUploader";

const navLinks = [
  {
    name: "Dashboard",
    icon: <FiHome />,
    href: "/client-dashboard",
    description: "Overview & progress",
    badge: null,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Program",
    icon: <FiClipboard />,
    href: "/client-program",
    description: "Training program",
    badge: null,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    name: "Schedule",
    icon: <FiCalendar />,
    href: "/client-schedule",
    description: "Lesson schedule",
    badge: null,
    gradient: "from-purple-500 to-violet-500",
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
  const { isMobile } = useMobileDetection();
  const { data: authData } = trpc.authCallback.useQuery();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showRecentMessages, setShowRecentMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagePopupRef = useRef<HTMLDivElement>(null);

  // Use the optimized unread counts endpoint
  const { data: unreadCountsObj = {} } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      refetchInterval: 10000, // Poll every 10 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    });

  // Calculate total unread count from the object
  const unreadCount = Object.values(unreadCountsObj).reduce(
    (sum, count) => sum + count,
    0
  );

  const { data: conversations = [] } = trpc.messaging.getConversations.useQuery(
    undefined,
    {
      enabled: showRecentMessages,
      refetchInterval: 60000, // Poll every minute
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30 * 1000, // Cache for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    }
  );

  const { data: unreadNotificationCount = 0 } =
    trpc.notifications.getUnreadCount.useQuery(undefined, {
      refetchInterval: 10000, // Poll every 10 seconds
      refetchOnWindowFocus: true,
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

  const isActiveLink = (href: string) => pathname === href;

  const toggleDesktopSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleUserClick = () => {
    setUserDropdownOpen(!userDropdownOpen);
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
      {/* Mobile hamburger button */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 left-4 z-30 md:hidden p-3 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg bg-sidebar text-sidebar-foreground border border-sidebar-border"
        aria-label={isMobileOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isMobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-10 md:hidden transition-opacity duration-300 backdrop-blur-sm"
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
                  <img
                    src="/logo image.png"
                    alt="Next Level Softball"
                    className="w-full h-full object-cover group-active:scale-95 transition-transform"
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
                <img
                  src="/logo image.png"
                  alt="Next Level Softball"
                  className="w-full h-full object-cover"
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
                onClick={() => setIsMobileOpen(false)}
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
                  className={`absolute bottom-full mb-2 w-96 h-96 rounded-lg shadow-lg border ${
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
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div
                      className="flex items-center justify-between p-4 border-b"
                      style={{ borderColor: "#606364" }}
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle
                          className="h-5 w-5"
                          style={{ color: "#C3BCC2" }}
                        />
                        <span
                          className="font-medium"
                          style={{ color: "#C3BCC2" }}
                        >
                          Recent Messages
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
                        className="p-1 rounded-md transition-colors"
                        style={{ color: "#ABA4AA" }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#606364";
                          e.currentTarget.style.color = "#C3BCC2";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#ABA4AA";
                        }}
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto">
                      {conversations.length === 0 ? (
                        <div className="p-4 text-center">
                          <MessageCircle
                            className="h-8 w-8 mx-auto mb-2 opacity-50"
                            style={{ color: "#ABA4AA" }}
                          />
                          <p className="text-sm" style={{ color: "#ABA4AA" }}>
                            No messages yet
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
                            } else if (conversation.type === "CLIENT_CLIENT") {
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

                            return (
                              <Link
                                key={conversation.id}
                                href={`/client-messages`}
                                onClick={() => {
                                  setIsAnimating(true);
                                  setTimeout(() => {
                                    setShowRecentMessages(false);
                                    setIsAnimating(false);
                                  }, 200);
                                }}
                                className="flex items-center gap-3 p-3 border-b transition-all duration-200 hover:transform hover:translate-x-1"
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
                                onMouseEnter={e => {
                                  e.currentTarget.style.backgroundColor =
                                    "#2A3133";
                                  e.currentTarget.style.boxShadow =
                                    "0 2px 8px rgba(0, 0, 0, 0.2)";
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                              >
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 transition-transform duration-200 hover:scale-110"
                                  style={{
                                    backgroundColor: "#4A5A70",
                                    color: "white",
                                  }}
                                >
                                  {(otherUser?.name || otherUser?.email)
                                    ?.charAt(0)
                                    ?.toUpperCase() || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p
                                      className="text-sm font-medium truncate"
                                      style={{ color: "#C3BCC2" }}
                                    >
                                      {otherUser?.name ||
                                        otherUser?.email?.split("@")[0] ||
                                        "Unknown"}
                                    </p>
                                    {lastMessage && (
                                      <span
                                        className="text-xs flex-shrink-0 ml-2"
                                        style={{ color: "#ABA4AA" }}
                                      >
                                        {formatTime(lastMessage.createdAt)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    {lastMessage && (
                                      <p
                                        className="text-xs truncate"
                                        style={{ color: "#ABA4AA" }}
                                      >
                                        {lastMessage.content}
                                      </p>
                                    )}
                                    {unreadCount > 0 && (
                                      <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center ml-2 animate-pulse">
                                        {unreadCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            );
                          }
                        )
                      )}
                    </div>

                    {/* Footer */}
                    <div
                      className="p-3 border-t"
                      style={{ borderColor: "#606364" }}
                    >
                      <div className="flex gap-2">
                        <Link
                          href="/client-messages"
                          onClick={() => {
                            setIsAnimating(true);
                            setTimeout(() => {
                              setShowRecentMessages(false);
                              setIsAnimating(false);
                            }, 200);
                          }}
                          className="flex-1 text-center py-2 px-3 text-sm rounded-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
                          style={{
                            backgroundColor: "#4A5A70",
                            color: "#C3BCC2",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#606364";
                            e.currentTarget.style.boxShadow =
                              "0 4px 15px rgba(0, 0, 0, 0.2)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "#4A5A70";
                            e.currentTarget.style.boxShadow = "none";
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
                          className="flex-1 text-center py-2 px-3 text-sm rounded-md border transition-all duration-200 hover:scale-105 hover:shadow-lg"
                          style={{
                            borderColor: "#606364",
                            color: "#C3BCC2",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#606364";
                            e.currentTarget.style.boxShadow =
                              "0 4px 15px rgba(0, 0, 0, 0.2)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.boxShadow = "none";
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
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-center mt-4">
              <button
                onClick={handleUserClick}
                disabled={isLoggingOut}
                className="rounded-full w-16 h-16 md:w-12 md:h-12 flex items-center justify-center font-bold text-white transition-all duration-300 hover:scale-110 relative group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg touch-manipulation"
                style={{
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                  // Add larger touch target for mobile
                  minWidth: "64px",
                  minHeight: "64px",
                }}
                onTouchStart={e => {
                  // Add visual feedback for touch
                  e.currentTarget.style.transform = "scale(0.95)";
                }}
                onTouchEnd={e => {
                  // Reset transform after touch
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {isLoggingOut ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <ProfilePictureUploader
                    currentAvatarUrl={userSettings?.avatarUrl}
                    userName={user?.name || authData?.user?.name || "User"}
                    onAvatarChange={() => {}} // No-op for sidebar
                    size="sm"
                    readOnly={true}
                  />
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

      {/* Main Content Area with proper margins */}
      <div
        className={`flex-1 transition-all duration-500 ease-in-out ${
          isOpen ? "md:ml-64" : "md:ml-20"
        } ml-0 p-4 md:p-8 pt-20 md:pt-8`}
      >
        {children}
      </div>

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
  );
}
