/**
 * Shared helper functions for tRPC routers
 */
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { emailService } from "@/lib/email-service";

/**
 * Helper function to ensure user.id is not null
 * Throws UNAUTHORIZED error if userId is null
 */
export function ensureUserId(userId: string | null | undefined): string {
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User ID is required",
    });
  }
  return userId;
}

/**
 * Helper function to send welcome message from coach to client
 * Creates conversation if it doesn't exist
 * Sends customized welcome message from coach settings or default
 */
export async function sendWelcomeMessage(
  coachId: string,
  clientUserId: string
) {
  console.log(
    `🎉 Sending welcome message from coach ${coachId} to client ${clientUserId}`
  );
  try {
    // Check if conversation already exists
    const existingConversation = await db.conversation.findFirst({
      where: {
        coachId,
        clientId: clientUserId,
      },
    });

    let conversationId: string;

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // Create new conversation
      const conversation = await db.conversation.create({
        data: {
          coachId,
          clientId: clientUserId,
        },
      });
      conversationId = conversation.id;
    }

    // Check if welcome message already exists
    const existingWelcomeMessage = await db.message.findFirst({
      where: {
        conversationId,
        content: {
          contains: "Welcome to NextLevel Coaching!",
        },
      },
    });

    if (existingWelcomeMessage) {
      return; // Don't send duplicate welcome message
    }

    // Get coach info and settings for the message
    const coach = await db.user.findUnique({
      where: { id: coachId },
      select: { name: true, email: true },
    });

    const coachName =
      coach?.name || coach?.email?.split("@")[0] || "Your Coach";

    // Get coach's custom welcome message from settings
    const coachSettings = await db.userSettings.findUnique({
      where: { userId: coachId },
      select: { defaultWelcomeMessage: true },
    });

    // Use custom welcome message if set, otherwise use default
    const welcomeContent = coachSettings?.defaultWelcomeMessage
      ? coachSettings.defaultWelcomeMessage
      : `Welcome to NextLevel Coaching! Hi there, I'm ${coachName}, your coach. I'm excited to work with you and help you reach your goals. Feel free to message me anytime with questions, concerns, or just to chat about your progress.`;

    // Create welcome message
    const welcomeMessage = await db.message.create({
      data: {
        conversationId,
        senderId: coachId,
        content: welcomeContent,
      },
    });

    console.log(
      `✅ Welcome message sent successfully! Message ID: ${welcomeMessage.id}`
    );

    // Send real-time notification
    try {
      const { sendToUser } = await import("@/app/api/sse/messages/route");
      sendToUser(clientUserId, {
        type: "new_message",
        data: {
          message: welcomeMessage,
          conversationId,
        },
      });
    } catch (error) {
      console.error("Failed to send real-time notification:", error);
    }

    return welcomeMessage;
  } catch (error) {
    console.error("Failed to send welcome message:", error);
    return null;
  }
}
