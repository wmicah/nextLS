/**
 * Security Configuration for Safe Improvements
 * This file defines security settings for monitoring and health endpoints
 */

export const SECURITY_CONFIG = {
  // Health endpoint security
  health: {
    // Require authentication for health checks
    requireAuth: true,
    // Allow only admin users (set to false for basic auth)
    requireAdmin: false,
    // Rate limit health checks (requests per minute)
    rateLimit: 10,
    // Cache health data for this many seconds
    cacheSeconds: 30,
  },

  // Monitoring dashboard security
  monitoring: {
    // Require authentication for monitoring dashboard
    requireAuth: true,
    // Require admin role for monitoring dashboard
    requireAdmin: true,
    // Auto-refresh interval (seconds)
    refreshInterval: 30,
    // Maximum data retention (hours)
    maxDataRetention: 24,
  },

  // Logging security
  logging: {
    // Maximum log entries to store in memory
    maxLogEntries: 1000,
    // Auto-redact these fields from logs
    redactFields: [
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "credential",
      "session",
      "cookie",
      "authorization",
      "bearer",
    ],
    // Maximum log entry size (characters)
    maxLogSize: 1000,
  },

  // Performance monitoring security
  performance: {
    // Maximum metrics to store
    maxMetrics: 100,
    // Auto-cleanup interval (minutes)
    cleanupInterval: 5,
    // Don't track these operation names
    excludeOperations: ["health-check", "monitoring", "admin", "auth"],
  },

  // Environment validation security
  environment: {
    // Don't expose these environment variables in summaries
    hideVariables: [
      "DATABASE_URL",
      "KINDE_CLIENT_SECRET",
      "RESEND_API_KEY",
      "OPENAI_API_KEY",
      "UPLOADTHING_SECRET",
      "NEXTAUTH_SECRET",
    ],
    // Only show validation status, not actual values
    hideValues: true,
  },
};

/**
 * Check if user has admin privileges by querying the database
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const { db } = await import("@/db");

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    return user?.isAdmin === true;
  } catch (error) {
    // Error logging removed - use proper error handling
    return false; // Fail safe - deny access if we can't verify
  }
}

/**
 * Check if user has admin privileges (synchronous version for when user object is available)
 */
export function isAdminUserSync(user: any): boolean {
  return user?.isAdmin === true;
}

/**
 * Check if user has monitoring access
 */
export function hasMonitoringAccess(user: any): boolean {
  // Add your monitoring access check here
  return isAdminUserSync(user) || user?.canMonitor === true;
}

/**
 * Sanitize sensitive data from objects
 */
export function sanitizeSensitiveData(data: any): any {
  if (!data || typeof data !== "object") return data;

  const sanitized = { ...data };

  SECURITY_CONFIG.logging.redactFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });

  return sanitized;
}

/**
 * Check if operation should be excluded from performance monitoring
 */
export function shouldExcludeOperation(operationName: string): boolean {
  return SECURITY_CONFIG.performance.excludeOperations.some(excluded =>
    operationName.toLowerCase().includes(excluded.toLowerCase())
  );
}
