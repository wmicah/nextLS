"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { trpc } from "@/app/_trpc/client";
import { useState } from "react";
import { extractNoteContent } from "@/lib/note-utils";
import { useMessagingService } from "@/components/MessagingServiceProvider";
import { Loader2 } from "lucide-react";
import ClientTopNav from "@/components/ClientTopNav";
import { isSameDay } from "date-fns";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import { COLORS, getGoldenAccent } from "@/lib/colors";

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

  // Fetch routine assignments for mobile dashboard
  const { data: routineAssignments = [] } =
    trpc.clientRouter.getRoutineAssignments.useQuery(undefined, {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
    });

  // Get realtime connection status - only poll when realtime not connected
  const { isConnected: realtimeConnected } = useMessagingService();

  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    {
      // Only poll as fallback when Supabase Realtime isn't connected
      refetchInterval: !realtimeConnected ? 30000 : false,
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
        className="min-h-[100dvh] flex items-center justify-center"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          className="flex items-center space-x-3"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: COLORS.GOLDEN_ACCENT }}
          />
          <span className="text-lg" style={{ color: COLORS.TEXT_PRIMARY }}>
            Loading your dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="text-center px-4">
          <h2
            className="text-xl sm:text-2xl font-semibold mb-3"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Access Denied
          </h2>
          <p
            className="text-base sm:text-lg"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
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
      <div
        className="min-h-[100dvh]"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom:
            "max(5rem, calc(5rem + env(safe-area-inset-bottom, 0px)))",
        }}
      >
        <div className="pt-4 px-4">
          <PushNotificationPrompt />
        </div>
        {/* Mobile Header - matches desktop greeting + readability */}
        <div className="mb-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <h1
                  className="text-lg sm:text-xl font-bold truncate"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {getGreeting()}
                </h1>
                <p
                  className="text-sm truncate"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  {userProfile?.name ||
                    user?.given_name ||
                    user?.email?.split("@")[0]}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {unreadCount > 0 && (
                <a
                  href="/client-messages"
                  className="relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg touch-manipulation px-3"
                  style={{
                    backgroundColor: getGoldenAccent(0.15),
                    color: COLORS.GOLDEN_ACCENT,
                  }}
                  aria-label={`${unreadCount} unread messages`}
                >
                  <span className="text-sm font-medium">Messages</span>
                  <span
                    className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{
                      backgroundColor: COLORS.RED_ALERT,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats - Horizontal Scroll with Links; touch-friendly, readable */}
        <div className="mb-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth scrollbar-thin">
            <a
              href="/client-program"
              className="flex-shrink-0 w-24 min-h-[52px] rounded-xl border p-3 snap-start active:scale-[0.98] transition-transform touch-manipulation"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <div className="text-center">
                <div
                  className="text-lg font-bold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {todaysWorkoutCount}
                </div>
                <div
                  className="text-xs sm:text-sm"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  Drills
                </div>
              </div>
            </a>
            <a
              href="/client-schedule"
              className="flex-shrink-0 w-24 min-h-[52px] rounded-xl border p-3 snap-start active:scale-[0.98] transition-transform touch-manipulation"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <div className="text-center">
                <div
                  className="text-lg font-bold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {upcomingSessionsCount}
                </div>
                <div
                  className="text-xs sm:text-sm"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  Lessons
                </div>
              </div>
            </a>
            <div
              className="flex-shrink-0 w-24 min-h-[52px] rounded-xl border p-3 snap-start"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <div className="text-center">
                <div
                  className="text-lg font-bold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {assignedVideos.length}
                </div>
                <div
                  className="text-xs sm:text-sm"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  Videos
                </div>
              </div>
            </div>
            <div
              className="flex-shrink-0 w-24 min-h-[52px] rounded-xl border p-3 snap-start"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <div className="text-center">
                <div
                  className="text-lg font-bold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {videoAssignments.length}
                </div>
                <div
                  className="text-xs sm:text-sm"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  Assignments
                </div>
              </div>
            </div>
            <a
              href="/client-program"
              className="flex-shrink-0 w-24 min-h-[52px] rounded-xl border p-3 snap-start active:scale-[0.98] transition-transform touch-manipulation"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <div className="text-center">
                <div
                  className="text-lg font-bold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {routineAssignments.length}
                </div>
                <div
                  className="text-xs sm:text-sm"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  Routines
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Main content - consistent horizontal padding */}
        <div className="px-4 space-y-4">
          {/* Today's Plan Section */}
          <div
            className="rounded-xl p-4 shadow-lg border relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${COLORS.BACKGROUND_CARD} 0%, ${COLORS.BACKGROUND_DARK} 100%)`,
              borderColor: COLORS.BORDER_ACCENT || getGoldenAccent(0.3),
            }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-lg font-bold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Today's Plan
                </h2>
                <div
                  className="px-3 py-1.5 rounded-full min-h-[36px] flex items-center"
                  style={{ backgroundColor: getGoldenAccent(0.2) }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: COLORS.GOLDEN_ACCENT }}
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
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      Today's Workouts ({todaysWorkoutCount})
                    </h3>
                  </div>

                  {workoutsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2
                        className="h-5 w-5 animate-spin"
                        style={{ color: COLORS.GOLDEN_ACCENT }}
                      />
                      <span
                        className="ml-2 text-sm"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
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
                              backgroundColor: COLORS.BACKGROUND_DARK,
                              borderColor: COLORS.BORDER_SUBTLE,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center"
                                  style={{
                                    backgroundColor: getGoldenAccent(0.2),
                                  }}
                                >
                                  <span
                                    className="text-xs font-bold"
                                    style={{ color: COLORS.GOLDEN_ACCENT }}
                                  >
                                    {index + 1}
                                  </span>
                                </div>
                                <div>
                                  <h4
                                    className="font-medium text-sm"
                                    style={{ color: COLORS.TEXT_PRIMARY }}
                                  >
                                    {workout.template?.title ||
                                      workout.title ||
                                      "Workout"}
                                  </h4>
                                  <p
                                    className="text-xs"
                                    style={{ color: COLORS.TEXT_MUTED }}
                                  >
                                    {workout.template?.description ||
                                      workout.description ||
                                      "Complete this workout"}
                                  </p>
                                </div>
                              </div>
                              <span
                                className="text-xs"
                                style={{ color: COLORS.TEXT_MUTED }}
                              >
                                {workout.template?.estimatedDuration ||
                                  workout.duration ||
                                  "30"}{" "}
                                min
                              </span>
                            </div>
                          </div>
                        ))}
                      {todaysWorkouts.length > 2 && (
                        <div className="text-center">
                          <a
                            href="/client-program"
                            className="inline-block text-sm px-4 py-2.5 rounded-lg min-h-[44px] touch-manipulation"
                            style={{
                              backgroundColor: getGoldenAccent(0.2),
                              color: COLORS.GOLDEN_ACCENT,
                            }}
                          >
                            +{todaysWorkouts.length - 2} more workouts
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 text-center">
                    <a
                      href="/client-program"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium min-h-[44px] touch-manipulation"
                      style={{
                        backgroundColor: COLORS.GOLDEN_ACCENT,
                        color: COLORS.BACKGROUND_DARK,
                      }}
                    >
                      View All Programs
                    </a>
                  </div>

                  {/* Today's Routines Section */}
                  {routineAssignments.length > 0 && (
                    <div className="mt-6">
                      <div className="mb-3">
                        <h3
                          className="text-base font-semibold"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          Today's Routines ({routineAssignments.length})
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {routineAssignments
                          .filter((routine: any) => {
                            const today = new Date();
                            const routineDate = new Date(routine.startDate);
                            return isSameDay(today, routineDate);
                          })
                          .slice(0, 2)
                          .map((routine: any, index: number) => (
                            <div
                              key={routine.id}
                              className="p-3 rounded-lg border"
                              style={{
                                backgroundColor: COLORS.BACKGROUND_DARK,
                                borderColor: COLORS.BORDER_SUBTLE,
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center"
                                    style={{
                                      backgroundColor: getGoldenAccent(0.25),
                                    }}
                                  >
                                    <span
                                      className="text-xs font-bold"
                                      style={{ color: COLORS.GOLDEN_ACCENT }}
                                    >
                                      R
                                    </span>
                                  </div>
                                  <div>
                                    <h4
                                      className="font-medium text-sm"
                                      style={{ color: COLORS.TEXT_PRIMARY }}
                                    >
                                      {routine.routine?.name || "Routine"}
                                    </h4>
                                    <p
                                      className="text-xs"
                                      style={{ color: COLORS.TEXT_MUTED }}
                                    >
                                      {routine.routine?.exercises?.length || 0}{" "}
                                      exercises
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className="text-xs"
                                  style={{ color: COLORS.TEXT_MUTED }}
                                >
                                  Routine
                                </span>
                              </div>
                            </div>
                          ))}
                        {routineAssignments.filter((routine: any) => {
                          const today = new Date();
                          const routineDate = new Date(routine.startDate);
                          return isSameDay(today, routineDate);
                        }).length > 2 && (
                          <div className="text-center">
                            <a
                              href="/client-program"
                              className="inline-block text-sm px-4 py-2.5 rounded-lg min-h-[44px] touch-manipulation"
                              style={{
                                backgroundColor: getGoldenAccent(0.25),
                                color: COLORS.GOLDEN_ACCENT,
                              }}
                            >
                              +
                              {routineAssignments.filter((routine: any) => {
                                const today = new Date();
                                const routineDate = new Date(routine.startDate);
                                return isSameDay(today, routineDate);
                              }).length - 2}{" "}
                              more routines
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <h3
                    className="text-base font-semibold mb-2"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    No workouts assigned for today
                  </h3>
                  <p
                    className="text-sm px-4 mb-4"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Your coach hasn't assigned any workouts for today. Check
                    back later or contact your coach.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Lessons Card - ALWAYS SHOW */}
          <div
            className="rounded-xl p-4 shadow-lg border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-base font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Upcoming Lessons
              </h2>
              <a
                href="/client-schedule"
                className="text-sm font-medium px-4 py-2.5 rounded-lg min-h-[44px] flex items-center touch-manipulation"
                style={{
                  color: COLORS.GOLDEN_ACCENT,
                  backgroundColor: getGoldenAccent(0.15),
                }}
              >
                View All
              </a>
            </div>

            {nextLesson ? (
              <>
                {/* Next Lesson - Prominent Display */}
                <div
                  className="rounded-lg p-3 shadow-lg border mb-3"
                  style={{
                    background: `linear-gradient(to right, ${getGoldenAccent(0.3)}, ${getGoldenAccent(0.2)})`,
                    borderColor: COLORS.BORDER_ACCENT,
                  }}
                >
                  <div className="text-center">
                    <div
                      className="text-xs opacity-90 mb-1"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      Next Lesson
                    </div>
                    <div
                      className="text-2xl font-bold mb-1"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {Math.ceil(
                        (new Date(nextLesson.date).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) === 0
                        ? "TODAY"
                        : `${Math.ceil(
                            (new Date(nextLesson.date).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )} Day${
                            Math.ceil(
                              (new Date(nextLesson.date).getTime() -
                                new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            ) === 1
                              ? ""
                              : "s"
                          }`}
                    </div>
                    <div
                      className="text-xs opacity-90"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {new Date(nextLesson.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                {/* Lesson Details */}
                <div
                  className="rounded-lg p-3 border transition-all duration-200 shadow-lg mb-3"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="text-sm font-semibold px-2 py-1 rounded border"
                        style={{
                          color: COLORS.TEXT_PRIMARY,
                          backgroundColor: getGoldenAccent(0.2),
                          borderColor: COLORS.BORDER_SUBTLE,
                        }}
                      >
                        {new Date(nextLesson.date).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                      <div>
                        <div
                          className="text-sm font-semibold"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          {nextLesson.title || "Lesson"}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          {nextLesson.description ||
                            "Training session with coach"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Upcoming Lessons */}
                {upcomingEvents.length > 1 && (
                  <div className="space-y-2">
                    <div
                      className="text-xs font-semibold"
                      style={{ color: COLORS.TEXT_MUTED }}
                    >
                      Other Upcoming Lessons ({upcomingEvents.length - 1})
                    </div>
                    {upcomingEvents.slice(1, 3).map((event: any) => (
                      <div
                        key={event.id}
                        className="rounded-lg p-2 border"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className="text-xs font-medium"
                              style={{ color: COLORS.TEXT_PRIMARY }}
                            >
                              {new Date(event.date).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </div>
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: COLORS.TEXT_MUTED }}
                          >
                            {new Date(event.date).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {upcomingEvents.length > 3 && (
                      <div className="text-center">
                        <a
                          href="/client-schedule"
                          className="text-sm px-4 py-2.5 rounded-lg inline-flex items-center min-h-[44px] touch-manipulation"
                          style={{
                            backgroundColor: getGoldenAccent(0.2),
                            color: COLORS.GOLDEN_ACCENT,
                          }}
                        >
                          View {upcomingEvents.length - 3} More Lessons
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  No Upcoming Lessons
                </h3>
                <p
                  className="text-sm px-4 mb-4"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  You don't have any lessons scheduled yet. Your coach will
                  schedule sessions with you.
                </p>
                <a
                  href="/client-schedule"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium min-h-[44px] touch-manipulation"
                  style={{
                    backgroundColor: COLORS.GOLDEN_ACCENT,
                    color: COLORS.BACKGROUND_DARK,
                  }}
                >
                  View Schedule
                </a>
              </div>
            )}
          </div>

          {/* Video Library Section */}
          <div
            className="rounded-xl p-4 shadow-lg border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-base font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Assigned Videos
              </h2>
              <button
                type="button"
                className="flex items-center text-sm font-medium min-h-[44px] px-3 rounded-lg touch-manipulation"
                style={{ color: COLORS.GOLDEN_ACCENT }}
              >
                Upload
              </button>
            </div>

            {videosLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2
                  className="h-6 w-6 animate-spin"
                  style={{ color: COLORS.GOLDEN_ACCENT }}
                />
              </div>
            ) : assignedVideos.length > 0 ? (
              <div className="space-y-3">
                {assignedVideos.slice(0, 2).map(video => (
                  <div
                    key={video.id}
                    className="rounded-lg overflow-hidden shadow-lg border"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                  >
                    <div
                      className="aspect-video relative"
                      style={{ backgroundColor: COLORS.TEXT_MUTED }}
                    >
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center text-sm"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          Video
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3
                        className="text-sm font-semibold mb-2"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {video.title}
                      </h3>
                      <p
                        className="text-xs mb-3"
                        style={{ color: COLORS.TEXT_MUTED }}
                      >
                        {video.description}
                      </p>
                      <div
                        className="w-full py-2 px-3 rounded-lg text-xs font-medium border"
                        style={{
                          backgroundColor: getGoldenAccent(0.15),
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.GOLDEN_ACCENT,
                        }}
                      >
                        Assigned Video
                      </div>
                    </div>
                  </div>
                ))}
                {assignedVideos.length > 2 && (
                  <div className="text-center">
                    <a
                      href="/client-program"
                      className="inline-block text-sm px-4 py-2.5 rounded-lg min-h-[44px] touch-manipulation"
                      style={{
                        backgroundColor: getGoldenAccent(0.2),
                        color: COLORS.GOLDEN_ACCENT,
                      }}
                    >
                      +{assignedVideos.length - 2} more videos
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  No videos assigned yet
                </h3>
                <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                  Your coach will assign training videos soon
                </p>
              </div>
            )}
          </div>

          {/* Coach's Notes */}
          <div
            className="rounded-xl p-4 shadow-lg border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <h3
              className="text-base font-bold mb-3"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Coach's Notes
            </h3>
            <div>
              <p
                className="text-sm whitespace-pre-wrap break-words leading-relaxed"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {coachNotes?.notes &&
                extractNoteContent(coachNotes.notes).trim().length > 0
                  ? extractNoteContent(coachNotes.notes)
                  : "No feedback yet. Your coach will leave notes for you here."}
              </p>
            </div>
            {coachNotes?.updatedAt && (
              <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>
                Last updated: {new Date(coachNotes.updatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Recent Notifications */}
          <div
            className="rounded-xl p-4 shadow-lg border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-base font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Recent Updates
              </h3>
              <a
                href="/client-notifications"
                className="text-sm font-medium px-4 py-2.5 rounded-lg min-h-[44px] flex items-center touch-manipulation"
                style={{
                  color: COLORS.GOLDEN_ACCENT,
                  backgroundColor: getGoldenAccent(0.1),
                }}
              >
                View All
              </a>
            </div>

            {notificationsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2
                  className="h-4 w-4 animate-spin"
                  style={{ color: COLORS.GOLDEN_ACCENT }}
                />
                <span
                  className="ml-2 text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Loading...
                </span>
              </div>
            ) : recentNotifications.length > 0 ? (
              <div className="space-y-3">
                {recentNotifications.slice(0, 2).map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-all duration-200 ${!notification.isRead ? "ring-1 ring-offset-0 ring-amber-400/30" : ""}`}
                    style={{
                      backgroundColor: notification.isRead
                        ? COLORS.BACKGROUND_DARK
                        : COLORS.BACKGROUND_CARD,
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-sm font-semibold mb-1"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          {notification.title}
                        </h4>
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          {notification.message}
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: COLORS.RED_ALERT }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  No recent updates
                </h3>
                <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                  You'll see notifications here when your coach sends updates
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientTopNav>
  );
}
