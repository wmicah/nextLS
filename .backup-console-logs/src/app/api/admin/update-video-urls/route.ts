import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";

export async function POST(req: NextRequest) {
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
    const resources = await db.libraryResource.findMany({
      where: {
        url: {
          startsWith: "secure://master-library/",
        },
      },
    });

    let updatedCount = 0;

    for (const resource of resources) {
      // Extract filename from the old URL
      const oldUrl = resource.url;
      const filename = oldUrl.replace("secure://master-library/", "");

      // Create new URL
      const newUrl = `/api/master-video/${encodeURIComponent(filename)}`;

      // Update the resource
      await db.libraryResource.update({
        where: { id: resource.id },
        data: { url: newUrl },
      });

      updatedCount++;
    }

    return NextResponse.json({
      message: "Video URLs updated successfully",
      updatedCount,
    });
  } catch (error) {

    return NextResponse.json(
      { error: "Failed to update video URLs" },
      { status: 500 }
    );
  }
}

