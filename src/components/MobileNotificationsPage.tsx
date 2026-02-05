"use client";

import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/app/_trpc/client";
import { handleNotificationClick } from "@/lib/notification-routing";
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
} from "date-fns";
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
  Search,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import MobileNavigation from "./MobileNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";
import MobileClientNavigation from "./MobileClientNavigation";
import MobileClientBottomNavigation from "./MobileClientBottomNavigation";
import { COLORS, getGoldenAccent } from "@/lib/colors";

interface MobileNotificationsPageProps {}

export default function MobileNotificationsPage({}: MobileNotificationsPageProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<
    "all" | "unread" | "messages" | "lessons" | "programs"
  >("all");

  // Get user profile to determine role
  const { data: userProfile } = trpc.user.getProfile.useQuery();
  const isCoach = userProfile?.role === "COACH";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [showSearch, setShowSearch] = useState(false);

  // Get notifications with higher limit for full page
  const { data: notifications = [], refetch: refetchNotifications } =
    trpc.notifications.getNotifications.useQuery(
      { limit: 100 },
      {
        refetchInterval: 30000, // Poll every 30 seconds
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      }
    );

  // Get unread count (no polling - will add WebSocket support later)
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
      setSelectedNotifications([]);
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      setSelectedNotifications([]);
    },
  });

  const deleteMultipleNotificationsMutation =
    trpc.notifications.deleteMultipleNotifications.useMutation({
      onSuccess: () => {
        refetchNotifications();
        setSelectedNotifications([]);
      },
    });

  // Get notification icon and color based on type
  const getNotificationTypeInfo = (type: string) => {
    const typeInfo = {
      MESSAGE: {
        icon: MessageCircle,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
        category: "messages",
        label: "Message",
      },
      WORKOUT_ASSIGNED: {
        icon: Target,
        color: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
        category: "programs",
        label: "Workout",
      },
      WORKOUT_COMPLETED: {
        icon: CheckCircle,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/20",
        category: "programs",
        label: "Completed",
      },
      LESSON_SCHEDULED: {
        icon: Calendar,
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/20",
        category: "lessons",
        label: "Lesson",
      },
      LESSON_CANCELLED: {
        icon: XCircle,
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
        category: "lessons",
        label: "Cancelled",
      },
      SCHEDULE_REQUEST: {
        icon: Calendar,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20",
        category: "lessons",
        label: "Request",
      },
      PROGRAM_ASSIGNED: {
        icon: BookOpen,
        color: "text-orange-400",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/20",
        category: "programs",
        label: "Program",
      },
      PROGRESS_UPDATE: {
        icon: TrendingUp,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/20",
        category: "programs",
        label: "Progress",
      },
      CLIENT_JOIN_REQUEST: {
        icon: User,
        color: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
        category: "clients",
        label: "Client",
      },
    };

    return (
      typeInfo[type as keyof typeof typeInfo] || {
        icon: Bell,
        color: "text-gray-400",
        bgColor: "bg-gray-500/10",
        borderColor: "border-gray-500/20",
        category: "general",
        label: "Alert",
      }
    );
  };

  // Format notification time with better granularity
  const formatNotificationTime = (date: string) => {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - notificationDate.getTime()) / (1000 * 60)
    );
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return format(notificationDate, "MMM d");
    }
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifications: any[]) => {
    const groups: { [key: string]: any[] } = {};

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      let groupKey: string;

      if (isToday(date)) {
        groupKey = "Today";
      } else if (isYesterday(date)) {
        groupKey = "Yesterday";
      } else if (isThisWeek(date)) {
        groupKey = "This Week";
      } else if (isThisMonth(date)) {
        groupKey = "This Month";
      } else {
        groupKey = format(date, "MMM yyyy");
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  };

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply category filter
    if (filter !== "all") {
      filtered = filtered.filter((notification: any) => {
        const typeInfo = getNotificationTypeInfo(notification.type);
        return typeInfo.category === filter;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (notification: any) =>
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query)
      );
    }

    // Apply unread filter
    if (filter === "unread") {
      filtered = filtered.filter((notification: any) => !notification.isRead);
    }

    return filtered.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, filter, searchQuery]);

  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(filteredNotifications),
    [filteredNotifications]
  );

  // Handle notification click using smart routing (client routes when viewer is client)
  const handleNotificationClickWrapper = (notification: any) => {
    handleNotificationClick(notification, router, markAsReadMutation, {
      forClient: !isCoach,
    });
  };

  // Handle bulk actions
  const handleBulkMarkAsRead = () => {
    selectedNotifications.forEach(id => {
      markAsReadMutation.mutate({ notificationId: id });
    });
  };

  const handleBulkDelete = () => {
    if (selectedNotifications.length > 0) {
      deleteMultipleNotificationsMutation.mutate({
        notificationIds: selectedNotifications,
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n: any) => n.id));
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev =>
      prev.includes(id)
        ? prev.filter(notificationId => notificationId !== id)
        : [...prev, id]
    );
  };

  // Get filter counts
  const getFilterCounts = () => {
    const counts = {
      all: notifications.length,
      unread: notifications.filter((n: any) => !n.isRead).length,
      messages: notifications.filter(
        (n: any) => getNotificationTypeInfo(n.type).category === "messages"
      ).length,
      lessons: notifications.filter(
        (n: any) => getNotificationTypeInfo(n.type).category === "lessons"
      ).length,
      programs: isCoach
        ? 0
        : notifications.filter(
            (n: any) => getNotificationTypeInfo(n.type).category === "programs"
          ).length,
    };
    return counts;
  };

  const filterCounts = getFilterCounts();

  return (
    <div
      className="min-h-[100dvh] overscroll-none"
      style={{
        backgroundColor: COLORS.BACKGROUND_DARK,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Mobile Header - safe area for notch/status bar */}
      <div
        className="fixed left-0 right-0 z-50 border-b px-4 pb-3"
        style={{
          top: 0,
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          paddingTop:
            "max(0.75rem, calc(0.75rem + env(safe-area-inset-top, 0px)))",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: getGoldenAccent(0.2),
                borderWidth: 1,
                borderColor: COLORS.BORDER_ACCENT,
                minWidth: 44,
                minHeight: 44,
              }}
            >
              <Bell
                className="h-5 w-5"
                style={{ color: COLORS.GOLDEN_ACCENT }}
              />
            </div>
            <div className="min-w-0">
              <h1
                className="text-lg font-bold truncate"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Notifications
              </h1>
              <p
                className="text-sm truncate"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>
          {isCoach ? (
            <MobileNavigation currentPage="notifications" />
          ) : (
            <MobileClientNavigation currentPage="notifications" />
          )}
        </div>
      </div>

      {/* Main Content - pt clears fixed header */}
      <div className="flex-1 flex flex-col pt-20 overscroll-none">
        {/* Quick Actions */}
        <div
          className="flex-shrink-0 p-4 border-b"
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            backgroundColor: COLORS.BACKGROUND_DARK,
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {selectedNotifications.length > 0 && (
              <button
                onClick={handleBulkMarkAsRead}
                disabled={markAsReadMutation.isPending}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation"
                style={{
                  backgroundColor: COLORS.GREEN_PRIMARY,
                  color: COLORS.TEXT_PRIMARY,
                }}
              >
                <Check className="h-4 w-4" />
                Mark Read
              </button>
            )}

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  color: COLORS.TEXT_SECONDARY,
                  borderWidth: 1,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </button>
            )}

            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] touch-manipulation"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                color: COLORS.TEXT_SECONDARY,
                borderWidth: 1,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>

        {/* Scrollable content - bottom padding clears bottom nav + safe area when client */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            paddingBottom: isCoach
              ? "5rem"
              : "max(5rem, calc(5rem + env(safe-area-inset-bottom, 0px)))",
          }}
        >
          <div className="p-4 space-y-4">
            {/* Search */}
            {showSearch && (
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: COLORS.TEXT_MUTED }}
                />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#E5B232]/40 focus:border-[#E5B232]/60 placeholder:text-[#606364] text-base min-h-[44px] touch-manipulation"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                    fontSize: 16,
                  }}
                />
              </div>
            )}

            {/* Filter Tabs - Mobile Optimized */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1">
              {[
                { key: "all", label: "All", count: filterCounts.all },
                { key: "unread", label: "Unread", count: filterCounts.unread },
                {
                  key: "messages",
                  label: "Messages",
                  count: filterCounts.messages,
                },
                {
                  key: "lessons",
                  label: "Lessons",
                  count: filterCounts.lessons,
                },
                // Only show programs filter for clients
                ...(isCoach
                  ? []
                  : [
                      {
                        key: "programs",
                        label: "Programs",
                        count: filterCounts.programs,
                      },
                    ]),
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className="flex-shrink-0 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation min-h-[44px]"
                  style={{
                    backgroundColor:
                      filter === key ? getGoldenAccent(0.2) : "transparent",
                    color:
                      filter === key
                        ? COLORS.GOLDEN_ACCENT
                        : COLORS.TEXT_SECONDARY,
                    borderWidth: 1,
                    borderColor:
                      filter === key ? COLORS.BORDER_ACCENT : "transparent",
                  }}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            {/* Bulk Selection Header */}
            {selectedNotifications.length > 0 && (
              <div
                className="rounded-lg p-3 border"
                style={{
                  backgroundColor: `${COLORS.BLUE_PRIMARY}18`,
                  borderColor: `${COLORS.BLUE_PRIMARY}40`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        selectedNotifications.length ===
                        filteredNotifications.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-2 focus:ring-2 focus:ring-offset-0"
                      style={{
                        borderColor: COLORS.BORDER_SUBTLE,
                        accentColor: COLORS.BLUE_PRIMARY,
                      }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {selectedNotifications.length} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkMarkAsRead}
                      disabled={markAsReadMutation.isPending}
                      className="text-sm transition-colors disabled:opacity-50 px-2 py-1 rounded min-h-[36px] touch-manipulation"
                      style={{ color: COLORS.BLUE_PRIMARY }}
                    >
                      Mark Read
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={deleteMultipleNotificationsMutation.isPending}
                      className="text-sm transition-colors disabled:opacity-50 px-2 py-1 rounded min-h-[36px] touch-manipulation"
                      style={{ color: COLORS.RED_ALERT }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications List - Mobile Optimized */}
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] px-4 py-12">
                <div className="text-center">
                  <Bell
                    className="h-12 w-12 mx-auto mb-3 opacity-40"
                    style={{ color: COLORS.TEXT_MUTED }}
                  />
                  <h3
                    className="text-base font-medium mb-2"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {searchQuery
                      ? "No notifications found"
                      : filter === "unread"
                        ? "No unread notifications"
                        : "No notifications yet"}
                  </h3>
                  <p
                    className="text-sm text-center"
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : filter === "unread"
                        ? "You're all caught up!"
                        : "You'll see notifications here when they arrive."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-1 py-3">
                {Object.entries(groupedNotifications).map(
                  ([dateGroup, groupNotifications]) => (
                    <div key={dateGroup} className="mb-6">
                      {/* Date Group Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <h2
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          {dateGroup}
                        </h2>
                        <div
                          className="flex-1 h-px"
                          style={{ backgroundColor: COLORS.BORDER_SUBTLE }}
                        />
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_CARD,
                            color: COLORS.TEXT_MUTED,
                            borderWidth: 1,
                            borderColor: COLORS.BORDER_SUBTLE,
                          }}
                        >
                          {groupNotifications.length}
                        </span>
                      </div>

                      {/* Notifications in Group */}
                      <div className="space-y-2">
                        {groupNotifications.map((notification: any) => {
                          const typeInfo = getNotificationTypeInfo(
                            notification.type
                          );
                          const IconComponent = typeInfo.icon;
                          const isSelected = selectedNotifications.includes(
                            notification.id
                          );

                          return (
                            <div
                              key={notification.id}
                              className={`group relative rounded-lg border transition-all duration-200 cursor-pointer touch-manipulation min-h-[52px] ${
                                !notification.isRead
                                  ? `${typeInfo.bgColor} ${typeInfo.borderColor} border-l-4`
                                  : ""
                              }`}
                              style={{
                                backgroundColor: !notification.isRead
                                  ? COLORS.BACKGROUND_CARD
                                  : COLORS.BACKGROUND_DARK,
                                borderColor: !notification.isRead
                                  ? undefined
                                  : COLORS.BORDER_SUBTLE,
                                ...(isSelected
                                  ? {
                                      boxShadow: `0 0 0 2px ${COLORS.BLUE_PRIMARY}`,
                                    }
                                  : {}),
                              }}
                              onClick={() =>
                                handleNotificationClickWrapper(notification)
                              }
                            >
                              <div className="p-3">
                                <div className="flex items-start gap-3">
                                  {/* Selection Checkbox */}
                                  <div className="flex-shrink-0 pt-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onClick={e => {
                                        e.stopPropagation();
                                      }}
                                      onChange={e => {
                                        e.stopPropagation();
                                        handleSelectNotification(
                                          notification.id
                                        );
                                      }}
                                      className="w-4 h-4 rounded border-2 focus:ring-2 focus:ring-offset-0"
                                      style={{
                                        borderColor: COLORS.BORDER_SUBTLE,
                                        accentColor: COLORS.BLUE_PRIMARY,
                                      }}
                                    />
                                  </div>

                                  {/* Notification Icon */}
                                  <div
                                    className={`flex-shrink-0 p-2 rounded-lg ${typeInfo.bgColor}`}
                                  >
                                    <IconComponent
                                      className={`h-4 w-4 ${typeInfo.color}`}
                                    />
                                  </div>

                                  {/* Notification Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4
                                            className={`text-sm font-medium truncate ${
                                              !notification.isRead
                                                ? "font-semibold"
                                                : ""
                                            }`}
                                            style={{
                                              color: COLORS.TEXT_PRIMARY,
                                            }}
                                          >
                                            {notification.title}
                                          </h4>
                                          <span
                                            className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                                            style={{
                                              backgroundColor:
                                                COLORS.BACKGROUND_CARD,
                                              color: COLORS.TEXT_MUTED,
                                              borderWidth: 1,
                                              borderColor: COLORS.BORDER_SUBTLE,
                                            }}
                                          >
                                            {typeInfo.label}
                                          </span>
                                          {!notification.isRead && (
                                            <div
                                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                              style={{
                                                backgroundColor:
                                                  COLORS.BLUE_PRIMARY,
                                              }}
                                            />
                                          )}
                                        </div>
                                        <p
                                          className="text-xs mb-2 line-clamp-2"
                                          style={{ color: COLORS.TEXT_MUTED }}
                                        >
                                          {notification.message}
                                        </p>
                                      </div>

                                      {/* Time and Actions */}
                                      <div className="flex items-center gap-1">
                                        <span
                                          className="text-xs"
                                          style={{ color: COLORS.TEXT_MUTED }}
                                        >
                                          {formatNotificationTime(
                                            notification.createdAt
                                          )}
                                        </span>
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            if (!notification.isRead) {
                                              markAsReadMutation.mutate({
                                                notificationId: notification.id,
                                              });
                                            }
                                          }}
                                          disabled={
                                            markAsReadMutation.isPending
                                          }
                                          className={`p-1.5 rounded min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors disabled:opacity-50 touch-manipulation ${
                                            !notification.isRead
                                              ? "opacity-100"
                                              : "opacity-0 group-hover:opacity-100"
                                          }`}
                                          style={{
                                            color: COLORS.TEXT_MUTED,
                                          }}
                                          title="Mark as read"
                                        >
                                          {!notification.isRead ? (
                                            <Eye className="h-3 w-3" />
                                          ) : (
                                            <EyeOff className="h-3 w-3" />
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Action Buttons for Specific Types */}
                                    {notification.type ===
                                      "CLIENT_JOIN_REQUEST" && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            router.push("/clients");
                                          }}
                                          className="px-2 py-1.5 text-xs rounded min-h-[32px] touch-manipulation transition-colors"
                                          style={{
                                            color: COLORS.BLUE_PRIMARY,
                                            backgroundColor: `${COLORS.BLUE_PRIMARY}20`,
                                          }}
                                        >
                                          View Client
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {isCoach ? <MobileBottomNavigation /> : <MobileClientBottomNavigation />}
    </div>
  );
}
