"use client";

import React, { useState } from "react";
import {
  X,
  BookOpen,
  Target,
  CheckCircle2,
  Clock,
  Play,
  MessageSquare,
  Video,
  Send,
  AlertCircle,
  Calendar,
  Zap,
  Dumbbell,
  Check,
  Link,
  FileText,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { extractYouTubeId, isYouTubeUrl } from "@/lib/youtube-utils";
import { trpc } from "@/app/_trpc/client";
import { useExerciseCompletion } from "@/hooks/useExerciseCompletion";

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
  description?: string;
  // Superset description fields
  supersetDescription?: string;
  supersetInstructions?: string;
  supersetNotes?: string;
  // Coach Instructions
  coachInstructions?: {
    whatToDo: string;
    howToDoIt: string;
    keyPoints: string[];
    commonMistakes: string[];
    equipment?: string;
  };
  // Routine exercise properties
  isRoutineExercise?: boolean;
  routineAssignmentId?: string;
  originalExerciseId?: string;
  // New properties for routine drill handling
  isRoutineDrill?: boolean;
  routineExpansionNote?: string;
  isProgramRoutineExercise?: boolean;
  programDrillId?: string;
  // Program drill routine property
  routine?: {
    id: string;
    name: string;
    exercises: any[];
  };
  // Backend properties
  routineId?: string;
  videoId?: string;
  originalDrillId?: string;
  // Video properties
  isYoutube?: boolean;
  youtubeId?: string;
}

interface DayData {
  date: string;
  drills: Drill[];
  isRestDay: boolean;
  expectedTime: number;
  completedDrills: number;
  totalDrills: number;
  videoAssignments?: any[];
}

interface ProgramInfo {
  id: string;
  title: string;
  description: string | null;
  weeks: any[];
  duration: number;
  level: string;
  sport: string | null;
  createdAt: string;
  updatedAt: string;
  coachId: string;
  coachName: string;
}

interface RoutineAssignment {
  id: string;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  assignedAt: string;
  startDate: string | null;
  completedAt: string | null;
  progress: number;
  routine: {
    id: string;
    description: string | null;
    name: string;
    coachId: string;
    createdAt: string;
    updatedAt: string;
    exercises: {
      id: string;
      title: string;
      description: string | null;
      type: string | null;
      sets?: number | null;
      reps?: number | null;
      tempo?: string | null;
      duration?: string | null;
      order: number;
      routineId: string;
      createdAt: string;
      updatedAt: string;
      notes?: string | null;
      videoId?: string | null;
      videoUrl?: string | null;
      videoTitle?: string | null;
      videoThumbnail?: string | null;
      supersetId?: string | null;
      supersetOrder?: number | null;
    }[];
  };
  routineId: string;
}

interface ClientProgramDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDay: DayData | null;
  selectedDate?: Date | null; // New prop for the actual clicked date
  programs?: ProgramData[]; // Changed from single programInfo to array of programs
  routineAssignments?: RoutineAssignment[];
  lessonsForDate?: any[]; // Lessons scheduled for this date
  onMarkDrillComplete: (
    drillId: string,
    completed: boolean,
    programAssignmentId?: string
  ) => void;
  onMarkVideoAssignmentComplete: (
    assignmentId: string,
    completed: boolean
  ) => void;
  onMarkAllComplete: () => void;
  onOpenVideo: (videoUrl: string, drill: Drill) => void;
  onOpenCommentModal: (drill: Drill) => void;
  onOpenVideoSubmissionModal: (drillId: string, drillTitle: string) => void;
  onSendNote: (note: string) => void;
  noteToCoach: string;
  setNoteToCoach: (note: string) => void;
  isSubmittingNote: boolean;
  completedVideoAssignments: Set<string>;
  calculateDayCompletionCounts: (
    dayData: DayData | null,
    selectedDate: Date | null
  ) => { totalDrills: number; completedDrills: number };
  calculateDayAssignmentCounts: (
    dayData: DayData | null,
    selectedDate: Date | null
  ) => { totalAssignments: number; completedAssignments: number };
  onMarkRoutineExerciseComplete: (
    exerciseId: string,
    programDrillId: string,
    completed: boolean
  ) => void;
  isLoadingDetails?: boolean;
  detailsError?: any;
}

interface Tab {
  id: string;
  title: string;
  type: "program" | "routine";
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

// Helper function to format date in local timezone
const formatDateKey = (date: Date | null | undefined): string | undefined => {
  if (!date) return undefined;
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
};

export default function ClientProgramDayModal({
  isOpen,
  onClose,
  selectedDay,
  selectedDate,
  programs = [],
  routineAssignments = [],
  lessonsForDate = [],
  onMarkDrillComplete,
  onMarkVideoAssignmentComplete,
  onMarkAllComplete,
  onOpenVideo,
  onOpenCommentModal,
  onOpenVideoSubmissionModal,
  onSendNote,
  noteToCoach,
  setNoteToCoach,
  isSubmittingNote,
  completedVideoAssignments,
  calculateDayCompletionCounts,
  calculateDayAssignmentCounts,
  onMarkRoutineExerciseComplete,
  isLoadingDetails = false,
  detailsError,
}: ClientProgramDayModalProps) {
  const [activeTab, setActiveTab] = useState<string>("");
  const [viewedTabs, setViewedTabs] = useState<Set<string>>(new Set());

  // Use the new completion system
  const { isExerciseCompleted, markExerciseComplete } = useExerciseCompletion();

  // Calculate total completion counts for the day
  const { totalDrills, completedDrills } = calculateDayCompletionCounts(
    selectedDay,
    selectedDate || null
  );

  // Calculate assignment-level completion counts for the day header
  const { totalAssignments, completedAssignments } =
    calculateDayAssignmentCounts(selectedDay, selectedDate || null);

  // Generate tabs for the selected day
  const generateTabs = (): Tab[] => {
    const tabs: Tab[] = [];

    // Debug logging
    console.log("ClientProgramDayModal - programs:", programs);
    console.log("ClientProgramDayModal - programs.length:", programs?.length);

    // Add program tabs for each program
    if (programs && programs.length > 0) {
      // Check if there are any non-rest-day programs (workouts) OR routines
      const hasWorkouts = programs.some(program => !program.isRestDay);
      const hasRoutines = routineAssignments && routineAssignments.length > 0;
      const hasActiveContent = hasWorkouts || hasRoutines;

      programs.forEach((program, index) => {
        // Hide rest days if there are actual workouts or routines scheduled
        // This prevents clients from seeing conflicting "rest day" + "workout/routine" on same day
        if (program.isRestDay && hasActiveContent) {
          return; // Skip rest days when active content exists
        }

        console.log("ClientProgramDayModal - processing program:", {
          programId: program.programId,
          programTitle: program.programTitle,
          isRestDay: program.isRestDay,
        });

        tabs.push({
          id: `program-${program.programId}`,
          title: program.programTitle,
          type: "program",
          icon: <BookOpen className="h-4 w-4" />,
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
          borderColor: "border-blue-400/30",
        });
      });
    }

    // Add routine tabs for standalone routines (not integrated into programs)
    if (routineAssignments && routineAssignments.length > 0) {
      routineAssignments.forEach((assignment: any) => {
        tabs.push({
          id: `routine-${assignment.id}`,
          title: assignment.routine.name,
          type: "routine",
          icon: <BookOpen className="h-4 w-4" />,
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
          borderColor: "border-blue-400/30",
        });
      });
    }

    console.log("ClientProgramDayModal - generated tabs:", tabs);
    return tabs;
  };

  const tabs = generateTabs();

  // Set active tab to first unviewed tab, or first tab if all viewed
  React.useEffect(() => {
    console.log("ClientProgramDayModal - useEffect for activeTab:", {
      tabsLength: tabs.length,
      activeTab,
      firstTab: tabs[0]?.id,
    });
    if (tabs.length > 0 && !activeTab) {
      const unviewedTab = tabs.find(tab => !viewedTabs.has(tab.id));
      const selectedTab = unviewedTab ? unviewedTab.id : tabs[0].id;
      console.log("ClientProgramDayModal - setting activeTab to:", selectedTab);
      setActiveTab(selectedTab);
    }
  }, [tabs, activeTab, viewedTabs]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setViewedTabs(prev => new Set([...prev, tabId]));
  };

  const handleClose = () => {
    setActiveTab("");
    setViewedTabs(new Set());
    onClose();
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const unviewedCount = tabs.filter(tab => !viewedTabs.has(tab.id)).length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 no-animations"
      style={{
        animation: "none !important",
        transition: "none !important",
        transform: "none !important",
        opacity: "1 !important",
      }}
    >
      <div
        className="bg-gray-800 rounded-3xl border-2 border-gray-600 w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col no-animations"
        style={{
          animation: "none !important",
          transition: "none !important",
          transform: "none !important",
          opacity: "1 !important",
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                {(() => {
                  // Use selectedDate if available, otherwise fall back to selectedDay.date
                  let dateToUse: Date;
                  if (selectedDate) {
                    dateToUse = selectedDate;
                  } else if (selectedDay?.date) {
                    // Parse date string as local time to avoid timezone shifts
                    const [year, month, day] = selectedDay.date
                      .split("-")
                      .map(Number);
                    dateToUse = new Date(year, month - 1, day);
                  } else {
                    dateToUse = new Date();
                  }
                  const formattedDate = format(dateToUse, "EEEE, MMMM d, yyyy");

                  return formattedDate;
                })()}
              </h2>
              {/* Completion Counter */}
              {totalDrills > 0 && (
                <div className="flex items-center gap-2 text-sm mt-1">
                  {completedDrills === totalDrills ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-semibold">
                        All completed.
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">
                        {completedDrills}/{totalDrills} exercises completed
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        {tabs.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-700 bg-gray-900/50 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-gray-300">
                Today's Assignments:
              </h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map(tab => {
                const isActive = tab.id === activeTab;
                const isViewed = viewedTabs.has(tab.id);

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border",
                      isActive
                        ? `${tab.bgColor} ${tab.color} ${tab.borderColor}`
                        : "bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50"
                    )}
                  >
                    {tab.icon}
                    <span>{tab.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 pb-6 overflow-y-auto flex-1">
          {isLoadingDetails ? (
            // Loading state for detailed data
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <p className="text-gray-300 text-sm">
                Loading workout details...
              </p>
            </div>
          ) : detailsError ? (
            // Error state
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-red-300 text-sm">
                Failed to load workout details
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-xs"
              >
                Retry
              </Button>
            </div>
          ) : tabs.length === 0 && lessonsForDate.length > 0 ? (
            // Show lessons when there are no programs/routines but there are lessons
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">
                Scheduled Lessons
              </h3>
              {lessonsForDate.map((lesson: any, index: number) => {
                const isScheduleRequest = lesson.title
                  ?.toLowerCase()
                  .includes("schedule request");

                return (
                  <div
                    key={lesson.id || index}
                    className={`p-4 rounded-xl border-2 ${
                      isScheduleRequest
                        ? "bg-blue-500/20 border-blue-400/50"
                        : "bg-green-600/40 border-green-400/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock
                            className={`h-5 w-5 ${
                              isScheduleRequest
                                ? "text-blue-300"
                                : "text-green-300"
                            }`}
                          />
                          <span
                            className={`font-semibold ${
                              isScheduleRequest
                                ? "text-blue-200"
                                : "text-green-200"
                            }`}
                          >
                            {new Date(lesson.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h4
                          className={`text-lg font-bold mb-1 ${
                            isScheduleRequest
                              ? "text-blue-100"
                              : "text-green-100"
                          }`}
                        >
                          {lesson.title || "Lesson"}
                        </h4>
                        {lesson.description && (
                          <p
                            className={`text-sm ${
                              isScheduleRequest
                                ? "text-blue-200/80"
                                : "text-green-200/80"
                            }`}
                          >
                            {lesson.description}
                          </p>
                        )}
                        {(lesson as any).coach && (
                          <p
                            className={`text-sm mt-2 ${
                              isScheduleRequest
                                ? "text-blue-200"
                                : "text-green-200"
                            }`}
                          >
                            Coach: {(lesson as any).coach.name}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          lesson.status === "CONFIRMED"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          lesson.status === "CONFIRMED" ? "bg-green-600" : ""
                        }
                      >
                        {lesson.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : currentTab?.type === "program" ? (
            (() => {
              // Find the specific program for this tab
              const programId = currentTab.id.replace("program-", "");
              console.log("ClientProgramDayModal - looking for program:", {
                currentTabId: currentTab.id,
                extractedProgramId: programId,
                programs: programs.map(p => ({
                  programId: p.programId,
                  programTitle: p.programTitle,
                })),
              });
              const program = programs.find(p => p.programId === programId);

              if (!program) {
                console.log(
                  "ClientProgramDayModal - program not found for programId:",
                  programId
                );
                return <div>Program not found</div>;
              }

              return program.isRestDay ? (
                <RestDayContent programTitle={program.programTitle} />
              ) : (
                <ProgramContent
                  program={program}
                  onMarkDrillComplete={onMarkDrillComplete}
                  onOpenVideo={onOpenVideo}
                  onOpenCommentModal={onOpenCommentModal}
                  onOpenVideoSubmissionModal={onOpenVideoSubmissionModal}
                  routineAssignments={routineAssignments}
                  onMarkRoutineExerciseComplete={onMarkRoutineExerciseComplete}
                  isExerciseCompleted={isExerciseCompleted}
                  markExerciseComplete={markExerciseComplete}
                  selectedDate={selectedDate}
                />
              );
            })()
          ) : currentTab?.type === "routine" ? (
            (() => {
              console.log("🎯 Looking for routine assignment:", {
                currentTabId: currentTab.id,
                routineAssignments: routineAssignments.map(a => ({
                  id: a.id,
                  tabId: `routine-${a.id}`,
                })),
              });

              const foundAssignment = routineAssignments.find(
                assignment => `routine-${assignment.id}` === currentTab.id
              );

              console.log("🎯 Found routine assignment:", !!foundAssignment);

              return (
                <RoutineContent
                  routineAssignment={foundAssignment}
                  onMarkDrillComplete={onMarkDrillComplete}
                  onMarkRoutineExerciseComplete={onMarkRoutineExerciseComplete}
                  onOpenVideo={onOpenVideo}
                  onOpenCommentModal={onOpenCommentModal}
                  onOpenVideoSubmissionModal={onOpenVideoSubmissionModal}
                  isExerciseCompleted={isExerciseCompleted}
                  markExerciseComplete={markExerciseComplete}
                  selectedDate={selectedDate}
                />
              );
            })()
          ) : null}

          {/* Video Assignments - Show regardless of programs/routines */}
          {selectedDay?.videoAssignments &&
            selectedDay.videoAssignments.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Video Assignments
                </h3>
                {selectedDay.videoAssignments.map(
                  (assignment: any, index: number) => (
                    <VideoAssignmentCard
                      key={assignment.id || index}
                      assignment={{
                        ...assignment,
                        completed: completedVideoAssignments.has(assignment.id),
                      }}
                      index={index}
                      onMarkComplete={completed => {
                        onMarkVideoAssignmentComplete(assignment.id, completed);
                      }}
                      onOpenVideo={() =>
                        assignment.videoUrl &&
                        onOpenVideo(assignment.videoUrl, {
                          id: assignment.id,
                          title: assignment.title,
                          videoUrl: assignment.videoUrl,
                        })
                      }
                      onOpenComment={() =>
                        onOpenCommentModal({
                          id: assignment.id,
                          title: assignment.title,
                          description: assignment.description,
                        })
                      }
                      onOpenVideoSubmission={() =>
                        onOpenVideoSubmissionModal(
                          assignment.id,
                          assignment.title
                        )
                      }
                    />
                  )
                )}
              </div>
            )}

          {/* Show "Nothing scheduled" only if there are no programs, routines, lessons, OR video assignments */}
          {tabs.length === 0 &&
            lessonsForDate.length === 0 &&
            (!selectedDay?.videoAssignments ||
              selectedDay.videoAssignments.length === 0) && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">
                  Nothing scheduled for this day
                </p>
                <p className="text-gray-500 text-sm">
                  Check back later for updates from your coach
                </p>
              </div>
            )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 pb-6 border-t border-gray-700 bg-gray-900/50 flex-shrink-0">
          <div className="space-y-3">
            {/* Progress Footer */}
            {tabs.length > 1 && (
              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    {viewedTabs.size} of {tabs.length} assignments viewed
                  </div>
                  {unviewedCount > 0 && (
                    <button
                      onClick={() => {
                        setViewedTabs(new Set(tabs.map(tab => tab.id)));
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Mark all as viewed
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Rest Day Content Component
function RestDayContent({ programTitle }: { programTitle: string }) {
  return (
    <div className="text-center py-16">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
            <span className="text-2xl"></span>
          </div>
        </div>
      </div>
      <h3 className="text-3xl font-bold text-white mb-4">Rest Day</h3>
      <p className="text-lg text-orange-300 mb-2">Time to Recharge & Recover</p>
      <p className="text-gray-400 max-w-md mx-auto">Enjoy your day off.</p>
    </div>
  );
}

// Program Content Component
function ProgramContent({
  program,
  onMarkDrillComplete,
  onOpenVideo,
  onOpenCommentModal,
  onOpenVideoSubmissionModal,
  routineAssignments = [],
  onMarkRoutineExerciseComplete,
  isExerciseCompleted,
  markExerciseComplete,
  selectedDate,
}: {
  program: ProgramData;
  onMarkDrillComplete: (
    drillId: string,
    completed: boolean,
    programAssignmentId?: string
  ) => void;
  onOpenVideo: (videoUrl: string, drill: Drill) => void;
  onOpenCommentModal: (drill: Drill) => void;
  onOpenVideoSubmissionModal: (drillId: string, drillTitle: string) => void;
  routineAssignments?: any[];
  onMarkRoutineExerciseComplete?: (
    exerciseId: string,
    routineAssignmentId: string,
    completed: boolean
  ) => void;
  isExerciseCompleted: (
    exerciseId: string,
    programDrillId?: string,
    date?: string
  ) => boolean;
  markExerciseComplete: (
    exerciseId: string,
    programDrillId: string | undefined,
    completed: boolean,
    date?: string
  ) => Promise<void>;
  selectedDate?: Date | null;
}) {
  // Combine program drills with routine exercises
  const allExercises: Drill[] = [];

  // Debug: Log what we receive from the backend
  console.log("🔍 Program drills from backend:", {
    totalDrills: program.drills.length,
    drills: program.drills.map((d: any) => ({
      id: d.id,
      title: d.title,
      hasSupersetId: !!d.supersetId,
      supersetId: d.supersetId,
      supersetOrder: d.supersetOrder,
      hasRoutineId: !!d.routineId,
      hasRoutine: !!d.routine,
      routineExerciseCount: d.routine?.exercises?.length || 0,
      routineExercisesWithSuperset:
        d.routine?.exercises?.filter((e: any) => e.supersetId)?.length || 0,
    })),
  });

  // First, add all regular drills (non-routine drills)
  program.drills.forEach((drill: any) => {
    // Skip drills that should be routines but aren't properly linked
    const shouldBeRoutine =
      !drill.routineId &&
      !drill.routine &&
      (drill.title.toLowerCase().includes("routine") ||
        drill.title.toLowerCase().includes("workout") ||
        drill.title.toLowerCase().includes("session"));

    console.log("🔍 Processing drill:", {
      id: drill.id,
      title: drill.title,
      hasRoutineId: !!drill.routineId,
      hasRoutine: !!drill.routine,
      hasSupersetId: !!drill.supersetId,
      supersetId: drill.supersetId,
      supersetOrder: drill.supersetOrder,
      shouldBeRoutine,
      willBeAdded: !shouldBeRoutine,
    });

    if (!shouldBeRoutine) {
      // This is a regular drill, add it as-is
      const regularDrill: Drill = {
        id: drill.id,
        title: drill.title,
        description: drill.description || undefined,
        sets: drill.sets || undefined,
        reps: drill.reps || undefined,
        tempo: drill.tempo || undefined,
        tags: drill.tags || undefined,
        completed: isExerciseCompleted(drill.id),
        videoUrl: drill.videoUrl || undefined,
        isYoutube: isYouTubeUrl(drill.videoUrl || ""),
        youtubeId: extractYouTubeId(drill.videoUrl || "") || undefined,
        // Superset/Circuit fields
        supersetId: drill.supersetId || undefined,
        supersetOrder: drill.supersetOrder || undefined,
        supersetDescription: drill.supersetDescription || undefined,
        supersetInstructions: drill.supersetInstructions || undefined,
        supersetNotes: drill.supersetNotes || undefined,
      };
      allExercises.push(regularDrill);
      console.log("✅ Added regular drill to allExercises:", {
        id: regularDrill.id,
        title: regularDrill.title,
        supersetId: regularDrill.supersetId,
        supersetOrder: regularDrill.supersetOrder,
      });
    } else {
      console.log("⏭️ Skipping drill (shouldBeRoutine):", drill.title);
    }
  });

  // Add routine exercises from standalone routine assignments
  routineAssignments.forEach((assignment: any) => {
    if (assignment.routine && assignment.routine.exercises) {
      assignment.routine.exercises.forEach((exercise: any) => {
        const routineExerciseKey = `${assignment.id}-${exercise.id}`;
        const drillLikeExercise: Drill = {
          id: routineExerciseKey,
          title: exercise.title,
          description: exercise.description || undefined,
          sets: exercise.sets || undefined,
          reps: exercise.reps || undefined,
          tempo: exercise.tempo || undefined,
          tags: exercise.type ? [exercise.type] : undefined,
          completed: isExerciseCompleted(exercise.id, assignment.id),
          videoUrl: exercise.videoUrl || undefined,
          isYoutube: isYouTubeUrl(exercise.videoUrl || ""),
          youtubeId: extractYouTubeId(exercise.videoUrl || "") || undefined,
          // Superset/Circuit fields
          supersetId: exercise.supersetId || undefined,
          supersetOrder: exercise.supersetOrder || undefined,
          supersetDescription: exercise.supersetDescription || undefined,
          supersetInstructions: exercise.supersetInstructions || undefined,
          supersetNotes: exercise.supersetNotes || undefined,
        };

        allExercises.push(drillLikeExercise);
      });
    }
  });

  // Check if any drill has a routine property (from the relation we added)
  const drillsWithRoutines = program.drills.filter(
    (drill: any) => drill.routine && drill.routine.exercises
  );

  console.log("🎬 CHECKING ROUTINE VIDEO DATA:", {
    totalDrills: program.drills.length,
    drillsWithRoutines: drillsWithRoutines.length,
    firstRoutineDrill: drillsWithRoutines[0]
      ? {
          drillId: drillsWithRoutines[0].id,
          routineId: drillsWithRoutines[0].routineId,
          exerciseCount: drillsWithRoutines[0].routine?.exercises?.length || 0,
          firstExercise: drillsWithRoutines[0].routine?.exercises?.[0]
            ? {
                id: drillsWithRoutines[0].routine.exercises[0].id,
                title: drillsWithRoutines[0].routine.exercises[0].title,
                videoUrl: drillsWithRoutines[0].routine.exercises[0].videoUrl,
                videoId: drillsWithRoutines[0].routine.exercises[0].videoId,
              }
            : null,
        }
      : null,
  });

  if (drillsWithRoutines.length > 0) {
    drillsWithRoutines.forEach((drill: any) => {
      console.log("🔍 Processing drill with routine:", {
        drillId: drill.id,
        drillTitle: drill.title,
        routineId: drill.routineId,
        exerciseCount: drill.routine?.exercises?.length || 0,
        drillSupersetId: drill.supersetId,
        drillSupersetOrder: drill.supersetOrder,
      });

      drill.routine.exercises.forEach((exercise: any) => {
        const routineExerciseKey = `${drill.id}-routine-${exercise.id}`;

        console.log("🎬 Creating routine exercise drill:", {
          exerciseId: exercise.id,
          title: exercise.title,
          videoUrl: exercise.videoUrl,
          videoId: exercise.videoId,
          hasVideo: !!exercise.videoUrl,
          exerciseSupersetId: exercise.supersetId,
          exerciseSupersetOrder: exercise.supersetOrder,
          drillSupersetId: drill.supersetId,
          drillSupersetOrder: drill.supersetOrder,
        });

        // IMPORTANT: If the drill itself has superset info but the exercise doesn't,
        // use the drill's superset info (for circuits created at the program level)
        const finalSupersetId =
          exercise.supersetId || drill.supersetId || undefined;
        const finalSupersetOrder =
          exercise.supersetOrder !== null &&
          exercise.supersetOrder !== undefined
            ? exercise.supersetOrder
            : drill.supersetOrder !== null && drill.supersetOrder !== undefined
            ? drill.supersetOrder
            : undefined;

        const drillLikeExercise: Drill = {
          id: routineExerciseKey,
          title: exercise.title,
          description: exercise.description || undefined,
          sets: exercise.sets || undefined,
          reps: exercise.reps || undefined,
          tempo: exercise.tempo || undefined,
          tags: exercise.type ? [exercise.type] : undefined,
          completed: isExerciseCompleted(exercise.id, drill.id),
          videoUrl: exercise.videoUrl || undefined,
          isYoutube: isYouTubeUrl(exercise.videoUrl || ""),
          youtubeId: extractYouTubeId(exercise.videoUrl || "") || undefined,
          // Superset/Circuit fields - use exercise's superset info, fallback to drill's
          supersetId: finalSupersetId,
          supersetOrder: finalSupersetOrder,
          supersetDescription:
            exercise.supersetDescription ||
            drill.supersetDescription ||
            undefined,
          supersetInstructions:
            exercise.supersetInstructions ||
            drill.supersetInstructions ||
            undefined,
          supersetNotes:
            exercise.supersetNotes || drill.supersetNotes || undefined,
        };
        allExercises.push(drillLikeExercise);
        console.log("✅ Added routine exercise to allExercises:", {
          id: drillLikeExercise.id,
          title: drillLikeExercise.title,
          supersetId: drillLikeExercise.supersetId,
          supersetOrder: drillLikeExercise.supersetOrder,
        });
      });
    });
  }

  if (allExercises.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="h-8 w-8 text-gray-400" />
        </div>
        <h4 className="text-lg font-semibold text-white mb-2">
          No Exercises Today
        </h4>
        <p className="text-gray-400">
          No exercises are scheduled for this day.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-400" />
          Today's Workout
        </h3>
      </div>

      <div className="space-y-4">
        {(() => {
          // Group drills by superset and maintain order
          const supersetGroups: { [key: string]: Drill[] } = {};
          const orderedExercises: Array<{
            type: "regular" | "superset";
            data: Drill | { supersetId: string; drills: Drill[] };
          }> = [];

          // First, group superset exercises
          allExercises.forEach(drill => {
            if (drill.supersetId) {
              if (!supersetGroups[drill.supersetId]) {
                supersetGroups[drill.supersetId] = [];
              }
              supersetGroups[drill.supersetId].push(drill);
            }
          });

          // Debug logging for circuit grouping
          console.log("🔍 Circuit Grouping Debug:", {
            totalExercises: allExercises.length,
            allExerciseDetails: allExercises.map(d => ({
              id: d.id,
              title: d.title,
              supersetId: d.supersetId,
              supersetOrder: d.supersetOrder,
            })),
            exercisesWithSupersetId: allExercises.filter(d => d.supersetId)
              .length,
            exercisesWithSupersetIdDetails: allExercises
              .filter(d => d.supersetId)
              .map(d => ({
                id: d.id,
                title: d.title,
                supersetId: d.supersetId,
                supersetOrder: d.supersetOrder,
              })),
            supersetGroups: Object.keys(supersetGroups).map(supersetId => ({
              supersetId,
              count: supersetGroups[supersetId].length,
              exercises: supersetGroups[supersetId].map(d => ({
                id: d.id,
                title: d.title,
                supersetOrder: d.supersetOrder,
              })),
            })),
            orderedExercisesCount: 0, // Will be logged after creation
          });

          // Sort superset groups by superset order
          Object.keys(supersetGroups).forEach(supersetId => {
            supersetGroups[supersetId].sort((a, b) => {
              const orderA = (a as any).supersetOrder || 0;
              const orderB = (b as any).supersetOrder || 0;
              return orderA - orderB;
            });
          });

          // Track which superset groups we've already added
          const addedSupersetIds = new Set<string>();

          // Create ordered list maintaining program order
          allExercises.forEach((drill, drillIndex) => {
            console.log(
              `🔍 Processing drill ${drillIndex} for orderedExercises:`,
              {
                id: drill.id,
                title: drill.title,
                hasSupersetId: !!drill.supersetId,
                supersetId: drill.supersetId,
                supersetOrder: drill.supersetOrder,
              }
            );

            if (drill.supersetId) {
              // Only add the superset group once (when we encounter the first exercise in program order)
              if (!addedSupersetIds.has(drill.supersetId)) {
                const supersetDrills = supersetGroups[drill.supersetId];
                console.log(
                  `✅ Adding superset group for ${drill.supersetId}:`,
                  {
                    supersetId: drill.supersetId,
                    drillCount: supersetDrills.length,
                    drillTitles: supersetDrills.map(d => d.title),
                  }
                );
                // Add superset group
                orderedExercises.push({
                  type: "superset",
                  data: {
                    supersetId: drill.supersetId,
                    drills: supersetDrills,
                  },
                });
                addedSupersetIds.add(drill.supersetId);
              } else {
                console.log(
                  `⏭️ Skipping drill ${drill.title} - superset group already added`
                );
              }
              // Don't add individual drills that are part of a superset
            } else {
              console.log(`✅ Adding regular drill: ${drill.title}`);
              // Add regular drill
              orderedExercises.push({
                type: "regular",
                data: drill,
              });
            }
          });

          // Debug: Log ordered exercises
          console.log("🔍 Ordered Exercises:", {
            total: orderedExercises.length,
            breakdown: {
              regular: orderedExercises.filter(i => i.type === "regular")
                .length,
              superset: orderedExercises.filter(i => i.type === "superset")
                .length,
            },
            supersetGroups: orderedExercises
              .filter(i => i.type === "superset")
              .map(i => {
                const data = i.data as { supersetId: string; drills: Drill[] };
                return {
                  supersetId: data.supersetId,
                  count: data.drills.length,
                  exerciseTitles: data.drills.map(d => d.title),
                };
              }),
          });

          let globalIndex = 0;

          return (
            <div className="space-y-4">
              {orderedExercises.map((item, itemIndex) => {
                console.log("🎯 Rendering item:", {
                  index: itemIndex,
                  type: item.type,
                  isRegular: item.type === "regular",
                  isSuperset: item.type === "superset",
                });

                if (item.type === "regular") {
                  const drill = item.data as Drill;

                  // Use the new completion system - check completion state dynamically
                  let isCompleted = false;
                  const dateKey = formatDateKey(selectedDate);

                  if (drill.id.includes("-routine-")) {
                    // This is a routine exercise within a program
                    const originalDrillId = drill.id.split("-routine-")[0];
                    const exerciseId = drill.id.split("-routine-")[1];
                    isCompleted = isExerciseCompleted(
                      exerciseId,
                      originalDrillId,
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

                  const drillWithCompletion: Drill = {
                    ...drill,
                    completed: isCompleted,
                  };

                  return (
                    <DrillCard
                      key={drill.id}
                      drill={drillWithCompletion}
                      index={globalIndex++}
                      onMarkComplete={async completed => {
                        const dateKey = formatDateKey(selectedDate);

                        console.log(
                          "🎯 onMarkComplete called for regular drill:",
                          {
                            drillId: drill.id,
                            completed,
                            dateKey,
                            isRoutineExercise: drill.id.includes("-routine-"),
                          }
                        );

                        if (drill.id.includes("-routine-")) {
                          // For routine exercises within programs, use the new completion system
                          const originalDrillId =
                            drill.id.split("-routine-")[0];
                          const exerciseId = drill.id.split("-routine-")[1];
                          console.log("🎯 Marking routine exercise complete:", {
                            exerciseId,
                            originalDrillId,
                            completed,
                            dateKey,
                          });
                          await markExerciseComplete(
                            exerciseId,
                            originalDrillId,
                            completed,
                            dateKey
                          );
                        } else {
                          // For regular drills, use the new completion system
                          console.log("🎯 Marking regular drill complete:", {
                            drillId: drill.id,
                            completed,
                            dateKey,
                          });
                          await markExerciseComplete(
                            drill.id,
                            undefined,
                            completed,
                            dateKey
                          );
                        }
                      }}
                      onOpenVideo={() =>
                        drill.videoUrl && onOpenVideo(drill.videoUrl, drill)
                      }
                      onOpenComment={() => onOpenCommentModal(drill)}
                      onOpenVideoSubmission={() =>
                        onOpenVideoSubmissionModal(drill.id, drill.title)
                      }
                      isLoading={false}
                    />
                  );
                } else if (item.type === "superset") {
                  // Superset group
                  const supersetData = item.data as {
                    supersetId: string;
                    drills: Drill[];
                  };
                  const supersetDrills = supersetData.drills;

                  console.log("🎨 Rendering Superset/Circuit Group:", {
                    supersetId: supersetData.supersetId,
                    drillCount: supersetDrills.length,
                    isCircuit: supersetDrills.length > 2,
                    exerciseTitles: supersetDrills.map(d => d.title),
                  });

                  const isCircuit = supersetDrills.length > 2;

                  return (
                    <div key={supersetData.supersetId} className="space-y-4">
                      {/* Superset/Circuit Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="px-3 py-1 bg-purple-600/20 border border-purple-500/50 rounded-lg">
                          <span className="text-sm font-semibold text-purple-300">
                            {isCircuit
                              ? `CIRCUIT (${supersetDrills.length} exercises)`
                              : "SUPERSET"}
                          </span>
                        </div>
                      </div>

                      {/* Superset/Circuit Description */}
                      {supersetDrills[0]?.supersetDescription && (
                        <div className="bg-purple-600/5 border border-purple-500/20 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-purple-300 mb-2">
                            Instructions
                          </h4>
                          <p className="text-sm text-gray-300">
                            {supersetDrills[0].supersetDescription}
                          </p>
                        </div>
                      )}

                      {/* Superset/Circuit exercises with purple border container */}
                      <div className="border-2 border-purple-500/50 rounded-xl p-4 bg-purple-600/10">
                        <div className="space-y-3">
                          {supersetDrills.map((drill, index) => {
                            // Use the new completion system - check completion state dynamically
                            let isCompleted = false;
                            const dateKey = formatDateKey(selectedDate);

                            if (drill.id.includes("-routine-")) {
                              // This is a routine exercise within a program
                              const originalDrillId =
                                drill.id.split("-routine-")[0];
                              const exerciseId = drill.id.split("-routine-")[1];
                              isCompleted = isExerciseCompleted(
                                exerciseId,
                                originalDrillId,
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

                            const drillWithCompletion: Drill = {
                              ...drill,
                              completed: isCompleted,
                            };

                            return (
                              <div key={drill.id} className="relative">
                                {/* Exercise number indicator */}
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <span className="text-sm text-purple-300 font-medium">
                                    Exercise {index + 1}
                                  </span>
                                </div>

                                <DrillCard
                                  drill={drillWithCompletion}
                                  index={globalIndex++}
                                  onMarkComplete={async completed => {
                                    const dateKey = formatDateKey(selectedDate);

                                    console.log(
                                      "🎯 onMarkComplete called for superset drill:",
                                      {
                                        drillId: drill.id,
                                        completed,
                                        dateKey,
                                        isRoutineExercise:
                                          drill.id.includes("-routine-"),
                                      }
                                    );

                                    if (drill.id.includes("-routine-")) {
                                      // For routine exercises within programs, use the new completion system
                                      const originalDrillId =
                                        drill.id.split("-routine-")[0];
                                      const exerciseId =
                                        drill.id.split("-routine-")[1];
                                      console.log(
                                        "🎯 Marking superset routine exercise complete:",
                                        {
                                          exerciseId,
                                          originalDrillId,
                                          completed,
                                          dateKey,
                                        }
                                      );
                                      await markExerciseComplete(
                                        exerciseId,
                                        originalDrillId,
                                        completed,
                                        dateKey
                                      );
                                    } else {
                                      // For regular drills, use the new completion system
                                      console.log(
                                        "🎯 Marking superset regular drill complete:",
                                        {
                                          drillId: drill.id,
                                          completed,
                                          dateKey,
                                        }
                                      );
                                      await markExerciseComplete(
                                        drill.id,
                                        undefined,
                                        completed,
                                        dateKey
                                      );
                                    }
                                  }}
                                  onOpenVideo={() =>
                                    drill.videoUrl &&
                                    onOpenVideo(drill.videoUrl, drill)
                                  }
                                  onOpenComment={() =>
                                    onOpenCommentModal(drill)
                                  }
                                  onOpenVideoSubmission={() =>
                                    onOpenVideoSubmissionModal(
                                      drill.id,
                                      drill.title
                                    )
                                  }
                                  isLoading={false}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  console.error("❌ Unknown item type:", item);
                  return null;
                }
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// Routine Content Component
function RoutineContent({
  routineAssignment,
  onMarkDrillComplete,
  onMarkRoutineExerciseComplete,
  onOpenVideo,
  onOpenCommentModal,
  onOpenVideoSubmissionModal,
  isExerciseCompleted,
  markExerciseComplete,
  selectedDate,
}: {
  routineAssignment?: RoutineAssignment;
  onMarkDrillComplete: (
    drillId: string,
    completed: boolean,
    programAssignmentId?: string
  ) => void;
  onMarkRoutineExerciseComplete: (
    exerciseId: string,
    programDrillId: string,
    completed: boolean
  ) => void;
  onOpenVideo: (videoUrl: string, drill: Drill) => void;
  onOpenCommentModal: (drill: Drill) => void;
  onOpenVideoSubmissionModal: (drillId: string, drillTitle: string) => void;
  isExerciseCompleted: (
    exerciseId: string,
    programDrillId?: string,
    date?: string
  ) => boolean;
  markExerciseComplete: (
    exerciseId: string,
    programDrillId: string | undefined,
    completed: boolean,
    date?: string
  ) => Promise<void>;
  selectedDate?: Date | null;
}) {
  console.log("🎯 RoutineContent called with:", {
    routineAssignment: routineAssignment
      ? {
          id: routineAssignment.id,
          routine: routineAssignment.routine?.name,
        }
      : null,
  });

  if (!routineAssignment) {
    console.log("🎯 Routine assignment not found, showing fallback UI");
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-8 w-8 text-blue-400" />
        </div>
        <h4 className="text-lg font-semibold text-white mb-2">Daily Routine</h4>
        <p className="text-gray-400">
          Follow your assigned routine for today. Check your routine page for
          detailed instructions.
        </p>
      </div>
    );
  }

  const { routine } = routineAssignment;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-8 w-8 text-blue-400" />
        </div>
        <h4 className="text-xl font-semibold text-white mb-2">
          {routine.name}
        </h4>
        {routine.description && (
          <p className="text-gray-400 text-sm">{routine.description}</p>
        )}
      </div>

      {/* Routine Exercises */}
      {routine.exercises && routine.exercises.length > 0 ? (
        <div className="space-y-6">
          {(() => {
            // Convert all exercises to drill-like format first
            console.log("🎯 Creating drill-like exercises with:", {
              routineAssignmentId: routineAssignment.id,
              exerciseCount: routine.exercises.length,
              firstExercise: routine.exercises[0]
                ? {
                    id: routine.exercises[0].id,
                    title: routine.exercises[0].title,
                  }
                : null,
            });

            const allDrillLikeExercises: Drill[] = routine.exercises.map(
              (exercise, index) => {
                const routineExerciseKey = `${routineAssignment.id}-${exercise.id}`;
                console.log("🎯 Creating drill with key:", routineExerciseKey);
                return {
                  id: routineExerciseKey,
                  title: exercise.title,
                  description: exercise.description || undefined,
                  sets: exercise.sets || undefined,
                  reps: exercise.reps || undefined,
                  tempo: exercise.tempo || undefined,
                  tags: exercise.type ? [exercise.type] : undefined,
                  completed: isExerciseCompleted(
                    exercise.id,
                    routineAssignment.id,
                    formatDateKey(selectedDate)
                  ),
                  videoUrl: exercise.videoUrl || undefined,
                  supersetId: exercise.supersetId || undefined,
                  supersetOrder: exercise.supersetOrder || undefined,
                  supersetDescription:
                    (exercise as any).supersetDescription || undefined,
                  supersetInstructions:
                    (exercise as any).supersetInstructions || undefined,
                  supersetNotes: (exercise as any).supersetNotes || undefined,
                  isYoutube: isYouTubeUrl(exercise.videoUrl || ""),
                  youtubeId:
                    extractYouTubeId(exercise.videoUrl || "") || undefined,
                };
              }
            );

            // Group drills by superset
            const supersetGroups: { [key: string]: Drill[] } = {};
            const regularDrills: Drill[] = [];

            allDrillLikeExercises.forEach(drill => {
              if (drill.supersetId) {
                if (!supersetGroups[drill.supersetId]) {
                  supersetGroups[drill.supersetId] = [];
                }
                supersetGroups[drill.supersetId].push(drill);
              } else {
                regularDrills.push(drill);
              }
            });

            // Sort superset groups by superset order
            Object.keys(supersetGroups).forEach(supersetId => {
              supersetGroups[supersetId].sort((a, b) => {
                const orderA = (a as any).supersetOrder || 0;
                const orderB = (b as any).supersetOrder || 0;
                return orderA - orderB;
              });
            });

            let globalIndex = 0;

            return (
              <>
                {/* Regular drills */}
                {regularDrills.map((drill, index) => (
                  <div
                    key={drill.id}
                    className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
                  >
                    <DrillCard
                      drill={drill}
                      index={globalIndex++}
                      onMarkComplete={async completed => {
                        // For standalone routine exercises: routineAssignmentId-exerciseId
                        const parts = drill.id.split("-");
                        const routineAssignmentId = parts[0];
                        const exerciseId = parts[1];
                        const dateKey = formatDateKey(selectedDate);
                        await markExerciseComplete(
                          exerciseId,
                          routineAssignmentId,
                          completed,
                          dateKey
                        );
                      }}
                      onOpenVideo={() =>
                        drill.videoUrl && onOpenVideo(drill.videoUrl, drill)
                      }
                      onOpenComment={() => onOpenCommentModal(drill)}
                      onOpenVideoSubmission={() => {
                        const exerciseId = drill.id.split("-")[1];
                        const exercise = routine.exercises.find(
                          ex => ex.id === exerciseId
                        );
                        onOpenVideoSubmissionModal(
                          exerciseId,
                          exercise?.title || "Exercise"
                        );
                      }}
                      isLoading={false}
                    />
                  </div>
                ))}

                {/* Superset/Circuit groups */}
                {Object.entries(supersetGroups).map(
                  ([supersetId, supersetDrills]) => {
                    const isCircuit = supersetDrills.length > 2;
                    return (
                      <div key={supersetId} className="space-y-4">
                        {/* Superset/Circuit label */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="px-3 py-1 bg-purple-600/20 border border-purple-500/50 rounded-lg">
                            <span className="text-sm font-semibold text-purple-300">
                              {isCircuit
                                ? `CIRCUIT (${supersetDrills.length} exercises)`
                                : "SUPERSET"}
                            </span>
                          </div>
                        </div>

                        {/* Superset/Circuit exercises with purple border container */}
                        <div className="border-2 border-purple-500/50 rounded-xl p-4 bg-purple-600/10">
                          <div className="space-y-3">
                            {supersetDrills.map((drill, index) => (
                              <div key={drill.id} className="relative">
                                {/* Superset/Circuit exercise indicator */}
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <span className="text-sm text-purple-300 font-medium">
                                    Exercise {index + 1}
                                  </span>
                                </div>

                                <DrillCard
                                  drill={drill}
                                  index={globalIndex++}
                                  onMarkComplete={async completed => {
                                    // For standalone routine exercises: routineAssignmentId-exerciseId
                                    const parts = drill.id.split("-");
                                    const routineAssignmentId = parts[0];
                                    const exerciseId = parts[1];
                                    const dateKey = formatDateKey(selectedDate);
                                    await markExerciseComplete(
                                      exerciseId,
                                      routineAssignmentId,
                                      completed,
                                      dateKey
                                    );
                                  }}
                                  onOpenVideo={() =>
                                    drill.videoUrl &&
                                    onOpenVideo(drill.videoUrl, drill)
                                  }
                                  onOpenComment={() =>
                                    onOpenCommentModal(drill)
                                  }
                                  onOpenVideoSubmission={() => {
                                    const exerciseId = drill.id.split("-")[1];
                                    const exercise = routine.exercises.find(
                                      ex => ex.id === exerciseId
                                    );
                                    onOpenVideoSubmissionModal(
                                      exerciseId,
                                      exercise?.title || "Exercise"
                                    );
                                  }}
                                  isLoading={false}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </>
            );
          })()}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">
            No Exercises
          </h4>
          <p className="text-gray-400">
            This routine doesn't have any exercises assigned yet.
          </p>
        </div>
      )}
    </div>
  );
}

// Drill Card Component
function DrillCard({
  drill,
  index,
  onMarkComplete,
  onOpenVideo,
  onOpenComment,
  onOpenVideoSubmission,
  isLoading = false,
}: {
  drill: Drill;
  index: number;
  onMarkComplete: (completed: boolean) => void;
  onOpenVideo: () => void;
  onOpenComment: () => void;
  onOpenVideoSubmission: () => void;
  isLoading?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border",
        drill.supersetId
          ? "bg-purple-600/10 border-purple-500/30 hover:bg-purple-600/20"
          : "bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">
              #{index + 1}
            </span>
            <h4 className="text-lg font-semibold text-white">{drill.title}</h4>
          </div>
          {drill.supersetId && (
            <div className="flex items-center gap-1 text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
              <Link className="h-3 w-3" />
              <span className="font-medium">SUPERSET</span>
            </div>
          )}
        </div>

        {/* Completion Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🎯 DrillCard button clicked:", {
              drillId: drill.id,
              drillTitle: drill.title,
              currentCompleted: drill.completed,
              newCompleted: !drill.completed,
            });
            onMarkComplete(!drill.completed);
          }}
          className={cn(
            "h-8 w-8 p-0 rounded-full",
            drill.completed
              ? "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25"
              : "bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white"
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Exercise Details */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {drill.sets && (
            <div className="text-center">
              <div className="text-lg font-bold text-white">{drill.sets}</div>
              <div className="text-xs text-gray-400">Sets</div>
            </div>
          )}
          {drill.reps && (
            <div className="text-center">
              <div className="text-lg font-bold text-white">{drill.reps}</div>
              <div className="text-xs text-gray-400">Reps</div>
            </div>
          )}
          {drill.tempo && (
            <div className="text-center">
              <div className="text-lg font-bold text-white">{drill.tempo}</div>
              <div className="text-xs text-gray-400">Duration</div>
            </div>
          )}
        </div>

        {/* Description */}
        {drill.description && (
          <div className="mb-3 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-300">
              {drill.description.length > 120
                ? `${drill.description.substring(0, 120)}...`
                : drill.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {drill.tags && drill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {drill.tags.map((tag: any, tagIndex: number) => (
              <Badge
                key={tagIndex}
                variant="outline"
                className="text-xs border-blue-500/50 text-blue-400 bg-blue-500/10"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {drill.videoUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenVideo}
              className="flex-1 border-2 border-blue-500 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400 text-xs font-medium"
            >
              <Play className="h-3 w-3 mr-1" />
              Demo
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenComment}
            className="flex-1 border-2 border-gray-500 text-gray-400 hover:bg-gray-600/20 hover:border-gray-400 text-xs font-medium"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Note
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenVideoSubmission}
            className="flex-1 border-2 border-purple-500 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400 text-xs font-medium"
          >
            <Video className="h-3 w-3 mr-1" />
            Record
          </Button>
        </div>
      </div>
    </div>
  );
}

// Video Assignment Card Component
function VideoAssignmentCard({
  assignment,
  index,
  onMarkComplete,
  onOpenVideo,
  onOpenComment,
  onOpenVideoSubmission,
}: {
  assignment: any;
  index: number;
  onMarkComplete: (completed: boolean) => void;
  onOpenVideo: () => void;
  onOpenComment: () => void;
  onOpenVideoSubmission: () => void;
}) {
  return (
    <div className="rounded-lg border bg-purple-600/10 border-purple-500/30 hover:bg-purple-600/20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-purple-300">
              #{index + 1}
            </span>
            <h4 className="text-lg font-semibold text-white">
              {assignment.title}
            </h4>
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
            <Video className="h-3 w-3" />
            <span className="font-medium">VIDEO</span>
          </div>
        </div>

        {/* Completion Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onMarkComplete(!assignment.completed);
          }}
          className={cn(
            "h-8 w-8 p-0 rounded-full",
            assignment.completed
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-gray-600 text-gray-300 hover:bg-gray-500"
          )}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Due Date */}
        <div className="mb-3 p-3 bg-purple-800/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-purple-200">
            <Calendar className="h-4 w-4" />
            <span>
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Description */}
        {assignment.description && (
          <div className="mb-3 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-300">
              {assignment.description.length > 120
                ? `${assignment.description.substring(0, 120)}...`
                : assignment.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {assignment.videoUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenVideo}
              className="flex-1 border-2 border-blue-500 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400 text-xs font-medium"
            >
              <Play className="h-3 w-3 mr-1" />
              Demo
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenComment}
            className="flex-1 border-2 border-gray-500 text-gray-400 hover:bg-gray-600/20 hover:border-gray-400 text-xs font-medium"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Note
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenVideoSubmission}
            className="flex-1 border-2 border-purple-500 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400 text-xs font-medium"
          >
            <Video className="h-3 w-3 mr-1" />
            Record
          </Button>
        </div>
      </div>
    </div>
  );
}
