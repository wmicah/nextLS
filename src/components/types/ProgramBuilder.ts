// Types for ProgramBuilder components

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface ProgramItem {
  id: string;
  title: string;
  type?: "exercise" | "drill" | "video" | "routine" | "superset" | "rest";
  description?: string;
  notes?: string;
  sets?: number;
  reps?: number;
  tempo?: string;
  duration?: string;
  videoUrl?: string;
  videoId?: string;
  videoTitle?: string;
  videoThumbnail?: string;
  routineId?: string;
  supersetId?: string; // ID of the superset group
  supersetOrder?: number; // Order within the superset (1 or 2)
  // Coach Instructions for better client guidance
  coachInstructions?: {
    whatToDo: string; // What the client should do
    howToDoIt: string; // How to perform the exercise
    keyPoints: string[]; // Key coaching points
    commonMistakes: string[]; // What to avoid
    equipment?: string; // Required equipment
  };
}

export interface Week {
  id: string;
  name: string; // "Week 1", "Week 2", etc.
  days: Record<DayKey, ProgramItem[]>;
  collapsed?: boolean;
}

export interface ProgramBuilderProps {
  onSave?: (weeks: Week[]) => void;
  initialWeeks?: Week[];
  programDetails?: {
    title: string;
    description?: string;
    level: string;
    duration: number;
    onBack?: () => void;
    onSave?: (weeks?: Week[]) => void;
    isSaving?: boolean;
    lastSaved?: Date | null;
  };
  onOpenVideoLibrary?: () => void;
  selectedVideoFromLibrary?: {
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null;
  onVideoProcessed?: () => void;
}
