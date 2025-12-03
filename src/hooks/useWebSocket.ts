/**
 * WebSocket Hook for Real-time Messaging
 * 
 * This hook manages WebSocket connections for real-time messaging,
 * replacing the need for polling.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "@/app/_trpc/client";

interface WebSocketMessage {
  type:
    | "connection_established"
    | "new_message"
    | "message_sent"
    | "unread_count"
    | "conversation_update"
    | "typing"
    | "error";
  data: any;
}

interface UseWebSocketOptions {
  enabled?: boolean;
  conversationId?: string | null;
  onNewMessage?: (message: any) => void;
  onUnreadCountUpdate?: (count: number) => void;
  onConversationUpdate?: (conversation: any) => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    enabled = true,
    conversationId,
    onNewMessage,
    onUnreadCountUpdate,
    onConversationUpdate,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000); // Start with 1 second

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

    // Don't create multiple connections
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      // Get WebSocket URL - use wss in production, ws in development
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      
      // For now, we'll use a simple WebSocket connection
      // In production, you might want to use a service like Pusher or Socket.io
      // Or set up a separate WebSocket server
      
      // Since Next.js API routes don't support WebSocket upgrades directly,
      // we'll use a workaround with Server-Sent Events or a separate WebSocket server
      
      // For now, let's use the SSE endpoint as a fallback and log that WebSocket is preferred
      console.warn(
        "WebSocket not fully implemented yet. Using SSE fallback. " +
        "Consider using a WebSocket service like Pusher, Ably, or Socket.io for production."
      );
      
      // We'll implement a proper WebSocket connection when you have a WebSocket server
      // For now, return early and let the component use SSE or polling
      setIsConnected(false);
      return;

      // When WebSocket server is ready, uncomment this:
      /*
      const wsUrl = `${protocol}//${host}/api/ws/messages`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        reconnectDelay.current = 1000;
        
        // Subscribe to conversation if provided
        if (conversationId) {
          ws.send(
            JSON.stringify({
              type: "subscribe",
              conversationId,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case "connection_established":
              setIsConnected(true);
              break;
            case "new_message":
              callbacksRef.current.onNewMessage?.(message.data);
              break;
            case "unread_count":
              setUnreadCount(message.data.count);
              callbacksRef.current.onUnreadCountUpdate?.(message.data.count);
              break;
            case "conversation_update":
              callbacksRef.current.onConversationUpdate?.(message.data);
              break;
            case "error":
              callbacksRef.current.onError?.(new Error(message.data.message));
              break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        callbacksRef.current.onError?.(new Error("WebSocket connection error"));
      };

      ws.onclose = () => {
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectDelay.current = Math.min(
            reconnectDelay.current * 2,
            30000
          ); // Max 30 seconds

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay.current);
        } else {
          callbacksRef.current.onError?.(
            new Error("Max reconnection attempts reached")
          );
        }
      };
      */
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      setIsConnected(false);
      callbacksRef.current.onError?.(
        error instanceof Error ? error : new Error("Failed to create WebSocket connection")
      );
    }
  }, [enabled, conversationId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      // Unsubscribe from conversation if subscribed
      if (conversationId && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(
            JSON.stringify({
              type: "unsubscribe",
              conversationId,
            })
          );
        } catch (error) {
          // Ignore errors when unsubscribing
        }
      }

      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, [conversationId]);

  // Subscribe/unsubscribe when conversationId changes
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && conversationId) {
      wsRef.current.send(
        JSON.stringify({
          type: "subscribe",
          conversationId,
        })
      );
    }

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN && conversationId) {
        try {
          wsRef.current.send(
            JSON.stringify({
              type: "unsubscribe",
              conversationId,
            })
          );
        } catch (error) {
          // Ignore errors
        }
      }
    };
  }, [conversationId]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    unreadCount,
    connect,
    disconnect,
  };
}

