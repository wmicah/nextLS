import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";
import { ensureUserId } from "./_helpers";

/**
 * Blocked Times Router
 * Handles coach availability blocking (vacations, appointments, etc.)
 */
export const blockedTimesRouter = router({
  // Get all blocked times for the coach (no month filtering)
  getAllBlockedTimes: publicProcedure.query(async () => {
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
        message: "Only coaches can view blocked times",
      });
    }

    const blockedTimes = await db.blockedTime.findMany({
      where: {
        coachId: ensureUserId(user.id),
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return blockedTimes;
  }),

  // Get all blocked times for a coach
  getBlockedTimes: publicProcedure
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
          message: "Only coaches can view blocked times",
        });
      }

      // Calculate month start and end dates
      const monthStart = new Date(input.year, input.month, 1);
      const monthEnd = new Date(input.year, input.month + 1, 0, 23, 59, 59);

      const blockedTimes = await db.blockedTime.findMany({
        where: {
          coachId: ensureUserId(user.id),
          OR: [
            // Blocked time starts within the month
            {
              startTime: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
            // Blocked time ends within the month
            {
              endTime: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
            // Blocked time spans the entire month
            {
              startTime: { lte: monthStart },
              endTime: { gte: monthEnd },
            },
          ],
        },
        orderBy: {
          startTime: "asc",
        },
      });

      return blockedTimes;
    }),

  // Create a blocked time
  createBlockedTime: publicProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        startTime: z.string(), // ISO string
        endTime: z.string(), // ISO string
        isAllDay: z.boolean().default(false),
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
          message: "Only coaches can create blocked times",
        });
      }

      // Convert string to Date object (this is local time from client)
      const localStartTime = new Date(input.startTime);
      const localEndTime = new Date(input.endTime);

      // Convert local time to UTC using the user's timezone
      const timeZone = input.timeZone || "America/New_York";
      const utcStartTime = fromZonedTime(localStartTime, timeZone);
      const utcEndTime = fromZonedTime(localEndTime, timeZone);

      // Validate the dates
      if (isNaN(utcStartTime.getTime()) || isNaN(utcEndTime.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid date format",
        });
      }

      if (utcStartTime >= utcEndTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End time must be after start time",
        });
      }

      // Check for conflicts with existing lessons
      const conflictingLessons = await db.event.findMany({
        where: {
          coachId: ensureUserId(user.id),
          status: "CONFIRMED",
          OR: [
            // Lesson starts within the blocked time
            {
              date: {
                gte: utcStartTime,
                lt: utcEndTime,
              },
            },
            // Lesson ends within the blocked time
            {
              date: {
                gt: utcStartTime,
                lte: utcEndTime,
              },
            },
            // Lesson spans the entire blocked time
            {
              date: {
                lte: utcStartTime,
                gte: utcEndTime,
              },
            },
          ],
        },
        include: {
          client: {
            select: {
              name: true,
            },
          },
        },
      });

      if (conflictingLessons.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Cannot block time that conflicts with existing lessons. Conflicting lessons: ${conflictingLessons
            .map(l => l.title)
            .join(", ")}`,
        });
      }

      // Create the blocked time
      const blockedTime = await db.blockedTime.create({
        data: {
          coachId: ensureUserId(user.id),
          title: input.title,
          description: input.description,
          startTime: utcStartTime,
          endTime: utcEndTime,
          isAllDay: input.isAllDay,
        },
      });

      return blockedTime;
    }),

  // Update a blocked time
  updateBlockedTime: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        startTime: z.string(), // ISO string
        endTime: z.string(), // ISO string
        isAllDay: z.boolean().default(false),
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
          message: "Only coaches can update blocked times",
        });
      }

      // Verify the blocked time belongs to this coach
      const existingBlockedTime = await db.blockedTime.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id),
        },
      });

      if (!existingBlockedTime) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Blocked time not found or you don't have permission to update it",
        });
      }

      // Convert string to Date object (this is local time from client)
      const localStartTime = new Date(input.startTime);
      const localEndTime = new Date(input.endTime);

      // Convert local time to UTC using the user's timezone
      const timeZone = input.timeZone || "America/New_York";
      const utcStartTime = fromZonedTime(localStartTime, timeZone);
      const utcEndTime = fromZonedTime(localEndTime, timeZone);

      // Validate the dates
      if (isNaN(utcStartTime.getTime()) || isNaN(utcEndTime.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid date format",
        });
      }

      if (utcStartTime >= utcEndTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End time must be after start time",
        });
      }

      // Check for conflicts with existing lessons (excluding the current blocked time)
      const conflictingLessons = await db.event.findMany({
        where: {
          coachId: ensureUserId(user.id),
          status: "CONFIRMED",
          OR: [
            // Lesson starts within the blocked time
            {
              date: {
                gte: utcStartTime,
                lt: utcEndTime,
              },
            },
            // Lesson ends within the blocked time
            {
              date: {
                gt: utcStartTime,
                lte: utcEndTime,
              },
            },
            // Lesson spans the entire blocked time
            {
              date: {
                lte: utcStartTime,
                gte: utcEndTime,
              },
            },
          ],
        },
        include: {
          client: {
            select: {
              name: true,
            },
          },
        },
      });

      if (conflictingLessons.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Cannot block time that conflicts with existing lessons. Conflicting lessons: ${conflictingLessons
            .map(l => l.title)
            .join(", ")}`,
        });
      }

      // Update the blocked time
      const updatedBlockedTime = await db.blockedTime.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          startTime: utcStartTime,
          endTime: utcEndTime,
          isAllDay: input.isAllDay,
        },
      });

      return updatedBlockedTime;
    }),

  // Delete a blocked time
  deleteBlockedTime: publicProcedure
    .input(
      z.object({
        id: z.string(),
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
          message: "Only coaches can delete blocked times",
        });
      }

      // Verify the blocked time belongs to this coach
      const existingBlockedTime = await db.blockedTime.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id),
        },
      });

      if (!existingBlockedTime) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Blocked time not found or you don't have permission to delete it",
        });
      }

      // Delete the blocked time
      await db.blockedTime.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Get blocked times for a specific date range (for client scheduling)
  getBlockedTimesForDateRange: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        coachId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      const blockedTimes = await db.blockedTime.findMany({
        where: {
          coachId: input.coachId,
          OR: [
            // Blocked time starts within the range
            {
              startTime: {
                gte: startDate,
                lte: endDate,
              },
            },
            // Blocked time ends within the range
            {
              endTime: {
                gte: startDate,
                lte: endDate,
              },
            },
            // Blocked time spans the entire range
            {
              startTime: { lte: startDate },
              endTime: { gte: endDate },
            },
          ],
        },
        orderBy: {
          startTime: "asc",
        },
      });

      return blockedTimes;
    }),

  // Get blocked times for schedule display (coach's own blocked times)
  getBlockedTimesForSchedule: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
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
          message: "Only coaches can view blocked times",
        });
      }

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      const blockedTimes = await db.blockedTime.findMany({
        where: {
          coachId: ensureUserId(user.id),
          OR: [
            // Blocked time starts within the range
            {
              startTime: {
                gte: startDate,
                lte: endDate,
              },
            },
            // Blocked time ends within the range
            {
              endTime: {
                gte: startDate,
                lte: endDate,
              },
            },
            // Blocked time spans the entire range
            {
              startTime: { lte: startDate },
              endTime: { gte: endDate },
            },
          ],
        },
        orderBy: {
          startTime: "asc",
        },
      });

      return blockedTimes;
    }),
});
