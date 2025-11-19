"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Shield, CheckCircle, XCircle } from "lucide-react";

interface SecurityEvent {
  id: string;
  type:
    | "upload_blocked"
    | "rate_limit"
    | "suspicious_file"
    | "validation_failed";
  message: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  userId?: string;
  fileName?: string;
}

export default function SecurityMonitor() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for security events (in a real app, this would be from a WebSocket or API)
    const handleSecurityEvent = (event: CustomEvent) => {
      const securityEvent: SecurityEvent = {
        id: Date.now().toString(),
        type: event.detail.type,
        message: event.detail.message,
        timestamp: new Date().toISOString(),
        severity: event.detail.severity || "medium",
        userId: event.detail.userId,
        fileName: event.detail.fileName,
      };

      setEvents(prev => [securityEvent, ...prev.slice(0, 49)]); // Keep last 50 events
    };

    window.addEventListener(
      "security-event",
      handleSecurityEvent as EventListener
    );

    return () => {
      window.removeEventListener(
        "security-event",
        handleSecurityEvent as EventListener
      );
    };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-500";
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

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors"
        title="Security Monitor"
      >
        <Shield className="h-5 w-5" />
        {events.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
            {events.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg w-96 max-h-96 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-gray-900">Security Monitor</h3>
          {events.length > 0 && (
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
              {events.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Shield className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No security events</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map(event => (
              <div key={event.id} className="p-3 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(event.severity)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {event.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs ${getSeverityColor(
                          event.severity
                        )}`}
                      >
                        {event.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {event.fileName && (
                      <p className="text-xs text-gray-600 mt-1">
                        File: {event.fileName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {events.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setEvents([])}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            Clear all events
          </button>
        </div>
      )}
    </div>
  );
}
