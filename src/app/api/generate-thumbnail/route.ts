import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, videoType } = await req.json();

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Determine the video directory based on type
    let videoDir: string;
    let thumbnailDir: string;
    
    if (videoType === "master") {
      videoDir = path.join(process.cwd(), "uploads", "master-library-videos");
      thumbnailDir = path.join(process.cwd(), "uploads", "master-library-thumbnails");
    } else {
      videoDir = path.join(process.cwd(), "uploads", "library-videos");
      thumbnailDir = path.join(process.cwd(), "uploads", "library-thumbnails");
    }

    // Create thumbnail directory if it doesn't exist
    await fs.mkdir(thumbnailDir, { recursive: true });

    const videoPath = path.join(videoDir, filename);
    const thumbnailFilename = `${path.parse(filename).name}_thumb.jpg`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

    // Check if video exists
    try {
      await fs.access(videoPath);
    } catch {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Check if thumbnail already exists
    try {
      await fs.access(thumbnailPath);
      // Thumbnail already exists, return the path
      const thumbnailUrl = `/api/thumbnail/${videoType}/${thumbnailFilename}`;
      return NextResponse.json({ 
        success: true, 
        thumbnailUrl,
        thumbnailPath: thumbnailFilename
      });
    } catch {
      // Thumbnail doesn't exist, generate it
    }

    // Generate thumbnail using ffmpeg
    return new Promise((resolve) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i", videoPath,
        "-ss", "00:00:01", // Extract frame at 1 second
        "-vframes", "1",
        "-vf", "scale=320:180", // Scale to 16:9 aspect ratio
        "-q:v", "2", // High quality
        thumbnailPath,
        "-y" // Overwrite if exists
      ]);

      ffmpeg.on("close", async (code) => {
        if (code === 0) {
          try {
            // Check if thumbnail was created
            await fs.access(thumbnailPath);
            
            const thumbnailUrl = `/api/thumbnail/${videoType}/${thumbnailFilename}`;
            
            resolve(NextResponse.json({ 
              success: true, 
              thumbnailUrl,
              thumbnailPath: thumbnailFilename
            }));
          } catch (error) {
            resolve(NextResponse.json({ 
              error: "Failed to create thumbnail" 
            }, { status: 500 }));
          }
        } else {
          resolve(NextResponse.json({ 
            error: "FFmpeg failed to generate thumbnail" 
          }, { status: 500 }));
        }
      });

      ffmpeg.on("error", (error) => {
        resolve(NextResponse.json({ 
          error: "FFmpeg not available or failed" 
        }, { status: 500 }));
      });

      // Set timeout
      setTimeout(() => {
        ffmpeg.kill();
        resolve(NextResponse.json({ 
          error: "Thumbnail generation timeout" 
        }, { status: 500 }));
      }, 30000); // 30 second timeout
    });

  } catch (error) {
    console.error("Thumbnail generation error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
