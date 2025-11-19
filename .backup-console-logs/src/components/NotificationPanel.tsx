"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  handleNotificationClick,
  getNotificationAction as getSmartNotificationAction,
} from "@/lib/notification-routing";
// Removed complex SSE hooks - using simple polling instead
import {
  Bell,
  X,
  UserPlus,
  MessageCircle,
  Calendar,
  Target,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({
  isOpen,
  onClose,
}: NotificationPanelProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { data: notifications = [], refetch } =
    trpc.user.getNotifications.useQuery({
      limit: 20,
      unreadOnly: false,
    }) as { data: any[]; refetch: () => void };

  // Simple polling for notification count
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 10000, // Poll every 10 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  const markAsRead = trpc.user.markNotificationRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleMarkAsRead = async (notificationId: string) => {
    setIsLoading(true);
    try {
      await markAsRead.mutateAsync({ notificationId });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "CLIENT_JOIN_REQUEST":
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case "MESSAGE":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "LESSON_SCHEDULED":
      case "LESSON_CANCELLED":
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case "WORKOUT_ASSIGNED":
      case "WORKOUT_COMPLETED":
        return <Target className="w-5 h-5 text-orange-500" />;
      case "PROGRAM_ASSIGNED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationAction = (notification: any) => {
    // Use smart routing to get the appropriate action
    const action = getSmartNotificationAction(notification);
    if (action) {
      return (
        <button
          onClick={() => {
            window.location.href = action.route;
          }}
          className="text-sm text-blue-500 hover:text-blue-600 font-medium"
        >
          {action.text}
        </button>
      );
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4">
      <div className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>
                            {getNotificationAction(notification)}
                          </div>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={isLoading}
                            className="text-xs text-blue-500 hover:text-blue-600 font-medium ml-2"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
