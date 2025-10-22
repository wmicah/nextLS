/**
 * Example: How DST handling works for recurring lessons
 *
 * Scenario: Coach schedules recurring lessons every Wednesday at 2 PM
 * Starting: October 25, 2025 (before DST ends)
 * DST Transition: November 2, 2025 (DST ends, clocks fall back 1 hour)
 *
 * Without DST handling:
 * - Oct 25: 2:00 PM (EDT - UTC-4)
 * - Nov 2: 2:00 PM (EST - UTC-5) ← This would show as 1:00 PM to users!
 *
 * With DST handling:
 * - Oct 25: 2:00 PM (EDT - UTC-4)
 * - Nov 2: 2:00 PM (EST - UTC-5) ← System automatically adjusts UTC time to maintain 2:00 PM local time
 */

import { handleDSTTransition } from "./dst-auto-handler";

// Example: October 25, 2025 at 2:00 PM (before DST ends)
const octoberLesson = new Date("2025-10-25T18:00:00Z"); // 2:00 PM EDT (UTC-4)

// Example: November 2, 2025 at 2:00 PM (DST ends day)
const novemberLesson = new Date("2025-11-02T19:00:00Z"); // 2:00 PM EST (UTC-5)

console.log(
  "October lesson (before DST ends):",
  octoberLesson.toLocaleString("en-US", { timeZone: "America/New_York" })
);
console.log(
  "November lesson (DST ends day):",
  novemberLesson.toLocaleString("en-US", { timeZone: "America/New_York" })
);

// Apply DST handling to maintain consistent local times
const octoberResult = handleDSTTransition(octoberLesson, "America/New_York");
const novemberResult = handleDSTTransition(novemberLesson, "America/New_York");

console.log("\nDST Handling Results:");
console.log(
  "October - Original:",
  octoberResult.originalDate.toLocaleString("en-US", {
    timeZone: "America/New_York",
  })
);
console.log(
  "October - Adjusted:",
  octoberResult.adjustedDate?.toLocaleString("en-US", {
    timeZone: "America/New_York",
  }) || "No adjustment needed"
);

console.log(
  "November - Original:",
  novemberResult.originalDate.toLocaleString("en-US", {
    timeZone: "America/New_York",
  })
);
console.log(
  "November - Adjusted:",
  novemberResult.adjustedDate?.toLocaleString("en-US", {
    timeZone: "America/New_York",
  }) || "No adjustment needed"
);

console.log("\nChanges:", novemberResult.changes);
console.log("Notifications:", novemberResult.notifications);
