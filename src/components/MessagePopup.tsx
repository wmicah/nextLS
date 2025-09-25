"use client";

import { useState, useEffect, RefObject } from "react";
import { trpc } from "@/app/_trpc/client";
import { MessageCircle, X } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

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

  // Get conversations
  const { data: conversations = [] } = trpc.messaging.getConversations.useQuery(
    undefined,
    {
      enabled: isOpen,
      refetchInterval: 60000, // Poll every minute
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30 * 1000, // Cache for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    }
  );

  // Get unread counts
  const { data: unreadCountsObj = {} } =
    trpc.messaging.getConversationUnreadCounts.useQuery(undefined, {
      refetchInterval: 60000, // Poll every 60 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    });

  // Get current user
  const { data: authData } = trpc.authCallback.useQuery();
  const currentUserId = authData?.user?.id;

  // Calculate button position for popup positioning
  useEffect(() => {
    if (buttonRef?.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + window.scrollY + 8, // 8px gap below button
        left: rect.left + window.scrollX + rect.width / 2 - 192, // Center popup (384px / 2 = 192px)
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
        data-message-popup
        className={`fixed w-96 h-96 rounded-lg shadow-lg border z-50 ${
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
          backgroundColor: "#353A3A",
          borderColor: "#606364",
          transformOrigin: "top center",
          animation:
            !isAnimating && isOpen ? "slideInDown 0.3s ease-out" : undefined,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: "#606364" }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" style={{ color: "#C3BCC2" }} />
              <span className="font-medium" style={{ color: "#C3BCC2" }}>
                Recent Messages
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md transition-colors"
              style={{ color: "#ABA4AA" }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#606364";
                e.currentTarget.style.color = "#C3BCC2";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#ABA4AA";
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center">
                <MessageCircle
                  className="h-8 w-8 mx-auto mb-2 opacity-50"
                  style={{ color: "#ABA4AA" }}
                />
                <p className="text-sm" style={{ color: "#ABA4AA" }}>
                  No messages yet
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

                return (
                  <Link
                    key={conversation.id}
                    href={`/client-messages`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 border-b transition-all duration-200 hover:transform hover:translate-x-1"
                    style={{
                      borderColor: "#606364",
                      color: "#C3BCC2",
                      animationDelay: `${index * 50}ms`,
                      animation:
                        isOpen && !isAnimating
                          ? `slideInLeft 0.3s ease-out ${index * 50}ms both`
                          : undefined,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#2A3133";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0, 0, 0, 0.2)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 transition-transform duration-200 hover:scale-110"
                      style={{
                        backgroundColor: "#4A5A70",
                        color: "white",
                      }}
                    >
                      {(otherUser?.name || otherUser?.email)
                        ?.charAt(0)
                        ?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: "#C3BCC2" }}
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
                            {formatTime(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        {lastMessage && (
                          <p
                            className="text-xs truncate"
                            style={{ color: "#ABA4AA" }}
                          >
                            {lastMessage.content}
                          </p>
                        )}
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center ml-2 animate-pulse">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t" style={{ borderColor: "#606364" }}>
            <Link
              href="/client-messages"
              onClick={onClose}
              className="block w-full text-center py-2 px-4 rounded-md transition-all duration-200 hover:transform hover:scale-105"
              style={{
                backgroundColor: "#4A5A70",
                color: "white",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#5A6A80";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "#4A5A70";
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
