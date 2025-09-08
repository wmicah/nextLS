import { useState, useEffect } from "react";

interface ThumbnailData {
  success: boolean;
  thumbnailUrl: string;
  thumbnailPath: string;
  error?: string;
}

export const useThumbnail = (
  filename: string,
  videoType: "master" | "local",
  isVideo: boolean,
  videoUrl?: string
) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filename || !isVideo) return;

    // Skip thumbnail generation for YouTube videos - they have their own thumbnails
    if (
      filename.includes("watch?v=") ||
      filename.includes("youtube.com") ||
      filename.includes("youtu.be")
    ) {
      return;
    }

    const generateThumbnail = async () => {
      try {
        setIsGenerating(true);
        setError(null);

        // For local videos, we need to handle UploadThing URLs differently
        const requestBody =
          videoType === "local" && videoUrl
            ? { filename, videoType, videoUrl }
            : { filename, videoType };

        const response = await fetch("/api/generate-thumbnail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error("Failed to generate thumbnail");
        }

        const data: ThumbnailData = await response.json();

        if (data.success) {
          setThumbnailUrl(data.thumbnailUrl);
        } else {
          // If FFmpeg is not available, don't throw an error
          // The component will show a fallback video icon
          if (data.error?.includes("FFmpeg not available")) {
            console.warn("FFmpeg not available, using fallback thumbnail");
            setThumbnailUrl(null); // This will trigger the fallback UI
          } else {
            throw new Error(data.error || "Thumbnail generation failed");
          }
        }
      } catch (err) {
        console.error("Thumbnail generation error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsGenerating(false);
      }
    };

    generateThumbnail();
  }, [filename, videoType, isVideo, videoUrl]);

  return {
    thumbnailUrl,
    isGenerating,
    error,
    regenerate: () => {
      setThumbnailUrl(null);
      setError(null);
      // Trigger regeneration by changing the dependency
      const newFilename = `${filename}?t=${Date.now()}`;
      setThumbnailUrl(null);
    },
  };
};
