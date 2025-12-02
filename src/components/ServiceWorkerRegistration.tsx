"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ServiceWorkerRegistration() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker (works in both dev and production)
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .then(registration => {
          console.log("✅ Service Worker registered successfully:", registration.scope);

          // Wait for service worker to be ready
          navigator.serviceWorker.ready.then(() => {
            console.log("✅ Service Worker is ready");
          });

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New content is available, prompt user to refresh
                  if (confirm("New version available! Refresh to update?")) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch(error => {
          console.error("❌ Service Worker registration failed:", error);
        });

      // Listen for service worker messages
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "CACHE_UPDATED") {
          console.log("Cache updated:", event.data);
        }
        
        // Handle navigation messages from service worker (notification clicks)
        if (event.data && event.data.type === "NAVIGATE" && event.data.url) {
          console.log("📱 Service worker requested navigation to:", event.data.url);
          try {
            // Parse the URL to get pathname and search params
            const url = new URL(event.data.url, window.location.origin);
            const path = url.pathname + url.search;
            
            // Use Next.js router for client-side navigation
            router.push(path);
          } catch (error) {
            console.error("❌ Error parsing navigation URL:", error);
            // Fallback to direct navigation
            window.location.href = event.data.url;
          }
        }
      };

      navigator.serviceWorker.addEventListener("message", handleMessage);

      // Cleanup
      return () => {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      };
    }
    // Return undefined if condition is false (no cleanup needed)
    return undefined;
  }, [router]);

  return null; // This component doesn't render anything
}
