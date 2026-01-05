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
      weeks?: Array<{
        id: string;
        weekNumber: number;
        days: Array<{
          id: string;
          dayNumber: number;
          isRestDay: boolean;
        }>;
      }>;
    };
    replacements?: Array<{
      id: string;
      replacedDate: string;
      replacementReason: string;
    }>;
  }>;
  routineAssignments?: Array<{
    id: string;
    routineId: string;
    assignedAt: string;
    startDate: string | null;
    completedAt: string | null;
    routine: {
      id: string;
      name: string;
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
  lastWorkingDayOverallNumber?: number;
  actualLastWorkingDayNumber?: number;
  replacedOverallDayNumbers?: number[];
  replacedDaysCount?: number;
}

/**
 * Debug information for routine assignment processing
 */
export interface RoutineAssignmentDebugInfo {
  id: string;
  routineName: string;
  completedAt: string | null;
  startDate: string | null;
  assignedAt: string;
  reason?: string;
  dueDate?: string;
  dueDateTime?: number;
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
  routineAssignments?: RoutineAssignmentDebugInfo[];
  includedDates: string[];
  allProgramEndDates?: string[];
  allRoutineStartDates?: string[];
  allDueDateTimes?: number[];
  minTime?: number;
  result: string | null;
  resultTime?: number;
}

/**
 * Development-only logger
 */
const devLog = process.env.NODE_ENV === "development" ? console.log : () => {};

/**
 * Get the due date timestamp for a client
 * Returns a numeric timestamp (milliseconds since epoch) or -Infinity if no due date
 * Considers both active programs (latest end date) and active routines (earliest start date)
 * Returns the earliest "thing that needs attention"
 * 
 * @param client - The client to check
 * @param enableDebug - Whether to log debug information (default: true in development)
 * @returns Numeric timestamp of earliest due date, or -Infinity if no active assignments
 */
export function getClientDueTimestamp(
  client: ClientForSorting,
  enableDebug: boolean = process.env.NODE_ENV === "development"
): number {
  const now = new Date();
  const today = getStartOfDay(now);
  const todayTime = today.getTime();
  const allDueDateTimes: number[] = [];

  const debugInfo: ClientSortingDebugInfo = {
    clientName: client.name,
    today: today.toISOString().split("T")[0],
    programAssignments: [],
    routineAssignments: [],
    includedDates: [],
    result: null,
  };

  // Process all active, non-completed program assignments
  const programEndDates: Date[] = [];
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

      // Skip temporary programs (identified by [TEMP] prefix in title)
      // Temp programs are single-day replacements and shouldn't affect sorting
      if (assignment.program.title.startsWith("[TEMP]")) {
        assignmentInfo.reason = "Skipped: temporary program (single-day replacement)";
        debugInfo.programAssignments.push(assignmentInfo);
        continue;
      }

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
      const startDateTime = startDate.getTime();

      // Validate the date - catch NaN early
      if (isNaN(startDateTime)) {
        assignmentInfo.reason = `Skipped: invalid startDate (${assignment.startDate})`;
        debugInfo.programAssignments.push(assignmentInfo);
        continue;
      }

      // Find the DATE of the LAST WORKING DAY (non-rest day) of the program
      // dayNumber is per-week (1-7), so we need to calculate the overall day number
      // Overall day number = (weekNumber - 1) * 7 + dayNumber
      // We only consider days where isRestDay = false
      // Example: If Day 4 is workout and Days 5-7 are rest, we use Day 4
      
      let lastWorkingDayOverallNumber = 0;
      if (assignment.program.weeks && assignment.program.weeks.length > 0) {
        // Find the highest overall day number for NON-REST days only
        for (const week of assignment.program.weeks) {
          if (week.days && week.days.length > 0) {
            for (const day of week.days) {
              // Skip rest days - only count working days
              if (day.isRestDay) {
                continue;
              }
              
              // Calculate overall day number: (weekNumber - 1) * 7 + dayNumber
              // Week 1, Day 1 = (1-1)*7 + 1 = 1
              // Week 1, Day 7 = (1-1)*7 + 7 = 7
              // Week 2, Day 1 = (2-1)*7 + 1 = 8
              // Week 4, Day 7 = (4-1)*7 + 7 = 28
              const overallDayNumber = (week.weekNumber - 1) * 7 + day.dayNumber;
              if (overallDayNumber > lastWorkingDayOverallNumber) {
                lastWorkingDayOverallNumber = overallDayNumber;
              }
            }
          }
        }
      } else {
        // Fallback: if weeks/days not available, use duration * 7
        // Assume all days are working days in fallback
        lastWorkingDayOverallNumber = assignment.program.duration * 7;
      }

      // If no working days found, skip this assignment
      if (lastWorkingDayOverallNumber === 0) {
        assignmentInfo.reason = "Skipped: no working days found (all rest days)";
        debugInfo.programAssignments.push(assignmentInfo);
        continue;
      }

      // Calculate which overall day numbers were replaced/deleted
      // Replacements store the replacedDate, we calculate which overall day number that was
      const replacedOverallDayNumbers = new Set<number>();
      if (assignment.replacements && assignment.replacements.length > 0) {
        const startDateNormalized = getStartOfDay(startDate);
        for (const replacement of assignment.replacements) {
          const replacementDate = new Date(replacement.replacedDate);
          const replacementDateNormalized = getStartOfDay(replacementDate);
          const daysSinceStart = Math.floor(
            (replacementDateNormalized.getTime() - startDateNormalized.getTime()) / (1000 * 60 * 60 * 24)
          );
          const overallDayNumber = daysSinceStart + 1; // Day 1 is startDate (day 0 in calculation)
          if (overallDayNumber > 0 && overallDayNumber <= lastWorkingDayOverallNumber) {
            replacedOverallDayNumbers.add(overallDayNumber);
          }
        }
      }

      // Find the actual last WORKING day number that wasn't replaced
      // We need to check if the last working day was replaced, and if so, find the next highest non-replaced working day
      let actualLastWorkingDayNumber = lastWorkingDayOverallNumber;
      
      // If the last working day was replaced, we need to find the next highest working day that wasn't replaced
      // We need to check the program structure again to find working days
      if (replacedOverallDayNumbers.has(actualLastWorkingDayNumber)) {
        // Find the next highest working day that wasn't replaced
        actualLastWorkingDayNumber = 0;
        if (assignment.program.weeks && assignment.program.weeks.length > 0) {
          for (const week of assignment.program.weeks) {
            if (week.days && week.days.length > 0) {
              for (const day of week.days) {
                // Skip rest days and replaced days
                if (day.isRestDay) {
                  continue;
                }
                
                const overallDayNumber = (week.weekNumber - 1) * 7 + day.dayNumber;
                // Only consider days that weren't replaced and are <= the original last working day
                if (overallDayNumber <= lastWorkingDayOverallNumber && 
                    !replacedOverallDayNumbers.has(overallDayNumber) &&
                    overallDayNumber > actualLastWorkingDayNumber) {
                  actualLastWorkingDayNumber = overallDayNumber;
                }
              }
            }
          }
        }
      }

      // If all working days were replaced, we can't calculate an end date
      if (actualLastWorkingDayNumber <= 0) {
        assignmentInfo.reason = "Skipped: all working days were replaced";
        debugInfo.programAssignments.push(assignmentInfo);
        continue;
      }

      // Calculate the ACTUAL CALENDAR DATE of the last WORKING day
      // Day 1 = startDate, Day 2 = startDate + 1 day, Day N = startDate + (N - 1) days
      // Example: startDate = Jan 20, lastWorkingDayNumber = 4 → endDate = Jan 20 + 3 = Jan 23
      const daysToAdd = actualLastWorkingDayNumber - 1;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + daysToAdd);
      const endDateNormalized = getStartOfDay(endDate);
      const endDateTime = endDateNormalized.getTime();
      const endDateStr = endDateNormalized.toISOString().split("T")[0];

      // Validate end date calculation
      if (isNaN(endDateTime)) {
        assignmentInfo.reason = `Skipped: invalid endDate calculation`;
        debugInfo.programAssignments.push(assignmentInfo);
        continue;
      }

      assignmentInfo.endDate = endDateStr;
      assignmentInfo.endDateTime = endDateTime;
      assignmentInfo.todayTime = todayTime;
      assignmentInfo.lastWorkingDayOverallNumber = lastWorkingDayOverallNumber;
      assignmentInfo.actualLastWorkingDayNumber = actualLastWorkingDayNumber;
      assignmentInfo.replacedOverallDayNumbers = Array.from(replacedOverallDayNumbers);
      assignmentInfo.replacedDaysCount = replacedOverallDayNumbers.size;

      // Only include programs that end today or in the future
      if (isTodayOrFuture(endDateNormalized, today)) {
        programEndDates.push(endDateNormalized);
        assignmentInfo.included = true;
      } else {
        assignmentInfo.reason = `Skipped: endDate (${endDateStr}) is in the past`;
      }
      debugInfo.programAssignments.push(assignmentInfo);
    }
  }

  // PRIORITY: Clients with NO PROGRAMS should always sort first (most urgent - need program assignment)
  // Even if they have routines, no programs = -Infinity (highest priority)
  if (programEndDates.length === 0) {
    debugInfo.result = "-Infinity (no active programs - needs program assignment)";
    if (enableDebug) {
      devLog("getClientDueTimestamp:", {
        ...debugInfo,
        resultTimestamp: -Infinity,
        result: "-Infinity (no active programs - needs program assignment)",
        note: "Client has routines but no programs - prioritizing program assignment need",
      });
    }
    return -Infinity;
  }

  // For programs, use the LATEST end date (when all programs are done)
  // This is the date of the last program day - what we sort by
  const programEndDateTimes = programEndDates.map((d) => {
    const time = d.getTime();
    if (isNaN(time)) {
      throw new Error(`Invalid program end date timestamp for client ${client.name}`);
    }
    return time;
  });
  const latestProgramEndTime = Math.max(...programEndDateTimes);
  debugInfo.allProgramEndDates = programEndDates.map((d) => d.toISOString().split("T")[0]);

  // Process all active, non-completed routine assignments
  // Only consider routines if client already has programs (routines are secondary)
  const routineStartDates: Date[] = [];
  if (client.routineAssignments && client.routineAssignments.length > 0) {
    for (const assignment of client.routineAssignments) {
      const assignmentInfo: RoutineAssignmentDebugInfo = {
        id: assignment.id,
        routineName: assignment.routine.name,
        completedAt: assignment.completedAt,
        startDate: assignment.startDate,
        assignedAt: assignment.assignedAt,
      };

      // Skip completed routines (check completedAt)
      if (assignment.completedAt) {
        assignmentInfo.reason = "Skipped: completed";
        debugInfo.routineAssignments!.push(assignmentInfo);
        continue;
      }

      // Use startDate if available, else assignedAt (nullish coalescing)
      const dueDateStr = assignment.startDate ?? assignment.assignedAt;
      const dueDate = new Date(dueDateStr);
      const dueDateTime = dueDate.getTime();
      const dueDateNormalized = getStartOfDay(dueDate);
      const dueDateStrFormatted = dueDateNormalized.toISOString().split("T")[0];

      // Validate the date - catch NaN early
      if (isNaN(dueDateTime)) {
        assignmentInfo.reason = `Skipped: invalid date (${dueDateStr})`;
        debugInfo.routineAssignments!.push(assignmentInfo);
        continue;
      }

      assignmentInfo.dueDate = dueDateStrFormatted;
      assignmentInfo.dueDateTime = dueDateNormalized.getTime();
      assignmentInfo.todayTime = todayTime;

      // Only include routines that start today or in the future
      if (isTodayOrFuture(dueDateNormalized, today)) {
        routineStartDates.push(dueDateNormalized);
        assignmentInfo.included = true;
      } else {
        assignmentInfo.reason = `Skipped: dueDate (${dueDateStrFormatted}) is in the past`;
      }
      debugInfo.routineAssignments!.push(assignmentInfo);
    }
  }

  // For "Program Due Date" sorting, we use ONLY the latest program end date
  // Routines are not considered for this sort - we only care about when programs end
  // The latest program end date is the date of the last program day
  const finalDueTime = latestProgramEndTime;
  
  // Final validation - ensure we never return NaN
  if (isNaN(finalDueTime)) {
    if (enableDebug) {
      devLog("ERROR: getClientDueTimestamp returned NaN for client:", client.name);
    }
    return -Infinity; // Fallback to -Infinity if something went wrong (needs assignment)
  }

  debugInfo.result = new Date(finalDueTime).toISOString().split("T")[0];
  debugInfo.resultTime = finalDueTime;

  if (enableDebug) {
    const totalReplacedDays = debugInfo.programAssignments.reduce(
      (sum, pa) => sum + (pa.replacedDaysCount || 0),
      0
    );
    devLog("getClientDueTimestamp:", {
      clientName: debugInfo.clientName,
      allProgramEndDates: debugInfo.allProgramEndDates || [],
      allRoutineStartDates: debugInfo.allRoutineStartDates || [],
      latestProgramEndDate: debugInfo.result,
      latestProgramEndTimestamp: finalDueTime,
      programCount: debugInfo.programAssignments.length,
      routineCount: debugInfo.routineAssignments?.length || 0,
      includedProgramCount: programEndDates.length,
      includedRoutineCount: routineStartDates.length,
      totalReplacedDays,
      isValid: !isNaN(finalDueTime),
      note: "Using latest program end date for sorting (routines not considered)",
    });
  }

  return finalDueTime;
}

/**
 * Compare two clients for sorting by program due date
 * Uses numeric timestamps for reliable comparison
 * Clients with no active programs (Infinity) sort to the bottom
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
  // Get numeric timestamps (Infinity for no due date)
  const aTimestamp = getClientDueTimestamp(a, enableDebug);
  const bTimestamp = getClientDueTimestamp(b, enableDebug);

  // Validate timestamps - should never be NaN
  if (isNaN(aTimestamp) || isNaN(bTimestamp)) {
    if (enableDebug) {
      devLog("ERROR: NaN timestamp detected in comparison:", {
        clientA: a.name,
        clientB: b.name,
        aTimestamp,
        bTimestamp,
      });
    }
    // Fallback: treat NaN as -Infinity (needs assignment - most urgent)
    const aSafe = isNaN(aTimestamp) ? -Infinity : aTimestamp;
    const bSafe = isNaN(bTimestamp) ? -Infinity : bTimestamp;
    return sortOrder === "asc" ? aSafe - bSafe : bSafe - aSafe;
  }

  // Calculate difference
  // For "asc": smaller timestamp (earlier date) comes first
  // For "desc": larger timestamp (later date) comes first
  const diff = sortOrder === "asc" ? aTimestamp - bTimestamp : bTimestamp - aTimestamp;

  // Format dates for logging (-Infinity shows as "no due date")
  const aDateStr = aTimestamp === -Infinity ? "no due date (-Infinity - needs assignment)" : aTimestamp === Infinity ? "no due date (Infinity)" : new Date(aTimestamp).toISOString().split("T")[0];
  const bDateStr = bTimestamp === -Infinity ? "no due date (-Infinity - needs assignment)" : bTimestamp === Infinity ? "no due date (Infinity)" : new Date(bTimestamp).toISOString().split("T")[0];

  if (enableDebug) {
    devLog("compareClientsByProgramDueDate:", {
      clientA: a.name,
      clientB: b.name,
      aTimestamp,
      bTimestamp,
      aDate: aDateStr,
      bDate: bDateStr,
      sortOrder,
      diff,
      result: diff < 0 ? `${a.name} first` : diff > 0 ? `${b.name} first` : "equal",
      aIsNegativeInfinity: aTimestamp === -Infinity,
      bIsNegativeInfinity: bTimestamp === -Infinity,
      aIsInfinity: aTimestamp === Infinity,
      bIsInfinity: bTimestamp === Infinity,
    });
  }

  return diff;
}

