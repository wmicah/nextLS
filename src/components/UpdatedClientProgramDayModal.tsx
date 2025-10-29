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
import { useExerciseCompletion } from "@/hooks/useExerciseCompletion";
import SimpleDrillCard from "./SimpleDrillCard";

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
  // Video properties
  isYoutube?: boolean;
  youtubeId?: string;
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
  drills: Drill[];
  isRestDay: boolean;
  expectedTime: number;
  completedDrills: number;
  totalDrills: number;
  videoAssignments?: any[];
}

interface UpdatedClientProgramDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDay: DayData | null;
  selectedDate?: Date | null;
  programs?: ProgramData[];
  routineAssignments?: any[];
  lessonsForDate?: any[];
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
  completedProgramDrills: Set<string>;
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
  completedIndividualExercises: Set<string>;
}

export default function UpdatedClientProgramDayModal({
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
  completedProgramDrills,
  completedVideoAssignments,
  calculateDayCompletionCounts,
  calculateDayAssignmentCounts,
  onMarkRoutineExerciseComplete,
  completedIndividualExercises,
}: UpdatedClientProgramDayModalProps) {
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
  const generateTabs = () => {
    const tabs = [];

    // Add program tabs for each program
    if (programs && programs.length > 0) {
      const hasWorkouts = programs.some(program => !program.isRestDay);
      const hasRoutines = routineAssignments && routineAssignments.length > 0;
      const hasActiveContent = hasWorkouts || hasRoutines;

      programs.forEach((program, index) => {
        if (program.isRestDay && hasActiveContent) {
          return; // Skip rest days when active content exists
        }

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

    // Add routine tabs for standalone routines
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
      const firstUnviewedTab = tabs.find(tab => !viewedTabs.has(tab.id));
      if (firstUnviewedTab) {
        setActiveTab(firstUnviewedTab.id);
        setViewedTabs(prev => new Set(prev).add(firstUnviewedTab.id));
      } else {
        setActiveTab(tabs[0].id);
      }
    }
  }, [tabs, activeTab, viewedTabs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-3xl border-2 border-gray-600 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM d, yyyy")
                : "Workout Details"}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-400">
                  {completedDrills}/{totalDrills} exercises completed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-400">
                  {completedAssignments}/{totalAssignments} assignments
                  completed
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {tabs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">
                Nothing scheduled for this day
              </p>
              <p className="text-gray-500 text-sm">
                Check back later for updates from your coach
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tab Navigation */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setViewedTabs(prev => new Set(prev).add(tab.id));
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                      activeTab === tab.id
                        ? `${tab.bgColor} ${tab.color} ${tab.borderColor} border`
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-300"
                    )}
                  >
                    {tab.icon}
                    {tab.title}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab && (
                <div className="space-y-4">
                  {activeTab.startsWith("program-") && (
                    <ProgramContent
                      program={
                        programs.find(
                          p => `program-${p.programId}` === activeTab
                        )!
                      }
                      onMarkDrillComplete={onMarkDrillComplete}
                      onOpenVideo={onOpenVideo}
                      onOpenCommentModal={onOpenCommentModal}
                      onOpenVideoSubmissionModal={onOpenVideoSubmissionModal}
                      isExerciseCompleted={isExerciseCompleted}
                      markExerciseComplete={markExerciseComplete}
                    />
                  )}

                  {activeTab.startsWith("routine-") && (
                    <RoutineContent
                      routineAssignment={routineAssignments.find(
                        (r: any) => `routine-${r.id}` === activeTab
                      )}
                      onMarkDrillComplete={onMarkDrillComplete}
                      onOpenVideo={onOpenVideo}
                      onOpenCommentModal={onOpenCommentModal}
                      onOpenVideoSubmissionModal={onOpenVideoSubmissionModal}
                      isExerciseCompleted={isExerciseCompleted}
                      markExerciseComplete={markExerciseComplete}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Textarea
                placeholder="Add a note for your coach..."
                value={noteToCoach}
                onChange={e => setNoteToCoach(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                rows={2}
              />
            </div>
            <div className="ml-4 flex gap-2">
              <Button
                onClick={() => onSendNote(noteToCoach)}
                disabled={!noteToCoach.trim() || isSubmittingNote}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmittingNote ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Note
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
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
  isExerciseCompleted,
  markExerciseComplete,
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
  isExerciseCompleted: (exerciseId: string, programDrillId?: string) => boolean;
  markExerciseComplete: (
    exerciseId: string,
    programDrillId: string | undefined,
    completed: boolean
  ) => Promise<void>;
}) {
  // Combine program drills with routine exercises
  const allExercises: Drill[] = [];

  // Add all regular drills
  program.drills.forEach((drill: any) => {
    if (drill.routine && drill.routine.exercises) {
      // This drill has a routine - expand it
      drill.routine.exercises.forEach((exercise: any) => {
        allExercises.push({
          id: exercise.id,
          title: exercise.title,
          description: exercise.description,
          sets: exercise.sets,
          reps: exercise.reps,
          tempo: exercise.tempo,
          tags: exercise.type ? [exercise.type] : undefined,
          videoUrl: exercise.videoUrl,
          isYoutube: isYouTubeUrl(exercise.videoUrl || ""),
          youtubeId: extractYouTubeId(exercise.videoUrl || "") || undefined,
          isRoutineExercise: true,
          originalExerciseId: exercise.id,
          routineAssignmentId: drill.id,
        });
      });
    } else {
      // Regular drill
      allExercises.push({
        id: drill.id,
        title: drill.title,
        description: drill.description,
        sets: drill.sets,
        reps: drill.reps,
        tempo: drill.tempo,
        tags: drill.tags,
        videoUrl: drill.videoUrl,
        isYoutube: isYouTubeUrl(drill.videoUrl || ""),
        youtubeId: extractYouTubeId(drill.videoUrl || "") || undefined,
      });
    }
  });

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
        {allExercises.map((drill, index) => {
          const isCompleted = drill.isRoutineExercise
            ? isExerciseCompleted(
                drill.originalExerciseId!,
                drill.routineAssignmentId
              )
            : isExerciseCompleted(drill.id);

          return (
            <SimpleDrillCard
              key={drill.id}
              drill={drill}
              index={index}
              isCompleted={isCompleted}
              onMarkComplete={async completed => {
                if (drill.isRoutineExercise) {
                  await markExerciseComplete(
                    drill.originalExerciseId!,
                    drill.routineAssignmentId,
                    completed
                  );
                } else {
                  await markExerciseComplete(drill.id, undefined, completed);
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
  onOpenVideo,
  onOpenCommentModal,
  onOpenVideoSubmissionModal,
  isExerciseCompleted,
  markExerciseComplete,
}: {
  routineAssignment?: any;
  onMarkDrillComplete: (
    drillId: string,
    completed: boolean,
    programAssignmentId?: string
  ) => void;
  onOpenVideo: (videoUrl: string, drill: Drill) => void;
  onOpenCommentModal: (drill: Drill) => void;
  onOpenVideoSubmissionModal: (drillId: string, drillTitle: string) => void;
  isExerciseCompleted: (exerciseId: string, programDrillId?: string) => boolean;
  markExerciseComplete: (
    exerciseId: string,
    programDrillId: string | undefined,
    completed: boolean
  ) => Promise<void>;
}) {
  if (!routineAssignment) {
    return (
      <div className="text-center py-8">
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
        <h3 className="text-xl font-bold text-white mb-2">{routine.name}</h3>
        {routine.description && (
          <p className="text-gray-400">{routine.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {routine.exercises.map((exercise: any, index: number) => {
          const isCompleted = isExerciseCompleted(exercise.id);

          return (
            <SimpleDrillCard
              key={exercise.id}
              drill={{
                id: exercise.id,
                title: exercise.title,
                description: exercise.description,
                sets: exercise.sets,
                reps: exercise.reps,
                tempo: exercise.tempo,
                tags: exercise.type ? [exercise.type] : undefined,
                videoUrl: exercise.videoUrl,
                isYoutube: isYouTubeUrl(exercise.videoUrl || ""),
                youtubeId:
                  extractYouTubeId(exercise.videoUrl || "") || undefined,
              }}
              index={index}
              isCompleted={isCompleted}
              onMarkComplete={async completed => {
                await markExerciseComplete(exercise.id, undefined, completed);
              }}
              onOpenVideo={() =>
                exercise.videoUrl && onOpenVideo(exercise.videoUrl, exercise)
              }
              onOpenComment={() => onOpenCommentModal(exercise)}
              onOpenVideoSubmission={() =>
                onOpenVideoSubmissionModal(exercise.id, exercise.title)
              }
            />
          );
        })}
      </div>
    </div>
  );
}
