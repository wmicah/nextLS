#!/usr/bin/env node

/**
 * Test script for the automated lesson reminder system
 * Run this script to test if reminders are being sent automatically
 */

const https = require("https");
const http = require("http");

const LESSON_REMINDER_SECRET =
  process.env.LESSON_REMINDER_SECRET ||
  "cf87d4e0a4968d3ae8f1c62d1d824d573271dc8e6e2d7263c6d051ee6af485fd";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function testLessonReminders() {
  console.log("🔔 Testing Automated Lesson Reminder System...\n");

  try {
    // Test the cron endpoint
    const cronUrl = `${BASE_URL}/api/cron/lesson-reminders?secret=${LESSON_REMINDER_SECRET}`;
    console.log(`📡 Calling cron endpoint: ${cronUrl}`);

    const response = await makeRequest(cronUrl);

    if (response.success) {
      console.log("✅ Automated lesson reminders executed successfully!");
      console.log(`📊 Summary:`, response.summary);

      if (response.results && response.results.length > 0) {
        console.log("\n📋 Detailed Results:");
        response.results.forEach((result, index) => {
          const status =
            result.status === "sent"
              ? "✅"
              : result.status === "skipped"
              ? "⏭️"
              : "❌";
          console.log(
            `${status} ${result.clientName}: ${result.status}${
              result.reason ? ` - ${result.reason}` : ""
            }`
          );
        });
      }
    } else {
      console.log("❌ Failed to execute lesson reminders:", response.error);
    }
  } catch (error) {
    console.error("❌ Error testing lesson reminders:", error.message);
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https:") ? https : http;

    const req = protocol.get(url, res => {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on("error", error => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

// Run the test
if (require.main === module) {
  testLessonReminders()
    .then(() => {
      console.log("\n✨ Test completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("\n💥 Test failed:", error.message);
      process.exit(1);
    });
}

module.exports = { testLessonReminders };












