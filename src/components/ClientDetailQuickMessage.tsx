"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/app/_trpc/client";
import { COLORS } from "@/lib/colors";
import { format } from "date-fns";
import { MessageCircle, X, Send, File as FileIcon } from "lucide-react";
import FormattedMessage from "./FormattedMessage";

interface QuickMessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  client: { id: string; name: string; userId: string | null };
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

export default function QuickMessagePopup({
  isOpen,
  onClose,
  client,
  buttonRef,
}: QuickMessagePopupProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Get messages for this specific client
  const { data: conversationsData, refetch: refetchConversations } =
    trpc.messaging.getConversations.useQuery(
      { limit: 100, offset: 0 },
      { enabled: isOpen }
    );

  const conversations = conversationsData?.conversations || [];

  // Filter to only show conversation with this specific client
  const clientConversation = conversations.find((conv: any) => {
    if (conv.type === "COACH_CLIENT") {
      return (
        conv.clientId === client.userId || conv.client?.id === client.userId
      );
    }
    return false;
  });

  // Get current user
  const { data: authData } = trpc.authCallback.useQuery();
  const currentUserId = authData?.user?.id;

  const conversationToUse = clientConversation;
  const utils = trpc.useUtils();
  const sendMessage = trpc.messaging.sendMessage.useMutation();

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationToUse || isSending) return;

    setIsSending(true);
    try {
      await sendMessage.mutateAsync({
        conversationId: conversationToUse.id,
        content: messageText.trim(),
      });
      setMessageText("");
      setIsSending(false);
      utils.messaging.getConversations.invalidate();
      refetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (buttonRef?.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 320;
      const popupHeight = 420;

      let left = rect.left + rect.width / 2 - popupWidth / 2;
      let top = rect.bottom + 8;

      if (left < 8) left = 8;
      if (left + popupWidth > window.innerWidth - 8) {
        left = window.innerWidth - popupWidth - 8;
      }
      if (top + popupHeight > window.innerHeight - 8) {
        top = rect.top - popupHeight - 8;
      }

      setButtonPosition({ top, left });
    }
  }, [isOpen, buttonRef]);

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

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (isOpen && !target.closest("[data-quick-message-popup]")) {
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
            transform: translateY(-8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-8px);
          }
        }
      `}</style>
      <div
        data-quick-message-popup
        className={`fixed w-[320px] h-[420px] max-w-[90vw] max-h-[80vh] rounded-lg shadow-lg border z-50 ${
          isAnimating && !isOpen
            ? "animate-[fadeOut_0.2s_ease-in-out_forwards]"
            : isAnimating
              ? "animate-[slideInDown_0.3s_ease-out_forwards]"
              : "transform scale-100 opacity-100"
        }`}
        style={{
          top: buttonPosition.top,
          left: buttonPosition.left,
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          transformOrigin: "top center",
          animation:
            !isAnimating && isOpen ? "slideInDown 0.3s ease-out" : undefined,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div
          className="flex flex-col h-full overflow-hidden"
          style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
        >
          <div
            className="flex items-center justify-between px-3 py-2.5 border-b"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              backgroundColor: COLORS.BACKGROUND_DARK,
            }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle
                className="h-4 w-4"
                style={{ color: COLORS.GOLDEN_ACCENT }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {client.name}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md transition-colors"
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
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto"
            style={{
              maxHeight: "280px",
              minHeight: "150px",
              backgroundColor: COLORS.BACKGROUND_DARK,
            }}
          >
            {!conversationToUse || conversationToUse.messages.length === 0 ? (
              <div className="p-3 text-center">
                <MessageCircle
                  className="h-6 w-6 mx-auto mb-1.5 opacity-50"
                  style={{ color: COLORS.TEXT_MUTED }}
                />
                <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                  No messages yet
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 p-2">
                {conversationToUse.messages
                  .slice()
                  .reverse()
                  .map((message: any, index: number) => {
                    const isCurrentUser = message.senderId === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isCurrentUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] px-2.5 py-1.5 rounded-lg ${
                            isCurrentUser ? "rounded-br-sm" : "rounded-bl-sm"
                          }`}
                          style={{
                            backgroundColor: isCurrentUser
                              ? COLORS.GOLDEN_ACCENT
                              : COLORS.BACKGROUND_CARD,
                            color: isCurrentUser
                              ? COLORS.BACKGROUND_DARK
                              : COLORS.TEXT_PRIMARY,
                            border: "1px solid",
                            borderColor: isCurrentUser
                              ? COLORS.GOLDEN_BORDER
                              : COLORS.BORDER_SUBTLE,
                            animationDelay: `${index * 50}ms`,
                            animation:
                              isOpen && !isAnimating
                                ? `slideInLeft 0.3s ease-out ${
                                    index * 50
                                  }ms both`
                                : undefined,
                          }}
                        >
                          <div className="flex flex-col gap-1.5">
                            {/* Message Content */}
                            {message.content && (
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="flex-1 text-xs leading-relaxed">
                                  <FormattedMessage content={message.content} />
                                </div>
                                <span
                                  className="text-[10px] flex-shrink-0 opacity-60 ml-1.5"
                                  style={{
                                    color: isCurrentUser
                                      ? COLORS.BACKGROUND_DARK
                                      : COLORS.TEXT_MUTED,
                                  }}
                                >
                                  {formatTime(message.createdAt)}
                                </span>
                              </div>
                            )}

                            {/* File Attachment */}
                            {message.attachmentUrl && (
                              <div className="mt-1">
                                {message.attachmentType?.startsWith(
                                  "image/"
                                ) ? (
                                  <img
                                    src={message.attachmentUrl}
                                    alt={message.attachmentName || "Image"}
                                    className="max-w-full rounded-lg cursor-pointer transition-transform hover:scale-105 object-contain"
                                    style={{
                                      maxHeight: "150px",
                                      aspectRatio: "16/10",
                                    }}
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
                                  <div className="space-y-1">
                                    <video
                                      src={message.attachmentUrl}
                                      controls
                                      className="max-w-full rounded-lg"
                                      style={{ maxHeight: "150px" }}
                                      preload="metadata"
                                    >
                                      Your browser does not support the video
                                      tag.
                                    </video>
                                  </div>
                                ) : (
                                  <a
                                    href={message.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-1.5 rounded-lg transition-all duration-200 hover:scale-105 text-xs"
                                    style={{
                                      backgroundColor: isCurrentUser
                                        ? COLORS.GOLDEN_DARK
                                        : COLORS.BACKGROUND_DARK,
                                      color: isCurrentUser
                                        ? "#ffffff"
                                        : COLORS.TEXT_PRIMARY,
                                      border: "1px solid",
                                      borderColor: isCurrentUser
                                        ? COLORS.GOLDEN_BORDER
                                        : COLORS.BORDER_SUBTLE,
                                    }}
                                  >
                                    <FileIcon className="h-3 w-3" />
                                    <span className="truncate">
                                      {message.attachmentName || "Attachment"}
                                    </span>
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Timestamp for messages without content but with attachment */}
                            {!message.content && message.attachmentUrl && (
                              <div className="flex justify-end">
                                <span
                                  className="text-[10px] flex-shrink-0 opacity-60"
                                  style={{
                                    color: isCurrentUser
                                      ? COLORS.BACKGROUND_DARK
                                      : COLORS.TEXT_MUTED,
                                  }}
                                >
                                  {formatTime(message.createdAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {conversationToUse && (
            <div
              className="px-2.5 py-2 border-t"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                backgroundColor: COLORS.BACKGROUND_DARK,
              }}
            >
              <div className="flex gap-1.5">
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
                  className="flex-1 px-2.5 py-1.5 rounded-md border text-xs"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  disabled={isSending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || isSending}
                  className="px-2.5 py-1.5 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  style={{
                    backgroundColor: COLORS.GOLDEN_DARK,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onMouseEnter={e => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor =
                        COLORS.GOLDEN_ACCENT;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor =
                        COLORS.GOLDEN_DARK;
                    }
                  }}
                >
                  {isSending ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div
            className="px-2.5 py-2 border-t"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              backgroundColor: COLORS.BACKGROUND_DARK,
            }}
          >
            <Link
              href="/messages"
              onClick={onClose}
              className="block w-full text-center py-1.5 px-3 rounded-md transition-all duration-200 text-xs font-medium"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                color: COLORS.TEXT_SECONDARY,
                border: `1px solid ${COLORS.BORDER_SUBTLE}`,
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.backgroundColor =
                  COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              View All Messages
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
