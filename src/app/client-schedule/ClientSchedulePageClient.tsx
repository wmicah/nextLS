"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
  Loader2,
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
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { formatTimeInUserTimezone } from "@/lib/timezone-utils";
import ClientTopNav from "@/components/ClientTopNav";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileClientSchedulePage from "@/components/MobileClientSchedulePage";
import TimeSwap from "@/components/TimeSwap";
import SwapRequests from "@/components/SwapRequests";

function ClientSchedulePageClient() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDayOverviewModal, setShowDayOverviewModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showSwapRequests, setShowSwapRequests] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSwapLesson, setSelectedSwapLesson] = useState<any>(null);
  const [requestForm, setRequestForm] = useState({
    date: "",
    time: "",
    reason: "",
  });

  // Fetch coach's schedule for the current month
  const { data: coachSchedule = [] } =
    trpc.clientRouter.getCoachScheduleForClient.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  // Fetch client's confirmed lessons
  const { data: clientLessons = [] } =
    trpc.clientRouter.getClientLessons.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  // Fetch client's upcoming lessons across all months
  const { data: upcomingLessons = [] } =
    trpc.clientRouter.getClientUpcomingLessons.useQuery();

  // Fetch existing swap requests to show which lessons already have pending requests
  const { data: existingSwapRequests = [], isLoading: isLoadingSwapRequests } =
    trpc.timeSwap.getSwapRequests.useQuery();

  // Get current client info
  const { data: currentClient } = trpc.user.getProfile.useQuery();

  // Fetch coach's profile for working hours
  const { data: coachProfile } = trpc.clientRouter.getCoachProfile.useQuery();

  const utils = trpc.useUtils();

  // Helper function to check if a lesson already has a pending swap request
  const hasPendingSwapRequest = (lessonId: string) => {
    if (isLoadingSwapRequests || !Array.isArray(existingSwapRequests)) {
      return false;
    }
    return existingSwapRequests.some(
      (request: any) =>
        (request.requesterEventId === lessonId ||
          request.targetEventId === lessonId) &&
        request.status === "PENDING"
    );
  };

  // Helper function to check if there's already a pending request between current client and target lesson's client
  const hasPendingRequestWithTarget = (targetLesson: any) => {
    if (
      isLoadingSwapRequests ||
      !Array.isArray(existingSwapRequests) ||
      !currentClient?.id
    ) {
      return false;
    }

    const currentClientId = currentClient.id;

    return existingSwapRequests.some(
      (request: any) =>
        // Check if there's a pending request where current client is requester and target lesson's client is target
        ((request.requesterId === currentClientId &&
          request.targetId === targetLesson.clientId) ||
          // Or if target lesson's client is requester and current client is target
          (request.requesterId === targetLesson.clientId &&
            request.targetId === currentClientId)) &&
        request.status === "PENDING"
    );
  };
  const requestScheduleChangeMutation =
    trpc.clientRouter.requestScheduleChange.useMutation({
      onSuccess: data => {
        // Force a complete refetch of all data
        utils.clientRouter.getCoachScheduleForClient.refetch();
        utils.clientRouter.getClientLessons.refetch();
        utils.clientRouter.getClientUpcomingLessons.refetch();
        setShowRequestModal(false);
        setRequestForm({ date: "", time: "", reason: "" });
        setSelectedDate(null);
      },
      onError: error => {
        alert(`Error requesting schedule change: ${error.message}`);
      },
    });

  // Swap request mutation
  const createSwapRequestMutation =
    trpc.timeSwap.createSwapRequestFromLesson.useMutation({
      onSuccess: data => {
        alert(data.message);
        // Close modals and refresh data
        setSelectedSwapLesson(null);
        setShowDayOverviewModal(false);
        setSelectedDate(null);
        utils.clientRouter.getCoachScheduleForClient.invalidate();
        utils.clientRouter.getClientLessons.invalidate();
        utils.timeSwap.getSwapRequests.invalidate();
        utils.messaging.getConversations.invalidate();
      },
      onError: error => {
        if (error.message.includes("already exists")) {
          alert(
            "You've already sent a swap request for these lessons. Please wait for a response."
          );
        } else {
          alert(`Error creating swap request: ${error.message}`);
        }
        // Close the lesson selection modal on error
        setSelectedSwapLesson(null);
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

      // Only include lessons that are in the future
      const isFuture = lessonDate > now;

      return isSame && isFuture;
    });

    return lessons;
  };

  // Note: formatTimeInUserTimezone is now imported from @/lib/timezone-utils

  const getClientLessonsForDate = (date: Date) => {
    const lessons = clientLessons.filter((lesson: { date: string }) => {
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
    setRequestForm({
      ...requestForm,
      date: format(date, "yyyy-MM-dd"),
    });
    setShowDayOverviewModal(true);
  };

  const handleRequestScheduleChange = () => {
    if (!requestForm.date || !requestForm.time) {
      alert("Please fill in all required fields");
      return;
    }

    // Capture user's timezone
    const timeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";

    requestScheduleChangeMutation.mutate({
      requestedDate: requestForm.date,
      requestedTime: requestForm.time,
      reason: requestForm.reason,
      timeZone: timeZone,
    });
  };

  // Generate time slots based on coach's working hours and interval
  const generateTimeSlots = () => {
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

    // Check if the selected date is on a working day
    if (requestForm.date) {
      const selectedDate = new Date(requestForm.date);
      const dayName = format(selectedDate, "EEEE");
      if (!workingDays.includes(dayName)) {
        return []; // No available slots on non-working days
      }
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

    // Get current time to filter out past slots
    const now = new Date();
    const isToday =
      requestForm.date && format(now, "yyyy-MM-dd") === requestForm.date;
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

  const generateAvailableTimeSlots = (date: Date) => {
    console.log("=== GENERATING TIME SLOTS ===");
    console.log("Date:", date);
    console.log("Coach profile:", coachProfile);

    const startTime = coachProfile?.workingHours?.startTime || "9:00 AM";
    const endTime = coachProfile?.workingHours?.endTime || "6:00 PM";
    const interval = coachProfile?.workingHours?.timeSlotInterval || 60;
    const slots = [];

    console.log("Start time:", startTime);
    console.log("End time:", endTime);
    console.log("Interval:", interval);

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
    const existingLessons = getLessonsForDate(date);
    const bookedTimes = existingLessons.map((lesson: any) => {
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

    console.log("Generated slots:", slots);
    console.log("Number of slots:", slots.length);
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4 text-blue-400" />;
      case "DECLINED":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "PENDING":
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-500/40 text-blue-100 border-blue-400"; // Blue for confirmed lessons
      case "DECLINED":
        return "bg-red-500/40 text-red-100 border-red-400";
      case "PENDING":
        return "bg-yellow-500/40 text-yellow-100 border-yellow-400";
      default:
        return "bg-blue-500/40 text-blue-100 border-blue-400";
    }
  };

  return (
    <ClientTopNav>
      <div
        className="min-h-screen px-4 sm:px-6 lg:px-8 pt-6"
        style={{ backgroundColor: "#2a3133" }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3 md:gap-4">
              <div
                className="p-2 md:p-3 rounded-lg"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  My Schedule
                </h1>
                <p className="text-sm md:text-base text-gray-400">
                  View your coach&apos;s availability and request schedule
                  changes
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation"
                style={{
                  backgroundColor: "#10B981",
                  color: "#FFFFFF",
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="whitespace-nowrap">Request A Lesson</span>
              </button>
              <button
                onClick={() => setShowSwapRequests(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation"
                style={{
                  backgroundColor: "#F59E0B",
                  color: "#FFFFFF",
                }}
              >
                <Users className="h-4 w-4" />
                <span className="whitespace-nowrap">Swap Requests</span>
              </button>
            </div>
          </div>

          {/* Coach's Working Hours Display */}
          <div
            className="mb-6 p-4 rounded-lg border-2"
            style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">
                Coach&apos;s Working Hours
              </h2>
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

          {/* Today's Lessons Summary */}
          {(() => {
            const today = new Date();
            const now = new Date();
            // const todaysLessons = getLessonsForDate(today)
            const myTodaysLessons = getClientLessonsForDate(today);

            const nextUpcomingLessons = upcomingLessons.slice(0, 5);

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* My Today's Lessons */}
                <div
                  className="p-4 rounded-lg border-2"
                  style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">
                      My Lessons Today
                    </h3>
                  </div>
                  {myTodaysLessons.length > 0 ? (
                    <div className="space-y-2">
                      {/* Show confirmed lessons first */}
                      {myTodaysLessons.map((lesson: any, index: number) => (
                        <div
                          key={`confirmed-${index}`}
                          className={`flex items-center justify-between p-3 rounded border-2 ${getStatusColor(
                            lesson.status
                          )}`}
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {formatTimeInUserTimezone(lesson.date)}
                            </div>
                            <div className="text-sm opacity-80">
                              {lesson.title}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(lesson.status)}
                            <div className="text-xs">{lesson.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">
                      No lessons scheduled for today
                    </p>
                  )}
                </div>

                {/* Coach's Upcoming Lessons */}
                <div
                  className="p-4 rounded-lg border-2"
                  style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-5 w-5 text-sky-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Coach&apos;s Upcoming Lessons
                    </h3>
                  </div>
                  {nextUpcomingLessons.length > 0 ? (
                    <div className="space-y-2">
                      {nextUpcomingLessons.map((lesson: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded bg-sky-500/10 border border-sky-500/20"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sky-300">
                              {format(
                                utcToZonedTime(
                                  lesson.date,
                                  Intl.DateTimeFormat().resolvedOptions()
                                    .timeZone || "America/New_York"
                                ),
                                "MMM d, h:mm a"
                              )}
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
              <span className="text-white font-medium">
                My Confirmed Lessons
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-sky-500 border-2 border-sky-400" />
              <span className="text-white font-medium">
                Coach&apos;s Lessons
              </span>
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
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                <div
                  key={day}
                  className="text-center text-xs md:text-sm font-bold text-blue-300 py-2 md:py-3 border-b-2 border-blue-500/30"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                const coachLessonsForDay = getLessonsForDate(day);
                const myLessonsForDay = getClientLessonsForDate(day);

                // Check if this day is a working day
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

                const hasCoachLessons = coachLessonsForDay.length > 0;
                const hasMyLessons =
                  myLessonsForDay.filter(
                    lesson => lesson.status !== "CONFIRMED"
                  ).length > 0;

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() =>
                      !isPast && isWorkingDay && handleDateClick(day)
                    }
                    className={`
                      p-2 md:p-3 text-xs md:text-sm rounded-lg transition-all duration-200 relative min-h-[120px] md:min-h-[140px] border-2 touch-manipulation overflow-hidden
                      ${
                        isPast || !isWorkingDay
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }
                      ${
                        isToday
                          ? "bg-blue-500/20 text-blue-300 border-blue-400 shadow-lg"
                          : isPast
                          ? "text-gray-500 bg-gray-700/30 border-gray-600"
                          : !isWorkingDay
                          ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
                          : isCurrentMonth
                          ? "text-white bg-gray-800/50 border-gray-600 hover:bg-blue-500/10 hover:border-blue-400"
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

                    {/* My Confirmed Lessons - Only show PENDING and DECLINED lessons */}
                    {hasMyLessons && (
                      <div className="space-y-0.5 md:space-y-1 mb-1 md:mb-2">
                        {myLessonsForDay
                          .filter(lesson => lesson.status !== "CONFIRMED")
                          .slice(0, 2)
                          .map(
                            (
                              lesson: {
                                status: string;
                                date: string;
                                title: string;
                              },
                              index: number
                            ) => (
                              <div
                                key={`my-${index}`}
                                className={`text-xs p-1.5 md:p-2 rounded border-2 ${getStatusColor(
                                  lesson.status
                                )} shadow-md relative group overflow-hidden`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-xs leading-tight">
                                      {formatTimeInUserTimezone(lesson.date)}
                                    </div>
                                    <div className="truncate opacity-80 font-medium text-xs leading-tight">
                                      {lesson.title}
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {getStatusIcon(lesson.status)}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        {myLessonsForDay.filter(
                          lesson => lesson.status !== "CONFIRMED"
                        ).length > 2 && (
                          <div className="text-xs text-emerald-400 text-center py-1">
                            +
                            {myLessonsForDay.filter(
                              lesson => lesson.status !== "CONFIRMED"
                            ).length - 2}{" "}
                            more
                          </div>
                        )}
                      </div>
                    )}

                    {/* Coach's Lessons */}
                    {hasCoachLessons && (
                      <div className="space-y-0.5 md:space-y-1">
                        {coachLessonsForDay
                          .slice(0, 2)
                          .map((lesson: any, index: number) => (
                            <div
                              key={`coach-${index}`}
                              className="w-full text-xs p-1.5 md:p-2 rounded bg-sky-500/40 text-sky-100 border-2 border-sky-400 shadow-md overflow-hidden"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-xs leading-tight">
                                    {formatTimeInUserTimezone(lesson.date)}
                                  </div>
                                  <div className="truncate text-sky-200 font-medium text-xs leading-tight">
                                    {lesson.client?.name ||
                                      lesson.client?.email ||
                                      "Client"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        {coachLessonsForDay.length > 2 && (
                          <div className="text-xs text-sky-400 text-center py-1">
                            +{coachLessonsForDay.length - 2} more
                          </div>
                        )}
                      </div>
                    )}

                    {!hasMyLessons && !hasCoachLessons && (
                      <div className="text-xs text-gray-400 mt-2 font-medium">
                        {isCurrentMonth && !isPast
                          ? isWorkingDay
                            ? "No lessons"
                            : "Not available"
                          : ""}
                      </div>
                    )}

                    {!hasMyLessons &&
                      !hasCoachLessons &&
                      isCurrentMonth &&
                      !isPast &&
                      isWorkingDay && (
                        <div className="text-xs text-blue-400 mt-2 font-medium">
                          Click to request
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request Schedule Change Modal */}
          {showRequestModal && (
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
                    Lesson Request
                  </h2>
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setRequestForm({ date: "", time: "", reason: "" });
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
                      value={requestForm.date}
                      onChange={e =>
                        setRequestForm({
                          ...requestForm,
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
                      value={requestForm.time}
                      onChange={e =>
                        setRequestForm({
                          ...requestForm,
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

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Reason (Optional)
                    </label>
                    <textarea
                      value={requestForm.reason}
                      onChange={e =>
                        setRequestForm({
                          ...requestForm,
                          reason: e.target.value,
                        })
                      }
                      placeholder="Why did you request this lesson?"
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
                      setShowRequestModal(false);
                      setRequestForm({ date: "", time: "", reason: "" });
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
                    onClick={handleRequestScheduleChange}
                    disabled={requestScheduleChangeMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: "#10B981",
                      color: "#FFFFFF",
                    }}
                  >
                    {requestScheduleChangeMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Requesting...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        Request
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
                  </div>
                  <button
                    onClick={() => {
                      setShowDayOverviewModal(false);
                      setSelectedDate(null);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* My Lessons */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      My Lessons
                    </h3>
                  </div>

                  {(() => {
                    const myDayLessons = getClientLessonsForDate(selectedDate);
                    return myDayLessons.length > 0 ? (
                      <div className="space-y-3">
                        {myDayLessons.map((lesson: any, index: number) => {
                          const lessonDate = new Date(lesson.date);
                          // const isPast = lessonDate < new Date()
                          return (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-4 rounded-lg border-2 ${getStatusColor(
                                lesson.status
                              )}`}
                            >
                              <div className="flex-1">
                                <div className="font-medium">
                                  {format(lessonDate, "h:mm a")}
                                </div>
                                <div className="text-sm opacity-80">
                                  {lesson.title}
                                </div>
                                <div className="text-xs opacity-60">
                                  {lesson.description}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(lesson.status)}
                                <div className="text-xs">{lesson.status}</div>
                              </div>
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

                {/* Coach's Lessons */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Coach&apos;s Scheduled Lessons
                    </h3>
                  </div>

                  {(() => {
                    const coachDayLessons = getLessonsForDate(selectedDate);
                    // Filter out the client's own lessons from coach's lessons section
                    const myLessons = getClientLessonsForDate(selectedDate);
                    const myClientIds = myLessons
                      .map(
                        (lesson: { clientId: string | null }) => lesson.clientId
                      )
                      .filter((id): id is string => id !== null);
                    const otherClientLessons = coachDayLessons.filter(
                      (lesson: { clientId: string | null }) =>
                        lesson.clientId !== null &&
                        !myClientIds.includes(lesson.clientId)
                    );
                    return otherClientLessons.length > 0 ? (
                      <div className="space-y-3">
                        {otherClientLessons.map(
                          (lesson: any, index: number) => {
                            const lessonDate = new Date(lesson.date);
                            const isPast = lessonDate < new Date();
                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between p-4 rounded-lg border group bg-sky-500/10 border-sky-500/20"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sky-300">
                                    {format(lessonDate, "h:mm a")}
                                  </div>
                                  <div className="text-sm text-sky-200">
                                    {lesson.client?.name ||
                                      lesson.client?.email ||
                                      "Client"}
                                  </div>
                                  <div
                                    className={`text-xs ${
                                      isPast ? "text-gray-600" : "text-sky-400"
                                    }`}
                                  >
                                    {lesson.title}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!isPast &&
                                    upcomingLessons.length > 0 &&
                                    !hasPendingRequestWithTarget(lesson) && (
                                      <button
                                        onClick={() => {
                                          setSelectedSwapLesson(lesson);
                                        }}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                                      >
                                        <ArrowRightLeft className="h-4 w-4" />
                                        Request Swap
                                      </button>
                                    )}
                                  {!isPast && upcomingLessons.length === 0 && (
                                    <span className="text-xs text-gray-400">
                                      No lessons to swap
                                    </span>
                                  )}
                                  {!isPast &&
                                    upcomingLessons.length > 0 &&
                                    hasPendingRequestWithTarget(lesson) && (
                                      <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
                                        Request Pending
                                      </span>
                                    )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Users className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400">No lessons scheduled</p>
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
                    const availableSlots =
                      generateAvailableTimeSlots(selectedDate);
                    console.log("Available slots:", availableSlots);
                    console.log("Coach profile:", coachProfile);
                    return availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              console.log("Time slot clicked:", slot);
                              console.log("Current requestForm:", requestForm);

                              // Set the time first, then open modal after a brief delay to ensure state update
                              setRequestForm({
                                ...requestForm,
                                time: slot,
                              });

                              setShowDayOverviewModal(false);

                              // Small delay to ensure state update before opening modal
                              setTimeout(() => {
                                console.log("Opening request modal");
                                setShowRequestModal(true);
                              }, 10);
                            }}
                            className="p-3 rounded-lg border text-center transition-all duration-200 hover:bg-sky-500/10 hover:border-sky-500/30"
                            style={{
                              backgroundColor: "#2A2F2F",
                              borderColor: "#606364",
                              color: "#FFFFFF",
                            }}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
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
              </div>
            </div>
          )}

          {/* Time Swap Modal */}
          {showSwapModal && (
            <TimeSwap onClose={() => setShowSwapModal(false)} />
          )}

          {/* Swap Requests Modal */}
          {showSwapRequests && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div
                className="rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: "#2A3133" }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      Time Swap Requests
                    </h2>
                    <button
                      onClick={() => setShowSwapRequests(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <SwapRequests />
                </div>
              </div>
            </div>
          )}

          {/* Lesson Selection Modal for Swap */}
          {selectedSwapLesson && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div
                className="rounded-2xl shadow-xl border p-6 w-full max-w-md mx-4"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Choose Your Lesson to Swap
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Select which of your lessons you want to swap with{" "}
                      {selectedSwapLesson.client?.name ||
                        selectedSwapLesson.client?.email ||
                        "this client"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSwapLesson(null);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">
                          Target Lesson:{" "}
                          {new Date(
                            selectedSwapLesson.date
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(selectedSwapLesson.date).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                        <p className="text-sm text-blue-700">
                          {selectedSwapLesson.title}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-3">
                    Your Available Lessons:
                  </h3>

                  {isLoadingSwapRequests ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-3" />
                      <p className="text-gray-400">Loading lesson status...</p>
                    </div>
                  ) : upcomingLessons.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {upcomingLessons.map((myLesson: any, index: number) => {
                        const hasPendingRequest = hasPendingSwapRequest(
                          myLesson.id
                        );
                        const hasPendingWithTarget =
                          hasPendingRequestWithTarget(selectedSwapLesson);
                        const isDisabled =
                          hasPendingRequest ||
                          hasPendingWithTarget ||
                          createSwapRequestMutation.isPending;

                        return (
                          <button
                            key={index}
                            onClick={() => {
                              if (!isDisabled) {
                                createSwapRequestMutation.mutate({
                                  targetEventId: selectedSwapLesson.id,
                                  requesterEventId: myLesson.id,
                                });
                              }
                            }}
                            disabled={isDisabled}
                            className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                              isDisabled
                                ? "opacity-50 cursor-not-allowed bg-gray-600/20 border-gray-500"
                                : "hover:bg-sky-500/10 hover:border-sky-500/30"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            style={{
                              backgroundColor: isDisabled
                                ? "#1F2937"
                                : "#2A2F2F",
                              borderColor: isDisabled ? "#4B5563" : "#606364",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-white">
                                  {new Date(myLesson.date).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(myLesson.date).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                  {hasPendingRequest && (
                                    <span className="ml-2 text-xs text-yellow-400">
                                      (Swap Request Pending)
                                    </span>
                                  )}
                                  {hasPendingWithTarget &&
                                    !hasPendingRequest && (
                                      <span className="ml-2 text-xs text-yellow-400">
                                        (Request Pending with this client)
                                      </span>
                                    )}
                                </p>
                                <p className="text-sm text-gray-300">
                                  {myLesson.title}
                                </p>
                              </div>
                              {createSwapRequestMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                              ) : isDisabled ? (
                                <CheckCircle className="h-4 w-4 text-yellow-400" />
                              ) : (
                                <ArrowRightLeft className="h-4 w-4 text-blue-400" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400">
                        No lessons available to swap
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedSwapLesson(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    style={{
                      backgroundColor: "#2A2F2F",
                      borderColor: "#606364",
                      color: "#E5E7EB",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientTopNav>
  );
}

export default withMobileDetection(
  MobileClientSchedulePage,
  ClientSchedulePageClient
);
