"use client";

import { Suspense, lazy, ComponentType } from "react";
import { Loader2 } from "lucide-react";

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}

// Lazy load heavy components
export const LazyPerformanceDashboard = lazy(
  () => import("./PerformanceDashboard")
);
export const LazyAdminSecurityDashboard = lazy(
  () => import("./AdminSecurityDashboard")
);
export const LazyProgramBuilder = lazy(() => import("./ProgramBuilder"));
export const LazyVideoThumbnail = lazy(() =>
  import("./VideoThumbnail").then(module => ({
    default: module.VideoThumbnail,
  }))
);

// Higher-order component for lazy loading
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  fallback?: React.ReactNode
) {
  return function LazyComponent(props: T) {
    return (
      <LazyWrapper fallback={fallback}>
        <Component {...props} />
      </LazyWrapper>
    );
  };
}
