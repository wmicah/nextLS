"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import { trpc } from "@/app/_trpc/client";
// Removed complex SSE hooks - using simple polling instead
import { format } from "date-fns";
import {
  Bell,
  MessageCircle,
  Target,
  Calendar,
  BookOpen,
  TrendingUp,
  Settings,
  X,
  Check,
  CheckCheck,
  User,
} from "lucide-react";

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

export default function NotificationPopup({
  isOpen,
  onClose,
  buttonRef,
}: NotificationPopupProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });

  // Get notifications
  const { data: notifications = [], refetch: refetchNotifications } =
    trpc.notifications.getNotifications.useQuery(
      { limit: 10 },
      {
        enabled: isOpen,
        refetchInterval: false, // No polling!
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      }
    );

  // Simple polling for notification count
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

  // Calculate button position for popup positioning
  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width / 2,
      });
    }
  }, [isOpen, buttonRef]);

  // Animation handling
  useEffect(() => {
    if (isOpen) {
      // Start with animation state true, then animate to visible
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 50); // Shorter delay for smoother animation
      return () => clearTimeout(timer);
    } else {
      // When closing, set to animating state for smooth exit
      setIsAnimating(true);
      return undefined;
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (isOpen && !target.closest("[data-notification-popup]")) {
        onClose();
      }
    }

    // Add a small delay to prevent the click that opened the popup from immediately closing it
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "MESSAGE":
        return <MessageCircle className="h-4 w-4" />;
      case "WORKOUT_ASSIGNED":
      case "WORKOUT_COMPLETED":
        return <Target className="h-4 w-4" />;
      case "LESSON_SCHEDULED":
      case "LESSON_CANCELLED":
        return <Calendar className="h-4 w-4" />;
      case "PROGRAM_ASSIGNED":
        return <BookOpen className="h-4 w-4" />;
      case "PROGRESS_UPDATE":
        return <TrendingUp className="h-4 w-4" />;
      case "CLIENT_JOIN_REQUEST":
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
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

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @keyframes slideInDown {
          from {
            transform: translateY(-8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-8px);
          }
        }
      `}</style>
      <div
        data-notification-popup
        className={`fixed w-80 max-h-96 rounded-lg shadow-lg border z-50 ${
          isAnimating && !isOpen
            ? "animate-[fadeOut_0.2s_ease-in-out_forwards]"
            : isAnimating
            ? "animate-[slideInDown_0.3s_ease-out_forwards]"
            : "transform scale-100 opacity-100"
        }`}
        style={{
          top: buttonPosition.top,
          left:
            typeof window !== "undefined"
              ? Math.max(
                  8,
                  Math.min(buttonPosition.left - 160, window.innerWidth - 328)
                )
              : buttonPosition.left - 160, // Keep within viewport
          backgroundColor: "#353A3A",
          borderColor: "#606364",
          transformOrigin: "top center",
          animation:
            !isAnimating && isOpen ? "slideInDown 0.3s ease-out" : undefined,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: "#606364" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" style={{ color: "#C3BCC2" }} />
              <h3 className="font-semibold" style={{ color: "#C3BCC2" }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="p-1 rounded transition-colors hover:bg-gray-600 disabled:opacity-50"
                  style={{ color: "#ABA4AA" }}
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded transition-colors hover:bg-gray-600"
                style={{ color: "#ABA4AA" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center">
              <Bell
                className="h-8 w-8 mx-auto mb-2 opacity-50"
                style={{ color: "#ABA4AA" }}
              />
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#606364" }}>
              {(notifications as any[]).map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors cursor-pointer ${
                    !notification.isRead
                      ? "bg-blue-500/10 border-l-2 border-blue-500"
                      : ""
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsReadMutation.mutate({
                        notificationId: notification.id,
                      });
                    }
                  }}
                  style={{
                    backgroundColor: !notification.isRead
                      ? "#4A5A70"
                      : "transparent",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 ${getNotificationColor(
                        notification.type
                      )}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-sm font-medium ${
                            !notification.isRead ? "font-semibold" : ""
                          }`}
                          style={{ color: "#C3BCC2" }}
                        >
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{ color: "#ABA4AA" }}
                      >
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs" style={{ color: "#ABA4AA" }}>
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          {notification.type === "CLIENT_JOIN_REQUEST" && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                // Navigate to clients page
                                window.location.href = "/clients";
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                              title="View client"
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
                              className="p-1 rounded transition-colors hover:bg-gray-600 disabled:opacity-50"
                              style={{ color: "#ABA4AA" }}
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3" />
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

        {/* Footer */}
        {notifications.length > 0 && (
          <div
            className="p-3 border-t text-center"
            style={{ borderColor: "#606364" }}
          >
            <button
              onClick={() => {
                // Navigate to the full notifications page
                window.location.href = "/notifications";
              }}
              className="text-sm transition-colors hover:text-blue-400"
              style={{ color: "#ABA4AA" }}
            >
              View all notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
}
