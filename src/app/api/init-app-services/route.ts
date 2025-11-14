import { NextRequest, NextResponse } from "next/server";
import appStartupService from "@/lib/app-startup";

export async function POST(request: NextRequest) {
  try {

    await appStartupService.initializeServices();

    const status = appStartupService.getStatus();

    return NextResponse.json({
      success: true,
      message: "App services initialized successfully",
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

export async function GET() {
  const status = appStartupService.getStatus();

  return NextResponse.json({
    message: "App services status",
    status,
    timestamp: new Date().toISOString(),
  });
}
