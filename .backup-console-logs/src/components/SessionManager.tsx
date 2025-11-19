"use client";

import { useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";
import { clearUserSession } from "@/lib/sessionUtils";

export default function SessionManager() {
  const { isAuthenticated, user, isLoading } = useKindeBrowserClient();
  const router = useRouter();

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const handleSessionCheck = () => {
      // Check for multiple authentication states
      const hasMultipleSessions =
        localStorage.getItem("kinde_multiple_sessions") === "true";

      if (hasMultipleSessions && isAuthenticated) {
        console.log("🔄 Multiple sessions detected, clearing...");
        clearUserSession();
        localStorage.removeItem("kinde_multiple_sessions");
        router.refresh();
      }
    };

    // Check for session conflicts when auth state changes
    if (!isLoading) {
      handleSessionCheck();
    }

    // Listen for storage changes (when another tab logs in/out)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes("kinde") || e.key?.includes("session")) {
        console.log("🔄 Session change detected in another tab");
        setTimeout(() => {
          router.refresh();
        }, 500);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isAuthenticated, user, isLoading, router]);

  // This component doesn't render anything
  return null;
}






