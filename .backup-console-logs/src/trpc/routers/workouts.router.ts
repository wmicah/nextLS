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
 * Workouts Router
 */
export const workoutsRouter = router({
  getTodaysWorkouts: publicProcedure.query(async () => {
    try {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {

        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // First, find the client record for this user
      const client = await db.client.findFirst({
        where: { userId: user.id },
        include: {
          coach: true,
        },
      });

      if (!client) {

        return [];
      }

      // Get the client's assigned program
      const programAssignment = await db.programAssignment.findFirst({
        where: {
          clientId: client.id,
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

      if (!programAssignment) {

        return [];
      }

      // Calculate which week and day we're on based on start date
      const startDate =
        programAssignment.startDate || programAssignment.assignedAt;
      const today = new Date();
      const daysSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const currentWeek = Math.floor(daysSinceStart / 7) + 1;
      const currentDay = (daysSinceStart % 7) + 1;

      // Get today's program day
      const currentWeekData = programAssignment.program.weeks.find(
        w => w.weekNumber === currentWeek
      );
      if (!currentWeekData) {

        return [];
      }

      const todayProgramDay = currentWeekData.days.find(
        d => d.dayNumber === currentDay
      );
      if (!todayProgramDay) {

        return [];
      }

      // Return the drills for today as "workouts"
      return todayProgramDay.drills.map(drill => ({
        id: drill.id,
        title: drill.title,
        description: drill.description,
        duration: drill.duration,
        completed: false, // We'll track this separately
        template: null, // Not using workout templates for program drills
      }));
    } catch (error) {

      return [];
    }
  }),

  // Debug endpoint to see what's in the database
  debugWorkouts: publicProcedure.query(async () => {
    try {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get all clients
      const allClients = await db.client.findMany({
        include: {
          coach: true,
        },
      });

      // Get all program assignments
      const allProgramAssignments = await db.programAssignment.findMany({
        include: {
          client: true,
          program: true,
        },
      });

      // Get all assigned workouts
      const allWorkouts = await db.assignedWorkout.findMany({
        include: {
          client: true,
          coach: true,
          template: true,
        },
      });

      return {
        user: { id: user.id, email: user.email },
        clients: allClients,
        programAssignments: allProgramAssignments,
        workouts: allWorkouts,
      };
    } catch (error) {

      return {
        user: { id: "error", email: "error" },
        clients: [],
        programAssignments: [],
        workouts: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  getClientWorkouts: publicProcedure
    .input(z.object({ clientId: z.string() }))
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
          message: "Only coaches can view client workouts",
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
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // If client has a userId, use that for workouts, otherwise return empty array
      if (!client.userId) {
        return [];
      }

      return await db.workout.findMany({
        where: {
          clientId: client.userId,
        },
        orderBy: { date: "desc" },
      });
    }),

  markComplete: publicProcedure
    .input(
      z.object({
        workoutId: z.string(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can mark workouts as complete",
        });
      }

      // Find the client record for this user
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client record not found",
        });
      }

      // Find the assigned workout
      const assignedWorkout = await db.assignedWorkout.findFirst({
        where: {
          id: input.workoutId,
          clientId: client.id,
        },
      });

      if (!assignedWorkout) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workout not found or not assigned to you",
        });
      }

      // Update the workout completion status
      const updatedWorkout = await db.assignedWorkout.update({
        where: { id: input.workoutId },
        data: {
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
        },
      });

      return updatedWorkout;
    }),
});
