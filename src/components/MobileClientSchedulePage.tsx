"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
  Loader2,
  Home,
  Users,
  Plus,
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
        // Refetch data
        utils.clientRouter.getCoachScheduleForClient.refetch();
        utils.clientRouter.getClientLessons.refetch();
        alert("Lesson request sent successfully!");
      },
      onError: (error: any) => {
        alert(error.message || "Failed to send lesson request");
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
        return "bg-blue-500/40 text-blue-100 border-blue-400";
      case "DECLINED":
        return "bg-red-500/40 text-red-100 border-red-400";
      case "PENDING":
        return "bg-yellow-500/40 text-yellow-100 border-yellow-400";
      default:
        return "bg-blue-500/40 text-blue-100 border-blue-400";
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
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile Header */}
      <div 
        className="sticky top-0 z-50 bg-gradient-to-r from-[#2A3133] to-[#353A3A] border-b border-[#4A5A70] px-4 pb-4 shadow-lg"
        style={{ paddingTop: `calc(1rem + env(safe-area-inset-top))` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A5A70] to-[#606364] flex items-center justify-center shadow-md">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">My Schedule</h1>
              <p className="text-sm text-gray-300">View & request lessons</p>
            </div>
          </div>
          <MobileClientNavigation currentPage="schedule" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* Coach / Organization Working Hours */}
        {isInOrganization && organizationCoaches.length > 0 ? (
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#1F2426] to-[#2A3133] border border-[#4A5A70] shadow-xl space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">
                Organization Coaches&apos; Hours
              </h2>
            </div>
            <div className="space-y-2">
              {organizationCoaches.map(coach => (
                <div
                  key={coach.id}
                  className="p-3 rounded-lg border"
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#4A5A70",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${getCoachColor(
                        coach.id
                      )}`}
                    />
                    <h3 className="text-sm font-semibold text-white">
                      {coach.name || "Coach"}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-300">
                    {(coach.workingHoursStart as string) || "9:00 AM"} -{" "}
                    {(coach.workingHoursEnd as string) || "6:00 PM"}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {coach.workingDays && coach.workingDays.length > 0
                      ? coach.workingDays.join(", ")
                      : "Monday - Sunday"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#1F2426] to-[#2A3133] border border-[#4A5A70] shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">
                Coach&apos;s Working Hours
              </h2>
            </div>
            <p className="text-gray-300 text-sm">
              {workingProfile.startTime} - {workingProfile.endTime}
            </p>
            {workingProfile.customWorkingHours && (
              <p className="text-xs text-emerald-300 mt-1">
                Custom daily hours enabled
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              {workingProfile.workingDays.map((day: string) => (
                <span
                  key={day}
                  className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded text-xs"
                >
                  {day.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowSwitchRequests(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-md"
          >
            <Users className="h-4 w-4" />
            Switch Requests
          </button>
        </div>

        {/* Upcoming Lessons Preview */}
        {upcomingLessons.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1F2426] to-[#2A3133] border border-[#4A5A70] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Upcoming Lessons
                </h2>
                <p className="text-xs text-[#ABA4AA]">
                  Next {Math.min(upcomingLessons.length, 2)} scheduled sessions
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {upcomingLessonsPreview.map(lesson => (
                <div
                  key={lesson.id}
                  className="p-3 rounded-lg border border-[#4A5A70] bg-[#2A3133] flex items-center justify-between shadow-inner"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {format(new Date(lesson.date), "EEE, MMM d")}
                    </p>
                    <p className="text-xs text-[#C3BCC2]">
                      {format(new Date(lesson.date), "h:mm a")}
                    </p>
                    {lesson.title && (
                      <p className="text-xs text-[#ABA4AA] mt-1 line-clamp-1">
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
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 bg-[#4A5A70] text-[#C3BCC2] hover:bg-[#606364]"
                  >
                    View Day
                  </button>
                </div>
              ))}
            </div>
            {remainingUpcomingLessons > 0 && (
              <div className="text-center text-xs text-[#ABA4AA]">
                +{remainingUpcomingLessons} more scheduled lesson
                {remainingUpcomingLessons === 1 ? "" : "s"}
              </div>
            )}
          </div>
        )}

        {/* Calendar */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1F2426] to-[#2A3133] border border-[#4A5A70] shadow-xl">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-4 mb-6 rounded-xl bg-gradient-to-r from-[#353A3A] to-[#40454A] shadow-inner">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-3 rounded-xl bg-[#4A5A70] hover:bg-[#606364] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <h3 className="text-2xl font-bold text-white">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <button
              onClick={() => navigateMonth("next")}
              className="p-3 rounded-xl bg-[#4A5A70] hover:bg-[#606364] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>

          {scheduleAdvanceLimitDays && scheduleAdvanceLimitDays > 0 && (
            <div className="px-4 py-3 mb-4 bg-[#1F2426] border border-[#4A5A70] rounded-xl text-xs text-gray-300">
              You can request lessons up to{" "}
              <span className="font-semibold text-white">
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
                className="text-center text-sm font-bold text-[#ABA4AA] py-3 bg-[#353A3A] rounded-lg"
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
                    aspect-square flex flex-col items-center justify-between text-xs rounded-xl transition-all duration-200 relative border-2 p-1 shadow-md hover:shadow-lg overflow-hidden
                    ${
                      isToday
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400 shadow-blue-500/30 font-bold"
                        : isPast
                        ? "text-gray-500 bg-gray-700/30 border-gray-600"
                        : !isWorkingDay
                        ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
                        : isBeyondLimit
                        ? "text-gray-500 bg-gray-700/30 border-gray-600"
                        : isCurrentMonth
                        ? "text-white bg-gradient-to-br from-[#4A5A70] to-[#606364] border-[#4A5A70] hover:from-[#606364] hover:to-[#4A5A70]"
                        : "text-gray-600 bg-gradient-to-br from-gray-900/30 to-gray-800/20 border-gray-700"
                    }
                    ${
                      canOpenDay
                        ? "cursor-pointer active:scale-95"
                        : "cursor-not-allowed opacity-60"
                    }
                    ${isSelected ? "ring-2 ring-offset-1 ring-blue-300" : ""}
                  `}
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

      {/* Day Overview Modal */}
      {showDayOverviewModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl border w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div
              className="sticky top-0 border-b px-4 py-4 flex items-center justify-between"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div>
                <h2 className="text-xl font-bold text-white">
                  {format(selectedDate, "MMM d, yyyy")}
                </h2>
                <p className="text-gray-400 text-xs">
                  {(() => {
                    const hours = getWorkingHoursForDate(selectedDate);
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
                  setSelectedCoachId(null);
                  setSelectedTimeSlot(null);
                  setRequestReason("");
                }}
                className="p-2 rounded-lg transition-colors hover:bg-gray-700"
                style={{ color: "#C3BCC2" }}
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
                    <div className="text-center py-6 bg-gray-800/30 rounded-lg">
                      <Calendar className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">
                        No lessons scheduled
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Coach's Lessons */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Coach's Scheduled Lessons
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
                              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-sky-200">
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
                                  className="flex items-center justify-between p-3 rounded-lg border bg-sky-500/10 border-sky-500/20"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-sky-300 text-sm">
                                      {format(new Date(lesson.date), "h:mm a")}
                                    </div>
                                    <div className="text-xs text-sky-200">
                                      Client
                                    </div>
                                  </div>
                                  {!isPast &&
                                    upcomingLessons.length > 0 &&
                                    !hasPendingRequestWithTarget(lesson) && (
                                      <button
                                        onClick={() => {
                                          // Always show selection modal to choose which lesson to switch
                                          setSelectedSwitchLesson(lesson);
                                        }}
                                        disabled={
                                          createSwitchRequestMutation.isPending
                                        }
                                        className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
                                      <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
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
                    <div className="text-center py-6 bg-gray-800/30 rounded-lg">
                      <Users className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">
                        No other lessons scheduled
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Available Time Slots */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Available Time Slots
                  {isInOrganization && (
                    <span className="block text-xs text-[#ABA4AA] font-normal mt-1">
                      {selectedCoachId
                        ? `Coach: ${
                            getWorkingProfile(selectedCoachId).coachName
                          }`
                        : "Select a coach to view available times"}
                    </span>
                  )}
                </h3>
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
                        <div className="text-center py-6 bg-gray-800/30 rounded-lg">
                          <Clock className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">
                            No coaches are scheduled to work this day.
                          </p>
                        </div>
                      );
                    }

                    if (!effectiveCoachId || availableSlots.length === 0) {
                      return (
                        <div className="text-center py-6 bg-gray-800/30 rounded-lg">
                          <Clock className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">
                            No available time slots for{" "}
                            {activeCoachProfile.coachName}.
                          </p>
                          <div className="space-y-2 mt-3">
                            <p className="text-gray-500 text-xs">
                              Try a different coach:
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {workingCoaches.map(coach => (
                                <button
                                  key={coach.id}
                                  onClick={() => setSelectedCoachId(coach.id)}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                                    coach.id === effectiveCoachId
                                      ? "bg-sky-500/20 border-sky-500 text-sky-100"
                                      : "bg-[#2A2F2F] text-gray-200 border-[#606364] hover:bg-[#353A3A]"
                                  }`}
                                >
                                  {coach.name || "Coach"}
                                </button>
                              ))}
                            </div>
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
                              onClick={() => setSelectedCoachId(coach.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                                coach.id === effectiveCoachId
                                  ? "bg-sky-500/20 border-sky-500 text-sky-100"
                                  : "bg-[#2A2F2F] text-gray-200 border-[#606364] hover:bg-[#353A3A]"
                              }`}
                            >
                              {coach.name || "Coach"}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedTimeSlot(slot);
                              setShowRequestModal(true);
                            }}
                            className="p-2 rounded-lg border text-center transition-all duration-200 text-xs hover:bg-blue-500/20 hover:border-blue-400"
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
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-800/30 rounded-lg">
                      <Clock className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                      {beyondLimit ? (
                        <>
                          <p className="text-gray-400 text-sm">
                            This date is beyond {activeCoachProfile.coachName}
                            &apos;s scheduling window.
                          </p>
                          <p className="text-gray-500 text-xs">
                            Please choose an earlier date.
                          </p>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-gray-400 text-sm">
                            No available time slots for{" "}
                            {activeCoachProfile.coachName}.
                          </p>
                          {isInOrganization && workingCoaches.length > 0 && (
                            <div className="space-y-1">
                              {workingCoaches.map(coach => (
                                <button
                                  key={coach.id}
                                  onClick={() => setSelectedCoachId(coach.id)}
                                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 bg-[#2A2F2F] text-gray-200 border border-[#606364] hover:bg-[#353A3A]"
                                >
                                  {coach.name || "Coach"} has availability
                                </button>
                              ))}
                              {workingCoaches.length === 0 && (
                                <p className="text-gray-500 text-xs">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div
            className="relative w-full max-w-md bg-[#2A3133] border border-[#404545] rounded-xl shadow-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#404545] bg-[#404449]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <h2 className="text-lg sm:text-xl font-semibold text-white">
                    Choose Your Lesson to Switch
                  </h2>
                  <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                    Select which of your lessons you want to switch with this
                    client
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

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
              <div className="mb-6">
                <div className="p-4 rounded-lg bg-[#1F2937] border border-[#404545] mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-white">
                        Target Lesson:{" "}
                        {format(
                          new Date(selectedSwitchLesson.date),
                          "M/d/yyyy"
                        )}{" "}
                        at{" "}
                        {format(new Date(selectedSwitchLesson.date), "h:mm a")}
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {anonymizeLessonTitle(
                          selectedSwitchLesson.title,
                          selectedSwitchLesson.clientId
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-4">
                  Your Available Lessons:
                </h3>

                {isLoadingSwitchRequests ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400">Loading lesson status...</p>
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
                          onClick={() => {
                            if (!isDisabled) {
                              createSwitchRequestMutation.mutate({
                                targetEventId: selectedSwitchLesson.id,
                                requesterEventId: myLesson.id,
                              });
                            }
                          }}
                          disabled={isDisabled}
                          className={`w-full p-4 rounded-lg border text-left transition-colors ${
                            isDisabled
                              ? "opacity-50 cursor-not-allowed bg-[#1F2937] border-[#404545]"
                              : "bg-[#2A3133] border-[#404545] hover:border-[#4A5153]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-white">
                                {format(new Date(myLesson.date), "M/d/yyyy")} at{" "}
                                {format(new Date(myLesson.date), "h:mm a")}
                                {hasPendingRequest && (
                                  <span className="ml-2 text-xs text-gray-400">
                                    (Switch Request Pending)
                                  </span>
                                )}
                                {hasPendingWithTarget && !hasPendingRequest && (
                                  <span className="ml-2 text-xs text-gray-400">
                                    (Request Pending with this client)
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-300 mt-1">
                                {myLesson.title}
                              </div>
                            </div>
                            {createSwitchRequestMutation.isPending ? (
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
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-gray-700/30 w-fit mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400">
                      You don't have any upcoming lessons to switch.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
