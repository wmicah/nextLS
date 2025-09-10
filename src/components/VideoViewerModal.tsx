"use client";

import { useState, useEffect } from "react";
import { X, Play, Pause, Trash2, Edit3, Shield } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import EditVideoModal from "./EditVideoModal";

interface VideoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onDelete?: () => void; // Add this callback
}

export default function VideoViewerModal({
  isOpen,
  onClose,
  item,
  onDelete,
}: VideoViewerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Get user admin status
  const { data: authData } = trpc.authCallback.useQuery();
  const isAdmin = authData?.user?.isAdmin || false;
  const isMasterLibraryItem =
    item?.isMasterLibrary || item?.url?.startsWith("secure://");

  // Get client comments for this video (only for non-master library items)
  const { data: clientComments = [] } =
    trpc.library.getClientCommentsForVideo.useQuery(
      { videoId: item?.id },
      { enabled: !!item?.id && !isMasterLibraryItem }
    );

  const deleteMutation = trpc.library.delete.useMutation({
    onSuccess: () => {
      setShowDeleteConfirm(false);
      onDelete?.(); // Call the callback to refresh the list
      onClose(); // Close the modal
    },
    onError: error => {
      console.error("Delete error:", error);
      alert(`Delete failed: ${error.message}`);
    },
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setVideoError(null); // Clear any previous errors
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, item?.id]); // Also clear errors when switching videos

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
      console.log("Rendering YouTube video:", item.youtubeId);
      return (
        <div className="w-full h-full flex items-center justify-center relative">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${item.youtubeId}?rel=0&modestbranding=1&showinfo=0&controls=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0`}
            title={item.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="w-full h-full rounded-lg"
            style={{
              pointerEvents: "auto",
              backgroundColor: "#000",
            }}
            onLoad={() => {
              console.log("YouTube iframe loaded successfully");
            }}
            onError={() => {
              console.error("YouTube iframe failed to load");
            }}
          />
          {/* Fallback link in case iframe fails */}
          <div className="absolute bottom-4 right-4">
            <a
              href={`https://www.youtube.com/watch?v=${item.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg text-sm transition-all duration-200"
              style={{
                backgroundColor: "#DC2626",
                color: "#FFFFFF",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#B91C1C";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "#DC2626";
              }}
            >
              Open on YouTube
            </a>
          </div>
        </div>
      );
    } else if ((item.type === "Video" || item.type === "video") && item.url) {
      // Master library video or user uploaded video with protection
      console.log(
        "Rendering video player for type:",
        item.type,
        "URL:",
        item.url
      );

      if (item.url.startsWith("secure://")) {
        // For master library videos, use the secure streaming API
        const streamUrl = `/api/stream-master-video?filename=${encodeURIComponent(
          item.filename || ""
        )}`;
        console.log("Using secure streaming URL:", streamUrl);

        return (
          <div className="w-full h-full relative">
            <video
              controls
              controlsList="nodownload" // Only disable download button, keep fullscreen
              disablePictureInPicture // Disable picture-in-picture
              className="w-full h-full object-contain"
              style={{ backgroundColor: "#000" }}
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
              }}
              onLoadStart={() => {
                console.log("Video loading started");
                setVideoError(null);
              }}
              onLoadedData={() => {
                console.log("Video data loaded successfully");
                setVideoError(null);
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
        console.log("Using regular video URL:", item.url);
        return (
          <video
            controls
            controlsList="nodownload" // Only disable download button, keep fullscreen
            disablePictureInPicture // Disable picture-in-picture
            className="w-full h-full object-contain"
            style={{ backgroundColor: "#000" }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onContextMenu={e => e.preventDefault()} // Disable right-click
            onError={e => {
              console.error("Video load error:", e);
            }}
          >
            <source src={item.url} type="video/mp4" />
            <source src={item.url} type="video/webm" />
            <source src={item.url} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
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
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto"
        style={{ backgroundColor: "#353A3A" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b sticky top-0 z-10"
          style={{
            borderColor: "#606364",
            backgroundColor: "#353A3A",
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 text-sm font-medium rounded-full"
              style={{
                backgroundColor: "#4A5A70",
                color: "#C3BCC2",
              }}
            >
              {item.category}
            </span>
            {item.isYoutube && (
              <span
                className="px-3 py-1 text-sm rounded-full"
                style={{
                  backgroundColor: "#DC2626",
                  color: "#C3BCC2",
                }}
              >
                YouTube
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
            style={{ color: "#ABA4AA" }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#606364";
              e.currentTarget.style.color = "#C3BCC2";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#ABA4AA";
            }}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Video/Content Area */}
        <div className="p-6">
          {/* Video Error Message */}
          {videoError && (
            <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg">
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

          <div className="mb-6">
            {/* Video Player */}
            <div
              className="w-full rounded-lg overflow-hidden"
              style={{ backgroundColor: "#606364", aspectRatio: "16/9" }}
            >
              {renderVideoPlayer()}
            </div>
          </div>

          {/* Content Info */}
          <div
            className={`grid gap-6 ${
              isAdmin ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
            }`}
          >
            {/* Main Content */}
            <div className={isAdmin ? "lg:col-span-2" : "w-full"}>
              <h1
                className="text-3xl font-bold mb-4"
                style={{ color: "#C3BCC2" }}
              >
                {item.title}
              </h1>

              {/* For Master Library Items - Show Limited Info for Non-Admins */}
              {isMasterLibraryItem && !isAdmin ? (
                <div className="space-y-6 max-w-4xl">
                  {/* Description Only */}
                  <div
                    className="rounded-lg p-6 border"
                    style={{
                      backgroundColor: "#606364",
                      borderColor: "#ABA4AA",
                    }}
                  >
                    <h3
                      className="text-lg font-semibold mb-3"
                      style={{ color: "#C3BCC2" }}
                    >
                      Description
                    </h3>
                    <p
                      style={{ color: "#D1D5DB" }}
                      className="leading-relaxed whitespace-pre-wrap"
                    >
                      {item.description || "No description available."}
                    </p>
                  </div>

                  {/* Master Library Notice */}
                  <div
                    className="rounded-lg p-6 border"
                    style={{
                      backgroundColor: "#1E3A8A",
                      borderColor: "#3B82F6",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Shield
                        className="h-6 w-6"
                        style={{ color: "#60A5FA" }}
                      />
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: "#DBEAFE" }}
                      >
                        Master Library Content
                      </h3>
                    </div>
                    <p
                      style={{ color: "#BFDBFE" }}
                      className="text-sm leading-relaxed"
                    >
                      This is premium training content from the master library.
                      Only administrators can modify this content. Coaches can
                      view and assign these videos to clients.
                    </p>
                  </div>
                </div>
              ) : (
                /* For Regular Library Items or Admin Users - Show Full Info */
                <>
                  {/* Duration Only */}
                  {item.duration && (
                    <div className="flex items-center gap-2 mb-6">
                      <Play className="h-5 w-5" style={{ color: "#ABA4AA" }} />
                      <span
                        style={{ color: "#C3BCC2" }}
                        className="text-lg font-semibold"
                      >
                        {item.duration}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  <div
                    className={`rounded-lg p-6 border ${
                      !isAdmin ? "max-w-4xl" : ""
                    }`}
                    style={{
                      backgroundColor: "#606364",
                      borderColor: "#ABA4AA",
                    }}
                  >
                    <h3
                      className="text-lg font-semibold mb-3"
                      style={{ color: "#C3BCC2" }}
                    >
                      Description
                    </h3>
                    <p
                      style={{ color: "#D1D5DB" }}
                      className="leading-relaxed whitespace-pre-wrap"
                    >
                      {item.description || "No description available."}
                    </p>
                  </div>

                  {/* Client Comments - Only for non-master library items */}
                  {clientComments.length > 0 && (
                    <div
                      className={`rounded-lg p-6 border mt-6 ${
                        !isAdmin ? "max-w-4xl" : ""
                      }`}
                      style={{
                        backgroundColor: "#606364",
                        borderColor: "#ABA4AA",
                      }}
                    >
                      <h3
                        className="text-lg font-semibold mb-4"
                        style={{ color: "#C3BCC2" }}
                      >
                        Client Comments ({clientComments.length})
                      </h3>
                      <div className="space-y-4">
                        {clientComments.map((comment: any) => (
                          <div
                            key={comment.id}
                            className="p-4 rounded-lg border"
                            style={{
                              backgroundColor: "#2A3133",
                              borderColor: "#4A5A70",
                            }}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              {comment.client?.avatar ? (
                                <img
                                  src={comment.client.avatar}
                                  alt={comment.client.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm text-white font-bold">
                                  {comment.client?.name?.charAt(0) || "C"}
                                </div>
                              )}
                              <div>
                                <div
                                  className="font-semibold"
                                  style={{ color: "#C3BCC2" }}
                                >
                                  {comment.client?.name || "Unknown Client"}
                                </div>
                                <div
                                  className="text-xs"
                                  style={{ color: "#ABA4AA" }}
                                >
                                  {new Date(
                                    comment.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <p
                              style={{ color: "#ABA4AA" }}
                              className="leading-relaxed"
                            >
                              "{comment.comment}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar - Only show for Admin users */}
            {isAdmin && (
              <div>
                {/* Actions */}
                <div
                  className="rounded-lg p-6 mb-6 border"
                  style={{ backgroundColor: "#606364", borderColor: "#ABA4AA" }}
                >
                  <h3
                    className="text-lg font-semibold mb-4"
                    style={{ color: "#C3BCC2" }}
                  >
                    Actions
                  </h3>
                  <div className="space-y-3">
                    {item.isYoutube ? (
                      <button
                        onClick={() => window.open(item.url, "_blank")}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium"
                        style={{ backgroundColor: "#DC2626", color: "#C3BCC2" }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#B91C1C";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "#DC2626";
                        }}
                      >
                        <Play className="h-5 w-5" />
                        Watch on YouTube
                      </button>
                    ) : (
                      <div className="text-center py-4">
                        <p style={{ color: "#D1D5DB" }} className="text-sm">
                          🔒 This video is protected and can only be viewed here
                        </p>
                      </div>
                    )}

                    {/* For Master Library Items - Show Different Actions Based on User Role */}
                    {isMasterLibraryItem ? (
                      /* Admin Actions for Master Library */
                      <>
                        <button
                          onClick={() => setIsEditModalOpen(true)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium border mb-3 transform hover:scale-[1.02]"
                          style={{
                            backgroundColor: "#4A5A70",
                            borderColor: "#4A5A70",
                            color: "#C3BCC2",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#606364";
                            e.currentTarget.style.borderColor = "#606364";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "#4A5A70";
                            e.currentTarget.style.borderColor = "#4A5A70";
                          }}
                        >
                          <Edit3 className="h-5 w-5" />
                          Edit Master Library Video
                        </button>

                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium border"
                          style={{
                            backgroundColor: "transparent",
                            borderColor: "#DC2626",
                            color: "#DC2626",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#DC2626";
                            e.currentTarget.style.color = "#C3BCC2";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color = "#DC2626";
                          }}
                        >
                          <Trash2 className="h-5 w-5" />
                          Delete from Master Library
                        </button>
                      </>
                    ) : (
                      /* Regular Library Items - Show Edit/Delete for Coaches */
                      <>
                        <button
                          onClick={() => setIsEditModalOpen(true)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium border mb-3 transform hover:scale-[1.02]"
                          style={{
                            backgroundColor: "#4A5A70",
                            borderColor: "#4A5A70",
                            color: "#C3BCC2",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#606364";
                            e.currentTarget.style.borderColor = "#606364";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "#4A5A70";
                            e.currentTarget.style.borderColor = "#4A5A70";
                          }}
                        >
                          <Edit3 className="h-5 w-5" />
                          Edit Video
                        </button>

                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium border"
                          style={{
                            backgroundColor: "transparent",
                            borderColor: "#DC2626",
                            color: "#DC2626",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#DC2626";
                            e.currentTarget.style.color = "#C3BCC2";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color = "#DC2626";
                          }}
                        >
                          <Trash2 className="h-5 w-5" />
                          Delete Resource
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div
                  className="rounded-lg p-6 border"
                  style={{ backgroundColor: "#606364", borderColor: "#ABA4AA" }}
                >
                  <h3
                    className="text-lg font-semibold mb-4"
                    style={{ color: "#C3BCC2" }}
                  >
                    Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span style={{ color: "#9CA3AF" }}>Type:</span>
                      <span style={{ color: "#FFFFFF" }} className="capitalize">
                        {item.isYoutube ? "YouTube Video" : item.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "#9CA3AF" }}>Category:</span>
                      <span style={{ color: "#FFFFFF" }}>{item.category}</span>
                    </div>

                    {/* Show additional details only to admins or for non-master library items */}
                    {(isAdmin || !isMasterLibraryItem) && (
                      <>
                        {item.duration && (
                          <div className="flex justify-between">
                            <span style={{ color: "#9CA3AF" }}>Duration:</span>
                            <span style={{ color: "#FFFFFF" }}>
                              {item.duration}
                            </span>
                          </div>
                        )}
                        {item.filename && (
                          <div className="flex justify-between">
                            <span style={{ color: "#9CA3AF" }}>File:</span>
                            <span
                              style={{ color: "#FFFFFF" }}
                              className="text-sm truncate"
                            >
                              {item.filename}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span style={{ color: "#9CA3AF" }}>Added:</span>
                          <span style={{ color: "#FFFFFF" }}>
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString()
                              : "Unknown"}
                          </span>
                        </div>
                      </>
                    )}

                    {/* For Master Library Items - Show Special Notice */}
                    {isMasterLibraryItem && !isAdmin && (
                      <div className="mt-4 p-3 rounded-lg border border-blue-500 bg-blue-900/20">
                        <p
                          style={{ color: "#BFDBFE" }}
                          className="text-xs text-center"
                        >
                          🔒 Additional details are restricted to administrators
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
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
