"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn(
        "animate-spin text-muted-foreground",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 space-y-4",
        className
      )}
    >
      <LoadingSpinner size={size} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return (
      <div className={cn("animate-pulse bg-muted rounded-md", className)} />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse bg-muted rounded-md",
            i === lines - 1 ? "w-3/4" : "w-full",
            className
          )}
        />
      ))}
    </div>
  );
}

// Safe loading wrapper that won't break existing components
export function withLoadingState<P extends object>(
  Component: React.ComponentType<P>,
  loadingComponent?: React.ComponentType
) {
  return function LoadingWrapper(props: P & { isLoading?: boolean }) {
    const { isLoading, ...restProps } = props;

    if (isLoading) {
      return loadingComponent ? (
        React.createElement(loadingComponent)
      ) : (
        <LoadingState />
      );
    }

    return <Component {...(restProps as P)} />;
  };
}
