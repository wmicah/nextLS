"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { clearUserSession, handleSessionConflict } from "@/lib/sessionUtils";

export default function AuthCallback() {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const { data, isLoading, error, refetch } = trpc.authCallback.useQuery(
    undefined,
    {
      retry: false, // Disable automatic retries to handle manually
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  const handleRetry = async () => {
    if (retryCount >= 2) {
      // Too many retries, handle session conflict
      console.log("🔄 Too many retries, handling session conflict");
      await handleSessionConflict();
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    // Clear session data and retry
    await clearUserSession();

    // Wait a bit before retrying
    setTimeout(async () => {
      try {
        await refetch();
      } catch (err) {
        console.error("Retry failed:", err);
      } finally {
        setIsRetrying(false);
      }
    }, 1000);
  };

  useEffect(() => {
    if (data?.success) {
      console.log("🔍 Auth callback data:", data); // Add debug
      if ("role" in (data.user || {})) {
        console.log("🔍 User role:", data.user.role); // Add debug
      } else {
        console.log("🔍 User role is not defined");
      }

      if (data.needsRoleSelection) {
        console.log("➡️ Going to role selection");
        router.push("/role-selection");
      } else {
        // ✅ Check the specific role value
        const userRole = data.user?.role;
        console.log("➡️ User role is:", userRole);

        if (userRole === "COACH") {
          console.log("➡️ Going to COACH dashboard");
          router.push("/dashboard");
        } else if (userRole === "CLIENT") {
          console.log("➡️ Going to CLIENT dashboard");
          router.push("/client-dashboard");
        } else {
          console.log("➡️ Unknown role, going to role selection");
          router.push("/role-selection");
        }
      }
    }

    if (error) {
      console.error("Auth callback error:", error);

      // Check if this might be a session conflict
      if (
        error.message?.includes("UNAUTHORIZED") ||
        error.message?.includes("session")
      ) {
        console.log("🔄 Potential session conflict detected");
        handleRetry();
      } else {
        router.push("/auth-error");
      }
    }
  }, [data, error, router, retryCount]);

  if (isLoading || isRetrying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">
            {isRetrying
              ? "Resolving session conflict..."
              : "Setting up your account..."}
          </h2>
          <p className="text-gray-600 mt-2">
            {isRetrying
              ? "Please wait while we clear any conflicting sessions."
              : "Please wait while we get everything ready."}
          </p>
          {isRetrying && (
            <p className="text-sm text-gray-500 mt-2">
              Attempt {retryCount + 1} of 3
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error && retryCount >= 2) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Session Conflict Detected
          </h2>
          <p className="text-gray-600 mb-4">
            Multiple accounts are causing a conflict. Please sign out completely
            and try again.
          </p>
          <button
            onClick={() => handleSessionConflict()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign Out & Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">
          Completing sign in...
        </h2>
      </div>
    </div>
  );
}
