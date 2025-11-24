export type CalendarEventType =
  | "program-day"
  | "lesson"
  | "pending-lesson"
  | "routine"
  | "temporary-program"
  | "video";

export interface CalendarEventData {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string; // ISO date string
  time?: string;
  description?: string;
  items?: Array<{
    title: string;
    sets?: number;
    reps?: number;
  }>;
  // Additional metadata
  status?: string; // For lessons
  isCompleted?: boolean; // For routines
  isMissed?: boolean; // For routines
}

export interface HoveredEventState {
  event: CalendarEventData;
  triggerRect: DOMRect;
  placement: "top" | "bottom";
}

