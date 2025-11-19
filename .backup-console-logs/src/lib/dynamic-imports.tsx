import dynamic from "next/dynamic";
import React, { ComponentType } from "react";

// Dynamic import wrapper with loading fallback
export function createDynamicComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    loading?: () => React.ReactNode;
    ssr?: boolean;
  } = {}
) {
  return dynamic(importFn, {
    loading:
      options.loading ||
      (() => (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )),
    ssr: options.ssr ?? true,
  });
}

// Preload components for better performance
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return () => {
    importFn();
  };
}

// Lazy load heavy components - commented out until components exist
// export const LazyVideoPlayer = createDynamicComponent(
//   () => import('@/components/VideoPlayer'),
//   { ssr: false }
// );

// export const LazyChart = createDynamicComponent(
//   () => import('@/components/Chart'),
//   { ssr: false }
// );

// export const LazyDataTable = createDynamicComponent(
//   () => import('@/components/DataTable'),
//   { ssr: false }
// );

// export const LazyRichTextEditor = createDynamicComponent(
//   () => import('@/components/RichTextEditor'),
//   { ssr: false }
// );
