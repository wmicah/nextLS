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
} from "lucide-react";
import ClientVideoSubmissionModal from "./ClientVideoSubmissionModal";
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
import ClientSidebar from "@/components/ClientSidebar";
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

interface DayData {
  date: string;
  drills: Drill[];
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
  const [activeTab, setActiveTab] = useState<
    "overview" | "calendar" | "progress"
  >("overview");
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
  const { data: weekCalendarData } =
    trpc.clientRouter.getProgramWeekCalendar.useQuery({
      startDate: currentWeekStart.toISOString(),
      endDate: currentWeekEnd.toISOString(),
    });

  // Get pitching data
  const { data: pitchingData } = trpc.clientRouter.getPitchingData.useQuery();

  // Get video assignments
  const { data: videoAssignments = [] } =
    trpc.clientRouter.getVideoAssignments.useQuery();

  // Get next lesson
  const { data: nextLesson } = trpc.clientRouter.getNextLesson.useQuery();

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

  // Get day data from calendar data
  const getDayData = (date: Date): DayData | null => {
    if (!calendarData) return null;
    const dateString = date.toISOString().split("T")[0];
    return calendarData[dateString] || null;
  };

  // Get day data from week calendar data (for current week)
  const getWeekDayData = (date: Date): DayData | null => {
    const dateString = date.toISOString().split("T")[0];
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
    <ClientSidebar>
      <div className="min-h-screen" style={{ backgroundColor: "#2a3133" }}>
        {/* Header Section with Gradient Background */}
        <div className="mb-8 md:mb-12">
          <div
            className="rounded-2xl md:rounded-3xl p-4 md:p-8 mb-6 md:mb-8 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
              border: "1px solid #606364",
            }}
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: "linear-gradient(45deg, #4A5A70, #606364)",
                }}
              />
            </div>
            <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: "linear-gradient(45deg, #4A5A70, #606364)",
                }}
              />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
              <div className="flex-1">
                <h1 className="text-3xl md:text-6xl font-bold mb-2 md:mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
                  My Training Program
                </h1>
                <div
                  className="text-base md:text-xl flex items-center gap-3"
                  style={{ color: "#ABA4AA" }}
                >
                  <div
                    className="p-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <Dumbbell
                      className="h-4 w-4 md:h-5 md:w-5"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <span className="text-sm md:text-xl">
                    Track your progress and stay on schedule
                  </span>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setActiveTab("calendar")}
                    className="px-4 md:px-6 py-2 md:py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 touch-manipulation"
                    style={{
                      backgroundColor: "#10B981",
                      color: "#C3BCC2",
                    }}
                  >
                    <Calendar className="h-4 w-4" />
                    View Full Program Calendar
                  </button>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div
                  className="text-2xl md:text-4xl font-bold mb-2"
                  style={{ color: "#C3BCC2" }}
                >
                  {new Date().toLocaleDateString()}
                </div>
                <div
                  className="text-base md:text-lg px-3 md:px-4 py-1 md:py-2 rounded-full inline-block"
                  style={{
                    backgroundColor: "#4A5A70",
                    color: "#C3BCC2",
                  }}
                >
                  {new Date().toLocaleDateString("en-US", { weekday: "long" })}
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
                  id: "overview",
                  label: "Overview",
                  icon: <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />,
                },
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
                    setActiveTab(tab.id as "overview" | "calendar" | "progress")
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

          {/* Main Content Based on Active Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4 md:space-y-8">
              {/* Program Overview Cards */}
              {programInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                  <div
                    className="rounded-2xl md:rounded-3xl p-4 md:p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group touch-manipulation"
                    style={{
                      background:
                        "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                      borderColor: "#4A5A70",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div
                          className="p-3 rounded-2xl"
                          style={{ backgroundColor: "#4A5A70" }}
                        >
                          <BookOpen
                            className="h-8 w-8"
                            style={{ color: "#C3BCC2" }}
                          />
                        </div>
                        <span
                          className="text-4xl font-bold"
                          style={{ color: "#C3BCC2" }}
                        >
                          {programInfo.currentWeek}
                        </span>
                      </div>
                      <h3
                        className="text-xl font-bold mb-3"
                        style={{ color: "#C3BCC2" }}
                      >
                        Current Week
                      </h3>
                      <p className="text-base" style={{ color: "#ABA4AA" }}>
                        of {programInfo.totalWeeks} weeks
                      </p>
                    </div>
                  </div>

                  <div
                    className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
                    style={{
                      background:
                        "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                      borderColor: "#10B981",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div
                          className="p-3 rounded-2xl"
                          style={{ backgroundColor: "#10B981" }}
                        >
                          <TrendingUp
                            className="h-8 w-8"
                            style={{ color: "#C3BCC2" }}
                          />
                        </div>
                        <span
                          className="text-4xl font-bold"
                          style={{ color: "#C3BCC2" }}
                        >
                          {Math.round(programInfo.overallProgress)}%
                        </span>
                      </div>
                      <h3
                        className="text-xl font-bold mb-3"
                        style={{ color: "#C3BCC2" }}
                      >
                        Overall Progress
                      </h3>
                      <p className="text-base" style={{ color: "#ABA4AA" }}>
                        Program completion
                      </p>
                    </div>
                  </div>

                  <div
                    className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
                    style={{
                      background:
                        "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                      borderColor: "#F59E0B",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div
                          className="p-3 rounded-2xl"
                          style={{ backgroundColor: "#F59E0B" }}
                        >
                          <User
                            className="h-8 w-8"
                            style={{ color: "#C3BCC2" }}
                          />
                        </div>
                        <span
                          className="text-2xl font-bold"
                          style={{ color: "#C3BCC2" }}
                        >
                          {programInfo.coachName}
                        </span>
                      </div>
                      <h3
                        className="text-xl font-bold mb-3"
                        style={{ color: "#C3BCC2" }}
                      >
                        Your Coach
                      </h3>
                      <p className="text-base" style={{ color: "#ABA4AA" }}>
                        Professional guidance
                      </p>
                    </div>
                  </div>

                  <div
                    className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
                    style={{
                      background:
                        "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                      borderColor: "#8B5CF6",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div
                          className="p-3 rounded-2xl"
                          style={{ backgroundColor: "#8B5CF6" }}
                        >
                          <Award
                            className="h-8 w-8"
                            style={{ color: "#C3BCC2" }}
                          />
                        </div>
                        <span
                          className="text-4xl font-bold"
                          style={{ color: "#C3BCC2" }}
                        >
                          {programInfo.title}
                        </span>
                      </div>
                      <h3
                        className="text-xl font-bold mb-3"
                        style={{ color: "#C3BCC2" }}
                      >
                        Program Name
                      </h3>
                      <p className="text-base" style={{ color: "#ABA4AA" }}>
                        Active training plan
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* All Assigned Programs Section */}
              {programInfo && false && (
                <div
                  className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                    borderColor: "#4A5A70",
                  }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-3 rounded-2xl"
                        style={{ backgroundColor: "#4A5A70" }}
                      >
                        <BookOpen
                          className="h-6 w-6"
                          style={{ color: "#C3BCC2" }}
                        />
                      </div>
                      <h2
                        className="text-3xl font-bold"
                        style={{ color: "#C3BCC2" }}
                      >
                        All Your Programs
                      </h2>
                    </div>
                    <div
                      className="px-4 py-2 rounded-full"
                      style={{ backgroundColor: "#4A5A70" }}
                    >
                      <span
                        className="text-lg font-semibold"
                        style={{ color: "#C3BCC2" }}
                      >
                        Multiple Active
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[].map(
                      (
                        program: {
                          id: string;
                          title: string;
                          description: string | null;
                          startDate: string;
                          endDate: string;
                          currentWeek: number;
                          totalWeeks: number;
                          overallProgress: number;
                          coachName: string | null;
                          assignmentId: string;
                          assignedAt: string;
                        },
                        index: number
                      ) => (
                        <div
                          key={program.id}
                          className={`rounded-2xl p-6 transition-all duration-200 hover:scale-105 shadow-lg border ${
                            index === 0 ? "ring-2 ring-blue-500" : ""
                          }`}
                          style={{
                            backgroundColor: "#2B3038",
                            borderColor: index === 0 ? "#3B82F6" : "#4A5A70",
                            borderWidth: "1px",
                          }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3
                              className="text-lg font-bold"
                              style={{ color: "#C3BCC2" }}
                            >
                              {program.title}
                            </h3>
                            {index === 0 && (
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: "#3B82F6",
                                  color: "#ffffff",
                                }}
                              >
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span
                                className="text-sm"
                                style={{ color: "#ABA4AA" }}
                              >
                                Week:
                              </span>
                              <span
                                className="text-sm font-medium"
                                style={{ color: "#C3BCC2" }}
                              >
                                {program.currentWeek} of {program.totalWeeks}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span
                                className="text-sm"
                                style={{ color: "#ABA4AA" }}
                              >
                                Progress:
                              </span>
                              <span
                                className="text-sm font-medium"
                                style={{ color: "#C3BCC2" }}
                              >
                                {Math.round(program.overallProgress)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span
                                className="text-sm"
                                style={{ color: "#ABA4AA" }}
                              >
                                Started:
                              </span>
                              <span
                                className="text-sm font-medium"
                                style={{ color: "#C3BCC2" }}
                              >
                                {new Date(
                                  program.assignedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {program.description && (
                            <p
                              className="text-sm mt-3"
                              style={{ color: "#ABA4AA" }}
                            >
                              {program.description}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  <div
                    className="mt-6 p-4 rounded-xl"
                    style={{ backgroundColor: "#2B3038" }}
                  >
                    <p className="text-sm" style={{ color: "#ABA4AA" }}>
                      💡 <strong>Note:</strong> Your calendar shows workouts
                      from all assigned programs. The primary program
                      (highlighted) is your most recent assignment.
                    </p>
                  </div>
                </div>
              )}

              {/* This Week's Schedule */}
              <div
                className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden mb-8"
                style={{
                  background:
                    "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                  borderColor: "#4A5A70",
                }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-2xl"
                      style={{ backgroundColor: "#4A5A70" }}
                    >
                      <Calendar
                        className="h-6 w-6"
                        style={{ color: "#C3BCC2" }}
                      />
                    </div>
                    <h2
                      className="text-3xl font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      This Week&apos;s Schedule
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("calendar")}
                    className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                    style={{
                      backgroundColor: "#10B981",
                      color: "#C3BCC2",
                    }}
                  >
                    <Calendar className="h-4 w-4" />
                    View Full Calendar
                  </button>
                </div>

                {/* Weekly Schedule Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 md:gap-4">
                  {Array.from({ length: 7 }, (_, i) => {
                    const day = addDays(startOfWeek(new Date()), i);
                    const dayData = getWeekDayData(day);
                    const isTodayDay = isToday(day);
                    const dayName = format(day, "EEE");
                    const dayNumber = format(day, "d");

                    // Debug for this specific day
                    if (i === 0)
                      console.log("First day data:", {
                        day: day.toISOString(),
                        dayData,
                        weekCalendarData,
                      });

                    return (
                      <div
                        key={i}
                        className={`rounded-xl md:rounded-2xl p-2 md:p-4 transition-all duration-200 hover:scale-105 cursor-pointer touch-manipulation ${
                          isTodayDay ? "ring-2 ring-blue-500" : ""
                        }`}
                        style={{
                          backgroundColor: "#2B3038",
                          border: "1px solid #4A5A70",
                        }}
                        onClick={() => {
                          if (
                            dayData &&
                            (dayData.drills.length > 0 || dayData.isRestDay)
                          ) {
                            setSelectedDay(dayData);
                            setIsDaySheetOpen(true);
                          }
                        }}
                      >
                        <div className="text-center mb-3">
                          <div
                            className={`text-sm font-medium mb-1 ${
                              isTodayDay ? "text-blue-400" : "text-gray-400"
                            }`}
                          >
                            {dayName}
                          </div>
                          <div
                            className={`text-2xl font-bold ${
                              isTodayDay ? "text-blue-400" : "text-white"
                            }`}
                          >
                            {dayNumber}
                          </div>
                        </div>

                        {dayData ? (
                          dayData.isRestDay ? (
                            <div className="text-center">
                              <div className="text-2xl mb-1">🛌</div>
                              <div className="text-xs text-gray-400">Rest</div>
                            </div>
                          ) : dayData.drills.length > 0 ? (
                            <div className="space-y-2">
                              <div className="text-center">
                                <div
                                  className="text-xs font-medium"
                                  style={{ color: "#10B981" }}
                                >
                                  {dayData.completedDrills}/
                                  {dayData.totalDrills}
                                </div>
                              </div>
                              {dayData.drills
                                .slice(0, 2)
                                .map((drill, index) => (
                                  <div
                                    key={index}
                                    className={`text-xs p-2 rounded flex items-center justify-between transition-all duration-300 ${
                                      justCompletedDrills.has(drill.id)
                                        ? "scale-102"
                                        : ""
                                    }`}
                                    style={{
                                      backgroundColor: drill.completed
                                        ? "#1F2A1F"
                                        : "#1F2426",
                                      border: drill.completed
                                        ? "1px solid #10B981"
                                        : "1px solid #2A3133",
                                      boxShadow: justCompletedDrills.has(
                                        drill.id
                                      )
                                        ? "0 0 8px rgba(16, 185, 129, 0.3)"
                                        : "none",
                                    }}
                                  >
                                    <div className="flex-1">
                                      <div
                                        className="font-medium truncate flex items-center gap-2"
                                        style={{
                                          color: drill.completed
                                            ? "#10B981"
                                            : "#C3BCC2",
                                        }}
                                      >
                                        {drill.completed && (
                                          <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                        )}
                                        {drill.supersetId && (
                                          <div className="flex items-center gap-1 text-xs text-purple-300">
                                            <Link className="h-3 w-3" />
                                            <span className="font-medium">
                                              SUPERSET
                                            </span>
                                          </div>
                                        )}
                                        {drill.title}
                                      </div>
                                      {drill.sets && drill.reps && (
                                        <div
                                          className="text-xs"
                                          style={{ color: "#ABA4AA" }}
                                        >
                                          {drill.sets}×{drill.reps}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              {dayData.drills.length > 2 && (
                                <div className="text-center">
                                  <span
                                    className="text-xs"
                                    style={{ color: "#ABA4AA" }}
                                  >
                                    +{dayData.drills.length - 2} more
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center">
                              <div
                                className="text-xs"
                                style={{ color: "#606364" }}
                              >
                                No workouts
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="text-center">
                            <div
                              className="text-xs"
                              style={{ color: "#606364" }}
                            >
                              No program
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Guidance Text */}
                <div
                  className="mt-6 p-4 rounded-xl"
                  style={{ backgroundColor: "#2B3038" }}
                >
                  <p className="text-sm" style={{ color: "#ABA4AA" }}>
                    💡 <strong>Tip:</strong> Click on any day to see detailed
                    workouts, or use the &quot;Calendar&quot; tab above to view
                    your full program schedule for the entire month.
                  </p>
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Today's Workouts */}
                <div
                  className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                    borderColor: "#4A5A70",
                  }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-3 rounded-2xl"
                        style={{ backgroundColor: "#4A5A70" }}
                      >
                        <Target
                          className="h-6 w-6"
                          style={{ color: "#C3BCC2" }}
                        />
                      </div>
                      <h2
                        className="text-3xl font-bold"
                        style={{ color: "#C3BCC2" }}
                      >
                        Today&apos;s Plan
                      </h2>
                    </div>
                    <div
                      className="px-4 py-2 rounded-full"
                      style={{ backgroundColor: "#4A5A70" }}
                    >
                      <span
                        className="text-lg font-semibold"
                        style={{ color: "#C3BCC2" }}
                      >
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const today = new Date();
                    const todaysLessons = getLessonsForDate(today);
                    const todayData = getWeekDayData(today);

                    return (
                      <div className="space-y-6">
                        {/* Today's Lessons */}
                        {todaysLessons.length > 0 && (
                          <div className="space-y-4">
                            <h3
                              className="text-xl font-semibold"
                              style={{ color: "#C3BCC2" }}
                            >
                              📅 Scheduled Lessons
                            </h3>
                            {todaysLessons.map((lesson: any, index: number) => (
                              <div
                                key={index}
                                className="rounded-xl p-6 transition-all duration-200 hover:scale-102 shadow-lg border"
                                style={{
                                  backgroundColor: "#2B3038",
                                  borderColor: "#10B981",
                                  borderWidth: "1px",
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div
                                        className="p-2 rounded-full"
                                        style={{ backgroundColor: "#10B981" }}
                                      >
                                        <CalendarCheck
                                          className="h-4 w-4"
                                          style={{ color: "#C3BCC2" }}
                                        />
                                      </div>
                                      <h4
                                        className="text-lg font-semibold"
                                        style={{ color: "#C3BCC2" }}
                                      >
                                        {format(
                                          new Date(lesson.date),
                                          "h:mm a"
                                        )}
                                      </h4>
                                    </div>
                                    <p
                                      className="text-base mb-2"
                                      style={{ color: "#ABA4AA" }}
                                    >
                                      {lesson.title || "Lesson with Coach"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <User
                                        className="h-4 w-4"
                                        style={{ color: "#ABA4AA" }}
                                      />
                                      <span
                                        className="text-sm"
                                        style={{ color: "#ABA4AA" }}
                                      >
                                        {lesson.coach?.name || "Coach"}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                                    style={{
                                      backgroundColor: "#10B981",
                                      color: "#C3BCC2",
                                    }}
                                  >
                                    Join
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Today's Workouts */}
                        {todayData && !todayData.isRestDay && (
                          <div className="space-y-4">
                            <h3
                              className="text-xl font-semibold"
                              style={{ color: "#C3BCC2" }}
                            >
                              💪 Today&apos;s Workouts
                            </h3>
                            {todayData.drills.map(drill => (
                              <div
                                key={drill.id}
                                className={`rounded-xl p-6 transition-all duration-200 hover:scale-102 shadow-lg border ${
                                  justCompletedDrills.has(drill.id)
                                    ? "scale-102"
                                    : ""
                                }`}
                                style={{
                                  backgroundColor: drill.completed
                                    ? "#1F2A1F"
                                    : "#2B3038",
                                  borderColor: drill.completed
                                    ? "#10B981"
                                    : "#606364",
                                  borderWidth: drill.completed ? "2px" : "1px",
                                  boxShadow: justCompletedDrills.has(drill.id)
                                    ? "0 0 20px rgba(16, 185, 129, 0.5)"
                                    : "none",
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div
                                        className={`p-2 rounded-full ${
                                          drill.completed
                                            ? "bg-green-500"
                                            : "bg-gray-600"
                                        }`}
                                      >
                                        {drill.completed ? (
                                          <CheckCircle2
                                            className="h-4 w-4"
                                            style={{ color: "#C3BCC2" }}
                                          />
                                        ) : (
                                          <Dumbbell
                                            className="h-4 w-4"
                                            style={{ color: "#C3BCC2" }}
                                          />
                                        )}
                                      </div>
                                      <h4
                                        className="text-lg font-semibold flex items-center gap-2"
                                        style={{
                                          color: drill.completed
                                            ? "#10B981"
                                            : "#C3BCC2",
                                        }}
                                      >
                                        {drill.completed && (
                                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        )}
                                        {drill.supersetId && (
                                          <div className="flex items-center gap-1 text-xs text-purple-300">
                                            <Link className="h-3 w-3" />
                                            <span className="font-medium">
                                              SUPERSET
                                            </span>
                                          </div>
                                        )}
                                        {drill.title}
                                      </h4>
                                    </div>
                                    <div
                                      className="flex items-center gap-4 text-sm mb-3"
                                      style={{ color: "#ABA4AA" }}
                                    >
                                      {drill.sets && (
                                        <span>{drill.sets} sets</span>
                                      )}
                                      {drill.reps && (
                                        <span>{drill.reps} reps</span>
                                      )}
                                      {drill.tempo && (
                                        <span>Tempo: {drill.tempo}</span>
                                      )}
                                    </div>
                                    {drill.tags && drill.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {drill.tags.map((tag, index) => (
                                          <Badge
                                            key={index}
                                            variant="outline"
                                            className="text-xs"
                                            style={{
                                              borderColor: "#606364",
                                              color: "#ABA4AA",
                                            }}
                                          >
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <button
                                      onClick={() =>
                                        handleMarkDrillComplete(
                                          drill.id,
                                          !drill.completed
                                        )
                                      }
                                      className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                                        drill.completed
                                          ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                                          : "bg-gray-600 text-gray-300 hover:bg-gray-500 hover:shadow-lg"
                                      }`}
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    {drill.videoUrl && (
                                      <button className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200">
                                        <Play className="h-4 w-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        handleSubmitVideo(drill.id, drill.title)
                                      }
                                      className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200"
                                    >
                                      <Upload className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Rest Day */}
                        {todayData && todayData.isRestDay && (
                          <div className="text-center py-12">
                            <div className="text-6xl mb-4">🔋</div>
                            <h3
                              className="text-2xl font-bold mb-3"
                              style={{ color: "#C3BCC2" }}
                            >
                              Recharge Day
                            </h3>
                            <p
                              className="text-base mb-4"
                              style={{ color: "#F59E0B" }}
                            >
                              Take it easy and recover. You&apos;ve earned it!
                            </p>
                            <button
                              onClick={() => setActiveTab("calendar")}
                              className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto"
                              style={{
                                backgroundColor: "#4A5A70",
                                color: "#C3BCC2",
                              }}
                            >
                              <Calendar className="h-4 w-4" />
                              View Full Schedule
                            </button>
                          </div>
                        )}

                        {/* No Workouts Today */}
                        {!todayData && todaysLessons.length === 0 && (
                          <div className="text-center py-12">
                            <Target
                              className="w-16 h-16 mx-auto mb-6"
                              style={{ color: "#606364" }}
                            />
                            <h3
                              className="text-xl font-semibold mb-3"
                              style={{ color: "#C3BCC2" }}
                            >
                              No workouts assigned for today
                            </h3>
                            <p
                              className="text-base mb-4"
                              style={{ color: "#ABA4AA" }}
                            >
                              Check your full program schedule to see upcoming
                              workouts
                            </p>
                            <button
                              onClick={() => setActiveTab("calendar")}
                              className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto"
                              style={{
                                backgroundColor: "#10B981",
                                color: "#C3BCC2",
                              }}
                            >
                              <Calendar className="h-4 w-4" />
                              View Full Program
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Upcoming Schedule */}
                <div
                  className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                    borderColor: "#4A5A70",
                  }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-3 rounded-2xl"
                        style={{ backgroundColor: "#4A5A70" }}
                      >
                        <Calendar
                          className="h-6 w-6"
                          style={{ color: "#C3BCC2" }}
                        />
                      </div>
                      <h2
                        className="text-3xl font-bold"
                        style={{ color: "#C3BCC2" }}
                      >
                        Upcoming Schedule
                      </h2>
                    </div>
                  </div>

                  {(() => {
                    const now = new Date();
                    const upcomingLessons = clientLessons
                      .filter(
                        (lesson: { date: string }) =>
                          new Date(lesson.date) > now
                      )
                      .slice(0, 5);

                    return (
                      <div className="space-y-4">
                        {upcomingLessons.length > 0 ? (
                          upcomingLessons.map((lesson: any, index: number) => (
                            <div
                              key={index}
                              className="rounded-xl p-6 transition-all duration-200 hover:scale-102 shadow-lg border"
                              style={{
                                backgroundColor: "#2B3038",
                                borderColor: "#606364",
                                borderWidth: "1px",
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div
                                      className="p-2 rounded-full"
                                      style={{ backgroundColor: "#4A5A70" }}
                                    >
                                      <CalendarClock
                                        className="h-4 w-4"
                                        style={{ color: "#C3BCC2" }}
                                      />
                                    </div>
                                    <h4
                                      className="text-lg font-semibold"
                                      style={{ color: "#C3BCC2" }}
                                    >
                                      {format(
                                        new Date(lesson.date),
                                        "MMM d, h:mm a"
                                      )}
                                    </h4>
                                  </div>
                                  <p
                                    className="text-base mb-2"
                                    style={{ color: "#ABA4AA" }}
                                  >
                                    {lesson.title || "Lesson with Coach"}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <User
                                      className="h-4 w-4"
                                      style={{ color: "#ABA4AA" }}
                                    />
                                    <span
                                      className="text-sm"
                                      style={{ color: "#ABA4AA" }}
                                    >
                                      {lesson.coach?.name || "Coach"}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                                  style={{
                                    backgroundColor: "#4A5A70",
                                    color: "#C3BCC2",
                                  }}
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <CalendarX
                              className="w-16 h-16 mx-auto mb-6"
                              style={{ color: "#606364" }}
                            />
                            <h3
                              className="text-xl font-semibold mb-3"
                              style={{ color: "#C3BCC2" }}
                            >
                              No upcoming lessons
                            </h3>
                            <p
                              className="text-base"
                              style={{ color: "#ABA4AA" }}
                            >
                              Your schedule is clear for now
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

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
              <div className="grid grid-cols-7 gap-2 md:gap-6">
                {/* Day headers */}
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                  <div
                    key={day}
                    className="p-1 md:p-2 lg:p-8 text-center text-xs md:text-sm lg:text-2xl font-bold mb-1 md:mb-2 lg:mb-4"
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
                          "min-h-[100px] md:min-h-[200px] lg:min-h-[320px] p-1 md:p-2 lg:p-6 rounded-lg md:rounded-xl lg:rounded-3xl transition-all duration-500 cursor-pointer hover:scale-105 hover:shadow-2xl border-2 touch-manipulation",
                          isCurrentMonth
                            ? "bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 hover:bg-white/10 hover:shadow-xl"
                            : "bg-white/2 border-white/5",
                          isToday &&
                            "ring-4 ring-blue-500/30 border-blue-400/50 shadow-2xl bg-blue-500/10"
                        )}
                        onClick={() => {
                          if (
                            dayData &&
                            (dayData.drills.length > 0 || dayData.isRestDay)
                          ) {
                            setSelectedDay(dayData);
                            setIsDaySheetOpen(true);
                          }
                        }}
                      >
                        {/* Date Header */}
                        <div className="flex items-center justify-between mb-2 md:mb-6">
                          <span
                            className={cn(
                              "text-lg md:text-3xl font-bold",
                              isCurrentMonth ? "text-white" : "text-gray-500"
                            )}
                          >
                            {format(date, "d")}
                          </span>
                          {dayData && dayData.totalDrills > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-xs md:text-sm px-2 md:px-4 py-1 md:py-2 rounded-full font-bold shadow-lg"
                              style={{
                                background:
                                  "linear-gradient(135deg, #10B981, #059669)",
                                color: "#FFFFFF",
                              }}
                            >
                              {dayData.completedDrills}/{dayData.totalDrills}
                            </Badge>
                          )}
                        </div>

                        {/* Workout Details */}
                        {dayData &&
                          dayData.drills &&
                          dayData.drills.length > 0 && (
                            <div className="space-y-2 md:space-y-3">
                              {dayData.drills
                                .slice(0, 3)
                                .map((drill, drillIndex) => (
                                  <div
                                    key={drillIndex}
                                    className={`p-2 md:p-4 rounded-xl md:rounded-2xl cursor-pointer hover:bg-white/10 transition-all duration-300 hover:scale-102 backdrop-blur-sm ${
                                      justCompletedDrills.has(drill.id)
                                        ? "animate-pulse scale-105"
                                        : ""
                                    }`}
                                    style={{
                                      background: drill.completed
                                        ? "linear-gradient(135deg, #1F2A1F, #2A3A2A)"
                                        : "linear-gradient(135deg, #1F2426, #2A3133)",
                                      border: drill.completed
                                        ? "2px solid #10B981"
                                        : "1px solid #353A3A",
                                      boxShadow: justCompletedDrills.has(
                                        drill.id
                                      )
                                        ? "0 0 20px rgba(16, 185, 129, 0.5)"
                                        : "none",
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div
                                          className="font-semibold text-xs md:text-sm mb-1 md:mb-2 flex items-center gap-2"
                                          style={{
                                            color: drill.completed
                                              ? "#10B981"
                                              : "#FFFFFF",
                                          }}
                                        >
                                          {drill.completed && (
                                            <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
                                          )}
                                          {drill.supersetId && (
                                            <div className="flex items-center gap-1 text-xs text-purple-300">
                                              <Link className="h-3 w-3" />
                                              <span className="font-medium">
                                                SUPERSET
                                              </span>
                                            </div>
                                          )}
                                          {drill.title}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              {dayData.drills.length > 3 && (
                                <div className="text-center py-2 md:py-3">
                                  <span
                                    className="text-xs md:text-sm"
                                    style={{ color: "#ABA4AA" }}
                                  >
                                    +{dayData.drills.length - 3} more exercises
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                        {/* Rest Day Indicator */}
                        {dayData && dayData.isRestDay && (
                          <div className="flex items-center justify-center h-20 md:h-32 mt-2 md:mt-4">
                            <div
                              className="text-center p-2 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105"
                              style={{
                                background:
                                  "linear-gradient(135deg, #1F2426, #2A3133)",
                                border: "2px solid #F59E0B",
                                boxShadow:
                                  "0 4px 16px rgba(245, 158, 11, 0.15)",
                              }}
                            >
                              <div className="text-2xl md:text-3xl mb-1 md:mb-2">
                                🔋
                              </div>
                              <div className="font-bold text-white text-sm md:text-base mb-1">
                                Recharge Day
                              </div>
                              <div
                                className="text-xs md:text-sm"
                                style={{ color: "#F59E0B" }}
                              >
                                Recovery time
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Lessons */}
                        {lessonsForDay.length > 0 && (
                          <div className="mt-4 md:mt-6 space-y-2 md:space-y-3">
                            <div className="text-xs md:text-sm font-semibold text-blue-400 mb-2 md:mb-3">
                              📅 Lessons Today
                            </div>
                            {lessonsForDay.slice(0, 2).map(
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
                                  className="p-2 md:p-4 rounded-xl md:rounded-2xl"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #10B981, #059669)",
                                    border: "1px solid #059669",
                                  }}
                                >
                                  <div className="font-bold text-white text-xs md:text-sm">
                                    {format(new Date(lesson.date), "h:mm a")}
                                  </div>
                                  <div className="text-xs text-green-100 truncate">
                                    {lesson.title || "Lesson"}
                                  </div>
                                </div>
                              )
                            )}
                            {lessonsForDay.length > 2 && (
                              <div className="text-center">
                                <span className="text-xs md:text-sm text-gray-400">
                                  +{lessonsForDay.length - 2} more lessons
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Empty Day */}
                        {!dayData && isCurrentMonth && (
                          <div className="flex items-center justify-center h-20 md:h-40">
                            <div className="text-center">
                              <div className="text-gray-500 text-xs md:text-sm">
                                No program
                              </div>
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
              {/* Today's Plan */}
              <div
                className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                  borderColor: "#10B981",
                }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="p-3 rounded-2xl"
                    style={{ backgroundColor: "#10B981" }}
                  >
                    <Calendar
                      className="h-8 w-8"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <h2
                    className="text-3xl font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    Today's Plan
                  </h2>
                </div>

                {programInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2
                        className="h-6 w-6"
                        style={{ color: "#10B981" }}
                      />
                      <p className="text-lg" style={{ color: "#C3BCC2" }}>
                        You have a program scheduled!
                      </p>
                    </div>
                    <p className="text-base" style={{ color: "#ABA4AA" }}>
                      Complete your assigned workout and track your progress in
                      the Programs tab.
                    </p>
                    <button
                      onClick={() => setActiveTab("overview")}
                      className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                      style={{
                        backgroundColor: "#10B981",
                        color: "#C3BCC2",
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                      Go to Programs
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CalendarClock
                        className="h-6 w-6"
                        style={{ color: "#F59E0B" }}
                      />
                      <p className="text-lg" style={{ color: "#C3BCC2" }}>
                        No program scheduled today
                      </p>
                    </div>
                    <p className="text-base" style={{ color: "#ABA4AA" }}>
                      Take a rest day or work on your own pitching drills. Focus
                      on form and technique.
                    </p>
                  </div>
                )}
              </div>

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

              {/* Next Lesson */}
              <div
                className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
                  borderColor: "#F59E0B",
                }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="p-3 rounded-2xl"
                    style={{ backgroundColor: "#F59E0B" }}
                  >
                    <Calendar
                      className="h-8 w-8"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    Next Lesson
                  </h2>
                </div>

                {nextLesson ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg" style={{ color: "#ABA4AA" }}>
                        Date & Time
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: "#C3BCC2" }}
                      >
                        {new Date(nextLesson.date).toLocaleDateString()} at{" "}
                        {new Date(nextLesson.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {nextLesson.title && (
                      <div className="flex justify-between items-center">
                        <span className="text-lg" style={{ color: "#ABA4AA" }}>
                          Focus
                        </span>
                        <span
                          className="text-lg font-bold"
                          style={{ color: "#C3BCC2" }}
                        >
                          {nextLesson.title}
                        </span>
                      </div>
                    )}
                    {nextLesson.description && (
                      <div className="mt-4">
                        <span className="text-sm" style={{ color: "#ABA4AA" }}>
                          {nextLesson.description}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-lg mb-2" style={{ color: "#ABA4AA" }}>
                      No upcoming lessons scheduled
                    </div>
                    <div className="text-sm" style={{ color: "#606364" }}>
                      Contact your coach to schedule your next session
                    </div>
                  </div>
                )}
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

          {/* Day Detail Modal */}
          {isDaySheetOpen && selectedDay && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div
                className="bg-gray-800 rounded-3xl border-2 border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out"
                style={{
                  animation: "modalSlideIn 0.3s ease-out",
                }}
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {new Date(selectedDay.date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span>Assigned by {programInfo?.coachName}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDaySheetOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {selectedDay.isRestDay ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🔋</div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Recharge Day
                      </h3>
                      <p className="text-lg" style={{ color: "#F59E0B" }}>
                        Take it easy and recover
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Drills List */}
                      <div className="space-y-4">
                        {selectedDay.drills.map(drill => (
                          <div
                            key={drill.id}
                            className={`rounded-2xl p-6 border ${
                              drill.supersetId
                                ? "bg-purple-600/30 border-purple-500/50"
                                : "bg-gray-700 border-gray-600"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-xl font-bold text-white">
                                    {drill.title}
                                  </h3>
                                  {drill.supersetId && (
                                    <div className="flex items-center gap-1 text-xs text-purple-300">
                                      <Link className="h-4 w-4" />
                                      <span className="font-medium">
                                        SUPERSET
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Sets, Reps, Tempo */}
                                <div className="flex items-center gap-6 mb-3">
                                  {drill.sets && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-400">
                                        Sets:
                                      </span>
                                      <span className="text-white font-semibold">
                                        {drill.sets}
                                      </span>
                                    </div>
                                  )}
                                  {drill.reps && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-400">
                                        Reps:
                                      </span>
                                      <span className="text-white font-semibold">
                                        {drill.reps}
                                      </span>
                                    </div>
                                  )}
                                  {drill.tempo && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-400">
                                        Tempo:
                                      </span>
                                      <span className="text-white font-semibold">
                                        {drill.tempo}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Tags */}
                                {drill.tags && drill.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {drill.tags.map((tag, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs border-blue-500 text-blue-400"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Video URL if available */}
                                {drill.videoUrl && (
                                  <div className="mb-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        console.log(
                                          "🔘 Watch Demo button clicked!"
                                        );
                                        console.log("🔍 Drill data:", drill);
                                        console.log(
                                          "🔍 Drill videoUrl:",
                                          drill.videoUrl
                                        );

                                        if (drill.videoUrl) {
                                          console.log(
                                            "✅ Calling handleOpenVideo with:",
                                            drill.videoUrl
                                          );
                                          handleOpenVideo(
                                            drill.videoUrl,
                                            drill
                                          );
                                        } else {
                                          console.log(
                                            "❌ No videoUrl found in drill"
                                          );
                                        }
                                      }}
                                      className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                                    >
                                      <Play className="h-4 w-4 mr-2" />
                                      Watch Demo
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    console.log(
                                      "🔘 Checkmark button clicked for drill:",
                                      drill.id,
                                      "current status:",
                                      drill.completed
                                    );
                                    handleMarkDrillComplete(
                                      drill.id,
                                      !drill.completed
                                    );
                                  }}
                                  className={cn(
                                    "h-10 w-10 p-0 rounded-xl transition-all duration-300 transform hover:scale-110",
                                    drill.completed
                                      ? "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25"
                                      : "bg-gray-600 text-gray-300 hover:bg-gray-500 hover:shadow-lg"
                                  )}
                                >
                                  <Check className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>

                            {/* Comment Section */}
                            <div className="border-t border-gray-600 pt-4">
                              <div className="flex items-center gap-3 mb-3">
                                <MessageSquare className="h-5 w-5 text-blue-400" />
                                <h4 className="font-semibold text-white">
                                  Add Comment
                                </h4>
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDrillForVideo({
                                      id: drill.id,
                                      title: drill.title,
                                    });
                                    setIsVideoSubmissionModalOpen(true);
                                  }}
                                  className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                                >
                                  <Video className="h-4 w-4 mr-2" />
                                  Record Video
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenCommentModal(drill)}
                                  className="border-gray-500 text-gray-400 hover:bg-gray-600"
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Add Note
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mark All Complete Button */}
                      <Button
                        onClick={handleMarkAllComplete}
                        className="w-full py-4 text-lg font-semibold rounded-2xl"
                        disabled={
                          selectedDay.completedDrills ===
                          selectedDay.totalDrills
                        }
                        style={{
                          backgroundColor:
                            selectedDay.completedDrills ===
                            selectedDay.totalDrills
                              ? "#10B981"
                              : "#4A5A70",
                        }}
                      >
                        <Check className="h-5 w-5 mr-2" />
                        {selectedDay.completedDrills === selectedDay.totalDrills
                          ? "All Complete!"
                          : "Mark All Complete"}
                      </Button>

                      {/* Note to Coach */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-white text-lg">
                          Note to Coach
                        </h4>
                        <Textarea
                          placeholder="Add a note about your workout..."
                          value={noteToCoach}
                          onChange={(
                            e: React.ChangeEvent<HTMLTextAreaElement>
                          ) => setNoteToCoach(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-xl"
                          rows={4}
                        />
                        <Button
                          onClick={handleSendNote}
                          disabled={!noteToCoach.trim() || isSubmittingNote}
                          className="w-full py-3 rounded-xl"
                          style={{ backgroundColor: "#10B981" }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSubmittingNote ? "Sending..." : "Send Note"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
        </div>
      </div>
    </ClientSidebar>
  );
}

export default withMobileDetection(MobileClientProgramPage, ClientProgramPage);
