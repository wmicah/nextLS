import { NextRequest, NextResponse } from "next/server";
import lessonReminderService from "@/lib/lesson-reminder-service";

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    // Get lesson reminder service health
    const reminderServiceHealth = lessonReminderService.getHealth();

    const healthData = {
      status: "healthy",
      timestamp: now.toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      services: {
        lessonReminders: reminderServiceHealth,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      },
    };

    // Determine overall health status
    const isHealthy = reminderServiceHealth.isProductionReady;
    const statusCode = isHealthy ? 200 : 503; // 503 Service Unavailable if reminders not ready

    return NextResponse.json(healthData, { status: statusCode });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Health check for load balancers (simple ping)
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
