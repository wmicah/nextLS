"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, Check, AlertCircle } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { COLORS } from "@/lib/colors";

interface ClientVideoSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  drillId?: string;
  drillTitle?: string;
}

export default function ClientVideoSubmissionModal({
  isOpen,
  onClose,
  drillId,
  drillTitle,
}: ClientVideoSubmissionModalProps) {
  const [message, setMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const uploadStartTimeRef = useRef<number | null>(null);

  const utils = trpc.useUtils();

  const submitVideoMutation = trpc.clientRouter.submitVideo.useMutation({
    onSuccess: () => {
      utils.clientRouter.getVideoSubmissions.invalidate();
      utils.clientRouter.getVideoAssignments.invalidate();
      onClose();
      resetForm();
    },
    onError: error => {
      console.error("Submit video error:", error);
      const errorMessage = error.message || "Failed to submit video. Please try again.";
      setError(errorMessage);
      setIsSubmitting(false);
    },
  });

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
      const elapsed = Date.now() - (uploadStartTimeRef.current || Date.now());
      const estimatedDuration = 20000; // 20 seconds estimate for large videos (increased)
      const progressRatio = Math.min(elapsed / estimatedDuration, 0.94); // Cap at 94% to wait for real completion
      
      // Use easing function for smooth progress
      const easedProgress = 1 - Math.pow(1 - progressRatio, 3); // Cubic ease-out
      currentProgress = Math.min(Math.floor(easedProgress * 94), 94);
      
      setUploadProgress(currentProgress);
      
      // If we've been simulating for a long time and haven't gotten real progress, something might be wrong
      if (elapsed > 60000 && currentProgress >= 94) { // After 60 seconds at 94%
        console.warn("⚠️ Progress simulation has been running for over 60 seconds at 94%. Upload may be stuck.");
      }
    }, 50); // Update every 50ms for smooth animation
  }, []);

  const resetForm = () => {
    setMessage("");
    setVideoUrl("");
    setError("");
    setIsSubmitting(false);
    setIsUploading(false);
    setUploadProgress(0);
    stopProgressSimulation();
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
      uploadTimeoutRef.current = null;
    }
  };

  // Add timeout to detect stuck uploads
  useEffect(() => {
    if (isUploading) {
      if (uploadProgress === 0) {
        // If upload starts but progress stays at 0% for more than 15 seconds, show error
        uploadTimeoutRef.current = setTimeout(() => {
          if (uploadProgress === 0 && isUploading) {
            console.error("⏱️ Upload timeout - no progress detected after 15 seconds");
            setError("Upload appears to be stuck. This might be due to:\n- Missing UploadThing credentials\n- Network connectivity issues\n- Server configuration problems\n\nPlease check the browser console for more details.");
            stopProgressSimulation();
            setIsUploading(false);
          }
        }, 15000); // 15 second timeout for large video files
      } else if (uploadProgress >= 94) {
        // If progress is stuck at 94-95% for more than 30 seconds, the upload might have completed but callback didn't fire
        uploadTimeoutRef.current = setTimeout(() => {
          if (uploadProgress >= 94 && uploadProgress < 100 && isUploading) {
            console.warn("⚠️ Upload appears complete but callback didn't fire. Upload may have succeeded.");
            setError("Upload appears to have completed but didn't finish properly. Please try refreshing and checking if the video was uploaded, or try uploading again.");
            stopProgressSimulation();
            setIsUploading(false);
            setUploadProgress(0);
          }
        }, 30000); // 30 second timeout when stuck near completion
      }
    }
    
    return () => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
        uploadTimeoutRef.current = null;
      }
    };
  }, [isUploading, uploadProgress, stopProgressSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressSimulation();
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, [stopProgressSimulation]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoUrl) {
      setError("Please upload a video before submitting");
      return;
    }

    // Validate video URL format
    try {
      new URL(videoUrl);
    } catch {
      setError("Invalid video URL. Please upload the video again.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await submitVideoMutation.mutateAsync({
        title: drillTitle || "Video Submission",
        description: undefined,
        comment: message.trim() || undefined,
        videoUrl,
        thumbnail: undefined,
        // Ensure drillId is either a valid string or undefined (not empty string)
        drillId: drillId && drillId.trim() !== "" ? drillId : undefined,
        isPublic: false,
      });
    } catch (error) {
      // Error is already handled in onError callback
      console.error("Error submitting video:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl border w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        {/* Header */}
        <div 
          className="p-6 border-b" 
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 
                className="text-xl font-bold" 
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Record Video
              </h2>
              {drillTitle && (
                <p 
                  className="text-sm mt-1" 
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  For: {drillTitle}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
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
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg border"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.RED_BORDER,
                }}
              >
                <AlertCircle 
                  className="h-4 w-4" 
                  style={{ color: COLORS.RED_ALERT }} 
                />
                <span 
                  className="text-sm" 
                  style={{ color: COLORS.RED_ALERT }}
                >
                  {error}
                </span>
              </div>
            )}

            {/* Video Upload */}
            <div className="space-y-3">
              <label
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Upload Video *
              </label>
              {error && error.includes("Upload may have completed") && (
                <div className="p-3 rounded-lg border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                  <p className="text-sm mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                    If the upload completed in UploadThing but the callback failed, you can manually enter the video URL:
                  </p>
                  <input
                    type="text"
                    placeholder="Paste UploadThing video URL here"
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                    onPaste={(e) => {
                      const pastedUrl = e.clipboardData.getData('text');
                      if (pastedUrl && pastedUrl.includes('utfs.io')) {
                        try {
                          new URL(pastedUrl);
                          setVideoUrl(pastedUrl);
                          setError("");
                        } catch {
                          // Invalid URL, ignore
                        }
                      }
                    }}
                  />
                </div>
              )}
              {!videoUrl ? (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  {!isUploading ? (
                    <UploadButton<OurFileRouter, "videoUploader">
                      endpoint="videoUploader"
                      onClientUploadComplete={res => {
                        console.log("✅ Upload complete callback fired:", res);
                        
                        // Clear any timeout
                        if (uploadTimeoutRef.current) {
                          clearTimeout(uploadTimeoutRef.current);
                          uploadTimeoutRef.current = null;
                        }
                        
                        // Complete the progress bar
                        setUploadProgress(100);
                        stopProgressSimulation();
                        
                        // Wait a moment to show 100% before completing
                        setTimeout(() => {
                          if (res && res.length > 0) {
                            const file = res[0];
                            console.log("📁 File details:", {
                              name: file.name,
                              url: file.url,
                              size: file.size,
                              type: file.type,
                              key: file.key,
                            });
                            
                            if (file?.url) {
                              // Validate URL format
                              try {
                                new URL(file.url);
                                setVideoUrl(file.url);
                                setError("");
                                setIsUploading(false);
                                setUploadProgress(0);
                                console.log("✅ Video URL set successfully:", file.url);
                              } catch (urlError) {
                                console.error("❌ Invalid URL format:", file.url, urlError);
                                setError("Upload completed but received invalid URL. Please try again.");
                                setIsUploading(false);
                                setUploadProgress(0);
                              }
                            } else {
                              console.error("❌ No URL in file object:", file);
                              setError("Upload completed but no file URL received. Please try again.");
                              setIsUploading(false);
                              setUploadProgress(0);
                            }
                          } else {
                            console.error("❌ No files in response:", res);
                            setError("Upload completed but no file received. Please try again.");
                            setIsUploading(false);
                            setUploadProgress(0);
                          }
                        }, 300);
                      }}
                      onUploadError={(error: Error) => {
                        console.error("❌ Upload error:", error);
                        console.error("Error details:", {
                          message: error.message,
                          name: error.name,
                          stack: error.stack,
                          // Check if error has additional properties
                          ...(error as any).data && { data: (error as any).data },
                        });
                        
                        // Check for network errors specifically
                        const isNetworkError = 
                          error.message.includes("ERR_FAILED") ||
                          error.message.includes("Failed to fetch") ||
                          error.message.includes("NetworkError") ||
                          error.message.includes("network");
                        
                        // Extract more detailed error message
                        let errorMessage = error.message || "Unknown upload error";
                        
                        // Handle UploadThing specific errors
                        if (errorMessage.includes("UPLOAD_FAILED") || errorMessage === "UPLOAD_FAILED") {
                          if (isNetworkError) {
                            errorMessage = "Network error during upload. This could be due to:\n- Poor internet connection\n- Firewall or antivirus blocking the upload\n- UploadThing server temporarily unavailable\n- File corruption\n\nPlease try:\n1. Check your internet connection\n2. Try a smaller file first\n3. Disable VPN if active\n4. Try again in a few moments";
                          } else {
                            errorMessage = "Upload failed. This could be due to:\n- File size exceeds 1GB limit\n- Invalid file format\n- Network connectivity issues\n- Server configuration problems\n\nPlease check the browser console for more details.";
                          }
                        } else if (errorMessage.includes("Unauthorized")) {
                          errorMessage = "You are not logged in. Please refresh the page and try again.";
                        } else if (errorMessage.includes("Rate limit")) {
                          errorMessage = "Too many uploads. Please wait a moment and try again.";
                        } else if (errorMessage.includes("validation failed")) {
                          errorMessage = errorMessage; // Keep the detailed validation message
                        } else if (isNetworkError) {
                          errorMessage = "Network error: Unable to connect to upload server. Please check your internet connection and try again.";
                        }
                        
                        setError(`Upload failed: ${errorMessage}`);
                        stopProgressSimulation();
                        setIsUploading(false);
                        setUploadProgress(0);
                        if (uploadTimeoutRef.current) {
                          clearTimeout(uploadTimeoutRef.current);
                          uploadTimeoutRef.current = null;
                        }
                      }}
                      onUploadBegin={(name) => {
                        console.log("📤 Upload started:", name);
                        setError("");
                        setIsUploading(true);
                        startProgressSimulation();
                        // Clear any existing timeout
                        if (uploadTimeoutRef.current) {
                          clearTimeout(uploadTimeoutRef.current);
                          uploadTimeoutRef.current = null;
                        }
                      }}
                      onUploadProgress={(progress) => {
                        console.log("📊 Real upload progress from UploadThing:", progress);
                        // If we get real progress, update it and stop simulation
                        if (progress > 0) {
                          setUploadProgress(Math.min(progress, 99)); // Allow up to 99% from real progress
                          // If we're getting real progress, we can slow down or stop the simulation
                          if (progress > 50) {
                            // Real progress is significant, reduce simulation speed
                            if (progressIntervalRef.current) {
                              clearInterval(progressIntervalRef.current);
                              // Slower simulation for the rest
                              uploadStartTimeRef.current = Date.now() - (progress / 100) * 10000;
                            }
                          }
                        }
                        // If progress reaches 100%, the upload is complete
                        // But we should still wait for onClientUploadComplete for the URL
                        if (progress >= 100) {
                          console.log("📊 Upload progress reached 100%, waiting for completion callback...");
                          // Set a timeout to check if callback fires - if it doesn't, the upload may have succeeded but callback failed
                          setTimeout(() => {
                            if (isUploading && !videoUrl) {
                              console.warn("⚠️ Upload reached 100% but callback hasn't fired after 3 seconds.");
                              console.warn("💡 This might indicate metadata registration failed. Upload succeeded but callback didn't fire.");
                              console.warn("💡 Check UploadThing dashboard to verify upload and get the URL manually if needed.");
                              // Show helpful error message
                              setError("Upload appears to have completed but the completion callback didn't fire. This is often due to a network issue during metadata registration. Please:\n1. Check UploadThing dashboard to verify the upload\n2. Copy the video URL from UploadThing\n3. Paste it in the manual URL field below");
                              setIsUploading(false);
                              setUploadProgress(0);
                            }
                          }, 3000); // Increased to 3 seconds
                        }
                      }}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className="animate-spin rounded-full h-4 w-4 border-b-2"
                          style={{
                            borderColor: `${COLORS.GOLDEN_ACCENT}40`,
                            borderTopColor: COLORS.GOLDEN_ACCENT,
                          }}
                        />
                        <span style={{ color: COLORS.TEXT_SECONDARY }}>
                          {uploadProgress > 0
                            ? `Uploading... ${uploadProgress}%`
                            : "Starting upload..."}
                        </span>
                      </div>
                      <div
                        className="w-full rounded-full h-2.5 overflow-hidden mx-auto max-w-xs"
                        style={{ backgroundColor: COLORS.BACKGROUND_CARD }}
                      >
                        <div
                          className="h-2.5 rounded-full transition-all duration-300 ease-out"
                          style={{
                            width: `${uploadProgress}%`,
                            backgroundColor: COLORS.GOLDEN_ACCENT,
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
              ) : (
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: COLORS.BACKGROUND_CARD }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded flex items-center justify-center"
                      style={{ backgroundColor: COLORS.BACKGROUND_CARD }}
                    >
                      <Check 
                        className="h-6 w-6" 
                        style={{ color: COLORS.GREEN_PRIMARY }} 
                      />
                    </div>
                    <div className="flex-1">
                      <p 
                        className="font-medium" 
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        Video uploaded successfully
                      </p>
                      <p 
                        className="text-sm" 
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        Ready to send
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoUrl("")}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: COLORS.RED_ALERT }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="space-y-3">
              <label
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Message (Optional)
              </label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Add any notes or questions for your coach..."
                className="border rounded-lg resize-none"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: `linear-gradient(135deg, ${COLORS.GOLDEN_DARK} 0%, ${COLORS.GOLDEN_ACCENT} 100%)`,
                color: "#FFFFFF",
              }}
              disabled={isSubmitting || !videoUrl}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                  Sending...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2 inline" />
                  Send Video
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
