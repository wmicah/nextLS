"use client"

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { trpc } from "@/app/_trpc/client"
import { useState } from "react"
import {
  PlayCircle,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Upload,
  Bell,
  TrendingUp,
  Target,
  Clock,
  Loader2,
} from "lucide-react"

import ClientSidebar from "@/components/ClientSidebar"

export default function ClientDashboard() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = useKindeBrowserClient()

  // tRPC queries for real data
  const { data: userProfile, isLoading: profileLoading } =
    trpc.user.getProfile.useQuery()
  const { data: todaysWorkouts = [], isLoading: workoutsLoading } =
    trpc.workouts.getTodaysWorkouts.useQuery()
  const { data: assignedVideos = [], isLoading: videosLoading } =
    trpc.library.getAssignedVideos.useQuery()
  const { data: progressData, isLoading: progressLoading } =
    trpc.progress.getClientProgress.useQuery()
  const { data: upcomingEvents = [], isLoading: eventsLoading } =
    trpc.events.getUpcoming.useQuery()
  const { data: conversations = [], isLoading: messagesLoading } =
    trpc.messaging.getConversations.useQuery()
  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery()

  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([])
  const [watchedVideos, setWatchedVideos] = useState<string[]>([])

  const toggleWorkoutComplete = (workoutId: string) => {
    setCompletedWorkouts((prev) =>
      prev.includes(workoutId)
        ? prev.filter((id) => id !== workoutId)
        : [...prev, workoutId]
    )
  }

  const toggleVideoWatched = (videoId: string) => {
    setWatchedVideos((prev) =>
      prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId]
    )
  }

  if (authLoading || profileLoading) {
    return (
      <div
        className='min-h-screen flex items-center justify-center'
        style={{ backgroundColor: "#2A3133" }}
      >
        <div
          className='flex items-center space-x-2'
          style={{ color: "#C3BCC2" }}
        >
          <Loader2
            className='h-6 w-6 animate-spin'
            style={{ color: "#4A5A70" }}
          />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div
        className='min-h-screen flex items-center justify-center'
        style={{ backgroundColor: "#2A3133" }}
      >
        <div className='text-center'>
          <h2
            className='text-xl font-semibold mb-2'
            style={{ color: "#C3BCC2" }}
          >
            Access Denied
          </h2>
          <p style={{ color: "#ABA4AA" }}>
            Please sign in to access your dashboard.
          </p>
        </div>
      </div>
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  // Calculate real metrics
  const todaysWorkoutCount = todaysWorkouts.length
  const completedCount = todaysWorkouts.filter((w) =>
    completedWorkouts.includes(w.id)
  ).length
  const weeklyProgress =
    todaysWorkoutCount > 0
      ? Math.round((completedCount / todaysWorkoutCount) * 100)
      : 0
  const upcomingSessionsCount = upcomingEvents.length

  return (
    <ClientSidebar
      user={{
        name: userProfile?.name || "",
        email: userProfile?.email || user?.email || "",
      }}
    >
      {/* Dynamic Header with Greeting */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1
              className='text-4xl font-bold mb-2'
              style={{ color: "#C3BCC2" }}
            >
              {getGreeting()},{" "}
              {userProfile?.name ||
                user?.given_name ||
                user?.email?.split("@")[0]}
              !
            </h1>
            <p
              className='flex items-center gap-2'
              style={{ color: "#ABA4AA" }}
            >
              <TrendingUp
                className='h-4 w-4'
                style={{ color: "#4A5A70" }}
              />
              Ready to crush today's training?
            </p>
          </div>
          <div className='text-right'>
            <div
              className='text-2xl font-bold'
              style={{ color: "#C3BCC2" }}
            >
              {new Date().toLocaleDateString()}
            </div>
            <div
              className='text-sm'
              style={{ color: "#ABA4AA" }}
            >
              {new Date().toLocaleDateString("en-US", { weekday: "long" })}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards with Custom Colors */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div
          className='rounded-lg p-6 transform hover:scale-105 transition-all duration-300 shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p
                className='text-sm font-medium'
                style={{ color: "#ABA4AA" }}
              >
                Today's Drills
              </p>
              <p
                className='text-3xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                {todaysWorkoutCount}
              </p>
              <p
                className='text-xs mt-1'
                style={{ color: "#ABA4AA" }}
              >
                {todaysWorkoutCount > 0 ? "Ready to go!" : "No drills today"}
              </p>
            </div>
            <Target
              className='h-12 w-12'
              style={{ color: "#FFFFFF" }}
            />
          </div>
        </div>

        <div
          className='rounded-lg p-6 transform hover:scale-105 transition-all duration-300 shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p
                className='text-sm font-medium'
                style={{ color: "#ABA4AA" }}
              >
                Today's Progress
              </p>
              <p
                className='text-3xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                {weeklyProgress}%
              </p>
              <p
                className='text-xs mt-1'
                style={{ color: "#ABA4AA" }}
              >
                {weeklyProgress > 0 ? "Great work!" : "Let's get started"}
              </p>
            </div>
            <TrendingUp
              className='h-12 w-12'
              style={{ color: "#FFFFFF" }}
            />
          </div>
        </div>

        <div
          className='rounded-lg p-6 transform hover:scale-105 transition-all duration-300 shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p
                className='text-sm font-medium'
                style={{ color: "#ABA4AA" }}
              >
                Upcoming Sessions
              </p>
              <p
                className='text-3xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                {upcomingSessionsCount}
              </p>
              <p
                className='text-xs mt-1'
                style={{ color: "#ABA4AA" }}
              >
                {upcomingSessionsCount > 0 ? "This week" : "Schedule clear"}
              </p>
            </div>
            <Calendar
              className='h-12 w-12'
              style={{ color: "#FFFFFF" }}
            />
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Today's Plan Section */}
          <div
            className='rounded-lg p-6 shadow-lg border'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div className='flex items-center justify-between mb-6'>
              <h2
                className='text-xl font-bold flex items-center gap-2'
                style={{ color: "#C3BCC2" }}
              >
                <Target
                  className='h-5 w-5'
                  style={{ color: "#4A5A70" }}
                />
                Today's Plan
              </h2>
              <span
                className='text-sm'
                style={{ color: "#ABA4AA" }}
              >
                {new Date().toLocaleDateString()}
              </span>
            </div>

            {workoutsLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2
                  className='h-6 w-6 animate-spin'
                  style={{ color: "#4A5A70" }}
                />
              </div>
            ) : todaysWorkouts.length > 0 ? (
              <div className='space-y-4'>
                {todaysWorkouts.map((workout) => (
                  <div
                    key={workout.id}
                    className='rounded-lg p-4 transition-all duration-200 hover:scale-105 shadow-lg border'
                    style={{
                      backgroundColor: "#2A3133",
                      borderColor: "#606364",
                      borderWidth: "1px",
                    }}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h3
                          className='font-medium mb-2'
                          style={{ color: "#C3BCC2" }}
                        >
                          {workout.title}
                        </h3>
                        <p
                          className='text-sm mb-3'
                          style={{ color: "#ABA4AA" }}
                        >
                          {workout.description || workout.notes}
                        </p>
                        <div className='flex items-center space-x-3'>
                          {workout.videoUrl && (
                            <button
                              className='flex items-center text-sm font-medium transition-colors'
                              style={{ color: "#4A5A70" }}
                            >
                              <PlayCircle className='w-4 h-4 mr-1' />
                              Watch Video
                            </button>
                          )}
                          {workout.videoUrl && (
                            <span style={{ color: "#606364" }}>•</span>
                          )}
                          <span
                            className='text-sm'
                            style={{ color: "#ABA4AA" }}
                          >
                            {workout.duration || "15 mins"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleWorkoutComplete(workout.id)}
                        className={`ml-4 p-2 rounded-full transition-all duration-200 ${
                          completedWorkouts.includes(workout.id)
                            ? "shadow-lg border"
                            : "shadow-lg border"
                        }`}
                        style={{
                          backgroundColor: completedWorkouts.includes(
                            workout.id
                          )
                            ? "#4A5A70"
                            : "#606364",
                          borderColor: completedWorkouts.includes(workout.id)
                            ? "#4A5A70"
                            : "#ABA4AA",
                          color: completedWorkouts.includes(workout.id)
                            ? "#C3BCC2"
                            : "#ABA4AA",
                        }}
                      >
                        <CheckCircle2 className='w-5 h-5' />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <Target
                  className='w-12 h-12 mx-auto mb-4'
                  style={{ color: "#606364" }}
                />
                <p style={{ color: "#ABA4AA" }}>
                  No workouts assigned for today
                </p>
                <p
                  className='text-sm mt-1'
                  style={{ color: "#ABA4AA" }}
                >
                  Check back later or contact your coach
                </p>
              </div>
            )}
          </div>

          {/* Video Library & Assignments */}
          <div
            className='rounded-lg p-6 shadow-lg border'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div className='flex items-center justify-between mb-6'>
              <h2
                className='text-xl font-bold flex items-center gap-2'
                style={{ color: "#C3BCC2" }}
              >
                <PlayCircle
                  className='h-5 w-5'
                  style={{ color: "#4A5A70" }}
                />
                Assigned Videos
              </h2>
              <button
                className='flex items-center text-sm font-medium transition-colors'
                style={{ color: "#4A5A70" }}
              >
                <Upload className='w-4 h-4 mr-1' />
                Upload for Review
              </button>
            </div>

            {videosLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2
                  className='h-6 w-6 animate-spin'
                  style={{ color: "#4A5A70" }}
                />
              </div>
            ) : assignedVideos.length > 0 ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {assignedVideos.map((video) => (
                  <div
                    key={video.id}
                    className='rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 shadow-lg border'
                    style={{
                      backgroundColor: "#2A3133",
                      borderColor: "#606364",
                      borderWidth: "1px",
                    }}
                  >
                    <div
                      className='aspect-video relative'
                      style={{ backgroundColor: "#606364" }}
                    >
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='absolute inset-0 flex items-center justify-center'>
                          <PlayCircle
                            className='w-12 h-12'
                            style={{ color: "#ABA4AA" }}
                          />
                        </div>
                      )}
                    </div>
                    <div className='p-4'>
                      <h3
                        className='font-medium mb-2'
                        style={{ color: "#C3BCC2" }}
                      >
                        {video.title}
                      </h3>
                      <p
                        className='text-sm mb-3'
                        style={{ color: "#ABA4AA" }}
                      >
                        {video.description}
                      </p>
                      <button
                        onClick={() => toggleVideoWatched(video.id)}
                        className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                          watchedVideos.includes(video.id)
                            ? "shadow-lg border"
                            : "shadow-lg border"
                        }`}
                        style={{
                          backgroundColor: watchedVideos.includes(video.id)
                            ? "#4A5A70"
                            : "#4A5A70",
                          borderColor: watchedVideos.includes(video.id)
                            ? "#4A5A70"
                            : "#4A5A70",
                          color: "#C3BCC2",
                        }}
                      >
                        {watchedVideos.includes(video.id)
                          ? "Watched ✓"
                          : "Mark as Watched"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <PlayCircle
                  className='w-12 h-12 mx-auto mb-4'
                  style={{ color: "#606364" }}
                />
                <p style={{ color: "#ABA4AA" }}>No videos assigned yet</p>
                <p
                  className='text-sm mt-1'
                  style={{ color: "#ABA4AA" }}
                >
                  Your coach will assign training videos soon
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className='space-y-6'>
          {/* Progress Tracking */}
          <div
            className='rounded-lg p-6 shadow-lg border'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <h2
              className='text-xl font-bold mb-6 flex items-center gap-2'
              style={{ color: "#C3BCC2" }}
            >
              <TrendingUp
                className='h-5 w-5'
                style={{ color: "#4A5A70" }}
              />
              Progress Tracking
            </h2>

            {progressLoading ? (
              <div className='flex items-center justify-center py-4'>
                <Loader2
                  className='h-5 w-5 animate-spin'
                  style={{ color: "#4A5A70" }}
                />
              </div>
            ) : (
              <>
                {/* Weekly Streak */}
                <div className='mb-6'>
                  <div className='flex items-center justify-between mb-2'>
                    <span
                      className='text-sm font-medium'
                      style={{ color: "#ABA4AA" }}
                    >
                      Weekly Streak
                    </span>
                    <span
                      className='text-sm'
                      style={{ color: "#ABA4AA" }}
                    >
                      {progressData?.currentStreak || 0} days
                    </span>
                  </div>
                  <div
                    className='w-full rounded-full h-2'
                    style={{ backgroundColor: "#606364" }}
                  >
                    <div
                      className='h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${progressData?.streakPercentage || 0}%`,
                        background:
                          "linear-gradient(to right, #4A5A70, #606364)",
                      }}
                    ></div>
                  </div>
                </div>

                {/* Skill Improvements */}
                <div className='space-y-4'>
                  <h3
                    className='text-sm font-medium'
                    style={{ color: "#ABA4AA" }}
                  >
                    Skill Improvements
                  </h3>
                  {progressData?.skills && progressData.skills.length > 0 ? (
                    progressData.skills.map(
                      (skill: { name: string; progress: number }) => (
                        <div key={skill.name}>
                          <div className='flex items-center justify-between mb-1'>
                            <span
                              className='text-sm'
                              style={{ color: "#ABA4AA" }}
                            >
                              {skill.name}
                            </span>
                            <span
                              className='text-sm font-medium'
                              style={{ color: "#C3BCC2" }}
                            >
                              {skill.progress}%
                            </span>
                          </div>
                          <div
                            className='w-full rounded-full h-1.5'
                            style={{ backgroundColor: "#606364" }}
                          >
                            <div
                              className='h-1.5 rounded-full transition-all duration-300'
                              style={{
                                width: `${skill.progress}%`,
                                background:
                                  "linear-gradient(to right, #4A5A70, #606364)",
                              }}
                            ></div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p
                      className='text-sm'
                      style={{ color: "#ABA4AA" }}
                    >
                      No progress data available yet
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Upcoming Events */}
          <div
            className='rounded-lg p-6 shadow-lg border'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <h2
              className='text-xl font-bold mb-6 flex items-center gap-2'
              style={{ color: "#C3BCC2" }}
            >
              <Calendar
                className='h-5 w-5'
                style={{ color: "#4A5A70" }}
              />
              Upcoming Events
            </h2>

            {eventsLoading ? (
              <div className='flex items-center justify-center py-4'>
                <Loader2
                  className='h-5 w-5 animate-spin'
                  style={{ color: "#4A5A70" }}
                />
              </div>
            ) : upcomingEvents.length > 0 ? (
              <>
                {/* Next Event Countdown */}
                {upcomingEvents[0] && (
                  <div
                    className='rounded-lg p-4 mb-4 shadow-lg border'
                    style={{
                      background: "linear-gradient(to right, #4A5A70, #606364)",
                      borderColor: "#4A5A70",
                    }}
                  >
                    <div className='text-center'>
                      <div
                        className='text-sm opacity-90'
                        style={{ color: "#C3BCC2" }}
                      >
                        Next Event
                      </div>
                      <div
                        className='text-2xl font-bold'
                        style={{ color: "#C3BCC2" }}
                      >
                        {Math.ceil(
                          (new Date(upcomingEvents[0].date).getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        Days
                      </div>
                      <div
                        className='text-sm opacity-90'
                        style={{ color: "#C3BCC2" }}
                      >
                        {upcomingEvents[0].title}
                      </div>
                    </div>
                  </div>
                )}

                {/* Event List */}
                <div className='space-y-3'>
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className='flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-105 shadow-lg'
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        borderWidth: "1px",
                      }}
                    >
                      <div className='flex items-center space-x-3'>
                        <div
                          className='text-sm font-medium px-2 py-1 rounded border'
                          style={{
                            color: "#C3BCC2",
                            backgroundColor: "#606364",
                            borderColor: "#ABA4AA",
                          }}
                        >
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "numeric",
                            day: "numeric",
                          })}
                        </div>
                        <div>
                          <div
                            className='text-sm font-medium'
                            style={{ color: "#C3BCC2" }}
                          >
                            {event.title}
                          </div>
                          <div
                            className='text-xs'
                            style={{ color: "#ABA4AA" }}
                          >
                            {new Date(event.date).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                      <Clock
                        className='w-4 h-4'
                        style={{ color: "#ABA4AA" }}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className='text-center py-8'>
                <Calendar
                  className='w-12 h-12 mx-auto mb-4'
                  style={{ color: "#606364" }}
                />
                <p style={{ color: "#ABA4AA" }}>No upcoming events</p>
                <p
                  className='text-sm mt-1'
                  style={{ color: "#ABA4AA" }}
                >
                  Your schedule is clear for now
                </p>
              </div>
            )}
          </div>

          {/* Messages & Notifications */}
          <div
            className='rounded-lg p-6 shadow-lg border'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div className='flex items-center justify-between mb-6'>
              <h2
                className='text-xl font-bold flex items-center gap-2'
                style={{ color: "#C3BCC2" }}
              >
                <MessageCircle
                  className='h-5 w-5'
                  style={{ color: "#4A5A70" }}
                />
                Messages
              </h2>
              <div className='relative'>
                <Bell
                  className='w-5 h-5'
                  style={{ color: "#ABA4AA" }}
                />
                {unreadCount > 0 && (
                  <div className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
                    {unreadCount}
                  </div>
                )}
              </div>
            </div>

            {messagesLoading ? (
              <div className='flex items-center justify-center py-4'>
                <Loader2
                  className='h-5 w-5 animate-spin'
                  style={{ color: "#4A5A70" }}
                />
              </div>
            ) : conversations.length > 0 ? (
              <>
                <div className='space-y-4'>
                  {conversations.slice(0, 3).map((conversation) => {
                    const lastMessage = conversation.messages?.[0]
                    return (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          conversation._count?.messages > 0
                            ? "shadow-lg border"
                            : "shadow-lg border"
                        }`}
                        style={{
                          backgroundColor:
                            conversation._count?.messages > 0
                              ? "#2A3133"
                              : "#2A3133",
                          borderColor:
                            conversation._count?.messages > 0
                              ? "#4A5A70"
                              : "#606364",
                          borderWidth: "1px",
                        }}
                      >
                        <div className='flex items-start justify-between mb-2'>
                          <div className='flex items-center space-x-2'>
                            <span
                              className='text-sm font-medium'
                              style={{ color: "#C3BCC2" }}
                            >
                              {conversation.coach?.name || "Coach"}
                            </span>
                            {conversation._count?.messages > 0 && (
                              <div
                                className='w-2 h-2 rounded-full'
                                style={{ backgroundColor: "#4A5A70" }}
                              ></div>
                            )}
                          </div>
                          <span
                            className='text-xs'
                            style={{ color: "#ABA4AA" }}
                          >
                            {lastMessage &&
                              new Date(
                                lastMessage.createdAt
                              ).toLocaleDateString()}
                          </span>
                        </div>
                        <p
                          className='text-sm'
                          style={{ color: "#ABA4AA" }}
                        >
                          {lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                    )
                  })}
                </div>

                <button
                  className='w-full mt-4 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 shadow-lg border'
                  style={{
                    backgroundColor: "#606364",
                    borderColor: "#ABA4AA",
                    color: "#C3BCC2",
                  }}
                >
                  View All Messages
                </button>
              </>
            ) : (
              <div className='text-center py-8'>
                <MessageCircle
                  className='w-12 h-12 mx-auto mb-4'
                  style={{ color: "#606364" }}
                />
                <p style={{ color: "#ABA4AA" }}>No messages yet</p>
                <p
                  className='text-sm mt-1'
                  style={{ color: "#ABA4AA" }}
                >
                  Your coach will message you soon
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientSidebar>
  )
}
