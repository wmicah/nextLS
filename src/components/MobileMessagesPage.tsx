"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import MobileNavigation from "./MobileNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";
import { format } from "date-fns";
import MessageFileUpload from "./MessageFileUpload";
import ProfilePictureUploader from "./ProfilePictureUploader";
import RichMessageInput from "./RichMessageInput";
import FormattedMessage from "./FormattedMessage";
import MessageAcknowledgment from "./MessageAcknowledgment";
import { downloadVideoFromMessage } from "@/lib/download-utils";

interface MobileMessagesPageProps {
  // Add props here if needed in the future
}

export default function MobileMessagesPage({}: MobileMessagesPageProps) {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  // Get conversations with optimized caching
  const { data: conversations = [], refetch: refetchConversations } =
    trpc.messaging.getConversations.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchInterval: false, // No automatic polling
      refetchOnWindowFocus: false, // Don't refetch on focus
      refetchOnReconnect: true, // Only refetch on reconnect
    });

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
  const { data: otherClients = [] } = trpc.clients.list.useQuery();

  // Mutations
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation();

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-scroll when pending messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      client.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-[#2A3133] border-b border-[#606364] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Messages</h1>
              <p className="text-xs text-gray-400">Chat with clients</p>
            </div>
          </div>
          <MobileNavigation currentPage="messages" />
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
                  style={{ color: "#ABA4AA" }}
                />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 focus:outline-none focus:ring-2 transition-all duration-200 text-base"
                  style={{
                    backgroundColor: "#353A3A",
                    color: "#C3BCC2",
                    borderColor: "#606364",
                    minHeight: "48px",
                  }}
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 px-4 pb-4 overflow-y-auto">
              <div className="space-y-1">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <File
                      className="h-16 w-16 mx-auto mb-4 opacity-50"
                      style={{ color: "#ABA4AA" }}
                    />
                    <p className="text-base" style={{ color: "#ABA4AA" }}>
                      {searchTerm
                        ? "No conversations found"
                        : "No conversations yet"}
                    </p>
                    <p className="text-sm mt-2" style={{ color: "#ABA4AA" }}>
                      Tap the + button to start a new conversation
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation: any) => {
                    const otherParticipant = getOtherUser(
                      conversation,
                      currentUser?.id || ""
                    );
                    const conversationType =
                      conversation.type === "CLIENT_CLIENT"
                        ? "Client"
                        : "Coach";

                    const lastMessage = conversation.messages[0];
                    const unreadCount = unreadCountsObj[conversation.id] || 0;

                    return (
                      <div
                        key={conversation.id}
                        className="p-4 cursor-pointer transition-all duration-200 rounded-2xl border touch-manipulation active:scale-[0.98]"
                        style={{
                          backgroundColor: "#353A3A",
                          borderColor: "#606364",
                          minHeight: "72px",
                        }}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <div className="flex items-center gap-4">
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
                            size="lg"
                            readOnly={true}
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 max-w-full">
                            <div className="flex items-center justify-between mb-1">
                              <p
                                className="font-semibold truncate text-base"
                                style={{ color: "#C3BCC2" }}
                              >
                                {otherParticipant?.name ||
                                  otherParticipant?.email?.split("@")[0] ||
                                  "Unknown"}
                              </p>
                              {lastMessage && (
                                <span
                                  className="text-xs flex-shrink-0 ml-2"
                                  style={{ color: "#ABA4AA" }}
                                >
                                  {format(
                                    new Date(lastMessage.createdAt),
                                    "HH:mm"
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span
                                  className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      conversation.type === "CLIENT_CLIENT"
                                        ? "#4A5A70"
                                        : "#E0E0E0",
                                    color:
                                      conversation.type === "CLIENT_CLIENT"
                                        ? "#C3BCC2"
                                        : "#000000",
                                  }}
                                >
                                  {conversationType}
                                </span>
                                {lastMessage && (
                                  <p
                                    className="text-sm truncate flex-1"
                                    style={{ color: "#ABA4AA" }}
                                  >
                                    {lastMessage.content.length > 20
                                      ? `${lastMessage.content.substring(
                                          0,
                                          20
                                        )}...`
                                      : lastMessage.content}
                                  </p>
                                )}
                              </div>
                              {unreadCount > 0 && (
                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[24px] text-center flex-shrink-0 ml-2">
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
              </div>
            </div>
          </div>
        )}

        {/* Mobile Chat Area */}
        {selectedConversation && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Fixed Chat Header - Below Main Header */}
            <div
              className="fixed top-16 left-0 right-0 px-4 py-2 border-b flex items-center justify-between z-40"
              style={{ borderColor: "#606364", backgroundColor: "#353A3A" }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-1.5 rounded-full hover:bg-gray-800 transition-colors touch-manipulation active:scale-95"
                  style={{ minWidth: "36px", minHeight: "36px" }}
                >
                  <ArrowLeft className="h-4 w-4" style={{ color: "#C3BCC2" }} />
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
                    style={{ color: "#C3BCC2" }}
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
                  <p className="text-xs" style={{ color: "#ABA4AA" }}>
                    {(() => {
                      const conversation = conversations.find(
                        (c: { id: string; type: string }) =>
                          c.id === selectedConversation
                      );
                      return conversation?.type === "CLIENT_CLIENT"
                        ? "Client"
                        : "Coach";
                    })()}
                  </p>
                </div>
              </div>
              <button className="p-1.5 rounded-full hover:bg-gray-800 transition-colors touch-manipulation active:scale-95">
                <MoreVertical
                  className="h-4 w-4"
                  style={{ color: "#ABA4AA" }}
                />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 pt-20 pb-24 space-y-3">
              {messages.map((message: any) => {
                const isCurrentUser = message.sender.id === currentUser?.id;
                // Check if this is a workout note message
                const isWorkoutNote =
                  message.content?.includes("📝 **Workout Note**") ||
                  message.content?.includes("📝 **Daily Workout Note**");
                const isFromClient = !isCurrentUser;

                return (
                  <div key={message.id} className="space-y-2">
                    {/* Workout Note Header for client messages */}
                    {isWorkoutNote && isFromClient && (
                      <div className="w-full">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
                          <span className="text-blue-400 font-medium text-sm">
                            📝 Workout Note
                          </span>
                          <span className="text-gray-400 text-xs">
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
                            ? "bg-blue-500 text-white rounded-br-md"
                            : isWorkoutNote && isFromClient
                            ? "bg-gray-700 text-gray-100 rounded-bl-md border border-blue-400"
                            : "bg-gray-700 text-gray-100 rounded-bl-md"
                        }`}
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
                                {/* Annotation button */}
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
                                      fileSize: message.attachmentSize || 0,
                                    });
                                  }}
                                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
                            className={`text-xs ${
                              isCurrentUser ? "text-blue-100" : "text-gray-400"
                            }`}
                          >
                            {format(new Date(message.createdAt), "h:mm a")}
                          </span>
                          {isCurrentUser && (
                            <CheckCheck
                              className={`h-3 w-3 ${
                                message.isRead
                                  ? "text-blue-300"
                                  : "text-gray-400"
                              }`}
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
                    className={`max-w-[85%] px-4 py-3 rounded-2xl bg-blue-500 text-white ${
                      pendingMessage.status === "failed" ? "opacity-60" : ""
                    }`}
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
                      <span className="text-xs text-blue-100">
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
                          <CheckCheck className="h-3 w-3 text-blue-200" />
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

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {/* Fixed Message Input - iOS Style */}
            <div
              className="fixed bottom-20 left-0 right-0 px-4 py-3 border-t flex-shrink-0 z-40"
              style={{ borderColor: "#606364", backgroundColor: "#353A3A" }}
            >
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
          </div>
        )}

        {/* Create Conversation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="p-6 border-b" style={{ borderColor: "#606364" }}>
                <div className="flex items-center justify-between">
                  <h3
                    className="text-xl font-semibold"
                    style={{ color: "#C3BCC2" }}
                  >
                    Start New Conversation
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors touch-manipulation"
                    style={{
                      color: "#ABA4AA",
                      minWidth: "44px",
                      minHeight: "44px",
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
                      style={{ color: "#ABA4AA" }}
                    />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={clientSearchTerm}
                      onChange={e => setClientSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 transition-all duration-200"
                      style={{
                        backgroundColor: "#2A3133",
                        color: "#C3BCC2",
                        borderColor: "#606364",
                      }}
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm" style={{ color: "#ABA4AA" }}>
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
                          borderColor: "#606364",
                          color: "#C3BCC2",
                          minHeight: "44px",
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
                              style={{ color: "#C3BCC2" }}
                            >
                              {client.name ||
                                client.email?.split("@")[0] ||
                                "Unknown"}
                            </p>
                            <div className="flex items-center gap-2">
                              <p
                                className="text-sm"
                                style={{ color: "#ABA4AA" }}
                              >
                                {client.email || "No email"}
                              </p>
                              {!client.userId && (
                                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                  No Account
                                </span>
                              )}
                            </div>
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
      </div>
      <MobileBottomNavigation />
    </div>
  );
}
