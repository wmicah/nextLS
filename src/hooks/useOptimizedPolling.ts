"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { useVisibilityAwareInterval } from "./useSmartPolling";

// Optimized notification polling - pauses when tab is hidden
export function useOptimizedNotifications() {
  // No polling for notifications - uses refetchOnWindowFocus instead
  const { data: unreadCount = 0, error } =
    trpc.notifications.getUnreadCount.useQuery(undefined, {
      refetchInterval: false, // NO POLLING - will add WebSocket support later
      refetchOnWindowFocus: true, // Only refetch when user returns to tab
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

  const { data: notifications = [] } =
    trpc.notifications.getNotifications.useQuery(
      { limit: 5, unreadOnly: false },
      {
        refetchInterval: false, // NO POLLING - will add WebSocket support later
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      }
    );

  return {
    unreadCount,
    notifications,
    isActive: true, // Always active, but only refetches on focus
    error,
  };
}

// Optimized messaging polling - visibility aware
export function useOptimizedMessaging() {
  // Smart polling interval - pauses when tab is hidden
  const pollingInterval = useVisibilityAwareInterval(
    30000, // 30 seconds when visible
    false // Pause when hidden
  );

  const { data: unreadCount = 0, error } =
    trpc.messaging.getUnreadCount.useQuery(undefined, {
      refetchInterval: pollingInterval,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 15000, // Cache for 15 seconds
    });

  // Longer interval for conversation counts
  const conversationPollingInterval = useVisibilityAwareInterval(
    60000, // 60 seconds when visible
    false // Pause when hidden
  );

  const { data: conversationCounts = [] } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      refetchInterval: conversationPollingInterval,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30000, // Cache for 30 seconds
      gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    });

  return {
    unreadCount,
    conversationCounts,
    isActive: pollingInterval !== false,
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
