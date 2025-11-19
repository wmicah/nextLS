import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(request: NextRequest) {
  try {
    // Quick readiness check - just database connectivity
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ready",
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "not ready",
        timestamp: new Date().toISOString(),
        error: "Database not ready",
      },
      { status: 503 }
    );
  }
}
