import { captureData } from "./monitoring";

interface PerformanceMetrics {
  cacheStats: {
    total: number;
    active: number;
    expired: number;
    hitRate: number;
  };
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
    percentage: number;
  };
  loadTime: number;
  renderTime: number;
  networkMetrics: {
    connectionType: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  resourceTiming: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };
  bundleSize: {
    total: number;
    js: number;
    css: number;
    images: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics | null = null;
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Only run on client side
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // Wait for page to be fully loaded
    if (document.readyState === "complete") {
      this.startMonitoring();
    } else {
      window.addEventListener("load", () => this.startMonitoring());
    }
  }

  private startMonitoring() {
    // Only run on client side
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    this.collectMetrics();
    this.setupPerformanceObservers();

    // Update metrics every 30 seconds
    this.updateInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);
  }

  private collectMetrics() {
    // Only run on client side
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    try {
      const metrics: PerformanceMetrics = {
        cacheStats: this.getCacheStats(),
        memoryUsage: this.getMemoryUsage(),
        loadTime: this.getLoadTime(),
        renderTime: this.getRenderTime(),
        networkMetrics: this.getNetworkMetrics(),
        resourceTiming: this.getResourceTiming(),
        bundleSize: this.getBundleSize(),
      };

      this.metrics = metrics;
      this.notifyObservers(metrics);

      // Log performance data
      captureData("performance_metrics", metrics);
    } catch (error) {
      console.error("Error collecting performance metrics:", error);
    }
  }

  private getCacheStats() {
    try {
      // Get cache stats from our cache system
      const { getCacheStats } = require("./cache");
      const stats = getCacheStats();

      const hitRate = stats.total > 0 ? stats.active / stats.total : 0;

      return {
        total: stats.size || 0,
        active: stats.size - stats.expiredEntries || 0,
        expired: stats.expiredEntries || 0,
        hitRate: Math.min(hitRate, 1),
      };
    } catch (error) {
      return { total: 0, active: 0, expired: 0, hitRate: 0 };
    }
  }

  private getMemoryUsage() {
    try {
      const memory = (performance as any).memory;
      if (!memory) {
        return { used: 0, total: 0, limit: 0, percentage: 0 };
      }

      const used = memory.usedJSHeapSize || 0;
      const total = memory.totalJSHeapSize || 0;
      const limit = memory.jsHeapSizeLimit || 0;
      const percentage = limit > 0 ? (used / limit) * 100 : 0;

      return { used, total, limit, percentage };
    } catch (error) {
      return { used: 0, total: 0, limit: 0, percentage: 0 };
    }
  }

  private getLoadTime() {
    try {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        return navigation.loadEventEnd - navigation.fetchStart;
      }

      // Fallback to performance.now()
      return performance.now();
    } catch (error) {
      return 0;
    }
  }

  private getRenderTime() {
    try {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        return navigation.domContentLoadedEventEnd - navigation.fetchStart;
      }

      // Fallback calculation
      return Date.now() - performance.timeOrigin;
    } catch (error) {
      return 0;
    }
  }

  private getNetworkMetrics() {
    try {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      if (connection) {
        return {
          connectionType: connection.type || "unknown",
          effectiveType: connection.effectiveType || "unknown",
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
        };
      }

      return {
        connectionType: "unknown",
        effectiveType: "unknown",
        downlink: 0,
        rtt: 0,
      };
    } catch (error) {
      return {
        connectionType: "unknown",
        effectiveType: "unknown",
        downlink: 0,
        rtt: 0,
      };
    }
  }

  private getResourceTiming() {
    try {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        return {
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.fetchStart,
          loadComplete: navigation.loadEventEnd - navigation.fetchStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint(),
        };
      }

      return {
        domContentLoaded: 0,
        loadComplete: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
      };
    } catch (error) {
      return {
        domContentLoaded: 0,
        loadComplete: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
      };
    }
  }

  private getFirstPaint() {
    try {
      const paintEntries = performance.getEntriesByType("paint");
      const firstPaint = paintEntries.find(
        entry => entry.name === "first-paint"
      );
      return firstPaint ? firstPaint.startTime : 0;
    } catch (error) {
      return 0;
    }
  }

  private getFirstContentfulPaint() {
    try {
      const paintEntries = performance.getEntriesByType("paint");
      const firstContentfulPaint = paintEntries.find(
        entry => entry.name === "first-contentful-paint"
      );
      return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
    } catch (error) {
      return 0;
    }
  }

  private getBundleSize() {
    try {
      const resources = performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];
      let total = 0;
      let js = 0;
      let css = 0;
      let images = 0;

      resources.forEach(resource => {
        const size = resource.transferSize || 0;
        total += size;

        const url = resource.name.toLowerCase();
        if (url.includes(".js")) {
          js += size;
        } else if (url.includes(".css")) {
          css += size;
        } else if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
          images += size;
        }
      });

      return { total, js, css, images };
    } catch (error) {
      return { total: 0, js: 0, css: 0, images: 0 };
    }
  }

  private setupPerformanceObservers() {
    try {
      // Observe long tasks
      if ("PerformanceObserver" in window) {
        const longTaskObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.duration > 50) {
              // Tasks longer than 50ms
              captureData("long_task", {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              });
            }
          });
        });

        longTaskObserver.observe({ entryTypes: ["longtask"] });
      }

      // Observe layout shifts
      if ("PerformanceObserver" in window) {
        const layoutShiftObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if ((entry as any).value > 0.1) {
              // Significant layout shift
              captureData("layout_shift", {
                value: (entry as any).value,
                startTime: entry.startTime,
              });
            }
          });
        });

        layoutShiftObserver.observe({ entryTypes: ["layout-shift"] });
      }
    } catch (error) {
      console.error("Error setting up performance observers:", error);
    }
  }

  public getMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.observers.push(callback);

    // Immediately call with current metrics if available
    if (this.metrics) {
      callback(this.metrics);
    }
  }

  public unsubscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  private notifyObservers(metrics: PerformanceMetrics) {
    this.observers.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error("Error in performance observer callback:", error);
      }
    });
  }

  public destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.observers = [];
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
export type { PerformanceMetrics };
