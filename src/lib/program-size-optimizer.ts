// NextLevel Coaching - Program Size Optimizer
// Help optimize program data before sending to server

export interface ProgramData {
  title: string;
  description?: string;
  level: string;
  duration: number;
  weeks: Array<{
    weekNumber: number;
    title: string;
    description?: string;
    days: Array<{
      dayNumber: number;
      title: string;
      description?: string;
      drills: Array<{
        order: number;
        title: string;
        description?: string;
        duration?: string;
        videoUrl?: string;
        notes?: string;
        sets?: number;
        reps?: number;
        tempo?: string;
        supersetId?: string;
        supersetOrder?: number;
      }>;
    }>;
  }>;
}

// Optimize program data to reduce payload size
export function optimizeProgramData(data: ProgramData): ProgramData {
  return {
    ...data,
    weeks: data.weeks.map(week => ({
      ...week,
      days: week.days.map(day => ({
        ...day,
        drills: day.drills.map(drill => ({
          ...drill,
          // Remove empty strings and undefined values
          description: drill.description || undefined,
          duration: drill.duration || undefined,
          videoUrl: drill.videoUrl || undefined,
          notes: drill.notes || undefined,
          tempo: drill.tempo || undefined,
          sets: drill.sets || undefined,
          reps: drill.reps || undefined,
          supersetId: drill.supersetId || undefined,
          supersetOrder: drill.supersetOrder || undefined,
        })),
      })),
    })),
  };
}

// Check if program is too complex for Vercel
export function isProgramTooComplex(data: ProgramData): {
  isTooComplex: boolean;
  reasons: string[];
  suggestions: string[];
} {
  const reasons: string[] = [];
  const suggestions: string[] = [];

  const totalWeeks = data.weeks.length;
  const totalDays = data.weeks.reduce((acc, week) => acc + week.days.length, 0);
  const totalDrills = data.weeks.reduce(
    (acc, week) =>
      acc + week.days.reduce((dayAcc, day) => dayAcc + day.drills.length, 0),
    0
  );

  // Check limits
  if (totalWeeks > 20) {
    reasons.push(`Too many weeks (${totalWeeks}). Limit: 20 weeks`);
    suggestions.push("Consider splitting into multiple programs");
  }

  if (totalDays > 100) {
    reasons.push(`Too many days (${totalDays}). Limit: 100 days`);
    suggestions.push("Reduce the number of days per week");
  }

  if (totalDrills > 500) {
    reasons.push(`Too many drills (${totalDrills}). Limit: 500 drills`);
    suggestions.push("Reduce drills per day or use simpler exercises");
  }

  // Check for very long text fields
  if (data.description && data.description.length > 1000) {
    reasons.push("Description too long");
    suggestions.push("Shorten the program description");
  }

  // Check for very long drill descriptions
  const longDrillDescriptions = data.weeks.some(week =>
    week.days.some(day =>
      day.drills.some(
        drill => drill.description && drill.description.length > 200
      )
    )
  );

  if (longDrillDescriptions) {
    reasons.push("Some drill descriptions are too long");
    suggestions.push("Shorten drill descriptions to under 200 characters");
  }

  return {
    isTooComplex: reasons.length > 0,
    reasons,
    suggestions,
  };
}

// Get program statistics
export function getProgramStats(data: ProgramData) {
  const totalWeeks = data.weeks.length;
  const totalDays = data.weeks.reduce((acc, week) => acc + week.days.length, 0);
  const totalDrills = data.weeks.reduce(
    (acc, week) =>
      acc + week.days.reduce((dayAcc, day) => dayAcc + day.drills.length, 0),
    0
  );

  const avgDaysPerWeek = totalDays / totalWeeks;
  const avgDrillsPerDay = totalDrills / totalDays;

  return {
    totalWeeks,
    totalDays,
    totalDrills,
    avgDaysPerWeek: Math.round(avgDaysPerWeek * 10) / 10,
    avgDrillsPerDay: Math.round(avgDrillsPerDay * 10) / 10,
  };
}

// Estimate payload size
export function estimatePayloadSize(data: ProgramData): number {
  const jsonString = JSON.stringify(data);
  return new Blob([jsonString]).size;
}

// Format size for display
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
