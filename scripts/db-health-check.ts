#!/usr/bin/env tsx
/**
 * Database Health Check Script
 *
 * This script checks database connectivity, connection pool status,
 * and provides diagnostics for common database issues.
 */

import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

interface HealthCheck {
  name: string;
  status: "healthy" | "warning" | "error";
  message: string;
  details?: any;
}

const healthChecks: HealthCheck[] = [];

async function checkDatabaseConnection(): Promise<HealthCheck> {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      name: "Database Connection",
      status:
        responseTime < 100
          ? "healthy"
          : responseTime < 500
          ? "warning"
          : "error",
      message: `Connected successfully (${responseTime}ms)`,
      details: { responseTime },
    };
  } catch (error) {
    return {
      name: "Database Connection",
      status: "error",
      message: `Connection failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      details: { error: String(error) },
    };
  }
}

async function checkConnectionPool(): Promise<HealthCheck> {
  try {
    // Check if connection pool is working by executing a simple query
    await prisma.$queryRaw`SELECT 1`;

    return {
      name: "Connection Pool",
      status: "healthy",
      message: "Connection pool is operational",
      details: {
        note: "Connection pool metrics require Prisma metrics extension",
      },
    };
  } catch (error) {
    return {
      name: "Connection Pool",
      status: "warning",
      message: "Could not verify connection pool",
      details: { error: String(error) },
    };
  }
}

async function checkQueryPerformance(): Promise<HealthCheck> {
  try {
    const startTime = Date.now();
    await prisma.user.count();
    const responseTime = Date.now() - startTime;

    return {
      name: "Query Performance",
      status:
        responseTime < 50
          ? "healthy"
          : responseTime < 200
          ? "warning"
          : "error",
      message: `Simple query executed in ${responseTime}ms`,
      details: { responseTime },
    };
  } catch (error) {
    return {
      name: "Query Performance",
      status: "error",
      message: `Query failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      details: { error: String(error) },
    };
  }
}

async function checkDatabaseSize(): Promise<HealthCheck> {
  try {
    const result = await prisma.$queryRaw<Array<{ size: string }>>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;

    const size = result[0]?.size || "Unknown";

    return {
      name: "Database Size",
      status: "healthy",
      message: `Database size: ${size}`,
      details: { size },
    };
  } catch (error) {
    return {
      name: "Database Size",
      status: "warning",
      message: "Could not retrieve database size",
      details: { error: String(error) },
    };
  }
}

async function checkActiveConnections(): Promise<HealthCheck> {
  try {
    const result = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;

    const count = result[0]?.count || 0;
    const status = count < 50 ? "healthy" : count < 100 ? "warning" : "error";

    return {
      name: "Active Connections",
      status,
      message: `${count} active connections`,
      details: { count },
    };
  } catch (error) {
    return {
      name: "Active Connections",
      status: "warning",
      message: "Could not retrieve connection count",
      details: { error: String(error) },
    };
  }
}

async function checkIdleConnections(): Promise<HealthCheck> {
  try {
    const result = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database() 
      AND state = 'idle'
    `;

    const count = result[0]?.count || 0;
    const status = count < 20 ? "healthy" : count < 50 ? "warning" : "error";

    return {
      name: "Idle Connections",
      status,
      message: `${count} idle connections`,
      details: { count },
    };
  } catch (error) {
    return {
      name: "Idle Connections",
      status: "warning",
      message: "Could not retrieve idle connection count",
      details: { error: String(error) },
    };
  }
}

async function checkLongRunningQueries(): Promise<HealthCheck> {
  try {
    const result = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database() 
      AND state = 'active' 
      AND query_start < now() - interval '5 minutes'
    `;

    const count = result[0]?.count || 0;
    const status = count === 0 ? "healthy" : "warning";

    return {
      name: "Long Running Queries",
      status,
      message:
        count === 0
          ? "No long running queries"
          : `${count} queries running > 5 minutes`,
      details: { count },
    };
  } catch (error) {
    return {
      name: "Long Running Queries",
      status: "warning",
      message: "Could not check for long running queries",
      details: { error: String(error) },
    };
  }
}

async function checkConnectionString(): Promise<HealthCheck> {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    return {
      name: "Database URL",
      status: "error",
      message: "DATABASE_URL environment variable not set",
    };
  }

  // Check if connection string has pool settings
  const hasPoolSettings =
    dbUrl.includes("connection_limit") ||
    dbUrl.includes("pool_timeout") ||
    dbUrl.includes("connect_timeout");

  return {
    name: "Connection String",
    status: hasPoolSettings ? "healthy" : "warning",
    message: hasPoolSettings
      ? "Connection string includes pool settings"
      : "Connection string missing pool settings",
    details: {
      hasPoolSettings,
      urlPreview: dbUrl.substring(0, 50) + "...",
    },
  };
}

async function runAllChecks() {
  console.log("🔍 Running Database Health Checks...\n");

  // Run all checks
  healthChecks.push(await checkConnectionString());
  healthChecks.push(await checkDatabaseConnection());
  healthChecks.push(await checkQueryPerformance());
  healthChecks.push(await checkConnectionPool());
  healthChecks.push(await checkDatabaseSize());
  healthChecks.push(await checkActiveConnections());
  healthChecks.push(await checkIdleConnections());
  healthChecks.push(await checkLongRunningQueries());

  // Display results
  console.log("📊 Health Check Results:\n");

  let hasErrors = false;
  let hasWarnings = false;

  healthChecks.forEach(check => {
    const icon =
      check.status === "healthy"
        ? "✅"
        : check.status === "warning"
        ? "⚠️"
        : "❌";
    console.log(`${icon} ${check.name}: ${check.message}`);

    if (check.status === "error") hasErrors = true;
    if (check.status === "warning") hasWarnings = true;
  });

  console.log("\n" + "=".repeat(60) + "\n");

  if (hasErrors) {
    console.log("❌ Health check failed with errors!");
    console.log("\n💡 Recommendations:");
    console.log("1. Check your DATABASE_URL environment variable");
    console.log("2. Verify database server is accessible");
    console.log("3. Check database connection limits");
    console.log("4. Review application logs for connection errors");
    process.exit(1);
  } else if (hasWarnings) {
    console.log("⚠️  Health check completed with warnings");
    console.log("\n💡 Recommendations:");
    console.log("1. Review connection pool settings");
    console.log("2. Monitor database performance");
    console.log("3. Consider optimizing slow queries");
    process.exit(0);
  } else {
    console.log("✅ All health checks passed!");
    process.exit(0);
  }
}

// Run checks
runAllChecks()
  .catch(error => {
    console.error("❌ Health check script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
