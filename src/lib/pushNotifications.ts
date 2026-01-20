"use client";

export class PushNotificationService {
  private vapidPublicKey: string | undefined;

  constructor() {
    // VAPID public key - MUST be set in environment variables
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
    
    if (!this.vapidPublicKey) {
      console.warn("⚠️ NEXT_PUBLIC_VAPID_KEY not configured. Push notifications will not work.");
    }
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
    // Check if VAPID key is configured
    if (!this.vapidPublicKey) {
      console.error("❌ VAPID public key not configured");
      throw new Error("Push notifications are not configured. Please contact support.");
    }

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
        try {
          // Add timeout for registration (5 seconds)
          const registerPromise = navigator.serviceWorker.register("/sw.js", { scope: "/" });
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Service worker registration timeout")), 5000);
          });
          
          registration = await Promise.race([registerPromise, timeoutPromise]);
          console.log("✅ Service worker registered, waiting for it to be ready...");
        } catch (swError: any) {
          console.error("❌ Failed to register service worker:", swError);
          if (swError.message?.includes("timeout")) {
            throw new Error("Service worker registration timed out. Please refresh the page and try again.");
          }
          throw new Error(`Service worker registration failed: ${swError.message || "Unknown error"}`);
        }
      } else {
        console.log("✅ Service worker already registered");
        console.log("   Service worker state:", registration.active?.state || registration.installing?.state || registration.waiting?.state || "unknown");
      }

      // Check service worker state and handle accordingly
      console.log("📱 Checking service worker state...");
      
      // Ensure registration exists
      if (!registration) {
        throw new Error("Service worker registration failed");
      }
      
      // If service worker is already active, we can proceed immediately
      if (registration.active && registration.active.state === "activated") {
        console.log("✅ Service worker is already active and activated");
        // Re-fetch registration to ensure we have the latest
        const latestRegistration = await navigator.serviceWorker.getRegistration();
        if (latestRegistration) {
          registration = latestRegistration;
        }
      } else {
        // Check what state it's in
        if (registration.installing) {
          console.log("   Service worker is installing...");
          console.log("   Waiting for installation to complete...");
        } else if (registration.waiting) {
          console.log("   Service worker is waiting (needs activation)...");
          // Try to skip waiting by activating it
          if (registration.waiting) {
            console.log("   Attempting to activate waiting service worker...");
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        } else if (registration.active) {
          console.log("   Service worker is active but may not be ready");
        }
        
        // Wait for service worker to be ready (with shorter timeout)
        console.log("📱 Waiting for service worker to be ready...");
        try {
          // Use a shorter timeout (5 seconds) since we already checked states
          const readyPromise = navigator.serviceWorker.ready;
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Service worker ready timeout")), 5000);
          });
          
          await Promise.race([readyPromise, timeoutPromise]);
          console.log("✅ Service worker is ready");
        } catch (readyError: any) {
          console.error("❌ Service worker not ready:", readyError);
          
          // If we have an active service worker, try to use it anyway
          if (registration.active) {
            console.log("⚠️ Service worker ready timed out, but active worker exists. Attempting to proceed...");
            // Check if we can get the push manager from the active worker
            try {
              const testSubscription = await registration.pushManager.getSubscription();
              console.log("✅ Can access push manager, proceeding with active worker");
              // Continue with the active worker
            } catch (pmError: any) {
              console.error("❌ Cannot access push manager:", pmError);
              throw new Error("Service worker is not ready and push manager is not accessible. Please refresh the page and try again.");
            }
          } else {
            if (readyError.message?.includes("timeout")) {
              throw new Error("Service worker took too long to become ready. Please refresh the page and try again.");
            }
            throw new Error(`Service worker not ready: ${readyError.message || "Unknown error"}`);
          }
        }
      }

      // Check if already subscribed
      if (!registration) {
        throw new Error("Service worker registration is not available");
      }
      
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

      // Validate VAPID key before attempting subscription
      console.log("📱 Validating VAPID key...");
      console.log("   VAPID key length:", this.vapidPublicKey.length);
      console.log("   VAPID key preview:", this.vapidPublicKey.substring(0, 20) + "...");
      
      let applicationServerKey: Uint8Array;
      try {
        applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
        console.log("✅ VAPID key converted successfully");
        console.log("   Key array length:", applicationServerKey.length);
      } catch (vapidError: any) {
        console.error("❌ Failed to convert VAPID key:", vapidError);
        throw new Error(`Invalid VAPID key format: ${vapidError.message || "Key conversion failed"}`);
      }

      // Create new subscription (with timeout)
      console.log("📱 Creating new push subscription...");
      let subscription: PushSubscription;
      try {
        // Add timeout for subscription creation (15 seconds max)
        const subscribePromise = registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey,
        });
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Subscription creation timeout")), 15000);
        });
        
        subscription = await Promise.race([subscribePromise, timeoutPromise]);
        console.log("✅ Push subscription created:", subscription.endpoint.substring(0, 50) + "...");
      } catch (subscribeError: any) {
        console.error("❌ Failed to create push subscription:", subscribeError);
        console.error("   Error name:", subscribeError.name);
        console.error("   Error message:", subscribeError.message);
        console.error("   Full error:", subscribeError);
        
        // Provide more specific error messages
        if (subscribeError.name === "NotAllowedError") {
          throw new Error("Push notification permission denied. Please allow notifications in your browser settings.");
        } else if (subscribeError.name === "NotSupportedError") {
          throw new Error("Push notifications are not supported on this device or browser.");
        } else if (subscribeError.message?.includes("VAPID") || subscribeError.message?.includes("key")) {
          throw new Error(`VAPID key error: ${subscribeError.message}. Please verify VAPID keys are configured correctly.`);
        } else {
          throw new Error(`Failed to create subscription: ${subscribeError.message || "Unknown error"}`);
        }
      }

      // Send subscription to your server
      console.log("📱 Saving subscription to server...");
      try {
        await this.sendSubscriptionToServer(subscription);
        console.log("✅ Push subscription saved to server");
      } catch (error: any) {
        console.error("❌ Failed to save subscription to server:", error);
        console.error("   Error details:", {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
        });
        // Don't throw - subscription was created successfully, server save can be retried
        console.warn("⚠️ Subscription created but server save failed. Notification may not work until server is updated.");
        // Still return the subscription - it's valid even if server save failed
      }

      return subscription;
    } catch (error: any) {
      console.error("❌ Error subscribing to push notifications:", error);
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
      
      // Provide more specific error messages
      if (error.name === "NotAllowedError") {
        throw new Error("Push notification permission denied. Please allow notifications in your browser settings.");
      } else if (error.name === "NotSupportedError") {
        throw new Error("Push notifications are not supported on this device or browser.");
      } else if (error.message?.includes("VAPID") || error.message?.includes("key")) {
        throw new Error(`VAPID key error: ${error.message}. Please verify VAPID keys are configured correctly.`);
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
      console.log("   Endpoint:", subscription.endpoint.substring(0, 80) + "...");
      
      // Convert subscription to JSON format
      // The subscription object has getKey() method that returns ArrayBuffer
      let p256dhKey: ArrayBuffer | null = null;
      let authKey: ArrayBuffer | null = null;
      
      try {
        // getKey() is synchronous and returns ArrayBuffer
        if (typeof subscription.getKey === "function") {
          p256dhKey = subscription.getKey("p256dh");
          authKey = subscription.getKey("auth");
          console.log("   Keys extracted successfully");
        } else {
          // Fallback: try to access keys directly (some browsers expose them differently)
          console.warn("⚠️ getKey() method not available, trying alternative method");
          // This shouldn't happen, but if it does, we need to handle it
          throw new Error("Subscription.getKey() method not available");
        }
      } catch (keyError: any) {
        console.error("❌ Failed to extract subscription keys:", keyError);
        throw new Error(`Failed to extract subscription keys: ${keyError.message || "Unknown error"}`);
      }
      
      if (!p256dhKey || !authKey) {
        throw new Error("Subscription keys are missing");
      }
      
      const subscriptionJson = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(p256dhKey),
          auth: this.arrayBufferToBase64(authKey),
        },
      };
      
      console.log("   Subscription keys present:", {
        p256dh: !!subscriptionJson.keys.p256dh && subscriptionJson.keys.p256dh.length > 0,
        auth: !!subscriptionJson.keys.auth && subscriptionJson.keys.auth.length > 0,
        p256dhLength: subscriptionJson.keys.p256dh.length,
        authLength: subscriptionJson.keys.auth.length,
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscriptionJson),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Server error: ${response.status}`;
        console.error("❌ Server error:", errorMessage);
        console.error("   Response status:", response.status);
        console.error("   Response statusText:", response.statusText);
        console.error("   Error data:", errorData);
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
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
      throw error;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) {
      throw new Error("ArrayBuffer is null");
    }
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
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
