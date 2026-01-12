"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import {
  Search,
  Plus,
  Send,
  Paperclip,
  Image as ImageIcon,
  File,
  Video,
  CheckCheck,
  X,
  Users,
} from "lucide-react";
import Sidebar from "./Sidebar";
import { format, isSameDay, isToday, isYesterday, differenceInDays } from "date-fns";
import MessageFileUpload from "./MessageFileUpload";
import FormattedMessage from "./FormattedMessage";
import ProfilePictureUploader from "./ProfilePictureUploader";
import RichMessageInput from "./RichMessageInput";
import MessageAcknowledgment from "./MessageAcknowledgment";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileMessagesPage from "./MobileMessagesPage";
import { LoadingState, DataLoadingState } from "@/components/LoadingState";
import { SkeletonMessageList, SkeletonCard } from "@/components/SkeletonLoader";
import MassMessageModal from "./MassMessageModal";
import { COLORS, getGoldenAccent } from "@/lib/colors";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

interface MessagesPageProps {
  // Add props here if needed in the future
}

function MessagesPage({}: MessagesPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  // const [isTyping, setIsTyping] = useState(false)
  // const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMassMessageModal, setShowMassMessageModal] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    uploadData: {
      attachmentUrl: string;
      attachmentType: string;
      attachmentName: string;
      attachmentSize: number;
    };
  } | null>(null);
  const [conversationsOffset, setConversationsOffset] = useState(0);
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const conversationsListRef = useRef<HTMLDivElement>(null);

  // Video creation mutation
  const createVideoMutation = trpc.videos.create.useMutation({
    onSuccess: videoData => {
      // Navigate to video annotation page with the new video ID
      window.open(`/videos/${videoData.id}`, "_blank");
    },
    onError: error => {
      console.error("Failed to create video:", error);
      alert("Failed to create video for annotation. Please try again.");
    },
  });
  const [pendingMessages, setPendingMessages] = useState<
    Array<{
      id: string;
      content: string;
      timestamp: Date;
      status: "sending" | "sent" | "failed";
      attachmentUrl?: string;
      attachmentType?: string;
      attachmentName?: string;
    }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const fileInputRef = useRef<HTMLInputElement>(null)

  // Get current user info - optimized caching
  const { data: currentUser } = trpc.user.getProfile.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (rarely changes)
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const utils = trpc.useUtils();

  // Use Supabase Realtime for real-time updates instead of polling
  const { isConnected } = useSupabaseRealtime({
    enabled: !!currentUser?.id,
    userId: currentUser?.id || null,
    conversationId: selectedConversation,
    onNewMessage: (data) => {
      // Invalidate queries to refresh UI when new message arrives
      utils.messaging.getMessages.invalidate();
      utils.messaging.getConversations.invalidate();
      utils.messaging.getUnreadCount.invalidate();
    },
    onConversationUpdate: () => {
      utils.messaging.getConversations.invalidate();
    },
  });

  // Get unread count - polls as fallback if Supabase Realtime not connected
  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    {
      staleTime: 30 * 1000, // Cache for 30 seconds
      refetchInterval: !isConnected ? 30000 : false, // Poll every 30s if Realtime not connected
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true,
    }
  );

  // Get conversations with pagination (no polling - updates via WebSocket)
  const {
    data: conversationsData,
    refetch: refetchConversations,
    isLoading: conversationsLoading,
  } = trpc.messaging.getConversations.useQuery(
    { limit: 8, offset: conversationsOffset },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchInterval: false, // NO POLLING - updates via WebSocket
      refetchOnWindowFocus: false, // No refetch on focus
      refetchOnReconnect: true, // Only refetch on reconnect
    }
  );

  // Update conversations and pagination state when data changes
  useEffect(() => {
    if (conversationsData) {
      if (conversationsOffset === 0) {
        // First load - replace all conversations
        setAllConversations(conversationsData.conversations);
      } else {
        // Load more - append to existing conversations
        setAllConversations(prev => [
          ...prev,
          ...conversationsData.conversations,
        ]);
      }
      setHasMoreConversations(conversationsData.hasMore);
    }
  }, [conversationsData, conversationsOffset]);

  const conversations = allConversations;

  // Mutation to get or create conversation with a client
  const getOrCreateConversationMutation =
    trpc.messaging.createConversationWithClient.useMutation({
      onSuccess: conversation => {
        // Navigate to the conversation
        setSelectedConversation(conversation.id);
        // Update URL to show conversation ID instead of clientId
        router.replace(`/messages?conversation=${conversation.id}`);
      },
      onError: error => {
        console.error("Failed to get or create conversation:", error);
        // Show user-friendly error message
        const errorMessage = error.message || "Failed to open conversation. Please try again.";
        // Use window.alert as fallback if toast system not available
        alert(errorMessage);
        // Remove clientId from URL to prevent retry loop
        router.replace("/messages");
      },
    });

  // Handle URL parameters for conversation, message, and clientId
  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    const messageId = searchParams.get("message");
    const clientId = searchParams.get("clientId");

    if (conversationId) {
      setSelectedConversation(conversationId);
    } else if (clientId && !getOrCreateConversationMutation.isPending) {
      // Validate clientId before calling mutation
      if (clientId && clientId.trim() !== "") {
        // If we have a clientId, get or create the conversation
        getOrCreateConversationMutation.mutate({ clientId: clientId.trim() });
      } else {
        // Invalid clientId, remove from URL
        router.replace("/messages");
      }
    } else if (messageId) {
      // If we have a messageId but no conversationId, we need to find the conversation
      // For now, we'll just set it to null and let the user select
      setSelectedConversation(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Function to load more conversations
  const loadMoreConversations = () => {
    if (!isLoadingMore && hasMoreConversations) {
      setIsLoadingMore(true);
      setConversationsOffset(prev => prev + 8);
    }
  };

  // Handle scroll to load more conversations
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // Load when 100px from bottom

    if (isNearBottom && hasMoreConversations && !isLoadingMore) {
      loadMoreConversations();
    }
  };

  // Reset loading state when new data arrives
  useEffect(() => {
    if (conversationsData) {
      setIsLoadingMore(false);
    }
  }, [conversationsData]);

  // Get unread counts (no polling - updates via WebSocket)
  const { data: unreadCountsObj = {} } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchInterval: false, // NO POLLING - updates via WebSocket
      refetchOnWindowFocus: false, // No refetch on focus
      refetchOnReconnect: true, // Only refetch on reconnect
    });

  // Get messages (no polling - updates via WebSocket)
  const {
    data: messages = [],
    refetch: refetchMessages,
    isLoading: messagesLoading,
  } = trpc.messaging.getMessages.useQuery(
    { conversationId: selectedConversation! },
    {
      enabled: !!selectedConversation,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchInterval: false, // NO POLLING - updates via WebSocket
      refetchOnWindowFocus: false, // No refetch on focus
      refetchOnReconnect: true, // Only refetch on reconnect
    }
  );

  // Get clients for conversation creation
  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
    scope: "organization",
  });

  // Mutations
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation();

  const markAsReadMutation = trpc.messaging.markAsRead.useMutation({
    onSuccess: () => {
      // Invalidate all queries that depend on unread counts
      utils.messaging.getMessages.invalidate();
      utils.messaging.getConversations.invalidate();
      utils.messaging.getUnreadCount.invalidate();
      utils.messaging.getConversationUnreadCounts.invalidate();
      utils.sidebar.getSidebarData.invalidate(); // This updates the Sidebar badge!
      
      // Force immediate refetch
      utils.messaging.getConversationUnreadCounts.refetch();
      utils.messaging.getUnreadCount.refetch();
      utils.sidebar.getSidebarData.refetch();
    },
  });

  const createConversationMutation =
    trpc.messaging.createConversationWithClient.useMutation({
      onSuccess: conversation => {
        setSelectedConversation(conversation.id);
        refetchConversations();
        setShowCreateModal(false);
        setClientSearchTerm("");
      },
      onError: error => {
        console.error("Failed to create conversation:", error);
        // You could add a toast notification here
      },
    });

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        const isNearBottom =
          container.scrollTop + container.clientHeight >=
          container.scrollHeight - 100;
        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [messages]);

  // Auto-scroll when pending messages are added (only if user is near bottom)
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        const isNearBottom =
          container.scrollTop + container.clientHeight >=
          container.scrollHeight - 100;
        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [pendingMessages]);

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    // Mark messages as read when conversation is opened
    markAsReadMutation.mutate({ conversationId });
  };

  // Handle sending message
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!messageText.trim() && !selectedFile) || !selectedConversation) return;

    const tempId = `temp-${Date.now()}`;
    const messageContent = messageText.trim() || "";
    const attachmentData = selectedFile
      ? {
          attachmentUrl: selectedFile.uploadData.attachmentUrl,
          attachmentType: selectedFile.uploadData.attachmentType,
          attachmentName: selectedFile.uploadData.attachmentName,
          attachmentSize: selectedFile.uploadData.attachmentSize,
        }
      : {};

    // Create optimistic message
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      timestamp: new Date(),
      status: "sending" as const,
      ...(selectedFile && {
        attachmentUrl: selectedFile.uploadData.attachmentUrl,
        attachmentType: selectedFile.uploadData.attachmentType,
        attachmentName: selectedFile.uploadData.attachmentName,
      }),
    };

    // Add optimistic message and clear inputs
    setPendingMessages(prev => [...prev, optimisticMessage]);
    setMessageText("");
    setSelectedFile(null);

    sendMessageMutation.mutate(
      {
        conversationId: selectedConversation,
        content: messageContent,
        ...attachmentData,
      },
      {
        onSuccess: () => {
          // Mark as sent
          setPendingMessages(prev =>
            prev.map(msg =>
              msg.id === tempId ? { ...msg, status: "sent" as const } : msg
            )
          );

          // Refetch messages to get the real message
          refetchMessages().then(() => {
            setPendingMessages(prev => prev.filter(msg => msg.id !== tempId));
          });
          refetchConversations();
        },
        onError: () => {
          // Mark message as failed
          setPendingMessages(prev =>
            prev.map(msg =>
              msg.id === tempId ? { ...msg, status: "failed" as const } : msg
            )
          );

          // Restore inputs for retry
          setMessageText(messageContent);
          if (selectedFile) {
            setSelectedFile({
              file: new (File as any)(
                [""],
                attachmentData.attachmentName || "file",
                {
                  type:
                    attachmentData.attachmentType || "application/octet-stream",
                }
              ),
              uploadData: {
                attachmentUrl: attachmentData.attachmentUrl || "",
                attachmentType:
                  attachmentData.attachmentType || "application/octet-stream",
                attachmentName: attachmentData.attachmentName || "file",
                attachmentSize: attachmentData.attachmentSize || 0,
              },
            });
          }
        },
      }
    );
  };

  // Handle file selection
  const handleFileSelect = (
    file: File,
    uploadData: {
      attachmentUrl: string;
      attachmentType: string;
      attachmentName: string;
      attachmentSize: number;
    }
  ) => {
    setSelectedFile({ file, uploadData });
    setShowFileUpload(false);
  };

  // Handle creating conversation with client
  const handleCreateConversation = (clientId: string) => {
    createConversationMutation.mutate({ clientId });
  };

  // Get current conversation details
  const currentConversation = conversations.find(
    c => c.id === selectedConversation
  );

  // Get other user in conversation
  const getOtherUser = (conversation: any) => {
    if (!currentUser) return null;
    return conversation.coach.id === currentUser.id
      ? conversation.client
      : conversation.coach;
  };

  // Format message timestamp with date
  const formatMessageTime = (date: Date, showDate: boolean = false) => {
    const messageDate = new Date(date);
    const now = new Date();
    
    if (showDate) {
      if (isToday(messageDate)) {
        return format(messageDate, "h:mm a 'Today'");
      } else if (isYesterday(messageDate)) {
        return format(messageDate, "h:mm a 'Yesterday'");
      } else {
        const daysDiff = differenceInDays(now, messageDate);
        if (daysDiff < 7) {
          return format(messageDate, "h:mm a EEEE");
        } else {
          return format(messageDate, "h:mm a MMM d, yyyy");
        }
      }
    }
    return format(messageDate, "h:mm a");
  };

  // Format last message time
  const formatLastMessageTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours =
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(messageDate, "h:mm a");
    } else if (diffInHours < 168) {
      return format(messageDate, "EEE");
    } else {
      return format(messageDate, "MMM d");
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations
    .filter(conversation => {
      const otherUser = getOtherUser(conversation);
      if (!otherUser) return false;

      const searchLower = searchTerm.toLowerCase();
      return (
        otherUser.name?.toLowerCase().includes(searchLower) ||
        otherUser.email?.toLowerCase().includes(searchLower) ||
        conversation.messages[0]?.content.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Sort by most recent message first (descending order)
      const aLastMessage = a.messages[0]?.createdAt || a.updatedAt;
      const bLastMessage = b.messages[0]?.createdAt || b.updatedAt;
      return (
        new Date(bLastMessage).getTime() - new Date(aLastMessage).getTime()
      );
    });

  // Filter clients for conversation creation
  const filteredClients = clients.filter(client => {
    const searchLower = clientSearchTerm.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.coach?.name?.toLowerCase().includes(searchLower) ||
      client.primaryCoach?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Sidebar>
      <div
        className="h-screen flex flex-col overflow-hidden"
        style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
      >
        {/* Simple Header */}
        <div
          className="px-3 py-0 border-b flex-shrink-0"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1
                className="text-lg font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Messages
              </h1>
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                <span>
                  {conversations.length > 0
                    ? `${conversations.length} ${
                        conversations.length === 1
                          ? "conversation"
                          : "conversations"
                      }`
                    : "No conversations yet"}
                </span>
                {unreadCount > 0 && (
                  <>
                    <span>•</span>
                    <span
                      className="font-medium"
                      style={{ color: COLORS.GOLDEN_ACCENT }}
                    >
                      {unreadCount} unread
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMassMessageModal(true)}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: COLORS.BLUE_PRIMARY,
                  color: "#ffffff",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BLUE_DARK;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BLUE_PRIMARY;
                }}
              >
                <Users className="h-3 w-3 inline mr-1" />
                Mass Message
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: COLORS.GOLDEN_ACCENT,
                  color: "#ffffff",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_HOVER;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                }}
              >
                <Plus className="h-3 w-3 inline mr-1" />
                New Message
              </button>
            </div>
          </div>
        </div>

        {/* Messages Interface */}
        <div
          className="flex flex-1 rounded-lg border overflow-hidden shadow-lg m-2"
          style={{
            backgroundColor: COLORS.BACKGROUND_CARD,
            borderColor: COLORS.BORDER_SUBTLE,
            boxShadow: `0 4px 12px -2px rgba(0, 0, 0, 0.2), 0 0 0 1px ${getGoldenAccent(
              0.1
            )}`,
          }}
        >
          {/* Conversations Sidebar */}
          <div
            className="w-80 border-r flex flex-col min-h-0"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              backgroundColor: COLORS.BACKGROUND_DARK,
            }}
          >
            {/* Compact Header with Search */}
            <div
              className="p-2 border-b"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              <div className="mb-2">
                <h2
                  className="text-sm font-semibold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Conversations
                </h2>
              </div>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: COLORS.TEXT_MUTED }}
                />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-md text-xs transition-all duration-200"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                    border: "1px solid",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(
                      0.2
                    )}`;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_DARK;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Conversations List - With Internal Scroll */}
            <div
              className="flex-1 overflow-y-auto"
              ref={conversationsListRef}
              onScroll={handleScroll}
            >
              <DataLoadingState
                isLoading={conversationsLoading}
                data={filteredConversations}
                emptyState={
                  <div className="p-4 text-center">
                    <div
                      className="h-8 w-8 mx-auto mb-2 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: getGoldenAccent(0.1),
                        color: COLORS.GOLDEN_ACCENT,
                      }}
                    >
                      <File className="h-4 w-4" />
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {searchTerm
                        ? "No conversations found"
                        : "No conversations yet"}
                    </p>
                  </div>
                }
              >
                <div className="space-y-1">
                  {filteredConversations.map(conversation => {
                    const otherUser = getOtherUser(conversation);
                    const lastMessage = conversation.messages[0];
                    const unreadCount = unreadCountsObj[conversation.id] || 0;
                    const isSelected = selectedConversation === conversation.id;

                    return (
                      <div
                        key={conversation.id}
                        onClick={() =>
                          handleConversationSelect(conversation.id)
                        }
                        className={`p-3 cursor-pointer transition-all duration-200 ${
                          isSelected ? getGoldenAccent(0.1) : ""
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? getGoldenAccent(0.1)
                            : "transparent",
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor =
                              COLORS.BACKGROUND_CARD_HOVER;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <ProfilePictureUploader
                              currentAvatarUrl={
                                otherUser?.settings?.avatarUrl ||
                                otherUser?.avatar ||
                                null
                              }
                              userName={
                                otherUser?.name || otherUser?.email || "User"
                              }
                              onAvatarChange={() => {}}
                              size="sm"
                              readOnly={true}
                              className="flex-shrink-0"
                            />
                            {unreadCount > 0 && (
                              <div
                                className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{
                                  backgroundColor: COLORS.GOLDEN_ACCENT,
                                  color: "#ffffff",
                                }}
                              >
                                {unreadCount > 9 ? "9+" : unreadCount}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-sm font-medium truncate ${
                                  unreadCount > 0 ? "font-semibold" : ""
                                }`}
                                style={{
                                  color: isSelected
                                    ? COLORS.GOLDEN_ACCENT
                                    : COLORS.TEXT_PRIMARY,
                                }}
                              >
                                {otherUser?.name ||
                                  otherUser?.email?.split("@")[0] ||
                                  "Unknown"}
                              </p>
                              {lastMessage && (
                                <span
                                  className="text-xs flex-shrink-0 ml-2"
                                  style={{ color: COLORS.TEXT_MUTED }}
                                >
                                  {formatLastMessageTime(lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-xs truncate ${
                                unreadCount > 0 ? "font-medium" : ""
                              }`}
                              style={{
                                color:
                                  unreadCount > 0
                                    ? COLORS.GOLDEN_ACCENT
                                    : COLORS.TEXT_SECONDARY,
                              }}
                            >
                              {lastMessage?.content ? (
                                <FormattedMessage
                                  content={
                                    lastMessage.content.length > 40
                                      ? `${lastMessage.content.substring(
                                          0,
                                          40
                                        )}...`
                                      : lastMessage.content
                                  }
                                />
                              ) : (
                                "No messages yet"
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {hasMoreConversations && (
                    <div className="p-3 text-center">
                      <button
                        onClick={loadMoreConversations}
                        disabled={isLoadingMore}
                        className="text-xs hover:underline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: COLORS.TEXT_MUTED }}
                        onMouseEnter={e => {
                          if (!isLoadingMore) {
                            e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = COLORS.TEXT_MUTED;
                        }}
                      >
                        {isLoadingMore
                          ? "Loading..."
                          : "Load more conversations"}
                      </button>
                    </div>
                  )}
                </div>
              </DataLoadingState>
            </div>
          </div>

          {/* Chat Area */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div
                  className="p-6 border-b flex items-center justify-between"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <div className="flex items-center gap-4">
                    {currentConversation && (
                      <>
                        <ProfilePictureUploader
                          currentAvatarUrl={
                            getOtherUser(currentConversation)?.settings
                              ?.avatarUrl ||
                            getOtherUser(currentConversation)?.avatar
                          }
                          userName={
                            getOtherUser(currentConversation)?.name ||
                            getOtherUser(currentConversation)?.email ||
                            "User"
                          }
                          onAvatarChange={() => {}}
                          size="md"
                          readOnly={true}
                          className="flex-shrink-0"
                        />
                        <div>
                          <p
                            className="font-bold text-lg tracking-tight"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            {getOtherUser(currentConversation)?.name ||
                              getOtherUser(currentConversation)?.email?.split(
                                "@"
                              )[0] ||
                              "Unknown"}
                          </p>
                          <p
                            className="text-sm font-medium"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            {getOtherUser(currentConversation)?.email ||
                              "No email"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <DataLoadingState
                    isLoading={messagesLoading}
                    data={messages}
                    emptyState={
                      <div className="text-center py-8">
                        <div
                          className="h-8 w-8 mx-auto mb-3 opacity-50"
                          style={{ color: COLORS.GOLDEN_ACCENT }}
                        >
                          <File className="h-8 w-8" />
                        </div>
                        <p
                          className="text-sm"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    }
                  >
                    <>
                      {messages.map((message: any, index: number) => {
                        // Check if this is a workout note message
                        const isWorkoutNote =
                          message.content?.includes("📝 **Workout Note**") ||
                          message.content?.includes(
                            "📝 **Daily Workout Note**"
                          );
                        const isFromClient =
                          message.sender.id !== currentUser?.id;

                        // Debug logging for workout notes
                        if (isWorkoutNote) {
                          console.log("🔍 Workout Note Debug:", {
                            messageId: message.id,
                            senderId: message.sender.id,
                            currentUserId: currentUser?.id,
                            isFromClient,
                            senderName: message.sender.name,
                            currentUserName: currentUser?.name,
                            content: message.content?.substring(0, 100),
                          });
                        }

                        // Check if we need to show a date separator
                        const currentMessageDate = new Date(message.createdAt);
                        const previousMessage = index > 0 ? messages[index - 1] : null;
                        const previousMessageDate = previousMessage
                          ? new Date(previousMessage.createdAt)
                          : null;
                        const showDateSeparator =
                          !previousMessageDate ||
                          !isSameDay(currentMessageDate, previousMessageDate);
                        
                        // Check if all messages are on the same day
                        const allMessagesSameDay = messages.length > 0 && 
                          messages.every((msg: any) => 
                            isSameDay(new Date(msg.createdAt), currentMessageDate)
                          );
                        // Show date on first message timestamp if all messages are same day
                        const showDateOnFirstMessage = allMessagesSameDay && index === 0;
                        // Show date separator at top if all messages are same day and this is first message
                        const showTopDateSeparator = allMessagesSameDay && index === 0;

                        return (
                          <div key={message.id} className="space-y-2">
                            {/* Date Separator - show at top if all messages same day, or between different days */}
                            {(showTopDateSeparator || (showDateSeparator && !allMessagesSameDay)) && (
                              <div className="flex items-center justify-center py-2">
                                <div
                                  className="px-3 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: COLORS.BACKGROUND_CARD,
                                    color: COLORS.TEXT_SECONDARY,
                                    border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                                  }}
                                >
                                  {isToday(currentMessageDate)
                                    ? "Today"
                                    : isYesterday(currentMessageDate)
                                    ? "Yesterday"
                                    : format(currentMessageDate, "EEEE, MMMM d, yyyy")}
                                </div>
                              </div>
                            )}
                            
                            <div
                              className={`flex ${
                                isWorkoutNote && isFromClient
                                  ? "justify-start"
                                  : message.sender.id === currentUser?.id
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                                message.sender.id === currentUser?.id
                                  ? "rounded-br-sm"
                                  : "rounded-bl-sm"
                              } ${
                                isWorkoutNote && isFromClient
                                  ? "border border-blue-400/30"
                                  : ""
                              }`}
                              style={{
                                backgroundColor:
                                  message.sender.id === currentUser?.id
                                    ? COLORS.GOLDEN_ACCENT
                                    : isWorkoutNote && isFromClient
                                    ? COLORS.BACKGROUND_CARD
                                    : COLORS.BACKGROUND_CARD,
                                color:
                                  message.sender.id === currentUser?.id
                                    ? "#000000"
                                    : COLORS.TEXT_PRIMARY,
                                border:
                                  isWorkoutNote && isFromClient
                                    ? `1px solid ${COLORS.GOLDEN_ACCENT}`
                                    : message.sender.id === currentUser?.id
                                    ? `1px solid ${COLORS.GOLDEN_BORDER}`
                                    : `1px solid ${COLORS.BORDER_SUBTLE}`,
                              }}
                            >
                              {/* Workout Note Header */}
                              {isWorkoutNote && isFromClient && (
                                <div className="mb-3">
                                  <div className="text-blue-400 font-medium text-sm mb-1">
                                    📝 Feedback for program day
                                  </div>
                                  <div className="text-xs text-gray-400 mb-2">
                                    {new Date(
                                      message.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              )}

                              {message.content && (
                                <div className="text-sm mb-2">
                                  <FormattedMessage content={message.content} />
                                </div>
                              )}

                              {/* Message Acknowledgment */}
                              <MessageAcknowledgment
                                messageId={message.id}
                                requiresAcknowledgment={
                                  message.requiresAcknowledgment || false
                                }
                                isAcknowledged={message.isAcknowledged || false}
                                acknowledgedAt={
                                  message.acknowledgedAt
                                    ? new Date(message.acknowledgedAt)
                                    : null
                                }
                                isOwnMessage={
                                  message.sender.id === currentUser?.id
                                }
                                messageData={
                                  message.data as
                                    | { type?: string; swapRequestId?: string }
                                    | undefined
                                }
                              />

                              {/* File Attachment */}
                              {message.attachmentUrl && (
                                <div className="mb-2">
                                  {message.attachmentType?.startsWith(
                                    "image/"
                                  ) ? (
                                    <img
                                      src={message.attachmentUrl}
                                      alt={message.attachmentName || "Image"}
                                      className="max-w-full rounded-lg cursor-pointer transition-transform hover:scale-105"
                                      style={{ maxHeight: "300px" }}
                                      onClick={() =>
                                        message.attachmentUrl &&
                                        window.open(
                                          message.attachmentUrl,
                                          "_blank"
                                        )
                                      }
                                    />
                                  ) : message.attachmentType?.startsWith(
                                      "video/"
                                    ) ? (
                                    <div className="space-y-2">
                                      <video
                                        src={message.attachmentUrl}
                                        controls
                                        className="max-w-full rounded-lg"
                                        style={{ maxHeight: "300px" }}
                                        preload="metadata"
                                      >
                                        Your browser does not support the video
                                        tag.
                                      </video>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            // Create video record from message attachment
                                            createVideoMutation.mutate({
                                              title:
                                                message.attachmentName ||
                                                "Video from Message",
                                              description: `Video attachment from message`,
                                              url: message.attachmentUrl,
                                              duration: 0, // Will be updated when video loads
                                              fileSize:
                                                message.attachmentSize || 0,
                                            });
                                          }}
                                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                                        >
                                          <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                          </svg>
                                          Annotate Video
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <a
                                      href={message.attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                                      style={{
                                        backgroundColor: "#2A3133",
                                        color: "#C3BCC2",
                                        border: "1px solid #606364",
                                      }}
                                    >
                                      {message.attachmentType?.startsWith(
                                        "audio/"
                                      ) ? (
                                        <File className="h-4 w-4" />
                                      ) : (
                                        <File className="h-4 w-4" />
                                      )}
                                      <span className="text-sm">
                                        {message.attachmentName}
                                      </span>
                                    </a>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span
                                  className="text-xs"
                                  style={{
                                    color:
                                      message.sender.id === currentUser?.id
                                        ? "rgba(0, 0, 0, 0.6)"
                                        : COLORS.TEXT_MUTED,
                                  }}
                                >
                                  {formatMessageTime(
                                    new Date(message.createdAt),
                                    showDateOnFirstMessage
                                  )}
                                </span>
                                {message.sender.id === currentUser?.id && (
                                  <CheckCheck
                                    className="h-3 w-3"
                                    style={{ color: "rgba(0, 0, 0, 0.6)" }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                      })}

                      {/* Pending Messages */}
                      {pendingMessages.map(pendingMessage => (
                        <div
                          key={pendingMessage.id}
                          className="flex justify-end"
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg rounded-br-none ${
                              pendingMessage.status === "failed"
                                ? "opacity-60"
                                : ""
                            }`}
                            style={{
                              backgroundColor: COLORS.BACKGROUND_CARD,
                              color: COLORS.TEXT_PRIMARY,
                              border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                            }}
                          >
                            {pendingMessage.content && (
                              <div className="text-sm mb-2">
                                <FormattedMessage
                                  content={pendingMessage.content}
                                />
                              </div>
                            )}

                            {/* Pending File Attachment */}
                            {pendingMessage.attachmentUrl && (
                              <div className="mb-2">
                                {pendingMessage.attachmentType?.startsWith(
                                  "image/"
                                ) ? (
                                  <img
                                    src={pendingMessage.attachmentUrl}
                                    alt={
                                      pendingMessage.attachmentName || "Image"
                                    }
                                    className="max-w-full rounded-lg cursor-pointer transition-transform hover:scale-105"
                                    style={{ maxHeight: "300px" }}
                                  />
                                ) : (
                                  <div
                                    className="flex items-center gap-2 p-2 rounded-lg"
                                    style={{
                                      backgroundColor: "#2A3133",
                                      color: "#C3BCC2",
                                      border: "1px solid #606364",
                                    }}
                                  >
                                    <File className="h-4 w-4" />
                                    <span className="text-sm">
                                      {pendingMessage.attachmentName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span
                                className="text-xs"
                                style={{ color: COLORS.TEXT_MUTED }}
                              >
                                {format(pendingMessage.timestamp, "h:mm a")}
                              </span>
                              <div className="flex items-center">
                                {pendingMessage.status === "sending" && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 bg-blue-200 rounded-full animate-pulse" />
                                    <div
                                      className="w-1 h-1 bg-blue-200 rounded-full animate-pulse"
                                      style={{ animationDelay: "0.2s" }}
                                    />
                                    <div
                                      className="w-1 h-1 bg-blue-200 rounded-full animate-pulse"
                                      style={{ animationDelay: "0.4s" }}
                                    />
                                  </div>
                                )}
                                {pendingMessage.status === "sent" && (
                                  <CheckCheck
                                    className="h-3 w-3"
                                    style={{ color: COLORS.TEXT_MUTED }}
                                  />
                                )}
                                {pendingMessage.status === "failed" && (
                                  <div className="w-3 h-3 bg-red-400 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-red-800 font-bold">
                                      !
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  </DataLoadingState>
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div
                  className="p-6 border-t"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  {/* Selected File Indicator */}
                  {selectedFile && (
                    <div
                      className="mb-3 p-3 rounded-lg flex items-center justify-between"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {selectedFile.file.type.startsWith("image/") ? (
                          <ImageIcon
                            className="h-4 w-4"
                            style={{ color: COLORS.GOLDEN_ACCENT }}
                          />
                        ) : selectedFile.file.type.startsWith("video/") ? (
                          <Video
                            className="h-4 w-4"
                            style={{ color: COLORS.GOLDEN_ACCENT }}
                          />
                        ) : (
                          <File
                            className="h-4 w-4"
                            style={{ color: COLORS.GOLDEN_ACCENT }}
                          />
                        )}
                        <span
                          className="text-sm"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          {selectedFile.file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1 rounded transition-colors"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.BACKGROUND_CARD_HOVER;
                          e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <RichMessageInput
                    value={messageText}
                    onChange={setMessageText}
                    onSend={() => handleSendMessage()}
                    onFileUpload={() => setShowFileUpload(true)}
                    placeholder="Type a message..."
                    disabled={false}
                    isPending={sendMessageMutation.isPending}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="h-12 w-12 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: getGoldenAccent(0.1),
                      color: COLORS.GOLDEN_ACCENT,
                    }}
                  >
                    <File className="h-6 w-6" />
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Select a conversation
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Choose a conversation from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Conversation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 w-full max-w-md mx-4"
            style={{
              backgroundColor: COLORS.BACKGROUND_DARK,
              borderColor: COLORS.BORDER_SUBTLE,
              border: "1px solid",
              boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px ${getGoldenAccent(
                0.1
              )}`,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-xl font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Start New Conversation
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setClientSearchTerm("");
                }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: COLORS.TEXT_SECONDARY }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mb-6">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: COLORS.TEXT_MUTED }}
              />
              <input
                type="text"
                placeholder="Search clients..."
                value={clientSearchTerm}
                onChange={e => setClientSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-sm transition-all duration-200"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                  border: "1px solid",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_DARK;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(
                    0.2
                  )}`;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filteredClients.length === 0 ? (
                <div className="text-center py-4">
                  <p
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {clientSearchTerm
                      ? "No clients found"
                      : "No clients available"}
                  </p>
                </div>
              ) : (
                filteredClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => handleCreateConversation(client.id)}
                    disabled={createConversationMutation.isPending}
                    className="w-full p-3 border-b cursor-pointer transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                    onMouseEnter={e => {
                      if (!createConversationMutation.isPending) {
                        e.currentTarget.style.backgroundColor =
                          COLORS.BACKGROUND_CARD_HOVER;
                        e.currentTarget.style.borderColor =
                          COLORS.GOLDEN_ACCENT;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!createConversationMutation.isPending) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.borderColor =
                          COLORS.BORDER_SUBTLE;
                      }
                    }}
                  >
                    {createConversationMutation.isPending && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <ProfilePictureUploader
                        currentAvatarUrl={
                          client.user?.settings?.avatarUrl || client.avatar
                        }
                        userName={client.name || client.email || "User"}
                        onAvatarChange={() => {}}
                        size="sm"
                        readOnly={true}
                        className="flex-shrink-0"
                      />
                      <div className="text-left">
                        <p
                          className="font-medium"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          {client.name ||
                            client.email?.split("@")[0] ||
                            "Unknown"}
                        </p>
                        <div className="flex items-center gap-2">
                          <p
                            className="text-sm"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            {client.email || "No email"}
                          </p>
                          {!client.userId && (
                            <span
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: getGoldenAccent(0.2),
                                color: COLORS.GOLDEN_ACCENT,
                                border: `1px solid ${getGoldenAccent(0.3)}`,
                              }}
                            >
                              No Account
                            </span>
                          )}
                        </div>
                        {(client.primaryCoach?.name || client.coach?.name) && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: COLORS.TEXT_MUTED }}
                          >
                            Assigned Coach:{" "}
                            {client.primaryCoach?.name || client.coach?.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showFileUpload && (
        <MessageFileUpload
          onFileSelect={handleFileSelect}
          onClose={() => setShowFileUpload(false)}
        />
      )}

      {/* Mass Message Modal */}
      <MassMessageModal
        isOpen={showMassMessageModal}
        onClose={() => {
          setShowMassMessageModal(false);
          // Trigger refresh of conversations and unread counts
          refetchConversations();
        }}
      />
    </Sidebar>
  );
}

export default withMobileDetection(MobileMessagesPage, MessagesPage);
