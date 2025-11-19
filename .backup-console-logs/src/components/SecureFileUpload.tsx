"use client";

import { useState, useRef, useCallback } from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useFileSecurity } from "@/hooks/useFileSecurity";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  FileText,
  Image,
  Video,
  Music,
} from "lucide-react";

interface SecureFileUploadProps {
  endpoint: keyof OurFileRouter;
  uploadType:
    | "profilePicture"
    | "video"
    | "audio"
    | "document"
    | "messageAttachment"
    | "feedbackVideo";
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export default function SecureFileUpload({
  endpoint,
  uploadType,
  onUploadComplete,
  onUploadError,
  className,
  children,
}: SecureFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { validateFile, isValidating, validationResults, getOverallStatus } =
    useFileSecurity({
      uploadType,
      onSecurityEvent: event => {
        // Dispatch custom event for security monitoring
        window.dispatchEvent(
          new CustomEvent("security-event", { detail: event })
        );
      },
    });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await handleFileValidation(file);
    }
  }, []);

  const handleFileValidation = async (file: File) => {
    setUploadError(null);

    try {
      const validation = await validateFile(file);

      if (!validation.isValid) {
        setUploadError(`File rejected: ${validation.errors.join(", ")}`);
        onUploadError?.(validation.errors.join(", "));
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn("Security warnings:", validation.warnings);
      }

      // File passed security validation
      console.log("File passed security validation:", file.name);
    } catch (error) {
      console.error("File validation error:", error);
      setUploadError("File validation failed");
      onUploadError?.("File validation failed");
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleFileValidation(file);
    }
  };

  const getUploadIcon = () => {
    switch (uploadType) {
      case "profilePicture":
        return <Image className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "audio":
        return <Music className="h-5 w-5" />;
      case "document":
        return <FileText className="h-5 w-5" />;
      default:
        return <Upload className="h-5 w-5" />;
    }
  };

  const getStatusIcon = () => {
    const status = getOverallStatus();
    switch (status) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={className}>
      {/* Security Status */}
      {validationResults.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">
              Security Status: {getOverallStatus().toUpperCase()}
            </span>
          </div>

          {validationResults.map((result, index) => (
            <Alert
              key={index}
              className={`mb-2 ${
                result.isValid
                  ? result.warnings.length > 0
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <AlertDescription className="text-sm">
                {result.isValid ? (
                  result.warnings.length > 0 ? (
                    <>
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      Warnings: {result.warnings.join(", ")}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      File passed security validation
                    </>
                  )
                ) : (
                  <>
                    <XCircle className="h-4 w-4 inline mr-1" />
                    Errors: {result.errors.join(", ")}
                  </>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-sm text-red-800">
            {uploadError}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          {getUploadIcon()}

          <div>
            <p className="text-sm font-medium text-gray-900">
              {isValidating
                ? "Validating file security..."
                : "Drop files here or click to upload"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Files are automatically scanned for security threats
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isValidating}
            >
              {getUploadIcon()}
              Choose Files
            </Button>

            <UploadButton<OurFileRouter, typeof endpoint>
              endpoint={endpoint}
              onClientUploadComplete={res => {
                if (res && res[0]) {
                  setUploadedFiles(prev => [...prev, res[0].url]);
                  onUploadComplete?.(res[0].url);
                }
              }}
              onUploadError={(error: Error) => {
                setUploadError(error.message);
                onUploadError?.(error.message);
              }}
              disabled={isValidating}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInput}
            accept={
              uploadType === "profilePicture"
                ? "image/*"
                : uploadType === "video"
                ? "video/*"
                : uploadType === "audio"
                ? "audio/*"
                : uploadType === "document"
                ? ".pdf,.doc,.docx,.txt,.md"
                : "*"
            }
          />
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Uploaded Files:
          </h4>
          <div className="space-y-1">
            {uploadedFiles.map((url, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  File {index + 1}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
