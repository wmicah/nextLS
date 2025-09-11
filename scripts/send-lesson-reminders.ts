#!/usr/bin/env tsx

/**
 * Script to manually trigger lesson reminders
 * This can be used for testing or as a manual backup
 */

import { config } from "dotenv";

// Load environment variables
config();

async function sendLessonReminders() {
  const secret = process.env.LESSON_REMINDER_SECRET;

  if (!secret) {
    console.error(
      "❌ LESSON_REMINDER_SECRET not found in environment variables"
    );
    console.log("Please add LESSON_REMINDER_SECRET to your .env file");
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/lesson-reminders?secret=${secret}`;

  try {
    console.log("🚀 Sending lesson reminders...");
    console.log(`📡 URL: ${baseUrl}/api/lesson-reminders`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log("✅ Lesson reminders sent successfully!");
    console.log("📊 Results:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Error sending lesson reminders:", error);
  }
}

// Run the script
sendLessonReminders();





