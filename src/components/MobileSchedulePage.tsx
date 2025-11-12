"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Settings,
  X,
  RefreshCw,
  Ban,
} from "lucide-react";
import WorkingHoursModal from "./WorkingHoursModal";
import BlockedTimesModal from "./BlockedTimesModal";
import AddTimeModal from "./AddTimeModal";
import MobileNavigation from "./MobileNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";
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
  formatDateTimeInUserTimezone,
  getUserTimezone,
} from "@/lib/timezone-utils";

export default function MobileSchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showBlockedTimesModal, setShowBlockedTimesModal] = useState(false);
  const [showAddTimeModal, setShowAddTimeModal] = useState(false);
  const [showDayOverviewModal, setShowDayOverviewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [scheduleForm, setScheduleForm] = useState({
    clientId: "",
    time: "",
    date: "",
  });
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showAllPendingRequests, setShowAllPendingRequests] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch coach's schedule for the current month and adjacent months
  const { data: coachSchedule = [] } =
    trpc.scheduling.getCoachSchedule.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  // Fetch coach's schedule for previous month (for cross-month days)
  const { data: prevMonthSchedule = [] } =
    trpc.scheduling.getCoachSchedule.useQuery({
      month: currentMonth.getMonth() === 0 ? 11 : currentMonth.getMonth() - 1,
      year:
        currentMonth.getMonth() === 0
          ? currentMonth.getFullYear() - 1
          : currentMonth.getFullYear(),
    });

  // Fetch coach's schedule for next month (for cross-month days)
  const { data: nextMonthSchedule = [] } =
    trpc.scheduling.getCoachSchedule.useQuery({
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

  // Fetch blocked times for the current month
  const { data: blockedTimes = [] } =
    trpc.blockedTimes.getBlockedTimesForSchedule.useQuery({
      startDate: startOfMonth(currentMonth).toISOString(),
      endDate: endOfMonth(currentMonth).toISOString(),
    });

  // Fetch coach's upcoming lessons
  const { data: upcomingLessons = [] } =
    trpc.scheduling.getCoachUpcomingLessons.useQuery();

  // Fetch coach's profile for working hours
  const { data: coachProfile } = trpc.user.getProfile.useQuery();

  // Fetch coach's active clients
  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const searchLower = clientSearch.toLowerCase();
    return clients.filter((client: any) => {
      return (
        client.name?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [clients, clientSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    };

    if (showClientDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showClientDropdown]);

  // Fetch pending schedule requests
  const {
    data: pendingRequests = [],
    isLoading: pendingRequestsLoading,
    refetch: refetchPendingRequests,
  } = trpc.clientRouter.getPendingScheduleRequests.useQuery(undefined, {
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const utils = trpc.useUtils();

  const scheduleLessonMutation = trpc.scheduling.scheduleLesson.useMutation({
    onSuccess: () => {
      utils.scheduling.getCoachSchedule.invalidate();
      utils.scheduling.getCoachUpcomingLessons.invalidate();
      setShowDayOverviewModal(false);
      setScheduleForm({ clientId: "", time: "", date: "" });
      setSelectedDate(null);
      setSelectedTimeSlot("");
      setClientSearch("");
    },
    onError: error => {
      alert(`Error scheduling lesson: ${error.message}`);
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
    setCurrentMonth(
      direction === "prev"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1)
    );
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

  const getLessonsForDate = (date: Date) => {
    const now = new Date();
    const lessons = coachSchedule.filter((lesson: { date: string }) => {
      const lessonDate = new Date(lesson.date);
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
      const isFuture = lessonDate > now;
      return isSame && isFuture;
    });
    return lessons;
  };

  const getAllLessonsForDate = (date: Date) => {
    const lessons = allCoachSchedule.filter((lesson: { date: string }) => {
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
    setSelectedDate(date);
    setScheduleForm({
      clientId: "",
      time: "",
      date: format(date, "yyyy-MM-dd"),
    });
    setSelectedTimeSlot("");
    setClientSearch("");
    setShowDayOverviewModal(true);
  };

  const handleDeleteLesson = (lessonId: string, lessonTitle: string) => {
    if (confirm(`Are you sure you want to delete "${lessonTitle}"?`)) {
      deleteLessonMutation.mutate({ lessonId: lessonId });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-[#2A3133] border-b border-[#606364] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Schedule</h1>
              <p className="text-xs text-gray-400">
                Manage lessons & availability
              </p>
            </div>
          </div>
          <MobileNavigation currentPage="schedule" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setShowBlockedTimesModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium text-xs transition-all duration-200"
            style={{ backgroundColor: "#b76e79", color: "#FFFFFF" }}
          >
            <Ban className="w-4 h-4" />
            <span className="hidden sm:inline">Block Times</span>
            <span className="sm:hidden">Block</span>
          </button>
          <button
            onClick={() => setShowAddTimeModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium text-xs transition-all duration-200"
            style={{ backgroundColor: "#5a7fa4", color: "#FFFFFF" }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Time</span>
            <span className="sm:hidden">Add</span>
          </button>
          <button
            onClick={() => setShowWorkingHoursModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium text-xs transition-all duration-200"
            style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Working Hours</span>
            <span className="sm:hidden">Hours</span>
          </button>
        </div>

        {/* Pending Requests Summary */}
        <div
          className="p-3 rounded-lg border flex items-center justify-between"
          style={{ backgroundColor: "#1F2426", borderColor: "#FFA50040" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-400/30 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-orange-300" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Pending Requests
              </p>
              <p className="text-lg font-semibold text-orange-100">
                {pendingRequestsLoading ? "Loading…" : pendingRequests.length}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetchPendingRequests()}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border border-blue-500/40 text-blue-200 hover:bg-blue-500/10 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Today's Overview - Always Visible */}
          {(() => {
            const today = new Date();
            const todaysLessons = getLessonsForDate(today);
            return todaysLessons.length > 0 ? (
              <div
                className="p-4 rounded-lg border-2"
                style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-white">
                    Today's Lessons ({todaysLessons.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {todaysLessons.map((lesson: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-emerald-300">
                          {formatTimeInUserTimezone(lesson.date)}
                        </div>
                        <div className="text-sm text-emerald-200">
                          {lesson.client?.name ||
                            lesson.client?.email ||
                            "Client"}
                        </div>
                      </div>
                      <div className="text-xs text-emerald-400">
                        {lesson.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Working Hours Display */}
          <div
            className="p-4 rounded-lg border-2"
            style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">
                Working Hours
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

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div
              className="p-4 rounded-lg border-2"
              style={{ backgroundColor: "#1F2426", borderColor: "#FFA500" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <h2 className="text-lg font-semibold text-white">
                  Pending Requests ({pendingRequests.length})
                </h2>
              </div>
              <div className="space-y-3">
                {(showAllPendingRequests
                  ? pendingRequests
                  : pendingRequests.slice(0, 3)
                ).map((request: any) => (
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
                        style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
                      >
                        {approveScheduleRequestMutation.isPending
                          ? "Approving..."
                          : "Approve"}
                      </button>
                      <button
                        onClick={() =>
                          rejectScheduleRequestMutation.mutate({
                            eventId: request.id,
                            reason: "",
                          })
                        }
                        disabled={rejectScheduleRequestMutation.isPending}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
                      >
                        {rejectScheduleRequestMutation.isPending
                          ? "Rejecting..."
                          : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {pendingRequests.length > 3 && (
                <div className="mt-3">
                  <button
                    onClick={() =>
                      setShowAllPendingRequests(!showAllPendingRequests)
                    }
                    className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: showAllPendingRequests
                        ? "#4A5A70"
                        : "#FFA500",
                      color: "#FFFFFF",
                    }}
                  >
                    {showAllPendingRequests
                      ? "Show Less"
                      : `View All ${pendingRequests.length} Requests`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Lessons */}
          {upcomingLessons.length > 0 && (
            <div
              className="p-4 rounded-lg border-2"
              style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-sky-400" />
                <h2 className="text-lg font-semibold text-white">
                  Upcoming Lessons ({upcomingLessons.length})
                </h2>
              </div>
              <div className="space-y-2">
                {upcomingLessons
                  .slice(0, 5)
                  .map((lesson: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded bg-sky-500/10 border border-sky-500/20"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sky-300">
                          {formatDateTimeInUserTimezone(lesson.date)}
                        </div>
                        <div className="text-sm text-sky-200">
                          {lesson.client?.name ||
                            lesson.client?.email ||
                            "Client"}
                        </div>
                      </div>
                      <div className="text-xs text-sky-400">{lesson.title}</div>
                    </div>
                  ))}
                {upcomingLessons.length > 5 && (
                  <div className="text-center text-sm text-gray-400 py-2">
                    +{upcomingLessons.length - 5} more lessons
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Month Navigation */}
          <div
            className="flex items-center justify-between p-4 rounded-lg border-2"
            style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
          >
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

          {/* Mobile Calendar */}
          <div
            className="p-4 rounded-lg border-2"
            style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
          >
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-gray-400 py-2"
                >
                  {day.slice(0, 1)}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                const lessonsForDay = getLessonsForDate(day);
                const hasLessons = lessonsForDay.length > 0;
                const pendingForDay = pendingRequests.filter(
                  (request: { date: string }) =>
                    isSameDay(new Date(request.date), day)
                );
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
                    aspect-square flex flex-col items-center justify-center text-xs rounded-lg transition-all duration-200 relative min-h-[44px] border
                    ${
                      isPast
                        ? "cursor-not-allowed opacity-40"
                        : "cursor-pointer active:scale-95"
                    }
                    ${
                      isToday
                        ? "bg-blue-500 text-white border-blue-400 shadow-lg font-bold"
                        : isPast
                        ? "text-gray-500 bg-gray-700/20 border-gray-600"
                        : isCurrentMonth
                        ? isWorkingDay
                          ? "text-white bg-gray-800/60 border-gray-600 hover:bg-blue-500/20 hover:border-blue-400"
                          : "text-orange-400 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 hover:border-orange-400"
                        : "text-gray-600 bg-gray-900/30 border-gray-700"
                    }
                  `}
                  >
                    {/* Date Number */}
                    <div className="font-bold text-sm">{format(day, "d")}</div>

                    {/* Lesson Indicators */}
                    {hasLessons && (
                      <div className="flex justify-center items-center mt-1">
                        <div className="flex gap-0.5">
                          {lessonsForDay
                            .slice(0, 2)
                            .map((lesson: any, index: number) => (
                              <div
                                key={index}
                                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                title={`${format(
                                  new Date(lesson.date),
                                  "h:mm a"
                                )} - ${
                                  lesson.client?.name ||
                                  lesson.client?.email ||
                                  "Client"
                                }`}
                              />
                            ))}
                          {lessonsForDay.length > 2 && (
                            <div
                              className="w-1.5 h-1.5 rounded-full bg-emerald-300"
                              title={`+${lessonsForDay.length - 2} more`}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pending request indicator */}
                    {hasPending && (
                      <div className="mt-1">
                        <div
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-200"
                          title={`${pendingForDay.length} pending request${
                            pendingForDay.length === 1 ? "" : "s"
                          }`}
                        >
                          {pendingForDay.length}
                        </div>
                      </div>
                    )}

                    {/* Non-working day indicator */}
                    {!isWorkingDay &&
                      isCurrentMonth &&
                      !isPast &&
                      !hasLessons && (
                        <div className="w-1 h-1 bg-orange-500 rounded-full mt-1" />
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
              className="rounded-2xl shadow-xl border w-full max-w-md max-h-[85vh] overflow-y-auto"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div
                className="sticky top-0 border-b px-4 py-4 flex items-center justify-between z-10"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div>
                  <h2 className="text-xl font-bold text-white">
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
                      return (
                        <p className="text-orange-300 text-xs mt-1">
                          ⚠️ Not a normal working day
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
                <button
                  onClick={() => {
                    setShowDayOverviewModal(false);
                    setSelectedDate(null);
                    setSelectedTimeSlot("");
                    setClientSearch("");
                    setScheduleForm({ clientId: "", time: "", date: "" });
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4">
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
                              className={`flex items-center justify-between p-3 rounded-lg border group ${
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
                                  {formatTimeInUserTimezone(lesson.date)}
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
                                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-red-500/20 active:bg-red-500/20 text-red-400 hover:text-red-300 active:text-red-300"
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
                      <div className="text-center py-6">
                        <Calendar className="h-10 w-10 text-gray-500 mx-auto mb-2" />
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

                    // Generate time slots for the day
                    const generateTimeSlotsForDay = (date: Date) => {
                      const startTime =
                        coachProfile?.workingHours?.startTime || "9:00 AM";
                      const endTime =
                        coachProfile?.workingHours?.endTime || "6:00 PM";
                      const interval =
                        coachProfile?.workingHours?.timeSlotInterval || 60;
                      const slots = [];

                      // Get blocked times for this date
                      const dayBlockedTimes = getBlockedTimesForDate(date);

                      // Helper function to check if a time slot conflicts with blocked times
                      const isTimeSlotBlocked = (slotTime: string) => {
                        return dayBlockedTimes.some((blockedTime: any) => {
                          if (blockedTime.isAllDay) return true;

                          const blockedStart = new Date(blockedTime.startTime);
                          const blockedEnd = new Date(blockedTime.endTime);

                          // Parse the slot time (e.g., "2:00 PM")
                          const slotMatch = slotTime.match(
                            /(\d+):(\d+)\s*(AM|PM)/i
                          );
                          if (!slotMatch) return false;

                          const [, hour, minute, period] = slotMatch;
                          let hour24 = parseInt(hour);
                          if (period.toUpperCase() === "PM" && hour24 !== 12)
                            hour24 += 12;
                          if (period.toUpperCase() === "AM" && hour24 === 12)
                            hour24 = 0;

                          const slotDate = new Date(date);
                          slotDate.setHours(hour24, parseInt(minute), 0, 0);

                          return (
                            slotDate >= blockedStart && slotDate < blockedEnd
                          );
                        });
                      };

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
                          const isBlocked = isTimeSlotBlocked(timeSlot);
                          slots.push({
                            time: timeSlot,
                            isBlocked: isBlocked,
                            blockedReason: isBlocked
                              ? dayBlockedTimes.find((bt: any) => {
                                  if (bt.isAllDay) return true;
                                  const blockedStart = new Date(bt.startTime);
                                  const blockedEnd = new Date(bt.endTime);
                                  const slotDate = new Date(date);
                                  slotDate.setHours(
                                    hour24,
                                    parseInt(minuteStr),
                                    0,
                                    0
                                  );
                                  return (
                                    slotDate >= blockedStart &&
                                    slotDate < blockedEnd
                                  );
                                })?.title
                              : null,
                          });
                        }
                      }

                      return slots;
                    };

                    const availableSlots =
                      generateTimeSlotsForDay(selectedDate);

                    return availableSlots.length > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((slot: any, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedTimeSlot(slot.time)}
                              className={`p-2.5 rounded-lg border text-center transition-all duration-200 text-sm ${
                                selectedTimeSlot === slot.time
                                  ? "bg-sky-500 border-sky-400 text-white"
                                  : "hover:bg-sky-500/10 hover:border-sky-500/30"
                              }`}
                              style={{
                                backgroundColor:
                                  selectedTimeSlot === slot.time
                                    ? "#0EA5E9"
                                    : "#2A2F2F",
                                borderColor: slot.isBlocked
                                  ? "#EF4444"
                                  : selectedTimeSlot === slot.time
                                  ? "#0EA5E9"
                                  : "#606364",
                                color: slot.isBlocked ? "#EF4444" : "#FFFFFF",
                              }}
                              title={
                                slot.isBlocked
                                  ? `Blocked: ${slot.blockedReason} (Coach can override)`
                                  : ""
                              }
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>

                        {/* Schedule Lesson Section */}
                        {selectedTimeSlot && (
                          <div
                            className="mt-4 pt-4 border-t"
                            style={{ borderColor: "#606364" }}
                          >
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-gray-400 mb-2">
                                  Selected time:{" "}
                                  <span className="text-white font-medium">
                                    {selectedTimeSlot}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-500 mb-2">
                                  Choose a client to schedule the lesson
                                </p>
                              </div>
                              <div className="relative" ref={dropdownRef}>
                                <input
                                  type="text"
                                  placeholder="Search for a client..."
                                  value={clientSearch}
                                  onChange={e => {
                                    setClientSearch(e.target.value);
                                    setShowClientDropdown(true);
                                  }}
                                  onFocus={() => setShowClientDropdown(true)}
                                  className="w-full p-2.5 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border"
                                  style={{
                                    backgroundColor: "#2A2F2F",
                                    borderColor: "#606364",
                                  }}
                                />

                                {/* Dropdown */}
                                {showClientDropdown && (
                                  <div
                                    className="absolute z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-lg w-full"
                                    style={{
                                      backgroundColor: "#353A3A",
                                      borderColor: "#606364",
                                    }}
                                  >
                                    {filteredClients.length > 0 ? (
                                      filteredClients.map((client: any) => (
                                        <button
                                          key={client.id}
                                          type="button"
                                          onClick={() => {
                                            setScheduleForm({
                                              ...scheduleForm,
                                              clientId: client.id,
                                            });
                                            setClientSearch(
                                              client.name || client.email || ""
                                            );
                                            setShowClientDropdown(false);
                                          }}
                                          className="w-full px-3 py-2 text-left hover:bg-[#4A5A70] transition-colors flex items-center gap-3"
                                          style={{ color: "#C3BCC2" }}
                                        >
                                          <div className="flex-1">
                                            <div className="font-medium text-sm">
                                              {client.name || "Unnamed"}
                                            </div>
                                            {client.email && (
                                              <div className="text-xs opacity-70">
                                                {client.email}
                                              </div>
                                            )}
                                          </div>
                                        </button>
                                      ))
                                    ) : (
                                      <div
                                        className="px-3 py-2 text-center text-sm"
                                        style={{ color: "#ABA4AA" }}
                                      >
                                        No clients found
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
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
                                className="w-full px-4 py-2.5 hover:opacity-80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                                style={{
                                  backgroundColor: scheduleForm.clientId
                                    ? "#10B981"
                                    : "#4A5A70",
                                }}
                              >
                                {scheduleLessonMutation.isPending
                                  ? "Scheduling..."
                                  : "Schedule Lesson"}
                              </button>
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
              </div>
            </div>
          </div>
        )}

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

        {/* Blocked Times Modal */}
        <BlockedTimesModal
          isOpen={showBlockedTimesModal}
          onClose={() => setShowBlockedTimesModal(false)}
          selectedDate={selectedDate || undefined}
          month={currentMonth.getMonth()}
          year={currentMonth.getFullYear()}
        />

        {/* Add Time Modal */}
        <AddTimeModal
          isOpen={showAddTimeModal}
          onClose={() => setShowAddTimeModal(false)}
          selectedDate={selectedDate || undefined}
          clients={clients}
        />
      </div>
      <MobileBottomNavigation />
    </div>
  );
}
