/**
 * Client sorting utilities
 * Handles sorting logic for client lists, including program due date calculations
 */

import { getStartOfDay, calculateProgramEndDate, isTodayOrFuture } from "./date-utils";

/**
 * Client interface for sorting (subset of full Client type)
 */
export interface ClientForSorting {
  id: string;
  name: string;
  createdAt: string;
  nextLessonDate: string | null;
  programAssignments?: Array<{
    id: string;
    startDate: string | null;
    completed: boolean;
    completedAt: string | null;
    program: {
      id: string;
      title: string;
      duration: number;
    };
  }>;
}

/**
 * Debug information for program assignment processing
 */
export interface ProgramAssignmentDebugInfo {
  id: string;
  programTitle: string;
  completed: boolean;
  completedAt: string | null;
  startDate: string | null;
  duration: number;
  reason?: string;
  endDate?: string;
  endDateTime?: number;
  todayTime?: number;
  included?: boolean;
}

/**
 * Debug information for client sorting
 */
export interface ClientSortingDebugInfo {
  clientName: string;
  today: string;
  programAssignments: ProgramAssignmentDebugInfo[];
  includedDates: string[];
  allEndDates?: string[];
  allEndDateTimes?: number[];
  maxTime?: number;
  result: string | null;
  resultTime?: number;
}

/**
 * Development-only logger
 */
const devLog = process.env.NODE_ENV === "development" ? console.log : () => {};

/**
 * Get the latest program end date for a client
 * Only considers active, non-completed programs that end today or in the future
 * 
 * @param client - The client to check
 * @param enableDebug - Whether to log debug information (default: true in development)
 * @returns The latest program end date, or null if no active programs found
 */
export function getLatestProgramDueDate(
  client: ClientForSorting,
  enableDebug: boolean = process.env.NODE_ENV === "development"
): Date | null {
  const now = new Date();
  const today = getStartOfDay(now);
  const todayTime = today.getTime();
  const allDueDates: Date[] = [];

  const debugInfo: ClientSortingDebugInfo = {
    clientName: client.name,
    today: today.toISOString().split("T")[0],
    programAssignments: [],
    includedDates: [],
    result: null,
  };

  // Process all active, non-completed program assignments
  if (client.programAssignments && client.programAssignments.length > 0) {
    for (const assignment of client.programAssignments) {
      const assignmentInfo: ProgramAssignmentDebugInfo = {
        id: assignment.id,
        programTitle: assignment.program.title,
        completed: assignment.completed,
        completedAt: assignment.completedAt,
        startDate: assignment.startDate,
        duration: assignment.program.duration,
      };

      // Skip completed assignments (check both completed flag and completedAt)
      if (assignment.completed || assignment.completedAt) {
        assignmentInfo.reason = "Skipped: completed";
        debugInfo.programAssignments.push(assignmentInfo);
        continue;
      }

      // Must have a startDate to calculate end date properly
      if (!assignment.startDate) {
        assignmentInfo.reason = "Skipped: no startDate";
        debugInfo.programAssignments.push(assignmentInfo);
        continue;
      }

      const startDate = new Date(assignment.startDate);

      // Validate the date
      if (isNaN(startDate.getTime())) {
        assignmentInfo.reason = "Skipped: invalid startDate";
        debugInfo.programAssignments.push(assignmentInfo);
        continue;
      }

      // Calculate end date: startDate + (duration * 7 days)
      const endDate = calculateProgramEndDate(startDate, assignment.program.duration);
      const endDateTime = endDate.getTime();
      const endDateStr = endDate.toISOString().split("T")[0];

      assignmentInfo.endDate = endDateStr;
      assignmentInfo.endDateTime = endDateTime;
      assignmentInfo.todayTime = todayTime;

      // Only include programs that end today or in the future
      if (isTodayOrFuture(endDate, today)) {
        allDueDates.push(endDate);
        assignmentInfo.included = true;
        debugInfo.includedDates.push(endDateStr);
      } else {
        assignmentInfo.reason = `Skipped: endDate (${endDateStr}) is in the past`;
      }
      debugInfo.programAssignments.push(assignmentInfo);
    }
  }

  // If no program assignments found (or all programs ended in the past), return null
  if (allDueDates.length === 0) {
    debugInfo.result = null;
    debugInfo.allEndDates = [];
    if (enableDebug) {
      devLog("getLatestProgramDueDate (Programs Only):", debugInfo);
    }
    return null;
  }

  // Find the LATEST (maximum) date among all program end dates
  // This is the final date of the last program the client has
  const allEndDateStrings = allDueDates.map((d) => d.toISOString().split("T")[0]);
  const allEndDateTimes = allDueDates.map((d) => d.getTime());
  const maxTime = Math.max(...allEndDateTimes);
  const latestDate = new Date(maxTime);

  debugInfo.allEndDates = allEndDateStrings;
  debugInfo.allEndDateTimes = allEndDateTimes;
  debugInfo.maxTime = maxTime;
  debugInfo.result = latestDate.toISOString().split("T")[0];
  debugInfo.resultTime = latestDate.getTime();

  if (enableDebug) {
    devLog("getLatestProgramDueDate (Programs Only):", {
      clientName: debugInfo.clientName,
      allEndDates: allEndDateStrings,
      latestDate: latestDate.toISOString().split("T")[0],
      programCount: debugInfo.programAssignments.length,
      includedCount: allDueDates.length,
    });
  }

  return latestDate;
}

/**
 * Compare two clients for sorting by program due date
 * Clients with no active programs come first
 * 
 * @param a - First client
 * @param b - Second client
 * @param sortOrder - Sort order ('asc' or 'desc')
 * @param enableDebug - Whether to log debug information
 * @returns Comparison result (-1, 0, or 1)
 */
export function compareClientsByProgramDueDate(
  a: ClientForSorting,
  b: ClientForSorting,
  sortOrder: "asc" | "desc" = "asc",
  enableDebug: boolean = process.env.NODE_ENV === "development"
): number {
  const aLatestDate = getLatestProgramDueDate(a, enableDebug);
  const bLatestDate = getLatestProgramDueDate(b, enableDebug);

  // Prioritize clients with NO programs (most urgent - need assignment)
  if (!aLatestDate && !bLatestDate) {
    // Both have no assignments - sort by creation date (newest first)
    const aCreated = new Date(a.createdAt).getTime();
    const bCreated = new Date(b.createdAt).getTime();
    const diff = sortOrder === "asc" ? bCreated - aCreated : aCreated - bCreated;
    
    if (enableDebug) {
      devLog("Final comparison (both no assignments):", {
        clientA: a.name,
        clientB: b.name,
        aLatestDate: null,
        bLatestDate: null,
        aCreated: new Date(a.createdAt).toISOString().split("T")[0],
        bCreated: new Date(b.createdAt).toISOString().split("T")[0],
        diff,
        result: diff < 0 ? `${a.name} first` : diff > 0 ? `${b.name} first` : "equal",
      });
    }
    return diff;
  } else if (!aLatestDate && bLatestDate) {
    // A has no assignments, B has assignments - A comes first (needs assignment)
    if (enableDebug) {
      devLog("Final comparison (A no assignments):", {
        clientA: a.name,
        clientB: b.name,
        aLatestDate: null,
        bLatestDate: bLatestDate.toISOString().split("T")[0],
        diff: -1,
        result: `${a.name} first (no assignments)`,
      });
    }
    return -1;
  } else if (aLatestDate && !bLatestDate) {
    // B has no assignments, A has assignments - B comes first (needs assignment)
    if (enableDebug) {
      devLog("Final comparison (B no assignments):", {
        clientA: a.name,
        clientB: b.name,
        aLatestDate: aLatestDate.toISOString().split("T")[0],
        bLatestDate: null,
        diff: 1,
        result: `${b.name} first (no assignments)`,
      });
    }
    return 1;
  } else {
    // Both have assignments - compare by latest due date
    // Earlier latest date comes first (client ending sooner comes first)
    const aTime = aLatestDate!.getTime();
    const bTime = bLatestDate!.getTime();
    const diff = sortOrder === "asc" ? aTime - bTime : bTime - aTime;

    if (enableDebug) {
      devLog("Final comparison (both have assignments):", {
        clientA: a.name,
        clientB: b.name,
        aLatestDate: aLatestDate!.toISOString().split("T")[0],
        bLatestDate: bLatestDate!.toISOString().split("T")[0],
        aTime,
        bTime,
        diff,
        sortOrder,
        result: diff < 0 ? `${a.name} first` : diff > 0 ? `${b.name} first` : "equal",
      });
    }

    return diff;
  }
}

