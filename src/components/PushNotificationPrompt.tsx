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
      const supported =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
      }

      // Check if dismissed in localStorage
      if (typeof window !== "undefined") {
        const dismissed = localStorage.getItem("push-notification-dismissed");
        if (dismissed === "true") {
          setIsDismissed(true);
        }
      }

      setIsChecking(false);
    };

    checkSupport();
  }, []);

  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      setHasSubscription(true);
    } else {
      setHasSubscription(false);
    }
  }, [subscriptions]);

  const handleSubscribe = async () => {
    if (!isSupported) return;

    setIsLoading(true);
    try {
      const subscription = await pushNotificationService.subscribeToPush();
      if (subscription) {
        setIsSubscribed(true);
        setPermission(Notification.permission);
        setHasSubscription(true);
        await refetchSubscriptions();
      }
    } catch (error: any) {
      // Error handled - user can retry if needed
    } finally {
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
  if (
    !isSupported ||
    (permission === "granted" && hasSubscription) ||
    isDismissed ||
    isSubscribed
  ) {
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

