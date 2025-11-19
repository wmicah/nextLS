"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  LoadingSpinner,
  LoadingSpinnerCentered,
} from "@/components/LoadingSpinner";
import {
  Skeleton,
  SkeletonCard,
  SkeletonStats,
  SkeletonTable,
  SkeletonMessageList,
  SkeletonVideoGrid,
  SkeletonForm,
  SkeletonPage,
} from "@/components/SkeletonLoader";

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  skeleton?: React.ReactNode;
  spinner?: React.ReactNode;
  className?: string;
  delay?: number; // Delay before showing loading state (ms)
  minHeight?: string;
}

export function LoadingState({
  isLoading,
  children,
  fallback,
  skeleton,
  spinner,
  className,
  delay = 0,
  minHeight = "auto",
}: LoadingStateProps) {
  const [showLoading, setShowLoading] = React.useState(
    isLoading && delay === 0
  );

  React.useEffect(() => {
    if (isLoading && delay > 0) {
      const timer = setTimeout(() => {
        setShowLoading(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(isLoading);
      return undefined;
    }
  }, [isLoading, delay]);

  if (!showLoading) {
    return <>{children}</>;
  }

  const loadingContent = fallback || skeleton || spinner || (
    <LoadingSpinnerCentered text="Loading..." />
  );

  return (
    <div className={cn("w-full", className)} style={{ minHeight }}>
      {loadingContent}
    </div>
  );
}

// Specific loading states for different content types
interface DataLoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  data?: any[];
  emptyState?: React.ReactNode;
  className?: string;
}

export function DataLoadingState({
  isLoading,
  children,
  data,
  emptyState,
  className,
}: DataLoadingStateProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <SkeletonMessageList items={5} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={className}>
        {emptyState || (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No data available
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

// Table loading state
interface TableLoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableLoadingState({
  isLoading,
  children,
  rows = 5,
  columns = 4,
  className,
}: TableLoadingStateProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <SkeletonTable rows={rows} columns={columns} />
      </div>
    );
  }

  return <>{children}</>;
}

// Message list loading state
interface MessageLoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  items?: number;
  className?: string;
}

export function MessageLoadingState({
  isLoading,
  children,
  items = 5,
  className,
}: MessageLoadingStateProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <SkeletonMessageList items={items} />
      </div>
    );
  }

  return <>{children}</>;
}

// Video grid loading state
interface VideoGridLoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  items?: number;
  className?: string;
}

export function VideoGridLoadingState({
  isLoading,
  children,
  items = 6,
  className,
}: VideoGridLoadingStateProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <SkeletonVideoGrid items={items} />
      </div>
    );
  }

  return <>{children}</>;
}

// Form loading state
interface FormLoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  fields?: number;
  className?: string;
}

export function FormLoadingState({
  isLoading,
  children,
  fields = 4,
  className,
}: FormLoadingStateProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <SkeletonForm fields={fields} />
      </div>
    );
  }

  return <>{children}</>;
}

// Page loading state
interface PageLoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  showSidebar?: boolean;
  className?: string;
}

export function PageLoadingState({
  isLoading,
  children,
  showSidebar = true,
  className,
}: PageLoadingStateProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <SkeletonPage showSidebar={showSidebar} />
      </div>
    );
  }

  return <>{children}</>;
}

// Card loading state
interface CardLoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CardLoadingState({
  isLoading,
  children,
  className,
}: CardLoadingStateProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <SkeletonCard />
      </div>
    );
  }

  return <>{children}</>;
}

// Inline loading state for small components
interface InlineLoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function InlineLoadingState({
  isLoading,
  children,
  size = "sm",
  className,
}: InlineLoadingStateProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <LoadingSpinner size={size} />
      </div>
    );
  }

  return <>{children}</>;
}

// Button loading state
interface ButtonLoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function ButtonLoadingState({
  isLoading,
  children,
  loadingText = "Loading...",
  className,
}: ButtonLoadingStateProps) {
  if (isLoading) {
    return (
      <div
        className={cn("flex items-center justify-center space-x-2", className)}
      >
        <LoadingSpinner size="sm" />
        <span className="text-sm">{loadingText}</span>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook for managing loading states
export function useLoadingState(initialState = false, delay = 0) {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [showLoading, setShowLoading] = React.useState(
    initialState && delay === 0
  );

  React.useEffect(() => {
    if (isLoading && delay > 0) {
      const timer = setTimeout(() => {
        setShowLoading(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(isLoading);
      return undefined;
    }
  }, [isLoading, delay]);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setShowLoading(false);
  }, []);

  return {
    isLoading,
    showLoading,
    startLoading,
    stopLoading,
    setIsLoading,
  };
}

export default LoadingState;
