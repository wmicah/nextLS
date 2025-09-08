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

    // Check library resources
    const libraryResources = await db.libraryResource.findMany({
      where: {
        OR: [
          { url: { startsWith: "secure://master-library/" } },
          { url: { startsWith: "/api/master-video/" } },
        ],
      },
      select: {
        id: true,
        title: true,
        url: true,
        filename: true,
        isMasterLibrary: true,
      },
    });

    // Check program drills
    const programDrills = await db.programDrill.findMany({
      where: {
        OR: [
          { videoUrl: { startsWith: "secure://master-library/" } },
          { videoUrl: { startsWith: "/api/master-video/" } },
        ],
      },
      select: {
        id: true,
        title: true,
        videoUrl: true,
      },
    });

    // Check routine exercises
    const routineExercises = await db.routineExercise.findMany({
      where: {
        OR: [
          { videoUrl: { startsWith: "secure://master-library/" } },
          { videoUrl: { startsWith: "/api/master-video/" } },
        ],
      },
      select: {
        id: true,
        title: true,
        videoUrl: true,
        routineId: true,
      },
    });

    return NextResponse.json({
      libraryResources: {
        total: libraryResources.length,
        oldUrls: libraryResources.filter(r =>
          r.url.startsWith("secure://master-library/")
        ),
        newUrls: libraryResources.filter(r =>
          r.url.startsWith("/api/master-video/")
        ),
        items: libraryResources,
      },
      programDrills: {
        total: programDrills.length,
        oldUrls: programDrills.filter(d =>
          d.videoUrl?.startsWith("secure://master-library/")
        ),
        newUrls: programDrills.filter(d =>
          d.videoUrl?.startsWith("/api/master-video/")
        ),
        items: programDrills,
      },
      routineExercises: {
        total: routineExercises.length,
        oldUrls: routineExercises.filter(e =>
          e.videoUrl?.startsWith("secure://master-library/")
        ),
        newUrls: routineExercises.filter(e =>
          e.videoUrl?.startsWith("/api/master-video/")
        ),
        items: routineExercises,
      },
    });
  } catch (error) {
    console.error("Error debugging URLs:", error);
    return NextResponse.json(
      { error: "Failed to debug URLs" },
      { status: 500 }
    );
  }
}
