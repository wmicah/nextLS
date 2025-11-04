"use client";

import { useEffect, useState } from "react";

interface PWAProviderProps {
  children: React.ReactNode;
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(registration => {
          console.log("SW registered: ", registration);
        })
        .catch(registrationError => {
          console.log("SW registration failed: ", registrationError);
        });
    }

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Handle PWA install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show prompt if not already installed
      if (!window.matchMedia("(display-mode: standalone)").matches) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("PWA is installed");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  return (
    <>
      {children}

      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 z-50 animate-in slide-in-from-top">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            <span className="text-sm font-medium">
              You're offline. Some features may be limited.
            </span>
          </div>
        </div>
      )}

      {/* Install prompt for Android/Chrome */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Install NextLevel Coaching</h3>
              <p className="text-sm opacity-90">Get the full app experience</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-white text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-white opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Close install prompt"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Instructions */}
      {typeof window !== "undefined" &&
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !window.matchMedia("(display-mode: standalone)").matches && (
          <div className="ios-install-prompt fixed bottom-4 left-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 border border-gray-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  Install NextLevel Coaching
                </h3>
                <p className="text-sm opacity-90 mb-2">
                  Tap the Share button <span className="inline-block">□↗</span>{" "}
                  then select "Add to Home Screen"
                </p>
                <div className="text-xs opacity-75">
                  Tap <span className="font-mono">•••</span> → Share → Add to
                  Home Screen
                </div>
              </div>
              <button
                onClick={() => {
                  const prompt = document.querySelector(
                    ".ios-install-prompt"
                  ) as HTMLElement;
                  if (prompt) prompt.style.display = "none";
                }}
                className="text-white opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
                aria-label="Close iOS install instructions"
              >
                ✕
              </button>
            </div>
          </div>
        )}
    </>
  );
}
