import { AppRouterInstance } from "next/navigation";

export interface NotificationData {
  eventId?: string;
  clientId?: string;
  programId?: string;
  messageId?: string;
  conversationId?: string;
  videoSubmissionId?: string;
  drillId?: string;
  swapRequestId?: string;
  clientUserId?: string;
  clientName?: string;
  requesterName?: string;
  targetName?: string;
  requesterEventTitle?: string;
  targetEventTitle?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  createdAt: string;
}

/**
 * Smart notification routing based on notification type and data
 */
export const getNotificationRoute = (notification: Notification): string => {
  const { type, data } = notification;

  switch (type) {
    case "MESSAGE":
      // If we have a conversationId, go to that specific conversation
      if (data?.conversationId) {
        return `/messages?conversation=${data.conversationId}`;
      }
      // If we have a messageId, try to find the conversation
      if (data?.messageId) {
        return `/messages?message=${data.messageId}`;
      }
      return "/messages";

    case "CLIENT_JOIN_REQUEST":
      // If we have a specific client, go to that client's page
      if (data?.clientId) {
        return `/clients?client=${data.clientId}`;
      }
      if (data?.clientUserId) {
        return `/clients?user=${data.clientUserId}`;
      }
      return "/clients";

    case "LESSON_SCHEDULED":
    case "LESSON_CANCELLED":
    case "SCHEDULE_REQUEST":
      // If we have a specific event, go to that event's details
      if (data?.eventId) {
        return `/schedule?event=${data.eventId}`;
      }
      return "/schedule";

    case "WORKOUT_ASSIGNED":
    case "WORKOUT_COMPLETED":
    case "PROGRAM_ASSIGNED":
      // If we have a specific program, go to that program
      if (data?.programId) {
        return `/programs?program=${data.programId}`;
      }
      // If we have a specific drill, go to that drill
      if (data?.drillId) {
        return `/programs?drill=${data.drillId}`;
      }
      return "/programs";

    case "PROGRESS_UPDATE":
      // If we have a specific program, go to that program's progress
      if (data?.programId) {
        return `/programs?program=${data.programId}&tab=progress`;
      }
      return "/programs";

    case "VIDEO_SUBMISSION":
      // If we have a specific video submission, go to that video
      if (data?.videoSubmissionId) {
        return `/videos?submission=${data.videoSubmissionId}`;
      }
      return "/videos";

    case "TIME_SWAP_REQUEST":
      // If we have a swap request, go to the time swap page
      if (data?.swapRequestId) {
        return `/time-swap?request=${data.swapRequestId}`;
      }
      return "/time-swap";

    default:
      return "/dashboard";
  }
};

/**
 * Enhanced notification click handler that uses smart routing
 */
export const handleNotificationClick = (
  notification: Notification,
  router: AppRouterInstance,
  markAsReadMutation?: { mutate: (params: { notificationId: string }) => void }
) => {
  // Mark as read if unread
  if (!notification.isRead && markAsReadMutation) {
    markAsReadMutation.mutate({
      notificationId: notification.id,
    });
  }

  // Get the smart route
  const route = getNotificationRoute(notification);

  // Navigate to the route
  router.push(route);
};

/**
 * Get notification action button for specific notification types
 */
export const getNotificationAction = (
  notification: Notification
): {
  text: string;
  route: string;
  onClick?: () => void;
} | null => {
  const { type, data } = notification;

  switch (type) {
    case "CLIENT_JOIN_REQUEST":
      if (data?.clientId || data?.clientUserId) {
        return {
          text: "View Client",
          route: data?.clientId
            ? `/clients?client=${data.clientId}`
            : `/clients?user=${data.clientUserId}`,
        };
      }
      return {
        text: "View Clients",
        route: "/clients",
      };

    case "MESSAGE":
      if (data?.conversationId) {
        return {
          text: "View Message",
          route: `/messages?conversation=${data.conversationId}`,
        };
      }
      return {
        text: "View Messages",
        route: "/messages",
      };

    case "LESSON_SCHEDULED":
    case "LESSON_CANCELLED":
    case "SCHEDULE_REQUEST":
      if (data?.eventId) {
        return {
          text: "View Lesson",
          route: `/schedule?event=${data.eventId}`,
        };
      }
      return {
        text: "View Schedule",
        route: "/schedule",
      };

    case "WORKOUT_ASSIGNED":
    case "WORKOUT_COMPLETED":
    case "PROGRAM_ASSIGNED":
      if (data?.programId) {
        return {
          text: "View Program",
          route: `/programs?program=${data.programId}`,
        };
      }
      return {
        text: "View Programs",
        route: "/programs",
      };

    case "VIDEO_SUBMISSION":
      if (data?.videoSubmissionId) {
        return {
          text: "View Video",
          route: `/videos?submission=${data.videoSubmissionId}`,
        };
      }
      return {
        text: "View Videos",
        route: "/videos",
      };

    case "TIME_SWAP_REQUEST":
      if (data?.swapRequestId) {
        return {
          text: "View Swap",
          route: `/time-swap?request=${data.swapRequestId}`,
        };
      }
      return {
        text: "View Swaps",
        route: "/time-swap",
      };

    default:
      return null;
  }
};
