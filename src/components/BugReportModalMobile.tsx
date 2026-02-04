"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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

interface BugReportModalMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BugReportModalMobile({
  isOpen,
  onClose,
}: BugReportModalMobileProps) {
  const pathname = usePathname();
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
      device: device.trim() || undefined,
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
        setVideoUrl(null);
      } else if (uploadType === "video") {
        setVideoUrl(file.url);
        setImageUrl(null);
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
        className="max-w-full w-full mx-0 max-h-[100vh] h-[100vh] rounded-none overflow-y-auto p-4"
        style={{ backgroundColor: "#1A1D1E", borderColor: "#606364" }}
      >
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              }}
            >
              <Bug className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle
                className="text-lg font-bold"
                style={{ color: "#C3BCC2" }}
              >
                Report a Bug
              </DialogTitle>
              <DialogDescription
                className="text-xs mt-0.5"
                style={{ color: "#ABA4AA" }}
              >
                Help us improve
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          {/* Title - Required */}
          <div className="space-y-1">
            <Label
              htmlFor="title"
              className="text-sm"
              style={{ color: "#C3BCC2" }}
            >
              Title <span style={{ color: "#ef4444" }}>*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Brief description"
              maxLength={200}
              required
              className="text-base py-2.5 bg-[#2A3133] border-[#606364] text-white placeholder:text-[#ABA4AA] focus:border-[#4A5A70]"
            />
            <p className="text-xs" style={{ color: "#ABA4AA" }}>
              {title.length}/200
            </p>
          </div>

          {/* Description - Required */}
          <div className="space-y-1">
            <Label
              htmlFor="description"
              className="text-sm"
              style={{ color: "#C3BCC2" }}
            >
              Description <span style={{ color: "#ef4444" }}>*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What happened and steps to reproduce..."
              rows={3}
              maxLength={5000}
              required
              className="text-base py-2.5 bg-[#2A3133] border-[#606364] text-white placeholder:text-[#ABA4AA] focus:border-[#4A5A70] resize-none"
            />
            <p className="text-xs" style={{ color: "#ABA4AA" }}>
              {description.length}/5000
            </p>
          </div>

          {/* Page - Required */}
          <div className="space-y-1">
            <Label
              htmlFor="page"
              className="text-sm"
              style={{ color: "#C3BCC2" }}
            >
              Page <span style={{ color: "#ef4444" }}>*</span>
            </Label>
            <Input
              id="page"
              value={page}
              onChange={e => setPage(e.target.value)}
              placeholder="/dashboard"
              required
              className="text-base py-2.5 bg-[#2A3133] border-[#606364] text-white placeholder:text-[#ABA4AA] focus:border-[#4A5A70]"
            />
            <p className="text-xs" style={{ color: "#ABA4AA" }}>
              Auto-detected
            </p>
          </div>

          {/* Device - Required */}
          <div className="space-y-1">
            <Label
              htmlFor="device"
              className="text-sm"
              style={{ color: "#C3BCC2" }}
            >
              Device <span style={{ color: "#ef4444" }}>*</span>
            </Label>
            <Input
              id="device"
              value={device}
              onChange={e => setDevice(e.target.value)}
              placeholder="e.g., iPhone 15 Pro, Samsung Galaxy S24"
              required
              className="text-base py-2.5 bg-[#2A3133] border-[#606364] text-white placeholder:text-[#ABA4AA] focus:border-[#4A5A70]"
            />
            <p className="text-xs" style={{ color: "#ABA4AA" }}>
              Specific device name
            </p>
          </div>

          {/* Priority - Optional */}
          <div className="space-y-1">
            <Label
              htmlFor="priority"
              className="text-sm"
              style={{ color: "#C3BCC2" }}
            >
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
              <SelectTrigger className="py-2.5 text-base bg-[#2A3133] border-[#606364] text-white">
                <SelectValue placeholder="Select priority" />
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
          <div className="space-y-1">
            <Label className="text-sm" style={{ color: "#C3BCC2" }}>
              Screenshot or Video{" "}
              <span className="text-xs" style={{ color: "#ABA4AA" }}>
                (Optional)
              </span>
            </Label>
            <div className="flex flex-col gap-2">
              {/* Image Upload */}
              {!imageUrl && !videoUrl && (
                <>
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
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
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
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <ImageIcon className="w-5 h-5" />
                          )}
                          <span className="text-base font-medium">
                            {isUploading && uploadType === "image"
                              ? "Uploading..."
                              : "Upload Image"}
                          </span>
                        </div>
                      ),
                    }}
                  />
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
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
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
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Video className="w-5 h-5" />
                          )}
                          <span className="text-base font-medium">
                            {isUploading && uploadType === "video"
                              ? "Uploading..."
                              : "Upload Video"}
                          </span>
                        </div>
                      ),
                    }}
                  />
                </>
              )}

              {/* Show uploaded image */}
              {imageUrl && (
                <div className="relative">
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
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-2 rounded-full bg-red-500 transition-colors"
                      >
                        <X className="w-5 h-5 text-white" />
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
                <div className="relative">
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
                        className="w-full h-32 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="absolute top-2 right-2 p-2 rounded-full bg-red-500 transition-colors"
                      >
                        <X className="w-5 h-5 text-white" />
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
          </div>

          {/* Submit Button */}
          <div className="flex flex-col gap-2 pt-2 pb-4">
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !title.trim() ||
                !description.trim() ||
                !page.trim() ||
                !device.trim()
              }
              className="w-full py-3 text-base font-semibold"
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "white",
                border: "none",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Submit Bug Report
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="w-full py-3 text-base"
              style={{
                backgroundColor: "transparent",
                borderColor: "#606364",
                color: "#C3BCC2",
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
