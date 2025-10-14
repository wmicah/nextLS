"use client";

import { useState } from "react";
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
} from "date-fns";
import OrganizationScheduleLessonModal from "./OrganizationScheduleLessonModal";

export default function OrganizationCalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const { data: currentUser } = trpc.user.getProfile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const { data: organization } = trpc.organization.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
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
      staleTime: 30 * 1000, // Cache lessons for 30 seconds
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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth =
      direction === "prev"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  const getLessonsForDate = (date: Date) => {
    return allLessons.filter((lesson: any) => {
      const lessonDate = new Date(lesson.date);
      return isSameDay(lessonDate, date);
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetailsModal(true);
  };

  const handleScheduleForDate = (date: Date) => {
    setSelectedDate(date);
    setShowScheduleModal(true);
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
    coachColors[coach.id] = colors[index % colors.length];
  });

  const currentUserMembership = organization?.coaches.find(
    c => c.id === currentUser?.id
  );
  const userRole = currentUserMembership?.role || "COACH";

  if (!organization) return null;

  return (
    <div className="space-y-4">
      {/* Compact Header */}
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
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: "#C3BCC2" }}>
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-2">
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
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
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
                  className="text-center text-sm font-bold py-2"
                  style={{ color: "#ABA4AA" }}
                >
                  {day}
                </div>
              ))}
              {calendarDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const lessonsForDay = getLessonsForDate(day);

                return (
                  <div
                    key={day.toString()}
                    onClick={() => handleDateClick(day)}
                    className={`
                        min-h-[100px] p-2 rounded-lg cursor-pointer transition-all
                        ${isCurrentMonth ? "" : "opacity-40"}
                        ${
                          isToday
                            ? "ring-2 ring-blue-500 bg-blue-500/10"
                            : "hover:bg-white/5"
                        }
                      `}
                  >
                    <div
                      className="text-sm font-semibold mb-1"
                      style={{
                        color: isCurrentMonth ? "#C3BCC2" : "#6B7280",
                      }}
                    >
                      {format(day, "d")}
                    </div>
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
                              isMyLesson
                                ? "bg-green-600"
                                : coachColors[lesson.coachId] || "bg-gray-500"
                            }`}
                            style={{ color: "#fff" }}
                            title={`${lesson.client?.name || "Client"} with ${
                              coach?.name || "Coach"
                            } - ${format(new Date(lesson.date), "h:mm a")}`}
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
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      {showDayDetailsModal && selectedDate && (
        <DayDetailsModal
          date={selectedDate}
          lessons={getLessonsForDate(selectedDate)}
          coaches={organization.coaches || []}
          coachColors={coachColors}
          currentUserId={currentUser?.id}
          onDeleteLesson={(lessonId: string) => {
            if (confirm("Are you sure you want to delete this lesson?")) {
              deleteLessonMutation.mutate({ lessonId });
            }
          }}
          onScheduleLesson={() => {
            setShowDayDetailsModal(false);
            setShowScheduleModal(true);
          }}
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
    </div>
  );
}

function DayDetailsModal({
  date,
  lessons,
  coaches,
  coachColors,
  currentUserId,
  onDeleteLesson,
  onScheduleLesson,
  onClose,
}: {
  date: Date;
  lessons: any[];
  coaches: any[];
  coachColors: Record<string, string>;
  currentUserId?: string;
  onDeleteLesson: (lessonId: string) => void;
  onScheduleLesson: () => void;
  onClose: () => void;
}) {
  const getCoachName = (coachId: string) => {
    const coach = coaches.find((c: any) => c.id === coachId);
    return coach?.name || "Unknown Coach";
  };

  const canDeleteLesson = (lesson: any) => {
    return lesson.coachId === currentUserId;
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
              onClick={() => {
                onScheduleLesson();
              }}
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
                      {format(new Date(lesson.date), "h:mm a")}
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
