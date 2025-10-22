import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    // Verify the request has a secret key to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.LESSON_REMINDER_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const tomorrow = addDays(now, 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);

    // Check if this is a test request (for testing acknowledgment system)
    const isTestRequest = searchParams.get("test") === "true";

    let lessonsToProcess: any[] = [];

    if (isTestRequest) {
      // For testing, find any confirmed lesson for the specified client
      // First find the client by email, then find their lessons
      const clientEmail =
        searchParams.get("clientEmail") || "testingnls1@yahoo.com";

      // Find the client first
      const client = await db.client.findFirst({
        where: {
          user: {
            email: clientEmail,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (client) {
        // Then find lessons for this client
        const testLessons = await db.event.findMany({
          where: {
            status: "CONFIRMED",
            clientId: client.id,
          },
          take: 1,
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
                settings: {
                  select: {
                    lessonRemindersEnabled: true,
                  },
                },
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        lessonsToProcess = testLessons;
      } else {
        lessonsToProcess = [];
      }
    } else {
      // Normal behavior - find lessons happening tomorrow
      const tomorrowLessons = await db.event.findMany({
        where: {
          date: {
            gte: tomorrowStart,
            lte: tomorrowEnd,
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
              settings: {
                select: {
                  lessonRemindersEnabled: true,
                },
              },
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      lessonsToProcess = tomorrowLessons;
    }

    const results = [];

    for (const lesson of lessonsToProcess) {
      try {
        // Check if the coach has lesson reminders enabled
        if (lesson.coach.settings?.lessonRemindersEnabled === false) {
          results.push({
            lessonId: lesson.id,
            clientName: lesson.client?.name || "Unknown Client",
            status: "skipped",
            reason: "Coach has lesson reminders disabled",
          });
          continue;
        }

        // Check if client has notifications enabled
        if (!lesson.client?.user) {
          results.push({
            lessonId: lesson.id,
            clientName: lesson.client?.name || "Unknown Client",
            status: "skipped",
            reason: "No user account",
          });
          continue;
        }

        // Find or create conversation between coach and client
        let conversation = await db.conversation.findFirst({
          where: {
            type: "COACH_CLIENT",
            coachId: lesson.coachId,
            clientId: lesson.client?.user?.id,
          },
        });

        if (!conversation) {
          // Create conversation if it doesn't exist
          conversation = await db.conversation.create({
            data: {
              type: "COACH_CLIENT",
              coachId: lesson.coachId,
              clientId: lesson.client?.user?.id,
            },
          });
        }

        // Check if we already sent a reminder for this lesson (to avoid duplicates)
        const existingReminder = await db.message.findFirst({
          where: {
            conversationId: conversation.id,
            content: {
              contains: `🔔 **Lesson Reminder**`,
            },
            createdAt: {
              gte: startOfDay(now), // Check if reminder was sent today
            },
          },
        });

        if (existingReminder) {
          results.push({
            lessonId: lesson.id,
            clientName: lesson.client?.name || "Unknown Client",
            status: "skipped",
            reason: "Reminder already sent today",
          });
          continue;
        }

        // Format the lesson time using default timezone
        const timezone = "America/New_York"; // Default timezone
        const localDate = toZonedTime(lesson.date, timezone);

        const lessonTime = format(localDate, "h:mm a");
        const lessonDate = format(localDate, "EEEE, MMMM d");

        // Create the reminder message with improved formatting
        const reminderMessage = `🔔 **Lesson Reminder**

Hi ${lesson.client?.name || "there"}! 

This is a friendly reminder that you have a lesson scheduled for **tomorrow** (${lessonDate}) at **${lessonTime}**.

Please make sure to:

• Arrive 5-10 minutes early
• Bring any equipment you need  
• Let me know if you need to reschedule

Looking forward to seeing you!

- Coach ${lesson.coach.name}`;

        // Send actual email reminder
        if (process.env.RESEND_API_KEY) {
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);

            await resend.emails.send({
              from: "Coach Platform <onboarding@resend.dev>",
              to: [lesson.client?.user?.email || ""],
              subject: `🔔 Lesson Reminder - Tomorrow at ${lessonTime}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #4A5A70 0%, #606364 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1>🏆 Lesson Reminder</h1>
                  </div>
                  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p>Hi ${lesson.client?.name || "there"}!</p>
                    <p>This is a friendly reminder that you have a lesson scheduled for <strong>tomorrow</strong> (${lessonDate}) at <strong>${lessonTime}</strong>.</p>
                    <p>Please make sure to:</p>
                    <ul>
                      <li>Arrive 5-10 minutes early</li>
                      <li>Bring any equipment you need</li>
                      <li>Let me know if you need to reschedule</li>
                    </ul>
                    <p>Looking forward to seeing you!</p>
                    <p>- Coach ${lesson.coach.name}</p>
                  </div>
                </div>
              `,
            });

            console.log(`📧 Email sent to ${lesson.client?.user?.email}`);
          } catch (emailError) {
            console.error("Failed to send email:", emailError);
          }
        }

        // Also send the reminder message in-app
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

        results.push({
          lessonId: lesson.id,
          clientName: lesson.client?.name || "Unknown Client",
          status: "sent",
          messageId: message.id,
        });
      } catch (error) {
        console.error(`Error sending reminder for lesson ${lesson.id}:`, error);
        results.push({
          lessonId: lesson.id,
          clientName: lesson.client?.name || "Unknown Client",
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${lessonsToProcess.length} lessons`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in lesson reminder system:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing (remove in production)
export async function GET() {
  return NextResponse.json({
    message: "Lesson reminder system is running",
    timestamp: new Date().toISOString(),
    instructions: "Use POST with ?secret=YOUR_SECRET to trigger reminders",
  });
}
