"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import WorkingHoursModal from "./WorkingHoursModal";
import CustomSelect from "./ui/CustomSelect";
import Sidebar from "./Sidebar";
import { useSidebarState } from "@/hooks/useSidebarState";
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
  formatDateTimeInUserTimezone,
  getUserTimezone,
} from "@/lib/timezone-utils";

export default function MobileSchedulePage() {
  const isSidebarOpen = useSidebarState();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showDayOverviewModal, setShowDayOverviewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    clientId: "",
    time: "",
    date: "",
  });
  const [workingHours, setWorkingHours] = useState({
    startTime: "9:00 AM",
    endTime: "6:00 PM",
    workingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    timeSlotInterval: 60,
  });

  // Fetch coach's schedule for the current month
  const { data: coachSchedule = [] } =
    trpc.scheduling.getCoachSchedule.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
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

    const dateStr = scheduleForm.date;
    const timeStr = scheduleForm.time;
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!timeMatch) {
      alert("Invalid time format");
      return;
    }

    const [, hour, minute, period] = timeMatch;
    let hour24 = parseInt(hour);

    if (period.toUpperCase() === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period.toUpperCase() === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    const fullDateStr = `${dateStr}T${hour24
      .toString()
      .padStart(2, "0")}:${minute}:00`;
    const lessonDate = new Date(fullDateStr);

    if (isNaN(lessonDate.getTime())) {
      alert("Invalid date/time combination");
      return;
    }

    const now = new Date();
    if (lessonDate <= now) {
      alert(
        "Cannot schedule lessons in the past. Please select a future date and time."
      );
      return;
    }

    const timeZone = getUserTimezone();
    scheduleLessonMutation.mutate({
      clientId: scheduleForm.clientId,
      lessonDate: fullDateStr,
      timeZone,
    });
  };

  const handleDeleteLesson = (lessonId: string, lessonTitle: string) => {
    if (confirm(`Are you sure you want to delete "${lessonTitle}"?`)) {
      deleteLessonMutation.mutate({ lessonId: lessonId });
    }
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
      scheduleForm.date && format(now, "yyyy-MM-dd") === scheduleForm.date;
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

  return (
    <Sidebar>
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        {/* Mobile Header */}
        <div
          className={`sticky top-0 z-10 px-4 py-4 border-b transition-all duration-500 ease-in-out ${
            isSidebarOpen ? "md:ml-64" : "md:ml-20"
          }`}
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
                  Schedule
                </h1>
                <p className="text-sm" style={{ color: "#ABA4AA" }}>
                  Manage lessons & availability
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="p-3 rounded-lg transition-all duration-200"
                style={{ backgroundColor: "#10B981" }}
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setShowWorkingHoursModal(true)}
                className="p-3 rounded-lg transition-all duration-200"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
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
                {pendingRequests.slice(0, 3).map((request: any) => (
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
            </div>
          )}

          {/* Today's Lessons */}
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
                    Today's Upcoming Lessons ({todaysLessons.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {todaysLessons.map((lesson: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded bg-emerald-500/10 border border-emerald-500/20 group"
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
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
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
                const lessonsForDay = getLessonsForDate(day);
                const hasLessons = lessonsForDay.length > 0;

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
                    p-2 text-sm rounded-lg transition-all duration-200 relative min-h-[50px] border-2 overflow-hidden
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
                    <div className="font-bold text-sm mb-1 flex items-center justify-between">
                      <span>{format(day, "d")}</span>
                      {!isWorkingDay && isCurrentMonth && !isPast && (
                        <div
                          className="w-1.5 h-1.5 bg-orange-500 rounded-full"
                          title="Non-working day"
                        />
                      )}
                    </div>
                    {hasLessons && (
                      <div className="flex justify-center items-center mt-1">
                        <div className="flex flex-wrap gap-0.5 justify-center">
                          {lessonsForDay
                            .slice(0, 3)
                            .map((lesson: any, index: number) => (
                              <div
                                key={index}
                                className="w-2 h-2 rounded-full bg-emerald-400"
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
                          {lessonsForDay.length > 3 && (
                            <div
                              className="w-2 h-2 rounded-full bg-emerald-300"
                              title={`+${
                                lessonsForDay.length - 3
                              } more lessons`}
                            />
                          )}
                        </div>
                      </div>
                    )}
                    {!hasLessons && isCurrentMonth && !isPast && (
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

        {/* Schedule Lesson Modal */}
        {showScheduleModal && (
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
                  Schedule Lesson
                </h2>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleForm({ clientId: "", time: "", date: "" });
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Client
                  </label>
                  <CustomSelect
                    value={scheduleForm.clientId}
                    onChange={value =>
                      setScheduleForm({
                        ...scheduleForm,
                        clientId: value,
                      })
                    }
                    options={[
                      { value: "", label: "Select a client" },
                      ...clients.map((client: any) => ({
                        value: client.id,
                        label: client.name || client.email,
                      })),
                    ]}
                    placeholder="Select a client"
                    style={{
                      backgroundColor: "#2A2F2F",
                      borderColor: "#606364",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={e =>
                      setScheduleForm({ ...scheduleForm, date: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border text-white text-base min-h-[48px]"
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
                    value={scheduleForm.time}
                    onChange={value =>
                      setScheduleForm({ ...scheduleForm, time: value })
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
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      setScheduleForm({ clientId: "", time: "", date: "" });
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
                    onClick={handleScheduleLesson}
                    disabled={scheduleLessonMutation.isPending}
                    className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
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
              <div className="p-4">
                {(() => {
                  const dayLessons = getLessonsForDate(selectedDate);
                  return dayLessons.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">
                          Scheduled Lessons
                        </h3>
                        <button
                          onClick={() => {
                            setShowDayOverviewModal(false);
                            setShowScheduleModal(true);
                          }}
                          className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200"
                          style={{
                            backgroundColor: "#10B981",
                            color: "#FFFFFF",
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Add Lesson
                        </button>
                      </div>
                      <div className="space-y-3">
                        {dayLessons.map((lesson: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 rounded-lg border group bg-emerald-500/10 border-emerald-500/20"
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
                              <div className="text-xs text-emerald-400">
                                {lesson.title}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleDeleteLesson(lesson.id, lesson.title)
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
                              title="Delete lesson"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400">
                        No lessons scheduled for this day
                      </p>
                      <button
                        onClick={() => {
                          setShowDayOverviewModal(false);
                          setShowScheduleModal(true);
                        }}
                        className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                        style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
                      >
                        Schedule Lesson
                      </button>
                    </div>
                  );
                })()}
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
      </div>
    </Sidebar>
  );
}
