import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";

export async function GET(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test database connection
    let dbTest: { success: boolean; error: string | null } = {
      success: false,
      error: null,
    };
    try {
      await db.user.findUnique({ where: { id: user.id } });
      dbTest = { success: true, error: null };
    } catch (error) {
      dbTest = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // Test environment variables
    const envTest = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      UPLOADTHING_SECRET: !!process.env.UPLOADTHING_SECRET,
      UPLOADTHING_APP_ID: !!process.env.UPLOADTHING_APP_ID,
      KINDE_CLIENT_ID: !!process.env.KINDE_CLIENT_ID,
      KINDE_CLIENT_SECRET: !!process.env.KINDE_CLIENT_SECRET,
      JWT_SECRET: !!process.env.JWT_SECRET,
    };

    // Get recent library resources
    let recentResources: Array<{
      id: string;
      title: string;
      type: string;
      url: string;
      createdAt: Date;
      isYoutube: boolean | null;
    }> = [];
    try {
      recentResources = await db.libraryResource.findMany({
        where: { coachId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          url: true,
          createdAt: true,
          isYoutube: true,
        },
      });
    } catch (error) {
      console.error("Error fetching recent resources:", error);
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      user: {
        id: user.id,
        email: user.email,
      },
      database: dbTest,
      environmentVariables: envTest,
      recentResources,
      vercel: {
        region: process.env.VERCEL_REGION,
        url: process.env.VERCEL_URL,
      },
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
