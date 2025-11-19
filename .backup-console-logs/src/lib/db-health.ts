/**
 * Safe Database Health Monitoring
 * This adds monitoring without changing any existing database logic
 */

import { db } from "@/db";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  responseTime: number;
  timestamp: Date;
  error?: string;
}

let lastHealthCheck: HealthStatus | null = null;
let healthCheckInProgress = false;

/**
 * Safe health check that won't interfere with existing operations
 */
export async function checkDatabaseHealth(): Promise<HealthStatus> {
  // Prevent concurrent health checks
  if (healthCheckInProgress) {
    return (
      lastHealthCheck || {
        status: "degraded",
        responseTime: 0,
        timestamp: new Date(),
        error: "Health check in progress",
      }
    );
  }

  healthCheckInProgress = true;
  const startTime = Date.now();

  try {
    // Simple query that won't affect existing data
    await db.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;
    const status: HealthStatus = {
      status: responseTime < 1000 ? "healthy" : "degraded",
      responseTime,
      timestamp: new Date(),
    };

    lastHealthCheck = status;
    return status;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const status: HealthStatus = {
      status: "unhealthy",
      responseTime,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    };

    lastHealthCheck = status;
    return status;
  } finally {
    healthCheckInProgress = false;
  }
}

/**
 * Get last health check result (safe to call frequently)
 */
export function getLastHealthStatus(): HealthStatus | null {
  return lastHealthCheck;
}

/**
 * Safe connection pool monitoring
 */
export async function getConnectionPoolStatus() {
  try {
    // This is a safe query that just checks connection
    const result = await db.$queryRaw`
      SELECT 
        count(*) as active_connections,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
    `;

    return result;
  } catch (error) {
    // Warning logging removed - use proper logging service
    return null;
  }
}

/**
 * Safe database size monitoring
 */
export async function getDatabaseSize() {
  try {
    const result = await db.$queryRaw<Array<{ size: string }>>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;

    return result[0]?.size || "Unknown";
  } catch (error) {
    // Warning logging removed - use proper logging service
    return "Unknown";
  }
}
