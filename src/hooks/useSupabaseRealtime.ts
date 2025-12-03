/**
 * Supabase Realtime Hook for Messaging
 * 
 * This hook uses Supabase Realtime to listen for new messages and updates
 * in real-time, replacing the need for polling.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";

interface UseSupabaseRealtimeOptions {
  enabled?: boolean;
  conversationId?: string | null;
  userId?: string | null;
  onNewMessage?: (message: any) => void;
  onUnreadCountUpdate?: (count: number) => void;
  onConversationUpdate?: (conversation: any) => void;
  onError?: (error: Error) => void;
}

export function useSupabaseRealtime(options: UseSupabaseRealtimeOptions = {}) {
  const {
    enabled = true,
    conversationId,
    userId,
    onNewMessage,
    onUnreadCountUpdate,
    onConversationUpdate,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);

  // Store callbacks in refs to prevent recreation
  const callbacksRef = useRef({
    onNewMessage,
    onUnreadCountUpdate,
    onConversationUpdate,
    onError,
  });

  // Update callbacks when they change
  useEffect(() => {
    callbacksRef.current = {
      onNewMessage,
      onUnreadCountUpdate,
      onConversationUpdate,
      onError,
    };
  }, [onNewMessage, onUnreadCountUpdate, onConversationUpdate, onError]);

  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Supabase not configured, skipping Realtime connection");
      }
      return;
    }

    // Check for PrivateOnly mode - if enabled, we can't use Realtime with Kinde Auth
    // User needs to disable "Private channels only" in Supabase Settings → API → Realtime

    // Don't create multiple connections
    if (channelRef.current) {
      return;
    }

    try {
      // Create a unique channel name to avoid conflicts
      // Note: If you get "PrivateOnly" errors, disable "Private channels only" in Supabase Settings → API → Realtime
      const channelName = `messages-${userId || "global"}-${Date.now()}`;
      
      // Create a channel for message updates
      // postgres_changes requires public channels (or PrivateOnly mode disabled)
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "Message",
            // Only filter by conversationId if specified, otherwise listen to all
            filter: conversationId
              ? `conversationId=eq.${conversationId}`
              : undefined,
          },
          (payload) => {
            // New message received
            if (payload.new) {
              if (process.env.NODE_ENV === "development") {
                console.log("📨 New message via Realtime:", payload.new);
              }
              callbacksRef.current.onNewMessage?.(payload.new);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "Conversation",
            filter: conversationId
              ? `id=eq.${conversationId}`
              : undefined,
          },
          (payload) => {
            // Conversation updated
            if (payload.new) {
              callbacksRef.current.onConversationUpdate?.(payload.new);
            }
          }
        )
        .subscribe((status, err) => {
          if (err) {
            setIsConnected(false);
            
            // Check for PrivateOnly error specifically
            if (err.message?.includes("PrivateOnly")) {
              if (process.env.NODE_ENV === "development") {
                console.error(
                  "❌ Supabase Realtime error: PrivateOnly mode is enabled.\n" +
                  "💡 Fix: Go to Supabase Dashboard → Settings → API → Realtime\n" +
                  "   Disable 'Private channels only' toggle, then restart dev server."
                );
              }
              // Don't spam errors - just log once
              return;
            }
            
            if (process.env.NODE_ENV === "development") {
              console.error("❌ Supabase Realtime subscription error:", err);
            }
            callbacksRef.current.onError?.(new Error(err.message || "Realtime subscription error"));
            return;
          }
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
            if (process.env.NODE_ENV === "development") {
              console.log("✅ Supabase Realtime connected - NO MORE POLLING!");
            }
          } else if (status === "CHANNEL_ERROR") {
            setIsConnected(false);
            // Don't spam console - only log once
            if (process.env.NODE_ENV === "development" && !channelRef.current?._errorLogged) {
              console.error("❌ Supabase Realtime channel error - will fall back to polling");
              console.error("💡 Check: 1) Realtime enabled in Supabase? 2) Tables added to publication? 3) RLS policies?");
              if (channelRef.current) {
                (channelRef.current as any)._errorLogged = true;
              }
            }
            // Don't call onError repeatedly - it causes spam
          } else if (status === "TIMED_OUT") {
            setIsConnected(false);
            if (process.env.NODE_ENV === "development" && !channelRef.current?._errorLogged) {
              console.error("❌ Supabase Realtime connection timed out - will fall back to polling");
              if (channelRef.current) {
                (channelRef.current as any)._errorLogged = true;
              }
            }
          } else if (status === "CLOSED") {
            setIsConnected(false);
            // Don't log closed status - it's normal on cleanup
          } else {
            if (process.env.NODE_ENV === "development") {
              console.log("🔄 Supabase Realtime status:", status);
            }
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error("Error creating Supabase Realtime connection:", error);
      setIsConnected(false);
      callbacksRef.current.onError?.(
        error instanceof Error
          ? error
          : new Error("Failed to create Supabase Realtime connection")
      );
    }
  }, [enabled, conversationId]);

  const disconnect = useCallback(() => {
    if (channelRef.current && supabase) {
      try {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      } catch (error) {
        // Ignore errors when disconnecting
      }
    }
  }, []);

  // Connect/disconnect based on enabled state
  useEffect(() => {
    if (enabled) {
      connect();
      return () => {
        disconnect();
      };
    } else {
      disconnect();
      return undefined;
    }
  }, [enabled, connect, disconnect]);

  // Reconnect when conversationId changes
  useEffect(() => {
    if (enabled) {
      disconnect();
      connect();
    }
  }, [conversationId, enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
  };
}

