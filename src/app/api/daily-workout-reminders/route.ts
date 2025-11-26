import { NextRequest, NextResponse } from "next/server";
import dailyWorkoutReminderService from "@/lib/daily-workout-reminder-service";

export async function POST(request: NextRequest) {
  try {
    // Verify the request has a secret key to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Send daily workout reminders
    await dailyWorkoutReminderService.sendDailyWorkoutReminders();

    return NextResponse.json({
      success: true,
      message: "Daily workout reminders processed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in daily workout reminder API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: "Daily workout reminder system is running",
    timestamp: new Date().toISOString(),
    instructions: "Use POST with ?secret=YOUR_SECRET to trigger reminders",
  });
}

