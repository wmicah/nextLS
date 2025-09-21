"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/app/_trpc/client";
import { useUIStore } from "@/lib/stores/uiStore";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Plus,
  Bell,
  X,
  Settings,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface WeekAtAGlanceProps {
  className?: string;
}

export default function WeekAtAGlance({ className = "" }: WeekAtAGlanceProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [showDayOverviewModal, setShowDayOverviewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    clientId: "",
    time: "",
    date: "",
  });
  const [reminderForm, setReminderForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
  });

  const { addToast } = useUIStore();

  // Calculate the week range
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 }); // Saturday
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch events for the current week
  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError,
  } = trpc.events.getUpcoming.useQuery();

  // Fetch coach's schedule for the current month (for day overview modal)
  const { data: coachSchedule = [] } =
    trpc.scheduling.getCoachSchedule.useQuery({
      month: selectedDate?.getMonth() ?? new Date().getMonth(),
      year: selectedDate?.getFullYear() ?? new Date().getFullYear(),
    });

  // Fetch coach's profile for working hours
  const { data: coachProfile } = trpc.user.getProfile.useQuery();

  // Fetch coach's active clients for scheduling
  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  // Schedule lesson mutation
  const utils = trpc.useUtils();
  const scheduleLessonMutation = trpc.scheduling.scheduleLesson.useMutation({
    onSuccess: () => {
      utils.scheduling.getCoachSchedule.invalidate();
      utils.scheduling.getCoachUpcomingLessons.invalidate();
      utils.events.getUpcoming.invalidate();
      setShowScheduleModal(false);
      setScheduleForm({ clientId: "", time: "", date: "" });
      setSelectedDate(null);
      addToast({
        type: "success",
        title: "Lesson scheduled successfully!",
        message: "The lesson has been added to your schedule.",
      });
    },
    onError: error => {
      addToast({
        type: "error",
        title: "Failed to schedule lesson",
        message:
          error.message || "An unexpected error occurred. Please try again.",
      });
    },
  });

  // Create reminder mutation
  const createReminderMutation = trpc.events.createReminder.useMutation({
    onSuccess: () => {
      utils.events.getUpcoming.invalidate();
      setShowAddReminderModal(false);
      setReminderForm({ title: "", description: "", date: "", time: "" });
      setSelectedDate(null);
      addToast({
        type: "success",
        title: "Reminder set successfully!",
        message: "Your reminder has been added to the selected date and time.",
      });
    },
    onError: error => {
      addToast({
        type: "error",
        title: "Failed to set reminder",
        message:
          error.message || "An unexpected error occurred. Please try again.",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = trpc.events.deleteEvent.useMutation({
    onSuccess: () => {
      utils.events.getUpcoming.invalidate();
      utils.scheduling.getCoachSchedule.invalidate();
      addToast({
        type: "success",
        title: "Event deleted successfully!",
        message: "The event has been removed from your schedule.",
      });
    },
    onError: error => {
      addToast({
        type: "error",
        title: "Failed to delete event",
        message:
          error.message || "An unexpected error occurred. Please try again.",
      });
    },
  });

  // Filter events for the current week
  const weekEvents = useMemo(() => {
    return events.filter((event: any) => {
      const eventDate = new Date(event.date);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });
  }, [events, weekStart, weekEnd]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    weekDays.forEach(day => {
      const dayKey = format(day, "yyyy-MM-dd");
      grouped[dayKey] = weekEvents.filter((event: any) =>
        isSameDay(new Date(event.date), day)
      );
    });
    return grouped;
  }, [weekEvents, weekDays]);

  const navigateWeek = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(addWeeks(currentWeek, 1));
    }
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const isToday = (day: Date) => {
    return isSameDay(day, new Date());
  };

  const isPastDay = (day: Date) => {
    return day < new Date() && !isToday(day);
  };

  const toggleCardFlip = (dayKey: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayKey)) {
        newSet.delete(dayKey);
      } else {
        newSet.add(dayKey);
      }
      return newSet;
    });
  };

  // Generate time slots based on coach's working hours
  const generateTimeSlots = () => {
    const startTime = coachProfile?.workingHours?.startTime || "9:00 AM";
    const endTime = coachProfile?.workingHours?.endTime || "6:00 PM";
    const interval = coachProfile?.workingHours?.timeSlotInterval || 60;

    const slots = [];
    const startMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    const endMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!startMatch || !endMatch) {
      for (let hour = 9; hour < 18; hour++) {
        const displayHour = hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? "PM" : "AM";
        slots.push(`${displayHour}:00 ${period}`);
      }
      return slots;
    }

    const [_, startHour, startMinute, startPeriod] = startMatch;
    const [__, endHour, endMinute, endPeriod] = endMatch;

    let startTotalMinutes = parseInt(startHour) * 60 + parseInt(startMinute);
    if (startPeriod.toUpperCase() === "PM" && parseInt(startHour) !== 12)
      startTotalMinutes += 12 * 60;
    if (startPeriod.toUpperCase() === "AM" && parseInt(startHour) === 12)
      startTotalMinutes = parseInt(startMinute);

    let endTotalMinutes = parseInt(endHour) * 60 + parseInt(endMinute);
    if (endPeriod.toUpperCase() === "PM" && parseInt(endHour) !== 12)
      endTotalMinutes += 12 * 60;
    if (endPeriod.toUpperCase() === "AM" && parseInt(endHour) === 12)
      endTotalMinutes = parseInt(endMinute);

    for (
      let totalMinutes = startTotalMinutes;
      totalMinutes < endTotalMinutes;
      totalMinutes += interval
    ) {
      const hour24 = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      const displayHour =
        hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const period = hour24 >= 12 ? "PM" : "AM";
      const minuteStr = minute.toString().padStart(2, "0");
      slots.push(`${displayHour}:${minuteStr} ${period}`);
    }

    return slots;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setScheduleForm({
      ...scheduleForm,
      date: format(date, "yyyy-MM-dd"),
    });
    setShowDayOverviewModal(true);
  };

  const handleScheduleLesson = () => {
    if (!scheduleForm.clientId || !scheduleForm.time || !scheduleForm.date) {
      addToast({
        type: "error",
        title: "Please fill in all fields",
        message: "Client, date, and time are required to schedule a lesson.",
      });
      return;
    }

    const selectedClient = clients.find(
      (c: { id: string }) => c.id === scheduleForm.clientId
    );

    if (!selectedClient) {
      addToast({
        type: "error",
        title: "Invalid client selection",
        message: "Please select a valid client from the dropdown.",
      });
      return;
    }

    // Combine date and time into a single Date object
    const dateStr = scheduleForm.date;
    const timeStr = scheduleForm.time;

    // Parse the time string (e.g., "2:00 PM")
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!timeMatch) {
      addToast({
        type: "error",
        title: "Invalid time format",
        message: "Please select a valid time from the dropdown.",
      });
      return;
    }

    const [, hour, minute, period] = timeMatch;
    let hour24 = parseInt(hour);

    // Convert to 24-hour format
    if (period.toUpperCase() === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period.toUpperCase() === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    // Create the full date string
    const fullDateStr = `${dateStr}T${hour24
      .toString()
      .padStart(2, "0")}:${minute}:00`;
    const lessonDate = new Date(fullDateStr);

    // Validate the date
    if (isNaN(lessonDate.getTime())) {
      addToast({
        type: "error",
        title: "Invalid date/time combination",
        message: "The selected date and time combination is not valid.",
      });
      return;
    }

    // Check if the lesson is in the past
    const now = new Date();
    if (lessonDate <= now) {
      addToast({
        type: "error",
        title: "Cannot schedule in the past",
        message: "Please select a future date and time for the lesson.",
      });
      return;
    }

    scheduleLessonMutation.mutate({
      clientId: scheduleForm.clientId,
      lessonDate: fullDateStr, // Send as string instead of Date object
    });
  };

  const handleQuickAction = (action: string, day: Date) => {
    switch (action) {
      case "schedule":
        // Same behavior as schedule page - open day overview modal
        handleDateClick(day);
        break;
      case "reminder":
        // Open add reminder modal
        setSelectedDate(day);
        setReminderForm({
          ...reminderForm,
          date: format(day, "yyyy-MM-dd"),
        });
        setShowAddReminderModal(true);
        break;
    }

    // Close the flipped card after action (except for schedule which opens modal)
    if (action !== "schedule") {
      const dayKey = format(day, "yyyy-MM-dd");
      setFlippedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(dayKey);
        return newSet;
      });
    }
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      deleteEventMutation.mutate({ eventId });
    }
  };

  // Loading state
  if (eventsLoading) {
    return (
      <div
        className={`rounded-2xl shadow-xl border relative overflow-hidden group ${className}`}
        style={{ backgroundColor: "#2A2F32", borderColor: "#4A5A70" }}
      >
        <div className="relative p-6">
          <div className="flex items-center justify-center h-64">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: "#4A5A70" }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (eventsError) {
    return (
      <div
        className={`rounded-2xl shadow-xl border relative overflow-hidden group ${className}`}
        style={{ backgroundColor: "#2A2F32", borderColor: "#4A5A70" }}
      >
        <div className="relative p-6">
          <div className="text-center">
            <p style={{ color: "#EF4444" }}>Error loading schedule</p>
            <p className="text-sm mt-2" style={{ color: "#D1D5DB" }}>
              {eventsError.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
      <div
        className={`rounded-2xl shadow-xl border relative overflow-hidden group ${className}`}
        style={{ backgroundColor: "#2A2F32", borderColor: "#4A5A70" }}
      >
        <div
          className="absolute inset-0 opacity-8 group-hover:opacity-15 transition-opacity duration-300"
          style={{
            background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
          }}
        />

        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Calendar className="h-4 w-4" style={{ color: "#E5E7EB" }} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: "#E5E7EB" }}>
                Week at a Glance
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek("prev")}
                className="p-3 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 touch-manipulation"
                style={{
                  backgroundColor: "#3A4040",
                  color: "#E5E7EB",
                  minWidth: "44px",
                  minHeight: "44px",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#4A5A70";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#3A4040";
                }}
              >
                <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>

              <button
                onClick={goToToday}
                className="px-4 py-2 sm:px-3 sm:py-1 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 touch-manipulation"
                style={{
                  backgroundColor: "#4A5A70",
                  color: "#E5E7EB",
                  minHeight: "44px",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#606364";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#4A5A70";
                }}
              >
                Today
              </button>

              <button
                onClick={() => navigateWeek("next")}
                className="p-3 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 touch-manipulation"
                style={{
                  backgroundColor: "#3A4040",
                  color: "#E5E7EB",
                  minWidth: "44px",
                  minHeight: "44px",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#4A5A70";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#3A4040";
                }}
              >
                <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>

          {/* Week Range Display */}
          <div className="text-center mb-6">
            <p className="text-lg font-semibold" style={{ color: "#E5E7EB" }}>
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </p>
          </div>

          {/* Week Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {weekDays.map((day, index) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay[dayKey] || [];
              const isCurrentDay = isToday(day);
              const isPast = isPastDay(day);

              const isFlipped = flippedCards.has(dayKey);

              return (
                <div
                  key={dayKey}
                  className={`rounded-lg min-h-[200px] sm:min-h-[250px] md:min-h-[300px] transition-all duration-700 ease-in-out ${
                    isCurrentDay ? "ring-2" : ""
                  } ${isFlipped ? "rotate-y-180" : ""}`}
                  style={{
                    backgroundColor: isCurrentDay ? "#4A5A70" : "#374151",
                    borderColor: isCurrentDay ? "#606364" : "transparent",
                    opacity: isPast ? 0.5 : 1,
                    transformStyle: "preserve-3d",
                    perspective: "1000px",
                  }}
                >
                  <div
                    className="relative w-full h-full"
                    style={{
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* Front side - Original content */}
                    <div
                      className="absolute inset-0 p-2 flex flex-col"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(0deg)",
                      }}
                    >
                      {/* Day Header */}
                      <div className="text-center mb-2">
                        <p
                          className={`text-sm sm:text-xs font-medium uppercase tracking-wide ${
                            isCurrentDay ? "font-bold" : ""
                          }`}
                          style={{
                            color: isCurrentDay ? "#E5E7EB" : "#9CA3AF",
                          }}
                        >
                          {format(day, "EEE")}
                        </p>
                        <p
                          className={`text-lg sm:text-sm font-bold ${
                            isCurrentDay ? "text-white" : ""
                          }`}
                          style={{
                            color: isCurrentDay ? "#FFFFFF" : "#E5E7EB",
                          }}
                        >
                          {format(day, "d")}
                        </p>
                      </div>

                      {/* Events */}
                      <div className="space-y-1 flex-1">
                        {dayEvents.slice(0, 10).map((event: any) => {
                          // Determine if this is a reminder or lesson
                          const isReminder =
                            event.status === "PENDING" &&
                            event.clientId === null;
                          const isLesson =
                            event.client && event.clientId !== null;

                          return (
                            <div
                              key={event.id}
                              className="rounded px-2 py-1.5 text-xs sm:text-xs group"
                              style={{
                                backgroundColor: isReminder
                                  ? "#F59E0B"
                                  : "#4A5A70",
                              }}
                            >
                              <div className="flex items-center gap-1">
                                {isReminder ? (
                                  <Bell
                                    className="h-2.5 w-2.5 flex-shrink-0"
                                    style={{ color: "#FFFFFF" }}
                                  />
                                ) : (
                                  <Clock
                                    className="h-2.5 w-2.5 flex-shrink-0"
                                    style={{ color: "#E5E7EB" }}
                                  />
                                )}
                                {isLesson && event.client && (
                                  <span
                                    className="text-xs truncate"
                                    style={{ color: "#D1D5DB" }}
                                    title={event.client.name}
                                  >
                                    {(() => {
                                      const nameParts =
                                        event.client.name.split(" ");
                                      const firstName = nameParts[0];
                                      const lastNameInitial =
                                        nameParts.length > 1
                                          ? nameParts[nameParts.length - 1][0]
                                          : "";
                                      return lastNameInitial
                                        ? `${firstName} ${lastNameInitial}.`
                                        : firstName;
                                    })()}
                                  </span>
                                )}
                                {isReminder && (
                                  <span
                                    className="text-xs truncate"
                                    style={{ color: "#FFFFFF" }}
                                    title={event.title}
                                  >
                                    {event.title.length > 8
                                      ? `${event.title.substring(0, 8)}...`
                                      : event.title}
                                  </span>
                                )}
                                <span
                                  className="text-xs ml-auto"
                                  style={{
                                    color: isReminder ? "#FFFFFF" : "#E5E7EB",
                                  }}
                                  title={`${format(
                                    new Date(event.date),
                                    "h:mm a"
                                  )} - ${event.title}`}
                                >
                                  {format(new Date(event.date), "h:mm")}
                                </span>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteEvent(event.id, event.title);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0.5 rounded hover:bg-red-500/20"
                                  style={{ color: "#EF4444" }}
                                  title="Delete event"
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {dayEvents.length > 10 && (
                          <div
                            className="text-xs text-center py-0.5 rounded"
                            style={{
                              backgroundColor: "#374151",
                              color: "#D1D5DB",
                            }}
                          >
                            +{dayEvents.length - 10} more
                          </div>
                        )}
                      </div>

                      {/* Add Button - Always at bottom */}
                      {!isPast && (
                        <div className="flex justify-center mt-auto pt-2">
                          <button
                            onClick={() => toggleCardFlip(dayKey)}
                            className="p-2 sm:p-1 rounded transition-all duration-300 hover:scale-110 touch-manipulation flex items-center justify-center"
                            style={{
                              backgroundColor: "#1F2937",
                              color: "#F9FAFB",
                              border: "1px solid #374151",
                              minWidth: "44px",
                              minHeight: "44px",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = "#111827";
                              e.currentTarget.style.borderColor = "#4B5563";
                              e.currentTarget.style.color = "#FFFFFF";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = "#1F2937";
                              e.currentTarget.style.borderColor = "#374151";
                              e.currentTarget.style.color = "#F9FAFB";
                            }}
                          >
                            <Plus className="h-4 w-4 sm:h-2.5 sm:w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Back side - Quick actions */}
                    <div
                      className="absolute inset-0 p-2 flex flex-col"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      {/* Header with close button */}
                      <div className="flex items-center justify-between mb-3">
                        <h4
                          className="text-base sm:text-sm font-semibold"
                          style={{ color: "#E5E7EB" }}
                        >
                          Quick Actions
                        </h4>
                        <button
                          onClick={() => toggleCardFlip(dayKey)}
                          className="p-2 sm:p-1 rounded transition-all duration-300 hover:scale-110 touch-manipulation"
                          style={{
                            backgroundColor: "#1F2937",
                            color: "#F9FAFB",
                            border: "1px solid #374151",
                            minWidth: "44px",
                            minHeight: "44px",
                          }}
                        >
                          <X className="h-4 w-4 sm:h-3 sm:w-3" />
                        </button>
                      </div>

                      {/* Quick action buttons */}
                      <div className="space-y-2 flex-1">
                        <button
                          onClick={() => handleQuickAction("schedule", day)}
                          className="w-full p-3 sm:p-2 rounded transition-all duration-200 hover:bg-opacity-80 flex items-center gap-3 sm:gap-2 group touch-manipulation"
                          style={{
                            backgroundColor: "rgba(31, 41, 55, 0.5)",
                            color: "#E5E7EB",
                            border: "1px solid rgba(55, 65, 81, 0.4)",
                            minHeight: "48px",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(31, 41, 55, 0.7)";
                            e.currentTarget.style.borderColor =
                              "rgba(55, 65, 81, 0.6)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(31, 41, 55, 0.5)";
                            e.currentTarget.style.borderColor =
                              "rgba(55, 65, 81, 0.4)";
                          }}
                        >
                          <div
                            className="p-1.5 sm:p-1 rounded"
                            style={{
                              backgroundColor: "rgba(55, 65, 81, 0.4)",
                            }}
                          >
                            <Calendar className="h-4 w-4 sm:h-3 sm:w-3" />
                          </div>
                          <span className="text-sm sm:text-xs font-medium">
                            Schedule Lesson
                          </span>
                        </button>

                        <button
                          onClick={() => handleQuickAction("reminder", day)}
                          className="w-full p-3 sm:p-2 rounded transition-all duration-200 hover:bg-opacity-80 flex items-center gap-3 sm:gap-2 group touch-manipulation"
                          style={{
                            backgroundColor: "rgba(17, 24, 39, 0.6)",
                            color: "#D1D5DB",
                            border: "1px solid rgba(31, 41, 55, 0.4)",
                            minHeight: "48px",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(17, 24, 39, 0.8)";
                            e.currentTarget.style.borderColor =
                              "rgba(31, 41, 55, 0.6)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(17, 24, 39, 0.6)";
                            e.currentTarget.style.borderColor =
                              "rgba(31, 41, 55, 0.4)";
                          }}
                        >
                          <div
                            className="p-1.5 sm:p-1 rounded"
                            style={{ backgroundColor: "rgba(31, 41, 55, 0.4)" }}
                          >
                            <Bell className="h-4 w-4 sm:h-3 sm:w-3" />
                          </div>
                          <span className="text-sm sm:text-xs font-medium">
                            Add Reminder
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="mt-6 pt-4 border-t"
            style={{ borderColor: "#4A5A70" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#4A5A70" }}
                />
                <span className="text-sm" style={{ color: "#D1D5DB" }}>
                  {weekEvents.length}{" "}
                  {weekEvents.length === 1 ? "event" : "events"} this week
                </span>
              </div>

              <Link
                href="/schedule"
                className="text-sm font-medium transition-colors duration-300"
                style={{ color: "#4A5A70" }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#E5E7EB";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "#4A5A70";
                }}
              >
                View Full Schedule →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Day Overview Modal */}
      {showDayOverviewModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl border p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto"
            style={{
              backgroundColor: "#353A3A",
              borderColor: "#606364",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h2>
                <p className="text-gray-400 text-sm">
                  Working Hours:{" "}
                  {coachProfile?.workingHours?.startTime || "9:00 AM"} -{" "}
                  {coachProfile?.workingHours?.endTime || "6:00 PM"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDayOverviewModal(false);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Existing Lessons */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Scheduled Lessons
              </h3>
              {(() => {
                const lessonsForDay = coachSchedule.filter((lesson: any) =>
                  isSameDay(new Date(lesson.date), selectedDate)
                );
                return lessonsForDay.length > 0 ? (
                  <div className="space-y-2">
                    {lessonsForDay.map((lesson: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border"
                        style={{
                          backgroundColor: "#2A2F2F",
                          borderColor: "#606364",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <div>
                              <p className="text-white font-medium">
                                {format(new Date(lesson.date), "h:mm a")}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {lesson.client?.name || "Unknown Client"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1 rounded hover:bg-gray-600 transition-colors"
                              style={{ color: "#9CA3AF" }}
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-gray-600 transition-colors"
                              style={{ color: "#EF4444" }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">
                      No lessons scheduled for this day
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Available Time Slots */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Available Time Slots
              </h3>
              {(() => {
                const timeSlots = generateTimeSlots();
                const availableSlots = timeSlots.filter(time => {
                  const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                  if (!timeMatch) return false;
                  const [_, hours, minutes, period] = timeMatch;
                  let hour = parseInt(hours);
                  if (period.toUpperCase() === "PM" && hour !== 12) {
                    hour += 12;
                  } else if (period.toUpperCase() === "AM" && hour === 12) {
                    hour = 0;
                  }
                  return !coachSchedule.some((lesson: any) => {
                    const lessonDate = new Date(lesson.date);
                    return (
                      isSameDay(lessonDate, selectedDate) &&
                      lessonDate.getHours() === hour
                    );
                  });
                });

                return availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setScheduleForm({
                            ...scheduleForm,
                            time: slot,
                          });
                          setShowDayOverviewModal(false);
                          setShowScheduleModal(true);
                        }}
                        className="p-3 sm:p-2 rounded-lg border text-center transition-all duration-200 hover:bg-sky-500/10 hover:border-sky-500/30 touch-manipulation text-sm sm:text-xs"
                        style={{
                          backgroundColor: "#2A2F2F",
                          borderColor: "#606364",
                          color: "#FFFFFF",
                          minHeight: "48px",
                        }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">No available time slots</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Lesson Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl border p-4 sm:p-6 w-full max-w-md max-h-[95vh] overflow-y-auto"
            style={{
              backgroundColor: "#353A3A",
              borderColor: "#606364",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Schedule New Lesson
              </h2>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleForm({ clientId: "", time: "", date: "" });
                  setSelectedDate(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Client
                </label>
                <select
                  value={scheduleForm.clientId}
                  onChange={e =>
                    setScheduleForm({
                      ...scheduleForm,
                      clientId: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded-lg border text-white"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: "#606364",
                  }}
                >
                  <option value="">Select a client</option>
                  {clients?.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.name || client.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={e =>
                    setScheduleForm({
                      ...scheduleForm,
                      date: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded-lg border text-white"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: "#606364",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Time
                </label>
                <select
                  value={scheduleForm.time}
                  onChange={e =>
                    setScheduleForm({
                      ...scheduleForm,
                      time: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded-lg border text-white"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: "#606364",
                  }}
                >
                  <option value="">Select a time</option>
                  {generateTimeSlots().map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleForm({ clientId: "", time: "", date: "" });
                  setSelectedDate(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "#606364",
                  color: "#FFFFFF",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleLesson}
                disabled={scheduleLessonMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#10B981",
                  color: "#FFFFFF",
                }}
              >
                {scheduleLessonMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Schedule Lesson
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddReminderModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl border p-4 sm:p-6 w-full max-w-md max-h-[95vh] overflow-y-auto"
            style={{
              backgroundColor: "#353A3A",
              borderColor: "#606364",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add Reminder</h2>
              <button
                onClick={() => {
                  setShowAddReminderModal(false);
                  setReminderForm({
                    title: "",
                    description: "",
                    date: "",
                    time: "",
                  });
                  setSelectedDate(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={reminderForm.date}
                  onChange={e =>
                    setReminderForm({ ...reminderForm, date: e.target.value })
                  }
                  className="w-full p-2 rounded-lg border text-white"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: "#606364",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={reminderForm.time}
                  onChange={e =>
                    setReminderForm({ ...reminderForm, time: e.target.value })
                  }
                  className="w-full p-2 rounded-lg border text-white"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: "#606364",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={reminderForm.title}
                  onChange={e =>
                    setReminderForm({ ...reminderForm, title: e.target.value })
                  }
                  placeholder="Enter reminder title..."
                  className="w-full p-2 rounded-lg border text-white"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: "#606364",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  value={reminderForm.description}
                  onChange={e =>
                    setReminderForm({
                      ...reminderForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter reminder description..."
                  rows={3}
                  className="w-full p-2 rounded-lg border text-white resize-none"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: "#606364",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddReminderModal(false);
                  setReminderForm({
                    title: "",
                    description: "",
                    date: "",
                    time: "",
                  });
                  setSelectedDate(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "#606364",
                  color: "#FFFFFF",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!reminderForm.title || !reminderForm.time) {
                    addToast({
                      type: "error",
                      title: "Please fill in all required fields",
                      message: "Title and time are required to set a reminder.",
                    });
                    return;
                  }

                  createReminderMutation.mutate({
                    title: reminderForm.title,
                    description: reminderForm.description,
                    date: reminderForm.date,
                    time: reminderForm.time,
                  });
                }}
                disabled={createReminderMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#F59E0B",
                  color: "#FFFFFF",
                }}
              >
                {createReminderMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Setting...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Set Reminder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
