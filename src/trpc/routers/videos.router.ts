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
 * Videos Router
 */
export const videosRouter = router({
    list: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const videos = await db.video.findMany({
        where: {
          OR: [
            { uploadedBy: user.id },
            {
              clientId: {
                in: await db.client
                  .findMany({ where: { coachId: user.id } })
                  .then(clients => clients.map(c => c.id)),
              },
            },
          ],
        },
        include: {
          uploader: { select: { name: true, email: true } },
          client: { select: { name: true, email: true } },
          feedback: { include: { coach: { select: { name: true } } } },
          annotations: { include: { coach: { select: { name: true } } } },
          audioNotes: { include: { coach: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      return videos;
    }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const video = await db.video.findFirst({
          where: {
            id: input.id,
            OR: [
              { uploadedBy: user.id },
              {
                clientId: {
                  in: await db.client
                    .findMany({ where: { coachId: user.id } })
                    .then(clients => clients.map(c => c.id)),
                },
              },
            ],
          },
          include: {
            uploader: { select: { name: true, email: true } },
            client: { select: { name: true, email: true } },
            feedback: { include: { coach: { select: { name: true } } } },
            annotations: { include: { coach: { select: { name: true } } } },
            audioNotes: { include: { coach: { select: { name: true } } } },
          },
        });

        if (!video) throw new TRPCError({ code: "NOT_FOUND" });

        return video;
      }),

    create: publicProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          url: z.string(),
          thumbnail: z.string().optional(),
          duration: z.number().optional(),
          fileSize: z.number().optional(),
          clientId: z.string().optional(),
          category: z
            .enum([
              "BULLPEN",
              "PRACTICE",
              "GAME_FOOTAGE",
              "REFERENCE",
              "COMPARISON",
              "OTHER",
            ])
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const video = await db.video.create({
          data: {
            ...input,
            uploadedBy: user.id,
          },
          include: {
            uploader: { select: { name: true, email: true } },
            client: { select: { name: true, email: true } },
          },
        });

        return video;
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(["PENDING_REVIEW", "REVIEWED", "ARCHIVED"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const video = await db.video.update({
          where: { id: input.id },
          data: input,
          include: {
            uploader: { select: { name: true, email: true } },
            client: { select: { name: true, email: true } },
          },
        });

        return video;
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        await db.video.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),

    // Video Annotations
    createAnnotation: publicProcedure
      .input(
        z.object({
          videoId: z.string(),
          type: z.enum([
            "PEN",
            "HIGHLIGHT",
            "ARROW",
            "CIRCLE",
            "TEXT",
            "ERASE",
          ]),
          data: z.any(),
          timestamp: z.number(),
          duration: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const annotation = await db.videoAnnotation.create({
          data: {
            ...input,
            coachId: ensureUserId(user.id),
          },
          include: {
            coach: { select: { name: true } },
          },
        });

        return annotation;
      }),

    deleteAnnotation: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Get user from database to check role
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found in database",
          });
        }

        // Check if user is a coach
        if (dbUser.role !== "COACH") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can delete annotations",
          });
        }

        // Check if annotation exists and belongs to this coach
        const annotation = await db.videoAnnotation.findUnique({
          where: { id: input.id },
          select: { coachId: true },
        });

        if (!annotation) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (annotation.coachId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own annotations",
          });
        }

        await db.videoAnnotation.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),

    // Video Audio Notes
    createAudioNote: publicProcedure
      .input(
        z.object({
          videoId: z.string(),
          url: z.string(),
          duration: z.number(),
          timestamp: z.number(),
          title: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const audioNote = await db.videoAudioNote.create({
          data: {
            ...input,
            coachId: ensureUserId(user.id),
          },
          include: {
            coach: { select: { name: true } },
          },
        });

        return audioNote;
      }),

    deleteAudioNote: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        await db.videoAudioNote.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),

    // Video Feedback
    createFeedback: publicProcedure
      .input(
        z.object({
          videoId: z.string(),
          feedback: z.string(),
          rating: z.number().min(1).max(5).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const feedback = await db.videoFeedback.create({
          data: {
            ...input,
            coachId: ensureUserId(user.id),
          },
          include: {
            coach: { select: { name: true } },
          },
        });

        return feedback;
      }),

    updateFeedback: publicProcedure
      .input(
        z.object({
          id: z.string(),
          feedback: z.string().optional(),
          rating: z.number().min(1).max(5).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const feedback = await db.videoFeedback.update({
          where: { id: input.id },
          data: input,
          include: {
            coach: { select: { name: true } },
          },
        });

        return feedback;
      }),

    deleteFeedback: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Get user from database to check role
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found in database",
          });
        }

        // Check if user is a coach
        if (dbUser.role !== "COACH") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can delete feedback",
          });
        }

        // Check if feedback exists and belongs to this coach
        const feedback = await db.videoFeedback.findUnique({
          where: { id: input.id },
          select: { coachId: true },
        });

        if (!feedback) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (feedback.coachId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own feedback",
          });
        }

        await db.videoFeedback.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),

    // Get annotations for a video
    getAnnotations: publicProcedure
      .input(z.object({ videoId: z.string() }))
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const annotations = await db.videoAnnotation.findMany({
          where: { videoId: input.videoId },
          include: {
            coach: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        return annotations;
      }),

    // Screen Recording procedures
    createScreenRecording: publicProcedure
      .input(
        z.object({
          videoId: z.string(),
          title: z.string(),
          description: z.string().optional(),
          videoUrl: z.string(),
          audioUrl: z.string(),
          duration: z.number(),
          maxDuration: z.number().default(300), // 5 minutes default
          annotations: z.any().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Get user from database to check role
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found in database",
          });
        }

        // Check if user is a coach
        if (dbUser.role !== "COACH") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can create screen recordings",
          });
        }

        // Validate duration limit
        if (input.duration > input.maxDuration) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Recording duration (${input.duration}s) exceeds maximum allowed duration (${input.maxDuration}s)`,
          });
        }

        const screenRecording = await db.screenRecording.create({
          data: {
            ...input,
            coachId: ensureUserId(user.id),
          },
          include: {
            coach: { select: { name: true } },
            video: { select: { title: true } },
          },
        });

        return screenRecording;
      }),

    getScreenRecordings: publicProcedure
      .input(z.object({ videoId: z.string() }))
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const screenRecordings = await db.screenRecording.findMany({
          where: { videoId: input.videoId },
          include: {
            coach: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        return screenRecordings;
      }),

    deleteScreenRecording: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Get user from database to check role
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found in database",
          });
        }

        // Check if user is a coach
        if (dbUser.role !== "COACH") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can delete screen recordings",
          });
        }

        // Check if recording exists and belongs to this coach
        const recording = await db.screenRecording.findUnique({
          where: { id: input.id },
          select: { coachId: true },
        });

        if (!recording) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (recording.coachId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own screen recordings",
          });
        }

        await db.screenRecording.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),
});
