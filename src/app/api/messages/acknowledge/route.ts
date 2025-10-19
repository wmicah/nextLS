import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { messageId } = await request.json();

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

    console.log("User attempting to acknowledge:", user.id);

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

    console.log("Message found:", {
      id: message.id,
      conversationId: message.conversationId,
      requiresAcknowledgment: message.requiresAcknowledgment,
      isAcknowledged: message.isAcknowledged,
    });

    // Check if the current user is part of this conversation
    const conversation = message.conversation;
    const isParticipant =
      conversation.clientId === user.id || conversation.coachId === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Not authorized to acknowledge this message" },
        { status: 403 }
      );
    }

    console.log("User is participant, checking acknowledgment requirements");

    // Check if the message requires acknowledgment (with fallback for legacy messages)
    if (!message.requiresAcknowledgment) {
      // For lesson reminder messages, we can still allow acknowledgment
      if (
        message.content.includes("🔔 **Lesson Reminder**") ||
        message.content.includes("🔔 **Lesson Confirmation Required**")
      ) {
        console.log(
          "Lesson reminder/confirmation detected, allowing acknowledgment"
        );
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

    console.log("Acknowledging message...");

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

    console.log("Message acknowledged successfully");

    // Check if this is a lesson confirmation message and handle it
    if (message.content.includes("🔔 **Lesson Confirmation Required**")) {
      console.log(
        "Lesson confirmation acknowledgment detected, processing confirmation..."
      );

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

          console.log(
            `✅ Lesson confirmation processed for lesson ${lessonReminder.eventId}`
          );
        }
      } catch (error) {
        console.error("Error processing lesson confirmation:", error);
        // Don't fail the acknowledgment if confirmation processing fails
      }
    }

    // Automatically send confirmation message to the coach
    try {
      // Only send confirmation if this is a client acknowledging (not a coach)
      if (conversation.clientId === user.id && conversation.coachId) {
        console.log("Sending confirmation message to coach");

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

        console.log("Confirmation message sent:", confirmationMsg.id);

        // Update conversation timestamp
        await db.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
      }
    } catch (confirmationError) {
      console.error("Error sending confirmation message:", confirmationError);
      // Don't fail the acknowledgment if confirmation fails
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage,
      confirmationSent: true,
    });
  } catch (error) {
    console.error("Error acknowledging message:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
