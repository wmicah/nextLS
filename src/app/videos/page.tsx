"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { trpc } from "@/app/_trpc/client";
import VideosPage from "@/components/VideosPage";

export default function Videos() {
  const {
    user,
    isAuthenticated,
    isLoading: isLoaded,
  } = useKindeBrowserClient();
  const router = useRouter();

  // Get user profile from database
  const { data: dbUser, isLoading: userLoading } =
    trpc.user.getProfile.useQuery(undefined, {
      enabled: !!user?.id,
    });

  useEffect(() => {
    // Don't do anything while still loading
    if (!isLoaded || userLoading) {
      console.log("📹 Videos page: Still loading auth data...");
      return;
    }

    console.log("📹 Videos page: Auth check", {
      isAuthenticated,
      hasUser: !!user?.id,
      hasDbUser: !!dbUser,
      userRole: dbUser?.role,
    });

    // Check authentication
    if (!isAuthenticated || !user?.id) {
      console.log(
        "📹 Videos page: Not authenticated, redirecting to auth-callback"
      );
      router.push("/auth-callback?origin=/videos");
      return;
    }

    // Check if dbUser exists
    if (!dbUser) {
      console.log(
        "📹 Videos page: No dbUser found, redirecting to auth-callback"
      );
      router.push("/auth-callback?origin=/videos");
      return;
    }

    // If user is a CLIENT, redirect them to client dashboard
    if (dbUser.role === "CLIENT") {
      console.log(
        "📹 Videos page: User is CLIENT, redirecting to client dashboard"
      );
      router.push("/client-dashboard");
      return;
    }

    // If user has no role set, send them to role selection
    if (!dbUser.role) {
      console.log("📹 Videos page: No role set, redirecting to role selection");
      router.push("/role-selection");
      return;
    }

    // Only allow COACH users to see videos page
    if (dbUser.role !== "COACH") {
      console.log(
        "📹 Videos page: User role is not COACH, redirecting to auth-callback"
      );
      router.push("/auth-callback?origin=/videos");
      return;
    }

    console.log("📹 Videos page: User is COACH, allowing access");
  }, [user, isLoaded, dbUser, userLoading, router, isAuthenticated]);

  // Show loading while checking authentication
  if (!isLoaded || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="rounded-full h-8 w-8 border-b-2 border-blue-500 animate-spin"></div>
      </div>
    );
  }

  // Don't render VideosPage until auth is confirmed
  if (!user?.id || !dbUser || dbUser.role !== "COACH") {
    return null;
  }

  return <VideosPage />;
}
