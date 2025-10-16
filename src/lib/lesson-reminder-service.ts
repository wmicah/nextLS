import { db } from "@/db";
import { addHours, subHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

// In-memory tracking to prevent duplicate reminders
const sentReminders = new Set<string>();

class LessonReminderService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastCheckTime: Date | null = null;
  private checkCount = 0;

  /**
   * Start the automatic lesson reminder service
   * This will check every hour for lessons that need reminders
   */
  start() {
    if (this.isRunning) {
      console.log("🔔 Lesson reminder service is already running");
      return;
    }

    console.log("🚀 Starting automatic lesson reminder service...");
    this.isRunning = true;

    // Run immediately on start
    this.checkAndSendReminders();

    // Then run every hour
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, 60 * 60 * 1000); // Every hour (60 minutes * 60 seconds * 1000 milliseconds)

    // Also run every 15 minutes as a backup for production reliability
    setInterval(() => {
      if (this.isRunning) {
        this.checkAndSendReminders();
      }
    }, 15 * 60 * 1000); // Every 15 minutes

    console.log(
      "✅ Lesson reminder service started - checking every hour + backup every 15 minutes"
    );
  }

  /**
   * Stop the automatic lesson reminder service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("🛑 Lesson reminder service stopped");
  }

  /**
   * Check for lessons that need reminders and send them
   */
  private async checkAndSendReminders() {
    try {
      const now = new Date();
      this.lastCheckTime = now;
      this.checkCount++;

      console.log(
        `🔔 Checking for lessons that need reminders at ${now.toISOString()} (check #${
          this.checkCount
        })`
      );

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
          organization: {
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
            console.log(
              `⏭️ Skipping ${
                lesson.client?.name || "Unknown Client"
              } - reminder already sent`
            );
            skippedCount++;
            continue;
          }

          // Check if client has notifications enabled
          if (!lesson.client?.user) {
            console.log(
              `⏭️ Skipping ${
                lesson.client?.name || "Unknown Client"
              } - no user account`
            );
            skippedCount++;
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
            console.log(
              `⏭️ Skipping ${
                lesson.client?.name || "Unknown Client"
              } - reminder already in database`
            );
            skippedCount++;
            continue;
          }

          // Calculate exactly how many hours until the lesson
          const hoursUntilLesson = Math.round(
            (lesson.date.getTime() - now.getTime()) / (1000 * 60 * 60)
          );

          // Format the lesson time using default timezone
          const timezone = "America/New_York"; // Default timezone
          const localDate = toZonedTime(lesson.date, timezone);

          const lessonTime = format(localDate, "h:mm a");
          const lessonDate = format(localDate, "EEEE, MMMM d");

          // Create the reminder message with improved formatting
          const reminderMessage = `🔔 **Lesson Reminder**

Hi ${lesson.client?.name || "there"}! 

This is a friendly reminder that you have a lesson scheduled for **${lessonDate}** at **${lessonTime}** (in ${hoursUntilLesson} hours).

Please make sure to arrive 5-10 minutes early.

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

          sentCount++;

          console.log(
            `✅ Sent reminder to ${
              lesson.client?.name || "Unknown Client"
            } for lesson in ${hoursUntilLesson} hours (${lessonTime})`
          );
        } catch (error) {
          console.error(
            `❌ Error sending reminder for lesson ${lesson.id}:`,
            error
          );
          errorCount++;
        }
      }

      console.log(
        `📊 Reminder check completed: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`
      );

      // Log service health for production monitoring
      if (this.checkCount % 4 === 0) {
        // Every 4 checks (roughly every hour)
        console.log(
          `🏥 Service Health: Running for ${
            this.checkCount
          } checks, last check: ${this.lastCheckTime?.toISOString()}`
        );
      }
    } catch (error) {
      console.error("❌ Error in lesson reminder service:", error);
    }
  }

  /**
   * Get the current status of the service
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null,
      sentRemindersCount: sentReminders.size,
      lastCheckTime: this.lastCheckTime?.toISOString(),
      checkCount: this.checkCount,
      uptime: this.lastCheckTime
        ? Date.now() - this.lastCheckTime.getTime()
        : 0,
    };
  }

  /**
   * Manually trigger a reminder check (useful for testing)
   */
  async manualCheck() {
    console.log("🔍 Manual reminder check triggered");
    await this.checkAndSendReminders();
  }

  /**
   * Get service health information
   */
  getHealth() {
    const now = new Date();
    const lastCheck = this.lastCheckTime;
    const timeSinceLastCheck = lastCheck
      ? now.getTime() - lastCheck.getTime()
      : 0;

    return {
      status: this.isRunning ? "healthy" : "stopped",
      lastCheck: lastCheck?.toISOString(),
      timeSinceLastCheck: Math.round(timeSinceLastCheck / 1000), // seconds
      checkCount: this.checkCount,
      sentRemindersCount: sentReminders.size,
      isProductionReady: this.isRunning && this.checkCount > 0,
    };
  }
}

// Create a singleton instance
const lessonReminderService = new LessonReminderService();

export default lessonReminderService;
