import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";

/**
 * Utils Router
 * Utility procedures for maintenance and cleanup
 */
export const utilsRouter = router({
  // Cleanup old messages from ALL conversations (automatic cleanup)
  cleanupAllOldMessages: publicProcedure.mutation(async () => {
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
        message: "Only coaches can perform cleanup",
      });
    }

    // Get coach settings
    const coachSettings = await db.userSettings.findUnique({
      where: { userId: user.id },
      select: { messageRetentionDays: true },
    });

    if (!coachSettings?.messageRetentionDays) {
      return {
        success: true,
        deletedCount: 0,
        message: "Message retention not configured",
      };
    }

    // Calculate retention threshold
    const retentionThreshold = new Date();
    retentionThreshold.setDate(
      retentionThreshold.getDate() - coachSettings.messageRetentionDays
    );

    // Find ALL conversations for this coach (not just archived clients)
    const conversations = await db.conversation.findMany({
      where: {
        coachId: user.id,
      },
      select: { id: true },
    });

    if (conversations.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        message: "No conversations found",
      };
    }

    // Delete old messages from ALL conversations
    const result = await db.message.deleteMany({
      where: {
        conversationId: {
          in: conversations.map(c => c.id),
        },
        createdAt: {
          lt: retentionThreshold,
        },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} old messages`,
    };
  }),

  // Cleanup old messages from archived clients (legacy - for manual cleanup)
  cleanupArchivedMessages: publicProcedure.mutation(async () => {
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
        message: "Only coaches can perform cleanup",
      });
    }

    // Get coach settings
    const coachSettings = await db.userSettings.findUnique({
      where: { userId: user.id },
      select: { messageRetentionDays: true },
    });

    if (!coachSettings?.messageRetentionDays) {
      return {
        success: true,
        deletedCount: 0,
        message: "Message retention not configured",
      };
    }

    // Calculate retention threshold
    const retentionThreshold = new Date();
    retentionThreshold.setDate(
      retentionThreshold.getDate() - coachSettings.messageRetentionDays
    );

    // Find archived clients for this coach
    const archivedClients = await db.client.findMany({
      where: {
        coachId: user.id,
        archived: true,
      },
      select: { userId: true },
    });

    const archivedClientUserIds = archivedClients
      .filter(c => c.userId)
      .map(c => c.userId!);

    if (archivedClientUserIds.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        message: "No archived clients found",
      };
    }

    // Find conversations with archived clients
    const conversations = await db.conversation.findMany({
      where: {
        coachId: user.id,
        clientId: {
          in: archivedClientUserIds,
        },
      },
      select: { id: true },
    });

    if (conversations.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        message: "No conversations with archived clients",
      };
    }

    // Delete old messages from these conversations
    const result = await db.message.deleteMany({
      where: {
        conversationId: {
          in: conversations.map(c => c.id),
        },
        createdAt: {
          lt: retentionThreshold,
        },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} old messages`,
    };
  }),
});
