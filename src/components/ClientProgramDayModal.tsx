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
import { COLORS } from "@/lib/colors";

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

        tabs.push({
          id: `program-${program.programId}`,
          title: program.programTitle,
          type: "program",
          icon: <BookOpen className="h-4 w-4" />,
          color: COLORS.GOLDEN_ACCENT,
          bgColor: COLORS.BACKGROUND_CARD,
          borderColor: COLORS.GOLDEN_BORDER,
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
          color: COLORS.GOLDEN_ACCENT,
          bgColor: COLORS.BACKGROUND_CARD,
          borderColor: COLORS.GOLDEN_BORDER,
        });
      });
    }

    return tabs;
  };

  const tabs = generateTabs();

  // Set active tab to first unviewed tab, or first tab if all viewed
  React.useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      const unviewedTab = tabs.find(tab => !viewedTabs.has(tab.id));
      const selectedTab = unviewedTab ? unviewedTab.id : tabs[0].id;
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
        className="rounded-3xl border-2 w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col no-animations"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          animation: "none !important",
          transition: "none !important",
          transform: "none !important",
          opacity: "1 !important",
        }}
      >
        {/* Header */}
        <div 
          className="p-4 border-b flex-shrink-0"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 
                className="text-xl font-bold mb-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
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
                      <CheckCircle2 
                        className="h-4 w-4" 
                        style={{ color: COLORS.GREEN_PRIMARY }}
                      />
                      <span 
                        className="font-semibold"
                        style={{ color: COLORS.GREEN_PRIMARY }}
                      >
                        All completed.
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 
                        className="h-4 w-4" 
                        style={{ color: COLORS.TEXT_MUTED }}
                      />
                      <span style={{ color: COLORS.TEXT_SECONDARY }}>
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

        {/* Tab Navigation */}
        {tabs.length > 0 && (
          <div 
            className="px-4 py-3 border-b flex-shrink-0"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              backgroundColor: COLORS.BACKGROUND_CARD,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <h3 
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
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
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors"
                    style={{
                      backgroundColor: isActive 
                        ? COLORS.GOLDEN_DARK 
                        : COLORS.BACKGROUND_CARD,
                      borderColor: isActive 
                        ? COLORS.GOLDEN_BORDER 
                        : COLORS.BORDER_SUBTLE,
                      color: isActive 
                        ? COLORS.TEXT_PRIMARY 
                        : COLORS.TEXT_SECONDARY,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                      }
                    }}
                  >
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
              <Loader2 
                className="h-8 w-8 animate-spin" 
                style={{ color: COLORS.GOLDEN_ACCENT }}
              />
              <p 
                className="text-sm"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Loading workout details...
              </p>
            </div>
          ) : detailsError ? (
            // Error state
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertCircle 
                className="h-8 w-8" 
                style={{ color: COLORS.RED_ALERT }}
              />
              <p 
                className="text-sm"
                style={{ color: COLORS.RED_ALERT }}
              >
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
              <h3 
                className="text-xl font-bold mb-4"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Scheduled Lessons
              </h3>
              {lessonsForDate.map((lesson: any, index: number) => {
                const isScheduleRequest = lesson.title
                  ?.toLowerCase()
                  .includes("schedule request");

                return (
                  <div
                    key={lesson.id || index}
                    className="p-4 rounded-xl border-2"
                    style={{
                      backgroundColor: isScheduleRequest
                        ? COLORS.BACKGROUND_CARD
                        : COLORS.BACKGROUND_CARD,
                      borderColor: isScheduleRequest
                        ? COLORS.GOLDEN_BORDER
                        : COLORS.GREEN_DARK,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock
                            className="h-5 w-5"
                            style={{
                              color: isScheduleRequest
                                ? COLORS.GOLDEN_ACCENT
                                : COLORS.GREEN_PRIMARY,
                            }}
                          />
                          <span
                            className="font-semibold"
                            style={{
                              color: isScheduleRequest
                                ? COLORS.GOLDEN_ACCENT
                                : COLORS.GREEN_PRIMARY,
                            }}
                          >
                            {new Date(lesson.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h4
                          className="text-lg font-bold mb-1"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          {lesson.title || "Lesson"}
                        </h4>
                        {lesson.description && (
                          <p
                            className="text-sm"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            {lesson.description}
                          </p>
                        )}
                        {(lesson as any).coach && (
                          <p
                            className="text-sm mt-2"
                            style={{ color: COLORS.TEXT_SECONDARY }}
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
                        style={{
                          backgroundColor:
                            lesson.status === "CONFIRMED"
                              ? COLORS.GREEN_PRIMARY
                              : COLORS.BACKGROUND_CARD,
                        }}
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
              const program = programs.find(p => p.programId === programId);

              if (!program) {
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
              const foundAssignment = routineAssignments.find(
                assignment => `routine-${assignment.id}` === currentTab.id
              );

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
                <Calendar 
                  className="h-12 w-12 mx-auto mb-4" 
                  style={{ color: COLORS.TEXT_MUTED }}
                />
                <p 
                  className="text-lg mb-2"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Nothing scheduled for this day
                </p>
                <p 
                  className="text-sm"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  Check back later for updates from your coach
                </p>
              </div>
            )}
        </div>

        {/* Actions Footer */}
        <div 
          className="p-4 pb-6 border-t flex-shrink-0"
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            backgroundColor: COLORS.BACKGROUND_CARD,
          }}
        >
          <div className="space-y-3">
            {/* Progress Footer */}
            {tabs.length > 1 && (
              <div 
                className="border-t pt-3 mt-3"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {viewedTabs.size} of {tabs.length} assignments viewed
                  </div>
                  {unviewedCount > 0 && (
                    <button
                      onClick={() => {
                        setViewedTabs(new Set(tabs.map(tab => tab.id)));
                      }}
                      className="text-sm transition-colors"
                      style={{ color: COLORS.GOLDEN_ACCENT }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = COLORS.GOLDEN_HOVER;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                      }}
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
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: COLORS.BACKGROUND_CARD }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.GOLDEN_ACCENT }}
          >
            <span className="text-2xl"></span>
          </div>
        </div>
      </div>
      <h3 
        className="text-3xl font-bold mb-4"
        style={{ color: COLORS.TEXT_PRIMARY }}
      >
        Rest Day
      </h3>
      <p 
        className="text-lg mb-2"
        style={{ color: COLORS.GOLDEN_ACCENT }}
      >
        Time to Recharge & Recover
      </p>
      <p 
        className="max-w-md mx-auto"
        style={{ color: COLORS.TEXT_SECONDARY }}
      >
        Enjoy your day off.
      </p>
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

  // First, add all regular drills (non-routine drills)
  program.drills.forEach((drill: any) => {
    // Skip drills that should be routines but aren't properly linked
    const shouldBeRoutine =
      !drill.routineId &&
      !drill.routine &&
      (drill.title.toLowerCase().includes("routine") ||
        drill.title.toLowerCase().includes("workout") ||
        drill.title.toLowerCase().includes("session"));

    if (!shouldBeRoutine) {
      // This is a regular drill, add it as-is
      const regularDrill: Drill = {
        id: drill.id,
        title: drill.title,
        // Preserve description - use the normalized value from the backend
        // The backend normalizes null/undefined to empty strings, so we should get a string
        // CRITICAL: Keep the description even if it's an empty string - let DrillCard handle the display logic
        // This ensures descriptions are preserved through the entire flow
        description:
          drill.description !== null && drill.description !== undefined
            ? String(drill.description) // Convert to string if it exists
            : undefined, // Only use undefined if it's actually null/undefined
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
          // Preserve description even if it's an empty string (don't convert to undefined)
          description: exercise.description ?? undefined,
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

  if (drillsWithRoutines.length > 0) {
    drillsWithRoutines.forEach((drill: any) => {
      drill.routine.exercises.forEach((exercise: any) => {
        const routineExerciseKey = `${drill.id}-routine-${exercise.id}`;

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
          // Preserve description even if it's an empty string (don't convert to undefined)
          description: exercise.description ?? undefined,
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
      });
    });
  }

  if (allExercises.length === 0) {
    return (
      <div className="text-center py-12">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: COLORS.BACKGROUND_CARD }}
        >
          <Dumbbell 
            className="h-8 w-8" 
            style={{ color: COLORS.TEXT_MUTED }}
          />
        </div>
        <h4 
          className="text-lg font-semibold mb-2"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          No Exercises Today
        </h4>
        <p style={{ color: COLORS.TEXT_SECONDARY }}>
          No exercises are scheduled for this day.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="text-lg font-bold"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
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
            if (drill.supersetId) {
              // Only add the superset group once (when we encounter the first exercise in program order)
              if (!addedSupersetIds.has(drill.supersetId)) {
                const supersetDrills = supersetGroups[drill.supersetId];
                // Add superset group
                orderedExercises.push({
                  type: "superset",
                  data: {
                    supersetId: drill.supersetId,
                    drills: supersetDrills,
                  },
                });
                addedSupersetIds.add(drill.supersetId);
              }
              // Don't add individual drills that are part of a superset
            } else {
              // Add regular drill
              orderedExercises.push({
                type: "regular",
                data: drill,
              });
            }
          });

          let globalIndex = 0;

          return (
            <div className="space-y-4">
              {orderedExercises.map((item, itemIndex) => {
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

                        if (drill.id.includes("-routine-")) {
                          // For routine exercises within programs, use the new completion system
                          const originalDrillId =
                            drill.id.split("-routine-")[0];
                          const exerciseId = drill.id.split("-routine-")[1];
                          await markExerciseComplete(
                            exerciseId,
                            originalDrillId,
                            completed,
                            dateKey
                          );
                        } else {
                          // For regular drills, use the new completion system
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
                  const isCircuit = supersetDrills.length > 2;

                  return (
                    <div key={supersetData.supersetId} className="space-y-4">
                      {/* Superset/Circuit Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="px-3 py-1 border rounded-lg"
                          style={{
                            backgroundColor: "rgba(147, 51, 234, 0.2)",
                            borderColor: "rgba(168, 85, 247, 0.5)",
                          }}
                        >
                          <span 
                            className="text-sm font-semibold"
                            style={{ color: "#c084fc" }}
                          >
                            {isCircuit
                              ? `CIRCUIT (${supersetDrills.length} exercises)`
                              : "SUPERSET"}
                          </span>
                        </div>
                      </div>

                      {/* Superset/Circuit Description */}
                      {supersetDrills[0]?.supersetDescription && (
                        <div 
                          className="border rounded-lg p-4"
                          style={{
                            backgroundColor: "rgba(147, 51, 234, 0.05)",
                            borderColor: "rgba(168, 85, 247, 0.2)",
                          }}
                        >
                          <h4 
                            className="text-sm font-medium mb-2"
                            style={{ color: "#c084fc" }}
                          >
                            Instructions
                          </h4>
                          <p 
                            className="text-sm"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            {supersetDrills[0].supersetDescription}
                          </p>
                        </div>
                      )}

                      {/* Superset/Circuit exercises with purple border container */}
                      <div 
                        className="border-2 rounded-xl p-4"
                        style={{
                          borderColor: "rgba(168, 85, 247, 0.5)",
                          backgroundColor: "rgba(147, 51, 234, 0.1)",
                        }}
                      >
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
                                  <div 
                                    className="w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: "#a855f7" }}
                                  >
                                    <span 
                                      className="text-white text-xs font-bold"
                                    >
                                      {index + 1}
                                    </span>
                                  </div>
                                  <span 
                                    className="text-sm font-medium"
                                    style={{ color: "#c084fc" }}
                                  >
                                    Exercise {index + 1}
                                  </span>
                                </div>

                                <DrillCard
                                  drill={drillWithCompletion}
                                  index={globalIndex++}
                                  onMarkComplete={async completed => {
                                    const dateKey = formatDateKey(selectedDate);

                                    if (drill.id.includes("-routine-")) {
                                      // For routine exercises within programs, use the new completion system
                                      const originalDrillId =
                                        drill.id.split("-routine-")[0];
                                      const exerciseId =
                                        drill.id.split("-routine-")[1];
                                      await markExerciseComplete(
                                        exerciseId,
                                        originalDrillId,
                                        completed,
                                        dateKey
                                      );
                                    } else {
                                      // For regular drills, use the new completion system
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
  if (!routineAssignment) {
    return (
      <div className="text-center py-12">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: COLORS.BACKGROUND_CARD }}
        >
          <BookOpen 
            className="h-8 w-8" 
            style={{ color: COLORS.GOLDEN_ACCENT }}
          />
        </div>
        <h4 
          className="text-lg font-semibold mb-2"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Daily Routine
        </h4>
        <p style={{ color: COLORS.TEXT_SECONDARY }}>
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
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: COLORS.BACKGROUND_CARD }}
        >
          <BookOpen 
            className="h-8 w-8" 
            style={{ color: COLORS.GOLDEN_ACCENT }}
          />
        </div>
        <h4 
          className="text-xl font-semibold mb-2"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          {routine.name}
        </h4>
        {routine.description && (
          <p 
            className="text-sm"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            {routine.description}
          </p>
        )}
      </div>

      {/* Routine Exercises */}
      {routine.exercises && routine.exercises.length > 0 ? (
        <div className="space-y-6">
          {(() => {
            // Convert all exercises to drill-like format first
            const allDrillLikeExercises: Drill[] = routine.exercises.map(
              (exercise, index) => {
                const routineExerciseKey = `${routineAssignment.id}-${exercise.id}`;
                return {
                  id: routineExerciseKey,
                  title: exercise.title,
                  // Preserve description even if it's an empty string (don't convert to undefined)
                  description: exercise.description ?? undefined,
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
                          <div 
                            className="px-3 py-1 border rounded-lg"
                            style={{
                              backgroundColor: "rgba(147, 51, 234, 0.2)",
                              borderColor: "rgba(168, 85, 247, 0.5)",
                            }}
                          >
                            <span 
                              className="text-sm font-semibold"
                              style={{ color: "#c084fc" }}
                            >
                              {isCircuit
                                ? `CIRCUIT (${supersetDrills.length} exercises)`
                                : "SUPERSET"}
                            </span>
                          </div>
                        </div>

                        {/* Superset/Circuit exercises with purple border container */}
                        <div 
                          className="border-2 rounded-xl p-4"
                          style={{
                            borderColor: "rgba(168, 85, 247, 0.5)",
                            backgroundColor: "rgba(147, 51, 234, 0.1)",
                          }}
                        >
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
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: COLORS.BACKGROUND_CARD }}
          >
            <BookOpen 
              className="h-8 w-8" 
              style={{ color: COLORS.TEXT_MUTED }}
            />
          </div>
          <h4 
            className="text-lg font-semibold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            No Exercises
          </h4>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
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
      className="rounded-lg border transition-colors"
      style={{
        backgroundColor: drill.supersetId
          ? "rgba(147, 51, 234, 0.1)"
          : COLORS.BACKGROUND_CARD,
        borderColor: drill.supersetId
          ? "rgba(168, 85, 247, 0.5)"
          : COLORS.BORDER_SUBTLE,
      }}
      onMouseEnter={(e) => {
        if (!drill.supersetId) {
          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
        } else {
          e.currentTarget.style.backgroundColor = "rgba(147, 51, 234, 0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (!drill.supersetId) {
          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
        } else {
          e.currentTarget.style.backgroundColor = "rgba(147, 51, 234, 0.1)";
        }
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span 
              className="text-sm font-medium"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              #{index + 1}
            </span>
            <h4 
              className="text-lg font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {drill.title}
            </h4>
          </div>
          {drill.supersetId && (
            <div 
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{
                color: "#c084fc",
                backgroundColor: "rgba(168, 85, 247, 0.2)",
              }}
            >
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
            onMarkComplete(!drill.completed);
          }}
          className="h-8 w-8 p-0 rounded-full transition-colors"
          style={{
            backgroundColor: drill.completed
              ? COLORS.GREEN_PRIMARY
              : COLORS.BACKGROUND_CARD,
            color: drill.completed ? "#FFFFFF" : COLORS.TEXT_SECONDARY,
          }}
          onMouseEnter={(e) => {
            if (!drill.completed) {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
            } else {
              e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
            }
          }}
          onMouseLeave={(e) => {
            if (!drill.completed) {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
            } else {
              e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
            }
          }}
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
              <div 
                className="text-lg font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {drill.sets}
              </div>
              <div 
                className="text-xs"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                Sets
              </div>
            </div>
          )}
          {drill.reps && (
            <div className="text-center">
              <div 
                className="text-lg font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {drill.reps}
              </div>
              <div 
                className="text-xs"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                Reps
              </div>
            </div>
          )}
          {drill.tempo && (
            <div className="text-center">
              <div 
                className="text-lg font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {drill.tempo}
              </div>
              <div 
                className="text-xs"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                Duration
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {drill.description && drill.description.trim() && (
          <div 
            className="mb-3 p-3 rounded-lg"
            style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
          >
            <p 
              className="text-sm"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
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
                className="text-xs"
                style={{
                  borderColor: COLORS.GOLDEN_BORDER,
                  color: COLORS.GOLDEN_ACCENT,
                  backgroundColor: COLORS.BACKGROUND_CARD,
                }}
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
              className="flex-1 border-2 text-xs font-medium transition-colors"
              style={{
                borderColor: COLORS.GOLDEN_BORDER,
                color: COLORS.GOLDEN_ACCENT,
                backgroundColor: COLORS.BACKGROUND_CARD,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.borderColor = COLORS.GOLDEN_BORDER;
              }}
            >
              <Play className="h-3 w-3 mr-1" />
              Demo
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenComment}
            className="flex-1 border-2 text-xs font-medium transition-colors"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              color: COLORS.TEXT_SECONDARY,
              backgroundColor: COLORS.BACKGROUND_CARD,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Note
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenVideoSubmission}
            className="flex-1 border-2 text-xs font-medium transition-colors"
            style={{
              borderColor: "#a855f7",
              color: "#c084fc",
              backgroundColor: "rgba(168, 85, 247, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.2)";
              e.currentTarget.style.borderColor = "#c084fc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.1)";
              e.currentTarget.style.borderColor = "#a855f7";
            }}
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
    <div 
      className="rounded-lg border transition-colors"
      style={{
        backgroundColor: "rgba(147, 51, 234, 0.1)",
        borderColor: "rgba(168, 85, 247, 0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(147, 51, 234, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(147, 51, 234, 0.1)";
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: "rgba(168, 85, 247, 0.3)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span 
              className="text-sm font-medium"
              style={{ color: "#c084fc" }}
            >
              #{index + 1}
            </span>
            <h4 
              className="text-lg font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {assignment.title}
            </h4>
          </div>
          <div 
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
            style={{
              color: "#c084fc",
              backgroundColor: "rgba(168, 85, 247, 0.2)",
            }}
          >
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
          className="h-8 w-8 p-0 rounded-full transition-colors"
          style={{
            backgroundColor: assignment.completed
              ? COLORS.GREEN_PRIMARY
              : COLORS.BACKGROUND_CARD,
            color: assignment.completed ? "#FFFFFF" : COLORS.TEXT_SECONDARY,
          }}
          onMouseEnter={(e) => {
            if (!assignment.completed) {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
            } else {
              e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
            }
          }}
          onMouseLeave={(e) => {
            if (!assignment.completed) {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
            } else {
              e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
            }
          }}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Due Date */}
        <div 
          className="mb-3 p-3 rounded-lg"
          style={{ backgroundColor: "rgba(147, 51, 234, 0.2)" }}
        >
          <div 
            className="flex items-center gap-2 text-sm"
            style={{ color: "#e9d5ff" }}
          >
            <Calendar className="h-4 w-4" />
            <span>
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Description */}
        {assignment.description && (
          <div 
            className="mb-3 p-3 rounded-lg"
            style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
          >
            <p 
              className="text-sm"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
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
              className="flex-1 border-2 text-xs font-medium transition-colors"
              style={{
                borderColor: COLORS.GOLDEN_BORDER,
                color: COLORS.GOLDEN_ACCENT,
                backgroundColor: COLORS.BACKGROUND_CARD,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.borderColor = COLORS.GOLDEN_BORDER;
              }}
            >
              <Play className="h-3 w-3 mr-1" />
              Demo
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenComment}
            className="flex-1 border-2 text-xs font-medium transition-colors"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              color: COLORS.TEXT_SECONDARY,
              backgroundColor: COLORS.BACKGROUND_CARD,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Note
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenVideoSubmission}
            className="flex-1 border-2 text-xs font-medium transition-colors"
            style={{
              borderColor: "#a855f7",
              color: "#c084fc",
              backgroundColor: "rgba(168, 85, 247, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.2)";
              e.currentTarget.style.borderColor = "#c084fc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.1)";
              e.currentTarget.style.borderColor = "#a855f7";
            }}
          >
            <Video className="h-3 w-3 mr-1" />
            Record
          </Button>
        </div>
      </div>
    </div>
  );
}
