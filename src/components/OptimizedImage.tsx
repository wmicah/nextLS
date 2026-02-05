"use client";

import React, { useState, useCallback, memo } from "react";
import Image from "next/image";

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component that:
 * 1. Uses Next.js Image for automatic optimization
 * 2. Handles loading states
 * 3. Provides fallback for errors/missing images
 * 4. Handles external URLs properly
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  fallback,
  priority = false,
  quality = 75,
  sizes,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  // If no src or error, show fallback
  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-[#1a1f1f] ${className}`}
      >
        {fallback || <div className="text-gray-500 text-sm">No image</div>}
      </div>
    );
  }

  // Check if it's an external URL
  const isExternal = src.startsWith("http://") || src.startsWith("https://");

  // For external URLs, we need to use unoptimized or configure domains
  // Using regular img for external URLs from unknown domains
  if (isExternal && !isAllowedDomain(src)) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{
          aspectRatio: width && height ? `${width}/${height}` : "16/10",
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-[#1a1f1f] animate-pulse" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  // Use Next.js Image for local/allowed external images
  return (
    <div className={`relative ${fill ? "" : ""} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-[#1a1f1f] animate-pulse z-10" />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        priority={priority}
        quality={quality}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        unoptimized={isExternal}
      />
    </div>
  );
});

/**
 * Check if URL is from an allowed domain for Next.js Image optimization
 */
function isAllowedDomain(url: string): boolean {
  const allowedDomains = [
    "img.youtube.com",
    "i.ytimg.com",
    "utfs.io", // UploadThing
    "uploadthing.com",
    "nxlvlcoach.com",
  ];

  try {
    const urlObj = new URL(url);
    return allowedDomains.some(domain => urlObj.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

/**
 * Avatar-specific optimized image
 */
interface AvatarImageProps {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackInitials?: string;
}

const sizeMap = {
  sm: { size: 32, text: "text-xs" },
  md: { size: 40, text: "text-sm" },
  lg: { size: 48, text: "text-base" },
  xl: { size: 64, text: "text-lg" },
};

export const AvatarImage = memo(function AvatarImage({
  src,
  alt,
  size = "md",
  className = "",
  fallbackInitials,
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);
  const { size: pixelSize, text } = sizeMap[size];

  const initials = fallbackInitials || getInitials(alt);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 ${text} font-semibold text-white ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
      />
    </div>
  );
});

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Video thumbnail with play overlay
 */
interface VideoThumbnailImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  showPlayButton?: boolean;
  onClick?: () => void;
}

export const VideoThumbnailImage = memo(function VideoThumbnailImage({
  src,
  alt,
  className = "",
  showPlayButton = true,
  onClick,
}: VideoThumbnailImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className={`relative bg-[#1a1f1f] overflow-hidden group aspect-video ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-[#2a2f2f]" />
      )}
      {src && !hasError ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          } ${onClick ? "group-hover:scale-105" : ""}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Play button overlay */}
      {showPlayButton && !isLoading && !hasError && src && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-200">
          <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform scale-90 group-hover:scale-100">
            <svg
              className="w-6 h-6 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
});
