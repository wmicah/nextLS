"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { COLORS, getGoldenAccent } from "@/lib/colors";
import { useTransition } from "react";
import { trpc } from "@/app/_trpc/client";
import { useState, useRef, useEffect } from "react";
import { useMessageSSE } from "@/hooks/useMessageSSE";
import { useMobileDetection } from "@/lib/mobile-detection";
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
  FiVideo,
  FiTrendingUp,
  FiBriefcase,
} from "react-icons/fi";
import {
  LogOut,
  Settings,
  UserIcon,
  MessageCircle,
  Send,
  ArrowLeft,
} from "lucide-react";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
import dynamic from "next/dynamic";
// Lazy load Lottie to reduce initial bundle size
const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
  loading: () => null,
});
// Removed complex SSE hooks - using simple polling instead
import MessagePopup from "./MessagePopup";
import NotificationPopup from "./NotificationPopup";
import ProfilePictureUploader from "./ProfilePictureUploader";
import ClientSearchModal from "./ClientSearchModal";
import { useMessagingService } from "@/components/MessagingServiceProvider";

// navLinks will be defined inside the component to access unreadCount

// Animated Icon Components with Lottie from useanimations.com
// Download JSON files from https://useanimations.com/#explore and place in public/animations/
function AnimatedIcon({
  animationPath,
  icon,
  isHovered,
  shouldReverse = true,
}: {
  animationPath: string;
  icon: React.ReactNode;
  isHovered: boolean;
  shouldReverse?: boolean;
}) {
  const [animationData, setAnimationData] = useState<any>(null);
  const lottieRef = React.useRef<any>(null);

  // Load animation data
  React.useEffect(() => {
    fetch(animationPath)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load animation: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setAnimationData(data);
      })
      .catch(error => {
        // If animation file doesn't exist, fall back to regular icon
        console.warn(`Animation not found at ${animationPath}:`, error);
        setAnimationData(null);
      });
  }, [animationPath]);

  // Initialize animation at frame 0 when data loads
  React.useEffect(() => {
    if (lottieRef.current && animationData) {
      lottieRef.current.goToAndStop(0, true);
      lottieRef.current.setDirection(1);
    }
  }, [animationData]);

  // Control animation playback based on hover
  React.useEffect(() => {
    if (!lottieRef.current || !animationData) {
      return undefined;
    }

    let checkReverse: NodeJS.Timeout | null = null;

    if (isHovered) {
      // Clear any reverse check if hovering again
      if (checkReverse) {
        clearInterval(checkReverse);
        checkReverse = null;
      }
      // Play forward from current position
      lottieRef.current.setDirection(1);
      lottieRef.current.play();
    } else {
      if (shouldReverse) {
        // Play in reverse back to start
        lottieRef.current.setDirection(-1);
        lottieRef.current.play();

        // Check when animation reaches frame 0 and stop
        checkReverse = setInterval(() => {
          if (lottieRef.current) {
            const currentFrame = lottieRef.current.currentFrame;
            if (currentFrame <= 0) {
              lottieRef.current.stop();
              lottieRef.current.goToAndStop(0, true);
              lottieRef.current.setDirection(1); // Reset to forward for next hover
              if (checkReverse) {
                clearInterval(checkReverse);
                checkReverse = null;
              }
            }
          }
        }, 16); // Check every ~16ms (60fps)
      } else {
        // Don't reverse - just stop at current frame
        lottieRef.current.stop();
      }
    }

    return () => {
      if (checkReverse) {
        clearInterval(checkReverse);
      }
    };
  }, [isHovered, animationData, shouldReverse]);

  // If animation data is not available, show regular icon
  if (!animationData) {
    return <span className="inline-block">{icon}</span>;
  }

  return (
    <span className="inline-block text-lg leading-none">
      <div
        className="lottie-icon-wrapper"
        style={{
          width: "1.25em",
          height: "1.25em",
          lineHeight: 0,
        }}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={false}
          autoplay={false}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </span>
  );
}

function AnimatedHomeIcon({
  icon,
  isHovered,
}: {
  icon: React.ReactNode;
  isHovered: boolean;
}) {
  return (
    <AnimatedIcon
      animationPath="/animations/home.json"
      icon={icon}
      isHovered={isHovered}
    />
  );
}

function AnimatedUsersIcon({
  icon,
  isHovered,
}: {
  icon: React.ReactNode;
  isHovered: boolean;
}) {
  return (
    <AnimatedIcon
      animationPath="/animations/userPlus.json"
      icon={icon}
      isHovered={isHovered}
    />
  );
}

function AnimatedBookIcon({
  icon,
  isHovered,
}: {
  icon: React.ReactNode;
  isHovered: boolean;
}) {
  return (
    <AnimatedIcon
      animationPath="/animations/bookmark.json"
      icon={icon}
      isHovered={isHovered}
      shouldReverse={false}
    />
  );
}

function AnimatedClipboardIcon({
  icon,
  isHovered,
}: {
  icon: React.ReactNode;
  isHovered: boolean;
}) {
  return (
    <AnimatedIcon
      animationPath="/animations/folder.json"
      icon={icon}
      isHovered={isHovered}
      shouldReverse={false}
    />
  );
}

function AnimatedCalendarIcon({
  icon,
  isHovered,
}: {
  icon: React.ReactNode;
  isHovered: boolean;
}) {
  return (
    <AnimatedIcon
      animationPath="/animations/calendar.json"
      icon={icon}
      isHovered={isHovered}
      shouldReverse={false}
    />
  );
}

function AnimatedVideoIcon({
  icon,
  isHovered,
}: {
  icon: React.ReactNode;
  isHovered: boolean;
}) {
  return (
    <AnimatedIcon
      animationPath="/animations/video.json"
      icon={icon}
      isHovered={isHovered}
      shouldReverse={false}
    />
  );
}

function AnimatedBriefcaseIcon({
  icon,
  isHovered,
}: {
  icon: React.ReactNode;
  isHovered: boolean;
}) {
  return (
    <AnimatedIcon
      animationPath="/animations/organization.json"
      icon={icon}
      isHovered={isHovered}
      shouldReverse={false}
    />
  );
}

function AnimatedSettingsIcon({
  icon,
  isHovered,
}: {
  icon: React.ReactNode;
  isHovered: boolean;
}) {
  return (
    <AnimatedIcon
      animationPath="/animations/settings.json"
      icon={icon}
      isHovered={isHovered}
    />
  );
}

// NavLinkItem component to manage hover state per link
function NavLinkItem({
  link,
  isOpen,
  isActiveLink,
  setIsMobileOpen,
  startTransition,
}: {
  link: {
    name: string;
    icon: React.ReactNode;
    href: string;
    badge?: string | null;
  };
  isOpen: boolean;
  isActiveLink: (href: string) => boolean;
  setIsMobileOpen: (open: boolean) => void;
  startTransition: (callback: () => void) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={link.href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        setIsMobileOpen(false);
        startTransition(() => {
          // This will show loading state during navigation
        });
      }}
      className={`transition-colors group relative ${
        isOpen
          ? "flex items-center gap-2.5 px-3 py-2.5 overflow-hidden rounded-lg"
          : "flex items-center justify-center p-2.5 rounded-lg"
      } ${
        isActiveLink(link.href)
          ? "bg-white/[0.08] text-white border"
          : "text-zinc-400 border border-transparent hover:bg-white/[0.04]"
      }`}
      style={
        isActiveLink(link.href)
          ? { borderColor: `${COLORS.GOLDEN_ACCENT}4D` }
          : undefined
      }
    >
      <span className="flex-shrink-0 text-base">
        {link.name === "Dashboard" && (
          <AnimatedHomeIcon icon={link.icon} isHovered={isHovered} />
        )}
        {link.name === "Clients" && (
          <AnimatedUsersIcon icon={link.icon} isHovered={isHovered} />
        )}
        {link.name === "Library" && (
          <AnimatedBookIcon icon={link.icon} isHovered={isHovered} />
        )}
        {link.name === "Programs/Routines" && (
          <AnimatedClipboardIcon icon={link.icon} isHovered={isHovered} />
        )}
        {link.name === "Schedule" && (
          <AnimatedCalendarIcon icon={link.icon} isHovered={isHovered} />
        )}
        {link.name === "Videos" && (
          <AnimatedVideoIcon icon={link.icon} isHovered={isHovered} />
        )}
        {link.name === "Organization" && (
          <AnimatedBriefcaseIcon icon={link.icon} isHovered={isHovered} />
        )}
        {link.name === "Admin" && (
          <AnimatedSettingsIcon icon={link.icon} isHovered={isHovered} />
        )}
        {![
          "Dashboard",
          "Clients",
          "Library",
          "Programs/Routines",
          "Schedule",
          "Videos",
          "Organization",
          "Admin",
        ].includes(link.name) && link.icon}
      </span>
      {isOpen && (
        <div className="flex-1 flex items-center justify-between min-w-0">
          <span className="text-sm font-medium truncate">{link.name}</span>
          {link.badge && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full font-medium bg-zinc-700 text-zinc-300 ml-2 flex-shrink-0">
              {link.badge}
            </span>
          )}
        </div>
      )}

      {/* Tooltip for collapsed state */}
      {!isOpen && (
        <div className="absolute left-full ml-2 px-2 py-1.5 text-xs rounded border border-white/10 bg-white/[0.08] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 text-white">
          {link.name}
          {link.badge && (
            <span className="ml-1.5 px-1 py-0.5 text-[10px] rounded-full bg-zinc-700 text-zinc-300">
              {link.badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

const bottomLinks = [
  { name: "Settings", icon: <FiSettings />, href: "/settings" },
  { name: "Notifications", icon: <FiBell />, href: "/notifications" },
  { name: "Search", icon: <FiSearch />, href: "/search" },
];

interface SidebarProps {
  user?: { name?: string; email?: string };
  children: React.ReactNode;
}

export default function Sidebar({ user, children }: SidebarProps) {
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
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagePopupRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  // Use SSE for real-time unread count updates
  const { unreadCount: sseUnreadCount, isConnected: sseConnected } =
    useMessageSSE({
      enabled: false, // Disabled due to connection loop issues
      onUnreadCountUpdate: count => {
        console.log("Unread count updated via SSE:", count);
      },
    });

  // Use MessagingService to check if Realtime is connected
  const { isConnected: realtimeConnected } = useMessagingService();

  // Batched sidebar data query - gets all data in one call
  // Only poll if Realtime is NOT connected
  const { data: sidebarData, refetch: refetchSidebarData } =
    trpc.sidebar.getSidebarData.useQuery(undefined, {
      staleTime: 0, // Always refetch when invalidated (for real-time updates)
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchInterval: !realtimeConnected ? 30000 : false, // Only poll if Realtime not connected
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true,
    });

  // Extract data from batched query
  const unreadCountsObj = sidebarData?.unreadCountsObj || {};
  const unreadCount = sidebarData?.totalUnreadCount || 0;
  const unreadNotificationCount = sidebarData?.unreadNotificationCount || 0;

  // Debug: Log when sidebar data changes
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("📊 Sidebar unreadCount updated:", unreadCount, "from sidebarData:", sidebarData);
    }
  }, [unreadCount, sidebarData]);

  // Get recent conversations when needed (separate query for performance)
  const { data: conversations = [], refetch: refetchConversations } =
    trpc.sidebar.getRecentConversations.useQuery(undefined, {
      enabled: showRecentMessages,
      staleTime: 0, // Don't cache - always get fresh data
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchInterval: false, // No automatic polling
      refetchOnWindowFocus: false, // Don't refetch on focus
      refetchOnReconnect: true, // Only refetch on reconnect
    });

  // Get messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } =
    trpc.messaging.getMessages.useQuery(
      { conversationId: selectedConversationId! },
      {
        enabled: !!selectedConversationId && showRecentMessages,
        refetchInterval: !realtimeConnected ? 3000 : false, // Only poll if Realtime not connected
      }
    );

  // Send message mutation
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation();
  const utils = trpc.useUtils();

  // Mark as read mutation
  const markAsReadMutation = trpc.messaging.markAsRead.useMutation({
    onSuccess: () => {
      // Invalidate all queries that depend on unread counts
      utils.messaging.getMessages.invalidate();
      utils.messaging.getConversations.invalidate();
      utils.messaging.getUnreadCount.invalidate();
      utils.messaging.getConversationUnreadCounts.invalidate();
      utils.sidebar.getSidebarData.invalidate(); // This updates the Sidebar badge!
      utils.sidebar.getRecentConversations.invalidate();
      
      // Force immediate refetch
      utils.messaging.getConversationUnreadCounts.refetch();
      utils.messaging.getUnreadCount.refetch();
      utils.sidebar.getSidebarData.refetch();
      refetchConversations();
    },
  });

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
      await utils.sidebar.getRecentConversations.invalidate();
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
      utils.sidebar.getRecentConversations.invalidate();
      refetchConversations();
    }
  }, [selectedConversationId, showRecentMessages, utils, refetchConversations]);

  // Extract additional data from batched query
  const userSettings = sidebarData?.userSettings;
  const organization = sidebarData?.organization;
  const isInOrganization = sidebarData?.isInOrganization || false;

  // Define navLinks inside component to access unreadCount
  const navLinks = [
    {
      name: "Dashboard",
      icon: <FiHome />,
      href: "/dashboard",
      description: "Overview & insights",
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
      name: "Programs/Routines",
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
      name: "Videos",
      icon: <FiVideo />,
      href: "/videos",
      description: "Video feedback system",
      badge: null,
      gradient: "from-red-500 to-pink-500",
    },
    // Organization link - only show if user is in an organization
    ...(organization
      ? [
          {
            name: "Organization",
            icon: <FiBriefcase />,
            href: "/organization",
            description: "Team collaboration",
            badge: null,
            gradient: "from-teal-500 to-cyan-500",
          },
        ]
      : []),
    // Admin-only links
    ...(authData?.user?.isAdmin
      ? [
          {
            name: "Admin",
            icon: <FiSettings />,
            href: "/admin",
            description: "Master library & user management",
            badge: null,
            gradient: "from-yellow-500 to-orange-500",
          },
        ]
      : []),
  ];

  // Keyboard shortcut for client search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowClientSearch(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ---- Persist sidebar open/closed state
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

  // ---- Keyboard shortcut: Ctrl/Cmd + B to toggle
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

  const userInitials =
    user?.name || authData?.user?.name
      ? ((user?.name ?? authData?.user?.name) || "")
          .split(" ")
          .map(n => n[0])
          .join("")
          .toUpperCase()
      : (user?.email || authData?.user?.email)?.[0]?.toUpperCase() || "U";

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

    // On mobile, navigate directly to messages page
    if (isMobile) {
      router.push("/messages");
      return;
    }

    // On desktop, show/hide popup as before
    if (showRecentMessages) {
      setIsAnimating(true);
      setTimeout(() => {
        setShowRecentMessages(false);
        setIsAnimating(false);
      }, 200);
    } else {
      setShowRecentMessages(true);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
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
      setIsAnimating(true);
      setTimeout(() => {
        setShowNotifications(false);
        setIsAnimating(false);
      }, 200);
    } else {
      setShowNotifications(true);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setUserDropdownOpen(false);
    // Use Kinde's LogoutLink instead of custom logout endpoint
    window.location.href = "/api/auth/logout";
  };

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours =
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)} days ago`;
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
        className={`fixed top-4 left-4 ${showRecentMessages ? 'z-40' : 'z-50'} md:hidden p-3 rounded-xl transition-all duration-300 hover:scale-110 shadow-xl bg-gradient-to-br from-[#4A5A70] to-[#353A3A] text-white border border-[#606364] backdrop-blur-sm`}
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
        <LogoutLink
          className={`fixed top-4 right-4 z-50 md:hidden p-3 rounded-xl transition-all duration-300 hover:scale-110 shadow-xl text-white border backdrop-blur-sm bg-gradient-to-br from-red-600 to-red-700 border-red-500`}
          aria-label="Logout"
          style={{
            boxShadow:
              "0 8px 32px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            animation: "slideInRight 0.3s ease-out",
          }}
        >
          <LogOut size={20} />
        </LogoutLink>
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

      {/* Sidebar - Compact & Minimal */}
      <aside
        className={`flex flex-col justify-between h-screen fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out border-r border-white/10 bg-[#1a1f20] ${
          isOpen ? "md:w-64" : "md:w-20"
        } ${
          isMobileOpen
            ? "w-80 translate-x-0 opacity-100"
            : "w-80 -translate-x-full opacity-0 md:opacity-100"
        } md:translate-x-0 md:z-20`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-center h-16 px-4 transition-all duration-300 overflow-hidden relative">
            <span
              className={`cursor-default whitespace-nowrap relative z-10 text-white ${
                isOpen
                  ? "opacity-100 translate-x-0 delay-150"
                  : "opacity-0 -translate-x-4"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                NextLevel Coaching
              </div>
            </span>
            <span
              className={`cursor-default absolute z-10 ${
                isOpen
                  ? "opacity-0 translate-x-4"
                  : "opacity-100 translate-x-0 delay-150"
              }`}
            >
              <div
                className="w-7 h-7 rounded flex items-center justify-center overflow-hidden cursor-pointer border border-white/10"
                onDoubleClick={toggleDesktopSidebar}
                title="Double-click to expand"
              >
                <Image
                  src="/logo image.png"
                  alt="Next Level Softball"
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </span>
          </div>

          {/* Navigation */}
          <nav
            className={`mt-4 px-2 ${
              isOpen
                ? "flex flex-col gap-0.5"
                : "grid grid-cols-1 gap-0.5 place-items-center"
            }`}
          >
            {navLinks.map((link, index) => (
              <NavLinkItem
                key={link.name}
                link={link}
                isOpen={isOpen}
                isActiveLink={isActiveLink}
                setIsMobileOpen={setIsMobileOpen}
                startTransition={startTransition}
              />
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
              // Special handling for search
              if (link.name === "Search") {
                return (
                  <div key={link.name} className="relative">
                    <button
                      onClick={() => setShowClientSearch(true)}
                      className="text-xl transition-all duration-300 ease-in-out transform hover:scale-110 p-3 relative group flex items-center justify-center rounded-xl"
                      style={{ color: "#606364" }}
                      aria-label="Search clients"
                      onMouseEnter={e => {
                        e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                        e.currentTarget.style.backgroundColor =
                          getGoldenAccent(0.1);
                        e.currentTarget.style.borderColor =
                          COLORS.GOLDEN_ACCENT;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = "#606364";
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.borderColor = "transparent";
                      }}
                      title="Jump to Client (⌘K)"
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
                          Jump to Client
                          <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                            <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]" />
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                );
              }

              // Special handling for notifications
              if (link.name === "Notifications") {
                return (
                  <div key={link.name} className="relative">
                    <button
                      ref={notificationButtonRef}
                      onClick={handleNotificationClick}
                      className={`text-xl transition-all duration-300 ease-in-out transform hover:scale-110 p-3 relative group flex items-center justify-center rounded-xl ${
                        showNotifications ? "scale-110" : ""
                      }`}
                      style={{ color: "#606364" }}
                      aria-label={
                        showNotifications
                          ? "Close notifications"
                          : "Open notifications"
                      }
                      onMouseEnter={e => {
                        e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                        e.currentTarget.style.backgroundColor =
                          getGoldenAccent(0.1);
                        e.currentTarget.style.borderColor =
                          COLORS.GOLDEN_ACCENT;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = "#606364";
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.borderColor = "transparent";
                      }}
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
                      buttonRef={notificationButtonRef}
                      position="above"
                    />
                  </div>
                );
              }

              // Regular links
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-xl transition-all duration-300 ease-in-out transform hover:scale-110 p-3 relative group flex items-center justify-center rounded-xl"
                  style={{ color: "#606364" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                    e.currentTarget.style.backgroundColor =
                      getGoldenAccent(0.1);
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = "#606364";
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
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
                className={`text-xl transition-all duration-300 ease-in-out transform hover:scale-110 p-3 relative group flex items-center justify-center rounded-xl ${
                  showRecentMessages ? "scale-110" : ""
                }`}
                style={{ color: "#606364" }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                  e.currentTarget.style.backgroundColor = getGoldenAccent(0.1);
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "#606364";
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
                aria-label="Toggle recent messages"
                title="Recent messages"
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
                  className={`absolute bottom-full mb-2 w-96 h-[500px] max-h-[80vh] rounded-xl shadow-2xl border backdrop-blur-sm z-[100] ${
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
                      {selectedConversationId ? (
                        <>
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              onClick={() => {
                                setSelectedConversationId(null);
                                setMessageText("");
                                // Refresh conversation list when exiting conversation view
                                utils.messaging.getConversations.invalidate();
                              }}
                              className="p-1 rounded-lg transition-all duration-200"
                              style={{
                                color: COLORS.TEXT_SECONDARY,
                                backgroundColor: "transparent",
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor =
                                  COLORS.BACKGROUND_CARD_HOVER;
                                e.currentTarget.style.color =
                                  COLORS.TEXT_PRIMARY;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                                e.currentTarget.style.color =
                                  COLORS.TEXT_SECONDARY;
                              }}
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </button>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span
                                className="text-sm font-semibold leading-tight truncate"
                                style={{ color: COLORS.TEXT_PRIMARY }}
                              >
                                {(() => {
                                  const conversation = conversations.find(
                                    (c: any) => c.id === selectedConversationId
                                  );
                                  if (!conversation) return "Conversation";
                                  const otherUser =
                                    conversation.coach?.id !== currentUserId
                                      ? conversation.coach
                                      : conversation.client;
                                  return (
                                    otherUser?.name ||
                                    otherUser?.email?.split("@")[0] ||
                                    "Unknown"
                                  );
                                })()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setIsAnimating(true);
                              setTimeout(() => {
                                setShowRecentMessages(false);
                                setIsAnimating(false);
                                setSelectedConversationId(null);
                                setMessageText("");
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
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                              e.currentTarget.style.color =
                                COLORS.TEXT_SECONDARY;
                            }}
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
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
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                              e.currentTarget.style.color =
                                COLORS.TEXT_SECONDARY;
                            }}
                            aria-label="Close"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </>
                      )}
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
                                          {message.content}
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
                                const otherUser =
                                  conversation.coach.id !== currentUserId
                                    ? conversation.coach
                                    : conversation.client;
                                const lastMessage = conversation.messages[0];
                                // Get actual unread count from the unreadCountsObj data
                                const unreadCount =
                                  unreadCountsObj[conversation.id] || 0;
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
                                      // Mark messages as read when conversation is opened
                                      markAsReadMutation.mutate({ conversationId: conversation.id });
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
                                    <ProfilePictureUploader
                                      currentAvatarUrl={
                                        otherUser?.settings?.avatarUrl ||
                                        otherUser?.avatar ||
                                        null
                                      }
                                      userName={
                                        otherUser?.name ||
                                        otherUser?.email ||
                                        "User"
                                      }
                                      onAvatarChange={() => {}}
                                      size="sm"
                                      readOnly={true}
                                      className="flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <p
                                          className="text-sm font-semibold truncate"
                                          style={{
                                            color: hasUnread
                                              ? COLORS.TEXT_PRIMARY
                                              : COLORS.TEXT_PRIMARY,
                                          }}
                                        >
                                          {otherUser.name ||
                                            otherUser.email.split("@")[0]}
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
                                              color: hasUnread
                                                ? COLORS.TEXT_SECONDARY
                                                : COLORS.TEXT_SECONDARY,
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
                          href="/messages/new"
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
                          href="/messages"
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
        className={`flex-1 transition-all duration-500 ease-in-out bg-[#15191a] ${
          isOpen ? "ml-0 md:ml-20 lg:ml-64" : "ml-0 md:ml-20"
        }`}
        style={{
          padding: "1rem",
          paddingTop: "5rem", // Space for mobile hamburger button
        }}
      >
        <div className="max-w-full mx-auto pb-20">{children}</div>
      </div>

      {/* Client Search Modal */}
      <ClientSearchModal
        isOpen={showClientSearch}
        onClose={() => setShowClientSearch(false)}
      />

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
        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
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
