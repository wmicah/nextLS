"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Trash2,
  Plus,
  Copy,
  Clipboard,
  CheckCircle,
  Calendar,
  Loader2,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
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
  addWeeks,
  subWeeks,
  isPast,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {
  formatTimeInUserTimezone,
  formatDateTimeInUserTimezone,
  getUserTimezone,
} from "@/lib/timezone-utils";
import OrganizationScheduleLessonModal from "./OrganizationScheduleLessonModal";
import BlockedTimesModal from "./BlockedTimesModal";
// Using inline modal for organization calendar

export default function OrganizationCalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayOverviewModal, setShowDayOverviewModal] = useState(false);
  const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [scheduleForm, setScheduleForm] = useState({
    clientId: "",
    coachId: "",
    time: "",
    date: "",
  });
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showBlockedTimesModal, setShowBlockedTimesModal] = useState(false);

  // Multi-select deletion
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [isDeletingMultipleDays, setIsDeletingMultipleDays] = useState(false);

  // Copy/paste functionality
  const [clipboardData, setClipboardData] = useState<any>(null);

  const { data: currentUser } = trpc.user.getProfile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const { data: organization } = trpc.organization.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const utils = trpc.useUtils();

  // Fetch organization lessons
  const {
    data: allLessons = [],
    isLoading,
    refetch,
  } = trpc.organization.getOrganizationLessons.useQuery(
    {
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    },
    {
      staleTime: 30 * 1000,
    }
  );

  // Fetch organization clients for assignments
  const { data: organizationClients = [] } =
    trpc.organization.getOrganizationClients.useQuery(undefined, {
      staleTime: 5 * 60 * 1000,
    });

  // Fetch blocked times for all coaches
  const { data: allBlockedTimes = [] } =
    trpc.blockedTimes.getAllBlockedTimes.useQuery(undefined, {
      staleTime: 30 * 1000,
    });

  // Fetch current user's profile for working hours
  const { data: currentUserProfile } = trpc.user.getProfile.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const deleteLessonMutation = trpc.scheduling.deleteLesson.useMutation({
    onSuccess: () => {
      toast.success("Lesson deleted successfully");
      refetch();
      setShowDayDetailsModal(false);
      setSelectedDate(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete lesson");
    },
  });

  const scheduleOrganizationLessonMutation =
    trpc.organization.scheduleOrganizationLesson.useMutation({
      onSuccess: () => {
        toast.success("Lesson scheduled successfully!");
        refetch();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to schedule lesson");
      },
    });

  // Generate calendar days based on view mode
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  let calendarStart: Date;
  let calendarEnd: Date;

  if (viewMode === "week") {
    calendarStart = startOfWeek(currentMonth, { weekStartsOn: 0 });
    calendarEnd = endOfWeek(currentMonth, { weekStartsOn: 0 });
  } else {
    calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  }

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const navigateMonth = (direction: "prev" | "next") => {
    let newDate: Date;
    if (viewMode === "week") {
      newDate =
        direction === "prev"
          ? subWeeks(currentMonth, 1)
          : addWeeks(currentMonth, 1);
    } else {
      newDate =
        direction === "prev"
          ? subMonths(currentMonth, 1)
          : addMonths(currentMonth, 1);
    }
    setCurrentMonth(newDate);
    refetch();
  };

  const getLessonsForDate = (date: Date) => {
    return allLessons.filter((lesson: any) => {
      const lessonDate = new Date(lesson.date);
      return isSameDay(lessonDate, date);
    });
  };

  const getBlockedTimesForDate = (date: Date, coachId?: string) => {
    return allBlockedTimes.filter((blockedTime: any) => {
      if (coachId && blockedTime.coachId !== coachId) return false;

      const startDate = new Date(blockedTime.startTime);
      const endDate = new Date(blockedTime.endTime);

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      if (blockedTime.isAllDay) {
        return startDate <= targetDate && targetDate <= endDate;
      }

      return startDate <= targetDate && targetDate <= endDate;
    });
  };

  const handleDateClick = (date: Date) => {
    if (multiSelectMode) {
      const dayKey = date.toISOString().split("T")[0];
      setSelectedDays(prev => {
        const newSet = new Set(prev);
        if (newSet.has(dayKey)) {
          newSet.delete(dayKey);
        } else {
          newSet.add(dayKey);
        }
        return newSet;
      });
    } else {
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
      if (!isPast) {
        setSelectedDate(date);
        setShowDayOverviewModal(true);
        setScheduleForm({
          clientId: "",
          coachId: currentUser?.id || "",
          time: "",
          date: date.toISOString().split("T")[0],
        });
        setSelectedTimeSlot("");
      }
    }
  };

  // Copy/paste functionality
  const handleCopyDay = (date: Date) => {
    const lessons = getLessonsForDate(date);
    const totalItems = lessons.length;

    if (totalItems === 0) {
      toast.warning("No lessons to copy from this day");
      return;
    }

    const clipboardData = {
      type: "organization_lessons",
      sourceDate: date.toISOString().split("T")[0],
      lessons: lessons.map((lesson: any) => ({
        id: lesson.id,
        clientId: lesson.clientId,
        clientName: lesson.client?.name,
        coachId: lesson.coachId,
        date: lesson.date,
        status: lesson.status,
      })),
      copiedAt: new Date(),
    };

    setClipboardData(clipboardData);
    toast.success(`Copied ${totalItems} lesson${totalItems !== 1 ? "s" : ""}`);
  };

  const handlePasteDay = async (targetDate: Date) => {
    if (!clipboardData || clipboardData.type !== "organization_lessons") {
      toast.error("No lessons copied to paste");
      return;
    }

    const targetDateStr = targetDate.toISOString().split("T")[0];
    const sourceDateStr = new Date(clipboardData.sourceDate)
      .toISOString()
      .split("T")[0];

    if (targetDateStr === sourceDateStr) {
      toast.error("Cannot paste to the same day");
      return;
    }

    if (
      !confirm(
        `Paste ${clipboardData.lessons.length} lesson(s) to ${format(
          targetDate,
          "MMM d, yyyy"
        )}?`
      )
    ) {
      return;
    }

    // Schedule lessons for each copied lesson
    const scheduleMutation =
      trpc.organization.scheduleOrganizationLesson.useMutation();

    for (const lesson of clipboardData.lessons) {
      try {
        const originalDate = new Date(lesson.date);
        const newDate = new Date(targetDate);
        newDate.setHours(
          originalDate.getHours(),
          originalDate.getMinutes(),
          0,
          0
        );

        await scheduleMutation.mutateAsync({
          clientId: lesson.clientId,
          lessonDate: newDate.toISOString(),
          sendEmail: false,
        });
      } catch (error: any) {
        console.error(`Error pasting lesson:`, error);
      }
    }

    toast.success(`Pasted ${clipboardData.lessons.length} lesson(s)`);
    setClipboardData(null);
    refetch();
  };

  // Multi-select deletion
  const handleDeleteMultipleDays = async () => {
    if (selectedDays.size === 0) return;

    const daysArray = Array.from(selectedDays);
    const confirmationMessage = `Are you sure you want to delete all lessons from ${
      selectedDays.size
    } day${selectedDays.size !== 1 ? "s" : ""}?`;

    if (!confirm(confirmationMessage)) {
      return;
    }

    setIsDeletingMultipleDays(true);

    try {
      let deletedCount = 0;

      for (const dayKey of daysArray) {
        const [year, month, dayNum] = dayKey.split("-").map(Number);
        const day = new Date(year, month - 1, dayNum);
        day.setHours(0, 0, 0, 0);

        const lessons = getLessonsForDate(day);

        for (const lesson of lessons) {
          try {
            // Only delete if user is the coach or has admin/owner role
            if (
              lesson.coachId === currentUser?.id ||
              userRole === "ADMIN" ||
              userRole === "OWNER"
            ) {
              await deleteLessonMutation.mutateAsync({ lessonId: lesson.id });
              deletedCount++;
            }
          } catch (error: any) {
            console.error(`Error deleting lesson ${lesson.id}:`, error);
          }
        }
      }

      toast.success(
        `Deleted ${deletedCount} lesson${deletedCount !== 1 ? "s" : ""} from ${
          selectedDays.size
        } day${selectedDays.size !== 1 ? "s" : ""}`
      );

      setSelectedDays(new Set());
      setMultiSelectMode(false);
      refetch();
    } catch (error: any) {
      toast.error("Some lessons could not be deleted");
    } finally {
      setIsDeletingMultipleDays(false);
    }
  };

  const toggleDaySelection = (day: Date) => {
    const dayKey = day.toISOString().split("T")[0];
    setSelectedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayKey)) {
        newSet.delete(dayKey);
      } else {
        newSet.add(dayKey);
      }
      return newSet;
    });
  };

  const coachColors: Record<string, string> = {};
  organization?.coaches.forEach((coach: any, index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-red-500",
    ];
    if (coach.id === currentUser?.id) {
      coachColors[coach.id] = "bg-blue-500";
    } else {
      const availableColors = colors.slice(1);
      coachColors[coach.id] = availableColors[index % availableColors.length];
    }
  });

  const currentUserMembership = organization?.coaches.find(
    (c: any) => c.id === currentUser?.id
  );
  const userRole = currentUserMembership?.role || "COACH";

  if (!organization) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl border"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div>
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: "#C3BCC2" }}
          >
            Organization Calendar
          </h1>
          <p className="text-xs" style={{ color: "#ABA4AA" }}>
            All lessons from {organization.coaches.length} coaches
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Schedule Lesson
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBlockedTimesModal(true)}
            className="flex items-center gap-2"
          >
            <Ban className="h-4 w-4" />
            Block Time
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div
        className="rounded-xl border"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div className="p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Calendar View</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "month"
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    backgroundColor:
                      viewMode === "month" ? "#4A5A70" : "transparent",
                  }}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "week"
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    backgroundColor:
                      viewMode === "week" ? "#4A5A70" : "transparent",
                  }}
                >
                  Week
                </button>
              </div>

              {/* Multi-Select Mode Toggle */}
              <button
                onClick={() => {
                  setMultiSelectMode(!multiSelectMode);
                  if (multiSelectMode) {
                    setSelectedDays(new Set());
                  }
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                  multiSelectMode
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-gray-700/50 text-gray-300 hover:bg-gray-700/70"
                }`}
              >
                {multiSelectMode ? "Cancel Selection" : "Select Days"}
              </button>

              {/* Delete Selected Button */}
              {multiSelectMode && selectedDays.size > 0 && (
                <button
                  onClick={handleDeleteMultipleDays}
                  disabled={isDeletingMultipleDays}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: "#EF4444" }}
                >
                  {isDeletingMultipleDays ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    `Delete ${selectedDays.size} Day${
                      selectedDays.size !== 1 ? "s" : ""
                    }`
                  )}
                </button>
              )}

              {/* Clipboard Indicator */}
              {clipboardData && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Clipboard className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm text-cyan-300">
                    {clipboardData.lessons?.length || 0} lesson
                    {(clipboardData.lessons?.length || 0) !== 1 ? "s" : ""}{" "}
                    copied
                  </span>
                  <button
                    onClick={() => setClipboardData(null)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
                  style={{ color: "#C3BCC2" }}
                  title="Previous"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-xl font-semibold text-white min-w-[200px] text-center">
                  {viewMode === "week"
                    ? `${format(calendarStart, "MMM d")} - ${format(
                        calendarEnd,
                        "MMM d, yyyy"
                      )}`
                    : format(currentMonth, "MMMM yyyy")}
                </h3>
                <button
                  onClick={() => navigateMonth("next")}
                  className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
                  style={{ color: "#C3BCC2" }}
                  title="Next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Coach Legend */}
          <div className="mb-6 flex flex-wrap gap-4">
            {organization.coaches.map((coach: any) => (
              <div key={coach.id} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded ${
                    coachColors[coach.id] || "bg-gray-500"
                  }`}
                />
                <span className="text-sm" style={{ color: "#ABA4AA" }}>
                  {coach.name || "Unknown"}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: "#2A3133" }}
          >
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div
                  key={day}
                  className="text-center text-sm font-bold py-3 border-b-2"
                  style={{ color: "#4A5A70", borderColor: "#606364" }}
                >
                  {day}
                </div>
              ))}
              {calendarDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isPastDay = isPast(day);
                const lessonsForDay = getLessonsForDate(day);
                const dayKey = day.toISOString().split("T")[0];
                const isSelected = selectedDays.has(dayKey);
                const hasAssignments = lessonsForDay.length > 0;

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      ${
                        viewMode === "week" ? "min-h-[200px]" : "min-h-[120px]"
                      } p-2 rounded-lg transition-all duration-200 border-2 relative group
                      ${
                        isSelected
                          ? "bg-red-500/30 text-white border-red-400 ring-2 ring-red-400"
                          : isToday
                          ? "bg-blue-500/20 text-blue-300 border-blue-400"
                          : isPastDay
                          ? "text-gray-500 bg-gray-700/30 border-gray-600"
                          : isCurrentMonth
                          ? "text-white bg-gray-800/50 border-gray-600 hover:bg-blue-500/10 hover:border-blue-400"
                          : "text-gray-600 bg-gray-900/30 border-gray-700"
                      }
                      ${multiSelectMode ? "cursor-pointer" : ""}
                    `}
                    onClick={
                      multiSelectMode && hasAssignments
                        ? () => toggleDaySelection(day)
                        : !multiSelectMode
                        ? () => handleDateClick(day)
                        : undefined
                    }
                  >
                    {/* Selection Checkbox */}
                    {multiSelectMode && hasAssignments && (
                      <div className="absolute top-2 left-2 z-20">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? "bg-red-500 border-red-400"
                              : "bg-gray-800/80 border-gray-500"
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hover Overlay with Copy/Paste Buttons */}
                    {!multiSelectMode && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-10">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleCopyDay(day);
                          }}
                          className="p-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-200"
                          title="Copy day lessons"
                        >
                          <Copy className="h-3 w-3 text-cyan-400" />
                        </button>

                        {clipboardData && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handlePasteDay(day);
                            }}
                            className="p-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-200"
                            title="Paste lessons to this day"
                          >
                            <Clipboard className="h-3 w-3 text-emerald-400" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Day Content */}
                    <div
                      className="cursor-pointer h-full"
                      style={
                        multiSelectMode && hasAssignments
                          ? { paddingLeft: "1.75rem" }
                          : {}
                      }
                    >
                      <div className="font-bold text-sm mb-2">
                        {format(day, "d")}
                      </div>

                      {/* Lessons */}
                      <div className="space-y-1">
                        {lessonsForDay.slice(0, 3).map((lesson: any) => {
                          const isMyLesson = lesson.coachId === currentUser?.id;
                          const coach = organization?.coaches.find(
                            (c: any) => c.id === lesson.coachId
                          );
                          return (
                            <div
                              key={lesson.id}
                              className={`text-xs px-2 py-1 rounded truncate ${
                                coachColors[lesson.coachId] || "bg-gray-500"
                              }`}
                              style={{ color: "#fff" }}
                              title={`${lesson.client?.name || "Client"} with ${
                                coach?.name || "Coach"
                              } - ${formatTimeInUserTimezone(lesson.date)}`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">
                                  {lesson.client?.name || "Client"}
                                </span>
                                {!isMyLesson && coach && (
                                  <span className="text-[10px] opacity-80 truncate">
                                    {coach.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {lessonsForDay.length > 3 && (
                          <div
                            className="text-xs px-2"
                            style={{ color: "#ABA4AA" }}
                          >
                            +{lessonsForDay.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Day Overview Modal - Like Schedule Page */}
      {showDayOverviewModal && selectedDate && (
        <OrganizationDayOverviewModal
          date={selectedDate}
          lessons={getLessonsForDate(selectedDate)}
          coaches={organization.coaches || []}
          coachColors={coachColors}
          currentUserId={currentUser?.id}
          userRole={userRole}
          organizationClients={organizationClients}
          allBlockedTimes={allBlockedTimes}
          currentUserProfile={currentUserProfile}
          selectedTimeSlot={selectedTimeSlot}
          setSelectedTimeSlot={setSelectedTimeSlot}
          scheduleForm={scheduleForm}
          setScheduleForm={setScheduleForm}
          clientSearch={clientSearch}
          setClientSearch={setClientSearch}
          showClientDropdown={showClientDropdown}
          setShowClientDropdown={setShowClientDropdown}
          onScheduleLesson={async (
            clientId: string,
            coachId: string,
            timeSlot: string
          ) => {
            const [year, month, day] = scheduleForm.date.split("-").map(Number);
            const timeMatch = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!timeMatch) {
              toast.error("Invalid time format");
              return;
            }

            const [, hours, minutes, period] = timeMatch;
            let hour = parseInt(hours);
            if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
            if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

            const lessonDate = new Date(
              year,
              month - 1,
              day,
              hour,
              parseInt(minutes)
            );
            const dateStr = lessonDate.toISOString();

            await scheduleOrganizationLessonMutation.mutateAsync({
              clientId,
              lessonDate: dateStr,
              sendEmail: true,
            });

            setSelectedTimeSlot("");
            setScheduleForm({
              clientId: "",
              coachId: "",
              time: "",
              date: scheduleForm.date,
            });
          }}
          onDeleteLesson={(lessonId: string) => {
            if (confirm("Are you sure you want to delete this lesson?")) {
              deleteLessonMutation.mutate({ lessonId });
            }
          }}
          onScheduleWithCustomTime={() => {
            setShowDayOverviewModal(false);
            setShowScheduleModal(true);
          }}
          onCopy={() => handleCopyDay(selectedDate)}
          onPaste={() => handlePasteDay(selectedDate)}
          canPaste={!!clipboardData}
          onClose={() => {
            setShowDayOverviewModal(false);
            setSelectedDate(null);
            setSelectedTimeSlot("");
            setScheduleForm({ clientId: "", coachId: "", time: "", date: "" });
          }}
        />
      )}

      {/* Legacy Day Details Modal - keeping for backwards compatibility */}
      {showDayDetailsModal && selectedDate && (
        <OrganizationDayDetailsModal
          date={selectedDate}
          lessons={getLessonsForDate(selectedDate)}
          coaches={organization.coaches || []}
          coachColors={coachColors}
          currentUserId={currentUser?.id}
          userRole={userRole}
          onDeleteLesson={(lessonId: string) => {
            if (confirm("Are you sure you want to delete this lesson?")) {
              deleteLessonMutation.mutate({ lessonId });
            }
          }}
          onScheduleLesson={() => {
            setShowDayDetailsModal(false);
            setShowScheduleModal(true);
          }}
          onCopy={() => handleCopyDay(selectedDate)}
          onPaste={() => handlePasteDay(selectedDate)}
          canPaste={!!clipboardData}
          onClose={() => setShowDayDetailsModal(false)}
        />
      )}

      {/* Schedule Lesson Modal */}
      <OrganizationScheduleLessonModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedDate(null);
          refetch();
        }}
        startDate={
          selectedDate
            ? `${selectedDate.getFullYear()}-${String(
                selectedDate.getMonth() + 1
              ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(
                2,
                "0"
              )}`
            : undefined
        }
      />

      {/* Blocked Times Modal */}
      <BlockedTimesModal
        isOpen={showBlockedTimesModal}
        onClose={() => setShowBlockedTimesModal(false)}
        month={currentMonth.getMonth()}
        year={currentMonth.getFullYear()}
      />
    </div>
  );
}

// Organization Day Overview Modal - Like Schedule Page
function OrganizationDayOverviewModal({
  date,
  lessons,
  coaches,
  coachColors,
  currentUserId,
  userRole,
  organizationClients,
  allBlockedTimes,
  currentUserProfile,
  selectedTimeSlot,
  setSelectedTimeSlot,
  scheduleForm,
  setScheduleForm,
  clientSearch,
  setClientSearch,
  showClientDropdown,
  setShowClientDropdown,
  onScheduleLesson,
  onDeleteLesson,
  onScheduleWithCustomTime,
  onCopy,
  onPaste,
  canPaste,
  onClose,
}: {
  date: Date;
  lessons: any[];
  coaches: any[];
  coachColors: Record<string, string>;
  currentUserId?: string;
  userRole: string;
  organizationClients: any[];
  allBlockedTimes: any[];
  currentUserProfile: any;
  selectedTimeSlot: string;
  setSelectedTimeSlot: (slot: string) => void;
  scheduleForm: {
    clientId: string;
    coachId: string;
    time: string;
    date: string;
  };
  setScheduleForm: (form: any) => void;
  clientSearch: string;
  setClientSearch: (search: string) => void;
  showClientDropdown: boolean;
  setShowClientDropdown: (show: boolean) => void;
  onScheduleLesson: (
    clientId: string,
    coachId: string,
    timeSlot: string
  ) => Promise<void>;
  onDeleteLesson: (lessonId: string) => void;
  onScheduleWithCustomTime: () => void;
  onCopy: () => void;
  onPaste: () => void;
  canPaste: boolean;
  onClose: () => void;
}) {
  const getCoachName = (coachId: string) => {
    const coach = coaches.find((c: any) => c.id === coachId);
    return coach?.name || "Unknown Coach";
  };

  const canDeleteLesson = (lesson: any) => {
    return (
      lesson.coachId === currentUserId ||
      userRole === "ADMIN" ||
      userRole === "OWNER"
    );
  };

  // Get blocked times for this date
  const getBlockedTimesForDate = (date: Date) => {
    return allBlockedTimes.filter((blockedTime: any) => {
      const startDate = new Date(blockedTime.startTime);
      const endDate = new Date(blockedTime.endTime);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      if (blockedTime.isAllDay) {
        return startDate <= targetDate && targetDate <= endDate;
      }
      return startDate <= targetDate && targetDate <= endDate;
    });
  };

  // Generate time slots based on coach's working hours (use current user's working hours as default)
  const generateTimeSlots = () => {
    // For organization, we could aggregate working hours from all coaches
    // For now, use current user's working hours as the default
    const startTime = currentUserProfile?.workingHours?.startTime || "9:00 AM";
    const endTime = currentUserProfile?.workingHours?.endTime || "8:00 PM";
    const interval = currentUserProfile?.workingHours?.timeSlotInterval || 60;

    const slots = [];

    // Parse start and end times
    const startMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    const endMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!startMatch || !endMatch) {
      // Fallback to default hours with hourly slots
      for (let hour = 9; hour < 18; hour++) {
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const period = hour >= 12 ? "PM" : "AM";
        slots.push(`${displayHour}:00 ${period}`);
      }
      return slots;
    }

    const [, startHour, startMinute, startPeriod] = startMatch;
    const [, endHour, endMinute, endPeriod] = endMatch;

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

    // Get current time to filter out past slots for today
    const now = new Date();
    const isToday = format(now, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

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
        hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const period = hour24 >= 12 ? "PM" : "AM";
      const minuteStr = minute.toString().padStart(2, "0");

      slots.push(`${displayHour}:${minuteStr} ${period}`);
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Filter clients based on search
  const filteredClients = organizationClients.filter((client: any) => {
    if (!clientSearch.trim()) return true;
    const searchLower = clientSearch.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  });

  // Check if time slot is available (not booked)
  // Need to compare times properly accounting for timezone
  const isTimeSlotAvailable = (timeSlot: string) => {
    const timeZone = getUserTimezone();

    // Parse the time slot to get hour and minute
    const timeMatch = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return true;

    const [, hours, minutes, period] = timeMatch;
    let hour24 = parseInt(hours);
    if (period.toUpperCase() === "PM" && hour24 !== 12) hour24 += 12;
    if (period.toUpperCase() === "AM" && hour24 === 12) hour24 = 0;

    // Check if any lesson conflicts with this time slot
    return !lessons.some((lesson: any) => {
      // Convert UTC lesson time to user's timezone for comparison
      const lessonDateInUserTz = toZonedTime(lesson.date, timeZone);
      const lessonHour = lessonDateInUserTz.getHours();
      const lessonMinute = lessonDateInUserTz.getMinutes();

      // Check if the time matches (within the same hour, considering interval)
      // For simplicity, match exact hour:minute
      return lessonHour === hour24 && lessonMinute === parseInt(minutes);
    });
  };

  // Get blocked times for this date
  const dayBlockedTimes = getBlockedTimesForDate(date);

  // Check if time slot is blocked
  const isTimeSlotBlocked = (timeSlot: string) => {
    return dayBlockedTimes.some((blockedTime: any) => {
      if (blockedTime.isAllDay) return true;
      // Check if time slot falls within blocked time range
      const timeMatch = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return false;
      const [, hours, minutes, period] = timeMatch;
      let hour24 = parseInt(hours);
      if (period.toUpperCase() === "PM" && hour24 !== 12) hour24 += 12;
      if (period.toUpperCase() === "AM" && hour24 === 12) hour24 = 0;

      const slotDate = new Date(date);
      slotDate.setHours(hour24, parseInt(minutes), 0, 0);
      const blockedStart = new Date(blockedTime.startTime);
      const blockedEnd = new Date(blockedTime.endTime);

      return slotDate >= blockedStart && slotDate < blockedEnd;
    });
  };

  const handleScheduleFromSlot = async () => {
    if (!selectedTimeSlot || !scheduleForm.clientId) {
      toast.error("Please select a time slot and client");
      return;
    }

    try {
      await onScheduleLesson(
        scheduleForm.clientId,
        scheduleForm.coachId || currentUserId || "",
        selectedTimeSlot
      );
      toast.success("Lesson scheduled successfully!");
      setSelectedTimeSlot("");
      setScheduleForm({ ...scheduleForm, clientId: "", time: "" });
      setClientSearch("");
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule lesson");
    }
  };

  // Close dropdown when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="rounded-2xl shadow-xl border p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {format(date, "EEEE, MMMM d, yyyy")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            {canPaste && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPaste}
                className="flex items-center gap-2"
              >
                <Clipboard className="h-4 w-4" />
                Paste
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Existing Lessons */}
        <div className="mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">
              Scheduled Lessons ({lessons.length})
            </h3>
          </div>

          {lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons.map((lesson: any) => {
                const lessonDate = new Date(lesson.date);
                const isPast = lessonDate < new Date();
                return (
                  <div
                    key={lesson.id}
                    className={`flex items-center justify-between p-4 rounded-lg border group ${
                      isPast
                        ? "bg-gray-800/20 border-gray-600/30"
                        : "bg-emerald-500/10 border-emerald-500/20"
                    }`}
                  >
                    <div className="flex-1 flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded ${
                          coachColors[lesson.coachId] || "bg-gray-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div
                          className={`font-medium ${
                            isPast ? "text-gray-400" : "text-emerald-300"
                          }`}
                        >
                          {formatTimeInUserTimezone(lesson.date)}
                        </div>
                        <div
                          className={`text-sm ${
                            isPast ? "text-gray-500" : "text-emerald-200"
                          }`}
                        >
                          {lesson.client?.name || "Client"}
                        </div>
                        <div
                          className={`text-xs ${
                            isPast ? "text-gray-600" : "text-emerald-400"
                          }`}
                        >
                          Coach: {getCoachName(lesson.coachId)}
                        </div>
                      </div>
                    </div>
                    {!isPast && canDeleteLesson(lesson) && (
                      <button
                        onClick={() => onDeleteLesson(lesson.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
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
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No lessons scheduled for this day</p>
            </div>
          )}
        </div>

        {/* Available Time Slots */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Available Time Slots
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={onScheduleWithCustomTime}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Custom Time
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {timeSlots.map((slot: string) => {
              const isAvailable = isTimeSlotAvailable(slot);
              const isBlocked = isTimeSlotBlocked(slot);
              const isSelected = selectedTimeSlot === slot;

              return (
                <button
                  key={slot}
                  onClick={() => {
                    if (isAvailable && !isBlocked) {
                      setSelectedTimeSlot(slot);
                      setScheduleForm({ ...scheduleForm, time: slot });
                    }
                  }}
                  disabled={!isAvailable || isBlocked}
                  className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                    isSelected
                      ? "bg-sky-500 border-sky-400 text-white"
                      : "hover:bg-sky-500/10 hover:border-sky-500/30"
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? "#0EA5E9"
                      : isBlocked
                      ? "#1F2426"
                      : "#2A2F2F",
                    borderColor: isBlocked
                      ? "#EF4444"
                      : isSelected
                      ? "#0EA5E9"
                      : "#606364",
                    color: isBlocked ? "#EF4444" : "#FFFFFF",
                    cursor:
                      !isAvailable || isBlocked ? "not-allowed" : "pointer",
                    opacity: !isAvailable || isBlocked ? 0.5 : 1,
                  }}
                  title={
                    isBlocked
                      ? `Blocked: ${
                          dayBlockedTimes.find((bt: any) => bt.isAllDay || true)
                            ?.title || "Time blocked"
                        } (Coach can override)`
                      : !isAvailable
                      ? "Already booked"
                      : ""
                  }
                >
                  {slot}
                </button>
              );
            })}
          </div>

          {/* Schedule Lesson Section */}
          {selectedTimeSlot && (
            <div
              className="mt-4 pt-4 border-t"
              style={{ borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400">
                    Selected time:{" "}
                    <span className="text-white font-medium">
                      {selectedTimeSlot}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Choose a client to schedule the lesson
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1" ref={dropdownRef}>
                  <input
                    type="text"
                    placeholder="Search for a client..."
                    value={clientSearch}
                    onChange={e => {
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    className="w-full p-2 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      backgroundColor: "#2A2F2F",
                      borderColor: "#606364",
                    }}
                  />

                  {/* Dropdown */}
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div
                      className="absolute z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-lg w-full"
                      style={{
                        backgroundColor: "#353A3A",
                        borderColor: "#606364",
                      }}
                    >
                      {filteredClients.map((client: any) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            setScheduleForm({
                              ...scheduleForm,
                              clientId: client.id,
                            });
                            setClientSearch(client.name || client.email || "");
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
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleScheduleFromSlot}
                  disabled={!scheduleForm.clientId}
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: "#10B981",
                    color: "#FFFFFF",
                  }}
                >
                  <CheckCircle className="h-4 w-4" />
                  Schedule Lesson
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Organization Day Details Modal Component
function OrganizationDayDetailsModal({
  date,
  lessons,
  coaches,
  coachColors,
  currentUserId,
  userRole,
  onDeleteLesson,
  onScheduleLesson,
  onCopy,
  onPaste,
  canPaste,
  onClose,
}: {
  date: Date;
  lessons: any[];
  coaches: any[];
  coachColors: Record<string, string>;
  currentUserId?: string;
  userRole: string;
  onDeleteLesson: (lessonId: string) => void;
  onScheduleLesson: () => void;
  onCopy: () => void;
  onPaste: () => void;
  canPaste: boolean;
  onClose: () => void;
}) {
  const getCoachName = (coachId: string) => {
    const coach = coaches.find((c: any) => c.id === coachId);
    return coach?.name || "Unknown Coach";
  };

  const canDeleteLesson = (lesson: any) => {
    return (
      lesson.coachId === currentUserId ||
      userRole === "ADMIN" ||
      userRole === "OWNER"
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: "#353A3A" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: "#C3BCC2" }}>
            {format(date, "EEEE, MMMM d, yyyy")}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              className="flex items-center gap-2"
              title="Copy all lessons from this day"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            {canPaste && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPaste}
                className="flex items-center gap-2"
                title="Paste lessons to this day"
              >
                <Clipboard className="h-4 w-4" />
                Paste
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onScheduleLesson}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Schedule Lesson
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {lessons.length === 0 ? (
          <p style={{ color: "#ABA4AA" }} className="text-center py-8">
            No lessons scheduled for this day
          </p>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson: any) => (
              <div
                key={lesson.id}
                className="p-4 rounded-xl"
                style={{
                  backgroundColor: "#2A3133",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-3 h-3 rounded ${
                          coachColors[lesson.coachId] || "bg-gray-500"
                        }`}
                      />
                      <span
                        className="font-semibold"
                        style={{ color: "#C3BCC2" }}
                      >
                        {lesson.client?.name || "Client"}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "#ABA4AA" }}
                    >
                      <Clock className="h-4 w-4" />
                      {formatTimeInUserTimezone(lesson.date)}
                    </div>
                    <div className="text-sm mt-1" style={{ color: "#ABA4AA" }}>
                      Coach: {getCoachName(lesson.coachId)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        lesson.status === "CONFIRMED" ? "default" : "secondary"
                      }
                    >
                      {lesson.status}
                    </Badge>
                    {canDeleteLesson(lesson) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteLesson(lesson.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
