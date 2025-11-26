import { db } from "@/db";
import { addHours, subHours, addDays, startOfDay, endOfDay } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { format } from "date-fns";
import { randomBytes } from "crypto";
import { CompleteEmailService } from "./complete-email-service";
import dailyDigestService from "./daily-digest-service";
import { getUserTimezoneFromDB, formatTimeInTimezone, formatDateInTimezone } from "./timezone-utils";

// In-memory tracking to prevent duplicate reminders
const sentReminders = new Set<string>();

class LessonReminderService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private lastCheckTime: Date | null = null;
  private checkCount = 0;
  private lastDailyDigestSent: Date | null = null;

  /**
   * Start the automatic lesson reminder service
   * This will check every hour for lessons that need reminders
   */
  start() {
    if (this.isRunning) {
      console.log("🔔 Lesson reminder service is already running");
      return;
    }

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
  }

  /**
   * Check for lessons that need reminders and send them
   */
  private async checkAndSendReminders() {
    try {
      const now = new Date();
      this.lastCheckTime = now;
      this.checkCount++;


      // Find lessons for day after tomorrow (48-hour confirmations only)
      const dayAfterTomorrow = addDays(now, 2);
      const dayAfterTomorrowStart = startOfDay(dayAfterTomorrow);
      const dayAfterTomorrowEnd = endOfDay(dayAfterTomorrow);


      // Get lessons for 48-hour confirmations only
      const lessonsToRemind = await db.event.findMany({
        where: {
          date: {
            gte: dayAfterTomorrowStart,
            lte: dayAfterTomorrowEnd,
          },
          status: "CONFIRMED",
          reminderSent: false, // Only lessons that haven't had 48-hour reminder sent
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


      let sentCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const lesson of lessonsToRemind) {
        // Check if the coach has lesson reminders enabled
        if (lesson.coach.settings?.lessonRemindersEnabled === false) {
          console.log(
            `Skipping reminder for lesson ${lesson.id} - coach ${lesson.coach.name} has lesson reminders disabled`
          );
          skippedCount++;
          continue;
        }

        try {
          // Calculate hours until lesson
          const hoursUntilLesson = Math.round(
            (lesson.date.getTime() - now.getTime()) / (1000 * 60 * 60)
          );

          // Create a unique identifier for this lesson reminder
          const reminderKey = `lesson_${lesson.id}_${
            lesson.date.toISOString().split("T")[0]
          }_48h`;

          // Check if we already sent a reminder for this lesson (in-memory check)
          if (sentReminders.has(reminderKey)) {
            console.log(
              `⏭️ Skipping ${
                lesson.client?.name || "Unknown Client"
              } - 48-hour confirmation already sent`
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
                contains: `🔔 **Lesson Confirmation Required**`,
              },
              // Check if reminder was sent for this specific lesson
              createdAt: {
                gte: subHours(lesson.date, 49), // Within the last 49 hours
                lte: subHours(lesson.date, 47), // And at least 47 hours before
              },
            },
          });

          if (existingReminder) {
            console.log(
              `⏭️ Skipping ${
                lesson.client?.name || "Unknown Client"
              } - 48-hour confirmation already in database`
            );
            skippedCount++;
            continue;
          }

          // Format the lesson time using client's timezone from settings
          // lesson.date is stored in UTC, so we format it in the client's timezone
          const clientTimezone = await getUserTimezoneFromDB(lesson.client.user.id);
          
          const lessonTime = formatTimeInTimezone(lesson.date, clientTimezone, "h:mm a");
          const lessonDate = formatDateInTimezone(lesson.date, clientTimezone, "EEEE, MMMM d");

          // 48-hour confirmation reminder
          const confirmationToken = randomBytes(32).toString("hex");
          const confirmationDeadline = addHours(new Date(), 24);

          const reminderMessage = `🔔 **Lesson Confirmation Required**

Hi ${lesson.client?.name || "there"}! 

Your lesson with Coach ${
            lesson.coach.name
          } is scheduled for **${lessonDate}** at **${lessonTime}** (in ${hoursUntilLesson} hours).

**⚠️ IMPORTANT: Please confirm your attendance within 24 hours or your spot will be released.**

Click the "Acknowledge" button below to confirm your attendance.

If you can't make it, please let me know as soon as possible so I can offer the spot to someone else.

- Coach ${lesson.coach.name}`;

          // Create the lesson reminder record for tracking
          await db.lessonReminder.create({
            data: {
              eventId: lesson.id,
              clientId: lesson.client?.id!, // Use Client.id, not User.id
              coachId: lesson.coachId,
              reminderType: "LESSON_REMINDER",
              confirmationToken,
              expiresAt: confirmationDeadline,
            },
          });

          // Update the lesson to mark 48-hour reminder as sent
          await db.event.update({
            where: { id: lesson.id },
            data: {
              reminderSent: true,
              reminderSentAt: new Date(),
              confirmationRequired: true,
              confirmationDeadline,
            },
          });


          // Send email notification for 48-hour confirmation reminder
          if (lesson.client?.user?.email && lesson.client?.user?.id) {
            try {
              const emailService = CompleteEmailService.getInstance();
              // Pass userId to check email preferences
              await emailService.sendLessonConfirmationReminder(
                lesson.client.user.email,
                lesson.client.name || "Client",
                lesson.coach.name || "Coach",
                lessonDate,
                lessonTime,
                hoursUntilLesson,
                lesson.client.user.id // Pass userId to check preferences
              );
            } catch (emailError) {
              console.error(
                "❌ Failed to send confirmation reminder email:",
                emailError
              );
            }
          } else {
            console.warn(
              `⚠️ Cannot send confirmation reminder email - no email or userId found for client ${lesson.client?.id}`
            );
          }

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

          // Send email and push notifications for the reminder message
          // This ensures users get notified about the message in their inbox
          if (lesson.client?.user?.id) {
            try {
              // Send push notification for lesson reminder
              const { sendLessonReminderNotification } = await import(
                "@/lib/pushNotificationService"
              );
              await sendLessonReminderNotification(
                lesson.client.user.id,
                lesson.date,
                lessonTime,
                lesson.coach.name || "Coach",
                lesson.id
              );

              // Send email notification if email exists
              if (lesson.client?.user?.email) {
                const emailService = CompleteEmailService.getInstance();
                // Send a message notification email for the reminder message
                // Note: This is in addition to the confirmation reminder email sent earlier
                // The confirmation reminder email is more detailed, this one is a simple notification
                await emailService.sendNewMessage(
                  lesson.client.user.email,
                  lesson.client.name || "Client",
                  lesson.coach.name || "Coach",
                  reminderMessage.length > 100
                    ? reminderMessage.substring(0, 100) + "..."
                    : reminderMessage,
                  lesson.client.user.id // Pass userId to check preferences
                );
              }
            } catch (messageEmailError) {
              console.error(
                "❌ Failed to send message notification email for reminder:",
                messageEmailError
              );
              // Don't fail the whole process if message email fails - we already sent the confirmation email
            }
          }

          // Mark this reminder as sent in memory
          sentReminders.add(reminderKey);

          sentCount++;

        } catch (error) {
          console.error(
            `❌ Error sending reminder for lesson ${lesson.id}:`,
            error
          );
          errorCount++;
        }
      }


      // Also process expired confirmations
      await this.processExpiredConfirmations();

      // Send daily digest emails (once per day)
      if (this.shouldSendDailyDigest()) {
        try {
          await dailyDigestService.sendDailyDigests();
        } catch (error) {
          console.error("❌ Failed to send daily digest emails:", error);
        }
      }

      // Log service health for production monitoring
      if (this.checkCount % 4 === 0) {
        // Every 4 checks (roughly every hour)
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
   * Process expired confirmations and auto-cancel lessons
   */
  private async processExpiredConfirmations() {
    try {
      const now = new Date();

      // Find lessons with expired confirmations
      const expiredLessons = await db.event.findMany({
        where: {
          confirmationRequired: true,
          confirmedAt: null,
          confirmationDeadline: {
            lt: now, // Deadline has passed
          },
          status: "CONFIRMED",
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


      for (const lesson of expiredLessons) {
        try {
          // Cancel the lesson
          await db.event.update({
            where: { id: lesson.id },
            data: {
              status: "CANCELLED",
            },
          });

          // Update the reminder status
          await db.lessonReminder.updateMany({
            where: {
              eventId: lesson.id,
              status: "SENT",
            },
            data: {
              status: "EXPIRED",
            },
          });

          // Find or create conversation for cancellation notification
          if (lesson.client?.user) {
            let conversation = await db.conversation.findFirst({
              where: {
                type: "COACH_CLIENT",
                coachId: lesson.coachId,
                clientId: lesson.client.user.id,
              },
            });

            if (!conversation) {
              conversation = await db.conversation.create({
                data: {
                  type: "COACH_CLIENT",
                  coachId: lesson.coachId,
                  clientId: lesson.client.user.id,
                },
              });
            }

            // Format the lesson date/time in the client's timezone
            const clientTimezone = await getUserTimezoneFromDB(lesson.client.user.id);
            const cancelledLessonDate = formatDateInTimezone(
              lesson.date,
              clientTimezone,
              "EEEE, MMMM d"
            );
            const cancelledLessonTime = formatTimeInTimezone(
              lesson.date,
              clientTimezone,
              "h:mm a"
            );

            // Send cancellation notification
            const cancellationMessage = `❌ **Lesson Cancelled**

Hi ${lesson.client?.name || "there"},

Your lesson scheduled for **${cancelledLessonDate} at ${cancelledLessonTime}** has been automatically cancelled because we didn't receive confirmation within the required timeframe.

The time slot is now available for other bookings.

If you'd like to reschedule, please let me know and I'll help you find a new time.

- Coach ${lesson.coach.name}`;

            const cancellationMsg = await db.message.create({
              data: {
                conversationId: conversation.id,
                senderId: lesson.coachId,
                content: cancellationMessage,
                requiresAcknowledgment: false,
              },
            });

            // Update conversation timestamp
            await db.conversation.update({
              where: { id: conversation.id },
              data: { updatedAt: new Date() },
            });


            // Send email notification for the cancellation message (in addition to the auto-cancellation email)
            // This ensures users get notified about the message in their inbox
            if (lesson.client?.user?.email && lesson.client?.user?.id) {
              try {
                const emailService = CompleteEmailService.getInstance();
                // Send a message notification email for the cancellation message
                // Note: This is in addition to the auto-cancellation email sent earlier
                await emailService.sendNewMessage(
                  lesson.client.user.email,
                  lesson.client.name || "Client",
                  lesson.coach.name || "Coach",
                  cancellationMessage.length > 100
                    ? cancellationMessage.substring(0, 100) + "..."
                    : cancellationMessage,
                  lesson.client.user.id // Pass userId to check preferences
                );
              } catch (messageEmailError) {
                console.error(
                  "❌ Failed to send message notification email for cancellation:",
                  messageEmailError
                );
                // Don't fail the whole process if message email fails - we already sent the cancellation email
              }
            }

            // Send email notification for auto-cancellation
            if (lesson.client?.user?.email && lesson.client?.user?.id) {
              try {
                const emailService = CompleteEmailService.getInstance();
                // Format the lesson date/time in the client's timezone for email
                const cancelledEmailDate = formatInTimeZone(
                  lesson.date,
                  clientTimezone,
                  "EEEE, MMMM d 'at' h:mm a"
                );
                
                await emailService.sendLessonAutoCancelled(
                  lesson.client.user.email,
                  lesson.client.name || "Client",
                  lesson.coach.name || "Coach",
                  cancelledEmailDate,
                  lesson.client.user.id // Pass userId to check preferences
                );
              } catch (emailError) {
                console.error(
                  "❌ Failed to send auto-cancellation email:",
                  emailError
                );
              }
            } else {
              console.warn(
                `⚠️ Cannot send auto-cancellation email - no email or userId found for client ${lesson.client?.id}`
              );
            }
          }
        } catch (error) {
          console.error(
            `❌ Error processing expired confirmation for lesson ${lesson.id}:`,
            error
          );
        }
      }

      if (expiredLessons.length > 0) {
        console.log(
          `📊 Processed ${expiredLessons.length} expired confirmations`
        );
      }
    } catch (error) {
      console.error("❌ Error processing expired confirmations:", error);
    }
  }

  /**
   * Manually trigger a reminder check (useful for testing)
   */
  async manualCheck() {
    await this.checkAndSendReminders();
    await this.processExpiredConfirmations();
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

  /**
   * Check if daily digest should be sent (once per day)
   */
  private shouldSendDailyDigest(): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!this.lastDailyDigestSent) {
      this.lastDailyDigestSent = today;
      return true;
    }

    const lastDigestDate = new Date(
      this.lastDailyDigestSent.getFullYear(),
      this.lastDailyDigestSent.getMonth(),
      this.lastDailyDigestSent.getDate()
    );

    if (today > lastDigestDate) {
      this.lastDailyDigestSent = today;
      return true;
    }

    return false;
  }
}

// Create a singleton instance
const lessonReminderService = new LessonReminderService();

export default lessonReminderService;
