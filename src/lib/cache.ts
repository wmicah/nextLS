// Advanced caching system for performance optimization
import { cache } from "react";
import { CACHE_TAGS, CACHE_CONFIG } from "./cache-optimization";

// In-memory cache for server-side data
const memoryCache = new Map<
  string,
  { data: any; timestamp: number; ttl: number }
>();

// Cache configuration
const DEFAULT_TTL = CACHE_CONFIG.SHORT_TTL; // Use optimized TTL
const MAX_CACHE_SIZE = 1000;

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Cache tags for invalidation
  revalidate?: number; // Revalidation interval
}

// Cache key generator
function generateCacheKey(key: string, params?: Record<string, any>): string {
  if (!params) return key;
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}:${JSON.stringify(params[k])}`)
    .join("|");
  return `${key}:${sortedParams}`;
}

// Memory cache operations
export function setCache(
  key: string,
  data: any,
  options: CacheOptions = {}
): void {
  const cacheKey = generateCacheKey(key);
  const ttl = options.ttl || DEFAULT_TTL;

  // Clean up old entries if cache is full
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }

  memoryCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

export function getCache<T>(
  key: string,
  params?: Record<string, any>
): T | null {
  const cacheKey = generateCacheKey(key, params);
  const entry = memoryCache.get(cacheKey);

  if (!entry) return null;

  // Check if expired
  if (Date.now() - entry.timestamp > entry.ttl) {
    memoryCache.delete(cacheKey);
    return null;
  }

  return entry.data as T;
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    memoryCache.clear();
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }
}

// React cache wrapper for server components
export const cached = <T extends (...args: any[]) => any>(
  fn: T,
  options: CacheOptions = {}
): T => {
  return cache(async (...args: Parameters<T>) => {
    const cacheKey = `${fn.name}:${JSON.stringify(args)}`;
    const cached = getCache(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await fn(...args);
    setCache(cacheKey, result, options);
    return result;
  }) as T;
};

// Database query cache
export function cacheQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = getCache<T>(queryKey);

  if (cached) {
    return Promise.resolve(cached);
  }

  return queryFn().then(result => {
    setCache(queryKey, result, options);
    return result;
  });
}

// Cache statistics
export function getCacheStats() {
  const now = Date.now();
  let expired = 0;
  let active = 0;

  for (const entry of memoryCache.values()) {
    if (now - entry.timestamp > entry.ttl) {
      expired++;
    } else {
      active++;
    }
  }

  return {
    total: memoryCache.size,
    active,
    expired,
    hitRate: active / memoryCache.size || 0,
  };
}

// Cleanup expired entries
export function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      memoryCache.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof window === "undefined") {
  setInterval(cleanupCache, 5 * 60 * 1000);
}
