import { NextRequest, NextResponse } from "next/server";
import lessonReminderService from "@/lib/lesson-reminder-service";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Manually starting lesson reminder service...");

    // Start the service
    lessonReminderService.start();

    // Wait a moment for it to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get status
    const status = lessonReminderService.getStatus();
    const health = lessonReminderService.getHealth();

    return NextResponse.json({
      success: true,
      message: "Lesson reminder service started",
      status,
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error starting lesson reminder service:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
