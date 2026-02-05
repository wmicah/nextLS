"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  Loader2,
  X,
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
import {
  formatTimeInUserTimezone,
  getUserTimezone,
} from "@/lib/timezone-utils";
import MobileClientNavigation from "./MobileClientNavigation";
import MobileClientBottomNavigation from "./MobileClientBottomNavigation";
import MobileSwapRequests from "./MobileSwapRequests";
import { COLORS, getGoldenAccent } from "@/lib/colors";

export default function MobileClientSchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDayOverviewModal, setShowDayOverviewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showSwitchRequests, setShowSwitchRequests] = useState(false);
  const [selectedSwitchLesson, setSelectedSwitchLesson] = useState<any>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [requestReason, setRequestReason] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [showExchangeOptions, setShowExchangeOptions] = useState(false);
  const [selectedLessonToExchange, setSelectedLessonToExchange] =
    useState<any>(null);

  // Fetch all schedule data for current and adjacent months
  const { data: coachSchedule = [] } =
    trpc.clientRouter.getCoachScheduleForClient.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  const { data: prevMonthSchedule = [] } =
    trpc.clientRouter.getCoachScheduleForClient.useQuery({
      month: currentMonth.getMonth() === 0 ? 11 : currentMonth.getMonth() - 1,
      year:
        currentMonth.getMonth() === 0
          ? currentMonth.getFullYear() - 1
          : currentMonth.getFullYear(),
    });

  const { data: nextMonthSchedule = [] } =
    trpc.clientRouter.getCoachScheduleForClient.useQuery({
      month: currentMonth.getMonth() === 11 ? 0 : currentMonth.getMonth() + 1,
      year:
        currentMonth.getMonth() === 11
          ? currentMonth.getFullYear() + 1
          : currentMonth.getFullYear(),
    });

  const allCoachSchedule = [
    ...coachSchedule,
    ...prevMonthSchedule,
    ...nextMonthSchedule,
  ];

  // Fetch client's lessons
  const { data: clientLessons = [] } =
    trpc.clientRouter.getClientLessons.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  const { data: prevMonthClientLessons = [] } =
    trpc.clientRouter.getClientLessons.useQuery({
      month: currentMonth.getMonth() === 0 ? 11 : currentMonth.getMonth() - 1,
      year:
        currentMonth.getMonth() === 0
          ? currentMonth.getFullYear() - 1
          : currentMonth.getFullYear(),
    });

  const { data: nextMonthClientLessons = [] } =
    trpc.clientRouter.getClientLessons.useQuery({
      month: currentMonth.getMonth() === 11 ? 0 : currentMonth.getMonth() + 1,
      year:
        currentMonth.getMonth() === 11
          ? currentMonth.getFullYear() + 1
          : currentMonth.getFullYear(),
    });

  const allClientLessons = [
    ...clientLessons,
    ...prevMonthClientLessons,
    ...nextMonthClientLessons,
  ];

  // Fetch upcoming lessons
  const { data: upcomingLessons = [] } =
    trpc.clientRouter.getClientUpcomingLessons.useQuery();

  // Fetch switch requests
  const {
    data: existingSwitchRequests = [],
    isLoading: isLoadingSwitchRequests,
  } = trpc.timeSwap.getSwapRequests.useQuery();

  // Get current client info
  const { data: currentClient } = trpc.clientRouter.getCurrentClient.useQuery();

  // Fetch coach's profile
  const { data: coachProfile } = trpc.clientRouter.getCoachProfile.useQuery();

  const { data: organizationSchedule } =
    trpc.clientRouter.getOrganizationCoachesSchedules.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  const scheduleAdvanceLimitDays =
    coachProfile?.scheduleAdvanceLimitDays ?? null;

  const primaryCoachId = coachProfile?.id || null;
  const isInOrganization =
    !!organizationSchedule && organizationSchedule.coaches.length > 0;
  const organizationCoaches = organizationSchedule?.coaches ?? [];
  const organizationEvents = organizationSchedule?.events ?? [];

  const defaultWorkingDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const getWorkingProfile = (coachId?: string | null) => {
    if (isInOrganization && organizationCoaches.length > 0) {
      const targetCoach =
        organizationCoaches.find(coach => coach.id === coachId) ||
        organizationCoaches[0];

      if (targetCoach) {
        return {
          startTime: targetCoach.workingHoursStart || "9:00 AM",
          endTime: targetCoach.workingHoursEnd || "6:00 PM",
          workingDays:
            (targetCoach.workingDays && targetCoach.workingDays.length > 0
              ? targetCoach.workingDays
              : defaultWorkingDays) || defaultWorkingDays,
          timeSlotInterval: targetCoach.timeSlotInterval || 60,
          customWorkingHours: (targetCoach as any)?.customWorkingHours || null,
          scheduleAdvanceLimit:
            typeof targetCoach.scheduleAdvanceLimitDays === "number"
              ? targetCoach.scheduleAdvanceLimitDays
              : scheduleAdvanceLimitDays,
          coachId: targetCoach.id,
          coachName: targetCoach.name || "Coach",
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
      scheduleAdvanceLimit: scheduleAdvanceLimitDays,
      coachId: primaryCoachId,
      coachName: coachProfile?.name || "Coach",
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
    const profile = getWorkingProfile(coachId);
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

  const isDateBeyondAdvanceLimit = (date: Date, coachId?: string | null) => {
    const limit = getScheduleAdvanceLimitForCoach(coachId);
    if (!limit || limit <= 0) {
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
    return diff > limit;
  };

  // Switch mutation
  const createSwitchRequestMutation =
    trpc.timeSwap.createSwapRequestFromLesson.useMutation({
      onSuccess: () => {
        setSelectedSwitchLesson(null);
        utils.timeSwap.getSwapRequests.invalidate();
        alert("Switch request sent successfully!");
      },
      onError: (error: any) => {
        alert(error.message || "Failed to create switch request");
      },
    });

  // Lesson request mutation
  const requestScheduleChangeMutation =
    trpc.clientRouter.requestScheduleChange.useMutation({
      onSuccess: data => {
        setShowRequestModal(false);
        setSelectedTimeSlot(null);
        setRequestReason("");
        setSelectedDate(null);
        setShowDayOverviewModal(false);
        setShowExchangeOptions(false);
        setSelectedLessonToExchange(null);
        // Refetch data
        utils.clientRouter.getCoachScheduleForClient.refetch();
        utils.clientRouter.getClientLessons.refetch();
        alert("Lesson request sent successfully!");
      },
      onError: (error: any) => {
        alert(error.message || "Failed to send lesson request");
      },
    });

  // Exchange lesson mutation
  const exchangeLessonMutation = trpc.clientRouter.exchangeLesson.useMutation({
    onSuccess: () => {
      setShowExchangeOptions(false);
      setSelectedLessonToExchange(null);
      setSelectedTimeSlot(null);
      setShowDayOverviewModal(false);
      setSelectedDate(null);
      setRequestReason("");
      utils.clientRouter.getCoachScheduleForClient.refetch();
      utils.clientRouter.getClientLessons.refetch();
      alert(
        "Exchange request sent! Your old lesson has been removed. If the coach rejects the new time, your old lesson will be restored."
      );
    },
    onError: (error: any) => {
      alert(`Error: ${error.message}`);
    },
  });

  const utils = trpc.useUtils();

  // Helper functions
  const hasPendingSwitchRequest = (lessonId: string) => {
    if (isLoadingSwitchRequests || !Array.isArray(existingSwitchRequests)) {
      return false;
    }
    return existingSwitchRequests.some(
      (request: any) =>
        (request.requesterEventId === lessonId ||
          request.targetEventId === lessonId) &&
        request.status === "PENDING"
    );
  };

  const hasPendingRequestWithTarget = (targetLesson: any) => {
    if (isLoadingSwitchRequests || !Array.isArray(existingSwitchRequests)) {
      return false;
    }
    return existingSwitchRequests.some(
      (request: any) =>
        request.targetEventId === targetLesson.id &&
        request.status === "PENDING"
    );
  };

  const anonymizeLessonTitle = (title: string, lessonClientId: string) => {
    if (lessonClientId === currentClient?.id) {
      return title;
    }
    let anonymizedTitle = title.replace(
      /Lesson with [a-zA-Z0-9_\s]+?(?=\s*-\s|$)/gi,
      "Lesson with client"
    );
    return anonymizedTitle;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(prev =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleDateClick = (
    day: Date,
    options: { ignoreAdvanceLimit?: boolean } = {}
  ) => {
    const ignoreAdvanceLimit = options.ignoreAdvanceLimit ?? false;

    const workingCoachesForDay = getCoachesWorkingOnDate(day);
    let defaultCoachId: string | null = primaryCoachId;

    if (isInOrganization) {
      if (!workingCoachesForDay.some(coach => coach.id === defaultCoachId)) {
        if (workingCoachesForDay.length > 0) {
          defaultCoachId = workingCoachesForDay[0].id;
        } else {
          defaultCoachId = organizationCoaches[0]?.id || defaultCoachId;
        }
      }
    }

    if (!ignoreAdvanceLimit && isDateBeyondAdvanceLimit(day, defaultCoachId)) {
      const limit = getScheduleAdvanceLimitForCoach(defaultCoachId);
      if (limit && limit > 0) {
        alert(`You can only request lessons up to ${limit} days in advance.`);
      } else {
        alert("This date is not available for scheduling.");
      }
      return;
    }

    setSelectedCoachId(defaultCoachId);
    setSelectedTimeSlot(null);
    setRequestReason("");
    setSelectedDate(day);
    setShowDayOverviewModal(true);
  };

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const getLessonsForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return allCoachSchedule.filter(
      (lesson: any) =>
        format(new Date(lesson.date), "yyyy-MM-dd") === dateString
    );
  };

  const getClientLessonsForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return allClientLessons.filter(
      (lesson: any) =>
        format(new Date(lesson.date), "yyyy-MM-dd") === dateString
    );
  };

  const generateAvailableTimeSlots = (
    date: Date,
    coachIdOverride?: string | null
  ) => {
    const activeCoachId = isInOrganization
      ? coachIdOverride || selectedCoachId || organizationCoaches[0]?.id || null
      : primaryCoachId || null;

    if (isInOrganization && !activeCoachId) {
      return [];
    }

    if (isDateBeyondAdvanceLimit(date, activeCoachId)) {
      return [];
    }

    const workingHours = getWorkingHoursForDate(date, activeCoachId);

    if (!workingHours.isWorkingDay) {
      return [];
    }

    const startTime = workingHours.startTime;
    const endTime = workingHours.endTime;
    const interval = workingHours.timeSlotInterval;
    const slots: string[] = [];

    const startMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    const endMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!startMatch || !endMatch) {
      for (let hour = 9; hour < 20; hour++) {
        const displayHour = hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? "PM" : "AM";
        slots.push(`${displayHour}:00 ${period}`);
      }
      return slots;
    }

    const [, startHour, startMinute, startPeriod] = startMatch;
    const [, endHour, endMinute, endPeriod] = endMatch;

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

    const now = new Date();
    const isToday = format(now, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    const existingLessons = isInOrganization
      ? organizationEvents.filter(event => {
          if (!event.coachId) return false;
          if (!activeCoachId) return false;
          if (event.coachId !== activeCoachId) return false;
          const eventDate = new Date(event.date);
          return (
            eventDate.getFullYear() === date.getFullYear() &&
            eventDate.getMonth() === date.getMonth() &&
            eventDate.getDate() === date.getDate()
          );
        })
      : getLessonsForDate(date);

    const bookedTimes = existingLessons.map((lesson: any) => {
      const lessonDate = new Date(lesson.date);
      return format(lessonDate, "h:mm a");
    });

    for (
      let totalMinutes = startTotalMinutes;
      totalMinutes < endTotalMinutes;
      totalMinutes += interval
    ) {
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

      if (!bookedTimes.includes(timeSlot)) {
        slots.push(timeSlot);
      }
    }

    return slots;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <CheckCircle
            className="h-4 w-4"
            style={{ color: COLORS.BLUE_PRIMARY }}
          />
        );
      case "DECLINED":
        return (
          <XCircle className="h-4 w-4" style={{ color: COLORS.RED_ALERT }} />
        );
      case "PENDING":
        return (
          <AlertCircle
            className="h-4 w-4"
            style={{ color: COLORS.GOLDEN_ACCENT }}
          />
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-500/20 text-blue-100 border-blue-400";
      case "DECLINED":
        return "bg-red-500/20 text-red-100 border-red-400";
      case "PENDING":
        return "bg-amber-500/20 text-amber-100 border-amber-400";
      default:
        return "bg-blue-500/20 text-blue-100 border-blue-400";
    }
  };

  const workingProfile = getWorkingProfile(primaryCoachId);

  const coachColorPalette = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-cyan-500",
  ];

  const getCoachColor = (coachId: string | null | undefined) => {
    if (!coachId || !isInOrganization) {
      return "bg-sky-500";
    }

    const index = organizationCoaches.findIndex(coach => coach.id === coachId);
    if (index === -1) {
      return "bg-sky-500";
    }

    return coachColorPalette[index % coachColorPalette.length];
  };

  const getCoachName = (coachId: string | null | undefined) => {
    if (!coachId) return "Coach";
    const coach = organizationCoaches.find(c => c.id === coachId);
    return coach?.name || "Coach";
  };
  const upcomingLessonsPreview = upcomingLessons.slice(0, 2);
  const remainingUpcomingLessons = Math.max(
    0,
    upcomingLessons.length - upcomingLessonsPreview.length
  );

  const getCoachesWorkingOnDate = (date: Date) => {
    if (!isInOrganization) {
      return [];
    }

    return organizationCoaches.filter(coach => {
      const hours = getWorkingHoursForDate(date, coach.id);
      return hours.isWorkingDay;
    });
  };

  const getScheduleAdvanceLimitForCoach = (coachId?: string | null) => {
    if (isInOrganization && coachId) {
      const coach = organizationCoaches.find(c => c.id === coachId);
      if (coach && typeof coach.scheduleAdvanceLimitDays === "number") {
        return coach.scheduleAdvanceLimitDays;
      }
    }
    return scheduleAdvanceLimitDays;
  };

  return (
    <div
      className="min-h-[100dvh]"
      style={{
        backgroundColor: COLORS.BACKGROUND_DARK,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Mobile Header */}
      <div
        className="sticky top-0 z-50 border-b px-4 pb-4"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          paddingTop: "max(0.75rem, calc(0.75rem + env(safe-area-inset-top)))",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              My Schedule
            </h1>
            <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
              View & request lessons
            </p>
          </div>
          <MobileClientNavigation currentPage="schedule" />
        </div>
      </div>

      {/* Main Content */}
      <div
        className="p-4 space-y-6"
        style={{
          paddingBottom:
            "max(5rem, calc(5rem + env(safe-area-inset-bottom, 0px)))",
        }}
      >
        {/* Coach / Organization Working Hours */}
        {isInOrganization && organizationCoaches.length > 0 ? (
          <div
            className="p-4 rounded-xl border shadow-xl space-y-3"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Organization Coaches&apos; Hours
            </h2>
            <div className="space-y-2">
              {organizationCoaches.map(coach => (
                <div
                  key={coach.id}
                  className="p-3 rounded-lg border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${getCoachColor(coach.id)}`}
                    />
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {coach.name || "Coach"}
                    </h3>
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {(coach.workingHoursStart as string) || "9:00 AM"} -{" "}
                    {(coach.workingHoursEnd as string) || "6:00 PM"}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
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
            className="p-4 rounded-xl border shadow-xl"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <h2
              className="text-lg font-semibold mb-2"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Coach&apos;s Working Hours
            </h2>
            <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
              {workingProfile.startTime} - {workingProfile.endTime}
            </p>
            {workingProfile.customWorkingHours && (
              <p
                className="text-xs mt-1"
                style={{ color: COLORS.GREEN_PRIMARY }}
              >
                Custom daily hours enabled
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              {workingProfile.workingDays.map((day: string) => (
                <span
                  key={day}
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: getGoldenAccent(0.15),
                    color: COLORS.GOLDEN_ACCENT,
                  }}
                >
                  {day.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons - touch-friendly */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowSwitchRequests(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold min-h-[44px] touch-manipulation"
            style={{
              backgroundColor: COLORS.GOLDEN_ACCENT,
              color: COLORS.BACKGROUND_DARK,
            }}
          >
            Switch Requests
          </button>
        </div>

        {/* Upcoming Lessons Preview */}
        {upcomingLessons.length > 0 && (
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Upcoming Lessons
            </h2>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Next {Math.min(upcomingLessons.length, 2)} scheduled sessions
            </p>
            <div className="space-y-3">
              {upcomingLessonsPreview.map(lesson => (
                <div
                  key={lesson.id}
                  className="p-3 rounded-lg border flex items-center justify-between"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {format(new Date(lesson.date), "EEE, MMM d")}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {format(new Date(lesson.date), "h:mm a")}
                    </p>
                    {lesson.title && (
                      <p
                        className="text-xs mt-1 line-clamp-1"
                        style={{ color: COLORS.TEXT_MUTED }}
                      >
                        {lesson.title}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCoachId(lesson.coachId || primaryCoachId);
                      handleDateClick(new Date(lesson.date), {
                        ignoreAdvanceLimit: true,
                      });
                    }}
                    className="text-sm font-semibold px-3 py-2 rounded-lg min-h-[44px] touch-manipulation transition-opacity active:opacity-90"
                    style={{
                      backgroundColor: getGoldenAccent(0.2),
                      color: COLORS.GOLDEN_ACCENT,
                    }}
                  >
                    View Day
                  </button>
                </div>
              ))}
            </div>
            {remainingUpcomingLessons > 0 && (
              <p
                className="text-center text-xs"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                +{remainingUpcomingLessons} more scheduled lesson
                {remainingUpcomingLessons === 1 ? "" : "s"}
              </p>
            )}
          </div>
        )}

        {/* Calendar */}
        <div
          className="p-4 sm:p-6 rounded-xl border"
          style={{
            backgroundColor: COLORS.BACKGROUND_CARD,
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >
          {/* Month Navigation */}
          <div
            className="flex items-center justify-between p-4 mb-4 rounded-xl"
            style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
          >
            <button
              type="button"
              onClick={() => navigateMonth("prev")}
              className="p-3 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation transition-opacity active:opacity-90"
              style={{
                backgroundColor: getGoldenAccent(0.2),
                color: COLORS.GOLDEN_ACCENT,
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3
              className="text-xl sm:text-2xl font-bold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth("next")}
              className="p-3 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation transition-opacity active:opacity-90"
              style={{
                backgroundColor: getGoldenAccent(0.2),
                color: COLORS.GOLDEN_ACCENT,
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {scheduleAdvanceLimitDays && scheduleAdvanceLimitDays > 0 && (
            <div
              className="px-4 py-3 mb-4 rounded-xl text-sm"
              style={{
                backgroundColor: COLORS.BACKGROUND_DARK,
                borderColor: COLORS.BORDER_SUBTLE,
                borderWidth: 1,
                color: COLORS.TEXT_SECONDARY,
              }}
            >
              You can request lessons up to{" "}
              <span style={{ color: COLORS.TEXT_PRIMARY, fontWeight: 600 }}>
                {scheduleAdvanceLimitDays} days
              </span>{" "}
              in advance.
            </div>
          )}

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div
                key={day}
                className="text-center text-sm font-semibold py-2 rounded-lg"
                style={{
                  color: COLORS.TEXT_MUTED,
                  backgroundColor: COLORS.BACKGROUND_DARK,
                }}
              >
                {day.slice(0, 1)}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 pb-2">
            {getCalendarDays().map(day => {
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
              const workingHoursForDay = getWorkingHoursForDate(
                day,
                primaryCoachId
              );
              const isWorkingDay = workingHoursForDay.isWorkingDay;
              const isBeyondLimit = isDateBeyondAdvanceLimit(
                day,
                primaryCoachId
              );

              const myLessonsForDay = getClientLessonsForDate(day);
              const hasMyLessons = myLessonsForDay.length > 0;
              const workingCoachesForDay = getCoachesWorkingOnDate(day);
              const otherCoachesWorking = isInOrganization
                ? workingCoachesForDay.some(
                    coach => coach.id !== primaryCoachId
                  )
                : false;
              const otherCoachColors = isInOrganization
                ? workingCoachesForDay
                    .filter(coach => coach.id !== primaryCoachId)
                    .map(coach => getCoachColor(coach.id))
                : [];

              const canRequestOnDay = !isPast && isWorkingDay && !isBeyondLimit;
              const canOpenDay =
                canRequestOnDay || hasMyLessons || otherCoachesWorking;
              const isSelected =
                selectedDate !== null && isSameDay(day, selectedDate);

              return (
                <div
                  key={day.toISOString()}
                  role={canOpenDay ? "button" : "presentation"}
                  tabIndex={canOpenDay ? 0 : -1}
                  aria-disabled={!canOpenDay}
                  onClick={() => {
                    if (!canOpenDay) return;
                    handleDateClick(day, {
                      ignoreAdvanceLimit: hasMyLessons && !canRequestOnDay,
                    });
                  }}
                  onKeyDown={event => {
                    if (!canOpenDay) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleDateClick(day, {
                        ignoreAdvanceLimit: hasMyLessons && !canRequestOnDay,
                      });
                    }
                  }}
                  className={`
                    aspect-square flex flex-col items-center justify-between text-xs rounded-xl transition-all duration-200 relative border-2 p-1 overflow-hidden touch-manipulation
                    ${
                      canOpenDay
                        ? "cursor-pointer active:scale-[0.98]"
                        : "cursor-not-allowed opacity-60"
                    }
                  `}
                  style={{
                    ...(isToday
                      ? {
                          background: `linear-gradient(135deg, ${COLORS.BLUE_PRIMARY}, ${COLORS.BLUE_DARK})`,
                          color: COLORS.TEXT_PRIMARY,
                          borderColor: COLORS.BLUE_PRIMARY,
                          fontWeight: 700,
                        }
                      : isPast
                        ? {
                            color: COLORS.TEXT_MUTED,
                            backgroundColor: "rgba(255,255,255,0.04)",
                            borderColor: COLORS.BORDER_SUBTLE,
                          }
                        : !isWorkingDay
                          ? {
                              color: COLORS.GOLDEN_ACCENT,
                              backgroundColor: getGoldenAccent(0.1),
                              borderColor: getGoldenAccent(0.3),
                            }
                          : isBeyondLimit
                            ? {
                                color: COLORS.TEXT_MUTED,
                                backgroundColor: "rgba(255,255,255,0.04)",
                                borderColor: COLORS.BORDER_SUBTLE,
                              }
                            : isCurrentMonth
                              ? {
                                  color: COLORS.TEXT_PRIMARY,
                                  backgroundColor: isSelected
                                    ? getGoldenAccent(0.25)
                                    : COLORS.BACKGROUND_DARK,
                                  borderColor: isSelected
                                    ? COLORS.GOLDEN_ACCENT
                                    : COLORS.BORDER_SUBTLE,
                                }
                              : {
                                  color: COLORS.TEXT_MUTED,
                                  backgroundColor: "rgba(255,255,255,0.02)",
                                  borderColor: COLORS.BORDER_SUBTLE,
                                }),
                    ...(isSelected && !isToday && isCurrentMonth
                      ? { boxShadow: `0 0 0 2px ${getGoldenAccent(0.5)}` }
                      : {}),
                  }}
                  title={
                    isBeyondLimit && scheduleAdvanceLimitDays
                      ? `This date is beyond your coach's scheduling window (${scheduleAdvanceLimitDays} day limit).`
                      : isBeyondLimit
                        ? "This date is beyond your coach's scheduling window."
                        : undefined
                  }
                >
                  <div className="w-full flex items-start justify-between text-[11px] font-semibold">
                    <span>{format(day, "d")}</span>
                  </div>

                  {(hasMyLessons || otherCoachColors.length > 0) && (
                    <div className="absolute top-1 right-1 flex flex-col gap-0.5 items-center">
                      {hasMyLessons && (
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-300 border border-emerald-100/70 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                          title={`${myLessonsForDay.length} of your lesson${
                            myLessonsForDay.length === 1 ? "" : "s"
                          }`}
                        />
                      )}
                      {!hasMyLessons &&
                        otherCoachColors
                          .slice(0, 3)
                          .map((colorClass, idx) => (
                            <span
                              key={`${day.toISOString()}-coach-${idx}`}
                              className={`inline-block w-2 h-1 rounded-full border border-white/40 shadow-[0_0_4px_rgba(255,255,255,0.35)] ${colorClass}`}
                              title="Other coach available"
                            />
                          ))}
                    </div>
                  )}

                  {isBeyondLimit && scheduleAdvanceLimitDays && isSelected && (
                    <div className="text-[9px] text-amber-200 bg-amber-500/10 border border-amber-400/40 rounded px-1 py-0.5 text-center pointer-events-none mt-auto">
                      ≤ {scheduleAdvanceLimitDays} days
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Overview Modal - fully opaque, no transparency */}
      {showDayOverviewModal && selectedDate && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
        >
          <div
            className="rounded-xl border w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: "#1c1f20",
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div
              className="sticky top-0 border-b px-4 py-4 flex items-center justify-between"
              style={{
                backgroundColor: "#1c1f20",
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {format(selectedDate, "MMM d, yyyy")}
                </h2>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  {(() => {
                    const hours = getWorkingHoursForDate(selectedDate);
                    return hours.isWorkingDay
                      ? `${hours.startTime} - ${hours.endTime}`
                      : "Unavailable";
                  })()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDayOverviewModal(false);
                  setSelectedDate(null);
                  setSelectedCoachId(null);
                  setSelectedTimeSlot(null);
                  setRequestReason("");
                }}
                className="p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                style={{
                  color: COLORS.TEXT_SECONDARY,
                  backgroundColor: "transparent",
                }}
                aria-label="Close"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* My Lessons */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  My Lessons
                </h3>
                {(() => {
                  const myDayLessons = getClientLessonsForDate(selectedDate);
                  return myDayLessons.length > 0 ? (
                    <div className="space-y-2">
                      {myDayLessons.map((lesson: any, index: number) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 ${getStatusColor(
                            lesson.status
                          )}`}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {format(new Date(lesson.date), "h:mm a")}
                            </div>
                            <div className="text-xs opacity-80">
                              {anonymizeLessonTitle(
                                lesson.title,
                                lesson.clientId
                              )}
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
                    <div
                      className="text-center py-6 rounded-lg"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        color: COLORS.TEXT_MUTED,
                        fontSize: "0.875rem",
                      }}
                    >
                      No lessons scheduled
                    </div>
                  );
                })()}
              </div>

              {/* Coach's Lessons */}
              <div>
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Coach&apos;s Scheduled Lessons
                </h3>
                {(() => {
                  const coachDayLessons = getLessonsForDate(selectedDate);
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
                  const coachLessonsByCoach = isInOrganization
                    ? otherClientLessons.reduce(
                        (acc: Record<string, any[]>, lesson: any) => {
                          if (!lesson.coachId) {
                            acc._default = acc._default || [];
                            acc._default.push(lesson);
                            return acc;
                          }
                          if (!acc[lesson.coachId]) {
                            acc[lesson.coachId] = [];
                          }
                          acc[lesson.coachId].push(lesson);
                          return acc;
                        },
                        {}
                      )
                    : { _default: otherClientLessons };

                  return otherClientLessons.length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(coachLessonsByCoach).map(
                        (
                          [coachId, lessons]: [string, any[]],
                          index: number
                        ) => (
                          <div
                            key={`${coachId || "default"}-${index}`}
                            className="space-y-2"
                          >
                            {isInOrganization && coachId !== "_default" && (
                              <div
                                className="flex items-center gap-2 text-xs uppercase tracking-wide"
                                style={{ color: COLORS.TEXT_SECONDARY }}
                              >
                                <span
                                  className={`inline-block w-2 h-2 rounded-full ${getCoachColor(
                                    coachId
                                  )}`}
                                />
                                <span>{getCoachName(coachId)}</span>
                              </div>
                            )}
                            {lessons.map((lesson: any, lessonIndex: number) => {
                              const isPast = new Date(lesson.date) < new Date();
                              return (
                                <div
                                  key={`${lesson.id}-${lessonIndex}`}
                                  className="flex items-center justify-between p-3 rounded-lg border"
                                  style={{
                                    backgroundColor: getGoldenAccent(0.08),
                                    borderColor: getGoldenAccent(0.25),
                                  }}
                                >
                                  <div className="flex-1">
                                    <div
                                      className="font-medium text-sm"
                                      style={{ color: COLORS.TEXT_PRIMARY }}
                                    >
                                      {format(new Date(lesson.date), "h:mm a")}
                                    </div>
                                    <div
                                      className="text-xs"
                                      style={{ color: COLORS.TEXT_MUTED }}
                                    >
                                      Client
                                    </div>
                                  </div>
                                  {!isPast &&
                                    upcomingLessons.length > 0 &&
                                    !hasPendingRequestWithTarget(lesson) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedSwitchLesson(lesson);
                                        }}
                                        disabled={
                                          createSwitchRequestMutation.isPending
                                        }
                                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                          backgroundColor: COLORS.GOLDEN_ACCENT,
                                          color: COLORS.BACKGROUND_DARK,
                                        }}
                                      >
                                        {createSwitchRequestMutation.isPending ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <ArrowRightLeft className="h-3 w-3" />
                                        )}
                                        Switch
                                      </button>
                                    )}
                                  {!isPast &&
                                    hasPendingRequestWithTarget(lesson) && (
                                      <span
                                        className="text-xs font-medium px-2 py-1 rounded"
                                        style={{
                                          color: COLORS.GOLDEN_ACCENT,
                                          backgroundColor: getGoldenAccent(0.2),
                                        }}
                                      >
                                        Pending
                                      </span>
                                    )}
                                </div>
                              );
                            })}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div
                      className="text-center py-6 rounded-lg"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        color: COLORS.TEXT_MUTED,
                        fontSize: "0.875rem",
                      }}
                    >
                      No other lessons scheduled
                    </div>
                  );
                })()}
              </div>

              {/* Available Time Slots */}
              <div>
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Available Time Slots
                </h3>
                {isInOrganization && (
                  <p
                    className="text-xs mt-1 mb-2"
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
                    {selectedCoachId
                      ? `Coach: ${getWorkingProfile(selectedCoachId).coachName}`
                      : "Select a coach to view available times"}
                  </p>
                )}
                {(() => {
                  const workingCoaches = getCoachesWorkingOnDate(selectedDate);
                  const effectiveCoachId =
                    selectedCoachId || workingCoaches[0]?.id || primaryCoachId;
                  const activeCoachProfile =
                    getWorkingProfile(effectiveCoachId);
                  const coachIdsToOffer = isInOrganization
                    ? workingCoaches.map(coach => coach.id)
                    : [primaryCoachId].filter(
                        (id): id is string | null => id !== undefined
                      );

                  const slotsByCoach = coachIdsToOffer.reduce(
                    (acc: Record<string, string[]>, coachId) => {
                      if (!coachId) return acc;
                      const slots = generateAvailableTimeSlots(
                        selectedDate,
                        coachId
                      );
                      acc[coachId] = slots;
                      return acc;
                    },
                    {}
                  );

                  const availableSlots =
                    (effectiveCoachId && slotsByCoach[effectiveCoachId]) || [];
                  const beyondLimit =
                    selectedDate &&
                    isDateBeyondAdvanceLimit(selectedDate, effectiveCoachId);

                  if (isInOrganization) {
                    if (workingCoaches.length === 0) {
                      return (
                        <div
                          className="text-center py-6 rounded-lg"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_DARK,
                            color: COLORS.TEXT_MUTED,
                            fontSize: "0.875rem",
                          }}
                        >
                          No coaches are scheduled to work this day.
                        </div>
                      );
                    }

                    if (!effectiveCoachId || availableSlots.length === 0) {
                      return (
                        <div
                          className="text-center py-6 rounded-lg"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_DARK,
                            color: COLORS.TEXT_MUTED,
                            fontSize: "0.875rem",
                          }}
                        >
                          <p className="mb-3">
                            No available time slots for{" "}
                            {activeCoachProfile.coachName}.
                          </p>
                          <p
                            className="text-xs mb-2"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            Try a different coach:
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {workingCoaches.map(coach => (
                              <button
                                key={coach.id}
                                type="button"
                                onClick={() => setSelectedCoachId(coach.id)}
                                className="px-3 py-2 rounded-lg text-sm font-semibold min-h-[44px] touch-manipulation border"
                                style={{
                                  backgroundColor:
                                    coach.id === effectiveCoachId
                                      ? getGoldenAccent(0.2)
                                      : COLORS.BACKGROUND_DARK,
                                  color:
                                    coach.id === effectiveCoachId
                                      ? COLORS.GOLDEN_ACCENT
                                      : COLORS.TEXT_SECONDARY,
                                  borderColor:
                                    coach.id === effectiveCoachId
                                      ? COLORS.GOLDEN_ACCENT
                                      : COLORS.BORDER_SUBTLE,
                                }}
                              >
                                {coach.name || "Coach"}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  }

                  return availableSlots.length > 0 ? (
                    <div className="space-y-3">
                      {isInOrganization && workingCoaches.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {workingCoaches.map(coach => (
                            <button
                              key={coach.id}
                              type="button"
                              onClick={() => setSelectedCoachId(coach.id)}
                              className="px-3 py-2 rounded-lg text-sm font-semibold min-h-[44px] touch-manipulation border"
                              style={{
                                backgroundColor:
                                  coach.id === effectiveCoachId
                                    ? getGoldenAccent(0.2)
                                    : COLORS.BACKGROUND_DARK,
                                color:
                                  coach.id === effectiveCoachId
                                    ? COLORS.GOLDEN_ACCENT
                                    : COLORS.TEXT_SECONDARY,
                                borderColor:
                                  coach.id === effectiveCoachId
                                    ? COLORS.GOLDEN_ACCENT
                                    : COLORS.BORDER_SUBTLE,
                              }}
                            >
                              {coach.name || "Coach"}
                            </button>
                          ))}
                        </div>
                      )}
                      <div
                        className="grid grid-cols-3 gap-2"
                        style={{
                          pointerEvents: "auto",
                          position: "relative",
                          zIndex: 20,
                          touchAction: "manipulation",
                        }}
                      >
                        {availableSlots.map((slot, index) => (
                          <div
                            key={`time-slot-${index}-${slot}`}
                            role="button"
                            tabIndex={0}
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedTimeSlot(slot);
                            }}
                            onTouchStart={e => {
                              e.stopPropagation();
                            }}
                            onTouchEnd={e => {
                              e.stopPropagation();
                              setSelectedTimeSlot(slot);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedTimeSlot(slot);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-center transition-all duration-200 text-xs touch-manipulation select-none ${
                              selectedTimeSlot === slot
                                ? "bg-blue-500 border-blue-400 text-white"
                                : "hover:bg-blue-500/20 hover:border-blue-400 active:bg-blue-500/30"
                            }`}
                            style={{
                              backgroundColor:
                                selectedTimeSlot === slot
                                  ? COLORS.BLUE_PRIMARY
                                  : COLORS.BACKGROUND_DARK,
                              borderColor:
                                selectedTimeSlot === slot
                                  ? COLORS.BLUE_PRIMARY
                                  : COLORS.BORDER_SUBTLE,
                              color: COLORS.TEXT_PRIMARY,
                              pointerEvents: "auto",
                              cursor: "pointer",
                              WebkitTapHighlightColor:
                                "rgba(59, 130, 246, 0.3)",
                              touchAction: "manipulation",
                              userSelect: "none",
                              WebkitUserSelect: "none",
                              position: "relative",
                              zIndex: 25,
                            }}
                          >
                            {slot}
                          </div>
                        ))}
                      </div>

                      {/* Request/Exchange Options - Show when time slot is selected */}
                      {selectedTimeSlot && (
                        <div className="mt-4 space-y-3">
                          {!showExchangeOptions ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!selectedDate || !selectedTimeSlot)
                                    return;

                                  const timeString = selectedTimeSlot;
                                  const coachName =
                                    activeCoachProfile?.coachName ||
                                    "your coach";
                                  const confirmed = window.confirm(
                                    `Request ${timeString} on ${format(
                                      selectedDate,
                                      "MMM d, yyyy"
                                    )} with ${coachName}?`
                                  );
                                  if (!confirmed) return;

                                  const timeZone = getUserTimezone();

                                  requestScheduleChangeMutation.mutate({
                                    requestedDate: format(
                                      selectedDate,
                                      "yyyy-MM-dd"
                                    ),
                                    requestedTime: timeString,
                                    reason:
                                      requestReason ||
                                      "Client requested time change",
                                    timeZone: timeZone,
                                    ...(effectiveCoachId
                                      ? { coachId: effectiveCoachId }
                                      : {}),
                                  });
                                }}
                                disabled={
                                  requestScheduleChangeMutation.isPending
                                }
                                className="w-full px-4 py-3 rounded-lg font-semibold min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 border"
                                style={{
                                  backgroundColor: COLORS.BACKGROUND_DARK,
                                  borderColor: COLORS.BORDER_SUBTLE,
                                  color: COLORS.TEXT_PRIMARY,
                                }}
                              >
                                {requestScheduleChangeMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  "Request"
                                )}
                              </button>

                              {allClientLessons.filter((lesson: any) => {
                                const lessonDate = new Date(lesson.date);
                                return (
                                  lessonDate > new Date() &&
                                  lesson.status === "CONFIRMED"
                                );
                              }).length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setShowExchangeOptions(true)}
                                  className="w-full px-4 py-3 rounded-lg font-semibold min-h-[44px] touch-manipulation transition-colors flex items-center justify-center gap-2"
                                  style={{
                                    backgroundColor: COLORS.GOLDEN_ACCENT,
                                    color: COLORS.BACKGROUND_DARK,
                                  }}
                                >
                                  Exchange
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              {/* Lesson Selection for Exchange */}
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                <p className="text-sm font-medium text-gray-300 mb-2">
                                  Select a lesson to exchange:
                                </p>
                                {allClientLessons
                                  .filter((lesson: any) => {
                                    const lessonDate = new Date(lesson.date);
                                    return (
                                      lessonDate > new Date() &&
                                      lesson.status === "CONFIRMED"
                                    );
                                  })
                                  .map((lesson: any) => {
                                    const lessonDate = new Date(lesson.date);
                                    return (
                                      <button
                                        key={lesson.id}
                                        onClick={() =>
                                          setSelectedLessonToExchange(lesson)
                                        }
                                        className="w-full p-3 rounded-lg border text-left transition-colors"
                                        style={{
                                          backgroundColor:
                                            selectedLessonToExchange?.id ===
                                            lesson.id
                                              ? getGoldenAccent(0.15)
                                              : COLORS.BACKGROUND_DARK,
                                          borderColor:
                                            selectedLessonToExchange?.id ===
                                            lesson.id
                                              ? COLORS.GOLDEN_ACCENT
                                              : COLORS.BORDER_SUBTLE,
                                          color: COLORS.TEXT_PRIMARY,
                                        }}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="font-medium">
                                              {lesson.title}
                                            </p>
                                            <p
                                              className="text-sm"
                                              style={{
                                                color: COLORS.TEXT_MUTED,
                                              }}
                                            >
                                              {format(
                                                lessonDate,
                                                "EEEE, MMMM d"
                                              )}{" "}
                                              at {format(lessonDate, "h:mm a")}
                                            </p>
                                          </div>
                                          {selectedLessonToExchange?.id ===
                                            lesson.id && (
                                            <CheckCircle
                                              className="h-5 w-5"
                                              style={{
                                                color: COLORS.GOLDEN_ACCENT,
                                              }}
                                            />
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                              </div>

                              {selectedLessonToExchange ? (
                                <button
                                  onClick={() => {
                                    if (
                                      !selectedDate ||
                                      !selectedTimeSlot ||
                                      !selectedLessonToExchange
                                    )
                                      return;

                                    // Time slot is already in "h:mm AM/PM" format, use it directly
                                    const timeString = selectedTimeSlot;

                                    const timeZone = getUserTimezone();

                                    exchangeLessonMutation.mutate({
                                      oldLessonId: selectedLessonToExchange.id,
                                      requestedDate: format(
                                        selectedDate,
                                        "yyyy-MM-dd"
                                      ),
                                      requestedTime: timeString,
                                      reason:
                                        requestReason ||
                                        "Client requested to exchange lesson time",
                                      timeZone: timeZone,
                                    });
                                  }}
                                  disabled={exchangeLessonMutation.isPending}
                                  className="w-full px-4 py-3 rounded-lg font-semibold min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                  style={{
                                    backgroundColor: COLORS.GOLDEN_ACCENT,
                                    color: COLORS.BACKGROUND_DARK,
                                  }}
                                >
                                  {exchangeLessonMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                      Exchanging...
                                    </>
                                  ) : (
                                    <>
                                      <ArrowRightLeft className="h-5 w-5" />
                                      Request Exchange
                                    </>
                                  )}
                                </button>
                              ) : (
                                <div
                                  className="p-3 rounded-lg border text-sm text-center"
                                  style={{
                                    backgroundColor: COLORS.BACKGROUND_DARK,
                                    borderColor: COLORS.BORDER_SUBTLE,
                                    color: COLORS.TEXT_MUTED,
                                  }}
                                >
                                  Select a lesson above to exchange
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setShowExchangeOptions(false);
                                  setSelectedLessonToExchange(null);
                                }}
                                className="w-full px-4 py-3 rounded-lg font-medium min-h-[44px] touch-manipulation border"
                                style={{
                                  backgroundColor: COLORS.BACKGROUND_DARK,
                                  borderColor: COLORS.BORDER_SUBTLE,
                                  color: COLORS.TEXT_SECONDARY,
                                }}
                              >
                                Back
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="text-center py-6 rounded-lg"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        color: COLORS.TEXT_MUTED,
                        fontSize: "0.875rem",
                      }}
                    >
                      {beyondLimit ? (
                        <>
                          <p>
                            This date is beyond {activeCoachProfile.coachName}
                            &apos;s scheduling window.
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            Please choose an earlier date.
                          </p>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <p>
                            No available time slots for{" "}
                            {activeCoachProfile.coachName}.
                          </p>
                          {isInOrganization && workingCoaches.length > 0 && (
                            <div className="space-y-1">
                              {workingCoaches.map(coach => (
                                <button
                                  key={coach.id}
                                  type="button"
                                  onClick={() => setSelectedCoachId(coach.id)}
                                  className="px-3 py-2 rounded-lg text-sm font-semibold min-h-[44px] touch-manipulation border"
                                  style={{
                                    backgroundColor: COLORS.BACKGROUND_DARK,
                                    color: COLORS.TEXT_SECONDARY,
                                    borderColor: COLORS.BORDER_SUBTLE,
                                  }}
                                >
                                  {coach.name || "Coach"} has availability
                                </button>
                              ))}
                              {workingCoaches.length === 0 && (
                                <p
                                  className="text-xs mt-1"
                                  style={{
                                    color: COLORS.TEXT_SECONDARY,
                                  }}
                                >
                                  No other coaches are working this day.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Selection Modal for Swap */}
      {selectedSwitchLesson && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div
            className="relative w-full max-w-md rounded-xl border max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="px-4 sm:px-6 py-3 sm:py-4 border-b"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                backgroundColor: COLORS.BACKGROUND_DARK,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <h2
                    className="text-lg sm:text-xl font-semibold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Choose Your Lesson to Switch
                  </h2>
                  <p
                    className="text-xs sm:text-sm mt-0.5"
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
                    Select which of your lessons you want to switch with this
                    client
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSwitchLesson(null)}
                  className="p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation flex-shrink-0"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
              <div className="mb-6">
                <div
                  className="p-4 rounded-lg border mb-4"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p
                        className="font-medium"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        Target Lesson:{" "}
                        {format(
                          new Date(selectedSwitchLesson.date),
                          "M/d/yyyy"
                        )}{" "}
                        at{" "}
                        {format(new Date(selectedSwitchLesson.date), "h:mm a")}
                      </p>
                      <p
                        className="text-sm mt-0.5"
                        style={{ color: COLORS.TEXT_MUTED }}
                      >
                        {anonymizeLessonTitle(
                          selectedSwitchLesson.title,
                          selectedSwitchLesson.clientId
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Your Available Lessons:
                </h3>

                {isLoadingSwitchRequests ? (
                  <div className="text-center py-8">
                    <Loader2
                      className="h-8 w-8 animate-spin mx-auto mb-3"
                      style={{ color: COLORS.TEXT_MUTED }}
                    />
                    <p style={{ color: COLORS.TEXT_MUTED }}>
                      Loading lesson status...
                    </p>
                  </div>
                ) : upcomingLessons.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingLessons.map((myLesson: any, index: number) => {
                      const hasPendingRequest = hasPendingSwitchRequest(
                        myLesson.id
                      );
                      const hasPendingWithTarget =
                        hasPendingRequestWithTarget(selectedSwitchLesson);
                      const isDisabled =
                        hasPendingRequest ||
                        hasPendingWithTarget ||
                        createSwitchRequestMutation.isPending;

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            if (!isDisabled) {
                              createSwitchRequestMutation.mutate({
                                targetEventId: selectedSwitchLesson.id,
                                requesterEventId: myLesson.id,
                              });
                            }
                          }}
                          disabled={isDisabled}
                          className="w-full p-4 rounded-lg border text-left transition-colors min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_DARK,
                            borderColor: COLORS.BORDER_SUBTLE,
                            color: COLORS.TEXT_PRIMARY,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">
                                {format(new Date(myLesson.date), "M/d/yyyy")} at{" "}
                                {format(new Date(myLesson.date), "h:mm a")}
                                {hasPendingRequest && (
                                  <span
                                    className="ml-2 text-xs"
                                    style={{
                                      color: COLORS.TEXT_MUTED,
                                    }}
                                  >
                                    (Switch Request Pending)
                                  </span>
                                )}
                                {hasPendingWithTarget && !hasPendingRequest && (
                                  <span
                                    className="ml-2 text-xs"
                                    style={{
                                      color: COLORS.TEXT_MUTED,
                                    }}
                                  >
                                    (Request Pending with this client)
                                  </span>
                                )}
                              </div>
                              <div
                                className="text-sm mt-1"
                                style={{
                                  color: COLORS.TEXT_SECONDARY,
                                }}
                              >
                                {myLesson.title}
                              </div>
                            </div>
                            {createSwitchRequestMutation.isPending ? (
                              <Loader2
                                className="h-4 w-4 animate-spin"
                                style={{ color: COLORS.TEXT_MUTED }}
                              />
                            ) : isDisabled ? (
                              <CheckCircle
                                className="h-4 w-4"
                                style={{ color: COLORS.TEXT_MUTED }}
                              />
                            ) : (
                              <ArrowRightLeft
                                className="h-4 w-4"
                                style={{ color: COLORS.TEXT_SECONDARY }}
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p style={{ color: COLORS.TEXT_MUTED }}>
                      You don&apos;t have any upcoming lessons to switch.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Switch Requests Modal - fully opaque, no transparency */}
      {showSwitchRequests && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            backgroundColor: COLORS.BACKGROUND_DARK,
            pointerEvents: "auto",
          }}
          onClick={e => {
            if (e.target === e.currentTarget) {
              setShowSwitchRequests(false);
            }
          }}
        >
          <div
            className="rounded-xl border w-full max-w-md max-h-[85vh] overflow-y-auto"
            style={{
              backgroundColor: "#1c1f20",
              borderColor: COLORS.BORDER_SUBTLE,
              pointerEvents: "auto",
              position: "relative",
              zIndex: 51,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="sticky top-0 border-b px-4 py-4 flex items-center justify-between z-10"
              style={{
                backgroundColor: "#1c1f20",
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <h2
                className="text-xl font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Switch Requests
              </h2>
              <button
                type="button"
                onClick={() => setShowSwitchRequests(false)}
                className="p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                style={{ color: COLORS.TEXT_SECONDARY }}
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <MobileSwapRequests />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
