"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { format } from "date-fns";
import {
  Bell,
  MessageCircle,
  Target,
  Calendar,
  BookOpen,
  TrendingUp,
  Settings,
  Check,
  CheckCheck,
  User,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMobileDetection } from "@/lib/mobile-detection";

interface NotificationsPageProps {}

export default function NotificationsPage({}: NotificationsPageProps) {
  const router = useRouter();
  const { isMobile } = useMobileDetection();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Get notifications with higher limit for full page
  const { data: notifications = [], refetch: refetchNotifications } =
    trpc.notifications.getNotifications.useQuery(
      { limit: 50 },
      {
        refetchInterval: 30000, // Poll every 30 seconds
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      }
    );

  // Get unread count
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 10000, // Poll every 10 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
    },
  });

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "MESSAGE":
        return <MessageCircle className="h-5 w-5" />;
      case "WORKOUT_ASSIGNED":
      case "WORKOUT_COMPLETED":
        return <Target className="h-5 w-5" />;
      case "LESSON_SCHEDULED":
      case "LESSON_CANCELLED":
        return <Calendar className="h-5 w-5" />;
      case "PROGRAM_ASSIGNED":
        return <BookOpen className="h-5 w-5" />;
      case "PROGRESS_UPDATE":
        return <TrendingUp className="h-5 w-5" />;
      case "CLIENT_JOIN_REQUEST":
        return <User className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "MESSAGE":
        return "text-blue-400";
      case "WORKOUT_ASSIGNED":
        return "text-green-400";
      case "WORKOUT_COMPLETED":
        return "text-emerald-400";
      case "LESSON_SCHEDULED":
        return "text-purple-400";
      case "LESSON_CANCELLED":
        return "text-red-400";
      case "PROGRAM_ASSIGNED":
        return "text-orange-400";
      case "PROGRESS_UPDATE":
        return "text-cyan-400";
      case "CLIENT_JOIN_REQUEST":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  // Format notification time
  const formatNotificationTime = (date: string) => {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffInHours =
      (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return format(notificationDate, "MMM d");
    }
  };

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter((notification: any) => {
    if (filter === "unread") {
      return !notification.isRead;
    }
    return true;
  });

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsReadMutation.mutate({
        notificationId: notification.id,
      });
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "MESSAGE":
        // Navigate to messages page
        router.push("/messages");
        break;
      case "CLIENT_JOIN_REQUEST":
        // Navigate to clients page
        router.push("/clients");
        break;
      case "WORKOUT_ASSIGNED":
      case "WORKOUT_COMPLETED":
        // Navigate to program page
        router.push("/programs");
        break;
      case "LESSON_SCHEDULED":
      case "LESSON_CANCELLED":
      case "SCHEDULE_REQUEST":
        // Navigate to schedule page
        router.push("/schedule");
        break;
      default:
        // Default to dashboard
        router.push("/dashboard");
        break;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#2A3133" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#2A3133] border-b border-[#606364] px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg transition-colors hover:bg-gray-700"
                style={{ color: "#C3BCC2" }}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6" style={{ color: "#C3BCC2" }} />
              <h1
                className="text-xl font-semibold"
                style={{ color: "#C3BCC2" }}
              >
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm rounded-full px-2 py-1 min-w-[24px] text-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="px-3 py-2 rounded-lg transition-colors hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                style={{ color: "#C3BCC2" }}
              >
                <CheckCheck className="h-4 w-4" />
                <span className="text-sm">Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-500 text-white"
                : "text-gray-500 hover:text-white hover:bg-gray-600"
            }`}
            style={{
              backgroundColor: filter === "all" ? "#3B82F6" : "#374151",
              color: filter === "all" ? "#FFFFFF" : "#9CA3AF",
            }}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "unread"
                ? "bg-blue-500 text-white"
                : "text-gray-500 hover:text-white hover:bg-gray-600"
            }`}
            style={{
              backgroundColor: filter === "unread" ? "#3B82F6" : "#374151",
              color: filter === "unread" ? "#FFFFFF" : "#9CA3AF",
            }}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-12">
            <Bell
              className="h-12 w-12 mb-3 opacity-50"
              style={{ color: "#ABA4AA" }}
            />
            <h3
              className="text-base font-medium mb-2"
              style={{ color: "#C3BCC2" }}
            >
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </h3>
            <p className="text-sm text-center" style={{ color: "#ABA4AA" }}>
              {filter === "unread"
                ? "You're all caught up!"
                : "You'll see notifications here when they arrive."}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#606364" }}>
            {filteredNotifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`p-4 transition-colors cursor-pointer hover:bg-gray-800/50 ${
                  !notification.isRead
                    ? "bg-blue-500/10 border-l-4 border-blue-500"
                    : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-1 flex-shrink-0 ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-base font-medium ${
                          !notification.isRead ? "font-semibold" : ""
                        }`}
                        style={{ color: "#C3BCC2" }}
                      >
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p
                      className="text-sm mt-1 line-clamp-3"
                      style={{ color: "#ABA4AA" }}
                    >
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm" style={{ color: "#ABA4AA" }}>
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        {notification.type === "CLIENT_JOIN_REQUEST" && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              router.push("/clients");
                            }}
                            className="text-sm text-blue-400 hover:text-blue-300 font-medium px-3 py-1 rounded-lg hover:bg-blue-500/10 transition-colors"
                          >
                            View Client
                          </button>
                        )}
                        {!notification.isRead && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              markAsReadMutation.mutate({
                                notificationId: notification.id,
                              });
                            }}
                            disabled={markAsReadMutation.isPending}
                            className="p-2 rounded-lg transition-colors hover:bg-gray-600 disabled:opacity-50"
                            style={{ color: "#ABA4AA" }}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
