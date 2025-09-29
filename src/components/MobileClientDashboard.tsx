"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { trpc } from "@/app/_trpc/client";
import { useState } from "react";
import {
  PlayCircle,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Upload,
  TrendingUp,
  Target,
  Clock,
  Loader2,
  BarChart3,
  FileText,
  ArrowRight,
  ChevronRight,
  Activity,
  Award,
  Zap,
} from "lucide-react";
import ClientTopNav from "@/components/ClientTopNav";

export default function MobileClientDashboard() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = useKindeBrowserClient();

  // tRPC queries for real data - optimized with better caching
  const { data: userProfile, isLoading: profileLoading } =
    trpc.user.getProfile.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });

  const { data: todaysWorkouts = [], isLoading: workoutsLoading } =
    trpc.workouts.getTodaysWorkouts.useQuery(undefined, {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
    });

  const { data: assignedVideos = [], isLoading: videosLoading } =
    trpc.library.getAssignedVideos.useQuery(undefined, {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
    });

  const { data: upcomingEvents = [], isLoading: eventsLoading } =
    trpc.events.getUpcoming.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });

  // Pitching-specific data
  const { data: nextLesson } = trpc.clientRouter.getNextLesson.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const { data: coachNotes } = trpc.clientRouter.getCoachNotes.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const { data: videoAssignments = [] } =
    trpc.clientRouter.getVideoAssignments.useQuery(undefined, {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
    });

  // Simple polling for unread count
  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 10000, // Poll every 10 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  // Get recent notifications
  const { data: recentNotifications = [], isLoading: notificationsLoading } =
    trpc.notifications.getNotifications.useQuery(
      { limit: 3, unreadOnly: false },
      {
        refetchInterval: 30000, // Poll every 30 seconds
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        staleTime: 15 * 1000, // Cache for 15 seconds
        gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
      }
    );

  if (authLoading || profileLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#2B3038" }}
      >
        <div
          className="flex items-center space-x-3"
          style={{ color: "#C3BCC2" }}
        >
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: "#4A5A70" }}
          />
          <span className="text-lg">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#2B3038" }}
      >
        <div className="text-center">
          <h2
            className="text-2xl font-semibold mb-3"
            style={{ color: "#C3BCC2" }}
          >
            Access Denied
          </h2>
          <p className="text-lg" style={{ color: "#ABA4AA" }}>
            Please sign in to access your dashboard.
          </p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Calculate real metrics
  const todaysWorkoutCount = todaysWorkouts.length;
  const hasProgramScheduled = todaysWorkoutCount > 0;
  const upcomingSessionsCount = upcomingEvents.length;

  return (
    <ClientTopNav>
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        {/* Mobile Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {getGreeting()}
                </h1>
                <p className="text-xs text-gray-400">
                  {userProfile?.name ||
                    user?.given_name ||
                    user?.email?.split("@")[0]}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <div className="relative">
                  <MessageCircle className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats - Horizontal Scroll */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <div
              className="flex-shrink-0 w-24 rounded-lg border p-2"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {todaysWorkoutCount}
                </div>
                <div className="text-xs text-gray-400">Drills</div>
              </div>
            </div>
            <div
              className="flex-shrink-0 w-24 rounded-lg border p-2"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {upcomingSessionsCount}
                </div>
                <div className="text-xs text-gray-400">Sessions</div>
              </div>
            </div>
            <div
              className="flex-shrink-0 w-24 rounded-lg border p-2"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {assignedVideos.length}
                </div>
                <div className="text-xs text-gray-400">Videos</div>
              </div>
            </div>
            <div
              className="flex-shrink-0 w-24 rounded-lg border p-2"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {videoAssignments.length}
                </div>
                <div className="text-xs text-gray-400">Assignments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Plan Section */}
        <div
          className="rounded-xl p-4 mb-4 shadow-lg border relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
            borderColor: "#4A5A70",
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <Target className="h-4 w-4" style={{ color: "#C3BCC2" }} />
                </div>
                <h2 className="text-lg font-bold" style={{ color: "#C3BCC2" }}>
                  Today's Plan
                </h2>
              </div>
              <div
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#C3BCC2" }}
                >
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            {hasProgramScheduled ? (
              <div className="space-y-3">
                <div className="mb-3">
                  <h3
                    className="text-base font-semibold"
                    style={{ color: "#C3BCC2" }}
                  >
                    Today's Workouts ({todaysWorkoutCount})
                  </h3>
                </div>

                {workoutsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      style={{ color: "#4A5A70" }}
                    />
                    <span className="ml-2 text-sm" style={{ color: "#ABA4AA" }}>
                      Loading workouts...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todaysWorkouts
                      .slice(0, 2)
                      .map((workout: any, index: number) => (
                        <div
                          key={workout.id}
                          className="p-3 rounded-lg border"
                          style={{
                            backgroundColor: "#353A3A",
                            borderColor: "#606364",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: "#4A5A70" }}
                              >
                                <span
                                  className="text-xs font-bold"
                                  style={{ color: "#C3BCC2" }}
                                >
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <h4
                                  className="font-medium text-sm"
                                  style={{ color: "#C3BCC2" }}
                                >
                                  {workout.template?.title ||
                                    workout.title ||
                                    "Workout"}
                                </h4>
                                <p
                                  className="text-xs"
                                  style={{ color: "#ABA4AA" }}
                                >
                                  {workout.template?.description ||
                                    workout.description ||
                                    "Complete this workout"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock
                                className="h-3 w-3"
                                style={{ color: "#ABA4AA" }}
                              />
                              <span
                                className="text-xs"
                                style={{ color: "#ABA4AA" }}
                              >
                                {workout.template?.estimatedDuration ||
                                  workout.duration ||
                                  "30"}{" "}
                                min
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    {todaysWorkouts.length > 2 && (
                      <div className="text-center">
                        <button
                          className="text-sm px-3 py-1 rounded-lg"
                          style={{
                            backgroundColor: "#4A5A70",
                            color: "#C3BCC2",
                          }}
                        >
                          +{todaysWorkouts.length - 2} more workouts
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 text-center">
                  <a
                    href="/client-program"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: "#4A5A70",
                      color: "#C3BCC2",
                    }}
                  >
                    <Target className="h-4 w-4" />
                    View All Programs
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar
                  className="w-8 h-8 mx-auto mb-3"
                  style={{ color: "#F59E0B" }}
                />
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ color: "#C3BCC2" }}
                >
                  No workouts assigned for today
                </h3>
                <p className="text-sm px-4 mb-4" style={{ color: "#ABA4AA" }}>
                  Your coach hasn't assigned any workouts for today. Check back
                  later or contact your coach.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Next Lesson Card */}
        {nextLesson && (
          <div
            className="rounded-xl p-4 mb-4 shadow-lg border"
            style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" style={{ color: "#4A5A70" }} />
              <h2 className="text-base font-bold" style={{ color: "#C3BCC2" }}>
                Next Lesson
              </h2>
            </div>

            <div
              className="rounded-lg p-3 shadow-lg border mb-3"
              style={{
                background: "linear-gradient(to right, #4A5A70, #606364)",
                borderColor: "#4A5A70",
              }}
            >
              <div className="text-center">
                <div
                  className="text-sm opacity-90 mb-1"
                  style={{ color: "#C3BCC2" }}
                >
                  Next Lesson
                </div>
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: "#C3BCC2" }}
                >
                  {Math.ceil(
                    (new Date(nextLesson.date).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  Days
                </div>
                <div
                  className="text-sm opacity-90"
                  style={{ color: "#C3BCC2" }}
                >
                  {nextLesson.title}
                </div>
              </div>
            </div>

            <div
              className="rounded-lg p-3 border transition-all duration-200 shadow-lg"
              style={{
                backgroundColor: "#2B3038",
                borderColor: "#606364",
                borderWidth: "1px",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="text-sm font-semibold px-2 py-1 rounded border"
                    style={{
                      color: "#C3BCC2",
                      backgroundColor: "#606364",
                      borderColor: "#ABA4AA",
                    }}
                  >
                    {new Date(nextLesson.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: "#C3BCC2" }}
                    >
                      {nextLesson.title}
                    </div>
                    <div className="text-xs" style={{ color: "#ABA4AA" }}>
                      {new Date(nextLesson.date).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
                <Clock className="w-4 h-4" style={{ color: "#ABA4AA" }} />
              </div>
            </div>
          </div>
        )}

        {/* Video Library Section */}
        <div
          className="rounded-xl p-4 mb-4 shadow-lg border"
          style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" style={{ color: "#4A5A70" }} />
              <h2 className="text-base font-bold" style={{ color: "#C3BCC2" }}>
                Assigned Videos
              </h2>
            </div>
            <button
              className="flex items-center text-sm font-medium transition-colors hover:scale-105"
              style={{ color: "#4A5A70" }}
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </button>
          </div>

          {videosLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: "#4A5A70" }}
              />
            </div>
          ) : assignedVideos.length > 0 ? (
            <div className="space-y-3">
              {assignedVideos.slice(0, 2).map(video => (
                <div
                  key={video.id}
                  className="rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 shadow-lg border"
                  style={{
                    backgroundColor: "#2B3038",
                    borderColor: "#606364",
                    borderWidth: "1px",
                  }}
                >
                  <div
                    className="aspect-video relative"
                    style={{ backgroundColor: "#606364" }}
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle
                          className="w-8 h-8"
                          style={{ color: "#ABA4AA" }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3
                      className="text-sm font-semibold mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      {video.title}
                    </h3>
                    <p className="text-xs mb-3" style={{ color: "#ABA4AA" }}>
                      {video.description}
                    </p>
                    <div
                      className="w-full py-2 px-3 rounded-lg text-xs font-medium shadow-lg border"
                      style={{
                        backgroundColor: "#4A5A70",
                        borderColor: "#4A5A70",
                        color: "#C3BCC2",
                      }}
                    >
                      Assigned Video
                    </div>
                  </div>
                </div>
              ))}
              {assignedVideos.length > 2 && (
                <div className="text-center">
                  <button
                    className="text-sm px-3 py-1 rounded-lg"
                    style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                  >
                    +{assignedVideos.length - 2} more videos
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <PlayCircle
                className="w-8 h-8 mx-auto mb-3"
                style={{ color: "#606364" }}
              />
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "#C3BCC2" }}
              >
                No videos assigned yet
              </h3>
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                Your coach will assign training videos soon
              </p>
            </div>
          )}
        </div>

        {/* Coach's Notes */}
        <div
          className="rounded-xl p-4 shadow-lg border"
          style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4" style={{ color: "#4A5A70" }} />
            <h3 className="text-base font-bold" style={{ color: "#C3BCC2" }}>
              Coach's Notes
            </h3>
          </div>
          <div>
            <p
              className="text-sm whitespace-pre-wrap break-words leading-relaxed"
              style={{ color: "#ABA4AA" }}
            >
              {coachNotes?.notes && coachNotes.notes.trim().length > 0
                ? coachNotes.notes
                : "No feedback yet. Your coach will leave notes for you here."}
            </p>
          </div>
          {coachNotes?.updatedAt && (
            <p className="text-xs mt-2" style={{ color: "#606364" }}>
              Last updated: {new Date(coachNotes.updatedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Recent Notifications */}
        <div
          className="rounded-xl p-4 shadow-lg border"
          style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <MessageCircle
                  className="h-4 w-4"
                  style={{ color: "#C3BCC2" }}
                />
              </div>
              <h3 className="text-base font-bold" style={{ color: "#C3BCC2" }}>
                Recent Updates
              </h3>
            </div>
            <a
              href="/notifications"
              className="text-xs font-medium px-2 py-1 rounded transition-colors"
              style={{
                color: "#4A5A70",
                backgroundColor: "#353A3A",
              }}
            >
              View All
            </a>
          </div>

          {notificationsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2
                className="h-4 w-4 animate-spin"
                style={{ color: "#4A5A70" }}
              />
              <span className="ml-2 text-sm" style={{ color: "#ABA4AA" }}>
                Loading...
              </span>
            </div>
          ) : recentNotifications.length > 0 ? (
            <div className="space-y-3">
              {recentNotifications.slice(0, 2).map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    !notification.isRead ? "ring-1 ring-blue-500/20" : ""
                  }`}
                  style={{
                    backgroundColor: notification.isRead
                      ? "#353A3A"
                      : "#2B3038",
                    borderColor: "#606364",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="p-1.5 rounded flex-shrink-0"
                      style={{ backgroundColor: "#4A5A70" }}
                    >
                      {notification.type === "PROGRAM_ASSIGNED" && (
                        <Target
                          className="h-3 w-3"
                          style={{ color: "#C3BCC2" }}
                        />
                      )}
                      {notification.type === "MESSAGE" && (
                        <MessageCircle
                          className="h-3 w-3"
                          style={{ color: "#C3BCC2" }}
                        />
                      )}
                      {notification.type === "LESSON_SCHEDULED" && (
                        <Calendar
                          className="h-3 w-3"
                          style={{ color: "#C3BCC2" }}
                        />
                      )}
                      {![
                        "PROGRAM_ASSIGNED",
                        "MESSAGE",
                        "LESSON_SCHEDULED",
                      ].includes(notification.type) && (
                        <MessageCircle
                          className="h-3 w-3"
                          style={{ color: "#C3BCC2" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className="text-sm font-semibold mb-1"
                        style={{ color: "#C3BCC2" }}
                      >
                        {notification.title}
                      </h4>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "#ABA4AA" }}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#606364" }}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: "#EF4444" }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <MessageCircle
                className="w-8 h-8 mx-auto mb-2"
                style={{ color: "#606364" }}
              />
              <h3
                className="text-sm font-semibold mb-1"
                style={{ color: "#C3BCC2" }}
              >
                No recent updates
              </h3>
              <p className="text-xs" style={{ color: "#ABA4AA" }}>
                You'll see notifications here when your coach sends updates
              </p>
            </div>
          )}
        </div>
      </div>
    </ClientTopNav>
  );
}
