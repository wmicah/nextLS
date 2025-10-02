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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ProfilePictureUploader from "./ProfilePictureUploader";
import MessagePopup from "./MessagePopup";
import NotificationPopup from "./NotificationPopup";

interface ClientTopNavProps {
  children: React.ReactNode;
}

function ClientTopNav({ children }: ClientTopNavProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showRecentMessages, setShowRecentMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const messagesButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);

  // Get user data
  const { data: authData } = trpc.authCallback.useQuery();
  const { data: userSettings } = trpc.settings.getSettings.useQuery();

  // Get unread counts with polling for real-time updates
  const { data: unreadCountsObj = {} } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      refetchInterval: 30000, // Poll every 30 seconds
      refetchOnWindowFocus: true,
    });
  const { data: unreadNotifications = 0 } =
    trpc.notifications.getUnreadCount.useQuery(undefined, {
      refetchInterval: 30000, // Poll every 30 seconds
      refetchOnWindowFocus: true,
    });

  // Calculate total unread messages across all conversations
  const unreadMessages = Object.values(unreadCountsObj).reduce(
    (total: number, count: number) => total + count,
    0
  );

  const handleLogout = () => {
    router.push("/api/auth/logout");
  };

  const handleSettings = () => {
    router.push("/client-settings");
  };

  const handleMessages = () => {
    setShowRecentMessages(!showRecentMessages);
    setShowNotifications(false);
  };

  const handleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowRecentMessages(false);
  };

  const handleDashboard = () => {
    router.push("/client-dashboard");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#2a3133" }}>
      {/* Top Navigation Bar */}
      <nav
        className="sticky top-0 z-50 border-b shadow-lg"
        style={{
          background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
          borderColor: "#606364",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-white">
                  NextLevel Coaching
                </h1>
              </div>
            </div>

            {/* Desktop Navigation - Hide on iPad, show on large screens */}
            <div className="hidden lg:block flex-1">
              <div className="ml-10 flex items-center justify-end space-x-2">
                {/* Dashboard */}
                <button
                  onClick={handleDashboard}
                  className="p-3 rounded-xl transition-all duration-200 hover:bg-white/10 group hover:scale-105 touch-manipulation"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <Home className="h-6 w-6 text-white group-hover:text-green-400" />
                </button>

                {/* Messages */}
                <button
                  ref={messagesButtonRef}
                  onClick={handleMessages}
                  className="relative p-3 rounded-xl transition-all duration-200 hover:bg-white/10 group hover:scale-105 touch-manipulation"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <MessageSquare className="h-6 w-6 text-white group-hover:text-blue-400" />
                  {unreadMessages > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500 animate-pulse">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </Badge>
                  )}
                </button>

                {/* Notifications */}
                <button
                  ref={notificationsButtonRef}
                  onClick={handleNotifications}
                  className="relative p-3 rounded-xl transition-all duration-200 hover:bg-white/10 group hover:scale-105 touch-manipulation"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <Bell className="h-6 w-6 text-white group-hover:text-amber-400" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500 animate-pulse">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </Badge>
                  )}
                </button>

                {/* Settings */}
                <button
                  onClick={handleSettings}
                  className="p-3 rounded-xl transition-all duration-200 hover:bg-white/10 group hover:scale-105 touch-manipulation"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <Settings className="h-6 w-6 text-white group-hover:text-gray-400" />
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    className="flex items-center space-x-2 p-3 rounded-xl transition-all duration-200 hover:bg-white/10 group hover:scale-105 touch-manipulation"
                    style={{ minWidth: "44px", minHeight: "44px" }}
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
                      className="text-white font-medium hidden xl:block max-w-32 truncate"
                      title={authData?.user?.name || "Client"}
                    >
                      {authData?.user?.name || "Client"}
                    </span>
                  </button>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-3 rounded-xl transition-all duration-200 hover:bg-red-500/20 group touch-manipulation"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                  title="Logout"
                >
                  <LogOut className="h-6 w-6 text-white group-hover:text-red-400" />
                </button>
              </div>
            </div>

            {/* Mobile menu button - Show on iPad and smaller */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-white" />
                ) : (
                  <Menu className="h-6 w-6 text-white" />
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
              style={{ borderColor: "#606364" }}
            >
              {/* Dashboard */}
              <button
                onClick={() => {
                  handleDashboard();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-3 rounded-xl transition-all duration-200 hover:bg-white/10 touch-manipulation"
                style={{ minHeight: "44px" }}
              >
                <Home className="h-5 w-5 text-white" />
                <span className="text-white">Dashboard</span>
              </button>

              {/* Messages */}
              <button
                onClick={() => {
                  handleMessages();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 relative"
              >
                <MessageSquare className="h-5 w-5 text-white" />
                <span className="text-white">Messages</span>
                {unreadMessages > 0 && (
                  <Badge className="bg-red-500 text-white text-xs animate-pulse ml-auto">
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
                className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 relative"
              >
                <Bell className="h-5 w-5 text-white" />
                <span className="text-white">Notifications</span>
                {unreadNotifications > 0 && (
                  <Badge className="bg-red-500 text-white text-xs animate-pulse ml-auto">
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
                className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl transition-all duration-200 hover:bg-white/10"
              >
                <Settings className="h-5 w-5 text-white" />
                <span className="text-white">Settings</span>
              </button>

              {/* User Info */}
              <div className="flex items-center space-x-3 w-full px-3 py-2">
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
                  className="text-white font-medium truncate max-w-40"
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
                className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl transition-all duration-200 hover:bg-red-500/20"
              >
                <LogOut className="h-5 w-5 text-white" />
                <span className="text-white">Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Message Popup */}
      {showRecentMessages && (
        <MessagePopup
          isOpen={showRecentMessages}
          onClose={() => setShowRecentMessages(false)}
          buttonRef={messagesButtonRef}
        />
      )}

      {/* Notification Popup */}
      {showNotifications && (
        <NotificationPopup
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          buttonRef={notificationsButtonRef}
          position="below"
        />
      )}
    </div>
  );
}

export default ClientTopNav;
