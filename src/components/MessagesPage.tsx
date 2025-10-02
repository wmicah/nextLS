"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import Sidebar from "./Sidebar";
import { format } from "date-fns";
import MessageFileUpload from "./MessageFileUpload";
import ProfilePictureUploader from "./ProfilePictureUploader";
import RichMessageInput from "./RichMessageInput";
import FormattedMessage from "./FormattedMessage";
import MessageAcknowledgment from "./MessageAcknowledgment";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileMessagesPage from "./MobileMessagesPage";
// Removed complex SSE hooks - using simple polling instead

interface MessagesPageProps {
  // Add props here if needed in the future
}

function MessagesPage({}: MessagesPageProps) {
  // const router = useRouter()
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  // const [isTyping, setIsTyping] = useState(false)
  // const [showEmojiPicker, setShowEmojiPicker] = useState(false)
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
  // const fileInputRef = useRef<HTMLInputElement>(null)

  // Get current user info
  const { data: currentUser } = trpc.user.getProfile.useQuery();

  // Simple polling for unread count
  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 10000, // Poll every 10 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  // Get conversations with aggressive caching
  const { data: conversations = [], refetch: refetchConversations } =
    trpc.messaging.getConversations.useQuery(undefined, {
      refetchInterval: 60000, // Poll every minute
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30 * 1000, // Cache for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    });

  // Get unread counts separately for better performance
  const { data: unreadCountsObj = {} } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      refetchInterval: 10000, // Poll every 10 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 10 * 1000, // Cache for 10 seconds
    });

  const { data: messages = [], refetch: refetchMessages } =
    trpc.messaging.getMessages.useQuery(
      { conversationId: selectedConversation! },
      {
        enabled: !!selectedConversation,
        refetchInterval: 15000, // Poll every 15 seconds when viewing messages
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      }
    );

  // Get clients for conversation creation
  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  // Mutations
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation();

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
  const filteredConversations = conversations.filter(conversation => {
    const otherUser = getOtherUser(conversation);
    if (!otherUser) return false;

    const searchLower = searchTerm.toLowerCase();
    return (
      otherUser.name?.toLowerCase().includes(searchLower) ||
      otherUser.email?.toLowerCase().includes(searchLower) ||
      conversation.messages[0]?.content.toLowerCase().includes(searchLower)
    );
  });

  // Filter clients for conversation creation
  const filteredClients = clients.filter(client => {
    const searchLower = clientSearchTerm.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Sidebar>
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        {/* Simple Header */}
        <div className="p-4 border-b" style={{ borderColor: "#374151" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#C3BCC2" }}>
                Messages
              </h1>
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "#ABA4AA" }}
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
                    <span className="font-medium" style={{ color: "#4A5A70" }}>
                      {unreadCount} unread
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: "#4A5A70", color: "#ffffff" }}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              New Message
            </button>
          </div>
        </div>

        {/* Messages Interface */}
        <div
          className="flex h-[calc(100vh-40px)] rounded-2xl border overflow-hidden shadow-xl"
          style={{
            backgroundColor: "#1E1E1E",
            borderColor: "#374151",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Conversations Sidebar */}
          <div
            className="w-80 border-r flex flex-col"
            style={{ borderColor: "#374151", backgroundColor: "#1A1A1A" }}
          >
            {/* Compact Header with Search */}
            <div className="p-3 border-b" style={{ borderColor: "#374151" }}>
              <div className="mb-3">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: "#ffffff" }}
                >
                  Messages
                </h2>
              </div>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: "#6b7280" }}
                />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm transition-all duration-200"
                  style={{
                    backgroundColor: "#2a2a2a",
                    borderColor: "#374151",
                    color: "#f9fafb",
                    border: "1px solid",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#4A5A70";
                    e.currentTarget.style.backgroundColor = "#1E1E1E";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px rgba(74, 90, 112, 0.1)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "#374151";
                    e.currentTarget.style.backgroundColor = "#2a2a2a";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Conversations List - No Scroll */}
            <div className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center">
                  <div
                    className="h-8 w-8 mx-auto mb-2 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#374151", color: "#ABA4AA" }}
                  >
                    <File className="h-4 w-4" />
                  </div>
                  <p className="text-xs" style={{ color: "#ABA4AA" }}>
                    {searchTerm
                      ? "No conversations found"
                      : "No conversations yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.slice(0, 8).map(conversation => {
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
                          isSelected ? "bg-[#4A5A70]/20" : "hover:bg-[#2a2a2a]"
                        }`}
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
                                  backgroundColor: "#4A5A70",
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
                                  color: isSelected ? "#ffffff" : "#f9fafb",
                                }}
                              >
                                {otherUser?.name ||
                                  otherUser?.email?.split("@")[0] ||
                                  "Unknown"}
                              </p>
                              {lastMessage && (
                                <span
                                  className="text-xs flex-shrink-0 ml-2"
                                  style={{ color: "#ABA4AA" }}
                                >
                                  {formatLastMessageTime(lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-xs truncate ${
                                unreadCount > 0 ? "font-medium" : ""
                              }`}
                              style={{
                                color: unreadCount > 0 ? "#ffffff" : "#6b7280",
                              }}
                            >
                              {lastMessage?.content || "No messages yet"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredConversations.length > 8 && (
                    <div className="p-3 text-center">
                      <p className="text-xs" style={{ color: "#6b7280" }}>
                        +{filteredConversations.length - 8} more conversations
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className="flex-1 flex flex-col"
            style={{ backgroundColor: "#1E1E1E" }}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div
                  className="p-6 border-b flex items-center justify-between"
                  style={{ borderColor: "#2a2a2a" }}
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
                            style={{ color: "#ffffff" }}
                          >
                            {getOtherUser(currentConversation)?.name ||
                              getOtherUser(currentConversation)?.email?.split(
                                "@"
                              )[0] ||
                              "Unknown"}
                          </p>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "#9ca3af" }}
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
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div
                        className="h-8 w-8 mx-auto mb-3 opacity-50"
                        style={{ color: "#ABA4AA" }}
                      >
                        <File className="h-8 w-8" />
                      </div>
                      <p className="text-sm" style={{ color: "#ABA4AA" }}>
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message: any) => {
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

                        return (
                          <div
                            key={message.id}
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
                                    ? "#4A5A70"
                                    : isWorkoutNote && isFromClient
                                    ? "#1f2937"
                                    : "#374151",
                                color: "#f9fafb",
                                border:
                                  isWorkoutNote && isFromClient
                                    ? "1px solid #3b82f6"
                                    : "none",
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
                                  style={{ color: "#ABA4AA" }}
                                >
                                  {format(
                                    new Date(message.createdAt),
                                    "h:mm a"
                                  )}
                                </span>
                                {message.sender.id === currentUser?.id && (
                                  <CheckCheck
                                    className="h-3 w-3"
                                    style={{ color: "#ABA4AA" }}
                                  />
                                )}
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
                              backgroundColor: "#374151",
                              color: "#f9fafb",
                              border: "1px solid #6b7280",
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
                                style={{ color: "#ABA4AA" }}
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
                                    style={{ color: "#ABA4AA" }}
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
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div
                  className="p-6 border-t"
                  style={{ borderColor: "#2a2a2a" }}
                >
                  {/* Selected File Indicator */}
                  {selectedFile && (
                    <div
                      className="mb-3 p-3 rounded-lg flex items-center justify-between"
                      style={{ backgroundColor: "#2a2a2a" }}
                    >
                      <div className="flex items-center gap-2">
                        {selectedFile.file.type.startsWith("image/") ? (
                          <ImageIcon
                            className="h-4 w-4"
                            style={{ color: "#4A5A70" }}
                          />
                        ) : selectedFile.file.type.startsWith("video/") ? (
                          <Video
                            className="h-4 w-4"
                            style={{ color: "#4A5A70" }}
                          />
                        ) : (
                          <File
                            className="h-4 w-4"
                            style={{ color: "#4A5A70" }}
                          />
                        )}
                        <span className="text-sm" style={{ color: "#f9fafb" }}>
                          {selectedFile.file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1 rounded transition-colors"
                        style={{ color: "#ABA4AA" }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#3A4040";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent";
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
                    style={{ backgroundColor: "#374151", color: "#ABA4AA" }}
                  >
                    <File className="h-6 w-6" />
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: "#C3BCC2" }}
                  >
                    Select a conversation
                  </h3>
                  <p className="text-sm" style={{ color: "#ABA4AA" }}>
                    Choose a conversation from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Conversation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
              className="rounded-xl p-6 w-full max-w-md mx-4"
              style={{
                backgroundColor: "#1A1A1A",
                borderColor: "#374151",
                border: "1px solid",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl font-semibold"
                  style={{ color: "#ffffff" }}
                >
                  Start New Conversation
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setClientSearchTerm("");
                  }}
                  className="p-2 rounded-lg transition-colors hover:bg-[#374151]"
                  style={{ color: "#ABA4AA" }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative mb-6">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: "#6b7280" }}
                />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={clientSearchTerm}
                  onChange={e => setClientSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm transition-all duration-200"
                  style={{
                    backgroundColor: "#2a2a2a",
                    borderColor: "#374151",
                    color: "#f9fafb",
                    border: "1px solid",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#4A5A70";
                    e.currentTarget.style.backgroundColor = "#1E1E1E";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px rgba(74, 90, 112, 0.1)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "#374151";
                    e.currentTarget.style.backgroundColor = "#2a2a2a";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
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
                  filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => handleCreateConversation(client.id)}
                      disabled={createConversationMutation.isPending}
                      className="w-full p-3 border-b cursor-pointer transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                      onMouseEnter={e => {
                        if (!createConversationMutation.isPending) {
                          e.currentTarget.style.backgroundColor = "#3A4040";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!createConversationMutation.isPending) {
                          e.currentTarget.style.backgroundColor = "transparent";
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
                            style={{ color: "#C3BCC2" }}
                          >
                            {client.name ||
                              client.email?.split("@")[0] ||
                              "Unknown"}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm" style={{ color: "#ABA4AA" }}>
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
        )}

        {/* File Upload Modal */}
        {showFileUpload && (
          <MessageFileUpload
            onFileSelect={handleFileSelect}
            onClose={() => setShowFileUpload(false)}
          />
        )}
      </div>
    </Sidebar>
  );
}

export default withMobileDetection(MobileMessagesPage, MessagesPage);
