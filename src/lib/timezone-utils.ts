import { format } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

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
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  const localDate = utcToZonedTime(utcDateString, timeZone);
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
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  const localDate = utcToZonedTime(utcDateString, timeZone);
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
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  const localDate = utcToZonedTime(utcDateString, timeZone);
  return format(localDate, formatString);
};

/**
 * Gets the user's current timezone
 * @returns User's timezone string (default: "America/New_York")
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
};
