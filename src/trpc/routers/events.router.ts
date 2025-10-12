import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import { format, addDays, addMonths } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import {
  extractYouTubeVideoId,
  extractPlaylistId,
  getYouTubeThumbnail,
  fetchYouTubeVideoInfo,
  fetchPlaylistVideos,
} from "@/lib/youtube";
import { deleteFileFromUploadThing } from "@/lib/uploadthing-utils";
import { ensureUserId, sendWelcomeMessage } from "./_helpers";

/**
 * Events Router
 */
export const eventsRouter = router({
    getUpcoming: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get user role to determine query
      const dbUser = await db.user.findFirst({
        where: { id: user.id },
        select: { role: true },
      });

      if (!dbUser) throw new TRPCError({ code: "UNAUTHORIZED" });

      if (dbUser.role === "COACH") {
        // For coaches, get all events they're coaching
        return await db.event.findMany({
          where: {
            coachId: ensureUserId(user.id),
            date: { gte: new Date() },
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
          orderBy: { date: "asc" },
        });
      } else {
        // For clients, get their events
        return await db.event.findMany({
          where: {
            clientId: ensureUserId(user.id),
            date: { gte: new Date() },
          },
          include: {
            coach: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { date: "asc" },
        });
      }
    }),

    createReminder: publicProcedure
      .input(
        z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
          date: z.string(),
          time: z.string(),
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
            message: "Only coaches can create reminders",
          });
        }

        // Combine date and time into a single Date object
        const dateStr = input.date;
        const timeStr = input.time;

        // Parse the time string (e.g., "14:30")
        const [hours, minutes] = timeStr.split(":").map(Number);

        // Create date in local timezone to avoid timezone issues
        const reminderDate = new Date(dateStr + "T" + timeStr + ":00");

        // Create the reminder event
        const reminder = await db.event.create({
          data: {
            title: input.title,
            description: input.description || "",
            date: reminderDate,
            status: "PENDING",
            coachId: ensureUserId(user.id),
          },
        });

        return reminder;
      }),

    deleteEvent: publicProcedure
      .input(z.object({ eventId: z.string() }))
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
            message: "Only coaches can delete events",
          });
        }

        // Find the event and verify ownership
        const event = await db.event.findFirst({
          where: {
            id: input.eventId,
            coachId: ensureUserId(user.id),
          },
        });

        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Event not found or you don't have permission to delete it",
          });
        }

        // Delete the event
        await db.event.delete({
          where: { id: input.eventId },
        });

        return { success: true };
      }),

    createConfirmationToken: publicProcedure
      .input(z.object({ lessonId: z.string() }))
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
            message: "Only coaches can create lesson confirmation tokens",
          });
        }

        // Find the lesson and verify it belongs to this coach
        const lesson = await db.event.findFirst({
          where: {
            id: input.lessonId,
            coachId: ensureUserId(user.id),
          },
          include: {
            client: true,
          },
        });

        if (!lesson) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lesson not found",
          });
        }

        // Import the JWT utility
        const { createLessonToken } = await import("@/lib/jwt");

        // Create the confirmation token
        if (!lesson.clientId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Lesson must have a client to create confirmation token",
          });
        }

        const token = await createLessonToken({
          lessonId: lesson.id,
          clientId: lesson.clientId,
          coachId: lesson.coachId,
        });

        return {
          token,
          confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/lesson/confirm/${token}`,
        };
      }),
});
