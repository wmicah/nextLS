/**
 * Socket.io Hook for Real-time Messaging
 * 
 * This hook manages Socket.io connections for real-time messaging,
 * replacing the need for polling and reducing database usage.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";

interface UseSocketOptions {
  enabled?: boolean;
  conversationId?: string | null;
  onNewMessage?: (message: any) => void;
  onUnreadCountUpdate?: (count: number) => void;
  onConversationUpdate?: (conversation: any) => void;
  onError?: (error: Error) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
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
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

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

  const connect = useCallback(async () => {
    if (!enabled) {
      return;
    }

    // Don't create multiple connections
    if (socketRef.current?.connected) {
      return;
    }

    // Clean up any existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    try {
      // Ensure we're on the client side
      if (typeof window === "undefined") {
        return;
      }

      // Get user ID from tRPC (we'll need to pass this or get it from context)
      // For now, we'll connect and authenticate after getting user ID
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "/api/socket.io";
      
      const socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        reconnection: false, // Disable auto-reconnection to avoid spam if server isn't set up
        reconnectionAttempts: 0, // Don't retry if connection fails
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 5000, // 5 second timeout
        autoConnect: true,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        // Only log in development
        if (process.env.NODE_ENV === "development") {
          console.log("✅ Socket.io connected:", socket.id);
        }

        // Authenticate - we'll need to get userId from somewhere
        // This should be done after we have the user ID
        // socket.emit("authenticate", { userId: currentUserId });
      });

      socket.on("disconnect", (reason) => {
        setIsConnected(false);
        // Only log in development
        if (process.env.NODE_ENV === "development") {
          console.log("Socket.io disconnected:", reason);
        }
      });

      socket.on("connect_error", (error) => {
        // Silently handle connection errors - Socket.io server may not be set up yet
        // This is expected and the system will fall back to SSE/polling
        setIsConnected(false);
        // Disconnect to prevent further connection attempts
        socket.disconnect();
        // Don't call onError for connection failures - it's expected if server isn't running
      });

      // Handle new message
      socket.on("new_message", (data: any) => {
        callbacksRef.current.onNewMessage?.(data);
      });

      // Handle unread count update
      socket.on("unread_count", (data: { count: number }) => {
        setUnreadCount(data.count);
        callbacksRef.current.onUnreadCountUpdate?.(data.count);
      });

      // Handle conversation update
      socket.on("conversation_update", (data: any) => {
        callbacksRef.current.onConversationUpdate?.(data);
      });

      // Handle authenticated event
      socket.on("authenticated", (data: { userId: string }) => {
        // Only log in development
        if (process.env.NODE_ENV === "development") {
          console.log("Socket authenticated for user:", data.userId);
        }
        
        // Subscribe to conversation if provided
        if (conversationId) {
          socket.emit("subscribe_conversation", { conversationId });
        }
      });

      // Handle errors
      socket.on("error", (error: any) => {
        // Silently handle errors - Socket.io server may not be set up yet
        setIsConnected(false);
        // Don't log or call onError - fallback to SSE/polling is expected
      });
    } catch (error) {
      // Silently handle errors - Socket.io may not be available
      setIsConnected(false);
      // Don't log or call onError - this is expected if Socket.io server isn't set up
    }
  }, [enabled]);

  // Authenticate socket with user ID
  const authenticate = useCallback((userId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("authenticate", { userId });
    }
  }, []);

  // Subscribe/unsubscribe to conversation
  useEffect(() => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit("subscribe_conversation", { conversationId });
    }

    return () => {
      if (socketRef.current?.connected && conversationId) {
        socketRef.current.emit("unsubscribe_conversation", { conversationId });
      }
    };
  }, [conversationId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      // Unsubscribe from conversation if subscribed
      if (conversationId && socketRef.current.connected) {
        socketRef.current.emit("unsubscribe_conversation", { conversationId });
      }

      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
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
    authenticate,
    socket: socketRef.current,
  };
}

