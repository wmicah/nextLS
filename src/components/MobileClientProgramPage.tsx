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
  Paperclip,
  ArrowRight,
  Image,
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
import {
  formatTimeInUserTimezone,
  getUserTimezone,
} from "@/lib/timezone-utils";
import { processVideoUrl } from "@/lib/youtube-utils";
import { toZonedTime } from "date-fns-tz";
import MobileClientNavigation from "./MobileClientNavigation";
import MobileClientBottomNavigation from "./MobileClientBottomNavigation";
import ClientProgramDayModal from "./ClientProgramDayModal";
import ClientVideoSubmissionModal from "./ClientVideoSubmissionModal";
import { useExerciseCompletion } from "@/hooks/useExerciseCompletion";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";

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

  // Get current week's calendar data (for better accuracy in current week)
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

  const { data: weekCalendarData } =
    trpc.clientRouter.getProgramWeekCalendar.useQuery({
      startDate: startDateString,
      endDate: endDateString,
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

  // Get upcoming lessons/events for client
  const {
    data: upcomingEvents = [],
    isLoading: eventsLoading,
    error: eventsError,
  } = trpc.events.getUpcoming.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Get next lesson
  const { data: nextLesson, error: nextLessonError } =
    trpc.clientRouter.getNextLesson.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    });

  // Get pitching data
  const { data: pitchingData } = trpc.clientRouter.getPitchingData.useQuery();

  // Get library items for video lookup
  const { data: libraryItems = [] } = (trpc.library.list as any).useQuery({});

  // Get client's lessons
  const { data: clientLessons = [] } =
    trpc.clientRouter.getClientLessons.useQuery({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
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

  // Get lessons for a specific date (with timezone handling, like desktop)
  const getLessonsForDate = (date: Date) => {
    const now = new Date();
    const timeZone = getUserTimezone();
    const lessons = clientLessons.filter((lesson: { date: string }) => {
      // Convert UTC lesson date to user's timezone for proper date comparison
      const lessonDateInUserTz = toZonedTime(lesson.date, timeZone);

      // Compare only the date part, not the time
      const lessonDateOnly = new Date(
        lessonDateInUserTz.getFullYear(),
        lessonDateInUserTz.getMonth(),
        lessonDateInUserTz.getDate()
      );
      const targetDateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const isSame = lessonDateOnly.getTime() === targetDateOnly.getTime();
      const isFuture = lessonDateInUserTz > now;
      return isSame && isFuture;
    });
    return lessons;
  };

  // Get day data from calendar data (prefer week data for current week, like desktop)
  const getDayData = (date: Date): DayData | null => {
    // Use local date format to avoid timezone conversion issues
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

    // Prefer week data for current week; fall back to month data
    return (
      (weekCalendarData && (weekCalendarData as any)[dateString]) ||
      (calendarData && (calendarData as any)[dateString]) ||
      null
    );
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
        return isMatch;
      }
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
    try {
      // Use the new completion system
      const dateKey = selectedDate
        ? selectedDate.toISOString().split("T")[0]
        : undefined;
      await markExerciseComplete(drillId, undefined, completed, dateKey);
    } catch (error) {
      // Error handling - silently fail or show user-friendly message
    }
  };

  // Handle routine exercise completion - using new system
  const handleMarkRoutineExerciseComplete = async (
    exerciseId: string,
    routineAssignmentId: string,
    completed: boolean
  ) => {
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
    } catch (error) {
      // Error handling - silently fail or show user-friendly message
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
      // Error handling - silently fail or show user-friendly message
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
      // Error handling - silently fail or show user-friendly message
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
    <div className="min-h-[100dvh]" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile Header */}
      <div 
        className="sticky top-0 z-50 bg-gradient-to-r from-[#2A3133] to-[#353A3A] border-b border-[#4A5A70] px-4 pb-4 shadow-lg"
        style={{ paddingTop: `calc(1rem + env(safe-area-inset-top))` }}
      >
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
        <PushNotificationPrompt />
        {/* Upcoming Lessons Card - PROMINENT DISPLAY */}
        <div
          className="rounded-xl p-4 shadow-lg border"
          style={{ backgroundColor: "#353A3A", borderColor: "#4A5A70" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{ color: "#4A5A70" }} />
              <h2 className="text-base font-bold" style={{ color: "#C3BCC2" }}>
                Upcoming Lessons
              </h2>
            </div>
            {upcomingEvents.length > 2 && (
              <a
                href="/client-schedule"
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all active:scale-95"
                style={{
                  color: "#C3BCC2",
                  backgroundColor: "#4A5A70",
                }}
              >
                View All
              </a>
            )}
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 2).map((event: any, index: number) => {
                const eventDate = new Date(event.date);
                const isToday = isSameDay(eventDate, new Date());
                const isTomorrow =
                  Math.ceil(
                    (eventDate.getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) === 1;
                const coachName =
                  typeof event.coach?.name === "string"
                    ? event.coach.name.trim()
                    : "";
                const trimmedTitle =
                  typeof event.title === "string" ? event.title.trim() : "";
                const heading = coachName
                  ? `Lesson with ${coachName}`
                  : trimmedTitle.length > 0
                  ? trimmedTitle
                  : "Scheduled Lesson";

                return (
                  <div
                    key={event.id}
                    className={`rounded-lg p-4 border shadow-lg ${
                      index === 0
                        ? "bg-gradient-to-br from-[#4A5A70] to-[#606364]"
                        : ""
                    }`}
                    style={
                      index === 0
                        ? { borderColor: "#4A5A70" }
                        : {
                            backgroundColor: "#2A3133",
                            borderColor: "#606364",
                          }
                    }
                  >
                    {/* Date Badge */}
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isToday ? "animate-pulse" : ""
                        }`}
                        style={{
                          backgroundColor: isToday
                            ? "#10b981"
                            : index === 0
                            ? "#353A3A"
                            : "#4A5A70",
                          color: "#FFFFFF",
                        }}
                      >
                        {isToday
                          ? "TODAY"
                          : isTomorrow
                          ? "TOMORROW"
                          : eventDate.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                      </div>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                        style={{
                          backgroundColor: index === 0 ? "#353A3A" : "#4A5A70",
                        }}
                      >
                        <Clock
                          className="h-3.5 w-3.5"
                          style={{ color: "#C3BCC2" }}
                        />
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "#C3BCC2" }}
                        >
                          {eventDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Lesson Info */}
                    <div className="space-y-1">
                      <h3
                        className="text-sm font-bold"
                        style={{ color: index === 0 ? "#FFFFFF" : "#C3BCC2" }}
                      >
                        {heading}
                      </h3>
                      {event.description && (
                        <p
                          className="text-xs line-clamp-2"
                          style={{ color: index === 0 ? "#D0D0D0" : "#ABA4AA" }}
                        >
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* View More Button */}
              {upcomingEvents.length > 2 && (
                <div className="text-center pt-2">
                  <a
                    href="/client-schedule"
                    className="text-xs px-4 py-2 rounded-lg inline-flex items-center gap-2 active:scale-95 transition-transform font-medium"
                    style={{
                      backgroundColor: "#4A5A70",
                      color: "#C3BCC2",
                    }}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    View {upcomingEvents.length - 2} More Lesson
                    {upcomingEvents.length - 2 === 1 ? "" : "s"}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: "#606364" }}
              />
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "#C3BCC2" }}
              >
                No Upcoming Lessons
              </h3>
              <p className="text-sm px-4 mb-4" style={{ color: "#ABA4AA" }}>
                Your coach will schedule lessons with you soon.
              </p>
              <a
                href="/client-schedule"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
                style={{
                  backgroundColor: "#4A5A70",
                  color: "#C3BCC2",
                }}
              >
                <Calendar className="h-4 w-4" />
                View Schedule
              </a>
            </div>
          )}
        </div>
        {/* Calendar View */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#1F2426] to-[#2A3133] border border-[#4A5A70] shadow-xl">
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
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-[#1E1B4B] border border-[#312E81]">
                  <FileText className="h-5 w-5 text-[#818CF8]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#E2E8F0]">
                    Coach Notes
                  </p>
                </div>
              </div>

              {coachNotes && coachNotes.length > 0 ? (
                <div className="space-y-2">
                  <div className="rounded-lg p-3 border border-[#1E293B] bg-[#0F172A]">
                    <p className="text-sm text-[#E2E8F0] leading-relaxed line-clamp-2 mb-2">
                      {(() => {
                        const mostRecentNote = coachNotes[0];
                        const content = mostRecentNote?.content || "";
                        return content.length > 60
                          ? `${content.substring(0, 60)}...`
                          : content;
                      })()}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#94A3B8]">
                        {new Date(
                          coachNotes[0]?.updatedAt ||
                            coachNotes[0]?.createdAt ||
                            new Date()
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <button
                        onClick={() => setIsCoachNotesModalOpen(true)}
                        className="text-xs font-medium text-[#6366F1] hover:text-[#818CF8] transition-colors flex items-center gap-1"
                      >
                        View
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0F172A] border border-[#1E293B]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#475569]" />
                  <p className="text-sm text-[#94A3B8]">No feedback yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
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
          <div className="grid grid-cols-7 gap-2">
            {getCalendarDays().map(day => {
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayData = getDayData(day);
              const lessonsForDay = getLessonsForDate(day);
              // Calculate completion counts using the same logic as desktop
              const completionCounts = calculateDayCompletionCounts(
                dayData,
                day
              );

              // Check if there are routines for this day
              const routinesForDay = getRoutinesForDate(day);
              const hasRoutines = routinesForDay.length > 0;

              // Check if there are video assignments for this day
              const hasVideoAssignments =
                dayData?.videoAssignments &&
                dayData.videoAssignments.length > 0;

              // Also check for direct drills in dayData (backward compatibility)
              const hasDirectDrills =
                dayData?.drills && dayData.drills.length > 0;

              // Check if there are programs with actual drills (not just rest days)
              const hasActivePrograms =
                dayData?.programs &&
                dayData.programs.some(
                  (program: ProgramData) =>
                    !program.isRestDay &&
                    ((program.drills && program.drills.length > 0) ||
                      (program.totalDrills && program.totalDrills > 0))
                );

              // Only show indicators if there's actual work to do (exclude rest days)
              // Rest days should not show any indicators
              const hasWorkToDo =
                !dayData?.isRestDay &&
                (completionCounts.totalDrills > 0 ||
                  hasRoutines ||
                  hasVideoAssignments ||
                  hasDirectDrills ||
                  hasActivePrograms);

              const hasWorkout =
                dayData &&
                !dayData.isRestDay &&
                completionCounts.totalDrills > 0;
              const isCompleted =
                completionCounts.totalDrills > 0 &&
                completionCounts.completedDrills ===
                  completionCounts.totalDrills;
              const isPartial =
                completionCounts.totalDrills > 0 &&
                completionCounts.completedDrills > 0 &&
                completionCounts.completedDrills < completionCounts.totalDrills;

              // Get program indicators for this day (excluding rest days)
              const programIndicators =
                dayData?.programs
                  ?.filter((program: ProgramData) => !program.isRestDay) // Only show non-rest day programs
                  ?.filter((program: ProgramData) => {
                    // Only include programs that have actual drills
                    return (
                      (program.drills && program.drills.length > 0) ||
                      (program.totalDrills && program.totalDrills > 0)
                    );
                  })
                  ?.map((program: ProgramData, index: number) => {
                    // Use the completion counts from the hook for accurate counts
                    const remaining =
                      completionCounts.totalDrills -
                      completionCounts.completedDrills;

                    return {
                      id: program.programId,
                      title: program.programTitle,
                      remaining,
                      isRestDay: false, // We've already filtered these out
                      color:
                        index === 0
                          ? "blue"
                          : index === 1
                          ? "green"
                          : index === 2
                          ? "purple"
                          : "orange",
                    };
                  }) || [];

              // Get routine indicators for this day
              const routineIndicators = routinesForDay.map(
                (assignment: any, index: number) => ({
                  id: `routine-${assignment.id}`,
                  title: assignment.routine?.name || "Routine",
                  remaining: assignment.routine?.exercises?.length || 0,
                  isRestDay: false,
                  color: "green", // Green for standalone routines
                  type: "routine",
                })
              );

              // Combine all indicators (programs and routines)
              const allIndicators = [
                ...programIndicators,
                ...routineIndicators,
              ];

              // Only show workout indicator if there's actual work (no rest days)
              const shouldShowWorkoutIndicator = hasWorkToDo;

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
                          ? shouldShowWorkoutIndicator ||
                            lessonsForDay.length > 0
                            ? "text-white bg-gradient-to-br from-[#4A5A70] to-[#606364] border-[#4A5A70] hover:from-[#606364] hover:to-[#4A5A70]"
                            : "text-[#ABA4AA] bg-gradient-to-br from-[#353A3A] to-[#40454A] border-[#606364] hover:from-[#4A5A70] hover:to-[#606364]"
                          : "text-gray-600 bg-gradient-to-br from-gray-900/30 to-gray-800/20 border-gray-700"
                      }
                    `}
                >
                  <div className="font-bold text-xs leading-none">
                    {format(day, "d")}
                  </div>

                  {/* Workout/Exercise Indicators */}
                  <div className="flex flex-col items-center gap-0.5 mt-0.5 w-full min-h-[16px]">
                    {/* Show workout indicator if there's work to do */}
                    {shouldShowWorkoutIndicator && (
                      <div className="flex justify-center items-center gap-0.5 flex-wrap">
                        {allIndicators.length > 0 ? (
                          <>
                            {allIndicators
                              .slice(0, 2)
                              .map((indicator: any, idx: number) => (
                                <div
                                  key={
                                    indicator.id || `${indicator.title}-${idx}`
                                  }
                                  className={`w-2.5 h-2.5 rounded-full flex items-center justify-center text-[7px] font-bold shadow-sm border transition-all duration-200 ${
                                    isCompleted
                                      ? "bg-green-500 text-white border-green-400 shadow-lg shadow-green-500/50"
                                      : isPartial
                                      ? "bg-yellow-500 text-white border-yellow-400"
                                      : indicator.color === "blue"
                                      ? "bg-blue-500 text-white border-blue-400"
                                      : indicator.color === "green"
                                      ? "bg-green-500 text-white border-green-400"
                                      : indicator.color === "purple"
                                      ? "bg-purple-500 text-white border-purple-400"
                                      : "bg-sky-500 text-white border-sky-400"
                                  }`}
                                  title={`${indicator.title}: ${completionCounts.completedDrills}/${completionCounts.totalDrills} exercises`}
                                >
                                  {isCompleted
                                    ? "✓"
                                    : completionCounts.totalDrills > 0
                                    ? completionCounts.totalDrills
                                    : indicator.remaining || ""}
                                </div>
                              ))}
                            {allIndicators.length > 2 && (
                              <div className="w-2.5 h-2.5 rounded-full bg-gray-500 text-white border border-gray-400 flex items-center justify-center text-[7px] font-bold">
                                +
                              </div>
                            )}
                          </>
                        ) : (
                          // Fallback: Show generic workout indicator if we have drills but no program/routine data
                          <div
                            className={`w-2.5 h-2.5 rounded-full flex items-center justify-center text-[7px] font-bold shadow-sm border transition-all duration-200 ${
                              isCompleted
                                ? "bg-green-500 text-white border-green-400 shadow-lg shadow-green-500/50"
                                : isPartial
                                ? "bg-yellow-500 text-white border-yellow-400"
                                : "bg-sky-500 text-white border-sky-400"
                            }`}
                            title={`${completionCounts.completedDrills}/${completionCounts.totalDrills} exercises`}
                          >
                            {isCompleted
                              ? "✓"
                              : completionCounts.totalDrills > 0
                              ? completionCounts.totalDrills
                              : "•"}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show lesson indicator if there are lessons on this day */}
                    {lessonsForDay.length > 0 && (
                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                        <Clock className="h-2.5 w-2.5 text-blue-400 flex-shrink-0" />
                        {lessonsForDay.length > 1 && (
                          <span className="text-[8px] font-bold text-blue-400">
                            {lessonsForDay.length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
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
          lessonsForDate={selectedDate ? getLessonsForDate(selectedDate) : []}
          onMarkDrillComplete={handleMarkDrillComplete}
          onMarkVideoAssignmentComplete={handleMarkVideoAssignmentComplete}
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
            if (!dayData && !selectedDate)
              return { totalAssignments: 0, completedAssignments: 0 };

            let totalAssignments = 0;
            let completedAssignments = 0;

            // Count program assignments (excluding rest days)
            if (dayData && "programs" in dayData && dayData.programs) {
              (dayData as any).programs.forEach((program: ProgramData) => {
                if (!program.isRestDay) {
                  totalAssignments++;
                  // Check if all drills in this program are completed using new system
                  if (program.drills) {
                    const dateKey = selectedDate
                      ? selectedDate.toISOString().split("T")[0]
                      : undefined;
                    const allDrillsCompleted = program.drills.every(
                      (drill: Drill) => {
                        if (drill.id.includes("-routine-")) {
                          // This is a routine exercise within a program
                          const exerciseId = drill.id.split("-routine-")[1];
                          const programDrillId = drill.id.split("-routine-")[0];
                          return isExerciseCompleted(
                            exerciseId,
                            programDrillId,
                            dateKey
                          );
                        } else {
                          // This is a regular drill
                          return isExerciseCompleted(
                            drill.id,
                            undefined,
                            dateKey
                          );
                        }
                      }
                    );
                    if (allDrillsCompleted) {
                      completedAssignments++;
                    }
                  } else {
                    // If we only have lightweight data, use pre-calculated completion status
                    const totalDrills = program.totalDrills || 0;
                    const completedDrills = program.completedDrills || 0;
                    if (totalDrills > 0 && completedDrills === totalDrills) {
                      completedAssignments++;
                    }
                  }
                }
              });
            }

            // Count routine assignments for the selected date
            if (selectedDate) {
              const routinesForDate = getRoutinesForDate(selectedDate);
              routinesForDate.forEach((routineAssignment: any) => {
                if (routineAssignment.routine?.exercises) {
                  totalAssignments++;
                  // Check if all exercises in this routine are completed using new system
                  const dateKey = selectedDate
                    ? selectedDate.toISOString().split("T")[0]
                    : undefined;
                  const allExercisesCompleted =
                    routineAssignment.routine.exercises.every(
                      (exercise: any) => {
                        return isExerciseCompleted(
                          exercise.id,
                          routineAssignment.id,
                          dateKey
                        );
                      }
                    );
                  if (allExercisesCompleted) {
                    completedAssignments++;
                  }
                }
              });
            }

            return { totalAssignments, completedAssignments };
          }}
          onMarkRoutineExerciseComplete={handleMarkRoutineExerciseComplete}
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
                  onError={() => {
                    // Video load error - handle silently
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

      {/* Coach Notes Modal - Compact Design */}
      {isCoachNotesModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setIsCoachNotesModalOpen(false)}
        >
          <div
            className="bg-[#0F172A] rounded-xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-[#1E293B] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Compact Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B] bg-[#1E1B4B]">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#818CF8]" />
                <h3 className="text-base font-semibold text-[#E2E8F0]">
                  Coach Notes
                </h3>
                <span className="text-xs text-[#94A3B8]">
                  ({coachNotes?.length || 0})
                </span>
              </div>
              <button
                onClick={() => setIsCoachNotesModalOpen(false)}
                className="p-1.5 rounded hover:bg-[#312E81] text-[#94A3B8] hover:text-[#E2E8F0] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Compact Notes List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="divide-y divide-[#1E293B]">
                {coachNotes && coachNotes.length > 0 ? (
                  coachNotes.map((note, index) => (
                    <div
                      key={note.id}
                      className="p-4 hover:bg-[#1E293B]/50 transition-colors"
                    >
                      {/* Compact Date */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-[#818CF8]">
                          {new Date(note.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                        <span className="text-xs text-[#64748B]">
                          {new Date(note.createdAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>

                      {/* Compact Content */}
                      <p className="text-sm text-[#E2E8F0] leading-relaxed whitespace-pre-wrap mb-3">
                        {note.content}
                      </p>

                      {/* Compact Attachments */}
                      {note.attachments && note.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#1E293B]">
                          <div className="flex items-center gap-2 mb-2">
                            <Paperclip className="w-3 h-3 text-[#818CF8]" />
                            <span className="text-xs font-medium text-[#818CF8]">
                              {note.attachments.length} attachment
                              {note.attachments.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {note.attachments.map(attachment => (
                              <a
                                key={attachment.id}
                                href={attachment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#1E293B] border border-[#334155] hover:bg-[#312E81] hover:border-[#6366F1] transition-colors group"
                              >
                                {attachment.fileType.startsWith("image/") ? (
                                  <Image className="w-3.5 h-3.5 text-[#818CF8]" />
                                ) : attachment.fileType.startsWith("video/") ? (
                                  <Video className="w-3.5 h-3.5 text-[#818CF8]" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-[#818CF8]" />
                                )}
                                <span className="text-xs text-[#E2E8F0] truncate max-w-[120px]">
                                  {attachment.fileName}
                                </span>
                                <span className="text-xs text-[#64748B]">
                                  (
                                  {(attachment.fileSize / 1024 / 1024).toFixed(
                                    1
                                  )}
                                  MB)
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 px-4">
                    <FileText className="h-8 w-8 mx-auto mb-3 text-[#475569]" />
                    <p className="text-sm text-[#94A3B8]">
                      No notes from your coach yet
                    </p>
                  </div>
                )}
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
