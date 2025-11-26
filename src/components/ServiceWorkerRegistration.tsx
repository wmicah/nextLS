"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
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
      navigator.serviceWorker.addEventListener("message", event => {
        if (event.data && event.data.type === "CACHE_UPDATED") {
          console.log("Cache updated:", event.data);
        }
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
