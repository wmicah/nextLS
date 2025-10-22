import { format, addDays, subDays, isWithinInterval } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * DST Transition Information
 * For 2025, DST ends on November 2nd at 2:00 AM (clocks fall back to 1:00 AM)
 * For 2026, DST will end on November 1st at 2:00 AM
 */

export interface DSTTransition {
  year: number;
  springForward: {
    date: Date;
    time: string; // "2:00 AM"
    offsetChange: number; // +1 hour
  };
  fallBack: {
    date: Date;
    time: string; // "2:00 AM" -> "1:00 AM"
    offsetChange: number; // -1 hour
  };
}

/**
 * Get DST transition dates for a given year
 */
export function getDSTTransitions(year: number): DSTTransition {
  // DST starts on the second Sunday of March
  const marchFirst = new Date(year, 2, 1); // March 1st
  const firstSunday = new Date(marchFirst);
  firstSunday.setDate(marchFirst.getDate() + (7 - marchFirst.getDay()));
  const secondSunday = new Date(firstSunday);
  secondSunday.setDate(firstSunday.getDate() + 7);

  // DST ends on the first Sunday of November
  const novemberFirst = new Date(year, 10, 1); // November 1st
  const firstSundayNovember = new Date(novemberFirst);
  firstSundayNovember.setDate(
    novemberFirst.getDate() + (7 - novemberFirst.getDay())
  );

  return {
    year,
    springForward: {
      date: secondSunday,
      time: "2:00 AM",
      offsetChange: 1, // +1 hour
    },
    fallBack: {
      date: firstSundayNovember,
      time: "2:00 AM",
      offsetChange: -1, // -1 hour
    },
  };
}

/**
 * Check if a date falls within a DST transition period
 */
export function isDSTTransition(
  date: Date,
  timezone: string = "America/New_York"
): boolean {
  const year = date.getFullYear();
  const transitions = getDSTTransitions(year);

  // Check if date is within 24 hours of either transition
  const springTransition = transitions.springForward.date;
  const fallTransition = transitions.fallBack.date;

  const dayBeforeSpring = subDays(springTransition, 1);
  const dayAfterSpring = addDays(springTransition, 1);
  const dayBeforeFall = subDays(fallTransition, 1);
  const dayAfterFall = addDays(fallTransition, 1);

  return (
    isWithinInterval(date, { start: dayBeforeSpring, end: dayAfterSpring }) ||
    isWithinInterval(date, { start: dayBeforeFall, end: dayAfterFall })
  );
}

/**
 * Get the correct timezone offset for a specific date and timezone
 * This handles DST transitions properly
 */
export function getTimezoneOffset(date: Date, timezone: string): number {
  // Create a date in the target timezone
  const zonedDate = toZonedTime(date, timezone);

  // Get the UTC equivalent
  const utcDate = fromZonedTime(zonedDate, timezone);

  // Calculate offset in minutes
  const offsetMs = date.getTime() - utcDate.getTime();
  return offsetMs / (1000 * 60); // Convert to minutes
}

/**
 * Safely convert a local time to UTC, handling DST transitions
 */
export function safeLocalToUTC(
  localDate: Date,
  timezone: string,
  fallbackTimezone?: string
): Date {
  try {
    // First attempt with the primary timezone
    const utcDate = fromZonedTime(localDate, timezone);

    // Validate the conversion
    if (isNaN(utcDate.getTime())) {
      throw new Error("Invalid date conversion");
    }

    return utcDate;
  } catch (error) {
    console.warn(
      `Failed to convert time in ${timezone}, trying fallback:`,
      error
    );

    // Try with fallback timezone if provided
    if (fallbackTimezone && fallbackTimezone !== timezone) {
      try {
        const fallbackUtcDate = fromZonedTime(localDate, fallbackTimezone);
        if (!isNaN(fallbackUtcDate.getTime())) {
          console.warn(
            `Using fallback timezone ${fallbackTimezone} for date conversion`
          );
          return fallbackUtcDate;
        }
      } catch (fallbackError) {
        console.error(
          "Fallback timezone conversion also failed:",
          fallbackError
        );
      }
    }

    // Last resort: use the original date (assume it's already UTC)
    console.warn("Using original date as UTC (last resort)");
    return localDate;
  }
}

/**
 * Safely convert UTC to local time, handling DST transitions
 */
export function safeUTCToLocal(
  utcDate: Date,
  timezone: string,
  fallbackTimezone?: string
): Date {
  try {
    const localDate = toZonedTime(utcDate, timezone);

    // Validate the conversion
    if (isNaN(localDate.getTime())) {
      throw new Error("Invalid date conversion");
    }

    return localDate;
  } catch (error) {
    console.warn(
      `Failed to convert UTC to ${timezone}, trying fallback:`,
      error
    );

    // Try with fallback timezone if provided
    if (fallbackTimezone && fallbackTimezone !== timezone) {
      try {
        const fallbackLocalDate = toZonedTime(utcDate, fallbackTimezone);
        if (!isNaN(fallbackLocalDate.getTime())) {
          console.warn(
            `Using fallback timezone ${fallbackTimezone} for date conversion`
          );
          return fallbackLocalDate;
        }
      } catch (fallbackError) {
        console.error(
          "Fallback timezone conversion also failed:",
          fallbackError
        );
      }
    }

    // Last resort: return the UTC date
    console.warn("Using UTC date as local (last resort)");
    return utcDate;
  }
}

/**
 * Check if a lesson time would be affected by DST transition
 */
export function isLessonAffectedByDST(
  lessonDate: Date,
  timezone: string = "America/New_York"
): {
  affected: boolean;
  transitionType?: "spring" | "fall";
  transitionDate?: Date;
  warning?: string;
} {
  const year = lessonDate.getFullYear();
  const transitions = getDSTTransitions(year);

  // Check if lesson is on the day of DST transition
  const lessonDateOnly = new Date(
    lessonDate.getFullYear(),
    lessonDate.getMonth(),
    lessonDate.getDate()
  );
  const springDateOnly = new Date(
    transitions.springForward.date.getFullYear(),
    transitions.springForward.date.getMonth(),
    transitions.springForward.date.getDate()
  );
  const fallDateOnly = new Date(
    transitions.fallBack.date.getFullYear(),
    transitions.fallBack.date.getMonth(),
    transitions.fallBack.date.getDate()
  );

  if (lessonDateOnly.getTime() === springDateOnly.getTime()) {
    return {
      affected: true,
      transitionType: "spring",
      transitionDate: transitions.springForward.date,
      warning:
        "Lesson scheduled on DST spring forward day. Time will jump from 2:00 AM to 3:00 AM.",
    };
  }

  if (lessonDateOnly.getTime() === fallDateOnly.getTime()) {
    return {
      affected: true,
      transitionType: "fall",
      transitionDate: transitions.fallBack.date,
      warning:
        "Lesson scheduled on DST fall back day. Time will repeat from 2:00 AM to 1:00 AM.",
    };
  }

  return { affected: false };
}

/**
 * Get DST-aware lesson time display
 */
export function getDSTAwareLessonTime(
  utcDate: Date,
  timezone: string = "America/New_York",
  formatString: string = "h:mm a"
): {
  displayTime: string;
  isDST: boolean;
  offset: string;
  warning?: string;
} {
  const localDate = safeUTCToLocal(utcDate, timezone);
  const displayTime = format(localDate, formatString);

  // Check if we're in DST period
  const january = new Date(utcDate.getFullYear(), 0, 1);
  const july = new Date(utcDate.getFullYear(), 6, 1);

  const janOffset = getTimezoneOffset(january, timezone);
  const julyOffset = getTimezoneOffset(july, timezone);
  const currentOffset = getTimezoneOffset(utcDate, timezone);

  const isDST = currentOffset !== janOffset;
  const offset = `UTC${currentOffset >= 0 ? "+" : ""}${currentOffset / 60}`;

  // Check for DST transition warnings
  const dstCheck = isLessonAffectedByDST(utcDate, timezone);

  return {
    displayTime,
    isDST,
    offset,
    warning: dstCheck.warning,
  };
}

/**
 * Validate lesson scheduling around DST transitions
 */
export function validateLessonScheduling(
  lessonDate: Date,
  timezone: string = "America/New_York"
): {
  valid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const dstCheck = isLessonAffectedByDST(lessonDate, timezone);

  if (dstCheck.affected) {
    if (dstCheck.transitionType === "fall") {
      warnings.push(
        "Lesson scheduled on DST fall back day. Time will repeat from 2:00 AM to 1:00 AM."
      );
      suggestions.push(
        "Consider scheduling the lesson for a different day to avoid confusion."
      );
      suggestions.push(
        "If scheduling is necessary, clearly communicate the time to avoid confusion."
      );
    } else if (dstCheck.transitionType === "spring") {
      warnings.push(
        "Lesson scheduled on DST spring forward day. Time will jump from 2:00 AM to 3:00 AM."
      );
      suggestions.push(
        "Consider scheduling the lesson for a different day to avoid the time jump."
      );
    }
  }

  // Check if lesson is very early in the morning (1-3 AM) during DST transition periods
  const hour = lessonDate.getHours();
  if (dstCheck.affected && (hour === 1 || hour === 2)) {
    warnings.push(
      "Lesson scheduled during DST transition hour. This may cause confusion."
    );
    suggestions.push(
      "Consider scheduling for a different time to avoid DST transition issues."
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions,
  };
}

/**
 * Get DST transition information for display to users
 */
export function getDSTTransitionInfo(year: number = new Date().getFullYear()): {
  springForward: {
    date: string;
    time: string;
    description: string;
  };
  fallBack: {
    date: string;
    time: string;
    description: string;
  };
} {
  const transitions = getDSTTransitions(year);

  return {
    springForward: {
      date: format(transitions.springForward.date, "EEEE, MMMM d, yyyy"),
      time: transitions.springForward.time,
      description: "Clocks spring forward 1 hour (2:00 AM becomes 3:00 AM)",
    },
    fallBack: {
      date: format(transitions.fallBack.date, "EEEE, MMMM d, yyyy"),
      time: transitions.fallBack.time,
      description: "Clocks fall back 1 hour (2:00 AM becomes 1:00 AM)",
    },
  };
}
