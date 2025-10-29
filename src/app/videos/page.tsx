"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@kinde-oss/kinde-auth-nextjs";
import { trpc } from "@/app/_trpc/client";
import VideosPage from "@/components/VideosPage";

export default function Videos() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Get user profile from database
  const { data: dbUser, isLoading: userLoading } =
    trpc.user.getProfile.useQuery(undefined, {
      enabled: !!user?.id,
    });

  useEffect(() => {
    if (!isLoaded || userLoading) return;

    if (!user?.id) {
      router.push("/auth-callback?origin=videos");
      return;
    }

    if (!dbUser) {
      router.push("/auth-callback?origin=videos");
      return;
    }

    // If user is a CLIENT, redirect them to client dashboard
    if (dbUser.role === "CLIENT") {
      router.push("/client-dashboard");
      return;
    }

    // If user has no role set, send them to role selection
    if (!dbUser.role) {
      router.push("/role-selection");
      return;
    }

    // Only allow COACH users to see videos page
    if (dbUser.role !== "COACH") {
      router.push("/auth-callback?origin=videos");
      return;
    }
  }, [user, isLoaded, dbUser, userLoading, router]);

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
