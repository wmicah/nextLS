"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  Play,
  Pause,
  Trash2,
  Edit3,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import EditVideoModal from "./EditVideoModal";
import { getYouTubeEmbedUrl } from "@/lib/youtube-utils";
import { useMobileDetection } from "@/lib/mobile-detection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

interface VideoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onDelete?: () => void; // Add this callback
  // Navigation props
  currentIndex?: number;
  totalItems?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  libraryItems?: any[];
  forceMobileLayout?: boolean; // Force mobile layout regardless of screen size
}

export default function VideoViewerModal({
  isOpen,
  onClose,
  item,
  onDelete,
  currentIndex = 0,
  totalItems = 0,
  onPrevious,
  onNext,
  libraryItems = [],
  forceMobileLayout = false,
}: VideoViewerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false); // For mobile: toggle full description (YouTube-style)
  const [showDetails, setShowDetails] = useState(false); // For mobile: show video details

  // Mobile detection - with more lenient threshold for modal
  const { isMobile: detectedMobile } = useMobileDetection();

  // Force mobile layout if window is less than 1024px (tablet/mobile) OR if forceMobileLayout is true
  // This ensures the YouTube-style layout shows on tablets and mobile devices
  const [isMobile, setIsMobile] = useState(forceMobileLayout);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsMobile(forceMobileLayout);
      return undefined;
    }

    const checkMobile = () => {
      const width = window.innerWidth;
      // Use more lenient threshold for video viewer - show mobile layout up to 1024px
      // OR if explicitly forced (e.g., from MobileLibraryPage)
      setIsMobile(forceMobileLayout || width < 1024 || detectedMobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [detectedMobile, forceMobileLayout]);

  // Get user admin status
  const { data: authData } = trpc.authCallback.useQuery();
  const isAdmin = authData?.user?.isAdmin || false;
  const isMasterLibraryItem =
    item?.isMasterLibrary === true || item?.url?.startsWith("secure://");

  // Debug logging
  console.log("VideoViewerModal debug:", {
    itemId: item?.id,
    itemTitle: item?.title,
    isMasterLibrary: item?.isMasterLibrary,
    url: item?.url,
    isMasterLibraryItem,
    isAdmin,
  });

  // Get client comments for this video (only for non-master library items)
  const { data: clientComments = [] } = (
    trpc.library.getClientCommentsForVideo as any
  ).useQuery(
    { videoId: item?.id },
    { enabled: !!item?.id && !isMasterLibraryItem }
  );

  const deleteMutation = (trpc.library.delete as any).useMutation({
    onSuccess: () => {
      setShowDeleteConfirm(false);
      onDelete?.(); // Call the callback to refresh the list
      onClose(); // Close the modal
    },
    onError: (error: { message: string }) => {
      alert(`Delete failed: ${error.message}`);
    },
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setVideoError(null); // Clear any previous errors

      // Focus management for accessibility
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement)?.focus();
      }
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, item?.id]); // Also clear errors when switching videos

  // Handle video switching with loading state
  useEffect(() => {
    if (item) {
      setIsVideoLoading(true);
      setVideoError(null);
      setVideoKey(prev => prev + 1); // Force video element recreation

      // Reset loading state after a short delay to allow video to start loading
      const timer = setTimeout(() => {
        setIsVideoLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [item?.id]);

  // Preload next video for smoother transitions
  useEffect(() => {
    if (libraryItems.length > 1 && currentIndex !== undefined) {
      const nextIndex = (currentIndex + 1) % libraryItems.length;
      const nextItem = libraryItems[nextIndex];

      if (nextItem && !nextItem.isYoutube && nextItem.url) {
        // Preload next video
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = nextItem.url;
        document.head.appendChild(link);

        return () => {
          document.head.removeChild(link);
        };
      }
    }
    return undefined;
  }, [currentIndex, libraryItems]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && onPrevious) {
        onPrevious();
      } else if (e.key === "ArrowRight" && onNext) {
        onNext();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, onPrevious, onNext]);

  if (!isOpen || !item) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: item.id });
  };

  const renderVideoPlayer = () => {
    if (item.isYoutube && item.youtubeId) {
      // YouTube video
      return (
        <div className="w-full h-full flex items-center justify-center relative">
          {isVideoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
          <iframe
            key={`youtube-${videoKey}`}
            width="100%"
            height="100%"
            src={getYouTubeEmbedUrl(item.youtubeId)}
            title={item.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="w-full h-full rounded-lg transition-opacity duration-300"
            style={{
              pointerEvents: "auto",
              backgroundColor: "#000",
              opacity: isVideoLoading ? 0.5 : 1,
            }}
            onLoad={() => {
              setIsVideoLoading(false);
            }}
            onError={() => {
              console.error("YouTube iframe failed to load");
              setIsVideoLoading(false);
            }}
          />
        </div>
      );
    } else if (item.isOnForm && item.onformId) {
      // OnForm video - show message to open on OnForm
      console.log("🎥 Rendering OnForm video:", {
        onformId: item.onformId,
        url: item.url,
        title: item.title,
      });

      return (
        <div className="w-full h-full flex items-center justify-center relative">
          <div className="text-center p-8 max-w-lg">
            <div className="text-8xl mb-6">🎥</div>
            <h3 className="text-2xl font-bold text-white mb-4">OnForm Video</h3>
            <p className="text-gray-300 mb-6 text-lg">
              This OnForm video needs to be viewed on the OnForm platform.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Video ID: {item.onformId}</p>
            </div>
          </div>
        </div>
      );
    } else if ((item.type === "Video" || item.type === "video") && item.url) {
      // Master library video or user uploaded video with protection
      if (item.url.startsWith("secure://")) {
        // For master library videos, use the secure streaming API
        const streamUrl = `/api/stream-master-video?filename=${encodeURIComponent(
          item.filename || ""
        )}`;

        return (
          <div className="w-full h-full relative">
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}
            <video
              key={`master-${videoKey}`}
              controls
              controlsList="nodownload" // Only disable download button, keep fullscreen
              disablePictureInPicture // Disable picture-in-picture
              className="w-full h-full object-contain transition-opacity duration-300"
              style={{
                backgroundColor: "#000",
                opacity: isVideoLoading ? 0.5 : 1,
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onContextMenu={e => e.preventDefault()} // Disable right-click
              onError={e => {
                console.error("Video load error:", e);
                console.error("Video source:", streamUrl);
                console.error("Video item:", item);
                setVideoError(
                  "Failed to load video. The file may not exist on the server."
                );
                setIsVideoLoading(false);
              }}
              onLoadStart={() => {
                setVideoError(null);
              }}
              onLoadedData={() => {
                setVideoError(null);
                setIsVideoLoading(false);
              }}
              onCanPlay={() => {
                setIsVideoLoading(false);
              }}
            >
              <source src={streamUrl} type="video/mp4" />
              <source src={streamUrl} type="video/webm" />
              <source src={streamUrl} type="video/ogg" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      } else {
        // Regular uploaded video with protection
        console.log("🎥 Rendering uploaded video:", {
          url: item.url,
          title: item.title,
          type: item.type,
          filename: item.filename,
        });

        // Validate URL format
        const isValidUrl = (url: string) => {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        };

        if (!isValidUrl(item.url)) {
          console.error("❌ Invalid video URL:", item.url);
          return (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-8 max-w-lg">
                <div className="text-8xl mb-6">⚠️</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Invalid Video URL
                </h3>
                <p className="text-gray-300 mb-6 text-lg">
                  The video URL is not valid. Please contact support if this
                  issue persists.
                </p>
                <div className="text-sm text-gray-400 break-all">
                  URL: {item.url}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="w-full h-full relative">
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}
            <video
              key={`local-${videoKey}`}
              controls
              controlsList="nodownload" // Only disable download button, keep fullscreen
              disablePictureInPicture // Disable picture-in-picture
              className="w-full h-full object-contain transition-opacity duration-300"
              style={{
                backgroundColor: "#000",
                opacity: isVideoLoading ? 0.5 : 1,
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onContextMenu={e => e.preventDefault()} // Disable right-click
              onError={e => {
                console.error("Video load error:", e);
                console.error("Video URL:", item.url);
                console.error("Video element:", e.target);
                setVideoError(`Failed to load video. URL: ${item.url}`);
                setIsVideoLoading(false);
              }}
              onLoadStart={() => {
                console.log("Video loading started for URL:", item.url);
                setVideoError(null);
              }}
              onLoadedData={() => {
                setVideoError(null);
                setIsVideoLoading(false);
              }}
              onCanPlay={() => {
                console.log("Video can play for URL:", item.url);
                setIsVideoLoading(false);
              }}
            >
              <source src={item.url} type="video/mp4" />
              <source src={item.url} type="video/webm" />
              <source src={item.url} type="video/ogg" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      }
    } else if (item.type === "document") {
      // Document preview
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-4">📄</div>
            <p style={{ color: "#FFFFFF" }} className="text-lg">
              Document Preview
            </p>
            <p style={{ color: "#D1D5DB" }} className="text-sm">
              {item.filename || "Document file"}
            </p>
            <button
              onClick={() => window.open(item.url, "_blank")}
              className="mt-4 px-6 py-2 rounded-lg transition-all duration-200"
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#606364";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "#4A5A70";
              }}
            >
              Open Document
            </button>
          </div>
        </div>
      );
    } else {
      // Fallback for unknown types
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <Play
              className="h-16 w-16 mb-4 mx-auto"
              style={{ color: "#FFFFFF" }}
            />
            <p style={{ color: "#FFFFFF" }} className="text-lg">
              Media Player
            </p>
            <p style={{ color: "#D1D5DB" }} className="text-sm">
              Unable to preview this file type
            </p>
            <button
              onClick={() => window.open(item.url, "_blank")}
              className="mt-4 px-6 py-2 rounded-lg transition-all duration-200"
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#606364";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "#4A5A70";
              }}
            >
              Open File
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingTop: isMobile
          ? "max(env(safe-area-inset-top, 0px), 8px)"
          : "1rem",
        paddingBottom: isMobile
          ? "max(env(safe-area-inset-bottom, 0px), 8px)"
          : "1rem",
        paddingLeft: isMobile
          ? "max(env(safe-area-inset-left, 0px), 8px)"
          : "1rem",
        paddingRight: isMobile
          ? "max(env(safe-area-inset-right, 0px), 8px)"
          : "1rem",
        minHeight: "100dvh",
        height: "100dvh",
        boxSizing: "border-box",
      }}
    >
      <div
        className={`${
          isMobile
            ? "w-full max-w-md rounded-xl overflow-hidden flex flex-col shadow-2xl"
            : "rounded-lg w-full max-w-[85vw] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        }`}
        style={{
          backgroundColor: isMobile ? "#000000" : "#0F0F0F",
          height: isMobile ? "100%" : "85vh",
          maxHeight: isMobile ? "100%" : "85vh",
          width: isMobile ? "100%" : "85vw",
          maxWidth: isMobile ? "100%" : "85vw",
          boxSizing: "border-box",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - YouTube-style minimal header for mobile */}
        {isMobile ? (
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{
              backgroundColor: "#000000",
              borderBottom: "1px solid #272727",
            }}
          >
            {/* Left side - Empty space for balance */}
            <div className="w-9 flex-shrink-0" />

            {/* Center - Navigation controls */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              {totalItems > 1 ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onPrevious}
                    disabled={currentIndex === 0}
                    className="p-1 rounded-full transition-all duration-200 active:scale-95 touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#272727] flex-shrink-0"
                    style={{ color: "#FFFFFF" }}
                    aria-label="Previous video"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-white font-medium px-2 text-center whitespace-nowrap">
                    {currentIndex + 1}/{totalItems}
                  </span>
                  <button
                    onClick={onNext}
                    disabled={currentIndex >= totalItems - 1}
                    className="p-1 rounded-full transition-all duration-200 active:scale-95 touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#272727] flex-shrink-0"
                    style={{ color: "#FFFFFF" }}
                    aria-label="Next video"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>

            {/* Right side - Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full transition-all duration-200 active:scale-95 touch-manipulation hover:bg-[#272727] flex-shrink-0"
              style={{ color: "#FFFFFF" }}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          // Desktop: YouTube-style minimal header
          <div
            className="flex items-center justify-between px-8 py-4 flex-shrink-0"
            style={{
              backgroundColor: "#0F0F0F",
              borderBottom: "1px solid #272727",
            }}
          >
            {/* Left side - Navigation controls */}
            <div className="flex items-center gap-4">
              {totalItems > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={onPrevious}
                    disabled={currentIndex === 0}
                    className="p-2.5 rounded-full transition-all duration-200 hover:bg-[#272727] disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: "#FFFFFF" }}
                    aria-label="Previous video"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <span className="text-base text-gray-400 font-medium">
                    {currentIndex + 1}/{totalItems}
                  </span>
                  <button
                    onClick={onNext}
                    disabled={currentIndex >= totalItems - 1}
                    className="p-2.5 rounded-full transition-all duration-200 hover:bg-[#272727] disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: "#FFFFFF" }}
                    aria-label="Next video"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>

            {/* Right side - Close button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-full transition-all duration-200 hover:bg-[#272727]"
              style={{ color: "#FFFFFF" }}
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Video/Content Area - Scrollable */}
        <div
          className={
            isMobile
              ? "overflow-y-auto flex-1 overscroll-contain"
              : "overflow-y-auto flex-1 overscroll-contain"
          }
          style={
            isMobile
              ? {
                  minHeight: 0, // Allows flex child to shrink
                  WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
                }
              : {
                  minHeight: 0,
                  backgroundColor: "#0F0F0F",
                }
          }
        >
          {/* Video Error Message */}
          {videoError && (
            <div
              className={`${
                isMobile ? "m-4" : "mx-6 mt-4"
              } p-4 bg-red-900 border border-red-700 rounded-lg`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-red-200 font-medium">Video Error</span>
              </div>
              <p className="text-red-300 text-sm">{videoError}</p>
              <p className="text-red-400 text-xs mt-2">
                This usually means the video file wasn't properly uploaded or
                doesn't exist on the server.
              </p>
            </div>
          )}

          <div className={isMobile ? "" : "px-8 pt-6 pb-4 flex justify-center"}>
            {/* Video Player - YouTube-style, slightly smaller on desktop */}
            <div
              className={`${
                isMobile
                  ? "w-full aspect-video"
                  : "w-full max-w-[90%] aspect-video"
              } overflow-hidden transition-all duration-300`}
              style={{
                backgroundColor: "#000000",
                borderRadius: isMobile ? "0.5rem" : "0.75rem",
              }}
            >
              <div className="relative w-full h-full">
                {renderVideoPlayer()}
              </div>
            </div>
          </div>

          {/* Content Info */}
          {isMobile ? (
            // YouTube-style Mobile Layout
            <div className="bg-[#0F0F0F] text-white pb-4">
              {/* Video Title and Metadata - YouTube style */}
              <div className="px-4 py-3">
                <h1
                  id="video-modal-title"
                  className="text-base font-semibold text-white mb-2 leading-snug"
                  style={{ lineHeight: "1.4" }}
                >
                  {item.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  {item.category && (
                    <>
                      <span className="text-gray-400">{item.category}</span>
                      {(item.duration || item.createdAt) && (
                        <span className="text-gray-600">•</span>
                      )}
                    </>
                  )}
                  {item.duration && (
                    <>
                      <span>{item.duration}</span>
                      {item.createdAt && (
                        <span className="text-gray-600">•</span>
                      )}
                    </>
                  )}
                  {item.createdAt && (
                    <span>
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Description - YouTube style collapsible */}
              {item.description && (
                <div className="px-4 py-3 border-b border-[#272727]">
                  <div
                    className={`text-sm text-white whitespace-pre-wrap break-words ${
                      !showFullDescription ? "line-clamp-2" : ""
                    }`}
                    style={{ lineHeight: "1.5" }}
                  >
                    {item.description}
                  </div>
                  {/* Show "Show more" button if description is likely to be truncated */}
                  {item.description.length > 120 && (
                    <button
                      onClick={() =>
                        setShowFullDescription(!showFullDescription)
                      }
                      className="mt-1 text-sm font-medium text-gray-400 active:opacity-70"
                    >
                      {showFullDescription ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              )}

              {/* Client Comments - YouTube style */}
              {clientComments.length > 0 && (
                <div className="px-4 py-3 border-t border-[#272727]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">
                      {clientComments.length}{" "}
                      {clientComments.length === 1 ? "Comment" : "Comments"}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {clientComments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3">
                        {/* Avatar */}
                        {comment.client?.avatar ? (
                          <Image
                            src={comment.client.avatar}
                            alt={comment.client.name}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white font-semibold flex-shrink-0"
                            style={{ backgroundColor: "#606060" }}
                          >
                            {comment.client?.name?.charAt(0).toUpperCase() ||
                              "C"}
                          </div>
                        )}
                        {/* Comment Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">
                              {comment.client?.name || "Unknown Client"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {(() => {
                                const date = new Date(comment.createdAt);
                                const now = new Date();
                                const diffMs = now.getTime() - date.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                const diffHours = Math.floor(diffMs / 3600000);
                                const diffDays = Math.floor(diffMs / 86400000);

                                if (diffMins < 1) return "now";
                                if (diffMins < 60) return `${diffMins}m ago`;
                                if (diffHours < 24) return `${diffHours}h ago`;
                                if (diffDays < 7) return `${diffDays}d ago`;
                                return date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                });
                              })()}
                            </span>
                          </div>
                          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Details - Collapsed by default (YouTube style) */}
              {(isAdmin || !isMasterLibraryItem) && (
                <div className="px-4 py-3 border-t border-[#272727]">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between text-sm text-gray-400 active:opacity-70"
                  >
                    <span>Show more</span>
                    {showDetails ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {showDetails && (
                    <div className="mt-3 space-y-3 text-xs">
                      <div className="flex justify-between items-center py-2 border-b border-[#272727]">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white capitalize">
                          {item.isYoutube
                            ? "YouTube Video"
                            : item.isOnForm
                            ? "OnForm Video"
                            : item.type}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#272727]">
                        <span className="text-gray-400">Category:</span>
                        <span className="text-white">{item.category}</span>
                      </div>
                      {item.filename && (
                        <div className="flex justify-between items-center py-2 border-b border-[#272727]">
                          <span className="text-gray-400">File:</span>
                          <span className="text-white text-right max-w-[60%] truncate">
                            {item.filename}
                          </span>
                        </div>
                      )}
                      {item.createdAt && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-400">Added:</span>
                          <span className="text-white">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Desktop Layout: YouTube-style layout
            <div className="px-8 pb-6">
              {/* Video Info Section - YouTube style */}
              <div className="mt-6 mb-4">
                <h1
                  id="video-modal-title"
                  className="text-2xl font-semibold text-white mb-4 leading-tight"
                >
                  {item.title}
                </h1>
                <div className="flex items-center gap-3 text-base text-gray-400 mb-6">
                  {item.category && (
                    <>
                      <span>{item.category}</span>
                      {(item.duration || item.createdAt) && (
                        <span className="text-gray-600">•</span>
                      )}
                    </>
                  )}
                  {item.duration && (
                    <>
                      <span>{item.duration}</span>
                      {item.createdAt && (
                        <span className="text-gray-600">•</span>
                      )}
                    </>
                  )}
                  {item.createdAt && (
                    <span>
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  {item.isYoutube && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span
                        className="px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: "#DC2626",
                          color: "#FFFFFF",
                        }}
                      >
                        YouTube
                      </span>
                    </>
                  )}
                  {item.isOnForm && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span
                        className="px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: "#F59E0B",
                          color: "#FFFFFF",
                        }}
                      >
                        OnForm
                      </span>
                    </>
                  )}
                  {/* Actions dropdown for admin/edit */}
                  {(isAdmin || !isMasterLibraryItem) && (
                    <>
                      <span className="text-gray-600">•</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                            style={{ backgroundColor: "transparent" }}
                          >
                            More actions
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-[200px]"
                          style={{
                            backgroundColor: "#272727",
                            borderColor: "#606060",
                          }}
                        >
                          {!isMasterLibraryItem && (
                            <DropdownMenuItem
                              onClick={() => setIsEditModalOpen(true)}
                              className="cursor-pointer"
                              style={{
                                color: "#FFFFFF",
                              }}
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Video
                            </DropdownMenuItem>
                          )}
                          {isAdmin && isMasterLibraryItem && (
                            <DropdownMenuItem
                              onClick={() => setIsEditModalOpen(true)}
                              className="cursor-pointer"
                              style={{
                                color: "#FFFFFF",
                              }}
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Video
                            </DropdownMenuItem>
                          )}
                          {!isMasterLibraryItem && onDelete && (
                            <>
                              <DropdownMenuSeparator
                                style={{ backgroundColor: "#606060" }}
                              />
                              <DropdownMenuItem
                                onClick={() => setShowDeleteConfirm(true)}
                                className="cursor-pointer text-red-400"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Video
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>

              {/* Description - YouTube style collapsible */}
              {item.description && (
                <div
                  className="mb-6 p-5 rounded-xl"
                  style={{
                    backgroundColor: "#272727",
                  }}
                >
                  <div
                    className={`text-base text-white whitespace-pre-wrap break-words ${
                      !showFullDescription ? "line-clamp-3" : ""
                    }`}
                    style={{ lineHeight: "1.6" }}
                  >
                    {item.description}
                  </div>
                  {item.description.length > 200 && (
                    <button
                      onClick={() =>
                        setShowFullDescription(!showFullDescription)
                      }
                      className="mt-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      {showFullDescription ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              )}

              {/* Client Comments - YouTube style */}
              {clientComments.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      {clientComments.length}{" "}
                      {clientComments.length === 1 ? "Comment" : "Comments"}
                    </h3>
                  </div>
                  <div className="space-y-6">
                    {clientComments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-4">
                        {/* Avatar */}
                        {comment.client?.avatar ? (
                          <Image
                            src={comment.client.avatar}
                            alt={comment.client.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-base text-white font-semibold flex-shrink-0"
                            style={{ backgroundColor: "#606060" }}
                          >
                            {comment.client?.name?.charAt(0).toUpperCase() ||
                              "C"}
                          </div>
                        )}
                        {/* Comment Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base font-medium text-white">
                              {comment.client?.name || "Unknown Client"}
                            </span>
                            <span className="text-sm text-gray-400">
                              {(() => {
                                const date = new Date(comment.createdAt);
                                const now = new Date();
                                const diffMs = now.getTime() - date.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                const diffHours = Math.floor(diffMs / 3600000);
                                const diffDays = Math.floor(diffMs / 86400000);

                                if (diffMins < 1) return "now";
                                if (diffMins < 60) return `${diffMins}m ago`;
                                if (diffHours < 24) return `${diffHours}h ago`;
                                if (diffDays < 7) return `${diffDays}d ago`;
                                return date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                });
                              })()}
                            </span>
                          </div>
                          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Details - Collapsed by default (YouTube style) */}
              {(isAdmin || !isMasterLibraryItem) && (
                <div className="mt-8">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-2 text-base font-medium text-gray-400 hover:text-white transition-colors mb-3"
                  >
                    {showDetails ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                    Show details
                  </button>
                  {showDetails && (
                    <div
                      className="p-5 rounded-xl space-y-3 text-base"
                      style={{
                        backgroundColor: "#272727",
                      }}
                    >
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400 font-medium">Type:</span>
                        <span className="text-white">
                          {item.isYoutube
                            ? "YouTube Video"
                            : item.isOnForm
                            ? "OnForm Video"
                            : item.type}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400 font-medium">
                          Category:
                        </span>
                        <span className="text-white">{item.category}</span>
                      </div>
                      {item.filename && (
                        <div className="flex justify-between py-2 border-b border-gray-700">
                          <span className="text-gray-400 font-medium">
                            File:
                          </span>
                          <span className="text-white text-right max-w-[70%] truncate">
                            {item.filename}
                          </span>
                        </div>
                      )}
                      {item.createdAt && (
                        <div className="flex justify-between py-2">
                          <span className="text-gray-400 font-medium">
                            Added:
                          </span>
                          <span className="text-white">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Master Library Notice */}
              {isMasterLibraryItem && !isAdmin && (
                <div
                  className="mt-8 p-5 rounded-xl"
                  style={{
                    backgroundColor: "#1E3A8A",
                    border: "1px solid #3B82F6",
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-6 w-6 text-blue-300" />
                    <h3 className="text-lg font-semibold text-blue-200">
                      Master Library Content
                    </h3>
                  </div>
                  <p className="text-base text-blue-300 leading-relaxed">
                    This is premium training content from the master library.
                    Only administrators can modify this content.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-60">
          <div
            className="rounded-lg p-6 w-full max-w-md border"
            style={{
              backgroundColor: "#353A3A",
              borderColor: "#606364",
            }}
          >
            <div className="text-center">
              <div
                className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4"
                style={{ backgroundColor: "#DC2626" }}
              >
                <Trash2 className="h-6 w-6" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-lg font-medium mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Delete Resource
              </h3>
              <p className="text-sm mb-6" style={{ color: "#ABA4AA" }}>
                Are you sure you want to delete "{item.title}"? This action
                cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 px-4 rounded-lg border transition-all duration-200"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "#606364",
                    color: "#ABA4AA",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#606364";
                    e.currentTarget.style.color = "#C3BCC2";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#ABA4AA";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                  style={{
                    backgroundColor: "#DC2626",
                    color: "#C3BCC2",
                  }}
                  onMouseEnter={e => {
                    if (!deleteMutation.isPending) {
                      e.currentTarget.style.backgroundColor = "#B91C1C";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!deleteMutation.isPending) {
                      e.currentTarget.style.backgroundColor = "#DC2626";
                    }
                  }}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      <EditVideoModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        video={item}
        onSuccess={() => {
          // Refresh the video data if needed
          // The library list will be refreshed by the EditVideoModal
        }}
      />
    </div>
  );
}
