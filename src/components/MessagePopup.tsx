"use client";

import { useState, useEffect, RefObject, useRef } from "react";
import { trpc } from "@/app/_trpc/client";
import { MessageCircle, X, Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import FormattedMessage from "./FormattedMessage";
import { COLORS, getGoldenAccent } from "@/lib/colors";
import { useMessagingService } from "./MessagingServiceProvider";

interface MessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

export default function MessagePopup({
  isOpen,
  onClose,
  buttonRef,
}: MessagePopupProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get Realtime connection status
  const { isConnected: realtimeConnected } = useMessagingService();

  // Get conversations
  const { data: conversationsData, refetch: refetchConversations } =
    trpc.messaging.getConversations.useQuery(undefined, {
      enabled: isOpen,
      refetchInterval: false, // NO POLLING - updates via Supabase Realtime
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 0, // Don't cache - always get fresh data
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    });

  const conversations = conversationsData?.conversations || [];

  // Get unread counts
  const { data: unreadCountsObj = {} } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      refetchInterval: false, // NO POLLING - updates via Supabase Realtime
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 0, // Always refetch when invalidated
      gcTime: 5 * 60 * 1000,
    });

  // Get current user
  const { data: authData } = trpc.authCallback.useQuery();
  const currentUserId = authData?.user?.id;
  const isClient = authData?.user?.role === "CLIENT";

  // Get messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } =
    trpc.messaging.getMessages.useQuery(
      { conversationId: selectedConversationId! },
      {
        enabled: !!selectedConversationId && isOpen,
        refetchInterval: false, // NO POLLING - updates via Supabase Realtime
        staleTime: 0, // Always refetch when invalidated
      }
    );

  // Send message mutation
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation();
  const utils = trpc.useUtils();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && selectedConversationId) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversationId]);

  // Refresh conversation list when exiting conversation view
  useEffect(() => {
    if (!selectedConversationId && isOpen) {
      utils.messaging.getConversations.invalidate();
      refetchConversations();
    }
  }, [selectedConversationId, isOpen, utils, refetchConversations]);

  // Handle sending message
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim() || !selectedConversationId || isSending) return;

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversationId,
        content: messageText.trim(),
      });
      setMessageText("");
      refetchMessages();
      // Invalidate and refetch conversations to update the last message
      await utils.messaging.getConversations.invalidate();
      refetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Calculate button position for popup positioning
  useEffect(() => {
    if (buttonRef?.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 8, // 8px gap below button, remove window.scrollY to keep it fixed to viewport
        left: rect.left + rect.width / 2 - 192, // Center popup (384px / 2 = 192px), remove window.scrollX
      });
    }
  }, [isOpen, buttonRef]);

  // Animation handling
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      return undefined;
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (isOpen && !target.closest("[data-message-popup]")) {
        onClose();
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return format(date, "MMM d");
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @keyframes slideInDown {
          from {
            transform: translateY(-12px) scale(0.98);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-12px) scale(0.98);
          }
        }
        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      <div
        data-message-popup
        className={`fixed w-96 h-[500px] max-w-[90vw] max-h-[80vh] rounded-xl shadow-2xl border z-[100] backdrop-blur-sm ${
          isAnimating && !isOpen
            ? "animate-[fadeOut_0.2s_ease-in-out_forwards]"
            : isAnimating
            ? "animate-[slideInDown_0.3s_ease-out_forwards]"
            : "transform scale-100 opacity-100"
        }`}
        style={{
          top: buttonPosition.top,
          left:
            typeof window !== "undefined"
              ? Math.max(
                  8,
                  Math.min(buttonPosition.left, window.innerWidth - 392)
                )
              : buttonPosition.left, // Keep within viewport
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          transformOrigin: "top center",
          animation:
            !isAnimating && isOpen ? "slideInDown 0.3s ease-out" : undefined,
          boxShadow:
            "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(229, 178, 50, 0.1)",
        }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              backgroundColor: COLORS.BACKGROUND_CARD,
            }}
          >
            {selectedConversationId ? (
              <>
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => {
                      setSelectedConversationId(null);
                      setMessageText("");
                      // Refresh conversation list when exiting conversation view
                      utils.messaging.getConversations.invalidate();
                    }}
                    className="p-1 rounded-lg transition-all duration-200"
                    style={{
                      color: COLORS.TEXT_SECONDARY,
                      backgroundColor: "transparent",
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
                  <div className="flex flex-col flex-1 min-w-0">
                    <span
                      className="text-sm font-semibold leading-tight truncate"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {(() => {
                        const conversation = conversations.find(
                          (c: any) => c.id === selectedConversationId
                        );
                        if (!conversation) return "Conversation";
                        let otherUser;
                        if (conversation.type === "COACH_CLIENT") {
                          otherUser =
                            conversation.coach?.id !== currentUserId
                              ? conversation.coach
                              : conversation.client;
                        } else if (conversation.type === "CLIENT_CLIENT") {
                          otherUser =
                            conversation.client1?.id !== currentUserId
                              ? conversation.client1
                              : conversation.client2;
                        } else {
                          otherUser =
                            conversation.coach?.id !== currentUserId
                              ? conversation.coach
                              : conversation.client;
                        }
                        const shouldAnonymize =
                          isClient && conversation.type === "CLIENT_CLIENT";
                        return shouldAnonymize
                          ? "Another Client"
                          : otherUser?.name ||
                              otherUser?.email?.split("@")[0] ||
                              "Unknown";
                      })()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{
                    color: COLORS.TEXT_SECONDARY,
                    backgroundColor: "transparent",
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
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col">
                  <span
                    className="text-sm font-semibold leading-tight"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Recent Messages
                  </span>
                  <span
                    className="text-[10px] leading-tight"
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
                    {conversations.length} conversation
                    {conversations.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{
                    color: COLORS.TEXT_SECONDARY,
                    backgroundColor: "transparent",
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
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Content Area */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              backgroundColor: COLORS.BACKGROUND_DARK,
              scrollbarWidth: "thin",
              scrollbarColor: `${COLORS.BORDER_SUBTLE} transparent`,
            }}
          >
            {selectedConversationId ? (
              // Conversation View
              <div className="flex flex-col h-full">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8">
                      <p
                        className="text-sm"
                        style={{ color: COLORS.TEXT_MUTED }}
                      >
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map((message: any) => {
                      const isCurrentUser = message.senderId === currentUserId;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] px-3 py-2 rounded-xl ${
                              isCurrentUser ? "rounded-br-md" : "rounded-bl-md"
                            }`}
                            style={{
                              backgroundColor: isCurrentUser
                                ? COLORS.GOLDEN_ACCENT
                                : COLORS.BACKGROUND_CARD,
                              color: isCurrentUser
                                ? COLORS.BACKGROUND_DARK
                                : COLORS.TEXT_PRIMARY,
                              border: `1px solid ${
                                isCurrentUser
                                  ? getGoldenAccent(0.3)
                                  : COLORS.BORDER_SUBTLE
                              }`,
                              boxShadow: isCurrentUser
                                ? `0 2px 8px ${getGoldenAccent(0.2)}`
                                : "0 1px 3px rgba(0, 0, 0, 0.2)",
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 text-xs leading-relaxed break-words">
                                <FormattedMessage content={message.content} />
                              </div>
                              <span
                                className="text-[10px] flex-shrink-0 opacity-70 mt-0.5"
                                style={{
                                  color: isCurrentUser
                                    ? COLORS.BACKGROUND_DARK
                                    : COLORS.TEXT_MUTED,
                                }}
                              >
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div
                  className="px-4 py-3 border-t"
                  style={{
                    borderColor: COLORS.BORDER_SUBTLE,
                    backgroundColor: COLORS.BACKGROUND_CARD,
                  }}
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 rounded-lg border text-sm transition-all duration-200 focus:outline-none"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor =
                          getGoldenAccent(0.4);
                        e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(
                          0.1
                        )}`;
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor =
                          COLORS.BORDER_SUBTLE;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      disabled={isSending}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || isSending}
                      className="px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[44px]"
                      style={{
                        backgroundColor:
                          messageText.trim() && !isSending
                            ? COLORS.GOLDEN_ACCENT
                            : COLORS.BACKGROUND_CARD,
                        color:
                          messageText.trim() && !isSending
                            ? COLORS.BACKGROUND_DARK
                            : COLORS.TEXT_MUTED,
                        border: `1px solid ${
                          messageText.trim() && !isSending
                            ? getGoldenAccent(0.3)
                            : COLORS.BORDER_SUBTLE
                        }`,
                      }}
                      onMouseEnter={e => {
                        if (!e.currentTarget.disabled && messageText.trim()) {
                          e.currentTarget.style.backgroundColor =
                            COLORS.GOLDEN_HOVER;
                          e.currentTarget.style.transform = "scale(1.05)";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.backgroundColor =
                            messageText.trim()
                              ? COLORS.GOLDEN_ACCENT
                              : COLORS.BACKGROUND_CARD;
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      }}
                    >
                      {isSending ? (
                        <div
                          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: COLORS.BACKGROUND_DARK }}
                        />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Conversations List
              <>
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8">
                    <div
                      className="p-3 rounded-full mb-3"
                      style={{
                        backgroundColor: getGoldenAccent(0.1),
                        border: `1px solid ${getGoldenAccent(0.2)}`,
                      }}
                    >
                      <MessageCircle
                        className="h-6 w-6"
                        style={{ color: COLORS.GOLDEN_ACCENT }}
                      />
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      No messages yet
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: COLORS.TEXT_MUTED }}
                    >
                      Start a conversation to get started
                    </p>
                  </div>
                ) : (
                  conversations.map((conversation: any, index: number) => {
                    // Determine the other user based on conversation type
                    let otherUser;
                    if (conversation.type === "COACH_CLIENT") {
                      // Coach-client conversation
                      otherUser =
                        conversation.coach?.id !== currentUserId
                          ? conversation.coach
                          : conversation.client;
                    } else if (conversation.type === "CLIENT_CLIENT") {
                      // Client-client conversation
                      otherUser =
                        conversation.client1?.id !== currentUserId
                          ? conversation.client1
                          : conversation.client2;
                    } else {
                      // Fallback to old logic
                      otherUser =
                        conversation.coach?.id !== currentUserId
                          ? conversation.coach
                          : conversation.client;
                    }

                    // Skip if otherUser is null/undefined
                    if (!otherUser) return null;

                    const lastMessage = conversation.messages[0];
                    const unreadCount = unreadCountsObj[conversation.id] || 0;

                    // Anonymize client names for CLIENT_CLIENT conversations when viewed by clients
                    const shouldAnonymize =
                      isClient && conversation.type === "CLIENT_CLIENT";
                    const displayName = shouldAnonymize
                      ? "Another Client"
                      : otherUser?.name ||
                        otherUser?.email?.split("@")[0] ||
                        "Unknown";
                    const displayInitial = shouldAnonymize
                      ? "C"
                      : (otherUser?.name || otherUser?.email)
                          ?.charAt(0)
                          ?.toUpperCase() || "?";

                    return (
                      <button
                        key={conversation.id}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedConversationId(conversation.id);
                        }}
                        type="button"
                        className="flex items-center gap-3 px-4 py-3 border-b transition-all duration-200 animate-[messageSlideIn_0.3s_ease-out] w-full text-left"
                        style={{
                          borderColor: COLORS.BORDER_SUBTLE,
                          backgroundColor: "transparent",
                          animationDelay: `${index * 30}ms`,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.BACKGROUND_CARD;
                          e.currentTarget.style.transform = "translateX(2px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-transform duration-200"
                          style={{
                            backgroundColor: getGoldenAccent(0.2),
                            color: COLORS.GOLDEN_ACCENT,
                            border: `1px solid ${getGoldenAccent(0.3)}`,
                          }}
                        >
                          {displayInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p
                              className="text-sm font-semibold truncate"
                              style={{ color: COLORS.TEXT_PRIMARY }}
                            >
                              {displayName}
                            </p>
                            {lastMessage && (
                              <span
                                className="text-[10px] flex-shrink-0"
                                style={{ color: COLORS.TEXT_MUTED }}
                              >
                                {formatTime(lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            {lastMessage && (
                              <div
                                className="text-xs truncate flex-1"
                                style={{ color: COLORS.TEXT_SECONDARY }}
                              >
                                <FormattedMessage
                                  content={lastMessage.content}
                                />
                              </div>
                            )}
                            {unreadCount > 0 && (
                              <span
                                className="text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center font-semibold flex-shrink-0"
                                style={{
                                  backgroundColor: COLORS.RED_ALERT,
                                  color: "white",
                                }}
                              >
                                {unreadCount > 9 ? "9+" : unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>

          {/* Footer - Only show when not in conversation */}
          {!selectedConversationId && (
            <div
              className="px-4 py-3 border-t flex gap-2"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                backgroundColor: COLORS.BACKGROUND_CARD,
              }}
            >
              <Link
                href="/client-messages?new=true"
                onClick={onClose}
                className="flex-1 text-center py-2.5 px-4 rounded-lg transition-all duration-200 text-sm font-medium"
                style={{
                  backgroundColor: COLORS.GOLDEN_ACCENT,
                  color: COLORS.BACKGROUND_DARK,
                  border: `1px solid ${getGoldenAccent(0.3)}`,
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_HOVER;
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                New message
              </Link>
              <Link
                href="/client-messages"
                onClick={onClose}
                className="flex-1 text-center py-2.5 px-4 rounded-lg transition-all duration-200 text-sm font-medium"
                style={{
                  backgroundColor: "transparent",
                  color: COLORS.TEXT_SECONDARY,
                  border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
              >
                See all
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
