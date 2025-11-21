import { db } from "@/db";
import webpush from "web-push";

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:notifications@nextlevelcoaching.com",
  process.env.NEXT_PUBLIC_VAPID_KEY ||
    "BJmY1hCwoFMlFc67g3k8ehL0RAyf72sPxkVjNzMn8OPk-nv9BwR1xF8hLQwWvkj-mPFtNCPoySRFRitF80l3j44",
  process.env.VAPID_PRIVATE_KEY || "QBIAsh2xty8paP3Zbd33kCWzOnXLjnP5on5k4xHol9Y"
);

// Helper function to remove all emojis from text
function removeEmojis(text: string): string {
  // Remove emojis using regex pattern
  // This pattern matches most emoji ranges including:
  // - Emoticons (😀-🙏)
  // - Symbols & Pictographs (🌀-🗿)
  // - Transport & Map Symbols (🚀-🛿)
  // - Flags (🏁-🏳️)
  // - And other emoji ranges
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}]|[\u{2194}-\u{2199}]|[\u{21A9}-\u{21AA}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{23F0}]|[\u{23F3}]|[\u{25FD}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2705}]|[\u{270A}-\u{270B}]|[\u{2728}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2795}-\u{2797}]|[\u{27B0}]|[\u{27BF}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]/gu,
      ""
    )
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    // Check if user has push notifications enabled
    const userSettings = await db.userSettings.findUnique({
      where: { userId },
      select: { pushNotifications: true },
    });

    if (userSettings?.pushNotifications === false) {
      return false;
    }

    // Get all push subscriptions for this user
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return false;
    }

    // Remove emojis from title and body
    const cleanTitle = removeEmojis(title);
    const cleanBody = removeEmojis(body);

    const notificationPayload = JSON.stringify({
      title: cleanTitle,
      body: cleanBody,
      icon: "/icon-192x192.png",
      badge: "/icon-32x32.png",
      vibrate: [200, 100, 200],
      data: {
        ...data,
        timestamp: Date.now(),
      },
      tag: data?.tag || "default",
      requireInteraction: data?.requireInteraction || false,
    });

    // Send notification to all user's devices
    const results = await Promise.allSettled(
      subscriptions.map(async subscription => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, notificationPayload);
          return { success: true, subscriptionId: subscription.id };
        } catch (error: any) {
          // If subscription is invalid (expired, revoked, etc.), remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.pushSubscription.delete({
              where: { id: subscription.id },
            });
          }
          throw error;
        }
      })
    );

    const successCount = results.filter(r => r.status === "fulfilled").length;
    const failureCount = results.filter(r => r.status === "rejected").length;

    return successCount > 0;
  } catch (error) {
    // Silently fail in production - errors are handled by removing invalid subscriptions
    return false;
  }
}

export async function sendMessageNotification(
  recipientId: string,
  senderName: string,
  messageContent: string,
  conversationId: string
) {
  // Strip markdown formatting and emojis from message content
  let cleanContent = messageContent
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown
    .replace(/\*(.*?)\*/g, "$1") // Remove italic markdown
    .replace(/`(.*?)`/g, "$1") // Remove code markdown
    .replace(/#{1,6}\s/g, "") // Remove headers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Remove links, keep text
    .trim();

  cleanContent = removeEmojis(cleanContent);

  return await sendPushNotification(
    recipientId,
    `New message from ${senderName}`,
    cleanContent.length > 50
      ? `${cleanContent.substring(0, 50)}...`
      : cleanContent,
    {
      type: "message",
      conversationId,
      senderName,
      url: `/messages?conversation=${conversationId}`,
    }
  );
}

export async function sendProgramAssignmentNotification(
  clientUserId: string,
  programTitle: string,
  coachName: string,
  programId?: string
) {
  return await sendPushNotification(
    clientUserId,
    "New Program Assigned",
    `${coachName} assigned you the program: ${programTitle}`,
    {
      type: "program_assignment",
      programId,
      coachName,
      url: `/dashboard`,
    }
  );
}

export async function sendRoutineAssignmentNotification(
  clientUserId: string,
  routineName: string,
  coachName: string,
  routineId?: string
) {
  return await sendPushNotification(
    clientUserId,
    "New Routine Assigned",
    `${coachName} assigned you the routine: ${routineName}`,
    {
      type: "routine_assignment",
      routineId,
      coachName,
      url: `/dashboard`,
    }
  );
}

export async function sendVideoAssignmentNotification(
  clientUserId: string,
  videoTitle: string,
  coachName: string,
  videoId?: string
) {
  return await sendPushNotification(
    clientUserId,
    "New Video Assigned",
    `${coachName} assigned you the video: ${videoTitle}`,
    {
      type: "video_assignment",
      videoId,
      coachName,
      url: `/dashboard`,
    }
  );
}

export async function sendLessonReminderNotification(
  clientUserId: string,
  lessonDate: Date,
  lessonTime: string,
  coachName: string,
  eventId?: string
) {
  const dateStr = lessonDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return await sendPushNotification(
    clientUserId,
    "Lesson Reminder",
    `You have a lesson with ${coachName} on ${dateStr} at ${lessonTime}`,
    {
      type: "lesson_reminder",
      eventId,
      coachName,
      lessonDate: lessonDate.toISOString(),
      url: `/dashboard`,
      requireInteraction: true,
    }
  );
}

export async function sendSwapRequestNotification(
  recipientUserId: string,
  requesterName: string,
  requesterDate: Date,
  targetDate: Date,
  swapRequestId: string
) {
  const requesterDateStr = requesterDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const targetDateStr = targetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return await sendPushNotification(
    recipientUserId,
    "New Swap Request",
    `${requesterName} wants to swap their lesson on ${requesterDateStr} for your lesson on ${targetDateStr}`,
    {
      type: "swap_request",
      swapRequestId,
      url: `/messages`,
      requireInteraction: true,
    }
  );
}

export async function sendSwapApprovalNotification(
  recipientUserId: string,
  targetClientName: string,
  swapRequestId: string
) {
  return await sendPushNotification(
    recipientUserId,
    "Swap Request Approved",
    `Your swap request with ${targetClientName} has been approved`,
    {
      type: "swap_approval",
      swapRequestId,
      url: `/dashboard`,
    }
  );
}

export async function sendClientJoinNotification(
  coachUserId: string,
  clientName: string,
  clientId: string
) {
  return await sendPushNotification(
    coachUserId,
    "New Client Joined",
    `${clientName} has joined your coaching program`,
    {
      type: "client_join",
      clientId,
      clientName,
      url: `/clients/${clientId}`,
    }
  );
}

export async function sendGeneralNotification(
  userId: string,
  title: string,
  message: string,
  data?: any
) {
  return await sendPushNotification(userId, title, message, {
    type: "general",
    ...data,
    url: data?.url || `/dashboard`,
  });
}
