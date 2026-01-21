import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

/**
 * Automatic message cleanup cron job
 * Runs daily to clean up old messages older than 3 months (90 days)
 * System-wide retention policy to prevent database space issues
 * 
 * Schedule: Daily at 2 AM UTC (configured in vercel.json)
 * Retention: Hard-set to 90 days for all coaches
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request has a secret key to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.CRON_SECRET) {
      console.error("❌ Unauthorized request to message cleanup API");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🧹 Starting automatic message cleanup process...");

    // Hard-set retention to 3 months (90 days) for all coaches
    const RETENTION_DAYS = 90;

    // Get all coaches
    const coaches = await db.user.findMany({
      where: {
        role: "COACH",
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (coaches.length === 0) {
      console.log("ℹ️ No coaches found");
      return NextResponse.json({
        success: true,
        coachesProcessed: 0,
        totalDeleted: 0,
        message: "No coaches found",
      });
    }

    // Calculate retention threshold (90 days ago)
    const retentionThreshold = new Date();
    retentionThreshold.setDate(
      retentionThreshold.getDate() - RETENTION_DAYS
    );

    let totalDeleted = 0;
    const results = [];

    // Process each coach
    for (const coach of coaches) {

      // Find all conversations for this coach
      const conversations = await db.conversation.findMany({
        where: {
          coachId: coach.id,
        },
        select: { id: true },
      });

      if (conversations.length === 0) {
        results.push({
          coachId: coach.id,
          coachEmail: coach.email,
          deletedCount: 0,
          message: "No conversations found",
        });
        continue;
      }

      // Delete old messages
      const result = await db.message.deleteMany({
        where: {
          conversationId: {
            in: conversations.map(c => c.id),
          },
          createdAt: {
            lt: retentionThreshold,
          },
        },
      });

      totalDeleted += result.count;
      results.push({
        coachId: coach.id,
        coachEmail: coach.email,
        deletedCount: result.count,
        retentionDays: RETENTION_DAYS,
      });

      if (result.count > 0) {
        console.log(
          `   ✅ Coach ${coach.email}: Deleted ${result.count} messages older than ${RETENTION_DAYS} days`
        );
      }
    }

    console.log(
      `✅ Message cleanup completed: ${totalDeleted} messages deleted across ${coaches.length} coaches (retention: ${RETENTION_DAYS} days)`
    );

    return NextResponse.json({
      success: true,
      coachesProcessed: coaches.length,
      totalDeleted,
      retentionDays: RETENTION_DAYS,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("❌ Error in message cleanup API:", error);
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
    message: "Message cleanup cron endpoint",
    method: "POST",
    note: "This endpoint should be called by Vercel Cron with a secret parameter",
  });
}

