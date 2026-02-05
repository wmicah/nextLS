"use client";

import { useState, useRef, RefObject } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import {
  Settings,
  MessageSquare,
  Bell,
  LogOut,
  User,
  Menu,
  X,
  Home,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ProfilePictureUploader from "./ProfilePictureUploader";
import { COLORS } from "@/lib/colors";

interface ClientTopNavProps {
  children: React.ReactNode;
}

function ClientTopNav({ children }: ClientTopNavProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get user data
  const { data: authData } = trpc.authCallback.useQuery();
  const { data: userSettings } = trpc.settings.getSettings.useQuery();

  // Get unread counts - will update via Supabase Realtime
  const { data: unreadCountsObj = {} } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      refetchInterval: false, // NO POLLING - updates via Supabase Realtime
      refetchOnWindowFocus: true, // Only refetch when user returns to tab
      refetchOnReconnect: true,
      staleTime: 0, // Always refetch when invalidated (for real-time updates)
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    });
  const { data: unreadNotifications = 0 } =
    trpc.notifications.getUnreadCount.useQuery(undefined, {
      refetchInterval: false, // NO POLLING - will add WebSocket support later
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

  // Calculate total unread messages across all conversations
  const unreadMessages = Object.values(
    unreadCountsObj as Record<string, number>
  ).reduce((total: number, count: number) => total + count, 0);

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  const handleSettings = () => {
    router.push("/client-settings");
  };

  const handleMessages = () => {
    router.push("/client-messages");
  };

  const handleNotifications = () => {
    router.push("/client-notifications");
  };

  const handleDashboard = () => {
    router.push("/client-dashboard");
  };

  const handleSchedule = () => {
    router.push("/client-schedule");
  };

  return (
    <div
      className="flex flex-col"
      style={{
        backgroundColor: COLORS.BACKGROUND_DARK,
        height: "100vh",
        maxHeight: "100vh",
        overscrollBehavior: "none", // Prevent overscroll bounce
        touchAction: "pan-y", // Allow vertical scrolling only
        overflow: "hidden", // Prevent body scroll
      }}
    >
      {/* Top Navigation Bar */}
      <nav
        className="sticky top-0 z-50 border-b shadow-lg will-change-transform flex-shrink-0"
        style={{
          backgroundColor: "#1F2426", // Solid dark background
          borderColor: COLORS.BORDER_SUBTLE,
          paddingTop: "env(safe-area-inset-top)",
          position: "sticky",
          top: 0,
          backfaceVisibility: "hidden",
          transform: "translateZ(0)", // Force GPU acceleration to prevent layout shifts
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-baseline gap-2">
              <h1
                className="text-xl font-bold"
                style={{
                  color: COLORS.GOLDEN_ACCENT,
                }}
              >
                NextLevel
              </h1>
              <span
                className="text-xs font-normal"
                style={{
                  color: COLORS.TEXT_MUTED,
                  letterSpacing: "0.5px",
                }}
              >
                Client Portal
              </span>
            </div>

            {/* Desktop Navigation - Hide on iPad, show on large screens */}
            <div className="hidden lg:block flex-1">
              <div className="ml-10 flex items-center justify-end space-x-1">
                {/* Dashboard */}
                <button
                  onClick={handleDashboard}
                  className="p-2.5 rounded-lg transition-all duration-200 touch-manipulation"
                  style={{
                    minWidth: "40px",
                    minHeight: "40px",
                    color: COLORS.TEXT_SECONDARY,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = COLORS.GREEN_PRIMARY;
                    e.currentTarget.style.backgroundColor =
                      "rgba(109, 196, 109, 0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Dashboard"
                >
                  <Home className="h-5 w-5" />
                </button>

                {/* Schedule */}
                <button
                  onClick={handleSchedule}
                  className="p-2.5 rounded-lg transition-all duration-200 touch-manipulation"
                  style={{
                    minWidth: "40px",
                    minHeight: "40px",
                    color: COLORS.TEXT_SECONDARY,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = COLORS.BLUE_PRIMARY;
                    e.currentTarget.style.backgroundColor =
                      "rgba(74, 144, 226, 0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Schedule"
                >
                  <Calendar className="h-5 w-5" />
                </button>

                {/* Messages */}
                <button
                  onClick={handleMessages}
                  className="relative p-2.5 rounded-lg transition-all duration-200 touch-manipulation"
                  style={{
                    minWidth: "40px",
                    minHeight: "40px",
                    color: COLORS.TEXT_SECONDARY,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = COLORS.BLUE_PRIMARY;
                    e.currentTarget.style.backgroundColor =
                      "rgba(74, 144, 226, 0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Messages"
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <Badge
                      className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] font-bold"
                      style={{ backgroundColor: COLORS.RED_ALERT }}
                    >
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </Badge>
                  )}
                </button>

                {/* Notifications */}
                <button
                  onClick={handleNotifications}
                  className="relative p-2.5 rounded-lg transition-all duration-200 touch-manipulation"
                  style={{
                    minWidth: "40px",
                    minHeight: "40px",
                    color: COLORS.TEXT_SECONDARY,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                    e.currentTarget.style.backgroundColor =
                      "rgba(229, 178, 50, 0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <Badge
                      className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] font-bold"
                      style={{ backgroundColor: COLORS.RED_ALERT }}
                    >
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </Badge>
                  )}
                </button>

                {/* Settings */}
                <button
                  onClick={handleSettings}
                  className="p-2.5 rounded-lg transition-all duration-200 touch-manipulation"
                  style={{
                    minWidth: "40px",
                    minHeight: "40px",
                    color: COLORS.TEXT_SECONDARY,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>

                {/* Divider */}
                <div
                  className="h-8 w-px mx-1"
                  style={{ backgroundColor: COLORS.BORDER_SUBTLE }}
                />

                {/* User Menu */}
                <button
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 touch-manipulation"
                  style={{
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <ProfilePictureUploader
                      currentAvatarUrl={userSettings?.avatarUrl}
                      userName={authData?.user?.name || "User"}
                      onAvatarChange={() => {}} // No-op for top nav
                      size="sm"
                      readOnly={true}
                    />
                  </div>
                  <span
                    className="font-medium hidden xl:block max-w-32 truncate text-sm"
                    title={authData?.user?.name || "Client"}
                  >
                    {authData?.user?.name || "Client"}
                  </span>
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-lg transition-all duration-200 touch-manipulation"
                  style={{
                    minWidth: "40px",
                    minHeight: "40px",
                    color: COLORS.TEXT_SECONDARY,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = COLORS.RED_ALERT;
                    e.currentTarget.style.backgroundColor =
                      "rgba(217, 83, 79, 0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mobile menu button - Show on iPad and smaller */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD_HOVER;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD;
                }}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu - Show on iPad and smaller */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div
              className="px-2 pt-2 pb-3 space-y-1 border-t"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                backgroundColor: "#1F2426",
              }}
            >
              {/* Dashboard */}
              <button
                onClick={() => {
                  handleDashboard();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-3 rounded-xl transition-all duration-200 touch-manipulation"
                style={{
                  minHeight: "44px",
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD_HOVER;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD;
                }}
              >
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </button>

              {/* Messages */}
              <button
                onClick={() => {
                  handleMessages();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl transition-all duration-200 relative"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD_HOVER;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD;
                }}
              >
                <MessageSquare className="h-5 w-5" />
                <span>Messages</span>
                {unreadMessages > 0 && (
                  <Badge
                    className="text-white text-xs animate-pulse ml-auto"
                    style={{ backgroundColor: COLORS.RED_ALERT }}
                  >
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </Badge>
                )}
              </button>

              {/* Notifications */}
              <button
                onClick={() => {
                  handleNotifications();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl transition-all duration-200 relative"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD_HOVER;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD;
                }}
              >
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
                {unreadNotifications > 0 && (
                  <Badge
                    className="text-white text-xs animate-pulse ml-auto"
                    style={{ backgroundColor: COLORS.RED_ALERT }}
                  >
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </Badge>
                )}
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  handleSettings();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD_HOVER;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD;
                }}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>

              {/* User Info */}
              <div
                className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                }}
              >
                {/* Avatar */}
                <div className="relative">
                  <ProfilePictureUploader
                    currentAvatarUrl={userSettings?.avatarUrl}
                    userName={authData?.user?.name || "User"}
                    onAvatarChange={() => {}} // No-op for top nav
                    size="sm"
                    readOnly={true}
                  />
                </div>
                <span
                  className="font-medium truncate max-w-40"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                  title={authData?.user?.name || "Client"}
                >
                  {authData?.user?.name || "Client"}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.RED_DARK;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD;
                }}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content - flex so child pages can fill height and manage their own scroll */}
      <main
        className="flex-1 w-full flex flex-col min-h-0 overflow-y-auto overflow-x-hidden"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default ClientTopNav;
