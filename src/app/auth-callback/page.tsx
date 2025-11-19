"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { trpc } from "@/app/_trpc/client";
import { clearUserSession, handleSessionConflict } from "@/lib/sessionUtils";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasCheckedInviteCode, setHasCheckedInviteCode] = useState(false);

  const { data, isLoading, error, refetch } = trpc.authCallback.useQuery(
    undefined,
    {
      retry: false, // Disable automatic retries to handle manually
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  const autoAssignViaInviteCode =
    trpc.user.autoAssignViaInviteCode.useMutation();

  const handleRetry = async () => {
    if (retryCount >= 2) {
      // Too many retries, handle session conflict
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
    // Check for invite code in localStorage (stored when user clicks invite link)
    if (data?.success && !hasCheckedInviteCode) {
      const pendingInviteCode =
        typeof window !== "undefined"
          ? localStorage.getItem("pendingInviteCode")
          : null;

      if (pendingInviteCode && data.needsRoleSelection) {
        // User needs role selection and has an invite code - create join request
        setHasCheckedInviteCode(true);

        autoAssignViaInviteCode.mutate(
          { inviteCode: pendingInviteCode },
          {
            onSuccess: data => {
              // Clear the invite code from localStorage
              if (typeof window !== "undefined") {
                localStorage.removeItem("pendingInviteCode");
              }
              // If approval is required, redirect to client dashboard with pending status
              if (data?.requiresApproval) {
                console.log(
                  "⏳ Client request created, waiting for coach approval..."
                );
                // Refetch to get updated user data, then redirect
                refetch();
                // The client will see a message on their dashboard that they're pending approval
              } else {
                // Refetch auth callback to get updated user data
                refetch();
              }
            },
            onError: error => {
              console.error("Failed to request via invite code:", error);
              // Clear invalid invite code
              if (typeof window !== "undefined") {
                localStorage.removeItem("pendingInviteCode");
              }
              // Proceed to role selection if request fails
              router.push("/role-selection");
            },
          }
        );
        return;
      } else if (pendingInviteCode) {
        // User already has a role, clear the invite code
        if (typeof window !== "undefined") {
          localStorage.removeItem("pendingInviteCode");
        }
      }
    }

    // Get origin parameter from URL to redirect back to original page
    const origin = searchParams.get("origin");
    console.log("🔄 Auth callback: origin parameter =", origin);

    // Valid coach routes that can be redirected to (with and without leading slash)
    const validCoachRoutes = [
      "/dashboard",
      "/clients",
      "/programs",
      "/schedule",
      "/messages",
      "/library",
      "/videos",
      "/notifications",
      "/settings",
      "/analytics",
      "/organization",
      "dashboard",
      "clients",
      "programs",
      "schedule",
      "messages",
      "library",
      "videos",
      "notifications",
      "settings",
      "analytics",
      "organization",
    ];

    // Helper function to get redirect destination
    const getRedirectDestination = (userRole: string | null | undefined) => {
      // Normalize origin (ensure it starts with /)
      const normalizedOrigin = origin?.startsWith("/") ? origin : `/${origin}`;

      if (origin && validCoachRoutes.includes(origin)) {
        // If origin is a valid coach route and user is COACH, redirect there
        if (userRole === "COACH") {
          console.log(
            "🔄 Auth callback: Redirecting to origin:",
            normalizedOrigin
          );
          return normalizedOrigin;
        }
      }
      // Default redirects based on role
      if (userRole === "COACH") {
        console.log(
          "🔄 Auth callback: No valid origin, defaulting to /dashboard"
        );
        return "/dashboard";
      } else if (userRole === "CLIENT") {
        return "/client-dashboard";
      }
      return "/role-selection";
    };

    if (
      data?.success &&
      hasCheckedInviteCode &&
      !autoAssignViaInviteCode.isPending
    ) {
      // After auto-assignment, check if user now has a role
      const userRole = data.user?.role;
      console.log("🔍 After auto-assignment, user role is:", userRole);

      if (userRole === "CLIENT") {
        console.log(
          "✅ Client auto-assigned via invite code, redirecting to client dashboard"
        );
        router.push("/client-dashboard");
        return;
      } else if (userRole === "COACH") {
        const destination = getRedirectDestination(userRole);
        console.log("➡️ Going to COACH destination:", destination);
        router.push(destination);
        return;
      }
      // If still no role, fall through to role selection
    }

    if (
      data?.success &&
      !autoAssignViaInviteCode.isPending &&
      !hasCheckedInviteCode
    ) {
      console.log("🔍 Auth callback data:", data);
      if ("role" in (data.user || {})) {
        console.log("🔍 User role:", data.user.role);
      } else {
      }

      if (data.needsRoleSelection) {
        console.log("➡️ Going to role selection");
        router.push("/role-selection");
      } else {
        // ✅ Check the specific role value
        const userRole = data.user?.role;
        console.log("➡️ User role is:", userRole);

        if (userRole === "COACH") {
          const destination = getRedirectDestination(userRole);
          console.log("➡️ Going to COACH destination:", destination);
          router.push(destination);
        } else if (userRole === "CLIENT") {
          router.push("/client-dashboard");
        } else {
          router.push("/role-selection");
        }
      }
    }

    if (error && !autoAssignViaInviteCode.isPending) {
      console.error("Auth callback error:", error);

      // Check if this might be a session conflict
      if (
        error.message?.includes("UNAUTHORIZED") ||
        error.message?.includes("session")
      ) {
        handleRetry();
      } else {
        router.push("/auth-error");
      }
    }
  }, [
    data,
    error,
    router,
    retryCount,
    hasCheckedInviteCode,
    autoAssignViaInviteCode,
    refetch,
    searchParams,
  ]);

  if (isLoading || isRetrying || autoAssignViaInviteCode.isPending) {
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

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
