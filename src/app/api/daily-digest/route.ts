import { NextRequest, NextResponse } from "next/server";
import dailyDigestService from "@/lib/daily-digest-service";

export async function POST(request: NextRequest) {
  try {
    console.log("📧 Manual daily digest trigger");

    await dailyDigestService.manualDigest();

    return NextResponse.json({
      success: true,
      message: "Daily digest emails sent successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error sending daily digest:", error);
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
    message: "Use POST to trigger daily digest emails",
  });
}
