"use client";

import { useState } from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { trpc } from "@/app/_trpc/client";
import {
  Video,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  FileVideo,
  Clock,
  Tag,
} from "lucide-react";

interface VideoUploadProps {
  clientId?: string;
  onUploadComplete?: (videoId: string) => void;
}

export default function VideoUpload({
  clientId,
  onUploadComplete,
}: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "BULLPEN" as const,
  });

  const utils = trpc.useUtils();

  const createVideoMutation = trpc.videos.create.useMutation({
    onSuccess: video => {
      setIsUploading(false);
      setUploadedFile(null);
      setFormData({ title: "", description: "", category: "BULLPEN" });
      // Invalidate and refetch videos list
      utils.videos.list.invalidate();
      onUploadComplete?.(video.id);
    },
    onError: error => {
      console.error("Failed to create video:", error);
      setIsUploading(false);
    },
  });

  const handleUploadComplete = (res: any) => {
    console.log("Upload complete:", res);
    if (res?.[0]) {
      setUploadedFile(res[0]);
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!uploadedFile || !formData.title.trim()) return;

    console.log("Saving video with data:", {
      title: formData.title,
      description: formData.description,
      url: uploadedFile.url,
      fileSize: uploadedFile.size,
      clientId,
      category: formData.category,
    });

    setIsUploading(true);
    try {
      const result = await createVideoMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        url: uploadedFile.url,
        fileSize: uploadedFile.size,
        clientId,
        category: formData.category,
      });
      console.log("Video saved successfully:", result);
    } catch (error) {
      console.error("Error saving video:", error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!uploadedFile ? (
        <div className="text-center space-y-6">
          {/* Upload Area */}
          <div className="relative group">
            <div
              className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
              }}
            />
            <div
              className="relative p-8 rounded-2xl border-2 border-dashed transition-all duration-300"
              style={{
                backgroundColor: "#2a2a2a",
                borderColor: "#374151",
              }}
            >
              <div className="flex flex-col items-center space-y-4">
                <div
                  className="p-4 rounded-full"
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <Video className="w-8 h-8" style={{ color: "#C3BCC2" }} />
                </div>
                <div>
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: "#C3BCC2" }}
                  >
                    Upload Video
                  </h3>
                  <p className="text-sm" style={{ color: "#ABA4AA" }}>
                    Drag and drop or click to select your video file
                  </p>
                </div>

                <UploadButton<OurFileRouter, "feedbackVideoUploader">
                  endpoint="feedbackVideoUploader"
                  onUploadBegin={() => setIsUploading(true)}
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={(error: Error) => {
                    console.error("Upload error:", error);
                    setIsUploading(false);
                  }}
                  className="w-full"
                />

                <div
                  className="flex items-center gap-4 text-xs"
                  style={{ color: "#6b7280" }}
                >
                  <div className="flex items-center gap-1">
                    <FileVideo className="w-3 h-3" />
                    <span>MP4, MOV, AVI</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Up to 1GB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Success Header */}
          <div
            className="flex items-center justify-between p-4 rounded-xl border"
            style={{ backgroundColor: "#2A3133", borderColor: "#606364" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "#10b981" }}
              >
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: "#C3BCC2" }}>
                  Upload Complete
                </h3>
                <p className="text-sm" style={{ color: "#ABA4AA" }}>
                  Now add details about your video
                </p>
              </div>
            </div>
            <button
              onClick={() => setUploadedFile(null)}
              className="p-2 rounded-lg transition-colors hover:bg-gray-700"
            >
              <X className="w-4 h-4" style={{ color: "#ABA4AA" }} />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#ABA4AA" }}
              >
                Video Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Bullpen Session - Fastball Focus"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                style={{
                  backgroundColor: "#374151",
                  borderColor: "#606364",
                  color: "#ffffff",
                  border: "1px solid",
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#ABA4AA" }}
                >
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                  style={{
                    backgroundColor: "#374151",
                    borderColor: "#606364",
                    color: "#ffffff",
                    border: "1px solid",
                  }}
                >
                  <option value="BULLPEN">Bullpen</option>
                  <option value="PRACTICE">Practice</option>
                  <option value="GAME_FOOTAGE">Game Footage</option>
                  <option value="REFERENCE">Reference</option>
                  <option value="COMPARISON">Comparison</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="flex items-end">
                <div
                  className="w-full p-3 rounded-xl"
                  style={{
                    backgroundColor: "#374151",
                    borderColor: "#606364",
                    border: "1px solid",
                  }}
                >
                  <div
                    className="flex items-center gap-2 text-sm"
                    style={{ color: "#ABA4AA" }}
                  >
                    <Tag className="w-4 h-4" />
                    <span>Category</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#ABA4AA" }}
              >
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Add any notes about this video..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 resize-none"
                style={{
                  backgroundColor: "#374151",
                  borderColor: "#606364",
                  color: "#ffffff",
                  border: "1px solid",
                }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!formData.title.trim() || isUploading}
              className="w-full px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Video"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
