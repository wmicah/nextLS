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
  Filter,
  Search,
  MoreVertical,
  Archive,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMobileDetection } from "@/lib/mobile-detection";

interface NotificationsPageProps {}

export default function NotificationsPage({}: NotificationsPageProps) {
  const router = useRouter();
  const { isMobile } = useMobileDetection();
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
  const [showSettings, setShowSettings] = useState(false);

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
        label: "Workout Assigned",
      },
      WORKOUT_COMPLETED: {
        icon: CheckCircle,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/20",
        category: "programs",
        label: "Workout Completed",
      },
      LESSON_SCHEDULED: {
        icon: Calendar,
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/20",
        category: "lessons",
        label: "Lesson Scheduled",
      },
      LESSON_CANCELLED: {
        icon: XCircle,
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
        category: "lessons",
        label: "Lesson Cancelled",
      },
      SCHEDULE_REQUEST: {
        icon: Calendar,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20",
        category: "lessons",
        label: "Schedule Request",
      },
      PROGRAM_ASSIGNED: {
        icon: BookOpen,
        color: "text-orange-400",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/20",
        category: "programs",
        label: "Program Assigned",
      },
      PROGRESS_UPDATE: {
        icon: TrendingUp,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/20",
        category: "programs",
        label: "Progress Update",
      },
      CLIENT_JOIN_REQUEST: {
        icon: User,
        color: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
        category: "clients",
        label: "Client Request",
      },
    };

    return (
      typeInfo[type as keyof typeof typeInfo] || {
        icon: Bell,
        color: "text-gray-400",
        bgColor: "bg-gray-500/10",
        borderColor: "border-gray-500/20",
        category: "general",
        label: "Notification",
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
      return format(notificationDate, "MMM d, yyyy");
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
        groupKey = format(date, "MMMM yyyy");
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
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#2A3133] border-b border-[#606364] px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
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
              <div className="relative">
                <Bell className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <h1
                  className="text-xl font-semibold"
                  style={{ color: "#C3BCC2" }}
                >
                  Notifications
                </h1>
                <p className="text-sm" style={{ color: "#ABA4AA" }}>
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedNotifications.length > 0 && (
              <div className="flex items-center gap-2 mr-4">
                <span className="text-sm" style={{ color: "#ABA4AA" }}>
                  {selectedNotifications.length} selected
                </span>
                <button
                  onClick={handleBulkMarkAsRead}
                  disabled={markAsReadMutation.isPending}
                  className="px-3 py-2 rounded-lg transition-colors hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                  style={{ color: "#C3BCC2" }}
                >
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Mark Read</span>
                </button>
              </div>
            )}

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                style={{ color: "#C3BCC2" }}
              >
                <CheckCheck className="h-4 w-4" />
                <span className="text-sm">Mark All Read</span>
              </button>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg transition-colors hover:bg-gray-700"
              style={{ color: "#C3BCC2" }}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
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

          {/* Filter Tabs */}
          <div className="flex items-center gap-1">
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
      </div>

      {/* Bulk Selection Header */}
      {selectedNotifications.length > 0 && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
                {selectedNotifications.length === filteredNotifications.length
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkMarkAsRead}
                disabled={markAsReadMutation.isPending}
                className="px-3 py-1 rounded text-sm transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                style={{ color: "#60A5FA" }}
              >
                Mark as Read
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleteMultipleNotificationsMutation.isPending}
                className="px-3 py-1 rounded text-sm transition-colors hover:bg-red-500/20 disabled:opacity-50"
                style={{ color: "#F87171" }}
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12">
            <div className="text-center">
              <Bell
                className="h-16 w-16 mx-auto mb-4 opacity-30"
                style={{ color: "#ABA4AA" }}
              />
              <h3
                className="text-lg font-medium mb-2"
                style={{ color: "#C3BCC2" }}
              >
                {searchQuery
                  ? "No notifications found"
                  : filter === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"}
              </h3>
              <p
                className="text-sm text-center max-w-md"
                style={{ color: "#ABA4AA" }}
              >
                {searchQuery
                  ? "Try adjusting your search terms"
                  : filter === "unread"
                  ? "You're all caught up! New notifications will appear here."
                  : "You'll see notifications here when they arrive."}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4">
            {Object.entries(groupedNotifications).map(
              ([dateGroup, groupNotifications]) => (
                <div key={dateGroup} className="mb-8">
                  {/* Date Group Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <h2
                      className="text-sm font-semibold uppercase tracking-wide"
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
                  <div className="space-y-3">
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
                          className={`group relative rounded-xl border transition-all duration-200 hover:shadow-lg cursor-pointer ${
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
                          <div className="p-4">
                            <div className="flex items-start gap-4">
                              {/* Selection Checkbox */}
                              <div className="flex-shrink-0 pt-1">
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
                                className={`flex-shrink-0 p-3 rounded-lg ${typeInfo.bgColor}`}
                              >
                                <IconComponent
                                  className={`h-5 w-5 ${typeInfo.color}`}
                                />
                              </div>

                              {/* Notification Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4
                                        className={`text-base font-medium ${
                                          !notification.isRead
                                            ? "font-semibold"
                                            : ""
                                        }`}
                                        style={{ color: "#C3BCC2" }}
                                      >
                                        {notification.title}
                                      </h4>
                                      <span
                                        className="text-xs px-2 py-1 rounded-full"
                                        style={{
                                          backgroundColor: "#606364",
                                          color: "#ABA4AA",
                                        }}
                                      >
                                        {typeInfo.label}
                                      </span>
                                      {!notification.isRead && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                      )}
                                    </div>
                                    <p
                                      className="text-sm mb-3 line-clamp-2"
                                      style={{ color: "#ABA4AA" }}
                                    >
                                      {notification.message}
                                    </p>
                                  </div>

                                  {/* Time and Actions */}
                                  <div className="flex items-center gap-2">
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
                                      className={`p-2 rounded-lg transition-colors hover:bg-gray-600 disabled:opacity-50 ${
                                        !notification.isRead
                                          ? "opacity-100"
                                          : "opacity-0 group-hover:opacity-100"
                                      }`}
                                      style={{ color: "#ABA4AA" }}
                                      title="Mark as read"
                                    >
                                      {!notification.isRead ? (
                                        <Eye className="h-4 w-4" />
                                      ) : (
                                        <EyeOff className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Action Buttons for Specific Types */}
                                {notification.type ===
                                  "CLIENT_JOIN_REQUEST" && (
                                  <div className="flex items-center gap-2 mt-3">
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        router.push("/clients");
                                      }}
                                      className="px-3 py-1 text-sm rounded-lg transition-colors hover:bg-blue-500/20"
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
