import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import { format, addDays, addMonths } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { safeLocalToUTC, validateLessonScheduling } from "@/lib/dst-utils";
import {
  handleDSTTransition,
  DSTAutoHandlingOptions,
} from "@/lib/dst-auto-handler";
import {
  extractYouTubeVideoId,
  extractPlaylistId,
  getYouTubeThumbnail,
  fetchYouTubeVideoInfo,
  fetchPlaylistVideos,
} from "@/lib/youtube";
import { deleteFileFromUploadThing } from "@/lib/uploadthing-utils";
import { ensureUserId, sendWelcomeMessage } from "./_helpers";
import { CompleteEmailService } from "@/lib/complete-email-service";

/**
 * Scheduling Router
 */
export const schedulingRouter = router({
  // Schedule a lesson for a client
  scheduleLesson: publicProcedure
    .input(
      z.object({
        clientId: z.string(), // This is Client.id
        lessonDate: z.string(), // Changed from z.date() to z.string()
        sendEmail: z.boolean().optional(),
        timeZone: z.string().optional(),
        overrideWorkingDays: z.boolean().optional(), // Allow overriding working day restrictions
        autoHandleDST: z.boolean().optional(), // Enable automatic DST handling
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can schedule lessons",
        });
      }

      // Check if coach is in an organization
      const coachOrganization = await db.coachOrganization.findFirst({
        where: {
          coachId: ensureUserId(user.id),
          isActive: true,
        },
      });

      // Build the where clause
      let whereClause: any = {
        id: input.clientId,
      };

      if (coachOrganization?.organizationId) {
        // Get all coaches in the organization
        const orgCoaches = await db.coachOrganization.findMany({
          where: {
            organizationId: coachOrganization.organizationId,
            isActive: true,
          },
          select: {
            coachId: true,
          },
        });

        const orgCoachIds = orgCoaches.map(c => c.coachId);

        // Allow access if client belongs to any coach in the organization
        whereClause.coachId = { in: orgCoachIds };
      } else {
        // Not in an organization, only allow access to own clients
        whereClause.coachId = ensureUserId(user.id);
      }

      // Verify the client belongs to this coach or is in the same organization
      const client = await db.client.findFirst({
        where: whereClause,
        include: {
          coach: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found or not assigned to you",
        });
      }

      // Convert string to Date object (this is local time from client)
      const localLessonDate = new Date(input.lessonDate);

      // Convert local time to UTC using the user's timezone
      const timeZone = input.timeZone || "America/New_York";
      const utcLessonDate = safeLocalToUTC(localLessonDate, timeZone, "UTC");

      // Validate the date
      if (isNaN(utcLessonDate.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid date format",
        });
      }

      // Check if the lesson is in the past
      const now = new Date();
      if (utcLessonDate <= now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot schedule lessons in the past",
        });
      }

      // Check if the requested date is on a working day (unless override is enabled)
      if (!input.overrideWorkingDays && coach.workingDays) {
        const dayName = format(localLessonDate, "EEEE");
        if (!coach.workingDays.includes(dayName)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `You are not available on ${dayName}s`,
          });
        }
      }

      // Validate lesson scheduling for DST issues
      const dstValidation = validateLessonScheduling(utcLessonDate, timeZone);
      if (!dstValidation.valid && dstValidation.warnings.length > 0) {
        // Log the DST warnings but don't block the lesson creation
        console.warn("DST warnings for lesson scheduling:", {
          lessonDate: utcLessonDate.toISOString(),
          timezone: timeZone,
          warnings: dstValidation.warnings,
          suggestions: dstValidation.suggestions,
        });
      }

      // Handle DST transitions automatically if enabled
      let finalLessonDate = utcLessonDate;
      if (input.autoHandleDST) {
        const dstHandlingOptions: DSTAutoHandlingOptions = {
          autoReschedule: false, // Don't reschedule, adjust time instead
          autoAdjustTime: true, // Adjust time to maintain consistency
          preferredRescheduleDirection: "before",
          maxRescheduleDays: 3,
          notifyUsers: true,
        };

        const dstResult = handleDSTTransition(
          utcLessonDate,
          timeZone,
          dstHandlingOptions
        );
        if (dstResult.adjustedDate) {
          finalLessonDate = dstResult.adjustedDate;
          console.log("DST automatic handling applied:", {
            originalDate: dstResult.originalDate.toISOString(),
            adjustedDate: dstResult.adjustedDate.toISOString(),
            changes: dstResult.changes,
            notifications: dstResult.notifications,
          });
        }
      }

      // Check for conflicts with blocked times
      const conflictingBlockedTime = await db.blockedTime.findFirst({
        where: {
          coachId: ensureUserId(user.id),
          OR: [
            // Blocked time starts within the lesson time
            {
              startTime: {
                lte: utcLessonDate,
              },
              endTime: {
                gt: utcLessonDate,
              },
            },
            // Blocked time ends within the lesson time
            {
              startTime: {
                lt: utcLessonDate,
              },
              endTime: {
                gte: utcLessonDate,
              },
            },
            // Blocked time spans the entire lesson time
            {
              startTime: {
                lte: utcLessonDate,
              },
              endTime: {
                gte: utcLessonDate,
              },
            },
          ],
        },
      });

      if (conflictingBlockedTime) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Cannot schedule lesson during blocked time: ${conflictingBlockedTime.title}`,
        });
      }

      // Get coach's lesson duration
      const lessonDuration = coach.timeSlotInterval || 60; // Use coach's lesson duration or default to 60 minutes

      // Check for conflicts with existing lessons
      const conflictLessonEndTime = new Date(
        utcLessonDate.getTime() + lessonDuration * 60000
      );
      const conflictingLesson = await db.event.findFirst({
        where: {
          coachId: ensureUserId(user.id),
          status: "CONFIRMED", // Only check confirmed lessons
          OR: [
            // New lesson starts within existing lesson
            {
              date: {
                lte: utcLessonDate,
              },
              endTime: {
                gt: utcLessonDate,
              },
            },
            // New lesson ends within existing lesson
            {
              date: {
                lt: conflictLessonEndTime,
              },
              endTime: {
                gte: utcLessonDate,
              },
            },
            // New lesson spans existing lesson
            {
              date: {
                lte: utcLessonDate,
              },
              endTime: {
                gte: conflictLessonEndTime,
              },
            },
          ],
        },
      });

      if (conflictingLesson) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Time slot is already booked by another client",
        });
      }

      // Determine lesson title based on context
      // If scheduling for a different coach's client (organization context), show coach name
      // Otherwise, show client name
      const isSchedulingForAnotherCoach =
        client.coachId !== ensureUserId(user.id);
      const lessonTitle = isSchedulingForAnotherCoach
        ? `Lesson - ${client.coach?.name || "Coach"}`
        : `Lesson with ${client.name || client.email || "Client"}`;

      // Create the lesson (using Event model) - automatically CONFIRMED when coach schedules
      const lessonEndTime = new Date(
        finalLessonDate.getTime() + lessonDuration * 60000
      );
      const lesson = await db.event.create({
        data: {
          title: lessonTitle,
          description: "Scheduled lesson",
          date: finalLessonDate,
          endTime: lessonEndTime,
          status: "CONFIRMED", // Coach-scheduled lessons are automatically confirmed
          clientId: input.clientId, // Use Client.id directly
          coachId: ensureUserId(user.id),
          type: "LESSON", // Mark as lesson type for reminder system
          // Reminder system will automatically handle 48-hour reminders
        },
      });

      // Update client's next lesson date
      await db.client.update({
        where: { id: input.clientId },
        data: { nextLessonDate: utcLessonDate },
      });

      // Create notification for the client
      if (client.userId) {
        await db.notification.create({
          data: {
            userId: client.userId,
            type: "LESSON_SCHEDULED",
            title: "New Lesson Scheduled",
            message: `Your coach has scheduled a lesson for ${format(
              utcLessonDate,
              "MMM d, yyyy 'at' h:mm a"
            )}`,
          },
        });
      }

      // Send email notification if requested
      if (input.sendEmail && client.email) {
        try {
          const emailService = CompleteEmailService.getInstance();
          // Format the lesson time for the email
          const lessonTime = utcLessonDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          await emailService.sendLessonScheduled(
            client.email,
            client.name || "Client",
            coach?.name || "Coach",
            utcLessonDate.toLocaleDateString(),
            lessonTime
          );
          console.log(`📧 Lesson scheduled email sent to ${client.email}`);
        } catch (error) {
          console.error(
            `Failed to send lesson scheduled email to ${client.email}:`,
            error
          );
        }
      }

      return lesson;
    }),

  // Schedule recurring lessons for a client
  scheduleRecurringLessons: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
        startDate: z.string(), // Full datetime string (YYYY-MM-DDTHH:mm:ss)
        endDate: z.string(),
        recurrencePattern: z.enum([
          "weekly",
          "biweekly",
          "triweekly",
          "monthly",
        ]),
        recurrenceInterval: z.number().min(1).max(6), // 1-6 weeks
        sendEmail: z.boolean().optional(),
        timeZone: z.string().optional(),
        overrideWorkingDays: z.boolean().optional(), // Allow overriding working day restrictions
        autoHandleDST: z.boolean().optional(), // Enable automatic DST handling
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can schedule lessons",
        });
      }

      // Check if coach is in an organization
      const coachOrganization = await db.coachOrganization.findFirst({
        where: {
          coachId: ensureUserId(user.id),
          isActive: true,
        },
      });

      // Build the where clause
      let whereClause: any = {
        id: input.clientId,
      };

      if (coachOrganization?.organizationId) {
        // Get all coaches in the organization
        const orgCoaches = await db.coachOrganization.findMany({
          where: {
            organizationId: coachOrganization.organizationId,
            isActive: true,
          },
          select: {
            coachId: true,
          },
        });

        const orgCoachIds = orgCoaches.map(c => c.coachId);

        // Allow access if client belongs to any coach in the organization
        whereClause.coachId = { in: orgCoachIds };
      } else {
        // Not in an organization, only allow access to own clients
        whereClause.coachId = ensureUserId(user.id);
      }

      // Verify the client belongs to this coach or is in the same organization
      const client = await db.client.findFirst({
        where: whereClause,
        include: {
          coach: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found or not assigned to you",
        });
      }

      // Determine lesson title based on context
      // If scheduling for a different coach's client (organization context), show coach name
      // Otherwise, show client name
      const isSchedulingForAnotherCoach =
        client.coachId !== ensureUserId(user.id);
      const lessonTitle = isSchedulingForAnotherCoach
        ? `Lesson - ${client.coach?.name || "Coach"}`
        : `Lesson with ${client.name || client.email || "Client"}`;

      // Convert string to Date object (this is local time from client)
      const localStartDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      // Validate dates
      if (isNaN(localStartDate.getTime()) || isNaN(endDate.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid date format",
        });
      }

      if (localStartDate >= endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date must be after start date",
        });
      }

      const now = new Date();
      if (localStartDate <= now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot schedule lessons in the past",
        });
      }

      // Convert local time to UTC using the user's timezone
      const timeZone = input.timeZone || "America/New_York";
      const utcStartDate = safeLocalToUTC(localStartDate, timeZone, "UTC");

      // Extract time components from the UTC start date to preserve the time for all recurring lessons
      const startTime = utcStartDate.getHours();
      const startMinutes = utcStartDate.getMinutes();
      const startSeconds = utcStartDate.getSeconds();

      // Calculate lesson dates based on recurrence pattern
      const lessonDates: Date[] = [];
      let currentDate = new Date(utcStartDate);

      while (currentDate <= endDate) {
        // Check if the date is on a working day (unless override is enabled)
        if (!input.overrideWorkingDays && coach.workingDays) {
          const dayName = format(currentDate, "EEEE");
          if (coach.workingDays.includes(dayName)) {
            // Create a new date with the same time as the original start date
            const lessonDate = new Date(currentDate);
            lessonDate.setHours(startTime, startMinutes, startSeconds, 0);
            lessonDates.push(lessonDate);
          }
        } else {
          // Create a new date with the same time as the original start date
          const lessonDate = new Date(currentDate);
          lessonDate.setHours(startTime, startMinutes, startSeconds, 0);
          lessonDates.push(lessonDate);
        }

        // Calculate next lesson date based on recurrence pattern
        switch (input.recurrencePattern) {
          case "weekly":
            currentDate = addDays(currentDate, 7 * input.recurrenceInterval);
            break;
          case "biweekly":
            currentDate = addDays(currentDate, 14 * input.recurrenceInterval);
            break;
          case "triweekly":
            currentDate = addDays(currentDate, 21 * input.recurrenceInterval);
            break;
          case "monthly":
            currentDate = addMonths(currentDate, input.recurrenceInterval);
            break;
        }
      }

      if (lessonDates.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No valid lesson dates found within the specified range",
        });
      }

      // Get coach's lesson duration
      const lessonDuration = coach.timeSlotInterval || 60; // Use coach's lesson duration or default to 60 minutes

      // Check for conflicts and filter out conflicting dates
      const validLessonDates: Date[] = [];
      const skippedDates: Date[] = [];

      for (const lessonDate of lessonDates) {
        // Check for conflicts with existing lessons
        const recurringLessonEndTime = new Date(
          lessonDate.getTime() + lessonDuration * 60000
        );
        const conflictingLesson = await db.event.findFirst({
          where: {
            coachId: ensureUserId(user.id),
            status: "CONFIRMED",
            OR: [
              // New lesson starts within existing lesson
              {
                date: {
                  lte: lessonDate,
                },
                endTime: {
                  gt: lessonDate,
                },
              },
              // New lesson ends within existing lesson
              {
                date: {
                  lt: recurringLessonEndTime,
                },
                endTime: {
                  gte: lessonDate,
                },
              },
              // New lesson spans existing lesson
              {
                date: {
                  lte: lessonDate,
                },
                endTime: {
                  gte: recurringLessonEndTime,
                },
              },
            ],
          },
        });

        // Check for conflicts with blocked times
        const conflictingBlockedTime = await db.blockedTime.findFirst({
          where: {
            coachId: ensureUserId(user.id),
            OR: [
              // Blocked time starts within the lesson time
              {
                startTime: {
                  lte: lessonDate,
                },
                endTime: {
                  gt: lessonDate,
                },
              },
              // Blocked time ends within the lesson time
              {
                startTime: {
                  lt: recurringLessonEndTime,
                },
                endTime: {
                  gte: lessonDate,
                },
              },
              // Blocked time spans the entire lesson time
              {
                startTime: {
                  lte: lessonDate,
                },
                endTime: {
                  gte: recurringLessonEndTime,
                },
              },
            ],
          },
        });

        if (conflictingLesson || conflictingBlockedTime) {
          skippedDates.push(lessonDate);
        } else {
          // Handle DST transitions for recurring lessons if enabled
          let finalLessonDate = lessonDate;
          if (input.autoHandleDST) {
            const dstHandlingOptions: DSTAutoHandlingOptions = {
              autoReschedule: false, // Don't reschedule, adjust time instead
              autoAdjustTime: true, // Adjust time to maintain consistency
              preferredRescheduleDirection: "before",
              maxRescheduleDays: 3,
              notifyUsers: true,
            };

            const dstResult = handleDSTTransition(
              lessonDate,
              timeZone,
              dstHandlingOptions
            );
            if (dstResult.adjustedDate) {
              finalLessonDate = dstResult.adjustedDate;
              console.log(
                "DST automatic handling applied to recurring lesson:",
                {
                  originalDate: dstResult.originalDate.toISOString(),
                  adjustedDate: dstResult.adjustedDate.toISOString(),
                  changes: dstResult.changes,
                  notifications: dstResult.notifications,
                }
              );
            }
          }
          validLessonDates.push(finalLessonDate);
        }
      }

      // Create all valid lessons in a transaction
      const lessons =
        validLessonDates.length > 0
          ? await db.$transaction(
              validLessonDates.map(lessonDate => {
                const lessonEndTime = new Date(
                  lessonDate.getTime() + lessonDuration * 60000
                );
                return db.event.create({
                  data: {
                    title: lessonTitle,
                    description: `Recurring lesson (${input.recurrencePattern})`,
                    date: lessonDate,
                    endTime: lessonEndTime,
                    status: "CONFIRMED",
                    clientId: input.clientId,
                    coachId: ensureUserId(user.id),
                  },
                });
              })
            )
          : [];

      // Update client's next lesson date to the first scheduled lesson
      if (validLessonDates.length > 0) {
        await db.client.update({
          where: { id: input.clientId },
          data: { nextLessonDate: validLessonDates[0] },
        });
      }

      // Create notifications for the client
      if (client.userId) {
        let message = `Your coach has scheduled ${validLessonDates.length} recurring lessons`;
        if (skippedDates.length > 0) {
          message += ` (${skippedDates.length} dates skipped due to conflicts)`;
        }
        message += ` from ${format(localStartDate, "MMM d, yyyy")} to ${format(
          endDate,
          "MMM d, yyyy"
        )}`;

        await db.notification.create({
          data: {
            userId: client.userId,
            type: "LESSON_SCHEDULED",
            title: "Recurring Lessons Scheduled",
            message,
          },
        });
      }

      // TODO: Send email notification if requested
      if (input.sendEmail && client.email) {
        console.log(
          `Email notification would be sent to ${client.email} for ${validLessonDates.length} recurring lessons`
        );
      }

      return {
        lessons,
        totalLessons: validLessonDates.length,
        skippedLessons: skippedDates.length,
        skippedDates: skippedDates.map(date => date.toISOString()),
        dateRange: {
          start: localStartDate,
          end: endDate,
        },
      };
    }),

  // Get weekly schedule for a client
  getWeeklySchedule: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
        weekStart: z.date(),
      })
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can view schedules",
        });
      }

      const weekEnd = new Date(input.weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      return await db.weeklySchedule.findFirst({
        where: {
          clientId: input.clientId,
          coachId: ensureUserId(user.id),
          weekStart: input.weekStart,
          weekEnd: weekEnd,
        },
        include: {
          days: {
            include: {
              workoutTemplate: true,
              videoAssignments: {
                include: {
                  video: true,
                },
              },
            },
            orderBy: { dayOfWeek: "asc" },
          },
        },
      });
    }),

  // Create or update weekly schedule
  updateWeeklySchedule: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
        weekStart: z.date(),
        days: z.array(
          z.object({
            dayOfWeek: z.number(),
            workoutTemplateId: z.string().optional(),
            title: z.string(),
            description: z.string().optional(),
            exercises: z
              .array(
                z.object({
                  name: z.string(),
                  sets: z.number(),
                  reps: z.string(),
                  weight: z.string().optional(),
                  notes: z.string().optional(),
                })
              )
              .optional(),
            duration: z.string().optional(),
            videoIds: z.array(z.string()).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can update schedules",
        });
      }

      const weekEnd = new Date(input.weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Use transaction to ensure data consistency
      return await db.$transaction(async tx => {
        // Create or update weekly schedule
        const weeklySchedule = await tx.weeklySchedule.upsert({
          where: {
            clientId_coachId_weekStart: {
              clientId: input.clientId,
              coachId: ensureUserId(user.id),
              weekStart: input.weekStart,
            },
          },
          update: {},
          create: {
            clientId: input.clientId,
            coachId: ensureUserId(user.id),
            weekStart: input.weekStart,
            weekEnd: weekEnd,
          },
        });

        // Delete existing days
        await tx.scheduledDay.deleteMany({
          where: { weeklyScheduleId: weeklySchedule.id },
        });

        // Create new days
        const createdDays = await Promise.all(
          input.days.map(async day => {
            const createdDay = await tx.scheduledDay.create({
              data: {
                weeklyScheduleId: weeklySchedule.id,
                dayOfWeek: day.dayOfWeek,
                workoutTemplateId: day.workoutTemplateId,
                title: day.title,
                description: day.description,
                exercises: day.exercises as any,
                duration: day.duration,
              },
            });

            // Assign videos if provided
            if (day.videoIds && day.videoIds.length > 0) {
              await Promise.all(
                day.videoIds.map(videoId =>
                  tx.videoAssignment.upsert({
                    where: {
                      videoId_clientId: {
                        videoId: videoId,
                        clientId: input.clientId,
                      },
                    },
                    update: {
                      scheduledDayId: createdDay.id,
                    },
                    create: {
                      videoId: videoId,
                      clientId: input.clientId,
                      scheduledDayId: createdDay.id,
                      assignedAt: new Date(),
                    },
                  })
                )
              );
            }

            return createdDay;
          })
        );

        return {
          weeklySchedule,
          days: createdDays,
        };
      });
    }),

  // Copy previous week's schedule to current week
  copyPreviousWeek: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
        currentWeekStart: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Calculate previous week start
      const previousWeekStart = new Date(input.currentWeekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);

      const previousWeekEnd = new Date(previousWeekStart);
      previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);

      // Get previous week's schedule
      const previousSchedule = await db.weeklySchedule.findFirst({
        where: {
          clientId: input.clientId,
          coachId: ensureUserId(user.id),
          weekStart: previousWeekStart,
          weekEnd: previousWeekEnd,
        },
        include: {
          days: {
            include: {
              videoAssignments: true,
            },
          },
        },
      });

      if (!previousSchedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No previous week schedule found to copy",
        });
      }

      // Copy to current week
      const currentWeekEnd = new Date(input.currentWeekStart);
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

      return await db.$transaction(async tx => {
        const newSchedule = await tx.weeklySchedule.create({
          data: {
            clientId: input.clientId,
            coachId: ensureUserId(user.id),
            weekStart: input.currentWeekStart,
            weekEnd: currentWeekEnd,
          },
        });

        const copiedDays = await Promise.all(
          previousSchedule.days.map(async day => {
            const newDay = await tx.scheduledDay.create({
              data: {
                weeklyScheduleId: newSchedule.id,
                dayOfWeek: day.dayOfWeek,
                workoutTemplateId: day.workoutTemplateId,
                title: day.title,
                description: day.description,
                exercises: day.exercises as any,
                duration: day.duration,
              },
            });

            // Copy video assignments
            if (day.videoAssignments.length > 0) {
              await Promise.all(
                day.videoAssignments.map(assignment =>
                  tx.videoAssignment.create({
                    data: {
                      videoId: assignment.videoId,
                      clientId: assignment.clientId,
                      scheduledDayId: newDay.id,
                      assignedAt: new Date(),
                      dueDate: assignment.dueDate,
                      notes: assignment.notes,
                    },
                  })
                )
              );
            }

            return newDay;
          })
        );

        return {
          weeklySchedule: newSchedule,
          days: copiedDays,
        };
      });
    }),

  // Get coach's schedule for a specific month
  getCoachSchedule: publicProcedure
    .input(
      z.object({
        month: z.number(),
        year: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can view their schedule",
        });
      }

      // Calculate month start and end dates
      const monthStart = new Date(input.year, input.month, 1);
      const monthEnd = new Date(input.year, input.month + 1, 0, 23, 59, 59);
      const now = new Date();

      // Get all CONFIRMED events (lessons) for the coach in the specified month
      // Only include lessons for active (non-archived) clients
      const events = await db.event.findMany({
        where: {
          coachId: ensureUserId(user.id),
          status: "CONFIRMED", // Only return confirmed lessons
          date: {
            gte: monthStart,
            lte: monthEnd,
            gt: now, // Only return future lessons
          },
          client: {
            archived: false, // Only include lessons for active clients
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      return events;
    }),

  // Delete a lesson
  deleteLesson: publicProcedure
    .input(
      z.object({
        lessonId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can delete lessons",
        });
      }

      // Find the lesson and verify it belongs to this coach
      const lesson = await db.event.findFirst({
        where: {
          id: input.lessonId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!lesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson not found or you don't have permission to delete it",
        });
      }

      // Delete the lesson
      await db.event.delete({
        where: {
          id: input.lessonId,
        },
      });

      return { success: true };
    }),

  // Get upcoming lessons for the coach
  getCoachUpcomingLessons: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a COACH
    const coach = await db.user.findFirst({
      where: { id: user.id, role: "COACH" },
    });

    if (!coach) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only coaches can view their lessons",
      });
    }

    const now = new Date();

    // Get upcoming lessons for this coach
    const upcomingLessons = await db.event.findMany({
      where: {
        coachId: ensureUserId(user.id),
        date: {
          gte: now.toISOString(),
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
      take: 10, // Limit to next 10 lessons
    });

    return upcomingLessons;
  }),

  // Schedule a lesson with complete time freedom (override all restrictions)
  scheduleLessonWithFreedom: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
        lessonDate: z.string(), // Full datetime string
        duration: z.number().min(15).max(480), // Duration in minutes (15 min to 8 hours)
        title: z.string().optional(),
        description: z.string().optional(),
        sendEmail: z.boolean().optional(),
        timeZone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can schedule lessons",
        });
      }

      // Check if coach is in an organization
      const coachOrganization = await db.coachOrganization.findFirst({
        where: {
          coachId: ensureUserId(user.id),
          isActive: true,
        },
      });

      // Build the where clause
      let whereClause: any = {
        id: input.clientId,
      };

      if (coachOrganization?.organizationId) {
        // Get all coaches in the organization
        const orgCoaches = await db.coachOrganization.findMany({
          where: {
            organizationId: coachOrganization.organizationId,
            isActive: true,
          },
          select: {
            coachId: true,
          },
        });

        const orgCoachIds = orgCoaches.map(c => c.coachId);

        // Allow access if client belongs to any coach in the organization
        whereClause.coachId = { in: orgCoachIds };
      } else {
        // Not in an organization, only allow access to own clients
        whereClause.coachId = ensureUserId(user.id);
      }

      // Verify the client belongs to this coach or is in the same organization
      const client = await db.client.findFirst({
        where: whereClause,
        include: {
          coach: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found or not assigned to you",
        });
      }

      // Convert string to Date object (this is local time from client)
      const localLessonDate = new Date(input.lessonDate);

      // Convert local time to UTC using the user's timezone
      const timeZone = input.timeZone || "America/New_York";
      const utcLessonDate = safeLocalToUTC(localLessonDate, timeZone, "UTC");

      // Validate the date
      if (isNaN(utcLessonDate.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid date format",
        });
      }

      // Check if the lesson is in the past
      const now = new Date();
      if (utcLessonDate <= now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot schedule lessons in the past",
        });
      }

      // Check for conflicts with existing lessons
      const freedomLessonEndTime = new Date(
        utcLessonDate.getTime() + input.duration * 60000
      );

      // Get all confirmed lessons for the coach
      const existingLessons = await db.event.findMany({
        where: {
          coachId: ensureUserId(user.id),
          status: "CONFIRMED",
          date: {
            gte: new Date(utcLessonDate.getTime() - 24 * 60 * 60 * 1000), // Check 24 hours before
            lte: new Date(utcLessonDate.getTime() + 24 * 60 * 60 * 1000), // Check 24 hours after
          },
        },
        select: {
          id: true,
          title: true,
          date: true,
          endTime: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      });

      // Check for time overlaps
      const conflictingLesson = existingLessons.find(lesson => {
        const lessonStart = lesson.date;
        const lessonEnd =
          lesson.endTime || new Date(lessonStart.getTime() + 60 * 60 * 1000); // Default 60 min if no endTime

        // Check if lessons overlap
        return utcLessonDate < lessonEnd && freedomLessonEndTime > lessonStart;
      });

      if (conflictingLesson) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Cannot schedule lesson that conflicts with existing lesson: ${conflictingLesson.title}`,
        });
      }

      // Check for conflicts with blocked times
      const blockedTimes = await db.blockedTime.findMany({
        where: {
          coachId: ensureUserId(user.id),
          startTime: {
            lte: new Date(utcLessonDate.getTime() + 24 * 60 * 60 * 1000), // Check 24 hours after
          },
          endTime: {
            gte: new Date(utcLessonDate.getTime() - 24 * 60 * 60 * 1000), // Check 24 hours before
          },
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
        },
      });

      // Check for time overlaps with blocked times
      const conflictingBlockedTime = blockedTimes.find(blockedTime => {
        const blockedStart = blockedTime.startTime;
        const blockedEnd = blockedTime.endTime;

        // Check if lesson overlaps with blocked time
        return (
          utcLessonDate < blockedEnd && freedomLessonEndTime > blockedStart
        );
      });

      if (conflictingBlockedTime) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Cannot schedule lesson during blocked time: ${conflictingBlockedTime.title}`,
        });
      }

      // Determine lesson title
      const isSchedulingForAnotherCoach =
        client.coachId !== ensureUserId(user.id);
      const lessonTitle =
        input.title ||
        (isSchedulingForAnotherCoach
          ? `Lesson - ${client.coach?.name || "Coach"}`
          : `Lesson with ${client.name || client.email || "Client"}`);

      // Create the lesson (using Event model) - automatically CONFIRMED when coach schedules
      const freedomCreateLessonEndTime = new Date(
        utcLessonDate.getTime() + input.duration * 60000
      );
      const lesson = await db.event.create({
        data: {
          title: lessonTitle,
          description: input.description || "Scheduled lesson",
          date: utcLessonDate,
          endTime: freedomCreateLessonEndTime,
          status: "CONFIRMED", // Coach-scheduled lessons are automatically confirmed
          clientId: input.clientId,
          coachId: ensureUserId(user.id),
          type: "LESSON", // Mark as lesson type for reminder system
        },
      });

      // Update client's next lesson date
      await db.client.update({
        where: { id: input.clientId },
        data: { nextLessonDate: utcLessonDate },
      });

      // Create notification for the client
      if (client.userId) {
        await db.notification.create({
          data: {
            userId: client.userId,
            type: "LESSON_SCHEDULED",
            title: "New Lesson Scheduled",
            message: `Your coach has scheduled a lesson for ${format(
              utcLessonDate,
              "MMM d, yyyy 'at' h:mm a"
            )}`,
          },
        });
      }

      // Send email notification if requested
      if (input.sendEmail && client.email) {
        try {
          const emailService = CompleteEmailService.getInstance();
          // Format the lesson time for the email
          const lessonTime = utcLessonDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          await emailService.sendLessonScheduled(
            client.email,
            client.name || "Client",
            coach?.name || "Coach",
            utcLessonDate.toLocaleDateString(),
            lessonTime
          );
          console.log(`📧 Lesson scheduled email sent to ${client.email}`);
        } catch (error) {
          console.error(
            `Failed to send lesson scheduled email to ${client.email}:`,
            error
          );
        }
      }

      return lesson;
    }),
});
