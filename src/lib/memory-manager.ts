/**
 * Memory Management Utility
 * Helps manage memory usage for the safe improvements
 */

/**
 * Memory usage information
 */
interface MemoryInfo {
  used: number;
  total: number;
  free: number;
  percentage: number;
  status: "healthy" | "warning" | "critical";
}

/**
 * Get current memory usage
 */
export function getMemoryUsage(): MemoryInfo {
  const usage = process.memoryUsage();
  const used = Math.round(usage.heapUsed / 1024 / 1024); // MB
  const total = Math.round(usage.heapTotal / 1024 / 1024); // MB
  const free = total - used;
  const percentage = Math.round((used / total) * 100);

  let status: "healthy" | "warning" | "critical" = "healthy";
  if (percentage > 90) {
    status = "critical";
  } else if (percentage > 75) {
    status = "warning";
  }

  return {
    used,
    total,
    free,
    percentage,
    status,
  };
}

/**
 * Force garbage collection if available
 */
export function forceGarbageCollection(): void {
  if (global.gc) {
    global.gc();
  } else {
    console.warn("⚠️ Garbage collection not available (run with --expose-gc)");
  }
}

/**
 * Memory cleanup for safe improvements
 */
export function cleanupMemory(): void {
  // Clear performance metrics
  if ((global as any).performanceMonitor) {
    (global as any).performanceMonitor.clear();
  }

  // Clear logs
  if ((global as any).safeLogger) {
    (global as any).safeLogger.clear();
  }

  // Clear rate limiting data
  if ((global as any).safeRateLimiter) {
    (global as any).safeRateLimiter.cleanup();
  }

  // Debug logging removed for production
}

/**
 * Monitor memory usage and cleanup if needed
 */
export function monitorMemory(): void {
  const memory = getMemoryUsage();

  if (memory.status === "critical") {
    // Warning logging removed - use proper logging service
    cleanupMemory();
    forceGarbageCollection();
  } else if (memory.status === "warning") {
    // Warning logging removed - use proper logging service
  }
}

/**
 * Start memory monitoring
 */
export function startMemoryMonitoring(): void {
  // Monitor memory every 5 minutes
  setInterval(monitorMemory, 5 * 60 * 1000);

  // Initial check
  monitorMemory();

  // Debug logging removed for production
}

/**
 * Get memory recommendations
 */
export function getMemoryRecommendations(): string[] {
  const memory = getMemoryUsage();
  const recommendations: string[] = [];

  if (memory.status === "critical") {
    recommendations.push("🚨 CRITICAL: Memory usage is very high");
    recommendations.push("💡 Consider restarting the application");
    recommendations.push("💡 Reduce monitoring data retention");
    recommendations.push("💡 Check for memory leaks");
  } else if (memory.status === "warning") {
    recommendations.push("⚠️ WARNING: Memory usage is high");
    recommendations.push("💡 Monitor memory usage closely");
    recommendations.push("💡 Consider reducing data retention");
  } else {
    recommendations.push("✅ Memory usage is healthy");
  }

  return recommendations;
}
