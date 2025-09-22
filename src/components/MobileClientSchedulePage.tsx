"use client";

import { useState } from "react";
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
  X,
} from "lucide-react";
import CustomSelect from "./ui/CustomSelect";
import ClientSidebar from "./ClientSidebar";
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

export default function MobileClientSchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDayOverviewModal, setShowDayOverviewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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

  // Fetch client's upcoming lessons
  const { data: upcomingLessons = [] } =
    trpc.clientRouter.getClientUpcomingLessons.useQuery();

  // Fetch coach's profile for working hours
  const { data: coachProfile } = trpc.clientRouter.getCoachProfile.useQuery();

  const utils = trpc.useUtils();
  const requestScheduleChangeMutation =
    trpc.clientRouter.requestScheduleChange.useMutation({
      onSuccess: () => {
        utils.clientRouter.getCoachScheduleForClient.invalidate();
        utils.clientRouter.getClientLessons.invalidate();
        utils.clientRouter.getClientUpcomingLessons.invalidate();
        setShowRequestModal(false);
        setRequestForm({ date: "", time: "", reason: "" });
        setSelectedDate(null);
      },
      onError: error => {
        alert(`Error requesting schedule change: ${error.message}`);
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

  const getClientLessonsForDate = (date: Date) => {
    const lessons = clientLessons.filter((lesson: { date: string }) => {
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
      return isSame;
    });

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

    requestScheduleChangeMutation.mutate({
      requestedDate: requestForm.date,
      requestedTime: requestForm.time,
      reason: requestForm.reason,
    });
  };

  // Generate time slots based on coach's working hours
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

    if (requestForm.date) {
      const selectedDate = new Date(requestForm.date);
      const dayName = format(selectedDate, "EEEE");
      if (!workingDays.includes(dayName)) {
        return [];
      }
    }

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
    const isToday =
      requestForm.date && format(now, "yyyy-MM-dd") === requestForm.date;
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

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
      slots.push(`${displayHour}:${minuteStr} ${period}`);
    }

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
    <ClientSidebar>
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        {/* Mobile Header */}
        <div
          className="sticky top-0 z-40 px-4 py-4 border-b"
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "#C3BCC2" }}>
                  My Schedule
                </h1>
                <p className="text-sm" style={{ color: "#ABA4AA" }}>
                  View availability & request changes
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="p-3 rounded-lg transition-all duration-200"
              style={{ backgroundColor: "#10B981" }}
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Coach's Working Hours */}
          <div
            className="p-4 rounded-lg border-2"
            style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">
                Coach's Working Hours
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

          {/* My Lessons Today */}
          {(() => {
            const today = new Date();
            const myTodaysLessons = getClientLessonsForDate(today);
            return myTodaysLessons.length > 0 ? (
              <div
                className="p-4 rounded-lg border-2"
                style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-white">
                    My Lessons Today ({myTodaysLessons.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {myTodaysLessons.map((lesson: any, index: number) => (
                    <div
                      key={index}
                      className={`rounded p-3 border-2 ${getStatusColor(
                        lesson.status
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">
                            {format(new Date(lesson.date), "h:mm a")}
                          </div>
                          <div className="text-xs opacity-80">
                            {lesson.title}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(lesson.status)}
                          <div className="text-xs">{lesson.status}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

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
                          {format(new Date(lesson.date), "MMM d, h:mm a")}
                        </div>
                        <div className="text-sm text-sky-200">
                          {lesson.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(lesson.status)}
                        <div className="text-xs text-sky-400">
                          {lesson.status}
                        </div>
                      </div>
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

          {/* My Schedule Requests */}
          {(() => {
            // Get all lessons with pending/declined status
            const allLessons = [...upcomingLessons, ...clientLessons];
            const scheduleRequests = allLessons.filter(
              lesson =>
                lesson.status === "PENDING" || lesson.status === "DECLINED"
            );

            return scheduleRequests.length > 0 ? (
              <div
                className="p-4 rounded-lg border-2"
                style={{ backgroundColor: "#1F2426", borderColor: "#FFA500" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  <h2 className="text-lg font-semibold text-white">
                    My Schedule Requests ({scheduleRequests.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {scheduleRequests
                    .slice(0, 3)
                    .map((request: any, index: number) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded border-2 ${getStatusColor(
                          request.status
                        )}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {format(new Date(request.date), "MMM d, h:mm a")}
                          </div>
                          <div className="text-sm opacity-80">
                            {request.title}
                          </div>
                          {request.reason && (
                            <div className="text-xs opacity-70 mt-1">
                              Reason: {request.reason}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <div className="text-xs">{request.status}</div>
                        </div>
                      </div>
                    ))}
                  {scheduleRequests.length > 3 && (
                    <div className="text-center text-sm text-orange-300 py-2">
                      +{scheduleRequests.length - 3} more requests
                    </div>
                  )}
                </div>
              </div>
            ) : null;
          })()}

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
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                <div
                  key={day}
                  className="text-center text-sm font-bold text-blue-300 py-3 border-b-2 border-blue-500/30"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                const coachLessonsForDay = getLessonsForDate(day);
                const myLessonsForDay = getClientLessonsForDate(day);

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
                    p-2 text-sm rounded-lg transition-all duration-200 relative min-h-[50px] border-2 overflow-hidden
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
                    <div className="font-bold text-sm mb-1 flex items-center justify-between">
                      <span>{format(day, "d")}</span>
                      {!isWorkingDay && isCurrentMonth && !isPast && (
                        <div
                          className="w-1.5 h-1.5 bg-orange-500 rounded-full"
                          title="Non-working day"
                        />
                      )}
                    </div>
                    {hasMyLessons && (
                      <div className="flex justify-center items-center mt-1">
                        <div className="flex flex-wrap gap-0.5 justify-center">
                          {myLessonsForDay
                            .filter(lesson => lesson.status !== "CONFIRMED")
                            .slice(0, 2)
                            .map((lesson: any, index: number) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${
                                  lesson.status === "PENDING"
                                    ? "bg-yellow-400"
                                    : lesson.status === "DECLINED"
                                    ? "bg-red-400"
                                    : "bg-blue-400"
                                }`}
                                title={`${format(
                                  new Date(lesson.date),
                                  "h:mm a"
                                )} - ${lesson.title} (${lesson.status})`}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                    {hasCoachLessons && !hasMyLessons && (
                      <div className="flex justify-center items-center mt-1">
                        <div className="flex flex-wrap gap-0.5 justify-center">
                          {coachLessonsForDay
                            .slice(0, 2)
                            .map((lesson: any, index: number) => (
                              <div
                                key={index}
                                className="w-2 h-2 rounded-full bg-sky-400"
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
                        </div>
                      </div>
                    )}
                    {!hasMyLessons &&
                      !hasCoachLessons &&
                      isCurrentMonth &&
                      !isPast &&
                      isWorkingDay && (
                        <div className="flex justify-center items-center mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 opacity-50" />
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Request Schedule Change Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className="rounded-2xl shadow-xl border w-full max-w-md max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div
                className="sticky top-0 border-b px-4 py-4 flex items-center justify-between"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <h2 className="text-xl font-bold text-white">
                  Request Schedule Change
                </h2>
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestForm({ date: "", time: "", reason: "" });
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={requestForm.date}
                    onChange={e =>
                      setRequestForm({ ...requestForm, date: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border text-white"
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
                  <CustomSelect
                    value={requestForm.time}
                    onChange={value =>
                      setRequestForm({ ...requestForm, time: value })
                    }
                    options={[
                      { value: "", label: "Select a time" },
                      ...timeSlots.map(slot => ({
                        value: slot,
                        label: slot,
                      })),
                    ]}
                    placeholder="Select a time"
                    style={{
                      backgroundColor: "#2A2F2F",
                      borderColor: "#606364",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={requestForm.reason}
                    onChange={e =>
                      setRequestForm({ ...requestForm, reason: e.target.value })
                    }
                    placeholder="Why do you need this schedule change?"
                    rows={3}
                    className="w-full p-3 rounded-lg border text-white"
                    style={{
                      backgroundColor: "#2A2F2F",
                      borderColor: "#606364",
                    }}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setRequestForm({ date: "", time: "", reason: "" });
                    }}
                    className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border"
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
                    className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
                  >
                    {requestScheduleChangeMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Requesting...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Request Change
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day Overview Modal */}
        {showDayOverviewModal && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className="rounded-2xl shadow-xl border w-full max-w-md max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div
                className="sticky top-0 border-b px-4 py-4 flex items-center justify-between"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Coach's Hours:{" "}
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
              <div className="p-4 space-y-4">
                {/* My Lessons */}
                {(() => {
                  const myDayLessons = getClientLessonsForDate(selectedDate);
                  return myDayLessons.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">
                        My Lessons
                      </h3>
                      <div className="space-y-2">
                        {myDayLessons.map((lesson: any, index: number) => (
                          <div
                            key={index}
                            className={`rounded p-3 border-2 ${getStatusColor(
                              lesson.status
                            )}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">
                                  {format(new Date(lesson.date), "h:mm a")}
                                </div>
                                <div className="text-xs opacity-80">
                                  {lesson.title}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(lesson.status)}
                                <div className="text-xs">{lesson.status}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Coach's Lessons */}
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
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Coach's Other Lessons
                      </h3>
                      <div className="space-y-2">
                        {otherClientLessons.map(
                          (lesson: any, index: number) => (
                            <div
                              key={index}
                              className="bg-sky-500/10 rounded p-3 border border-sky-500/20"
                            >
                              <div className="text-sm font-medium text-sky-300">
                                {format(new Date(lesson.date), "h:mm a")}
                              </div>
                              <div className="text-xs text-sky-200">
                                {lesson.client?.name ||
                                  lesson.client?.email ||
                                  "Client"}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Request Button */}
                <button
                  onClick={() => {
                    setShowDayOverviewModal(false);
                    setShowRequestModal(true);
                  }}
                  className="w-full px-4 py-3 rounded-lg text-white transition-all duration-200 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#10B981" }}
                >
                  <Plus className="h-4 w-4" />
                  Request Schedule Change
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientSidebar>
  );
}
