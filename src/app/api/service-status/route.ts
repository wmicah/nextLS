import { NextRequest, NextResponse } from "next/server";
import lessonReminderService from "@/lib/lesson-reminder-service";

export async function GET(request: NextRequest) {
  try {
    const status = lessonReminderService.getStatus();
    const health = lessonReminderService.getHealth();

    return NextResponse.json({
      success: true,
      service: {
        status,
        health,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting service status:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
