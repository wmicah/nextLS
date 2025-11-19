/**
 * Clipboard types for copy/paste functionality in ClientDetailPage
 */

export interface ClipboardData {
  type: "assignments";
  sourceDate: string; // ISO date string (YYYY-MM-DD)
  assignments: {
    routines: ClipboardRoutineAssignment[];
    programs: ClipboardProgramAssignment[];
    videos: ClipboardVideoAssignment[];
  };
  copiedAt: Date;
  sourceClientId: string;
}

export interface ClipboardRoutineAssignment {
  id: string;
  routineId: string;
  routineName: string;
  startDate: string;
}

export interface ClipboardProgramAssignment {
  id: string;
  programId: string;
  programTitle: string;
  weekNumber: number;
  dayNumber: number;
  isRestDay: boolean;
  drillCount: number;
  assignmentId: string;
  // Program day content for copying
  dayTitle: string;
  dayDescription?: string;
  drills: Array<{
    id: string;
    title: string;
    description?: string;
    duration?: string;
    videoUrl?: string;
    notes?: string;
    sets?: number | undefined;
    reps?: number | undefined;
    tempo?: string;
    order: number;
    routineId?: string;
    // Superset fields
    supersetId?: string;
    supersetOrder?: number;
    supersetDescription?: string;
    supersetInstructions?: string;
    supersetNotes?: string;
    // Coach Instructions fields
    coachInstructionsWhatToDo?: string;
    coachInstructionsHowToDoIt?: string;
    coachInstructionsKeyPoints?: string[];
    coachInstructionsCommonMistakes?: string[];
    coachInstructionsEasier?: string;
    coachInstructionsHarder?: string;
    coachInstructionsEquipment?: string;
    coachInstructionsSetup?: string;
    // Video fields
    videoId?: string;
    videoThumbnail?: string;
    videoTitle?: string;
    // Type field
    type?: string;
  }>;
}

export interface ClipboardVideoAssignment {
  id: string;
  videoId: string;
  videoTitle: string;
  dueDate: string;
  notes?: string;
}

export interface ConflictResolution {
  type: "replace" | "merge" | "skip";
  targetDate: string;
  existingAssignments: {
    routines: number;
    programs: number;
    videos: number;
  };
  clipboardAssignments: {
    routines: number;
    programs: number;
    videos: number;
  };
}

export type CopyPasteMode = "copy" | "paste" | null;
