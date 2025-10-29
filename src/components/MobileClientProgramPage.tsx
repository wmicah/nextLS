"use client";

import React, { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Play,
  Target,
  TrendingUp,
  Award,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Dumbbell,
  BookOpen,
  Zap,
  Star,
  CheckCircle2,
  Home,
  X,
  AlertCircle,
  CheckCircle,
  Circle,
  MessageSquare,
  Upload,
  Video,
  Send,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  addDays,
  isToday,
} from "date-fns";
import { formatTimeInUserTimezone } from "@/lib/timezone-utils";
import { processVideoUrl } from "@/lib/youtube-utils";
import MobileClientNavigation from "./MobileClientNavigation";
import MobileClientBottomNavigation from "./MobileClientBottomNavigation";
import ClientProgramDayModal from "./ClientProgramDayModal";
import ClientVideoSubmissionModal from "./ClientVideoSubmissionModal";
import { useExerciseCompletion } from "@/hooks/useExerciseCompletion";

interface Drill {
  id: string;
  title: string;
  sets?: number;
  reps?: number;
  tempo?: string;
  tags?: string[];
  completed?: boolean;
  videoUrl?: string;
  supersetId?: string;
  supersetOrder?: number;
}

interface ProgramData {
  programId: string;
  programAssignmentId: string;
  programTitle: string;
  programDescription?: string;
  drills: Drill[];
  isRestDay: boolean;
  expectedTime: number;
  completedDrills: number;
  totalDrills: number;
}

interface DayData {
  date: string;
  drills: Drill[]; // Keep for backward compatibility
  programs?: ProgramData[]; // New: array of programs for this day
  isRestDay: boolean;
  expectedTime: number;
  completedDrills: number;
  totalDrills: number;
  videoAssignments?: any[];
}

export default function MobileClientProgramPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDayRoutineAssignments, setSelectedDayRoutineAssignments] =
    useState<any[]>([]);
  // Use the new completion system
  const { isExerciseCompleted, markExerciseComplete } = useExerciseCompletion();

  const [completedVideoAssignments, setCompletedVideoAssignments] = useState<
    Set<string>
  >(new Set());

  // Additional state for day modal functionality
  const [noteToCoach, setNoteToCoach] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isVideoSubmissionModalOpen, setIsVideoSubmissionModalOpen] =
    useState(false);
  const [selectedDrillForVideo, setSelectedDrillForVideo] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedDrillForComment, setSelectedDrillForComment] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCoachNotesModalOpen, setIsCoachNotesModalOpen] = useState(false);

  // Get client's assigned program
  const {
    data: programInfo,
    isLoading: programLoading,
    error: programError,
  } = trpc.clientRouter.getAssignedProgram.useQuery();

  // Mutations for day modal functionality
  const sendNoteToCoachMutation =
    trpc.clientRouter.sendNoteToCoach.useMutation();
  const addCommentToDrillMutation =
    trpc.clientRouter.addCommentToDrill.useMutation();
  const markVideoAssignmentCompleteMutation =
    trpc.clientRouter.markVideoAssignmentComplete.useMutation();

  // Use lightweight calendar query for initial load
  const {
    data: calendarData,
    error: calendarError,
    isLoading: calendarLoading,
    refetch: refetchCalendar,
  } = trpc.clientRouter.getProgramCalendarLight.useQuery({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    viewMode: "month",
  });

  // Detailed day data - only loaded when a day is selected
  const [selectedDateForDetails, setSelectedDateForDetails] = useState<
    string | null
  >(null);
  const {
    data: selectedDayDetails,
    isLoading: dayDetailsLoading,
    error: dayDetailsError,
  } = trpc.clientRouter.getProgramDayDetails.useQuery(
    { date: selectedDateForDetails! },
    {
      enabled: !!selectedDateForDetails,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Open modal when detailed data is loaded
  React.useEffect(() => {
    if (selectedDateForDetails && selectedDayDetails && !dayDetailsLoading) {
      setIsDayModalOpen(true);
    }
  }, [selectedDateForDetails, selectedDayDetails, dayDetailsLoading]);

  // Fetch routine assignments for mobile program page
  const { data: routineAssignments = [], refetch: refetchRoutineAssignments } =
    trpc.clientRouter.getRoutineAssignments.useQuery(undefined, {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
    });

  // Get coach notes
  const { data: coachNotes } = trpc.notes.getMyNotes.useQuery();

  // Debug logging
  console.log("MobileClientProgramPage - programInfo:", programInfo);
  console.log("MobileClientProgramPage - programLoading:", programLoading);
  console.log("MobileClientProgramPage - programError:", programError);
  console.log("MobileClientProgramPage - calendarData:", calendarData);
  console.log(
    "MobileClientProgramPage - routineAssignments:",
    routineAssignments
  );
  console.log(
    "MobileClientProgramPage - calendarData type:",
    typeof calendarData,
    Array.isArray(calendarData)
  );

  // Get current week's calendar data
  const currentWeekStart = startOfWeek(new Date());
  const currentWeekEnd = endOfWeek(new Date());
  const startDateString = `${currentWeekStart.getFullYear()}-${(
    currentWeekStart.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${currentWeekStart
    .getDate()
    .toString()
    .padStart(2, "0")}`;
  const endDateString = `${currentWeekEnd.getFullYear()}-${(
    currentWeekEnd.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${currentWeekEnd.getDate().toString().padStart(2, "0")}`;

  const { data: currentWeekData, isLoading: currentWeekLoading } =
    trpc.clientRouter.getProgramCalendar.useQuery({
      year: currentWeekStart.getFullYear(),
      month: currentWeekStart.getMonth() + 1,
      viewMode: "week",
    });

  // Initialize video assignments completion state
  React.useEffect(() => {
    if (selectedDay?.videoAssignments) {
      const serverCompletedVideoAssignments = new Set<string>();
      selectedDay.videoAssignments.forEach(assignment => {
        if (assignment.completed) {
          serverCompletedVideoAssignments.add(assignment.id);
        }
      });
      setCompletedVideoAssignments(serverCompletedVideoAssignments);
    }
  }, [selectedDay]);

  // Update drill completion status based on the new completion system
  const updateDrillCompletionStatus = (dayData: DayData | null) => {
    if (!dayData?.programs) return dayData;

    const updatedDayData = {
      ...dayData,
      programs: dayData.programs.map(program => ({
        ...program,
        drills: program.drills.map(drill => {
          // Use the new completion system to check if drill is completed
          let isCompleted;
          const dateKey = dayData.date
            ? new Date(dayData.date).toISOString().split("T")[0]
            : undefined;
          if (drill.id.includes("-routine-")) {
            // This is a routine exercise within a program
            const exerciseId = drill.id.split("-routine-")[1];
            const programDrillId = drill.id.split("-routine-")[0];
            isCompleted = isExerciseCompleted(
              exerciseId,
              programDrillId,
              dateKey
            );
          } else {
            // This is a regular drill
            isCompleted = isExerciseCompleted(drill.id, undefined, dateKey);
          }

          return {
            ...drill,
            completed: isCompleted,
          };
        }),
      })),
    };

    return updatedDayData;
  };

  // Get routine assignments for a specific date (exact replica of desktop)
  const getRoutinesForDate = (date: Date) => {
    if (!routineAssignments || routineAssignments.length === 0) {
      return [];
    }

    // Convert date to YYYY-MM-DD format for comparison
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

    // Filter routines that are available for this date
    const filteredRoutines = routineAssignments.filter((assignment: any) => {
      // If no startDate, use assignedAt as the start date
      const startDate = assignment.startDate || assignment.assignedAt;
      if (!startDate) {
        return false;
      }

      // Convert assignment start date to YYYY-MM-DD format
      const assignmentDate = new Date(startDate);
      const assignmentDateString = `${assignmentDate.getFullYear()}-${(
        assignmentDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${assignmentDate
        .getDate()
        .toString()
        .padStart(2, "0")}`;

      // Show routines only on their exact assigned date
      const selectedDate = new Date(date);
      const routineStartDate = new Date(assignmentDate);

      // Set time to start of day for accurate comparison
      selectedDate.setHours(0, 0, 0, 0);
      routineStartDate.setHours(0, 0, 0, 0);

      const isAvailable = selectedDate.getTime() === routineStartDate.getTime();

      // Show routine only on its exact assigned date
      return isAvailable;
    });

    return filteredRoutines;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  // Enhanced touch interactions for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const currentTouch = e.targetTouches[0].clientX;
    const distance = Math.abs(currentTouch - touchStart);

    // Only start preventing default if we're moving horizontally enough
    if (distance > 10) {
      setIsSwiping(true);
      e.preventDefault();
      e.stopPropagation();
    }

    setTouchEnd(currentTouch);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || touchEnd === null) {
      setTouchStart(null);
      setTouchEnd(null);
      setIsSwiping(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      e.preventDefault();
      e.stopPropagation();

      if (isLeftSwipe) {
        navigateMonth("next");
      }
      if (isRightSwipe) {
        navigateMonth("prev");
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
    setIsSwiping(false);
  };

  // Get day data from calendar data (exact replica of desktop)
  const getDayData = (date: Date): DayData | null => {
    if (!calendarData) return null;
    // Use local date format to avoid timezone conversion issues
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    return (calendarData as any)[dateString] || null;
  };

  // Calculate completion counts for a specific day (same logic as desktop)
  const calculateDayCompletionCounts = (
    dayData: DayData | null,
    selectedDate: Date | null
  ) => {
    if (!dayData && !selectedDate)
      return { totalDrills: 0, completedDrills: 0 };

    let totalDrills = 0;
    let completedDrills = 0;

    // Count program drills (excluding rest days)
    if (dayData?.programs) {
      dayData.programs.forEach(program => {
        if (!program.isRestDay) {
          // If we have detailed drill data, count individual drills
          if (program.drills) {
            program.drills.forEach(drill => {
              totalDrills++;
              // Use the new completion system to check if drill is completed
              let isCompleted;
              const dateKey = selectedDate
                ? selectedDate.toISOString().split("T")[0]
                : undefined;
              if (drill.id.includes("-routine-")) {
                // This is a routine exercise within a program
                const exerciseId = drill.id.split("-routine-")[1];
                const programDrillId = drill.id.split("-routine-")[0];
                isCompleted = isExerciseCompleted(
                  exerciseId,
                  programDrillId,
                  dateKey
                );
              } else {
                // This is a regular drill
                isCompleted = isExerciseCompleted(drill.id, undefined, dateKey);
              }
              if (isCompleted) {
                completedDrills++;
              }
            });
          } else {
            // If we only have lightweight data, use the pre-calculated counts
            totalDrills += program.totalDrills || 0;
            completedDrills += program.completedDrills || 0;
          }
        }
      });
    }

    // Count routine exercises for the selected date
    if (selectedDate) {
      const routinesForDate = getRoutinesForDate(selectedDate);
      routinesForDate.forEach(routineAssignment => {
        if ((routineAssignment as any).routine?.exercises) {
          (routineAssignment as any).routine.exercises.forEach(
            (exercise: any) => {
              totalDrills++;
              // Use the new completion system for standalone routine exercises
              const dateKey = selectedDate
                ? selectedDate.toISOString().split("T")[0]
                : undefined;
              const isCompleted = isExerciseCompleted(
                exercise.id,
                (routineAssignment as any).id,
                dateKey
              );
              if (isCompleted) {
                completedDrills++;
              }
            }
          );
        }
      });
    }

    return { totalDrills, completedDrills };
  };

  const handleDateClick = (day: Date) => {
    const dayString = format(day, "yyyy-MM-dd");
    let dayData: DayData | undefined;

    // Use the same getDayData function as desktop
    dayData = getDayData(day) || undefined;

    // Debug logging for video assignments
    console.log("MobileClientProgramPage - handleDateClick:", {
      dayString,
      dayData,
      videoAssignments: dayData?.videoAssignments,
      hasVideoAssignments:
        dayData?.videoAssignments && dayData.videoAssignments.length > 0,
    });

    // Check for routine assignments for this day
    const dayRoutineAssignments = routineAssignments.filter(
      (assignment: any) => {
        if (!assignment.startDate) return false;
        const assignmentDate = new Date(assignment.startDate);
        const dayDate = new Date(day);

        // Set time to start of day for accurate comparison
        assignmentDate.setHours(0, 0, 0, 0);
        dayDate.setHours(0, 0, 0, 0);

        const isMatch = assignmentDate.getTime() === dayDate.getTime();
        if (isMatch) {
          console.log("Found routine assignment for", dayString, assignment);
        }
        return isMatch;
      }
    );

    console.log(
      "Day routine assignments for",
      dayString,
      ":",
      dayRoutineAssignments
    );

    // If we have either program data or routine assignments, open the modal
    if (dayData || dayRoutineAssignments.length > 0) {
      // If we don't have program data but have routine assignments, create a minimal dayData
      if (!dayData && dayRoutineAssignments.length > 0) {
        dayData = {
          date: dayString,
          drills: [],
          programs: [],
          isRestDay: false,
          expectedTime: 0,
          completedDrills: 0,
          totalDrills: 0,
          videoAssignments: [], // Ensure videoAssignments is always an array
        };
      }

      // Ensure videoAssignments is always an array to prevent crashes
      if (dayData && !dayData.videoAssignments) {
        dayData.videoAssignments = [];
      }

      // At this point, dayData should never be undefined
      if (dayData) {
        console.log("🔄 Setting selectedDay:", dayData.date);
        console.log(
          "🔄 selectedDay videoAssignments:",
          dayData.videoAssignments
        );
        setSelectedDay(dayData);
        setSelectedDate(day);
        setSelectedDateForDetails(dayString);
        setSelectedDayRoutineAssignments(dayRoutineAssignments);
        // Don't open modal immediately - wait for data to load
      }
    }
  };

  // Handler functions for day modal - using new completion system
  const handleMarkDrillComplete = async (
    drillId: string,
    completed: boolean,
    programAssignmentId?: string
  ) => {
    console.log("🎯 MOBILE handleMarkDrillComplete called with:", {
      drillId,
      completed,
    });

    try {
      // Use the new completion system
      const dateKey = selectedDate
        ? selectedDate.toISOString().split("T")[0]
        : undefined;
      await markExerciseComplete(drillId, undefined, completed, dateKey);
      console.log("✅ MOBILE Drill completion updated successfully");
    } catch (error) {
      console.error(
        "❌ MOBILE ERROR: Failed to update drill completion:",
        error
      );
    }
  };

  // Handle routine exercise completion - using new system
  const handleMarkRoutineExerciseComplete = async (
    exerciseId: string,
    routineAssignmentId: string,
    completed: boolean
  ) => {
    console.log(
      "🔍 MOBILE handleMarkRoutineExerciseComplete called - exerciseId:",
      exerciseId,
      "routineAssignmentId:",
      routineAssignmentId,
      "completed:",
      completed
    );

    try {
      // Use the new completion system for standalone routine exercises
      const dateKey = selectedDate
        ? selectedDate.toISOString().split("T")[0]
        : undefined;
      await markExerciseComplete(
        exerciseId,
        routineAssignmentId,
        completed,
        dateKey
      );
      console.log("✅ MOBILE Routine exercise completion updated successfully");
    } catch (error) {
      console.error(
        "❌ MOBILE ERROR: Failed to update routine exercise completion:",
        error
      );
    }
  };

  const handleMarkAllComplete = async () => {
    if (!selectedDay) return;

    if (confirm("Mark all drills for this day as complete?")) {
      const allDrillIds = selectedDay.drills.map(drill => drill.id);

      // Mark all drills as complete
      for (const drillId of allDrillIds) {
        await handleMarkDrillComplete(drillId, true);
      }
    }
  };

  const handleSendNote = async () => {
    if (!noteToCoach.trim() || !selectedDay) return;

    setIsSubmittingNote(true);
    try {
      await sendNoteToCoachMutation.mutateAsync({
        date: selectedDay.date,
        note: noteToCoach,
      });
      setNoteToCoach("");
    } catch (error) {
      console.error("Failed to send note:", error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleSubmitVideo = (drillId: string, drillTitle: string) => {
    setSelectedDrillForVideo({ id: drillId, title: drillTitle });
    setIsVideoSubmissionModalOpen(true);
  };

  const handleOpenVideo = (videoUrl: string, drill: any) => {
    // Use centralized YouTube processing
    const { isYouTube, youtubeId } = processVideoUrl(videoUrl);

    console.log("Opening video for routine exercise:", {
      videoUrl,
      drill,
      isYouTube,
      youtubeId,
      fullDrillData: drill,
    });

    setSelectedVideo({
      id: drill.id,
      title: drill.title,
      url: videoUrl,
      isYoutube: isYouTube,
      youtubeId: youtubeId || undefined,
    });
    setIsVideoPlayerOpen(true);
  };

  const handleOpenCommentModal = (drill: { id: string; title: string }) => {
    setSelectedDrillForComment(drill);
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !selectedDrillForComment) return;

    setIsSubmittingComment(true);
    try {
      await addCommentToDrillMutation.mutateAsync({
        drillId: selectedDrillForComment.id,
        comment: commentText,
      });
      setCommentText("");
      setIsCommentModalOpen(false);
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleMarkVideoAssignmentComplete = async (
    assignmentId: string,
    completed: boolean
  ) => {
    setCompletedVideoAssignments(prev => {
      const newSet = new Set(prev);
      if (completed) {
        newSet.add(assignmentId);
      } else {
        newSet.delete(assignmentId);
      }
      return newSet;
    });

    try {
      await markVideoAssignmentCompleteMutation.mutateAsync({
        assignmentId,
        completed,
      });
      await refetchCalendar();
    } catch (error) {
      setCompletedVideoAssignments(prev => {
        const newSet = new Set(prev);
        if (completed) {
          newSet.delete(assignmentId);
        } else {
          newSet.add(assignmentId);
        }
        return newSet;
      });
    }
  };

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  // Extract note content from coach notes
  const extractNoteContent = (notes: any[]) => {
    if (!notes || notes.length === 0) return "";
    return notes[0]?.content || "";
  };

  if (programLoading || calendarLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#2A3133" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white">Loading your program...</p>
        </div>
      </div>
    );
  }

  if (programError || calendarError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#2A3133" }}
      >
        <div className="text-center">
          <p className="text-red-400 mb-4">
            {programError
              ? "Error loading assigned program"
              : "Error loading program data"}
          </p>
          <Button
            onClick={() => refetchCalendar()}
            className="bg-[#4A5A70] hover:bg-[#606364] text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#2A3133] to-[#353A3A] border-b border-[#4A5A70] px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A5A70] to-[#606364] flex items-center justify-center shadow-md">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">My Program</h1>
              <p className="text-sm text-gray-300">Training & progress</p>
            </div>
          </div>
          <MobileClientNavigation currentPage="dashboard" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* Calendar View */}
        <div
          className={`relative p-6 rounded-2xl bg-gradient-to-br from-[#1F2426] to-[#2A3133] border border-[#4A5A70] shadow-xl transition-all duration-200 ${
            isSwiping ? "scale-[0.98] opacity-90" : ""
          }`}
          style={{
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
          }}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-4 mb-6 rounded-xl bg-gradient-to-r from-[#353A3A] to-[#40454A] shadow-inner">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-3 rounded-xl bg-[#4A5A70] hover:bg-[#606364] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <h3 className="text-2xl font-bold text-white">
              {format(currentDate, "MMMM yyyy")}
            </h3>
            <button
              onClick={() => navigateMonth("next")}
              className="p-3 rounded-xl bg-[#4A5A70] hover:bg-[#606364] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Coach Notes */}
          <div className="mb-4">
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/30">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-300">
                    Coach Notes
                  </p>
                  <p className="text-xs text-purple-200/80">
                    {coachNotes?.length || 0} note
                    {(coachNotes?.length || 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {coachNotes && coachNotes.length > 0 ? (
                <div className="space-y-2">
                  <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
                    <p className="text-sm text-purple-100 leading-relaxed">
                      {(() => {
                        const content = extractNoteContent(coachNotes);
                        return content.length > 60
                          ? `${content.substring(0, 60)}...`
                          : content;
                      })()}
                    </p>
                    <button
                      onClick={() => setIsCoachNotesModalOpen(true)}
                      className="mt-2 text-xs font-semibold text-purple-300 hover:text-purple-200"
                    >
                      Read Full Note
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <p className="text-xs text-purple-200/80 font-medium">
                      Updated{" "}
                      {new Date(
                        coachNotes[0]?.updatedAt ||
                          coachNotes[0]?.createdAt ||
                          new Date()
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <p className="text-sm text-gray-400">No feedback yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Day Headers */}
          <div
            className="grid grid-cols-7 gap-2 mb-4"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div
                key={day}
                className="text-center text-sm font-bold text-[#ABA4AA] py-3 bg-[#353A3A] rounded-lg"
              >
                {day.slice(0, 1)}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div
            className="grid grid-cols-7 gap-2"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {getCalendarDays().map(day => {
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayString = format(day, "yyyy-MM-dd");
              const dayData =
                calendarData &&
                typeof calendarData === "object" &&
                !Array.isArray(calendarData)
                  ? (calendarData as any)[dayString]
                  : Array.isArray(calendarData)
                  ? calendarData.find((d: DayData) => d.date === dayString)
                  : undefined;
              // Calculate completion counts using the same logic as desktop
              const completionCounts = calculateDayCompletionCounts(
                dayData,
                day
              );
              const hasWorkout =
                dayData &&
                !dayData.isRestDay &&
                completionCounts.totalDrills > 0;
              const isCompleted =
                dayData &&
                completionCounts.completedDrills ===
                  completionCounts.totalDrills &&
                completionCounts.totalDrills > 0;
              const isPartial =
                dayData &&
                completionCounts.completedDrills > 0 &&
                completionCounts.completedDrills < completionCounts.totalDrills;

              // Get program indicators for this day
              const programIndicators =
                dayData?.programs?.map(
                  (program: ProgramData, index: number) => {
                    // Use the completion counts from the hook for accurate counts
                    const remaining =
                      completionCounts.totalDrills -
                      completionCounts.completedDrills;
                    const isRestDay = program.isRestDay;

                    return {
                      id: program.programId,
                      title: program.programTitle,
                      remaining,
                      isRestDay,
                      color:
                        index === 0
                          ? "blue"
                          : index === 1
                          ? "green"
                          : index === 2
                          ? "purple"
                          : "orange",
                    };
                  }
                ) || [];

              // Get routine indicators for this day
              const routineIndicators = routineAssignments
                .filter((assignment: any) => {
                  if (!assignment.startDate) return false;
                  const assignmentDate = new Date(assignment.startDate);
                  const dayDate = new Date(day);

                  // Set time to start of day for accurate comparison
                  assignmentDate.setHours(0, 0, 0, 0);
                  dayDate.setHours(0, 0, 0, 0);

                  const isMatch =
                    assignmentDate.getTime() === dayDate.getTime();
                  if (isMatch) {
                    console.log(
                      "Found routine assignment for",
                      dayString,
                      assignment
                    );
                  }
                  return isMatch;
                })
                .map((assignment: any, index: number) => ({
                  id: `routine-${assignment.id}`,
                  title: assignment.routine?.name || "Routine",
                  remaining: assignment.routine?.exercises?.length || 0,
                  isRestDay: false,
                  color: "green", // Green for standalone routines
                  type: "routine",
                }));

              // Combine all indicators (programs and routines)
              const allIndicators = [
                ...programIndicators,
                ...routineIndicators,
              ];

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={`
                      aspect-square flex flex-col items-center justify-center text-xs rounded-xl transition-all duration-200 relative border-2 cursor-pointer active:scale-95 p-0.5 shadow-md hover:shadow-lg overflow-hidden
                      ${
                        isToday
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400 shadow-blue-500/30 font-bold"
                          : isCurrentMonth
                          ? allIndicators.length > 0
                            ? "text-white bg-gradient-to-br from-[#4A5A70] to-[#606364] border-[#4A5A70] hover:from-[#606364] hover:to-[#4A5A70]"
                            : "text-[#ABA4AA] bg-gradient-to-br from-[#353A3A] to-[#40454A] border-[#606364] hover:from-[#4A5A70] hover:to-[#606364]"
                          : "text-gray-600 bg-gradient-to-br from-gray-900/30 to-gray-800/20 border-gray-700"
                      }
                    `}
                >
                  <div className="font-bold text-xs leading-none">
                    {format(day, "d")}
                  </div>
                  {allIndicators.length > 0 && (
                    <div className="flex justify-center items-center gap-0.5 mt-0.5">
                      {allIndicators
                        .slice(0, 2)
                        .map((indicator: any, idx: number) => (
                          <div
                            key={indicator.id}
                            className={`w-2 h-2 rounded-full flex items-center justify-center text-[6px] font-bold shadow-sm border transition-all duration-200 ${
                              indicator.isRestDay
                                ? "bg-orange-500 text-white border-orange-400"
                                : indicator.remaining === 0
                                ? "bg-green-500 text-white border-green-400 shadow-lg shadow-green-500/50"
                                : indicator.color === "blue"
                                ? "bg-blue-500 text-white border-blue-400"
                                : indicator.color === "green"
                                ? "bg-green-500 text-white border-green-400"
                                : indicator.color === "purple"
                                ? "bg-purple-500 text-white border-purple-400"
                                : "bg-orange-500 text-white border-orange-400"
                            }`}
                            title={`${indicator.title}: ${indicator.remaining} exercises remaining`}
                          >
                            {indicator.isRestDay
                              ? "R"
                              : indicator.remaining === 0
                              ? "✓"
                              : indicator.remaining}
                          </div>
                        ))}
                      {allIndicators.length > 2 && (
                        <div className="w-2 h-2 rounded-full bg-gray-500 text-white border border-gray-400 flex items-center justify-center text-[6px] font-bold">
                          +
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Modal - Full functionality */}
      {isDayModalOpen && selectedDay && (
        <ClientProgramDayModal
          isOpen={isDayModalOpen}
          onClose={() => {
            setIsDayModalOpen(false);
            setSelectedDateForDetails(null);
          }}
          selectedDay={
            selectedDayDetails
              ? updateDrillCompletionStatus(selectedDayDetails)
              : updateDrillCompletionStatus(selectedDay)
          }
          selectedDate={selectedDate}
          programs={
            selectedDayDetails?.programs ||
            updateDrillCompletionStatus(selectedDay)?.programs ||
            []
          }
          routineAssignments={selectedDayRoutineAssignments}
          onMarkDrillComplete={handleMarkDrillComplete}
          onMarkAllComplete={handleMarkAllComplete}
          onOpenVideo={handleOpenVideo}
          onOpenCommentModal={handleOpenCommentModal}
          onOpenVideoSubmissionModal={handleSubmitVideo}
          onSendNote={handleSendNote}
          noteToCoach={noteToCoach}
          setNoteToCoach={setNoteToCoach}
          isSubmittingNote={isSubmittingNote}
          calculateDayCompletionCounts={(dayData, selectedDate) => {
            if (!dayData && !selectedDate)
              return { totalDrills: 0, completedDrills: 0 };

            let totalDrills = 0;
            let completedDrills = 0;

            // Count program drills (excluding rest days)
            if (dayData && "programs" in dayData && dayData.programs) {
              (dayData as any).programs.forEach((program: ProgramData) => {
                if (!program.isRestDay) {
                  // If we have detailed drill data, count individual drills
                  if (program.drills) {
                    program.drills.forEach((drill: Drill) => {
                      totalDrills++;
                      // Use the new completion system to check if drill is completed
                      let isCompleted;
                      const dateKey = selectedDate
                        ? selectedDate.toISOString().split("T")[0]
                        : undefined;
                      if (drill.id.includes("-routine-")) {
                        // This is a routine exercise within a program
                        const exerciseId = drill.id.split("-routine-")[1];
                        const programDrillId = drill.id.split("-routine-")[0];
                        isCompleted = isExerciseCompleted(
                          exerciseId,
                          programDrillId,
                          dateKey
                        );
                      } else {
                        // This is a regular drill
                        isCompleted = isExerciseCompleted(
                          drill.id,
                          undefined,
                          dateKey
                        );
                      }
                      if (isCompleted) {
                        completedDrills++;
                      }
                    });
                  } else {
                    // If we only have lightweight data, use the pre-calculated counts
                    totalDrills += (program as any).totalDrills || 0;
                    completedDrills += (program as any).completedDrills || 0;
                  }
                }
              });
            }

            // Count routine exercises for the selected date
            if (selectedDate) {
              const routinesForDate = getRoutinesForDate(selectedDate);
              routinesForDate.forEach(routineAssignment => {
                if ((routineAssignment as any).routine?.exercises) {
                  (routineAssignment as any).routine.exercises.forEach(
                    (exercise: any) => {
                      totalDrills++;
                      // Use the new completion system for standalone routine exercises
                      const dateKey = selectedDate
                        ? selectedDate.toISOString().split("T")[0]
                        : undefined;
                      const isCompleted = isExerciseCompleted(
                        exercise.id,
                        (routineAssignment as any).id,
                        dateKey
                      );
                      if (isCompleted) {
                        completedDrills++;
                      }
                    }
                  );
                }
              });
            }

            return { totalDrills, completedDrills };
          }}
          calculateDayAssignmentCounts={(dayData, selectedDate) => {
            if (!dayData)
              return { totalAssignments: 0, completedAssignments: 0 };
            return {
              totalAssignments: 0,
              completedAssignments: 0,
            };
          }}
          onMarkRoutineExerciseComplete={handleMarkRoutineExerciseComplete}
          onMarkVideoAssignmentComplete={handleMarkVideoAssignmentComplete}
          completedVideoAssignments={completedVideoAssignments}
          isLoadingDetails={dayDetailsLoading}
          detailsError={dayDetailsError}
        />
      )}

      {/* Video Submission Modal */}
      {isVideoSubmissionModalOpen && selectedDrillForVideo && (
        <ClientVideoSubmissionModal
          isOpen={isVideoSubmissionModalOpen}
          onClose={() => {
            setIsVideoSubmissionModalOpen(false);
            setSelectedDrillForVideo(null);
          }}
          drillId={selectedDrillForVideo.id}
          drillTitle={selectedDrillForVideo.title}
        />
      )}

      {/* Video Player Modal */}
      {isVideoPlayerOpen && selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-[#1F2426] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#606364]">
              <h3 className="text-lg font-semibold text-white">
                {selectedVideo.title}
              </h3>
              <button
                onClick={() => {
                  setIsVideoPlayerOpen(false);
                  setSelectedVideo(null);
                }}
                className="text-[#ABA4AA] hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              {selectedVideo.isYoutube ? (
                <iframe
                  width="100%"
                  height="400"
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                />
              ) : (
                <video
                  controls
                  className="w-full rounded-lg"
                  src={selectedVideo.url}
                  onLoadStart={() =>
                    console.log("Video load started:", selectedVideo.url)
                  }
                  onCanPlay={() =>
                    console.log("Video can play:", selectedVideo.url)
                  }
                  onError={e => {
                    console.error("Video load error:", e);
                    console.error("Video URL:", selectedVideo.url);
                    console.error("Video element:", e.target);
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {isCommentModalOpen && selectedDrillForComment && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-[#1F2426] rounded-lg border-2 border-[#4A5A70] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Comment</h3>
              <button
                onClick={() => {
                  setIsCommentModalOpen(false);
                  setSelectedDrillForComment(null);
                  setCommentText("");
                }}
                className="text-[#ABA4AA] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#C3BCC2] mb-2">
                  Comment for {selectedDrillForComment.title}
                </label>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="w-full p-3 bg-[#353A3A] border border-[#606364] text-[#C3BCC2] rounded-lg focus:ring-2 focus:ring-[#4A5A70] focus:border-transparent"
                  rows={4}
                  placeholder="Add your comment..."
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setIsCommentModalOpen(false);
                    setSelectedDrillForComment(null);
                    setCommentText("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="flex-1 bg-[#4A5A70] hover:bg-[#606364] text-white"
                >
                  {isSubmittingComment ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coach Notes Modal */}
      {isCoachNotesModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-purple-500/20 rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-400/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <FileText className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Coach Notes</h3>
                  <p className="text-sm text-purple-200/80">
                    {coachNotes?.length || 0} note
                    {(coachNotes?.length || 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCoachNotesModalOpen(false)}
                className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {coachNotes && coachNotes.length > 0 ? (
                coachNotes.map((note, index) => (
                  <div
                    key={note.id}
                    className="bg-purple-500/10 rounded-2xl p-4 border border-purple-400/30"
                  >
                    {/* Note Date */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <p className="text-sm text-purple-200/80 font-medium">
                        {new Date(
                          note.updatedAt || note.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Note Content */}
                    <div className="prose prose-invert max-w-none">
                      <p className="text-purple-100 leading-relaxed whitespace-pre-wrap">
                        {note.content || "No content available"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 rounded-full bg-purple-500/10 w-fit mx-auto mb-4">
                    <FileText className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="text-lg font-semibold text-purple-200 mb-2">
                    No Notes Yet
                  </p>
                  <p className="text-sm text-purple-200/80">
                    Your coach hasn't added any notes yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <MobileClientBottomNavigation />
    </div>
  );
}
