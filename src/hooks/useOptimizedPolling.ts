"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { useSmartPolling } from "./useSmartPolling";

// Optimized notification polling
export function useOptimizedNotifications() {
  const { interval, isActive, handleError, handleSuccess } = useSmartPolling({
    baseInterval: 60000, // 1 minute
    maxInterval: 300000, // 5 minutes max
    pauseWhenInactive: true,
    resetOnActivity: true,
  });

  const { data: unreadCount = 0, error } =
    trpc.notifications.getUnreadCount.useQuery(undefined, {
      refetchInterval: false, // NO POLLING - will add WebSocket support later
      refetchOnWindowFocus: true, // Only refetch when user returns to tab
      refetchOnReconnect: true,
      enabled: isActive,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

  const { data: notifications = [] } =
    trpc.notifications.getNotifications.useQuery(
      { limit: 5, unreadOnly: false },
      {
        refetchInterval: false, // NO POLLING - will add WebSocket support later
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        enabled: isActive,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      }
    );

  return {
    unreadCount,
    notifications,
    isActive,
    error,
  };
}

// Optimized messaging polling
export function useOptimizedMessaging() {
  const { interval, isActive, handleError, handleSuccess } = useSmartPolling({
    baseInterval: 30000, // 30 seconds
    maxInterval: 180000, // 3 minutes max
    pauseWhenInactive: true,
    resetOnActivity: true,
  });

  const { data: unreadCount = 0, error } =
    trpc.messaging.getUnreadCount.useQuery(undefined, {
      refetchInterval: interval,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      enabled: isActive,
    });

  const { data: conversationCounts = [] } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      refetchInterval: interval * 2, // Poll less frequently for conversation counts
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      enabled: isActive,
      staleTime: 15000, // Cache for 15 seconds
      gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    });

  return {
    unreadCount,
    conversationCounts,
    isActive,
    error,
  };
}

// Connection status hook
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
