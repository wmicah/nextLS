"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/app/_trpc/client"
import { Calendar, Clock, Play, Copy, Plus, Save, Users, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, isSameDay } from "date-fns"

interface ClientSchedulerProps {
  clientId: string
  clientName: string
}

type WorkoutTemplateItem = {
  id: string
  title: string
  description?: string | null
  exercises?: unknown
  duration?: string | null
}

type ScheduledDayLite = {
  dayOfWeek: number
  title?: string
  description?: string
  exercises?: unknown
  duration?: string
  videoAssignments?: any[]
}

export default function ClientScheduler({
  clientId,
  clientName,
}: ClientSchedulerProps) {
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date()))
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [scheduleData, setScheduleData] = useState<any>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)

  // tRPC queries
  const { data: workoutTemplatesData } = trpc.workoutTemplates.list.useQuery()
  const workoutTemplates: WorkoutTemplateItem[] = workoutTemplatesData ?? []
  
  const { data: libraryVideos = [] } = trpc.library.list.useQuery({})
  const { data: weeklySchedule, refetch: refetchSchedule } =
    trpc.scheduling.getWeeklySchedule.useQuery({
      clientId,
      weekStart: selectedWeek,
    })

  // tRPC mutations
  const updateScheduleMutation =
    trpc.scheduling.updateWeeklySchedule.useMutation({
      onSuccess: () => {
        refetchSchedule()
        setIsEditing(false)
      },
    })

  const copyPreviousWeekMutation = trpc.scheduling.copyPreviousWeek.useMutation(
    {
      onSuccess: () => {
        refetchSchedule()
      },
    }
  )

  const assignVideoMutation = trpc.library.assignVideoToClient.useMutation({
    onSuccess: () => {
      refetchSchedule()
    },
  })

  const days: ScheduledDayLite[] = (weeklySchedule?.days ??
    []) as unknown as ScheduledDayLite[]

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const saving = updateScheduleMutation.status === "pending"
  const copying = copyPreviousWeekMutation.status === "pending"

  const handleSaveSchedule = () => {
    if (!scheduleData) return

    updateScheduleMutation.mutate({
      clientId,
      weekStart: selectedWeek,
      days: scheduleData.days,
    })
  }

  const handleCopyPreviousWeek = () => {
    copyPreviousWeekMutation.mutate({
      clientId,
      currentWeekStart: selectedWeek,
    })
  }

  const handleAssignWorkout = (dayIndex: number, templateId: string) => {
    const template = workoutTemplates.find(
      (t: { id: string }) => t.id === templateId
    )
    if (!template) return

    const updatedDays = [...(scheduleData?.days || [])]
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      workoutTemplateId: templateId,
      title: template.title,
      description: template.description,
      exercises: template.exercises,
      duration: template.duration,
    }

    setScheduleData({
      ...scheduleData,
      days: updatedDays,
    })
  }

  const handleAssignVideo = (dayIndex: number, videoId: string) => {
    assignVideoMutation.mutate({
      videoId,
      clientId,
    })

    const updatedDays = [...(scheduleData?.days || [])]
    if (!updatedDays[dayIndex].videoIds) {
      updatedDays[dayIndex].videoIds = []
    }
    updatedDays[dayIndex].videoIds.push(videoId)

    setScheduleData({
      ...scheduleData,
      days: updatedDays,
    })
  }

  const handleQuickAssign = (dayIndex: number, type: 'workout' | 'video') => {
    setSelectedDayIndex(dayIndex)
    if (type === 'workout') {
      setShowTemplateModal(true)
    } else {
      setShowVideoModal(true)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Calendar Header */}
      <div className='bg-zinc-800 rounded-lg p-6 border' style={{ borderColor: "#606364" }}>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-lg' style={{ backgroundColor: "#4A5A70" }}>
              <Calendar className='w-5 h-5' style={{ color: "#FFFFFF" }} />
            </div>
            <div>
              <h2 className='text-2xl font-bold' style={{ color: "#C3BCC2" }}>
                {clientName}'s Schedule
              </h2>
              <p className='text-sm' style={{ color: "#ABA4AA" }}>
                {format(selectedWeek, "MMMM d, yyyy")} - {format(addDays(selectedWeek, 6), "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <button
              onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
              className='p-2 rounded-lg transition-colors hover:bg-opacity-80'
              style={{
                backgroundColor: "#353A3A",
                color: "#C3BCC2",
              }}
            >
              <ChevronLeft className='w-5 h-5' />
            </button>
            <button
              onClick={() => setSelectedWeek(startOfWeek(new Date()))}
              className='px-4 py-2 rounded-lg border transition-colors hover:bg-opacity-80'
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
                color: "#C3BCC2",
              }}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
              className='p-2 rounded-lg transition-colors hover:bg-opacity-80'
              style={{
                backgroundColor: "#353A3A",
                color: "#C3BCC2",
              }}
            >
              <ChevronRight className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3'>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className='flex items-center gap-2 px-4 py-2 rounded-lg transition-colors'
            style={{
              backgroundColor: isEditing ? "#4A5A70" : "#353A3A",
              borderColor: "#606364",
              color: "#C3BCC2",
            }}
          >
            <Plus className='w-4 h-4' />
            {isEditing ? "Cancel Editing" : "Edit Schedule"}
          </button>

          {isEditing && (
            <>
              <button
                onClick={handleSaveSchedule}
                disabled={saving}
                className='flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50'
                style={{
                  backgroundColor: "#4A5A70",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                }}
              >
                <Save className='w-4 h-4' />
                {saving ? "Saving..." : "Save Schedule"}
              </button>

              <button
                onClick={handleCopyPreviousWeek}
                disabled={copying}
                className='flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50'
                style={{
                  backgroundColor: "#4A5A70",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                }}
              >
                <Copy className='w-4 h-4' />
                {copying ? "Copying..." : "Copy Previous Week"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className='bg-zinc-800 rounded-lg border overflow-hidden' style={{ borderColor: "#606364" }}>
        {/* Calendar Header Row */}
        <div className='grid grid-cols-7 border-b' style={{ borderColor: "#606364" }}>
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className='p-4 text-center font-semibold'
              style={{ color: "#C3BCC2", backgroundColor: "#2A3133" }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className='grid grid-cols-7'>
          {daysOfWeek.map((day, index) => {
            const currentDate = addDays(selectedWeek, index)
            const isCurrentDay = isToday(currentDate)
            const dayData = days.find((d) => d.dayOfWeek === index) ?? {
              dayOfWeek: index,
              title: "",
              description: "",
              exercises: [],
              duration: "",
              videoAssignments: [],
            }

            return (
              <div
                key={day}
                className={`min-h-[200px] border-r border-b transition-all ${
                  isCurrentDay ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{ 
                  borderColor: "#606364",
                  backgroundColor: isCurrentDay ? "#2A3133" : "#353A3A"
                }}
              >
                {/* Date Header */}
                <div className='p-3 border-b' style={{ borderColor: "#606364" }}>
                  <div className='text-center'>
                    <div 
                      className={`text-lg font-bold ${
                        isCurrentDay ? 'text-blue-400' : ''
                      }`}
                      style={{ color: isCurrentDay ? "#60A5FA" : "#C3BCC2" }}
                    >
                      {format(currentDate, "d")}
                    </div>
                    <div className='text-xs' style={{ color: "#ABA4AA" }}>
                      {format(currentDate, "MMM")}
                    </div>
                  </div>
                </div>

                {/* Day Content */}
                <div className='p-3'>
                  {isEditing ? (
                    <div className='space-y-2'>
                      {/* Quick Assign Buttons */}
                      <div className='flex gap-1'>
                        <button
                          onClick={() => handleQuickAssign(index, 'workout')}
                          className='flex-1 px-2 py-1 text-xs rounded border transition-colors hover:bg-opacity-80'
                          style={{
                            backgroundColor: "#4A5A70",
                            borderColor: "#606364",
                            color: "#C3BCC2",
                          }}
                        >
                          + W
                        </button>
                        <button
                          onClick={() => handleQuickAssign(index, 'video')}
                          className='flex-1 px-2 py-1 text-xs rounded border transition-colors hover:bg-opacity-80'
                          style={{
                            backgroundColor: "#4A5A70",
                            borderColor: "#606364",
                            color: "#C3BCC2",
                          }}
                        >
                          + V
                        </button>
                      </div>

                      {/* Workout Template Selector */}
                      <select
                        onChange={(e) => handleAssignWorkout(index, e.target.value)}
                        className='w-full p-1 rounded border text-xs'
                        style={{
                          backgroundColor: "#2A3133",
                          borderColor: "#606364",
                          color: "#C3BCC2",
                        }}
                      >
                        <option value=''>Select Workout</option>
                        {workoutTemplates.map(
                          (template: { id: string; title: string }) => (
                            <option key={template.id} value={template.id}>
                              {template.title}
                            </option>
                          )
                        )}
                      </select>

                      {/* Video Assignment */}
                      <select
                        onChange={(e) => handleAssignVideo(index, e.target.value)}
                        className='w-full p-1 rounded border text-xs'
                        style={{
                          backgroundColor: "#2A3133",
                          borderColor: "#606364",
                          color: "#C3BCC2",
                        }}
                      >
                        <option value=''>Assign Video</option>
                        {libraryVideos
                          .filter((video) => video.type === "video")
                          .map((video) => (
                            <option key={video.id} value={video.id}>
                              {video.title}
                            </option>
                          ))}
                      </select>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {dayData.title && (
                        <div className='p-2 rounded border' style={{ borderColor: "#606364", backgroundColor: "#2A3133" }}>
                          <h4 className='font-medium text-xs mb-1' style={{ color: "#C3BCC2" }}>
                            {dayData.title}
                          </h4>
                          {dayData.duration && (
                            <p className='text-xs flex items-center gap-1' style={{ color: "#ABA4AA" }}>
                              <Clock className='w-3 h-3' />
                              {dayData.duration}
                            </p>
                          )}
                        </div>
                      )}

                      {(dayData.videoAssignments?.length ?? 0) > 0 && (
                        <div className='p-2 rounded border' style={{ borderColor: "#606364", backgroundColor: "#2A3133" }}>
                          <p className='text-xs font-medium mb-1' style={{ color: "#ABA4AA" }}>
                            Videos:
                          </p>
                          {(dayData.videoAssignments ?? []).map(
                            (assignment: any) => (
                              <div key={assignment.id} className='flex items-center gap-1 mb-1'>
                                <Play className='w-3 h-3' style={{ color: "#4A5A70" }} />
                                <span className='text-xs' style={{ color: "#ABA4AA" }}>
                                  {assignment.video.title}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {!dayData.title && (dayData.videoAssignments?.length ?? 0) === 0 && (
                        <div className='text-center py-4'>
                          <CalendarDays className='w-6 h-6 mx-auto mb-1' style={{ color: "#606364" }} />
                          <p className='text-xs' style={{ color: "#606364" }}>
                            No activities
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && selectedDayIndex !== null && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 border' style={{ borderColor: "#606364" }}>
            <h3 className='text-lg font-semibold mb-4' style={{ color: "#C3BCC2" }}>
              Select Workout Template
            </h3>
            <div className='space-y-2 max-h-60 overflow-y-auto'>
              {workoutTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    handleAssignWorkout(selectedDayIndex, template.id)
                    setShowTemplateModal(false)
                  }}
                  className='w-full text-left p-3 rounded border transition-colors hover:bg-opacity-80'
                  style={{
                    backgroundColor: "#353A3A",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                >
                  <div className='font-medium'>{template.title}</div>
                  {template.description && (
                    <div className='text-xs mt-1' style={{ color: "#ABA4AA" }}>
                      {template.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTemplateModal(false)}
              className='mt-4 w-full px-4 py-2 rounded border transition-colors'
              style={{
                backgroundColor: "#4A5A70",
                borderColor: "#606364",
                color: "#C3BCC2",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Video Selection Modal */}
      {showVideoModal && selectedDayIndex !== null && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 border' style={{ borderColor: "#606364" }}>
            <h3 className='text-lg font-semibold mb-4' style={{ color: "#C3BCC2" }}>
              Select Video
            </h3>
            <div className='space-y-2 max-h-60 overflow-y-auto'>
              {libraryVideos
                .filter((video) => video.type === "video")
                .map((video) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      handleAssignVideo(selectedDayIndex, video.id)
                      setShowVideoModal(false)
                    }}
                    className='w-full text-left p-3 rounded border transition-colors hover:bg-opacity-80'
                    style={{
                      backgroundColor: "#353A3A",
                      borderColor: "#606364",
                      color: "#C3BCC2",
                    }}
                  >
                    <div className='font-medium'>{video.title}</div>
                    {video.description && (
                      <div className='text-xs mt-1' style={{ color: "#ABA4AA" }}>
                        {video.description}
                      </div>
                    )}
                  </button>
                ))}
            </div>
            <button
              onClick={() => setShowVideoModal(false)}
              className='mt-4 w-full px-4 py-2 rounded border transition-colors'
              style={{
                backgroundColor: "#4A5A70",
                borderColor: "#606364",
                color: "#C3BCC2",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
