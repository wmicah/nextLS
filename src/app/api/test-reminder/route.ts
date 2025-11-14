/**
 * Test API endpoint to send a lesson reminder
 * This is for testing the reminder system
 */

import { NextRequest, NextResponse } from "next/server";
import { sendTestReminder } from "@/lib/test-reminder";

export async function POST(request: NextRequest) {
  try {
    const { clientEmail } = await request.json();

    if (!clientEmail) {
      return NextResponse.json(
        { success: false, message: "Client email is required" },
        { status: 400 }
      );
    }

    const result = await sendTestReminder(clientEmail);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send test reminder. Please try again.",
      },
      { status: 500 }
    );
  }
}
