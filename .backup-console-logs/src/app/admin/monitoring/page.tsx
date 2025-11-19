/**
 * Safe Monitoring Dashboard
 * This provides system monitoring without affecting existing functionality
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Database,
  Server,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { LoadingState } from "@/components/ui/loading";

interface HealthData {
  status: string;
  timestamp: string;
  responseTime: number;
  services: {
    database: {
      status: string;
      responseTime: number;
      error?: string;
    };
    environment: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
    performance: {
      summary: Record<string, any>;
      recentLogs: number;
    };
  };
  system: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    memory: {
      used: number;
      total: number;
      external: number;
    };
  };
}

export default function MonitoringPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);
      setUnauthorized(false);

      const response = await fetch("/api/health");

      if (response.status === 401) {
        setUnauthorized(true);
        return;
      }

      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch health data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "unhealthy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && !healthData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState size="lg" message="Loading monitoring data..." />
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">
              You don't have permission to access the monitoring dashboard.
              Please contact an administrator.
            </p>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              variant="outline"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Monitoring Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchHealthData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!healthData) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <Button onClick={fetchHealthData} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor(
                healthData.status
              )}`}
            />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Overall Status</p>
              <Badge
                variant={
                  healthData.status === "healthy" ? "default" : "destructive"
                }
              >
                {healthData.status.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Response Time</p>
              <p className="text-lg font-semibold">
                {healthData.responseTime}ms
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Check</p>
              <p className="text-sm">
                {new Date(healthData.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <Badge
                  variant={
                    healthData.services.database.status === "healthy"
                      ? "default"
                      : "destructive"
                  }
                >
                  {healthData.services.database.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Response Time</span>
                <span>{healthData.services.database.responseTime}ms</span>
              </div>
              {healthData.services.database.error && (
                <div className="text-sm text-red-600">
                  Error: {healthData.services.database.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Environment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Valid</span>
                <Badge
                  variant={
                    healthData.services.environment.valid
                      ? "default"
                      : "destructive"
                  }
                >
                  {healthData.services.environment.valid ? "YES" : "NO"}
                </Badge>
              </div>
              {healthData.services.environment.errors.length > 0 && (
                <div className="text-sm text-red-600">
                  Errors: {healthData.services.environment.errors.length}
                </div>
              )}
              {healthData.services.environment.warnings.length > 0 && (
                <div className="text-sm text-yellow-600">
                  Warnings: {healthData.services.environment.warnings.length}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Node Version</p>
              <p className="font-mono">{healthData.system.nodeVersion}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Platform</p>
              <p className="font-mono">{healthData.system.platform}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="font-mono">
                {formatUptime(healthData.system.uptime)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Memory Usage</p>
              <p className="font-mono">
                {healthData.system.memory.used}MB /{" "}
                {healthData.system.memory.total}MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
