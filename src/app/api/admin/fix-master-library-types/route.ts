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

    console.log("Starting master library type fix...");

    // Find all master library resources
    const masterResources = await db.libraryResource.findMany({
      where: {
        isMasterLibrary: true,
      },
    });

    console.log(`Found ${masterResources.length} master library resources`);

    let updatedCount = 0;
    const results = [];

    for (const resource of masterResources) {
      // Determine correct type based on contentType
      let correctType = "document"; // default

      if (resource.contentType && resource.contentType.startsWith("video/")) {
        correctType = "video";
      } else if (
        resource.contentType &&
        resource.contentType.startsWith("image/")
      ) {
        correctType = "image";
      } else if (
        resource.contentType &&
        resource.contentType.startsWith("audio/")
      ) {
        correctType = "audio";
      }

      // Only update if the type is different
      if (resource.type !== correctType) {
        await db.libraryResource.update({
          where: { id: resource.id },
          data: { type: correctType },
        });

        console.log(
          `Updated ${resource.title}: ${resource.type} -> ${correctType}`
        );
        results.push({
          id: resource.id,
          title: resource.title,
          oldType: resource.type,
          newType: correctType,
          contentType: resource.contentType,
        });
        updatedCount++;
      }
    }

    console.log(
      `Master library type fix completed! Updated ${updatedCount} resources.`
    );

    return NextResponse.json({
      message: "Master library types updated successfully",
      updatedCount,
      results,
    });
  } catch (error) {
    console.error("Error fixing master library types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

