/**
 * Safe Rate Limiting Utilities
 * These enhance existing rate limiting without breaking anything
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

class SafeRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();
  private maxStoreSize = 1000; // Limit store size for memory efficiency

  /**
   * Safe rate limiting that won't break existing functionality
   */
  checkLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const record = this.store.get(key);

    // Clean up expired records
    if (record && now > record.resetTime) {
      this.store.delete(key);
    }

    const currentRecord = this.store.get(key);

    if (!currentRecord) {
      // First request
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }

    if (currentRecord.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: currentRecord.resetTime,
        retryAfter: Math.ceil((currentRecord.resetTime - now) / 1000),
      };
    }

    // Increment count
    currentRecord.count++;
    this.store.set(key, currentRecord);

    return {
      allowed: true,
      remaining: config.maxRequests - currentRecord.count,
      resetTime: currentRecord.resetTime,
    };
  }

  /**
   * Safe cleanup of expired records
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }

    // If store is too large, remove oldest entries
    if (this.store.size > this.maxStoreSize) {
      const entries = Array.from(this.store.entries());
      const toDelete = entries.slice(0, entries.length - this.maxStoreSize);
      toDelete.forEach(([key]) => this.store.delete(key));
    }
  }

  /**
   * Get current rate limit status (safe to call)
   */
  getStatus(key: string): { count: number; resetTime: number } | null {
    const record = this.store.get(key);
    if (!record) return null;

    const now = Date.now();
    if (now > record.resetTime) {
      this.store.delete(key);
      return null;
    }

    return record;
  }
}

// Global rate limiter instance
export const safeRateLimiter = new SafeRateLimiter();

/**
 * Safe rate limiting decorator for API routes
 */
export function withRateLimit(config: RateLimitConfig) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: any, res: any) {
      // Extract IP from request (safe fallback)
      const ip =
        req.headers["x-forwarded-for"] ||
        req.headers["x-real-ip"] ||
        req.connection?.remoteAddress ||
        "unknown";

      const rateLimitResult = safeRateLimiter.checkLimit(ip, config);

      if (!rateLimitResult.allowed) {
        res.status(429).json({
          error: "Too Many Requests",
          retryAfter: rateLimitResult.retryAfter,
        });
        return;
      }

      // Add rate limit headers
      res.setHeader("X-RateLimit-Limit", config.maxRequests);
      res.setHeader("X-RateLimit-Remaining", rateLimitResult.remaining);
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(rateLimitResult.resetTime).toISOString()
      );

      return originalMethod.call(this, req, res);
    };

    return descriptor;
  };
}

/**
 * Safe rate limiting for tRPC procedures
 */
export function createRateLimit(config: RateLimitConfig) {
  return async (opts: { ctx: any; next: any }) => {
    const userId = opts.ctx.user?.id || "anonymous";
    const rateLimitResult = safeRateLimiter.checkLimit(userId, config);

    if (!rateLimitResult.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`
      );
    }

    return opts.next();
  };
}

/**
 * Safe cleanup task (run periodically)
 */
export function startRateLimitCleanup() {
  // Clean up expired records every 5 minutes
  setInterval(() => {
    safeRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

// Auto-start cleanup in production
if (process.env.NODE_ENV === "production") {
  startRateLimitCleanup();
}
