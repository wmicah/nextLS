import { NextRequest, NextResponse } from "next/server";
import lessonReminderService from "@/lib/lesson-reminder-service";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Manual test of lesson reminder service triggered");

    // Get current status
    const status = lessonReminderService.getStatus();

    // Manually trigger a check
    await lessonReminderService.manualCheck();

    return NextResponse.json({
      success: true,
      message: "Lesson reminder service test completed",
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error testing lesson reminder service:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}








