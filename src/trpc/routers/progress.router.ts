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
 * Progress Router
 */
export const progressRouter = router({
    getClientProgress: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Example: Fetch streak and skill progress for the client
      // Replace with your actual logic
      return {
        currentStreak: 5,
        streakPercentage: 80,
        skills: [
          { name: "Speed", progress: 78 },
          { name: "Endurance", progress: 65 },
          { name: "Technique", progress: 82 },
        ],
      };
    }),

    getClientProgressById: publicProcedure
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
            message: "Only coaches can view client progress",
          });
        }

        // Verify the client belongs to this coach and get the userId
        const client = await db.client.findFirst({
          where: {
            id: input.clientId,
            coachId: ensureUserId(user.id),
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          });
        }

        // If client has a userId, fetch progress data, otherwise return empty data
        if (!client.userId) {
          return {
            currentStreak: 0,
            streakPercentage: 0,
            skills: [],
          };
        }

        // Example: Fetch progress data for the specific client
        // Replace with your actual progress logic
        return {
          currentStreak: 5,
          streakPercentage: 80,
          skills: [
            { name: "Speed", progress: 78 },
            { name: "Endurance", progress: 65 },
            { name: "Technique", progress: 82 },
          ],
        };
      }),

    // Enhanced progress tracking procedures
    getProgressData: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          timeRange: z.enum(["4", "6", "8", "all"]).default("4"),
        })
      )
      .query(async ({ input }) => {
        const { clientId, timeRange } = input;

        // Get authenticated user
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Get user from database
        const dbUser = await db.user.findFirst({
          where: { id: user.id },
        });

        if (!dbUser) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Verify coach has access to this client
        const client = await db.client.findFirst({
          where: {
            id: clientId,
            coachId: dbUser.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found or access denied",
          });
        }

        // Calculate date range based on timeRange
        const now = new Date();
        let startDate: Date;

        switch (timeRange) {
          case "4":
            startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);
            break;
          case "6":
            startDate = new Date(now.getTime() - 6 * 7 * 24 * 60 * 60 * 1000);
            break;
          case "8":
            startDate = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
            break;
          case "all":
            startDate = new Date(0);
            break;
          default:
            startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);
        }

        // Get progress data from existing models
        const progressEntries = await db.progress.findMany({
          where: {
            clientId: clientId,
            createdAt: {
              gte: startDate,
            },
          },
          orderBy: { createdAt: "desc" },
        });

        // Get client analytics
        const analytics = await db.clientAnalytics.findMany({
          where: {
            clientId: clientId,
            createdAt: {
              gte: startDate,
            },
          },
          orderBy: { createdAt: "desc" },
        });

        // Get assigned workouts
        const assignedWorkouts = await db.assignedWorkout.findMany({
          where: {
            clientId: clientId,
            createdAt: {
              gte: startDate,
            },
          },
        });

        // Calculate metrics
        const totalWorkouts = assignedWorkouts.length;
        const completedWorkouts = assignedWorkouts.filter(
          w => w.completed
        ).length;
        const completionRate =
          totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

        // Calculate streak (simplified)
        const recentCompletions = progressEntries.filter(
          p => p.progress >= 100
        );
        const streakDays = recentCompletions.length; // Simplified calculation

        return {
          client: {
            currentSpeed: client.averageSpeed || 0,
            speedChange: 0, // Would need historical data to calculate
          },
          metrics: {
            completionRate: Math.round(completionRate),
            streakDays,
            totalWorkouts,
            completedWorkouts,
          },
          progressEntries: progressEntries.slice(0, 10), // Recent entries
          analytics: analytics.slice(0, 5), // Recent analytics
        };
      }),

    getProgressInsights: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          timeRange: z.enum(["4", "6", "8", "all"]).default("4"),
        })
      )
      .query(async ({ input }) => {
        const { clientId, timeRange } = input;

        // Get authenticated user
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Get user from database
        const dbUser = await db.user.findFirst({
          where: { id: user.id },
        });

        if (!dbUser) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Verify access
        const client = await db.client.findFirst({
          where: {
            id: clientId,
            coachId: dbUser.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found or access denied",
          });
        }

        // Get recent progress data - we'll call the logic directly to avoid recursion
        // For now, we'll create a simplified version
        const progressData = {
          client: {
            currentSpeed: client.averageSpeed || 0,
            speedChange: 0, // Simplified for now
          },
          metrics: {
            completionRate: 0, // Simplified for now
            streakDays: 0,
          },
        };

        // Generate insights based on the data
        const insights = [];

        if (progressData.client.speedChange > 0) {
          insights.push({
            type: "positive",
            title: "Speed Improvement",
            description: `Speed has increased by ${progressData.client.speedChange} mph`,
            icon: "trending-up",
          });
        }

        if (progressData.metrics.completionRate > 80) {
          insights.push({
            type: "positive",
            title: "High Completion Rate",
            description: "Client is consistently completing workouts",
            icon: "check-circle",
          });
        }

        if (progressData.metrics.streakDays > 7) {
          insights.push({
            type: "positive",
            title: "Strong Streak",
            description: `${progressData.metrics.streakDays} day workout streak`,
            icon: "flame",
          });
        }

        return {
          insights,
          recommendations: [
            "Focus on speed training this week",
            "Consider adding more challenging workouts",
            "Great job on consistency!",
          ],
        };
      }),

    getWorkoutHistory: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          timeRange: z.enum(["4", "6", "8", "all"]).default("4"),
        })
      )
      .query(async ({ input }) => {
        const { clientId, timeRange } = input;

        // Get authenticated user
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Get user from database
        const dbUser = await db.user.findFirst({
          where: { id: user.id },
        });

        if (!dbUser) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Verify access
        const client = await db.client.findFirst({
          where: {
            id: clientId,
            coachId: dbUser.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found or access denied",
          });
        }

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (timeRange) {
          case "4":
            startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);
            break;
          case "6":
            startDate = new Date(now.getTime() - 6 * 7 * 24 * 60 * 60 * 1000);
            break;
          case "8":
            startDate = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
            break;
          case "all":
            startDate = new Date(0);
            break;
          default:
            startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);
        }

        // Get workout history
        const workoutHistory = await db.assignedWorkout.findMany({
          where: {
            clientId: clientId,
            createdAt: {
              gte: startDate,
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return workoutHistory.map(workout => ({
          id: workout.id,
          title: workout.title,
          completed: workout.completed,
          completedAt: workout.completedAt,
          createdAt: workout.createdAt,
          progress: 0, // AssignedWorkout doesn't have progress field
        }));
      }),

    updateProgress: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          workoutId: z.string(),
          progress: z.number().min(0).max(1000), // Increased max for speed/spin values
          notes: z.string().optional(),
          skill: z.string().optional().default("general"),
          date: z.string().optional(), // ISO date string
        })
      )
      .mutation(async ({ input }) => {
        const { clientId, workoutId, progress, notes, skill, date } = input;

        // Get authenticated user
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Get user from database
        const dbUser = await db.user.findFirst({
          where: { id: user.id },
        });

        if (!dbUser) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Verify access and get client
        const client = await db.client.findFirst({
          where: {
            id: clientId,
            coachId: dbUser.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found or access denied",
          });
        }

        // Check if client has a userId (is registered)
        if (!client.userId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Client must be registered to track progress",
          });
        }

        // Update progress using the client's userId
        const updatedProgress = await db.progress.create({
          data: {
            clientId: client.userId, // Use the client's userId, not the client record ID
            coachId: dbUser.id,
            skill: skill || "general",
            progress,
            date: date ? new Date(date) : new Date(),
          },
        });

        return updatedProgress;
      }),

    getHistoricalData: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          timeRange: z.enum(["4", "6", "8", "all"]).default("4"),
        })
      )
      .query(async ({ input }) => {
        const { clientId, timeRange } = input;

        // Get authenticated user
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Get user from database
        const dbUser = await db.user.findFirst({
          where: { id: user.id },
        });

        if (!dbUser) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Verify access and get client
        const client = await db.client.findFirst({
          where: {
            id: clientId,
            coachId: dbUser.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found or access denied",
          });
        }

        // Check if client has a userId (is registered)
        if (!client.userId) {
          return []; // Return empty array if client is not registered
        }

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (timeRange) {
          case "4":
            startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);
            break;
          case "6":
            startDate = new Date(now.getTime() - 6 * 7 * 24 * 60 * 60 * 1000);
            break;
          case "8":
            startDate = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
            break;
          case "all":
            startDate = new Date(0);
            break;
          default:
            startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);
        }

        // Get historical progress data using the client's userId
        const historicalData = await db.progress.findMany({
          where: {
            clientId: client.userId, // Use the client's userId
            date: {
              gte: startDate,
            },
          },
          orderBy: { date: "asc" },
        });

        return historicalData;
      }),
});
