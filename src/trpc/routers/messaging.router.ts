import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import { ensureUserId } from "./_helpers";
import { CompleteEmailService } from "@/lib/complete-email-service";

/**
 * Messaging Router
 * Handles conversations and messaging between users
 */
export const messagingRouter = router({
  getConversations: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { coachId: user.id },
          { clientId: user.id },
          { client1Id: user.id },
          { client2Id: user.id },
        ],
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
            settings: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            settings: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        client1: {
          select: {
            id: true,
            name: true,
            email: true,
            settings: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        client2: {
          select: {
            id: true,
            name: true,
            email: true,
            settings: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    return conversations;
  }),

  getConversationUnreadCounts: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const unreadCounts = await db.message.groupBy({
      by: ["conversationId"],
      where: {
        isRead: false,
        senderId: { not: user.id },
        conversation: {
          OR: [
            { coachId: ensureUserId(user.id) },
            { clientId: ensureUserId(user.id) },
            { client1Id: ensureUserId(user.id) },
            { client2Id: ensureUserId(user.id) },
          ],
        },
      },
      _count: {
        id: true,
      },
    });

    const countsObj: Record<string, number> = {};
    unreadCounts.forEach(item => {
      countsObj[item.conversationId] = item._count.id;
    });

    return countsObj;
  }),

  getMessages: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const conversation = await db.conversation.findFirst({
        where: {
          id: input.conversationId,
          OR: [
            { coachId: ensureUserId(user.id) },
            { clientId: ensureUserId(user.id) },
            { client1Id: ensureUserId(user.id) },
            { client2Id: ensureUserId(user.id) },
          ],
        },
      });

      if (!conversation) throw new TRPCError({ code: "FORBIDDEN" });

      const messages = await db.message.findMany({
        where: { conversationId: input.conversationId },
        include: {
          sender: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      await db.message.updateMany({
        where: {
          conversationId: input.conversationId,
          senderId: { not: ensureUserId(user.id) },
          isRead: false,
        },
        data: { isRead: true },
      });

      return messages;
    }),

  sendMessage: publicProcedure
    .input(
      z
        .object({
          conversationId: z.string(),
          content: z.string().max(1000),
          attachmentUrl: z.string().optional(),
          attachmentType: z.string().optional(),
          attachmentName: z.string().optional(),
          attachmentSize: z.number().optional(),
        })
        .refine(
          data => {
            return data.content.length > 0 || data.attachmentUrl;
          },
          {
            message:
              "Message must contain either text content or a file attachment",
            path: ["content"],
          }
        )
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const conversation = await db.conversation.findFirst({
        where: {
          id: input.conversationId,
          OR: [
            { coachId: ensureUserId(user.id) },
            { clientId: ensureUserId(user.id) },
            { client1Id: ensureUserId(user.id) },
            { client2Id: ensureUserId(user.id) },
          ],
        },
      });

      if (!conversation) throw new TRPCError({ code: "FORBIDDEN" });

      const message = await db.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: user.id,
          content: input.content,
          attachmentUrl: input.attachmentUrl,
          attachmentType: input.attachmentType,
          attachmentName: input.attachmentName,
          attachmentSize: input.attachmentSize,
        },
        include: {
          sender: { select: { id: true, name: true, email: true } },
        },
      });

      await db.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() },
      });

      // Trigger SSE updates
      try {
        const { sendToUser } = await import("@/app/api/sse/messages/route");
        const { sendMessageNotification } = await import(
          "@/lib/pushNotificationService"
        );

        const recipientId =
          conversation.coachId === user.id
            ? conversation.clientId
            : conversation.coachId;

        if (recipientId) {
          // Get recipient information for email notification
          const recipient = await db.user.findFirst({
            where: { id: recipientId },
            select: { name: true, email: true },
          });
          sendToUser(recipientId, {
            type: "new_message",
            data: {
              message,
              conversationId: input.conversationId,
            },
          });

          await sendMessageNotification(
            recipientId,
            message.sender.name || message.sender.email,
            input.content,
            input.conversationId
          );

          // Send email notification for new messages
          if (recipient?.email) {
            try {
              const emailService = CompleteEmailService.getInstance();
              await emailService.sendNewMessage(
                recipient.email,
                recipient.name || "User",
                message.sender.name || message.sender.email,
                input.content.length > 100
                  ? input.content.substring(0, 100) + "..."
                  : input.content
              );
              console.log(`📧 New message email sent to ${recipient.email}`);
            } catch (error) {
              console.error(
                `Failed to send new message email to ${recipient.email}:`,
                error
              );
            }
          }

          const unreadCount = await db.message.count({
            where: {
              conversation: {
                OR: [{ clientId: recipientId }, { coachId: recipientId }],
              },
              isRead: false,
              senderId: { not: recipientId },
            },
          });

          sendToUser(recipientId, {
            type: "unread_count",
            data: { count: unreadCount },
          });
        }
      } catch (error) {
        console.error("Error sending SSE update:", error);
      }

      return message;
    }),

  createConversation: publicProcedure
    .input(
      z.object({
        otherUserId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const currentUser = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      const otherUser = await db.user.findUnique({
        where: { id: input.otherUserId },
        select: { role: true },
      });

      if (!currentUser?.role || !otherUser?.role) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid users",
        });
      }

      let coachId: string, clientId: string;

      if (currentUser.role === "COACH" && otherUser.role === "CLIENT") {
        coachId = user.id;
        clientId = input.otherUserId;
      } else if (currentUser.role === "CLIENT" && otherUser.role === "COACH") {
        coachId = input.otherUserId;
        clientId = user.id;
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only create conversations between coach and client",
        });
      }

      const existingConversation = await db.conversation.findFirst({
        where: {
          coachId,
          clientId,
        },
      });

      if (existingConversation) {
        return existingConversation;
      }

      const conversation = await db.conversation.create({
        data: { coachId, clientId },
        include: {
          coach: { select: { id: true, name: true, email: true } },
          client: { select: { id: true, name: true, email: true } },
        },
      });

      return conversation;
    }),

  createConversationWithClient: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const currentUser = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      if (currentUser?.role !== "COACH") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can create conversations with clients",
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

      const client = await db.client.findFirst({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          userId: true,
          coachId: true,
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found or not accessible",
        });
      }

      let clientUserId: string;

      if (!client.userId) {
        const newClientUser = await db.user.create({
          data: {
            email: client.email || `client-${client.id}@placeholder.com`,
            name: client.name,
            role: "CLIENT",
          },
        });

        await db.client.update({
          where: { id: client.id },
          data: { userId: newClientUser.id },
        });

        clientUserId = newClientUser.id;
      } else {
        clientUserId = client.userId;
      }

      const existingConversation = await db.conversation.findFirst({
        where: {
          coachId: ensureUserId(user.id),
          clientId: clientUserId,
        },
      });

      if (existingConversation) {
        return existingConversation;
      }

      const conversation = await db.conversation.create({
        data: {
          coachId: ensureUserId(user.id),
          clientId: clientUserId,
        },
        include: {
          coach: { select: { id: true, name: true, email: true } },
          client: { select: { id: true, name: true, email: true } },
        },
      });

      return conversation;
    }),

  getConversation: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const conversation = await db.conversation.findFirst({
        where: {
          id: input.conversationId,
          OR: [{ coachId: user.id }, { clientId: user.id }],
        },
        include: {
          coach: { select: { id: true, name: true, email: true } },
          client: { select: { id: true, name: true, email: true } },
        },
      });

      if (!conversation) throw new TRPCError({ code: "FORBIDDEN" });

      return conversation;
    }),

  markAsRead: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const conversation = await db.conversation.findFirst({
        where: {
          id: input.conversationId,
          OR: [{ coachId: user.id }, { clientId: user.id }],
        },
      });

      if (!conversation) throw new TRPCError({ code: "FORBIDDEN" });

      await db.message.updateMany({
        where: {
          conversationId: input.conversationId,
          senderId: { not: ensureUserId(user.id) },
          isRead: false,
        },
        data: { isRead: true },
      });

      return { success: true };
    }),

  deleteConversation: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const conversation = await db.conversation.findFirst({
        where: {
          id: input.conversationId,
          OR: [{ coachId: user.id }, { clientId: user.id }],
        },
      });

      if (!conversation) throw new TRPCError({ code: "FORBIDDEN" });

      await db.conversation.delete({
        where: { id: input.conversationId },
      });

      return { success: true };
    }),

  getUnreadCount: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const unreadCount = await db.message.count({
      where: {
        isRead: false,
        senderId: { not: user.id },
        conversation: {
          OR: [
            { coachId: ensureUserId(user.id) },
            { clientId: ensureUserId(user.id) },
            { client1Id: ensureUserId(user.id) },
            { client2Id: ensureUserId(user.id) },
          ],
        },
      },
    });

    return unreadCount;
  }),

  acknowledgeMessage: publicProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const message = await db.message.findUnique({
        where: { id: input.messageId },
        include: { conversation: true },
      });

      if (!message) throw new TRPCError({ code: "NOT_FOUND" });

      const conversation = message.conversation;
      const hasAccess =
        conversation.coachId === user.id ||
        conversation.clientId === user.id ||
        conversation.client1Id === user.id ||
        conversation.client2Id === user.id;

      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

      const updatedMessage = await db.message.update({
        where: { id: input.messageId },
        data: {
          isAcknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: user.id,
        },
      });

      return updatedMessage;
    }),
});
