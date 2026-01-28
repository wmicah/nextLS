"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { trpc } from "@/app/_trpc/client";
// Removed complex SSE hooks - using simple polling instead
import { useState } from "react";
import { extractNoteContent } from "@/lib/note-utils";
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
  Video,
  History,
} from "lucide-react";

import ClientSidebar from "@/components/ClientSidebar";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileClientDashboard from "@/components/MobileClientDashboard";
import { LoadingState, DataLoadingState } from "@/components/LoadingState";
import { SkeletonStats, SkeletonCard } from "@/components/SkeletonLoader";
import NotesDisplay from "@/components/NotesDisplay";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";

function ClientDashboard() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = useKindeBrowserClient();

  // tRPC queries for real data - optimized with better caching and reduced queries
  // Batch critical queries together to reduce round trips
  const { data: userProfile, isLoading: profileLoading } =
    trpc.user.getProfile.useQuery(undefined, {
      staleTime: 10 * 60 * 1000, // 10 minutes (increased)
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch if cached
    });

  // Defer non-critical queries - load after initial render
  const { data: todaysWorkouts = [], isLoading: workoutsLoading } =
    trpc.workouts.getTodaysWorkouts.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    });

  const { data: assignedVideos = [], isLoading: videosLoading } =
    trpc.library.getAssignedVideos.useQuery(undefined, {
      staleTime: 15 * 60 * 1000, // 15 minutes (increased)
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    });

  const { data: upcomingEvents = [], isLoading: eventsLoading } =
    trpc.events.getUpcoming.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    });

  // Pitching-specific data (only what we need here)
  const { data: nextLesson } = trpc.clientRouter.getNextLesson.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    }
  );

  const { data: coachNotes } = trpc.clientRouter.getCoachNotes.useQuery(
    undefined,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes (increased)
      gcTime: 20 * 60 * 1000, // 20 minutes
      refetchOnWindowFocus: false,
    }
  );

  const { data: videoAssignments = [] } =
    trpc.clientRouter.getVideoAssignments.useQuery(undefined, {
      staleTime: 15 * 60 * 1000, // 15 minutes (increased)
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    });

  // Optimized unread count with smart caching
  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchInterval: false, // No automatic polling
      refetchOnWindowFocus: false, // Don't refetch on focus
      refetchOnReconnect: true, // Only refetch on reconnect
    }
  );

  // Get recent notifications with optimized caching - defer loading
  const { data: recentNotifications = [], isLoading: notificationsLoading } =
    trpc.notifications.getNotifications.useQuery(
      { limit: 5, unreadOnly: false },
      {
        staleTime: 10 * 60 * 1000, // 10 minutes (increased)
        gcTime: 20 * 60 * 1000, // 20 minutes
        refetchInterval: false, // No automatic polling
        refetchOnWindowFocus: false, // Don't refetch on focus
        refetchOnReconnect: true, // Only refetch on reconnect
      }
    );

  // Debug query to see what's in the database
  const { data: debugData, refetch: refetchDebug } =
    trpc.workouts.debugWorkouts.useQuery(undefined, {
      enabled: false, // Don't run automatically
    });

  if (authLoading || profileLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#2B3038" }}
      >
        <LoadingState
          isLoading={true}
          skeleton={
            <div style={{ minHeight: "400px", width: "100%" }}>
              <SkeletonStats />
            </div>
          }
          className="p-8"
        >
          <div />
        </LoadingState>
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

  // Debug logging
  console.log("Today's workouts:", todaysWorkouts);
  console.log("Workout count:", todaysWorkoutCount);
  console.log("Has program scheduled:", hasProgramScheduled);
  console.log("Debug data:", debugData);
  const upcomingSessionsCount = upcomingEvents.length;

  return (
    <ClientSidebar
      user={{
        name: userProfile?.name || "",
        email: userProfile?.email || user?.email || "",
      }}
    >
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        <PushNotificationPrompt />
        {/* Mobile Header */}
        <div className="md:hidden mb-4">
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

        {/* Desktop Header Section with Gradient Background */}
        <div className="hidden md:block mb-8 md:mb-12">
          <div
            className="rounded-2xl md:rounded-3xl p-4 md:p-8 mb-6 md:mb-8 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
              border: "1px solid #606364",
            }}
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: "linear-gradient(45deg, #4A5A70, #606364)",
                }}
              />
            </div>
            <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: "linear-gradient(45deg, #4A5A70, #606364)",
                }}
              />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
              <div className="flex-1">
                <h1 className="text-3xl md:text-6xl font-bold mb-2 md:mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
                  {getGreeting()},{" "}
                  {userProfile?.name ||
                    user?.given_name ||
                    user?.email?.split("@")[0]}
                  !
                </h1>
                <div
                  className="text-base md:text-xl flex items-center gap-3"
                  style={{ color: "#ABA4AA" }}
                >
                  <div
                    className="p-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <TrendingUp
                      className="h-4 w-4 md:h-5 md:w-5"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <span className="text-sm md:text-xl">
                    Ready to crush today&apos;s training?
                  </span>
                </div>
                <div className="mt-4">
                  <a
                    href="/client-program"
                    className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 touch-manipulation"
                    style={{
                      backgroundColor: "#EF4444",
                      color: "#FFFFFF",
                    }}
                  >
                    <Target className="h-4 w-4" />
                    View Pitching Dashboard
                  </a>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div
                  className="text-2xl md:text-4xl font-bold mb-2"
                  style={{ color: "#C3BCC2" }}
                >
                  {new Date().toLocaleDateString()}
                </div>
                <div
                  className="text-base md:text-lg px-3 md:px-4 py-1 md:py-2 rounded-full inline-block"
                  style={{
                    backgroundColor: "#4A5A70",
                    color: "#C3BCC2",
                  }}
                >
                  {new Date().toLocaleDateString("en-US", { weekday: "long" })}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div
              className="rounded-2xl md:rounded-3xl p-4 md:p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group touch-manipulation"
              style={{
                background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                borderColor: "#4A5A70",
              }}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div
                    className="p-2 md:p-3 rounded-xl md:rounded-2xl"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <Target
                      className="h-6 w-6 md:h-8 md:w-8"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <span
                    className="text-2xl md:text-4xl font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    {todaysWorkoutCount}
                  </span>
                </div>
                <h3
                  className="text-lg md:text-xl font-bold mb-2 md:mb-3"
                  style={{ color: "#C3BCC2" }}
                >
                  Today&apos;s Drills
                </h3>
                <p
                  className="text-sm md:text-base"
                  style={{ color: "#ABA4AA" }}
                >
                  {todaysWorkoutCount > 0 ? "Ready to go!" : "No drills today"}
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl md:rounded-3xl p-4 md:p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group touch-manipulation"
              style={{
                background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                borderColor: "#F59E0B",
              }}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div
                    className="p-2 md:p-3 rounded-xl md:rounded-2xl"
                    style={{ backgroundColor: "#F59E0B" }}
                  >
                    <Calendar
                      className="h-6 w-6 md:h-8 md:w-8"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <span
                    className="text-2xl md:text-4xl font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    {upcomingSessionsCount}
                  </span>
                </div>
                <h3
                  className="text-lg md:text-xl font-bold mb-2 md:mb-3"
                  style={{ color: "#C3BCC2" }}
                >
                  Upcoming Sessions
                </h3>
                <p
                  className="text-sm md:text-base"
                  style={{ color: "#ABA4AA" }}
                >
                  {upcomingSessionsCount > 0 ? "This week" : "Schedule clear"}
                </p>
              </div>
            </div>

            {/* Coach's Notes Card */}
            <div
              className="lg:col-span-2 rounded-2xl md:rounded-3xl p-4 md:p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group touch-manipulation"
              style={{
                background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                borderColor: "#4A5A70",
              }}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div
                    className="p-2 md:p-3 rounded-xl md:rounded-2xl"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <FileText
                      className="h-6 w-6 md:h-8 md:w-8"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                </div>
                <h3
                  className="text-lg md:text-xl font-bold mb-2 md:mb-3"
                  style={{ color: "#C3BCC2" }}
                >
                  Coach&apos;s Notes
                </h3>

                {/* Show recent notes or placeholder */}
                <div className="space-y-3">
                  {coachNotes?.notes &&
                  extractNoteContent(coachNotes.notes).trim().length > 0 ? (
                    <div>
                      <p
                        className="text-sm md:text-base line-clamp-3"
                        style={{ color: "#ABA4AA" }}
                      >
                        {extractNoteContent(coachNotes.notes)}
                      </p>
                      {coachNotes.updatedAt && (
                        <p
                          className="text-xs mt-2"
                          style={{ color: "#606364" }}
                        >
                          {new Date(coachNotes.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p
                      className="text-sm md:text-base"
                      style={{ color: "#ABA4AA" }}
                    >
                      No feedback yet
                    </p>
                  )}

                  <div className="mt-4">
                    <NotesDisplay isClientView={true} showComposer={false} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Stats - Horizontal Scroll */}
        <div className="md:hidden mb-4">
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-3 md:space-y-8">
            {/* Today's Plan Section */}
            <div
              className="rounded-xl md:rounded-3xl p-3 md:p-8 shadow-lg md:shadow-2xl border relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                borderColor: "#4A5A70",
              }}
            >
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background: "linear-gradient(45deg, #4A5A70, #606364)",
                  }}
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 md:mb-8">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div
                      className="p-2 md:p-3 rounded-lg md:rounded-2xl"
                      style={{ backgroundColor: "#4A5A70" }}
                    >
                      <Target
                        className="h-5 w-5 md:h-6 md:w-6"
                        style={{ color: "#C3BCC2" }}
                      />
                    </div>
                    <h2
                      className="text-xl md:text-3xl font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      Today&apos;s Plan
                    </h2>
                  </div>
                  <div
                    className="px-3 md:px-4 py-1 md:py-2 rounded-full hidden sm:block"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <span
                      className="text-sm md:text-lg font-semibold"
                      style={{ color: "#C3BCC2" }}
                    >
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {hasProgramScheduled ? (
                  <div className="space-y-4">
                    <div className="mb-4">
                      <h3
                        className="text-lg md:text-xl font-semibold"
                        style={{ color: "#C3BCC2" }}
                      >
                        Today's Workouts ({todaysWorkoutCount})
                      </h3>
                    </div>

                    <DataLoadingState
                      isLoading={workoutsLoading}
                      data={todaysWorkouts}
                      emptyState={
                        <div
                          className="text-center py-8"
                          style={{ color: "#ABA4AA" }}
                        >
                          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">
                            No workouts today
                          </p>
                          <p className="text-sm">
                            Check back tomorrow for your next session!
                          </p>
                        </div>
                      }
                    >
                      <div className="space-y-3">
                        {todaysWorkouts.map((workout: any, index: number) => (
                          <div
                            key={workout.id}
                            className="p-4 rounded-xl border"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: "#4A5A70" }}
                                >
                                  <span
                                    className="text-sm font-bold"
                                    style={{ color: "#C3BCC2" }}
                                  >
                                    {index + 1}
                                  </span>
                                </div>
                                <div>
                                  <h4
                                    className="font-medium"
                                    style={{ color: "#C3BCC2" }}
                                  >
                                    {workout.template?.title ||
                                      workout.title ||
                                      "Workout"}
                                  </h4>
                                  <p
                                    className="text-sm"
                                    style={{ color: "#ABA4AA" }}
                                  >
                                    {workout.template?.description ||
                                      workout.description ||
                                      "Complete this workout"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock
                                  className="h-4 w-4"
                                  style={{ color: "#ABA4AA" }}
                                />
                                <span
                                  className="text-sm"
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
                      </div>
                    </DataLoadingState>

                    <div className="mt-6 text-center">
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
                  <div className="text-center py-8 md:py-16">
                    <Calendar
                      className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6"
                      style={{ color: "#F59E0B" }}
                    />
                    <h3
                      className="text-lg md:text-xl font-semibold mb-2 md:mb-3"
                      style={{ color: "#C3BCC2" }}
                    >
                      No workouts assigned for today
                    </h3>
                    <p
                      className="text-sm md:text-base px-4 mb-6"
                      style={{ color: "#ABA4AA" }}
                    >
                      Your coach hasn't assigned any workouts for today. Check
                      back later or contact your coach.
                    </p>
                    {debugData && (
                      <div
                        className="mt-4 p-4 rounded-lg border"
                        style={{
                          backgroundColor: "#1F2937",
                          borderColor: "#4A5A70",
                        }}
                      >
                        <h4
                          className="text-sm font-semibold mb-2"
                          style={{ color: "#C3BCC2" }}
                        >
                          Debug Info:
                        </h4>
                        <p className="text-xs" style={{ color: "#ABA4AA" }}>
                          User: {debugData.user?.email}
                          <br />
                          Clients in DB: {debugData.clients?.length || 0}
                          <br />
                          Program Assignments:{" "}
                          {debugData.programAssignments?.length || 0}
                          <br />
                          Workouts in DB: {debugData.workouts?.length || 0}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Video Library Section */}
            <div
              className="rounded-2xl p-4 md:p-8 shadow-xl border"
              style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-4 md:mb-8">
                <div className="flex items-center gap-2 md:gap-3">
                  <PlayCircle
                    className="h-5 w-5 md:h-6 md:w-6"
                    style={{ color: "#4A5A70" }}
                  />
                  <h2
                    className="text-lg md:text-2xl font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    Assigned Videos
                  </h2>
                </div>
                <button
                  className="flex items-center text-base font-medium transition-colors hover:scale-105"
                  style={{ color: "#4A5A70" }}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload for Review
                </button>
              </div>

              <DataLoadingState
                isLoading={videosLoading}
                data={assignedVideos}
                emptyState={
                  <div className="text-center py-16">
                    <Video
                      className="h-16 w-16 mx-auto mb-4 opacity-50"
                      style={{ color: "#ABA4AA" }}
                    />
                    <h3
                      className="text-lg font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      No videos assigned
                    </h3>
                    <p className="text-sm" style={{ color: "#ABA4AA" }}>
                      Your coach will assign training videos soon
                    </p>
                  </div>
                }
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {assignedVideos.map((video: any) => (
                    <div
                      key={video.id}
                      className="rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 shadow-lg border"
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
                              className="w-16 h-16"
                              style={{ color: "#ABA4AA" }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3
                          className="text-lg font-semibold mb-3"
                          style={{ color: "#C3BCC2" }}
                        >
                          {video.title}
                        </h3>
                        <p
                          className="text-base mb-4"
                          style={{ color: "#ABA4AA" }}
                        >
                          {video.description}
                        </p>
                        <div
                          className="w-full py-3 px-6 rounded-xl text-base font-medium shadow-lg border"
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
                </div>
              </DataLoadingState>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="flex flex-col gap-4 md:gap-8 h-full">
            {/* Next Lesson */}
            <div
              className="rounded-2xl p-4 md:p-8 shadow-xl border"
              style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
            >
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8">
                <Calendar
                  className="h-5 w-5 md:h-6 md:w-6"
                  style={{ color: "#4A5A70" }}
                />
                <h2
                  className="text-lg md:text-2xl font-bold"
                  style={{ color: "#C3BCC2" }}
                >
                  Next Lesson
                </h2>
              </div>

              {nextLesson ? (
                <div className="space-y-6">
                  {/* Next Lesson Countdown */}
                  <div
                    className="rounded-xl p-6 shadow-lg border"
                    style={{
                      background: "linear-gradient(to right, #4A5A70, #606364)",
                      borderColor: "#4A5A70",
                    }}
                  >
                    <div className="text-center">
                      <div
                        className="text-base opacity-90 mb-2"
                        style={{ color: "#C3BCC2" }}
                      >
                        Next Lesson
                      </div>
                      <div
                        className="text-3xl font-bold mb-2"
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
                        className="text-base opacity-90"
                        style={{ color: "#C3BCC2" }}
                      >
                        {nextLesson.title}
                      </div>
                    </div>
                  </div>

                  {/* Lesson Details */}
                  <div
                    className="rounded-xl p-4 border transition-all duration-200 shadow-lg"
                    style={{
                      backgroundColor:
                        nextLesson.status === "CONFIRMED"
                          ? "#065F46"
                          : "#2B3038",
                      borderColor:
                        nextLesson.status === "CONFIRMED"
                          ? "#10B981"
                          : "#606364",
                      borderWidth: "1px",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className="text-base font-semibold px-3 py-2 rounded-lg border"
                          style={{
                            color:
                              nextLesson.status === "CONFIRMED"
                                ? "#D1FAE5"
                                : "#C3BCC2",
                            backgroundColor:
                              nextLesson.status === "CONFIRMED"
                                ? "#10B981"
                                : "#606364",
                            borderColor:
                              nextLesson.status === "CONFIRMED"
                                ? "#10B981"
                                : "#ABA4AA",
                          }}
                        >
                          {new Date(nextLesson.date).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                        <div>
                          <div
                            className="text-base font-semibold"
                            style={{
                              color:
                                nextLesson.status === "CONFIRMED"
                                  ? "#D1FAE5"
                                  : "#C3BCC2",
                            }}
                          >
                            {nextLesson.title}
                          </div>
                          <div
                            className="text-sm"
                            style={{
                              color:
                                nextLesson.status === "CONFIRMED"
                                  ? "#86EFAC"
                                  : "#ABA4AA",
                            }}
                          >
                            {new Date(nextLesson.date).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                          {(nextLesson as any).coach && (
                            <div
                              className="text-xs mt-1"
                              style={{
                                color:
                                  nextLesson.status === "CONFIRMED"
                                    ? "#86EFAC"
                                    : "#ABA4AA",
                              }}
                            >
                              Coach: {(nextLesson as any).coach.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <Clock
                        className="w-5 h-5"
                        style={{
                          color:
                            nextLesson.status === "CONFIRMED"
                              ? "#86EFAC"
                              : "#ABA4AA",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar
                    className="w-16 h-16 mx-auto mb-6"
                    style={{ color: "#606364" }}
                  />
                  <h3
                    className="text-xl font-semibold mb-3"
                    style={{ color: "#C3BCC2" }}
                  >
                    No upcoming lessons
                  </h3>
                  <p className="text-base" style={{ color: "#ABA4AA" }}>
                    Contact your coach to schedule your next lesson
                  </p>
                </div>
              )}
            </div>

            {/* Recent Notifications */}
            <div
              className="rounded-2xl p-8 shadow-xl border"
              style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <MessageCircle
                      className="h-5 w-5"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <h3
                    className="text-xl font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    Recent Updates
                  </h3>
                </div>
                <a
                  href="/notifications"
                  className="text-sm font-medium px-3 py-1 rounded-lg transition-colors"
                  style={{
                    color: "#4A5A70",
                    backgroundColor: "#353A3A",
                  }}
                >
                  View All
                </a>
              </div>

              <DataLoadingState
                isLoading={notificationsLoading}
                data={recentNotifications}
                emptyState={
                  <div
                    className="text-center py-8"
                    style={{ color: "#ABA4AA" }}
                  >
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      No notifications yet
                    </p>
                    <p className="text-sm">
                      You'll see updates from your coach here
                    </p>
                  </div>
                }
              >
                <div className="space-y-4">
                  {recentNotifications.slice(0, 3).map((notification: any) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-xl border transition-all duration-200 ${
                        !notification.isRead ? "ring-2 ring-blue-500/20" : ""
                      }`}
                      style={{
                        backgroundColor: notification.isRead
                          ? "#353A3A"
                          : "#2B3038",
                        borderColor: "#606364",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: "#4A5A70" }}
                        >
                          {notification.type === "PROGRAM_ASSIGNED" && (
                            <Target
                              className="h-4 w-4"
                              style={{ color: "#C3BCC2" }}
                            />
                          )}
                          {notification.type === "MESSAGE" && (
                            <MessageCircle
                              className="h-4 w-4"
                              style={{ color: "#C3BCC2" }}
                            />
                          )}
                          {notification.type === "LESSON_SCHEDULED" && (
                            <Calendar
                              className="h-4 w-4"
                              style={{ color: "#C3BCC2" }}
                            />
                          )}
                          {![
                            "PROGRAM_ASSIGNED",
                            "MESSAGE",
                            "LESSON_SCHEDULED",
                          ].includes(notification.type) && (
                            <MessageCircle
                              className="h-4 w-4"
                              style={{ color: "#C3BCC2" }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className="font-semibold mb-1"
                            style={{ color: "#C3BCC2" }}
                          >
                            {notification.title}
                          </h4>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "#ABA4AA" }}
                          >
                            {notification.message}
                          </p>
                          <p
                            className="text-xs mt-2"
                            style={{ color: "#606364" }}
                          >
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                            style={{ backgroundColor: "#EF4444" }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </DataLoadingState>
            </div>
          </div>
        </div>
      </div>
    </ClientSidebar>
  );
}

export default withMobileDetection(MobileClientDashboard, ClientDashboard);
