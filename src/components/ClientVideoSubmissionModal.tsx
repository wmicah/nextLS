"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, Check, AlertCircle } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

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

  const resetForm = () => {
    setMessage("");
    setVideoUrl("");
    setError("");
    setIsSubmitting(false);
  };

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
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: "#606364" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "#C3BCC2" }}>
                Record Video
              </h2>
              {drillTitle && (
                <p className="text-sm mt-1" style={{ color: "#ABA4AA" }}>
                  For: {drillTitle}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
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
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  border: "1px solid",
                }}
              >
                <AlertCircle className="h-4 w-4" style={{ color: "#EF4444" }} />
                <span className="text-sm" style={{ color: "#EF4444" }}>
                  {error}
                </span>
              </div>
            )}

            {/* Video Upload */}
            <div className="space-y-3">
              <label
                className="text-sm font-medium"
                style={{ color: "#C3BCC2" }}
              >
                Upload Video *
              </label>
              {!videoUrl ? (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center"
                  style={{ borderColor: "#606364" }}
                >
                  <UploadButton<OurFileRouter, "videoUploader">
                    endpoint="videoUploader"
                    onClientUploadComplete={res => {
                      if (res && res.length > 0) {
                        const file = res[0];
                        if (file?.url) {
                          setVideoUrl(file.url);
                          setError("");
                        } else {
                          setError("Upload completed but no file URL received. Please try again.");
                        }
                      } else {
                        setError("Upload completed but no file received. Please try again.");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      console.error("Upload error:", error);
                      const errorMessage = error.message || "Unknown upload error";
                      setError(`Upload failed: ${errorMessage}. Please check your file size (max 1GB) and try again.`);
                    }}
                    onUploadBegin={(name) => {
                      setError("");
                      console.log("Upload started:", name);
                    }}
                  />
                </div>
              ) : (
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: "#2A3133" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded flex items-center justify-center"
                      style={{ backgroundColor: "rgba(16, 185, 129, 0.2)" }}
                    >
                      <Check className="h-6 w-6" style={{ color: "#10B981" }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: "#C3BCC2" }}>
                        Video uploaded successfully
                      </p>
                      <p className="text-sm" style={{ color: "#ABA4AA" }}>
                        Ready to send
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoUrl("")}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: "#EF4444" }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "#606364";
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
                style={{ color: "#C3BCC2" }}
              >
                Message (Optional)
              </label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Add any notes or questions for your coach..."
                className="border rounded-lg resize-none"
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                }}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
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
