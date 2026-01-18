// NextLevel Coaching - Email Test API Route
// Test your email service configuration

import { NextRequest, NextResponse } from "next/server";
import { CompleteEmailService } from "@/lib/complete-email-service";

export async function POST(request: NextRequest) {
  try {
    const { testType, email, name, coachName } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    let result = false;
    let message = "";

    const emailService = CompleteEmailService.getInstance();

    switch (testType) {
      case "welcome":
        result = await emailService.sendWelcomeEmail(
          email,
          name || "Test Client",
          coachName || "Test Coach"
        );
        message = result
          ? "Welcome email sent successfully!"
          : "Failed to send welcome email";
        break;

      case "coach-notification":
        result = await emailService.sendNewClientRequest(
          email,
          coachName || "Test Coach",
          name || "Test Client",
          email
        );
        message = result
          ? "Coach notification sent successfully!"
          : "Failed to send coach notification";
        break;

      case "lesson-reminder":
        result = await emailService.sendLessonReminder(
          email,
          name || "Test Client",
          coachName || "Test Coach",
          "Tomorrow",
          "2:00 PM"
        );
        message = result
          ? "Lesson reminder sent successfully!"
          : "Failed to send lesson reminder";
        break;

      case "program-assignment":
        result = await emailService.sendProgramAssigned(
          email,
          name || "Test Client",
          coachName || "Test Coach",
          "Test Program"
        );
        message = result
          ? "Program assignment sent successfully!"
          : "Failed to send program assignment";
        break;

      case "lesson-scheduled":
        {
          // Create a test date for tomorrow at 7:00 PM in the user's timezone
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(19, 0, 0, 0); // 7:00 PM
          
          // Format the date and time
          const lessonDate = tomorrow.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const lessonTime = tomorrow.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          result = await emailService.sendLessonScheduled(
            email,
            name || "Test Client",
            coachName || "Test Coach",
            lessonDate,
            lessonTime
          );
          message = result
            ? "Lesson scheduled email sent successfully!"
            : "Failed to send lesson scheduled email";
        }
        break;

      case "test-config":
        result = await emailService.testEmailConfiguration();
        message = result
          ? "Email configuration test sent successfully!"
          : "Failed to send configuration test";
        break;

      default:
        return NextResponse.json(
          {
            error:
              "Invalid test type. Use: welcome, coach-notification, lesson-reminder, lesson-scheduled, program-assignment, or test-config",
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result,
      message,
      testType,
      email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {

    return NextResponse.json(
      {
        error: "Failed to test email service",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "NextLevel Coaching Email Test API",
    availableTests: [
      "welcome",
      "coach-notification",
      "lesson-reminder",
      "lesson-scheduled",
      "program-assignment",
      "test-config",
    ],
    usage: "POST with { testType, email, name?, coachName? }",
  });
}
