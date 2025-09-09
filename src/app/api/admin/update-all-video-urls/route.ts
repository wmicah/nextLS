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

    console.log("Starting comprehensive video URL update...");

    let totalUpdated = 0;
    const results = {
      libraryResources: 0,
      programDrills: 0,
      routineExercises: 0,
    };

    // Update Library Resources
    const libraryResources = await db.libraryResource.findMany({
      where: {
        url: { startsWith: "secure://master-library/" },
      },
    });

    console.log(
      `Found ${libraryResources.length} library resources with old URLs`
    );

    for (const resource of libraryResources) {
      const oldUrl = resource.url;
      const filename = oldUrl.replace("secure://master-library/", "");
      const newUrl = `/api/master-video/${encodeURIComponent(filename)}`;

      await db.libraryResource.update({
        where: { id: resource.id },
        data: { url: newUrl },
      });

      console.log(`Updated library resource: ${oldUrl} -> ${newUrl}`);
      results.libraryResources++;
      totalUpdated++;
    }

    // Update Program Drills
    const programDrills = await db.programDrill.findMany({
      where: {
        videoUrl: { startsWith: "secure://master-library/" },
      },
    });

    console.log(`Found ${programDrills.length} program drills with old URLs`);

    for (const drill of programDrills) {
      const oldUrl = drill.videoUrl!;
      const filename = oldUrl.replace("secure://master-library/", "");
      const newUrl = `/api/master-video/${encodeURIComponent(filename)}`;

      await db.programDrill.update({
        where: { id: drill.id },
        data: { videoUrl: newUrl },
      });

      console.log(`Updated program drill: ${oldUrl} -> ${newUrl}`);
      results.programDrills++;
      totalUpdated++;
    }

    // Update Routine Exercises
    const routineExercises = await db.routineExercise.findMany({
      where: {
        videoUrl: { startsWith: "secure://master-library/" },
      },
    });

    console.log(
      `Found ${routineExercises.length} routine exercises with old URLs`
    );

    for (const exercise of routineExercises) {
      const oldUrl = exercise.videoUrl!;
      const filename = oldUrl.replace("secure://master-library/", "");
      const newUrl = `/api/master-video/${encodeURIComponent(filename)}`;

      await db.routineExercise.update({
        where: { id: exercise.id },
        data: { videoUrl: newUrl },
      });

      console.log(`Updated routine exercise: ${oldUrl} -> ${newUrl}`);
      results.routineExercises++;
      totalUpdated++;
    }

    console.log(
      `Comprehensive video URL update completed! Updated ${totalUpdated} total items.`
    );

    return NextResponse.json({
      message: "All video URLs updated successfully",
      totalUpdated,
      results,
    });
  } catch (error) {
    console.error("Error updating all video URLs:", error);
    return NextResponse.json(
      { error: "Failed to update video URLs" },
      { status: 500 }
    );
  }
}

