// Enhanced caching utilities for better performance
import { unstable_cache as reactCache } from "next/cache";

// Cache configuration
export const CACHE_CONFIG = {
  // Short-term cache for frequently accessed data
  SHORT_TTL: 5 * 60 * 1000, // 5 minutes
  // Medium-term cache for moderately accessed data
  MEDIUM_TTL: 30 * 60 * 1000, // 30 minutes
  // Long-term cache for rarely changing data
  LONG_TTL: 24 * 60 * 60 * 1000, // 24 hours
  // Static cache for never-changing data
  STATIC_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Cache tags for invalidation
export const CACHE_TAGS = {
  USERS: "users",
  CLIENTS: "clients",
  PROGRAMS: "programs",
  VIDEOS: "videos",
  LESSONS: "lessons",
  MESSAGES: "messages",
  STATS: "stats",
} as const;

// Enhanced cache wrapper with better TTL management
export function createCachedFunction<
  T extends (...args: any[]) => Promise<any>
>(
  fn: T,
  keyParts: string[],
  options: {
    ttl?: number;
    tags?: string[];
    revalidate?: number;
  } = {}
): T {
  const { ttl = CACHE_CONFIG.MEDIUM_TTL, tags = [], revalidate } = options;

  return reactCache(fn, keyParts, {
    revalidate: revalidate || ttl / 1000, // Convert ms to seconds
    tags,
  }) as T;
}

// Cache invalidation helpers
export function getCacheInvalidationKeys(tags: string[]): string[] {
  return tags.map(tag => `tag:${tag}`);
}

// Performance-optimized cache for different data types
export const cacheStrategies = {
  // User data - medium cache
  user: (fn: any, keyParts: string[]) =>
    createCachedFunction(fn, keyParts, {
      ttl: CACHE_CONFIG.MEDIUM_TTL,
      tags: [CACHE_TAGS.USERS],
    }),

  // Client data - medium cache
  client: (fn: any, keyParts: string[]) =>
    createCachedFunction(fn, keyParts, {
      ttl: CACHE_CONFIG.MEDIUM_TTL,
      tags: [CACHE_TAGS.CLIENTS],
    }),

  // Program data - long cache (rarely changes)
  program: (fn: any, keyParts: string[]) =>
    createCachedFunction(fn, keyParts, {
      ttl: CACHE_CONFIG.LONG_TTL,
      tags: [CACHE_TAGS.PROGRAMS],
    }),

  // Video data - long cache (rarely changes)
  video: (fn: any, keyParts: string[]) =>
    createCachedFunction(fn, keyParts, {
      ttl: CACHE_CONFIG.LONG_TTL,
      tags: [CACHE_TAGS.VIDEOS],
    }),

  // Lesson data - short cache (changes frequently)
  lesson: (fn: any, keyParts: string[]) =>
    createCachedFunction(fn, keyParts, {
      ttl: CACHE_CONFIG.SHORT_TTL,
      tags: [CACHE_TAGS.LESSONS],
    }),

  // Message data - short cache (changes frequently)
  message: (fn: any, keyParts: string[]) =>
    createCachedFunction(fn, keyParts, {
      ttl: CACHE_CONFIG.SHORT_TTL,
      tags: [CACHE_TAGS.MESSAGES],
    }),

  // Stats data - medium cache
  stats: (fn: any, keyParts: string[]) =>
    createCachedFunction(fn, keyParts, {
      ttl: CACHE_CONFIG.MEDIUM_TTL,
      tags: [CACHE_TAGS.STATS],
    }),
};

// Browser-side caching utilities
export class BrowserCache {
  private static instance: BrowserCache;
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private maxSize = 100;

  static getInstance(): BrowserCache {
    if (!BrowserCache.instance) {
      BrowserCache.instance = new BrowserCache();
    }
    return BrowserCache.instance;
  }

  set(key: string, data: any, ttl: number = CACHE_CONFIG.SHORT_TTL): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    let expiredCount = 0;
    this.cache.forEach(entry => {
      if (Date.now() - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    });
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredEntries: expiredCount,
      hitRate:
        this.cache.size > 0
          ? (this.cache.size - expiredCount) / this.cache.size
          : 0,
    };
  }
}

// Export singleton instance
export const browserCache = BrowserCache.getInstance();
