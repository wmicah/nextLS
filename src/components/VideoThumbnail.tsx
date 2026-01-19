import React, { useState, useCallback, memo } from "react";
import { isYouTubeUrl } from "@/lib/youtube-utils";
import { Play, Video, FileText } from "lucide-react";

interface VideoThumbnailProps {
  item: any;
  videoType: "master" | "local";
  className?: string;
}

// Use memo to prevent unnecessary re-renders
export const VideoThumbnail: React.FC<VideoThumbnailProps> = memo(({
  item,
  videoType,
  className = "h-28 lg:h-32",
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get the best available thumbnail without making API calls
  const getThumbnailUrl = useCallback((): string | null => {
    // 1. If item already has a thumbnail URL stored in DB, use it
    if (item.thumbnail && !item.thumbnail.includes("undefined")) {
      return item.thumbnail;
    }

    // 2. For YouTube videos, construct the thumbnail URL directly
    if (item.isYoutube && item.youtubeId) {
      // Use mqdefault (320x180) which loads faster than hqdefault
      return `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`;
    }

    // 3. For YouTube URLs without extracted ID
    if (item.url && isYouTubeUrl(item.url)) {
      const videoId = extractYouTubeId(item.url);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }

    return null;
  }, [item.thumbnail, item.isYoutube, item.youtubeId, item.url]);

  const thumbnailUrl = getThumbnailUrl();

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
  }, []);

  // If we have a thumbnail URL and no error, show the image
  if (thumbnailUrl && !imageError) {
    return (
      <div
        className={`${className} rounded-t-xl flex items-center justify-center overflow-hidden relative bg-[#1a1f1f]`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1f1f]">
            <div className="animate-pulse w-full h-full bg-[#2a2f2f]" />
          </div>
        )}
        <img
          src={thumbnailUrl}
          alt={item.title || "Video thumbnail"}
          className={`w-full h-full object-cover transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {/* Play icon overlay for videos */}
        {item.type === "video" && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-1" fill="white" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback for videos without thumbnails or documents
  return (
    <div
      className={`${className} rounded-t-xl flex items-center justify-center overflow-hidden relative bg-[#1a1f1f]`}
    >
      <div className="flex flex-col items-center gap-2 text-gray-400">
        {item.type === "video" ? (
          <>
            <Video className="h-8 w-8" style={{ color: "#ABA4AA" }} />
            <span className="text-xs">Video</span>
          </>
        ) : (
          <>
            <FileText className="h-8 w-8" style={{ color: "#ABA4AA" }} />
            <span className="text-xs">Document</span>
          </>
        )}
      </div>
    </div>
  );
});

VideoThumbnail.displayName = "VideoThumbnail";

// Helper function to extract YouTube video ID
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/watch\?.*v=([^&\s]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}
