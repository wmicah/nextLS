"use client";

import { useState, useRef, useCallback } from "react";
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

  const handleUploadComplete = useCallback(
    async (res: any) => {
      try {
        const file = res[0];
        if (!file) {
          setError("Upload failed - no file returned");
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
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [onFileSelect]
  );

  const handleUploadError = useCallback((error: Error) => {
    console.error("Upload error:", error);
    setError(`Upload failed: ${error.message}`);
    setUploading(false);
    setUploadProgress(0);
  }, []);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Upload File</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <div className="border-2 border-dashed rounded-lg p-6 text-center border-gray-600">
          <Paperclip className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-white mb-2">Upload a file attachment</p>
          <p className="text-gray-400 text-sm mb-4">
            Supports images, videos, audio, PDFs, and documents
          </p>

          <UploadButton<OurFileRouter, "messageAttachmentUploader">
            endpoint="messageAttachmentUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            appearance={{
              button:
                "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors",
              allowedContent: "text-gray-400 text-sm",
            }}
          />
        </div>

        {uploading && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
              <span className="text-gray-300">
                {uploadProgress > 0
                  ? `Processing... ${uploadProgress}%`
                  : "Processing file..."}
              </span>
            </div>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
