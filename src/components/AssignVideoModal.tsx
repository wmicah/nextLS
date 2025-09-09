"use client";

import { useState } from "react";
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

interface AssignVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

export default function AssignVideoModal({
  isOpen,
  onClose,
  clientId,
  clientName,
}: AssignVideoModalProps) {
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [instructions, setInstructions] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [videoType, setVideoType] = useState<"all" | "master" | "local">("all");

  // Fetch available videos
  const { data: videos = [], isLoading: videosLoading } =
    trpc.library.list.useQuery({
      type: "video",
    });

  const utils = trpc.useUtils();
  const assignVideoMutation = trpc.library.assignVideoToClient.useMutation({
    onSuccess: () => {
      setIsAssigning(false);
      onClose();
      setSelectedVideo("");
      setDueDate("");
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

    setIsAssigning(true);
    assignVideoMutation.mutate({
      videoId: selectedVideo,
      clientId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
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
      (videoType === "master" && video.isMasterVideo) ||
      (videoType === "local" && !video.isMasterVideo);

    return matchesSearch && matchesType;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="rounded-2xl shadow-xl border p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "#8B5CF6" }}
            >
              <Video className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Assign Video</h2>
              <p className="text-sm text-gray-400">
                Assign a training video to {clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Video Type Tabs */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Video Type
            </label>
            <div
              className="flex rounded-lg border overflow-hidden"
              style={{ borderColor: "#606364" }}
            >
              <button
                onClick={() => setVideoType("all")}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  videoType === "all" ? "text-white" : "text-gray-400"
                }`}
                style={{
                  backgroundColor: videoType === "all" ? "#4A5A70" : "#2A2F2F",
                }}
              >
                All Videos
              </button>
              <button
                onClick={() => setVideoType("master")}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  videoType === "master" ? "text-white" : "text-gray-400"
                }`}
                style={{
                  backgroundColor:
                    videoType === "master" ? "#4A5A70" : "#2A2F2F",
                }}
              >
                Master Videos
              </button>
              <button
                onClick={() => setVideoType("local")}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  videoType === "local" ? "text-white" : "text-gray-400"
                }`}
                style={{
                  backgroundColor:
                    videoType === "local" ? "#4A5A70" : "#2A2F2F",
                }}
              >
                Local Videos
              </button>
            </div>
          </div>

          {/* Video Search */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Search Videos
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search videos by name, description, or type..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border text-white"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: "#606364",
                }}
              />
            </div>
          </div>

          {/* Video Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Select Video
            </label>

            {videosLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                <span className="ml-2 text-gray-400">Loading videos...</span>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-8">
                <Video className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">
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
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedVideo === video.id
                        ? "border-purple-400 bg-purple-500/10"
                        : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Video Thumbnail */}
                      <div
                        className="w-16 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#2A2F2F" }}
                      >
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Play className="h-6 w-6 text-gray-400" />
                        )}
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1 truncate">
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                            {video.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {video.type && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {video.type}
                            </div>
                          )}
                          {video.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {video.duration}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {selectedVideo === video.id && (
                        <div className="flex-shrink-0">
                          <Check className="h-5 w-5 text-purple-400" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Due Date (Optional) */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              className="w-full p-3 rounded-lg border text-white"
              style={{
                backgroundColor: "#2A2F2F",
                borderColor: "#606364",
              }}
            />
            <p className="text-xs text-gray-400 mt-1">
              Set a deadline for the client to complete this video assignment
            </p>
          </div>

          {/* Instructions (Optional) */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Instructions (Optional)
            </label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Add specific instructions or notes for this video assignment..."
              rows={3}
              className="w-full p-3 rounded-lg border text-white resize-none"
              style={{
                backgroundColor: "#2A2F2F",
                borderColor: "#606364",
              }}
            />
            <p className="text-xs text-gray-400 mt-1">
              Provide any specific instructions or context for this video
            </p>
          </div>

          {/* Video Preview */}
          {selectedVideo && (
            <div
              className="p-4 rounded-lg border"
              style={{ backgroundColor: "#2A2F2F", borderColor: "#606364" }}
            >
              <h4 className="font-semibold text-white mb-2">Selected Video</h4>
              {(() => {
                const video = videos.find((v: any) => v.id === selectedVideo);
                return video ? (
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-9 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#1F2937" }}
                    >
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Play className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 font-medium truncate">
                        {video.title}
                      </p>
                      {video.type && (
                        <p className="text-xs text-gray-400">{video.type}</p>
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
              borderColor: "#606364",
              color: "#FFFFFF",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedVideo || isAssigning}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: "#8B5CF6",
              color: "#FFFFFF",
            }}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Assign Video
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
