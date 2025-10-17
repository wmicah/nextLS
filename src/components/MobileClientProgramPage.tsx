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
    trpc.clientRouter.markDrillComplete.useMutation();
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
  const { data: routineAssignments = [] } =
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

  // Initialize completion state from server data
  useEffect(() => {
    if (selectedDay?.programs) {
      const serverCompletedDrills = new Set<string>();
      selectedDay.programs.forEach(program => {
        program.drills.forEach(drill => {
          if (drill.completed) {
            serverCompletedDrills.add(drill.id);
          }
        });
      });
      setCompletedProgramDrills(serverCompletedDrills);
    }
  }, [selectedDay]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleDateClick = (day: Date) => {
    const dayString = format(day, "yyyy-MM-dd");
    let dayData: DayData | undefined;

    // First, try to get program data from calendarData
    if (calendarData) {
      if (Array.isArray(calendarData)) {
        dayData = calendarData.find((d: DayData) => d.date === dayString);
      } else if (typeof calendarData === "object") {
        dayData = (calendarData as any)[dayString];
      }
    }

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
        setSelectedDay(dayData);
        setSelectedDate(day);
        setSelectedDayRoutineAssignments(dayRoutineAssignments);
        setIsDayModalOpen(true);
      }
    }
  };

  // Handler functions for day modal
  const handleMarkDrillComplete = async (
    drillId: string,
    completed: boolean
  ) => {
    setCompletedProgramDrills(prev => {
      const newSet = new Set(prev);
      if (completed) {
        newSet.add(drillId);
      } else {
        newSet.delete(drillId);
      }
      return newSet;
    });

    try {
      await markDrillCompleteMutation.mutateAsync({
        drillId,
        completed,
      });
    } catch (error) {
      console.error("Failed to update drill completion:", error);
      // Revert optimistic update on error
      setCompletedProgramDrills(prev => {
        const newSet = new Set(prev);
        if (completed) {
          newSet.delete(drillId);
        } else {
          newSet.add(drillId);
        }
        return newSet;
      });
    }
  };

  const handleMarkAllComplete = async () => {
    if (!selectedDay) return;

    if (confirm("Mark all drills for this day as complete?")) {
      const allDrillIds = selectedDay.drills.map(drill => drill.id);
      allDrillIds.forEach(drillId => {
        handleMarkDrillComplete(drillId, true);
      });
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
    console.log("Opening video for routine exercise:", {
      videoUrl,
      drill,
      isYoutube: drill.isYoutube,
      youtubeId: drill.youtubeId,
      fullDrillData: drill,
    });

    // Note: utfs.io URLs are failing to load - likely CORS or URL format issue

    setSelectedVideo({
      id: drill.id,
      title: drill.title,
      url: videoUrl,
      isYoutube: drill.isYoutube,
      youtubeId: drill.youtubeId,
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
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1F2426] to-[#2A3133] border border-[#4A5A70] shadow-xl">
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
                            className={`w-2 h-2 rounded-full flex items-center justify-center text-[6px] font-bold shadow-sm border ${
                              indicator.isRestDay
                                ? "bg-orange-500 text-white border-orange-400"
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
                            {indicator.isRestDay ? "R" : indicator.remaining}
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
          selectedDay={selectedDay}
          selectedDate={selectedDate}
          programs={selectedDay?.programs || []}
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
          onMarkRoutineExerciseComplete={(
            exerciseId: string,
            routineAssignmentId: string,
            completed: boolean
          ) => {
            // Handle routine exercise completion if needed
            console.log(
              "Routine exercise completion:",
              exerciseId,
              routineAssignmentId,
              completed
            );
          }}
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
