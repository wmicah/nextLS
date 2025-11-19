"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import Link from "next/link";

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  variant?: "page" | "component" | "inline";
  showDetails?: boolean;
  className?: string;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  variant = "component",
  showDetails = false,
  className = "",
}: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  const baseClasses = "flex items-center justify-center p-4";
  const variantClasses = {
    page: "min-h-[60vh] p-8",
    component: "min-h-[200px] p-6",
    inline: "min-h-[100px] p-4",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div
        className={`w-full max-w-md ${
          variant === "page"
            ? "max-w-lg"
            : variant === "inline"
            ? "max-w-sm"
            : "max-w-md"
        }`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
            <h3
              className={`font-semibold text-gray-900 dark:text-white ${
                variant === "page" ? "text-xl" : "text-lg"
              }`}
            >
              {variant === "page"
                ? "Oops! Something went wrong"
                : "Something went wrong"}
            </h3>
          </div>

          <p
            className={`text-gray-600 dark:text-gray-300 mb-4 ${
              variant === "inline" ? "text-sm" : "text-base"
            }`}
          >
            {variant === "page"
              ? "We encountered an unexpected error. Don't worry, this has been logged and we're looking into it."
              : "An error occurred while loading this content. Please try again."}
          </p>

          {(isDevelopment || showDetails) && error && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
                <Bug className="h-4 w-4" />
                <span>
                  Error Details {isDevelopment ? "(Development Only)" : ""}
                </span>
              </summary>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-24">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}

          <div
            className={`flex space-x-2 ${
              variant === "inline" ? "flex-col space-y-2 space-x-0" : "flex-row"
            }`}
          >
            {resetErrorBoundary && (
              <button
                onClick={resetErrorBoundary}
                className={`flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors ${
                  variant === "inline" ? "text-sm" : ""
                }`}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            )}

            {variant === "page" && (
              <Link
                href="/dashboard"
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Go Home</span>
              </Link>
            )}

            {variant === "page" && (
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Reload Page
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized fallback components for different contexts
export function PageErrorFallback({
  error,
  resetErrorBoundary,
}: Omit<ErrorFallbackProps, "variant">) {
  return (
    <ErrorFallback
      error={error}
      resetErrorBoundary={resetErrorBoundary}
      variant="page"
      showDetails={true}
    />
  );
}

export function ComponentErrorFallback({
  error,
  resetErrorBoundary,
}: Omit<ErrorFallbackProps, "variant">) {
  return (
    <ErrorFallback
      error={error}
      resetErrorBoundary={resetErrorBoundary}
      variant="component"
    />
  );
}

export function InlineErrorFallback({
  error,
  resetErrorBoundary,
}: Omit<ErrorFallbackProps, "variant">) {
  return (
    <ErrorFallback
      error={error}
      resetErrorBoundary={resetErrorBoundary}
      variant="inline"
    />
  );
}

export default ErrorFallback;
