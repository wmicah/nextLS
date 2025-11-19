"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className, children, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Card skeleton
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 dark:border-gray-700 p-4",
        className
      )}
    >
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-20 w-full mb-2" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

// Avatar skeleton
export function SkeletonAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <Skeleton className={cn("rounded-full", sizeClasses[size], className)} />
  );
}

// Text skeleton with multiple lines
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full" // Last line is shorter
          )}
        />
      ))}
    </div>
  );
}

// Dashboard stats skeleton
export function SkeletonStats({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

// Table skeleton
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn(
                "h-4",
                colIndex === 0 ? "w-24" : "w-16" // First column usually wider
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Message list skeleton
export function SkeletonMessageList({
  items = 5,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex space-x-3 p-3">
          <SkeletonAvatar size="md" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Video grid skeleton
export function SkeletonVideoGrid({
  items = 6,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <Skeleton className="h-48 w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Form skeleton
export function SkeletonForm({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

// Sidebar skeleton
export function SkeletonSidebar({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-4", className)}>
      {/* Logo/Header */}
      <Skeleton className="h-8 w-32" />

      {/* Navigation items */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* User section */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <SkeletonAvatar size="md" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Page skeleton - full page loading
export function SkeletonPage({
  showSidebar = true,
  className,
}: {
  showSidebar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-screen", className)}>
      {showSidebar && (
        <div className="w-64 border-r border-gray-200 dark:border-gray-700">
          <SkeletonSidebar />
        </div>
      )}

      <div className="flex-1 p-6">
        {/* Page header */}
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Content */}
        <div className="space-y-6">
          <SkeletonStats />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
