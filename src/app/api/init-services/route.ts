import { NextRequest, NextResponse } from "next/server";
import { initializeLessonReminderService } from "@/lib/startup";

export async function POST(request: NextRequest) {
  try {
    // Only allow initialization in production or when explicitly requested
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        success: true,
        message: "Services initialization skipped in development",
      });
    }

    // Initialize the lesson reminder service
    const success = await initializeLessonReminderService();

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Services initialized successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to initialize services",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error initializing services:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error initializing services",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to initialize services",
  });
}

