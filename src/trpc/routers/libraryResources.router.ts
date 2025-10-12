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
 * LibraryResources Router
 */
export const libraryResourcesRouter = router({
    getAll: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get all library resources for the coach
      const resources = await db.libraryResource.findMany({
        where: {
          coachId: ensureUserId(user.id),
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return resources;
    }),

    getCategories: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get unique categories with counts
      const categories = await db.libraryResource.groupBy({
        by: ["category"],
        where: {
          coachId: ensureUserId(user.id),
        },
        _count: {
          category: true,
        },
      });

      return categories.map(cat => ({
        name: cat.category,
        count: cat._count.category,
      }));
    }),
});
