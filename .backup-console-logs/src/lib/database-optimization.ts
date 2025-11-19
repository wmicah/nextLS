// Database optimization utilities
import { db } from "@/db";

export const DATABASE_OPTIMIZATIONS = {
  // Recommended polling intervals
  POLLING_INTERVALS: {
    NOTIFICATIONS: 60000, // 1 minute
    MESSAGES: 30000, // 30 seconds
    CONVERSATIONS: 60000, // 1 minute
    ANALYTICS: 300000, // 5 minutes
  },

  // Cache settings
  CACHE_SETTINGS: {
    STALE_TIME: {
      NOTIFICATIONS: 30000, // 30 seconds
      MESSAGES: 15000, // 15 seconds
      CONVERSATIONS: 30000, // 30 seconds
    },
    GC_TIME: {
      NOTIFICATIONS: 5 * 60 * 1000, // 5 minutes
      MESSAGES: 2 * 60 * 1000, // 2 minutes
      CONVERSATIONS: 5 * 60 * 1000, // 5 minutes
    },
  },

  // Database query optimizations
  QUERY_OPTIMIZATIONS: {
    // Use select to limit fields
    NOTIFICATION_FIELDS: {
      id: true,
      title: true,
      message: true,
      isRead: true,
      createdAt: true,
      type: true,
    },

    MESSAGE_FIELDS: {
      id: true,
      content: true,
      isRead: true,
      createdAt: true,
      senderId: true,
    },
  },
};

// Database connection monitoring
export function createDatabaseHealthCheck() {
  return {
    async checkConnection() {
      try {
        const start = Date.now();
        // Simple query to test connection
        await db.$queryRaw`SELECT 1`;
        const duration = Date.now() - start;

        return {
          status: "healthy",
          responseTime: duration,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        };
      }
    },
  };
}

// Rate limiting for API endpoints
export const RATE_LIMITS = {
  NOTIFICATIONS: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
  },
  MESSAGES: {
    maxRequests: 20,
    windowMs: 60000, // 1 minute
  },
  ANALYTICS: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
  },
};
