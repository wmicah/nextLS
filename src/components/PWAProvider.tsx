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

    // Handle PWA install prompt - DISABLED
    // const handleBeforeInstallPrompt = (e: any) => {
    //   e.preventDefault();
    //   setDeferredPrompt(e);
    //   setShowInstallPrompt(true);
    // };

    // window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      // window.removeEventListener(
      //   "beforeinstallprompt",
      //   handleBeforeInstallPrompt
      // );
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
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 z-50">
          You're offline. Some features may be limited.
        </div>
      )}

      {/* Install prompt - DISABLED */}
      {/* {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Install Next Level Softball</h3>
              <p className="text-sm opacity-90">Get the full app experience</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-white text-blue-600 px-4 py-2 rounded text-sm font-medium"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-white opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}

