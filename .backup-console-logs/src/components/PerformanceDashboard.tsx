"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import performanceMonitor, {
  PerformanceMetrics,
} from "@/lib/performance-monitor";
import webVitalsMonitor, { WebVitals } from "@/lib/web-vitals";

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [webVitals, setWebVitals] = useState<Partial<WebVitals>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = () => {
    const currentMetrics = performanceMonitor.getMetrics();
    if (currentMetrics) {
      setMetrics(currentMetrics);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Subscribe to real-time performance updates
    performanceMonitor.subscribe(newMetrics => {
      setMetrics(newMetrics);
      setIsLoading(false);
    });

    // Subscribe to Web Vitals updates
    webVitalsMonitor.subscribe(newVitals => {
      setWebVitals(newVitals);
    });

    // Initial fetch
    fetchMetrics();

    // Cleanup subscriptions on unmount
    return () => {
      performanceMonitor.unsubscribe(fetchMetrics);
      webVitalsMonitor.unsubscribe(setWebVitals);
    };
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Unable to load performance metrics</p>
        </CardContent>
      </Card>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getMemoryUsagePercentage = () => {
    return metrics.memoryUsage.percentage;
  };

  const getCacheHitRateColor = (hitRate: number) => {
    if (hitRate >= 0.8) return "bg-green-500";
    if (hitRate >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <Button onClick={fetchMetrics} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Cache Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Cache Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Entries</span>
                <Badge variant="secondary">{metrics.cacheStats.total}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active</span>
                <Badge variant="outline">{metrics.cacheStats.active}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Expired</span>
                <Badge variant="destructive">
                  {metrics.cacheStats.expired}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hit Rate</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getCacheHitRateColor(
                        metrics.cacheStats.hitRate
                      )}`}
                      style={{ width: `${metrics.cacheStats.hitRate * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {(metrics.cacheStats.hitRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Used</span>
                <span className="text-sm font-medium">
                  {formatBytes(metrics.memoryUsage.used)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-sm font-medium">
                  {formatBytes(metrics.memoryUsage.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Limit</span>
                <span className="text-sm font-medium">
                  {formatBytes(metrics.memoryUsage.limit)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${getMemoryUsagePercentage()}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {getMemoryUsagePercentage().toFixed(1)}% used
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Load Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Load Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.loadTime.toFixed(0)}ms
              </div>
              <p className="text-xs text-gray-500 mt-1">Page load time</p>
            </div>
          </CardContent>
        </Card>

        {/* Render Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Render Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.renderTime.toFixed(0)}ms
              </div>
              <p className="text-xs text-gray-500 mt-1">Time to render</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Network Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Connection</span>
                <Badge variant="outline">
                  {metrics.networkMetrics.effectiveType}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Download Speed</span>
                <span className="text-sm font-medium">
                  {metrics.networkMetrics.downlink.toFixed(1)} Mbps
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Latency</span>
                <span className="text-sm font-medium">
                  {metrics.networkMetrics.rtt}ms
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Timing */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Resource Timing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">First Paint</span>
                <span className="text-sm font-medium">
                  {metrics.resourceTiming.firstPaint.toFixed(0)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">DOM Ready</span>
                <span className="text-sm font-medium">
                  {metrics.resourceTiming.domContentLoaded.toFixed(0)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Load Complete</span>
                <span className="text-sm font-medium">
                  {metrics.resourceTiming.loadComplete.toFixed(0)}ms
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bundle Size */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-sm font-medium">
                  {formatBytes(metrics.bundleSize.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">JavaScript</span>
                <span className="text-sm font-medium">
                  {formatBytes(metrics.bundleSize.js)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">CSS</span>
                <span className="text-sm font-medium">
                  {formatBytes(metrics.bundleSize.css)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Images</span>
                <span className="text-sm font-medium">
                  {formatBytes(metrics.bundleSize.images)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Web Vitals */}
      {Object.keys(webVitals).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {webVitals.CLS !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">CLS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      webVitalsMonitor.getVitalsScore("CLS", webVitals.CLS) ===
                      "good"
                        ? "text-green-600"
                        : webVitalsMonitor.getVitalsScore(
                            "CLS",
                            webVitals.CLS
                          ) === "needs-improvement"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {webVitals.CLS.toFixed(3)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cumulative Layout Shift
                  </p>
                  <Badge
                    variant={
                      webVitalsMonitor.getVitalsScore("CLS", webVitals.CLS) ===
                      "good"
                        ? "default"
                        : webVitalsMonitor.getVitalsScore(
                            "CLS",
                            webVitals.CLS
                          ) === "needs-improvement"
                        ? "secondary"
                        : "destructive"
                    }
                    className="mt-2"
                  >
                    {webVitalsMonitor.getVitalsScore("CLS", webVitals.CLS)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {webVitals.FID !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">FID</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      webVitalsMonitor.getVitalsScore("FID", webVitals.FID) ===
                      "good"
                        ? "text-green-600"
                        : webVitalsMonitor.getVitalsScore(
                            "FID",
                            webVitals.FID
                          ) === "needs-improvement"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {webVitals.FID.toFixed(0)}ms
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    First Input Delay
                  </p>
                  <Badge
                    variant={
                      webVitalsMonitor.getVitalsScore("FID", webVitals.FID) ===
                      "good"
                        ? "default"
                        : webVitalsMonitor.getVitalsScore(
                            "FID",
                            webVitals.FID
                          ) === "needs-improvement"
                        ? "secondary"
                        : "destructive"
                    }
                    className="mt-2"
                  >
                    {webVitalsMonitor.getVitalsScore("FID", webVitals.FID)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {webVitals.FCP !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">FCP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      webVitalsMonitor.getVitalsScore("FCP", webVitals.FCP) ===
                      "good"
                        ? "text-green-600"
                        : webVitalsMonitor.getVitalsScore(
                            "FCP",
                            webVitals.FCP
                          ) === "needs-improvement"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {webVitals.FCP.toFixed(0)}ms
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    First Contentful Paint
                  </p>
                  <Badge
                    variant={
                      webVitalsMonitor.getVitalsScore("FCP", webVitals.FCP) ===
                      "good"
                        ? "default"
                        : webVitalsMonitor.getVitalsScore(
                            "FCP",
                            webVitals.FCP
                          ) === "needs-improvement"
                        ? "secondary"
                        : "destructive"
                    }
                    className="mt-2"
                  >
                    {webVitalsMonitor.getVitalsScore("FCP", webVitals.FCP)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {webVitals.LCP !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">LCP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      webVitalsMonitor.getVitalsScore("LCP", webVitals.LCP) ===
                      "good"
                        ? "text-green-600"
                        : webVitalsMonitor.getVitalsScore(
                            "LCP",
                            webVitals.LCP
                          ) === "needs-improvement"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {webVitals.LCP.toFixed(0)}ms
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Largest Contentful Paint
                  </p>
                  <Badge
                    variant={
                      webVitalsMonitor.getVitalsScore("LCP", webVitals.LCP) ===
                      "good"
                        ? "default"
                        : webVitalsMonitor.getVitalsScore(
                            "LCP",
                            webVitals.LCP
                          ) === "needs-improvement"
                        ? "secondary"
                        : "destructive"
                    }
                    className="mt-2"
                  >
                    {webVitalsMonitor.getVitalsScore("LCP", webVitals.LCP)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {webVitals.TTFB !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">TTFB</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      webVitalsMonitor.getVitalsScore(
                        "TTFB",
                        webVitals.TTFB
                      ) === "good"
                        ? "text-green-600"
                        : webVitalsMonitor.getVitalsScore(
                            "TTFB",
                            webVitals.TTFB
                          ) === "needs-improvement"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {webVitals.TTFB.toFixed(0)}ms
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Time to First Byte
                  </p>
                  <Badge
                    variant={
                      webVitalsMonitor.getVitalsScore(
                        "TTFB",
                        webVitals.TTFB
                      ) === "good"
                        ? "default"
                        : webVitalsMonitor.getVitalsScore(
                            "TTFB",
                            webVitals.TTFB
                          ) === "needs-improvement"
                        ? "secondary"
                        : "destructive"
                    }
                    className="mt-2"
                  >
                    {webVitalsMonitor.getVitalsScore("TTFB", webVitals.TTFB)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.cacheStats.hitRate < 0.6 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">
                    Low Cache Hit Rate (
                    {(metrics.cacheStats.hitRate * 100).toFixed(1)}%)
                  </p>
                  <p className="text-xs text-gray-600">
                    Consider implementing more aggressive caching strategies.
                  </p>
                </div>
              </div>
            )}
            {getMemoryUsagePercentage() > 80 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">
                    High Memory Usage ({getMemoryUsagePercentage().toFixed(1)}%)
                  </p>
                  <p className="text-xs text-gray-600">
                    Consider implementing memory cleanup or reducing data
                    retention.
                  </p>
                </div>
              </div>
            )}
            {metrics.loadTime > 3000 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">
                    Slow Load Time ({metrics.loadTime.toFixed(0)}ms)
                  </p>
                  <p className="text-xs text-gray-600">
                    Consider optimizing bundle size or implementing lazy
                    loading.
                  </p>
                </div>
              </div>
            )}
            {metrics.bundleSize.total > 5 * 1024 * 1024 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">
                    Large Bundle Size ({formatBytes(metrics.bundleSize.total)})
                  </p>
                  <p className="text-xs text-gray-600">
                    Consider code splitting and lazy loading to reduce initial
                    bundle size.
                  </p>
                </div>
              </div>
            )}
            {metrics.networkMetrics.effectiveType === "slow-2g" ||
              (metrics.networkMetrics.effectiveType === "2g" && (
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">
                      Slow Network Connection (
                      {metrics.networkMetrics.effectiveType})
                    </p>
                    <p className="text-xs text-gray-600">
                      Consider implementing progressive loading and reducing
                      data usage.
                    </p>
                  </div>
                </div>
              ))}
            {metrics.cacheStats.hitRate >= 0.8 &&
              getMemoryUsagePercentage() < 60 &&
              metrics.loadTime < 2000 &&
              metrics.bundleSize.total < 2 * 1024 * 1024 && (
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Excellent Performance</p>
                    <p className="text-xs text-gray-600">
                      Your application is performing optimally across all
                      metrics!
                    </p>
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
