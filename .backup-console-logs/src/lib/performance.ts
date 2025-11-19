import { captureMetric, captureData } from "./monitoring";

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: Map<string, PerformanceObserver> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Monitor Core Web Vitals
  monitorWebVitals() {
    if (typeof window === "undefined") return;

    // Monitor Largest Contentful Paint (LCP)
    this.observeLCP();

    // Monitor First Input Delay (FID)
    this.observeFID();

    // Monitor Cumulative Layout Shift (CLS)
    this.observeCLS();

    // Monitor First Contentful Paint (FCP)
    this.observeFCP();
  }

  private observeLCP() {
    if (!("PerformanceObserver" in window)) return;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry;

      if (lastEntry) {
        captureMetric("lcp", lastEntry.startTime);

        // Report to analytics
        if ("gtag" in window) {
          (window as any).gtag("event", "web_vitals", {
            event_category: "Web Vitals",
            event_label: "LCP",
            value: Math.round(lastEntry.startTime),
          });
        }
      }
    });

    observer.observe({ entryTypes: ["largest-contentful-paint"] });
    this.observers.set("lcp", observer);
  }

  private observeFID() {
    if (!("PerformanceObserver" in window)) return;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        const firstInputEntry = entry as any;
        captureMetric(
          "fid",
          firstInputEntry.processingStart - firstInputEntry.startTime
        );

        if ("gtag" in window) {
          (window as any).gtag("event", "web_vitals", {
            event_category: "Web Vitals",
            event_label: "FID",
            value: Math.round(
              firstInputEntry.processingStart - firstInputEntry.startTime
            ),
          });
        }
      });
    });

    observer.observe({ entryTypes: ["first-input"] });
    this.observers.set("fid", observer);
  }

  private observeCLS() {
    if (!("PerformanceObserver" in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          captureMetric("cls", clsValue);
        }
      });
    });

    observer.observe({ entryTypes: ["layout-shift"] });
    this.observers.set("cls", observer);
  }

  private observeFCP() {
    if (!("PerformanceObserver" in window)) return;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const firstEntry = entries[0];

      if (firstEntry) {
        captureMetric("fcp", firstEntry.startTime);

        if ("gtag" in window) {
          (window as any).gtag("event", "web_vitals", {
            event_category: "Web Vitals",
            event_label: "FCP",
            value: Math.round(firstEntry.startTime),
          });
        }
      }
    });

    observer.observe({ entryTypes: ["paint"] });
    this.observers.set("fcp", observer);
  }

  // Monitor resource loading performance
  monitorResourceTiming() {
    if (typeof window === "undefined") return;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.initiatorType === "img" || entry.initiatorType === "script") {
          captureData("resource_timing", {
            name: entry.name,
            type: entry.initiatorType,
            duration: entry.duration,
            size: entry.transferSize,
          });
        }
      });
    });

    observer.observe({ entryTypes: ["resource"] });
    this.observers.set("resource", observer);
  }

  // Monitor user interactions
  monitorUserInteractions() {
    if (typeof window === "undefined") return;

    let interactionCount = 0;
    let lastInteractionTime = Date.now();

    const trackInteraction = () => {
      const now = Date.now();
      const timeSinceLastInteraction = now - lastInteractionTime;

      interactionCount++;
      lastInteractionTime = now;

      captureData("user_interaction", {
        count: interactionCount,
        timeSinceLast: timeSinceLastInteraction,
        timestamp: now,
      });
    };

    // Track various user interactions
    window.addEventListener("click", trackInteraction, { passive: true });
    window.addEventListener("keydown", trackInteraction, { passive: true });
    window.addEventListener("scroll", trackInteraction, { passive: true });
    window.addEventListener("input", trackInteraction, { passive: true });
  }

  // Monitor memory usage (if available)
  monitorMemoryUsage() {
    if (typeof window === "undefined" || !("memory" in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      captureData("memory_usage", {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      });
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }

  // Start all monitoring
  start() {
    // Only run detailed monitoring in development
    if (process.env.NODE_ENV === "development") {
      this.monitorWebVitals();
      this.monitorResourceTiming();
      this.monitorUserInteractions();
      this.monitorMemoryUsage();
    } else {
      // In production, only monitor essential web vitals
      this.monitorWebVitals();
    }
  }

  // Stop all monitoring
  stop() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions for manual performance tracking
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    try {
      captureData("performance_measure", { name, duration });
    } catch (monitoringError) {
      // Silently ignore monitoring errors in tests
      console.debug("Monitoring not available:", monitoringError);
    }
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    try {
      captureData("performance_measure_error", {
        name,
        duration,
        error: (error as Error).message || "Unknown error",
      });
    } catch (monitoringError) {
      // Silently ignore monitoring errors in tests
      console.debug("Monitoring not available:", monitoringError);
    }
    throw error;
  }
}

export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    try {
      captureData("performance_measure_async", { name, duration });
    } catch (monitoringError) {
      // Silently ignore monitoring errors in tests
      console.debug("Monitoring not available:", monitoringError);
    }
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    try {
      captureData("performance_measure_async_error", {
        name,
        duration,
        error: (error as Error).message || "Unknown error",
      });
    } catch (monitoringError) {
      // Silently ignore monitoring errors in tests
      console.debug("Monitoring not available:", monitoringError);
    }
    throw error;
  }
}

// Performance budget checking
export function checkPerformanceBudget(
  metric: string,
  value: number,
  budget: number
): boolean {
  const isWithinBudget = value <= budget;

  if (!isWithinBudget) {
    captureData("performance_budget_exceeded", {
      metric,
      value,
      budget,
      exceededBy: value - budget,
    });
  }

  return isWithinBudget;
}
