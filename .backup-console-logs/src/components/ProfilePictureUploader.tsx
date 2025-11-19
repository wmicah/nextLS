"use client";

import { useState } from "react";
import { UploadButton } from "@uploadthing/react";
import { Camera, X, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface ProfilePictureUploaderProps {
  currentAvatarUrl?: string | null;
  userName?: string;
  onAvatarChange: (url: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  readOnly?: boolean;
}

export default function ProfilePictureUploader({
  currentAvatarUrl,
  userName = "User",
  onAvatarChange,
  size = "md",
  className = "",
  readOnly = false,
}: ProfilePictureUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showRemoveButton, setShowRemoveButton] = useState(false);

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`relative group ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => !readOnly && setShowRemoveButton(true)}
      onMouseLeave={() => !readOnly && setShowRemoveButton(false)}
    >
      <Avatar
        className={`${sizeClasses[size]} ${
          readOnly ? "" : "cursor-pointer"
        } touch-manipulation`}
        style={{ border: "none" }}
      >
        <AvatarImage
          src={currentAvatarUrl || undefined}
          alt={`${userName}'s profile picture`}
          className="object-cover"
          style={{ border: "none" }}
        />
        <AvatarFallback
          className="text-lg font-semibold"
          style={{
            backgroundColor: "#374151",
            color: "#ffffff",
            border: "none",
          }}
        >
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>

      {/* Upload overlay */}
      {!readOnly && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          {/* @ts-ignore */}
          <UploadButton
            endpoint="profilePictureUploader"
            onUploadBegin={() => {
              setIsUploading(true);
              console.log("Upload started");
            }}
            onClientUploadComplete={(res: any) => {
              setIsUploading(false);
              console.log("Upload complete:", res);
              if (res?.[0]) {
                onAvatarChange(res[0].url);
              }
            }}
            onUploadError={(error: Error) => {
              setIsUploading(false);
              console.error("Upload error:", error);
              alert(`Upload failed: ${error.message}`);
            }}
            className="w-full h-full flex items-center justify-center"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </UploadButton>
        </div>
      )}

      {/* Remove button */}
      {!readOnly && currentAvatarUrl && showRemoveButton && (
        <button
          onClick={() => onAvatarChange("")}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
          title="Remove profile picture"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
