"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import {
  Bell,
  Users,
  TrendingUp as TrendingUpIcon,
  Clock,
  Activity,
  BarChart3,
  UserCheck,
  Target,
  Home,
  MessageCircle,
} from "lucide-react";
import WeekAtAGlance from "@/components/WeekAtAGlance";
import MobileNavigation from "@/components/MobileNavigation";
import MobileBottomNavigation from "@/components/MobileBottomNavigation";
import PushNotificationPrompt from "./PushNotificationPrompt";
import { COLORS, getGoldenAccent, getRedAlert } from "@/lib/colors";

export default function MobileDashboard() {
  const router = useRouter();

  // Get user profile to check role
  const { data: userProfile } = trpc.user.getProfile.useQuery();

  // Redirect to client dashboard if user is a client
  useEffect(() => {
    if (userProfile?.role === "CLIENT") {
      router.push("/client-dashboard");
    }
  }, [userProfile?.role, router]);

  // If user is not a coach, show loading while redirecting
  if (userProfile?.role === "CLIENT") {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: "#4A5A70" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
      {/* Mobile Header */}
      <div 
        className="sticky top-0 z-50 border-b px-4 pb-3"
        style={{ 
          paddingTop: `calc(0.75rem + env(safe-area-inset-top))`,
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
              Welcome back{userProfile?.name ? `, ${userProfile.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <MobileNavigation currentPage="dashboard" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-4">
        <div className="pt-4">
          <PushNotificationPrompt />
        </div>

        {/* Week at a Glance - Mobile Optimized */}
        <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
              Week at a Glance
            </h2>
            <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Week of {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
          <WeekAtAGlance className="compact" />
        </div>

        {/* Today's Schedule */}
        <TodaysScheduleSection />

        {/* Needs Attention - Mobile version */}
        <NeedsAttentionSectionMobile />

        {/* Recent Activity */}
        <RecentClientActivitySection />

        {/* Quick Stats */}
        <QuickStatsSection />
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNavigation />
    </div>
  );
}

// Quick Stats Section Component
function QuickStatsSection() {
  const { data: clients = [], isLoading: clientsLoading } =
    trpc.clients.list.useQuery({
      archived: false,
    });

  const today = new Date();
  const { data: thisMonthLessons = [], isLoading: lessonsLoading } =
    trpc.scheduling.getCoachSchedule.useQuery({
      month: today.getMonth(),
      year: today.getFullYear(),
    });

  // Fetch events and programs for analytics
  const { data: events = [] } = trpc.events.getUpcoming.useQuery();
  const { data: programs = [], isLoading: programsLoading } =
    trpc.programs.list.useQuery();
  const { data: analyticsData, isLoading: analyticsLoading } =
    trpc.analytics.getDashboardData.useQuery({
      timeRange: "4w",
    });

  // Calculate total upcoming lessons (this month)
  const totalUpcomingLessons = thisMonthLessons.length;

  // Calculate analytics - total programs created
  const totalPrograms = programs.length;

  // Get completion rate from analytics data
  const completionRate = analyticsData?.completionRate || 0;

  const isLoading =
    clientsLoading || lessonsLoading || programsLoading || analyticsLoading;

  const stats = [
    {
      label: "Active Clients",
      value: isLoading ? "..." : clients.length,
      icon: Users,
      color: "#3B82F6", // Blue
    },
    {
      label: "Upcoming Lessons",
      value: isLoading ? "..." : totalUpcomingLessons,
      icon: Clock,
      color: "#10B981", // Green
    },
    {
      label: "Programs Created",
      value: isLoading ? "..." : totalPrograms,
      icon: Target,
      color: "#8B5CF6", // Purple
    },
    {
      label: "Completion Rate",
      value: isLoading ? "..." : `${completionRate}%`,
      icon: TrendingUpIcon,
      color: "#F59E0B", // Yellow
    },
  ];

  const statsArray = [
    {
      label: "Active clients",
      value: isLoading ? "..." : clients.length,
    },
    {
      label: "Scheduled sessions this week",
      value: isLoading ? "..." : totalUpcomingLessons || 0,
    },
    {
      label: "Programs created",
      value: isLoading ? "..." : totalPrograms || 0,
    },
    {
      label: "Average completion rate",
      value: isLoading ? "..." : `${completionRate || 0}%`,
      progress: completionRate || 0,
    },
  ];

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="animate-pulse">
          <div className="h-5 w-32 rounded mb-4" style={{ backgroundColor: COLORS.BACKGROUND_CARD_HOVER }}></div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded" style={{ backgroundColor: COLORS.BACKGROUND_CARD_HOVER }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
        Quick stats
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {statsArray.map((stat, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border"
            style={{ 
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
              borderLeft: `3px solid ${COLORS.GOLDEN_HOVER}`
            }}
          >
            <p className="text-xl font-bold mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>{stat.value}</p>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>{stat.label}</p>
            {stat.progress !== undefined && (
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.BACKGROUND_CARD_HOVER }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: COLORS.GOLDEN_ACCENT,
                    width: `${stat.progress}%`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Recent Notifications Section Component
function RecentNotificationsSection() {
  const { data: notifications = [] } =
    trpc.notifications.getNotifications.useQuery({
      limit: 3,
      unreadOnly: false,
    });

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

  if (notifications.length === 0) {
    return null; // Don't show section if no notifications
  }

  return null; // Remove notifications section to match desktop (not shown on desktop dashboard)
}

// Today's Schedule Section Component
function TodaysScheduleSection() {
  const router = useRouter();
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59
  );

  const { data: thisMonthLessons = [], isLoading: lessonsLoading } =
    trpc.scheduling.getCoachSchedule.useQuery({
      month: today.getMonth(),
      year: today.getFullYear(),
    });

  // Fetch events (which includes reminders)
  const { data: events = [], isLoading: eventsLoading } =
    trpc.events.getUpcoming.useQuery();

  // Filter lessons for today (including all of today, not just future)
  const todaysLessonsFiltered = thisMonthLessons.filter((lesson: any) => {
    const lessonDate = new Date(lesson.date);
    return lessonDate >= startOfToday && lessonDate <= endOfToday;
  });

  // Filter reminders for today
  const todaysReminders = events.filter((event: any) => {
    const eventDate = new Date(event.date);
    return (
      eventDate >= startOfToday &&
      eventDate <= endOfToday &&
      event.status === "PENDING" &&
      event.clientId === null
    );
  });

  // Combine lessons and reminders, sort by time
  const todaysSchedule = [
    ...todaysLessonsFiltered.map((lesson: any) => ({
      ...lesson,
      type: "lesson",
      time: new Date(lesson.date).getTime(),
    })),
    ...todaysReminders.map((reminder: any) => ({
      ...reminder,
      type: "reminder",
      time: new Date(reminder.date).getTime(),
    })),
  ].sort((a, b) => a.time - b.time);

  const isLoading = lessonsLoading || eventsLoading;

  if (isLoading) {
    return (
      <div 
        className="rounded-lg border p-4"
        style={{ 
          backgroundColor: COLORS.BACKGROUND_CARD, 
          borderColor: COLORS.BORDER_SUBTLE 
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
            Today's Schedule
          </h3>
        </div>
        <div className="text-center py-6">
          <div 
            className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2"
            style={{ borderColor: COLORS.GOLDEN_ACCENT }}
          />
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
          Today's schedule
        </h2>
      </div>

      {todaysSchedule.length > 0 ? (
        <div className="space-y-2">
          {todaysSchedule.slice(0, 5).map((item: any) => {
            const isPast = new Date(item.date).getTime() < Date.now();
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.type === "lesson" && item.clientId) {
                    router.push(`/clients/${item.clientId}`);
                  } else {
                    router.push("/schedule");
                  }
                }}
                className="w-full p-2 rounded border transition-colors text-left"
                style={{
                  borderColor: COLORS.GOLDEN_BORDER,
                  backgroundColor: COLORS.BACKGROUND_CARD,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_BORDER;
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-medium"
                    style={{ color: COLORS.GOLDEN_ACCENT }}
                  >
                    {new Date(item.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium truncate ${
                        isPast ? "opacity-50" : ""
                      }`}
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {item.type === "lesson"
                        ? item.client?.name || "Unknown Client"
                        : item.title}
                    </p>
                    {item.type === "lesson" && (
                      <p
                        className="text-[10px] truncate"
                        style={{ color: COLORS.TEXT_MUTED }}
                      >
                        {item.status}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs mb-2" style={{ color: COLORS.TEXT_MUTED }}>
            No lessons or reminders for today
          </p>
          <Link
            href="/schedule"
            className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: COLORS.GOLDEN_DARK,
              color: "#FFFFFF",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
            }}
          >
            Schedule a lesson
          </Link>
        </div>
      )}
    </div>
  );
}

// Needs Attention Section - Mobile version
function NeedsAttentionSectionMobile() {
  const router = useRouter();
  const { data: attentionItemsData = [], isLoading: attentionLoading } =
    trpc.sidebar.getAttentionItems.useQuery();

  const { data: conversationsData, isLoading: conversationsLoading } =
    trpc.messaging.getConversations.useQuery();

  if (attentionLoading || conversationsLoading) {
    return (
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="animate-pulse">
          <div className="h-5 w-40 rounded mb-4" style={{ backgroundColor: COLORS.BACKGROUND_CARD_HOVER }}></div>
          <div className="space-y-3">
            <div className="h-16 rounded" style={{ backgroundColor: COLORS.BACKGROUND_CARD_HOVER }}></div>
            <div className="h-16 rounded" style={{ backgroundColor: COLORS.BACKGROUND_CARD_HOVER }}></div>
          </div>
        </div>
      </div>
    );
  }

  const conversations = Array.isArray(conversationsData) ? conversationsData : [];
  const attentionItems: any[] = [...attentionItemsData];

  if (Array.isArray(conversations)) {
    conversations.forEach((conversation: any) => {
      const unreadCount = conversation.unreadCount || 0;
      if (unreadCount > 0) {
        const otherUser =
          conversation.coach?.id !== conversation.client?.id
            ? conversation.client || conversation.coach
            : null;
        const lastMessage = conversation.messages?.[0];

        attentionItems.push({
          id: `message-${conversation.id}`,
          type: "message",
          priority: 2,
          clientName: otherUser?.name || "Unknown",
          clientId: otherUser?.id || undefined,
          title: `commented on ${lastMessage?.content ? "message" : "conversation"}`,
          description: lastMessage?.content || "New message",
          timestamp: lastMessage?.createdAt || conversation.updatedAt,
          href: `/messages/${conversation.id}`,
          actionButton: "Reply",
        });
      }
    });
  }

  attentionItems.sort((a, b) => {
    if (a.priority !== b.priority) {
      return (a.priority || 99) - (b.priority || 99);
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "video_review":
        return "Video Review";
      case "message":
        return "Message";
      case "missed_drill":
        return "Missed Drill";
      case "lesson_confirmation":
        return "Lesson";
      case "program_update":
        return "Program";
      default:
        return "Notification";
    }
  };

  return (
    <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
      <div className="flex items-center justify-between mb-4">
        <h2 
          className="text-lg font-semibold pl-3"
          style={{ 
            color: COLORS.TEXT_PRIMARY,
            borderLeft: `3px solid ${COLORS.GOLDEN_HOVER}`
          }}
        >
          Needs your attention
        </h2>
        {attentionItems.length > 0 && (
          <Link
            href="/notifications"
            className="text-sm"
            style={{ color: COLORS.GOLDEN_ACCENT }}
          >
            View all →
          </Link>
        )}
      </div>

      {attentionItems.length > 0 ? (
        <div className="space-y-2">
          {attentionItems.map((item) => {
            const handleItemClick = () => {
              if (item.actionButton) {
                return;
              }
              if (item.clientId) {
                router.push(`/clients/${item.clientId}/detail`);
                return;
              }
              if (item.href) {
                router.push(item.href);
              }
            };

            const handleActionClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (item.href) {
                router.push(item.href);
              }
            };

            return (
              <div
                key={item.id}
                onClick={handleItemClick}
                style={{
                  borderColor: COLORS.BORDER_SUBTLE,
                  backgroundColor: COLORS.BACKGROUND_CARD,
                }}
                className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                  (item.clientId || item.href) && !item.actionButton ? "cursor-pointer" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    {item.clientName && (
                      <span className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                        {item.clientName}
                      </span>
                    )}
                    {item.type !== "missed_drill" && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: getGoldenAccent(0.12),
                          color: COLORS.GOLDEN_HOVER,
                        }}
                      >
                        {getTypeLabel(item.type)}
                      </span>
                    )}
                    {item.badge && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: getRedAlert(0.4),
                          color: COLORS.RED_ALERT,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-[10px] line-clamp-1" style={{ color: COLORS.TEXT_MUTED }}>
                      {item.description}
                    </p>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                    {formatTimestamp(item.timestamp)}
                  </p>
                </div>
                {item.actionButton && (
                  <button
                    onClick={handleActionClick}
                    className="px-2 py-1 rounded text-[10px] font-medium transition-colors flex-shrink-0"
                    style={{
                      backgroundColor: COLORS.GOLDEN_ACCENT,
                      color: "#FFFFFF",
                    }}
                  >
                    {item.actionButton}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>All caught up! No items need your attention.</p>
        </div>
      )}
    </div>
  );
}

// Recent Client Activity Section Component
function RecentClientActivitySection() {
  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  // For now, show recent client updates based on lastActivity field
  const recentActivity = clients
    .filter((client: any) => client.lastActivity)
    .sort(
      (a: any, b: any) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 3)
    .map((client: any) => ({
      clientName: client.name,
      activity: client.lastActivity || "Updated profile",
      completedAt: client.updatedAt,
    }));

  if (recentActivity.length === 0) {
    return null; // Don't show section if no activity
  }

  const { data: recentCompletions = [], isLoading } =
    trpc.sidebar.getRecentCompletions.useQuery();

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="animate-pulse">
          <div className="h-5 w-40 rounded mb-4" style={{ backgroundColor: COLORS.BACKGROUND_CARD_HOVER }}></div>
          <div className="space-y-3">
            <div className="h-12 rounded" style={{ backgroundColor: COLORS.BACKGROUND_CARD_HOVER }}></div>
            <div className="h-12 rounded" style={{ backgroundColor: COLORS.BACKGROUND_CARD_HOVER }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (recentCompletions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
      <h2 
        className="text-lg font-semibold mb-4 pl-3"
        style={{ 
          color: COLORS.TEXT_PRIMARY,
          borderLeft: `3px solid ${COLORS.GOLDEN_HOVER}`
        }}
      >
        Recent client activity
      </h2>

      {recentCompletions.length > 0 ? (
        <div className="space-y-3">
          {recentCompletions.map((completion: any) => {
            const getActivityText = () => {
              const count = completion.count || 1;
              const latest = completion.latestCompletion;
              const completionType = completion.completionType || latest?.type;
              
              if (completionType === "program") {
                if (latest?.title) {
                  return count > 1 
                    ? `completed ${count} drills including "${latest.title}"`
                    : `completed drill "${latest.title}"`;
                }
                return count > 1 
                  ? `completed ${count} drills`
                  : `completed a drill`;
              } else if (completionType === "routine") {
                return count > 1
                  ? `completed ${count} routine exercises`
                  : `completed a routine exercise`;
              } else {
                return count > 1
                  ? `completed ${count} exercises`
                  : `completed an exercise`;
              }
            };

            const getWorkoutName = () => {
              if (completion.programTitle) {
                return completion.programTitle;
              }
              if (completion.latestCompletion?.programTitle) {
                return completion.latestCompletion.programTitle;
              }
              return null;
            };

            return (
              <div key={completion.id} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                    <span className="font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>{completion.clientName}</span>{" "}
                    {getActivityText()}
                    {getWorkoutName() && (
                      <>
                        {" "}
                        <span style={{ color: COLORS.TEXT_SECONDARY }}>in </span>
                        <span className="font-medium text-green-400">
                          {getWorkoutName()}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                    {formatTimestamp(completion.completedAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>No recent completions</p>
        </div>
      )}
    </div>
  );
}
