"use client";

import { useEffect, useState, useRef } from "react";
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
  differenceInCalendarDays,
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
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [showLessonDetailModal, setShowLessonDetailModal] = useState(false);
  const [showSwapWithClientModal, setShowSwapWithClientModal] = useState(false);
  const [showRequestTimeChangeModal, setShowRequestTimeChangeModal] =
    useState(false);
  const [showDaySwapModal, setShowDaySwapModal] = useState(false);
  const [daySwapDate, setDaySwapDate] = useState<Date | null>(null);
  const selectedSwitchLessonRef = useRef<any>(null);
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


  // Determine if client is in an organization
  const isInOrganization =
    orgScheduleData && orgScheduleData.coaches.length > 0;

  const defaultWorkingDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const getCoachWorkingProfile = (coachId?: string | null) => {
    if (isInOrganization && orgScheduleData?.coaches?.length) {
      const targetCoachId =
        coachId ||
        requestForm.coachId ||
        orgScheduleData.coaches[0]?.id ||
        null;
      const targetCoach = orgScheduleData.coaches.find(
        coach => coach.id === targetCoachId
      );
      if (targetCoach) {
        return {
          startTime:
            targetCoach.workingHoursStart ||
            coachProfile?.workingHours?.startTime ||
            "9:00 AM",
          endTime:
            targetCoach.workingHoursEnd ||
            coachProfile?.workingHours?.endTime ||
            "6:00 PM",
          workingDays:
            targetCoach.workingDays && targetCoach.workingDays.length > 0
              ? targetCoach.workingDays
              : coachProfile?.workingHours?.workingDays || defaultWorkingDays,
          timeSlotInterval:
            targetCoach.timeSlotInterval ||
            coachProfile?.workingHours?.timeSlotInterval ||
            60,
          customWorkingHours: (targetCoach as any)?.customWorkingHours || null,
        };
      }
    }

    return {
      startTime: coachProfile?.workingHours?.startTime || "9:00 AM",
      endTime: coachProfile?.workingHours?.endTime || "6:00 PM",
      workingDays:
        coachProfile?.workingHours?.workingDays || defaultWorkingDays,
      timeSlotInterval: coachProfile?.workingHours?.timeSlotInterval || 60,
      customWorkingHours:
        (coachProfile?.workingHours as any)?.customWorkingHours ||
        (coachProfile as any)?.customWorkingHours ||
        null,
    };
  };

  const getWorkingHoursForDate = (
    date: Date,
    coachId?: string | null
  ): {
    isWorkingDay: boolean;
    startTime: string;
    endTime: string;
    timeSlotInterval: number;
  } => {
    const profile = getCoachWorkingProfile(coachId);
    const dayName = format(date, "EEEE");
    const custom = profile.customWorkingHours;

    if (custom && typeof custom === "object") {
      const dayConfig = (custom as any)[dayName];
      if (dayConfig && typeof dayConfig === "object") {
        const enabled =
          (dayConfig as any).enabled !== undefined
            ? (dayConfig as any).enabled !== false
            : profile.workingDays.includes(dayName);
        const start = (dayConfig as any).startTime || profile.startTime;
        const end = (dayConfig as any).endTime || profile.endTime;
        return {
          isWorkingDay: enabled,
          startTime: start,
          endTime: end,
          timeSlotInterval: profile.timeSlotInterval,
        };
      }
    }

    return {
      isWorkingDay: profile.workingDays.includes(dayName),
      startTime: profile.startTime,
      endTime: profile.endTime,
      timeSlotInterval: profile.timeSlotInterval,
    };
  };

  useEffect(() => {
    if (
      isInOrganization &&
      orgScheduleData?.coaches?.length &&
      !requestForm.coachId
    ) {
      setRequestForm(prev => ({
        ...prev,
        coachId: orgScheduleData.coaches[0]?.id || prev.coachId || "",
      }));
    }
  }, [
    isInOrganization,
    orgScheduleData?.coaches?.length,
    orgScheduleData?.coaches?.[0]?.id,
    requestForm.coachId,
  ]);

  const getScheduleAdvanceLimitForCoach = (coachId?: string | null) => {
    if (isInOrganization && orgScheduleData?.coaches?.length) {
      const targetCoachId =
        coachId ||
        requestForm.coachId ||
        orgScheduleData.coaches[0]?.id ||
        null;
      const targetCoach = orgScheduleData.coaches.find(
        coach => coach.id === targetCoachId
      );
      if (
        targetCoach &&
        targetCoach.scheduleAdvanceLimitDays !== null &&
        targetCoach.scheduleAdvanceLimitDays !== undefined
      ) {
        return targetCoach.scheduleAdvanceLimitDays;
      }
    }
    return coachProfile?.scheduleAdvanceLimitDays ?? null;
  };

  const isDateBeyondAdvanceLimit = (date: Date, coachId?: string | null) => {
    const limitDays = getScheduleAdvanceLimitForCoach(coachId);
    if (!limitDays || limitDays <= 0) {
      return false;
    }

    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const targetDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const diff = differenceInCalendarDays(targetDate, startOfToday);
    return diff > limitDays;
  };

  const defaultCoachId =
    isInOrganization && orgScheduleData?.coaches?.length
      ? orgScheduleData.coaches[0]?.id || ""
      : coachProfile?.id || "";

  const activeCoachId = isInOrganization
    ? requestForm.coachId || defaultCoachId
    : coachProfile?.id || "";

  const activeCoachProfile = getCoachWorkingProfile(activeCoachId);

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
    let selectedCoachId = requestForm.coachId;
    if (isInOrganization && orgScheduleData?.coaches?.length) {
      selectedCoachId = selectedCoachId || orgScheduleData.coaches[0]?.id || "";
    } else {
      selectedCoachId = coachProfile?.id || "";
    }

    if (isDateBeyondAdvanceLimit(date, selectedCoachId)) {
      const limitDays = getScheduleAdvanceLimitForCoach(selectedCoachId);
      if (limitDays && limitDays > 0) {
        alert(
          `You can only request lessons up to ${limitDays} days in advance.`
        );
      } else {
        alert("This date is not available for scheduling.");
      }
      return;
    }

    // Check if user has lessons on this day - if so, show swap modal, otherwise show schedule modal
    const myLessonsOnDay = getClientLessonsForDate(date);
    const hasMyLessons = myLessonsOnDay.some(
      (lesson: any) => lesson.status === "CONFIRMED"
    );

    if (hasMyLessons) {
      // Show swap modal - they can swap one of their lessons
      setDaySwapDate(date);
      setShowDaySwapModal(true);
    } else {
      // Show regular schedule request modal
      setSelectedDate(date);
      setRequestForm({
        ...requestForm,
        date: format(date, "yyyy-MM-dd"),
        time: "",
        coachId: selectedCoachId || "",
      });
      setSelectedTimeSlot("");
      setShowDayOverviewModal(true);
    }
  };

  const handleRequestScheduleChange = () => {
    if (!requestForm.date || !requestForm.time) {
      alert("Please fill in all required fields");
      return;
    }

    const targetCoachId = isInOrganization
      ? requestForm.coachId || defaultCoachId
      : coachProfile?.id || null;

    if (requestForm.date) {
      const requestedDate = new Date(`${requestForm.date}T00:00:00`);
      if (isDateBeyondAdvanceLimit(requestedDate, targetCoachId)) {
        const limitDays = getScheduleAdvanceLimitForCoach(targetCoachId);
        if (limitDays && limitDays > 0) {
          alert(
            `You can only request lessons up to ${limitDays} days in advance.`
          );
        } else {
          alert("This date is not available for scheduling.");
        }
        return;
      }
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
          scheduleAdvanceLimitDays: number | null;
        }
      | undefined;

    if (isInOrganization && requestForm.coachId && orgScheduleData) {
      orgCoach = orgScheduleData.coaches.find(
        coach => coach.id === requestForm.coachId
      );
    }

    const coachIdForLimit = isInOrganization
      ? requestForm.coachId || orgCoach?.id || defaultCoachId
      : coachProfile?.id || null;

    if (isDateBeyondAdvanceLimit(date, coachIdForLimit)) {
      return [];
    }

    const workingHoursForDate = getWorkingHoursForDate(date, coachIdForLimit);

    if (!workingHoursForDate.isWorkingDay) {
      return [];
    }

    const startTime = workingHoursForDate.startTime;
    const endTime = workingHoursForDate.endTime;
    const interval = workingHoursForDate.timeSlotInterval;
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
                {activeCoachProfile.startTime} - {activeCoachProfile.endTime}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Working Days: {activeCoachProfile.workingDays.join(", ")}
              </p>
              {activeCoachProfile.customWorkingHours && (
                <p className="text-xs text-emerald-300 mt-1">
                  Custom daily hours enabled
                </p>
              )}
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

          {(() => {
            const limitDays = getScheduleAdvanceLimitForCoach(activeCoachId);
            if (limitDays && limitDays > 0) {
              return (
                <div
                  className="mt-4 rounded-lg border px-4 py-3 text-sm"
                  style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
                >
                  <span className="text-gray-300">
                    You can request lessons up to{" "}
                    <span className="font-semibold text-white">
                      {limitDays} days
                    </span>{" "}
                    in advance.
                  </span>
                </div>
              );
            }
            return null;
          })()}

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
                const workingHoursForDay = getWorkingHoursForDate(
                  day,
                  activeCoachId
                );
                const isWorkingDay = workingHoursForDay.isWorkingDay;

                // Check for blocked times
                const dayBlockedTimes = getBlockedTimesForDate(day);
                const isBlocked = isDayBlocked(day);
                const hasBlockedTimes = dayBlockedTimes.length > 0;

                const isBeyondLimit = isDateBeyondAdvanceLimit(
                  day,
                  activeCoachId
                );

                const hasCoachLessons = coachLessonsForDay.length > 0;
                const hasMyPendingLessons =
                  myLessonsForDay.filter(
                    lesson => lesson.status !== "CONFIRMED"
                  ).length > 0;
                const hasMyConfirmedLessons =
                  myLessonsForDay.filter(
                    lesson => lesson.status === "CONFIRMED"
                  ).length > 0;
                const limitDaysForDay =
                  getScheduleAdvanceLimitForCoach(activeCoachId);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() =>
                      !isPast &&
                      isWorkingDay &&
                      !isBeyondLimit &&
                      handleDateClick(day)
                    }
                    className={`
                      group p-2 md:p-3 text-xs md:text-sm rounded-lg transition-all duration-200 relative min-h-[120px] md:min-h-[140px] border-2 touch-manipulation overflow-hidden
                      ${
                        isPast || !isWorkingDay || isBeyondLimit
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
                          : isBeyondLimit
                          ? "text-gray-500 bg-gray-700/30 border-gray-600"
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
                        : isBeyondLimit
                        ? limitDaysForDay
                          ? `This date is beyond your coach's scheduling window (${limitDaysForDay} day limit).`
                          : "This date is beyond your coach's scheduling window"
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
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedLesson(lesson);
                                  setShowLessonDetailModal(true);
                                }}
                                className={`text-xs p-1.5 md:p-2 rounded border-2 shadow-md relative group overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${
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
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="relative w-full max-w-2xl bg-[#2A3133] border border-[#404545] rounded-xl shadow-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0">
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#404545] bg-[#404449]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
                        {format(selectedDate, "EEEE, MMMM d, yyyy")}
                      </h2>
                      <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                        Working Hours:{" "}
                        {(() => {
                          const hours = getWorkingHoursForDate(
                            selectedDate,
                            activeCoachId
                          );
                          return hours.isWorkingDay
                            ? `${hours.startTime} - ${hours.endTime}`
                            : "Unavailable";
                        })()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowDayOverviewModal(false);
                        setSelectedDate(null);
                        setSelectedTimeSlot("");
                        setSelectedSwitchLesson(null);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2A3133] transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
                  {/* My Lessons */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      My Lessons
                    </h3>

                    {(() => {
                      const myDayLessons =
                        getClientLessonsForDate(selectedDate);
                      return myDayLessons.length > 0 ? (
                        <div className="space-y-3">
                          {myDayLessons.map((lesson: any, index: number) => {
                            const lessonDate = lesson.date
                              ? new Date(lesson.date)
                              : null;
                            const isValidDate =
                              lessonDate && !isNaN(lessonDate.getTime());
                            return (
                              <div
                                key={index}
                                className="p-4 rounded-lg bg-[#2A3133] border border-[#3A4143]"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="flex-1">
                                      <div className="font-medium text-white">
                                        {isValidDate
                                          ? format(lessonDate, "h:mm a")
                                          : "Invalid date"}
                                      </div>
                                      <div className="text-sm text-gray-300 mt-1">
                                        {anonymizeLessonTitle(
                                          lesson.title,
                                          lesson.clientId
                                        )}
                                      </div>
                                      {lesson.description && (
                                        <div className="text-xs text-gray-400 mt-1">
                                          {lesson.description}
                                        </div>
                                      )}
                                      {lesson.coach && (
                                        <div className="text-xs text-gray-400 mt-1">
                                          Coach: {lesson.coach.name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(lesson.status)}
                                    <span className="text-xs font-medium text-gray-300">
                                      {lesson.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="p-4 rounded-full bg-gray-700/30 w-fit mx-auto mb-4">
                            <Calendar className="h-8 w-8 text-gray-500" />
                          </div>
                          <p className="text-gray-400">
                            No lessons scheduled for this day
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Coach's Lessons */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Coach&apos;s Scheduled Lessons
                    </h3>

                    {(() => {
                      const coachDayLessons = getLessonsForDate(selectedDate);
                      // Filter out the client's own lessons from coach's lessons section
                      const myLessons = getClientLessonsForDate(selectedDate);
                      const myClientIds = myLessons
                        .map(
                          (lesson: { clientId: string | null }) =>
                            lesson.clientId
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
                              const lessonDate = lesson.date
                                ? new Date(lesson.date)
                                : null;
                              const isValidDate =
                                lessonDate && !isNaN(lessonDate.getTime());
                              const isPast =
                                isValidDate && lessonDate < new Date();
                              return (
                                <div
                                  key={index}
                                  className="group p-4 rounded-lg bg-[#2A3133] border border-[#3A4143] hover:border-[#4A5153] transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="flex-1">
                                        <div className="font-medium text-white">
                                          {isValidDate
                                            ? format(lessonDate, "h:mm a")
                                            : "Invalid date"}
                                        </div>
                                        <div className="text-sm text-gray-400 mt-0.5">
                                          Client
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          {anonymizeLessonTitle(
                                            lesson.title,
                                            lesson.clientId
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {!isPast &&
                                        upcomingLessons.length > 0 &&
                                        !hasPendingRequestWithTarget(
                                          lesson
                                        ) && (
                                          <button
                                            onClick={e => {
                                              e.stopPropagation();
                                              e.preventDefault();
                                              // If only one lesson available, swap directly
                                              if (
                                                upcomingLessons.length === 1
                                              ) {
                                                createSwapRequestMutation.mutate(
                                                  {
                                                    targetEventId: lesson.id,
                                                    requesterEventId:
                                                      upcomingLessons[0].id,
                                                  }
                                                );
                                              } else {
                                                // Multiple lessons - show selection modal
                                                selectedSwitchLessonRef.current =
                                                  lesson;
                                                setShowDayOverviewModal(false);
                                                setSelectedDate(null);
                                                setSelectedTimeSlot("");
                                                // Use setTimeout to ensure Day Overview Modal closes first
                                                setTimeout(() => {
                                                  setSelectedSwitchLesson(
                                                    lesson
                                                  );
                                                }, 100);
                                              }
                                            }}
                                            disabled={
                                              createSwapRequestMutation.isPending
                                            }
                                            className="flex items-center gap-2 bg-[#3A4143] text-gray-200 px-4 py-2 rounded-lg hover:bg-[#4A5153] hover:text-white text-sm font-medium transition-colors border border-[#4A5153] disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {createSwapRequestMutation.isPending ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <ArrowRightLeft className="h-4 w-4" />
                                            )}
                                            Request Switch
                                          </button>
                                        )}
                                      {!isPast &&
                                        upcomingLessons.length === 0 && (
                                          <span className="text-xs text-gray-400">
                                            No lessons to switch
                                          </span>
                                        )}
                                      {!isPast &&
                                        upcomingLessons.length > 0 &&
                                        hasPendingRequestWithTarget(lesson) && (
                                          <span className="text-xs text-gray-400 bg-[#2A3133] px-3 py-1.5 rounded-lg border border-[#3A4143]">
                                            Request Pending
                                          </span>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="p-4 rounded-full bg-gray-700/30 w-fit mx-auto mb-4">
                            <Users className="h-8 w-8 text-gray-500" />
                          </div>
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

                      const beyondLimit =
                        selectedDate &&
                        isDateBeyondAdvanceLimit(selectedDate, activeCoachId);

                      if (availableSlots.length === 0) {
                        return (
                          <div className="text-center py-12">
                            <div className="p-4 rounded-full bg-gray-700/30 w-fit mx-auto mb-4">
                              <Clock className="h-8 w-8 text-gray-500" />
                            </div>
                            {beyondLimit ? (
                              <>
                                <p className="text-gray-400">
                                  This date is outside your coach&apos;s
                                  scheduling window.
                                </p>
                                <p className="text-gray-500 text-sm mt-1">
                                  Please choose a date closer to today.
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-gray-400">
                                  No available time slots
                                </p>
                                <p className="text-gray-500 text-sm mt-1">
                                  All working hours are booked
                                </p>
                              </>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {availableSlots.map((slot, index) => {
                              if (!slot || typeof slot !== "string") {
                                return null;
                              }
                              const parts = slot.split(":");
                              if (parts.length !== 2) {
                                return null;
                              }
                              const hours = Number(parts[0]);
                              const minutes = Number(parts[1]);
                              if (
                                isNaN(hours) ||
                                isNaN(minutes) ||
                                hours < 0 ||
                                hours > 23 ||
                                minutes < 0 ||
                                minutes > 59
                              ) {
                                return null;
                              }
                              const date = new Date();
                              date.setHours(hours, minutes, 0, 0);
                              if (isNaN(date.getTime())) {
                                return null;
                              }
                              const timeString = format(date, "h:mm a");
                              return (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setSelectedTimeSlot(slot);
                                    setRequestForm({
                                      ...requestForm,
                                      time: slot,
                                    });
                                  }}
                                  className={`p-3 rounded-lg border text-center transition-colors font-medium ${
                                    selectedTimeSlot === slot
                                      ? "bg-[#3A4143] border-[#4A5153] text-white"
                                      : "bg-[#1F2937] border-[#3A4143] text-gray-300 hover:bg-[#2A3133] hover:border-[#4A5153] hover:text-white"
                                  }`}
                                >
                                  {timeString}
                                </button>
                              );
                            })}
                          </div>

                          <div className="p-5 rounded-lg bg-[#2A3133] border border-[#3A4143]">
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                                  Selected time
                                </p>
                                <p className="text-xl font-semibold text-white">
                                  {selectedTimeSlot
                                    ? (() => {
                                        const [hours, minutes] =
                                          selectedTimeSlot
                                            .split(":")
                                            .map(Number);
                                        const date = new Date();
                                        date.setHours(hours, minutes, 0, 0);
                                        return format(date, "h:mm a");
                                      })()
                                    : "Choose a time above"}
                                </p>
                              </div>

                              {isInOrganization && orgScheduleData ? (
                                <div>
                                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                                    Which coach?
                                  </label>
                                  <select
                                    value={requestForm.coachId}
                                    onChange={e => {
                                      const newCoachId = e.target.value;
                                      if (
                                        selectedDate &&
                                        isDateBeyondAdvanceLimit(
                                          selectedDate,
                                          newCoachId
                                        )
                                      ) {
                                        setSelectedTimeSlot("");
                                        setRequestForm({
                                          ...requestForm,
                                          coachId: newCoachId,
                                          time: "",
                                        });
                                        const limitDays =
                                          getScheduleAdvanceLimitForCoach(
                                            newCoachId
                                          );
                                        if (limitDays && limitDays > 0) {
                                          alert(
                                            `This coach only accepts requests up to ${limitDays} days in advance. Please choose an earlier date.`
                                          );
                                        } else {
                                          alert(
                                            "This coach does not accept requests this far in advance."
                                          );
                                        }
                                      } else {
                                        setRequestForm({
                                          ...requestForm,
                                          coachId: newCoachId,
                                        });
                                      }
                                    }}
                                    className="w-full px-4 py-3 rounded-xl bg-[#1F2937] border border-[#404545] text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50 transition-all"
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
                                  className="flex-1 px-4 py-3 rounded-xl bg-[#2A3133] border border-[#404545] text-gray-300 font-medium hover:bg-[#353A3A] hover:border-[#505555] transition-all"
                                >
                                  Clear
                                </button>
                                <button
                                  onClick={handleRequestScheduleChange}
                                  disabled={
                                    !selectedTimeSlot ||
                                    requestScheduleChangeMutation.isPending
                                  }
                                  className="flex-1 px-4 py-3 rounded-lg bg-[#3A4143] text-white font-medium hover:bg-[#4A5153] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 border border-[#4A5153]"
                                >
                                  {requestScheduleChangeMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Calendar className="h-5 w-5" />
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
            </div>
          )}

          {/* Lesson Detail Modal */}
          {showLessonDetailModal && selectedLesson && (
            <LessonDetailModal
              lesson={selectedLesson}
              onClose={() => {
                setShowLessonDetailModal(false);
                setSelectedLesson(null);
              }}
              onSwapWithClient={() => {
                setShowLessonDetailModal(false);
                setShowSwapWithClientModal(true);
              }}
              onRequestTimeChange={() => {
                setShowLessonDetailModal(false);
                setShowRequestTimeChangeModal(true);
              }}
            />
          )}

          {/* Swap With Client Modal */}
          {showSwapWithClientModal && selectedLesson && (
            <SwapWithClientModal
              requesterLesson={selectedLesson}
              onClose={() => {
                setShowSwapWithClientModal(false);
                setSelectedLesson(null);
              }}
            />
          )}

          {/* Request Time Change Modal */}
          {showRequestTimeChangeModal && selectedLesson && (
            <RequestTimeChangeModal
              lesson={selectedLesson}
              onClose={() => {
                setShowRequestTimeChangeModal(false);
                setSelectedLesson(null);
              }}
            />
          )}

          {/* Day Swap Modal - Simple flow: click day, see times, request swap */}
          {showDaySwapModal && daySwapDate && (
            <DaySwapModal
              date={daySwapDate}
              onClose={() => {
                setShowDaySwapModal(false);
                setDaySwapDate(null);
              }}
            />
          )}

          {/* Time Swap Modal (old - can be removed later) */}
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
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4"
              onClick={e => {
                if (e.target === e.currentTarget) {
                  setSelectedSwitchLesson(null);
                }
              }}
            >
              <div
                className="w-full max-w-md bg-[#2A3133] border border-[#404545] rounded-xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#404545] bg-[#404449]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <h2 className="text-lg sm:text-xl font-semibold text-white">
                        Choose Your Lesson to Switch
                      </h2>
                      <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
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
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2A3133] transition-colors flex-shrink-0"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <div className="mb-4 sm:mb-6">
                    <div className="bg-[#1F2937] border border-[#3A4143] rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-white">
                            Target Lesson:{" "}
                            {format(
                              new Date(selectedSwitchLesson.date),
                              "M/d/yyyy"
                            )}{" "}
                            at{" "}
                            {format(
                              new Date(selectedSwitchLesson.date),
                              "h:mm a"
                            )}
                          </p>
                          <p className="text-sm text-gray-400 mt-0.5">
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
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-400">
                          Loading lesson status...
                        </p>
                      </div>
                    ) : upcomingLessons.length > 0 ? (
                      <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
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
                              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed bg-[#1F2937] border-[#3A4143]"
                                  : "bg-[#2A3133] border-[#3A4143] hover:bg-[#3A4143] hover:border-[#4A5153]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-white">
                                    {format(
                                      new Date(myLesson.date),
                                      "M/d/yyyy"
                                    )}{" "}
                                    at{" "}
                                    {format(new Date(myLesson.date), "h:mm a")}
                                    {hasPendingRequest && (
                                      <span className="ml-2 text-xs text-gray-400">
                                        (Switch Request Pending)
                                      </span>
                                    )}
                                    {hasPendingWithTarget &&
                                      !hasPendingRequest && (
                                        <span className="ml-2 text-xs text-gray-400">
                                          (Request Pending with this client)
                                        </span>
                                      )}
                                  </p>
                                  <p className="text-sm text-gray-400 mt-0.5">
                                    {myLesson.title}
                                  </p>
                                </div>
                                {createSwapRequestMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                ) : isDisabled ? (
                                  <CheckCircle className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ArrowRightLeft className="h-4 w-4 text-gray-400" />
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

                  <div className="flex gap-3 pt-4 border-t border-[#404545] px-4 sm:px-6 pb-4 sm:pb-6 bg-[#2A3133]">
                    <button
                      onClick={() => {
                        setSelectedSwitchLesson(null);
                      }}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-[#1F2937] border border-[#404545] text-gray-300 font-medium hover:bg-[#2A3133] hover:border-[#505555] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientTopNav>
  );
}

// Lesson Detail Modal Component
function LessonDetailModal({
  lesson,
  onClose,
  onSwapWithClient,
  onRequestTimeChange,
}: {
  lesson: any;
  onClose: () => void;
  onSwapWithClient: () => void;
  onRequestTimeChange: () => void;
}) {
  const lessonDate = lesson.date ? new Date(lesson.date) : new Date();
  const isValidDate = lessonDate && !isNaN(lessonDate.getTime());
  const statusColors: Record<string, string> = {
    CONFIRMED: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    PENDING: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    CANCELLED: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className="relative w-full max-w-md bg-gradient-to-br from-[#1F2937] via-[#2A3133] to-[#1F2937] border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-500/20 via-yellow-600/15 to-yellow-500/20 border-b border-yellow-500/30 px-4 sm:px-6 py-3 sm:py-5 rounded-t-xl sm:rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 rounded-t-xl sm:rounded-t-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg ring-2 ring-yellow-400/20">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Lesson Details
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[#1F2937] border border-[#404545]">
            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Title
            </p>
            <p className="text-white font-semibold text-base sm:text-lg">
              {lesson.title}
            </p>
          </div>

          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[#1F2937] border border-[#404545]">
            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Date & Time
            </p>
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-yellow-500/10 flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base">
                  {isValidDate
                    ? format(lessonDate, "EEEE, MMMM d, yyyy")
                    : "Invalid date"}
                </p>
                <p className="text-xs sm:text-sm text-gray-400">
                  {isValidDate ? format(lessonDate, "h:mm a") : "Invalid time"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[#1F2937] border border-[#404545]">
            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Status
            </p>
            <span
              className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold border ${
                statusColors[lesson.status] || "bg-gray-500/20 text-gray-300"
              }`}
            >
              {lesson.status}
            </span>
          </div>

          {lesson.description && (
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[#1F2937] border border-[#404545]">
              <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                Description
              </p>
              <p className="text-white text-xs sm:text-sm leading-relaxed">
                {lesson.description}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2 sm:space-y-3 border-t border-yellow-500/30 bg-[#1F2937]">
          <button
            onClick={onSwapWithClient}
            className="w-full px-4 py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30"
          >
            <ArrowRightLeft className="h-5 w-5" />
            Swap with Another Client
          </button>

          <button
            onClick={onRequestTimeChange}
            className="w-full px-4 py-3.5 rounded-xl bg-[#2A3133] border border-[#404545] text-white font-semibold hover:bg-[#353A3A] hover:border-yellow-500/40 transition-all flex items-center justify-center gap-2"
          >
            <Clock className="h-5 w-5" />
            Request Different Time
          </button>
        </div>
      </div>
    </div>
  );
}

// Swap With Client Modal Component
function SwapWithClientModal({
  requesterLesson,
  onClose,
}: {
  requesterLesson: any;
  onClose: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [viewMonth, setViewMonth] = useState(new Date());

  // Get coach profile
  const { data: coachProfile } = trpc.clientRouter.getCoachProfile.useQuery();

  // Get current client ID
  const { data: currentClient } = trpc.clientRouter.getCurrentClient.useQuery();

  // Get coachId from lesson object, coach profile, or current client's coach
  const coachId = requesterLesson.coachId || coachProfile?.id;

  // Helper to get coach working profile (similar to main component)
  const getCoachWorkingProfile = (targetCoachId?: string | null) => {
    if (!coachProfile) {
      return {
        startTime: "09:00",
        endTime: "17:00",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        timeSlotInterval: 60,
        customWorkingHours: null,
      };
    }

    // The API returns times like "9:00 AM" or "09:00", we need to normalize
    const normalizeTime = (time: string | undefined, defaultTime: string) => {
      if (!time) return defaultTime;
      // If it's already in HH:MM format, return as is
      if (/^\d{1,2}:\d{2}$/.test(time)) return time;
      // If it's in "9:00 AM" format, convert to 24-hour
      const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = match[3].toUpperCase();
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, "0")}:${minutes}`;
      }
      return defaultTime;
    };

    return {
      startTime: normalizeTime(coachProfile.workingHours?.startTime, "09:00"),
      endTime: normalizeTime(coachProfile.workingHours?.endTime, "17:00"),
      workingDays: coachProfile.workingHours?.workingDays || [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ],
      timeSlotInterval: coachProfile.workingHours?.timeSlotInterval || 60,
      customWorkingHours:
        (coachProfile.workingHours as any)?.customWorkingHours || null,
    };
  };

  // Get working hours for a specific date
  const getWorkingHoursForDate = (
    date: Date,
    targetCoachId?: string | null
  ): {
    isWorkingDay: boolean;
    startTime: string;
    endTime: string;
    timeSlotInterval: number;
  } => {
    const profile = getCoachWorkingProfile(targetCoachId);
    const dayName = format(date, "EEEE");
    const custom = profile.customWorkingHours;

    if (custom && typeof custom === "object") {
      const dayConfig = (custom as any)[dayName];
      if (dayConfig && typeof dayConfig === "object") {
        const enabled =
          (dayConfig as any).enabled !== undefined
            ? (dayConfig as any).enabled !== false
            : profile.workingDays.includes(dayName);
        const start = (dayConfig as any).startTime || profile.startTime;
        const end = (dayConfig as any).endTime || profile.endTime;
        return {
          isWorkingDay: enabled,
          startTime: start,
          endTime: end,
          timeSlotInterval: profile.timeSlotInterval,
        };
      }
    }

    return {
      isWorkingDay: profile.workingDays.includes(dayName),
      startTime: profile.startTime,
      endTime: profile.endTime,
      timeSlotInterval: profile.timeSlotInterval,
    };
  };

  // Check if date is beyond advance limit
  const getScheduleAdvanceLimitForCoach = (targetCoachId?: string | null) => {
    if (!coachProfile) return null;
    return (coachProfile as any).scheduleAdvanceLimitDays || null;
  };

  const isDateBeyondAdvanceLimit = (
    date: Date,
    targetCoachId?: string | null
  ) => {
    const limitDays = getScheduleAdvanceLimitForCoach(targetCoachId);
    if (!limitDays || limitDays <= 0) return false;

    const now = new Date();
    const daysDiff = differenceInCalendarDays(date, now);
    return daysDiff > limitDays;
  };

  // Get coach schedule for the selected month to show available time slots
  const { data: coachScheduleData } =
    trpc.clientRouter.getCoachScheduleForClient.useQuery({
      month: viewMonth.getMonth(),
      year: viewMonth.getFullYear(),
    });

  // Extract events from coach schedule (handle both array and object formats)
  const coachSchedule = Array.isArray(coachScheduleData)
    ? coachScheduleData
    : (coachScheduleData as any)?.events || [];

  // Check if a date has available lessons to swap with
  const getLessonsForDate = (date: Date) => {
    const currentClientId = currentClient?.id;

    // Check if date is a working day and within advance limit
    const workingHours = getWorkingHoursForDate(date, coachId);
    if (!workingHours.isWorkingDay) return [];
    if (isDateBeyondAdvanceLimit(date, coachId)) return [];

    const filtered = coachSchedule.filter((lesson: any) => {
      // Only show CONFIRMED lessons from other clients
      if (lesson.status !== "CONFIRMED") return false;

      // Must be with the same coach (or in same organization)
      const lessonCoachId = lesson.coachId;
      if (lessonCoachId && coachId && lessonCoachId !== coachId) return false;

      // Exclude own lessons - check both requesterLesson and currentClient
      const lessonClientId = lesson.clientId;
      if (
        lessonClientId &&
        requesterLesson.clientId &&
        lessonClientId === requesterLesson.clientId
      )
        return false;
      if (
        currentClientId &&
        lessonClientId &&
        lessonClientId === currentClientId
      )
        return false;

      // Exclude the specific requester lesson by ID
      if (lesson.id === requesterLesson.id) return false;

      // Date comparison with timezone handling
      if (!lesson.date) return false;
      const lessonDate = new Date(lesson.date);
      const timeZone = getUserTimezone();
      const lessonDateInUserTz = toZonedTime(lessonDate, timeZone);
      const targetDateInUserTz = toZonedTime(date, timeZone);

      if (!isSameDay(lessonDateInUserTz, targetDateInUserTz)) return false;

      // Check if lesson time is within working hours
      const lessonHours = lessonDateInUserTz.getHours();
      const lessonMinutes = lessonDateInUserTz.getMinutes();
      const [startHour, startMin] = workingHours.startTime
        .split(":")
        .map(Number);
      const [endHour, endMin] = workingHours.endTime.split(":").map(Number);
      const lessonTimeMinutes = lessonHours * 60 + lessonMinutes;
      const startTimeMinutes = startHour * 60 + startMin;
      const endTimeMinutes = endHour * 60 + endMin;

      if (
        lessonTimeMinutes < startTimeMinutes ||
        lessonTimeMinutes >= endTimeMinutes
      ) {
        return false;
      }

      return true;
    });


    return filtered;
  };

  // Filter lessons for selected date and time from coach schedule
  const lessonsOnSelectedDate = selectedDate
    ? getLessonsForDate(selectedDate).filter((lesson: any) => {
        // Exclude the requester's own lesson
        if (lesson.id === requesterLesson.id) return false;
        // If time is selected, filter by time (accounting for timezone)
        if (selectedTime) {
          const lessonDate = new Date(lesson.date);
          const timeZone = getUserTimezone();
          const lessonDateInUserTz = toZonedTime(lessonDate, timeZone);
          const [hours, minutes] = selectedTime.split(":").map(Number);
          return (
            lessonDateInUserTz.getHours() === hours &&
            lessonDateInUserTz.getMinutes() === minutes
          );
        }
        return true;
      })
    : [];

  // Create swap request mutation
  const createSwapRequestMutation =
    trpc.timeSwap.createSwapRequestFromLesson.useMutation({
      onSuccess: () => {
        onClose();
        window.location.reload();
      },
      onError: error => {
        alert(`Error: ${error.message}`);
      },
    });

  const handleSwap = () => {
    if (!selectedDate || !selectedTime || lessonsOnSelectedDate.length === 0) {
      alert(
        "Please select a date and time with an available lesson to swap with"
      );
      return;
    }

    // Find the lesson at the selected time (using timezone-aware comparison)
    const targetLesson = lessonsOnSelectedDate.find((lesson: any) => {
      const lessonDate = new Date(lesson.date);
      const timeZone = getUserTimezone();
      const lessonDateInUserTz = toZonedTime(lessonDate, timeZone);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      return (
        lessonDateInUserTz.getHours() === hours &&
        lessonDateInUserTz.getMinutes() === minutes
      );
    });

    if (!targetLesson) {
      alert(
        "No lesson found at the selected time. Please choose a different time."
      );
      return;
    }

    createSwapRequestMutation.mutate({
      requesterEventId: requesterLesson.id,
      targetEventId: targetLesson.id,
    });
  };

  // Generate calendar days
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Generate available time slots for selected date (respecting working hours)
  const generateAvailableTimeSlots = (date: Date) => {
    if (!date) return [];

    const workingHours = getWorkingHoursForDate(date, coachId);

    if (!workingHours.isWorkingDay) {
      return [];
    }

    const [startHour, startMin] = workingHours.startTime.split(":").map(Number);
    const [endHour, endMin] = workingHours.endTime.split(":").map(Number);
    const timeSlotInterval = workingHours.timeSlotInterval || 30;

    const slots: string[] = [];
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    for (
      let minutes = startMinutes;
      minutes < endMinutes;
      minutes += timeSlotInterval
    ) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeString);
    }

    return slots;
  };

  const availableTimeSlots = selectedDate
    ? generateAvailableTimeSlots(selectedDate)
    : [];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className="relative w-full max-w-2xl bg-[#2B3038] border border-[#606364] rounded-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <ArrowRightLeft className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Switch Lessons with Another Client
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Your Lesson */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-3">Your Lesson:</p>
          <div className="p-4 rounded-xl bg-[#353A3A] border border-[#606364]">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-400" />
              <div className="flex-1">
                <p className="text-white font-medium">
                  {requesterLesson.title}
                </p>
                <p className="text-sm text-gray-400">
                  {format(new Date(requesterLesson.date), "EEEE, MMMM d, yyyy")}{" "}
                  at {format(new Date(requesterLesson.date), "h:mm a")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div>
          <p className="text-sm text-gray-400 mb-3">
            Select a day and time to switch lessons with another client:
          </p>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="p-2 rounded-lg hover:bg-[#353A3A] transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </button>
            <h4 className="text-white font-semibold">
              {format(viewMonth, "MMMM yyyy")}
            </h4>
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="p-2 rounded-lg hover:bg-[#353A3A] transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
            {calendarDays.map(day => {
              const isCurrentMonth = isSameMonth(day, viewMonth);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isPast = day < new Date() && !isToday;
              const workingHours = getWorkingHoursForDate(day, coachId);
              const isWorkingDay = workingHours.isWorkingDay;
              const isBeyondLimit = isDateBeyondAdvanceLimit(day, coachId);
              const dayLessons = getLessonsForDate(day);
              const hasAvailableLesson = dayLessons.length > 0;
              const isSelectable =
                !isPast && isCurrentMonth && isWorkingDay && !isBeyondLimit;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    if (isSelectable) {
                      setSelectedDate(day);
                      setSelectedTime(""); // Reset time when date changes
                    }
                  }}
                  disabled={!isSelectable}
                  className={`
                    aspect-square p-1 rounded-lg text-xs transition-all
                    ${!isCurrentMonth ? "opacity-30" : ""}
                    ${
                      isPast
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                    ${
                      isSelected
                        ? "bg-green-500/30 border-2 border-green-500"
                        : hasAvailableLesson && isSelectable
                        ? "bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30"
                        : isSelectable
                        ? "bg-[#353A3A] border border-[#606364] hover:bg-[#404545]"
                        : "bg-[#2A2F2F] border border-[#404545]"
                    }
                    ${isToday ? "ring-2 ring-blue-400" : ""}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span
                      className={`font-medium ${
                        isSelected ? "text-white" : "text-gray-300"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {hasAvailableLesson && !isPast && (
                      <div className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Select Time
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {availableTimeSlots.map(slot => {
                  const [hours, minutes] = slot.split(":").map(Number);
                  const timeString = format(
                    new Date().setHours(hours, minutes),
                    "h:mm a"
                  );
                  // Check if there's a lesson at this time slot
                  const lessonsForDay = getLessonsForDate(selectedDate);
                  const hasLessonAtTime = lessonsForDay.some((lesson: any) => {
                    const lessonDate = new Date(lesson.date);
                    const timeZone = getUserTimezone();
                    const lessonDateInUserTz = toZonedTime(
                      lessonDate,
                      timeZone
                    );
                    // Allow a small tolerance (within 5 minutes) for time matching
                    const lessonMinutes =
                      lessonDateInUserTz.getHours() * 60 +
                      lessonDateInUserTz.getMinutes();
                    const slotMinutes = hours * 60 + minutes;
                    return Math.abs(lessonMinutes - slotMinutes) <= 5;
                  });
                  const isSelected = selectedTime === slot;

                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      disabled={!hasLessonAtTime}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${
                          isSelected
                            ? "bg-green-500 text-white border-2 border-green-400"
                            : hasLessonAtTime
                            ? "bg-[#353A3A] text-white border border-[#606364] hover:bg-green-500/20 hover:border-green-500/50"
                            : "bg-[#2A2F2F] text-gray-500 border border-[#404545] cursor-not-allowed opacity-50"
                        }
                      `}
                    >
                      {timeString}
                    </button>
                  );
                })}
              </div>
              {selectedTime && (
                <p className="text-xs text-green-400 mt-2">
                  ✓ Lesson available at this time
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-[#353A3A] text-[#C3BCC2] font-medium hover:bg-[#404545] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSwap}
            disabled={
              !selectedDate ||
              !selectedTime ||
              lessonsOnSelectedDate.length === 0 ||
              createSwapRequestMutation.isPending
            }
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {createSwapRequestMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending Request...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-5 w-5" />
                Request Swap
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Request Time Change Modal Component
function RequestTimeChangeModal({
  lesson,
  onClose,
}: {
  lesson: any;
  onClose: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  // Get coach profile
  const { data: coachProfile } = trpc.clientRouter.getCoachProfile.useQuery();

  // Get coach schedule for available time slots
  const { data: coachSchedule = [] } =
    trpc.clientRouter.getCoachScheduleForClient.useQuery({
      month: selectedDate ? selectedDate.getMonth() : new Date().getMonth(),
      year: selectedDate
        ? selectedDate.getFullYear()
        : new Date().getFullYear(),
    });

  // Request schedule change mutation
  const requestScheduleChangeMutation =
    trpc.clientRouter.requestScheduleChange.useMutation({
      onSuccess: () => {
        onClose();
        window.location.reload();
      },
      onError: error => {
        alert(`Error: ${error.message}`);
      },
    });

  const handleRequest = () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select a date and time");
      return;
    }

    requestScheduleChangeMutation.mutate({
      requestedDate: format(selectedDate, "yyyy-MM-dd"),
      requestedTime: selectedTime,
      reason: reason || "Client requested time change for existing lesson",
    });
  };

  // Generate available time slots for selected date
  const generateAvailableTimeSlots = (date: Date) => {
    if (!coachProfile?.workingHours) return [];

    const workingHours = coachProfile.workingHours.startTime
      ? coachProfile.workingHours.startTime.split(":")
      : ["9", "00"];
    const workingHoursEnd = coachProfile.workingHours.endTime
      ? coachProfile.workingHours.endTime.split(":")
      : ["17", "00"];

    const startHour = parseInt(workingHours[0] || "9");
    const endHour = parseInt(workingHoursEnd[0] || "17");
    const slots: string[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeString);
      }
    }

    return slots;
  };

  const availableTimeSlots = selectedDate
    ? generateAvailableTimeSlots(selectedDate)
    : [];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className="relative w-full max-w-md bg-gradient-to-br from-[#1F2937] via-[#2A3133] to-[#1F2937] border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-500/20 via-yellow-600/15 to-yellow-500/20 border-b border-yellow-500/30 px-4 sm:px-6 py-3 sm:py-5 rounded-t-xl sm:rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 rounded-t-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg ring-2 ring-yellow-400/20">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Request Time Change
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Current Lesson */}
          <div className="p-4 rounded-xl bg-[#1F2937] border border-[#404545]">
            <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">
              Current Lesson
            </p>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{lesson.title}</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {format(new Date(lesson.date), "EEEE, MMMM d, yyyy")} at{" "}
                  {format(new Date(lesson.date), "h:mm a")}
                </p>
              </div>
            </div>
          </div>

          {/* New Date Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Select New Date
            </label>
            <input
              type="date"
              value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
              onChange={e => {
                if (e.target.value) {
                  setSelectedDate(new Date(e.target.value));
                  setSelectedTime("");
                }
              }}
              min={format(new Date(), "yyyy-MM-dd")}
              className="w-full px-4 py-3 rounded-xl bg-[#1F2937] border border-[#404545] text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50 transition-all"
            />
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                Select Time
              </label>
              <select
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1F2937] border border-[#404545] text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50 transition-all"
              >
                <option value="">Select a time</option>
                {availableTimeSlots.map(slot => {
                  const [hours, minutes] = slot.split(":").map(Number);
                  const timeString = format(
                    new Date().setHours(hours, minutes),
                    "h:mm a"
                  );
                  return (
                    <option key={slot} value={slot}>
                      {timeString}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Reason (Optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Let your coach know why you need a different time..."
              className="w-full px-4 py-3 rounded-xl bg-[#1F2937] border border-[#404545] text-white min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50 transition-all placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex gap-2 sm:gap-3 border-t border-yellow-500/30 bg-[#1F2937]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-[#2A3133] border border-[#404545] text-gray-300 font-medium hover:bg-[#353A3A] hover:border-[#505555] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleRequest}
            disabled={
              !selectedDate ||
              !selectedTime ||
              requestScheduleChangeMutation.isPending
            }
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30"
          >
            {requestScheduleChangeMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Clock className="h-5 w-5" />
                Request Change
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Day Swap Modal - Simple one-click swap flow
function DaySwapModal({ date, onClose }: { date: Date; onClose: () => void }) {
  // Get current client
  const { data: currentClient } = trpc.clientRouter.getCurrentClient.useQuery();

  // Get coach profile
  const { data: coachProfile } = trpc.clientRouter.getCoachProfile.useQuery();
  const coachId = coachProfile?.id;

  // Get all client lessons (already fetched in parent)
  const { data: allClientLessonsData } =
    trpc.clientRouter.getClientUpcomingLessons.useQuery();

  // Filter lessons for this specific day
  const myLessonsOnDay = (allClientLessonsData || []).filter((lesson: any) => {
    if (lesson.status !== "CONFIRMED") return false;
    const lessonDate = new Date(lesson.date);
    const timeZone = getUserTimezone();
    const lessonDateInUserTz = toZonedTime(lessonDate, timeZone);
    const targetDateInUserTz = toZonedTime(date, timeZone);
    return isSameDay(lessonDateInUserTz, targetDateInUserTz);
  });

  // Get coach schedule for this day to find available swap times
  const { data: coachScheduleData } =
    trpc.clientRouter.getCoachScheduleForClient.useQuery({
      month: date.getMonth(),
      year: date.getFullYear(),
    });

  const coachSchedule = Array.isArray(coachScheduleData)
    ? coachScheduleData
    : (coachScheduleData as any)?.events || [];

  // Get available lessons from other clients on this day
  const availableSwapLessons = coachSchedule.filter((lesson: any) => {
    if (lesson.status !== "CONFIRMED") return false;
    if (lesson.clientId === currentClient?.id) return false; // Exclude own lessons
    if (lesson.coachId !== coachId) return false; // Same coach only

    const lessonDate = new Date(lesson.date);
    const timeZone = getUserTimezone();
    const lessonDateInUserTz = toZonedTime(lessonDate, timeZone);
    const targetDateInUserTz = toZonedTime(date, timeZone);
    return isSameDay(lessonDateInUserTz, targetDateInUserTz);
  });

  // Create swap request mutation
  const createSwapRequestMutation =
    trpc.timeSwap.createSwapRequestFromLesson.useMutation({
      onSuccess: () => {
        onClose();
        window.location.reload();
      },
      onError: error => {
        alert(`Error: ${error.message}`);
      },
    });

  const handleSwapRequest = (targetLesson: any, myLesson: any) => {
    createSwapRequestMutation.mutate({
      requesterEventId: myLesson.id,
      targetEventId: targetLesson.id,
    });
  };

  // If user has multiple lessons, let them pick which one to swap
  const [selectedMyLesson, setSelectedMyLesson] = useState<any>(
    myLessonsOnDay.length === 1 ? myLessonsOnDay[0] : null
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className="relative w-full max-w-2xl bg-gradient-to-br from-[#1F2937] via-[#2A3133] to-[#1F2937] border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-yellow-500/20 via-yellow-600/15 to-yellow-500/20 border-b border-yellow-500/30 px-4 sm:px-6 py-3 sm:py-5">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-2">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg ring-2 ring-yellow-400/20 flex-shrink-0">
                <ArrowRightLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                  Request Time Swap
                </h3>
                <p className="text-xs sm:text-sm text-yellow-200/80 mt-0.5 truncate">
                  {format(date, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Select Your Lesson (if multiple) */}
          {myLessonsOnDay.length > 1 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-300 mb-4">
                Select your lesson to swap:
              </p>
              <div className="space-y-3">
                {myLessonsOnDay.map((lesson: any) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedMyLesson(lesson)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedMyLesson?.id === lesson.id
                        ? "bg-yellow-500/20 border-yellow-500/60 shadow-lg shadow-yellow-500/10"
                        : "bg-[#2A3133] border-[#404545] hover:border-yellow-500/40 hover:bg-[#353A3A]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2.5 rounded-lg ${
                          selectedMyLesson?.id === lesson.id
                            ? "bg-yellow-500/20"
                            : "bg-[#353A3A]"
                        }`}
                      >
                        <Clock
                          className={`h-5 w-5 ${
                            selectedMyLesson?.id === lesson.id
                              ? "text-yellow-400"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-semibold ${
                            selectedMyLesson?.id === lesson.id
                              ? "text-white"
                              : "text-gray-300"
                          }`}
                        >
                          {lesson.title}
                        </p>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {format(new Date(lesson.date), "h:mm a")}
                        </p>
                      </div>
                      {selectedMyLesson?.id === lesson.id && (
                        <div className="p-1.5 rounded-full bg-yellow-500/20">
                          <CheckCircle className="h-5 w-5 text-yellow-400" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Your Selected Lesson */}
          {selectedMyLesson && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-300 mb-3">
                Your Current Lesson:
              </p>
              <div className="p-5 rounded-xl bg-gradient-to-br from-[#2A3133] to-[#1F2937] border border-yellow-500/20 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Clock className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-lg">
                      {selectedMyLesson.title}
                    </p>
                    <p className="text-yellow-200/80 text-sm mt-1">
                      {format(new Date(selectedMyLesson.date), "h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Available Swap Times */}
          <div>
            <p className="text-sm font-medium text-gray-300 mb-4">
              Available Times to Swap With:
            </p>

            {!selectedMyLesson ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-gray-700/30 w-fit mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-gray-400">
                  {myLessonsOnDay.length > 1
                    ? "Please select your lesson above"
                    : "No lessons found"}
                </p>
              </div>
            ) : availableSwapLessons.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-gray-700/30 w-fit mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-gray-400">
                  No available lessons to swap with on this day
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableSwapLessons.map((lesson: any) => (
                  <div
                    key={lesson.id}
                    className="group p-5 rounded-xl bg-gradient-to-br from-[#2A3133] to-[#1F2937] border border-[#404545] hover:border-yellow-500/40 transition-all shadow-md hover:shadow-lg hover:shadow-yellow-500/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <Clock className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            Lesson with client
                          </p>
                          <p className="text-sm text-gray-400 mt-0.5">
                            {lesson.date
                              ? (() => {
                                  const date = new Date(lesson.date);
                                  return !isNaN(date.getTime())
                                    ? format(date, "h:mm a")
                                    : "Invalid time";
                                })()
                              : "No time"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleSwapRequest(lesson, selectedMyLesson)
                        }
                        disabled={createSwapRequestMutation.isPending}
                        className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30"
                      >
                        {createSwapRequestMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <ArrowRightLeft className="h-4 w-4" />
                            Request Switch
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[#404545] bg-[#1F2937]/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-lg bg-[#2A3133] text-gray-300 font-medium hover:bg-[#353A3A] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default withMobileDetection(
  MobileClientSchedulePage,
  ClientSchedulePageClient
);
