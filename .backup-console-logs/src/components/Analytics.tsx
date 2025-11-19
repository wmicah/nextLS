"use client";

import { useEffect } from "react";
import { performanceMonitor } from "@/lib/performance";
import { captureMetric, captureData } from "@/lib/monitoring";

export default function Analytics() {
  useEffect(() => {
    // Only show analytics in development mode
    if (process.env.NODE_ENV === "production") return;
    // Start performance monitoring
    performanceMonitor.start();

    // Track page view
    const trackPageView = () => {
      const pageData = {
        url: window.location.href,
        pathname: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      };

      captureData("page_view", pageData);

      // Send to analytics if available
      if (typeof window !== "undefined" && "gtag" in window) {
        (window as any).gtag("config", "GA_MEASUREMENT_ID", {
          page_title: pageData.title,
          page_location: pageData.url,
          page_referrer: pageData.referrer,
        });
      }
    };

    // Track user interactions
    const trackUserInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      const interactionData = {
        type: event.type,
        target: {
          tagName: target.tagName,
          className: target.className,
          id: target.id,
          textContent: target.textContent?.substring(0, 100),
        },
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };

      captureData("user_interaction", interactionData);
    };

    // Track form submissions
    const trackFormSubmission = (event: Event) => {
      const form = event.target as HTMLFormElement;
      const formData = {
        action: form.action,
        method: form.method,
        formId: form.id || form.name || "unknown",
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };

      captureData("form_submission", formData);
    };

    // Track client-side errors
    const trackError = (event: ErrorEvent) => {
      const errorData = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || "Unknown error",
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      captureData("client_error", errorData);
    };

    // Track unhandled promise rejections
    const trackUnhandledRejection = (event: PromiseRejectionEvent) => {
      const rejectionData = {
        reason: event.reason?.toString() || "Unknown rejection",
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      captureData("unhandled_rejection", rejectionData);
    };

    // Track performance metrics
    const trackPerformanceMetrics = () => {
      if ("performance" in window) {
        const navigation = performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;

        if (navigation) {
          const performanceData = {
            dnsLookup:
              navigation.domainLookupEnd - navigation.domainLookupStart,
            tcpConnection: navigation.connectEnd - navigation.connectStart,
            serverResponse: navigation.responseEnd - navigation.requestStart,
            domContentLoaded:
              navigation.domContentLoadedEventEnd -
              navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            totalTime: navigation.loadEventEnd - navigation.fetchStart,
            timestamp: new Date().toISOString(),
            url: window.location.href,
          };

          captureData("performance_navigation", performanceData);
        }
      }
    };

    // Track resource loading
    const trackResourceLoading = () => {
      if ("performance" in window) {
        const resources = performance.getEntriesByType("resource");
        const resourceData = resources.map(resource => ({
          name: resource.name,
          type: (resource as any).initiatorType || "unknown",
          duration: resource.duration,
          size: (resource as any).transferSize || 0,
          timestamp: new Date().toISOString(),
        }));

        captureData("resource_loading", resourceData);
      }
    };

    // Track memory usage (if available)
    const trackMemoryUsage = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        const memoryData = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
          timestamp: new Date().toISOString(),
        };

        captureData("memory_usage", memoryData);
      }
    };

    // Track network information (if available)
    const trackNetworkInfo = () => {
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        const networkData = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          timestamp: new Date().toISOString(),
        };

        captureData("network_info", networkData);
      }
    };

    // Track battery information (if available)
    const trackBatteryInfo = async () => {
      if ("getBattery" in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          const batteryData = {
            level: battery.level,
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
            timestamp: new Date().toISOString(),
          };

          captureData("battery_info", batteryData);
        } catch (error) {
          // Battery API not supported or permission denied
        }
      }
    };

    // Initial tracking
    trackPageView();
    trackPerformanceMetrics();
    trackResourceLoading();
    trackMemoryUsage();
    trackNetworkInfo();
    trackBatteryInfo();

    // Set up event listeners
    window.addEventListener("click", trackUserInteraction, { passive: true });
    window.addEventListener("keydown", trackUserInteraction, { passive: true });
    window.addEventListener("scroll", trackUserInteraction, { passive: true });
    window.addEventListener("input", trackUserInteraction, { passive: true });
    window.addEventListener("submit", trackFormSubmission, { passive: true });
    window.addEventListener("error", trackError);
    window.addEventListener("unhandledrejection", trackUnhandledRejection);

    // Track page visibility changes
    let hiddenTime: number | null = null;
    const trackVisibilityChange = () => {
      if (document.hidden) {
        hiddenTime = Date.now();
      } else if (hiddenTime) {
        const hiddenDuration = Date.now() - hiddenTime;
        captureData("page_visibility", {
          action: "visible",
          hiddenDuration,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        });
        hiddenTime = null;
      }
    };

    document.addEventListener("visibilitychange", trackVisibilityChange);

    // Track beforeunload
    const trackBeforeUnload = () => {
      captureData("page_unload", {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        timeOnPage: Date.now() - performance.timeOrigin,
      });
    };

    window.addEventListener("beforeunload", trackBeforeUnload);

    // Periodic tracking
    const intervalId = setInterval(() => {
      trackMemoryUsage();
      trackNetworkInfo();
    }, 30000); // Every 30 seconds

    // Cleanup function
    return () => {
      // Stop performance monitoring
      performanceMonitor.stop();

      // Remove event listeners
      window.removeEventListener("click", trackUserInteraction);
      window.removeEventListener("keydown", trackUserInteraction);
      window.removeEventListener("scroll", trackUserInteraction);
      window.removeEventListener("input", trackUserInteraction);
      window.removeEventListener("submit", trackFormSubmission);
      window.removeEventListener("error", trackError);
      window.removeEventListener("unhandledrejection", trackUnhandledRejection);
      document.removeEventListener("visibilitychange", trackVisibilityChange);
      window.removeEventListener("beforeunload", trackBeforeUnload);

      // Clear interval
      clearInterval(intervalId);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
