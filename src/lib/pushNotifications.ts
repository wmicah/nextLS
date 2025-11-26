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
      return null;
    }

    const permission = await this.requestPermission();
    if (!permission) {
      console.log("❌ Permission not granted for push notifications");
      return null;
    }

    try {
      // Ensure service worker is registered first
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log("📱 Registering service worker...");
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("✅ Service worker registered and ready");
      } else {
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("✅ Service worker already registered");
      }

      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log("📱 Already subscribed, updating server...");
        await this.sendSubscriptionToServer(existingSubscription);
        return existingSubscription;
      }

      // Create new subscription
      console.log("📱 Creating new push subscription...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      console.log("✅ Push subscription created:", subscription.endpoint);

      // Send subscription to your server
      await this.sendSubscriptionToServer(subscription);

      console.log("✅ Push subscription saved to server");
      return subscription;
    } catch (error: any) {
      console.error("❌ Error subscribing to push notifications:", error);
      
      // Provide more specific error messages
      if (error.name === "NotAllowedError") {
        console.error("❌ Push notification permission denied by user");
      } else if (error.name === "NotSupportedError") {
        console.error("❌ Push notifications not supported on this device/browser");
      } else if (error.message?.includes("VAPID")) {
        console.error("❌ VAPID key error - check your VAPID keys");
      } else {
        console.error("❌ Unknown error:", error.message || error);
      }
      
      return null;
    }
  }

  async sendSubscriptionToServer(
    subscription: PushSubscription
  ): Promise<void> {
    try {
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to send subscription to server"
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error sending subscription to server:", error);
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
