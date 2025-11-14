import { NextRequest, NextResponse } from "next/server";
import lessonReminderService from "@/lib/lesson-reminder-service";

export async function GET(request: NextRequest) {
  try {

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

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}












