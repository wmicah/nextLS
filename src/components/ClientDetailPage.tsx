"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  BookOpen,
  Target,
  Video,
  ArrowLeft,
  Loader2,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  User,
  Mail,
  Phone,
  MapPin,
  Zap,
  Edit,
  MessageCircle,
  Archive,
  MoreVertical,
  Filter,
  Search,
  Download,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  addDays,
  isToday,
  isPast,
  isFuture,
  parseISO,
  differenceInDays,
} from "date-fns";
import Sidebar from "@/components/Sidebar";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import AssignProgramModal from "@/components/AssignProgramModal";
import AssignRoutineModal from "@/components/AssignRoutineModal";
import AssignVideoModal from "@/components/AssignVideoModal";
import ScheduleLessonModal from "@/components/ScheduleLessonModal";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileClientDetailPage from "@/components/MobileClientDetailPage";

interface ClientDetailPageProps {
  clientId: string;
}

function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAssignProgramModal, setShowAssignProgramModal] = useState(false);
  const [showAssignRoutineModal, setShowAssignRoutineModal] = useState(false);
  const [showAssignVideoModal, setShowAssignVideoModal] = useState(false);
  const [showScheduleLessonModal, setShowScheduleLessonModal] = useState(false);
  const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"lessons">("lessons");
  const [compliancePeriod, setCompliancePeriod] = useState<
    "4" | "6" | "8" | "all"
  >("4");
  const [replacementData, setReplacementData] = useState<{
    programId: string;
    programTitle: string;
    dayDate: string;
  } | null>(null);

  // Fetch client data
  const { data: client, isLoading: clientLoading } =
    trpc.clients.getById.useQuery({ id: clientId }, { enabled: !!clientId });

  // Fetch coach's schedule for the current month (includes all client lessons)
  const { data: coachSchedule = [] } =
    trpc.scheduling.getCoachSchedule.useQuery({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });

  // Filter lessons for this specific client
  const clientLessons = coachSchedule.filter(
    (lesson: any) => lesson.clientId === clientId
  );

  // Fetch upcoming lessons for the coach (we'll filter for this client)
  const { data: coachUpcomingLessons = [] } =
    trpc.scheduling.getCoachUpcomingLessons.useQuery();

  // Filter upcoming lessons for this specific client
  const upcomingLessons = coachUpcomingLessons.filter(
    (lesson: any) => lesson.clientId === clientId
  );

  // Fetch client's assigned programs
  const { data: assignedPrograms = [] } =
    trpc.clients.getAssignedPrograms.useQuery({
      clientId,
    });

  // Fetch client's routine assignments
  const { data: assignedRoutines = [], isLoading: isLoadingRoutines } =
    trpc.routines.getClientRoutineAssignments.useQuery({
      clientId,
    });

  // Debug: Log routine assignments when they change
  useEffect(() => {
    if (assignedRoutines.length > 0) {
      console.log(
        "ClientDetailPage: Loaded routine assignments:",
        assignedRoutines.map(a => ({
          id: a.id,
          startDate: a.startDate,
          assignedAt: a.assignedAt,
          routineName: a.routine.name,
        }))
      );
    }
  }, [assignedRoutines]);

  // Fetch client's video assignments
  const { data: videoAssignments = [] } =
    trpc.library.getClientAssignments.useQuery({
      clientId,
    });

  // Fetch coach's working hours for time slot generation
  const { data: coachProfile } = trpc.user.getProfile.useQuery();

  // Fetch client compliance data
  const { data: complianceData, isLoading: complianceLoading } =
    trpc.clients.getComplianceData.useQuery({
      clientId,
      period: compliancePeriod,
    });

  const utils = trpc.useUtils();

  // Generate calendar days based on view mode
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  let calendarStart: Date;
  let calendarEnd: Date;

  if (viewMode === "week") {
    // For week view, show the week containing the current date
    calendarStart = startOfWeek(currentMonth, { weekStartsOn: 1 });
    calendarEnd = endOfWeek(currentMonth, { weekStartsOn: 1 });
  } else {
    // For month view, show the full month with surrounding days
    calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  }

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const navigateMonth = (direction: "prev" | "next") => {
    if (viewMode === "week") {
      // For week view, navigate by weeks
      setCurrentMonth(
        direction === "prev"
          ? subWeeks(currentMonth, 1)
          : addWeeks(currentMonth, 1)
      );
    } else {
      // For month view, navigate by months
      setCurrentMonth(
        direction === "prev"
          ? subMonths(currentMonth, 1)
          : addMonths(currentMonth, 1)
      );
    }
  };

  const getLessonsForDate = (date: Date) => {
    return clientLessons.filter((lesson: any) => {
      const lessonDate = new Date(lesson.date);
      return isSameDay(lessonDate, date);
    });
  };

  const getProgramsForDate = (date: Date) => {
    const programsForDate: any[] = [];

    assignedPrograms.forEach((assignment: any) => {
      // Check if this specific date has been replaced with a lesson
      const hasReplacement = assignment.replacements?.some(
        (replacement: any) => {
          const replacementDate = new Date(replacement.replacedDate);
          return isSameDay(replacementDate, date);
        }
      );

      // Skip this assignment if the date has been replaced
      if (hasReplacement) {
        return;
      }
      const program = assignment.program;
      const startDate = new Date(assignment.startDate || assignment.assignedAt);

      // Calculate which week and day this date falls on
      const daysSinceStart = Math.floor(
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only show if the date is within the program duration
      if (daysSinceStart >= 0 && daysSinceStart < program.duration * 7) {
        const weekNumber = Math.floor(daysSinceStart / 7) + 1;
        const dayNumber = (daysSinceStart % 7) + 1;

        // Find the corresponding program day
        const week = program.weeks?.find(
          (w: any) => w.weekNumber === weekNumber
        );
        if (week) {
          const programDay = week.days?.find(
            (d: any) => d.dayNumber === dayNumber
          );

          if (programDay) {
            // Check if it's a rest day
            if (programDay.isRestDay || programDay.drills?.length === 0) {
              // Show rest day indicator
              programsForDate.push({
                id: `${assignment.id}-${weekNumber}-${dayNumber}-rest`,
                title: `${program.title} - Rest Day`,
                description: "Recovery day",
                type: "rest",
                assignment,
                program,
                weekNumber,
                dayNumber,
                isRestDay: true,
              });
            } else {
              // Show workout day with program title and day info
              programsForDate.push({
                id: `${assignment.id}-${weekNumber}-${dayNumber}`,
                title: `${program.title} - ${
                  programDay.title
                    ? programDay.title.substring(0, 8)
                    : "Workout"
                }`,
                description: `${programDay.drills.length} drills`,
                type: "program",
                assignment,
                program,
                weekNumber,
                dayNumber,
                drillCount: programDay.drills.length,
                isRestDay: false,
              });
            }
          }
        }
      }
    });

    return programsForDate;
  };

  const getVideosForDate = (date: Date) => {
    return videoAssignments
      .filter((assignment: any) => {
        if (!assignment.dueDate) return false;
        const dueDate = new Date(assignment.dueDate);
        return isSameDay(dueDate, date);
      })
      .map((assignment: any) => ({
        id: assignment.id,
        title: assignment.video?.title || "Video Assignment",
        description: assignment.notes || "Video to complete",
        type: "video",
        assignment,
      }));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetailsModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
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
        return "bg-green-500/20 text-green-100 border-green-400";
      case "DECLINED":
        return "bg-red-500/20 text-red-100 border-red-400";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-100 border-yellow-400";
      default:
        return "bg-blue-500/20 text-blue-100 border-blue-400";
    }
  };

  const getRoutineAssignmentsForDate = (date: Date) => {
    return assignedRoutines.filter((assignment: any) => {
      const assignmentDate = new Date(
        assignment.startDate || assignment.assignedAt
      );
      const isMatch = isSameDay(assignmentDate, date);
      if (isMatch) {
        console.log("Calendar: Found routine assignment for date:", {
          targetDate: date.toISOString().split("T")[0],
          assignmentDate: assignmentDate.toISOString().split("T")[0],
          startDate: assignment.startDate,
          assignedAt: assignment.assignedAt,
          targetDateLocal: date.toLocaleDateString(),
          assignmentDateLocal: assignmentDate.toLocaleDateString(),
        });
      }
      return isMatch;
    });
  };

  if (clientLoading) {
    return (
      <Sidebar>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#2A3133" }}
        >
          <div
            className="flex items-center space-x-3"
            style={{ color: "#C3BCC2" }}
          >
            <Loader2
              className="h-8 w-8 animate-spin"
              style={{ color: "#4A5A70" }}
            />
            <span className="text-lg">Loading client details...</span>
          </div>
        </div>
      </Sidebar>
    );
  }

  if (!client) {
    return (
      <Sidebar>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#2A3133" }}
        >
          <div className="text-center">
            <h2
              className="text-2xl font-semibold mb-3"
              style={{ color: "#C3BCC2" }}
            >
              Client Not Found
            </h2>
            <p className="text-lg" style={{ color: "#ABA4AA" }}>
              The requested client could not be found.
            </p>
            <button
              onClick={() => router.push("/clients")}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            >
              Back to Clients
            </button>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            {/* Client Info */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push("/clients")}
                className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
                style={{ color: "#C3BCC2" }}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <ProfilePictureUploader
                currentAvatarUrl={
                  client.user?.settings?.avatarUrl || client.avatar
                }
                userName={client.name}
                onAvatarChange={() => {}}
                readOnly={true}
                size="lg"
              />

              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {client.name}
                </h1>
                <div
                  className="flex items-center gap-4 text-sm"
                  style={{ color: "#ABA4AA" }}
                >
                  {client.user?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {client.user.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowScheduleLessonModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-500/30"
                style={{ color: "#F59E0B" }}
              >
                <Calendar className="h-4 w-4" />
                Schedule Lesson
              </button>
              <button
                onClick={() => setShowAssignProgramModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30"
                style={{ color: "#3B82F6" }}
              >
                <BookOpen className="h-4 w-4" />
                Assign Program
              </button>
              <button
                onClick={() => setShowAssignRoutineModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/30"
                style={{ color: "#10B981" }}
              >
                <Target className="h-4 w-4" />
                Assign Routine
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div
              className="rounded-2xl p-6 shadow-xl border"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#ABA4AA" }}
                  >
                    Compliance Rate
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {complianceLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `${Math.min(
                        100,
                        Math.max(0, complianceData?.completionRate || 0)
                      )}%`
                    )}
                  </p>
                </div>
                <Target className="h-8 w-8" style={{ color: "#10B981" }} />
              </div>

              {/* Period Selector */}
              <div className="flex gap-1 mb-3">
                {["4", "6", "8", "all"].map(period => (
                  <button
                    key={period}
                    onClick={() =>
                      setCompliancePeriod(period as "4" | "6" | "8" | "all")
                    }
                    className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                      compliancePeriod === period
                        ? "text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                    style={{
                      backgroundColor:
                        compliancePeriod === period ? "#4A5A70" : "transparent",
                    }}
                  >
                    {period === "all" ? "All" : `${period}w`}
                  </button>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      complianceData?.completionRate || 0
                    )}%`,
                    backgroundColor:
                      Math.min(100, complianceData?.completionRate || 0) >= 80
                        ? "#10B981"
                        : Math.min(100, complianceData?.completionRate || 0) >=
                          60
                        ? "#F59E0B"
                        : "#EF4444",
                  }}
                />
              </div>

              {/* Stats */}
              {complianceData && (
                <div
                  className="flex justify-between text-xs mt-2"
                  style={{ color: "#ABA4AA" }}
                >
                  <span>
                    {Math.min(
                      complianceData.completed || 0,
                      complianceData.total || 0
                    )}{" "}
                    completed
                  </span>
                  <span>{complianceData.total || 0} total</span>
                </div>
              )}
            </div>

            <div
              className="rounded-2xl p-6 shadow-xl border"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#ABA4AA" }}
                  >
                    Member Since
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {format(new Date(client.createdAt), "MMM yyyy")}
                  </p>
                </div>
                <User className="h-8 w-8" style={{ color: "#F59E0B" }} />
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div
            className="rounded-2xl shadow-xl border p-6"
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
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
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateMonth("prev")}
                    className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
                    style={{ color: "#C3BCC2" }}
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
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center gap-6 mb-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500 border-2 border-green-400" />
                <span className="text-white font-medium">
                  Confirmed Lessons
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500 border-2 border-yellow-400" />
                <span className="text-white font-medium">Pending Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-400" />
                <span className="text-white font-medium">Program Days</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500 border-2 border-orange-400" />
                <span className="text-white font-medium">Rest Days</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500/40" />
                <span className="text-white font-medium">
                  Routine Assignments
                </span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
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
                const programsForDay = getProgramsForDate(day);
                const videosForDay = getVideosForDate(day);
                const routineAssignmentsForDay =
                  getRoutineAssignmentsForDate(day);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`
                      ${
                        viewMode === "week" ? "min-h-[200px]" : "min-h-[120px]"
                      } p-2 rounded-lg transition-all duration-200 cursor-pointer border-2
                      ${
                        isToday
                          ? "bg-blue-500/20 text-blue-300 border-blue-400"
                          : isPastDay
                          ? "text-gray-500 bg-gray-700/30 border-gray-600"
                          : isCurrentMonth
                          ? "text-white bg-gray-800/50 border-gray-600 hover:bg-blue-500/10 hover:border-blue-400"
                          : "text-gray-600 bg-gray-900/30 border-gray-700"
                      }
                    `}
                  >
                    <div className="font-bold text-sm mb-2">
                      {format(day, "d")}
                    </div>

                    {/* Lessons */}
                    {lessonsForDay.map((lesson: any, index: number) => (
                      <div
                        key={`lesson-${index}`}
                        className={`text-xs p-1 rounded border mb-1 ${getStatusColor(
                          lesson.status
                        )}`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(lesson.status)}
                          <span className="truncate">
                            {format(new Date(lesson.date), "h:mm a")}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Programs */}
                    {programsForDay.map((program: any, index: number) => (
                      <div
                        key={`program-${index}`}
                        className={`text-xs p-1 rounded border mb-1 ${
                          program.type === "rest"
                            ? "bg-orange-500/20 text-orange-100 border-orange-400"
                            : "bg-blue-500/20 text-blue-100 border-blue-400"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {program.type === "rest" ? (
                            <Zap className="h-3 w-3" />
                          ) : (
                            <BookOpen className="h-3 w-3" />
                          )}
                          <span className="truncate">{program.title}</span>
                        </div>
                      </div>
                    ))}

                    {/* Videos */}
                    {videosForDay.map((video: any, index: number) => (
                      <div
                        key={`video-${index}`}
                        className="text-xs p-1 rounded bg-purple-500/20 text-purple-100 border border-purple-400 mb-1"
                      >
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          <span className="truncate">{video.title}</span>
                        </div>
                      </div>
                    ))}

                    {/* Routine Assignments */}
                    {routineAssignmentsForDay.map(
                      (assignment: any, index: number) => (
                        <div
                          key={`routine-${index}`}
                          className="text-xs p-1.5 rounded-lg bg-green-500/5 text-green-100 border border-green-500/20 mb-1 transition-all duration-200 hover:bg-green-500/10"
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="p-0.5 rounded bg-green-500/10">
                              <Target className="h-2.5 w-2.5 text-green-400" />
                            </div>
                            <span className="truncate font-medium">
                              {assignment.routine.name}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modals */}
          {showAssignProgramModal && (
            <AssignProgramModal
              isOpen={showAssignProgramModal}
              onClose={() => setShowAssignProgramModal(false)}
              clientId={clientId}
              clientName={client.name}
              startDate={
                selectedDate
                  ? selectedDate.toISOString().split("T")[0]
                  : undefined
              }
            />
          )}

          {showAssignRoutineModal && (
            <AssignRoutineModal
              isOpen={showAssignRoutineModal}
              onClose={() => setShowAssignRoutineModal(false)}
              clientId={clientId}
              clientName={client.name}
              startDate={
                selectedDate
                  ? selectedDate.toISOString().split("T")[0]
                  : undefined
              }
            />
          )}

          {showAssignVideoModal && (
            <AssignVideoModal
              isOpen={showAssignVideoModal}
              onClose={() => setShowAssignVideoModal(false)}
              clientId={clientId}
              clientName={client.name}
            />
          )}

          {showScheduleLessonModal && (
            <ScheduleLessonModal
              isOpen={showScheduleLessonModal}
              onClose={() => {
                setShowScheduleLessonModal(false);
                setReplacementData(null);
              }}
              clientId={clientId}
              clientName={client.name}
              clientEmail={client.user?.email}
              startDate={
                selectedDate
                  ? selectedDate.toISOString().split("T")[0]
                  : undefined
              }
              replacementData={replacementData}
            />
          )}

          {/* Day Details Modal */}
          {showDayDetailsModal && selectedDate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                className="rounded-2xl shadow-xl border p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </h2>
                  <button
                    onClick={() => setShowDayDetailsModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Lessons */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Lessons
                    </h3>
                    {getLessonsForDate(selectedDate).length > 0 ? (
                      <div className="space-y-3">
                        {getLessonsForDate(selectedDate).map(
                          (lesson: any, index: number) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-2 ${getStatusColor(
                                lesson.status
                              )}`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">
                                    {format(new Date(lesson.date), "h:mm a")}
                                  </div>
                                  <div className="text-sm opacity-80">
                                    {lesson.title}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(lesson.status)}
                                  <div className="text-xs">{lesson.status}</div>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">
                          No lessons scheduled for this day
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Programs */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Programs
                    </h3>
                    {getProgramsForDate(selectedDate).length > 0 ? (
                      <div className="space-y-3">
                        {getProgramsForDate(selectedDate).map(
                          (program: any, index: number) => (
                            <div
                              key={index}
                              className="p-4 rounded-lg bg-blue-500/20 text-blue-100 border border-blue-400"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">
                                      {program.title}
                                    </div>
                                    <div className="text-sm opacity-80">
                                      {program.description}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    // Store the program info for replacement
                                    console.log(
                                      "🔍 Full program object:",
                                      program
                                    );
                                    console.log(
                                      "🔍 Assignment object:",
                                      program.assignment
                                    );
                                    console.log(
                                      "🔍 Program object:",
                                      program.program
                                    );
                                    console.log("🔍 Replacement data:", {
                                      programId: program.assignment.programId,
                                      assignmentId: program.assignment.id,
                                      programTitle: program.title,
                                      dayDate:
                                        selectedDate
                                          ?.toISOString()
                                          .split("T")[0] || "",
                                    });

                                    setReplacementData({
                                      programId: program.assignment.programId,
                                      programTitle: program.title,
                                      dayDate:
                                        selectedDate
                                          ?.toISOString()
                                          .split("T")[0] || "",
                                    });
                                    setShowScheduleLessonModal(true);
                                    setShowDayDetailsModal(false);
                                  }}
                                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-opacity-80"
                                  style={{ backgroundColor: "#10B981" }}
                                  title="Replace workout with lesson"
                                >
                                  Replace with Lesson
                                </button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">
                          No programs scheduled for this day
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Routine Assignments */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Routine Assignments
                    </h3>
                    {getRoutineAssignmentsForDate(selectedDate).length > 0 ? (
                      <div className="space-y-3">
                        {getRoutineAssignmentsForDate(selectedDate).map(
                          (assignment: any, index: number) => (
                            <div
                              key={index}
                              className="p-4 rounded-lg bg-green-500/5 text-green-100 border border-green-500/20 transition-all duration-200 hover:bg-green-500/10"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-green-500/10">
                                    <Target className="h-4 w-4 text-green-400" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-green-100">
                                      {assignment.routine.name}
                                    </div>
                                    <div className="text-sm text-green-200/80">
                                      {assignment.routine.description ||
                                        "No description"}
                                    </div>
                                    <div className="text-xs text-green-200/60 mt-1">
                                      Assigned{" "}
                                      {format(
                                        new Date(
                                          assignment.startDate ||
                                            assignment.assignedAt
                                        ),
                                        "MMM dd, yyyy"
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-100">
                                    {assignment.progress}%
                                  </div>
                                  <div className="text-xs text-green-200/60">
                                    Progress
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="p-4 rounded-full bg-green-500/5 w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-green-500/10">
                          <Target className="h-8 w-8 text-green-500/60" />
                        </div>
                        <p className="text-gray-400 mb-2">
                          No routine assignments for this day
                        </p>
                        <p className="text-sm text-gray-500">
                          Use the "Assign Routine" button below to add one
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Schedule Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Schedule for {format(selectedDate, "MMMM d, yyyy")}
                    </h3>
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Reset time to start of day
                      const selectedDay = new Date(selectedDate);
                      selectedDay.setHours(0, 0, 0, 0);
                      const isPastDate = selectedDay < today;

                      if (isPastDate) {
                        return (
                          <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400">
                              Cannot schedule for past dates
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                              Only future dates can be scheduled
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button
                            onClick={() => {
                              setShowScheduleLessonModal(true);
                              setShowDayDetailsModal(false);
                            }}
                            className="flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 hover:border-yellow-500/30"
                          >
                            <Calendar
                              className="h-6 w-6"
                              style={{ color: "#F59E0B" }}
                            />
                            <div className="text-left">
                              <div
                                className="font-medium"
                                style={{ color: "#F59E0B" }}
                              >
                                Schedule Lesson
                              </div>
                              <div className="text-sm text-yellow-600/80">
                                Book a lesson for this day
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setShowAssignProgramModal(true);
                              setShowDayDetailsModal(false);
                            }}
                            className="flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 hover:border-blue-500/30"
                          >
                            <BookOpen
                              className="h-6 w-6"
                              style={{ color: "#3B82F6" }}
                            />
                            <div className="text-left">
                              <div
                                className="font-medium"
                                style={{ color: "#3B82F6" }}
                              >
                                Assign Program
                              </div>
                              <div className="text-sm text-blue-600/80">
                                Start a program on this day
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setShowAssignRoutineModal(true);
                              setShowDayDetailsModal(false);
                            }}
                            className="flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer bg-green-500/10 hover:bg-green-500/20 border-green-500/20 hover:border-green-500/30"
                          >
                            <Target
                              className="h-6 w-6"
                              style={{ color: "#10B981" }}
                            />
                            <div className="text-left">
                              <div
                                className="font-medium"
                                style={{ color: "#10B981" }}
                              >
                                Assign Routine
                              </div>
                              <div className="text-sm text-green-600/80">
                                Assign a routine for this day
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}

export default withMobileDetection(MobileClientDetailPage, ClientDetailPage);
