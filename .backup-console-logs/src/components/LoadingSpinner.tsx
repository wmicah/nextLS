"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const variantClasses = {
  default: "text-gray-600 dark:text-gray-400",
  primary: "text-blue-600 dark:text-blue-400",
  secondary: "text-gray-600 dark:text-gray-400",
  success: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  danger: "text-red-600 dark:text-red-400",
};

export function LoadingSpinner({
  size = "md",
  variant = "default",
  className,
  label = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <div
      className="flex items-center justify-center"
      role="status"
      aria-label={label}
    >
      <svg
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Pulse loading animation
export function PulseLoader({
  size = "md",
  variant = "default",
  className,
  label = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <div
      className="flex items-center justify-center space-x-2"
      role="status"
      aria-label={label}
    >
      <div
        className={cn(
          "animate-pulse rounded-full bg-current",
          size === "sm" && "h-2 w-2",
          size === "md" && "h-3 w-3",
          size === "lg" && "h-4 w-4",
          size === "xl" && "h-6 w-6",
          variantClasses[variant],
          className
        )}
        style={{ animationDelay: "0ms" }}
      />
      <div
        className={cn(
          "animate-pulse rounded-full bg-current",
          size === "sm" && "h-2 w-2",
          size === "md" && "h-3 w-3",
          size === "lg" && "h-4 w-4",
          size === "xl" && "h-6 w-6",
          variantClasses[variant],
          className
        )}
        style={{ animationDelay: "150ms" }}
      />
      <div
        className={cn(
          "animate-pulse rounded-full bg-current",
          size === "sm" && "h-2 w-2",
          size === "md" && "h-3 w-3",
          size === "lg" && "h-4 w-4",
          size === "xl" && "h-6 w-6",
          variantClasses[variant],
          className
        )}
        style={{ animationDelay: "300ms" }}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Dots loading animation
export function DotsLoader({
  size = "md",
  variant = "default",
  className,
  label = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <div
      className="flex items-center justify-center space-x-1"
      role="status"
      aria-label={label}
    >
      <div
        className={cn(
          "animate-bounce rounded-full bg-current",
          size === "sm" && "h-1 w-1",
          size === "md" && "h-2 w-2",
          size === "lg" && "h-3 w-3",
          size === "xl" && "h-4 w-4",
          variantClasses[variant],
          className
        )}
        style={{ animationDelay: "0ms" }}
      />
      <div
        className={cn(
          "animate-bounce rounded-full bg-current",
          size === "sm" && "h-1 w-1",
          size === "md" && "h-2 w-2",
          size === "lg" && "h-3 w-3",
          size === "xl" && "h-4 w-4",
          variantClasses[variant],
          className
        )}
        style={{ animationDelay: "150ms" }}
      />
      <div
        className={cn(
          "animate-bounce rounded-full bg-current",
          size === "sm" && "h-1 w-1",
          size === "md" && "h-2 w-2",
          size === "lg" && "h-3 w-3",
          size === "xl" && "h-4 w-4",
          variantClasses[variant],
          className
        )}
        style={{ animationDelay: "300ms" }}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Centered loading spinner with optional text
interface LoadingSpinnerCenteredProps extends LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinnerCentered({
  text,
  fullScreen = false,
  ...props
}: LoadingSpinnerCenteredProps) {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <LoadingSpinner {...props} />
      {text && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;
