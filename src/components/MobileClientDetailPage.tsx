"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { extractNoteContent } from "@/lib/note-utils";
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
  MessageSquare,
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
  isSameMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameWeek,
  startOfDay,
  addWeeks,
  subWeeks,
} from "date-fns";
import {
  formatTimeInUserTimezone,
  formatDateTimeInUserTimezone,
} from "@/lib/timezone-utils";
import ProfilePictureUploader from "./ProfilePictureUploader";
import CustomSelect from "./ui/CustomSelect";
import StreamlinedScheduleLessonModal from "./StreamlinedScheduleLessonModal";
import QuickAssignProgramModal from "./QuickAssignProgramModal";
import QuickAssignRoutineFromDayModal from "./QuickAssignRoutineFromDayModal";
import AssignRoutineModal from "./AssignRoutineModal";
import AssignVideoModal from "./AssignVideoModal";
import MobileClientBottomNavigation from "./MobileClientBottomNavigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import ClientProfileModal from "./ClientProfileModal";

interface MobileClientDetailPageProps {
  clientId: string;
  backPath?: string; // Optional custom back path (e.g., for organization view)
  noSidebar?: boolean; // Skip sidebar wrapper (e.g., when already in a layout with sidebar)
}

export default function MobileClientDetailPage({
  clientId,
  backPath = "/clients",
  noSidebar = false,
}: MobileClientDetailPageProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [replacementData, setReplacementData] = useState<{
    assignmentId: string;
    programId: string;
    programTitle: string;
    dayDate: string;
  } | null>(null);
  const [showDayOverviewModal, setShowDayOverviewModal] = useState(false);
  const [showQuickAssignProgramModal, setShowQuickAssignProgramModal] =
    useState(false);
  const [showAssignRoutineModal, setShowAssignRoutineModal] = useState(false);
  const [
    showQuickAssignRoutineFromDayModal,
    setShowQuickAssignRoutineFromDayModal,
  ] = useState(false);
  const [showAssignVideoModal, setShowAssignVideoModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Fetch client data
  const {
    data: client,
    isLoading: clientLoading,
    error: clientError,
  } = trpc.clients.getById.useQuery(
    { id: clientId },
    {
      enabled: !!clientId,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  );

  // Redirect to clients page if client is archived or not found
  useEffect(() => {
    if (clientError || (!clientLoading && !client)) {
      router.push(backPath);
    }
    // Also redirect if client is archived
    if (client && client.archived) {
      router.push(backPath);
    }
  }, [clientError, clientLoading, client, router, backPath]);

  // Fetch coach's schedule for the current month (includes all client lessons)
  const { data: coachSchedule = [], isLoading: lessonsLoading } =
    trpc.scheduling.getCoachSchedule.useQuery({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
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
  const { data: assignedPrograms = [], refetch: refetchAssignedPrograms } =
    trpc.clients.getAssignedPrograms.useQuery({
      clientId,
    });

  // Note: Removed videoAssignments query as it was causing 404 errors
  // const { data: videoAssignments = [] } =
  //   trpc.library.getClientAssignments.useQuery({
  //     clientId,
  //   });

  // Fetch client's routine assignments
  const { data: routineAssignments = [] } =
    trpc.routines.getClientRoutineAssignments.useQuery({
      clientId,
    });

  // Fetch temporary program day replacements for this client
  const { data: temporaryReplacements = [], refetch: refetchTemporaryReplacements } =
    trpc.programs.getTemporaryReplacements.useQuery({
      clientId,
    });

  // Fetch client compliance data
  const [compliancePeriod, setCompliancePeriod] = useState<
    "4" | "6" | "8" | "all"
  >("4");
  const { data: complianceData, isLoading: complianceLoading } =
    trpc.clients.getComplianceData.useQuery({
      clientId,
      period: compliancePeriod,
    });

  // Fetch coach's working hours
  const { data: coachProfile } = trpc.user.getProfile.useQuery();

  const utils = trpc.useUtils();

  // Function to refresh client data after assignments
  const refreshClientData = async () => {
    await Promise.all([
      utils.clients.getById.invalidate({ id: clientId }),
      utils.clients.getAssignedPrograms.invalidate({ clientId }),
      utils.routines.getClientRoutineAssignments.invalidate({ clientId }),
      utils.clients.getComplianceData.invalidate({
        clientId,
        period: compliancePeriod,
      }),
      utils.programs.getTemporaryReplacements.invalidate({ clientId }),
    ]);
  };

  // Auto-refresh when modals close (indicating potential assignments)
  useEffect(() => {
    if (
      !showQuickAssignProgramModal &&
      !showAssignRoutineModal &&
      !showQuickAssignRoutineFromDayModal &&
      !showAssignVideoModal
    ) {
      // Small delay to ensure backend has processed the assignment
      const timeoutId = setTimeout(() => {
        refreshClientData();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [
    showQuickAssignProgramModal,
    showAssignRoutineModal,
    showQuickAssignRoutineFromDayModal,
    showAssignVideoModal,
  ]);

  // Remove program mutation - using specific assignment ID
  const removeProgramMutation =
    trpc.programs.unassignSpecificProgram.useMutation({
      onSuccess: async () => {
        await refreshClientData();
        setShowDayOverviewModal(false);
      },
      onError: error => {
        console.error("Failed to remove program:", error);
        console.error("Error details:", {
          message: error.message,
          data: error.data,
          shape: error.shape,
        });
      },
    });

  // Remove routine mutation - using specific assignment ID
  const unassignRoutineMutation =
    trpc.routines.unassignSpecificRoutine.useMutation({
      onSuccess: async () => {
        await refreshClientData();
        setShowDayOverviewModal(false);
      },
      onError: error => {
        console.error("Failed to remove routine:", error);
      },
    });

  // Remove temporary program day mutation
  const removeTemporaryProgramDayMutation =
    trpc.programs.removeTemporaryProgramDay.useMutation({
      onSuccess: async () => {
        await refreshClientData();
        setShowDayOverviewModal(false);
      },
      onError: error => {
        console.error("Failed to remove temporary program day:", error);
      },
    });

  // Delete lesson mutation
  const deleteLessonMutation = trpc.scheduling.deleteLesson.useMutation({
    onSuccess: () => {
      utils.scheduling.getCoachSchedule.invalidate();
      utils.scheduling.getCoachUpcomingLessons.invalidate();
      utils.events.getUpcoming.invalidate();
      setShowDayOverviewModal(false);
    },
    onError: error => {
      console.error("Failed to remove lesson:", error);
    },
  });

  // Delete program day mutation
  const deleteProgramDayMutation = trpc.programs.deleteProgramDay.useMutation({
    onSuccess: async () => {
      // Invalidate all relevant queries
      await Promise.all([
        utils.clients.getById.invalidate({ id: clientId }),
        utils.clients.getAssignedPrograms.invalidate({ clientId }),
        utils.programs.getTemporaryReplacements.invalidate({ clientId }),
        utils.clients.getComplianceData.invalidate({
          clientId,
          period: compliancePeriod,
        }),
      ]);
      
      // Force immediate refetch of the queries that display program days
      // This ensures the UI updates immediately with the new replacement record
      await Promise.all([
        refetchAssignedPrograms(),
        refetchTemporaryReplacements(),
      ]);
      
      // Small delay to ensure UI updates before closing modal
      setTimeout(() => {
        setShowDayOverviewModal(false);
      }, 100);
    },
    onError: error => {
      console.error("Failed to delete program day:", error);
    },
  });

  // Loading state
  if (clientLoading || lessonsLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#2A3133" }}
        >
          <div
            className="flex items-center space-x-3"
            style={{ color: "#C3BCC2" }}
          >
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading client details...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!client) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
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
            <p className="text-gray-400 mb-6">
              The client you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <button
              onClick={() => router.push(backPath)}
              className="px-6 py-3 rounded-lg text-white transition-all duration-200"
              style={{ backgroundColor: "#4A5A70" }}
            >
              Back to Clients
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper functions
  const getLessonsForDate = (date: Date) => {
    return clientLessons.filter((lesson: any) =>
      isSameDay(new Date(lesson.date), date)
    );
  };

  const getProgramsForDate = (date: Date) => {
    const programsForDate: any[] = [];
    const targetDateStr = date.toISOString().split("T")[0];

    // First, check for temporary program day replacements
    const hasTemporaryReplacement = temporaryReplacements.some(
      (replacement: any) => {
        const replacementDate = new Date(replacement.replacedDate);
        const replacementDateStr = replacementDate.toISOString().split("T")[0];
        return (
          replacementDateStr === targetDateStr &&
          replacement.data.type === "temporary_program_day"
        );
      }
    );

    // Add temporary replacements if they exist
    temporaryReplacements.forEach((replacement: any) => {
      const replacementDate = new Date(replacement.replacedDate);
      const replacementDateStr = replacementDate.toISOString().split("T")[0];

      if (
        replacementDateStr === targetDateStr &&
        replacement.data.type === "temporary_program_day"
      ) {
        programsForDate.push({
          id: `temp-${replacement.id}`,
          title: replacement.data.programTitle,
          description: `${replacement.data.drills.length} drills`,
          type: "temporary_program",
          isTemporary: true,
          replacementId: replacement.id, // This is now the assignment ID
          programDay: {
            title: replacement.data.dayTitle,
            description: replacement.data.dayDescription,
            drills: replacement.data.drills,
          },
          drillCount: replacement.data.drills.length,
          isRestDay: false,
        });
      }
    });

    // Only show regular program assignments if there's no temporary replacement for this date
    if (!hasTemporaryReplacement) {
      assignedPrograms.forEach((assignment: any) => {
        const program = assignment.program;
        const startDate = new Date(
          assignment.startDate || assignment.assignedAt
        );

        // Calculate which week and day this date falls on
        const daysSinceStart = Math.floor(
          (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Use actual number of weeks from the data, not the duration field (which may be incorrect)
        const actualWeeks = program.weeks?.length || program.duration;
        const programDurationInDays = actualWeeks * 7;

        // Only show if the date is within the program duration
        if (daysSinceStart >= 0 && daysSinceStart < programDurationInDays) {
          // Check if this day has been replaced or deleted
          const dayReplacement = assignment.replacements?.find((replacement: any) => {
            const replacementDate = new Date(replacement.replacedDate);
            const replacementDateStr = replacementDate.toISOString().split("T")[0];
            return replacementDateStr === targetDateStr;
          });

          // Skip this day if it has been replaced or deleted
          if (dayReplacement) {
            return; // Don't show this day - it's been replaced or deleted
          }

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
              // Skip rest days - don't show them on the coach side
              if (programDay.isRestDay || programDay.drills?.length === 0) {
                // Don't show rest days - just skip them
                return;
              }
              
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
      });
    }

    return programsForDate;
  };

  const getRoutineAssignmentsForDate = (date: Date) => {
    return routineAssignments
      .filter((assignment: any) => {
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
      })
      .sort((a: any, b: any) => {
        // Sort by assignedAt date - oldest first (most recent at bottom)
        const dateA = new Date(a.assignedAt).getTime();
        const dateB = new Date(b.assignedAt).getTime();
        return dateA - dateB; // Ascending order (oldest to newest)
      });
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "week") {
      // For week view, navigate by weeks
      setCurrentDate(
        direction === "prev"
          ? subWeeks(currentDate, 1)
          : addWeeks(currentDate, 1)
      );
    } else {
      // For month view, navigate by months
      setCurrentDate(
        direction === "prev"
          ? subMonths(currentDate, 1)
          : addMonths(currentDate, 1)
      );
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayOverviewModal(true);
  };

  // Remove handlers
  const handleRemoveProgram = (
    programData: any,
    action: "entire" | "day" = "entire"
  ) => {
    // Check if this is a temporary program day
    if (programData.isTemporary && programData.replacementId) {
      if (
        confirm(
          `Are you sure you want to remove the temporary program day "${programData.title}"?`
        )
      ) {
        removeTemporaryProgramDayMutation.mutate({
          replacementId: programData.replacementId,
        });
      }
      return;
    }

    // Handle regular program removal with direct confirmation
    if (action === "entire") {
      if (
        confirm(
          `Are you sure you want to remove the entire program "${programData.programTitle}" from this client?`
        )
      ) {
        removeProgramMutation.mutate({
          assignmentId: programData.assignmentId,
        });
      }
    } else if (action === "day") {
      if (
        confirm(
          `Are you sure you want to remove just this program day "${programData.programTitle}"?`
        )
      ) {
        // Remove just this specific program day using the deleteProgramDay mutation
        deleteProgramDayMutation.mutate({
          assignmentId: programData.assignmentId,
          dayDate: programData.dayDate,
          reason: "Program day deleted by coach",
        });
      }
    }
  };

  const handleRemoveRoutine = (routineData: any) => {
    const routineName =
      routineData.routine?.name || routineData.name || "Routine";

    if (
      confirm(
        `Are you sure you want to remove "${routineName}" from this client?`
      )
    ) {
      unassignRoutineMutation.mutate({
        assignmentId: routineData.id,
      });
    }
  };

  const handleRemoveLesson = (lessonData: any) => {
    const lessonTitle = lessonData.title || "Lesson";
    const lessonId = lessonData.id;

    if (
      confirm(`Are you sure you want to remove the lesson "${lessonTitle}"?`)
    ) {
      deleteLessonMutation.mutate({
        lessonId: lessonId,
      });
    }
  };

  // Generate calendar days based on view mode (same as desktop - Sunday through Saturday)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  let calendarStart: Date;
  let calendarEnd: Date;

  if (viewMode === "week") {
    // For week view, show the week containing the current date
    calendarStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    calendarEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  } else {
    // For month view, show the full month with surrounding days
    calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  }

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Limit upcoming lessons for display
  const displayUpcomingLessons = upcomingLessons.slice(0, 5);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile Header */}
      <div
        className="sticky top-0 z-40 px-4 pb-3 border-b"
        style={{ 
          backgroundColor: "#353A3A", 
          borderColor: "#606364",
          paddingTop: `calc(0.75rem + env(safe-area-inset-top))`
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(backPath)}
            className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">
              {client.name}
            </h1>
            <p className="text-xs text-gray-400">Client Details</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Primary action - Schedule Lesson */}
            <button
              onClick={() => setShowScheduleModal(true)}
              className="p-2 rounded-lg transition-all duration-200"
              style={{ backgroundColor: "#F59E0B" }}
              title="Schedule Lesson"
            >
              <Calendar className="w-5 h-5 text-white" />
            </button>
            {/* Dropdown for other actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-[#4A5A70]"
                  title="More actions"
                >
                  <MoreVertical className="w-5 h-5 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[200px] rounded-lg border shadow-xl"
                style={{
                  backgroundColor: "#1F2323",
                  borderColor: "#606364",
                }}
              >
                <DropdownMenuItem
                  onClick={() => {
                    setShowQuickAssignProgramModal(true);
                  }}
                  className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#353A3A]"
                  style={{ color: "#C3BCC2" }}
                >
                  <BookOpen className="h-4 w-4" style={{ color: "#3B82F6" }} />
                  Assign Program
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setShowAssignRoutineModal(true);
                  }}
                  className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#353A3A]"
                  style={{ color: "#C3BCC2" }}
                >
                  <Target className="h-4 w-4" style={{ color: "#10B981" }} />
                  Assign Routine
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setShowAssignVideoModal(true);
                  }}
                  className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#353A3A]"
                  style={{ color: "#C3BCC2" }}
                >
                  <Video className="h-4 w-4" style={{ color: "#8B5CF6" }} />
                  Assign Video
                </DropdownMenuItem>
                <DropdownMenuSeparator
                  className="my-1"
                  style={{ backgroundColor: "#606364" }}
                />
                <DropdownMenuItem
                  onClick={() => {
                    if (client.userId) {
                      router.push(`/messages?clientId=${client.userId}`);
                    }
                  }}
                  className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#353A3A]"
                  style={{ color: "#C3BCC2" }}
                >
                  <MessageSquare
                    className="h-4 w-4"
                    style={{ color: "#10B981" }}
                  />
                  Send Message
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setShowProfileModal(true);
                  }}
                  className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#353A3A]"
                  style={{ color: "#C3BCC2" }}
                >
                  <Edit className="h-4 w-4" style={{ color: "#3B82F6" }} />
                  Edit Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20 space-y-6">
        {/* Client Info Card */}
        <div
          className="p-4 rounded-lg border-2"
          style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
        >
          <div className="flex items-center gap-4 mb-4">
            <ProfilePictureUploader
              currentAvatarUrl={
                client.user?.settings?.avatarUrl || client.avatar
              }
              userName={client.name}
              onAvatarChange={() => {}}
              size="lg"
              readOnly={true}
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                {client.name}
              </h2>
              {client.email && (
                <p className="text-sm text-gray-400 mb-1">{client.email}</p>
              )}
              {client.phone && (
                <p className="text-sm text-gray-400">{client.phone}</p>
              )}
            </div>
          </div>

          {/* Notes removed - now using NotesDisplay component elsewhere */}
        </div>

        {/* Compliance Rate */}
        <div
          className="p-4 rounded-lg border-2"
          style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">
                Compliance Rate
              </h2>
            </div>
            <div className="flex gap-1">
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
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium" style={{ color: "#ABA4AA" }}>
                Completion Rate
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

          {/* Progress Bar */}
          <div className="mb-3">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, complianceData?.completionRate || 0)}%`,
                backgroundColor:
                  Math.min(100, complianceData?.completionRate || 0) >= 80
                    ? "#10B981"
                    : Math.min(100, complianceData?.completionRate || 0) >= 60
                    ? "#F59E0B"
                    : "#EF4444",
              }}
            />
          </div>

          {/* Stats */}
          {complianceData && (
            <div
              className="flex justify-between text-xs"
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

        {/* Upcoming Lessons */}
        {displayUpcomingLessons.length > 0 && (
          <div
            className="p-4 rounded-lg border-2"
            style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">
                Upcoming Lessons ({displayUpcomingLessons.length})
              </h2>
            </div>
            <div className="space-y-2">
              {displayUpcomingLessons.map((lesson: any, index: number) => (
                <div
                  key={`upcoming-lesson-${lesson.id || index}`}
                  className="flex items-center justify-between p-3 rounded bg-emerald-500/10 border border-emerald-500/20"
                >
                  <div className="flex-1">
                    <div className="font-medium text-emerald-300">
                      {formatDateTimeInUserTimezone(lesson.date)}
                    </div>
                    <div className="text-sm text-emerald-200">
                      {lesson.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div
          className="p-4 rounded-lg border-2"
          style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Calendar View</h2>
            <div
              className="flex rounded-lg border overflow-hidden"
              style={{ borderColor: "#606364" }}
            >
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  viewMode === "month" ? "text-white" : "text-gray-400"
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
                className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  viewMode === "week" ? "text-white" : "text-gray-400"
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

          {/* Month/Week Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateDate("prev")}
              className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <h3 className="text-lg font-semibold text-white">
              {viewMode === "month"
                ? format(currentDate, "MMMM yyyy")
                : `${format(startOfWeek(currentDate), "MMM d")} - ${format(
                    endOfWeek(currentDate),
                    "MMM d, yyyy"
                  )}`}
            </h3>
            <button
              onClick={() => navigateDate("next")}
              className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Mobile Calendar */}
          <div className="space-y-2">
            {viewMode === "month" ? (
              // Month view - simplified for mobile
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers: Sunday through Saturday */}
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <div
                    key={`day-header-${index}`}
                    className="text-center text-xs font-bold text-blue-300 py-2"
                  >
                    {day}
                  </div>
                ))}
                {calendarDays.map(day => {
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const lessonsForDay = getLessonsForDate(day);
                  const programsForDay = getProgramsForDate(day);
                  const routineAssignmentsForDay =
                    getRoutineAssignmentsForDate(day);
                  const hasLessons = lessonsForDay.length > 0;
                  const hasPrograms = programsForDay.length > 0;
                  const hasRoutines = routineAssignmentsForDay.length > 0;

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      className={`
                          p-2 text-sm rounded-lg transition-all duration-200 relative min-h-[50px] border-2 overflow-hidden cursor-pointer
                          ${
                            isToday
                              ? "bg-blue-500/20 text-blue-300 border-blue-400"
                              : isCurrentMonth
                              ? "bg-gray-800/50 text-white border-gray-600 hover:bg-gray-700/50"
                              : "bg-gray-900/30 text-gray-500 border-gray-700"
                          }
                        `}
                    >
                      <div className="font-bold text-sm mb-1">
                        {format(day, "d")}
                      </div>
                      <div className="flex justify-center items-center gap-1 mt-1">
                        {hasLessons && (
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                        {hasPrograms && (
                          <>
                            {programsForDay.some(
                              (p: any) => p.type === "program"
                            ) && (
                              <div className="w-2 h-2 rounded-full bg-blue-400" />
                            )}
                            {programsForDay.some(
                              (p: any) => p.type === "temporary_program"
                            ) && (
                              <div className="w-2 h-2 rounded-full bg-cyan-400" />
                            )}
                          </>
                        )}
                        {hasRoutines && (
                          <div className="w-2 h-2 rounded-full bg-green-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Week view - simplified for mobile
              <div className="space-y-2">
                {calendarDays.map(day => {
                  const isToday = isSameDay(day, new Date());
                  const lessonsForDay = getLessonsForDate(day);
                  const programsForDay = getProgramsForDate(day);
                  const routineAssignmentsForDay =
                    getRoutineAssignmentsForDate(day);
                  const hasLessons = lessonsForDay.length > 0;
                  const hasPrograms = programsForDay.length > 0;
                  const hasRoutines = routineAssignmentsForDay.length > 0;

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      className={`
                          p-3 rounded-lg transition-all duration-200 border-2 cursor-pointer
                          ${
                            isToday
                              ? "bg-blue-500/20 text-blue-300 border-blue-400"
                              : "bg-gray-800/50 text-white border-gray-600 hover:bg-gray-700/50"
                          }
                        `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold">
                          {format(day, "EEEE, MMM d")}
                        </div>
                        <div className="flex items-center gap-2">
                          {hasLessons && (
                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                          )}
                          {hasPrograms && (
                            <>
                              {programsForDay.some(
                                (p: any) => p.type === "program"
                              ) && (
                                <div className="w-3 h-3 rounded-full bg-blue-400" />
                              )}
                              {programsForDay.some(
                                (p: any) => p.type === "temporary_program"
                              ) && (
                                <div className="w-3 h-3 rounded-full bg-cyan-400" />
                              )}
                            </>
                          )}
                          {hasRoutines && (
                            <div className="w-3 h-3 rounded-full bg-green-600" />
                          )}
                        </div>
                      </div>
                      {hasLessons && (
                        <div className="space-y-1">
                          {lessonsForDay
                            .slice(0, 2)
                            .map((lesson: any, index: number) => (
                              <div
                                key={`week-lesson-${lesson.id || index}`}
                                className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded"
                              >
                                {formatTimeInUserTimezone(lesson.date)} -{" "}
                                {lesson.title}
                              </div>
                            ))}
                          {lessonsForDay.length > 2 && (
                            <div className="text-xs text-gray-400">
                              +{lessonsForDay.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                      {hasPrograms && (
                        <div className="space-y-1 mt-2">
                          {programsForDay
                            .filter((p: any) => p.type !== "rest") // Filter out rest days
                            .slice(0, 2)
                            .map((program: any, index: number) => (
                              <div
                                key={`week-program-${program.id || index}`}
                                className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300"
                              >
                                {program.title}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Calendar Legend */}
          <div
            className="flex items-center justify-center gap-4 pt-3 border-t"
            style={{ borderColor: "#4A5A70" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-gray-300">Lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-xs text-gray-300">Programs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs text-gray-300">Temporary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              <span className="text-xs text-gray-300">Routines</span>
            </div>
          </div>
        </div>

        {/* Schedule Lesson Modal */}
        {showScheduleModal && client && (
          <StreamlinedScheduleLessonModal
            isOpen={showScheduleModal}
            onClose={() => {
              setShowScheduleModal(false);
              setReplacementData(null);
            }}
            clientId={clientId}
            clientName={client.name}
            clientEmail={client.user?.email}
            selectedDate={selectedDate}
            replacementData={replacementData} // Pass replacement data to override restrictions
          />
        )}

        {/* Quick Assign Program Modal */}
        {showQuickAssignProgramModal && client && (
          <QuickAssignProgramModal
            isOpen={showQuickAssignProgramModal}
            onClose={() => setShowQuickAssignProgramModal(false)}
            clientId={clientId}
            clientName={client.name}
            startDate={
              selectedDate
                ? format(selectedDate, "yyyy-MM-dd")
                : format(new Date(), "yyyy-MM-dd")
            }
          />
        )}

        {/* Assign Routine Modal (from top button) */}
        {showAssignRoutineModal && client && (
          <AssignRoutineModal
            isOpen={showAssignRoutineModal}
            onClose={() => setShowAssignRoutineModal(false)}
            clientId={clientId}
            clientName={client.name}
          />
        )}

        {/* Quick Assign Routine From Day Modal */}
        {showQuickAssignRoutineFromDayModal && client && (
          <QuickAssignRoutineFromDayModal
            isOpen={showQuickAssignRoutineFromDayModal}
            onClose={() => setShowQuickAssignRoutineFromDayModal(false)}
            clientId={clientId}
            clientName={client.name}
            startDate={
              selectedDate
                ? format(selectedDate, "yyyy-MM-dd")
                : format(new Date(), "yyyy-MM-dd")
            }
          />
        )}

        {/* Assign Video Modal */}
        {showAssignVideoModal && client && (
          <AssignVideoModal
            isOpen={showAssignVideoModal}
            onClose={() => setShowAssignVideoModal(false)}
            clientId={clientId}
            clientName={client.name}
            startDate={
              selectedDate
                ? format(selectedDate, "yyyy-MM-dd")
                : format(new Date(), "yyyy-MM-dd")
            }
          />
        )}

        {/* Client Profile Modal */}
        {showProfileModal && client && (
          <ClientProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            clientId={client.id}
            clientName={client.name}
            clientEmail={client.email}
            clientPhone={client.phone}
            clientNotes={extractNoteContent(client.notes)}
            clientAvatar={client.avatar}
          />
        )}

        {/* Day Overview Modal */}
        {showDayOverviewModal && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className="rounded-2xl shadow-xl border w-full max-w-2xl max-h-[80vh] overflow-y-auto"
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
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => {
                      setShowDayOverviewModal(false);
                      setShowScheduleModal(true);
                    }}
                    className="flex items-center gap-2 p-3 rounded-lg transition-all duration-200 hover:scale-105 border"
                    style={{
                      backgroundColor: "#F59E0B",
                      borderColor: "#F59E0B",
                    }}
                  >
                    <Calendar className="h-5 w-5 text-white flex-shrink-0" />
                    <span className="text-sm font-medium text-white">
                      Schedule Lesson
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDayOverviewModal(false);
                      setShowQuickAssignProgramModal(true);
                    }}
                    className="flex items-center gap-2 p-3 rounded-lg transition-all duration-200 hover:scale-105 border"
                    style={{
                      backgroundColor: "#3B82F6",
                      borderColor: "#3B82F6",
                    }}
                  >
                    <BookOpen className="h-5 w-5 text-white flex-shrink-0" />
                    <span className="text-sm font-medium text-white">
                      Assign Program
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDayOverviewModal(false);
                      setShowQuickAssignRoutineFromDayModal(true);
                    }}
                    className="flex items-center gap-2 p-3 rounded-lg transition-all duration-200 hover:scale-105 border"
                    style={{
                      backgroundColor: "#10B981",
                      borderColor: "#10B981",
                    }}
                  >
                    <Target className="h-5 w-5 text-white flex-shrink-0" />
                    <span className="text-sm font-medium text-white">
                      Assign Routine
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDayOverviewModal(false);
                      setShowAssignVideoModal(true);
                    }}
                    className="flex items-center gap-2 p-3 rounded-lg transition-all duration-200 hover:scale-105 border"
                    style={{
                      backgroundColor: "#8B5CF6",
                      borderColor: "#8B5CF6",
                    }}
                  >
                    <Video className="h-5 w-5 text-white flex-shrink-0" />
                    <span className="text-sm font-medium text-white">
                      Assign Video
                    </span>
                  </button>
                </div>

                {(() => {
                  const dayLessons = getLessonsForDate(selectedDate);
                  const dayPrograms = getProgramsForDate(selectedDate);
                  const dayRoutines =
                    getRoutineAssignmentsForDate(selectedDate);
                  const hasContent =
                    dayLessons.length > 0 ||
                    dayPrograms.length > 0 ||
                    dayRoutines.length > 0;

                  return hasContent ? (
                    <div className="space-y-6">
                      {/* Lessons Section */}
                      {dayLessons.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-white">
                            Scheduled Lessons
                          </h3>
                          <div className="space-y-3">
                            {dayLessons.map((lesson: any, index: number) => (
                              <div
                                key={`day-lesson-${lesson.id || index}`}
                                className="flex items-center justify-between p-4 rounded-lg border group bg-emerald-500/10 border-emerald-500/20"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-emerald-300">
                                    {formatTimeInUserTimezone(lesson.date)}
                                  </div>
                                  <div className="text-sm text-emerald-200">
                                    {lesson.title}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveLesson(lesson)}
                                  className="p-2 text-emerald-400 hover:text-red-400 transition-colors"
                                  title="Remove lesson"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Programs Section */}
                      {dayPrograms.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-white">
                            Assigned Programs
                          </h3>
                          <div className="space-y-3">
                            {dayPrograms.map((program: any, index: number) => (
                              <div
                                key={`day-program-${program.id || index}`}
                                className={`flex items-center justify-between p-4 rounded-lg border group ${
                                  program.type === "rest"
                                    ? "bg-orange-500/10 border-orange-500/20"
                                    : program.type === "temporary_program"
                                    ? "bg-cyan-500/10 border-cyan-500/20"
                                    : "bg-blue-500/10 border-blue-500/20"
                                }`}
                              >
                                <div className="flex-1">
                                  <div
                                    className={`font-medium ${
                                      program.type === "rest"
                                        ? "text-orange-300"
                                        : program.type === "temporary_program"
                                        ? "text-cyan-300"
                                        : "text-blue-300"
                                    }`}
                                  >
                                    {program.title}
                                  </div>
                                  <div
                                    className={`text-sm ${
                                      program.type === "rest"
                                        ? "text-orange-200"
                                        : program.type === "temporary_program"
                                        ? "text-cyan-200"
                                        : "text-blue-200"
                                    }`}
                                  >
                                    {program.description}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="p-2 rounded-lg hover:bg-[#4A5A70]/50 transition-colors"
                                      title="Program actions"
                                    >
                                      <MoreVertical
                                        className="h-4 w-4"
                                        style={{ color: "#ABA4AA" }}
                                      />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="min-w-[180px] rounded-lg border shadow-xl"
                                    style={{
                                      backgroundColor: "#1F2323",
                                      borderColor: "#606364",
                                    }}
                                  >
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        // Replace with lesson functionality
                                        const replacementData = {
                                          assignmentId:
                                            program.assignment?.id ||
                                            program.assignmentId,
                                          programId:
                                            program.assignment?.programId ||
                                            program.programId,
                                          programTitle: program.title,
                                          dayDate:
                                            selectedDate
                                              ?.toISOString()
                                              .split("T")[0] ||
                                            new Date()
                                              .toISOString()
                                              .split("T")[0],
                                        };
                                        setReplacementData(replacementData);
                                        setShowScheduleModal(true);
                                        setShowDayOverviewModal(false);
                                      }}
                                      className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#353A3A]"
                                      style={{ color: "#C3BCC2" }}
                                    >
                                      <Calendar
                                        className="h-4 w-4"
                                        style={{ color: "#F59E0B" }}
                                      />
                                      Replace with Lesson
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator
                                      className="my-1"
                                      style={{ backgroundColor: "#606364" }}
                                    />
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        // Handle temporary program days
                                        if (
                                          program.isTemporary &&
                                          program.replacementId
                                        ) {
                                          handleRemoveProgram(program);
                                          return;
                                        }

                                        // Create programData object like desktop version
                                        const programData = {
                                          assignmentId:
                                            program.assignment?.id ||
                                            program.id,
                                          programId:
                                            program.assignment?.programId ||
                                            program.programId,
                                          programTitle: program.title,
                                          dayDate:
                                            selectedDate
                                              ?.toISOString()
                                              .split("T")[0] ||
                                            new Date()
                                              .toISOString()
                                              .split("T")[0],
                                        };
                                        handleRemoveProgram(programData, "day");
                                      }}
                                      className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#353A3A]"
                                      style={{ color: "#C3BCC2" }}
                                    >
                                      <X
                                        className="h-4 w-4"
                                        style={{ color: "#F59E0B" }}
                                      />
                                      Remove This Day
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        // Handle temporary program days
                                        if (
                                          program.isTemporary &&
                                          program.replacementId
                                        ) {
                                          handleRemoveProgram(program);
                                          return;
                                        }

                                        // Create programData object like desktop version
                                        const programData = {
                                          assignmentId:
                                            program.assignment?.id ||
                                            program.id,
                                          programId:
                                            program.assignment?.programId ||
                                            program.programId,
                                          programTitle: program.title,
                                          dayDate:
                                            selectedDate
                                              ?.toISOString()
                                              .split("T")[0] ||
                                            new Date()
                                              .toISOString()
                                              .split("T")[0],
                                        };
                                        handleRemoveProgram(
                                          programData,
                                          "entire"
                                        );
                                      }}
                                      className="flex items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#353A3A]"
                                      style={{ color: "#EF4444" }}
                                    >
                                      <X
                                        className="h-4 w-4"
                                        style={{ color: "#EF4444" }}
                                      />
                                      Remove Entire Program
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Routine Assignments Section */}
                      {dayRoutines.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-white">
                            Assigned Routines
                          </h3>
                          <div className="space-y-3">
                            {dayRoutines.map((routine: any, index: number) => (
                              <div
                                key={`day-routine-${routine.id || index}`}
                                className="flex items-center justify-between p-4 rounded-lg border group bg-green-500/10 border-green-500/20"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                    <Target className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-green-300">
                                      {routine.routine?.name || "Routine"}
                                    </div>
                                    <div className="text-sm text-green-200">
                                      {routine.routine?.exercises?.length || 0}{" "}
                                      exercises
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveRoutine(routine)}
                                  className="p-2 text-green-400 hover:text-red-400 transition-colors"
                                  title="Remove routine"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">
                        No lessons or programs scheduled for this day
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Use the quick actions above to get started
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileClientBottomNavigation />
    </div>
  );
}
