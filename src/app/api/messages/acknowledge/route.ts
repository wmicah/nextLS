import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { messageId, swapAction } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    // Get the current user
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the message with conversation details
    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            coach: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            client1: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            client2: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if the current user is part of this conversation
    const conversation = message.conversation;
    // Handle both COACH_CLIENT and CLIENT_CLIENT conversation types
    const isParticipant =
      conversation.clientId === user.id ||
      conversation.coachId === user.id ||
      conversation.client1Id === user.id ||
      conversation.client2Id === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Not authorized to acknowledge this message" },
        { status: 403 }
      );
    }

    // Check if this is a swap request message
    const messageData = message.data as {
      type?: string;
      swapRequestId?: string;
    } | null;
    const isSwapRequest =
      messageData?.type === "SWAP_REQUEST" && messageData?.swapRequestId;

    // For swap requests, validate that swapAction is provided
    if (isSwapRequest && !swapAction) {
      return NextResponse.json(
        {
          error:
            "swapAction (APPROVED or DECLINED) is required for swap request messages",
        },
        { status: 400 }
      );
    }

    // Check if the message requires acknowledgment (with fallback for legacy messages)
    if (!message.requiresAcknowledgment) {
      // For lesson reminder messages, we can still allow acknowledgment
      if (
        message.content.includes("🔔 **Lesson Reminder**") ||
        message.content.includes("🔔 **Lesson Confirmation Required**")
      ) {
      } else {
        return NextResponse.json(
          { error: "Message does not require acknowledgment" },
          { status: 400 }
        );
      }
    }

    // Check if already acknowledged
    if (message.isAcknowledged) {
      return NextResponse.json(
        { error: "Message already acknowledged" },
        { status: 400 }
      );
    }

    // For swap requests, validate that swapAction is provided
    if (isSwapRequest && !swapAction) {
      return NextResponse.json(
        {
          error:
            "swapAction (APPROVED or DECLINED) is required for swap request messages",
        },
        { status: 400 }
      );
    }

    // Acknowledge the message
    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: user.id,
        requiresAcknowledgment: true, // Ensure this is set
      },
    });

    // Handle swap request if this is a swap request message
    if (isSwapRequest && swapAction && messageData?.swapRequestId) {
      try {
        // Get current client
        const currentClient = await db.client.findFirst({
          where: { userId: user.id },
        });

        if (!currentClient) {
          return NextResponse.json(
            { error: "Client profile not found" },
            { status: 404 }
          );
        }

        // Get the swap request
        const swapRequest = await db.timeSwapRequest.findFirst({
          where: {
            id: messageData.swapRequestId,
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
          return NextResponse.json(
            { error: "Swap request not found or already processed" },
            { status: 404 }
          );
        }

        if (swapAction === "APPROVED") {
          // Use a transaction to ensure atomicity
          await db.$transaction(async tx => {
            // Update the swap request status
            await tx.timeSwapRequest.update({
              where: { id: messageData.swapRequestId! },
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
                  swapRequestId: messageData.swapRequestId,
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
                      swapRequestId: messageData.swapRequestId,
                      requesterName: swapRequest.requester.name,
                      targetName: currentClient.name,
                    },
                  },
                });
              }
            }
          });
        } else if (swapAction === "DECLINED") {
          // Decline the swap request
          await db.timeSwapRequest.update({
            where: { id: messageData.swapRequestId! },
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
                    swapRequestId: messageData.swapRequestId,
                    requesterName: "Another Client",
                    targetName: "Another Client",
                  },
                },
              });
            }
          }
        }
      } catch (error) {
        console.error("Error handling swap request:", error);
        // Don't fail the acknowledgment if swap handling fails
        // The message is already acknowledged
      }
    }

    // Check if this is a lesson confirmation message and handle it
    if (message.content.includes("🔔 **Lesson Confirmation Required**")) {
      try {
        // Find the lesson reminder record for this message
        const lessonReminder = await db.lessonReminder.findFirst({
          where: {
            eventId: {
              in: await db.event
                .findMany({
                  where: {
                    coachId: conversation.coachId || undefined,
                    clientId: conversation.clientId,
                    date: {
                      gte: new Date(), // Future lessons only
                    },
                    status: "CONFIRMED",
                    confirmationRequired: true,
                  },
                  select: { id: true },
                })
                .then(events => events.map(e => e.id)),
            },
            status: "SENT",
          },
          include: {
            event: true,
          },
        });

        if (lessonReminder) {
          // Update the lesson reminder status
          await db.lessonReminder.update({
            where: { id: lessonReminder.id },
            data: {
              status: "CONFIRMED",
              confirmedAt: new Date(),
            },
          });

          // Update the lesson to mark as confirmed
          await db.event.update({
            where: { id: lessonReminder.eventId },
            data: {
              confirmedAt: new Date(),
            },
          });
        }
      } catch (error) {
        // Don't fail the acknowledgment if confirmation processing fails
      }
    }

    // Automatically send confirmation message to the coach
    try {
      // Only send confirmation if this is a client acknowledging (not a coach)
      if (conversation.clientId === user.id && conversation.coachId) {
        const clientName = conversation.client?.name || "Client";
        const coachName = conversation.coach?.name || "Coach";

        // Check if this is a lesson confirmation or regular acknowledgment
        const isLessonConfirmation = message.content.includes(
          "🔔 **Lesson Confirmation Required**"
        );

        const confirmationMessage = isLessonConfirmation
          ? `✅ **Lesson Attendance Confirmed**

Hi Coach ${coachName}!

${clientName} has confirmed their attendance for the upcoming lesson.

- **Client**: ${clientName}
- **Confirmed at**: ${new Date().toLocaleString()}
- **Status**: Attendance confirmed - lesson will proceed as scheduled`
          : `✅ **Lesson Confirmed**

Hi Coach ${coachName}!

${clientName} has confirmed receipt of the lesson reminder and is ready for tomorrow's lesson.

- **Client**: ${clientName}
- **Confirmed at**: ${new Date().toLocaleString()}
- **Status**: Ready for lesson`;

        // Create the confirmation message
        const confirmationMsg = await db.message.create({
          data: {
            conversationId: conversation.id,
            senderId: user.id, // Message appears to come from the client
            content: confirmationMessage,
            requiresAcknowledgment: false, // No acknowledgment needed for confirmation
          },
        });

        // Update conversation timestamp
        await db.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
      }
    } catch (confirmationError) {
      // Don't fail the acknowledgment if confirmation fails
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage,
      confirmationSent: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
