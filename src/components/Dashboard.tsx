"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
// Removed complex SSE hooks - using simple polling instead
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
} from "lucide-react";
import Sidebar from "./Sidebar";
import WeekAtAGlance from "@/components/WeekAtAGlance";

export default function Dashboard() {
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
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "#4A5A70" }}
          />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        {/* Hero Header - improved mobile layout */}
        <div className="mb-6 md:mb-8">
          <div className="rounded-2xl border relative overflow-hidden group">
            <div
              className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
              }}
            />
            <div className="relative p-4 md:p-8 bg-gradient-to-r from-transparent via-black/20 to-black/40">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h1
                      className="text-2xl md:text-4xl font-bold mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Welcome back, Coach
                    </h1>
                    <p
                      className="flex items-center gap-2 text-sm md:text-lg"
                      style={{ color: "#ABA4AA" }}
                    >
                      <TrendingUpIcon className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                      Ready to build your coaching empire
                    </p>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <div
                    className="text-xl md:text-2xl font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="text-sm" style={{ color: "#ABA4AA" }}>
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Week at a Glance */}
        <div className="mb-6 md:mb-8">
          <WeekAtAGlance />
        </div>


        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-6">
          <RecentNotificationsSection />
          <TodaysScheduleSection />
          <RecentClientActivitySection />
          <QuickStatsSection />
        </div>
      </div>
    </Sidebar>
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
      refetchInterval: 120000, // Poll every 2 minutes (reduced from 60 seconds)
      refetchOnWindowFocus: false, // Disabled to reduce unnecessary calls
      refetchOnReconnect: true,
    }
  );

  if (notifications.length === 0) {
    return null; // Don't show section if no notifications
  }

  return (
    <div
      className="rounded-2xl shadow-xl border mb-8 relative overflow-hidden group"
      style={{
        backgroundColor: "#353A3A",
        borderColor: "#606364",
        minHeight: "320px",
      }}
    >
      <div
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
        style={{
          background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
        }}
      />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-xl font-bold flex items-center gap-3"
            style={{ color: "#C3BCC2" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Bell className="h-4 w-4" style={{ color: "#C3BCC2" }} />
            </div>
            Recent Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                {unreadCount}
              </span>
            )}
          </h3>
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
              className={`p-3 rounded-lg transition-colors ${
                !notification.isRead
                  ? "bg-blue-500/10 border-l-2 border-blue-500"
                  : ""
              }`}
              style={{
                backgroundColor: !notification.isRead
                  ? "#4A5A70"
                  : "transparent",
              }}
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
                    }`}
                    style={{ color: "#C3BCC2" }}
                  >
                    {notification.title}
                  </p>
                  <p
                    className="text-xs mt-1 line-clamp-2"
                    style={{ color: "#ABA4AA" }}
                  >
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: "#ABA4AA" }}>
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
    </div>
  );
}

// Today's Schedule Section Component
function TodaysScheduleSection() {
  const today = new Date();
  const { data: todaysLessons = [] } =
    trpc.scheduling.getCoachSchedule.useQuery({
      month: today.getMonth(),
      year: today.getFullYear(),
    });

  // Fetch events (which includes reminders)
  const { data: events = [] } = trpc.events.getUpcoming.useQuery();

  // Filter lessons for today
  const todaysLessonsFiltered = todaysLessons.filter((lesson: any) => {
    const lessonDate = new Date(lesson.date);
    return lessonDate.toDateString() === today.toDateString();
  });

  // Filter reminders for today
  const todaysReminders = events.filter((event: any) => {
    const eventDate = new Date(event.date);
    return (
      eventDate.toDateString() === today.toDateString() &&
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

  return (
    <div
      className="rounded-2xl shadow-xl border relative overflow-hidden group"
      style={{
        backgroundColor: "#353A3A",
        borderColor: "#606364",
        minHeight: "320px",
      }}
    >
      <div
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
        style={{
          background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
        }}
      />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-xl font-bold flex items-center gap-3"
            style={{ color: "#C3BCC2" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Calendar className="h-4 w-4" style={{ color: "#C3BCC2" }} />
            </div>
            Today's Schedule
          </h3>
        </div>

        {todaysSchedule.length > 0 ? (
          <div className="space-y-3">
            {todaysSchedule.slice(0, 5).map((item: any, index: number) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border transition-colors"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: "#606364",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.type === "lesson" ? (
                      <Clock className="h-4 w-4 text-blue-400" />
                    ) : (
                      <Bell className="h-4 w-4 text-orange-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {new Date(item.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {item.type === "lesson"
                          ? item.client?.name || "Unknown Client"
                          : item.title}
                      </p>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor:
                        item.type === "lesson"
                          ? item.status === "CONFIRMED"
                            ? "#10B981"
                            : "#F59E0B"
                          : "#F59E0B",
                      color:
                        item.type === "lesson"
                          ? item.status === "CONFIRMED"
                            ? "#DCFCE7"
                            : "#FEF3C7"
                          : "#FEF3C7",
                    }}
                  >
                    {item.type === "lesson" ? item.status : "REMINDER"}
                  </span>
                </div>
              </div>
            ))}
            {todaysSchedule.length > 5 && (
              <p className="text-sm text-gray-400 text-center">
                +{todaysSchedule.length - 5} more items today
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No lessons or reminders for today</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Recent Client Activity Section Component
function RecentClientActivitySection() {
  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  // For now, show recent client updates based on lastActivity field
  // This will show real data when clients have activity
  const recentActivity = clients
    .filter((client: any) => client.lastActivity)
    .sort(
      (a: any, b: any) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 4)
    .map((client: any) => ({
      clientName: client.name,
      activity: client.lastActivity || "Updated profile",
      completedAt: client.updatedAt,
    }));

  return (
    <div
      className="rounded-2xl shadow-xl border relative overflow-hidden group"
      style={{
        backgroundColor: "#353A3A",
        borderColor: "#606364",
        minHeight: "320px",
      }}
    >
      <div
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
        style={{
          background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
        }}
      />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-xl font-bold flex items-center gap-3"
            style={{ color: "#C3BCC2" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Activity className="h-4 w-4" style={{ color: "#C3BCC2" }} />
            </div>
            Recent Activity
          </h3>
        </div>

        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.slice(0, 4).map((activity: any, index: number) => (
              <div
                key={`${activity.clientName}-${activity.completedAt}-${index}`}
                className="p-3 rounded-lg border transition-colors"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: "#606364",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <UserCheck
                      className="h-4 w-4"
                      style={{ color: "#C3BCC2" }}
                    />
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
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No recent activity</p>
            <p className="text-gray-500 text-xs mt-1">
              Clients need to complete drills to show activity
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Stats Section Component
function QuickStatsSection() {
  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  const today = new Date();
  const { data: todaysLessons = [] } =
    trpc.scheduling.getCoachSchedule.useQuery({
      month: today.getMonth(),
      year: today.getFullYear(),
    });

  // Fetch events and programs for analytics
  const { data: events = [] } = trpc.events.getUpcoming.useQuery();
  const { data: programs = [] } = trpc.programs.list.useQuery();
  const { data: analyticsData } = trpc.analytics.getDashboardData.useQuery({
    timeRange: "4w",
  });

  // Calculate total lessons (all time)
  const totalLessons = todaysLessons.length;

  // Calculate analytics - total programs created
  const totalPrograms = programs.length;

  // Get completion rate from analytics data
  const completionRate = analyticsData?.completionRate || 0;

  const stats = [
    {
      label: "Active Clients",
      value: clients.length,
      icon: Users,
      color: "#3B82F6", // Blue
    },
    {
      label: "Scheduled Lessons",
      value: totalLessons,
      icon: Clock,
      color: "#10B981", // Green
    },
    {
      label: "Programs Created",
      value: totalPrograms,
      icon: Target,
      color: "#8B5CF6", // Purple
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: TrendingUpIcon,
      color: "#F59E0B", // Yellow
    },
  ];

  return (
    <div
      className="rounded-2xl shadow-xl border relative overflow-hidden group"
      style={{
        backgroundColor: "#353A3A",
        borderColor: "#606364",
        minHeight: "320px",
      }}
    >
      <div
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
        style={{
          background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
        }}
      />
      <div className="relative p-6">
        <h3
          className="text-xl font-bold flex items-center gap-3 mb-6"
          style={{ color: "#C3BCC2" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#4A5A70" }}
          >
            <BarChart3 className="h-4 w-4" style={{ color: "#C3BCC2" }} />
          </div>
          Quick Stats
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border text-center"
              style={{
                backgroundColor: "#2A2F2F",
                borderColor: "#606364",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: stat.color + "20" }}
              >
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
