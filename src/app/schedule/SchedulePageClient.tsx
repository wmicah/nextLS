"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Calendar,
  Clock,
  Settings,
  Save,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  X,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Repeat,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  addWeeks,
} from "date-fns";
import Sidebar from "@/components/Sidebar";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileSchedulePage from "@/components/MobileSchedulePage";
import WorkingHoursModal from "@/components/WorkingHoursModal";

function SchedulePageClient() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDayOverviewModal, setShowDayOverviewModal] = useState(false);
  const [showDayManagementModal, setShowDayManagementModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRequestToReject, setSelectedRequestToReject] =
    useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Recurring lesson states for Day Overview Modal
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [endDate, setEndDate] = useState<string>("");
  const [previewDates, setPreviewDates] = useState<Date[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");

  // Fetch coach's profile for working hours
  const { data: coachProfile } = trpc.user.getProfile.useQuery();

  // Calculate preview dates for recurring lessons
  useEffect(() => {
    if (isRecurring && selectedDate && endDate) {
      const start = new Date(selectedDate);
      const end = new Date(endDate);
      const dates: Date[] = [];
      let currentDate = new Date(start);

      while (currentDate <= end) {
        // Check if the date is on a working day
        if (coachProfile?.workingDays) {
          const dayName = format(currentDate, "EEEE");
          if (coachProfile.workingDays.includes(dayName)) {
            dates.push(new Date(currentDate));
          }
        } else {
          dates.push(new Date(currentDate));
        }

        // Calculate next lesson date - always weekly with interval
        currentDate = addWeeks(currentDate, recurrenceInterval);
      }

      setPreviewDates(dates);
    } else {
      setPreviewDates([]);
    }
  }, [
    isRecurring,
    selectedDate,
    endDate,
    recurrenceInterval,
    coachProfile?.workingDays,
  ]);

  const [scheduleForm, setScheduleForm] = useState({
    clientId: "",
    time: "",
    date: "",
  });

  // Fetch coach's schedule for the current month
  const { data: coachSchedule = [] } =
    trpc.scheduling.getCoachSchedule.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  // Fetch coach's upcoming lessons across all months
  const { data: upcomingLessons = [] } =
    trpc.scheduling.getCoachUpcomingLessons.useQuery();

  // Fetch coach's active clients for scheduling (exclude archived)
  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  // Fetch pending schedule requests
  const { data: pendingRequests = [] } =
    trpc.clientRouter.getPendingScheduleRequests.useQuery();

  const utils = trpc.useUtils();

  const scheduleLessonMutation = trpc.scheduling.scheduleLesson.useMutation({
    onSuccess: () => {
      utils.scheduling.getCoachSchedule.invalidate();
      utils.scheduling.getCoachUpcomingLessons.invalidate();
      setShowScheduleModal(false);
      setScheduleForm({ clientId: "", time: "", date: "" });
      setSelectedDate(null);
    },
    onError: error => {
      alert(`Error scheduling lesson: ${error.message}`);
    },
  });

  const scheduleRecurringLessonsMutation =
    trpc.scheduling.scheduleRecurringLessons.useMutation({
      onSuccess: () => {
        utils.scheduling.getCoachSchedule.invalidate();
        utils.scheduling.getCoachUpcomingLessons.invalidate();
        setShowDayOverviewModal(false);
        setScheduleForm({ clientId: "", time: "", date: "" });
        setSelectedDate(null);
        setSelectedTimeSlot("");
        setIsRecurring(false);
        setEndDate("");
        setPreviewDates([]);
      },
      onError: error => {
        alert(`Error scheduling recurring lessons: ${error.message}`);
      },
    });

  const deleteLessonMutation = trpc.scheduling.deleteLesson.useMutation({
    onSuccess: () => {
      utils.scheduling.getCoachSchedule.invalidate();
      utils.scheduling.getCoachUpcomingLessons.invalidate();
    },
    onError: error => {
      alert(`Error deleting lesson: ${error.message}`);
    },
  });

  const approveScheduleRequestMutation =
    trpc.clientRouter.approveScheduleRequest.useMutation({
      onSuccess: () => {
        utils.scheduling.getCoachSchedule.invalidate();
        utils.scheduling.getCoachUpcomingLessons.invalidate();
        utils.clientRouter.getPendingScheduleRequests.invalidate();
      },
      onError: error => {
        alert(`Error approving request: ${error.message}`);
      },
    });

  const rejectScheduleRequestMutation =
    trpc.clientRouter.rejectScheduleRequest.useMutation({
      onSuccess: () => {
        utils.scheduling.getCoachSchedule.invalidate();
        utils.scheduling.getCoachUpcomingLessons.invalidate();
        utils.clientRouter.getPendingScheduleRequests.invalidate();
      },
      onError: error => {
        alert(`Error rejecting request: ${error.message}`);
      },
    });

  const fixPendingCoachLessonsMutation =
    trpc.clientRouter.fixPendingCoachLessons.useMutation({
      onSuccess: data => {
        utils.scheduling.getCoachSchedule.invalidate();
        utils.scheduling.getCoachUpcomingLessons.invalidate();
        utils.clientRouter.getPendingScheduleRequests.invalidate();
        alert(
          `Fixed ${data.updatedCount} incorrectly pending coach-scheduled lessons!`
        );
      },
      onError: error => {
        alert(`Error fixing lessons: ${error.message}`);
      },
    });

  // Generate calendar days for the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(
      direction === "prev"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1)
    );
  };

  const getLessonsForDate = (date: Date) => {
    const now = new Date();
    const lessons = coachSchedule.filter((lesson: { date: string }) => {
      const lessonDate = new Date(lesson.date);
      // Compare only the date part, not the time
      const lessonDateOnly = new Date(
        lessonDate.getFullYear(),
        lessonDate.getMonth(),
        lessonDate.getDate()
      );
      const targetDateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const isSame = lessonDateOnly.getTime() === targetDateOnly.getTime();

      // Only include lessons that are in the future (all coachSchedule lessons are already CONFIRMED)
      const isFuture = lessonDate > now;

      return isSame && isFuture;
    });

    return lessons;
  };

  const getAllLessonsForDate = (date: Date) => {
    const lessons = coachSchedule.filter((lesson: { date: string }) => {
      const lessonDate = new Date(lesson.date);
      // Compare only the date part, not the time
      const lessonDateOnly = new Date(
        lessonDate.getFullYear(),
        lessonDate.getMonth(),
        lessonDate.getDate()
      );
      const targetDateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const isSame = lessonDateOnly.getTime() === targetDateOnly.getTime();

      return isSame;
    });

    // Sort by time
    return lessons.sort(
      (a: { date: string }, b: { date: string }) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
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
      alert("Please fill in all fields");
      return;
    }

    const selectedClient = clients.find(
      (c: { id: string }) => c.id === scheduleForm.clientId
    );

    if (!selectedClient) {
      alert("Please select a valid client");
      return;
    }

    // Combine date and time into a single Date object
    const dateStr = scheduleForm.date;
    const timeStr = scheduleForm.time;

    // Parse the time string (e.g., "2:00 PM")
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) {
      alert("Invalid time format");
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
      alert("Invalid date/time combination");
      return;
    }

    // Check if the lesson is in the past
    const now = new Date();
    if (lessonDate <= now) {
      alert(
        "Cannot schedule lessons in the past. Please select a future date and time."
      );
      return;
    }

    const timeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
    scheduleLessonMutation.mutate({
      clientId: scheduleForm.clientId,
      lessonDate: fullDateStr, // Send as string instead of Date object
      timeZone,
    });
  };

  const handleDeleteLesson = (lessonId: string, lessonTitle: string) => {
    if (confirm(`Are you sure you want to delete "${lessonTitle}"?`)) {
      deleteLessonMutation.mutate({
        lessonId: lessonId,
      });
    }
  };

  const handleRejectRequest = (request: {
    id: string;
    clientId: string;
    date: string;
    time: string;
    reason: string;
  }) => {
    setSelectedRequestToReject(request);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (selectedRequestToReject) {
      rejectScheduleRequestMutation.mutate({
        eventId: selectedRequestToReject.id,
        reason: rejectReason,
      });
      setShowRejectModal(false);
      setSelectedRequestToReject(null);
      setRejectReason("");
    }
  };

  // Helper functions to determine lesson types
  // const isClientRequest = (lesson: { status: string }) => {
  // 	return lesson.status === "PENDING"
  // }

  const isCoachScheduled = (_lesson: { status: string }) => {
    return true; // All lessons in coachSchedule are coach-scheduled (confirmed)
  };

  const handleApproveRequest = (
    request: {
      id: string;
      clientId: string;
      date: string;
      time: string;
      reason: string;
    },
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    approveScheduleRequestMutation.mutate({
      eventId: request.id,
    });
  };

  const handleRejectRequestInline = (
    request: {
      id: string;
      clientId: string;
      date: string;
      time: string;
      reason: string;
    },
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    handleRejectRequest(request);
  };

  // Generate time slots based on coach's working hours and interval
  const generateTimeSlots = () => {
    const startTime = coachProfile?.workingHours?.startTime || "9:00 AM";
    const endTime = coachProfile?.workingHours?.endTime || "6:00 PM";
    const interval = coachProfile?.workingHours?.timeSlotInterval || 60;

    const slots = [];

    // Parse start and end times
    const startMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    const endMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!startMatch || !endMatch) {
      // Fallback to default hours with hourly slots
      for (let hour = 9; hour < 18; hour++) {
        const displayHour = hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? "PM" : "AM";
        slots.push(`${displayHour}:00 ${period}`);
      }
      return slots;
    }

    const [, startHour, startMinute, startPeriod] = startMatch;
    const [, endHour, endMinute, endPeriod] = endMatch;

    // Convert to 24-hour format and total minutes
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

    // Get current time to filter out past slots
    const now = new Date();
    const isToday =
      scheduleForm.date && format(now, "yyyy-MM-dd") === scheduleForm.date;
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    // Generate slots based on interval
    for (
      let totalMinutes = startTotalMinutes;
      totalMinutes < endTotalMinutes;
      totalMinutes += interval
    ) {
      // Skip past time slots for today
      if (isToday && totalMinutes <= currentTotalMinutes) {
        continue;
      }

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

  const timeSlots = generateTimeSlots();

  const generateAvailableTimeSlots = (date: Date) => {
    const startTime = coachProfile?.workingHours?.startTime || "9:00 AM";
    const endTime = coachProfile?.workingHours?.endTime || "6:00 PM";
    const interval = coachProfile?.workingHours?.timeSlotInterval || 60;
    const workingDays = coachProfile?.workingHours?.workingDays || [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const slots = [];

    // Check if the date is on a working day
    const dayName = format(date, "EEEE");
    if (!workingDays.includes(dayName)) {
      return []; // No available slots on non-working days
    }

    // Parse start and end times
    const startMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    const endMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!startMatch || !endMatch) {
      // Fallback to default hours with hourly slots
      for (let hour = 9; hour < 18; hour++) {
        const displayHour = hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? "PM" : "AM";
        slots.push(`${displayHour}:00 ${period}`);
      }
      return slots;
    }

    const [, startHour, startMinute, startPeriod] = startMatch;
    const [, endHour, endMinute, endPeriod] = endMatch;

    // Convert to 24-hour format and total minutes
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

    // Get current time to filter out past slots for today
    const now = new Date();
    const isToday = format(now, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    // Get existing lessons for this date
    const existingLessons = getAllLessonsForDate(date);
    const bookedTimes = existingLessons.map((lesson: { date: string }) => {
      const lessonDate = new Date(lesson.date);
      return format(lessonDate, "h:mm a");
    });

    // Generate slots based on interval
    for (
      let totalMinutes = startTotalMinutes;
      totalMinutes < endTotalMinutes;
      totalMinutes += interval
    ) {
      // Skip past time slots for today
      if (isToday && totalMinutes <= currentTotalMinutes) {
        continue;
      }

      const hour24 = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;

      const displayHour =
        hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const period = hour24 >= 12 ? "PM" : "AM";
      const minuteStr = minute.toString().padStart(2, "0");
      const timeSlot = `${displayHour}:${minuteStr} ${period}`;

      // Only add if not already booked
      if (!bookedTimes.includes(timeSlot)) {
        slots.push(timeSlot);
      }
    }

    return slots;
  };

  return (
    <Sidebar>
      <div className="min-h-screen p-6" style={{ backgroundColor: "#2A3133" }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Schedule Management
                </h1>
                <p className="text-gray-400">
                  Manage your availability and schedule lessons
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: "#10B981",
                  color: "#FFFFFF",
                }}
              >
                <Plus className="h-4 w-4" />
                Schedule Lesson
              </button>
              <button
                onClick={() => setShowWorkingHoursModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: "#4A5A70",
                  color: "#FFFFFF",
                }}
              >
                <Settings className="h-4 w-4" />
                Working Hours
              </button>
            </div>
          </div>

          {/* Current Working Hours Display */}
          <div
            className="mb-6 p-4 rounded-lg border-2"
            style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-sky-400" />
                <h2 className="text-lg font-semibold text-white">
                  Current Working Hours
                </h2>
              </div>
            </div>
            <p className="text-gray-300">
              {coachProfile?.workingHours?.startTime || "9:00 AM"} -{" "}
              {coachProfile?.workingHours?.endTime || "6:00 PM"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Working Days:{" "}
              {coachProfile?.workingHours?.workingDays?.join(", ") ||
                "Monday - Sunday"}
            </p>
          </div>

          {/* Pending Schedule Requests */}
          {pendingRequests.length > 0 && (
            <div
              className="mb-6 p-4 rounded-lg border-2"
              style={{ backgroundColor: "#1F2426", borderColor: "#FFA500" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-orange-400" />
                <h2 className="text-lg font-semibold text-white">
                  Pending Schedule Requests ({pendingRequests.length})
                </h2>
              </div>
              <div className="space-y-3">
                {pendingRequests.map((request: any) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-orange-500/20 bg-orange-500/10"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-orange-300">
                        {request.client?.name ||
                          request.client?.email ||
                          "Client"}
                      </div>
                      <div className="text-sm text-orange-200">
                        {format(
                          new Date(request.date),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </div>
                      {request.description && (
                        <div className="text-xs text-orange-100 mt-1">
                          Reason: {request.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          approveScheduleRequestMutation.mutate({
                            eventId: request.id,
                          })
                        }
                        disabled={approveScheduleRequestMutation.isPending}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: "#10B981",
                          color: "#FFFFFF",
                        }}
                      >
                        {approveScheduleRequestMutation.isPending
                          ? "Approving..."
                          : "Approve"}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        disabled={rejectScheduleRequestMutation.isPending}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: "#EF4444",
                          color: "#FFFFFF",
                        }}
                      >
                        {rejectScheduleRequestMutation.isPending
                          ? "Rejecting..."
                          : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Lessons Summary */}
          {(() => {
            const today = new Date();
            const now = new Date();
            const todaysLessons = getLessonsForDate(today);
            const nextUpcomingLessons = upcomingLessons.slice(0, 5);

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Today's Lessons */}
                <div
                  className="p-4 rounded-lg border-2"
                  style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Today&apos;s Upcoming Lessons
                    </h3>
                  </div>
                  {todaysLessons.length > 0 ? (
                    <div className="space-y-2">
                      {todaysLessons.map((lesson: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded bg-emerald-500/10 border border-emerald-500/20 group"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-emerald-300">
                              {format(new Date(lesson.date), "h:mm a")}
                            </div>
                            <div className="text-sm text-emerald-200">
                              {lesson.client?.name ||
                                lesson.client?.email ||
                                "Client"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-emerald-400">
                              {lesson.title}
                            </div>
                            <button
                              onClick={() =>
                                handleDeleteLesson(lesson.id, lesson.title)
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
                              title="Delete lesson"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">
                      No upcoming lessons scheduled for today
                    </p>
                  )}
                </div>

                {/* Upcoming Lessons */}
                <div
                  className="p-4 rounded-lg border-2"
                  style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-5 w-5 text-sky-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Upcoming Lessons
                    </h3>
                  </div>
                  {nextUpcomingLessons.length > 0 ? (
                    <div className="space-y-2">
                      {nextUpcomingLessons.map((lesson: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded bg-sky-500/10 border border-sky-500/20 group"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sky-300">
                              {format(new Date(lesson.date), "MMM d, h:mm a")}
                            </div>
                            <div className="text-sm text-sky-200">
                              {lesson.client?.name ||
                                lesson.client?.email ||
                                "Client"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-sky-400">
                              {lesson.title}
                            </div>
                            <button
                              onClick={() =>
                                handleDeleteLesson(lesson.id, lesson.title)
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
                              title="Delete lesson"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">
                      No upcoming lessons scheduled
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <h3 className="text-xl font-semibold text-white">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Calendar Legend */}
          <div className="flex items-center gap-6 mb-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500 border-2 border-emerald-400" />
              <span className="text-white font-medium">Scheduled Lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500 border-2 border-orange-400" />
              <span className="text-white font-medium">Pending Requests</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-400" />
              <span className="text-white font-medium">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500/20 border-2 border-orange-500/50" />
              <span className="text-orange-300 font-medium">
                Non-working Day
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-600 border-2 border-gray-500" />
              <span className="text-gray-300 font-medium">Past Date</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-700 border-2 border-gray-600" />
              <span className="text-gray-400 font-medium">Other Month</span>
            </div>
          </div>

          {/* Calendar */}
          <div
            className="p-6 rounded-lg border-2"
            style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
          >
            <div className="grid grid-cols-7 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                <div
                  key={day}
                  className="text-center text-sm font-bold text-blue-300 py-3 border-b-2 border-blue-500/30"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                const lessonsForDay = getLessonsForDate(day);

                const pendingForDay = pendingRequests.filter(
                  (request: { date: string }) => {
                    const requestDate = new Date(request.date);
                    return isSameDay(requestDate, day);
                  }
                );
                const hasLessons = lessonsForDay.length > 0;
                const hasPending = pendingForDay.length > 0;

                // Check if this is a working day
                const dayName = format(day, "EEEE");
                const workingDays = coachProfile?.workingHours?.workingDays || [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ];
                const isWorkingDay = workingDays.includes(dayName);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => !isPast && handleDateClick(day)}
                    className={`
                      p-2 md:p-3 text-xs md:text-sm rounded-lg transition-all duration-200 relative min-h-[120px] md:min-h-[140px] border-2 overflow-hidden
                      ${
                        isPast
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }
                      ${
                        isToday
                          ? "bg-blue-500/20 text-blue-300 border-blue-400 shadow-lg"
                          : isPast
                          ? "text-gray-500 bg-gray-700/30 border-gray-600"
                          : isCurrentMonth
                          ? isWorkingDay
                            ? "text-white bg-gray-800/50 border-gray-600 hover:bg-blue-500/10 hover:border-blue-400"
                            : "text-orange-400 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 hover:border-orange-400"
                          : "text-gray-600 bg-gray-900/30 border-gray-700"
                      }
                    `}
                  >
                    <div className="font-bold text-sm md:text-lg mb-1 md:mb-2 flex items-center justify-between">
                      <span>{format(day, "d")}</span>
                      {!isWorkingDay && isCurrentMonth && !isPast && (
                        <div
                          className="w-2 h-2 bg-orange-500 rounded-full"
                          title="Non-working day"
                        />
                      )}
                    </div>

                    {/* Pending Requests */}
                    {hasPending && (
                      <div className="space-y-0.5 md:space-y-1 mb-1 md:mb-2">
                        {pendingForDay
                          .slice(0, 2)
                          .map((request: any, index: number) => (
                            <div
                              key={`pending-${index}`}
                              className="text-xs p-1.5 md:p-2 rounded bg-orange-500/40 text-orange-100 border-2 border-orange-400 shadow-md relative group overflow-hidden"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-xs leading-tight">
                                    {format(new Date(request.date), "h:mm a")}
                                  </div>
                                  <div className="truncate text-orange-200 font-medium text-xs leading-tight">
                                    {request.client?.name ||
                                      request.client?.email ||
                                      "Client"}
                                  </div>
                                </div>
                                {/* Accept/Reject buttons - only for client requests */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <button
                                    onClick={e =>
                                      handleApproveRequest(request, e)
                                    }
                                    disabled={
                                      approveScheduleRequestMutation.isPending
                                    }
                                    className="p-0.5 rounded hover:bg-green-500/30 text-green-300 hover:text-green-200 transition-colors"
                                    title="Approve request"
                                  >
                                    <CheckCircle className="h-2.5 w-2.5" />
                                  </button>
                                  <button
                                    onClick={e =>
                                      handleRejectRequestInline(request, e)
                                    }
                                    disabled={
                                      rejectScheduleRequestMutation.isPending
                                    }
                                    className="p-0.5 rounded hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-colors"
                                    title="Reject request"
                                  >
                                    <XCircle className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        {pendingForDay.length > 2 && (
                          <div className="text-xs text-orange-400 text-center py-1">
                            +{pendingForDay.length - 2} more pending
                          </div>
                        )}
                      </div>
                    )}

                    {/* Confirmed Lessons */}
                    {hasLessons && (
                      <div className="space-y-0.5 md:space-y-1">
                        {lessonsForDay
                          .slice(0, 3)
                          .map((lesson: any, index: number) => (
                            <div
                              key={index}
                              className="text-xs p-1.5 md:p-2 rounded bg-emerald-500/40 text-emerald-100 border-2 border-emerald-400 shadow-md relative group overflow-hidden"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-xs leading-tight">
                                    {format(new Date(lesson.date), "h:mm a")}
                                  </div>
                                  <div className="truncate text-emerald-200 font-medium text-xs leading-tight">
                                    {lesson.client?.name ||
                                      lesson.client?.email ||
                                      "Client"}
                                  </div>
                                </div>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteLesson(lesson.id, lesson.title);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/30 text-red-300 hover:text-red-200 flex-shrink-0"
                                  title="Delete lesson"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        {lessonsForDay.length > 3 && (
                          <div className="text-xs text-gray-400 text-center py-1">
                            +{lessonsForDay.length - 3} more lessons
                          </div>
                        )}
                      </div>
                    )}

                    {!hasLessons && !hasPending && (
                      <div className="text-xs text-gray-400 mt-2 font-medium">
                        {isCurrentMonth && !isPast ? "No lessons" : ""}
                      </div>
                    )}
                    {!hasLessons && isCurrentMonth && !isPast && (
                      <div className="text-xs text-blue-400 mt-2 font-medium">
                        Click to schedule
                      </div>
                    )}
                    {!hasLessons && isCurrentMonth && isPast && (
                      <div className="text-xs text-gray-500 mt-2 font-medium">
                        Past date
                      </div>
                    )}

                    {/* Quick Action Buttons for Available Days */}
                    {!isPast && isCurrentMonth && isWorkingDay && (
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDateClick(day);
                          }}
                          className="p-1 bg-sky-500 hover:bg-sky-600 text-white rounded text-xs"
                          title="View Day Details"
                        >
                          <Calendar className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Working Hours Modal */}
          <WorkingHoursModal
            isOpen={showWorkingHoursModal}
            onClose={() => setShowWorkingHoursModal(false)}
            coachProfile={
              coachProfile
                ? {
                    ...coachProfile,
                    workingHours: coachProfile.workingHours || undefined,
                  }
                : undefined
            }
          />

          {/* Schedule Lesson Modal */}
          {showScheduleModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                className="rounded-2xl shadow-xl border p-6 w-full max-w-md mx-4"
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
                      {clients.map((client: any) => (
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
                      {timeSlots.map(slot => (
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

          {/* Day Overview Modal */}
          {showDayOverviewModal && selectedDate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                className="rounded-2xl shadow-xl border p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
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
                    {(() => {
                      const dayName = format(selectedDate, "EEEE");
                      const workingDays = coachProfile?.workingHours
                        ?.workingDays || [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ];
                      const isWorkingDay = workingDays.includes(dayName);

                      if (!isWorkingDay) {
                        return <p className="text-orange-400 text-sm mt-1"></p>;
                      }
                      return null;
                    })()}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setShowDayOverviewModal(false);
                        setShowDayManagementModal(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        backgroundColor: "#4A5A70",
                        color: "#FFFFFF",
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      Manage Day
                    </button>
                    <button
                      onClick={() => {
                        setShowDayOverviewModal(false);
                        setSelectedDate(null);
                        setScheduleForm({ clientId: "", time: "", date: "" });
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Existing Lessons */}
                <div className="mb-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Scheduled Lessons
                    </h3>
                  </div>

                  {(() => {
                    const dayLessons = getAllLessonsForDate(selectedDate);
                    return dayLessons.length > 0 ? (
                      <div className="space-y-3">
                        {dayLessons.map((lesson: any, index: number) => {
                          const lessonDate = new Date(lesson.date);
                          const isPast = lessonDate < new Date();
                          return (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-4 rounded-lg border group ${
                                isPast
                                  ? "bg-gray-800/20 border-gray-600/30"
                                  : "bg-emerald-500/10 border-emerald-500/20"
                              }`}
                            >
                              <div className="flex-1">
                                <div
                                  className={`font-medium ${
                                    isPast
                                      ? "text-gray-400"
                                      : "text-emerald-300"
                                  }`}
                                >
                                  {format(lessonDate, "h:mm a")}
                                </div>
                                <div
                                  className={`text-sm ${
                                    isPast
                                      ? "text-gray-500"
                                      : "text-emerald-200"
                                  }`}
                                >
                                  {lesson.client?.name ||
                                    lesson.client?.email ||
                                    "Client"}
                                </div>
                                <div
                                  className={`text-xs ${
                                    isPast
                                      ? "text-gray-600"
                                      : "text-emerald-400"
                                  }`}
                                >
                                  {lesson.title}
                                </div>
                              </div>
                              {!isPast && (
                                <button
                                  onClick={() =>
                                    handleDeleteLesson(lesson.id, lesson.title)
                                  }
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
                                  title="Delete lesson"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
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
                    // Check if this is a working day
                    const dayName = format(selectedDate, "EEEE");
                    const workingDays = coachProfile?.workingHours
                      ?.workingDays || [
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ];
                    const isWorkingDay = workingDays.includes(dayName);

                    // Generate time slots for the day (ignoring working day restrictions for coaches)
                    const generateTimeSlotsForDay = (date: Date) => {
                      const startTime =
                        coachProfile?.workingHours?.startTime || "9:00 AM";
                      const endTime =
                        coachProfile?.workingHours?.endTime || "6:00 PM";
                      const interval =
                        coachProfile?.workingHours?.timeSlotInterval || 60;
                      const slots = [];

                      // Parse start and end times
                      const startMatch = startTime.match(
                        /(\d+):(\d+)\s*(AM|PM)/i
                      );
                      const endMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

                      if (!startMatch || !endMatch) {
                        // Fallback to default hours with hourly slots
                        for (let hour = 9; hour < 18; hour++) {
                          const displayHour = hour > 12 ? hour - 12 : hour;
                          const period = hour >= 12 ? "PM" : "AM";
                          slots.push(`${displayHour}:00 ${period}`);
                        }
                        return slots;
                      }

                      const [, startHour, startMinute, startPeriod] =
                        startMatch;
                      const [, endHour, endMinute, endPeriod] = endMatch;

                      // Convert to 24-hour format and total minutes
                      let startTotalMinutes =
                        parseInt(startHour) * 60 + parseInt(startMinute);
                      if (
                        startPeriod.toUpperCase() === "PM" &&
                        parseInt(startHour) !== 12
                      )
                        startTotalMinutes += 12 * 60;
                      if (
                        startPeriod.toUpperCase() === "AM" &&
                        parseInt(startHour) === 12
                      )
                        startTotalMinutes = parseInt(startMinute);

                      let endTotalMinutes =
                        parseInt(endHour) * 60 + parseInt(endMinute);
                      if (
                        endPeriod.toUpperCase() === "PM" &&
                        parseInt(endHour) !== 12
                      )
                        endTotalMinutes += 12 * 60;
                      if (
                        endPeriod.toUpperCase() === "AM" &&
                        parseInt(endHour) === 12
                      )
                        endTotalMinutes = parseInt(endMinute);

                      // Get current time to filter out past slots for today
                      const now = new Date();
                      const isToday =
                        format(now, "yyyy-MM-dd") ===
                        format(date, "yyyy-MM-dd");
                      const currentTotalMinutes =
                        now.getHours() * 60 + now.getMinutes();

                      // Get existing lessons for this date
                      const existingLessons = getAllLessonsForDate(date);
                      const bookedTimes = existingLessons.map(
                        (lesson: { date: string }) => {
                          const lessonDate = new Date(lesson.date);
                          return format(lessonDate, "h:mm a");
                        }
                      );

                      // Generate slots based on interval
                      for (
                        let totalMinutes = startTotalMinutes;
                        totalMinutes < endTotalMinutes;
                        totalMinutes += interval
                      ) {
                        // Skip past time slots for today
                        if (isToday && totalMinutes <= currentTotalMinutes) {
                          continue;
                        }

                        const hour24 = Math.floor(totalMinutes / 60);
                        const minute = totalMinutes % 60;

                        const displayHour =
                          hour24 === 0
                            ? 12
                            : hour24 > 12
                            ? hour24 - 12
                            : hour24;
                        const period = hour24 >= 12 ? "PM" : "AM";
                        const minuteStr = minute.toString().padStart(2, "0");

                        const timeSlot = `${displayHour}:${minuteStr} ${period}`;

                        // Check if this slot is already booked
                        if (!bookedTimes.includes(timeSlot)) {
                          slots.push(timeSlot);
                        }
                      }

                      return slots;
                    };

                    const availableSlots =
                      generateTimeSlotsForDay(selectedDate);

                    if (!isWorkingDay) {
                      // Show warning message but still display time slots
                      return (
                        <div>
                          <div className="mb-4 p-4 rounded-lg bg-orange-500/20 border border-orange-500/30">
                            <p className="text-orange-300 text-sm mb-2">
                              ⚠️ This isn't a normal working day for you
                            </p>
                            <p className="text-orange-200 text-sm">
                              You can still schedule lessons outside your
                              regular working hours if needed.
                            </p>
                          </div>
                          {availableSlots.length > 0 ? (
                            <>
                              <div className="grid grid-cols-3 gap-2">
                                {availableSlots.map((slot, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setSelectedTimeSlot(slot)}
                                    className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                                      selectedTimeSlot === slot
                                        ? "bg-sky-500 border-sky-400 text-white"
                                        : "hover:bg-sky-500/10 hover:border-sky-500/30"
                                    }`}
                                    style={{
                                      backgroundColor:
                                        selectedTimeSlot === slot
                                          ? "#0EA5E9"
                                          : "#2A2F2F",
                                      borderColor:
                                        selectedTimeSlot === slot
                                          ? "#0EA5E9"
                                          : "#606364",
                                      color: "#FFFFFF",
                                    }}
                                  >
                                    {slot}
                                  </button>
                                ))}
                              </div>

                              {selectedTimeSlot && (
                                <div
                                  className="mt-4 pt-4 border-t"
                                  style={{ borderColor: "#606364" }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm text-gray-400">
                                        Selected time:{" "}
                                        <span className="text-white font-medium">
                                          {selectedTimeSlot}
                                        </span>
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Choose a client to schedule the lesson
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <select
                                        value={scheduleForm.clientId}
                                        onChange={e =>
                                          setScheduleForm({
                                            ...scheduleForm,
                                            clientId: e.target.value,
                                          })
                                        }
                                        className="p-2 rounded-md text-white text-sm"
                                        style={{
                                          backgroundColor: "#2A2F2F",
                                          borderColor: "#606364",
                                        }}
                                      >
                                        <option value="">
                                          Select client...
                                        </option>
                                        {clients.map(client => (
                                          <option
                                            key={client.id}
                                            value={client.id}
                                          >
                                            {client.name ||
                                              client.email ||
                                              "Unnamed Client"}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => {
                                          if (
                                            scheduleForm.clientId &&
                                            selectedDate &&
                                            selectedTimeSlot
                                          ) {
                                            // Construct the full date string
                                            const dateStr = selectedDate
                                              .toISOString()
                                              .split("T")[0];
                                            const [time, period] =
                                              selectedTimeSlot.split(" ");
                                            const [hour, minute] =
                                              time.split(":");
                                            const hour24 =
                                              period === "PM" && hour !== "12"
                                                ? parseInt(hour) + 12
                                                : period === "AM" &&
                                                  hour === "12"
                                                ? 0
                                                : parseInt(hour);

                                            const fullDateStr = `${dateStr}T${hour24
                                              .toString()
                                              .padStart(2, "0")}:${minute}:00`;

                                            // Schedule the lesson
                                            scheduleLessonMutation.mutate({
                                              clientId: scheduleForm.clientId,
                                              lessonDate: fullDateStr,
                                            });
                                          }
                                        }}
                                        disabled={!scheduleForm.clientId}
                                        className="px-4 py-2 hover:opacity-80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                                        style={{
                                          backgroundColor: "#2A2F2F",
                                        }}
                                      >
                                        Schedule Lesson
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-6">
                              <Clock className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                              <p className="text-gray-400">
                                No available time slots
                              </p>
                              <p className="text-gray-500 text-sm">
                                All working hours are booked
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Regular working day display
                    return availableSlots.length > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((slot, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedTimeSlot(slot)}
                              className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                                selectedTimeSlot === slot
                                  ? "bg-sky-500 border-sky-400 text-white"
                                  : "hover:bg-sky-500/10 hover:border-sky-500/30"
                              }`}
                              style={{
                                backgroundColor:
                                  selectedTimeSlot === slot
                                    ? "#0EA5E9"
                                    : "#2A2F2F",
                                borderColor:
                                  selectedTimeSlot === slot
                                    ? "#0EA5E9"
                                    : "#606364",
                                color: "#FFFFFF",
                              }}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>

                        {/* Schedule Lesson Button */}
                        {selectedTimeSlot && (
                          <div
                            className="mt-4 pt-4 border-t"
                            style={{ borderColor: "#606364" }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-400">
                                  Selected time:{" "}
                                  <span className="text-white font-medium">
                                    {selectedTimeSlot}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  Choose a client to schedule the lesson
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <select
                                  value={scheduleForm.clientId}
                                  onChange={e =>
                                    setScheduleForm({
                                      ...scheduleForm,
                                      clientId: e.target.value,
                                    })
                                  }
                                  className="p-2 rounded-md text-white text-sm"
                                  style={{
                                    backgroundColor: "#2A2F2F",
                                    borderColor: "#606364",
                                  }}
                                >
                                  <option value="">Select client...</option>
                                  {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                      {client.name ||
                                        client.email ||
                                        "Unnamed Client"}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => {
                                    if (
                                      scheduleForm.clientId &&
                                      selectedDate &&
                                      selectedTimeSlot
                                    ) {
                                      // Construct the full date string
                                      const dateStr = selectedDate
                                        .toISOString()
                                        .split("T")[0];
                                      const [time, period] =
                                        selectedTimeSlot.split(" ");
                                      const [hour, minute] = time.split(":");
                                      const hour24 =
                                        period === "PM" && hour !== "12"
                                          ? parseInt(hour) + 12
                                          : period === "AM" && hour === "12"
                                          ? 0
                                          : parseInt(hour);

                                      const fullDateStr = `${dateStr}T${hour24
                                        .toString()
                                        .padStart(2, "0")}:${minute}:00`;

                                      // Schedule the lesson
                                      scheduleLessonMutation.mutate({
                                        clientId: scheduleForm.clientId,
                                        lessonDate: fullDateStr,
                                      });
                                    }
                                  }}
                                  disabled={!scheduleForm.clientId}
                                  className="px-4 py-2 hover:opacity-80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                                  style={{
                                    backgroundColor: "#2A2F2F",
                                  }}
                                >
                                  Schedule Lesson
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <Clock className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400">No available time slots</p>
                        <p className="text-gray-500 text-sm">
                          All working hours are booked
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Recurring Lesson Options */}
                <div
                  className="mt-8 pt-6 border-t"
                  style={{ borderColor: "#606364" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Repeat className="h-5 w-5 text-sky-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Schedule Recurring Lessons
                        </h3>
                        <p className="text-sm text-gray-400">
                          Create multiple lessons at once with automatic
                          scheduling
                        </p>
                        {selectedTimeSlot && (
                          <p className="text-xs text-sky-400 mt-1">
                            Using selected time:{" "}
                            <span className="font-medium">
                              {selectedTimeSlot}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={isRecurring}
                      onChange={e => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 text-sky-600 bg-gray-700 border-gray-600 rounded focus:ring-sky-500 focus:ring-2"
                    />
                  </div>

                  {isRecurring && (
                    <div className="space-y-4">
                      {/* Client Selection - Uses same client as single lesson */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Client
                        </label>
                        <div className="p-3 rounded-md text-white bg-gray-700/50 border border-gray-600">
                          {scheduleForm.clientId ? (
                            <span className="text-green-400">
                              ✓{" "}
                              {clients.find(c => c.id === scheduleForm.clientId)
                                ?.name ||
                                clients.find(
                                  c => c.id === scheduleForm.clientId
                                )?.email ||
                                "Selected Client"}
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              Please select a client above first
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Recurrence Settings */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Repeat Every
                        </label>
                        <select
                          value={recurrenceInterval}
                          onChange={e =>
                            setRecurrenceInterval(parseInt(e.target.value))
                          }
                          className="w-full p-3 rounded-md text-white"
                          style={{
                            backgroundColor: "#2A2F2F",
                            borderColor: "#606364",
                          }}
                        >
                          {[1, 2, 3, 4, 5, 6].map(num => (
                            <option key={num} value={num}>
                              {num} week{num > 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* End Date */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          min={
                            selectedDate
                              ? format(selectedDate, "yyyy-MM-dd")
                              : format(new Date(), "yyyy-MM-dd")
                          }
                          className="w-full p-3 rounded-md text-white"
                          style={{
                            backgroundColor: "#2A2F2F",
                            borderColor: "#606364",
                          }}
                        />
                      </div>

                      {/* Preview and Schedule Button */}
                      {scheduleForm.clientId && endDate && (
                        <div
                          className="pt-4 border-t"
                          style={{ borderColor: "#606364" }}
                        >
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-400 mb-2">
                                {previewDates.length > 0
                                  ? `${previewDates.length} lessons will be scheduled`
                                  : "Calculating preview..."}
                              </p>

                              {/* Preview of scheduled dates */}
                              {previewDates.length > 0 && (
                                <div className="max-h-32 overflow-y-auto bg-gray-800/50 rounded-lg p-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {previewDates
                                      .slice(0, 8)
                                      .map((date, index) => (
                                        <div
                                          key={index}
                                          className="text-sm text-gray-300 bg-gray-700/50 p-2 rounded"
                                        >
                                          {format(date, "MMM d, yyyy")} at{" "}
                                          {selectedTimeSlot}
                                        </div>
                                      ))}
                                    {previewDates.length > 8 && (
                                      <div className="text-sm text-gray-400 col-span-full text-center py-2">
                                        ... and {previewDates.length - 8} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                Starting from{" "}
                                {selectedDate
                                  ? format(selectedDate, "MMM d, yyyy")
                                  : "selected date"}{" "}
                                at {selectedTimeSlot}
                              </div>
                              <button
                                onClick={() => {
                                  if (
                                    scheduleForm.clientId &&
                                    selectedDate &&
                                    selectedTimeSlot &&
                                    endDate
                                  ) {
                                    // Construct the start date string
                                    const dateStr = selectedDate
                                      .toISOString()
                                      .split("T")[0];
                                    const [time, period] =
                                      selectedTimeSlot.split(" ");
                                    const [hour, minute] = time.split(":");
                                    const hour24 =
                                      period === "PM" && hour !== "12"
                                        ? parseInt(hour) + 12
                                        : period === "AM" && hour === "12"
                                        ? 0
                                        : parseInt(hour);

                                    const startDateStr = `${dateStr}T${hour24
                                      .toString()
                                      .padStart(2, "0")}:${minute}:00`;

                                    // Schedule recurring lessons
                                    scheduleRecurringLessonsMutation.mutate({
                                      clientId: scheduleForm.clientId,
                                      startDate: startDateStr,
                                      endDate: new Date(endDate).toISOString(),
                                      recurrencePattern: "weekly",
                                      recurrenceInterval,
                                      sendEmail: true,
                                    });
                                  }
                                }}
                                className="px-4 py-2 hover:opacity-80 text-white rounded-lg transition-colors"
                                style={{
                                  backgroundColor: "#2A2F2F",
                                }}
                              >
                                Schedule {previewDates.length} Lessons
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reject Request Modal */}
          {showRejectModal && selectedRequestToReject && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                className="rounded-2xl shadow-xl border p-6 w-full max-w-md mx-4"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Reject Schedule Request
                  </h2>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedRequestToReject(null);
                      setRejectReason("");
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-300 mb-2">
                    <strong>Client:</strong>{" "}
                    {selectedRequestToReject.client?.name ||
                      selectedRequestToReject.client?.email ||
                      "Client"}
                  </div>
                  <div className="text-sm text-gray-300 mb-2">
                    <strong>Requested Time:</strong>{" "}
                    {format(
                      new Date(selectedRequestToReject.date),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </div>
                  {selectedRequestToReject.description && (
                    <div className="text-sm text-gray-300 mb-4">
                      <strong>Client&apos;s Reason:</strong>{" "}
                      {selectedRequestToReject.description}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Rejection Reason (Optional)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Why are you rejecting this request?"
                      rows={3}
                      className="w-full p-2 rounded-lg border text-white"
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
                      setShowRejectModal(false);
                      setSelectedRequestToReject(null);
                      setRejectReason("");
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
                    onClick={handleConfirmReject}
                    disabled={rejectScheduleRequestMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: "#EF4444",
                      color: "#FFFFFF",
                    }}
                  >
                    {rejectScheduleRequestMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Reject Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Day Management Modal */}
          {showDayManagementModal && selectedDate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                className="rounded-2xl shadow-xl border p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Manage {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Review and manage all schedule requests for this day
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDayManagementModal(false);
                      setSelectedDate(null);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Pending Requests Section */}
                {(() => {
                  const dayPendingRequests = pendingRequests.filter(
                    (request: { date: string }) => {
                      const requestDate = new Date(request.date);
                      const targetDate = selectedDate;
                      return (
                        requestDate.getFullYear() ===
                          targetDate.getFullYear() &&
                        requestDate.getMonth() === targetDate.getMonth() &&
                        requestDate.getDate() === targetDate.getDate()
                      );
                    }
                  );
                  return dayPendingRequests.length > 0 ? (
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="h-5 w-5 text-orange-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Pending Schedule Requests ({dayPendingRequests.length}
                          )
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {dayPendingRequests.map(
                          (request: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 rounded-lg border border-orange-500/20 bg-orange-500/10"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-orange-300">
                                  {format(new Date(request.date), "h:mm a")}
                                </div>
                                <div className="text-sm text-orange-200">
                                  Client:{" "}
                                  {request.client?.name ||
                                    request.client?.email ||
                                    "Client"}
                                </div>
                                {request.description && (
                                  <div className="text-xs text-orange-100 mt-1">
                                    Reason: {request.description}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    approveScheduleRequestMutation.mutate({
                                      eventId: request.id,
                                    })
                                  }
                                  disabled={
                                    approveScheduleRequestMutation.isPending
                                  }
                                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    backgroundColor: "#10B981",
                                    color: "#FFFFFF",
                                  }}
                                >
                                  {approveScheduleRequestMutation.isPending ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 inline mr-1" />
                                      Approving...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3 w-3 inline mr-1" />
                                      Approve
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(request)}
                                  disabled={
                                    rejectScheduleRequestMutation.isPending
                                  }
                                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    backgroundColor: "#EF4444",
                                    color: "#FFFFFF",
                                  }}
                                >
                                  {rejectScheduleRequestMutation.isPending ? (
                                    <>
                                      <XCircle className="h-3 w-3 inline mr-1" />
                                      Rejecting...
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 inline mr-1" />
                                      Reject
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">
                          No Pending Requests
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm">
                        All schedule requests for this day have been processed.
                      </p>
                    </div>
                  );
                })()}

                {/* Confirmed Lessons Section */}
                {(() => {
                  const dayConfirmedLessons = getAllLessonsForDate(
                    selectedDate
                  ).filter(
                    (lesson: { status: string }) =>
                      lesson.status === "CONFIRMED"
                  );
                  return dayConfirmedLessons.length > 0 ? (
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <Calendar className="h-5 w-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Confirmed Lessons ({dayConfirmedLessons.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {dayConfirmedLessons.map(
                          (lesson: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 rounded-lg border border-green-500/20 bg-green-500/10"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-green-300">
                                  {format(new Date(lesson.date), "h:mm a")}
                                </div>
                                <div className="text-sm text-green-200">
                                  {lesson.client?.name ||
                                    lesson.client?.email ||
                                    "Client"}
                                </div>
                                {lesson.title && (
                                  <div className="text-xs text-green-100 mt-1">
                                    {lesson.title}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                <span className="text-xs text-green-300">
                                  {isCoachScheduled(lesson)
                                    ? "Coach Scheduled"
                                    : "Confirmed"}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-white">
                          No Confirmed Lessons
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm">
                        No confirmed lessons scheduled for this day.
                      </p>
                    </div>
                  );
                })()}

                {/* All Lessons Section */}
                {(() => {
                  const dayAllLessons = getAllLessonsForDate(selectedDate);
                  return dayAllLessons.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Users className="h-5 w-5 text-sky-400" />
                        <h3 className="text-lg font-semibold text-white">
                          All Lessons ({dayAllLessons.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {dayAllLessons.map((lesson: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 rounded-lg border border-sky-500/20 bg-sky-500/10"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sky-300">
                                {format(new Date(lesson.date), "h:mm a")}
                              </div>
                              <div className="text-sm text-sky-200">
                                {lesson.client?.name ||
                                  lesson.client?.email ||
                                  "Client"}
                              </div>
                              {lesson.title && (
                                <div className="text-xs text-sky-100 mt-1">
                                  {lesson.title}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-sky-400" />
                              <span className="text-xs text-sky-300">
                                {lesson.status === "CONFIRMED"
                                  ? isCoachScheduled(lesson)
                                    ? "Coach Scheduled"
                                    : "Confirmed"
                                  : lesson.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Users className="h-5 w-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-white">
                          No Lessons
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm">
                        No lessons scheduled for this day.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}

export default withMobileDetection(MobileSchedulePage, SchedulePageClient);
