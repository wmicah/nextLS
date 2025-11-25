"use client";

import { useState, useRef } from "react";
import { X, Upload, CheckCircle, Plus, ChevronLeft } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { COLORS } from "@/lib/colors";

// Default categories that are always available
const DEFAULT_CATEGORIES = [
  "Conditioning",
  "Drive",
  "Whip",
  "Separation",
  "Stability",
  "Extension",
];

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadResourceModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadResourceModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch existing categories
  const { data: categoriesData = [] } =
    trpc.libraryResources.getCategories.useQuery();

  // Generate thumbnail from video
  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.onloadedmetadata = () => {
        // Set canvas dimensions to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Seek to 2 seconds or 10% of video duration (whichever is smaller)
        const seekTime = Math.min(2, video.duration * 0.1);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        if (ctx) {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to base64 image
          const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.8);
          resolve(thumbnailDataUrl);
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };

      video.onerror = () => {
        reject(new Error("Error loading video"));
      };

      // Create object URL for the video file
      const videoUrl = URL.createObjectURL(file);
      video.src = videoUrl;
      video.load();
    });
  };

  const utils = trpc.useUtils();

  const uploadMutation = trpc.library.upload.useMutation({
    onSuccess: data => {

      // Invalidate and refetch library queries to show new data
      utils.library.list.invalidate();
      utils.library.getStats.invalidate();

      // Trigger server-side thumbnail generation for video files
      if (data.resource.type === "video" && data.resource.filename) {
        setTimeout(async () => {
          try {
            await fetch("/api/generate-thumbnail", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                filename: data.resource.filename,
                videoType: "local",
              }),
            });
          } catch (error) {
            console.error("Thumbnail generation failed:", error);
          }
        }, 1000);
      }

      onSuccess();
      handleClose();
    },
    onError: error => {
      console.error("Upload error:", error);
      alert(`Save failed: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleClose = () => {
    // Reset form
    setTitle("");
    setDescription("");
    setCategory("");
    setCustomCategory("");
    setShowCustomInput(false);
    setUploadedFile(null);
    setThumbnail(null);
    setIsSubmitting(false);
    setIsUploading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFile) {
      alert("Please upload a file first");
      return;
    }

    // Use custom category if provided, otherwise use selected category
    const finalCategory = showCustomInput ? customCategory.trim() : category;

    if (!title.trim() || !finalCategory) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await uploadMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category: finalCategory,
        fileUrl: uploadedFile.url,
        filename: uploadedFile.name,
        contentType: uploadedFile.type,
        size: uploadedFile.size,
        thumbnail: thumbnail || undefined, // Include the generated thumbnail
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}>
      <div
        className="rounded-lg p-4 w-full max-w-xl border max-h-[90vh] overflow-y-auto shadow-lg"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
            Upload Resource
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md transition-all duration-200"
            style={{ color: COLORS.TEXT_SECONDARY }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* File Upload Section */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: COLORS.TEXT_SECONDARY }}>
              File Upload *
            </label>

            {!uploadedFile && !isUploading ? (
              <div
                className="border-2 border-dashed rounded-md p-4 text-center"
                style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: COLORS.BACKGROUND_CARD }}
              >
                <UploadButton<OurFileRouter, "videoUploader">
                  endpoint="videoUploader"
                  onBeforeUploadBegin={files => {
                    setIsUploading(true);
                    return files;
                  }}
                  onClientUploadComplete={async res => {
                    const file = res[0];
                    console.log("🎥 UploadResourceModal - Upload complete:", {
                      name: file.name,
                      url: file.url,
                      size: file.size,
                      type: file.type,
                      key: file.key,
                    });

                    // Validate URL format
                    try {
                      new URL(file.url);
                    } catch (error) {
                      console.error(
                        "❌ UploadResourceModal - Invalid UploadThing URL:",
                        file.url,
                        error
                      );
                    }

                    const uploadedFileData = {
                      url: file.url,
                      name: file.name,
                      size: file.size,
                      type: file.type || "application/octet-stream",
                    };

                    setUploadedFile(uploadedFileData);
                    setIsUploading(false);

                    // Generate thumbnail for video files
                    if (file.type && file.type.startsWith("video/")) {
                      try {
                        // We need to get the actual file, not just the URL
                        const response = await fetch(file.url);
                        const blob = await response.blob();
                        const videoFile = new File([blob], file.name, {
                          type: file.type,
                        });

                        const thumbnailDataUrl = await generateThumbnail(
                          videoFile
                        );
                        setThumbnail(thumbnailDataUrl);
                      } catch (error) {
                        console.error("Error generating thumbnail:", error);
                        // Fallback to default video icon
                        setThumbnail(null);
                      }
                    }
                  }}
                  onUploadError={(error: Error) => {
                    console.error("Upload error:", error);
                    alert(`Upload failed: ${error.message}`);
                    setIsUploading(false);
                  }}
                  appearance={{
                    button: {
                      background: COLORS.GOLDEN_DARK,
                      color: COLORS.TEXT_PRIMARY,
                      border: "none",
                      borderRadius: "6px",
                      padding: "10px 20px",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    },
                    container: {
                      width: "100%",
                    },
                    allowedContent: {
                      color: COLORS.TEXT_MUTED,
                      fontSize: "11px",
                      marginTop: "6px",
                    },
                  }}
                />
              </div>
            ) : isUploading ? (
              <div
                className="border-2 border-dashed rounded-md p-4 text-center"
                style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: COLORS.BACKGROUND_CARD }}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: COLORS.GOLDEN_ACCENT }}
                  />
                  <p style={{ color: COLORS.TEXT_PRIMARY }} className="font-medium text-xs">
                    Uploading file...
                  </p>
                  <p style={{ color: COLORS.TEXT_SECONDARY }} className="text-xs">
                    Please wait, do not close this window
                  </p>
                </div>
              </div>
            ) : uploadedFile ? (
              <div
                className="border rounded-md p-3"
                style={{
                  borderColor: COLORS.BORDER_SUBTLE,
                  backgroundColor: COLORS.BACKGROUND_CARD,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" style={{ color: COLORS.GREEN_PRIMARY }} />
                    <div>
                      <p style={{ color: COLORS.TEXT_PRIMARY }} className="font-medium text-xs">
                        {uploadedFile.name}
                      </p>
                      <p style={{ color: COLORS.TEXT_SECONDARY }} className="text-[10px]">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      setThumbnail(null);
                    }}
                    className="p-1 rounded-md transition-all duration-200"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Thumbnail Preview */}
                {thumbnail && (
                  <div className="mt-2">
                    <p style={{ color: COLORS.TEXT_SECONDARY }} className="text-xs mb-1.5">
                      Generated Thumbnail:
                    </p>
                    <img
                      src={thumbnail}
                      alt="Video thumbnail"
                      className="w-full h-24 object-cover rounded-md"
                      style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Rest of form fields remain the same */}
          <div>
            <label className="block text-xs mb-1" style={{ color: COLORS.TEXT_SECONDARY }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border text-xs focus:outline-none transition-all duration-200"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              }}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: COLORS.TEXT_SECONDARY }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border h-20 text-xs focus:outline-none transition-all duration-200 resize-none"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              }}
              placeholder="Optional description..."
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Focus Area *
            </label>

            {!showCustomInput ? (
              <div className="space-y-1.5">
                {/* Dropdown */}
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required={!showCustomInput}
                  className="w-full px-2.5 py-1.5 rounded-md border text-xs focus:outline-none transition-all duration-200"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }}
                  disabled={isSubmitting || showCustomInput}
                >
                  <option value="" style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_SECONDARY }}>
                    Select a category...
                  </option>

                  {/* Standard Categories */}
                  <optgroup
                    label="Standard Categories"
                    style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}
                  >
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option
                        key={cat}
                        value={cat}
                        style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}
                      >
                        {cat}
                      </option>
                    ))}
                  </optgroup>

                  {/* User's Custom Categories */}
                  {categoriesData.filter(
                    cat => !DEFAULT_CATEGORIES.includes(cat.name)
                  ).length > 0 && (
                    <optgroup
                      label="Your Categories"
                      style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}
                    >
                      {categoriesData
                        .filter(cat => !DEFAULT_CATEGORIES.includes(cat.name))
                        .map(cat => (
                          <option
                            key={cat.name}
                            value={cat.name}
                            style={{
                              backgroundColor: COLORS.BACKGROUND_DARK,
                              color: COLORS.TEXT_PRIMARY,
                            }}
                          >
                            {cat.name} ({cat.count})
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>

                {/* Or Create New Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(true);
                    setCategory("");
                  }}
                  className="w-full px-2.5 py-1.5 rounded-md border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-1.5 font-medium text-xs"
                  style={{
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_SECONDARY,
                    backgroundColor: COLORS.BACKGROUND_CARD,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  }}
                  disabled={isSubmitting}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Or create a new category
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="Enter new category name (e.g., Pitching Mechanics)"
                  required
                  maxLength={50}
                  className="w-full px-2.5 py-1.5 rounded-md border-2 text-xs focus:outline-none transition-all duration-200"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.GOLDEN_ACCENT,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }}
                  autoFocus
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomCategory("");
                  }}
                  className="text-xs px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5"
                  style={{
                    color: COLORS.TEXT_SECONDARY,
                    backgroundColor: COLORS.BACKGROUND_DARK,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                  }}
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back to categories
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-3 py-2 rounded-md transition-all duration-200 font-medium text-xs border"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_SECONDARY,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 font-medium text-xs disabled:opacity-50"
              style={{
                backgroundColor: COLORS.GOLDEN_DARK,
                color: COLORS.TEXT_PRIMARY,
              }}
              onMouseEnter={e => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                }
              }}
              onMouseLeave={e => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                }
              }}
              disabled={isSubmitting || !uploadedFile}
            >
              {isSubmitting ? (
                <>
                  <div
                    className="animate-spin rounded-full h-3.5 w-3.5 border-b-2"
                    style={{ borderColor: COLORS.TEXT_PRIMARY }}
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Save Resource
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
