"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  TrendingUp,
  Clock,
} from "lucide-react";

interface SecurityStats {
  totalUploads: number;
  blockedUploads: number;
  suspiciousFiles: number;
  rateLimitHits: number;
  last24Hours: {
    uploads: number;
    blocks: number;
    warnings: number;
  };
}

interface SecurityEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  userId: string;
  fileName?: string;
  ipAddress?: string;
}

export default function FileSecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats>({
    totalUploads: 0,
    blockedUploads: 0,
    suspiciousFiles: 0,
    rateLimitHits: 0,
    last24Hours: {
      uploads: 0,
      blocks: 0,
      warnings: 0,
    },
  });

  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching security data
    // In a real app, this would come from your API
    const fetchSecurityData = async () => {
      setIsLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStats({
        totalUploads: 1247,
        blockedUploads: 23,
        suspiciousFiles: 8,
        rateLimitHits: 15,
        last24Hours: {
          uploads: 89,
          blocks: 3,
          warnings: 12,
        },
      });

      setRecentEvents([
        {
          id: "1",
          type: "upload_blocked",
          message: "Malicious file detected: virus.exe",
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          severity: "high",
          userId: "user_123",
          fileName: "virus.exe",
          ipAddress: "192.168.1.100",
        },
        {
          id: "2",
          type: "rate_limit",
          message: "Rate limit exceeded for user",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          severity: "medium",
          userId: "user_456",
          ipAddress: "192.168.1.101",
        },
        {
          id: "3",
          type: "suspicious_file",
          message: "File with multiple extensions detected",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          severity: "medium",
          userId: "user_789",
          fileName: "document.pdf.exe",
          ipAddress: "192.168.1.102",
        },
      ]);

      setIsLoading(false);
    };

    fetchSecurityData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Uploads
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUploads.toLocaleString()}
                </p>
              </div>
              <Upload className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              +{stats.last24Hours.uploads} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Blocked Uploads
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.blockedUploads}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              +{stats.last24Hours.blocks} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Suspicious Files
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.suspiciousFiles}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              +{stats.last24Hours.warnings} warnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Rate Limit Hits
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.rateLimitHits}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Users throttled</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Block Rate</span>
                <Badge variant="outline" className="text-red-600">
                  {((stats.blockedUploads / stats.totalUploads) * 100).toFixed(
                    1
                  )}
                  %
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Suspicious Rate</span>
                <Badge variant="outline" className="text-yellow-600">
                  {((stats.suspiciousFiles / stats.totalUploads) * 100).toFixed(
                    1
                  )}
                  %
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Success Rate</span>
                <Badge variant="outline" className="text-green-600">
                  {(
                    ((stats.totalUploads - stats.blockedUploads) /
                      stats.totalUploads) *
                    100
                  ).toFixed(1)}
                  %
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.last24Hours.uploads > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Uploads (24h)</span>
                  <span className="font-medium">
                    {stats.last24Hours.uploads}
                  </span>
                </div>
              )}
              {stats.last24Hours.blocks > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Blocks (24h)</span>
                  <span className="font-medium text-red-600">
                    {stats.last24Hours.blocks}
                  </span>
                </div>
              )}
              {stats.last24Hours.warnings > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Warnings (24h)</span>
                  <span className="font-medium text-yellow-600">
                    {stats.last24Hours.warnings}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No recent security events
              </p>
            ) : (
              recentEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                >
                  {getSeverityIcon(event.severity)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {event.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                      {event.fileName && (
                        <span className="text-xs text-gray-600">
                          File: {event.fileName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>User: {event.userId}</span>
                      {event.ipAddress && <span>IP: {event.ipAddress}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
