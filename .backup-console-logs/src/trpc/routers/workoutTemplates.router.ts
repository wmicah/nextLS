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
 * WorkoutTemplates Router
 */
export const workoutTemplatesRouter = router({
    // Get all workout templates for a coach
    list: publicProcedure.query(async () => {
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
          message: "Only coaches can view workout templates",
        });
      }

      return (await db.workoutTemplate.findMany({
        where: { coachId: user.id },
        orderBy: { createdAt: "desc" },
      })) as any; // or create a specific type
    }),

    // Create a new workout template
    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          exercises: z.array(
            z.object({
              name: z.string(),
              sets: z.number(),
              reps: z.string(),
              weight: z.string().optional(),
              notes: z.string().optional(),
            })
          ),
          duration: z.string().optional(),
          difficulty: z.string().optional(),
          category: z.string().optional(),
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
            message: "Only coaches can create workout templates",
          });
        }

        return await db.workoutTemplate.create({
          data: {
            ...input,
            exercises: input.exercises as any,
            coachId: ensureUserId(user.id),
          },
        });
      }),

    // Copy a workout template to create a new one
    copy: publicProcedure
      .input(z.object({ templateId: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const originalTemplate = await db.workoutTemplate.findFirst({
          where: {
            id: input.templateId,
            coachId: ensureUserId(user.id),
          },
        });

        if (!originalTemplate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        return await db.workoutTemplate.create({
          data: {
            title: `${originalTemplate.title} (Copy)`,
            description: originalTemplate.description,
            exercises: originalTemplate.exercises as any,
            duration: originalTemplate.duration,
            difficulty: originalTemplate.difficulty,
            category: originalTemplate.category,
            coachId: ensureUserId(user.id),
          },
        });
      }),
});
