"use client";

import { useState, useEffect, useRef } from "react";
// import { useRouter } from "next/navigation"
import { trpc } from "@/app/_trpc/client";
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  File,
  CheckCheck,
  ArrowLeft,
  Music,
} from "lucide-react";
import ClientTopNav from "./ClientTopNav";
import { format } from "date-fns";
import MessageFileUpload from "./MessageFileUpload";
import ProfilePictureUploader from "./ProfilePictureUploader";
import RichMessageInput from "./RichMessageInput";
import FormattedMessage from "./FormattedMessage";
import MessageAcknowledgment from "./MessageAcknowledgment";
import SwitchRequestMessage from "./SwapRequestMessage";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileClientMessagesPage from "./MobileClientMessagesPage";
// Removed complex SSE hooks - using simple polling instead

interface ClientMessagesPageProps {
  // Add props here if needed in the future
}

function ClientMessagesPage({}: ClientMessagesPageProps) {
  // const router = useRouter()
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  // const [isTyping, setIsTyping] = useState(false)
  // const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    uploadData: {
      attachmentUrl: string;
      attachmentType: string;
      attachmentName: string;
      attachmentSize: number;
    };
  } | null>(null);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const fileInputRef = useRef<HTMLInputElement>(null)

  // Get current user info
  const { data: currentUser } = trpc.user.getProfile.useQuery();
  const utils = trpc.useUtils();

  // Get conversations
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

  // Simple polling for unread count
  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 10000, // Poll every 10 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  // Get other clients for conversation creation (clients with same coach)
  const { data: otherClients = [] } = trpc.clients.getOtherClients.useQuery();

  // Mutations
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation();

  // Helper function to get the other user from a conversation with privacy controls
  const getOtherUser = (conversation: any, currentUserId: string) => {
    if (conversation.type === "COACH_CLIENT") {
      return conversation.coach?.id === currentUserId
        ? conversation.client
        : conversation.coach;
    } else if (conversation.type === "CLIENT_CLIENT") {
      // For client-to-client conversations, anonymize the other client's info
      const otherClient =
        conversation.client1?.id === currentUserId
          ? conversation.client2
          : conversation.client1;

      if (otherClient) {
        return {
          ...otherClient,
          name: "Client", // Anonymize name
          email: "client@example.com", // Anonymize email
          settings: {
            ...otherClient.settings,
            avatarUrl: null, // Remove avatar for privacy
          },
          avatar: null, // Remove avatar for privacy
        };
      }
      return otherClient;
    }
    return null;
  };

  // Get current user for sidebar
  const { data: authData } = trpc.authCallback.useQuery();
  const sidebarUser = authData?.user;

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

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

    // Check if this is a client-to-client conversation
    const conversation = conversations.find(
      (c: any) => c.id === selectedConversation
    );
    if (conversation?.type === "CLIENT_CLIENT") {
      // Prevent sending messages in client-to-client conversations
      return;
    }

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

  const filteredConversations = conversations.filter((conversation: any) => {
    if (!searchTerm) return true;

    const otherUser = getOtherUser(conversation, authData?.user?.id || "");
    if (!otherUser) return false;

    const otherUserName = otherUser.name || otherUser.email || "";
    return otherUserName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <ClientTopNav>
      <div
        className="min-h-screen px-4 sm:px-6 lg:px-8 pt-6"
        style={{ backgroundColor: "#2A3133" }}
      >
        {/* Hero Header */}
        <div className="mb-8">
          <div className="rounded-2xl border relative overflow-hidden group">
            <div
              className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
              }}
            />
            <div className="relative p-8 bg-gradient-to-r from-transparent via-black/20 to-black/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h1
                      className="text-4xl font-bold mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Messages
                    </h1>
                    <div
                      className="flex items-center gap-2 text-lg"
                      style={{ color: "#ABA4AA" }}
                    >
                      <div className="h-5 w-5 rounded-full bg-gray-500 flex items-center justify-center">
                        <File className="h-3 w-3 text-white" />
                      </div>
                      <span>
                        {conversations.length > 0
                          ? `Stay connected with ${conversations.length} ${
                              conversations.length === 1
                                ? "conversation"
                                : "conversations"
                            }`
                          : "Start building relationships with your coach and teammates"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : "All caught up"}
                  </div>
                  <div className="text-sm" style={{ color: "#ABA4AA" }}>
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Interface */}
        <div
          className="flex h-[calc(100vh-200px)] rounded-2xl border overflow-hidden shadow-xl"
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
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: "#374151" }}>
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: "#ffffff" }}
                >
                  Conversations
                </h2>
              </div>

              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: "#ABA4AA" }}
                />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    backgroundColor: "#353A3A",
                    color: "#C3BCC2",
                    borderColor: "#606364",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#4A5A70";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "#606364";
                  }}
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <File
                    className="h-12 w-12 mx-auto mb-4 opacity-50"
                    style={{ color: "#ABA4AA" }}
                  />
                  <p className="text-sm" style={{ color: "#ABA4AA" }}>
                    {searchTerm
                      ? "No conversations found"
                      : "No conversations yet"}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation: any) => {
                  const otherParticipant = getOtherUser(
                    conversation,
                    currentUser?.id || ""
                  );
                  const conversationType =
                    conversation.type === "CLIENT_CLIENT" ? "Client" : "Coach";

                  const lastMessage = conversation.messages[0];
                  const unreadCount = unreadCountsObj[conversation.id] || 0;

                  return (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer transition-all duration-200 border-b ${
                        selectedConversation === conversation.id
                          ? "bg-gray-800/50 border-gray-600"
                          : "border-gray-700 hover:bg-gray-800/30"
                      }`}
                      onClick={() => setSelectedConversation(conversation.id)}
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
                          size="md"
                          readOnly={true}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p
                              className="font-medium truncate"
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
                                  "h:mm a"
                                )}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs px-2 py-1 rounded-full"
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
                                  className="text-sm truncate"
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
                              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
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

          {/* Chat Area */}
          <div
            className="flex-1 flex flex-col"
            style={{ backgroundColor: "#1E1E1E" }}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div
                  className="p-6 border-b"
                  style={{ borderColor: "#2a2a2a" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                              otherUser?.settings?.avatarUrl ||
                              otherUser?.avatar
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
                            return (
                              otherUser?.name || otherUser?.email || "User"
                            );
                          }
                          return "User";
                        })()}
                        onAvatarChange={() => {}}
                        size="md"
                        readOnly={true}
                        className="flex-shrink-0"
                      />
                      <div>
                        <h3
                          className="font-semibold"
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
                        <p className="text-sm" style={{ color: "#ABA4AA" }}>
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
                    <div className="flex items-center gap-2"></div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message: any) => {
                    const isCurrentUser = message.sender.id === currentUser?.id;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isCurrentUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`${
                            isCurrentUser
                              ? "max-w-md lg:max-w-2xl xl:max-w-3xl"
                              : "max-w-xs lg:max-w-lg xl:max-w-xl"
                          } px-4 py-3 rounded-2xl ${
                            isCurrentUser ? "rounded-br-sm" : "rounded-bl-sm"
                          }`}
                          style={{
                            backgroundColor: isCurrentUser
                              ? "#3B82F6"
                              : "#374151",
                            color: "#ffffff",
                            border: "1px solid",
                            borderColor: isCurrentUser ? "#2563EB" : "#4B5563",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          {message.content && (
                            <div className="text-sm mb-2">
                              <FormattedMessage content={message.content} />
                            </div>
                          )}

                          {message.data &&
                            (message.data.type === "SWAP_REQUEST" ||
                              message.data.type === "SWAP_CANCELLATION" ||
                              message.data.type === "SWAP_APPROVAL" ||
                              message.data.type === "SWAP_DECLINE") && (
                              <div className="text-sm">
                                <SwitchRequestMessage
                                  message={message}
                                  onResponse={() => {
                                    // Refresh conversations after swap response
                                    utils.messaging.getConversations.invalidate();
                                  }}
                                />
                              </div>
                            )}

                          {/* Message Acknowledgment - Skip for swap request messages */}
                          {!(
                            message.data &&
                            (message.data.type === "SWAP_REQUEST" ||
                              message.data.type === "SWAP_CANCELLATION" ||
                              message.data.type === "SWAP_APPROVAL" ||
                              message.data.type === "SWAP_DECLINE")
                          ) && (
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
                          )}

                          {/* File Attachment */}
                          {message.attachmentUrl && (
                            <div className="mb-2">
                              {message.attachmentType?.startsWith("image/") ? (
                                <div className="relative group">
                                  <img
                                    src={message.attachmentUrl}
                                    alt={message.attachmentName || "Image"}
                                    className="max-w-full rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                                    style={{ maxHeight: "300px" }}
                                    onClick={() =>
                                      message.attachmentUrl &&
                                      window.open(
                                        message.attachmentUrl,
                                        "_blank"
                                      )
                                    }
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="text-white text-sm font-medium">
                                      Click to view
                                    </span>
                                  </div>
                                </div>
                              ) : message.attachmentType?.startsWith(
                                  "video/"
                                ) ? (
                                <div className="relative group">
                                  <video
                                    src={message.attachmentUrl}
                                    controls
                                    className="max-w-full rounded-xl"
                                    style={{ maxHeight: "300px" }}
                                    preload="metadata"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              ) : (
                                <a
                                  href={message.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                                  style={{
                                    backgroundColor: isCurrentUser
                                      ? "#1E40AF"
                                      : "#2A3133",
                                    color: "#ffffff",
                                    border: "1px solid",
                                    borderColor: isCurrentUser
                                      ? "#1D4ED8"
                                      : "#606364",
                                  }}
                                >
                                  {message.attachmentType?.startsWith(
                                    "audio/"
                                  ) ? (
                                    <Music className="h-5 w-5" />
                                  ) : message.attachmentType?.startsWith(
                                      "application/pdf"
                                    ) ? (
                                    <File className="h-5 w-5" />
                                  ) : (
                                    <File className="h-5 w-5" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium block truncate">
                                      {message.attachmentName}
                                    </span>
                                    <span className="text-xs opacity-75">
                                      {message.attachmentType}
                                    </span>
                                  </div>
                                </a>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-1 mt-2">
                            <span
                              className={`text-xs ${
                                isCurrentUser
                                  ? "text-blue-100"
                                  : "text-gray-400"
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
                    );
                  })}

                  {/* Pending Messages */}
                  {pendingMessages.map(pendingMessage => (
                    <div key={pendingMessage.id} className="flex justify-end">
                      <div
                        className={`max-w-[70%] px-4 py-3 rounded-2xl text-white ${
                          pendingMessage.status === "failed" ? "opacity-60" : ""
                        }`}
                        style={{
                          backgroundColor: "#2A3133",
                          borderColor: "#4A5A70",
                          border: "1px solid",
                        }}
                      >
                        <div className="text-sm">
                          <FormattedMessage content={pendingMessage.content} />
                        </div>
                        {pendingMessage.attachmentUrl && (
                          <div className="mt-2">
                            {pendingMessage.attachmentType?.startsWith(
                              "image/"
                            ) ? (
                              <img
                                src={pendingMessage.attachmentUrl}
                                alt="Attachment"
                                className="max-w-full rounded-lg"
                              />
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

                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <File
                        className="h-12 w-12 mx-auto mb-4 opacity-50"
                        style={{ color: "#ABA4AA" }}
                      />
                      <p className="text-sm" style={{ color: "#ABA4AA" }}>
                        No messages yet
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input - Restricted for client-to-client conversations */}
                <div
                  className="p-4 border-t"
                  style={{ borderColor: "#2a2a2a" }}
                >
                  {(() => {
                    const conversation = conversations.find(
                      (c: any) => c.id === selectedConversation
                    );
                    const isClientToClient =
                      conversation?.type === "CLIENT_CLIENT";

                    if (isClientToClient) {
                      return (
                        <div className="text-center py-4">
                          <div className="text-gray-400 mb-2">
                            <File className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">
                              Client-to-client messaging is restricted to time
                              swap requests only.
                            </p>
                            <p className="text-xs mt-1">
                              Use the schedule page to request lesson swaps.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
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
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <File
                    className="h-16 w-16 mx-auto mb-4 opacity-50"
                    style={{ color: "#ABA4AA" }}
                  />
                  <h3
                    className="text-xl font-medium mb-2"
                    style={{ color: "#C3BCC2" }}
                  >
                    Select a conversation
                  </h3>
                  <p style={{ color: "#ABA4AA" }}>
                    Choose a conversation from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* File Upload Modal */}
        {showFileUpload && (
          <MessageFileUpload
            onFileSelect={handleFileSelect}
            onClose={() => setShowFileUpload(false)}
          />
        )}
      </div>
    </ClientTopNav>
  );
}

export default withMobileDetection(
  MobileClientMessagesPage,
  ClientMessagesPage
);
