"use client";

import React, { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { extractNoteContent, hasNoteContent } from "@/lib/note-utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Play,
  MessageSquare,
  Upload,
  Calendar as CalendarIcon,
  CalendarDays,
  Target,
  User,
  Send,
  X,
  Video,
  TrendingUp,
  BarChart3,
  Loader2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Dumbbell,
  Zap,
  Star,
  CheckCircle2,
  Award,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Link,
  FileText,
  Image,
  Paperclip,
} from "lucide-react";
import ClientVideoSubmissionModal from "./ClientVideoSubmissionModal";
import ClientProgramDayModal from "./ClientProgramDayModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import {
// 	Sheet,
// 	SheetContent,
// 	SheetHeader,
// 	SheetTitle,
// 	SheetTrigger,
// } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea";
// import { Progress } from "@/components/ui/progress"
// import { Separator } from "@/components/ui/separator"
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
  // isPast,
  // isFuture,
} from "date-fns";
import {
  formatTimeInUserTimezone,
  getUserTimezone,
} from "@/lib/timezone-utils";
import { toZonedTime } from "date-fns-tz";
import ClientTopNav from "@/components/ClientTopNav";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileClientProgramPage from "./MobileClientProgramPage";
import { processVideoUrl } from "@/lib/youtube-utils";
import { useExerciseCompletion } from "@/hooks/useExerciseCompletion";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import { COLORS, getGoldenAccent, getRedAlert, getGreenPrimary } from "@/lib/colors";

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
  // Coach Instructions
  coachInstructions?: {
    whatToDo: string;
    howToDoIt: string;
    keyPoints: string[];
    commonMistakes: string[];
    equipment?: string;
  };
  // Backend properties
  routineId?: string;
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

// interface ProgramInfo {
// 	id: string
// 	title: string
// 	description?: string
// 	startDate: string
// 	endDate: string
// 	currentWeek: number
// 	totalWeeks: number
// 	overallProgress: number
// 	coachName: string
// }

// interface WeeklyStats {
// 	totalWorkouts: number
// 	completedWorkouts: number
// 	totalDrills: number
// 	completedDrills: number
// 	weeklyProgress: number
// 	streak: number
// }

function ClientProgramPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  // Use the new completion system
  const { isExerciseCompleted, markExerciseComplete } = useExerciseCompletion();

  const [completedVideoAssignments, setCompletedVideoAssignments] = useState<
    Set<string>
  >(new Set());

  // Initialize video assignment completion state
  React.useEffect(() => {
    if (selectedDay?.videoAssignments) {
      const serverCompletedVideoAssignments = new Set<string>();

      selectedDay.videoAssignments.forEach(assignment => {
        if (assignment.completed) {
          serverCompletedVideoAssignments.add(assignment.id);
        }
      });
      setCompletedVideoAssignments(serverCompletedVideoAssignments);
    } else {
      // Clear video assignment completion state if no assignments
      setCompletedVideoAssignments(new Set());
    }
  }, [selectedDay]);

  // Update drill completion status based on the new completion system
  const updateDrillCompletionStatus = (dayData: DayData | null) => {
    if (!dayData?.programs) return dayData;

    const updatedDayData = {
      ...dayData,
      programs: dayData.programs.map(program => ({
        ...program,
        drills: program.drills
          ? program.drills.map(drill => {
              // Use the new completion system to check if drill is completed
              let isCompleted;
              const dateKey = dayData.date
                ? dayData.date // Already in YYYY-MM-DD format
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
            })
          : [], // Return empty array if drills is undefined
      })),
    };

    return updatedDayData;
  };

  const [noteToCoach, setNoteToCoach] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isVideoSubmissionModalOpen, setIsVideoSubmissionModalOpen] =
    useState(false);
  const [selectedDrillForVideo, setSelectedDrillForVideo] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isCoachNotesExpanded, setIsCoachNotesExpanded] = useState(false);
  const [isCoachNotesModalOpen, setIsCoachNotesModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    id: string;
    title: string;
    url: string;
    isYoutube?: boolean;
    youtubeId?: string;
    type?: string;
  } | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [selectedDrillForComment, setSelectedDrillForComment] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "progress">(
    "calendar"
  );

  // Get client's assigned program
  const { data: programInfo } = trpc.clientRouter.getAssignedProgram.useQuery();

  // Use lightweight calendar query for initial load
  const {
    data: calendarData,
    error: calendarError,
    isLoading: calendarLoading,
    refetch: refetchCalendar,
  } = trpc.clientRouter.getProgramCalendarLight.useQuery({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    viewMode,
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
      setIsDaySheetOpen(true);
    }
  }, [selectedDateForDetails, selectedDayDetails, dayDetailsLoading]);

  // Get current week's calendar data (for "This Week's Schedule" section)
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

  // Get pitching data
  const { data: pitchingData } = trpc.clientRouter.getPitchingData.useQuery();

  // Get video assignments
  const { data: videoAssignments = [] } =
    trpc.clientRouter.getVideoAssignments.useQuery();

  // Get next lesson
  const { data: nextLesson } = trpc.clientRouter.getNextLesson.useQuery();

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

  // Get coach notes
  const { data: coachNotes } = trpc.notes.getMyNotes.useQuery();

  // Get routine assignments
  const { data: routineAssignments = [] } =
    trpc.clientRouter.getRoutineAssignments.useQuery();

  // Debug logging for routine assignments

  // Get client's lessons
  const { data: clientLessons = [] } =
    trpc.clientRouter.getClientLessons.useQuery({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
    });

  // Get library items for video lookup
  const { data: libraryItems = [] } = (trpc.library.list as any).useQuery({});

  const utils = trpc.useUtils();

  // Add comment to drill mutation (handles both video comments and messages)
  const addCommentToDrillMutation =
    trpc.clientRouter.addCommentToDrill.useMutation();

  // Mutations

  const markVideoAssignmentCompleteMutation =
    trpc.clientRouter.markVideoAssignmentComplete.useMutation({
      onError: error => {
        alert(`Error updating video assignment: ${error.message}`);
      },
    });

  const sendNoteToCoachMutation = trpc.clientRouter.sendNoteToCoach.useMutation(
    {
      onSuccess: () => {
        setNoteToCoach("");
        setIsSubmittingNote(false);
      },
    }
  );

  // Calendar navigation
  // const goToPreviousMonth = () => {
  // 	setCurrentDate((prev) => {
  // 		const newDate = new Date(prev)
  // 		newDate.setMonth(prev.getMonth() - 1)
  // 		return newDate
  // 	})
  // }

  // const goToNextMonth = () => {
  // 	setCurrentDate((prev) => {
  // 		const newDate = new Date(prev)
  // 		newDate.setMonth(prev.getMonth() + 1)
  // 		return newDate
  // 	})
  // }

  // const goToToday = () => {
  // 	setCurrentDate(new Date())
  // }

  // Generate calendar days for the current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(
      direction === "prev"
        ? subMonths(currentDate, 1)
        : addMonths(currentDate, 1)
    );
  };

  // Enhanced touch interactions for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      navigateMonth("next");
    }
    if (isRightSwipe) {
      navigateMonth("prev");
    }
  };

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

  // Get routine assignments for a specific date
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

    return filteredRoutines as any[];
  };

  // Get day data from calendar data
  const getDayData = (date: Date): DayData | null => {
    if (!calendarData) return null;
    // Use local date format to avoid timezone conversion issues
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    return calendarData[dateString] || null;
  };

  // Get day data from week calendar data (for current week)
  const getWeekDayData = (date: Date): DayData | null => {
    // Use local date format to avoid timezone conversion issues
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    // Prefer week data; fall back to month data if week missing
    return (
      (weekCalendarData && (weekCalendarData as any)[dateString]) ||
      (calendarData && (calendarData as any)[dateString]) ||
      null
    );
  };

  // Calculate total completion counts for the selected day
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
                ? `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}-${selectedDate
                    .getDate()
                    .toString()
                    .padStart(2, "0")}`
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
                ? `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}-${selectedDate
                    .getDate()
                    .toString()
                    .padStart(2, "0")}`
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

  // Calculate assignment-level completion counts for the day header
  const calculateDayAssignmentCounts = (
    dayData: DayData | null,
    selectedDate: Date | null
  ) => {
    if (!dayData && !selectedDate)
      return { totalAssignments: 0, completedAssignments: 0 };

    let totalAssignments = 0;
    let completedAssignments = 0;

    // Count program assignments (excluding rest days)
    if (dayData?.programs) {
      dayData.programs.forEach(program => {
        if (!program.isRestDay) {
          totalAssignments++;
          // Check if all drills in this program are completed using new system
          if (program.drills) {
            const dateKey = selectedDate
              ? `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1)
                  .toString()
                  .padStart(2, "0")}-${selectedDate
                  .getDate()
                  .toString()
                  .padStart(2, "0")}`
              : undefined;
            const allDrillsCompleted = program.drills.every(drill => {
              if (drill.id.includes("-routine-")) {
                // This is a routine exercise within a program
                const exerciseId = drill.id.split("-routine-")[1];
                const programDrillId = drill.id.split("-routine-")[0];
                return isExerciseCompleted(exerciseId, programDrillId, dateKey);
              } else {
                // This is a regular drill
                return isExerciseCompleted(drill.id, undefined, dateKey);
              }
            });
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
      routinesForDate.forEach(routineAssignment => {
        if ((routineAssignment as any).routine?.exercises) {
          totalAssignments++;
          // Check if all exercises in this routine are completed using new system
          const dateKey = selectedDate
            ? `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${selectedDate
                .getDate()
                .toString()
                .padStart(2, "0")}`
            : undefined;
          const allExercisesCompleted = (
            routineAssignment as any
          ).routine.exercises.every((exercise: any) => {
            return isExerciseCompleted(
              exercise.id,
              (routineAssignment as any).id,
              dateKey
            );
          });
          if (allExercisesCompleted) {
            completedAssignments++;
          }
        }
      });
    }

    return { totalAssignments, completedAssignments };
  };

  // Handle routine exercise completion - using new system
  const handleMarkRoutineExerciseComplete = async (
    exerciseId: string,
    programDrillId: string, // This is actually the program drill ID, not routine assignment ID
    completed: boolean
  ) => {
    try {
      // Use the new completion system
      const dateKey = selectedDate
        ? `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${selectedDate
            .getDate()
            .toString()
            .padStart(2, "0")}`
        : undefined;
      await markExerciseComplete(
        exerciseId,
        programDrillId,
        completed,
        dateKey
      );
    } catch (error) {
      // Error handling - silently fail or show user-friendly message
    }
  };

  // Handle video assignment completion
  const handleMarkVideoAssignmentComplete = async (
    assignmentId: string,
    completed: boolean
  ) => {
    // Update the completion state immediately for real-time UI updates
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

      // Refetch calendar data to sync with server
      await refetchCalendar();
    } catch (error) {
      // Revert optimistic update on error
      setCompletedVideoAssignments(prev => {
        const newSet = new Set(prev);
        if (completed) {
          newSet.delete(assignmentId); // Remove if we were trying to mark complete
        } else {
          newSet.add(assignmentId); // Add back if we were trying to mark incomplete
        }
        return newSet;
      });
    }
  };

  // Handle drill completion - using new system
  const handleMarkDrillComplete = async (
    drillId: string,
    completed: boolean,
    programAssignmentId?: string
  ) => {
    try {
      // Use the new completion system
      const dateKey = selectedDate
        ? `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${selectedDate
            .getDate()
            .toString()
            .padStart(2, "0")}`
        : undefined;
      await markExerciseComplete(drillId, undefined, completed, dateKey);
    } catch (error) {
      alert(
        `Failed to update drill completion: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Handle marking all drills complete
  const handleMarkAllComplete = async () => {
    if (!selectedDay) return;

    if (confirm("Mark all drills for this day as complete?")) {
      // Update selectedDay state immediately
      const updatedDrills = selectedDay.drills.map(drill => ({
        ...drill,
        completed: true,
      }));

      setSelectedDay({
        ...selectedDay,
        drills: updatedDrills,
        completedDrills: updatedDrills.length,
      });

      // TODO: Update this function to work with the new multi-program structure
      // For now, just update the UI state
    }
  };

  // Handle sending note to coach
  const handleSendNote = async () => {
    if (!noteToCoach.trim() || !selectedDay) return;

    setIsSubmittingNote(true);
    await sendNoteToCoachMutation.mutateAsync({
      date: selectedDay.date,
      note: noteToCoach,
    });
  };

  // Handle video submission
  const handleSubmitVideo = (drillId: string, drillTitle: string) => {
    setSelectedDrillForVideo({ id: drillId, title: drillTitle });
    setIsVideoSubmissionModalOpen(true);
  };

  // Handle opening video player - simplified to match mobile version
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

  // Handle closing video player
  const handleCloseVideo = () => {
    setIsVideoPlayerOpen(false);
    setSelectedVideo(null);
  };

  // Handle opening comment modal
  const handleOpenCommentModal = (drill: { id: string; title: string }) => {
    setSelectedDrillForComment(drill);
    setIsCommentModalOpen(true);
  };

  // Handle closing comment modal
  const handleCloseCommentModal = () => {
    setIsCommentModalOpen(false);
    setSelectedDrillForComment(null);
    setCommentText("");
  };

  // Handle submitting comment
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !selectedDrillForComment) return;

    setIsSubmittingComment(true);
    try {
      // Use the new mutation that handles both video comments and messages
      const result = await addCommentToDrillMutation.mutateAsync({
        drillId: selectedDrillForComment.id,
        comment: commentText,
      });
    } catch (error) {
      // Error handling - silently fail or show user-friendly message
    } finally {
      setIsSubmittingComment(false);
      handleCloseCommentModal();
    }
  };

  // Get status for a day
  const getDayStatus = (
    dayData: DayData | null,
    date?: Date,
    completionCounts?: { completedDrills: number; totalDrills: number }
  ) => {
    if (!dayData) return null;

    // Calculate completion counts if not provided
    const counts =
      completionCounts || calculateDayCompletionCounts(dayData, date || null);

    // Check if there are active workouts or routines that should override rest days
    if (dayData.isRestDay) {
      const hasWorkouts =
        dayData.programs?.some(program => !program.isRestDay) || false;
      const hasRoutines = date ? getRoutinesForDate(date).length > 0 : false;
      const hasVideoAssignments =
        dayData.videoAssignments && dayData.videoAssignments.length > 0;
      const hasActiveContent =
        hasWorkouts || hasRoutines || hasVideoAssignments;

      // If there's active content, don't show rest day status
      if (hasActiveContent) {
        // Return workout status instead
        if (counts.completedDrills === counts.totalDrills)
          return { type: "complete", label: "Complete", icon: "✅" };
        if (counts.completedDrills > 0)
          return { type: "partial", label: "Partial", icon: "🔄" };
        return { type: "pending", label: "Pending", icon: "⏳" };
      }

      // Only show rest day if no active content
      return { type: "rest", label: "Rest", icon: "🛌" };
    }

    if (counts.completedDrills === counts.totalDrills)
      return { type: "complete", label: "Complete", icon: "✅" };
    if (counts.completedDrills > 0)
      return { type: "partial", label: "Partial", icon: "🔄" };
    return { type: "pending", label: "Pending", icon: "⏳" };
  };

  // // Get status color
  // const getStatusColor = (status: string) => {
  // 	switch (status) {
  // 		case "complete":
  // 			return "bg-green-100 text-green-800 border-green-200"
  // 		case "partial":
  // 			return "bg-yellow-100 text-yellow-800 border-yellow-200"
  // 		case "rest":
  // 			return "bg-blue-100 text-blue-800 border-blue-200"
  // 		default:
  // 			return "bg-gray-100 text-gray-800 border-gray-200"
  // 	}
  // }

  return (
    <ClientTopNav>
      <div
        className="min-h-screen px-4 sm:px-6 lg:px-8 pt-6"
        style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
      >
        <PushNotificationPrompt />
        {/* Header Section with Gradient Background */}
        <div className="mb-8 md:mb-12">
          <div>
            {/* Decorative background elements */}
          </div>

          {/* Summary Box */}
          <div className="mb-6 md:mb-8 px-4">
            <div className="max-w-6xl mx-auto">
              {/* Upcoming Lessons - Full Width */}
              <div className="mb-4 md:mb-8">
                <div 
                  className="group relative overflow-hidden rounded-3xl p-4 md:p-6 shadow-2xl border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.GOLDEN_BORDER,
                  }}
                >

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 md:p-3 rounded-2xl shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${COLORS.GOLDEN_ACCENT} 0%, ${COLORS.GOLDEN_DARK} 100%)`,
                          }}
                        >
                          <CalendarCheck className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <h3 
                          className="text-lg md:text-xl font-bold"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          Upcoming Lessons
                        </h3>
                      </div>
                      {upcomingEvents.length > 2 && (
                        <a
                          href="/client-schedule"
                          className="text-xs md:text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
                          style={{ 
                            color: COLORS.GOLDEN_ACCENT,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                          }}
                        >
                          View All ({upcomingEvents.length})
                        </a>
                      )}
                    </div>

                    {upcomingEvents.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {upcomingEvents
                          .slice(0, 2)
                          .map((event: any, index: number) => {
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
                              typeof event.title === "string"
                                ? event.title.trim()
                                : "";
                            const heading = coachName
                              ? `Lesson with ${coachName}`
                              : trimmedTitle.length > 0
                              ? trimmedTitle
                              : "Scheduled Lesson";

                            return (
                              <div
                                key={event.id}
                                className="rounded-lg p-4 border shadow-lg"
                                style={{
                                  backgroundColor: COLORS.BACKGROUND_CARD,
                                  borderColor: COLORS.BORDER_SUBTLE,
                                }}
                              >
                                {/* Date Badge */}
                                <div className="flex items-start justify-between mb-3">
                                  <div
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                      isToday ? "animate-pulse" : ""
                                    }`}
                                    style={{
                                      backgroundColor: isToday
                                        ? COLORS.GREEN_PRIMARY
                                        : COLORS.BACKGROUND_CARD,
                                      color: COLORS.TEXT_PRIMARY,
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
                                      backgroundColor: COLORS.BACKGROUND_CARD,
                                    }}
                                  >
                                    <Clock
                                      className="h-3.5 w-3.5"
                                      style={{ color: COLORS.TEXT_PRIMARY }}
                                    />
                                    <span
                                      className="text-xs font-semibold"
                                      style={{ color: COLORS.TEXT_PRIMARY }}
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
                                  <h4
                                    className="text-sm font-bold"
                                    style={{
                                      color: COLORS.TEXT_PRIMARY,
                                    }}
                                  >
                                    {heading}
                                  </h4>
                                  {event.description ? (
                                    <p
                                      className="text-xs line-clamp-2"
                                      style={{
                                        color: COLORS.TEXT_SECONDARY,
                                      }}
                                    >
                                      {event.description}
                                    </p>
                                  ) : (
                                    <p
                                      className="text-xs"
                                      style={{
                                        color: COLORS.TEXT_SECONDARY,
                                      }}
                                    >
                                      Scheduled lesson
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <CalendarX 
                          className="h-12 w-12 mb-3" 
                          style={{ color: COLORS.GOLDEN_ACCENT }}
                        />
                        <p 
                          className="text-sm mb-2"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          No upcoming lessons
                        </p>
                        <p 
                          className="text-xs"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          Your coach will schedule lessons with you soon
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Coach Notes and Message Coach - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {/* Coach Feedback */}
                <div 
                  className="group relative overflow-hidden rounded-3xl p-4 md:p-8 shadow-2xl border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.GOLDEN_BORDER,
                  }}
                >

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div 
                        className="p-2 md:p-3 rounded-xl flex items-center justify-center border"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.GOLDEN_BORDER,
                        }}
                      >
                        <FileText 
                          className="h-4 w-4 md:h-6 md:w-6" 
                          style={{ color: COLORS.GOLDEN_ACCENT }}
                        />
                      </div>
                      <h3 
                        className="text-lg md:text-xl font-bold"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        Coach Notes
                      </h3>
                    </div>

                    {coachNotes && coachNotes.length > 0 ? (
                      <div
                        className="rounded-lg p-3 border cursor-pointer transition-all"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                        }}
                        onClick={() => setIsCoachNotesModalOpen(true)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = COLORS.GOLDEN_BORDER;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                        }}
                      >
                        <p 
                          className="text-sm leading-relaxed line-clamp-2 mb-2"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          {(() => {
                            const mostRecentNote = coachNotes[0];
                            const content = mostRecentNote?.content || "";
                            return content.length > 80
                              ? `${content.substring(0, 80)}...`
                              : content;
                          })()}
                        </p>
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-xs"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
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
                            onClick={e => {
                              e.stopPropagation();
                              setIsCoachNotesModalOpen(true);
                            }}
                            className="text-xs font-medium transition-colors flex items-center gap-1"
                            style={{ color: COLORS.GOLDEN_ACCENT }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = COLORS.GOLDEN_HOVER;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                            }}
                          >
                            View
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-2 p-3 rounded-lg border"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                        }}
                      >
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: COLORS.TEXT_MUTED }}
                        />
                        <p 
                          className="text-sm"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          No feedback yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Coach Button */}
                <div 
                  className="group relative overflow-hidden rounded-3xl p-4 md:p-8 shadow-2xl border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: getGreenPrimary(0.3),
                  }}
                >

                  <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[120px] text-center">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="p-2 md:p-3 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                        <MessageSquare className="h-4 w-4 md:h-6 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-white">
                        Message Coach
                      </h3>
                    </div>

                    <p 
                      className="text-xs md:text-sm mb-4 leading-relaxed"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      Send a quick message to your coach
                    </p>

                    <button
                      onClick={() => setShowMessageModal(true)}
                      className="px-4 py-2 text-white text-sm font-semibold rounded-xl shadow-lg transition-colors"
                      style={{
                        background: `linear-gradient(to right, ${COLORS.GREEN_PRIMARY}, ${COLORS.GREEN_DARK})`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.GREEN_DARK}, #2d6a30)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.GREEN_PRIMARY}, ${COLORS.GREEN_DARK})`;
                      }}
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-center mb-6 md:mb-8 px-4">
            <div
              className="flex rounded-2xl p-1 w-full max-w-2xl"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                border: `1px solid ${COLORS.BORDER_SUBTLE}`,
              }}
            >
              {[
                {
                  id: "calendar",
                  label: "Calendar",
                  icon: <Calendar className="h-3 w-3 md:h-4 md:w-4" />,
                },
                {
                  id: "progress",
                  label: "Pitching Dashboard",
                  labelShort: "Pitching",
                  icon: <Target className="h-3 w-3 md:h-4 md:w-4" />,
                },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(tab.id as "calendar" | "progress")
                  }
                  className={`flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-6 py-2 md:py-3 rounded-xl touch-manipulation ${
                    activeTab === tab.id ? "shadow-lg border" : ""
                  }`}
                  style={{
                    backgroundColor:
                      activeTab === tab.id ? COLORS.GOLDEN_DARK : COLORS.BACKGROUND_CARD,
                    borderColor:
                      activeTab === tab.id ? COLORS.GOLDEN_BORDER : COLORS.BORDER_SUBTLE,
                    color: activeTab === tab.id ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                    }
                  }}
                >
                  {tab.icon}
                  <span className="font-medium text-xs md:text-sm hidden sm:inline">
                    {tab.label}
                  </span>
                  <span className="font-medium text-xs sm:hidden">
                    {tab.labelShort || tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Tab */}
          {activeTab === "calendar" && (
            <div className="space-y-4 md:space-y-8">
              {/* Modern Calendar Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 mb-6 md:mb-12">
                <div className="flex items-center justify-center md:justify-start gap-4 md:gap-8">
                  <Button
                    onClick={() => navigateMonth("prev")}
                    variant="ghost"
                    size="lg"
                    className="p-2 md:p-4 rounded-xl md:rounded-2xl hover:bg-gray-700/30"
                  >
                    <ChevronLeft className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </Button>
                  <h2 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent text-center md:text-left">
                    {format(currentDate, "MMMM yyyy")}
                  </h2>
                  <Button
                    onClick={() => navigateMonth("next")}
                    variant="ghost"
                    size="lg"
                    className="p-2 md:p-4 rounded-xl md:rounded-2xl hover:bg-gray-700/30"
                  >
                    <ChevronRight className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </Button>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2 md:gap-4">
                  <Button
                    onClick={() => setViewMode("week")}
                    variant={viewMode === "week" ? "default" : "ghost"}
                    size="lg"
                    className="px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-2xl text-white font-medium text-sm md:text-base"
                    style={{
                      backgroundColor:
                        viewMode === "week" ? COLORS.GOLDEN_DARK : COLORS.BACKGROUND_CARD,
                      border:
                        viewMode === "week"
                          ? `2px solid ${COLORS.GOLDEN_BORDER}`
                          : `2px solid ${COLORS.BORDER_SUBTLE}`,
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== "week") {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== "week") {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                      }
                    }}
                  >
                    <CalendarDays className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-3" />
                    Week
                  </Button>
                  <Button
                    onClick={() => setViewMode("month")}
                    variant={viewMode === "month" ? "default" : "ghost"}
                    size="lg"
                    className="px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-2xl text-white font-medium text-sm md:text-base"
                    style={{
                      backgroundColor:
                        viewMode === "month" ? COLORS.GOLDEN_DARK : COLORS.BACKGROUND_CARD,
                      border:
                        viewMode === "month"
                          ? `2px solid ${COLORS.GOLDEN_BORDER}`
                          : `2px solid ${COLORS.BORDER_SUBTLE}`,
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== "month") {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== "month") {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                      }
                    }}
                  >
                    <Calendar className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-3" />
                    Month
                  </Button>
                </div>
              </div>

              {/* Modern Calendar Grid */}
              <div
                className="grid grid-cols-7 gap-1 md:gap-2"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-semibold mb-2"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarError && (
                  <div className="col-span-7 p-4 text-center text-red-400">
                    <p>Error loading calendar: {calendarError.message}</p>
                    <p className="text-sm mt-2">
                      Please try refreshing the page.
                    </p>
                  </div>
                )}
                {calendarLoading && (
                  <div className="col-span-7 p-4 text-center">
                    <div className="rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto animate-spin"></div>
                    <p className="mt-2 text-gray-400">Loading calendar...</p>
                  </div>
                )}
                {!calendarError &&
                  !calendarLoading &&
                  calendarDays.map((date, index) => {
                    const dayData = getDayData(date);
                    const isToday = isSameDay(date, new Date());
                    const isCurrentMonth = isSameMonth(date, currentDate);
                    const lessonsForDay = getLessonsForDate(date);

                    // Calculate completion counts dynamically
                    const completionCounts = calculateDayCompletionCounts(
                      dayData,
                      date
                    );

                    return (
                      <div
                        key={index}
                        className={cn(
                          "min-h-[80px] md:min-h-[100px] p-2 rounded-lg cursor-pointer border touch-manipulation transition-colors"
                        )}
                        style={{
                          backgroundColor: isCurrentMonth 
                            ? (isToday ? COLORS.BACKGROUND_CARD_HOVER : COLORS.BACKGROUND_CARD)
                            : COLORS.BACKGROUND_DARK,
                          borderColor: isToday ? COLORS.GOLDEN_BORDER : COLORS.BORDER_SUBTLE,
                          boxShadow: isToday ? `0 0 0 2px ${COLORS.GOLDEN_BORDER}` : "none",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isCurrentMonth 
                            ? (isToday ? COLORS.BACKGROUND_CARD_HOVER : COLORS.BACKGROUND_CARD)
                            : COLORS.BACKGROUND_DARK;
                        }}
                        onClick={() => {
                          // Allow clicking on any day to view what's scheduled
                          // Use local date format to avoid timezone issues
                          const dayString = `${date.getFullYear()}-${(
                            date.getMonth() + 1
                          )
                            .toString()
                            .padStart(2, "0")}-${date
                            .getDate()
                            .toString()
                            .padStart(2, "0")}`;
                          setSelectedDay(dayData);
                          setSelectedDate(date);
                          setSelectedDateForDetails(dayString);
                          // Don't open modal immediately - wait for data to load
                        }}
                      >
                        {/* Date Header */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              isCurrentMonth ? "text-white" : "text-gray-500"
                            )}
                          >
                            {format(date, "d")}
                          </span>
                          {dayData &&
                            (completionCounts.totalDrills > 0 ||
                              (dayData.programs &&
                                dayData.programs.length > 0) ||
                              getRoutinesForDate(date).length > 0) && (
                              <span
                                className={cn(
                                  "text-xs px-2 py-1 rounded-full font-medium",
                                  completionCounts.completedDrills ===
                                    completionCounts.totalDrills
                                    ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                                    : completionCounts.completedDrills > 0
                                    ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/25"
                                    : "bg-gray-500 text-white"
                                )}
                              >
                                {completionCounts.totalDrills === 0
                                  ? "Rest Day"
                                  : `${completionCounts.completedDrills}/${completionCounts.totalDrills}`}
                              </span>
                            )}
                        </div>

                        {/* Workout Details - Show Programs and Routines */}
                        {dayData && (
                          <div className="space-y-1">
                            {/* Show Programs */}
                            {dayData.programs &&
                              dayData.programs.length > 0 && (
                                <>
                                  {(() => {
                                    // Filter out rest days if there are active workouts or routines
                                    const hasWorkouts =
                                      dayData.programs?.some(
                                        program => !program.isRestDay
                                      ) || false;
                                    const hasRoutines =
                                      getRoutinesForDate(date).length > 0;
                                    const hasActiveContent =
                                      hasWorkouts || hasRoutines;

                                    const filteredPrograms =
                                      dayData.programs?.filter(program => {
                                        // Hide rest days if there are active workouts or routines
                                        if (
                                          program.isRestDay &&
                                          hasActiveContent
                                        ) {
                                          return false;
                                        }
                                        return true;
                                      });

                                    return filteredPrograms
                                      ?.slice(0, 2)
                                      .map((program, programIndex) => (
                                        <div
                                          key={`program-${programIndex}`}
                                          className="p-1 rounded text-xs"
                                          style={{
                                            backgroundColor: COLORS.BACKGROUND_CARD,
                                            color: COLORS.GOLDEN_ACCENT,
                                          }}
                                        >
                                          <div className="flex items-center gap-1">
                                            <BookOpen 
                                              className="h-3 w-3 flex-shrink-0" 
                                              style={{ color: COLORS.GOLDEN_ACCENT }}
                                            />
                                            <span className="truncate">
                                              {program.programTitle}
                                            </span>
                                          </div>
                                        </div>
                                      ));
                                  })()}
                                </>
                              )}

                            {/* Show Video Assignments */}
                            {dayData.videoAssignments &&
                              dayData.videoAssignments.length > 0 && (
                                <>
                                  {dayData.videoAssignments
                                    .slice(0, 2)
                                    .map(
                                      (
                                        assignment: any,
                                        assignmentIndex: number
                                      ) => (
                                        <div
                                          key={`video-${assignmentIndex}`}
                                          className="p-1 rounded text-xs"
                                          style={{
                                            backgroundColor: COLORS.BACKGROUND_CARD,
                                            color: COLORS.GOLDEN_ACCENT,
                                          }}
                                        >
                                          <div className="flex items-center gap-1">
                                            <Video 
                                              className="h-3 w-3 flex-shrink-0" 
                                              style={{ color: COLORS.GOLDEN_ACCENT }}
                                            />
                                            <span className="truncate">
                                              {assignment.title}
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    )}
                                </>
                              )}

                            {/* Fallback to old drills format for backward compatibility */}
                            {dayData.drills &&
                              dayData.drills.length > 0 &&
                              (!dayData.programs ||
                                dayData.programs.length === 0) &&
                              getRoutinesForDate(date).length === 0 && (
                                <>
                                  {dayData.drills
                                    .slice(0, 2)
                                    .map((drill, drillIndex) => (
                                      <div
                                        key={drillIndex}
                                        className="p-1 rounded text-xs"
                                        style={{
                                          backgroundColor: drill.completed
                                            ? getGreenPrimary(0.2)
                                            : COLORS.BACKGROUND_CARD,
                                          color: drill.completed
                                            ? COLORS.GREEN_PRIMARY
                                            : COLORS.TEXT_SECONDARY,
                                        }}
                                      >
                                        <div className="flex items-center gap-1">
                                          {drill.completed && (
                                            <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                          )}
                                          <span className="truncate">
                                            {drill.title}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                </>
                              )}

                            {/* Show "more" indicator if there are more items */}
                            {(() => {
                              // Use same filtering logic for "more" indicator
                              const hasWorkouts =
                                dayData.programs?.some(
                                  program => !program.isRestDay
                                ) || false;
                              const hasRoutines =
                                getRoutinesForDate(date).length > 0;
                              const hasActiveContent =
                                hasWorkouts || hasRoutines;

                              const filteredPrograms =
                                dayData.programs?.filter(program => {
                                  if (program.isRestDay && hasActiveContent) {
                                    return false;
                                  }
                                  return true;
                                }) || [];

                              const totalFilteredPrograms =
                                filteredPrograms.length;
                              const totalDrills = dayData.drills?.length || 0;
                              const totalVideoAssignments =
                                dayData.videoAssignments?.length || 0;

                              return (
                                (totalFilteredPrograms > 2 ||
                                  totalDrills > 2 ||
                                  totalVideoAssignments > 2) && (
                                  <div className="text-xs text-gray-400 text-center">
                                    +
                                    {Math.max(
                                      totalFilteredPrograms - 2,
                                      totalDrills - 2,
                                      totalVideoAssignments - 2
                                    )}{" "}
                                    more
                                  </div>
                                )
                              );
                            })()}
                          </div>
                        )}

                        {/* Lessons */}
                        {lessonsForDay.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {lessonsForDay.slice(0, 1).map(
                              (
                                lesson: {
                                  id: string;
                                  date: string;
                                  title: string;
                                  status: string;
                                },
                                lessonIndex: number
                              ) => {
                                // Check if this is a schedule request
                                const isScheduleRequest = lesson.title
                                  ?.toLowerCase()
                                  .includes("schedule request");

                                return (
                                  <div
                                    key={lessonIndex}
                                    className="p-1 rounded text-xs border"
                                    style={
                                      isScheduleRequest
                                        ? {
                                            backgroundColor: COLORS.BACKGROUND_CARD,
                                            color: COLORS.GOLDEN_ACCENT,
                                            borderColor: COLORS.GOLDEN_BORDER,
                                          }
                                        : {
                                            backgroundColor: COLORS.BACKGROUND_CARD,
                                            color: COLORS.GREEN_PRIMARY,
                                            borderColor: COLORS.GREEN_DARK,
                                          }
                                    }
                                  >
                                    <div className="font-medium">
                                      {formatTimeInUserTimezone(lesson.date)}
                                    </div>
                                    <div className="truncate">
                                      {lesson.title || "Lesson"}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                            {lessonsForDay.length > 1 && (
                              <div className="text-xs text-gray-400 text-center">
                                +{lessonsForDay.length - 1} more
                              </div>
                            )}
                          </div>
                        )}

                        {/* Routine Assignments */}
                        {getRoutinesForDate(date).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {getRoutinesForDate(date)
                              .slice(0, 2)
                              .map((routine: any, routineIndex: number) => (
                                <div
                                  key={routineIndex}
                                  className="p-1 rounded text-xs"
                                  style={{
                                            backgroundColor: COLORS.BACKGROUND_CARD,
                                    color: COLORS.GREEN_PRIMARY,
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    <Target 
                                      className="h-3 w-3 flex-shrink-0" 
                                      style={{ color: COLORS.GREEN_PRIMARY }}
                                    />
                                    <span className="truncate">
                                      {(routine as any).routine?.name ||
                                        "Unknown Routine"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            {getRoutinesForDate(date).length > 2 && (
                              <div className="text-xs text-gray-400 text-center">
                                +{getRoutinesForDate(date).length - 2} more
                                routines
                              </div>
                            )}
                          </div>
                        )}

                        {/* Empty Day */}
                        {!dayData &&
                          getRoutinesForDate(date).length === 0 &&
                          isCurrentMonth && (
                            <div className="text-center mt-2">
                              <div className="text-xs text-gray-500">
                                No program
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Pitching Dashboard Tab */}
          {activeTab === "progress" && (
            <div className="space-y-8">
              {/* Pitching Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                    borderColor: COLORS.GOLDEN_BORDER,
                  }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="p-3 rounded-2xl"
                      style={{ backgroundColor: COLORS.GOLDEN_ACCENT }}
                    >
                      <TrendingUp
                        className="h-8 w-8"
                        style={{ color: COLORS.BACKGROUND_DARK }}
                      />
                    </div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      Speed Stats
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span 
                        className="text-lg" 
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        Average Speed
                      </span>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {pitchingData?.averageSpeed
                          ? `${pitchingData.averageSpeed} mph`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span 
                        className="text-lg" 
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        Top Speed
                      </span>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: COLORS.GREEN_PRIMARY }}
                      >
                        {pitchingData?.topSpeed
                          ? `${pitchingData.topSpeed} mph`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                    borderColor: COLORS.GOLDEN_BORDER,
                  }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="p-3 rounded-2xl"
                      style={{ backgroundColor: COLORS.GOLDEN_ACCENT }}
                    >
                      <Zap 
                        className="h-8 w-8" 
                        style={{ color: COLORS.BACKGROUND_DARK }}
                      />
                    </div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      Spin Rates
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span 
                        className="text-sm" 
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        Drop Ball
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {pitchingData?.dropSpinRate
                          ? `${pitchingData.dropSpinRate} rpm`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span 
                        className="text-sm" 
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        Changeup
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {pitchingData?.changeupSpinRate
                          ? `${pitchingData.changeupSpinRate} rpm`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span 
                        className="text-sm" 
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        Rise Ball
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {pitchingData?.riseSpinRate
                          ? `${pitchingData.riseSpinRate} rpm`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span 
                        className="text-sm" 
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        Curve Ball
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {pitchingData?.curveSpinRate
                          ? `${pitchingData.curveSpinRate} rpm`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Speed Progress Chart */}
              {pitchingData?.averageSpeed && pitchingData?.topSpeed && (
                <div
                  className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                      borderColor: COLORS.GOLDEN_BORDER,
                    }}
                  >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="p-3 rounded-2xl"
                      style={{ backgroundColor: COLORS.GOLDEN_ACCENT }}
                    >
                      <BarChart3
                        className="h-8 w-8"
                        style={{ color: COLORS.BACKGROUND_DARK }}
                      />
                    </div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      Speed Progress
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {/* Average Speed Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span 
                          className="text-lg" 
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          Average Speed
                        </span>
                        <span
                          className="text-lg font-bold"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          {pitchingData.averageSpeed} mph
                        </span>
                      </div>
                      <div
                        className="w-full rounded-full h-4"
                        style={{ backgroundColor: COLORS.TEXT_MUTED }}
                      >
                        <div
                          className="h-4 rounded-full"
                          style={{
                            width: `${Math.min(
                              (pitchingData.averageSpeed / 80) * 100,
                              100
                            )}%`,
                            background: `linear-gradient(to right, ${COLORS.GOLDEN_ACCENT}, ${COLORS.GOLDEN_DARK})`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Top Speed Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span 
                          className="text-lg" 
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          Top Speed
                        </span>
                        <span
                          className="text-lg font-bold"
                          style={{ color: COLORS.GREEN_PRIMARY }}
                        >
                          {pitchingData.topSpeed} mph
                        </span>
                      </div>
                      <div
                        className="w-full rounded-full h-4"
                        style={{ backgroundColor: COLORS.TEXT_MUTED }}
                      >
                        <div
                          className="h-4 rounded-full"
                          style={{
                            width: `${Math.min(
                              (pitchingData.topSpeed / 85) * 100,
                              100
                            )}%`,
                            background: `linear-gradient(to right, ${COLORS.GREEN_PRIMARY}, ${COLORS.GREEN_DARK})`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Assignments */}
              {videoAssignments.length > 0 && (
                <div
                  className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                    borderColor: COLORS.RED_BORDER,
                  }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="p-3 rounded-2xl"
                      style={{ backgroundColor: COLORS.RED_ALERT }}
                    >
                      <Video 
                        className="h-8 w-8" 
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      />
                    </div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      Video Assignments
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {videoAssignments.slice(0, 3).map((assignment: any) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                      >
                        <div className="flex items-center gap-3">
                          <Video
                            className="h-5 w-5"
                            style={{ color: COLORS.RED_ALERT }}
                          />
                          <div>
                            <p
                              className="font-medium"
                              style={{ color: COLORS.TEXT_PRIMARY }}
                            >
                              {assignment.video.title}
                            </p>
                            <p 
                              className="text-sm" 
                              style={{ color: COLORS.TEXT_SECONDARY }}
                            >
                              Assigned{" "}
                              {new Date(
                                assignment.assignedAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.completed ? (
                            <CheckCircle2
                              className="h-5 w-5"
                              style={{ color: COLORS.GREEN_PRIMARY }}
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedDrillForVideo({
                                  id: assignment.video.id,
                                  title: assignment.video.title,
                                });
                                setIsVideoSubmissionModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                              style={{
                                backgroundColor: COLORS.RED_ALERT,
                                color: "#FFFFFF",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = COLORS.RED_DARK;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = COLORS.RED_ALERT;
                              }}
                            >
                              Watch & Submit
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New Enhanced Day Modal */}
          {isDaySheetOpen && selectedDate && (
            <ClientProgramDayModal
              isOpen={isDaySheetOpen}
              onClose={() => {
                setIsDaySheetOpen(false);
                setSelectedDateForDetails(null);
              }}
              selectedDay={
                selectedDayDetails
                  ? updateDrillCompletionStatus(selectedDayDetails)
                  : updateDrillCompletionStatus(selectedDay)
              }
              selectedDate={selectedDate}
              programs={(() => {
                const programs =
                  selectedDayDetails?.programs ||
                  updateDrillCompletionStatus(selectedDay)?.programs ||
                  [];
                return programs;
              })()}
              routineAssignments={
                selectedDate ? getRoutinesForDate(selectedDate) : []
              }
              lessonsForDate={
                selectedDate ? getLessonsForDate(selectedDate) : []
              }
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
              completedVideoAssignments={completedVideoAssignments}
              calculateDayCompletionCounts={calculateDayCompletionCounts}
              calculateDayAssignmentCounts={calculateDayAssignmentCounts}
              onMarkRoutineExerciseComplete={handleMarkRoutineExerciseComplete}
              isLoadingDetails={dayDetailsLoading}
              detailsError={dayDetailsError}
            />
          )}

          {/* Video Submission Modal */}
          {isVideoSubmissionModalOpen && (
            <ClientVideoSubmissionModal
              isOpen={isVideoSubmissionModalOpen}
              onClose={() => setIsVideoSubmissionModalOpen(false)}
              drillId={selectedDrillForVideo?.id}
              drillTitle={selectedDrillForVideo?.title}
            />
          )}

          {/* Video Player Modal */}
          {isVideoPlayerOpen && selectedVideo && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div 
                className="rounded-3xl border-2 w-full max-w-4xl max-h-[90vh] overflow-hidden"
                style={{
                  backgroundColor: COLORS.BACKGROUND_DARK,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
              >
                {/* Video Player Header */}
                <div 
                  className="p-4 border-b flex items-center justify-between"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <h3 
                    className="text-xl font-bold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Video Demo
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseVideo}
                    style={{ color: COLORS.TEXT_SECONDARY }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                {/* Video Player Content */}
                <div className="p-4">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden">
                    {selectedVideo &&
                    selectedVideo.isYoutube &&
                    selectedVideo.youtubeId ? (
                      // YouTube video
                      <iframe
                        src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=0&rel=0&disablekb=1&modestbranding=1&showinfo=0`}
                        title={selectedVideo.title || "Video Demo"}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                        style={{ pointerEvents: "auto" }}
                        onContextMenu={e => e.preventDefault()}
                      />
                    ) : selectedVideo && selectedVideo.url ? (
                      // Custom uploaded video - simplified to match mobile version
                      <video
                        controls
                        className="w-full h-full object-contain"
                        style={{ backgroundColor: "#000" }}
                        src={selectedVideo.url}
                        onError={() => {
                          // Video load error - handle silently
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      // Fallback: show error message
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-4xl mb-4">🎥</div>
                          <div 
                            className="text-lg font-semibold mb-2"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            Video Not Available
                          </div>
                          <div 
                            className="text-sm"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            This video could not be loaded. Please check with
                            your coach.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Back to Full View Button */}
                  <div className="mt-4 flex justify-center">
                    <Button
                      onClick={handleCloseVideo}
                      className="px-6 py-3 rounded-xl font-semibold"
                      style={{ backgroundColor: COLORS.GOLDEN_DARK }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Full View
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comment Modal */}
          {isCommentModalOpen && selectedDrillForComment && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div 
                className="rounded-3xl border-2 w-full max-w-md"
                style={{
                  backgroundColor: COLORS.BACKGROUND_DARK,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
              >
                {/* Comment Modal Header */}
                <div 
                  className="p-6 border-b"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 
                        className="text-xl font-bold"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        Add Comment
                      </h3>
                      <p 
                        className="text-sm mt-1"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        {selectedDrillForComment.title}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseCommentModal}
                      style={{ color: COLORS.TEXT_SECONDARY }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                      }}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Comment Modal Content */}
                <div className="p-6">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add your comment about this exercise..."
                      value={commentText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCommentText(e.target.value)
                      }
                      className="rounded-xl min-h-[120px] border"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                      rows={4}
                    />

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleCloseCommentModal}
                        className="flex-1 transition-colors"
                        style={{
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.TEXT_SECONDARY,
                          backgroundColor: COLORS.BACKGROUND_CARD,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                          e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                          e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitComment}
                        disabled={!commentText.trim() || isSubmittingComment}
                        className="flex-1 transition-colors"
                        style={{ backgroundColor: COLORS.GREEN_PRIMARY }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                          }
                        }}
                      >
                        {isSubmittingComment ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Submission Modal */}
          <ClientVideoSubmissionModal
            isOpen={isVideoSubmissionModalOpen}
            onClose={() => setIsVideoSubmissionModalOpen(false)}
            drillId={selectedDrillForVideo?.id}
            drillTitle={selectedDrillForVideo?.title}
          />

          {/* Coach Notes Modal - Compact Design */}
          {isCoachNotesModalOpen && (
            <div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={() => setIsCoachNotesModalOpen(false)}
            >
              <div
                className="rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border flex flex-col"
                style={{
                  backgroundColor: COLORS.BACKGROUND_DARK,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Compact Header */}
                <div 
                  className="flex items-center justify-between px-4 py-3 border-b"
                  style={{
                    borderColor: COLORS.BORDER_SUBTLE,
                    backgroundColor: COLORS.BACKGROUND_CARD,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FileText 
                      className="h-4 w-4" 
                      style={{ color: COLORS.GOLDEN_ACCENT }}
                    />
                    <h3 
                      className="text-base font-semibold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      Coach Notes
                    </h3>
                    <span 
                      className="text-xs"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      ({coachNotes?.length || 0})
                    </span>
                  </div>
                  <button
                    onClick={() => setIsCoachNotesModalOpen(false)}
                    className="p-1.5 rounded transition-colors"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Compact Notes List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div 
                    className="divide-y"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  >
                    {coachNotes && coachNotes.length > 0 ? (
                      coachNotes.map((note, index) => (
                        <div
                          key={note.id}
                          className="p-4 transition-colors"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                          }}
                        >
                          {/* Compact Date */}
                          <div className="flex items-center gap-2 mb-2">
                            <span 
                              className="text-xs font-medium"
                              style={{ color: COLORS.GOLDEN_ACCENT }}
                            >
                              {new Date(note.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                            <span 
                              className="text-xs"
                              style={{ color: COLORS.TEXT_MUTED }}
                            >
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
                          <p 
                            className="text-sm leading-relaxed whitespace-pre-wrap mb-3"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            {note.content}
                          </p>

                          {/* Compact Attachments */}
                          {note.attachments && note.attachments.length > 0 && (
                            <div 
                              className="mt-3 pt-3 border-t"
                              style={{ borderColor: COLORS.BORDER_SUBTLE }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Paperclip 
                                  className="w-3 h-3" 
                                  style={{ color: COLORS.GOLDEN_ACCENT }}
                                />
                                <span 
                                  className="text-xs font-medium"
                                  style={{ color: COLORS.GOLDEN_ACCENT }}
                                >
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
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-colors group"
                                    style={{
                                      backgroundColor: COLORS.BACKGROUND_CARD,
                                      borderColor: COLORS.BORDER_SUBTLE,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                                      e.currentTarget.style.borderColor = COLORS.GOLDEN_BORDER;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                                    }}
                                  >
                                    {attachment.fileType.startsWith(
                                      "image/"
                                    ) ? (
                                      <Image 
                                        className="w-3.5 h-3.5" 
                                        style={{ color: COLORS.GOLDEN_ACCENT }}
                                      />
                                    ) : attachment.fileType.startsWith(
                                        "video/"
                                      ) ? (
                                      <Video 
                                        className="w-3.5 h-3.5" 
                                        style={{ color: COLORS.GOLDEN_ACCENT }}
                                      />
                                    ) : (
                                      <FileText 
                                        className="w-3.5 h-3.5" 
                                        style={{ color: COLORS.GOLDEN_ACCENT }}
                                      />
                                    )}
                                    <span 
                                      className="text-xs truncate max-w-[120px]"
                                      style={{ color: COLORS.TEXT_PRIMARY }}
                                    >
                                      {attachment.fileName}
                                    </span>
                                    <span 
                                      className="text-xs"
                                      style={{ color: COLORS.TEXT_MUTED }}
                                    >
                                      (
                                      {(
                                        attachment.fileSize /
                                        1024 /
                                        1024
                                      ).toFixed(1)}
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
                        <FileText 
                          className="h-8 w-8 mx-auto mb-3" 
                          style={{ color: COLORS.TEXT_MUTED }}
                        />
                        <p 
                          className="text-sm"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          No notes from your coach yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Message Modal */}
      {showMessageModal && (
        <QuickMessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </ClientTopNav>
  );
}

// Quick Message Modal Component
function QuickMessageModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [messageText, setMessageText] = useState("");

  // Get conversations to find coach conversation
  const { data: conversationsData, refetch: refetchConversations } =
    trpc.messaging.getConversations.useQuery(
      { limit: 100, offset: 0 },
      { enabled: isOpen }
    );

  const conversations: any[] = conversationsData?.conversations || [];

  // Find the conversation with the coach (COACH_CLIENT type)
  const coachConversation = conversations.find(
    (conv: any) => conv.type === "COACH_CLIENT"
  );

  // Send message mutation
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation();

  // Handle mutation callbacks separately
  React.useEffect(() => {
    if (sendMessageMutation.isSuccess) {
      setMessageText("");
      refetchConversations();
      onClose();
    }
  }, [sendMessageMutation.isSuccess, onClose, refetchConversations]);

  React.useEffect(() => {
    if (sendMessageMutation.isError) {
      console.error("Failed to send message:", sendMessageMutation.error);
      alert("Failed to send message. Please try again.");
    }
  }, [sendMessageMutation.isError, sendMessageMutation.error]);

  const handleSendMessage = () => {
    if (
      !messageText.trim() ||
      !coachConversation ||
      sendMessageMutation.isPending
    )
      return;

    sendMessageMutation.mutate({
      conversationId: coachConversation.id,
      content: messageText.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl border"
        style={{
          backgroundColor: COLORS.BACKGROUND_CARD,
          borderColor: getGreenPrimary(0.3),
        }}
        onClick={e => e.stopPropagation()}
      >

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-2xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.GREEN_PRIMARY} 0%, ${COLORS.GREEN_DARK} 100%)`,
                }}
              >
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h3 
                className="text-lg font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Message Your Coach
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {!coachConversation ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">
                Unable to find conversation with your coach.
              </p>
            </div>
          ) : (
            <>
              <Textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && e.shiftKey === false) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message here..."
                className="w-full min-h-[120px] mb-4 resize-none rounded-xl focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: COLORS.BACKGROUND_DARK,
                  border: `1px solid ${COLORS.GREEN_DARK}`,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.GREEN_PRIMARY;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${COLORS.GREEN_DARK}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = COLORS.GREEN_DARK;
                  e.currentTarget.style.boxShadow = "none";
                }}
                disabled={sendMessageMutation.isPending}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={onClose}
                  disabled={sendMessageMutation.isPending}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={
                    !messageText.trim() || sendMessageMutation.isPending
                  }
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendMessageMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default withMobileDetection(MobileClientProgramPage, ClientProgramPage);
