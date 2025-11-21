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
 * Notifications Router
 */
export const notificationsRouter = router({
    getNotifications: publicProcedure
      .input(
        z.object({
          limit: z.number().optional().default(20),
          unreadOnly: z.boolean().optional().default(false),
        })
      )
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const whereClause: any = { userId: user.id };

        if (input.unreadOnly) {
          whereClause.isRead = false;
        }

        const notifications = await db.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          take: input.limit,
        });

        console.log("🔔 getNotifications query:", {
          userId: user.id,
          unreadOnly: input.unreadOnly,
          limit: input.limit,
          found: notifications.length,
          types: notifications.map((n: any) => n.type),
          titles: notifications.map((n: any) => n.title),
        });

        return notifications;
      }),

    getUnreadCount: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const count = await db.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      });

      return count;
    }),

    markAsRead: publicProcedure
      .input(z.object({ notificationId: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const notification = await db.notification.update({
          where: {
            id: input.notificationId,
            userId: user.id,
          },
          data: { isRead: true },
        });

        return notification;
      }),

    markAllAsRead: publicProcedure.mutation(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      await db.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false,
        },
        data: { isRead: true },
      });

      return { success: true };
    }),

    deleteNotification: publicProcedure
      .input(z.object({ notificationId: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const notification = await db.notification.delete({
          where: {
            id: input.notificationId,
            userId: user.id,
          },
        });

        return { success: true, deletedId: notification.id };
      }),

    deleteMultipleNotifications: publicProcedure
      .input(z.object({ notificationIds: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        await db.notification.deleteMany({
          where: {
            id: { in: input.notificationIds },
            userId: user.id,
          },
        });

        return { success: true, deletedCount: input.notificationIds.length };
      }),

    createNotification: publicProcedure
      .input(
        z.object({
          userId: z.string(),
          type: z.enum([
            "MESSAGE",
            "WORKOUT_ASSIGNED",
            "WORKOUT_COMPLETED",
            "LESSON_SCHEDULED",
            "LESSON_CANCELLED",
            "PROGRAM_ASSIGNED",
            "PROGRESS_UPDATE",
            "CLIENT_JOIN_REQUEST",
            "SYSTEM",
          ]),
          title: z.string(),
          message: z.string(),
          data: z.any().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Verify the current user is a COACH and can create notifications for clients
        const currentUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (currentUser?.role !== "COACH") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can create notifications",
          });
        }

        // Verify the target user exists and is a client of this coach
        const targetUser = await db.user.findUnique({
          where: { id: input.userId },
          select: { role: true },
        });

        if (!targetUser || targetUser.role !== "CLIENT") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Target user not found or is not a client",
          });
        }

        // Check if the client belongs to this coach
        const client = await db.client.findFirst({
          where: {
            userId: input.userId,
            coachId: ensureUserId(user.id),
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only create notifications for your own clients",
          });
        }

        const notification = await db.notification.create({
          data: {
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            data: input.data,
          },
        });

        // Send push notification
        try {
          const { sendGeneralNotification } = await import(
            "@/lib/pushNotificationService"
          );
          await sendGeneralNotification(
            input.userId,
            input.title,
            input.message,
            {
              notificationId: notification.id,
              type: input.type,
              ...input.data,
            }
          );
        } catch (error) {
          console.error("Failed to send push notification:", error);
        }

        return notification;
      }),
});

/**
 * Push Notifications Router
 */
export const pushNotificationsRouter = router({
  getSubscriptions: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: user.id },
    });

    return subscriptions;
  }),
});
