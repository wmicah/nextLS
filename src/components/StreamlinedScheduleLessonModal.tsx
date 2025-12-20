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
import { getUserTimezone } from "@/lib/timezone-utils";
import { COLORS, getGoldenAccent } from "@/lib/colors";

interface StreamlinedScheduleLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
  selectedDate?: Date | null; // Pre-selected date from calendar click
  overrideWorkingDays?: boolean; // Allow overriding working day restrictions (e.g., in organization view)
  replacementData?: {
    assignmentId: string;
    programId: string;
    programTitle: string;
    dayDate: string;
  } | null; // Data for replacing a program day with a lesson
}

export default function StreamlinedScheduleLessonModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientEmail,
  selectedDate: propSelectedDate,
  overrideWorkingDays = false,
  replacementData = null,
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
    | "weekly"
    | "biweekly"
    | "triweekly"
    | "quadweekly"
    | "pentweekly"
    | "hexweekly"
    | "monthly"
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
        // Check if the date is on a working day (skip check if replacing a program day)
        if (coachProfile?.workingDays && !replacementData) {
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
          case "quadweekly":
            currentDate = addWeeks(currentDate, 4 * recurrenceInterval);
            break;
          case "pentweekly":
            currentDate = addWeeks(currentDate, 5 * recurrenceInterval);
            break;
          case "hexweekly":
            currentDate = addWeeks(currentDate, 6 * recurrenceInterval);
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
      // If this is replacing a program day, delete the program day
      if (replacementData) {
        deleteProgramDayMutation.mutate({
          assignmentId: replacementData.assignmentId,
          dayDate: replacementData.dayDate,
          reason: "Program day replaced with lesson",
        });
      }

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
        // If this is replacing a program day, delete the program day
        if (replacementData) {
          deleteProgramDayMutation.mutate({
            assignmentId: replacementData.programId, // This should be the assignment ID, not program ID
            dayDate: replacementData.dayDate,
            reason: "Program day replaced with lesson",
          });
        }

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

  // Delete program day mutation (for replacing program days with lessons)
  const deleteProgramDayMutation = trpc.programs.deleteProgramDay.useMutation({
    onSuccess: () => {
    },
    onError: error => {
      console.error("Error deleting program day:", error);
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

    // Format the date string like the schedule page does
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}:00`;
    const fullDateStr = `${dateStr}T${timeStr}`;

    if (isRecurring && endDate) {
      // Schedule recurring lessons
      scheduleRecurringLessonsMutation.mutate({
        clientId,
        startDate: fullDateStr,
        endDate: format(new Date(endDate), "yyyy-MM-dd"),
        recurrencePattern,
        recurrenceInterval,
        sendEmail: true,
        overrideWorkingDays: overrideWorkingDays || !!replacementData,
        timeZone: getUserTimezone(),
      });
    } else {
      // Schedule single lesson
      scheduleLessonMutation.mutate({
        clientId,
        lessonDate: fullDateStr,
        sendEmail: true,
        overrideWorkingDays: overrideWorkingDays || !!replacementData,
        timeZone: getUserTimezone(),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
      <div
        className="rounded-2xl shadow-xl border p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "#1C2021",
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>Schedule Lesson</h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: COLORS.TEXT_SECONDARY }}
            onMouseEnter={(e) => e.currentTarget.style.color = COLORS.TEXT_PRIMARY}
            onMouseLeave={(e) => e.currentTarget.style.color = COLORS.TEXT_SECONDARY}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Client Info */}
        <div
          className="mb-6 p-4 rounded-lg"
          style={{ backgroundColor: "#2A2F2F" }}
        >
          <p className="text-sm mb-1" style={{ color: COLORS.TEXT_SECONDARY }}>Scheduling for:</p>
          <p className="font-semibold text-lg" style={{ color: COLORS.TEXT_PRIMARY }}>{clientName}</p>
          {clientEmail && (
            <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>{clientEmail}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
              Select Date
            </h3>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: "#2A2F2F",
                  color: COLORS.TEXT_PRIMARY
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#353A3A"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#2A2F2F"}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h4 className="text-lg font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
                {format(currentMonth, "MMMM yyyy")}
              </h4>
              <button
                onClick={() => navigateMonth("next")}
                className="p-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: "#2A2F2F",
                  color: COLORS.TEXT_PRIMARY
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#353A3A"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#2A2F2F"}
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
                  style={{ color: COLORS.TEXT_SECONDARY }}
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
                    className="p-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: isSelected
                        ? COLORS.GOLDEN_ACCENT
                        : isPastDay
                        ? "transparent"
                        : isCurrentMonth
                        ? "#2A2F2F"
                        : "#1C2021",
                      color: isSelected
                        ? COLORS.BACKGROUND_DARK
                        : isPastDay
                        ? COLORS.TEXT_MUTED
                        : isCurrentMonth
                        ? COLORS.TEXT_PRIMARY
                        : COLORS.TEXT_MUTED,
                      cursor: isPastDay ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!isPastDay && !isSelected && isCurrentMonth) {
                        e.currentTarget.style.backgroundColor = "#353A3A";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isPastDay && !isSelected && isCurrentMonth) {
                        e.currentTarget.style.backgroundColor = "#2A2F2F";
                      }
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
            <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
              Select Time
            </h3>

            {selectedDate ? (
              <div>
                <p className="text-sm mb-4" style={{ color: COLORS.TEXT_SECONDARY }}>
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
                        className="p-3 rounded-lg text-sm font-medium transition-all duration-200 border"
                        style={{
                          backgroundColor:
                            selectedTime === time
                              ? COLORS.GOLDEN_ACCENT
                              : isAvailable
                              ? "#2A2F2F"
                              : "#1C2021",
                          color:
                            selectedTime === time
                              ? COLORS.BACKGROUND_DARK
                              : isAvailable
                              ? COLORS.TEXT_PRIMARY
                              : COLORS.TEXT_MUTED,
                          borderColor:
                            selectedTime === time
                              ? COLORS.GOLDEN_ACCENT
                              : COLORS.BORDER_SUBTLE,
                          cursor: isAvailable ? "pointer" : "not-allowed",
                        }}
                        onMouseEnter={(e) => {
                          if (isAvailable && selectedTime !== time) {
                            e.currentTarget.style.backgroundColor = "#353A3A";
                            e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isAvailable && selectedTime !== time) {
                            e.currentTarget.style.backgroundColor = "#2A2F2F";
                            e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                          }
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
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
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
            backgroundColor: "#2A2F2F",
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div>
                <label className="text-lg font-medium block" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Schedule Recurring Lessons
                </label>
                <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                  Create multiple lessons at once
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={e => setIsRecurring(e.target.checked)}
              className="checkbox"
            />
          </div>

          {isRecurring && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Recurrence Pattern
                </label>
                <select
                  value={recurrencePattern}
                  onChange={e => setRecurrencePattern(e.target.value as any)}
                  className="w-full p-3 rounded-md border"
                  style={{ 
                    backgroundColor: "#1C2021", 
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY
                  }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="triweekly">Every 3 Weeks</option>
                  <option value="quadweekly">Every 4 Weeks</option>
                  <option value="pentweekly">Every 5 Weeks</option>
                  <option value="hexweekly">Every 6 Weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block" style={{ color: COLORS.TEXT_PRIMARY }}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  min={
                    selectedDate
                      ? format(selectedDate, "yyyy-MM-dd")
                      : undefined
                  }
                  className="w-full p-3 rounded-md border"
                  style={{ 
                    backgroundColor: "#1C2021", 
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY
                  }}
                />
              </div>
            </div>
          )}

          {isRecurring && previewDates.length > 0 && (
            <div className="mt-4">
              <p className="text-sm mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                Preview ({previewDates.length} lessons):
              </p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {previewDates.slice(0, 10).map((date, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded text-xs"
                    style={{ backgroundColor: COLORS.GOLDEN_DARK, color: COLORS.TEXT_PRIMARY }}
                  >
                    {format(date, "MMM d")}
                  </span>
                ))}
                {previewDates.length > 10 && (
                  <span className="px-2 py-1 rounded text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
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
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
            style={{ 
              backgroundColor: "transparent", 
              borderColor: COLORS.BORDER_SUBTLE,
              color: COLORS.TEXT_PRIMARY
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2A2F2F";
              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTime || isScheduling}
            className="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ 
              backgroundColor: COLORS.GOLDEN_ACCENT,
              color: COLORS.BACKGROUND_DARK
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_HOVER;
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
              }
            }}
          >
            {isScheduling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                Scheduling...
              </>
            ) : (
              <>
                Schedule Lesson{isRecurring ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
