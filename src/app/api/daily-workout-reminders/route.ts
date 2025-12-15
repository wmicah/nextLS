import { NextRequest, NextResponse } from "next/server";
import dailyWorkoutReminderService from "@/lib/daily-workout-reminder-service";

export async function POST(request: NextRequest) {
  try {
    // Verify the request has a secret key to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.CRON_SECRET) {
      console.error("❌ Unauthorized request to daily workout reminders API");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY not configured");
      return NextResponse.json(
        { 
          error: "Email service not configured",
          message: "RESEND_API_KEY environment variable is not set"
        },
        { status: 503 }
      );
    }

    console.log("📧 Starting daily workout reminder process...");
    console.log(`   RESEND_API_KEY configured: ${process.env.RESEND_API_KEY ? "Yes" : "No"}`);
    console.log(`   From email: NextLevel Coaching <noreply@nxlvlcoach.com>`);

    // Send daily workout reminders
    await dailyWorkoutReminderService.sendDailyWorkoutReminders();

    return NextResponse.json({
      success: true,
      message: "Daily workout reminders processed",
      timestamp: new Date().toISOString(),
      resendConfigured: !!process.env.RESEND_API_KEY,
    });
  } catch (error) {
    console.error("❌ Error in daily workout reminder API:", error);
    if (error instanceof Error) {
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error stack: ${error.stack}`);
    }
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

