"use client";

import { useEffect, useRef } from "react";

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiCallTime: number;
  itemCount: number;
  searchTime: number;
  filterTime: number;
}

interface LibraryPerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  enabled?: boolean;
}

export function LibraryPerformanceMonitor({
  onMetricsUpdate,
  enabled = true,
}: LibraryPerformanceMonitorProps) {
  const startTimeRef = useRef<number>(0);
  const renderStartRef = useRef<number>(0);
  const apiStartRef = useRef<number>(0);
  const searchStartRef = useRef<number>(0);
  const filterStartRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    startTimeRef.current = performance.now();

    // Monitor page load performance
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();

      entries.forEach(entry => {
        if (entry.entryType === "navigation") {
          const navEntry = entry as PerformanceNavigationTiming;
          const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
          console.log(`📊 Library Page Load Time: ${loadTime.toFixed(2)}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ["navigation", "measure"] });

    return () => {
      observer.disconnect();
    };
  }, [enabled]);

  const startRender = () => {
    if (!enabled) return;
    renderStartRef.current = performance.now();
  };

  const endRender = (itemCount: number) => {
    if (!enabled) return;

    const renderTime = performance.now() - renderStartRef.current;
    console.log(
      `📊 Library Render Time: ${renderTime.toFixed(
        2
      )}ms for ${itemCount} items`
    );

    if (onMetricsUpdate) {
      onMetricsUpdate({
        loadTime: 0, // Will be updated by navigation observer
        renderTime,
        apiCallTime: 0, // Will be updated by API calls
        itemCount,
        searchTime: 0,
        filterTime: 0,
      });
    }
  };

  const startApiCall = () => {
    if (!enabled) return;
    apiStartRef.current = performance.now();
  };

  const endApiCall = () => {
    if (!enabled) return;

    const apiCallTime = performance.now() - apiStartRef.current;
    console.log(`📊 Library API Call Time: ${apiCallTime.toFixed(2)}ms`);

    return apiCallTime;
  };

  const startSearch = () => {
    if (!enabled) return;
    searchStartRef.current = performance.now();
  };

  const endSearch = () => {
    if (!enabled) return;

    const searchTime = performance.now() - searchStartRef.current;
    console.log(`📊 Library Search Time: ${searchTime.toFixed(2)}ms`);

    return searchTime;
  };

  const startFilter = () => {
    if (!enabled) return;
    filterStartRef.current = performance.now();
  };

  const endFilter = () => {
    if (!enabled) return;

    const filterTime = performance.now() - filterStartRef.current;
    console.log(`📊 Library Filter Time: ${filterTime.toFixed(2)}ms`);

    return filterTime;
  };

  // Expose methods for external use
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).libraryPerformanceMonitor = {
        startRender,
        endRender,
        startApiCall,
        endApiCall,
        startSearch,
        endSearch,
        startFilter,
        endFilter,
      };
    }
  }, []);

  return null;
}

// Hook for using performance monitoring in components
export function useLibraryPerformance() {
  const startRender = () => {
    if (
      typeof window !== "undefined" &&
      (window as any).libraryPerformanceMonitor
    ) {
      (window as any).libraryPerformanceMonitor.startRender();
    }
  };

  const endRender = (itemCount: number) => {
    if (
      typeof window !== "undefined" &&
      (window as any).libraryPerformanceMonitor
    ) {
      (window as any).libraryPerformanceMonitor.endRender(itemCount);
    }
  };

  const startApiCall = () => {
    if (
      typeof window !== "undefined" &&
      (window as any).libraryPerformanceMonitor
    ) {
      (window as any).libraryPerformanceMonitor.startApiCall();
    }
  };

  const endApiCall = () => {
    if (
      typeof window !== "undefined" &&
      (window as any).libraryPerformanceMonitor
    ) {
      return (window as any).libraryPerformanceMonitor.endApiCall();
    }
    return 0;
  };

  const startSearch = () => {
    if (
      typeof window !== "undefined" &&
      (window as any).libraryPerformanceMonitor
    ) {
      (window as any).libraryPerformanceMonitor.startSearch();
    }
  };

  const endSearch = () => {
    if (
      typeof window !== "undefined" &&
      (window as any).libraryPerformanceMonitor
    ) {
      return (window as any).libraryPerformanceMonitor.endSearch();
    }
    return 0;
  };

  const startFilter = () => {
    if (
      typeof window !== "undefined" &&
      (window as any).libraryPerformanceMonitor
    ) {
      (window as any).libraryPerformanceMonitor.startFilter();
    }
  };

  const endFilter = () => {
    if (
      typeof window !== "undefined" &&
      (window as any).libraryPerformanceMonitor
    ) {
      return (window as any).libraryPerformanceMonitor.endFilter();
    }
    return 0;
  };

  return {
    startRender,
    endRender,
    startApiCall,
    endApiCall,
    startSearch,
    endSearch,
    startFilter,
    endFilter,
  };
}
