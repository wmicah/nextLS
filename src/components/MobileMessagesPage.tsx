"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { trpc } from "@/app/_trpc/client";
import {
  Search,
  Plus,
  MoreVertical,
  Send,
  Paperclip,
  File,
  CheckCheck,
  X,
  ArrowLeft,
  Download,
  Video,
  MessageCircle,
  Users,
} from "lucide-react";
import MobileNavigation from "./MobileNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";
import { format, isSameDay, isToday, isYesterday, differenceInDays } from "date-fns";
import MessageFileUpload from "./MessageFileUpload";
import ProfilePictureUploader from "./ProfilePictureUploader";
import RichMessageInput from "./RichMessageInput";
import FormattedMessage from "./FormattedMessage";
import MessageAcknowledgment from "./MessageAcknowledgment";
import { downloadVideoFromMessage } from "@/lib/download-utils";
import { COLORS, getGoldenAccent } from "@/lib/colors";

// Lazy load heavy modal
const MassMessageModal = dynamic(() => import("./MassMessageModal"), { ssr: false });

interface MobileMessagesPageProps {
  // Add props here if needed in the future
}

export default function MobileMessagesPage({}: MobileMessagesPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
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
  const conversationsListRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Handle mobile keyboard and viewport changes
  useEffect(() => {
    const handleResize = () => {
      // Scroll to bottom when keyboard appears/disappears
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get current user info
  const { data: currentUser } = trpc.user.getProfile.useQuery();

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

  // Format last message time for conversation list
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

  // Pagination state
  const [conversationsOffset, setConversationsOffset] = useState(0);
  const CONVERSATIONS_PER_PAGE = 20;
  const [allConversations, setAllConversations] = useState<any[]>([]);

  // Get conversations with pagination
  const {
    data: conversationsData,
    refetch: refetchConversations,
    isLoading: isLoadingConversations,
  } = trpc.messaging.getConversations.useQuery(
    { limit: CONVERSATIONS_PER_PAGE, offset: conversationsOffset },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  // Update conversations list when data changes
  useEffect(() => {
    if (conversationsData) {
      if (conversationsOffset === 0) {
        // First page - replace all
        setAllConversations(conversationsData.conversations);
      } else {
        // Subsequent pages - append
        setAllConversations(prev => [
          ...prev,
          ...conversationsData.conversations,
        ]);
      }
    }
  }, [conversationsData, conversationsOffset]);

  const conversations = allConversations;
  const hasMore = conversationsData?.hasMore || false;

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

  // Get unread counts with optimized caching
  const { data: unreadCountsObj = {} } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchInterval: false, // No automatic polling
      refetchOnWindowFocus: false, // Don't refetch on focus
      refetchOnReconnect: true, // Only refetch on reconnect
    });

  // Get messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } =
    trpc.messaging.getMessages.useQuery(
      { conversationId: selectedConversation! },
      {
        enabled: !!selectedConversation,
        refetchInterval: false, // No polling!
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
      }
    );

  // Optimized unread count with smart caching
  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchInterval: false, // No automatic polling
      refetchOnWindowFocus: false, // Don't refetch on focus
      refetchOnReconnect: true, // Only refetch on reconnect
    }
  );

  // Get coach's clients for conversation creation
  const { data: otherClients = [] } = trpc.clients.list.useQuery({
    archived: false,
    scope: "organization",
  });

  // Mutations
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation();

  const utils = trpc.useUtils();
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

  // Helper function to get the other user from a conversation
  const getOtherUser = (conversation: any, currentUserId: string) => {
    if (conversation.type === "COACH_CLIENT") {
      return conversation.coach?.id === currentUserId
        ? conversation.client
        : conversation.coach;
    } else if (conversation.type === "CLIENT_CLIENT") {
      return conversation.client1?.id === currentUserId
        ? conversation.client2
        : conversation.client1;
    }
    return null;
  };

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
      },
    });

  // Get current user for sidebar
  const { data: authData } = trpc.authCallback.useQuery();
  const sidebarUser = authData?.user;

  // Download video handler
  const handleDownloadVideo = async (messageId: string) => {
    try {
      const result = await downloadVideoFromMessage(messageId, trpc);
      if (!result.success) {
        console.error("Download failed:", result.error);
        // You could add a toast notification here
      }
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  // Don't auto-select conversations - let users choose from the list
  // useEffect(() => {
  //   if (!selectedConversation && conversations.length > 0) {
  //     setSelectedConversation(conversations[0].id);
  //   }
  // }, [conversations, selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
    }
  }, [messages]);

  // Auto-scroll when pending messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
    }
  }, [pendingMessages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim() && !selectedFile) return;

    const tempId = `temp-${Date.now()}`;
    const messageContent = messageText.trim();
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
        conversationId: selectedConversation!,
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

  const handleCreateConversation = (clientId: string) => {
    createConversationMutation.mutate({ clientId });
  };

  // Reset pagination when search term changes
  useEffect(() => {
    setConversationsOffset(0);
    setAllConversations([]);
  }, [searchTerm]);

  // Infinite scroll - load more when reaching bottom
  useEffect(() => {
    const triggerElement = loadMoreTriggerRef.current;
    if (!triggerElement || !hasMore || isLoadingConversations) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting && hasMore && !isLoadingConversations) {
          setConversationsOffset(prev => prev + CONVERSATIONS_PER_PAGE);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    observer.observe(triggerElement);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingConversations, conversations.length]);

  const filteredConversations = conversations.filter((conversation: any) => {
    if (!searchTerm) return true;

    const otherUser = getOtherUser(conversation, authData?.user?.id || "");
    if (!otherUser) return false;

    const otherUserName = otherUser.name || otherUser.email || "";
    return otherUserName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredClients = otherClients.filter((client: any) => {
    if (!clientSearchTerm) return true;
    const searchLower = clientSearchTerm.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.coach?.name?.toLowerCase().includes(searchLower) ||
      client.primaryCoach?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
    >
      {/* Mobile Header */}
      <div
        className="sticky top-0 z-50 border-b px-4 pb-3"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          paddingTop: `calc(0.75rem + env(safe-area-inset-top))`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-lg font-bold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Messages
            </h1>
            <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
              Chat with clients
            </p>
          </div>
          <div className="flex items-center gap-2">
            {otherClients.length > 0 && (
              <>
                <button
                  onClick={() => setShowMassMessageModal(true)}
                  className="flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 touch-manipulation active:scale-95"
                  style={{
                    backgroundColor: COLORS.GOLDEN_ACCENT,
                    color: "#000000",
                    minWidth: "44px",
                    minHeight: "44px",
                    padding: "0.5rem",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_HOVER;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor =
                      COLORS.GOLDEN_ACCENT;
                  }}
                  title="Mass Message"
                >
                  <Users className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 touch-manipulation active:scale-95"
                  style={{
                    backgroundColor: COLORS.GOLDEN_ACCENT,
                    color: "#000",
                    minWidth: "44px",
                    minHeight: "44px",
                    padding: "0.5rem",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_HOVER;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor =
                      COLORS.GOLDEN_ACCENT;
                  }}
                  title="New Message"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </>
            )}
            <MobileNavigation currentPage="messages" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Conversations List */}
        {!selectedConversation && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
                  style={{ color: COLORS.TEXT_MUTED }}
                />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 focus:outline-none focus:ring-2 transition-all duration-200 text-base"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    color: COLORS.TEXT_PRIMARY,
                    borderColor: COLORS.BORDER_SUBTLE,
                    minHeight: "48px",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD_HOVER;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD;
                  }}
                />
              </div>
            </div>

            {/* Conversations */}
            <div
              ref={conversationsListRef}
              className="flex-1 px-4 pb-4 overflow-y-auto"
            >
              <div className="space-y-1">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <File
                      className="h-16 w-16 mx-auto mb-4 opacity-50"
                      style={{ color: COLORS.TEXT_MUTED }}
                    />
                    <p
                      className="text-base"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {searchTerm
                        ? "No conversations found"
                        : "No conversations yet"}
                    </p>
                    <p
                      className="text-sm mt-2"
                      style={{ color: COLORS.TEXT_MUTED }}
                    >
                      Tap the + button to start a new conversation
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation: any) => {
                    const otherParticipant = getOtherUser(
                      conversation,
                      currentUser?.id || ""
                    );

                    const lastMessage = conversation.messages[0];
                    const unreadCount = unreadCountsObj[conversation.id] || 0;

                    return (
                      <div
                        key={conversation.id}
                        className="p-3 cursor-pointer transition-all duration-200 rounded-xl border touch-manipulation active:scale-[0.98]"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_CARD,
                          borderColor: COLORS.BORDER_SUBTLE,
                          minHeight: "56px",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.BACKGROUND_CARD_HOVER;
                          e.currentTarget.style.borderColor =
                            getGoldenAccent(0.2);
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.BACKGROUND_CARD;
                          e.currentTarget.style.borderColor =
                            COLORS.BORDER_SUBTLE;
                        }}
                        onClick={() => {
                          setSelectedConversation(conversation.id);
                          // Mark messages as read when conversation is opened
                          markAsReadMutation.mutate({
                            conversationId: conversation.id,
                          });
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <ProfilePictureUploader
                            currentAvatarUrl={
                              otherParticipant?.settings?.avatarUrl ||
                              otherParticipant?.avatar
                            }
                            userName={
                              otherParticipant?.name ||
                              otherParticipant?.email ||
                              "User"
                            }
                            onAvatarChange={() => {}}
                            size="sm"
                            readOnly={true}
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 max-w-full">
                            <div className="flex items-center justify-between mb-0.5">
                              <p
                                className="font-semibold truncate text-sm"
                                style={{ color: COLORS.TEXT_PRIMARY }}
                              >
                                {otherParticipant?.name ||
                                  otherParticipant?.email?.split("@")[0] ||
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {lastMessage && (
                                  <p
                                    className="text-xs truncate flex-1"
                                    style={{ color: COLORS.TEXT_SECONDARY }}
                                  >
                                    {lastMessage.content.length > 30
                                      ? `${lastMessage.content.substring(
                                          0,
                                          30
                                        )}...`
                                      : lastMessage.content}
                                  </p>
                                )}
                              </div>
                              {unreadCount > 0 && (
                                <span
                                  className="text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center flex-shrink-0 ml-2"
                                  style={{
                                    backgroundColor: COLORS.GOLDEN_ACCENT,
                                    color: "#000000",
                                  }}
                                >
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Infinite scroll trigger - visible loading indicator at bottom */}
                {hasMore && (
                  <div
                    ref={loadMoreTriggerRef}
                    className="h-24 flex items-center justify-center py-4"
                  >
                    <div className="flex flex-col items-center gap-2">
                      {isLoadingConversations ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div
                              className="animate-spin rounded-full h-4 w-4 border-b-2"
                              style={{
                                borderColor: `${COLORS.GOLDEN_ACCENT}40`,
                                borderTopColor: COLORS.GOLDEN_ACCENT,
                              }}
                            />
                            <span
                              className="text-sm font-medium"
                              style={{ color: COLORS.TEXT_SECONDARY }}
                            >
                              Loading more conversations...
                            </span>
                          </div>
                        </>
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          Scroll for more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Chat Area */}
        {selectedConversation && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Fixed Chat Header - Below Main Header */}
            <div
              className="fixed left-0 right-0 px-4 py-3 border-b flex items-center justify-between z-40"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                backgroundColor: COLORS.BACKGROUND_DARK,
                top: "calc(4rem + env(safe-area-inset-top))", // Below main header
              }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-1.5 rounded-full transition-all duration-200 touch-manipulation active:scale-95"
                  style={{
                    minWidth: "36px",
                    minHeight: "36px",
                    color: COLORS.TEXT_SECONDARY,
                  }}
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
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <ProfilePictureUploader
                  currentAvatarUrl={(() => {
                    const conversation = conversations.find(
                      (c: any) => c.id === selectedConversation
                    );
                    if (conversation) {
                      const otherUser = getOtherUser(
                        conversation,
                        currentUser?.id || ""
                      );
                      return (
                        otherUser?.settings?.avatarUrl || otherUser?.avatar
                      );
                    }
                    return undefined;
                  })()}
                  userName={(() => {
                    const conversation = conversations.find(
                      (c: any) => c.id === selectedConversation
                    );
                    if (conversation) {
                      const otherUser = getOtherUser(
                        conversation,
                        currentUser?.id || ""
                      );
                      return otherUser?.name || otherUser?.email || "User";
                    }
                    return "User";
                  })()}
                  onAvatarChange={() => {}}
                  size="sm"
                  readOnly={true}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-sm truncate"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {(() => {
                      const conversation = conversations.find(
                        (c: any) => c.id === selectedConversation
                      );
                      if (conversation) {
                        const otherUser = getOtherUser(
                          conversation,
                          currentUser?.id || ""
                        );
                        return (
                          otherUser?.name ||
                          otherUser?.email?.split("@")[0] ||
                          "Unknown"
                        );
                      }
                      return "Unknown";
                    })()}
                  </h3>
                </div>
              </div>
              <button
                className="p-1.5 rounded-full transition-all duration-200 touch-manipulation active:scale-95"
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
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 space-y-3"
              style={{
                paddingTop: "calc(8rem + env(safe-area-inset-top))", // Main header (4rem) + Chat header (4rem)
                paddingBottom:
                  "calc(6rem + 5.5rem + env(safe-area-inset-bottom))", // Space for input (6rem) + bottom nav (5.5rem) + safe area
              }}
            >
              {messages.map((message: any, index: number) => {
                const isCurrentUser = message.sender.id === currentUser?.id;
                // Check if this is a workout note message
                const isWorkoutNote =
                  message.content?.includes("📝 **Workout Note**") ||
                  message.content?.includes("📝 **Daily Workout Note**");
                const isFromClient = !isCurrentUser;

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

                    {/* Workout Note Header for client messages */}
                    {isWorkoutNote && isFromClient && (
                      <div className="w-full">
                        <div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                          style={{
                            backgroundColor: getGoldenAccent(0.1),
                            borderColor: getGoldenAccent(0.2),
                          }}
                        >
                          <span
                            className="font-medium text-sm"
                            style={{ color: COLORS.GOLDEN_ACCENT }}
                          >
                            📝 Workout Note
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: COLORS.TEXT_MUTED }}
                          >
                            from client
                          </span>
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex ${
                        isCurrentUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                          isCurrentUser
                            ? "rounded-br-md"
                            : isWorkoutNote && isFromClient
                            ? "rounded-bl-md border"
                            : "rounded-bl-md"
                        }`}
                        style={{
                          backgroundColor: isCurrentUser
                            ? COLORS.GOLDEN_ACCENT
                            : COLORS.BACKGROUND_CARD,
                          color: isCurrentUser
                            ? "#000000"
                            : COLORS.TEXT_PRIMARY,
                          ...(isWorkoutNote &&
                            isFromClient && {
                              borderColor: getGoldenAccent(0.3),
                            }),
                        }}
                      >
                        <div className="text-sm">
                          <FormattedMessage content={message.content} />
                        </div>

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
                          isOwnMessage={isCurrentUser}
                          messageData={
                            message.data as
                              | { type?: string; swapRequestId?: string }
                              | undefined
                          }
                        />

                        {message.attachmentUrl && (
                          <div className="mt-2">
                            {message.attachmentType?.startsWith("image/") ? (
                              <img
                                src={message.attachmentUrl}
                                alt="Attachment"
                                className="max-w-full rounded-lg"
                              />
                            ) : message.attachmentType?.startsWith("video/") ? (
                              <div className="space-y-2">
                                <div className="relative">
                                  <video
                                    src={message.attachmentUrl}
                                    controls
                                    className="max-w-full rounded-lg"
                                    style={{ maxHeight: "200px" }}
                                    preload="metadata"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                  {/* Download button for coaches */}
                                  {authData?.user?.role === "COACH" && (
                                    <button
                                      onClick={() =>
                                        handleDownloadVideo(message.id)
                                      }
                                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                                      title="Download video"
                                    >
                                      <Download className="h-3 w-3 text-white" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <a
                                href={message.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm underline"
                              >
                                <File className="h-4 w-4" />
                                {message.attachmentName || "Attachment"}
                              </a>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-2">
                          <span
                            className="text-xs"
                            style={{
                              color: isCurrentUser
                                ? "rgba(0, 0, 0, 0.7)"
                                : COLORS.TEXT_MUTED,
                            }}
                          >
                            {formatMessageTime(
                              new Date(message.createdAt),
                              showDateOnFirstMessage
                            )}
                          </span>
                          {isCurrentUser && (
                            <CheckCheck
                              className="h-3 w-3"
                              style={{
                                color: message.isRead
                                  ? "rgba(0, 0, 0, 0.6)"
                                  : "rgba(0, 0, 0, 0.4)",
                              }}
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
                <div key={pendingMessage.id} className="flex justify-end">
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl rounded-br-md ${
                      pendingMessage.status === "failed" ? "opacity-60" : ""
                    }`}
                    style={{
                      backgroundColor: COLORS.GOLDEN_ACCENT,
                      color: "#000000",
                    }}
                  >
                    <div className="text-sm">
                      <FormattedMessage content={pendingMessage.content} />
                    </div>
                    {pendingMessage.attachmentUrl && (
                      <div className="mt-2">
                        {pendingMessage.attachmentType?.startsWith("image/") ? (
                          <img
                            src={pendingMessage.attachmentUrl}
                            alt="Attachment"
                            className="max-w-full rounded-lg"
                          />
                        ) : pendingMessage.attachmentType?.startsWith(
                            "video/"
                          ) ? (
                          <div className="relative">
                            <video
                              src={pendingMessage.attachmentUrl}
                              controls
                              className="max-w-full rounded-lg"
                              style={{ maxHeight: "200px" }}
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            <File className="h-4 w-4" />
                            {pendingMessage.attachmentName || "Attachment"}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <span
                        className="text-xs"
                        style={{ color: "rgba(0, 0, 0, 0.7)" }}
                      >
                        {format(pendingMessage.timestamp, "h:mm a")}
                      </span>
                      <div className="flex items-center">
                        {pendingMessage.status === "sending" && (
                          <div className="flex items-center gap-1">
                            <div
                              className="w-1 h-1 rounded-full animate-pulse"
                              style={{
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                              }}
                            />
                            <div
                              className="w-1 h-1 rounded-full animate-pulse"
                              style={{
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                animationDelay: "0.2s",
                              }}
                            />
                            <div
                              className="w-1 h-1 rounded-full animate-pulse"
                              style={{
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                animationDelay: "0.4s",
                              }}
                            />
                          </div>
                        )}
                        {pendingMessage.status === "sent" && (
                          <CheckCheck
                            className="h-3 w-3"
                            style={{ color: "rgba(0, 0, 0, 0.6)" }}
                          />
                        )}
                        {pendingMessage.status === "failed" && (
                          <div
                            className="w-3 h-3 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: COLORS.RED_ALERT }}
                          >
                            <span
                              className="text-xs font-bold"
                              style={{ color: "#ffffff" }}
                            >
                              !
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {/* Fixed Message Input - iOS Style */}
            <div
              className="fixed left-0 right-0 px-4 py-3 flex-shrink-0 z-50"
              style={{
                borderTop: `1px solid ${COLORS.BORDER_SUBTLE}`,
                backgroundColor: COLORS.BACKGROUND_DARK, // Use design system background
                bottom: "calc(5rem + env(safe-area-inset-bottom))", // Position exactly above bottom navigation
                borderBottom: "none", // Remove bottom border for seamless connection
                boxShadow: "none", // Remove any shadow that might create separation
              }}
            >
              <RichMessageInput
                value={messageText}
                onChange={setMessageText}
                onSend={() => handleSendMessage()}
                onFileUpload={() => setShowFileUpload(true)}
                placeholder="Type a message..."
                disabled={false}
                isPending={sendMessageMutation.isPending}
                selectedFile={selectedFile}
                onRemoveFile={() => setSelectedFile(null)}
              />
            </div>
          </div>
        )}

        {/* Create Conversation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className="rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden border"
              style={{
                backgroundColor: COLORS.BACKGROUND_DARK,
                borderColor: COLORS.BORDER_SUBTLE,
                boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px ${getGoldenAccent(
                  0.1
                )}`,
              }}
            >
              <div
                className="p-6 border-b"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="text-xl font-semibold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Start New Conversation
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 rounded-lg transition-all duration-200 touch-manipulation"
                    style={{
                      color: COLORS.TEXT_SECONDARY,
                      minWidth: "44px",
                      minHeight: "44px",
                    }}
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
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                      style={{ color: COLORS.TEXT_MUTED }}
                    />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={clientSearchTerm}
                      onChange={e => setClientSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 transition-all duration-200"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        color: COLORS.TEXT_PRIMARY,
                        borderColor: COLORS.BORDER_SUBTLE,
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor =
                          getGoldenAccent(0.3);
                        e.currentTarget.style.backgroundColor =
                          COLORS.BACKGROUND_CARD_HOVER;
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor =
                          COLORS.BORDER_SUBTLE;
                        e.currentTarget.style.backgroundColor =
                          COLORS.BACKGROUND_CARD;
                      }}
                    />
                  </div>
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
                    filteredClients.map((client: any) => (
                      <button
                        key={client.id}
                        onClick={() => handleCreateConversation(client.id)}
                        disabled={createConversationMutation.isPending}
                        className="w-full p-3 border-b cursor-pointer transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        style={{
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.TEXT_PRIMARY,
                          minHeight: "44px",
                        }}
                        onMouseEnter={e => {
                          if (!createConversationMutation.isPending) {
                            e.currentTarget.style.backgroundColor =
                              COLORS.BACKGROUND_CARD_HOVER;
                            e.currentTarget.style.borderColor =
                              getGoldenAccent(0.2);
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.borderColor =
                            COLORS.BORDER_SUBTLE;
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
                                  className="text-xs px-2 py-1 rounded-full border"
                                  style={{
                                    backgroundColor: getGoldenAccent(0.2),
                                    color: COLORS.GOLDEN_ACCENT,
                                    borderColor: getGoldenAccent(0.3),
                                  }}
                                >
                                  No Account
                                </span>
                              )}
                            </div>
                            {(client.primaryCoach?.name ||
                              client.coach?.name) && (
                              <p
                                className="text-xs mt-1"
                                style={{ color: COLORS.TEXT_MUTED }}
                              >
                                Assigned Coach:{" "}
                                {client.primaryCoach?.name ||
                                  client.coach?.name}
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
      </div>
      <MobileBottomNavigation />
    </div>
  );
}
