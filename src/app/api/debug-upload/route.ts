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

    // Get user role information
    let userRole = null;
    try {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true, isAdmin: true, name: true },
      });
      userRole = dbUser;
    } catch (error) {
      console.error("Error fetching user role:", error);
    }

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

    // Test the library list query with different filters
    let libraryListTest: {
      all: Array<{
        id: string;
        title: string;
        type: string;
        createdAt: Date;
      }> | null;
      video: Array<{
        id: string;
        title: string;
        type: string;
        createdAt: Date;
      }> | null;
      document: Array<{
        id: string;
        title: string;
        type: string;
        createdAt: Date;
      }> | null;
      error: string | null;
    } = {
      all: null,
      video: null,
      document: null,
      error: null,
    };
    try {
      // Test with no type filter (should show all)
      libraryListTest.all = await db.libraryResource.findMany({
        where: { coachId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, type: true, createdAt: true },
      });

      // Test with video filter
      libraryListTest.video = await db.libraryResource.findMany({
        where: { coachId: user.id, type: "video" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, type: true, createdAt: true },
      });

      // Test with document filter
      libraryListTest.document = await db.libraryResource.findMany({
        where: { coachId: user.id, type: "document" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, type: true, createdAt: true },
      });
    } catch (error) {
      libraryListTest.error =
        error instanceof Error ? error.message : "Unknown error";
    }

    // Test database connection stability
    let dbStabilityTest: {
      connectionTime: number;
      queryTime: number;
      error: string | null;
    } = {
      connectionTime: 0,
      queryTime: 0,
      error: null,
    };

    try {
      const startTime = Date.now();
      await db.$queryRaw`SELECT 1`;
      dbStabilityTest.connectionTime = Date.now() - startTime;

      const queryStartTime = Date.now();
      await db.libraryResource.count({ where: { coachId: user.id } });
      dbStabilityTest.queryTime = Date.now() - queryStartTime;
    } catch (error) {
      dbStabilityTest.error =
        error instanceof Error ? error.message : "Unknown error";
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
      },
      database: dbTest,
      databaseStability: dbStabilityTest,
      environmentVariables: envTest,
      recentResources,
      libraryListTest,
      vercel: {
        region: process.env.VERCEL_REGION,
        url: process.env.VERCEL_URL,
        functionTimeout: process.env.VERCEL_FUNCTION_TIMEOUT,
        memoryLimit: process.env.VERCEL_FUNCTION_MEMORY,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
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
