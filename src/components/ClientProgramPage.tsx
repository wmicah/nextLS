"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
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
import { formatTimeInUserTimezone } from "@/lib/timezone-utils";
import ClientTopNav from "@/components/ClientTopNav";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileClientProgramPage from "./MobileClientProgramPage";

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
  drills: Drill[]; // Keep for backward compatibility
  programs?: ProgramData[]; // New: array of programs for this day
  isRestDay: boolean;
  expectedTime: number;
  completedDrills: number;
  totalDrills: number;
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
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
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
  const [videoError, setVideoError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
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
  const [justCompletedDrills, setJustCompletedDrills] = useState<Set<string>>(
    new Set()
  );

  // Get client's assigned program
  const { data: programInfo } = trpc.clientRouter.getAssignedProgram.useQuery();
  const {
    data: calendarData,
    error: calendarError,
    isLoading: calendarLoading,
    refetch: refetchCalendar,
  } = trpc.clientRouter.getProgramCalendar.useQuery({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    viewMode,
  });

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

  // Debug logging
  console.log("📅 Week Calendar Debug:", {
    currentWeekStart: currentWeekStart.toLocaleDateString(),
    currentWeekEnd: currentWeekEnd.toLocaleDateString(),
    startDateString,
    endDateString,
  });

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

  // Get coach notes
  const { data: coachNotes } = trpc.clientRouter.getCoachNotes.useQuery();

  // Get routine assignments
  const { data: routineAssignments = [] } =
    trpc.clientRouter.getRoutineAssignments.useQuery();

  // Debug logging for routine assignments
  console.log("🔍 Routine Assignments Debug:", {
    routineAssignments,
    count: routineAssignments.length,
    assignments: routineAssignments.map(assignment => ({
      id: assignment.id,
      routineName: assignment.routine.name,
      assignedAt: assignment.assignedAt,
      startDate: assignment.startDate,
    })),
  });

  // Get client's lessons
  const { data: clientLessons = [] } =
    trpc.clientRouter.getClientLessons.useQuery({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
    });

  // Get library items for video lookup
  const { data: libraryItems = [] } = trpc.library.list.useQuery({});

  // Consolidated debug (after data declarations)
  console.log("[ClientProgramPage]", {
    programInfo,
    weekCalendarData,
    calendarData,
    calendarError,
    calendarLoading,
    nextLesson,
    clientLessons,
    pitchingData,
    videoAssignments,
    currentDate,
  });

  const utils = trpc.useUtils();

  // Add comment to drill mutation (handles both video comments and messages)
  const addCommentToDrillMutation =
    trpc.clientRouter.addCommentToDrill.useMutation();

  // Mutations
  const markDrillCompleteMutation =
    trpc.clientRouter.markDrillComplete.useMutation({
      // Remove aggressive invalidation - let optimistic updates handle UI
      onError: error => {
        alert(`Error updating drill: ${error.message}`);
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
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
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

  const getLessonsForDate = (date: Date) => {
    const now = new Date();
    const lessons = clientLessons.filter((lesson: { date: string }) => {
      const lessonDate = new Date(lesson.date);
      const lessonDateOnly = new Date(
        lessonDate.getFullYear(),
        lessonDate.getMonth(),
        lessonDate.getDate()
      );
      const targetDateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const isSame = lessonDateOnly.getTime() === targetDateOnly.getTime();
      const isFuture = lessonDate > now;
      return isSame && isFuture;
    });
    return lessons;
  };

  // Get routine assignments for a specific date
  const getRoutinesForDate = (date: Date) => {
    if (!routineAssignments || routineAssignments.length === 0) return [];

    // Convert date to YYYY-MM-DD format for comparison
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

    // Filter routines that are scheduled for this specific date
    return routineAssignments.filter((assignment: any) => {
      if (!assignment.startDate) return false;

      // Convert assignment start date to YYYY-MM-DD format
      const assignmentDate = new Date(assignment.startDate);
      const assignmentDateString = `${assignmentDate.getFullYear()}-${(
        assignmentDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${assignmentDate
        .getDate()
        .toString()
        .padStart(2, "0")}`;

      // For now, only show routines on their start date
      // This could be enhanced to support recurring routines or date ranges
      return assignmentDateString === dateString;
    });
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

  // Handle drill completion
  const handleMarkDrillComplete = async (
    drillId: string,
    completed: boolean
  ) => {
    console.log("🎯 handleMarkDrillComplete called with:", {
      drillId,
      completed,
    });

    // Optimistic update FIRST
    if (selectedDay) {
      console.log("📝 Updating selectedDay state optimistically");
      const updatedDrills = selectedDay.drills.map(drill =>
        drill.id === drillId ? { ...drill, completed } : drill
      );
      const completedDrills = updatedDrills.filter(
        drill => drill.completed
      ).length;

      setSelectedDay({
        ...selectedDay,
        drills: updatedDrills,
        completedDrills,
      });
      console.log(
        "✅ Optimistic update applied - drill should now be",
        completed ? "green" : "gray"
      );
    } else {
      console.log("❌ No selectedDay found - cannot update state");
    }

    // Add brief celebration effect for completed drills (reduced)
    if (completed) {
      setJustCompletedDrills(prev => new Set(prev).add(drillId));
      setTimeout(() => {
        setJustCompletedDrills(prev => {
          const newSet = new Set(prev);
          newSet.delete(drillId);
          return newSet;
        });
      }, 500); // Much shorter celebration (0.5 seconds)
    }

    // Then perform the actual mutation
    try {
      console.log("🚀 Calling markDrillCompleteMutation with:", {
        drillId,
        completed,
      });
      await markDrillCompleteMutation.mutateAsync({
        drillId: drillId,
        completed,
      });
      console.log(
        "✅ markDrillCompleteMutation succeeded - data saved to backend"
      );

      // Subtle refetch to ensure UI stays in sync
      console.log("🔄 Refreshing calendar data...");
      await refetchCalendar();
      console.log("✅ Calendar data refreshed");
    } catch (error) {
      console.log("❌ markDrillCompleteMutation failed:", error);
      // Revert optimistic update on error
      if (selectedDay) {
        const revertedDrills = selectedDay.drills.map(drill =>
          drill.id === drillId ? { ...drill, completed: !completed } : drill
        );
        const completedDrills = revertedDrills.filter(
          drill => drill.completed
        ).length;

        setSelectedDay({
          ...selectedDay,
          drills: revertedDrills,
          completedDrills,
        });
      }
      console.error("Failed to update drill completion:", error);
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

      // Mark all drills as complete in the database
      for (const drill of selectedDay.drills) {
        if (!drill.completed) {
          await markDrillCompleteMutation.mutateAsync({
            drillId: drill.id,
            completed: true,
          });
        }
      }
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

  // Handle opening video player
  const handleOpenVideo = async (videoUrl: string, drillData?: any) => {
    console.log("🎬 Opening video with URL:", videoUrl);
    console.log("📋 Drill data:", drillData);
    console.log("🔍 YouTube metadata check:", {
      isYoutube: drillData?.isYoutube,
      youtubeId: drillData?.youtubeId,
      videoId: drillData?.videoId,
      videoTitle: drillData?.videoTitle,
      videoThumbnail: drillData?.videoThumbnail,
    });

    // Clear any previous video errors
    setVideoError(null);

    // If drill data has YouTube information, use it directly (this is the simple approach!)
    if (drillData?.isYoutube && drillData?.youtubeId) {
      console.log(
        "✅ Using YouTube metadata from drill data:",
        drillData.youtubeId
      );
      setSelectedVideo({
        id: "youtube-" + drillData.youtubeId,
        isYoutube: true,
        youtubeId: drillData.youtubeId || undefined,
        title: drillData?.title || "YouTube Video",
        url: `https://www.youtube.com/watch?v=${drillData.youtubeId}`, // Generate proper YouTube URL
        type: "video",
      });
      setIsVideoPlayerOpen(true);
      return;
    }

    // Fallback: If we have an UploadThing URL but no YouTube metadata, search library for matching video
    if (videoUrl && videoUrl.includes("utfs.io") && drillData?.title) {
      console.log(
        "⚠️ UploadThing URL detected, searching library for YouTube video:",
        drillData.title
      );
      console.log("📚 Available library items:", libraryItems);

      // Try multiple matching strategies
      let matchingVideo = libraryItems?.find(
        item =>
          item.isYoutube &&
          item.title &&
          item.title.toLowerCase().trim() ===
            drillData.title.toLowerCase().trim()
      );

      // If exact match fails, try partial match
      if (!matchingVideo) {
        matchingVideo = libraryItems?.find(
          item =>
            item.isYoutube &&
            item.title &&
            item.title.toLowerCase().includes(drillData.title.toLowerCase())
        );
      }

      // If still no match, try reverse partial match
      if (!matchingVideo) {
        matchingVideo = libraryItems?.find(
          item =>
            item.isYoutube &&
            item.title &&
            drillData.title.toLowerCase().includes(item.title.toLowerCase())
        );
      }

      // AGGRESSIVE FALLBACK: Look for videos with UploadThing URLs that might be YouTube videos
      // This handles the case where YouTube videos were incorrectly stored with UploadThing URLs
      if (!matchingVideo) {
        console.log(
          "🔍 Searching for videos with UploadThing URLs that might be YouTube videos..."
        );

        matchingVideo = libraryItems?.find(
          item =>
            item.title &&
            item.title.toLowerCase().trim() ===
              drillData.title.toLowerCase().trim() &&
            item.url &&
            item.url.includes("utfs.io") &&
            // Check if the original URL field has YouTube info
            (item.youtubeId ||
              (item.url &&
                (item.url.includes("youtube.com") ||
                  item.url.includes("youtu.be"))))
        );

        if (matchingVideo) {
          console.log(
            "✅ Found potential YouTube video with UploadThing URL:",
            matchingVideo
          );

          // Try to extract YouTube ID from the original URL or use stored youtubeId
          let youtubeId = matchingVideo.youtubeId;

          if (!youtubeId && matchingVideo.url) {
            // Try to extract from the original URL field
            const youtubeMatch = matchingVideo.url.match(
              /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
            );
            if (youtubeMatch) {
              youtubeId = youtubeMatch[1];
            }
          }

          if (youtubeId) {
            console.log("✅ Extracted YouTube ID:", youtubeId);
            setSelectedVideo({
              id: "youtube-" + youtubeId,
              isYoutube: true,
              youtubeId: youtubeId,
              title: matchingVideo.title,
              url: `https://www.youtube.com/watch?v=${youtubeId}`,
              type: "video",
            });
            setIsVideoPlayerOpen(true);
            return;
          }
        }
      }

      if (matchingVideo) {
        console.log(
          "✅ Found matching YouTube video in library:",
          matchingVideo
        );
        setSelectedVideo({
          id: "youtube-" + matchingVideo.youtubeId,
          isYoutube: true,
          youtubeId: matchingVideo.youtubeId || undefined,
          title: matchingVideo.title,
          url: `https://www.youtube.com/watch?v=${matchingVideo.youtubeId}`,
          type: "video",
        });
        setIsVideoPlayerOpen(true);
        return;
      } else {
        console.log("❌ No matching YouTube video found in library");
        console.log(
          "📚 All YouTube items in library:",
          libraryItems?.filter(item => item.isYoutube)
        );
        setVideoError(
          `YouTube video "${drillData.title}" could not be found. Please contact your coach.`
        );
        return;
      }
    }

    // Fallback: Try to detect YouTube from URL
    if (
      videoUrl &&
      (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be"))
    ) {
      const youtubeIdMatch = videoUrl.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );

      if (youtubeIdMatch) {
        const youtubeId = youtubeIdMatch[1];
        setSelectedVideo({
          id: "youtube-" + youtubeId,
          isYoutube: true,
          youtubeId: youtubeId,
          title: drillData?.title || "YouTube Video",
          url: videoUrl,
          type: "video",
        });
        setIsVideoPlayerOpen(true);
        return;
      }
    }

    // For non-YouTube videos, treat as regular video
    setSelectedVideo({
      id: "video-" + Date.now(),
      url: videoUrl,
      type: "video",
      title: drillData?.title || "Video",
      isYoutube: false,
    });
    setIsVideoPlayerOpen(true);
  };

  // Handle closing video player
  const handleCloseVideo = () => {
    setIsVideoPlayerOpen(false);
    setSelectedVideo(null);
    setVideoError(null);
    setRetryCount(0);
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

      console.log("Comment submission result:", result);
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmittingComment(false);
      handleCloseCommentModal();
    }
  };

  // Get status for a day
  const getDayStatus = (dayData: DayData | null) => {
    if (!dayData) return null;
    if (dayData.isRestDay) return { type: "rest", label: "Rest", icon: "🛌" };
    if (dayData.completedDrills === dayData.totalDrills)
      return { type: "complete", label: "Complete", icon: "✅" };
    if (dayData.completedDrills > 0)
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
        style={{ backgroundColor: "#2a3133" }}
      >
        {/* Header Section with Gradient Background */}
        <div className="mb-8 md:mb-12">
          <div>
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10"></div>
          </div>

          {/* Summary Box */}
          <div className="mb-6 md:mb-8 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                {/* Upcoming Lesson */}
                <div className="group relative overflow-hidden rounded-3xl p-4 md:p-8 shadow-2xl border transition-all duration-300 hover:scale-105 hover:shadow-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-emerald-700/10 border-emerald-500/20 hover:border-emerald-400/40">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-300 rounded-full blur-2xl"></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="p-2 md:p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                        <CalendarCheck className="h-4 w-4 md:h-6 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-white">
                        Next Lesson
                      </h3>
                    </div>

                    {nextLesson ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                          <p className="text-sm md:text-lg font-semibold text-emerald-100">
                            {new Date(nextLesson.date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <p className="text-xs md:text-sm text-emerald-200/80 font-medium">
                          {new Date(nextLesson.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <p className="text-sm text-gray-400">
                          No upcoming lesson
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coach Feedback */}
                <div className="group relative overflow-hidden rounded-3xl p-4 md:p-8 shadow-2xl border transition-all duration-300 hover:scale-105 hover:shadow-3xl bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-purple-700/10 border-purple-500/20 hover:border-purple-400/40">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-300 rounded-full blur-2xl"></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="p-2 md:p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                        <FileText className="h-4 w-4 md:h-6 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-white">
                        Coach Notes
                      </h3>
                    </div>

                    {coachNotes?.notes ? (
                      <div className="space-y-3">
                        <div className="bg-purple-500/10 rounded-2xl p-3 md:p-4 border border-purple-400/20">
                          <p className="text-xs md:text-sm text-purple-100 leading-relaxed">
                            {coachNotes.notes.length > 20
                              ? `${coachNotes.notes.substring(0, 20)}...`
                              : coachNotes.notes}
                          </p>
                          {coachNotes.notes.length > 20 && (
                            <button
                              onClick={() => setIsCoachNotesModalOpen(true)}
                              className="mt-2 text-xs font-semibold text-purple-300 hover:text-purple-200 transition-colors duration-200"
                            >
                              Read Full Note
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <p className="text-xs text-purple-200/80 font-medium">
                            Updated{" "}
                            {new Date(
                              coachNotes.updatedAt
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

                {/* View Full Schedule Button */}
                <div className="group relative overflow-hidden rounded-3xl p-4 md:p-8 shadow-2xl border transition-all duration-300 hover:scale-105 hover:shadow-3xl bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-blue-700/10 border-blue-500/20 hover:border-blue-400/40">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-300 rounded-full blur-2xl"></div>
                  </div>

                  <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[120px] text-center">
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="p-2 md:p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                        <Calendar className="h-4 w-4 md:h-6 md:w-6 text-white" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-white">
                        Schedule
                      </h3>
                    </div>

                    <p className="text-xs md:text-sm text-blue-200/80 mb-4 leading-relaxed">
                      View your coach's schedule and request lessons
                    </p>

                    <button
                      onClick={() =>
                        (window.location.href = "/client-schedule")
                      }
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      View Full Schedule
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
                backgroundColor: "#353A3A",
                border: "1px solid #606364",
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
                  className={`flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-6 py-2 md:py-3 rounded-xl transition-all duration-300 touch-manipulation ${
                    activeTab === tab.id
                      ? "shadow-lg border"
                      : "hover:scale-105"
                  }`}
                  style={{
                    backgroundColor:
                      activeTab === tab.id ? "#4A5A70" : "transparent",
                    borderColor:
                      activeTab === tab.id ? "#4A5A70" : "transparent",
                    color: activeTab === tab.id ? "#C3BCC2" : "#ABA4AA",
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
                    className="p-2 md:p-4 rounded-xl md:rounded-2xl hover:bg-gray-700/30 transition-all duration-300 hover:scale-105"
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
                    className="p-2 md:p-4 rounded-xl md:rounded-2xl hover:bg-gray-700/30 transition-all duration-300 hover:scale-105"
                  >
                    <ChevronRight className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </Button>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2 md:gap-4">
                  <Button
                    onClick={() => setViewMode("week")}
                    variant={viewMode === "week" ? "default" : "ghost"}
                    size="lg"
                    className="px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-2xl text-white font-medium transition-all duration-300 hover:scale-105 text-sm md:text-base"
                    style={{
                      backgroundColor:
                        viewMode === "week" ? "#4A5A70" : "transparent",
                      border:
                        viewMode === "week"
                          ? "2px solid #4A5A70"
                          : "2px solid transparent",
                    }}
                  >
                    <CalendarDays className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-3" />
                    Week
                  </Button>
                  <Button
                    onClick={() => setViewMode("month")}
                    variant={viewMode === "month" ? "default" : "ghost"}
                    size="lg"
                    className="px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-2xl text-white font-medium transition-all duration-300 hover:scale-105 text-sm md:text-base"
                    style={{
                      backgroundColor:
                        viewMode === "month" ? "#4A5A70" : "transparent",
                      border:
                        viewMode === "month"
                          ? "2px solid #4A5A70"
                          : "2px solid transparent",
                    }}
                  >
                    <Calendar className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-3" />
                    Month
                  </Button>
                </div>
              </div>

              {/* Modern Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {/* Day headers */}
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-semibold mb-2"
                    style={{ color: "#ABA4AA" }}
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
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

                    return (
                      <div
                        key={index}
                        className={cn(
                          "min-h-[80px] md:min-h-[100px] p-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/10 border touch-manipulation",
                          isCurrentMonth
                            ? "bg-white/5 border-white/10 hover:border-white/20"
                            : "bg-white/2 border-white/5",
                          isToday &&
                            "ring-2 ring-blue-500/50 border-blue-400/50 bg-blue-500/10"
                        )}
                        onClick={() => {
                          if (dayData || getRoutinesForDate(date).length > 0) {
                            setSelectedDay(dayData);
                            setIsDaySheetOpen(true);
                          }
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
                          {dayData && dayData.totalDrills > 0 && (
                            <span
                              className="text-xs px-2 py-1 rounded-full font-medium"
                              style={{
                                backgroundColor: "#10B981",
                                color: "#FFFFFF",
                              }}
                            >
                              {dayData.completedDrills}/{dayData.totalDrills}
                            </span>
                          )}
                        </div>

                        {/* Workout Details */}
                        {dayData &&
                          dayData.drills &&
                          dayData.drills.length > 0 && (
                            <div className="space-y-1">
                              {dayData.drills
                                .slice(0, 2)
                                .map((drill, drillIndex) => (
                                  <div
                                    key={drillIndex}
                                    className={`p-1 rounded text-xs transition-all duration-200 ${
                                      drill.completed
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-gray-600/20 text-gray-300"
                                    }`}
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
                              {dayData.drills.length > 2 && (
                                <div className="text-xs text-gray-400 text-center">
                                  +{dayData.drills.length - 2} more
                                </div>
                              )}
                            </div>
                          )}

                        {/* Rest Day Indicator */}
                        {dayData && dayData.isRestDay && (
                          <div className="mt-2 text-center">
                            <div className="text-xs bg-yellow-500/20 text-yellow-400 p-1 rounded">
                              🔋 Rest Day
                            </div>
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
                              ) => (
                                <div
                                  key={lessonIndex}
                                  className="p-1 rounded text-xs bg-blue-500/20 text-blue-400"
                                >
                                  <div className="font-medium">
                                    {formatTimeInUserTimezone(lesson.date)}
                                  </div>
                                  <div className="truncate">
                                    {lesson.title || "Lesson"}
                                  </div>
                                </div>
                              )
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
                                  className="p-1 rounded text-xs bg-green-500/20 text-green-400"
                                >
                                  <div className="flex items-center gap-1">
                                    <Target className="h-3 w-3 text-green-500 flex-shrink-0" />
                                    <span className="truncate">
                                      {routine.routine.name}
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
                    borderColor: "#3B82F6",
                  }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="p-3 rounded-2xl"
                      style={{ backgroundColor: "#3B82F6" }}
                    >
                      <TrendingUp
                        className="h-8 w-8"
                        style={{ color: "#C3BCC2" }}
                      />
                    </div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      Speed Stats
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg" style={{ color: "#ABA4AA" }}>
                        Average Speed
                      </span>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: "#C3BCC2" }}
                      >
                        {pitchingData?.averageSpeed
                          ? `${pitchingData.averageSpeed} mph`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg" style={{ color: "#ABA4AA" }}>
                        Top Speed
                      </span>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: "#10B981" }}
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
                    borderColor: "#8B5CF6",
                  }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="p-3 rounded-2xl"
                      style={{ backgroundColor: "#8B5CF6" }}
                    >
                      <Zap className="h-8 w-8" style={{ color: "#C3BCC2" }} />
                    </div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      Spin Rates
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: "#ABA4AA" }}>
                        Drop Ball
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: "#C3BCC2" }}
                      >
                        {pitchingData?.dropSpinRate
                          ? `${pitchingData.dropSpinRate} rpm`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: "#ABA4AA" }}>
                        Changeup
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: "#C3BCC2" }}
                      >
                        {pitchingData?.changeupSpinRate
                          ? `${pitchingData.changeupSpinRate} rpm`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: "#ABA4AA" }}>
                        Rise Ball
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: "#C3BCC2" }}
                      >
                        {pitchingData?.riseSpinRate
                          ? `${pitchingData.riseSpinRate} rpm`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: "#ABA4AA" }}>
                        Curve Ball
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: "#C3BCC2" }}
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
                    borderColor: "#3B82F6",
                  }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="p-3 rounded-2xl"
                      style={{ backgroundColor: "#3B82F6" }}
                    >
                      <BarChart3
                        className="h-8 w-8"
                        style={{ color: "#C3BCC2" }}
                      />
                    </div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      Speed Progress
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {/* Average Speed Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg" style={{ color: "#ABA4AA" }}>
                          Average Speed
                        </span>
                        <span
                          className="text-lg font-bold"
                          style={{ color: "#C3BCC2" }}
                        >
                          {pitchingData.averageSpeed} mph
                        </span>
                      </div>
                      <div
                        className="w-full rounded-full h-4"
                        style={{ backgroundColor: "#606364" }}
                      >
                        <div
                          className="h-4 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (pitchingData.averageSpeed / 80) * 100,
                              100
                            )}%`,
                            background:
                              "linear-gradient(to right, #3B82F6, #1D4ED8)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Top Speed Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg" style={{ color: "#ABA4AA" }}>
                          Top Speed
                        </span>
                        <span
                          className="text-lg font-bold"
                          style={{ color: "#10B981" }}
                        >
                          {pitchingData.topSpeed} mph
                        </span>
                      </div>
                      <div
                        className="w-full rounded-full h-4"
                        style={{ backgroundColor: "#606364" }}
                      >
                        <div
                          className="h-4 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (pitchingData.topSpeed / 85) * 100,
                              100
                            )}%`,
                            background:
                              "linear-gradient(to right, #10B981, #059669)",
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
                    borderColor: "#EF4444",
                  }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="p-3 rounded-2xl"
                      style={{ backgroundColor: "#EF4444" }}
                    >
                      <Video className="h-8 w-8" style={{ color: "#C3BCC2" }} />
                    </div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      Video Assignments
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {videoAssignments.slice(0, 3).map((assignment: any) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{ backgroundColor: "#2A2F2F" }}
                      >
                        <div className="flex items-center gap-3">
                          <Video
                            className="h-5 w-5"
                            style={{ color: "#EF4444" }}
                          />
                          <div>
                            <p
                              className="font-medium"
                              style={{ color: "#C3BCC2" }}
                            >
                              {assignment.video.title}
                            </p>
                            <p className="text-sm" style={{ color: "#ABA4AA" }}>
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
                              style={{ color: "#10B981" }}
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
                              className="px-3 py-1 rounded-lg text-xs font-medium"
                              style={{
                                backgroundColor: "#EF4444",
                                color: "#FFFFFF",
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
          {isDaySheetOpen && selectedDay && (
            <ClientProgramDayModal
              isOpen={isDaySheetOpen}
              onClose={() => setIsDaySheetOpen(false)}
              selectedDay={selectedDay}
              programs={selectedDay?.programs || []}
              routineAssignments={routineAssignments as any}
              onMarkDrillComplete={handleMarkDrillComplete}
              onMarkAllComplete={handleMarkAllComplete}
              onOpenVideo={handleOpenVideo}
              onOpenCommentModal={handleOpenCommentModal}
              onOpenVideoSubmissionModal={handleSubmitVideo}
              onSendNote={handleSendNote}
              noteToCoach={noteToCoach}
              setNoteToCoach={setNoteToCoach}
              isSubmittingNote={isSubmittingNote}
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
                className="bg-gray-900 rounded-3xl border-2 border-gray-600 w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out"
                style={{
                  animation: "modalSlideIn 0.3s ease-out",
                }}
              >
                {/* Video Player Header */}
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Video Demo</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseVideo}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                {/* Video Player Content */}
                <div className="p-4">
                  {/* Video Error Display */}
                  {videoError && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <p className="text-red-300 text-sm">{videoError}</p>
                        </div>
                        {retryCount < 3 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setVideoError(null);
                              setRetryCount(prev => prev + 1);
                              // The key change will force the video element to re-render
                            }}
                            className="text-red-300 border-red-500/30 hover:bg-red-500/10"
                          >
                            Retry ({retryCount + 1}/3)
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

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
                      // Custom uploaded video
                      (() => {
                        console.log(
                          "Rendering video with URL:",
                          selectedVideo.url
                        );
                        console.log("Video type:", selectedVideo.type);
                        console.log("Is YouTube:", selectedVideo.isYoutube);
                        console.log(
                          "URL is valid:",
                          selectedVideo.url.startsWith("http")
                        );
                        console.log("URL length:", selectedVideo.url.length);
                        return (
                          <video
                            key={`video-${selectedVideo.id}-${retryCount}`}
                            controls
                            controlsList="nodownload nofullscreen"
                            disablePictureInPicture
                            className="w-full h-full object-contain"
                            style={{ backgroundColor: "#000" }}
                            onContextMenu={e => e.preventDefault()}
                            onLoad={() => {
                              console.log(
                                "Video loaded successfully:",
                                selectedVideo?.url
                              );
                            }}
                            onLoadStart={() => {
                              console.log(
                                "Video load started:",
                                selectedVideo?.url
                              );
                              // Test if URL is accessible
                              fetch(selectedVideo?.url || "", {
                                method: "HEAD",
                              })
                                .then(response => {
                                  console.log("Video URL fetch test:", {
                                    url: selectedVideo?.url,
                                    status: response.status,
                                    statusText: response.statusText,
                                    headers: Object.fromEntries(
                                      response.headers.entries()
                                    ),
                                  });
                                })
                                .catch(error => {
                                  console.error(
                                    "Video URL fetch test failed:",
                                    error
                                  );
                                });
                            }}
                            onCanPlay={() => {
                              console.log(
                                "Video can play:",
                                selectedVideo?.url
                              );
                              setVideoError(null);
                            }}
                            onError={e => {
                              const videoElement = e.target as HTMLVideoElement;
                              const error = videoElement.error;
                              const errorInfo = {
                                code: error?.code,
                                message: error?.message,
                                networkState: videoElement.networkState,
                                readyState: videoElement.readyState,
                                videoUrl: selectedVideo?.url,
                                videoTitle: selectedVideo?.title,
                                timestamp: new Date().toISOString(),
                              };

                              console.error("Video load error:", errorInfo);
                              console.error(
                                "Video element src:",
                                videoElement.src
                              );
                              console.error(
                                "Video element currentSrc:",
                                videoElement.currentSrc
                              );

                              let errorMessage = "Failed to load video.";
                              if (error?.code === 4) {
                                errorMessage =
                                  "Video format not supported or corrupted.";
                              } else if (error?.code === 3) {
                                errorMessage = "Video decoding error.";
                              } else if (error?.code === 2) {
                                errorMessage =
                                  "Network error while loading video.";
                              } else if (error?.code === 1) {
                                errorMessage = "Video loading aborted.";
                              }

                              // Add URL to error message for debugging
                              errorMessage += ` (URL: ${selectedVideo?.url?.substring(
                                0,
                                50
                              )}...)`;

                              setVideoError(errorMessage);
                            }}
                          >
                            <source src={selectedVideo.url} type="video/mp4" />
                            <source src={selectedVideo.url} type="video/webm" />
                            <source src={selectedVideo.url} type="video/ogg" />
                            Your browser does not support the video tag.
                          </video>
                        );
                      })()
                    ) : (
                      // Fallback: show error message
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-white">
                          <div className="text-4xl mb-4">🎥</div>
                          <div className="text-lg font-semibold mb-2">
                            Video Not Available
                          </div>
                          <div className="text-sm text-gray-400">
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
                      style={{ backgroundColor: "#4A5A70" }}
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
                className="bg-gray-800 rounded-3xl border-2 border-gray-600 w-full max-w-md transform transition-all duration-300 ease-out"
                style={{
                  animation: "modalSlideIn 0.3s ease-out",
                }}
              >
                {/* Comment Modal Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Add Comment
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {selectedDrillForComment.title}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseCommentModal}
                      className="text-gray-400 hover:text-white"
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
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-xl min-h-[120px]"
                      rows={4}
                    />

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleCloseCommentModal}
                        className="flex-1 border-gray-500 text-gray-400 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitComment}
                        disabled={!commentText.trim() || isSubmittingComment}
                        className="flex-1"
                        style={{ backgroundColor: "#10B981" }}
                      >
                        {isSubmittingComment ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

          {/* Coach Notes Modal */}
          {isCoachNotesModalOpen && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gray-100">
                      <FileText className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Coach Notes
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCoachNotesModalOpen(false)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <p className="text-base leading-7 text-gray-800 whitespace-pre-wrap">
                      {coachNotes?.notes}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <p className="text-sm text-gray-600 font-medium">
                      Updated{" "}
                      {new Date(coachNotes?.updatedAt || "").toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <button
                    onClick={() => setIsCoachNotesModalOpen(false)}
                    className="px-8 py-3 bg-gray-900 text-white text-base font-semibold rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientTopNav>
  );
}

export default withMobileDetection(MobileClientProgramPage, ClientProgramPage);
