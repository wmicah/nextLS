import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";

export async function GET(req: NextRequest) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // All authenticated users (coaches) can access master library videos
    // No additional permission checks needed since all users are coaches

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // Security: Prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "master-library-videos"
    );
    const filePath = path.join(uploadDir, safeFilename);

    // Check if file exists
    try {
      await stat(filePath);
    } catch {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Read the video file
    const videoBuffer = await readFile(filePath);

    // Get file stats for range requests
    const fileStats = await stat(filePath);
    const fileSize = fileStats.size;

    // Handle range requests for video seeking
    const range = req.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const response = new NextResponse(videoBuffer.slice(start, end + 1), {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": "video/mp4",
          "Content-Disposition": "inline",
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      return response;
    }

    // Full file response
    const response = new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": fileSize.toString(),
        "Content-Disposition": "inline",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        Pragma: "no-cache",
        Expires: "0",
        "Accept-Ranges": "bytes",
      },
    });
    return response;
  } catch (error) {

    return NextResponse.json(
      { error: "Failed to stream video" },
      { status: 500 }
    );
  }
}
