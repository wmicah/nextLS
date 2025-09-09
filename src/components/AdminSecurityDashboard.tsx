"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Shield,
  AlertTriangle,
  Eye,
  Clock,
  User,
  Activity,
} from "lucide-react";

interface AdminAuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export default function AdminSecurityDashboard() {
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get admin audit logs
  const { data: logs, refetch } = trpc.admin.getAuditLogs?.useQuery() || {
    data: [],
  };

  useEffect(() => {
    if (logs) {
      setAuditLogs(logs);
      setIsLoading(false);
    }
  }, [logs]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    if (action.includes("unauthorized"))
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (action.includes("viewed"))
      return <Eye className="w-4 h-4 text-blue-500" />;
    if (action.includes("added") || action.includes("created"))
      return <User className="w-4 h-4 text-green-500" />;
    if (action.includes("deleted") || action.includes("removed"))
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("unauthorized")) return "bg-red-50 border-red-200";
    if (action.includes("deleted") || action.includes("removed"))
      return "bg-red-50 border-red-200";
    if (action.includes("added") || action.includes("created"))
      return "bg-green-50 border-green-200";
    if (action.includes("viewed")) return "bg-blue-50 border-blue-200";
    return "bg-gray-50 border-gray-200";
  };

  if (isLoading) {
    return (
      <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-white">
            Security Dashboard
          </h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-white">
            Security Dashboard
          </h2>
        </div>
        <button
          onClick={() => refetch?.()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#2A3133] rounded-lg p-4 border border-[#4A5A70]">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-400">Total Actions</span>
          </div>
          <p className="text-2xl font-bold text-white">{auditLogs.length}</p>
        </div>

        <div className="bg-[#2A3133] rounded-lg p-4 border border-[#4A5A70]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-400">Security Events</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {
              auditLogs.filter(log => log.action.includes("unauthorized"))
                .length
            }
          </p>
        </div>

        <div className="bg-[#2A3133] rounded-lg p-4 border border-[#4A5A70]">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-400">Last 24h</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {
              auditLogs.filter(log => {
                const logTime = new Date(log.timestamp);
                const now = new Date();
                const diffHours =
                  (now.getTime() - logTime.getTime()) / (1000 * 60 * 60);
                return diffHours <= 24;
              }).length
            }
          </p>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white mb-4">
          Recent Admin Actions
        </h3>

        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No admin actions recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {auditLogs.slice(0, 20).map(log => (
              <div
                key={log.id}
                className={`p-4 rounded-lg border ${getActionColor(
                  log.action
                )}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getActionIcon(log.action)}
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {log.user.name || "Unknown User"} ({log.user.email})
                      </p>
                      {log.details && (
                        <p className="text-xs text-gray-500 mt-1">
                          {JSON.parse(log.details).resourceId && (
                            <span>
                              Resource ID: {JSON.parse(log.details).resourceId}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
