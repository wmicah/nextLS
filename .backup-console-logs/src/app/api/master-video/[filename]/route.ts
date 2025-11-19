import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Decode the filename in case it has special characters
    const decodedFilename = decodeURIComponent(filename);

    // Security check: prevent directory traversal
    if (
      decodedFilename.includes("..") ||
      decodedFilename.includes("/") ||
      decodedFilename.includes("\\")
    ) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Additional security: only allow video file extensions
    const allowedExtensions = [
      ".mp4",
      ".webm",
      ".avi",
      ".mov",
      ".wmv",
      ".mkv",
      ".flv",
    ];
    const ext = path.extname(decodedFilename).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Check if user is authenticated (either coach or client)
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists in database
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Construct file path
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "master-library-videos",
      decodedFilename
    );

    try {
      // Read the file
      const fileBuffer = await readFile(filePath);

      // Determine content type based on file extension
      const ext = path.extname(decodedFilename).toLowerCase();
      let contentType = "video/mp4"; // default

      switch (ext) {
        case ".mp4":
          contentType = "video/mp4";
          break;
        case ".webm":
          contentType = "video/webm";
          break;
        case ".avi":
          contentType = "video/x-msvideo";
          break;
        case ".mov":
          contentType = "video/quicktime";
          break;
        case ".wmv":
          contentType = "video/x-ms-wmv";
          break;
        default:
          contentType = "video/mp4";
      }

      // Return the file with appropriate headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "public, max-age=31536000", // Cache for 1 year
          "Accept-Ranges": "bytes",
        },
      });
    } catch (fileError) {
      console.error("Error reading file:", fileError);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error serving master video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
