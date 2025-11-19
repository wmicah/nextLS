"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Prevent Next.js error overlay from showing
    if (typeof window !== "undefined") {
      const nextErrorOverlay = document.querySelector("nextjs-portal");
      if (nextErrorOverlay) {
        nextErrorOverlay.remove();
      }
    }

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys && prevProps.resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => key !== prevProps.resetKeys?.[index]
        );
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }
    }

    // Reset error boundary when props change (if enabled)
    if (
      hasError &&
      resetOnPropsChange &&
      prevProps.children !== this.props.children
    ) {
      this.resetErrorBoundary();
    }
  }

  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error?: Error;
  resetErrorBoundary: () => void;
}

function DefaultErrorFallback({
  error,
  resetErrorBoundary,
}: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Something went wrong
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We encountered an unexpected error. Don't worry, this has been logged
          and we're looking into it.
        </p>

        {process.env.NODE_ENV === "development" && error && (
          <details className="mb-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Error Details (Development Only)
            </summary>
            <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-32">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="flex space-x-3">
          <button
            onClick={resetErrorBoundary}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for functional components to trigger error boundaries
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error("Error caught by useErrorHandler:", error, errorInfo);
    // This will trigger the nearest error boundary
    throw error;
  };
}

// Higher-order component for easier wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

export default ErrorBoundary;
