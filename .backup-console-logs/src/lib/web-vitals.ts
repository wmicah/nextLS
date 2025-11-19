import { captureData } from "./monitoring";

interface WebVitals {
  CLS: number; // Cumulative Layout Shift
  FID: number; // First Input Delay
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  TTFB: number; // Time to First Byte
}

class WebVitalsMonitor {
  private vitals: Partial<WebVitals> = {};
  private observers: ((vitals: Partial<WebVitals>) => void)[] = [];

  constructor() {
    this.initializeWebVitals();
  }

  private initializeWebVitals() {
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

    this.measureCLS();
    this.measureFID();
    this.measureFCP();
    this.measureLCP();
    this.measureTTFB();
  }

  private measureCLS() {
    try {
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];

      const clsObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsEntries.push(entry);
            clsValue += (entry as any).value;
          }
        }
      });

      clsObserver.observe({ entryTypes: ["layout-shift"] });

      // Report CLS when page is hidden
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.vitals.CLS = clsValue;
          this.reportVitals();
          clsObserver.disconnect();
        }
      });
    } catch (error) {
      console.error("Error measuring CLS:", error);
    }
  }

  private measureFID() {
    try {
      const fidObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime;
          this.vitals.FID = fid;
          this.reportVitals();
        }
      });

      fidObserver.observe({ entryTypes: ["first-input"] });
    } catch (error) {
      console.error("Error measuring FID:", error);
    }
  }

  private measureFCP() {
    try {
      const fcpObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            this.vitals.FCP = entry.startTime;
            this.reportVitals();
          }
        }
      });

      fcpObserver.observe({ entryTypes: ["paint"] });
    } catch (error) {
      console.error("Error measuring FCP:", error);
    }
  }

  private measureLCP() {
    try {
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.vitals.LCP = lastEntry.startTime;
        this.reportVitals();
      });

      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (error) {
      console.error("Error measuring LCP:", error);
    }
  }

  private measureTTFB() {
    try {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.vitals.TTFB = navigation.responseStart - navigation.requestStart;
        this.reportVitals();
      }
    } catch (error) {
      console.error("Error measuring TTFB:", error);
    }
  }

  private reportVitals() {
    // Log to monitoring system
    captureData("web_vitals", this.vitals);

    // Notify observers
    this.notifyObservers();
  }

  public getVitals(): Partial<WebVitals> {
    return { ...this.vitals };
  }

  public subscribe(callback: (vitals: Partial<WebVitals>) => void) {
    this.observers.push(callback);

    // Immediately call with current vitals if available
    if (Object.keys(this.vitals).length > 0) {
      callback(this.vitals);
    }
  }

  public unsubscribe(callback: (vitals: Partial<WebVitals>) => void) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  private notifyObservers() {
    this.observers.forEach(callback => {
      try {
        callback(this.vitals);
      } catch (error) {
        console.error("Error in web vitals observer callback:", error);
      }
    });
  }

  public getVitalsScore(
    vital: keyof WebVitals,
    value: number
  ): "good" | "needs-improvement" | "poor" {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[vital];
    if (value <= threshold.good) return "good";
    if (value <= threshold.poor) return "needs-improvement";
    return "poor";
  }
}

// Create singleton instance
const webVitalsMonitor = new WebVitalsMonitor();

export default webVitalsMonitor;
export type { WebVitals };
