"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { MessageCircle, Bell, Bot, AlertCircle } from "lucide-react";
import { useChatbot } from "./Chatbot/ChatbotContext";
import BugReportModalMobile from "./BugReportModalMobile";

export default function MobileBottomNavigation() {
  const router = useRouter();
  const { setIsOpen } = useChatbot();
  const [showBugReport, setShowBugReport] = useState(false);

  // Get unread counts - will update via Supabase Realtime
  const { data: unreadMessages = 0, isLoading: messagesLoading } =
    trpc.messaging.getUnreadCount.useQuery(undefined, {
      refetchInterval: false, // NO POLLING - updates via Supabase Realtime
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 0, // Always refetch when invalidated (for real-time updates)
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    });
  const { data: unreadNotifications = 0, isLoading: notificationsLoading } =
    trpc.notifications.getUnreadCount.useQuery(undefined, {
      refetchInterval: false, // NO POLLING - will add WebSocket support later
      refetchOnWindowFocus: true, // Only refetch when user returns to tab
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

  // Debug logging
  console.log("MobileBottomNavigation - Unread Messages:", unreadMessages);

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleChatbotOpen = () => {
    setIsOpen(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#353A3A] border-t border-[#606364] shadow-lg">
      <div className="flex items-center justify-around py-2">
        {/* Notifications */}
        <button
          onClick={() => handleNavigation("/notifications")}
          className="flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 hover:bg-[#4A5A70] active:scale-95 relative"
        >
          <div className="relative">
            <Bell className="h-6 w-6 text-white" />
            {(unreadNotifications > 0 || notificationsLoading) && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center font-bold shadow-lg border-2 border-white">
                {notificationsLoading
                  ? "..."
                  : unreadNotifications > 99
                  ? "99+"
                  : unreadNotifications}
              </div>
            )}
          </div>
          <span className="text-xs text-white font-medium">Notifications</span>
        </button>

        {/* Messages */}
        <button
          onClick={() => handleNavigation("/messages")}
          className="flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 hover:bg-[#4A5A70] active:scale-95 relative"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6 text-white" />
            {(unreadMessages > 0 || messagesLoading) && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center font-bold shadow-lg border-2 border-white">
                {messagesLoading
                  ? "..."
                  : unreadMessages > 99
                  ? "99+"
                  : unreadMessages}
              </div>
            )}
          </div>
          <span className="text-xs text-white font-medium">Messages</span>
        </button>

        {/* AI Chat */}
        <button
          onClick={handleChatbotOpen}
          className="flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 hover:bg-[#4A5A70] active:scale-95 relative"
        >
          <div className="relative">
            <Bot className="h-6 w-6 text-white" />
            {/* AI indicator */}
            <div className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center border border-white shadow-md">
              <div className="h-2 w-2 bg-white rounded-full" />
            </div>
          </div>
          <span className="text-xs text-white font-medium">AI Chat</span>
        </button>

        {/* Bug Report */}
        <button
          onClick={() => setShowBugReport(true)}
          className="flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 hover:bg-[#4A5A70] active:scale-95 relative"
        >
          <div className="relative">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs text-white font-medium">Report Bug</span>
        </button>
      </div>

      {/* Bug Report Modal */}
      <BugReportModalMobile
        isOpen={showBugReport}
        onClose={() => setShowBugReport(false)}
      />
    </div>
  );
}
