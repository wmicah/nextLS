/**
 * Date utility functions for consistent date handling
 */

/**
 * Get the start of day (midnight) for a given date
 * @param date - The date to normalize (defaults to now)
 * @returns A new Date object set to midnight of the given date
 */
export function getStartOfDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Calculate the end date of a program based on start date and duration
 * @param startDate - The program start date
 * @param durationWeeks - The program duration in weeks
 * @returns The end date normalized to start of day
 */
export function calculateProgramEndDate(
  startDate: Date,
  durationWeeks: number
): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationWeeks * 7);
  return getStartOfDay(endDate);
}

/**
 * Check if a date is today or in the future
 * @param date - The date to check
 * @param today - The reference date (defaults to today)
 * @returns True if the date is today or in the future
 */
export function isTodayOrFuture(date: Date, today: Date = getStartOfDay()): boolean {
  return date.getTime() >= today.getTime();
}

