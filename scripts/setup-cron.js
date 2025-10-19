/**
 * Setup script for lesson reminder cron job
 * This should be run on your server to set up the automated reminders
 */

const cron = require("node-cron");
const fetch = require("node-fetch");

// Configuration
const CRON_SECRET = process.env.CRON_SECRET || "your-secret-key";
const API_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Setup the lesson reminder cron job
 * Runs every hour to check for lessons needing reminders
 */
function setupLessonReminderCron() {
  console.log("🕐 Setting up lesson reminder cron job...");

  // Run every hour at minute 0
  cron.schedule(
    "0 * * * *",
    async () => {
      try {
        console.log("🕐 Running lesson reminder cron job...");

        const response = await fetch(`${API_URL}/api/cron/lesson-reminders`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${CRON_SECRET}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Lesson reminder cron job completed:", result);
        } else {
          console.error(
            "❌ Lesson reminder cron job failed:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error("❌ Lesson reminder cron job error:", error);
      }
    },
    {
      scheduled: true,
      timezone: "UTC",
    }
  );

  console.log("✅ Lesson reminder cron job scheduled to run every hour");
}

/**
 * Alternative: Use external cron service
 * If you're using a service like Vercel Cron, Railway Cron, or similar,
 * you can call the API endpoint directly instead of using this script.
 */
function printExternalCronInstructions() {
  console.log(`
📋 External Cron Service Setup Instructions:

1. Add this URL to your cron service:
   ${API_URL}/api/cron/lesson-reminders

2. Set the Authorization header:
   Bearer ${CRON_SECRET}

3. Schedule to run every hour (0 * * * *)

4. Make sure your CRON_SECRET environment variable is set in production
  `);
}

// Main execution
if (require.main === module) {
  console.log("🚀 Setting up lesson reminder system...");

  // Check if we should use internal cron or external
  const useInternalCron = process.env.USE_INTERNAL_CRON === "true";

  if (useInternalCron) {
    setupLessonReminderCron();
    console.log("✅ Internal cron job setup complete");
  } else {
    printExternalCronInstructions();
    console.log("✅ External cron service instructions printed");
  }
}

module.exports = {
  setupLessonReminderCron,
  printExternalCronInstructions,
};
