"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/app/_trpc/client";
import { MessageCircle, X, Send, User, Search, ArrowLeft } from "lucide-react";
import ProfilePictureUploader from "./ProfilePictureUploader";
import RichMessageInput from "./RichMessageInput";
import FormattedMessage from "./FormattedMessage";
import MessageAcknowledgment from "./MessageAcknowledgment";

interface MobileMessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMessagePopup({
  isOpen,
  onClose,
}: MobileMessagePopupProps) {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingMessages, setPendingMessages] = useState<
    Array<{
      id: string;
      content: string;
      timestamp: Date;
      status: "sending" | "sent" | "failed";
    }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData, refetch: refetchConversations } =
    trpc.messaging.getConversations.useQuery(undefined, {
      enabled: isOpen,
      refetchInterval: false, // NO POLLING - updates via Supabase Realtime
    });

  const conversations = conversationsData?.conversations || [];

  // Get unread counts for each conversation
  const { data: unreadCounts = {} } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      enabled: isOpen,
      refetchInterval: false, // NO POLLING - updates via Supabase Realtime
    });

  const { data: messages = [], refetch: refetchMessages } =
    trpc.messaging.getMessages.useQuery(
      { conversationId: selectedConversation! },
      {
        enabled: !!selectedConversation && isOpen,
        refetchInterval: false, // NO POLLING - updates via Supabase Realtime
      }
    );

  const sendMessageMutation = trpc.messaging.sendMessage.useMutation();

  // Handle click outside to close (only on desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [pendingMessages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: messageText.trim(),
      timestamp: new Date(),
      status: "sending" as const,
    };

    // Add optimistic message
    setPendingMessages(prev => [...prev, optimisticMessage]);

    // Clear input immediately
    const messageContent = messageText.trim();
    setMessageText("");

    sendMessageMutation.mutate(
      {
        conversationId: selectedConversation,
        content: messageContent,
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
            // Remove pending message after refetch completes
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

          // Restore message text for retry
          setMessageText(messageContent);
        },
      }
    );
  };

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours =
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  const filteredConversations = conversations.filter((conv: any) => {
    if (!searchTerm) return true;
    const otherUser =
      conv.coach.id !== conv.messages[0]?.sender?.id ? conv.coach : conv.client;
    return (
      otherUser.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      otherUser.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div
        ref={popupRef}
        className="w-full max-w-md h-[90vh] rounded-2xl shadow-2xl border flex flex-col"
        style={{
          backgroundColor: "#2D3142",
          borderColor: "#4A5568",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "#4A5568" }}
        >
          <div className="flex items-center gap-3">
            {selectedConversation && (
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-2 rounded-lg hover:bg-gray-600 transition-colors touch-manipulation"
                style={{ minWidth: "44px", minHeight: "44px" }}
              >
                <ArrowLeft className="h-5 w-5" style={{ color: "#E2E8F0" }} />
              </button>
            )}
            <MessageCircle className="h-6 w-6" style={{ color: "#E2E8F0" }} />
            <h3 className="text-lg font-semibold" style={{ color: "#E2E8F0" }}>
              {selectedConversation ? "Chat" : "Messages"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-600 transition-colors touch-manipulation"
            style={{ minWidth: "44px", minHeight: "44px" }}
          >
            <X className="h-6 w-6" style={{ color: "#CBD5E0" }} />
          </button>
        </div>

        {!selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b" style={{ borderColor: "#4A5568" }}>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                  style={{ color: "#9CA3AF" }}
                />
                <input
                  type="text"
                  placeholder="Search people"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-base rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 touch-manipulation"
                  style={{
                    backgroundColor: "#374151",
                    color: "#E2E8F0",
                  }}
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageCircle
                    className="h-12 w-12 mx-auto mb-4 opacity-50"
                    style={{ color: "#9CA3AF" }}
                  />
                  <p className="text-base" style={{ color: "#9CA3AF" }}>
                    {searchTerm ? "No conversations found" : "No messages yet"}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation: any) => {
                  const otherUser =
                    conversation.coach.id !==
                    conversation.messages[0]?.sender?.id
                      ? conversation.coach
                      : conversation.client;
                  const lastMessage = conversation.messages[0];
                  // Get actual unread count from the unreadCounts data
                  const unreadCount = unreadCounts[conversation.id] || 0;
                  const hasUnread = unreadCount > 0;

                  return (
                    <div
                      key={conversation.id}
                      className={`flex items-center gap-4 p-4 hover:bg-gray-600 cursor-pointer border-b border-gray-600 transition-colors relative touch-manipulation ${
                        hasUnread
                          ? "bg-gray-700/50 border-l-4 border-l-red-500"
                          : ""
                      }`}
                      style={{ minHeight: "80px" }}
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <ProfilePictureUploader
                        currentAvatarUrl={otherUser?.settings?.avatarUrl}
                        userName={otherUser?.name || otherUser?.email || "User"}
                        onAvatarChange={() => {}}
                        size="md"
                        readOnly={true}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-base truncate ${
                              hasUnread ? "font-semibold" : "font-medium"
                            }`}
                            style={{
                              color: hasUnread ? "#FFFFFF" : "#E2E8F0",
                            }}
                          >
                            {otherUser.name || otherUser.email.split("@")[0]}
                          </p>
                          {lastMessage && (
                            <span
                              className="text-sm flex-shrink-0 ml-2"
                              style={{ color: "#9CA3AF" }}
                            >
                              {formatTime(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          {lastMessage && (
                            <p
                              className={`text-sm truncate ${
                                hasUnread ? "font-medium" : ""
                              }`}
                              style={{
                                color: hasUnread ? "#E2E8F0" : "#9CA3AF",
                              }}
                            >
                              {lastMessage.content}
                            </p>
                          )}
                          {hasUnread && (
                            <div className="flex items-center gap-2 ml-2">
                              {/* Unread indicator dot */}
                              <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 animate-pulse"></div>
                              {/* Unread count badge */}
                              <span className="bg-red-500 text-white text-sm rounded-full px-2 py-1 min-w-[24px] text-center font-medium">
                                {unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message: any) => {
                const isCurrentUser =
                  message.sender.id ===
                  conversations.find(c => c.id === selectedConversation)
                    ?.coachId;

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
                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-base ${
                          isCurrentUser
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : isWorkoutNote && isFromClient
                            ? "bg-gray-600 text-gray-100 rounded-bl-sm border border-blue-400"
                            : "bg-gray-600 text-gray-100 rounded-bl-sm"
                        }`}
                      >
                        <FormattedMessage content={message.content} />

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
                          messageData={message.data as { type?: string; swapRequestId?: string } | undefined}
                        />

                        <div className="flex items-center justify-end gap-1 mt-2">
                          <p
                            className={`text-sm ${
                              isCurrentUser ? "text-blue-100" : "text-gray-400"
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                          {isCurrentUser && (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-200 rounded-full" />
                            </div>
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
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-base bg-blue-500 text-white rounded-br-sm ${
                      pendingMessage.status === "failed" ? "opacity-60" : ""
                    }`}
                  >
                    <FormattedMessage content={pendingMessage.content} />
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <p className="text-sm text-blue-100">
                        {formatTime(pendingMessage.timestamp.toISOString())}
                      </p>
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
                          <div className="w-2 h-2 bg-blue-200 rounded-full" />
                        )}
                        {pendingMessage.status === "failed" && (
                          <div className="w-2 h-2 bg-red-400 rounded-full flex items-center justify-center">
                            <span className="text-xs text-red-800">!</span>
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
            <div className="p-4 border-t" style={{ borderColor: "#4A5568" }}>
              <RichMessageInput
                value={messageText}
                onChange={setMessageText}
                onSend={() => handleSendMessage()}
                placeholder="Type a message..."
                disabled={false}
                isPending={sendMessageMutation.isPending}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
