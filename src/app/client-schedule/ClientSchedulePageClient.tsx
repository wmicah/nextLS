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
import {
  formatTimeInUserTimezone,
  getUserTimezone,
} from "@/lib/timezone-utils";
import ClientTopNav from "@/components/ClientTopNav";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileClientSchedulePage from "@/components/MobileClientSchedulePage";
import TimeSwap from "@/components/TimeSwap";
import SwapRequests from "@/components/SwapRequests";

function ClientSchedulePageClient() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDayOverviewModal, setShowDayOverviewModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showSwapRequests, setShowSwapRequests] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSwitchLesson, setSelectedSwitchLesson] = useState<any>(null);
  const [requestForm, setRequestForm] = useState({
    date: "",
    time: "",
    reason: "",
    coachId: "", // Selected coach ID for organization mode
  });

  // Fetch coach's profile first
  const { data: coachProfile } = trpc.clientRouter.getCoachProfile.useQuery();

  // Fetch organization coaches and their schedules (if in an organization)
  const { data: orgScheduleData } =
    trpc.clientRouter.getOrganizationCoachesSchedules.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  // Debug logging
  console.log("📅 CLIENT SCHEDULE FRONTEND:", {
    hasOrgData: !!orgScheduleData,
    coachCount: orgScheduleData?.coaches.length || 0,
    coaches: orgScheduleData?.coaches.map(c => ({
      id: c.id,
      name: c.name,
      workingDays: c.workingDays,
      workingHoursStart: c.workingHoursStart,
      workingHoursEnd: c.workingHoursEnd,
    })),
    eventCount: orgScheduleData?.events.length || 0,
  });

  // Determine if client is in an organization
  const isInOrganization =
    orgScheduleData && orgScheduleData.coaches.length > 0;

  // Fetch coach's schedule for the current month and adjacent months
  const { data: coachSchedule = [] } =
    trpc.clientRouter.getCoachScheduleForClient.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  // Fetch blocked times for the current month
  const { data: blockedTimes = [] } =
    trpc.blockedTimes.getBlockedTimesForDateRange.useQuery({
      startDate: startOfMonth(currentMonth).toISOString(),
      endDate: endOfMonth(currentMonth).toISOString(),
      coachId: coachProfile?.id || "",
    });

  // Fetch ALL coach's lessons for conflict checking
  const { data: allCoachLessons = [] } =
    trpc.clientRouter.getAllCoachLessons.useQuery({
      startDate: startOfMonth(currentMonth).toISOString(),
      endDate: endOfMonth(currentMonth).toISOString(),
    });

  // Fetch coach's schedule for previous month (for cross-month days)
  const { data: prevMonthSchedule = [] } =
    trpc.clientRouter.getCoachScheduleForClient.useQuery({
      month: currentMonth.getMonth() === 0 ? 11 : currentMonth.getMonth() - 1,
      year:
        currentMonth.getMonth() === 0
          ? currentMonth.getFullYear() - 1
          : currentMonth.getFullYear(),
    });

  // Fetch coach's schedule for next month (for cross-month days)
  const { data: nextMonthSchedule = [] } =
    trpc.clientRouter.getCoachScheduleForClient.useQuery({
      month: currentMonth.getMonth() === 11 ? 0 : currentMonth.getMonth() + 1,
      year:
        currentMonth.getMonth() === 11
          ? currentMonth.getFullYear() + 1
          : currentMonth.getFullYear(),
    });

  // Combine all schedule data
  const allCoachSchedule = [
    ...coachSchedule,
    ...prevMonthSchedule,
    ...nextMonthSchedule,
  ];

  // Use organization schedule if available, otherwise use single coach schedule
  const activeSchedule = isInOrganization
    ? orgScheduleData?.events || []
    : allCoachSchedule;

  // Coach color mapping for organization view
  const getCoachColor = (coachId: string) => {
    if (!isInOrganization) return "bg-sky-500";

    const coaches = orgScheduleData?.coaches || [];
    const coachIndex = coaches.findIndex(c => c.id === coachId);

    // Colors excluding green (reserved for "My Lessons")
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-cyan-500",
    ];

    return colors[coachIndex % colors.length] || "bg-sky-500";
  };

  const getCoachName = (coachId: string) => {
    if (!isInOrganization) return coachProfile?.name;

    const coaches = orgScheduleData?.coaches || [];
    const coach = coaches.find(c => c.id === coachId);
    return coach?.name || "Unknown Coach";
  };

  // Fetch client's confirmed lessons for the current month and adjacent months
  const { data: clientLessons = [] } =
    trpc.clientRouter.getClientLessons.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  // Fetch client's lessons for previous month (for cross-month days)
  const { data: prevMonthClientLessons = [] } =
    trpc.clientRouter.getClientLessons.useQuery({
      month: currentMonth.getMonth() === 0 ? 11 : currentMonth.getMonth() - 1,
      year:
        currentMonth.getMonth() === 0
          ? currentMonth.getFullYear() - 1
          : currentMonth.getFullYear(),
    });

  // Fetch client's lessons for next month (for cross-month days)
  const { data: nextMonthClientLessons = [] } =
    trpc.clientRouter.getClientLessons.useQuery({
      month: currentMonth.getMonth() === 11 ? 0 : currentMonth.getMonth() + 1,
      year:
        currentMonth.getMonth() === 11
          ? currentMonth.getFullYear() + 1
          : currentMonth.getFullYear(),
    });

  // Combine all client lessons data
  const allClientLessons = [
    ...clientLessons,
    ...prevMonthClientLessons,
    ...nextMonthClientLessons,
  ];

  // Fetch client's upcoming lessons across all months
  const { data: upcomingLessons = [] } =
    trpc.clientRouter.getClientUpcomingLessons.useQuery();

  // Fetch existing swap requests to show which lessons already have pending requests
  const { data: existingSwapRequests = [], isLoading: isLoadingSwapRequests } =
    trpc.timeSwap.getSwapRequests.useQuery();

  // Get current client info - we need the Client record, not User record
  const { data: currentClient } = trpc.clientRouter.getCurrentClient.useQuery();

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

  // Helper function to anonymize lesson titles for privacy
  const anonymizeLessonTitle = (title: string, lessonClientId: string) => {
    if (lessonClientId === currentClient?.id) {
      return title; // Show full title for client's own lessons
    }

    // For other clients' lessons, anonymize common patterns
    let anonymizedTitle = title;

    // Replace "Lesson with [clientname]" with "Lesson with client" - handle multi-word names
    anonymizedTitle = anonymizedTitle.replace(
      /Lesson with [a-zA-Z0-9_\s]+?(?=\s*-\s|$)/gi,
      "Lesson with client"
    );

    // Replace "Lesson - [clientname] - [description]" with "Lesson - client - [description]"
    anonymizedTitle = anonymizedTitle.replace(
      /Lesson - [a-zA-Z0-9_\s]+?(?=\s*-\s)/gi,
      "Lesson - client"
    );

    // Replace standalone client names - handle multi-word names
    // This is a more sophisticated approach for complex patterns
    if (anonymizedTitle === title) {
      // Common lesson-related words that should not be replaced
      const lessonWords = [
        "lesson",
        "with",
        "day",
        "program",
        "workout",
        "session",
        "training",
        "practice",
        "drill",
        "exercise",
        "routine",
        "week",
        "month",
        "year",
        "time",
        "date",
        "schedule",
      ];

      // Split into words and process
      const words = anonymizedTitle.split(" ");
      const anonymizedWords = [];

      for (let i = 0; i < words.length; i++) {
        const word = words[i];

        // Skip if it's a common lesson word
        if (lessonWords.includes(word.toLowerCase())) {
          anonymizedWords.push(word);
          continue;
        }

        // Skip if it's a number, time, or date
        if (
          /^\d+$/.test(word) ||
          /^\d+:\d+/.test(word) ||
          /^\d+[ap]m$/i.test(word)
        ) {
          anonymizedWords.push(word);
          continue;
        }

        // Skip if it's a common word like "the", "and", "or", etc.
        if (
          [
            "the",
            "and",
            "or",
            "for",
            "to",
            "of",
            "in",
            "at",
            "by",
            "on",
          ].includes(word.toLowerCase())
        ) {
          anonymizedWords.push(word);
          continue;
        }

        // If it's a potential client name (alphabetic word longer than 2 characters)
        if (word.length > 2 && /^[a-zA-Z]+$/.test(word)) {
          anonymizedWords.push("client");
          continue;
        }

        // Keep everything else as-is
        anonymizedWords.push(word);
      }

      anonymizedTitle = anonymizedWords.join(" ");
    }

    return anonymizedTitle;
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
        setShowDayOverviewModal(false);
        setRequestForm({ date: "", time: "", reason: "", coachId: "" });
        setSelectedDate(null);
        setSelectedTimeSlot("");
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
        setSelectedSwitchLesson(null);
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
        setSelectedSwitchLesson(null);
      },
    });

  // Generate calendar days for the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth =
      direction === "prev"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1);

    setCurrentMonth(newMonth);

    // Invalidate cache to ensure consistent data across month changes
    utils.clientRouter.getCoachScheduleForClient.invalidate();
    utils.clientRouter.getClientLessons.invalidate();
  };

  const getLessonsForDate = (date: Date) => {
    const now = new Date();
    // Use activeSchedule which includes org schedule if available
    const lessons = activeSchedule.filter((lesson: { date: string }) => {
      // Convert UTC lesson date to user's timezone for proper date comparison
      const timeZone = getUserTimezone();
      const lessonDateInUserTz = toZonedTime(lesson.date, timeZone);

      // Compare only the date part, not the time
      const lessonDateOnly = new Date(
        lessonDateInUserTz.getFullYear(),
        lessonDateInUserTz.getMonth(),
        lessonDateInUserTz.getDate()
      );
      const targetDateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const isSame = lessonDateOnly.getTime() === targetDateOnly.getTime();

      // Only include lessons that are in the future
      const isFuture = lessonDateInUserTz > now;

      return isSame && isFuture;
    });

    return lessons;
  };

  // Check if a day has blocked times
  const getBlockedTimesForDate = (date: Date) => {
    return blockedTimes.filter((blockedTime: any) => {
      const startDate = new Date(blockedTime.startTime);
      const endDate = new Date(blockedTime.endTime);

      // Normalize dates to compare only the date part (ignore time)
      const targetDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const blockedStartDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );
      const blockedEndDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );

      // Check if the date falls within the blocked time range
      return targetDate >= blockedStartDate && targetDate <= blockedEndDate;
    });
  };

  // Check if a day is completely blocked (all day blocked)
  const isDayBlocked = (date: Date) => {
    const dayBlockedTimes = getBlockedTimesForDate(date);
    return dayBlockedTimes.some((blockedTime: any) => blockedTime.isAllDay);
  };

  // Note: formatTimeInUserTimezone is now imported from @/lib/timezone-utils

  const getClientLessonsForDate = (date: Date) => {
    const lessons = allClientLessons.filter((lesson: { date: string }) => {
      // Convert UTC lesson date to user's timezone for proper date comparison
      const timeZone = getUserTimezone();
      const lessonDateInUserTz = toZonedTime(lesson.date, timeZone);

      // Compare only the date part, not the time
      const lessonDateOnly = new Date(
        lessonDateInUserTz.getFullYear(),
        lessonDateInUserTz.getMonth(),
        lessonDateInUserTz.getDate()
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
    let defaultCoachId = requestForm.coachId;
    if (isInOrganization && orgScheduleData?.coaches?.length) {
      defaultCoachId = defaultCoachId || orgScheduleData.coaches[0]?.id || "";
    }

    setSelectedDate(date);
    setRequestForm({
      ...requestForm,
      date: format(date, "yyyy-MM-dd"),
      time: "",
      coachId: defaultCoachId || "",
    });
    setSelectedTimeSlot("");
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
      coachId: requestForm.coachId || undefined, // Include selected coach if in organization
    });
  };

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

  const generateAvailableTimeSlots = (date: Date) => {
    let orgCoach:
      | {
          id: string;
          name: string | null;
          email: string;
          workingDays: string[];
          workingHoursStart: string | null;
          workingHoursEnd: string | null;
          timeSlotInterval: number;
        }
      | undefined;

    if (isInOrganization && requestForm.coachId && orgScheduleData) {
      orgCoach = orgScheduleData.coaches.find(
        coach => coach.id === requestForm.coachId
      );
    }

    const startTime =
      orgCoach?.workingHoursStart ||
      coachProfile?.workingHours?.startTime ||
      "9:00 AM";
    const endTime =
      orgCoach?.workingHoursEnd ||
      coachProfile?.workingHours?.endTime ||
      "6:00 PM";
    const interval =
      orgCoach?.timeSlotInterval ||
      coachProfile?.workingHours?.timeSlotInterval ||
      60;
    const slots = [];

    // Get blocked times for this date
    const dayBlockedTimes = getBlockedTimesForDate(date);

    // Get existing lessons for this date
    const existingLessons = (() => {
      if (isInOrganization && orgScheduleData) {
        const targetCoachId = requestForm.coachId || orgCoach?.id;
        return orgScheduleData.events.filter(event => {
          if (targetCoachId && event.coachId !== targetCoachId) {
            return false;
          }

          const eventDate = toZonedTime(event.date, getUserTimezone());
          return (
            eventDate.getFullYear() === date.getFullYear() &&
            eventDate.getMonth() === date.getMonth() &&
            eventDate.getDate() === date.getDate()
          );
        });
      }

      return getLessonsForDate(date);
    })();

    // Convert start and end times to 24-hour format for easier comparison
    const parseTimeString = (timeString: string) => {
      const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) {
        return { hour: 0, minute: 0 };
      }

      let hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      const period = match[3].toUpperCase();

      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      return { hour, minute };
    };

    const { hour: startHour, minute: startMinute } = parseTimeString(startTime);
    const { hour: endHour, minute: endMinute } = parseTimeString(endTime);

    // Calculate the total minutes for the day
    const totalMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);

    // Calculate the number of intervals
    const numIntervals = totalMinutes / interval;

    // Iterate through intervals to find available slots
    for (let i = 0; i < numIntervals; i++) {
      const currentTime = new Date(date);
      const totalMinutesFromStart = startMinute + i * interval;
      const slotHour = startHour + Math.floor(totalMinutesFromStart / 60);
      const slotMinute = totalMinutesFromStart % 60;
      currentTime.setHours(slotHour, slotMinute, 0, 0);

      // Check if the current time is blocked
      const isBlocked = dayBlockedTimes.some(blockedTime => {
        const blockedStartTime = new Date(blockedTime.startTime);
        const blockedEndTime = new Date(blockedTime.endTime);

        // Normalize dates to compare only the date part (ignore time)
        const currentDateOnly = new Date(
          currentTime.getFullYear(),
          currentTime.getMonth(),
          currentTime.getDate()
        );
        const blockedStartDateOnly = new Date(
          blockedStartTime.getFullYear(),
          blockedStartTime.getMonth(),
          blockedStartTime.getDate()
        );
        const blockedEndDateOnly = new Date(
          blockedEndTime.getFullYear(),
          blockedEndTime.getMonth(),
          blockedEndTime.getDate()
        );

        return (
          currentDateOnly >= blockedStartDateOnly &&
          currentDateOnly <= blockedEndDateOnly
        );
      });

      // Check if the current time is already booked
      const isBooked = existingLessons.some(lesson => {
        const lessonTime = toZonedTime(lesson.date, getUserTimezone());
        return (
          lessonTime.getFullYear() === currentTime.getFullYear() &&
          lessonTime.getMonth() === currentTime.getMonth() &&
          lessonTime.getDate() === currentTime.getDate() &&
          lessonTime.getHours() === currentTime.getHours() &&
          lessonTime.getMinutes() === currentTime.getMinutes()
        );
      });

      if (!isBlocked && !isBooked) {
        slots.push(formatTimeInUserTimezone(currentTime.toISOString()));
      }
    }

    return slots;
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
              <div
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium border"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  borderColor: "rgba(16, 185, 129, 0.35)",
                  color: "#4AE3B5",
                }}
              >
                <Calendar className="h-4 w-4" />
                <span className="whitespace-nowrap">
                  Pick a day and time to request
                </span>
              </div>
              <button
                onClick={() => setShowSwapRequests(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation"
                style={{
                  backgroundColor: "#F59E0B",
                  color: "#FFFFFF",
                }}
              >
                <Users className="h-4 w-4" />
                <span className="whitespace-nowrap">Switch Requests</span>
              </button>
            </div>
          </div>

          {/* Coach Working Hours - Show all coaches if in organization */}
          {isInOrganization && orgScheduleData ? (
            <div
              className="mb-6 p-4 rounded-lg border-2"
              style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 text-sky-400" />
                <h2 className="text-lg font-semibold text-white">
                  Organization Coaches&apos; Hours
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orgScheduleData.coaches.map(coach => (
                  <div
                    key={coach.id}
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: "#2A3133",
                      borderColor: "#4A5A70",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getCoachColor(
                          coach.id
                        )}`}
                      />
                      <h4 className="font-semibold text-white">{coach.name}</h4>
                    </div>
                    <p className="text-gray-300 text-sm">
                      {coach.workingHoursStart || "9:00 AM"} -{" "}
                      {coach.workingHoursEnd || "8:00 PM"}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {coach.workingDays && coach.workingDays.length > 0
                        ? coach.workingDays.join(", ")
                        : "Monday - Sunday"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
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
          )}

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
              <span className="text-white font-medium">My Lessons</span>
            </div>
            {!isInOrganization && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-sky-500 border-2 border-sky-400" />
                  <span className="text-white font-medium">Other Clients</span>
                </div>
              </>
            )}
            {isInOrganization && orgScheduleData && (
              <>
                {orgScheduleData.coaches.map((coach, index) => (
                  <div key={coach.id} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded ${getCoachColor(
                        coach.id
                      )} border-2`}
                      style={{ opacity: 0.8 }}
                    />
                    <span className="text-white font-medium">{coach.name}</span>
                  </div>
                ))}
              </>
            )}
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
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
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

                // Check for blocked times
                const dayBlockedTimes = getBlockedTimesForDate(day);
                const isBlocked = isDayBlocked(day);
                const hasBlockedTimes = dayBlockedTimes.length > 0;

                const hasCoachLessons = coachLessonsForDay.length > 0;
                const hasMyPendingLessons =
                  myLessonsForDay.filter(
                    lesson => lesson.status !== "CONFIRMED"
                  ).length > 0;
                const hasMyConfirmedLessons =
                  myLessonsForDay.filter(
                    lesson => lesson.status === "CONFIRMED"
                  ).length > 0;

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() =>
                      !isPast && isWorkingDay && handleDateClick(day)
                    }
                    className={`
                      group p-2 md:p-3 text-xs md:text-sm rounded-lg transition-all duration-200 relative min-h-[120px] md:min-h-[140px] border-2 touch-manipulation overflow-hidden
                      ${
                        isPast || !isWorkingDay
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }
                      ${
                        isBlocked
                          ? "bg-red-500/20 text-red-300 border-red-400 shadow-lg"
                          : isToday
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
                    title={
                      isBlocked
                        ? `Coach unavailable: ${dayBlockedTimes
                            .map(bt => bt.title)
                            .join(", ")}`
                        : !isPast && isCurrentMonth && isWorkingDay
                        ? "Click to request lesson"
                        : !isWorkingDay && isCurrentMonth && !isPast
                        ? "Non-working day"
                        : isPast
                        ? "Past date"
                        : ""
                    }
                  >
                    <div className="font-bold text-sm md:text-lg mb-1 md:mb-2 flex items-center justify-between">
                      <span>{format(day, "d")}</span>
                      <div className="flex items-center gap-1">
                        {/* Coach lessons count badge - Only count OTHER clients' lessons */}
                        {coachLessonsForDay.filter(
                          (lesson: any) => lesson.clientId !== currentClient?.id
                        ).length > 0 && (
                          <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-sky-400">
                              {
                                coachLessonsForDay.filter(
                                  (lesson: any) =>
                                    lesson.clientId !== currentClient?.id
                                ).length
                              }
                            </span>
                          </div>
                        )}
                        {/* My lessons count badge */}
                        {(hasMyPendingLessons || hasMyConfirmedLessons) && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-emerald-400">
                              {myLessonsForDay.length}
                            </span>
                          </div>
                        )}
                        {/* Blocked time indicator */}
                        {hasBlockedTimes && (
                          <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-red-400">
                              🚫
                            </span>
                          </div>
                        )}
                        {/* Non-working day indicator */}
                        {!isWorkingDay &&
                          isCurrentMonth &&
                          !isPast &&
                          !hasCoachLessons &&
                          !hasMyPendingLessons &&
                          !hasMyConfirmedLessons && (
                            <div
                              className="w-2 h-2 bg-orange-500 rounded-full"
                              title="Non-working day"
                            />
                          )}
                      </div>
                    </div>

                    {/* My Lessons - Show ALL lessons with GREEN background (except schedule requests) */}
                    {(hasMyPendingLessons || hasMyConfirmedLessons) && (
                      <div className="space-y-0.5 md:space-y-1 mb-1 md:mb-2">
                        {myLessonsForDay.slice(0, 2).map(
                          (
                            lesson: {
                              status: string;
                              date: string;
                              title: string;
                            },
                            index: number
                          ) => {
                            // Check if this is a schedule request
                            const isScheduleRequest = (lesson as any).title
                              ?.toLowerCase()
                              .includes("schedule request");

                            return (
                              <div
                                key={`my-${index}`}
                                className={`text-xs p-1.5 md:p-2 rounded border-2 shadow-md relative group overflow-hidden ${
                                  isScheduleRequest
                                    ? getStatusColor(lesson.status)
                                    : "bg-green-600/40 text-green-100 border-green-400"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-xs leading-tight">
                                      {formatTimeInUserTimezone(lesson.date)}
                                    </div>
                                    <div className="truncate opacity-80 font-medium text-xs leading-tight">
                                      {anonymizeLessonTitle(
                                        lesson.title,
                                        (lesson as any).clientId
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {getStatusIcon(lesson.status)}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                        {myLessonsForDay.length > 2 && (
                          <div className="text-xs text-green-400 text-center py-1">
                            +{myLessonsForDay.length - 2} more
                          </div>
                        )}
                      </div>
                    )}

                    {/* Coach's Lessons - Only show OTHER clients' lessons */}
                    {hasCoachLessons && (
                      <div className="space-y-0.5 md:space-y-1">
                        {coachLessonsForDay
                          .filter(
                            (lesson: any) =>
                              lesson.clientId !== currentClient?.id
                          )
                          .slice(0, 2)
                          .map((lesson: any, index: number) => {
                            // Get coach-specific color if in organization mode
                            const coachColorClass =
                              isInOrganization && lesson.coachId
                                ? getCoachColor(lesson.coachId)
                                : "bg-sky-500";

                            return (
                              <div
                                key={`coach-${index}`}
                                className={`w-full text-xs p-1.5 md:p-2 rounded border-2 shadow-md overflow-hidden ${coachColorClass}/40 text-white border-current`}
                                style={{ borderColor: "rgba(255,255,255,0.4)" }}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-xs leading-tight">
                                      {formatTimeInUserTimezone(lesson.date)}
                                    </div>
                                    <div className="truncate font-medium text-xs leading-tight flex items-center justify-between gap-1">
                                      <span className="opacity-90">Client</span>
                                      {lesson.coach && isInOrganization && (
                                        <span className="text-[10px] opacity-80 truncate">
                                          {lesson.coach.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        {coachLessonsForDay.filter(
                          (lesson: any) => lesson.clientId !== currentClient?.id
                        ).length > 2 && (
                          <div className="text-xs text-sky-400 text-center py-1">
                            +
                            {coachLessonsForDay.filter(
                              (lesson: any) =>
                                lesson.clientId !== currentClient?.id
                            ).length - 2}{" "}
                            more
                          </div>
                        )}
                      </div>
                    )}

                    {/* Minimalist approach: Only show essential info */}
                    {!hasMyPendingLessons &&
                      !hasMyConfirmedLessons &&
                      !hasCoachLessons &&
                      isCurrentMonth &&
                      !isPast &&
                      isWorkingDay && (
                        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                            <Plus className="h-2.5 w-2.5 text-blue-400" />
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

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
                      setSelectedTimeSlot("");
                      setSelectedSwitchLesson(null);
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
                                  {anonymizeLessonTitle(
                                    lesson.title,
                                    lesson.clientId
                                  )}
                                </div>
                                <div className="text-xs opacity-60">
                                  {lesson.description}
                                </div>
                                {lesson.coach && (
                                  <div className="text-xs opacity-60 mt-1">
                                    Coach: {lesson.coach.name}
                                  </div>
                                )}
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
                                    {lesson.clientId === currentClient?.id
                                      ? lesson.client?.name ||
                                        lesson.client?.email ||
                                        "You"
                                      : "Client"}
                                  </div>
                                  <div
                                    className={`text-xs ${
                                      isPast ? "text-gray-600" : "text-sky-400"
                                    }`}
                                  >
                                    {anonymizeLessonTitle(
                                      lesson.title,
                                      lesson.clientId
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!isPast &&
                                    upcomingLessons.length > 0 &&
                                    !hasPendingRequestWithTarget(lesson) && (
                                      <button
                                        onClick={() => {
                                          setSelectedSwitchLesson(lesson);
                                        }}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                                      >
                                        <ArrowRightLeft className="h-4 w-4" />
                                        Request Switch
                                      </button>
                                    )}
                                  {!isPast && upcomingLessons.length === 0 && (
                                    <span className="text-xs text-gray-400">
                                      No lessons to switch
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

                    if (availableSlots.length === 0) {
                      return (
                        <div className="text-center py-6">
                          <Clock className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-400">
                            No available time slots
                          </p>
                          <p className="text-gray-500 text-sm">
                            All working hours are booked
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((slot, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setSelectedTimeSlot(slot);
                                setRequestForm({
                                  ...requestForm,
                                  time: slot,
                                });
                              }}
                              className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                                selectedTimeSlot === slot
                                  ? "bg-sky-500/20 border-sky-500 text-sky-100"
                                  : "bg-[#2A2F2F] border-[#606364] text-white hover:bg-sky-500/10 hover:border-sky-500/40"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>

                        <div
                          className="p-4 rounded-lg border"
                          style={{
                            backgroundColor: "#2A2F2F",
                            borderColor: "#4A5A70",
                          }}
                        >
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-400">
                                Selected time
                              </p>
                              <p className="text-lg font-semibold text-white">
                                {selectedTimeSlot || "Choose a time above"}
                              </p>
                            </div>

                            {isInOrganization && orgScheduleData ? (
                              <div>
                                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                                  Which coach?
                                </label>
                                <select
                                  value={requestForm.coachId}
                                  onChange={e =>
                                    setRequestForm({
                                      ...requestForm,
                                      coachId: e.target.value,
                                    })
                                  }
                                  className="w-full p-2 rounded-lg border text-white"
                                  style={{
                                    backgroundColor: "#1F2426",
                                    borderColor: "#4A5A70",
                                  }}
                                >
                                  {orgScheduleData.coaches.map(coach => (
                                    <option key={coach.id} value={coach.id}>
                                      {coach.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-300">
                                Coach: {coachProfile?.name || "Your Coach"}
                              </div>
                            )}

                            <div className="flex gap-3 pt-2">
                              <button
                                onClick={() => {
                                  setSelectedTimeSlot("");
                                  setRequestForm({
                                    ...requestForm,
                                    time: "",
                                  });
                                }}
                                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200"
                                style={{
                                  backgroundColor: "transparent",
                                  borderColor: "#606364",
                                  color: "#FFFFFF",
                                }}
                              >
                                Clear
                              </button>
                              <button
                                onClick={handleRequestScheduleChange}
                                disabled={
                                  !selectedTimeSlot ||
                                  requestScheduleChangeMutation.isPending
                                }
                                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{
                                  backgroundColor: "#10B981",
                                  color: "#FFFFFF",
                                }}
                              >
                                {requestScheduleChangeMutation.isPending ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Calendar className="h-4 w-4" />
                                    Confirm Request
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
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
                      Time Switch Requests
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
          {selectedSwitchLesson && (
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
                      Choose Your Lesson to Switch
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Select which of your lessons you want to switch with{" "}
                      {selectedSwitchLesson.clientId === currentClient?.id
                        ? selectedSwitchLesson.client?.name ||
                          selectedSwitchLesson.client?.email ||
                          "you"
                        : "this client"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSwitchLesson(null);
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
                            selectedSwitchLesson.date
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            selectedSwitchLesson.date
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-sm text-blue-700">
                          {selectedSwitchLesson.title}
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
                          hasPendingRequestWithTarget(selectedSwitchLesson);
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
                                  targetEventId: selectedSwitchLesson.id,
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
                                      (Switch Request Pending)
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
                        No lessons available to switch
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedSwitchLesson(null);
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
