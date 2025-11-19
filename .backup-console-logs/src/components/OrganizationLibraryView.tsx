"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/app/_trpc/client";
import { extractYouTubeId, getYouTubeThumbnailUrl } from "@/lib/youtube-utils";
import { Button } from "@/components/ui/button";
import { Video, User, Filter, Grid3x3, List, Play, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useThumbnail } from "@/hooks/useThumbnail";
import VideoViewerModal from "./VideoViewerModal";

// Helper function to extract YouTube video ID
// Helper function to get YouTube thumbnail URL
const getYouTubeThumbnail = (url: string): string | null => {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return getYouTubeThumbnailUrl(videoId, "medium");
};

export default function OrganizationLibraryView() {
  const [selectedCoach, setSelectedCoach] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const { data: organization, isLoading: orgLoading } =
    trpc.organization.get.useQuery(undefined, {
      staleTime: 5 * 60 * 1000,
    });
  const { data: allVideos = [], isLoading: videosLoading } =
    trpc.organization.getOrganizationLibrary.useQuery(undefined, {
      enabled: !!organization?.id,
      staleTime: 2 * 60 * 1000, // Cache library for 2 minutes
    });

  const isLoading = orgLoading || videosLoading;

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allVideos.forEach((video: any) => {
      if (video.category) cats.add(video.category);
    });
    return Array.from(cats).sort();
  }, [allVideos]);

  // Filter videos
  const filteredVideos = useMemo(() => {
    return allVideos.filter((video: any) => {
      const matchesCoach =
        selectedCoach === "all" || video.coachId === selectedCoach;
      const matchesCategory =
        selectedCategory === "all" || video.category === selectedCategory;
      return matchesCoach && matchesCategory;
    });
  }, [allVideos, selectedCoach, selectedCategory]);

  // Group videos by coach
  const videosByCoach = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    filteredVideos.forEach((video: any) => {
      const coachName = video.coach?.name || "Unknown Coach";
      if (!grouped[coachName]) {
        grouped[coachName] = [];
      }
      grouped[coachName].push(video);
    });
    return grouped;
  }, [filteredVideos]);

  const handleVideoClick = (video: any, index: number) => {
    // Prepare video data for the modal
    const videoData = {
      ...video,
      isYoutube:
        video.filename?.includes("youtube") ||
        video.filename?.includes("youtu.be") ||
        video.isYoutube ||
        video.url?.includes("youtube"),
      youtubeId: extractYouTubeId(video.url || video.filename || ""),
    };
    setCurrentVideoIndex(index);
    setSelectedVideo(videoData);
    setIsVideoModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  const handlePreviousVideo = () => {
    if (currentVideoIndex > 0) {
      const newIndex = currentVideoIndex - 1;
      const video = filteredVideos[newIndex];
      const videoData = {
        ...video,
        isYoutube:
          video.filename?.includes("youtube") ||
          video.filename?.includes("youtu.be") ||
          video.isYoutube ||
          video.url?.includes("youtube"),
        youtubeId: extractYouTubeId(video.url || video.filename || ""),
      };
      setCurrentVideoIndex(newIndex);
      setSelectedVideo(videoData);
    }
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < filteredVideos.length - 1) {
      const newIndex = currentVideoIndex + 1;
      const video = filteredVideos[newIndex];
      const videoData = {
        ...video,
        isYoutube:
          video.filename?.includes("youtube") ||
          video.filename?.includes("youtu.be") ||
          video.isYoutube ||
          video.url?.includes("youtube"),
        youtubeId: extractYouTubeId(video.url || video.filename || ""),
      };
      setCurrentVideoIndex(newIndex);
      setSelectedVideo(videoData);
    }
  };

  if (!organization) return null;

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* Compact Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div>
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: "#C3BCC2" }}
          >
            Organization Library
          </h1>
          <p className="text-xs" style={{ color: "#ABA4AA" }}>
            {filteredVideos.length} videos from {organization.coaches.length}{" "}
            coaches
          </p>
        </div>

        {/* Compact inline filters */}
        <div className="flex items-center gap-2">
          <Select value={selectedCoach} onValueChange={setSelectedCoach}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="All Coaches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Coaches</SelectItem>
              {organization.coaches.map((coach: any) => (
                <SelectItem key={coach.id} value={coach.id}>
                  {coach.name || coach.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div
            className="flex gap-1 border rounded-md p-0.5"
            style={{ borderColor: "#606364" }}
          >
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "#4A5A70" }}
          />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl border"
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#606364",
          }}
        >
          <Video
            className="h-12 w-12 mx-auto mb-4"
            style={{ color: "#606364" }}
          />
          <p style={{ color: "#ABA4AA" }}>No videos found</p>
        </div>
      ) : viewMode === "grid" ? (
        // Grid View - Grouped by Coach
        <div className="space-y-4">
          {Object.entries(videosByCoach).map(([coachName, videos]) => (
            <div key={coachName}>
              <div className="flex items-center gap-2 mb-2 px-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                  }}
                >
                  <User className="h-3 w-3" style={{ color: "#C3BCC2" }} />
                </div>
                <h2 className="text-sm font-bold" style={{ color: "#C3BCC2" }}>
                  {coachName}
                </h2>
                <span className="text-xs" style={{ color: "#ABA4AA" }}>
                  ({videos.length})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {videos.map((video: any) => {
                  const videoIndex = filteredVideos.findIndex(
                    v => v.id === video.id
                  );
                  return (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onClick={() => handleVideoClick(video, videoIndex)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div
          className="rounded-xl border"
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#606364",
          }}
        >
          <div className="divide-y" style={{ borderColor: "#606364" }}>
            {filteredVideos.map((video: any, index: number) => (
              <VideoListItem
                key={video.id}
                video={video}
                onClick={() => handleVideoClick(video, index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Video Viewer Modal */}
      <VideoViewerModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseModal}
        item={selectedVideo}
        currentIndex={currentVideoIndex}
        totalItems={filteredVideos.length}
        onPrevious={handlePreviousVideo}
        onNext={handleNextVideo}
        libraryItems={filteredVideos}
      />
    </div>
  );
}

// Video Card Component (Grid View)
function VideoCard({ video, onClick }: { video: any; onClick: () => void }) {
  const { thumbnailUrl } = useThumbnail(
    video.filename,
    "local",
    true,
    video.url
  );

  // Check if it's a YouTube video and get thumbnail
  const isYouTube =
    video.filename?.includes("youtube") ||
    video.filename?.includes("youtu.be") ||
    video.isYoutube ||
    video.url?.includes("youtube");
  const youtubeThumbnail = isYouTube
    ? getYouTubeThumbnail(video.url || video.filename)
    : null;
  const displayThumbnail = youtubeThumbnail || thumbnailUrl;

  return (
    <div
      onClick={onClick}
      className="rounded-lg border relative overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: "#353A3A",
        borderColor: "#606364",
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-black">
        {displayThumbnail ? (
          <img
            src={displayThumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <Video className="h-8 w-8 text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="h-5 w-5 text-black ml-0.5" />
            </div>
          </div>
        </div>

        {/* Category Badge */}
        {video.category && (
          <div
            className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
            style={{
              backgroundColor: "rgba(74, 90, 112, 0.9)",
              color: "#fff",
            }}
          >
            {video.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative p-2">
        <h3
          className="text-xs font-semibold line-clamp-2 leading-tight"
          style={{ color: "#C3BCC2" }}
        >
          {video.title}
        </h3>
      </div>
    </div>
  );
}

// Video List Item Component (List View)
function VideoListItem({
  video,
  onClick,
}: {
  video: any;
  onClick: () => void;
}) {
  const { thumbnailUrl } = useThumbnail(
    video.filename,
    "local",
    true,
    video.url
  );

  // Check if it's a YouTube video and get thumbnail
  const isYouTube =
    video.filename?.includes("youtube") ||
    video.filename?.includes("youtu.be") ||
    video.isYoutube ||
    video.url?.includes("youtube");
  const youtubeThumbnail = isYouTube
    ? getYouTubeThumbnail(video.url || video.filename)
    : null;
  const displayThumbnail = youtubeThumbnail || thumbnailUrl;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-3 hover:bg-white/5 transition-colors cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-24 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0 relative group">
        {displayThumbnail ? (
          <img
            src={displayThumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <Video className="h-5 w-5 text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="h-3 w-3 text-black ml-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3
          className="font-semibold text-sm mb-0.5 line-clamp-1"
          style={{ color: "#C3BCC2" }}
        >
          {video.title}
        </h3>
        <div
          className="flex items-center gap-3 text-xs"
          style={{ color: "#ABA4AA" }}
        >
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3" />
            {video.coach?.name || "Unknown Coach"}
          </div>
          {video.category && (
            <div
              className="px-1.5 py-0.5 rounded text-[10px]"
              style={{ backgroundColor: "#4A5A70", color: "#fff" }}
            >
              {video.category}
            </div>
          )}
          {video.duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {Math.floor(video.duration / 60)}:
              {String(video.duration % 60).padStart(2, "0")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
