import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

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
  const localDate = toZonedTime(utcDateString, timeZone);
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
  const localDate = toZonedTime(utcDateString, timeZone);
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
  const localDate = toZonedTime(utcDateString, timeZone);
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
