"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import {
  X,
  File as FileIcon,
  Image as ImageIcon,
  Video,
  Music,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import { COLORS, getGoldenAccent, getBluePrimary } from "@/lib/colors";

interface MessageFileUploadProps {
  onFileSelect: (
    file: File,
    uploadData: {
      attachmentUrl: string;
      attachmentType: string;
      attachmentName: string;
      attachmentSize: number;
    }
  ) => void;
  onClose: () => void;
}

export default function MessageFileUpload({
  onFileSelect,
  onClose,
}: MessageFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const uploadStartTimeRef = useRef<number | null>(null);

  // Simulate progress since UploadThing doesn't expose real-time progress
  // Define these functions first before they're used in other callbacks
  const stopProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    uploadStartTimeRef.current = null;
  }, []);

  const startProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    uploadStartTimeRef.current = Date.now();
    setUploadProgress(0);
    
    // Simulate progress: start fast, slow down near the end
    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      // Exponential easing - starts fast, slows down
      const elapsed = Date.now() - (uploadStartTimeRef.current || Date.now());
      const estimatedDuration = 5000; // 5 seconds estimate
      const progressRatio = Math.min(elapsed / estimatedDuration, 0.95); // Cap at 95%
      
      // Use easing function for smooth progress
      const easedProgress = 1 - Math.pow(1 - progressRatio, 3); // Cubic ease-out
      currentProgress = Math.min(Math.floor(easedProgress * 95), 95);
      
      setUploadProgress(currentProgress);
    }, 50); // Update every 50ms for smooth animation
  }, []);

  const handleUploadComplete = useCallback(
    async (res: any) => {
      try {
        // Complete the progress bar
        setUploadProgress(100);
        
        // Wait a moment to show 100% before completing
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const file = res[0];
        if (!file) {
          setError("Upload failed - no file returned");
          stopProgressSimulation();
          return;
        }

        // Create upload data with the UploadThing URL
        const uploadData = {
          attachmentUrl: file.url,
          attachmentType: file.type || "application/octet-stream",
          attachmentName: file.name,
          attachmentSize: file.size,
        };

        // Create a dummy File object for compatibility
        const dummyFile = new File([], file.name, { type: file.type });
        onFileSelect(dummyFile, uploadData);
      } catch (err) {
        console.error("Upload complete error:", err);
        setError("Failed to process uploaded file");
      } finally {
        stopProgressSimulation();
        setUploading(false);
        // Keep progress at 100 for a moment, then reset
        setTimeout(() => {
          setUploadProgress(0);
        }, 500);
      }
    },
    [onFileSelect, stopProgressSimulation]
  );

  const handleUploadError = useCallback((error: Error) => {
    console.error("Upload error:", error);
    setError(`Upload failed: ${error.message}`);
    stopProgressSimulation();
    setUploading(false);
    setUploadProgress(0);
  }, [stopProgressSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressSimulation();
    };
  }, [stopProgressSimulation]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-6 w-6" />;
    if (fileType.startsWith("video/")) return <Video className="h-6 w-6" />;
    if (fileType.startsWith("audio/")) return <Music className="h-6 w-6" />;
    return <FileIcon className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px ${getGoldenAccent(0.1)}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div>
            <h3
              className="text-lg font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Upload File
            </h3>
            <p className="text-sm mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
              Attach files to your message
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-200"
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
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div
              className="p-3 rounded-lg border flex items-center gap-2"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderColor: "rgba(239, 68, 68, 0.2)",
              }}
            >
              <AlertCircle className="h-4 w-4" style={{ color: "#ef4444" }} />
              <span className="text-sm" style={{ color: "#ef4444" }}>
                {error}
              </span>
            </div>
          )}

          <div
            className="border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              backgroundColor: COLORS.BACKGROUND_CARD,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
            }}
          >
            <Paperclip
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: COLORS.TEXT_MUTED }}
            />
            <p className="mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
              Upload a file attachment
            </p>
            <p className="text-sm mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
              Supports images, videos, audio, PDFs, and documents
            </p>

            <div className="flex flex-col items-center">
              <div className={uploading ? "hidden" : ""}>
                <UploadButton<OurFileRouter, "messageAttachmentUploader">
                  endpoint="messageAttachmentUploader"
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  onUploadBegin={() => {
                    setUploading(true);
                    setError(null);
                    startProgressSimulation();
                  }}
                  appearance={{
                    button: {
                      backgroundColor: COLORS.BLUE_PRIMARY,
                      color: "#ffffff",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      transition: "all 0.2s",
                      cursor: "pointer",
                    },
                    allowedContent: {
                      color: COLORS.TEXT_SECONDARY,
                      fontSize: "0.75rem",
                      marginTop: "0.5rem",
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div
                  className="animate-spin rounded-full h-4 w-4 border-b-2"
                  style={{
                    borderColor: `${COLORS.BLUE_PRIMARY}40`,
                    borderTopColor: COLORS.BLUE_PRIMARY,
                  }}
                />
                <span style={{ color: COLORS.TEXT_SECONDARY }}>
                  {uploadProgress > 0
                    ? `Uploading... ${uploadProgress}%`
                    : "Starting upload..."}
                </span>
              </div>
              <div
                className="w-full rounded-full h-2.5 overflow-hidden"
                style={{ backgroundColor: COLORS.BACKGROUND_CARD }}
              >
                <div
                  className="h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${uploadProgress}%`,
                    backgroundColor: COLORS.BLUE_PRIMARY,
                    minWidth: uploadProgress > 0 ? "4px" : "0",
                  }}
                />
              </div>
              {uploadProgress > 0 && (
                <div className="text-center">
                  <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    {uploadProgress < 100 ? `${uploadProgress}% complete` : "Finalizing..."}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 p-6 border-t"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              color: COLORS.TEXT_SECONDARY,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
