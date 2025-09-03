import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string; filename: string } }
) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, filename } = params;

    if (!type || !filename) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Determine the thumbnail directory based on type
    let thumbnailDir: string;
    
    if (type === "master") {
      thumbnailDir = path.join(process.cwd(), "uploads", "master-library-thumbnails");
    } else {
      thumbnailDir = path.join(process.cwd(), "uploads", "library-thumbnails");
    }

    const thumbnailPath = path.join(thumbnailDir, filename);

    // Read the thumbnail file
    const thumbnailBuffer = await readFile(thumbnailPath);

    // Return the image with appropriate headers
    return new NextResponse(thumbnailBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "Content-Length": thumbnailBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Thumbnail serving error:", error);
    return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 });
  }
}
