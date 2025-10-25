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
  Users,
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

interface OrganizationScheduleLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate?: string; // Pre-filled start date
}

export default function OrganizationScheduleLessonModal({
  isOpen,
  onClose,
  startDate: propStartDate,
}: OrganizationScheduleLessonModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    propStartDate
      ? (() => {
          const [year, month, day] = propStartDate.split("-").map(Number);
          return new Date(year, month - 1, day);
        })()
      : null
  );
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(
    propStartDate
      ? (() => {
          const [year, month, day] = propStartDate.split("-").map(Number);
          return new Date(year, month - 1, day);
        })()
      : new Date()
  );
  const [clientSearch, setClientSearch] = useState<string>("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Update selectedDate and currentMonth when propStartDate changes
  useEffect(() => {
    if (propStartDate) {
      // Parse the date string as local time (not UTC)
      const [year, month, day] = propStartDate.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      setSelectedDate(date);
      setCurrentMonth(date);
    }
  }, [propStartDate]);

  // Recurring lesson states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<
    "weekly" | "biweekly" | "triweekly" | "monthly"
  >("weekly");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [endDate, setEndDate] = useState<string>("");
  const [previewDates, setPreviewDates] = useState<Date[]>([]);

  // Fetch organization data and clients
  const { data: organization } = trpc.organization.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const { data: organizationClients = [] } =
    trpc.organization.getOrganizationClients.useQuery(undefined, {
      enabled: !!organization,
      staleTime: 5 * 60 * 1000,
    });

  // Filter and sort clients alphabetically based on search
  const filteredClients = organizationClients
    .filter((client: any) => {
      const searchLower = clientSearch.toLowerCase();
      return (
        client.name?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a: any, b: any) => {
      const nameA = (a.name || a.email || "").toLowerCase();
      const nameB = (b.name || b.email || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

  // Fetch coach's profile for working hours
  const { data: coachProfile } = trpc.user.getProfile.useQuery();

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

  // Generate calendar days for the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Fetch organization schedule for the current month
  const { data: organizationSchedule = [] } =
    trpc.organization.getOrganizationSchedule.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  const utils = trpc.useUtils();
  const scheduleLessonMutation =
    trpc.organization.scheduleOrganizationLesson.useMutation({
      onSuccess: () => {
        setIsScheduling(false);
        onClose();
        setSelectedDate(null);
        setSelectedTime("");
        setSelectedClientId("");

        // Invalidate and refetch organization data
        utils.organization.getOrganizationSchedule.invalidate();
        utils.organization.getOrganizationClients.invalidate();
      },
      onError: error => {
        setIsScheduling(false);
        alert(`Error scheduling lesson: ${error.message}`);
      },
    });

  const scheduleRecurringLessonsMutation =
    trpc.organization.scheduleRecurringOrganizationLessons.useMutation({
      onSuccess: data => {
        setIsScheduling(false);
        onClose();
        setSelectedDate(null);
        setSelectedTime("");
        setSelectedClientId("");
        setIsRecurring(false);
        setEndDate("");

        utils.organization.getOrganizationSchedule.invalidate();
        utils.organization.getOrganizationClients.invalidate();

        alert(`Successfully scheduled ${data.totalLessons} recurring lessons!`);
      },
      onError: error => {
        setIsScheduling(false);
        alert(`Error scheduling recurring lessons: ${error.message}`);
      },
    });

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedClientId) {
      alert("Please select a date, time, and client");
      return;
    }

    // Validate that the selected client exists in filtered results
    if (!filteredClients.find((c: any) => c.id === selectedClientId)) {
      alert("Please select a valid client from the list");
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
      // Schedule recurring lessons
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
        clientId: selectedClientId,
        startDate: startDateStr,
        endDate: endDateStr,
        recurrencePattern,
        recurrenceInterval,
        sendEmail,
        timeZone,
      });
    } else {
      // Regular lesson scheduling
      const timeZone = getUserTimezone();

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
        clientId: selectedClientId,
        lessonDate: fullDateStr,
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
    return organizationSchedule.filter((lesson: any) => {
      const lessonDate = new Date(lesson.date);
      // Compare dates in local timezone
      return (
        lessonDate.getFullYear() === date.getFullYear() &&
        lessonDate.getMonth() === date.getMonth() &&
        lessonDate.getDate() === date.getDate()
      );
    });
  };

  const isTimeSlotAvailable = (date: Date, time: string) => {
    // Parse the time slot to 24-hour format for comparison
    const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return false;

    const [_, hours, minutes, period] = timeMatch;
    let hour = parseInt(hours);
    if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
    const minute = parseInt(minutes);

    // Check if this time slot conflicts with existing lessons in the organization
    const lessonsOnDate = getLessonsForDate(date);
    const hasConflict = lessonsOnDate.some((lesson: any) => {
      const lessonDate = new Date(lesson.date);
      // Compare time in local timezone
      return (
        lessonDate.getHours() === hour && lessonDate.getMinutes() === minute
      );
    });

    return !hasConflict;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#2A3133] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-[#606364]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#606364]">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Schedule Organization Lesson
            </h2>
            <p className="text-sm text-[#ABA4AA] mt-1">
              Schedule a lesson with any client in the organization
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#353A3A] rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-[#ABA4AA]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Client Selection with Search */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Select Client <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for a client..."
                  value={clientSearch}
                  onChange={e => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  className="w-full px-4 py-2 bg-[#353A3A] border border-[#606364] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4A5A70]"
                />

                {/* Dropdown */}
                {showClientDropdown && filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[#353A3A] border border-[#606364] rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredClients.map((client: any) => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setClientSearch(client.name || client.email);
                          setShowClientDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#4A5A70] transition-colors"
                        style={{ color: "#C3BCC2" }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {client.name || client.email}
                          </span>
                          {client.coach && (
                            <span
                              className="text-xs"
                              style={{ color: "#ABA4AA" }}
                            >
                              {client.coach.name}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results */}
                {showClientDropdown &&
                  clientSearch &&
                  filteredClients.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-[#353A3A] border border-[#606364] rounded-lg shadow-xl p-4 text-center">
                      <p style={{ color: "#ABA4AA" }}>No clients found</p>
                    </div>
                  )}
              </div>

              {/* Selected client info */}
              {selectedClientId && (
                <div className="mt-2 px-3 py-2 bg-[#2A3133] rounded-lg border border-[#606364]">
                  <p className="text-sm" style={{ color: "#C3BCC2" }}>
                    Selected:{" "}
                    <span className="font-medium">{clientSearch}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Calendar */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-2 hover:bg-[#353A3A] rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-[#ABA4AA]" />
                </button>
                <h3 className="text-lg font-semibold text-white">
                  {format(currentMonth, "MMMM yyyy")}
                </h3>
                <button
                  onClick={() => navigateMonth("next")}
                  className="p-2 hover:bg-[#353A3A] rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-[#ABA4AA]" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-[#ABA4AA] py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(day => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected =
                    selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const lessonsOnDay = getLessonsForDate(day);

                  return (
                    <button
                      key={day.toString()}
                      onClick={() => {
                        if (isCurrentMonth) {
                          setSelectedDate(day);
                          setSelectedTime("");
                        }
                      }}
                      disabled={!isCurrentMonth}
                      className={`
                        aspect-square p-1 rounded-lg text-sm transition-all
                        ${!isCurrentMonth ? "text-[#606364]" : "text-white"}
                        ${isSelected ? "bg-[#4A5A70] text-white" : ""}
                        ${
                          !isSelected && isCurrentMonth
                            ? "hover:bg-[#353A3A]"
                            : ""
                        }
                        ${isToday && !isSelected ? "ring-2 ring-[#4A5A70]" : ""}
                      `}
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={isToday && !isSelected ? "font-bold" : ""}
                        >
                          {format(day, "d")}
                        </span>
                        {lessonsOnDay.length > 0 && (
                          <div className="w-1 h-1 bg-[#4A5A70] rounded-full mt-0.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Select Time <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {timeSlots.map(time => {
                    const isAvailable = isTimeSlotAvailable(selectedDate, time);
                    const isSelected = selectedTime === time;

                    return (
                      <button
                        key={time}
                        onClick={() => isAvailable && setSelectedTime(time)}
                        disabled={!isAvailable}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-all
                          ${
                            isSelected
                              ? "bg-[#4A5A70] text-white"
                              : isAvailable
                              ? "bg-[#353A3A] text-white hover:bg-[#4A5A70]"
                              : "bg-[#2A3133] text-[#606364] cursor-not-allowed"
                          }
                        `}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recurring Lesson Options */}
            <div className="border-t border-[#606364] pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={e => setIsRecurring(e.target.checked)}
                  className="w-5 h-5 rounded border-[#606364] bg-[#353A3A] text-[#4A5A70] focus:ring-[#4A5A70]"
                />
                <div className="flex items-center gap-2">
                  <Repeat className="h-5 w-5 text-[#ABA4AA]" />
                  <span className="text-white font-medium">
                    Make this a recurring lesson
                  </span>
                </div>
              </label>

              {isRecurring && (
                <div className="mt-4 space-y-4 pl-8">
                  {/* Recurrence Pattern */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Recurrence Pattern
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "weekly", label: "Weekly" },
                        { value: "biweekly", label: "Bi-weekly" },
                        { value: "triweekly", label: "Tri-weekly" },
                        { value: "monthly", label: "Monthly" },
                      ].map(pattern => (
                        <button
                          key={pattern.value}
                          onClick={() =>
                            setRecurrencePattern(
                              pattern.value as
                                | "weekly"
                                | "biweekly"
                                | "triweekly"
                                | "monthly"
                            )
                          }
                          className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${
                              recurrencePattern === pattern.value
                                ? "bg-[#4A5A70] text-white"
                                : "bg-[#353A3A] text-white hover:bg-[#4A5A70]"
                            }
                          `}
                        >
                          {pattern.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      min={
                        selectedDate
                          ? format(selectedDate, "yyyy-MM-dd")
                          : undefined
                      }
                      className="w-full px-4 py-2 bg-[#353A3A] border border-[#606364] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4A5A70]"
                    />
                  </div>

                  {/* Preview Dates */}
                  {previewDates.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Preview ({previewDates.length} lessons)
                      </label>
                      <div className="bg-[#353A3A] rounded-lg p-4 max-h-32 overflow-y-auto">
                        <div className="space-y-1">
                          {previewDates.slice(0, 10).map((date, index) => (
                            <div
                              key={index}
                              className="text-sm text-[#ABA4AA] flex items-center gap-2"
                            >
                              <CalendarDays className="h-4 w-4" />
                              {format(date, "EEEE, MMMM d, yyyy")}
                            </div>
                          ))}
                          {previewDates.length > 10 && (
                            <div className="text-sm text-[#ABA4AA] italic">
                              ... and {previewDates.length - 10} more
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Email Notification */}
            <div className="border-t border-[#606364] pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={e => setSendEmail(e.target.checked)}
                  className="w-5 h-5 rounded border-[#606364] bg-[#353A3A] text-[#4A5A70] focus:ring-[#4A5A70]"
                />
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[#ABA4AA]" />
                  <span className="text-white">Send email notification</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#606364]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white hover:bg-[#353A3A] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={
              isScheduling ||
              !selectedDate ||
              !selectedTime ||
              !selectedClientId ||
              !filteredClients.find((c: any) => c.id === selectedClientId)
            }
            className="px-6 py-2 bg-[#4A5A70] text-white rounded-lg hover:bg-[#606364] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isScheduling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Schedule Lesson
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
