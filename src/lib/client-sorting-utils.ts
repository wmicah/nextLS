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
      status?: string; // DRAFT, ACTIVE, ARCHIVED - only ACTIVE should be counted
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

      // Handle temporary programs (identified by [TEMP] prefix in title)
      // Temp programs are single-day replacements - their end date IS their start date
      if (assignment.program.title.startsWith("[TEMP]")) {
        // Must have a startDate
        if (!assignment.startDate) {
          assignmentInfo.reason = "Skipped: temp program with no startDate";
          debugInfo.programAssignments.push(assignmentInfo);
          continue;
        }

        const tempStartDate = new Date(assignment.startDate);
        const tempStartDateNormalized = getStartOfDay(tempStartDate);
        
        // Validate the date
        if (isNaN(tempStartDateNormalized.getTime())) {
          assignmentInfo.reason = `Skipped: temp program with invalid startDate (${assignment.startDate})`;
          debugInfo.programAssignments.push(assignmentInfo);
          continue;
        }

        // Only include if the temp program date is today or in the future
        if (isTodayOrFuture(tempStartDateNormalized, today)) {
          programEndDates.push(tempStartDateNormalized);
          assignmentInfo.endDate = tempStartDateNormalized.toISOString().split("T")[0];
          assignmentInfo.included = true;
          assignmentInfo.reason = "Included: temp program (single-day, uses startDate as endDate)";
        } else {
          assignmentInfo.reason = `Skipped: temp program date (${tempStartDateNormalized.toISOString().split("T")[0]}) is in the past`;
        }
        debugInfo.programAssignments.push(assignmentInfo);
        continue;
      }

      // Skip completed assignments (check both completed flag and completedAt)
      if (assignment.completed || assignment.completedAt) {
        assignmentInfo.reason = "Skipped: completed";
        debugInfo.programAssignments.push(assignmentInfo);
        continue;
      }

      // Skip programs that are not ACTIVE (DRAFT or ARCHIVED should not count)
      // Only active programs represent real work for the client
      if (assignment.program.status && assignment.program.status !== "ACTIVE") {
        assignmentInfo.reason = `Skipped: program status is ${assignment.program.status} (not ACTIVE)`;
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

  // Calculate the latest program end time (if any programs exist)
  let latestProgramEndTime: number | null = null;
  if (programEndDates.length > 0) {
    const programEndDateTimes = programEndDates.map((d) => {
      const time = d.getTime();
      if (isNaN(time)) {
        throw new Error(`Invalid program end date timestamp for client ${client.name}`);
      }
      return time;
    });
    latestProgramEndTime = Math.max(...programEndDateTimes);
    debugInfo.allProgramEndDates = programEndDates.map((d) => d.toISOString().split("T")[0]);
  }

  // Process all active, non-completed routine assignments
  // Routines are considered alongside programs for due date sorting
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

  // For "Due Date" sorting (coach's perspective):
  // This represents when the client will RUN OUT of assigned work.
  // - Programs: use the LATEST end date (when all programs are done)
  // - Routines: use the LATEST start date (when the last routine is due)
  // Final due date = MAXIMUM of all dates (the furthest-out assignment)
  // Coaches need to see clients sorted by who runs out of work soonest.
  
  // Calculate latest routine start time (if any routines exist)
  let latestRoutineStartTime: number | null = null;
  if (routineStartDates.length > 0) {
    const routineStartDateTimes = routineStartDates.map((d) => {
      const time = d.getTime();
      if (isNaN(time)) {
        throw new Error(`Invalid routine start date timestamp for client ${client.name}`);
      }
      return time;
    });
    latestRoutineStartTime = Math.max(...routineStartDateTimes);
    debugInfo.allRoutineStartDates = routineStartDates.map((d) => d.toISOString().split("T")[0]);
  }
  
  // Determine the final due time based on what's available
  // Use the LATEST/MAXIMUM date - this is when the client runs out of work
  let finalDueTime: number;
  let finalDueSource: string;
  
  if (latestProgramEndTime !== null && latestRoutineStartTime !== null) {
    // Both programs and routines exist - use the LATEST date (furthest out)
    if (latestRoutineStartTime > latestProgramEndTime) {
      finalDueTime = latestRoutineStartTime;
      finalDueSource = "routine";
    } else {
      finalDueTime = latestProgramEndTime;
      finalDueSource = "program";
    }
  } else if (latestProgramEndTime !== null) {
    // Only programs exist
    finalDueTime = latestProgramEndTime;
    finalDueSource = "program";
  } else if (latestRoutineStartTime !== null) {
    // Only routines exist
    finalDueTime = latestRoutineStartTime;
    finalDueSource = "routine";
  } else {
    // No programs or routines - client needs assignment (highest priority)
    debugInfo.result = "-Infinity (no active programs or routines - needs assignment)";
    // Always log when returning -Infinity to debug sorting issues
    const skippedReasons = debugInfo.programAssignments.map(p => `${p.programTitle}: ${p.reason || 'no reason'}`);
    console.log(`[DUE DATE] ${client.name}: -Infinity (no active assignments) | Programs: ${client.programAssignments?.length || 0} | Routines: ${client.routineAssignments?.length || 0} | SKIP REASONS: ${skippedReasons.join(' | ') || 'none'}`);
    return -Infinity;
  }
  
  // Final validation - ensure we never return NaN
  if (isNaN(finalDueTime)) {
    if (enableDebug) {
      devLog("ERROR: getClientDueTimestamp returned NaN for client:", client.name);
    }
    return -Infinity; // Fallback to -Infinity if something went wrong (needs assignment)
  }

  debugInfo.result = new Date(finalDueTime).toISOString().split("T")[0];
  debugInfo.resultTime = finalDueTime;

  // Log due date calculation for debugging
  console.log(`[DUE DATE] ${client.name}: ${debugInfo.result} (${finalDueSource})`);

  if (enableDebug) {
    const totalReplacedDays = debugInfo.programAssignments.reduce(
      (sum, pa) => sum + (pa.replacedDaysCount || 0),
      0
    );
    devLog("getClientDueTimestamp:", {
      clientName: debugInfo.clientName,
      allProgramEndDates: debugInfo.allProgramEndDates || [],
      allRoutineStartDates: debugInfo.allRoutineStartDates || [],
      latestProgramEndDate: latestProgramEndTime !== null 
        ? new Date(latestProgramEndTime).toISOString().split("T")[0] 
        : "none",
      latestProgramEndTimestamp: latestProgramEndTime,
      latestRoutineDate: latestRoutineStartTime !== null
        ? new Date(latestRoutineStartTime).toISOString().split("T")[0]
        : "none",
      latestRoutineTimestamp: latestRoutineStartTime,
      finalDueDate: debugInfo.result,
      finalDueTimestamp: finalDueTime,
      dueSource: finalDueSource,
      programCount: debugInfo.programAssignments.length,
      routineCount: debugInfo.routineAssignments?.length || 0,
      includedProgramCount: programEndDates.length,
      includedRoutineCount: routineStartDates.length,
      totalReplacedDays,
      isValid: !isNaN(finalDueTime),
      note: `Using ${finalDueSource === "routine" ? "latest routine" : "latest program end"} date - client runs out of work on this date`,
    });
  }

  return finalDueTime;
}

/**
 * Compare two clients for sorting by program due date
 * Uses numeric timestamps for reliable comparison
 * Clients with no active programs (-Infinity) sort to the TOP (most urgent - need assignment)
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
  // Get numeric timestamps (-Infinity for no due date = needs assignment)
  const aTimestamp = getClientDueTimestamp(a, false); // Disable inner debug to reduce noise
  const bTimestamp = getClientDueTimestamp(b, false);

  // Handle -Infinity explicitly (clients with no assignments should come FIRST)
  const aNoAssignments = aTimestamp === -Infinity;
  const bNoAssignments = bTimestamp === -Infinity;

  // Debug: Log sorting decisions for clients with no assignments
  if (aNoAssignments || bNoAssignments) {
    let result: number;
    let resultReason: string;
    
    if (aNoAssignments && bNoAssignments) {
      result = a.name.localeCompare(b.name);
      resultReason = `both no assignments, sort by name`;
    } else if (aNoAssignments) {
      result = -1;
      resultReason = `${a.name} has NO assignments, comes FIRST`;
    } else {
      result = 1;
      resultReason = `${b.name} has NO assignments, comes FIRST`;
    }
    
    console.log(`[SORT] ${a.name} vs ${b.name} → ${result} (${resultReason})`);
    return result;
  }

  // Validate timestamps - should never be NaN at this point
  if (isNaN(aTimestamp) || isNaN(bTimestamp)) {
    if (enableDebug) {
      devLog("ERROR: NaN timestamp detected in comparison:", {
        clientA: a.name,
        clientB: b.name,
        aTimestamp,
        bTimestamp,
      });
    }
    // Fallback: treat NaN as highest priority
    if (isNaN(aTimestamp)) return -1;
    if (isNaN(bTimestamp)) return 1;
    return 0;
  }

  // Both have valid timestamps - compare normally
  // For "asc": smaller timestamp (earlier date) comes first
  // For "desc": larger timestamp (later date) comes first
  let diff: number;
  if (sortOrder === "asc") {
    diff = aTimestamp - bTimestamp;
  } else {
    diff = bTimestamp - aTimestamp;
  }

  if (enableDebug) {
    const aDateStr = new Date(aTimestamp).toISOString().split("T")[0];
    const bDateStr = new Date(bTimestamp).toISOString().split("T")[0];
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
    });
  }
  
  // Return proper comparison values (-1, 0, 1)
  if (diff < 0) return -1;
  if (diff > 0) return 1;
  return 0;
}

