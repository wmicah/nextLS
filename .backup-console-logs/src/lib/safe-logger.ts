/**
 * Safe Logging Utilities
 * This enhances logging without affecting existing functionality
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

class SafeLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Reduced from 1000 to 100 for memory efficiency

  /**
   * Safe logging that won't break existing code
   */
  log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      metadata: this.sanitizeMetadata(metadata),
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging with safe formatting
    const timestamp = entry.timestamp.toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    switch (level) {
      case "debug":
        // Debug logging removed for production
break;
      case "info":
        // Debug logging removed for production
break;
      case "warn":
        // Warning logging removed - use proper logging service
        break;
      case "error":
        // Error logging removed - use proper error handling
        break;
    }
  }

  /**
   * Safe metadata sanitization
   */
  private sanitizeMetadata(
    metadata?: Record<string, any>
  ): Record<string, any> | undefined {
    if (!metadata) return undefined;

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      // Remove sensitive data
      if (
        key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("secret")
      ) {
        sanitized[key] = "[REDACTED]";
        continue;
      }

      // Safe string conversion
      if (typeof value === "string") {
        sanitized[key] = value.slice(0, 1000); // Limit length
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = "[Object]"; // Don't log complex objects
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get recent logs (safe to call)
   */
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by level (safe to call)
   */
  getLogsByLevel(level: LogLevel, limit: number = 100): LogEntry[] {
    return this.logs.filter(log => log.level === level).slice(-limit);
  }

  /**
   * Clear logs (safe to call)
   */
  clear() {
    this.logs = [];
  }

  /**
   * Get log statistics (safe to call)
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
      },
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
    });

    return stats;
  }
}

// Global logger instance
export const safeLogger = new SafeLogger();

/**
 * Safe logging decorator for functions
 */
export function withLogging(level: LogLevel = "info", message?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const logMessage = message || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      safeLogger.log(level, `Starting ${logMessage}`, { args: args.length });

      try {
        const result = originalMethod.apply(this, args);

        // Handle async functions
        if (result instanceof Promise) {
          return result.then(
            value => {
              safeLogger.log(level, `Completed ${logMessage}`, {
                success: true,
              });
              return value;
            },
            error => {
              safeLogger.log("error", `Failed ${logMessage}`, {
                error: error.message,
              });
              throw error;
            }
          );
        } else {
          safeLogger.log(level, `Completed ${logMessage}`, { success: true });
          return result;
        }
      } catch (error) {
        safeLogger.log("error", `Failed ${logMessage}`, {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Safe logging for tRPC procedures
 */
export function createLoggingMiddleware() {
  return async (opts: { ctx: any; next: any; path: string; type: string }) => {
    const startTime = Date.now();

    safeLogger.log("info", `tRPC ${opts.type} started`, {
      path: opts.path,
      userId: opts.ctx.user?.id,
    });

    try {
      const result = await opts.next();
      const duration = Date.now() - startTime;

      safeLogger.log("info", `tRPC ${opts.type} completed`, {
        path: opts.path,
        duration,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      safeLogger.log("error", `tRPC ${opts.type} failed`, {
        path: opts.path,
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  };
}

/**
 * Safe error logging
 */
export function logError(error: Error, context?: Record<string, any>) {
  safeLogger.log("error", error.message, {
    stack: error.stack,
    ...context,
  });
}

/**
 * Safe performance logging
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) {
  safeLogger.log("info", `Performance: ${operation}`, {
    duration,
    ...metadata,
  });
}
