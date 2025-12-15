import { db } from "@/db";
import { startOfDay, endOfDay } from "date-fns";
import { formatInTimeZone, zonedTimeToUtc } from "date-fns-tz";
import { CompleteEmailService } from "./complete-email-service";
import { getUserTimezoneFromDB } from "./timezone-utils";

/**
 * Daily Workout Reminder Service
 * Sends daily emails at 8 AM to clients who have workouts/programs scheduled for that day
 */
class DailyWorkoutReminderService {
  private static instance: DailyWorkoutReminderService;
  private emailService: CompleteEmailService;

  private constructor() {
    this.emailService = CompleteEmailService.getInstance();
  }

  public static getInstance(): DailyWorkoutReminderService {
    if (!DailyWorkoutReminderService.instance) {
      DailyWorkoutReminderService.instance = new DailyWorkoutReminderService();
    }
    return DailyWorkoutReminderService.instance;
  }

  /**
   * Get all workouts for a client for today
   * Includes both AssignedWorkout and ProgramAssignment drills
   */
  private async getTodaysWorkoutsForClient(clientId: string, today: Date): Promise<{
    workouts: Array<{ title: string; description?: string; duration?: string; type: 'assigned' | 'program' }>;
    coachName: string;
    clientName: string;
    clientEmail: string | null;
  } | null> {
    // Use EST/EDT timezone for "today" calculation
    // Get the current date in EST/EDT timezone
    const estTimeZone = "America/New_York";
    const todayInEST = formatInTimeZone(today, estTimeZone, "yyyy-MM-dd");
    const todayStartEST = zonedTimeToUtc(`${todayInEST} 00:00:00`, estTimeZone);
    const todayEndEST = zonedTimeToUtc(`${todayInEST} 23:59:59`, estTimeZone);
    
    const todayStart = todayStartEST;
    const todayEnd = todayEndEST;

    // Get client with coach info
    const client = await db.client.findFirst({
      where: { id: clientId },
      include: {
        coach: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!client || !client.user?.email) {
      return null;
    }

    const workouts: Array<{ title: string; description?: string; duration?: string; type: 'assigned' | 'program' }> = [];

    // 1. Get AssignedWorkout records for today
    const assignedWorkouts = await db.assignedWorkout.findMany({
      where: {
        clientId: clientId,
        scheduledDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        completed: false, // Only include incomplete workouts
      },
      select: {
        title: true,
        description: true,
        duration: true,
      },
    });

    for (const workout of assignedWorkouts) {
      workouts.push({
        title: workout.title,
        description: workout.description || undefined,
        duration: workout.duration || undefined,
        type: 'assigned',
      });
    }

    // 2. Get ProgramAssignment drills for today
    const programAssignment = await db.programAssignment.findFirst({
      where: {
        clientId: clientId,
        completed: false, // Only active programs
      },
      include: {
        program: {
          include: {
            weeks: {
              include: {
                days: {
                  include: {
                    drills: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (programAssignment) {
      // Calculate which week and day we're on based on start date
      // Use EST/EDT timezone for date calculations
      const estTimeZone = "America/New_York";
      const startDate = new Date(programAssignment.startDate || programAssignment.assignedAt);
      const startDateInEST = formatInTimeZone(startDate, estTimeZone, "yyyy-MM-dd");
      const startDateEST = zonedTimeToUtc(`${startDateInEST} 00:00:00`, estTimeZone);
      
      const todayInEST = formatInTimeZone(today, estTimeZone, "yyyy-MM-dd");
      const todayStartEST = zonedTimeToUtc(`${todayInEST} 00:00:00`, estTimeZone);
      
      const daysSinceStart = Math.floor(
        (todayStartEST.getTime() - startDateEST.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Only process if we're on or past the start date
      if (daysSinceStart < 0) {
        return {
          workouts,
          coachName: client.coach?.name || "Your Coach",
          clientName: client.name || "Client",
          clientEmail: client.user.email,
        };
      }
      
      const currentWeek = Math.floor(daysSinceStart / 7) + 1;
      
      // Get the actual day of the week in EST/EDT
      // dayNumber in ProgramDay: 1=Monday, 2=Tuesday, ..., 6=Saturday, 7=Sunday
      // JavaScript getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
      // Use formatInTimeZone to get the day of week in EST
      const dayOfWeekInEST = parseInt(formatInTimeZone(today, estTimeZone, "e")); // 1=Monday, 7=Sunday
      const dayNumber = dayOfWeekInEST === 7 ? 7 : dayOfWeekInEST; // Already in correct format (1-7)

      // Get today's program day
      const currentWeekData = programAssignment.program.weeks.find(
        w => w.weekNumber === currentWeek
      );

      if (currentWeekData) {
        const todayProgramDay = currentWeekData.days.find(
          d => d.dayNumber === dayNumber && !d.isRestDay
        );

        if (todayProgramDay && todayProgramDay.drills.length > 0) {
          for (const drill of todayProgramDay.drills) {
            workouts.push({
              title: drill.title,
              description: drill.description || undefined,
              duration: drill.duration || undefined,
              type: 'program',
            });
          }
        }
      }
    }

    return {
      workouts,
      coachName: client.coach?.name || "Your Coach",
      clientName: client.name || "Client",
      clientEmail: client.user.email,
    };
  }

  /**
   * Send daily workout reminder emails to all clients with workouts today
   */
  async sendDailyWorkoutReminders(): Promise<void> {
    try {
      const now = new Date();
      console.log("🏋️ Starting daily workout reminder service...");
      console.log(`   Current time (UTC): ${now.toISOString()}`);
      console.log(`   Current time (EST): ${now.toLocaleString("en-US", { timeZone: "America/New_York" })}`);

      // Check if RESEND_API_KEY is configured
      if (!process.env.RESEND_API_KEY) {
        console.error("❌ RESEND_API_KEY not configured - cannot send daily workout reminders");
        return;
      }

      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      
      console.log(`   Checking for workouts on: ${today.toLocaleDateString("en-US", { timeZone: "America/New_York" })}`);

      // Get all clients who have workouts scheduled for today
      // We'll check both AssignedWorkout and ProgramAssignment
      // Filter for clients that have a user account (userId is not null)
      const allClients = await db.client.findMany({
        where: {
          archived: false,
          userId: { not: null }, // User must exist
        },
        select: {
          id: true,
          userId: true,
        },
      });

      let emailsSent = 0;
      let emailsFailed = 0;
      let clientsWithWorkouts = 0;

      for (const client of allClients) {
        try {
          const clientWorkouts = await this.getTodaysWorkoutsForClient(client.id, today);

          if (clientWorkouts && clientWorkouts.workouts.length > 0 && clientWorkouts.clientEmail) {
            clientsWithWorkouts++;

            // Check if user has email notifications enabled (if they have a user account)
            if (client.userId) {
              const userSettings = await db.userSettings.findFirst({
                where: {
                  userId: client.userId,
                },
              });

              // Skip if email notifications are disabled
              if (userSettings?.emailNotifications === false) {
                console.log(`⏭️ Skipping ${clientWorkouts.clientName} - email notifications disabled`);
                continue;
              }
            }

            // Send daily workout reminder email
            const emailSent = await this.emailService.sendDailyWorkoutReminder(
              clientWorkouts.clientEmail,
              clientWorkouts.clientName,
              clientWorkouts.coachName,
              clientWorkouts.workouts
            );

            if (!emailSent) {
              console.error(`❌ Failed to send email to ${clientWorkouts.clientName} (${clientWorkouts.clientEmail})`);
              emailsFailed++;
              continue; // Skip push notification if email failed
            }

            // Send push notification for daily workouts
            if (client.userId) {
              try {
                const { sendPushNotification } = await import(
                  "@/lib/pushNotificationService"
                );
                const workoutCount = clientWorkouts.workouts.length;
                const workoutText = workoutCount === 1 ? "workout" : "workouts";
                await sendPushNotification(
                  client.userId,
                  `You have ${workoutCount} ${workoutText} today! 💪`,
                  `${workoutCount} ${workoutText} scheduled for today. Check your dashboard to get started!`,
                  {
                    type: "daily_workout_reminder",
                    workoutCount,
                    url: "/dashboard",
                    requireInteraction: false,
                  }
                );
                console.log(`📱 Sent push notification to ${clientWorkouts.clientName} for ${workoutCount} workouts`);
              } catch (error) {
                console.error(`❌ Failed to send push notification to ${clientWorkouts.clientName}:`, error);
              }
            }

            emailsSent++;
            console.log(`✅ Sent daily workout reminder to ${clientWorkouts.clientName} (${clientWorkouts.workouts.length} workouts)`);
          }
        } catch (error) {
          emailsFailed++;
          console.error(`❌ Failed to process client ${client.id}:`, error);
        }
      }

      console.log(`🏋️ Daily workout reminder service completed:`);
      console.log(`   - Clients with workouts: ${clientsWithWorkouts}`);
      console.log(`   - Emails sent: ${emailsSent}`);
      console.log(`   - Emails failed: ${emailsFailed}`);
    } catch (error) {
      console.error("❌ Error in daily workout reminder service:", error);
    }
  }

  /**
   * Manual trigger for testing
   */
  async manualTrigger(): Promise<void> {
    await this.sendDailyWorkoutReminders();
  }
}

export default DailyWorkoutReminderService.getInstance();

