"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMobileDetection } from "@/lib/mobile-detection";
import {
  X,
  Bug,
  Upload,
  Image as ImageIcon,
  Video,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BugReportModal({
  isOpen,
  onClose,
}: BugReportModalProps) {
  const pathname = usePathname();
  const { isMobile } = useMobileDetection();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [page, setPage] = useState("");
  const [device, setDevice] = useState("");
  const [priority, setPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined
  >(undefined);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"image" | "video" | null>(null);

  // Auto-detect current page when modal opens
  useEffect(() => {
    if (isOpen && pathname) {
      setPage(pathname);
    }
  }, [isOpen, pathname]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setPage(pathname || "");
      setDevice("");
      setPriority(undefined);
      setImageUrl(null);
      setVideoUrl(null);
      setIsUploading(false);
      setUploadType(null);
    }
  }, [isOpen, pathname]);

  const submitMutation = trpc.bugReports.submit.useMutation({
    onSuccess: () => {
      onClose();
      // Show success message
      alert(
        "Bug report submitted successfully! Thank you for helping improve the platform."
      );
    },
    onError: error => {
      console.error("Failed to submit bug report:", error);
      alert("Failed to submit bug report. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !title.trim() ||
      !description.trim() ||
      !page.trim() ||
      !device.trim()
    ) {
      alert(
        "Please fill in all required fields (Title, Description, Page, and Device)."
      );
      return;
    }

    submitMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      page: page.trim(),
      device: device.trim(),
      priority: priority || undefined,
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl || undefined,
    });
  };

  const handleFileUploadComplete = (res: any) => {
    setIsUploading(false);
    if (res && res.length > 0) {
      const file = res[0];
      if (uploadType === "image") {
        setImageUrl(file.url);
        setVideoUrl(null); // Clear video if image is uploaded
      } else if (uploadType === "video") {
        setVideoUrl(file.url);
        setImageUrl(null); // Clear image if video is uploaded
      }
    }
  };

  const handleFileUploadError = (error: Error) => {
    setIsUploading(false);
    console.error("File upload error:", error);
    alert("Failed to upload file. Please try again.");
  };

  const removeImage = () => {
    setImageUrl(null);
  };

  const removeVideo = () => {
    setVideoUrl(null);
  };

  const isSubmitting = submitMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isMobile
            ? "max-w-full w-full mx-2 max-h-[95vh]"
            : "max-w-2xl max-h-[90vh]"
        } overflow-y-auto`}
        style={{ backgroundColor: "#1A1D1E", borderColor: "#606364" }}
      >
        <DialogHeader>
          <div
            className={`flex items-center ${isMobile ? "gap-2" : "gap-3"} mb-2`}
          >
            <div
              className={`${
                isMobile ? "w-10 h-10" : "w-12 h-12"
              } rounded-xl flex items-center justify-center flex-shrink-0`}
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              }}
            >
              <Bug
                className={`${isMobile ? "w-5 h-5" : "w-6 h-6"} text-white`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle
                className={`${isMobile ? "text-xl" : "text-2xl"} font-bold`}
                style={{ color: "#C3BCC2" }}
              >
                Report a Bug
              </DialogTitle>
              <DialogDescription
                className={`${isMobile ? "text-xs" : "text-sm"} mt-1`}
                style={{ color: "#ABA4AA" }}
              >
                Help us improve by reporting issues you encounter
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className={`${isMobile ? "space-y-4" : "space-y-6"} mt-4`}
        >
          {/* Title - Required */}
          <div className="space-y-2">
            <Label htmlFor="title" style={{ color: "#C3BCC2" }}>
              Title <span style={{ color: "#ef4444" }}>*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Brief description of the bug"
              maxLength={200}
              required
              className={`${
                isMobile ? "text-base py-3" : ""
              } bg-[#2A3133] border-[#606364] text-white placeholder:text-[#ABA4AA] focus:border-[#4A5A70]`}
            />
            <p className="text-xs" style={{ color: "#ABA4AA" }}>
              {title.length}/200 characters
            </p>
          </div>

          {/* Description - Required */}
          <div className="space-y-2">
            <Label htmlFor="description" style={{ color: "#C3BCC2" }}>
              Description <span style={{ color: "#ef4444" }}>*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what happened, what you expected, and steps to reproduce..."
              rows={isMobile ? 4 : 5}
              maxLength={5000}
              required
              className={`${
                isMobile ? "text-base py-3" : ""
              } bg-[#2A3133] border-[#606364] text-white placeholder:text-[#ABA4AA] focus:border-[#4A5A70] resize-none`}
            />
            <p className="text-xs" style={{ color: "#ABA4AA" }}>
              {description.length}/5000 characters
            </p>
          </div>

          {/* Page - Required */}
          <div className="space-y-2">
            <Label htmlFor="page" style={{ color: "#C3BCC2" }}>
              Page Where Bug Was Found{" "}
              <span style={{ color: "#ef4444" }}>*</span>
            </Label>
            <Input
              id="page"
              value={page}
              onChange={e => setPage(e.target.value)}
              placeholder="/dashboard"
              required
              className={`${
                isMobile ? "text-base py-3" : ""
              } bg-[#2A3133] border-[#606364] text-white placeholder:text-[#ABA4AA] focus:border-[#4A5A70]`}
            />
            <p className="text-xs" style={{ color: "#ABA4AA" }}>
              Auto-detected from current page
            </p>
          </div>

          {/* Device - Required */}
          <div className="space-y-2">
            <Label htmlFor="device" style={{ color: "#C3BCC2" }}>
              What Device Are You Using?{" "}
              <span style={{ color: "#ef4444" }}>*</span>
            </Label>
            <Input
              id="device"
              value={device}
              onChange={e => setDevice(e.target.value)}
              placeholder="e.g., iPhone 15 Pro, Samsung Galaxy S24, MacBook Pro 16-inch, iPad Air"
              required
              className={`${
                isMobile ? "text-base py-3" : ""
              } bg-[#2A3133] border-[#606364] text-white placeholder:text-[#ABA4AA] focus:border-[#4A5A70]`}
            />
            <p className="text-xs" style={{ color: "#ABA4AA" }}>
              Please provide the specific device name (not generic terms like
              "phone" or "tablet")
            </p>
          </div>

          {/* Priority - Optional */}
          <div className="space-y-2">
            <Label htmlFor="priority" style={{ color: "#C3BCC2" }}>
              Priority{" "}
              <span className="text-xs" style={{ color: "#ABA4AA" }}>
                (Optional)
              </span>
            </Label>
            <Select
              value={priority || ""}
              onValueChange={value =>
                setPriority(
                  value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined
                )
              }
            >
              <SelectTrigger
                className={`${
                  isMobile ? "py-3 text-base" : ""
                } bg-[#2A3133] border-[#606364] text-white`}
              >
                <SelectValue placeholder="Select priority (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A3133] border-[#606364]">
                <SelectItem value="LOW" className="text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Low
                  </div>
                </SelectItem>
                <SelectItem value="MEDIUM" className="text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Medium
                  </div>
                </SelectItem>
                <SelectItem value="HIGH" className="text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    High
                  </div>
                </SelectItem>
                <SelectItem value="CRITICAL" className="text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Critical
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image/Video Upload - Optional */}
          <div className="space-y-2">
            <Label style={{ color: "#C3BCC2" }}>
              Screenshot or Video{" "}
              <span className="text-xs" style={{ color: "#ABA4AA" }}>
                (Optional)
              </span>
            </Label>
            <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-3`}>
              {/* Image Upload */}
              {!imageUrl && !videoUrl && (
                <>
                  <div className="flex-1">
                    <UploadButton<OurFileRouter, "bugReportImageUploader">
                      endpoint="bugReportImageUploader"
                      onUploadBegin={() => {
                        setIsUploading(true);
                        setUploadType("image");
                      }}
                      onClientUploadComplete={handleFileUploadComplete}
                      onUploadError={handleFileUploadError}
                      content={{
                        button: ({ ready }: { ready: boolean }) => (
                          <div
                            className={`flex items-center justify-center gap-2 ${
                              isMobile ? "px-4 py-3" : "px-4 py-2"
                            } rounded-lg transition-all ${
                              ready
                                ? "cursor-pointer"
                                : "opacity-50 cursor-not-allowed"
                            }`}
                            style={{
                              backgroundColor: "#353A3A",
                              border: "1px solid #606364",
                              color: "#C3BCC2",
                            }}
                          >
                            {isUploading && uploadType === "image" ? (
                              <Loader2
                                className={`${
                                  isMobile ? "w-5 h-5" : "w-4 h-4"
                                } animate-spin`}
                              />
                            ) : (
                              <ImageIcon
                                className={`${
                                  isMobile ? "w-5 h-5" : "w-4 h-4"
                                }`}
                              />
                            )}
                            <span
                              className={
                                isMobile ? "text-base font-medium" : "text-sm"
                              }
                            >
                              {isUploading && uploadType === "image"
                                ? "Uploading..."
                                : "Upload Image"}
                            </span>
                          </div>
                        ),
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <UploadButton<OurFileRouter, "feedbackVideoUploader">
                      endpoint="feedbackVideoUploader"
                      onUploadBegin={() => {
                        setIsUploading(true);
                        setUploadType("video");
                      }}
                      onClientUploadComplete={handleFileUploadComplete}
                      onUploadError={handleFileUploadError}
                      content={{
                        button: ({ ready }: { ready: boolean }) => (
                          <div
                            className={`flex items-center justify-center gap-2 ${
                              isMobile ? "px-4 py-3" : "px-4 py-2"
                            } rounded-lg transition-all ${
                              ready
                                ? "cursor-pointer"
                                : "opacity-50 cursor-not-allowed"
                            }`}
                            style={{
                              backgroundColor: "#353A3A",
                              border: "1px solid #606364",
                              color: "#C3BCC2",
                            }}
                          >
                            {isUploading && uploadType === "video" ? (
                              <Loader2
                                className={`${
                                  isMobile ? "w-5 h-5" : "w-4 h-4"
                                } animate-spin`}
                              />
                            ) : (
                              <Video
                                className={`${
                                  isMobile ? "w-5 h-5" : "w-4 h-4"
                                }`}
                              />
                            )}
                            <span
                              className={
                                isMobile ? "text-base font-medium" : "text-sm"
                              }
                            >
                              {isUploading && uploadType === "video"
                                ? "Uploading..."
                                : "Upload Video"}
                            </span>
                          </div>
                        ),
                      }}
                    />
                  </div>
                </>
              )}

              {/* Show uploaded image */}
              {imageUrl && (
                <div className="relative flex-1">
                  <div
                    className="rounded-lg border p-2"
                    style={{
                      backgroundColor: "#2A3133",
                      borderColor: "#606364",
                    }}
                  >
                    <div className="relative">
                      <img
                        src={imageUrl}
                        alt="Bug screenshot"
                        className={`w-full ${
                          isMobile ? "h-40" : "h-32"
                        } object-cover rounded`}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className={`absolute top-2 right-2 ${
                          isMobile ? "p-2" : "p-1"
                        } rounded-full bg-red-500 transition-colors`}
                      >
                        <X
                          className={`${
                            isMobile ? "w-5 h-5" : "w-4 h-4"
                          } text-white`}
                        />
                      </button>
                    </div>
                    <p
                      className="text-xs mt-2 text-center"
                      style={{ color: "#ABA4AA" }}
                    >
                      Image uploaded
                    </p>
                  </div>
                </div>
              )}

              {/* Show uploaded video */}
              {videoUrl && (
                <div className="relative flex-1">
                  <div
                    className="rounded-lg border p-2"
                    style={{
                      backgroundColor: "#2A3133",
                      borderColor: "#606364",
                    }}
                  >
                    <div className="relative">
                      <video
                        src={videoUrl}
                        controls
                        className={`w-full ${
                          isMobile ? "h-40" : "h-32"
                        } object-cover rounded`}
                      />
                      <button
                        type="button"
                        onClick={removeVideo}
                        className={`absolute top-2 right-2 ${
                          isMobile ? "p-2" : "p-1"
                        } rounded-full bg-red-500 transition-colors`}
                      >
                        <X
                          className={`${
                            isMobile ? "w-5 h-5" : "w-4 h-4"
                          } text-white`}
                        />
                      </button>
                    </div>
                    <p
                      className="text-xs mt-2 text-center"
                      style={{ color: "#ABA4AA" }}
                    >
                      Video uploaded
                    </p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs" style={{ color: "#ABA4AA" }}>
              Upload a screenshot or video to help us understand the issue
              better
            </p>
          </div>

          {/* Submit Button */}
          <div
            className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-3 ${
              isMobile ? "pt-2" : "pt-4"
            }`}
          >
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className={`flex-1 ${isMobile ? "py-3 text-base" : ""}`}
              style={{
                backgroundColor: "transparent",
                borderColor: "#606364",
                color: "#C3BCC2",
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !title.trim() ||
                !description.trim() ||
                !page.trim() ||
                !device.trim()
              }
              className={`flex-1 ${
                isMobile ? "py-3 text-base font-semibold" : ""
              }`}
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "white",
                border: "none",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className={`${
                      isMobile ? "w-5 h-5" : "w-4 h-4"
                    } mr-2 animate-spin`}
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2
                    className={`${isMobile ? "w-5 h-5" : "w-4 h-4"} mr-2`}
                  />
                  Submit Bug Report
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
