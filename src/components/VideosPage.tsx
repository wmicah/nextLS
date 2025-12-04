"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Video,
  Plus,
  Search,
  Filter,
  Play,
  Eye,
  TrendingUp,
  Calendar,
  User,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  SortAsc,
  SortDesc,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { SkeletonVideoGrid, SkeletonCard } from "@/components/SkeletonLoader";
import { COLORS, getGoldenAccent } from "@/lib/colors";
import { ErrorBoundary } from "./ErrorBoundary";

// Video Card Component with error handling
function VideoCard({ video, formatDuration }: { video: any; formatDuration: (seconds: number | null) => string }) {
  const [thumbnailError, setThumbnailError] = useState(false);

  // Skip videos that are missing critical data
  if (!video || !video.id || !video.title) {
    return null;
  }

  return (
    <Link
      href={`/videos/${video.id}`}
      className="group relative rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 cursor-pointer border block"
      style={{ 
        backgroundColor: COLORS.BACKGROUND_CARD,
        borderColor: COLORS.BORDER_SUBTLE,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = getGoldenAccent(0.4);
        e.currentTarget.style.boxShadow = `0 4px 12px ${getGoldenAccent(0.2)}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Video Thumbnail */}
      <div
        className="relative aspect-video overflow-hidden"
        style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
      >
        {video.thumbnail && !thumbnailError ? (
          <img
            src={video.thumbnail}
            alt={video.title || "Video thumbnail"}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video
              className="w-6 h-6"
              style={{ color: COLORS.TEXT_SECONDARY }}
            />
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: getGoldenAccent(0.9),
              }}
            >
              <Play
                className="w-4 h-4 ml-0.5"
                style={{ color: COLORS.BACKGROUND_DARK }}
              />
            </div>
          </div>
        </div>

        {/* Category Badge */}
        {video.category && (
          <div className="absolute top-2 left-2">
            <span
              className="px-1.5 py-0.5 text-[10px] font-medium rounded-full border"
              style={{ 
                backgroundColor: COLORS.BACKGROUND_CARD,
                color: COLORS.TEXT_PRIMARY,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              {video.category}
            </span>
          </div>
        )}

        {/* Duration */}
        {video.duration && (
          <div className="absolute bottom-2 right-2">
            <span
              className="px-1.5 py-0.5 text-[10px] font-medium rounded"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: COLORS.TEXT_PRIMARY,
              }}
            >
              {formatDuration(video.duration)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        {/* Title */}
        <h3
          className="font-medium text-xs line-clamp-2 leading-tight mb-1"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          {video.title || "Untitled Video"}
        </h3>

        {/* Meta Info */}
        <div
          className="flex items-center justify-between text-[10px]"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          <div className="flex items-center gap-1">
            <User className="w-2.5 h-2.5" />
            <span className="truncate">
              {video.uploader?.name || video.client?.name || "Unknown"}
            </span>
          </div>
          <span className="text-[9px]">
            {video.createdAt 
              ? new Date(video.createdAt).toLocaleDateString()
              : "Unknown date"}
          </span>
        </div>

        {/* Stats */}
        {video.feedback && Array.isArray(video.feedback) && video.feedback.length > 0 && (
          <div
            className="flex items-center gap-1 text-[10px] mt-1"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            <MessageSquare className="w-2.5 h-2.5" />
            <span>{video.feedback.length}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// Client Submission Card Component with error handling
function ClientSubmissionCard({ submission, getTimeAgo }: { submission: any; getTimeAgo: (date: string | Date) => string }) {
  const [thumbnailError, setThumbnailError] = useState(false);

  // Skip submissions that are missing critical data
  if (!submission || !submission.id || !submission.title) {
    return null;
  }

  return (
    <Link
      href={`/videos/${submission.id}`}
      className="group relative rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 cursor-pointer border block"
      style={{
        backgroundColor: COLORS.BACKGROUND_CARD,
        borderColor: COLORS.BORDER_SUBTLE,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = getGoldenAccent(0.4);
        e.currentTarget.style.boxShadow = `0 4px 12px ${getGoldenAccent(0.2)}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Video Thumbnail */}
      <div
        className="relative aspect-video overflow-hidden"
        style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
      >
        {submission.thumbnail && !thumbnailError ? (
          <img
            src={submission.thumbnail}
            alt={submission.title || "Submission thumbnail"}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video
              className="w-6 h-6"
              style={{ color: COLORS.TEXT_SECONDARY }}
            />
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: getGoldenAccent(0.9),
              }}
            >
              <Play
                className="w-4 h-4 ml-0.5"
                style={{ color: COLORS.BACKGROUND_DARK }}
              />
            </div>
          </div>
        </div>

        {/* Client Badge */}
        <div className="absolute top-2 left-2">
          <span
            className="px-1.5 py-0.5 text-[10px] font-medium rounded-full border"
            style={{
              backgroundColor: COLORS.GREEN_PRIMARY,
              color: COLORS.TEXT_PRIMARY,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            Client
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute bottom-2 right-2">
          <span
            className="px-1.5 py-0.5 text-[10px] font-medium rounded"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: COLORS.TEXT_PRIMARY,
            }}
          >
            New
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-2">
        {/* Title */}
        <h3
          className="font-medium text-xs line-clamp-2 leading-tight mb-1"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          {submission.title || "Untitled Submission"}
        </h3>

        {/* Meta Info */}
        <div
          className="flex items-center justify-between text-[10px]"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          <div className="flex items-center gap-1">
            <User className="w-2.5 h-2.5" />
            <span className="truncate">
              {submission.client?.name || "Unknown Client"}
            </span>
          </div>
          <span className="text-[9px]">
            {submission.createdAt 
              ? getTimeAgo(submission.createdAt)
              : "Unknown date"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function VideosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"coach" | "client">("coach");
  const [sortBy, setSortBy] = useState<"date" | "client" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const {
    data: videos = [],
    isLoading: videosLoading,
    error: videosError,
  } = trpc.videos.list.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const {
    data: clientSubmissions = [],
    isLoading: clientSubmissionsLoading,
    error: clientSubmissionsError,
  } = trpc.clientRouter.getClientVideoSubmissions.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Handle tRPC context errors
  if (videosError || clientSubmissionsError) {
    const error = videosError || clientSubmissionsError;
    if (error?.message?.includes("tRPC Context")) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              Loading Videos...
            </h3>
            <p className="text-gray-400">
              Please wait while the application initializes.
            </p>
          </div>
        </div>
      );
    }
  }

  // Memoized filtered and sorted data
  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      // Skip videos with missing critical data
      if (!video || !video.id || !video.title) {
        console.warn("Skipping video with missing data:", video);
        return false;
      }
      
      const matchesSearch =
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || video.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [videos, searchQuery, selectedCategory]);

  const filteredClientSubmissions = useMemo(() => {
    const filtered = clientSubmissions.filter(submission => {
      // Skip submissions with missing critical data
      if (!submission || !submission.id || !submission.title) {
        console.warn("Skipping submission with missing data:", submission);
        return false;
      }
      
      // Handle missing client gracefully
      if (!submission.client) {
        console.warn("Submission missing client:", submission.id);
      }
      
      const matchesSearch =
        submission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        submission.client?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    // Sort submissions
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "client":
          comparison = a.client.name.localeCompare(b.client.name);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [clientSubmissions, searchQuery, sortBy, sortOrder]);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "BULLPEN", label: "Bullpen" },
    { value: "PRACTICE", label: "Practice" },
    { value: "GAME_FOOTAGE", label: "Game Footage" },
    { value: "REFERENCE", label: "Reference" },
    { value: "COMPARISON", label: "Comparison" },
    { value: "OTHER", label: "Other" },
  ];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "Unknown";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    } else {
      return "Just now";
    }
  };

  // Loading state
  if (videosLoading || clientSubmissionsLoading) {
    return (
      <Sidebar>
        <div className="min-h-screen" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
          <div className="p-6">
            <SkeletonVideoGrid items={8} />
          </div>
        </div>
      </Sidebar>
    );
  }

  // Error state
  if (videosError || clientSubmissionsError) {
    return (
      <Sidebar>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
        >
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: COLORS.RED_ALERT }}
            />
            <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
              Something went wrong
            </h3>
            <p className="text-sm mb-4" style={{ color: COLORS.TEXT_SECONDARY }}>
              {activeTab === "coach"
                ? "Unable to load coach videos. Please try refreshing the page."
                : "Unable to load client submissions. Please try refreshing the page."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: COLORS.BACKGROUND_CARD,
                color: COLORS.TEXT_PRIMARY,
                border: `1px solid ${COLORS.BORDER_SUBTLE}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Video Feedback
            </h1>
            <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
              {activeTab === "coach"
                ? "Review and manage your video library"
                : "Review client video submissions and provide feedback"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-sm font-medium border"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                color: COLORS.TEXT_PRIMARY,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              {activeTab === "coach"
                ? `${videos.length} videos`
                : `${clientSubmissions.length} submissions`}
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/videos/compare"
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm border"
                style={{ 
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  color: COLORS.TEXT_PRIMARY,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Compare</span>
              </Link>
              <Link
                href="/videos/upload"
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm border"
                style={{ 
                  backgroundColor: getGoldenAccent(0.2),
                  color: COLORS.TEXT_PRIMARY,
                  borderColor: getGoldenAccent(0.4),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = getGoldenAccent(0.3);
                  e.currentTarget.style.borderColor = getGoldenAccent(0.5);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = getGoldenAccent(0.2);
                  e.currentTarget.style.borderColor = getGoldenAccent(0.4);
                }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("coach")}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm border ${
              activeTab === "coach"
                ? "text-white"
                : "text-gray-300 hover:text-white"
            }`}
            style={{
              backgroundColor: activeTab === "coach" 
                ? getGoldenAccent(0.2) 
                : COLORS.BACKGROUND_CARD,
              borderColor: activeTab === "coach"
                ? getGoldenAccent(0.4)
                : COLORS.BORDER_SUBTLE,
            }}
          >
            Coach Videos ({videos.length})
          </button>
          <button
            onClick={() => setActiveTab("client")}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm border ${
              activeTab === "client"
                ? "text-white"
                : "text-gray-300 hover:text-white"
            }`}
            style={{
              backgroundColor: activeTab === "client" 
                ? getGoldenAccent(0.2) 
                : COLORS.BACKGROUND_CARD,
              borderColor: activeTab === "client"
                ? getGoldenAccent(0.4)
                : COLORS.BORDER_SUBTLE,
            }}
          >
            Client Submissions ({clientSubmissions.length})
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: COLORS.TEXT_SECONDARY }}
            />
            <input
              type="text"
              placeholder={
                activeTab === "coach"
                  ? "Search videos..."
                  : "Search submissions by title, description, or client name..."
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 border"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = getGoldenAccent(0.5);
                e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(0.1)}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {activeTab === "coach" && (
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: COLORS.TEXT_SECONDARY }}
              />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-2 rounded-lg text-sm transition-all duration-200 appearance-none focus:outline-none focus:ring-2 border"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = getGoldenAccent(0.5);
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(0.1)}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value} style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "client" && (
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e =>
                    setSortBy(e.target.value as "date" | "client" | "title")
                  }
                  className="pl-4 pr-8 py-2 rounded-lg text-sm transition-all duration-200 appearance-none focus:outline-none focus:ring-2 border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = getGoldenAccent(0.5);
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(0.1)}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="date" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>Sort by Date</option>
                  <option value="client" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>Sort by Client</option>
                  <option value="title" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>Sort by Title</option>
                </select>
              </div>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 border"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Video Grid */}
        {activeTab === "coach" ? (
          // Coach Videos Tab
          filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border"
                style={{ 
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
              >
                <Video className="w-8 h-8" style={{ color: COLORS.TEXT_SECONDARY }} />
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {searchQuery || selectedCategory !== "all"
                  ? "No videos found"
                  : "No videos yet"}
              </h3>
              <p className="text-sm mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filters"
                  : "Upload your first video to get started"}
              </p>
              {!searchQuery && selectedCategory === "all" && (
                <Link
                  href="/videos/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm border"
                  style={{ 
                    backgroundColor: getGoldenAccent(0.2),
                    color: COLORS.TEXT_PRIMARY,
                    borderColor: getGoldenAccent(0.4),
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = getGoldenAccent(0.3);
                    e.currentTarget.style.borderColor = getGoldenAccent(0.5);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = getGoldenAccent(0.2);
                    e.currentTarget.style.borderColor = getGoldenAccent(0.4);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload First Video</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredVideos.map(video => (
                <ErrorBoundary key={video.id} fallback={<div />}>
                  <VideoCard video={video} formatDuration={formatDuration} />
                </ErrorBoundary>
              ))}
            </div>
          )
        ) : (
          // Client Submissions Tab - Completely Revamped
          <div className="space-y-4 md:space-y-6">
            {/* Mobile Stats - Horizontal Scroll */}
            <div className="md:hidden mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <div
                  className="flex-shrink-0 w-24 rounded-lg border p-2 transition-all duration-200 hover:scale-105"
                  style={{ 
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <div className="text-center">
                    <div
                      className="text-lg font-bold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {clientSubmissions.length}
                    </div>
                    <div className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                      Total
                    </div>
                  </div>
                </div>
                <div
                  className="flex-shrink-0 w-24 rounded-lg border p-2 transition-all duration-200 hover:scale-105"
                  style={{ 
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <div className="text-center">
                    <div
                      className="text-lg font-bold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {new Set(clientSubmissions.map(s => s.clientId)).size}
                    </div>
                    <div className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                      Clients
                    </div>
                  </div>
                </div>
                <div
                  className="flex-shrink-0 w-24 rounded-lg border p-2 transition-all duration-200 hover:scale-105"
                  style={{ 
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <div className="text-center">
                    <div
                      className="text-lg font-bold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {
                        clientSubmissions.filter(s => {
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return new Date(s.createdAt) > weekAgo;
                        }).length
                      }
                    </div>
                    <div className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                      This Week
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Summary Stats */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div
                className="p-4 rounded-xl border transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: getGoldenAccent(0.2) }}
                  >
                    <Video className="w-5 h-5" style={{ color: COLORS.GOLDEN_ACCENT }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                      Total Submissions
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {clientSubmissions.length}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="p-4 rounded-xl border transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: COLORS.GREEN_PRIMARY }}
                  >
                    <User className="w-5 h-5" style={{ color: COLORS.TEXT_PRIMARY }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                      Active Clients
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {new Set(clientSubmissions.map(s => s.clientId)).size}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="p-4 rounded-xl border transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: getGoldenAccent(0.3) }}
                  >
                    <Clock className="w-5 h-5" style={{ color: COLORS.GOLDEN_ACCENT }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                      This Week
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {
                        clientSubmissions.filter(s => {
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return new Date(s.createdAt) > weekAgo;
                        }).length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            {filteredClientSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border"
                  style={{ 
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <Video className="w-8 h-8" style={{ color: COLORS.TEXT_SECONDARY }} />
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {searchQuery
                    ? "No client submissions found"
                    : "No client submissions yet"}
                </h3>
                <p className="text-sm mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : "Client video submissions will appear here once they start submitting"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredClientSubmissions.map(submission => (
                  <ErrorBoundary key={submission.id} fallback={<div />}>
                    <ClientSubmissionCard 
                      submission={submission} 
                      getTimeAgo={getTimeAgo} 
                    />
                  </ErrorBoundary>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default VideosPage;
