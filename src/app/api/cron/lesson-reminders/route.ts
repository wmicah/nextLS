import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { addHours, subHours } from "date-fns";

// In-memory tracking to prevent duplicate reminders
const sentReminders = new Set<string>();

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    console.log(`🔔 Internal lesson reminder check at ${now.toISOString()}`);

    // Find all confirmed lessons that are scheduled between 24-25 hours from now
    // This ensures we send reminders exactly 24 hours before each lesson
    const reminderWindowStart = addHours(now, 24); // 24 hours from now
    const reminderWindowEnd = addHours(now, 25); // 25 hours from now

    console.log(
      `Looking for lessons between ${reminderWindowStart.toISOString()} and ${reminderWindowEnd.toISOString()}`
    );

    const lessonsToRemind = await db.event.findMany({
      where: {
        date: {
          gte: reminderWindowStart,
          lte: reminderWindowEnd,
        },
        status: "CONFIRMED", // Only send reminders for confirmed lessons
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        coach: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(
      `Found ${lessonsToRemind.length} lessons that need reminders now`
    );

    const results = [];
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const lesson of lessonsToRemind) {
      try {
        // Create a unique identifier for this lesson reminder
        const reminderKey = `lesson_${lesson.id}_${
          lesson.date.toISOString().split("T")[0]
        }`;

        // Check if we already sent a reminder for this lesson (in-memory check)
        if (sentReminders.has(reminderKey)) {
          results.push({
            lessonId: lesson.id,
            clientName: lesson.client.name,
            lessonTime: lesson.date.toISOString(),
            status: "skipped",
            reason: "Reminder already sent for this lesson (in-memory)",
          });
          skippedCount++;
          continue;
        }

        // Check if client has notifications enabled
        if (!lesson.client.user) {
          results.push({
            lessonId: lesson.id,
            clientName: lesson.client.name,
            lessonTime: lesson.date.toISOString(),
            status: "skipped",
            reason: "No user account",
          });
          skippedCount++;
          continue;
        }

        // Find or create conversation between coach and client
        let conversation = await db.conversation.findFirst({
          where: {
            type: "COACH_CLIENT",
            coachId: lesson.coachId,
            clientId: lesson.client.user.id,
          },
        });

        if (!conversation) {
          // Create conversation if it doesn't exist
          conversation = await db.conversation.create({
            data: {
              type: "COACH_CLIENT",
              coachId: lesson.coachId,
              clientId: lesson.client.user.id,
            },
          });
        }

        // Double-check database for existing reminders (fallback)
        const existingReminder = await db.message.findFirst({
          where: {
            conversationId: conversation.id,
            content: {
              contains: `🔔 **Lesson Reminder**`,
            },
            // Check if reminder was sent for this specific lesson
            createdAt: {
              gte: subHours(lesson.date, 25), // Within the last 25 hours
              lte: subHours(lesson.date, 23), // And at least 23 hours before
            },
          },
        });

        if (existingReminder) {
          results.push({
            lessonId: lesson.id,
            clientName: lesson.client.name,
            lessonTime: lesson.date.toISOString(),
            status: "skipped",
            reason: "Reminder already sent for this lesson (database)",
          });
          skippedCount++;
          continue;
        }

        // Calculate exactly how many hours until the lesson
        const hoursUntilLesson = Math.round(
          (lesson.date.getTime() - now.getTime()) / (1000 * 60 * 60)
        );

        // Format the lesson time
        const lessonTime = lesson.date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        const lessonDate = lesson.date.toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

        // Create the reminder message with improved formatting
        const reminderMessage = `🔔 **Lesson Reminder**

Hi ${lesson.client.name}! 

This is a friendly reminder that you have a lesson scheduled for **${lessonDate}** at **${lessonTime}** (in ${hoursUntilLesson} hours).

Please make sure to:

• Arrive 5-10 minutes early
• Bring any equipment you need  
• Let me know if you need to reschedule

Looking forward to seeing you!

- Coach ${lesson.coach.name}`;

        // Send the reminder message
        const message = await db.message.create({
          data: {
            conversationId: conversation.id,
            senderId: lesson.coachId, // Message appears to come from the coach
            content: reminderMessage,
            requiresAcknowledgment: true, // This message requires acknowledgment
          },
        });

        // Update conversation timestamp
        await db.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });

        // Mark this reminder as sent in memory
        sentReminders.add(reminderKey);

        results.push({
          lessonId: lesson.id,
          clientName: lesson.client.name,
          lessonTime: lesson.date.toISOString(),
          hoursUntilLesson,
          status: "sent",
          messageId: message.id,
        });
        sentCount++;

        console.log(
          `✅ Sent reminder to ${lesson.client.name} for lesson in ${hoursUntilLesson} hours (${lessonTime})`
        );
      } catch (error) {
        console.error(`Error sending reminder for lesson ${lesson.id}:`, error);
        results.push({
          lessonId: lesson.id,
          clientName: lesson.client.name,
          lessonTime: lesson.date.toISOString(),
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        errorCount++;
      }
    }

    const summary = {
      total: lessonsToRemind.length,
      sent: sentCount,
      skipped: skippedCount,
      errors: errorCount,
      reminderWindow: {
        start: reminderWindowStart.toISOString(),
        end: reminderWindowEnd.toISOString(),
      },
      timestamp: now.toISOString(),
    };

    console.log(`Lesson reminder job completed:`, summary);

    return NextResponse.json({
      success: true,
      message: `Processed ${lessonsToRemind.length} lessons for 24-hour reminders`,
      summary,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in automatic lesson reminder system:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
