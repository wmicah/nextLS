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
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const uploadStartTimeRef = useRef<number | null>(null);
  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const uploadFileInfoRef = useRef<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

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
      const progressRatio = Math.min(elapsed / estimatedDuration, 0.93); // Cap at 93% to wait for real progress

      // Use easing function for smooth progress
      const easedProgress = 1 - Math.pow(1 - progressRatio, 3); // Cubic ease-out
      currentProgress = Math.min(Math.floor(easedProgress * 93), 93);

      setUploadProgress(currentProgress);
    }, 50); // Update every 50ms for smooth animation
  }, []);

  const handleUploadComplete = useCallback(
    async (res: any) => {
      try {
        // Clear any timeout since callback fired successfully
        if (uploadTimeoutRef.current) {
          clearTimeout(uploadTimeoutRef.current);
          uploadTimeoutRef.current = null;
        }

        // Complete the progress bar
        setUploadProgress(100);

        // Wait a moment to show 100% before completing
        await new Promise(resolve => setTimeout(resolve, 300));

        const file = res[0];
        if (!file) {
          console.error("❌ Upload complete but no file in response:", res);
          setError("Upload failed - no file returned");
          stopProgressSimulation();
          setUploading(false);
          setUploadProgress(0);
          uploadFileInfoRef.current = null;
          return;
        }

        console.log("✅ Upload complete callback fired successfully:", {
          name: file.name,
          url: file.url,
          size: file.size,
          type: file.type,
          key: file.key,
        });

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

        // Reset state
        uploadFileInfoRef.current = null;
      } catch (err) {
        console.error("❌ Upload complete error:", err);
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

  const handleUploadError = useCallback(
    (error: Error) => {
      console.error("❌ Upload error:", error);
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      setError(
        `Upload failed: ${
          error.message ||
          "Unknown error occurred. Please check your connection and try again."
        }`
      );
      stopProgressSimulation();
      setUploading(false);
      setUploadProgress(0);
    },
    [stopProgressSimulation]
  );

  // Add timeout to detect stuck uploads
  useEffect(() => {
    if (uploading) {
      // If upload starts but progress stays at 0% for more than 10 seconds, show error
      if (uploadProgress === 0) {
        uploadTimeoutRef.current = setTimeout(() => {
          if (uploadProgress === 0 && uploading) {
            console.error(
              "⏱️ Upload timeout - no progress detected after 10 seconds"
            );
            setError(
              "Upload appears to be stuck. This might be due to:\n- Missing UploadThing credentials\n- Network connectivity issues\n- Server configuration problems\n\nPlease check the browser console for more details."
            );
            stopProgressSimulation();
            setUploading(false);
          }
        }, 10000); // 10 second timeout
      }
      // If progress is stuck at 93%+ for more than 20 seconds, assume upload completed but callback failed
      // This handles the ECONNRESET case where upload succeeds but metadata registration fails
      // Longer timeout for cellular connections which may have delays
      else if (uploadProgress >= 93 && uploading) {
        uploadTimeoutRef.current = setTimeout(() => {
          if (uploadProgress >= 93 && uploading) {
            console.warn(
              "⚠️ Upload appears stuck at high progress (93%+). Assuming upload completed but callback failed."
            );
            console.warn(
              "💡 This is likely due to ECONNRESET during metadata registration (common on cellular connections)."
            );
            console.warn(
              "💡 The file was likely uploaded successfully to UploadThing."
            );
            // Set progress to 100% to show completion
            setUploadProgress(100);
            // Show error with instructions specific to cellular connections
            setError(
              "Upload appears to have completed, but we couldn't confirm it due to a connection issue (common on cellular/mobile networks). The file may have uploaded successfully."
            );
            // Show manual URL input option
            setShowManualUrlInput(true);
            // Reset after a moment
            setTimeout(() => {
              stopProgressSimulation();
              setUploading(false);
              setUploadProgress(0);
            }, 2000);
          }
        }, 20000); // 20 second timeout for high progress (93%+) - longer for cellular
      }
      // If progress reaches 100% but callback doesn't fire within 5 seconds,
      // this likely means metadata registration failed (ECONNRESET)
      // Longer timeout for cellular connections which may have delays
      else if (uploadProgress >= 100 && uploading) {
        uploadTimeoutRef.current = setTimeout(() => {
          if (uploadProgress >= 100 && uploading) {
            console.error(
              "❌ Upload completed (100%) but onClientUploadComplete callback never fired."
            );
            console.error(
              "💡 This is likely due to ECONNRESET during metadata registration (common on cellular connections)."
            );
            console.error(
              "💡 The file was uploaded successfully, but we can't retrieve the URL."
            );
            setError(
              "Upload completed but connection was interrupted (common on cellular/mobile networks). The file may have uploaded successfully, but we couldn't retrieve the URL."
            );
            // Show manual URL input option
            setShowManualUrlInput(true);
            stopProgressSimulation();
            setUploading(false);
            setUploadProgress(0);
          }
        }, 5000); // 5 second timeout after reaching 100% - longer for cellular
      }
    }

    return () => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
        uploadTimeoutRef.current = null;
      }
    };
  }, [uploading, uploadProgress, stopProgressSimulation]);

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
          boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px ${getGoldenAccent(
            0.1
          )}`,
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
            <p
              className="text-sm mt-1"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Attach files to your message
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: COLORS.TEXT_SECONDARY }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor =
                COLORS.BACKGROUND_CARD_HOVER;
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
              e.currentTarget.style.backgroundColor =
                COLORS.BACKGROUND_CARD_HOVER;
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
            <p
              className="text-sm mb-6"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Supports images, videos, audio, PDFs, and documents
            </p>

            <div className="flex flex-col items-center">
              <div className={uploading ? "hidden" : ""}>
                <UploadButton<OurFileRouter, "messageAttachmentUploader">
                  endpoint="messageAttachmentUploader"
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  onUploadBegin={(file: string) => {
                    console.log("📤 Upload started:", file);
                    setUploading(true);
                    setError(null);
                    // Store file info for potential fallback
                    uploadFileInfoRef.current = {
                      name: file,
                      size: 0, // Will be updated if available
                      type: "application/octet-stream",
                    };
                    startProgressSimulation();
                    // Clear any existing timeout
                    if (uploadTimeoutRef.current) {
                      clearTimeout(uploadTimeoutRef.current);
                      uploadTimeoutRef.current = null;
                    }
                  }}
                  onUploadProgress={(progress: number) => {
                    console.log("📊 Upload progress:", progress);
                    // If we get real progress, update it (allow up to 99% from real progress)
                    if (progress > 0) {
                      setUploadProgress(Math.min(progress, 99));
                      // If progress reaches 100%, the upload is complete
                      // But we should still wait for onClientUploadComplete for the URL
                      if (progress >= 100) {
                        console.log(
                          "📊 Upload progress reached 100%, waiting for completion callback..."
                        );
                        setUploadProgress(100);
                        // Stop simulation since we have real progress
                        stopProgressSimulation();
                        // For cellular connections, give more time for callback due to potential delays
                        // The timeout effect will handle if callback doesn't fire
                      }
                    }
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
                  <span
                    className="text-xs"
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
                    {uploadProgress < 100
                      ? `${uploadProgress}% complete`
                      : "Finalizing..."}
                  </span>
                </div>
              )}
            </div>
          )}

          {showManualUrlInput && (
            <div
              className="space-y-3 p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <p className="text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
                If the file uploaded successfully, you can paste the UploadThing
                URL here:
              </p>
              <input
                type="text"
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
                placeholder="https://utfs.io/f/..."
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: COLORS.BACKGROUND_DARK,
                  color: COLORS.TEXT_PRIMARY,
                  border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (manualUrl && manualUrl.includes("utfs.io")) {
                      // Extract file info from URL
                      const urlParts = manualUrl.split("/f/");
                      const fileKey = urlParts[1]?.split("?")[0] || "";
                      const fileName =
                        uploadFileInfoRef.current?.name || "uploaded-file";
                      const fileType =
                        uploadFileInfoRef.current?.type ||
                        "application/octet-stream";

                      const uploadData = {
                        attachmentUrl: manualUrl,
                        attachmentType: fileType,
                        attachmentName: fileName,
                        attachmentSize: 0, // Unknown size
                      };

                      const dummyFile = new File([], fileName, {
                        type: fileType,
                      });
                      onFileSelect(dummyFile, uploadData);
                      setShowManualUrlInput(false);
                      setManualUrl("");
                      setError(null);
                    } else {
                      setError(
                        "Please enter a valid UploadThing URL (https://utfs.io/f/...)"
                      );
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: COLORS.BLUE_PRIMARY,
                    color: "#ffffff",
                  }}
                >
                  Use This URL
                </button>
                <button
                  onClick={() => {
                    setShowManualUrlInput(false);
                    setManualUrl("");
                    setError(null);
                    uploadFileInfoRef.current = null;
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    color: COLORS.TEXT_SECONDARY,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  Cancel
                </button>
              </div>
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
              e.currentTarget.style.backgroundColor =
                COLORS.BACKGROUND_CARD_HOVER;
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
