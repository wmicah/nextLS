import { useRouter } from "next/navigation";

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

export type NotificationRouteOptions = { forClient?: boolean };

/**
 * Smart notification routing based on notification type and data.
 * Pass { forClient: true } when the viewer is a client so routes go to client pages.
 */
export const getNotificationRoute = (
  notification: Notification,
  options?: NotificationRouteOptions
): string => {
  const { type, data } = notification;
  const forClient = options?.forClient ?? false;

  const baseRoute = ((): string => {
    switch (type) {
      case "MESSAGE":
        if (data?.conversationId) {
          return `/messages?conversation=${data.conversationId}`;
        }
        if (data?.messageId) {
          return `/messages?message=${data.messageId}`;
        }
        return "/messages";

      case "CLIENT_JOIN_REQUEST":
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
        if (data?.eventId) {
          return `/schedule?event=${data.eventId}`;
        }
        return "/schedule";

      case "WORKOUT_ASSIGNED":
      case "WORKOUT_COMPLETED":
      case "PROGRAM_ASSIGNED":
        if (data?.programId) {
          return `/programs?program=${data.programId}`;
        }
        if (data?.drillId) {
          return `/programs?drill=${data.drillId}`;
        }
        return "/programs";

      case "PROGRESS_UPDATE":
        if (data?.programId) {
          return `/programs?program=${data.programId}&tab=progress`;
        }
        return "/programs";

      case "VIDEO_SUBMISSION":
        if (data?.videoSubmissionId) {
          return `/videos?submission=${data.videoSubmissionId}`;
        }
        return "/videos";

      case "TIME_SWAP_REQUEST":
        if (data?.swapRequestId) {
          return `/time-swap?request=${data.swapRequestId}`;
        }
        return "/time-swap";

      default:
        return "/dashboard";
    }
  })();

  if (!forClient) return baseRoute;

  // Map coach routes to client routes
  if (baseRoute.startsWith("/messages")) {
    return baseRoute.replace("/messages", "/client-messages");
  }
  if (baseRoute.startsWith("/schedule")) {
    return baseRoute.replace("/schedule", "/client-schedule");
  }
  if (baseRoute.startsWith("/programs")) {
    return baseRoute.replace("/programs", "/client-dashboard");
  }
  if (baseRoute.startsWith("/time-swap")) {
    return "/client-schedule";
  }
  if (baseRoute === "/dashboard" || baseRoute.startsWith("/videos")) {
    return "/client-dashboard";
  }
  return baseRoute;
};

/**
 * Enhanced notification click handler that uses smart routing.
 * Pass { forClient: true } when the viewer is a client.
 */
export const handleNotificationClick = (
  notification: Notification,
  router: { push: (route: string) => void },
  markAsReadMutation?: { mutate: (params: { notificationId: string }) => void },
  options?: NotificationRouteOptions
) => {
  // Mark as read if unread
  if (!notification.isRead && markAsReadMutation) {
    markAsReadMutation.mutate({
      notificationId: notification.id,
    });
  }

  const route = getNotificationRoute(notification, options);
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
