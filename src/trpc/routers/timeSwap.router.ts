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
 * TimeSwap Router
 */
export const timeSwapRouter = router({
  // Get all clients for the current client to request swaps with
  getAvailableClients: publicProcedure.query(async () => {
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

    // Get current client
    const currentClient = await db.client.findFirst({
      where: { userId: user.id },
      include: {
        coach: {
          include: {
            coachOrganizations: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!currentClient) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    // Check if coach is in an organization
    const coachOrganization = currentClient.coach?.coachOrganizations?.[0];

    let otherClients;

    if (coachOrganization) {
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

      // Get all clients from ALL coaches in the organization
      otherClients = await db.client.findMany({
        where: {
          coachId: { in: orgCoachIds },
          id: { not: currentClient.id },
          archived: false,
        },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });
    } else {
      // Fallback: Get all other clients under the same coach (original behavior)
      otherClients = await db.client.findMany({
        where: {
          coachId: currentClient.coachId,
          id: { not: currentClient.id },
          archived: false,
        },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });
    }

    return otherClients;
  }),

  // Get upcoming events for a specific client
  getClientEvents: publicProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input }) => {
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

      // Get current client
      const currentClient = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!currentClient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Verify the target client is under the same coach
      const targetClient = await db.client.findFirst({
        where: {
          id: input.clientId,
          coachId: currentClient.coachId,
        },
      });

      if (!targetClient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target client not found or not under same coach",
        });
      }

      const now = new Date();
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(now.getDate() + 7);

      // Get upcoming events for the target client
      const events = await db.event.findMany({
        where: {
          clientId: input.clientId,
          date: {
            gte: now.toISOString(),
            lte: oneWeekFromNow.toISOString(),
          },
          status: "CONFIRMED",
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      return events;
    }),

  // Create a swap request from calendar lesson click
  createSwapRequestFromLesson: publicProcedure
    .input(
      z.object({
        targetEventId: z.string(), // The event the current client wants to swap with
        requesterEventId: z.string(), // The current client's event
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
          message: "Only clients can access this endpoint",
        });
      }

      // Get current client
      const currentClient = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!currentClient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get the target event and its client
      const targetEvent = await db.event.findFirst({
        where: {
          id: input.targetEventId,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              userId: true,
            },
          },
        },
      });

      if (!targetEvent || !targetEvent.client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target event or client not found",
        });
      }

      // Get the requester's event
      const requesterEvent = await db.event.findFirst({
        where: {
          id: input.requesterEventId,
          clientId: currentClient.id,
        },
      });

      if (!requesterEvent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Your event not found",
        });
      }

      // Prevent clients from swapping with themselves
      if (targetEvent.client.id === currentClient.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot swap with your own lesson",
        });
      }

      // CRITICAL VALIDATION: Both lessons must be with the SAME coach
      if (requesterEvent.coachId !== targetEvent.coachId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You can only swap lessons with the same coach. The lessons you're trying to swap are with different coaches.",
        });
      }

      // Check if a swap request already exists (either direction)
      const existingRequest = await db.timeSwapRequest.findFirst({
        where: {
          OR: [
            // Same request already exists
            {
              requesterId: currentClient.id,
              targetId: targetEvent.client.id,
              requesterEventId: input.requesterEventId,
              targetEventId: input.targetEventId,
              status: "PENDING",
            },
            // Reverse request already exists (target already requested from requester)
            {
              requesterId: targetEvent.client.id,
              targetId: currentClient.id,
              requesterEventId: input.targetEventId,
              targetEventId: input.requesterEventId,
              status: "PENDING",
            },
          ],
        },
      });

      if (existingRequest) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "A swap request already exists between these clients for these lessons",
        });
      }

      // Create the swap request
      const swapRequest = await db.timeSwapRequest.create({
        data: {
          requesterId: currentClient.id,
          targetId: targetEvent.client.id,
          requesterEventId: input.requesterEventId,
          targetEventId: input.targetEventId,
          message: "Hey, could we switch times this week?",
        },
      });

      // Send a message to the target client
      if (targetEvent.client.userId) {
        // Find or create conversation between clients
        let conversation = await db.conversation.findFirst({
          where: {
            OR: [
              {
                client1Id: currentClient.userId,
                client2Id: targetEvent.client.userId,
              },
              {
                client1Id: targetEvent.client.userId,
                client2Id: currentClient.userId,
              },
            ],
            type: "CLIENT_CLIENT",
          },
        });

        if (!conversation) {
          conversation = await db.conversation.create({
            data: {
              type: "CLIENT_CLIENT",
              client1Id: currentClient.userId,
              client2Id: targetEvent.client.userId || "",
            },
          });
          console.log("🔄 New conversation created:", {
            conversationId: conversation.id,
            client1Id: currentClient.userId,
            client2Id: targetEvent.client.userId,
            currentClientName: "Another Client",
            targetClientName: "Another Client",
          });
        } else {
          console.log("🔄 Existing conversation found:", {
            conversationId: conversation.id,
            client1Id: currentClient.userId,
            client2Id: targetEvent.client.userId,
            currentClientName: "Another Client",
            targetClientName: "Another Client",
          });
        }

        // Send the swap request message
        const message = await db.message.create({
          data: {
            conversationId: conversation.id,
            senderId: currentClient.userId || "",
            content: `Hey, could we switch times this week? I'd like to swap my lesson on ${new Date(
              requesterEvent.date
            ).toLocaleDateString()} at ${new Date(
              requesterEvent.date
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} for your lesson on ${new Date(
              targetEvent.date
            ).toLocaleDateString()} at ${new Date(
              targetEvent.date
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}.`,
            requiresAcknowledgment: true,
            data: {
              type: "SWAP_REQUEST",
              swapRequestId: swapRequest.id,
              requesterEventId: input.requesterEventId,
              targetEventId: input.targetEventId,
              requesterName: "Another Client",
              requesterEventTitle: requesterEvent.title,
              targetEventTitle: targetEvent.title,
              requesterEventDate: requesterEvent.date,
              targetEventDate: targetEvent.date,
            },
          },
        });

        console.log("💬 Swap request message created:", {
          messageId: message.id,
          conversationId: conversation.id,
          senderId: currentClient.userId,
          targetUserId: targetEvent.client.userId,
          swapRequestId: swapRequest.id,
        });

        // Create notification for the target client
        await db.notification.create({
          data: {
            userId: targetEvent.client.userId || "",
            type: "MESSAGE",
            title: "New Swap Request",
            message: `You have a new time swap request from another client`,
            data: {
              conversationId: conversation.id,
              messageId: message.id,
              swapRequestId: swapRequest.id,
            },
          },
        });

        console.log("Swap request notification created for target client");

        // Send real-time update via SSE
        try {
          const { sendToUser } = await import("@/app/api/sse/messages/route");
          const { sendMessageNotification } = await import(
            "@/lib/pushNotificationService"
          );

          if (targetEvent.client.userId) {
            // Send new message notification to target client
            sendToUser(targetEvent.client.userId, {
              type: "new_message",
              data: {
                message,
                conversationId: conversation.id,
              },
            });

            // Send push notification
            await sendMessageNotification(
              targetEvent.client.userId,
              "Another Client",
              message.content,
              conversation.id
            );

            // Update unread count for target client
            const unreadCount = await db.message.count({
              where: {
                conversation: {
                  OR: [
                    { clientId: targetEvent.client.userId },
                    { client1Id: targetEvent.client.userId },
                    { client2Id: targetEvent.client.userId },
                  ],
                },
                isRead: false,
                senderId: { not: targetEvent.client.userId },
              },
            });

            sendToUser(targetEvent.client.userId, {
              type: "unread_count",
              data: { count: unreadCount },
            });

            console.log("Real-time updates sent to target client");
          }
        } catch (error) {
          console.error("Error sending real-time updates:", error);
          // Don't fail the swap request if SSE fails
        }
      }

      return {
        swapRequest,
        message: "Swap request sent successfully",
      };
    }),

  // Get swap request status
  getSwapRequestStatus: publicProcedure
    .input(
      z.object({
        swapRequestId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const swapRequest = await db.timeSwapRequest.findUnique({
        where: { id: input.swapRequestId },
        select: { status: true },
      });

      if (!swapRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Swap request not found",
        });
      }

      return { status: swapRequest.status };
    }),

  // Cancel a swap request
  cancelSwapRequest: publicProcedure
    .input(
      z.object({
        swapRequestId: z.string(),
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
          message: "Only clients can access this endpoint",
        });
      }

      // Get current client
      const currentClient = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!currentClient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get the swap request
      const swapRequest = await db.timeSwapRequest.findFirst({
        where: {
          id: input.swapRequestId,
          requesterId: currentClient.id,
          status: "PENDING",
        },
        include: {
          target: {
            select: {
              id: true,
              userId: true,
              name: true,
            },
          },
          requesterEvent: {
            select: {
              id: true,
              title: true,
              date: true,
            },
          },
          targetEvent: {
            select: {
              id: true,
              title: true,
              date: true,
            },
          },
        },
      });

      if (!swapRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Swap request not found or already processed",
        });
      }

      // Update the swap request status to EXPIRED (we'll use this as cancelled)
      const updatedSwapRequest = await db.timeSwapRequest.update({
        where: { id: input.swapRequestId },
        data: { status: "EXPIRED" },
      });

      // Send cancellation message to the target client
      if (swapRequest.target.userId) {
        // Find the conversation between the two clients
        const conversation = await db.conversation.findFirst({
          where: {
            OR: [
              {
                client1Id: currentClient.userId,
                client2Id: swapRequest.target.userId,
              },
              {
                client1Id: swapRequest.target.userId,
                client2Id: currentClient.userId,
              },
            ],
            type: "CLIENT_CLIENT",
          },
        });

        if (conversation) {
          // Send cancellation message
          await db.message.create({
            data: {
              conversationId: conversation.id,
              senderId: currentClient.userId || "",
              content: `Switch request cancelled. Another client has cancelled their request to switch lessons.`,
              requiresAcknowledgment: false,
              data: {
                type: "SWAP_CANCELLATION",
                swapRequestId: swapRequest.id,
                cancelledBy: "Another Client",
              },
            },
          });
        }
      }

      return {
        swapRequest: updatedSwapRequest,
        message: "Swap request cancelled successfully",
      };
    }),

  // Get swap requests for the current client
  getSwapRequests: publicProcedure.query(async () => {
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

    // Get current client
    const currentClient = await db.client.findFirst({
      where: { userId: user.id },
    });

    if (!currentClient) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    // Get both sent and received swap requests
    const [sentRequests, receivedRequests] = await Promise.all([
      db.timeSwapRequest.findMany({
        where: {
          requesterId: currentClient.id,
          status: "PENDING",
        },
        include: {
          target: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          requesterEvent: {
            select: {
              id: true,
              title: true,
              date: true,
              description: true,
            },
          },
          targetEvent: {
            select: {
              id: true,
              title: true,
              date: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.timeSwapRequest.findMany({
        where: {
          targetId: currentClient.id,
          status: "PENDING",
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          requesterEvent: {
            select: {
              id: true,
              title: true,
              date: true,
              description: true,
            },
          },
          targetEvent: {
            select: {
              id: true,
              title: true,
              date: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return {
      sent: sentRequests,
      received: receivedRequests,
    };
  }),

  // Approve a swap request
  approveSwapRequest: publicProcedure
    .input(z.object({ requestId: z.string() }))
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
          message: "Only clients can access this endpoint",
        });
      }

      // Get current client
      const currentClient = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!currentClient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get the swap request
      const swapRequest = await db.timeSwapRequest.findFirst({
        where: {
          id: input.requestId,
          targetId: currentClient.id,
          status: "PENDING",
        },
        include: {
          requester: true,
          requesterEvent: true,
          targetEvent: true,
        },
      });

      if (!swapRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Swap request not found or already processed",
        });
      }

      // Use a transaction to ensure atomicity
      const result = await db.$transaction(async tx => {
        // Update the swap request status
        const updatedRequest = await tx.timeSwapRequest.update({
          where: { id: input.requestId },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
          },
        });

        // Swap the events
        await tx.event.update({
          where: { id: swapRequest.requesterEventId },
          data: { clientId: swapRequest.targetId },
        });

        await tx.event.update({
          where: { id: swapRequest.targetEventId },
          data: { clientId: swapRequest.requesterId },
        });

        // Create notification for the coach
        await tx.notification.create({
          data: {
            userId: swapRequest.requesterEvent.coachId,
            type: "SCHEDULE_REQUEST",
            title: "Time Swap Approved",
            message: `Two clients have switched their lesson times.`,
            data: {
              swapRequestId: input.requestId,
              requesterName: swapRequest.requester.name,
              targetName: currentClient.name,
              requesterEventTitle: swapRequest.requesterEvent.title,
              targetEventTitle: swapRequest.targetEvent.title,
            },
          },
        });

        return updatedRequest;
      });

      return result;
    }),

  // Decline a swap request
  declineSwapRequest: publicProcedure
    .input(z.object({ requestId: z.string() }))
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
          message: "Only clients can access this endpoint",
        });
      }

      // Get current client
      const currentClient = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!currentClient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Update the swap request status
      const updatedRequest = await db.timeSwapRequest.update({
        where: {
          id: input.requestId,
          targetId: currentClient.id,
          status: "PENDING",
        },
        data: {
          status: "DECLINED",
        },
      });

      if (!updatedRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Swap request not found or already processed",
        });
      }

      return updatedRequest;
    }),

  // Handle swap response from message
  respondToSwapRequest: publicProcedure
    .input(
      z.object({
        swapRequestId: z.string(),
        response: z.enum(["APPROVED", "DECLINED"]),
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
          message: "Only clients can access this endpoint",
        });
      }

      // Get current client
      const currentClient = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!currentClient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get the swap request
      const swapRequest = await db.timeSwapRequest.findFirst({
        where: {
          id: input.swapRequestId,
          targetId: currentClient.id,
          status: "PENDING",
        },
        include: {
          requester: true,
          requesterEvent: true,
          targetEvent: true,
        },
      });

      if (!swapRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Swap request not found or already processed",
        });
      }

      if (input.response === "APPROVED") {
        // Use a transaction to ensure atomicity
        const result = await db.$transaction(async tx => {
          // Update the swap request status
          const updatedRequest = await tx.timeSwapRequest.update({
            where: { id: input.swapRequestId },
            data: {
              status: "APPROVED",
              approvedAt: new Date(),
            },
          });

          // Swap the events
          await tx.event.update({
            where: { id: swapRequest.requesterEventId },
            data: { clientId: swapRequest.targetId },
          });

          await tx.event.update({
            where: { id: swapRequest.targetEventId },
            data: { clientId: swapRequest.requesterId },
          });

          // Create notification for the coach
          await tx.notification.create({
            data: {
              userId: swapRequest.requesterEvent.coachId,
              type: "SCHEDULE_REQUEST",
              title: "Time Swap Approved",
              message: `Two clients have switched their lesson times.`,
              data: {
                swapRequestId: input.swapRequestId,
                requesterName: "Another Client",
                targetName: "Another Client",
                requesterEventTitle: swapRequest.requesterEvent.title,
                targetEventTitle: swapRequest.targetEvent.title,
              },
            },
          });

          // Send automatic message to the requester about approval
          if (swapRequest.requester.userId) {
            // Find the conversation between the two clients
            const conversation = await tx.conversation.findFirst({
              where: {
                OR: [
                  {
                    client1Id: currentClient.userId,
                    client2Id: swapRequest.requester.userId,
                  },
                  {
                    client1Id: swapRequest.requester.userId,
                    client2Id: currentClient.userId,
                  },
                ],
                type: "CLIENT_CLIENT",
              },
            });

            if (conversation) {
              await tx.message.create({
                data: {
                  conversationId: conversation.id,
                  senderId: currentClient.userId || "",
                  content: `Great! I've approved your swap request. Our lessons have been automatically swapped.`,
                  data: {
                    type: "SWAP_APPROVAL",
                    swapRequestId: input.swapRequestId,
                    requesterName: swapRequest.requester.name,
                    targetName: currentClient.name,
                  },
                },
              });
            }
          }

          return updatedRequest;
        });

        return {
          success: true,
          message: "Time swap approved and completed!",
          swapRequest: result,
        };
      } else {
        // Decline the swap request
        const updatedRequest = await db.timeSwapRequest.update({
          where: { id: input.swapRequestId },
          data: {
            status: "DECLINED",
          },
        });

        // Send automatic message to the requester about decline
        if (swapRequest.requester.userId) {
          // Find the conversation between the two clients
          const conversation = await db.conversation.findFirst({
            where: {
              OR: [
                {
                  client1Id: currentClient.userId,
                  client2Id: swapRequest.requester.userId,
                },
                {
                  client1Id: swapRequest.requester.userId,
                  client2Id: currentClient.userId,
                },
              ],
              type: "CLIENT_CLIENT",
            },
          });

          if (conversation) {
            await db.message.create({
              data: {
                conversationId: conversation.id,
                senderId: currentClient.userId || "",
                content: `Sorry, I can't swap lessons this time. Maybe another time!`,
                data: {
                  type: "SWAP_DECLINE",
                  swapRequestId: input.swapRequestId,
                  requesterName: "Another Client",
                  targetName: "Another Client",
                },
              },
            });
          }
        }

        return {
          success: true,
          message: "Time swap declined",
          swapRequest: updatedRequest,
        };
      }
    }),

  getClientComplianceData: publicProcedure
    .input(
      z.object({
        period: z.enum(["3", "6", "9", "12", "all"]),
      })
    )
    .query(async ({ input }) => {
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
          message: "Client record not found",
        });
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case "3":
          startDate = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);
          break;
        case "6":
          startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
          break;
        case "9":
          startDate = new Date(now.getTime() - 9 * 30 * 24 * 60 * 60 * 1000);
          break;
        case "12":
          startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
          break;
        case "all":
          startDate = new Date(0); // Beginning of time
          break;
      }

      // Get all drill completions for this client in the time range
      const completions = await db.drillCompletion.findMany({
        where: {
          clientId: client.id,
          completedAt: {
            gte: startDate,
          },
        },
      });

      // Get all assigned programs for this client
      const programAssignments = await db.programAssignment.findMany({
        where: {
          clientId: client.id,
          assignedAt: {
            gte: startDate,
          },
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
          replacements: {
            orderBy: {
              replacedDate: "asc",
            },
          },
        },
      });

      // Calculate total drills assigned and completed
      let totalDrills = 0;
      let completedDrills = 0;

      programAssignments.forEach(assignment => {
        if (!assignment.startDate) return;

        const assignmentStartDate = new Date(assignment.startDate);

        assignment.program.weeks.forEach((week, weekIndex) => {
          week.days.forEach((day, dayIndex) => {
            // Calculate the actual date this day should be completed
            const dayDate = new Date(assignmentStartDate);
            dayDate.setDate(dayDate.getDate() + weekIndex * 7 + dayIndex);

            // Check if this day has been replaced with a lesson
            const hasReplacement = assignment.replacements?.some(
              (replacement: any) => {
                const replacementDate = new Date(replacement.replacedDate);
                const replacementDateOnly = new Date(
                  replacementDate.getFullYear(),
                  replacementDate.getMonth(),
                  replacementDate.getDate()
                );
                const dayDateOnly = new Date(
                  dayDate.getFullYear(),
                  dayDate.getMonth(),
                  dayDate.getDate()
                );
                return replacementDateOnly.getTime() === dayDateOnly.getTime();
              }
            );

            // Only count drills from days that have already passed and haven't been replaced
            if (dayDate <= now && !hasReplacement) {
              totalDrills += day.drills.length;
            }
          });
        });
      });

      // Count completed drills (this already filters by date range)
      completedDrills = completions.length;

      // Calculate completion rate
      const completionRate =
        totalDrills > 0 ? Math.round((completedDrills / totalDrills) * 100) : 0;

      return {
        completionRate,
        completed: completedDrills,
        total: totalDrills,
        period: input.period,
      };
    }),
});
