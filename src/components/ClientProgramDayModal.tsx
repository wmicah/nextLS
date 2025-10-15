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
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
  description?: string;
  // Routine exercise properties
  isRoutineExercise?: boolean;
  routineAssignmentId?: string;
  originalExerciseId?: string;
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
}

interface DayData {
  date: string;
  drills: Drill[];
  isRestDay: boolean;
  expectedTime: number;
  completedDrills: number;
  totalDrills: number;
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
  onMarkDrillComplete: (drillId: string, completed: boolean) => void;
  onMarkAllComplete: () => void;
  onOpenVideo: (videoUrl: string, drill: Drill) => void;
  onOpenCommentModal: (drill: Drill) => void;
  onOpenVideoSubmissionModal: (drillId: string, drillTitle: string) => void;
  onSendNote: (note: string) => void;
  noteToCoach: string;
  setNoteToCoach: (note: string) => void;
  isSubmittingNote: boolean;
  completedProgramDrills: Set<string>;
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
    routineAssignmentId: string,
    completed: boolean
  ) => void;
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

export default function ClientProgramDayModal({
  isOpen,
  onClose,
  selectedDay,
  selectedDate,
  programs = [],
  routineAssignments = [],
  lessonsForDate = [],
  onMarkDrillComplete,
  onMarkAllComplete,
  onOpenVideo,
  onOpenCommentModal,
  onOpenVideoSubmissionModal,
  onSendNote,
  noteToCoach,
  setNoteToCoach,
  isSubmittingNote,
  completedProgramDrills,
  calculateDayCompletionCounts,
  calculateDayAssignmentCounts,
  onMarkRoutineExerciseComplete,
}: ClientProgramDayModalProps) {
  const [activeTab, setActiveTab] = useState<string>("");
  const [viewedTabs, setViewedTabs] = useState<Set<string>>(new Set());

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
      programs.forEach((program, index) => {
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

    return tabs;
  };

  const tabs = generateTabs();

  // Set active tab to first unviewed tab, or first tab if all viewed
  React.useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      const unviewedTab = tabs.find(tab => !viewedTabs.has(tab.id));
      setActiveTab(unviewedTab ? unviewedTab.id : tabs[0].id);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-gray-800 rounded-3xl border-2 border-gray-600 w-full max-w-7xl max-h-[95vh] overflow-hidden transform transition-all duration-300 ease-out flex flex-col"
        style={{
          animation: "modalSlideIn 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {(() => {
                  // Use selectedDate if available, otherwise fall back to selectedDay.date
                  const dateToUse =
                    selectedDate ||
                    (selectedDay?.date
                      ? new Date(selectedDay.date)
                      : new Date());
                  const formattedDate = format(dateToUse, "EEEE, MMMM d, yyyy");

                  return formattedDate;
                })()}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Multiple Programs Assigned</span>
                {totalAssignments > 0 && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    {completedAssignments}/{totalAssignments} assignments
                    completed
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        {tabs.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-700 bg-gray-900/50 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium text-gray-300">
                Today's Assignments:
              </h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map(tab => {
                const isActive = tab.id === activeTab;
                const isViewed = viewedTabs.has(tab.id);

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap border",
                      isActive
                        ? `${tab.bgColor} ${tab.color} ${tab.borderColor}`
                        : "bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50"
                    )}
                  >
                    {tab.icon}
                    <span>{tab.title}</span>
                    {!isViewed && (
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    )}
                    {isViewed && (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 pb-8 overflow-y-auto flex-1">
          {tabs.length === 0 && lessonsForDate.length > 0 ? (
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
              const program = programs.find(p => p.programId === programId);

              if (!program) return <div>Program not found</div>;

              return program.isRestDay ? (
                <RestDayContent programTitle={program.programTitle} />
              ) : (
                <ProgramContent
                  program={program}
                  onMarkDrillComplete={onMarkDrillComplete}
                  onOpenVideo={onOpenVideo}
                  onOpenCommentModal={onOpenCommentModal}
                  onOpenVideoSubmissionModal={onOpenVideoSubmissionModal}
                  completedProgramDrills={completedProgramDrills}
                  routineAssignments={routineAssignments}
                  onMarkRoutineExerciseComplete={onMarkRoutineExerciseComplete}
                />
              );
            })()
          ) : currentTab?.type === "routine" ? (
            <RoutineContent
              routineAssignment={routineAssignments.find(
                assignment => `routine-${assignment.id}` === currentTab.id
              )}
              onMarkDrillComplete={onMarkDrillComplete}
              onMarkRoutineExerciseComplete={onMarkRoutineExerciseComplete}
              onOpenVideo={onOpenVideo}
              onOpenCommentModal={onOpenCommentModal}
              onOpenVideoSubmissionModal={onOpenVideoSubmissionModal}
              completedProgramDrills={completedProgramDrills}
            />
          ) : tabs.length === 0 && lessonsForDate.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">
                Nothing scheduled for this day
              </p>
              <p className="text-gray-500 text-sm">
                Check back later for updates from your coach
              </p>
            </div>
          ) : null}
        </div>

        {/* Actions Footer */}
        <div className="p-6 pb-8 border-t border-gray-700 bg-gray-900/50 flex-shrink-0">
          <div className="space-y-4">
            {/* Mark All Complete Button */}
            {totalDrills > 0 && (
              <Button
                onClick={onMarkAllComplete}
                className="w-full py-4 text-lg font-semibold rounded-2xl"
                disabled={completedDrills === totalDrills}
                style={{
                  backgroundColor:
                    completedDrills === totalDrills ? "#10B981" : "#4A5A70",
                }}
              >
                <Check className="h-5 w-5 mr-2" />
                {completedDrills === totalDrills
                  ? "All Complete! 🎉"
                  : `Mark All Complete (${completedDrills}/${totalDrills})`}
              </Button>
            )}

            {/* Note to Coach - Only show if there are programs/routines */}
            {tabs.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-white text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  Note to Coach
                </h4>
                <Textarea
                  placeholder="Add a note about your workout..."
                  value={noteToCoach}
                  onChange={e => setNoteToCoach(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-xl"
                  rows={3}
                />
                <Button
                  onClick={() => onSendNote(noteToCoach)}
                  disabled={!noteToCoach.trim() || isSubmittingNote}
                  className="w-full py-3 rounded-xl"
                  style={{ backgroundColor: "#10B981" }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmittingNote ? "Sending..." : "Send Note"}
                </Button>
              </div>
            )}

            {/* Progress Footer */}
            {tabs.length > 1 && (
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    {viewedTabs.size} of {tabs.length} assignments viewed
                  </div>
                  {unviewedCount > 0 && (
                    <button
                      onClick={() => {
                        setViewedTabs(new Set(tabs.map(tab => tab.id)));
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
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
  completedProgramDrills,
  routineAssignments = [],
  onMarkRoutineExerciseComplete,
}: {
  program: ProgramData;
  onMarkDrillComplete: (drillId: string, completed: boolean) => void;
  onOpenVideo: (videoUrl: string, drill: Drill) => void;
  onOpenCommentModal: (drill: Drill) => void;
  onOpenVideoSubmissionModal: (drillId: string, drillTitle: string) => void;
  completedProgramDrills: Set<string>;
  routineAssignments?: any[];
  onMarkRoutineExerciseComplete?: (
    exerciseId: string,
    routineAssignmentId: string,
    completed: boolean
  ) => void;
}) {
  // Combine program drills with routine exercises
  const allExercises = [...program.drills];

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
          completed: completedProgramDrills.has(routineExerciseKey),
          videoUrl: exercise.videoId
            ? `https://utfs.io/f/${exercise.videoId}`
            : undefined,
        };

        allExercises.push(drillLikeExercise);
      });
    }
  });

  // Check if backend expanded routine exercises, if not, do it in frontend
  console.log("🔍 ProgramContent Debug - program.drills:", program.drills);
  console.log("🔍 Program drills length:", program.drills.length);

  // Check if any drill has routineId (indicating it needs expansion)
  const drillsNeedingExpansion = program.drills.filter(
    drill => drill.routineId
  );
  console.log("🔍 Drills needing expansion:", drillsNeedingExpansion.length);

  if (drillsNeedingExpansion.length > 0) {
    console.log("🔍 Backend didn't expand routines, doing it in frontend");
    // The backend didn't expand routines, so we need to do it here
    // For now, we'll show a message that routines need to be expanded
    console.log(
      "⚠️ Routines need to be expanded by backend - this is a backend issue"
    );
  } else {
    // Check if any drill has a routine property (from the relation we added)
    const drillsWithRoutines = program.drills.filter(
      (drill: any) => drill.routine && drill.routine.exercises
    );
    console.log("🔍 Drills with routine property:", drillsWithRoutines.length);

    if (drillsWithRoutines.length > 0) {
      console.log("🔍 Found drills with routine data, expanding in frontend");
      drillsWithRoutines.forEach((drill: any) => {
        console.log(
          "🔍 Expanding routine:",
          drill.routine.name,
          "with",
          drill.routine.exercises.length,
          "exercises"
        );
        drill.routine.exercises.forEach((exercise: any) => {
          const routineExerciseKey = `${drill.id}-routine-${exercise.id}`;
          const drillLikeExercise: Drill = {
            id: routineExerciseKey,
            title: exercise.title,
            description: exercise.description || undefined,
            sets: exercise.sets || undefined,
            reps: exercise.reps || undefined,
            tempo: exercise.tempo || undefined,
            tags: exercise.type ? [exercise.type] : undefined,
            completed: completedProgramDrills.has(routineExerciseKey),
            videoUrl: exercise.videoId
              ? `https://utfs.io/f/${exercise.videoId}`
              : undefined,
          };
          allExercises.push(drillLikeExercise);
        });
      });
    }
  }

  program.drills.forEach((drill, index) => {
    console.log(`🔍 Drill ${index}:`, {
      id: drill.id,
      title: drill.title,
      hasVideoUrl: !!drill.videoUrl,
      hasVideoId: !!drill.videoId,
      isRoutineExercise: drill.id.includes("-routine-"),
      routineId: drill.routineId,
      originalDrillId: drill.originalDrillId,
    });
  });
  console.log("🔍 Final allExercises:", allExercises);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-400" />
          Today's Workout
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {allExercises.map((drill, index) => {
          // Create a drill object with the current completion state
          const drillWithCompletion: Drill = {
            ...drill,
            completed: completedProgramDrills.has(drill.id),
          };

          return (
            <DrillCard
              key={drill.id}
              drill={drillWithCompletion}
              index={index}
              onMarkComplete={completed => {
                // All program drills (including expanded routine exercises) use the same handler
                if (drill.id.includes("-") && onMarkRoutineExerciseComplete) {
                  // This is a standalone routine exercise
                  const [assignmentId, exerciseId] = drill.id.split("-");
                  onMarkRoutineExerciseComplete(
                    exerciseId,
                    assignmentId,
                    completed
                  );
                } else {
                  // This is a regular program drill or expanded routine exercise
                  onMarkDrillComplete(drill.id, completed);
                }
              }}
              onOpenVideo={() =>
                drill.videoUrl && onOpenVideo(drill.videoUrl, drill)
              }
              onOpenComment={() => onOpenCommentModal(drill)}
              onOpenVideoSubmission={() =>
                onOpenVideoSubmissionModal(drill.id, drill.title)
              }
            />
          );
        })}
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
  completedProgramDrills,
}: {
  routineAssignment?: RoutineAssignment;
  onMarkDrillComplete: (drillId: string, completed: boolean) => void;
  onMarkRoutineExerciseComplete: (
    exerciseId: string,
    routineAssignmentId: string,
    completed: boolean
  ) => void;
  onOpenVideo: (videoUrl: string, drill: Drill) => void;
  onOpenCommentModal: (drill: Drill) => void;
  onOpenVideoSubmissionModal: (drillId: string, drillTitle: string) => void;
  completedProgramDrills: Set<string>;
}) {
  if (!routineAssignment) {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {routine.exercises && routine.exercises.length > 0 ? (
          routine.exercises.map((exercise, index) => {
            // Convert routine exercise to drill-like format for compatibility
            // Use the key format for routine exercises: ${routineAssignmentId}-${exerciseId}
            const routineExerciseKey = `${routineAssignment.id}-${exercise.id}`;

            const drillLikeExercise: Drill = {
              id: routineExerciseKey,
              title: exercise.title,
              description: exercise.description || undefined,
              sets: exercise.sets || undefined,
              reps: exercise.reps || undefined,
              tempo: exercise.tempo || undefined,
              tags: exercise.type ? [exercise.type] : undefined,
              completed: completedProgramDrills.has(routineExerciseKey),
              videoUrl: exercise.videoId
                ? `https://utfs.io/f/${exercise.videoId}`
                : undefined,
            };

            return (
              <DrillCard
                key={exercise.id}
                drill={drillLikeExercise}
                index={index}
                onMarkComplete={completed =>
                  onMarkRoutineExerciseComplete(
                    exercise.id,
                    routineAssignment.id,
                    completed
                  )
                }
                onOpenVideo={() =>
                  drillLikeExercise.videoUrl &&
                  onOpenVideo(drillLikeExercise.videoUrl, drillLikeExercise)
                }
                onOpenComment={() => onOpenCommentModal(drillLikeExercise)}
                onOpenVideoSubmission={() =>
                  onOpenVideoSubmissionModal(exercise.id, exercise.title)
                }
              />
            );
          })
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
}: {
  drill: Drill;
  index: number;
  onMarkComplete: (completed: boolean) => void;
  onOpenVideo: () => void;
  onOpenComment: () => void;
  onOpenVideoSubmission: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-4 border transition-all duration-200",
        drill.supersetId
          ? "bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30"
          : "bg-gray-700/50 border-gray-600 hover:bg-gray-700/70"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-400">
              #{index + 1}
            </span>
            <h4 className="text-lg font-bold text-white">{drill.title}</h4>
            {drill.supersetId && (
              <div className="flex items-center gap-1 text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded">
                <Link className="h-3 w-3" />
                <span className="font-medium">SUPERSET</span>
              </div>
            )}
          </div>

          {/* Sets, Reps, Tempo */}
          <div className="flex items-center gap-4 mb-2">
            {drill.sets && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Sets:</span>
                <span className="text-white font-semibold">{drill.sets}</span>
              </div>
            )}
            {drill.reps && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Reps:</span>
                <span className="text-white font-semibold">{drill.reps}</span>
              </div>
            )}
            {drill.tempo && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Tempo:</span>
                <span className="text-white font-semibold">{drill.tempo}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {drill.tags && drill.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {drill.tags.map((tag: any, tagIndex: number) => (
                <Badge
                  key={tagIndex}
                  variant="outline"
                  className="text-xs border-blue-500 text-blue-400"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            {drill.videoUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenVideo}
                className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white text-xs px-2 py-1"
              >
                <Play className="h-3 w-3 mr-1" />
                Demo
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenComment}
              className="border-gray-500 text-gray-400 hover:bg-gray-600 text-xs px-2 py-1"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Note
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenVideoSubmission}
              className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white text-xs px-2 py-1"
            >
              <Video className="h-3 w-3 mr-1" />
              Record
            </Button>
          </div>
        </div>

        {/* Completion Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMarkComplete(!drill.completed)}
          className={cn(
            "h-12 w-12 p-0 rounded-lg transition-all duration-200",
            drill.completed
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-gray-600 text-gray-300 hover:bg-gray-500"
          )}
        >
          <Check className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
