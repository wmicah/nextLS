/**
 * Test function to manually send a lesson reminder
 * This is for testing the reminder system
 */

import { db } from "@/db";
import { addHours } from "date-fns";
import { randomBytes } from "crypto";
import lessonReminderService from "./lesson-reminder-service";

export async function sendTestReminder(clientEmail: string) {
  try {
    console.log(`🧪 Sending test reminder to ${clientEmail}...`);

    // Find the client by email
    const client = await db.client.findFirst({
      where: { email: clientEmail },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error(`Client with email ${clientEmail} not found`);
    }

    if (!client.coach) {
      throw new Error(`Client ${clientEmail} has no assigned coach`);
    }

    // Create a test lesson 48.5 hours from now (to ensure it's in the 48-hour window)
    const testLessonDate = addHours(new Date(), 48.5);

    console.log("📅 Creating test lesson for:", testLessonDate);

    // Create the test lesson
    const testLesson = await db.event.create({
      data: {
        title: `Test Lesson - ${client.coach.name}`,
        description: "Test lesson for reminder system",
        date: testLessonDate,
        status: "CONFIRMED",
        clientId: client.id,
        coachId: client.coach.id,
        type: "LESSON",
        reminderSent: false,
        confirmationRequired: false,
      },
    });

    console.log("✅ Test lesson created:", testLesson.id);

    // Trigger the lesson reminder service to process this lesson
    console.log("🔄 Triggering lesson reminder service...");
    await lessonReminderService.manualCheck();

    // Get the reminder that was created
    const reminder = await db.lessonReminder.findFirst({
      where: { eventId: testLesson.id },
    });

    if (reminder) {
      console.log("✅ 48-hour confirmation reminder sent via messaging system");

      return {
        success: true,
        message:
          "Test lesson created and 48-hour confirmation reminder sent via messaging system",
        data: {
          clientEmail,
          clientName: client.name,
          coachName: client.coach.name,
          lessonDate: testLessonDate,
          confirmationToken: reminder.confirmationToken,
          reminderId: reminder.id,
          lessonId: testLesson.id,
          instructions:
            "Client can confirm attendance by clicking the 'Acknowledge' button in the message",
        },
      };
    } else {
      return {
        success: true,
        message:
          "Test lesson created but no reminder was sent (may not be in 48-hour window)",
        data: {
          clientEmail,
          clientName: client.name,
          coachName: client.coach.name,
          lessonDate: testLessonDate,
          lessonId: testLesson.id,
        },
      };
    }
  } catch (error) {
    console.error("❌ Failed to send test reminder:", error);
    return {
      success: false,
      message: `Failed to send test reminder: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
