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

  // Get user profile to check role - with aggressive caching since roles don't change
  // Roles only change if account is deleted or manually changed by admin
  const { data: userProfile, isLoading: profileLoading } =
    trpc.user.getProfile.useQuery(undefined, {
      staleTime: Infinity, // Never consider stale - roles don't change
      gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount if we have cached data
      refetchOnReconnect: false, // Don't refetch on reconnect
    });

  // Redirect to client dashboard if user is a client
  useEffect(() => {
    if (userProfile?.role === "CLIENT") {
      router.push("/client-dashboard");
    }
  }, [userProfile?.role, router]);

  // Show loading state while fetching user profile - use skeleton instead of blocking
  if (profileLoading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-[#15191a] p-6">
          <SkeletonStats />
        </div>
      </Sidebar>
    );
  }

  // If user is not a coach, show minimal content while redirect happens
  // (returning null could prevent useEffect from running properly)
  if (userProfile?.role === "CLIENT") {
    return (
      <Sidebar>
        <div className="min-h-screen bg-[#15191a]" />
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-[#15191a] p-6">
      <PushNotificationPrompt />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2 text-white">
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
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Week at a Glance
        </h2>
        <span className="text-xs text-zinc-400 font-medium">
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

  // Memoize filtered lessons and reminders to prevent recalculation
  // MUST be called before early return to follow Rules of Hooks
  // Calculate date boundaries inside useMemo (not as dependencies) to avoid infinite loops
  const todaysSchedule = useMemo(() => {
    const currentDate = new Date();
    const startOfToday = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
    const endOfToday = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      23,
      59,
      59
    );

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
  }, [thisMonthLessons, events]); // Only depend on data, not dates

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

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 shadow-sm">
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
                className="w-full p-3 rounded-lg border transition-all duration-200 text-left hover:scale-[1.02]"
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
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-semibold whitespace-nowrap"
                    style={{ color: COLORS.GOLDEN_ACCENT }}
                  >
                    {new Date(item.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isPast ? "opacity-60" : ""
                      }`}
                      style={{ color: "#F5F5F5" }}
                    >
                      {item.type === "lesson"
                        ? item.client?.name || "Unknown Client"
                        : item.title}
                    </p>
                    {item.type === "lesson" && (
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: "#9CA3AF" }}
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
        <div className="text-center py-8">
          <p className="text-sm text-zinc-400 mb-3">
            No lessons or reminders for today
          </p>
          <Link
            href="/schedule"
            className="inline-block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
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

  // Memoize attention items to prevent recalculation
  // MUST be called before early return to follow Rules of Hooks
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
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 
          className="text-lg font-semibold text-white pl-3"
          style={{ borderLeft: `3px solid ${COLORS.GOLDEN_HOVER}` }}
        >
          Needs your attention
        </h2>
        {attentionItems.length > 0 && (
          <Link
            href="/notifications"
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: COLORS.GOLDEN_ACCENT }}
          >
            View all →
          </Link>
        )}
      </div>

      {attentionItems.length > 0 ? (
        <div className="space-y-3">
          {attentionItems.map((item) => (
            <AttentionItem key={item.id} item={item} formatTimestamp={formatTimestamp} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
            <svg
              className="w-8 h-8 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-zinc-400 font-medium">All caught up!</p>
          <p className="text-xs text-zinc-500 mt-1">No items need your attention.</p>
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
        e.currentTarget.style.transform = "translateX(2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
        e.currentTarget.style.transform = "translateX(0)";
      }}
      className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
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
          className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex-shrink-0 hover:scale-105"
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
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 shadow-sm">
      <h2 
        className="text-lg font-semibold mb-5 text-white pl-3"
        style={{ borderLeft: `3px solid ${COLORS.GOLDEN_HOVER}` }}
      >
        Recent client activity
      </h2>

      {recentCompletions.length > 0 ? (
        <div className="space-y-4">
          {recentCompletions.map((completion: any) => (
            <ActivityItem
              key={completion.id}
              completion={completion}
              formatTimestamp={formatTimestamp}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 mb-4">
            <svg
              className="w-8 h-8 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-zinc-400 font-medium">No recent activity</p>
          <p className="text-xs text-zinc-500 mt-1">Client completions will appear here</p>
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
    <div className="flex items-start gap-3 group">
      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 leading-relaxed">
          <span className="font-semibold text-white">{completion.clientName}</span>{" "}
          {getActivityText()}
          {getWorkoutName() && (
            <>
              {" "}
              <span className="text-zinc-400">in </span>
              <span className="font-semibold text-green-400">
                {getWorkoutName()}
              </span>
            </>
          )}
        </p>
        <p className="text-xs mt-1.5 text-zinc-500 font-medium">
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
      value: stats.totalClients || 0,
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
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-5 text-white">
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
      className="p-5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200 group"
      style={{ borderLeft: `3px solid ${COLORS.GOLDEN_HOVER}` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderLeftColor = COLORS.GOLDEN_ACCENT;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderLeftColor = COLORS.GOLDEN_HOVER;
      }}
    >
      <p className="text-3xl font-bold mb-2 text-white group-hover:text-[#E5B232] transition-colors">
        {stat.value}
      </p>
      <p className="text-xs text-zinc-400 font-medium">{stat.label}</p>
      {stat.progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-500"
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
