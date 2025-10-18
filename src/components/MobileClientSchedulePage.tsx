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

  const handleDateClick = (day: Date) => {
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

  const generateAvailableTimeSlots = (date: Date) => {
    const startTime = coachProfile?.workingHours?.startTime || "9:00 AM";
    const endTime = coachProfile?.workingHours?.endTime || "6:00 PM";
    const interval = coachProfile?.workingHours?.timeSlotInterval || 60;
    const slots = [];

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

    const existingLessons = getLessonsForDate(date);
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#2A3133] to-[#353A3A] border-b border-[#4A5A70] px-4 py-4 shadow-lg">
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
        {/* Coach's Working Hours */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#1F2426] to-[#2A3133] border border-[#4A5A70] shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg font-semibold text-white">
              Coach's Working Hours
            </h2>
          </div>
          <p className="text-gray-300 text-sm">
            {coachProfile?.workingHours?.startTime || "9:00 AM"} -{" "}
            {coachProfile?.workingHours?.endTime || "6:00 PM"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(
              coachProfile?.workingHours?.workingDays || [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ]
            ).map((day: string) => (
              <span
                key={day}
                className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded text-xs"
              >
                {day.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>

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
          <div className="grid grid-cols-7 gap-2">
            {getCalendarDays().map(day => {
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isPast = day < new Date();
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

              const availableSlotsCount =
                !isPast && isWorkingDay
                  ? generateAvailableTimeSlots(day).length
                  : 0;

              return (
                <div
                  key={day.toISOString()}
                  onClick={() =>
                    !isPast && isWorkingDay && handleDateClick(day)
                  }
                  className={`
                    aspect-square flex flex-col items-center justify-center text-xs rounded-xl transition-all duration-200 relative border-2 cursor-pointer active:scale-95 p-1 shadow-md hover:shadow-lg overflow-hidden
                    ${
                      isPast || !isWorkingDay
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }
                    ${
                      isToday
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400 shadow-blue-500/30 font-bold"
                        : isPast
                        ? "text-gray-500 bg-gray-700/30 border-gray-600"
                        : !isWorkingDay
                        ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
                        : isCurrentMonth
                        ? "text-white bg-gradient-to-br from-[#4A5A70] to-[#606364] border-[#4A5A70] hover:from-[#606364] hover:to-[#4A5A70]"
                        : "text-gray-600 bg-gradient-to-br from-gray-900/30 to-gray-800/20 border-gray-700"
                    }
                  `}
                >
                  <div className="font-bold text-xs flex items-center justify-between w-full">
                    <span>{format(day, "d")}</span>
                    {availableSlotsCount > 0 && (
                      <div className="w-3 h-3 rounded-full bg-green-500/40 border border-green-400 flex items-center justify-center">
                        <span className="text-[6px] font-bold text-white">
                          {availableSlotsCount}
                        </span>
                      </div>
                    )}
                  </div>
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
                  {coachProfile?.workingHours?.startTime || "9:00 AM"} -{" "}
                  {coachProfile?.workingHours?.endTime || "6:00 PM"}
                </p>
              </div>
              <button
                onClick={() => setShowDayOverviewModal(false)}
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

                  return otherClientLessons.length > 0 ? (
                    <div className="space-y-2">
                      {otherClientLessons.map((lesson: any, index: number) => {
                        const isPast = new Date(lesson.date) < new Date();
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg border bg-sky-500/10 border-sky-500/20"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sky-300 text-sm">
                                {format(new Date(lesson.date), "h:mm a")}
                              </div>
                              <div className="text-xs text-sky-200">Client</div>
                            </div>
                            {!isPast &&
                              upcomingLessons.length > 0 &&
                              !hasPendingRequestWithTarget(lesson) && (
                                <button
                                  onClick={() =>
                                    setSelectedSwitchLesson(lesson)
                                  }
                                  className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded-lg text-xs"
                                >
                                  <ArrowRightLeft className="h-3 w-3" />
                                  Switch
                                </button>
                              )}
                            {!isPast && hasPendingRequestWithTarget(lesson) && (
                              <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
                                Pending
                              </span>
                            )}
                          </div>
                        );
                      })}
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
                </h3>
                {(() => {
                  const availableSlots =
                    generateAvailableTimeSlots(selectedDate);
                  return availableSlots.length > 0 ? (
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
                  ) : (
                    <div className="text-center py-6 bg-gray-800/30 rounded-lg">
                      <Clock className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">
                        No available time slots
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Switch Requests Modal */}
      {showSwitchRequests && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "#2A3133" }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: "#C3BCC2" }}>
                  Time Switch Requests
                </h2>
                <button
                  onClick={() => setShowSwitchRequests(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <MobileSwapRequests />
            </div>
          </div>
        </div>
      )}

      {/* Lesson Selection Modal for Switch */}
      {selectedSwitchLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl border p-4 w-full max-w-md max-h-[80vh] overflow-y-auto"
            style={{
              backgroundColor: "#353A3A",
              borderColor: "#606364",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Choose Your Lesson to Switch
                </h2>
                <p className="text-gray-400 text-xs">
                  Select which of your lessons you want to switch
                </p>
              </div>
              <button
                onClick={() => setSelectedSwitchLesson(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="font-medium text-blue-300 text-sm">
                      Target:{" "}
                      {format(new Date(selectedSwitchLesson.date), "MMM d")} at{" "}
                      {format(new Date(selectedSwitchLesson.date), "h:mm a")}
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-white mb-2">
                Your Available Lessons:
              </h3>

              {isLoadingSwitchRequests ? (
                <div className="text-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-xs">Loading...</p>
                </div>
              ) : upcomingLessons.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
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
                        className={`w-full p-3 rounded-lg border text-left transition-all duration-200 text-xs ${
                          isDisabled
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-sky-500/10 hover:border-sky-500/30"
                        }`}
                        style={{
                          backgroundColor: isDisabled ? "#1F2937" : "#2A2F2F",
                          borderColor: isDisabled ? "#4B5563" : "#606364",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              {format(new Date(myLesson.date), "MMM d")} at{" "}
                              {format(new Date(myLesson.date), "h:mm a")}
                              {hasPendingRequest && (
                                <span className="ml-1 text-yellow-400">
                                  (Pending)
                                </span>
                              )}
                            </p>
                            <p className="text-gray-300">{myLesson.title}</p>
                          </div>
                          {createSwitchRequestMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                          ) : (
                            <ArrowRightLeft className="h-4 w-4 text-blue-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-800/30 rounded-lg">
                  <Calendar className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-xs">
                    No lessons available to switch
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedSwitchLesson(null)}
              className="w-full px-4 py-2 border rounded-lg text-sm"
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
      )}

      {/* Lesson Request Modal */}
      {showRequestModal && selectedDate && selectedTimeSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl shadow-xl border w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div
              className="sticky top-0 border-b px-4 py-4 flex items-center justify-between"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div>
                <h2 className="text-xl font-bold text-white">Request Lesson</h2>
                <p className="text-gray-400 text-xs">
                  {format(selectedDate, "MMM d, yyyy")} at {selectedTimeSlot}
                </p>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 rounded-lg transition-colors hover:bg-gray-700"
                style={{ color: "#C3BCC2" }}
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Reason for lesson request (optional)
                </label>
                <textarea
                  value={requestReason}
                  onChange={e => setRequestReason(e.target.value)}
                  placeholder="Any specific goals or areas you'd like to focus on..."
                  className="w-full p-3 rounded-lg border text-white placeholder-gray-400 bg-[#2A2F2F] border-[#606364] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 bg-[#4A5A70] hover:bg-[#606364] text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedDate && selectedTimeSlot) {
                      // Capture user's timezone
                      const timeZone =
                        Intl.DateTimeFormat().resolvedOptions().timeZone ||
                        "America/New_York";

                      // Format date as YYYY-MM-DD to match desktop version
                      const formattedDate = format(selectedDate, "yyyy-MM-dd");

                      requestScheduleChangeMutation.mutate({
                        requestedDate: formattedDate,
                        requestedTime: selectedTimeSlot,
                        reason: requestReason,
                        timeZone: timeZone,
                      });
                    }
                  }}
                  disabled={requestScheduleChangeMutation.isPending}
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requestScheduleChangeMutation.isPending
                    ? "Sending..."
                    : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <MobileClientBottomNavigation />
    </div>
  );
}
