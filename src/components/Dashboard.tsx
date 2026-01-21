"use client";

import React, { useMemo } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
// Icons removed for cleaner UI
import Sidebar from "./Sidebar";
import WeekAtAGlance from "@/components/WeekAtAGlance";
import { SkeletonStats } from "@/components/SkeletonLoader";
import PushNotificationPrompt from "./PushNotificationPrompt";
import { COLORS, getGoldenAccent, getRedAlert, getGreenPrimary } from "@/lib/colors";

export default function Dashboard() {
  const router = useRouter();

  // Get user profile to check role - with caching
  const { data: userProfile, isLoading: profileLoading } =
    trpc.user.getProfile.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    });

  // Redirect to client dashboard if user is a client
  useEffect(() => {
    if (userProfile?.role === "CLIENT") {
      router.push("/client-dashboard");
    }
  }, [userProfile?.role, router]);

  // Show loading state while fetching user profile
  if (profileLoading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-[#15191a]">
          <div className="p-6">
            <SkeletonStats />
          </div>
        </div>
      </Sidebar>
    );
  }

  // If user is not a coach, show loading while redirecting
  if (userProfile?.role === "CLIENT") {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64 bg-[#15191a]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20 border-t-white/60" />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-[#15191a] p-6">
        <PushNotificationPrompt />
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1 text-white">
            Welcome back{userProfile?.name ? `, ${userProfile.name.split(" ")[0]}` : ""}
                    </h1>
          <p className="text-sm text-zinc-400">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
              month: "long",
              day: "numeric",
                    })}
          </p>
                  </div>

        {/* TOP ROW: Week at a Glance + Today's Schedule */}
        <div className="grid grid-cols-[70%_30%] gap-4 mb-6">
          <WeekAtAGlanceCompact />
          <TodaysSchedulePanel />
        </div>

        {/* MIDDLE ROW: Needs Attention + Recent Activity */}
        <div className="grid grid-cols-[60%_40%] gap-4 mb-6">
          <NeedsAttentionPanel />
          <ClientActivityFeed />
        </div>

        {/* BOTTOM ROW: Quick Stats */}
        <div className="mb-6">
          <QuickStatsPanel />
        </div>
      </div>
    </Sidebar>
  );
}

// Week at a Glance (Compact) - Now at top
function WeekAtAGlanceCompact() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white">
          Week at a Glance
        </h2>
        <span className="text-xs text-zinc-400">
          Week of {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
      </div>
      <WeekAtAGlance className="compact" />
    </div>
  );
}

// Today's Schedule Panel (Small, next to Week at a Glance)
function TodaysSchedulePanel() {
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
    trpc.scheduling.getCoachSchedule.useQuery(
      {
        month: today.getMonth(),
        year: today.getFullYear(),
      },
      {
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      }
    );

  const { data: events = [], isLoading: eventsLoading } =
    trpc.events.getUpcoming.useQuery(undefined, {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    });

  if (lessonsLoading || eventsLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="animate-pulse">
          <div className="h-4 w-32 bg-white/10 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-white/10 rounded"></div>
            <div className="h-3 w-3/4 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Memoize filtered lessons and reminders to prevent recalculation
  const todaysSchedule = useMemo(() => {
    // Filter lessons for today
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

    // Combine and sort
    return [
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
  }, [thisMonthLessons, events, startOfToday, endOfToday]);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
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
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
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
                      style={{ color: "#F5F5F5" }}
                        >
                          {item.type === "lesson"
                            ? item.client?.name || "Unknown Client"
                            : item.title}
                        </p>
                    {item.type === "lesson" && (
                      <p
                        className="text-[10px] truncate"
                        style={{ color: "#6B7280" }}
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
          <p className="text-xs text-zinc-400 mb-2">
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

// Needs Your Attention Panel - Real data
function NeedsAttentionPanel() {
  // Get attention items from new query - with caching
  const { data: attentionItemsData = [], isLoading: attentionLoading } =
    trpc.sidebar.getAttentionItems.useQuery(undefined, {
      staleTime: 1 * 60 * 1000, // 1 minute (needs to be relatively fresh)
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    });

  // Get unread messages separately - with caching
  const { data: conversationsData, isLoading: conversationsLoading } =
    trpc.messaging.getConversations.useQuery(undefined, {
      staleTime: 1 * 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    });

  if (attentionLoading || conversationsLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
        <div className="animate-pulse">
          <div className="h-5 w-40 bg-white/10 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 w-full bg-white/10 rounded"></div>
            <div className="h-16 w-full bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Memoize attention items to prevent recalculation
  const attentionItems = useMemo(() => {
    // Ensure conversations is an array
    const conversations = Array.isArray(conversationsData) ? conversationsData : [];

    // Combine attention items with unread messages
    const items: any[] = [...attentionItemsData];

    // Add conversations with unread messages (priority 2)
    if (Array.isArray(conversations)) {
      conversations.forEach((conversation: any) => {
        const unreadCount = conversation.unreadCount || 0;
        if (unreadCount > 0) {
          const otherUser =
            conversation.coach?.id !== conversation.client?.id
              ? conversation.client || conversation.coach
              : null;
          const lastMessage = conversation.messages?.[0];

          items.push({
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

    // Sort by priority and timestamp
    items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return (a.priority || 99) - (b.priority || 99);
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return items;
  }, [attentionItemsData, conversationsData]);

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

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 
          className="text-lg font-semibold text-white pl-3"
          style={{ borderLeft: `3px solid ${COLORS.GOLDEN_HOVER}` }}
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
          {attentionItems.map((item) => (
            <AttentionItem key={item.id} item={item} formatTimestamp={formatTimestamp} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-zinc-400">All caught up! No items need your attention.</p>
        </div>
      )}
    </div>
  );
}

// Attention Item Component - Memoized to prevent unnecessary re-renders
const AttentionItem = React.memo(function AttentionItem({ item, formatTimestamp }: { item: any; formatTimestamp: (ts: string) => string }) {
  const router = useRouter();

  const getTypeLabel = () => {
    switch (item.type) {
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

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleItemClick = () => {
    // If there's an action button, don't navigate on item click (only on button click)
    if (item.actionButton) {
      return;
    }
    
    // Priority: if clientId exists, navigate to client detail page
    if (item.clientId) {
      router.push(`/clients/${item.clientId}/detail`);
      return;
    }
    
    // Fallback to href if no clientId
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div
      onClick={handleItemClick}
      style={{
        borderColor: COLORS.BORDER_SUBTLE,
        backgroundColor: COLORS.BACKGROUND_CARD,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
      }}
      className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
        (item.clientId || item.href) && !item.actionButton ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          {item.clientName && (
            <span className="text-xs font-medium text-white">
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
              {getTypeLabel()}
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
        <p className="text-xs font-medium mb-0.5 text-zinc-200">
          {item.title}
        </p>
        {item.description && (
          <p className="text-[10px] text-zinc-400 line-clamp-1">
            {item.description}
          </p>
        )}
        <p className="text-[10px] mt-0.5 text-zinc-500">
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
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.GOLDEN_HOVER;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
          }}
        >
          {item.actionButton}
        </button>
      )}
                  </div>
  );
});

// Client Activity Feed - Real data from completions
function ClientActivityFeed() {
  const { data: recentCompletions = [], isLoading } =
    trpc.sidebar.getRecentCompletions.useQuery(undefined, {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
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

  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
        <div className="animate-pulse">
          <div className="h-5 w-40 bg-white/10 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 w-full bg-white/10 rounded"></div>
            <div className="h-12 w-full bg-white/10 rounded"></div>
                  </div>
                </div>
              </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
      <h2 
        className="text-lg font-semibold mb-4 text-white pl-3"
        style={{ borderLeft: `3px solid ${COLORS.GOLDEN_HOVER}` }}
      >
        Recent client activity
      </h2>

      {recentCompletions.length > 0 ? (
        <div className="space-y-3">
          {recentCompletions.map((completion: any) => (
            <ActivityItem
              key={completion.id}
              completion={completion}
              formatTimestamp={formatTimestamp}
            />
            ))}
          </div>
        ) : (
        <div className="text-center py-6">
          <p className="text-sm text-zinc-400">No recent completions</p>
          </div>
        )}
    </div>
  );
}

// Activity Item Component - Memoized to prevent unnecessary re-renders
const ActivityItem = React.memo(function ActivityItem({
  completion,
  formatTimestamp,
}: {
  completion: any;
  formatTimestamp: (ts: string) => string;
}) {
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

  // Get the program/routine name to display
  const getWorkoutName = () => {
    // Prefer the programTitle from the grouped completion
    if (completion.programTitle) {
      return completion.programTitle;
    }
    // Fall back to latestCompletion's programTitle
    if (completion.latestCompletion?.programTitle) {
      return completion.latestCompletion.programTitle;
    }
    return null;
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300">
          <span className="font-medium text-white">{completion.clientName}</span>{" "}
          {getActivityText()}
          {getWorkoutName() && (
            <>
              {" "}
              <span className="text-zinc-300">in </span>
              <span className="font-medium text-green-400">
                {getWorkoutName()}
              </span>
            </>
          )}
        </p>
        <p className="text-xs mt-0.5 text-zinc-600">
          {formatTimestamp(completion.completedAt)}
        </p>
      </div>
    </div>
  );
});

// Quick Stats Panel
function QuickStatsPanel() {
  const { data: dashboardData, isLoading } =
    trpc.sidebar.getDashboardData.useQuery(undefined, {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    });

  const clients = dashboardData?.clients || [];
  const stats = dashboardData?.stats || {
    totalClients: 0,
    totalPrograms: 0,
    totalLessons: 0,
    completionRate: 0,
  };

  const statsArray = [
    {
      label: "Active clients",
      value: clients.length,
    },
    {
      label: "Scheduled sessions this week",
      value: stats.totalLessons || 0,
    },
    {
      label: "Programs created",
      value: stats.totalPrograms || 0,
    },
    {
      label: "Average completion rate",
      value: `${stats.completionRate || 0}%`,
      progress: stats.completionRate || 0,
    },
  ];

  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
        <div className="animate-pulse">
          <div className="h-5 w-32 bg-white/10 rounded mb-4"></div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-lg font-semibold mb-4 text-white">
        Quick stats
      </h2>

      <div className="grid grid-cols-4 gap-4">
        {statsArray.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>
    </div>
  );
}

// Stat Card Component - Memoized to prevent unnecessary re-renders
const StatCard = React.memo(function StatCard({ stat }: { stat: any }) {
  return (
    <div
      className="p-4 rounded-lg border border-white/5 bg-white/[0.02]"
      style={{ borderLeft: `3px solid ${COLORS.GOLDEN_HOVER}` }}
    >
      <p className="text-2xl font-bold mb-1 text-white">{stat.value}</p>
      <p className="text-xs text-zinc-500">{stat.label}</p>
      {stat.progress !== undefined && (
        <div className="mt-2 h-1 rounded-full overflow-hidden bg-white/5">
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
  );
});
