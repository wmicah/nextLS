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
  programs: ProgramData[];
  isRestDay: boolean;
  totalDrills: number;
  completedDrills: number;
  drills: Drill[];
  expectedTime: number;
}

export default function MobileClientProgramPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDayRoutineAssignments, setSelectedDayRoutineAssignments] =
    useState<any[]>([]);
  const [completedProgramDrills, setCompletedProgramDrills] = useState<
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

  // Get client's assigned program
  const {
    data: programInfo,
    isLoading: programLoading,
    error: programError,
  } = trpc.clientRouter.getAssignedProgram.useQuery();

  // Mutations for day modal functionality
  const markDrillCompleteMutation =
    trpc.clientRouter.markDrillComplete.useMutation({
      onSuccess: data => {
        console.log("✅ markDrillComplete SUCCESS:", data);
      },
      onError: error => {
        console.error("❌ markDrillComplete ERROR:", error);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error code:", error.data?.code);
        console.error("❌ Full error:", error);
      },
    });
  const markRoutineExerciseCompleteMutation =
    trpc.clientRouter.markRoutineExerciseComplete.useMutation({
      onSuccess: data => {
        console.log("✅ markRoutineExerciseComplete SUCCESS:", data);
      },
      onError: error => {
        console.error("❌ markRoutineExerciseComplete ERROR:", error);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error code:", error.data?.code);
        console.error("❌ Full error:", error);
      },
    });
  const sendNoteToCoachMutation =
    trpc.clientRouter.sendNoteToCoach.useMutation();
  const addCommentToDrillMutation =
    trpc.clientRouter.addCommentToDrill.useMutation();

  const {
    data: calendarData,
    error: calendarError,
    isLoading: calendarLoading,
    refetch: refetchCalendar,
  } = trpc.clientRouter.getProgramCalendar.useQuery({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    viewMode: "month",
  });

  // Fetch routine assignments for mobile program page
  const { data: routineAssignments = [], refetch: refetchRoutineAssignments } =
    trpc.clientRouter.getRoutineAssignments.useQuery(undefined, {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
    });

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

  // Initialize completion state from server data when selectedDay changes (exact replica of desktop)
  React.useEffect(() => {
    console.log(
      "🔄 useEffect running - selectedDay changed:",
      selectedDay?.date
    );
    if (selectedDay?.programs) {
      const serverCompletedDrills = new Set<string>();
      selectedDay.programs.forEach(program => {
        program.drills.forEach(drill => {
          if (drill.completed) {
            serverCompletedDrills.add(drill.id);
          }
        });
      });
      console.log(
        "🔄 Setting completedProgramDrills from server:",
        Array.from(serverCompletedDrills)
      );

      // Only reset if we don't have any optimistic updates
      // This prevents overriding optimistic updates during refetch
      setCompletedProgramDrills(prev => {
        // If we have optimistic updates, merge with server data instead of replacing
        if (prev.size > 0) {
          console.log("🔄 Merging server data with optimistic updates");
          const merged = new Set(prev);
          serverCompletedDrills.forEach(id => merged.add(id));
          return merged;
        } else {
          console.log("🔄 Setting fresh server data");
          return serverCompletedDrills;
        }
      });
    }
  }, [selectedDay]);

  // Update drill completion status based on our tracked state
  const updateDrillCompletionStatus = (dayData: DayData | null) => {
    if (!dayData?.programs) return dayData;

    console.log(
      "🔄 MOBILE updateDrillCompletionStatus called with completedProgramDrills:",
      Array.from(completedProgramDrills)
    );

    const updatedDayData = {
      ...dayData,
      programs: dayData.programs.map(program => ({
        ...program,
        drills: program.drills.map(drill => {
          const isCompleted = completedProgramDrills.has(drill.id);
          console.log(
            `🔄 MOBILE Drill ${drill.id} (${drill.title}): server completed=${drill.completed}, state completed=${isCompleted}`
          );
          return {
            ...drill,
            completed: isCompleted, // Use our tracked state, not server data
          };
        }),
      })),
    };

    console.log("🔄 MOBILE Updated dayData:", updatedDayData);
    return updatedDayData;
  };

  // Initialize routine exercise completion state from server data when selectedDate changes (exact replica of desktop)
  React.useEffect(() => {
    if (selectedDate && routineAssignments) {
      const serverCompletedRoutineExercises = new Set<string>();

      const routinesForDate = getRoutinesForDate(selectedDate);

      // Load routine exercise completions from the routine assignments
      routinesForDate.forEach(routineAssignment => {
        if ((routineAssignment as any).completions) {
          (routineAssignment as any).completions.forEach((completion: any) => {
            const routineExerciseKey = `${routineAssignment.id}-${completion.exerciseId}`;
            serverCompletedRoutineExercises.add(routineExerciseKey);
          });
        }
      });

      console.log(
        "🔄 Routine exercise completions from server:",
        Array.from(serverCompletedRoutineExercises)
      );

      // Update completion state with server data
      setCompletedProgramDrills(prev => {
        const newSet = new Set(prev);
        serverCompletedRoutineExercises.forEach(id => newSet.add(id));
        console.log("🔄 Updated completion state:", Array.from(newSet));
        return newSet;
      });
    }
  }, [selectedDate, routineAssignments]);

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

  const handleDateClick = (day: Date) => {
    const dayString = format(day, "yyyy-MM-dd");
    let dayData: DayData | undefined;

    // Use the same getDayData function as desktop
    dayData = getDayData(day) || undefined;

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
        };
      }

      // At this point, dayData should never be undefined
      if (dayData) {
        console.log("🔄 Setting selectedDay:", dayData.date);
        setSelectedDay(dayData);
        setSelectedDate(day);
        setSelectedDayRoutineAssignments(dayRoutineAssignments);
        setIsDayModalOpen(true);
      }
    }
  };

  // Handler functions for day modal - exact replica of desktop version
  const handleMarkDrillComplete = async (
    drillId: string,
    completed: boolean
  ) => {
    console.log("🎯 MOBILE handleMarkDrillComplete called with:", {
      drillId,
      completed,
    });

    // Update the completion state immediately for real-time UI updates
    setCompletedProgramDrills(prev => {
      const newSet = new Set(prev);
      if (completed) {
        newSet.add(drillId);
        console.log(
          "🎯 MOBILE Added drill to completedProgramDrills:",
          drillId
        );
      } else {
        newSet.delete(drillId);
        console.log(
          "🎯 MOBILE Removed drill from completedProgramDrills:",
          drillId
        );
      }
      console.log("🎯 MOBILE New completedProgramDrills:", Array.from(newSet));
      return newSet;
    });

    // Then perform the actual mutation
    try {
      console.log("🎯 MOBILE Calling markDrillCompleteMutation with:", {
        drillId,
        completed,
      });

      // Add timeout to catch hanging mutations
      const mutationPromise = markDrillCompleteMutation.mutateAsync({
        drillId: drillId,
        completed,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Mutation timeout after 10 seconds")),
          10000
        )
      );

      await Promise.race([mutationPromise, timeoutPromise]);
      console.log("🎯 MOBILE markDrillCompleteMutation completed successfully");

      // Subtle refetch to ensure UI stays in sync - with delay to let server process
      console.log("🎯 MOBILE Refetching calendar data...");
      setTimeout(async () => {
        await refetchCalendar();
        console.log("🎯 MOBILE Calendar data refetched");
      }, 1000);
    } catch (error) {
      console.error(
        "🎯 MOBILE ERROR: markDrillCompleteMutation failed:",
        error
      );
      // Revert optimistic update on error
      setCompletedProgramDrills(prev => {
        const newSet = new Set(prev);
        if (completed) {
          newSet.delete(drillId); // Remove if we were trying to mark complete
        } else {
          newSet.add(drillId); // Add if we were trying to mark incomplete
        }
        return newSet;
      });
      console.error("Failed to update drill completion:", error);
    }
  };

  // Handle routine exercise completion - exact replica of desktop version
  const handleMarkRoutineExerciseComplete = async (
    exerciseId: string,
    routineAssignmentId: string,
    completed: boolean
  ) => {
    console.log(
      "🔍 handleMarkRoutineExerciseComplete called - exerciseId:",
      exerciseId,
      "routineAssignmentId:",
      routineAssignmentId,
      "completed:",
      completed
    );

    // Use exercise ID directly for routine exercises
    const routineExerciseKey = `${routineAssignmentId}-${exerciseId}`;

    // Update the completion state immediately for real-time UI updates
    setCompletedProgramDrills(prev => {
      const newSet = new Set(prev);
      if (completed) {
        newSet.add(routineExerciseKey);
      } else {
        newSet.delete(routineExerciseKey);
      }
      return newSet;
    });

    // Call the backend mutation for routine exercise completion
    try {
      await markRoutineExerciseCompleteMutation.mutateAsync({
        exerciseId,
        routineAssignmentId,
        completed,
      });

      // Refresh calendar data to sync with server - with delay
      setTimeout(async () => {
        await refetchCalendar();
      }, 1000);
    } catch (error) {
      // Revert optimistic update on error
      setCompletedProgramDrills(prev => {
        const newSet = new Set(prev);
        if (completed) {
          newSet.delete(routineExerciseKey); // Remove if we were trying to mark complete
        } else {
          newSet.add(routineExerciseKey); // Add if we were trying to mark incomplete
        }
        return newSet;
      });
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

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
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

          {/* Quick Stats Summary */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/30">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-blue-300">This Week</p>
                  <p className="text-lg font-bold text-white">
                    {(() => {
                      const weekStart = startOfWeek(new Date(), {
                        weekStartsOn: 1,
                      });
                      const weekEnd = addDays(weekStart, 6);
                      // Handle both array and object formats for calendarData
                      const calendarArray = Array.isArray(calendarData)
                        ? calendarData
                        : calendarData
                        ? Object.values(calendarData as Record<string, DayData>)
                        : [];

                      const weekDrills = calendarArray.filter(
                        (day: DayData) => {
                          const dayDate = new Date(day.date);
                          return dayDate >= weekStart && dayDate <= weekEnd;
                        }
                      );
                      const weekCompleted = weekDrills.reduce(
                        (sum: number, day: DayData) =>
                          sum + day.completedDrills,
                        0
                      );
                      const weekTotal = weekDrills.reduce(
                        (sum: number, day: DayData) => sum + day.totalDrills,
                        0
                      );
                      return `${weekCompleted}/${weekTotal}`;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/30">
                  <Target className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-green-300">Completion</p>
                  <p className="text-lg font-bold text-white">
                    {(() => {
                      // Handle both array and object formats for calendarData
                      const calendarArray = Array.isArray(calendarData)
                        ? calendarData
                        : calendarData
                        ? Object.values(calendarData as Record<string, DayData>)
                        : [];

                      const totalDrills = calendarArray.reduce(
                        (sum: number, day: DayData) => sum + day.totalDrills,
                        0
                      );
                      const completedDrills = calendarArray.reduce(
                        (sum: number, day: DayData) =>
                          sum + day.completedDrills,
                        0
                      );
                      return totalDrills > 0
                        ? Math.round((completedDrills / totalDrills) * 100)
                        : 0;
                    })()}
                    %
                  </p>
                </div>
              </div>
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
              const hasWorkout =
                dayData && !dayData.isRestDay && dayData.totalDrills > 0;
              const isCompleted =
                dayData &&
                dayData.completedDrills === dayData.totalDrills &&
                dayData.totalDrills > 0;
              const isPartial =
                dayData &&
                dayData.completedDrills > 0 &&
                dayData.completedDrills < dayData.totalDrills;

              // Get program indicators for this day
              const programIndicators =
                dayData?.programs?.map(
                  (program: ProgramData, index: number) => {
                    const remaining =
                      program.totalDrills - program.completedDrills;
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
          onClose={() => setIsDayModalOpen(false)}
          selectedDay={updateDrillCompletionStatus(selectedDay)}
          selectedDate={selectedDate}
          programs={updateDrillCompletionStatus(selectedDay)?.programs || []}
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
          completedProgramDrills={completedProgramDrills}
          calculateDayCompletionCounts={(dayData, selectedDate) => {
            if (!dayData) return { totalDrills: 0, completedDrills: 0 };
            return {
              totalDrills: dayData.totalDrills,
              completedDrills: dayData.completedDrills,
            };
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

      {/* Bottom Navigation */}
      <MobileClientBottomNavigation />
    </div>
  );
}
