import { addDays, subDays, format } from "date-fns";
import {
  safeLocalToUTC,
  safeUTCToLocal,
  isLessonAffectedByDST,
} from "./dst-utils";

export interface DSTAutoHandlingOptions {
  autoReschedule: boolean; // Automatically move lessons away from DST transition days
  autoAdjustTime: boolean; // Automatically adjust lesson times during DST transitions
  preferredRescheduleDirection: "before" | "after" | "either"; // Which direction to reschedule
  maxRescheduleDays: number; // Maximum days to look for alternative scheduling
  notifyUsers: boolean; // Send notifications about automatic changes
}

export interface DSTHandlingResult {
  originalDate: Date;
  adjustedDate?: Date;
  changes: {
    type: "rescheduled" | "time_adjusted" | "no_change";
    reason: string;
    originalTime: string;
    adjustedTime?: string;
  };
  warnings: string[];
  notifications: string[];
}

/**
 * Automatically handle DST transitions for lesson scheduling
 * Focuses on maintaining consistent lesson times across DST transitions
 */
export function handleDSTTransition(
  lessonDate: Date,
  timezone: string = "America/New_York",
  options: DSTAutoHandlingOptions = {
    autoReschedule: false, // Changed default - don't reschedule, adjust time instead
    autoAdjustTime: true, // Changed default - adjust time to maintain consistency
    preferredRescheduleDirection: "before",
    maxRescheduleDays: 3,
    notifyUsers: true,
  }
): DSTHandlingResult {
  const dstCheck = isLessonAffectedByDST(lessonDate, timezone);

  if (!dstCheck.affected) {
    return {
      originalDate: lessonDate,
      changes: {
        type: "no_change",
        reason: "No DST transition detected",
        originalTime: format(lessonDate, "h:mm a"),
      },
      warnings: [],
      notifications: [],
    };
  }

  const result: DSTHandlingResult = {
    originalDate: lessonDate,
    changes: {
      type: "no_change",
      reason: "DST transition detected but no automatic handling applied",
      originalTime: format(lessonDate, "h:mm a"),
    },
    warnings: [dstCheck.warning || "DST transition detected"],
    notifications: [],
  };

  // Auto-reschedule if enabled
  if (options.autoReschedule) {
    const rescheduledDate = findAlternativeDate(lessonDate, options);
    if (rescheduledDate) {
      result.adjustedDate = rescheduledDate;
      result.changes = {
        type: "rescheduled",
        reason: `Automatically rescheduled from DST transition day to ${format(
          rescheduledDate,
          "EEEE, MMMM d"
        )}`,
        originalTime: format(lessonDate, "h:mm a"),
        adjustedTime: format(rescheduledDate, "h:mm a"),
      };
      result.notifications.push(
        `Lesson automatically rescheduled from ${format(
          lessonDate,
          "MMM d"
        )} to ${format(rescheduledDate, "MMM d")} to avoid DST transition`
      );
    }
  }

  // Auto-adjust time if enabled and not rescheduled
  if (options.autoAdjustTime && !result.adjustedDate) {
    const adjustedTime = adjustTimeForDST(lessonDate, timezone);
    if (adjustedTime) {
      result.adjustedDate = adjustedTime;
      result.changes = {
        type: "time_adjusted",
        reason: "Automatically adjusted time to avoid DST transition confusion",
        originalTime: format(lessonDate, "h:mm a"),
        adjustedTime: format(adjustedTime, "h:mm a"),
      };
      result.notifications.push(
        `Lesson time automatically adjusted from ${format(
          lessonDate,
          "h:mm a"
        )} to ${format(adjustedTime, "h:mm a")} to avoid DST transition`
      );
    }
  }

  return result;
}

/**
 * Find an alternative date for scheduling to avoid DST transitions
 */
function findAlternativeDate(
  originalDate: Date,
  options: DSTAutoHandlingOptions
): Date | null {
  const maxDays = options.maxRescheduleDays;

  // Try to find alternative dates
  for (let i = 1; i <= maxDays; i++) {
    // Check before the original date
    if (
      options.preferredRescheduleDirection === "before" ||
      options.preferredRescheduleDirection === "either"
    ) {
      const beforeDate = subDays(originalDate, i);
      const beforeCheck = isLessonAffectedByDST(beforeDate);
      if (!beforeCheck.affected) {
        return beforeDate;
      }
    }

    // Check after the original date
    if (
      options.preferredRescheduleDirection === "after" ||
      options.preferredRescheduleDirection === "either"
    ) {
      const afterDate = addDays(originalDate, i);
      const afterCheck = isLessonAffectedByDST(afterDate);
      if (!afterCheck.affected) {
        return afterDate;
      }
    }
  }

  return null;
}

/**
 * Adjust lesson time to maintain consistency across DST transitions
 * This ensures that a 2 PM lesson stays at 2 PM even after DST ends
 */
function adjustTimeForDST(lessonDate: Date, timezone: string): Date | null {
  const hour = lessonDate.getHours();
  const minute = lessonDate.getMinutes();
  const second = lessonDate.getSeconds();

  // For recurring lessons, we want to maintain the same local time
  // regardless of DST transitions. The key is to adjust the UTC time
  // to compensate for the DST offset change.

  // Check if this is a DST transition day
  const dstCheck = isLessonAffectedByDST(lessonDate, timezone);

  if (dstCheck.affected) {
    if (dstCheck.transitionType === "fall") {
      // DST ends - clocks fall back 1 hour
      // To maintain the same local time (e.g., 2 PM), we need to add 1 hour to UTC
      const adjustedDate = new Date(lessonDate);
      adjustedDate.setHours(hour + 1, minute, second);
      return adjustedDate;
    } else if (dstCheck.transitionType === "spring") {
      // DST begins - clocks spring forward 1 hour
      // To maintain the same local time (e.g., 2 PM), we need to subtract 1 hour from UTC
      const adjustedDate = new Date(lessonDate);
      adjustedDate.setHours(hour - 1, minute, second);
      return adjustedDate;
    }
  }

  // If lesson is during problematic DST hours (1-3 AM), move it to a safer time
  if (hour >= 1 && hour <= 3) {
    // Move to 4 AM to avoid DST transition confusion
    const adjustedDate = new Date(lessonDate);
    adjustedDate.setHours(4, minute, second);
    return adjustedDate;
  }

  return null;
}

/**
 * Batch process multiple lessons for DST handling
 */
export function batchHandleDSTTransitions(
  lessons: Array<{ id: string; date: Date; timezone?: string }>,
  options: DSTAutoHandlingOptions
): Array<{ lessonId: string; result: DSTHandlingResult }> {
  return lessons.map(lesson => ({
    lessonId: lesson.id,
    result: handleDSTTransition(lesson.date, lesson.timezone, options),
  }));
}

/**
 * Get DST handling recommendations for a lesson
 */
export function getDSTHandlingRecommendations(
  lessonDate: Date,
  timezone: string = "America/New_York"
): {
  recommendations: string[];
  autoHandlingOptions: DSTAutoHandlingOptions;
} {
  const dstCheck = isLessonAffectedByDST(lessonDate, timezone);

  if (!dstCheck.affected) {
    return {
      recommendations: ["No DST issues detected"],
      autoHandlingOptions: {
        autoReschedule: false,
        autoAdjustTime: false,
        preferredRescheduleDirection: "before",
        maxRescheduleDays: 3,
        notifyUsers: true,
      },
    };
  }

  const recommendations: string[] = [];
  const autoHandlingOptions: DSTAutoHandlingOptions = {
    autoReschedule: true,
    autoAdjustTime: false,
    preferredRescheduleDirection: "before",
    maxRescheduleDays: 3,
    notifyUsers: true,
  };

  if (dstCheck.transitionType === "fall") {
    recommendations.push(
      "Consider rescheduling to avoid time repetition confusion"
    );
    recommendations.push(
      "If keeping the date, clearly communicate the time to avoid confusion"
    );
    autoHandlingOptions.autoReschedule = true;
  } else if (dstCheck.transitionType === "spring") {
    recommendations.push("Consider rescheduling to avoid time jump confusion");
    recommendations.push(
      "If keeping the date, ensure all parties understand the time change"
    );
    autoHandlingOptions.autoReschedule = true;
  }

  // Check if lesson is during problematic hours
  const hour = lessonDate.getHours();
  if (hour >= 1 && hour <= 3) {
    recommendations.push(
      "Consider moving to a different time to avoid DST transition hours"
    );
    autoHandlingOptions.autoAdjustTime = true;
  }

  return {
    recommendations,
    autoHandlingOptions,
  };
}
