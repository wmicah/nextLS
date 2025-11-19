"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  X,
  Calendar,
  Clock,
  Mail,
  Check,
  ChevronLeft,
  ChevronRight,
  Repeat,
  CalendarDays,
  Settings,
} from "lucide-react";
import {
  format,
  addDays,
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
import { getUserTimezone } from "@/lib/timezone-utils";

interface ScheduleLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
  startDate?: string; // Pre-filled start date
  replacementData?: {
    programId: string;
    programTitle: string;
    dayDate: string;
  } | null; // Data for workout replacement
}

export default function ScheduleLessonModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientEmail,
  startDate: propStartDate,
  replacementData,
}: ScheduleLessonModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    propStartDate ? new Date(propStartDate) : null
  );
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Recurring lesson states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<
    "weekly" | "biweekly" | "triweekly" | "monthly"
  >("weekly");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [endDate, setEndDate] = useState<string>("");
  const [previewDates, setPreviewDates] = useState<Date[]>([]);

  // Fetch coach's profile for working hours
  const { data: coachProfile } = trpc.user.getProfile.useQuery();

  // Update selectedDate when replacementData changes
  useEffect(() => {
    if (replacementData?.dayDate) {
      setSelectedDate(new Date(replacementData.dayDate));
    }
  }, [replacementData]);

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

        // Calculate next lesson date based on recurrence pattern
        switch (recurrencePattern) {
          case "weekly":
            currentDate = addWeeks(currentDate, recurrenceInterval);
            break;
          case "biweekly":
            currentDate = addWeeks(currentDate, 2 * recurrenceInterval);
            break;
          case "triweekly":
            currentDate = addWeeks(currentDate, 3 * recurrenceInterval);
            break;
          case "monthly":
            currentDate = addMonths(currentDate, recurrenceInterval);
            break;
        }
      }

      setPreviewDates(dates);
    } else {
      setPreviewDates([]);
    }
  }, [
    isRecurring,
    selectedDate,
    endDate,
    recurrencePattern,
    recurrenceInterval,
    coachProfile?.workingDays,
  ]);

  // Get current user's role to determine if they can book on non-working days
  const currentUser = coachProfile;

  // Generate time slots based on coach's working hours and interval
  const generateTimeSlots = () => {
    // Use coach's working hours if available, otherwise default to 9 AM to 6 PM
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

    const [_, startHour, startMinute, startPeriod] = startMatch;
    const [__, endHour, endMinute, endPeriod] = endMatch;

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

    // Generate slots based on interval
    for (
      let totalMinutes = startTotalMinutes;
      totalMinutes < endTotalMinutes;
      totalMinutes += interval
    ) {
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
  console.log("Generated time slots:", timeSlots); // Debug log

  // Generate calendar days for the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Fetch coach's schedule for the current month
  const { data: coachSchedule = [] } =
    trpc.scheduling.getCoachSchedule.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  const utils = trpc.useUtils();
  const scheduleLessonMutation = trpc.scheduling.scheduleLesson.useMutation({
    onSuccess: () => {
      setIsScheduling(false);
      onClose();
      setSelectedDate(null);
      setSelectedTime("");

      // Invalidate and refetch client data to show updated schedule
      utils.clients.getById.invalidate({ id: clientId });
      utils.scheduling.getWeeklySchedule.invalidate({ clientId });
      utils.scheduling.getCoachSchedule.invalidate();
    },
    onError: error => {
      setIsScheduling(false);
      alert(`Error scheduling lesson: ${error.message}`);
    },
  });

  const replaceWorkoutMutation =
    trpc.clients.replaceWorkoutWithLesson.useMutation({
      onSuccess: () => {
        setIsScheduling(false);
        onClose();
        setSelectedDate(null);
        setSelectedTime("");

        // Invalidate and refetch client data to show updated schedule
        utils.clients.getById.invalidate({ id: clientId });
        utils.scheduling.getWeeklySchedule.invalidate({ clientId });
        utils.scheduling.getCoachSchedule.invalidate();
      },
      onError: error => {
        setIsScheduling(false);
        alert(`Error replacing workout with lesson: ${error.message}`);
      },
    });

  const scheduleRecurringLessonsMutation =
    trpc.scheduling.scheduleRecurringLessons.useMutation({
      onSuccess: data => {
        setIsScheduling(false);
        onClose();
        setSelectedDate(null);
        setSelectedTime("");
        setIsRecurring(false);
        setEndDate("");

        utils.clients.getById.invalidate({ id: clientId });
        utils.scheduling.getWeeklySchedule.invalidate({ clientId });
        utils.scheduling.getCoachSchedule.invalidate();

        alert(`Successfully scheduled ${data.totalLessons} recurring lessons!`);
      },
      onError: error => {
        setIsScheduling(false);
        alert(`Error scheduling recurring lessons: ${error.message}`);
      },
    });

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select a date and time");
      return;
    }

    setIsScheduling(true);

    // Parse the selected time and create the lesson date
    const timeMatch = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) {
      alert("Invalid time format");
      setIsScheduling(false);
      return;
    }

    const [_, hours, minutes, period] = timeMatch;
    let hour = parseInt(hours);

    // Convert to 24-hour format
    if (period.toUpperCase() === "PM" && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === "AM" && hour === 12) {
      hour = 0;
    }

    // Create the lesson date by combining the selected date with the selected time
    // This ensures we maintain the correct local time without timezone conversion issues
    const lessonDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hour,
      parseInt(minutes),
      0,
      0
    );

    if (isRecurring && endDate) {
      // Schedule recurring lessons with full datetime to preserve time
      const startDateStr = `${lessonDate.getFullYear()}-${(
        lessonDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${lessonDate
        .getDate()
        .toString()
        .padStart(2, "0")}T${lessonDate
        .getHours()
        .toString()
        .padStart(2, "0")}:${lessonDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}:00`;
      const endDateStr = format(new Date(endDate), "yyyy-MM-dd");

      const timeZone = getUserTimezone();
      scheduleRecurringLessonsMutation.mutate({
        clientId,
        startDate: startDateStr, // Full datetime format with time preserved
        endDate: endDateStr, // End date only (will use same time as start)
        recurrencePattern,
        recurrenceInterval,
        sendEmail,
        timeZone,
      });
    } else if (replacementData) {
      // Replace workout with lesson
      replaceWorkoutMutation.mutate({
        clientId,
        programId: replacementData.programId,
        dayDate: replacementData.dayDate,
        lessonData: {
          time: selectedTime,
          title: `Lesson - ${replacementData.programTitle}`,
          description: `Replaced workout from ${replacementData.programTitle}`,
        },
      });
    } else {
      // Regular lesson scheduling
      const timeZone = getUserTimezone();

      // Format as local datetime string (consistent with other components)
      const fullDateStr = `${lessonDate.getFullYear()}-${(
        lessonDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${lessonDate
        .getDate()
        .toString()
        .padStart(2, "0")}T${lessonDate
        .getHours()
        .toString()
        .padStart(2, "0")}:${lessonDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}:00`;

      scheduleLessonMutation.mutate({
        clientId,
        lessonDate: fullDateStr, // Use consistent local format instead of toISOString()
        sendEmail,
        timeZone,
      });
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(
      direction === "prev"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1)
    );
  };

  const getLessonsForDate = (date: Date) => {
    return coachSchedule.filter((lesson: any) =>
      isSameDay(new Date(lesson.date), date)
    );
  };

  const isTimeSlotAvailable = (date: Date, time: string) => {
    // Parse the time slot to 24-hour format for comparison
    const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return false;

    const [_, hours, minutes, period] = timeMatch;
    let hour = parseInt(hours);

    // Convert to 24-hour format
    if (period.toUpperCase() === "PM" && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === "AM" && hour === 12) {
      hour = 0;
    }

    return !coachSchedule.some((lesson: any) => {
      const lessonDate = new Date(lesson.date);
      return isSameDay(lessonDate, date) && lessonDate.getHours() === hour;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="rounded-2xl shadow-xl border p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            {replacementData
              ? "Replace Workout with Lesson"
              : "Schedule Lesson"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Client Info */}
        <div
          className="mb-4 p-3 rounded-lg"
          style={{ backgroundColor: "#2A2F2F" }}
        >
          <p className="text-sm text-gray-300">Scheduling for:</p>
          <p className="text-white font-medium">{clientName}</p>
          {clientEmail && (
            <p className="text-sm text-gray-400">{clientEmail}</p>
          )}
        </div>

        {/* Replacement Info */}
        {replacementData && (
          <div
            className="mb-4 p-3 rounded-lg border"
            style={{
              backgroundColor: "#1E3A8A",
              borderColor: "#3B82F6",
            }}
          >
            <p className="text-sm text-blue-200">Replacing workout from:</p>
            <p className="text-white font-medium">
              {replacementData.programTitle}
            </p>
            <p className="text-xs text-blue-300">
              This will schedule a lesson instead of the regular workout
            </p>
          </div>
        )}

        {/* Coach Working Hours Info */}
        <div
          className="mb-4 p-3 rounded-lg"
          style={{ backgroundColor: "#2A2F2F" }}
        >
          <p className="text-sm text-gray-300">Coach's Working Hours:</p>
          <p className="text-white font-medium">
            {coachProfile?.workingHours?.startTime || "9:00 AM"} -{" "}
            {coachProfile?.workingHours?.endTime || "6:00 PM"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Working Days:{" "}
            {coachProfile?.workingHours?.workingDays?.join(", ") ||
              "Monday - Sunday"}
          </p>
        </div>

        {/* Recurring Lesson Toggle */}
        <div
          className="mb-4 p-4 rounded-lg border"
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#4A5A70",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Repeat className="h-5 w-5 text-sky-400" />
              <div>
                <label className="text-lg font-medium text-white">
                  Schedule Recurring Lessons
                </label>
                <p className="text-sm text-gray-400">
                  Create multiple lessons at once with automatic scheduling
                </p>
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
        </div>

        {/* Recurring Lesson Options */}
        {isRecurring && (
          <div
            className="mb-4 rounded-lg border p-4"
            style={{
              backgroundColor: "#353A3A",
              borderColor: "#4A5A70",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-sky-400" />
              <h3 className="text-lg font-semibold text-white">
                Recurring Lesson Settings
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-white mb-2 block">
                  Recurrence Pattern
                </label>
                <select
                  value={recurrencePattern}
                  onChange={e => setRecurrencePattern(e.target.value as any)}
                  className="w-full p-3 rounded-md text-white"
                  style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="triweekly">Every 3 Weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="text-white mb-2 block">Repeat Every</label>
                <select
                  value={recurrenceInterval}
                  onChange={e =>
                    setRecurrenceInterval(parseInt(e.target.value))
                  }
                  className="w-full p-3 rounded-md text-white"
                  style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>
                      {num}{" "}
                      {recurrencePattern === "monthly" ? "month(s)" : "week(s)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-white mb-2 block">End Date</label>
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
                style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
              />
            </div>

            {/* Preview of scheduled dates */}
            {previewDates.length > 0 && (
              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: "#1F2426",
                  borderColor: "#4A5A70",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="h-4 w-4 text-green-400" />
                  <label className="text-sm font-medium text-green-400">
                    Preview ({previewDates.length} lessons will be scheduled):
                  </label>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewDates.slice(0, 10).map((date, index) => (
                      <div
                        key={index}
                        className="text-sm text-gray-300 bg-gray-700/50 p-2 rounded"
                      >
                        {format(date, "MMM d, yyyy")}
                      </div>
                    ))}
                    {previewDates.length > 10 && (
                      <div className="text-sm text-gray-400 col-span-full text-center py-2">
                        ... and {previewDates.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <h3 className="text-lg font-semibold text-white">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <button
            onClick={() => navigateMonth("next")}
            className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Calendar */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white mb-3">Select Date</h3>
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-xs text-gray-400 py-2">
                {day}
              </div>
            ))}
            {calendarDays.map(day => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const isPast = day < new Date();
              const isCurrentMonth = isSameMonth(day, currentMonth);
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

              // Determine if this day can be selected
              // Coaches can book on any day, clients can only book on working days
              const canSelect =
                !isPast &&
                isCurrentMonth &&
                (currentUser?.role === "COACH" || isWorkingDay);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => canSelect && setSelectedDate(day)}
                  disabled={!canSelect}
                  className={`
                    p-2 text-sm rounded-lg transition-all duration-200 relative
                    ${
                      isSelected
                        ? "bg-sky-500 text-white"
                        : isToday
                        ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                        : !canSelect
                        ? "text-gray-600 cursor-not-allowed"
                        : isWorkingDay
                        ? "text-white hover:bg-sky-500/20 hover:text-sky-400"
                        : "text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 border border-orange-500/30"
                    }
                   `}
                >
                  {format(day, "d")}
                  {hasLessons && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                  {!isWorkingDay && currentUser?.role === "COACH" && (
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-gray-400">Existing lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-500 rounded-full" />
              <span className="text-gray-400">Available slots</span>
            </div>
            {currentUser?.role === "COACH" && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span className="text-gray-400">
                  Non-working day (coach only)
                </span>
              </div>
            )}
            {currentUser?.role === "CLIENT" && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full" />
                <span className="text-gray-400">
                  Non-working day (unavailable)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-3">
              Select Time for {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>
            {(() => {
              // Check if this is a working day
              const dayName = format(selectedDate, "EEEE");
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

              // If it's not a working day and user is a client, show message
              if (!isWorkingDay && currentUser?.role === "CLIENT") {
                return (
                  <div className="p-4 rounded-lg bg-orange-500/20 border border-orange-500/30">
                    <p className="text-orange-300 text-sm">
                      This is not a working day for your coach. Please select a
                      different date.
                    </p>
                  </div>
                );
              }

              // If it's not a working day but user is a coach, show warning
              if (!isWorkingDay && currentUser?.role === "COACH") {
                return (
                  <div className="mb-4 p-3 rounded-lg bg-orange-500/20 border border-orange-500/30">
                    <p className="text-orange-300 text-sm">
                      ⚠️ This is not a regular working day. You can still
                      schedule lessons here.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map(time => {
                    const isAvailable = isTimeSlotAvailable(selectedDate, time);
                    const isSelected = selectedTime === time;

                    return (
                      <button
                        key={time}
                        onClick={() => isAvailable && setSelectedTime(time)}
                        disabled={!isAvailable}
                        className={`
                        p-2 text-sm rounded-lg transition-all duration-200
                        ${
                          isSelected
                            ? "bg-sky-500 text-white"
                            : isAvailable
                            ? "text-white hover:bg-sky-500/20 hover:text-sky-400"
                            : "text-gray-600 cursor-not-allowed bg-gray-700"
                        }
                       `}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Email Notification */}
        {clientEmail && (
          <div className="mb-6">
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: "#2A2F2F" }}
            >
              <input
                type="checkbox"
                id="send-email"
                checked={sendEmail}
                onChange={e => setSendEmail(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-sky-500 focus:ring-sky-500"
              />
              <label
                htmlFor="send-email"
                className="text-sm text-white cursor-pointer"
              >
                Send email notification to {clientEmail}
              </label>
            </div>
            {sendEmail && (
              <p className="text-xs text-gray-400 mt-2">
                Client will receive an email with a link to accept/decline the
                lesson
              </p>
            )}
          </div>
        )}

        {/* Selected Appointment Summary */}
        {selectedDate && selectedTime && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{ backgroundColor: "#2A2F2F" }}
          >
            <h3 className="text-sm font-medium text-white mb-2">
              Appointment Summary
            </h3>
            <div className="space-y-1 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {selectedTime}
              </div>
              {sendEmail && clientEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email notification will be sent
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
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
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTime || isScheduling}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: "#4A5A70",
              color: "#FFFFFF",
            }}
          >
            {isScheduling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Scheduling...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {replacementData
                  ? "Replace with Lesson"
                  : isRecurring
                  ? `Schedule ${previewDates.length} Lessons`
                  : "Schedule Lesson"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
