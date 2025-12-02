"use client";

import { useState, useEffect } from "react";
import { pushNotificationService } from "@/lib/pushNotifications";
import { Bell, X } from "lucide-react";
import { trpc } from "@/app/_trpc/client";

export default function PushNotificationPrompt() {
  const [isSupported, setIsSupported] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

  // Check if user has push subscriptions
  const subscriptionsQuery = trpc.pushNotifications.getSubscriptions.useQuery(
    undefined,
    {
      enabled: true, // Always check subscriptions
      refetchOnWindowFocus: false,
    }
  );

  const subscriptions = subscriptionsQuery.data || [];
  const refetchSubscriptions = subscriptionsQuery.refetch || (async () => {});

  useEffect(() => {
    // Check if notifications are supported
    const checkSupport = () => {
      if (typeof window === "undefined") {
        setIsChecking(false);
        return;
      }

      const hasNotification = "Notification" in window;
      const hasServiceWorker = "serviceWorker" in navigator;
      const hasPushManager = "PushManager" in window;
      
      const supported = hasNotification && hasServiceWorker && hasPushManager;

      console.log("🔍 Push notification support check:", {
        hasNotification,
        hasServiceWorker,
        hasPushManager,
        supported,
      });

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        console.log("   Current permission:", Notification.permission);
      } else {
        console.warn("⚠️ Push notifications not supported:", {
          hasNotification,
          hasServiceWorker,
          hasPushManager,
        });
      }

      // Check if dismissed in localStorage
      const dismissed = localStorage.getItem("push-notification-dismissed");
      if (dismissed === "true") {
        setIsDismissed(true);
      }

      setIsChecking(false);
    };

    // Delay check slightly to ensure everything is loaded
    const timeoutId = setTimeout(checkSupport, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      setHasSubscription(true);
    } else {
      setHasSubscription(false);
    }
  }, [subscriptions]);

  // Debug logging
  useEffect(() => {
    console.log("🔍 PushNotificationPrompt Debug:", {
      isSupported,
      permission,
      hasSubscription,
      isDismissed,
      isSubscribed,
      subscriptionCount: subscriptions.length,
      subscriptionsQueryLoading: subscriptionsQuery.isLoading,
      subscriptionsQueryError: subscriptionsQuery.error,
      willShow: !(
        !isSupported ||
        (permission === "granted" && hasSubscription) ||
        isDismissed ||
        isSubscribed
      ),
    });
  }, [isSupported, permission, hasSubscription, isDismissed, isSubscribed, subscriptions.length, subscriptionsQuery.isLoading, subscriptionsQuery.error]);

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
      const subscription = await pushNotificationService.subscribeToPush();
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (subscription) {
        setIsSubscribed(true);
        setPermission(Notification.permission);
        setHasSubscription(true);
        await refetchSubscriptions();
        console.log("✅ Push notifications enabled successfully");
      } else {
        console.error("❌ Subscription returned null");
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
      alert(
        error.message ||
          "Failed to enable push notifications. Please check your browser settings and try again."
      );
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("push-notification-dismissed", "true");
    }
  };

  // Show loading state while checking
  if (isChecking) {
    return null;
  }

  // Don't show if:
  // - Not supported
  // - Already subscribed (permission granted and has subscription)
  // - User dismissed it
  const shouldShow = isSupported && 
    !(permission === "granted" && hasSubscription) && 
    !isDismissed && 
    !isSubscribed;

  if (!shouldShow) {
    // If user has no subscription but prompt is hidden, show a simpler version
    if (isSupported && permission === "granted" && !hasSubscription && !isDismissed) {
      // User granted permission but subscription failed - show retry option
      return (
        <div
          className="p-4 mb-4 rounded-lg border relative"
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#606364",
          }}
        >
          <div className="flex items-start gap-3 pr-6">
            <Bell className="h-5 w-5 mt-0.5" style={{ color: "#C3BCC2" }} />
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: "#C3BCC2" }}>
                Complete Push Notification Setup
              </h3>
              <p className="text-sm mb-3" style={{ color: "#ABA4AA" }}>
                You've granted permission, but we need to complete the subscription. Click below to finish setup.
              </p>
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "#4A5A70",
                  color: "#C3BCC2",
                }}
              >
                {isLoading ? "Setting up..." : "Complete Setup"}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Show prompt if permission is default or denied
  return (
    <div
      className="p-4 mb-4 rounded-lg border relative"
      style={{
        backgroundColor: "#353A3A",
        borderColor: "#606364",
      }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded hover:opacity-70 transition-opacity"
        style={{ color: "#ABA4AA" }}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <Bell className="h-5 w-5 mt-0.5" style={{ color: "#C3BCC2" }} />
        <div className="flex-1">
          <h3 className="font-semibold mb-1" style={{ color: "#C3BCC2" }}>
            Enable Push Notifications
          </h3>
          <p className="text-sm mb-3" style={{ color: "#ABA4AA" }}>
            Get notified about new messages, lesson reminders, program assignments, and important updates.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "#4A5A70",
              color: "#C3BCC2",
            }}
          >
            {isLoading ? "Setting up..." : "Enable Notifications"}
          </button>
        </div>
      </div>
    </div>
  );
}

