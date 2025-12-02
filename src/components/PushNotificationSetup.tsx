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

  const checkSubscriptionStatus = async () => {
    if (
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setIsSubscribed(false);
      }
    }
  };

  useEffect(() => {
    // Check if notifications are supported
    if (
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported) return;

    setIsLoading(true);
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Add a safety timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      setIsLoading(false);
      alert("Subscription is taking too long. Please check your browser console for errors and try again.");
      console.error("❌ Subscription timeout - taking too long");
      console.error("   This usually means:");
      console.error("   1. Service worker is stuck installing");
      console.error("   2. VAPID key is invalid");
      console.error("   3. Network issue preventing subscription");
      console.error("   Try: Refresh the page and try again");
    }, 30000); // 30 second max
    
    try {
      console.log("🚀 Starting push notification subscription...");
      
      // Request permission first if needed
      if (Notification.permission === "default") {
        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
        if (newPermission !== "granted") {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          alert("Push notifications require browser permission. Please enable notifications in your browser settings.");
          setIsLoading(false);
          return;
        }
      }
      
      const subscription = await pushNotificationService.subscribeToPush();
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (subscription) {
        setIsSubscribed(true);
        setPermission(Notification.permission);
        await checkSubscriptionStatus();
        console.log("✅ Push notifications enabled successfully");
        // Show success message
        alert("Push notifications enabled successfully!");
      } else {
        console.error("❌ Subscription returned null");
        setIsSubscribed(false);
        alert("Failed to enable push notifications. Please try again.");
      }
    } catch (error: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      console.error("❌ Error subscribing to push notifications:", error);
      console.error("   Full error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      setIsSubscribed(false);
      setPermission(Notification.permission);
      alert(
        error.message ||
          "Failed to enable push notifications. Please check your browser settings."
      );
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsLoading(false);
    }
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

        {(permission !== "granted" || !isSubscribed) && (
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
            style={{
              backgroundColor: isLoading ? "#2A3133" : "#4A5A70",
              color: "#C3BCC2",
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Setting up..." : isSubscribed ? "Re-enable" : "Enable"}
          </button>
        )}
      </div>

      {permission === "granted" && isSubscribed && (
        <div className="mt-4">
          <button
            onClick={async () => {
              try {
                console.log("🧪 Testing push notification...");
                const response = await fetch("/api/push/test", {
                  method: "POST",
                });
                const result = await response.json();
                if (result.testNotificationSent) {
                  alert("✅ Test notification sent! Check your device for the notification.");
                } else {
                  alert(`⚠️ Test notification failed: ${result.message || "Check console for details"}`);
                }
                console.log("Test result:", result);
              } catch (error) {
                console.error("Error testing notification:", error);
                alert("Failed to send test notification. Check console for details.");
              }
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: "#E5B232",
              color: "#2A3133",
            }}
          >
            Test Notification
          </button>
        </div>
      )}
    </div>
  );
}
