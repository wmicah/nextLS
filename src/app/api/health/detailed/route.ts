import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Detailed health checks
    const checks = {
      database: await checkDatabase(),
      environment: checkEnvironment(),
      dependencies: checkDependencies(),
      system: checkSystemResources(),
    };

    const allHealthy = Object.values(checks).every(
      check => check.status === "healthy"
    );

    const response = {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
      responseTime: Date.now() - startTime,
    };

    return NextResponse.json(response, {
      status: allHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Detailed health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Health check failed",
        responseTime: Date.now() - startTime,
      },
      { status: 503 }
    );
  }
}

async function checkDatabase() {
  try {
    const start = Date.now();

    // Test basic connectivity
    await db.$queryRaw`SELECT 1`;
    const basicTime = Date.now() - start;

    // Test a more complex query
    const complexStart = Date.now();
    await db.user.count();
    const complexTime = Date.now() - complexStart;

    return {
      status: "healthy",
      responseTime: {
        basic: basicTime,
        complex: complexTime,
      },
      message: "Database connection successful",
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: (error as Error).message,
      message: "Database connection failed",
    };
  }
}

function checkEnvironment() {
  const requiredEnvVars = ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  return {
    status: missing.length === 0 ? "healthy" : "unhealthy",
    missing: missing,
    message:
      missing.length === 0
        ? "All required environment variables present"
        : `Missing: ${missing.join(", ")}`,
  };
}

function checkDependencies() {
  // Check if critical dependencies are available
  const dependencies = {
    prisma: typeof db !== "undefined",
    nextjs: typeof process !== "undefined",
  };

  const allAvailable = Object.values(dependencies).every(Boolean);

  return {
    status: allAvailable ? "healthy" : "unhealthy",
    available: dependencies,
    message: allAvailable
      ? "All dependencies available"
      : "Some dependencies missing",
  };
}

function checkSystemResources() {
  const memoryUsage = process.memoryUsage();
  const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const memoryUsagePercent = (memoryUsedMB / memoryTotalMB) * 100;

  // Consider unhealthy if memory usage is over 90%
  const memoryHealthy = memoryUsagePercent < 90;

  return {
    status: memoryHealthy ? "healthy" : "warning",
    memory: {
      used: memoryUsedMB,
      total: memoryTotalMB,
      percentage: Math.round(memoryUsagePercent),
    },
    uptime: process.uptime(),
    platform: process.platform,
    nodeVersion: process.version,
    message: memoryHealthy
      ? "System resources healthy"
      : "High memory usage detected",
  };
}
