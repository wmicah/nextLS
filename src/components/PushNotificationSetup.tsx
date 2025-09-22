"use client";

import { useState, useEffect } from "react";
import { pushNotificationService } from "@/lib/pushNotifications";
import { Bell, BellOff, CheckCircle, AlertCircle } from "lucide-react";

export default function PushNotificationSetup() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if (
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported) return;

    setIsLoading(true);
    try {
      const subscription = await pushNotificationService.subscribeToPush();
      if (subscription) {
        setIsSubscribed(true);
        setPermission("granted");
      }
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    await pushNotificationService.showLocalNotification("Test Notification", {
      body: "This is a test notification from Next Level Softball",
      icon: "/icon-192x192.png",
      badge: "/icon-32x32.png",
    });
  };

  if (!isSupported) {
    return (
      <div
        className="flex items-center gap-2 p-3 rounded-lg"
        style={{ backgroundColor: "#353A3A", color: "#ABA4AA" }}
      >
        <AlertCircle className="h-5 w-5 text-yellow-400" />
        <span className="text-sm">
          Push notifications are not supported in this browser
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="flex items-center justify-between p-4 rounded-lg"
        style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
      >
        <div className="flex items-center gap-3">
          {permission === "granted" ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : (
            <Bell className="h-5 w-5" style={{ color: "#C3BCC2" }} />
          )}
          <div>
            <h3 className="font-semibold" style={{ color: "#C3BCC2" }}>
              Push Notifications
            </h3>
            <p className="text-sm" style={{ color: "#ABA4AA" }}>
              {permission === "granted"
                ? "You'll receive notifications for new messages, lesson reminders, and updates"
                : "Get notified about new messages, lesson reminders, and important updates"}
            </p>
          </div>
        </div>

        {permission !== "granted" && (
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: "#4A5A70",
              color: "#C3BCC2",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Setting up..." : "Enable"}
          </button>
        )}
      </div>

      {permission === "granted" && (
        <div className="flex gap-2">
          <button
            onClick={handleTestNotification}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
          >
            Test Notification
          </button>
        </div>
      )}
    </div>
  );
}
