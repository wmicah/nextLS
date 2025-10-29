import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";

export const exerciseCompletionRouter = router({
  // Mark an exercise as complete/incomplete
      markExerciseComplete: publicProcedure
        .input(
          z.object({
            exerciseId: z.string(),
            programDrillId: z.string().optional(),
            completed: z.boolean(),
            date: z.string().optional(), // Date in YYYY-MM-DD format
          })
        )
    .mutation(async ({ input, ctx }) => {
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

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Upsert the exercise completion
      const completion = await db.exerciseCompletion.upsert({
        where: {
          clientId_exerciseId_programDrillId_date: {
            clientId: client.id,
            exerciseId: input.exerciseId,
            programDrillId: input.programDrillId || null,
            date: input.date || null,
          },
        },
        update: {
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
        },
        create: {
          clientId: client.id,
          exerciseId: input.exerciseId,
          programDrillId: input.programDrillId || null,
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
          date: input.date || null,
        },
      });

      return completion;
    }),

  // Get all exercise completions for a client
  getExerciseCompletions: publicProcedure.query(async ({ ctx }) => {
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

    // Get client record
    const client = await db.client.findFirst({
      where: { userId: user.id },
    });

    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    // Get all exercise completions for this client
    const completions = await db.exerciseCompletion.findMany({
      where: { clientId: client.id },
    });

    return completions;
  }),

  // Get completion status for specific exercises
  getExerciseCompletionStatus: publicProcedure
    .input(
      z.object({
        exerciseIds: z.array(z.string()),
        programDrillId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
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

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get completion status for specific exercises
      const completions = await db.exerciseCompletion.findMany({
        where: {
          clientId: client.id,
          exerciseId: { in: input.exerciseIds },
          programDrillId: input.programDrillId || null,
        },
      });

      // Return a map of exerciseId -> completion status
      const statusMap: Record<string, boolean> = {};
      completions.forEach(completion => {
        statusMap[completion.exerciseId] = completion.completed;
      });

      return statusMap;
    }),
});
