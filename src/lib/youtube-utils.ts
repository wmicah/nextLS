/**
 * YouTube URL utilities for consistent handling across the application
 */

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/embed/VIDEO_ID
 * - https://youtube.com/v/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID (YouTube Shorts)
 * - https://youtube.com/shorts/VIDEO_ID (YouTube Shorts)
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // Comprehensive regex for all YouTube URL formats including Shorts
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(youtubeRegex);
  return match ? match[1] : null;
}

/**
 * Checks if a URL is a YouTube URL (including Shorts)
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return url.includes("youtube.com") || url.includes("youtu.be");
}

/**
 * Checks if a URL is a YouTube Shorts URL
 */
export function isYouTubeShortsUrl(url: string): boolean {
  if (!url) return false;
  return url.includes("youtube.com/shorts/") || url.includes("youtu.be/");
}

/**
 * Converts YouTube Shorts URL to regular YouTube watch URL
 */
export function convertShortsToWatchUrl(url: string): string | null {
  if (!isYouTubeShortsUrl(url)) return null;

  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Gets the YouTube embed URL for a video ID
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  autoplay: boolean = false
): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    rel: "0",
    disablekb: "1",
    modestbranding: "1",
    showinfo: "0",
    controls: "1",
    fs: "1",
    cc_load_policy: "0",
    iv_load_policy: "3",
    autohide: "0",
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Gets the YouTube thumbnail URL for a video ID
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: "default" | "medium" | "high" | "standard" | "maxres" = "high"
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

/**
 * Processes a video URL and returns YouTube information if applicable
 */
export function processVideoUrl(url: string): {
  isYouTube: boolean;
  youtubeId: string | null;
  embedUrl: string | null;
} {
  const isYouTube = isYouTubeUrl(url);
  const youtubeId = isYouTube ? extractYouTubeId(url) : null;
  const embedUrl = youtubeId ? getYouTubeEmbedUrl(youtubeId) : null;

  return {
    isYouTube,
    youtubeId,
    embedUrl,
  };
}
