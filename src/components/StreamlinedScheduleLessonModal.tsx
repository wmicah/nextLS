"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  X,
  Calendar,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  Repeat,
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
  isPast,
} from "date-fns";

interface StreamlinedScheduleLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
  selectedDate?: Date | null; // Pre-selected date from calendar click
}

export default function StreamlinedScheduleLessonModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientEmail,
  selectedDate: propSelectedDate,
}: StreamlinedScheduleLessonModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    propSelectedDate || null
  );
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    propSelectedDate || new Date()
  );

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

  // Update selectedDate when prop changes
  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
      setCurrentMonth(propSelectedDate);
    }
  }, [propSelectedDate]);

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

  // Generate time slots based on coach's working hours
  const generateTimeSlots = () => {
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
        const timeString = `${hour}:00 ${hour < 12 ? "AM" : "PM"}`;
        slots.push(timeString);
      }
      return slots;
    }

    const startHour = parseInt(startMatch[1]);
    const startMinute = parseInt(startMatch[2]);
    const startPeriod = startMatch[3];
    const endHour = parseInt(endMatch[1]);
    const endMinute = parseInt(endMatch[2]);
    const endPeriod = endMatch[3];

    // Convert to 24-hour format
    let start24 = startHour;
    let end24 = endHour;

    if (startPeriod.toUpperCase() === "PM" && startHour !== 12) {
      start24 += 12;
    } else if (startPeriod.toUpperCase() === "AM" && startHour === 12) {
      start24 = 0;
    }

    if (endPeriod.toUpperCase() === "PM" && endHour !== 12) {
      end24 += 12;
    } else if (endPeriod.toUpperCase() === "AM" && endHour === 12) {
      end24 = 0;
    }

    // Generate slots in minutes
    const startMinutes = start24 * 60;
    const endMinutes = end24 * 60;

    for (
      let minutes = startMinutes;
      minutes < endMinutes;
      minutes += interval
    ) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;

      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const period = hour < 12 ? "AM" : "PM";
      const timeString = `${displayHour}:${minute
        .toString()
        .padStart(2, "0")} ${period}`;
      slots.push(timeString);
    }

    return slots;
  };

  // Calendar navigation
  const navigateMonth = (direction: "prev" | "next") => {
    const newDate =
      direction === "prev"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1);
    setCurrentMonth(newDate);
  };

  // Generate calendar days
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

  // Check if a time slot is available
  const isTimeSlotAvailable = (date: Date, timeString: string) => {
    const timeMatch = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return false;

    const [_, hours, minutes, period] = timeMatch;
    let hour = parseInt(hours);
    let minute = parseInt(minutes);

    // Convert to 24-hour format
    if (period.toUpperCase() === "PM" && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === "AM" && hour === 12) {
      hour = 0;
    }

    // Convert to total minutes for precise comparison
    const slotMinutes = hour * 60 + minute;

    return !coachSchedule.some((lesson: any) => {
      const lessonDate = new Date(lesson.date);
      if (!isSameDay(lessonDate, date)) return false;

      const lessonHour = lessonDate.getHours();
      const lessonMinute = lessonDate.getMinutes();
      const lessonStartMinutes = lessonHour * 60 + lessonMinute;

      // Use coach's lesson duration from working hours settings
      const lessonDuration = coachProfile?.workingHours?.timeSlotInterval || 60; // Default 1 hour if not set
      const lessonEndMinutes = lessonStartMinutes + lessonDuration;

      // Check if the time slot conflicts with the lesson
      // A slot is unavailable if it starts during an existing lesson
      return (
        slotMinutes >= lessonStartMinutes && slotMinutes < lessonEndMinutes
      );
    });
  };

  // Schedule lesson mutation
  const scheduleLessonMutation = trpc.scheduling.scheduleLesson.useMutation({
    onSuccess: () => {
      setIsScheduling(false);
      onClose();
      setSelectedDate(null);
      setSelectedTime("");
      setIsRecurring(false);
      setEndDate("");

      // Invalidate and refetch data
      utils.clients.getById.invalidate({ id: clientId });
      utils.scheduling.getCoachSchedule.invalidate();
    },
    onError: error => {
      setIsScheduling(false);
      alert(`Error scheduling lesson: ${error.message}`);
    },
  });

  // Schedule recurring lessons mutation
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
        utils.scheduling.getCoachSchedule.invalidate();
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
    let minute = parseInt(minutes);

    // Convert to 24-hour format
    if (period.toUpperCase() === "PM" && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === "AM" && hour === 12) {
      hour = 0;
    }

    const lessonDate = new Date(selectedDate);
    lessonDate.setHours(hour, minute, 0, 0);

    if (isRecurring && endDate) {
      // Schedule recurring lessons
      scheduleRecurringLessonsMutation.mutate({
        clientId,
        startDate: lessonDate.toISOString(),
        endDate: new Date(endDate).toISOString(),
        recurrencePattern,
        recurrenceInterval,
        sendEmail: true,
      });
    } else {
      // Schedule single lesson
      scheduleLessonMutation.mutate({
        clientId,
        lessonDate: lessonDate.toISOString(),
        sendEmail: true,
      });
    }
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Schedule Lesson</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Client Info */}
        <div
          className="mb-6 p-4 rounded-lg"
          style={{ backgroundColor: "#2A2F2F" }}
        >
          <p className="text-sm text-gray-300 mb-1">Scheduling for:</p>
          <p className="text-white font-semibold text-lg">{clientName}</p>
          {clientEmail && (
            <p className="text-sm text-gray-400">{clientEmail}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Date
            </h3>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
                style={{ color: "#C3BCC2" }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h4 className="text-lg font-semibold text-white">
                {format(currentMonth, "MMMM yyyy")}
              </h4>
              <button
                onClick={() => navigateMonth("next")}
                className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
                style={{ color: "#C3BCC2" }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div
                  key={day}
                  className="text-center text-sm font-bold py-2"
                  style={{ color: "#4A5A70" }}
                >
                  {day}
                </div>
              ))}
              {calendarDays.map(day => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isPastDay = isPast(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    disabled={isPastDay}
                    className={`
                      p-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${
                        isSelected
                          ? "bg-sky-500 text-white"
                          : isPastDay
                          ? "text-gray-500 cursor-not-allowed"
                          : isCurrentMonth
                          ? "text-white hover:bg-sky-500/20"
                          : "text-gray-600"
                      }
                    `}
                    style={{
                      backgroundColor: isSelected
                        ? "#0EA5E9"
                        : isPastDay
                        ? "transparent"
                        : isCurrentMonth
                        ? "transparent"
                        : "transparent",
                    }}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Selection Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Select Time
            </h3>

            {selectedDate ? (
              <div>
                <p className="text-sm text-gray-300 mb-4">
                  Available times for{" "}
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}:
                </p>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {generateTimeSlots().map(time => {
                    const isAvailable = isTimeSlotAvailable(selectedDate, time);
                    return (
                      <button
                        key={time}
                        onClick={() => isAvailable && setSelectedTime(time)}
                        disabled={!isAvailable}
                        className={`
                          p-3 rounded-lg text-sm font-medium transition-all duration-200
                          ${
                            selectedTime === time
                              ? "bg-sky-500 text-white"
                              : isAvailable
                              ? "text-white hover:bg-sky-500/20 border border-gray-600"
                              : "text-gray-500 cursor-not-allowed border border-gray-700"
                          }
                        `}
                        style={{
                          backgroundColor:
                            selectedTime === time
                              ? "#0EA5E9"
                              : isAvailable
                              ? "transparent"
                              : "#1F2426",
                        }}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                className="p-8 text-center rounded-lg"
                style={{ backgroundColor: "#2A2F2F" }}
              >
                <Calendar
                  className="h-12 w-12 mx-auto mb-4"
                  style={{ color: "#4A5A70" }}
                />
                <p className="text-gray-400">
                  Select a date to see available times
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recurring Options */}
        <div
          className="mt-6 p-4 rounded-lg border"
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#4A5A70",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Repeat className="h-5 w-5 text-sky-400" />
              <div>
                <label className="text-lg font-medium text-white">
                  Schedule Recurring Lessons
                </label>
                <p className="text-sm text-gray-400">
                  Create multiple lessons at once
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

          {isRecurring && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="text-white mb-2 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  min={
                    selectedDate
                      ? format(selectedDate, "yyyy-MM-dd")
                      : undefined
                  }
                  className="w-full p-3 rounded-md text-white"
                  style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
                />
              </div>
            </div>
          )}

          {isRecurring && previewDates.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-300 mb-2">
                Preview ({previewDates.length} lessons):
              </p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {previewDates.slice(0, 10).map((date, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded text-xs"
                    style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                  >
                    {format(date, "MMM d")}
                  </span>
                ))}
                {previewDates.length > 10 && (
                  <span className="px-2 py-1 rounded text-xs text-gray-400">
                    +{previewDates.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTime || isScheduling}
            className="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isScheduling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Scheduling...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Schedule Lesson{isRecurring ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
