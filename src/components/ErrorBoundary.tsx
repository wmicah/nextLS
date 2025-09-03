"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { captureError } from "@/lib/monitoring";
import { measurePerformance } from "@/lib/performance";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  retryCount?: number;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isRecovering: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Generate unique error ID
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      errorInfo,
      errorId,
    });

    // Capture error with performance metrics
    measurePerformance("error_boundary_capture", () => {
      captureError(error, {
        context: "ErrorBoundary",
        errorInfo,
        errorId,
        retryCount: this.state.retryCount,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = async () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      // Reset to initial state after max retries
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: 0,
        isRecovering: false,
      });
      return;
    }

    this.setState({ isRecovering: true });

    try {
      // Wait a bit before retrying to avoid immediate failures
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: retryCount + 1,
        isRecovering: false,
      });
    } catch (retryError) {
      this.setState({ isRecovering: false });
      console.error("Error during retry:", retryError);
    }
  };

  handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;

    if (error && errorInfo) {
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "unknown",
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      };

      // Log error report
      console.log("Error Report:", errorReport);

      // In production, you could send this to an error reporting service
      if (process.env.NODE_ENV === "production") {
        // Send to error reporting service
        fetch("/api/error-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(errorReport),
        }).catch(console.error);
      }
    }
  };

  override render() {
    const { children, fallback } = this.props;
    const { hasError, error, errorInfo, errorId, retryCount, isRecovering } =
      this.state;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Something went wrong
            </h2>

            <p className="text-gray-600 text-center mb-6">
              We encountered an unexpected error. Please try again or contact
              support if the problem persists.
            </p>

            {errorId && (
              <div className="bg-gray-100 rounded-md p-3 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Error ID:</strong> {errorId}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={this.handleRetry}
                disabled={isRecovering}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRecovering ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Retrying...
                  </span>
                ) : (
                  `Retry (${retryCount + 1}/3)`
                )}
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Go Home
              </button>
            </div>

            <button
              onClick={this.handleReportError}
              className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              Report this error
            </button>

            {/* Show error details in development/test mode */}
            {(process.env.NODE_ENV === "development" ||
              process.env.NODE_ENV === "test") &&
              error && (
                <details className="mt-6 border-t pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Error Details
                  </summary>
                  <div className="mt-2 text-xs text-gray-600 space-y-2">
                    <div>
                      <strong>Message:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
          </div>
        </div>
      );
    }

    return children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    captureError(error, { context: "useErrorHandler" });
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
