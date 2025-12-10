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
import { COLORS, getGoldenAccent } from "@/lib/colors";

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
    console.log("🎥 Upload complete:", res);
    if (res?.[0]) {
      const file = res[0];
      console.log("📁 Uploaded file details:", {
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type,
        key: file.key,
      });

      // Validate URL format
      try {
        new URL(file.url);
        console.log("✅ UploadThing URL is valid:", file.url);
      } catch (error) {
        console.error("❌ Invalid UploadThing URL:", file.url, error);
      }

      setUploadedFile(file);
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
                background: `linear-gradient(135deg, ${getGoldenAccent(0.3)} 0%, ${COLORS.BORDER_SUBTLE} 50%, ${COLORS.BACKGROUND_CARD} 100%)`,
              }}
            />
            <div
              className="relative p-8 rounded-2xl border-2 border-dashed transition-all duration-300"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = getGoldenAccent(0.4);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              }}
            >
              <div className="flex flex-col items-center space-y-4">
                <div
                  className="p-4 rounded-full border"
                  style={{ 
                    backgroundColor: getGoldenAccent(0.2),
                    borderColor: getGoldenAccent(0.4),
                  }}
                >
                  <Video className="w-8 h-8" style={{ color: COLORS.GOLDEN_ACCENT }} />
                </div>
                <div>
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Upload Video
                  </h3>
                  <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                    Drag and drop or click to select your video file
                  </p>
                </div>

                {/* @ts-expect-error - effect version conflict workaround */}
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
                  style={{ color: COLORS.TEXT_MUTED }}
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
            style={{ 
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg border"
                style={{ 
                  backgroundColor: COLORS.GREEN_PRIMARY,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
              >
                <CheckCircle className="w-5 h-5" style={{ color: COLORS.TEXT_PRIMARY }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Upload Complete
                </h3>
                <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                  Now add details about your video
                </p>
              </div>
            </div>
            <button
              onClick={() => setUploadedFile(null)}
              className="p-2 rounded-lg transition-colors border"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_SECONDARY,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.borderColor = COLORS.RED_ALERT;
                e.currentTarget.style.color = COLORS.RED_ALERT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.TEXT_SECONDARY }}
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
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 border"
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

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.TEXT_SECONDARY }}
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
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 border"
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
                <option value="BULLPEN" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>Bullpen</option>
                <option value="PRACTICE" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>Practice</option>
                <option value="GAME_FOOTAGE" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>Game Footage</option>
                <option value="REFERENCE" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>Reference</option>
                <option value="COMPARISON" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>Comparison</option>
                <option value="OTHER" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>Other</option>
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.TEXT_SECONDARY }}
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
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 resize-none border"
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

            <button
              onClick={handleSave}
              disabled={!formData.title.trim() || isUploading}
              className="w-full px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border"
              style={{ 
                backgroundColor: !formData.title.trim() || isUploading
                  ? COLORS.BACKGROUND_CARD
                  : getGoldenAccent(0.2),
                color: COLORS.TEXT_PRIMARY,
                borderColor: !formData.title.trim() || isUploading
                  ? COLORS.BORDER_SUBTLE
                  : getGoldenAccent(0.4),
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = getGoldenAccent(0.3);
                  e.currentTarget.style.borderColor = getGoldenAccent(0.5);
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = getGoldenAccent(0.2);
                  e.currentTarget.style.borderColor = getGoldenAccent(0.4);
                }
              }}
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ 
                      borderColor: `${COLORS.TEXT_PRIMARY}30`,
                      borderTopColor: COLORS.TEXT_PRIMARY,
                    }}
                  />
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
