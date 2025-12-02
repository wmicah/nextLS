/**
 * Clipboard types for copy/paste functionality in ClientDetailPage
 */

export interface ClipboardData {
  type: "assignments";
  sourceDate: string; // ISO date string (YYYY-MM-DD) - first day for single day, or first day for multi-day
  sourceDates?: string[]; // Array of source dates for multi-day copy (in order)
  isMultiDay?: boolean; // Flag to indicate if this is a multi-day copy
  allInSameWeek?: boolean; // Flag to indicate if all copied days are in the same week (for smart paste mode)
  assignments: {
    routines: ClipboardRoutineAssignment[];
    programs: ClipboardProgramAssignment[];
    videos: ClipboardVideoAssignment[];
  };
  multiDayAssignments?: Array<{ // Array of assignments for each day (in order)
    dayOffset: number; // Days offset from first day (0, 1, 2, etc.) - used for sequential paste
    dayOfWeek?: number; // Day of week (0 = Sunday, 1 = Monday, etc.) - used for day-of-week matching paste
    assignments: {
      routines: ClipboardRoutineAssignment[];
      programs: ClipboardProgramAssignment[];
      videos: ClipboardVideoAssignment[];
    };
  }>;
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
