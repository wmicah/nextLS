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
    const { filename, videoType, videoUrl } = await req.json();

    console.log("Thumbnail generation request:", {
      filename,
      videoType,
      hasVideoUrl: !!videoUrl,
    });

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // Skip thumbnail generation for YouTube videos
    if (
      filename.includes("watch?v=") ||
      filename.includes("youtube.com") ||
      filename.includes("youtu.be")
    ) {
      console.log("Skipping thumbnail generation for YouTube video:", filename);
      return NextResponse.json({
        success: false,
        error: "YouTube videos don't need thumbnail generation",
      });
    }

    // Determine the video directory based on type
    let videoDir: string;
    let thumbnailDir: string;
    let videoPath: string;

    if (videoType === "master") {
      videoDir = path.join(process.cwd(), "uploads", "master-library-videos");
      thumbnailDir = path.join(
        process.cwd(),
        "uploads",
        "master-library-thumbnails"
      );
      videoPath = path.join(videoDir, filename);
    } else {
      // For local videos, we need to handle UploadThing URLs
      if (!videoUrl) {
        return NextResponse.json(
          { error: "Video URL is required for local videos" },
          { status: 400 }
        );
      }

      videoDir = path.join(process.cwd(), "uploads", "temp-videos");
      thumbnailDir = path.join(process.cwd(), "uploads", "library-thumbnails");

      // Create temp directory if it doesn't exist
      await fs.mkdir(videoDir, { recursive: true });

      // Download video from UploadThing to temp directory
      try {
        const response = await fetch(videoUrl);
        if (!response.ok) {
          return NextResponse.json(
            { error: "Failed to download video from UploadThing" },
            { status: 500 }
          );
        }

        const videoBuffer = await response.arrayBuffer();
        // Sanitize filename to remove invalid characters for Windows file paths
        const sanitizedFilename = filename.replace(/[<>:"/\\|?*]/g, "_");
        const tempFilename = `temp_${Date.now()}_${sanitizedFilename}`;
        videoPath = path.join(videoDir, tempFilename);

        await fs.writeFile(videoPath, Buffer.from(videoBuffer));
      } catch (downloadError) {
        console.error(
          "Error downloading video from UploadThing:",
          downloadError
        );
        return NextResponse.json(
          { error: "Failed to download video from UploadThing" },
          { status: 500 }
        );
      }
    }

    // Create thumbnail directory if it doesn't exist
    await fs.mkdir(thumbnailDir, { recursive: true });

    // Sanitize filename for thumbnail generation
    const sanitizedFilename = filename.replace(/[<>:"/\\|?*]/g, "_");
    const thumbnailFilename = `${path.parse(sanitizedFilename).name}_thumb.jpg`;
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
        thumbnailPath: thumbnailFilename,
      });
    } catch {
      // Thumbnail doesn't exist, generate it
    }

    // Generate thumbnail using ffmpeg
    return new Promise(resolve => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        videoPath,
        "-ss",
        "00:00:01", // Extract frame at 1 second
        "-vframes",
        "1",
        "-vf",
        "scale=320:180", // Scale to 16:9 aspect ratio
        "-q:v",
        "2", // High quality
        thumbnailPath,
        "-y", // Overwrite if exists
      ]);

      ffmpeg.on("close", async code => {
        if (code === 0) {
          try {
            // Check if thumbnail was created
            await fs.access(thumbnailPath);

            const thumbnailUrl = `/api/thumbnail/${videoType}/${thumbnailFilename}`;

            // Clean up temporary video file if it was downloaded from UploadThing
            if (videoType === "local" && videoPath.includes("temp_")) {
              try {
                await fs.access(videoPath);
                await fs.unlink(videoPath);
              } catch (cleanupError) {
                if (cleanupError.code !== "ENOENT") {
                  console.warn(
                    "Failed to cleanup temp video file:",
                    cleanupError
                  );
                }
              }
            }

            resolve(
              NextResponse.json({
                success: true,
                thumbnailUrl,
                thumbnailPath: thumbnailFilename,
              })
            );
          } catch (error) {
            // Clean up temporary video file on error
            if (videoType === "local" && videoPath.includes("temp_")) {
              try {
                await fs.access(videoPath);
                await fs.unlink(videoPath);
              } catch (cleanupError) {
                if (cleanupError.code !== "ENOENT") {
                  console.warn(
                    "Failed to cleanup temp video file on error:",
                    cleanupError
                  );
                }
              }
            }

            resolve(
              NextResponse.json(
                {
                  error: "Failed to create thumbnail",
                },
                { status: 500 }
              )
            );
          }
        } else {
          // Clean up temporary video file on FFmpeg error
          if (videoType === "local" && videoPath.includes("temp_")) {
            try {
              await fs.access(videoPath);
              await fs.unlink(videoPath);
            } catch (cleanupError) {
              if (cleanupError.code !== "ENOENT") {
                console.warn(
                  "Failed to cleanup temp video file on FFmpeg error:",
                  cleanupError
                );
              }
            }
          }

          resolve(
            NextResponse.json(
              {
                error: "FFmpeg failed to generate thumbnail",
              },
              { status: 500 }
            )
          );
        }
      });

      ffmpeg.on("error", async error => {
        // Clean up temporary video file on FFmpeg error
        if (videoType === "local" && videoPath.includes("temp_")) {
          try {
            await fs.access(videoPath);
            await fs.unlink(videoPath);
          } catch (cleanupError) {
            if (cleanupError.code !== "ENOENT") {
              console.warn(
                "Failed to cleanup temp video file on FFmpeg error:",
                cleanupError
              );
            }
          }
        }

        // If FFmpeg is not available, return a fallback response
        // The frontend will handle this by showing a default video icon
        resolve(
          NextResponse.json({
            success: false,
            error: "FFmpeg not available - using fallback thumbnail",
          })
        );
      });

      // Set timeout
      setTimeout(async () => {
        ffmpeg.kill();

        // Clean up temporary video file on timeout
        if (videoType === "local" && videoPath.includes("temp_")) {
          try {
            // Check if file exists before trying to delete it
            await fs.access(videoPath);
            await fs.unlink(videoPath);
          } catch (cleanupError) {
            // Only log if it's not a "file not found" error
            if (cleanupError.code !== "ENOENT") {
              console.warn(
                "Failed to cleanup temp video file on timeout:",
                cleanupError
              );
            }
          }
        }

        resolve(
          NextResponse.json(
            {
              error: "Thumbnail generation timeout",
            },
            { status: 500 }
          )
        );
      }, 30000); // 30 second timeout
    });
  } catch (error) {
    console.error("Thumbnail generation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
