import { NextRequest, NextResponse } from "next/server";
import lessonReminderService from "@/lib/lesson-reminder-service";

export async function POST(request: NextRequest) {
  try {

    // Start the service
    lessonReminderService.start();

    // Wait a moment for it to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get status
    const status = lessonReminderService.getStatus();
    const health = lessonReminderService.getHealth();

    return NextResponse.json({
      success: true,
      message: "Lesson reminder service initialized successfully",
      status,
      health,
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

export async function GET() {
  return NextResponse.json({
    message: "Use POST to initialize the lesson reminder service",
  });
}
