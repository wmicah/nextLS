"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  X,
  Video,
  Calendar,
  User,
  Check,
  Loader2,
  Search,
  Play,
  Clock,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { COLORS } from "@/lib/colors";

interface AssignVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  startDate?: string;
}

export default function AssignVideoModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  startDate,
}: AssignVideoModalProps) {
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [assignDate, setAssignDate] = useState<string>("");
  const [instructions, setInstructions] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [videoType, setVideoType] = useState<"all" | "master" | "local">("all");

  // Set assign date when modal opens with startDate
  useEffect(() => {
    if (isOpen && startDate) {
      setAssignDate(startDate);
    }
  }, [isOpen, startDate]);

  // Fetch available videos
  const { data: videosData, isLoading: videosLoading } =
    trpc.library.list.useQuery({
      type: "video",
    });

  const videos = videosData?.items || [];

  const utils = trpc.useUtils();
  const assignVideoMutation = trpc.library.assignVideoToClient.useMutation({
    onSuccess: () => {
      setIsAssigning(false);
      onClose();
      setSelectedVideo("");
      setAssignDate("");
      setInstructions("");
      setSearchTerm("");

      // Invalidate relevant queries
      utils.library.getClientAssignments.invalidate({ clientId });
      utils.clients.getById.invalidate({ id: clientId });
    },
    onError: error => {
      setIsAssigning(false);
      alert(`Error assigning video: ${error.message}`);
    },
  });

  const handleAssign = async () => {
    if (!selectedVideo) {
      alert("Please select a video");
      return;
    }

    if (!assignDate) {
      alert("Please select an assign date");
      return;
    }

    setIsAssigning(true);
    assignVideoMutation.mutate({
      videoId: selectedVideo,
      clientId,
      dueDate: assignDate,
      notes: instructions || undefined,
    });
  };

  // Filter videos based on search term and type
  const filteredVideos = videos.filter((video: any) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      videoType === "all" ||
      (videoType === "master" && video.isMasterLibrary) ||
      (videoType === "local" && !video.isMasterLibrary);

    return matchesSearch && matchesType;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
      <div
        className="rounded-2xl shadow-xl border p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "#1C2021",
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>Assign Video</h2>
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                Assign a training video to {clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: COLORS.TEXT_SECONDARY }}
            onMouseEnter={(e) => e.currentTarget.style.color = COLORS.TEXT_PRIMARY}
            onMouseLeave={(e) => e.currentTarget.style.color = COLORS.TEXT_SECONDARY}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Video Type Tabs */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
              Video Type
            </label>
            <div
              className="flex rounded-lg border overflow-hidden"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              <button
                onClick={() => setVideoType("all")}
                className="px-4 py-2 text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: videoType === "all" ? COLORS.GOLDEN_DARK : "#2A2F2F",
                  color: videoType === "all" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                }}
              >
                All Videos
              </button>
              <button
                onClick={() => setVideoType("master")}
                className="px-4 py-2 text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor:
                    videoType === "master" ? COLORS.GOLDEN_DARK : "#2A2F2F",
                  color: videoType === "master" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                }}
              >
                Master Videos
              </button>
              <button
                onClick={() => setVideoType("local")}
                className="px-4 py-2 text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor:
                    videoType === "local" ? COLORS.GOLDEN_DARK : "#2A2F2F",
                  color: videoType === "local" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                }}
              >
                Local Videos
              </button>
            </div>
          </div>

          {/* Video Search */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
              Search Videos
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search videos by name, description, or type..."
                className="w-full pl-4 pr-4 py-3 rounded-lg border"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
              />
            </div>
          </div>

          {/* Video Selection */}
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: COLORS.TEXT_PRIMARY }}>
              Select Video
            </label>

            {videosLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: COLORS.GOLDEN_ACCENT }} />
                <span className="ml-2" style={{ color: COLORS.TEXT_SECONDARY }}>Loading videos...</span>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-8">
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  {searchTerm
                    ? "No videos found matching your search"
                    : "No videos available"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredVideos.map((video: any) => (
                  <div
                    key={video.id}
                    onClick={() => setSelectedVideo(video.id)}
                    className="p-4 rounded-lg border-2 cursor-pointer transition-all duration-200"
                    style={{
                      backgroundColor: selectedVideo === video.id
                        ? "#2A2F2F"
                        : "#2A2F2F",
                      borderColor: selectedVideo === video.id
                        ? COLORS.GOLDEN_ACCENT
                        : COLORS.BORDER_SUBTLE,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedVideo !== video.id) {
                        e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedVideo !== video.id) {
                        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Video Thumbnail */}
                      {video.thumbnail && (
                        <div
                          className="w-16 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#2A2F2F" }}
                        >
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 truncate" style={{ color: COLORS.TEXT_PRIMARY }}>
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-sm mb-2 line-clamp-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                            {video.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                          {video.type && (
                            <div>
                              {video.type}
                            </div>
                          )}
                          {video.duration && (
                            <div>
                              {video.duration}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {selectedVideo === video.id && (
                        <div className="flex-shrink-0">
                          <span style={{ color: COLORS.GOLDEN_ACCENT }}>✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign Date (Required) */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
              Assign Date *
            </label>
            <input
              type="date"
              value={assignDate}
              onChange={e => setAssignDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              required
              className="w-full p-3 rounded-lg border"
              style={{
                backgroundColor: "#2A2F2F",
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
            />
            <p className="text-xs mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
              Set a deadline for the client to complete this video assignment
            </p>
          </div>

          {/* Instructions (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
              Instructions (Optional)
            </label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Add specific instructions or notes for this video assignment..."
              rows={3}
              className="w-full p-3 rounded-lg border resize-none"
              style={{
                backgroundColor: "#2A2F2F",
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
            />
            <p className="text-xs mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
              Provide any specific instructions or context for this video
            </p>
          </div>

          {/* Video Preview */}
          {selectedVideo && (
            <div
              className="p-4 rounded-lg border"
              style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE }}
            >
              <h4 className="font-semibold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>Selected Video</h4>
              {(() => {
                const video = videos.find((v: any) => v.id === selectedVideo);
                return video ? (
                  <div className="flex items-start gap-3">
                    {video.thumbnail && (
                      <div
                        className="w-12 h-9 rounded flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#1F2937" }}
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: COLORS.TEXT_PRIMARY }}>
                        {video.title}
                      </p>
                      {video.type && (
                        <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>{video.type}</p>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border"
            style={{
              backgroundColor: "transparent",
              borderColor: COLORS.BORDER_SUBTLE,
              color: COLORS.TEXT_PRIMARY,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2A2F2F";
              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedVideo || isAssigning}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: COLORS.GOLDEN_ACCENT,
              color: COLORS.BACKGROUND_DARK,
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_HOVER;
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
              }
            }}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                Assign Video
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
