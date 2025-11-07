"use client";

import { useState } from "react";
import { MessageCircle, Bell, AlertCircle } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import BugReportModalMobile from "./BugReportModalMobile";

export default function MobileClientBottomNavigation() {
  const [showBugReport, setShowBugReport] = useState(false);

  // Get unread counts
  const { data: unreadMessages = 0, isLoading: messagesLoading } =
    trpc.messaging.getUnreadCount.useQuery(undefined, {
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    });

  const { data: unreadNotifications = 0, isLoading: notificationsLoading } =
    trpc.notifications.getUnreadCount.useQuery(undefined, {
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#353A3A] border-t border-[#606364] shadow-lg">
      <div className="flex items-center justify-around py-2">
        {/* Notifications */}
        <button
          onClick={() => (window.location.href = "/client-notifications")}
          className="flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 hover:bg-[#4A5A70] active:scale-95 relative"
        >
          <div className="relative">
            <Bell className="h-6 w-6 text-white" />
            {!notificationsLoading && unreadNotifications > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-lg bg-red-500">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </div>
            )}
            {notificationsLoading && (
              <div className="absolute -top-1 -right-1 text-xs text-gray-400">
                ...
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400">Notifications</span>
        </button>

        {/* Messages */}
        <button
          onClick={() => (window.location.href = "/client-messages")}
          className="flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 hover:bg-[#4A5A70] active:scale-95 relative"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6 text-white" />
            {!messagesLoading && unreadMessages > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-lg bg-red-500">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </div>
            )}
            {messagesLoading && (
              <div className="absolute -top-1 -right-1 text-xs text-gray-400">
                ...
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400">Messages</span>
        </button>

        {/* Bug Report */}
        <button
          onClick={() => setShowBugReport(true)}
          className="flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 hover:bg-[#4A5A70] active:scale-95 relative"
        >
          <div className="relative">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs text-gray-400">Report Bug</span>
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
