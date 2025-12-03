"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { trpc } from "@/app/_trpc/client";

interface MessagingServiceContextType {
  isConnected: boolean;
  unreadCount: number;
}

const MessagingServiceContext = createContext<
  MessagingServiceContextType | undefined
>(undefined);

interface MessagingServiceProviderProps {
  children: ReactNode;
}

export default function MessagingServiceProvider({
  children,
}: MessagingServiceProviderProps) {
  const { data: currentUser } = trpc.user.getProfile.useQuery();
  const utils = trpc.useUtils();

  // Use Supabase Realtime for real-time messaging
  // Listen to ALL messages (no conversationId filter) to catch all new messages
  const { isConnected } = useSupabaseRealtime({
    enabled: !!currentUser?.id,
    userId: currentUser?.id || null,
    conversationId: null, // Listen to all conversations
    onNewMessage: (data) => {
      if (process.env.NODE_ENV === "development") {
        console.log("🔄 New message received via Realtime:", {
          messageId: data.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          isRead: data.isRead,
          currentUserId: currentUser?.id,
        });
      }
      
      // Invalidate all messaging queries (marks them as stale)
      // This will trigger refetch for active queries
      utils.messaging.getMessages.invalidate();
      utils.messaging.getConversations.invalidate();
      utils.messaging.getUnreadCount.invalidate();
      utils.messaging.getConversationUnreadCounts.invalidate(); // This is what ClientTopNav uses!
      utils.sidebar.getSidebarData.invalidate(); // This is what Sidebar uses!
      
      // Force immediate refetch of active queries (especially the badge count)
      // Use Promise.all to ensure all refetches complete
      Promise.all([
        utils.messaging.getConversationUnreadCounts.refetch(),
        utils.messaging.getUnreadCount.refetch(),
        utils.sidebar.getSidebarData.refetch(),
      ]).then((results) => {
        if (process.env.NODE_ENV === "development") {
          console.log("✅ All queries refetched:", {
            conversationUnreadCounts: (results[0] as any)?.data,
            unreadCount: (results[1] as any)?.data,
            sidebarData: (results[2] as any)?.data ? {
              totalUnreadCount: (results[2] as any).data.totalUnreadCount,
              unreadCountsObj: (results[2] as any).data.unreadCountsObj,
            } : null,
          });
        }
      }).catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ Error refetching queries:", error);
        }
      });
    },
    onConversationUpdate: (data) => {
      if (process.env.NODE_ENV === "development") {
        console.log("🔄 Conversation updated via Realtime, invalidating queries...", data);
      }
      
      // Invalidate conversation queries
      utils.messaging.getConversations.invalidate();
      utils.messaging.getConversationUnreadCounts.invalidate();
      utils.sidebar.getSidebarData.invalidate(); // Sidebar also needs to update
      
      // Force immediate refetch
      utils.messaging.getConversationUnreadCounts.refetch();
      utils.sidebar.getSidebarData.refetch();
    },
  });

  // Get unread count (will be updated via Realtime)
  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    {
      staleTime: 30 * 1000, // Cache for 30 seconds
      refetchInterval: !isConnected ? 30000 : false, // Poll if Realtime not connected
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  const contextValue: MessagingServiceContextType = {
    isConnected,
    unreadCount,
  };

  // Debug: Log connection status
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔌 Supabase Realtime Status:", isConnected ? "✅ Connected" : "❌ Not Connected");
      if (!isConnected && currentUser?.id) {
        console.warn("⚠️ Realtime not connected - falling back to polling");
      }
    }
  }, [isConnected, currentUser?.id]);

  return (
    <MessagingServiceContext.Provider value={contextValue}>
      {children}
    </MessagingServiceContext.Provider>
  );
}

// Export a hook to use the messaging service context
export function useMessagingService() {
  const context = useContext(MessagingServiceContext);
  if (context === undefined) {
    throw new Error(
      "useMessagingService must be used within a MessagingServiceProvider"
    );
  }
  return context;
}
