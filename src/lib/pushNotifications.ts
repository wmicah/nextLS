"use client";

export class PushNotificationService {
  private vapidPublicKey: string;

  constructor() {
    // VAPID public key - should be set in environment variables
    this.vapidPublicKey =
      process.env.NEXT_PUBLIC_VAPID_KEY ||
      "BJmY1hCwoFMlFc67g3k8ehL0RAyf72sPxkVjNzMn8OPk-nv9BwR1xF8hLQwWvkj-mPFtNCPoySRFRitF80l3j44";
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("❌ Push messaging is not supported");
      throw new Error("Push messaging is not supported in this browser");
    }

    const permission = await this.requestPermission();
    if (!permission) {
      console.log("❌ Permission not granted for push notifications");
      throw new Error("Notification permission was denied");
    }

    try {
      // Ensure service worker is registered first
      console.log("📱 Checking service worker registration...");
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log("📱 Registering service worker...");
        registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        console.log("✅ Service worker registered, waiting for it to be ready...");
      } else {
        console.log("✅ Service worker already registered");
      }

      // Wait for service worker to be ready (no timeout - this should be fast)
      console.log("📱 Waiting for service worker to be ready...");
      await navigator.serviceWorker.ready;
      console.log("✅ Service worker is ready");

      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log("📱 Already subscribed, updating server...");
        try {
          await this.sendSubscriptionToServer(existingSubscription);
          console.log("✅ Subscription updated on server");
        } catch (error) {
          console.error("⚠️ Failed to update server, but subscription exists:", error);
          // Don't fail if server update fails - subscription still works
        }
        return existingSubscription;
      }

      // Create new subscription (no timeout - let it take as long as needed)
      console.log("📱 Creating new push subscription...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      console.log("✅ Push subscription created:", subscription.endpoint.substring(0, 50) + "...");

      // Send subscription to your server
      console.log("📱 Saving subscription to server...");
      try {
        await this.sendSubscriptionToServer(subscription);
        console.log("✅ Push subscription saved to server");
      } catch (error: any) {
        console.error("❌ Failed to save subscription to server:", error);
        // Don't throw - subscription was created successfully, server save can be retried
        console.warn("⚠️ Subscription created but server save failed. Notification may not work until server is updated.");
        // Still return the subscription - it's valid even if server save failed
      }

      return subscription;
    } catch (error: any) {
      console.error("❌ Error subscribing to push notifications:", error);
      
      // Provide more specific error messages
      if (error.name === "NotAllowedError") {
        throw new Error("Push notification permission denied. Please allow notifications in your browser settings.");
      } else if (error.name === "NotSupportedError") {
        throw new Error("Push notifications are not supported on this device or browser.");
      } else if (error.message?.includes("VAPID")) {
        throw new Error("VAPID key error. Please contact support.");
      } else if (error.message?.includes("timeout")) {
        throw new Error("Subscription timed out. This might be a network issue. Please try again.");
      } else {
        throw new Error(error.message || "Failed to enable push notifications. Please try again.");
      }
    }
  }

  async sendSubscriptionToServer(
    subscription: PushSubscription
  ): Promise<void> {
    try {
      console.log("📤 Sending subscription to server...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Server error: ${response.status}`;
        console.error("❌ Server error:", errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ Subscription saved to server:", result);
      return result;
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.error("❌ Request timeout - server took too long to respond");
        throw new Error("Request timed out. Please check your internet connection and try again.");
      }
      console.error("❌ Error sending subscription to server:", error);
      throw error;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async showLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-32x32.png",
        ...options,
      });
    }
  }
}

export const pushNotificationService = new PushNotificationService();
