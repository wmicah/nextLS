import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { toZonedTime } from "date-fns-tz";
import {
  safeUTCToLocal,
  getDSTAwareLessonTime,
  validateLessonScheduling,
} from "./dst-utils";
import { db } from "@/db";

/**
 * Formats a UTC date string to display in the user's local timezone
 * @param utcDateString - UTC date string from the database
 * @param formatString - Date-fns format string (default: "h:mm a")
 * @returns Formatted time string in user's timezone
 */
export const formatTimeInUserTimezone = (
  utcDateString: string,
  formatString: string = "h:mm a"
): string => {
  const timeZone = getUserTimezone();
  const utcDate = new Date(utcDateString);

  // Use DST-aware conversion
  const localDate = safeUTCToLocal(utcDate, timeZone, "UTC");
  return format(localDate, formatString);
};

/**
 * Formats a UTC date string to display date and time in the user's local timezone
 * @param utcDateString - UTC date string from the database
 * @param formatString - Date-fns format string (default: "MMM d, h:mm a")
 * @returns Formatted date and time string in user's timezone
 */
export const formatDateTimeInUserTimezone = (
  utcDateString: string,
  formatString: string = "MMM d, h:mm a"
): string => {
  const timeZone = getUserTimezone();
  const utcDate = new Date(utcDateString);

  // Use DST-aware conversion
  const localDate = safeUTCToLocal(utcDate, timeZone, "UTC");
  return format(localDate, formatString);
};

/**
 * Formats a UTC date string to display only the date in the user's local timezone
 * @param utcDateString - UTC date string from the database
 * @param formatString - Date-fns format string (default: "MMM d, yyyy")
 * @returns Formatted date string in user's timezone
 */
export const formatDateInUserTimezone = (
  utcDateString: string,
  formatString: string = "MMM d, yyyy"
): string => {
  const timeZone = getUserTimezone();
  const utcDate = new Date(utcDateString);

  // Use DST-aware conversion
  const localDate = safeUTCToLocal(utcDate, timeZone, "UTC");
  return format(localDate, formatString);
};

/**
 * Gets the user's current timezone with robust detection
 * @returns User's timezone string
 */
export const getUserTimezone = (): string => {
  // Only run timezone detection on the client side
  if (typeof window === "undefined") {
    // On server side, we can't detect user timezone, so return UTC
    // The calling code should handle this case appropriately
    return "UTC";
  }

  try {
    // Try to get the user's timezone
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Validate that we got a real timezone
    if (
      detectedTimezone &&
      detectedTimezone !== "UTC" &&
      detectedTimezone.length > 0
    ) {
      return detectedTimezone;
    }

    // Fallback: try to detect timezone using offset
    const offset = new Date().getTimezoneOffset();

    // Common timezone mappings based on offset (getTimezoneOffset returns minutes behind UTC)
    if (offset === 5 * 60) return "America/New_York"; // EST (UTC-5)
    if (offset === 4 * 60) return "America/New_York"; // EDT (UTC-4)
    if (offset === 6 * 60) return "America/Chicago"; // CST (UTC-6)
    if (offset === 5 * 60) return "America/Chicago"; // CDT (UTC-5)
    if (offset === 7 * 60) return "America/Denver"; // MST (UTC-7)
    if (offset === 6 * 60) return "America/Denver"; // MDT (UTC-6)
    if (offset === 8 * 60) return "America/Los_Angeles"; // PST (UTC-8)
    if (offset === 7 * 60) return "America/Los_Angeles"; // PDT (UTC-7)

    // If we can't detect, return UTC
    return "UTC";
  } catch (error) {
    console.warn("Failed to detect user timezone:", error);
    return "UTC";
  }
};

/**
 * Debug function to help identify timezone issues
 * @returns Object with timezone debugging information
 */
export const getTimezoneDebugInfo = () => {
  const detectedTimezone =
    typeof window !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "Server Environment";
  const userTimezone = getUserTimezone();
  const currentDate = new Date();
  const utcDate = currentDate.toISOString();

  return {
    detectedTimezone,
    userTimezone,
    currentDate: currentDate.toString(),
    utcDate,
    environment: process.env.NODE_ENV,
    isServer: typeof window === "undefined",
  };
};

/**
 * Get DST-aware lesson time information
 * @param utcDateString - UTC date string from the database
 * @param formatString - Date-fns format string (default: "h:mm a")
 * @returns Object with DST-aware time information
 */
export const getDSTAwareLessonTimeInfo = (
  utcDateString: string,
  formatString: string = "h:mm a"
) => {
  const timeZone = getUserTimezone();
  const utcDate = new Date(utcDateString);

  return getDSTAwareLessonTime(utcDate, timeZone, formatString);
};

/**
 * Validate lesson scheduling for DST issues
 * @param lessonDate - The lesson date to validate
 * @param timezone - The timezone to check (defaults to user's timezone)
 * @returns Validation result with warnings and suggestions
 */
export const validateLessonForDST = (lessonDate: Date, timezone?: string) => {
  const userTimezone = timezone || getUserTimezone();
  return validateLessonScheduling(lessonDate, userTimezone);
};

/**
 * Converts timezone offset string (e.g., "UTC-5") to IANA timezone format
 * @param timezoneOffset - Timezone offset string like "UTC-5", "UTC+3", etc.
 * @returns IANA timezone string or "America/New_York" as default
 */
export const convertOffsetToIANA = (timezoneOffset?: string | null): string => {
  if (!timezoneOffset) {
    return "America/New_York"; // Default fallback
  }

  // Parse offset like "UTC-5" or "UTC+3"
  const match = timezoneOffset.match(/UTC([+-])(\d+)/);
  if (!match) {
    return "America/New_York"; // Default fallback
  }

  const sign = match[1];
  const hours = parseInt(match[2], 10);
  const offset = sign === "-" ? -hours : hours;

  // Map common offsets to IANA timezones
  // This is a simplified mapping - you may want to expand this
  const offsetMap: Record<number, string> = {
    "-8": "America/Los_Angeles", // PST
    "-7": "America/Denver", // MST
    "-6": "America/Chicago", // CST
    "-5": "America/New_York", // EST
    "-4": "America/New_York", // EDT (will handle DST automatically)
    "-3": "America/Sao_Paulo",
    "0": "UTC",
    "1": "Europe/London",
    "2": "Europe/Berlin",
    "3": "Europe/Moscow",
    "5": "Asia/Karachi",
    "8": "Asia/Shanghai",
    "9": "Asia/Tokyo",
  };

  return offsetMap[offset] || "America/New_York";
};

/**
 * Gets user's timezone from database settings (server-side)
 * @param userId - User ID to get timezone for
 * @returns IANA timezone string
 */
export const getUserTimezoneFromDB = async (userId: string): Promise<string> => {
  try {
    const userSettings = await db.userSettings.findUnique({
      where: { userId },
      select: { timezone: true },
    });

    if (userSettings?.timezone) {
      return convertOffsetToIANA(userSettings.timezone);
    }

    // If no timezone in settings, try to get from user's working hours or default
    return "America/New_York"; // Default fallback
  } catch (error) {
    console.error("Error getting user timezone from DB:", error);
    return "America/New_York"; // Default fallback
  }
};

/**
 * Formats a UTC date to a time string in the user's timezone (server-side)
 * @param utcDate - UTC Date object
 * @param timezone - IANA timezone string (e.g., "America/New_York")
 * @param formatString - Date-fns format string (default: "h:mm a")
 * @returns Formatted time string
 */
export const formatTimeInTimezone = (
  utcDate: Date,
  timezone: string,
  formatString: string = "h:mm a"
): string => {
  return formatInTimeZone(utcDate, timezone, formatString);
};

/**
 * Formats a UTC date to a date string in the user's timezone (server-side)
 * @param utcDate - UTC Date object
 * @param timezone - IANA timezone string (e.g., "America/New_York")
 * @param formatString - Date-fns format string (default: "EEEE, MMMM d")
 * @returns Formatted date string
 */
export const formatDateInTimezone = (
  utcDate: Date,
  timezone: string,
  formatString: string = "EEEE, MMMM d"
): string => {
  return formatInTimeZone(utcDate, timezone, formatString);
};
