import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Not an admin" },
        { status: 403 }
      );
    }

    // Find all library resources with secure://master-library URLs
    const oldUrls = await db.libraryResource.findMany({
      where: {
        url: {
          startsWith: "secure://master-library/",
        },
      },
      select: {
        id: true,
        title: true,
        url: true,
        filename: true,
      },
    });

    // Find all library resources with new URLs
    const newUrls = await db.libraryResource.findMany({
      where: {
        url: {
          startsWith: "/api/master-video/",
        },
      },
      select: {
        id: true,
        title: true,
        url: true,
        filename: true,
      },
    });

    return NextResponse.json({
      oldUrls: oldUrls,
      newUrls: newUrls,
      oldCount: oldUrls.length,
      newCount: newUrls.length,
    });
  } catch (error) {

    return NextResponse.json(
      { error: "Failed to check URLs" },
      { status: 500 }
    );
  }
}

