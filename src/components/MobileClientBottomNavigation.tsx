"use client";

import { useState } from "react";
import { MessageCircle, Bell, AlertCircle } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import BugReportModalMobile from "./BugReportModalMobile";
import { COLORS } from "@/lib/colors";

interface MobileClientBottomNavigationProps {
  /** When true, show Bug Report on the left (e.g. on messages page only) */
  bugReportOnLeft?: boolean;
}

export default function MobileClientBottomNavigation({
  bugReportOnLeft = false,
}: MobileClientBottomNavigationProps = {}) {
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
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t shadow-lg"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        backgroundColor: COLORS.BACKGROUND_DARK,
        borderColor: COLORS.BORDER_SUBTLE,
      }}
    >
      <div className="flex items-center justify-around py-2 px-1">
        {bugReportOnLeft && (
          <button
            onClick={() => setShowBugReport(true)}
            className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[52px] flex-1 max-w-[120px] p-2 rounded-lg transition-all duration-200 active:scale-95 relative"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            <div className="relative">
              <AlertCircle className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-medium truncate w-full text-center">
              Report Bug
            </span>
          </button>
        )}

        {/* Notifications - short label so it doesn't truncate */}
        <button
          onClick={() => (window.location.href = "/client-notifications")}
          className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[52px] flex-1 max-w-[120px] p-2 rounded-lg transition-all duration-200 active:scale-95 relative"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          <div className="relative">
            <Bell className="h-6 w-6" />
            {!notificationsLoading && unreadNotifications > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1"
                style={{
                  backgroundColor: COLORS.RED_ALERT,
                  color: COLORS.TEXT_PRIMARY,
                }}
              >
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
            {notificationsLoading && (
              <span
                className="absolute -top-0.5 -right-0.5 text-[10px]"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                ...
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium truncate w-full text-center">
            Alerts
          </span>
        </button>

        {/* Messages */}
        <button
          onClick={() => (window.location.href = "/client-messages")}
          className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[52px] flex-1 max-w-[120px] p-2 rounded-lg transition-all duration-200 active:scale-95 relative"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            {!messagesLoading && unreadMessages > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1"
                style={{
                  backgroundColor: COLORS.RED_ALERT,
                  color: COLORS.TEXT_PRIMARY,
                }}
              >
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            )}
            {messagesLoading && (
              <span
                className="absolute -top-0.5 -right-0.5 text-[10px]"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                ...
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium truncate w-full text-center">
            Messages
          </span>
        </button>

        {!bugReportOnLeft && (
          <button
            onClick={() => setShowBugReport(true)}
            className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[52px] flex-1 max-w-[120px] p-2 rounded-lg transition-all duration-200 active:scale-95 relative"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            <div className="relative">
              <AlertCircle className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-medium truncate w-full text-center">
              Report Bug
            </span>
          </button>
        )}
      </div>

      {/* Bug Report Modal */}
      <BugReportModalMobile
        isOpen={showBugReport}
        onClose={() => setShowBugReport(false)}
      />
    </div>
  );
}
