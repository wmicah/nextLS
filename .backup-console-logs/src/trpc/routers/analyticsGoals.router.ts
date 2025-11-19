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
 * AnalyticsGoals Router
 */
export const analyticsGoalsRouter = router({
    getGoals: publicProcedure.query(async () => {
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
          message: "Only coaches can access analytics goals",
        });
      }

      const settings = await db.userSettings.findUnique({
        where: { userId: user.id },
      });

      // Return default goals if no custom goals are set
      const defaultGoals = {
        activeClients: Math.max(
          5,
          await db.client.count({
            where: { coachId: user.id, archived: false },
          })
        ),
        workoutCompletion: 75,
        programProgress: 70,
        clientRetention: 85,
      };

      return settings?.analyticsGoals
        ? (settings.analyticsGoals as typeof defaultGoals)
        : defaultGoals;
    }),

    updateGoals: publicProcedure
      .input(
        z.object({
          activeClients: z.number().min(1).max(1000),
          workoutCompletion: z.number().min(0).max(100),
          programProgress: z.number().min(0).max(100),
          clientRetention: z.number().min(0).max(100),
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
            message: "Only coaches can update analytics goals",
          });
        }

        const existingSettings = await db.userSettings.findUnique({
          where: { userId: user.id },
        });

        if (existingSettings) {
          await db.userSettings.update({
            where: { userId: user.id },
            data: { analyticsGoals: input },
          });
        } else {
          await db.userSettings.create({
            data: {
              userId: user.id,
              analyticsGoals: input,
            },
          });
        }

        return input;
      }),
});
