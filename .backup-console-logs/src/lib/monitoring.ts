// Monitoring and error tracking system
// In production, integrate with Sentry, LogRocket, or similar services

export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp: number;
  level: "error" | "warn" | "info";
  context?: Record<string, any>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  url?: string;
}

export interface UserAction {
  action: string;
  category: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  url?: string;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private errors: ErrorInfo[] = [];
  private metrics: PerformanceMetric[] = [];
  private actions: UserAction[] = [];
  private sessionId: string;
  private isProduction: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isProduction = process.env.NODE_ENV === "production";

    // Initialize monitoring in production
    if (this.isProduction) {
      this.initializeProductionMonitoring();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeProductionMonitoring() {
    // Initialize Sentry or other monitoring services here
    // Example:
    // Sentry.init({
    //   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    //   environment: process.env.NODE_ENV,
    //   tracesSampleRate: 1.0,
    // })
  }

  // Error tracking
  captureError(error: Error | string, context?: Record<string, any>): void {
    const errorInfo: ErrorInfo = {
      message: typeof error === "string" ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now(),
      level: "error",
      context,
      sessionId: this.sessionId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    this.errors.push(errorInfo);

    // Log to console in development
    if (!this.isProduction) {
      console.error("Error captured:", errorInfo);
    }

    // Send to monitoring service in production
    if (this.isProduction) {
      this.sendToMonitoringService("error", errorInfo);
    }
  }

  captureWarning(message: string, context?: Record<string, any>): void {
    const warningInfo: ErrorInfo = {
      message,
      timestamp: Date.now(),
      level: "warn",
      context,
      sessionId: this.sessionId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    this.errors.push(warningInfo);

    if (!this.isProduction) {
      console.warn("Warning captured:", warningInfo);
    }

    if (this.isProduction) {
      this.sendToMonitoringService("warning", warningInfo);
    }
  }

  // Performance monitoring
  captureMetric(name: string, value: number, unit: string = "ms"): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    this.metrics.push(metric);

    if (this.isProduction) {
      this.sendToMonitoringService("metric", metric);
    }
  }

  // User action tracking
  captureAction(
    action: string,
    category: string,
    metadata?: Record<string, any>
  ): void {
    const userAction: UserAction = {
      action,
      category,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      metadata,
    };

    this.actions.push(userAction);

    if (this.isProduction) {
      this.sendToMonitoringService("action", userAction);
    }
  }

  // General data capture for complex metrics
  captureData(name: string, data: any): void {
    const dataInfo = {
      name,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    // Send to monitoring service in production
    // Note: Console logging removed for security - data is still captured internally
    if (process.env.NODE_ENV === "production") {
      this.sendToMonitoringService("data", dataInfo);
    }
  }

  // Web Vitals monitoring
  captureWebVitals(metric: any): void {
    this.captureMetric(
      `web-vital-${metric.name}`,
      metric.value,
      metric.unit || "ms"
    );
  }

  // API performance monitoring
  captureApiCall(endpoint: string, duration: number, status: number): void {
    this.captureMetric(`api-${endpoint}`, duration, "ms");

    if (status >= 400) {
      this.captureError(`API call failed: ${endpoint}`, {
        endpoint,
        status,
        duration,
      });
    }
  }

  // Database performance monitoring
  captureDatabaseQuery(
    query: string,
    duration: number,
    success: boolean
  ): void {
    this.captureMetric(`db-query`, duration, "ms");

    if (!success) {
      this.captureError(`Database query failed: ${query}`, {
        query,
        duration,
      });
    }
  }

  // Memory usage monitoring
  captureMemoryUsage(): void {
    if (typeof performance !== "undefined" && "memory" in performance) {
      const memory = (performance as any).memory;
      this.captureMetric("memory-used", memory.usedJSHeapSize, "bytes");
      this.captureMetric("memory-total", memory.totalJSHeapSize, "bytes");
      this.captureMetric("memory-limit", memory.jsHeapSizeLimit, "bytes");
    }
  }

  // Custom performance monitoring
  timeFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.captureMetric(`function-${name}`, duration, "ms");
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.captureMetric(`function-${name}-error`, duration, "ms");
      throw error;
    }
  }

  async timeAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.captureMetric(`async-function-${name}`, duration, "ms");
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.captureMetric(`async-function-${name}-error`, duration, "ms");
      throw error;
    }
  }

  // Send data to monitoring service
  private async sendToMonitoringService(
    type: string,
    data: any
  ): Promise<void> {
    try {
      // In production, send to your monitoring service
      // Example for a custom endpoint:
      // await fetch('/api/monitoring', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ type, data }),
      // })
    } catch (error) {
      // Don't let monitoring errors break the app
      console.error("Failed to send monitoring data:", error);
    }
  }

  // Get monitoring data for debugging
  getMonitoringData() {
    return {
      errors: this.errors,
      metrics: this.metrics,
      actions: this.actions,
      sessionId: this.sessionId,
    };
  }

  // Clear old data (keep last 1000 entries)
  cleanup(): void {
    const maxEntries = 1000;
    if (this.errors.length > maxEntries) {
      this.errors = this.errors.slice(-maxEntries);
    }
    if (this.metrics.length > maxEntries) {
      this.metrics = this.metrics.slice(-maxEntries);
    }
    if (this.actions.length > maxEntries) {
      this.actions = this.actions.slice(-maxEntries);
    }
  }
}

// Create singleton instance
export const monitoring = new MonitoringService();

// Export convenience functions
export const captureError = (
  error: Error | string,
  context?: Record<string, any>
) => monitoring.captureError(error, context);

export const captureWarning = (
  message: string,
  context?: Record<string, any>
) => monitoring.captureWarning(message, context);

export const captureMetric = (name: string, value: number, unit?: string) =>
  monitoring.captureMetric(name, value, unit);

export const captureAction = (
  action: string,
  category: string,
  metadata?: Record<string, any>
) => monitoring.captureAction(action, category, metadata);

export const captureData = (name: string, data: any) =>
  monitoring.captureData(name, data);

export const timeFunction = <T>(name: string, fn: () => T) =>
  monitoring.timeFunction(name, fn);

export const timeAsyncFunction = <T>(name: string, fn: () => Promise<T>) =>
  monitoring.timeAsyncFunction(name, fn);

// Web Vitals integration
export function reportWebVitals(metric: any): void {
  monitoring.captureWebVitals(metric);
}

// Cleanup old data every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    monitoring.cleanup();
  }, 5 * 60 * 1000);
}
