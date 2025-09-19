"use client";

import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
  height?: string;
}

export default function SkeletonLoader({
  className,
  lines = 1,
  height = "h-4",
}: SkeletonLoaderProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "bg-gray-200 rounded",
            height,
            index < lines - 1 ? "mb-2" : ""
          )}
        />
      ))}
    </div>
  );
}

// Pre-built skeleton components for common patterns
export function VideoCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="aspect-video bg-gray-200 animate-pulse" />
      <div className="p-4">
        <SkeletonLoader lines={2} height="h-4" />
        <div className="mt-2 flex items-center gap-2">
          <SkeletonLoader className="w-16 h-3" />
          <SkeletonLoader className="w-20 h-3" />
        </div>
      </div>
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1">
          <SkeletonLoader className="w-24 h-4 mb-1" />
          <SkeletonLoader className="w-32 h-3" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <SkeletonLoader lines={1} height="h-6" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <SkeletonLoader className="w-8 h-8 rounded-full" />
            <SkeletonLoader className="flex-1 h-4" />
            <SkeletonLoader className="w-20 h-4" />
            <SkeletonLoader className="w-16 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
