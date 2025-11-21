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
  Calendar,
  UserCheck,
  Target,
  Home,
  MessageCircle,
} from "lucide-react";
import WeekAtAGlance from "@/components/WeekAtAGlance";
import MobileNavigation from "@/components/MobileNavigation";
import MobileBottomNavigation from "@/components/MobileBottomNavigation";

import PushNotificationPrompt from "./PushNotificationPrompt";

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
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-[#2A3133] border-b border-[#606364] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Home className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Dashboard</h1>
              <p className="text-xs text-gray-400">Coach Overview</p>
            </div>
          </div>
          <MobileNavigation currentPage="dashboard" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-6">
        <div className="pt-4">
          <PushNotificationPrompt />
        </div>
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#4A5A70] to-[#606364] rounded-2xl p-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-1">
              Welcome back, Coach
            </h2>
            <div className="text-sm text-gray-400">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/clients"
            className="bg-[#353A3A] border border-[#606364] rounded-xl p-4 text-center"
          >
            <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <div className="text-white font-medium text-sm">Clients</div>
            <div className="text-gray-400 text-xs">Manage athletes</div>
          </Link>
          <Link
            href="/programs"
            className="bg-[#353A3A] border border-[#606364] rounded-xl p-4 text-center"
          >
            <Target className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <div className="text-white font-medium text-sm">Programs</div>
            <div className="text-gray-400 text-xs">Training plans</div>
          </Link>
          <Link
            href="/schedule"
            className="bg-[#353A3A] border border-[#606364] rounded-xl p-4 text-center"
          >
            <Calendar className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <div className="text-white font-medium text-sm">Schedule</div>
            <div className="text-gray-400 text-xs">Lessons & events</div>
          </Link>
          <Link
            href="/messages"
            className="bg-[#353A3A] border border-[#606364] rounded-xl p-4 text-center"
          >
            <MessageCircle className="h-6 w-6 text-orange-400 mx-auto mb-2" />
            <div className="text-white font-medium text-sm">Messages</div>
            <div className="text-gray-400 text-xs">Communicate</div>
          </Link>
        </div>

        {/* Week at a Glance - Mobile Optimized */}
        <div className="bg-[#353A3A] border border-[#606364] rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-5 w-5 text-white" />
            <h3 className="text-lg font-bold text-white">This Week</h3>
          </div>
          <WeekAtAGlance className="mobile-optimized" />
        </div>

        {/* Quick Stats */}
        <QuickStatsSection />

        {/* Recent Notifications */}
        <RecentNotificationsSection />

        {/* Today's Schedule */}
        <TodaysScheduleSection />

        {/* Recent Activity */}
        <RecentClientActivitySection />
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

  return (
    <div className="bg-[#353A3A] border border-[#606364] rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="h-5 w-5 text-white" />
        <h3 className="text-lg font-bold text-white">Quick Stats</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-[#2A2F2F] border border-[#606364] rounded-lg p-3 text-center"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: stat.color + "20" }}
            >
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
            </div>
            <p className="text-lg font-bold text-white mb-1">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.label}</p>
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

  // Simple polling for notification count
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 120000, // Poll every 2 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  if (notifications.length === 0) {
    return null; // Don't show section if no notifications
  }

  return (
    <div className="bg-[#353A3A] border border-[#606364] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-white" />
          <h3 className="text-lg font-bold text-white">Recent Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {unreadCount}
            </span>
          )}
        </div>
        <Link
          href="/notifications"
          className="text-sm text-blue-400 hover:text-blue-300 font-medium"
        >
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {notifications.slice(0, 3).map((notification: any) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg ${
              !notification.isRead
                ? "bg-blue-500/10 border-l-2 border-blue-500"
                : "bg-[#2A2F2F]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {notification.type === "CLIENT_JOIN_REQUEST" ? (
                  <Users className="h-4 w-4 text-green-400" />
                ) : (
                  <Bell className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    !notification.isRead ? "font-semibold" : ""
                  } text-white`}
                >
                  {notification.title}
                </p>
                <p className="text-xs mt-1 line-clamp-2 text-gray-400">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                  {notification.type === "CLIENT_JOIN_REQUEST" && (
                    <Link
                      href="/clients"
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      View Client
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
      <div className="bg-[#353A3A] border border-[#606364] rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-5 w-5 text-white" />
          <h3 className="text-lg font-bold text-white">Today's Schedule</h3>
        </div>
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4A5A70] mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#353A3A] border border-[#606364] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-white" />
          <h3 className="text-lg font-bold text-white">Today's Schedule</h3>
        </div>
        {todaysSchedule.length > 0 && (
          <Link
            href="/schedule"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            View All
          </Link>
        )}
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
                className="w-full p-3 rounded-lg bg-[#2A2F2F] border border-[#606364] hover:bg-[#353A3A] transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {item.type === "lesson" ? (
                      <Clock
                        className={`h-4 w-4 flex-shrink-0 ${
                          isPast ? "text-gray-500" : "text-blue-400"
                        }`}
                      />
                    ) : (
                      <Bell className="h-4 w-4 flex-shrink-0 text-orange-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-white font-medium text-sm ${
                          isPast ? "opacity-60" : ""
                        }`}
                      >
                        {new Date(item.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p
                        className={`text-gray-400 text-xs truncate ${
                          isPast ? "opacity-60" : ""
                        }`}
                      >
                        {item.type === "lesson"
                          ? item.client?.name || "Unknown Client"
                          : item.title}
                      </p>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2"
                    style={{
                      backgroundColor:
                        item.type === "lesson"
                          ? item.status === "CONFIRMED"
                            ? isPast
                              ? "#6B7280"
                              : "#10B981"
                            : "#F59E0B"
                          : "#F59E0B",
                      color:
                        item.type === "lesson"
                          ? item.status === "CONFIRMED"
                            ? isPast
                              ? "#D1D5DB"
                              : "#DCFCE7"
                            : "#FEF3C7"
                          : "#FEF3C7",
                    }}
                  >
                    {item.type === "lesson"
                      ? isPast
                        ? "Completed"
                        : item.status
                      : "REMINDER"}
                  </span>
                </div>
              </button>
            );
          })}
          {todaysSchedule.length > 5 && (
            <Link
              href="/schedule"
              className="block text-center text-sm text-blue-400 hover:text-blue-300 font-medium py-2"
            >
              +{todaysSchedule.length - 5} more items today →
            </Link>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Calendar className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm mb-2">
            No lessons or reminders for today
          </p>
          <Link
            href="/schedule"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            View Schedule →
          </Link>
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

  return (
    <div className="bg-[#353A3A] border border-[#606364] rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="h-5 w-5 text-white" />
        <h3 className="text-lg font-bold text-white">Recent Activity</h3>
      </div>

      <div className="space-y-3">
        {recentActivity.map((activity: any, index: number) => (
          <div
            key={`${activity.clientName}-${activity.completedAt}-${index}`}
            className="p-3 rounded-lg bg-[#2A2F2F] border border-[#606364]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#4A5A70] flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">
                  {activity.clientName}
                </p>
                <p className="text-gray-400 text-xs">{activity.activity}</p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(activity.completedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
