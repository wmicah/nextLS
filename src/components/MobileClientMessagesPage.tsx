"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  File,
  CheckCheck,
  ArrowLeft,
  MessageCircle,
  Home,
} from "lucide-react";
import { format } from "date-fns";
import MessageFileUpload from "./MessageFileUpload";
import ProfilePictureUploader from "./ProfilePictureUploader";
import RichMessageInput from "./RichMessageInput";
import FormattedMessage from "./FormattedMessage";
import MessageAcknowledgment from "./MessageAcknowledgment";
import SwapRequestMessage from "./SwapRequestMessage";
import MobileClientNavigation from "./MobileClientNavigation";
import MobileClientBottomNavigation from "./MobileClientBottomNavigation";

export default function MobileClientMessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
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

  // Get current user info
  const { data: currentUser } = trpc.user.getProfile.useQuery();
  const utils = trpc.useUtils();

  // Get conversations
  const {
    data: conversations = [],
    refetch: refetchConversations,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = trpc.messaging.getConversations.useQuery(undefined, {
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Get unread counts
  const { data: unreadCountsObj = {} } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      refetchInterval: 10000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 10 * 1000,
    });

  // Get messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } =
    trpc.messaging.getMessages.useQuery(
      { conversationId: selectedConversation! },
      {
        enabled: !!selectedConversation,
        refetchInterval: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 2 * 60 * 1000,
      }
    );

  // Get unread count
  const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 10000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  // Send message mutation
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      setSelectedFile(null);
      refetchMessages();
      refetchConversations();
    },
    onError: (error: any) => {
      console.error("Error sending message:", error);
    },
  });

  // Mark message as read mutation
  const markAsReadMutation = trpc.messaging.markAsRead.useMutation({
    onSuccess: () => {
      refetchMessages();
      refetchConversations();
    },
  });

  // Prevent body scroll when in conversation
  useEffect(() => {
    const isInConversation = !!selectedConversation;
    document.body.style.overflow = isInConversation ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMessages]);

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
        }
      : null;

    // Add optimistic message
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      sender: { id: currentUser?.id, name: currentUser?.name },
      createdAt: new Date().toISOString(),
      status: "sending" as const,
      attachmentUrl: attachmentData?.attachmentUrl,
      attachmentType: attachmentData?.attachmentType,
      attachmentName: attachmentData?.attachmentName,
    };

    setPendingMessages(prev => [...prev, optimisticMessage]);
    setMessageText("");
    setSelectedFile(null);

    sendMessageMutation.mutate(
      {
        conversationId: selectedConversation!,
        content: messageContent,
        attachmentUrl: attachmentData?.attachmentUrl,
        attachmentType: attachmentData?.attachmentType,
        attachmentName: attachmentData?.attachmentName,
      },
      {
        onSuccess: () => {
          setPendingMessages(prev => prev.filter(msg => msg.id !== tempId));
        },
        onError: () => {
          setPendingMessages(prev =>
            prev.map(msg =>
              msg.id === tempId ? { ...msg, status: "failed" as const } : msg
            )
          );
        },
      }
    );
  };

  const handleMarkAsRead = (conversationId: string) => {
    markAsReadMutation.mutate({ conversationId });
  };

  const getOtherUser = (conversation: any, currentUserId: string) => {
    // Handle both old participants array format and new coachId/clientId format
    if (conversation.participants) {
      return conversation.participants.find((p: any) => p.id !== currentUserId);
    }

    // New format: conversation has coachId, clientId, coach, client
    if (conversation.type === "COACH_CLIENT") {
      if (conversation.coachId === currentUserId) {
        return conversation.client;
      } else if (conversation.clientId === currentUserId) {
        return conversation.coach;
      }
    }

    return null;
  };

  const filteredConversations = conversations.filter((conversation: any) => {
    if (!currentUser?.id) return false;
    const otherUser = getOtherUser(conversation, currentUser.id);

    // If we can't find the other user, don't filter it out (show it)
    if (!otherUser) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      otherUser?.name?.toLowerCase().includes(searchLower) ||
      otherUser?.email?.toLowerCase().includes(searchLower) ||
      conversation.messages?.[0]?.content?.toLowerCase().includes(searchLower)
    );
  });

  const selectedConversationData = conversations.find(
    (c: any) => c.id === selectedConversation
  );

  return (
    <div
      className="min-h-screen overscroll-none"
      style={{ backgroundColor: "#2A3133" }}
    >
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#2A3133] border-b border-[#606364] px-4 py-3">
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
              <p className="text-xs text-gray-400">Chat with coach</p>
            </div>
          </div>
          <MobileClientNavigation currentPage="messages" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overscroll-none pt-16">
        {/* Conversations List */}
        {!selectedConversation && (
          <div className="flex flex-col overscroll-none">
            {/* Search */}
            <div className="flex-shrink-0 px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="px-4 pb-24">
              <div className="space-y-1">
                {conversationsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4" />
                    <p className="text-gray-400">Loading conversations...</p>
                  </div>
                ) : conversationsError ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400 mb-2">
                      Error loading conversations
                    </p>
                    <p className="text-sm text-gray-500">
                      {conversationsError.message}
                    </p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">
                      {searchTerm
                        ? "No conversations found"
                        : "No conversations yet"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {searchTerm
                        ? "Try a different search term"
                        : "Start a conversation with your coach"}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation: any) => {
                    const otherUser = getOtherUser(
                      conversation,
                      currentUser?.id || ""
                    );
                    const unreadCount = unreadCountsObj[conversation.id] || 0;
                    const isActive = selectedConversation === conversation.id;

                    return (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? "bg-[#4A5A70] text-white"
                            : "bg-[#353A3A] text-[#C3BCC2] hover:bg-[#4A5A70] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <ProfilePictureUploader
                            currentAvatarUrl={
                              otherUser?.settings?.avatarUrl ||
                              otherUser?.avatar
                            }
                            userName={
                              otherUser?.name || otherUser?.email || "User"
                            }
                            onAvatarChange={() => {}}
                            size="sm"
                            readOnly={true}
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-sm truncate">
                                {otherUser?.name ||
                                  otherUser?.email?.split("@")[0] ||
                                  "Unknown"}
                              </h3>
                              {conversation.messages?.[0] && (
                                <span className="text-xs opacity-75">
                                  {format(
                                    new Date(
                                      conversation.messages[0].createdAt
                                    ),
                                    "MMM d"
                                  )}
                                </span>
                              )}
                            </div>
                            <p className="text-sm opacity-75 truncate mt-1">
                              {conversation.messages?.[0]?.content ||
                                "No messages yet"}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <div className="flex-shrink-0">
                              <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        {selectedConversation && (
          <div className="flex-1 flex flex-col">
            {/* Chat Header - Fixed */}
            <div
              className="fixed top-16 left-0 right-0 z-40 px-4 py-2 border-b flex items-center justify-between"
              style={{ borderColor: "#606364", backgroundColor: "#353A3A" }}
            >
              <div className="flex items-center gap-2.5 flex-1 min-h-0">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-1 rounded-full hover:bg-gray-800 transition-colors touch-manipulation active:scale-95 flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" style={{ color: "#C3BCC2" }} />
                </button>
                <ProfilePictureUploader
                  currentAvatarUrl={(() => {
                    const otherUser = getOtherUser(
                      selectedConversationData,
                      currentUser?.id || ""
                    );
                    return otherUser?.settings?.avatarUrl || otherUser?.avatar;
                  })()}
                  userName={(() => {
                    const otherUser = getOtherUser(
                      selectedConversationData,
                      currentUser?.id || ""
                    );
                    return otherUser?.name || otherUser?.email || "User";
                  })()}
                  onAvatarChange={() => {}}
                  size="sm"
                  readOnly={true}
                  className="flex-shrink-0"
                />
                <div className="flex flex-col justify-center min-w-0 flex-1 -space-y-0.5">
                  <h3
                    className="font-semibold text-sm truncate"
                    style={{ color: "#C3BCC2" }}
                  >
                    {(() => {
                      const otherUser = getOtherUser(
                        selectedConversationData,
                        currentUser?.id || ""
                      );
                      return (
                        otherUser?.name ||
                        otherUser?.email?.split("@")[0] ||
                        "Unknown"
                      );
                    })()}
                  </h3>
                  <p className="text-xs" style={{ color: "#ABA4AA" }}>
                    Coach
                  </p>
                </div>
              </div>
              <button className="p-1 rounded-full hover:bg-gray-800 transition-colors touch-manipulation active:scale-95 flex-shrink-0">
                <MoreVertical
                  className="h-5 w-5"
                  style={{ color: "#ABA4AA" }}
                />
              </button>
            </div>

            {/* Messages */}
            <div
              className="overflow-y-auto px-4 space-y-3"
              style={{
                height: "calc(100vh - 8rem)",
                paddingTop: "5rem",
                paddingBottom: "0.rem",
              }}
            >
              {messages.map((message: any) => {
                const isCurrentUser = message.sender.id === currentUser?.id;
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
                            from coach
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
                                <video
                                  src={message.attachmentUrl}
                                  controls
                                  className="max-w-full rounded-lg"
                                  style={{ maxHeight: "200px" }}
                                  preload="metadata"
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-gray-600 rounded-lg">
                                <File className="h-4 w-4" />
                                <span className="text-sm">
                                  {message.attachmentName || "Attachment"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-75">
                            {format(new Date(message.createdAt), "h:mm a")}
                          </span>
                          {isCurrentUser && (
                            <div className="flex items-center gap-1">
                              {message.status === "sent" && (
                                <CheckCheck className="h-3 w-3 text-blue-300" />
                              )}
                              {message.status === "delivered" && (
                                <CheckCheck className="h-3 w-3 text-green-300" />
                              )}
                              {message.status === "failed" && (
                                <span className="text-red-400 text-xs">
                                  Failed
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pending Messages */}
              {pendingMessages.map(message => (
                <div key={message.id} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-blue-500 text-white rounded-br-md opacity-75">
                      <div className="text-sm">{message.content}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-75">
                          {format(new Date(message.createdAt), "h:mm a")}
                        </span>
                        <div className="flex items-center gap-1">
                          {message.status === "sending" && (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                          )}
                          {message.status === "failed" && (
                            <span className="text-red-400 text-xs">Failed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input - Fixed */}
            <div
              className="fixed bottom-20 left-0 right-0 z-40 px-4 py-3 border-t"
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
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <MessageFileUpload
          onFileSelect={(file, uploadData) => {
            setSelectedFile({ file, uploadData });
            setShowFileUpload(false);
          }}
          onClose={() => setShowFileUpload(false)}
        />
      )}

      {/* Bottom Navigation */}
      <MobileClientBottomNavigation />
    </div>
  );
}
