"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import { trpc } from "@/app/_trpc/client";
import { handleNotificationClick } from "@/lib/notification-routing";
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
import { COLORS, getGoldenAccent, getRedAlert } from "@/lib/colors";

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  position?: "above" | "below"; // New prop to control positioning
}

export default function NotificationPopup({
  isOpen,
  onClose,
  buttonRef,
  position = "below", // Default to below for client navbar
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

  // Get notification count (no polling - will add WebSocket support later)
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: false, // NO POLLING
      refetchOnWindowFocus: true, // Only refetch when user returns to tab
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
        top:
          position === "above"
            ? rect.top - 8 // Position above the button with 8px gap
            : rect.bottom + 8, // Position below the button with 8px gap
        left:
          position === "above"
            ? rect.left + rect.width / 2 + 20 // Move 20px right for sidebar
            : rect.left + rect.width / 2, // Keep centered for navbar
      });
    }
  }, [isOpen, buttonRef, position]);

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
        @keyframes slideInUp {
          from {
            transform: translateY(${position === "above" ? "8px" : "-8px"});
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
            transform: translateY(${position === "above" ? "8px" : "-8px"});
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
      `}</style>
      <div
        data-notification-popup
        className={`fixed w-96 h-[500px] max-h-[80vh] rounded-xl shadow-2xl border backdrop-blur-sm z-50 flex flex-col ${
          isAnimating && !isOpen
            ? "animate-[fadeOut_0.2s_ease-in-out_forwards]"
            : isAnimating
            ? "animate-[slideInUp_0.3s_ease-out_forwards]"
            : "transform scale-100 opacity-100"
        }`}
        style={{
          top:
            position === "above"
              ? buttonPosition.top - 500 // Position above (500px is height of popup)
              : buttonPosition.top, // Position below the button
          left:
            typeof window !== "undefined"
              ? Math.max(
                  8,
                  Math.min(buttonPosition.left - 192, window.innerWidth - 400)
                )
              : buttonPosition.left - 192, // Keep within viewport
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          transformOrigin:
            position === "above" ? "bottom center" : "top center",
          animation:
            !isAnimating && isOpen ? "slideInUp 0.3s ease-out" : undefined,
          boxShadow:
            "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(229, 178, 50, 0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            backgroundColor: COLORS.BACKGROUND_CARD,
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col">
              <span
                className="text-sm font-semibold leading-tight"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] leading-tight"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="p-1.5 rounded-lg transition-all duration-200 disabled:opacity-50"
                style={{
                  color: COLORS.TEXT_SECONDARY,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={e => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD_HOVER;
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  }
                }}
                onMouseLeave={e => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  }
                }}
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
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
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            backgroundColor: COLORS.BACKGROUND_DARK,
            scrollbarWidth: "thin",
            scrollbarColor: `${COLORS.BORDER_SUBTLE} transparent`,
          }}
        >
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <div
                className="p-3 rounded-full mb-3"
                style={{
                  backgroundColor: getGoldenAccent(0.1),
                  border: `1px solid ${getGoldenAccent(0.2)}`,
                }}
              >
                <Bell
                  className="h-6 w-6"
                  style={{ color: COLORS.GOLDEN_ACCENT }}
                />
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                No notifications yet
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                You're all caught up!
              </p>
            </div>
          ) : (
            <div
              className="divide-y"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              {(notifications as any[]).map((notification, index) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 transition-all duration-200 cursor-pointer animate-[messageSlideIn_0.3s_ease-out] ${
                    !notification.isRead ? "border-l-4" : ""
                  }`}
                  onClick={() => {
                    handleNotificationClick(
                      notification,
                      {
                        push: (route: string) => (window.location.href = route),
                      },
                      markAsReadMutation
                    );
                  }}
                  style={{
                    backgroundColor: !notification.isRead
                      ? getRedAlert(0.1)
                      : "transparent",
                    borderLeft: !notification.isRead
                      ? `4px solid ${COLORS.RED_ALERT}`
                      : "none",
                    animationDelay: `${index * 30}ms`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = !notification.isRead
                      ? getRedAlert(0.1)
                      : "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4
                          className={`text-sm ${
                            !notification.isRead
                              ? "font-semibold"
                              : "font-medium"
                          } truncate`}
                          style={{
                            color: !notification.isRead
                              ? COLORS.TEXT_PRIMARY
                              : COLORS.TEXT_PRIMARY,
                          }}
                        >
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                            style={{ backgroundColor: COLORS.RED_ALERT }}
                          />
                        )}
                      </div>
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{
                          color: !notification.isRead
                            ? COLORS.TEXT_SECONDARY
                            : COLORS.TEXT_SECONDARY,
                        }}
                      >
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className="text-[10px] flex-shrink-0"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
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
                              className="text-xs font-medium px-2 py-1 rounded transition-all duration-200"
                              style={{
                                color: COLORS.GOLDEN_ACCENT,
                                backgroundColor: getGoldenAccent(0.1),
                                border: `1px solid ${getGoldenAccent(0.2)}`,
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor =
                                  getGoldenAccent(0.2);
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor =
                                  getGoldenAccent(0.1);
                                e.currentTarget.style.transform = "scale(1)";
                              }}
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
                              className="p-1 rounded-lg transition-all duration-200 disabled:opacity-50"
                              style={{
                                color: COLORS.TEXT_SECONDARY,
                                backgroundColor: "transparent",
                              }}
                              onMouseEnter={e => {
                                if (!e.currentTarget.disabled) {
                                  e.currentTarget.style.backgroundColor =
                                    COLORS.BACKGROUND_CARD_HOVER;
                                  e.currentTarget.style.color =
                                    COLORS.TEXT_PRIMARY;
                                }
                              }}
                              onMouseLeave={e => {
                                if (!e.currentTarget.disabled) {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                  e.currentTarget.style.color =
                                    COLORS.TEXT_SECONDARY;
                                }
                              }}
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
            className="px-4 py-3 border-t text-center"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              backgroundColor: COLORS.BACKGROUND_CARD,
            }}
          >
            <button
              onClick={() => {
                // Navigate to the full notifications page
                window.location.href = "/notifications";
              }}
              className="text-sm font-medium transition-all duration-200 px-4 py-2 rounded-lg"
              style={{
                color: COLORS.TEXT_SECONDARY,
                backgroundColor: "transparent",
                border: `1px solid ${COLORS.BORDER_SUBTLE}`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor =
                  COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                e.currentTarget.style.borderColor = getGoldenAccent(0.3);
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              }}
            >
              View all notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
}
