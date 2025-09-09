import { useEffect, useState, useRef, useCallback } from "react";

interface MessageUpdate {
  type:
    | "unread_count"
    | "new_message"
    | "conversation_update"
    | "connection_established";
  data: any;
}

interface UseMessageSSEOptions {
  enabled?: boolean;
  onUnreadCountUpdate?: (count: number) => void;
  onNewMessage?: (message: any) => void;
  onConversationUpdate?: (conversation: any) => void;
}

export function useMessageSSE(options: UseMessageSSEOptions = {}) {
  const {
    enabled = true,
    onUnreadCountUpdate,
    onNewMessage,
    onConversationUpdate,
  } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Store callbacks in refs to prevent recreation
  const callbacksRef = useRef({
    onUnreadCountUpdate,
    onNewMessage,
    onConversationUpdate,
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onUnreadCountUpdate,
      onNewMessage,
      onConversationUpdate,
    };
  }, [onUnreadCountUpdate, onNewMessage, onConversationUpdate]);

  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }

    // Don't create multiple connections
    if (
      eventSourceRef.current?.readyState === EventSource.OPEN ||
      eventSourceRef.current?.readyState === EventSource.CONNECTING
    ) {
      return;
    }

    // Clean up any existing connection first
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const eventSource = new EventSource("/api/sse/messages");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = event => {
        try {
          const message: MessageUpdate = JSON.parse(event.data);

          switch (message.type) {
            case "connection_established":
              console.log("SSE connection established");
              break;
            case "unread_count":
              setUnreadCount(message.data.count);
              callbacksRef.current.onUnreadCountUpdate?.(message.data.count);
              break;
            case "new_message":
              callbacksRef.current.onNewMessage?.(message.data);
              break;
            case "conversation_update":
              callbacksRef.current.onConversationUpdate?.(message.data);
              break;
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };

      eventSource.onerror = error => {
        console.log("SSE connection failed, will use polling fallback");
        setIsConnected(false);
        // Don't log the error object as it's often empty and causes console errors
      };
    } catch (error) {
      console.error("Error creating SSE connection:", error);
      setIsConnected(false);
    }
  }, [enabled]); // Remove the callback dependencies to prevent recreation

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
  }, []);

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
  }, [enabled]); // Only depend on enabled, not the functions

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
