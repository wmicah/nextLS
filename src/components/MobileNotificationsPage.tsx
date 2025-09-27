"use client";

import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/app/_trpc/client";
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
        router.push("/messages");
        break;
      case "CLIENT_JOIN_REQUEST":
        router.push("/clients");
        break;
      case "WORKOUT_ASSIGNED":
      case "WORKOUT_COMPLETED":
      case "PROGRAM_ASSIGNED":
      case "PROGRESS_UPDATE":
        router.push("/programs");
        break;
      case "LESSON_SCHEDULED":
      case "LESSON_CANCELLED":
      case "SCHEDULE_REQUEST":
        router.push("/schedule");
        break;
      default:
        router.push("/dashboard");
        break;
    }
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
    <div className="flex flex-col overflow-x-hidden">
      {/* Mobile Header */}
      <div className="sticky top-0 z-20 bg-[#2A3133] border-b border-[#606364] px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg transition-colors hover:bg-gray-700 touch-manipulation"
              style={{ color: "#C3BCC2" }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <h1
                  className="text-lg font-semibold"
                  style={{ color: "#C3BCC2" }}
                >
                  Notifications
                </h1>
                <p className="text-xs" style={{ color: "#ABA4AA" }}>
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedNotifications.length > 0 && (
              <button
                onClick={handleBulkMarkAsRead}
                disabled={markAsReadMutation.isPending}
                className="px-3 py-2 rounded-lg transition-colors hover:bg-gray-700 disabled:opacity-50 touch-manipulation"
                style={{ color: "#C3BCC2" }}
              >
                <Check className="h-4 w-4" />
              </button>
            )}

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="p-2 rounded-lg transition-colors hover:bg-gray-700 disabled:opacity-50 touch-manipulation"
                style={{ color: "#C3BCC2" }}
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-lg transition-colors hover:bg-gray-700 touch-manipulation"
              style={{ color: "#C3BCC2" }}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative mb-3">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
              style={{ color: "#ABA4AA" }}
            />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "#1A1D1E",
                borderColor: "#606364",
                color: "#C3BCC2",
                focusRingColor: "#4A5A70",
              }}
            />
          </div>
        )}

        {/* Filter Tabs - Mobile Optimized */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { key: "all", label: "All", count: filterCounts.all },
            { key: "unread", label: "Unread", count: filterCounts.unread },
            {
              key: "messages",
              label: "Messages",
              count: filterCounts.messages,
            },
            { key: "lessons", label: "Lessons", count: filterCounts.lessons },
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
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                filter === key
                  ? "text-white"
                  : "text-gray-500 hover:text-white hover:bg-gray-600"
              }`}
              style={{
                backgroundColor: filter === key ? "#4A5A70" : "transparent",
                color: filter === key ? "#FFFFFF" : "#9CA3AF",
              }}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Selection Header */}
      {selectedNotifications.length > 0 && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  selectedNotifications.length === filteredNotifications.length
                }
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-2 border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span
                className="text-sm font-medium"
                style={{ color: "#C3BCC2" }}
              >
                {selectedNotifications.length}
              </span>
            </div>
            <button
              onClick={handleBulkMarkAsRead}
              disabled={markAsReadMutation.isPending}
              className="text-sm transition-colors hover:bg-blue-500/20 disabled:opacity-50 px-2 py-1 rounded"
              style={{ color: "#60A5FA" }}
            >
              Mark Read
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={deleteMultipleNotificationsMutation.isPending}
              className="text-sm transition-colors hover:bg-red-500/20 disabled:opacity-50 px-2 py-1 rounded"
              style={{ color: "#F87171" }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Notifications List - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-8">
            <div className="text-center">
              <Bell
                className="h-12 w-12 mx-auto mb-3 opacity-30"
                style={{ color: "#ABA4AA" }}
              />
              <h3
                className="text-base font-medium mb-2"
                style={{ color: "#C3BCC2" }}
              >
                {searchQuery
                  ? "No notifications found"
                  : filter === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"}
              </h3>
              <p className="text-sm text-center" style={{ color: "#ABA4AA" }}>
                {searchQuery
                  ? "Try adjusting your search terms"
                  : filter === "unread"
                  ? "You're all caught up!"
                  : "You'll see notifications here when they arrive."}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            {Object.entries(groupedNotifications).map(
              ([dateGroup, groupNotifications]) => (
                <div key={dateGroup} className="mb-6">
                  {/* Date Group Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <h2
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#ABA4AA" }}
                    >
                      {dateGroup}
                    </h2>
                    <div
                      className="flex-1 h-px"
                      style={{ backgroundColor: "#606364" }}
                    ></div>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ backgroundColor: "#606364", color: "#ABA4AA" }}
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
                          className={`group relative rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer touch-manipulation ${
                            !notification.isRead
                              ? `${typeInfo.bgColor} ${typeInfo.borderColor} border-l-4`
                              : "border-gray-600/50 hover:border-gray-500"
                          } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
                          style={{
                            backgroundColor: !notification.isRead
                              ? "#1A1D1E"
                              : "#2A3133",
                          }}
                          onClick={() => handleNotificationClick(notification)}
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
                                    handleSelectNotification(notification.id);
                                  }}
                                  className="w-4 h-4 rounded border-2 border-gray-300 text-blue-500 focus:ring-blue-500"
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
                                        style={{ color: "#C3BCC2" }}
                                      >
                                        {notification.title}
                                      </h4>
                                      <span
                                        className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                                        style={{
                                          backgroundColor: "#606364",
                                          color: "#ABA4AA",
                                        }}
                                      >
                                        {typeInfo.label}
                                      </span>
                                      {!notification.isRead && (
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                                      )}
                                    </div>
                                    <p
                                      className="text-xs mb-2 line-clamp-2"
                                      style={{ color: "#ABA4AA" }}
                                    >
                                      {notification.message}
                                    </p>
                                  </div>

                                  {/* Time and Actions */}
                                  <div className="flex items-center gap-1">
                                    <span
                                      className="text-xs"
                                      style={{ color: "#ABA4AA" }}
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
                                      disabled={markAsReadMutation.isPending}
                                      className={`p-1 rounded transition-colors hover:bg-gray-600 disabled:opacity-50 ${
                                        !notification.isRead
                                          ? "opacity-100"
                                          : "opacity-0 group-hover:opacity-100"
                                      }`}
                                      style={{ color: "#ABA4AA" }}
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
                                      className="px-2 py-1 text-xs rounded transition-colors hover:bg-blue-500/20"
                                      style={{ color: "#60A5FA" }}
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
  );
}
