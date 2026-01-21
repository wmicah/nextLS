"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { trpc } from "@/app/_trpc/client";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileClientsPage from "./MobileClientsPage";
import { COLORS, getGoldenAccent } from "@/lib/colors";
import {
  Calendar,
  Edit,
  Trash2,
  Clock,
  Search,
  Filter,
  Users,
  TrendingUp,
  Activity,
  Star,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  Archive,
  Mail,
  Phone,
  MessageCircle,
  Grid3X3,
  List,
  AlertCircle,
  Check,
  Download,
  Key,
  Copy,
  XCircle,
  MessageSquare,
  FileText,
  File as FileIcon,
  PenTool,
  Send,
  X,
} from "lucide-react";
import { format } from "date-fns";
import Sidebar from "./Sidebar";
import Link from "next/link";
import FormattedMessage from "./FormattedMessage";

import ProfilePictureUploader from "./ProfilePictureUploader";
import NotesDisplay from "./NotesDisplay";

// Lazy load heavy modal
const ClientProfileModal = dynamic(() => import("./ClientProfileModal"), {
  ssr: false,
});
import { useUIStore } from "@/lib/stores/uiStore";
import { usePersistedSort } from "@/lib/hooks/usePersistedSort";
import { useClientSorting } from "@/lib/hooks/useClientSorting";
import { compareClientsByProgramDueDate } from "@/lib/client-sorting-utils";
import { getStartOfDay } from "@/lib/date-utils";

// Quick Message Popup Component
function QuickMessagePopup({
  isOpen,
  onClose,
  client,
  buttonRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  buttonRef: { current: HTMLButtonElement | null };
}) {
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
      // Check if this conversation is with the selected client
      // The client.id is the client record ID, but we need to match with the client's userId
      return (
        conv.clientId === client.userId || conv.client?.id === client.userId
      );
    }
    return false;
  });

  // Get current user
  const { data: authData } = trpc.authCallback.useQuery();
  const currentUserId = authData?.user?.id;

  // Use the conversation from the main query
  const conversationToUse = clientConversation;

  // Get utils for invalidating queries
  const utils = trpc.useUtils();

  // Send message mutation
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

  // Calculate button position for popup positioning
  useEffect(() => {
    if (buttonRef?.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 400;
      const popupHeight = 500;

      // Calculate position with viewport boundaries
      let left = rect.left + rect.width / 2 - popupWidth / 2;
      let top = rect.bottom + 8;

      // Ensure popup stays within viewport
      if (left < 8) left = 8;
      if (left + popupWidth > window.innerWidth - 8) {
        left = window.innerWidth - popupWidth - 8;
      }
      if (top + popupHeight > window.innerHeight - 8) {
        // Position above the button if there's not enough space below
        top = rect.top - popupHeight - 8;
      }

      setButtonPosition({ top, left });
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
          className="flex flex-col h-full"
          style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
        >
          {/* Header */}
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

          {/* Messages List */}
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
                                    className="max-w-full rounded-lg cursor-pointer transition-transform hover:scale-105"
                                    style={{ maxHeight: "150px" }}
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

          {/* Message Input */}
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

          {/* Footer */}
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
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor =
                  COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
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

// Small Invite Code Button Component
function InviteCodeButton() {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const generateInviteCode = trpc.user.generateInviteCode.useMutation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDropdown &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleGenerateInviteCode = () => {
    generateInviteCode.mutate();
  };

  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink = generateInviteCode.data?.inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${
        generateInviteCode.data.inviteCode
      }`
    : null;

  const handleCopyInviteCode = async () => {
    if (generateInviteCode.data?.inviteCode) {
      try {
        // Safari requires HTTPS and user interaction - this is called from a button click
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(generateInviteCode.data.inviteCode);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          // Fallback for older browsers or Safari without clipboard API
          const textArea = document.createElement("textarea");
          textArea.value = generateInviteCode.data.inviteCode;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (error) {
        console.error("Failed to copy invite code:", error);
        // Fallback for Safari or other browsers
        const textArea = document.createElement("textarea");
        textArea.value = generateInviteCode.data.inviteCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackError) {
          console.error("Fallback copy also failed:", fallbackError);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  const handleCopyInviteLink = async () => {
    if (inviteLink) {
      try {
        // Safari requires HTTPS and user interaction - this is called from a button click
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(inviteLink);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        } else {
          // Fallback for older browsers or Safari without clipboard API
          const textArea = document.createElement("textarea");
          textArea.value = inviteLink;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        }
      } catch (error) {
        console.error("Failed to copy invite link:", error);
        // Fallback for Safari or other browsers
        const textArea = document.createElement("textarea");
        textArea.value = inviteLink;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        } catch (fallbackError) {
          console.error("Fallback copy also failed:", fallbackError);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="relative">
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
        style={{
          backgroundColor: COLORS.GOLDEN_DARK,
          color: "#FFFFFF",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
        }}
      >
        <Key className="h-4 w-4" />
        <span className="whitespace-nowrap">Invite Code</span>
      </button>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 w-80 border rounded-lg p-4 shadow-xl z-50"
          style={{
            backgroundColor: COLORS.BACKGROUND_DARK,
            borderColor: COLORS.BORDER_SUBTLE,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-5 w-5" style={{ color: COLORS.GOLDEN_ACCENT }} />
            <h3
              className="font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Coach Invite Code
            </h3>
          </div>

          {!generateInviteCode.data?.inviteCode ? (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                Generate a unique invite code to share with your athletes
              </p>
              <button
                onClick={handleGenerateInviteCode}
                disabled={generateInviteCode.isPending}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: COLORS.GOLDEN_DARK,
                  color: "#FFFFFF",
                }}
                onMouseEnter={e => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor =
                      COLORS.GOLDEN_ACCENT;
                  }
                }}
                onMouseLeave={e => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                  }
                }}
              >
                {generateInviteCode.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    Generate Invite Code
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#C3BCC2] mb-2">
                  Share this invite link (recommended)
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink || ""}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg text-xs font-mono"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  />
                  <button
                    onClick={handleCopyInviteLink}
                    className="p-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: COLORS.GOLDEN_DARK,
                      color: "#FFFFFF",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.GOLDEN_ACCENT;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.GOLDEN_DARK;
                    }}
                    title="Copy invite link"
                  >
                    {copiedLink ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {copiedLink && (
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                    <Check className="h-3 w-3" />
                    Link copied!
                  </p>
                )}
              </div>

              <div
                className="border-t pt-3"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <p className="text-sm text-[#C3BCC2] mb-2">
                  Or share this code
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type={isVisible ? "text" : "password"}
                    value={generateInviteCode.data.inviteCode}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  />
                  <button
                    onClick={() => setIsVisible(!isVisible)}
                    className="p-2 transition-colors"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                    title={isVisible ? "Hide code" : "Show code"}
                  >
                    {isVisible ? "👁️" : "👁️‍🗨️"}
                  </button>
                  <button
                    onClick={handleCopyInviteCode}
                    className="p-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: COLORS.GOLDEN_DARK,
                      color: "#FFFFFF",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.GOLDEN_ACCENT;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.GOLDEN_DARK;
                    }}
                    title="Copy invite code"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                    <Check className="h-3 w-3" />
                    Code copied!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Requests Button Component
function RequestsButton({ onOpenModal }: { onOpenModal: () => void }) {
  // Get pending client requests
  const { data: pendingRequests = [] } =
    trpc.notifications.getNotifications.useQuery({
      unreadOnly: true,
      limit: 50,
    });

  const clientRequests = pendingRequests.filter(
    (req: any) => req.type === "CLIENT_JOIN_REQUEST" // Show all client join requests (from invite codes and coach links)
  );

  return (
    <button
      onClick={onOpenModal}
      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
      style={{
        backgroundColor: COLORS.GOLDEN_DARK,
        color: "#FFFFFF",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
      }}
    >
      <Mail className="h-4 w-4" />
      Requests
      {clientRequests.length > 0 && (
        <span
          className="text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center"
          style={{
            backgroundColor: COLORS.RED_ALERT,
            color: "#FFFFFF",
          }}
        >
          {clientRequests.length}
        </span>
      )}
    </button>
  );
}

// Client Requests Modal Component
function ClientRequestsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const { addToast } = useUIStore();

  // Use dedicated endpoint for pending client requests instead of filtering notifications
  const {
    data: pendingClientRequests = [],
    refetch,
    isLoading: notificationsLoading,
  } = trpc.clients.getPendingRequests.useQuery();

  const acceptRequest = trpc.user.acceptClientRequest.useMutation({
    onSuccess: async data => {
      // Show success toast
      addToast({
        type: "success",
        title: "Client Accepted",
        message: "The client has been added to your clients list.",
      });

      // Refetch pending requests to remove accepted request from list
      await refetch();

      // Invalidate ALL client list queries (with all possible parameters)
      // This ensures React Query clears the cache for all variants
      utils.clients.list.invalidate();
      utils.clients.list.invalidate({ archived: false });
      utils.clients.list.invalidate({ archived: true });
      utils.clients.list.invalidate(undefined); // No params

      // Force a refetch of all client queries and wait for them to complete
      await Promise.all([
        utils.clients.list.refetch({ archived: false }),
        utils.clients.list.refetch({ archived: true }),
      ]);

      // Close the modal immediately - don't wait
      onClose();
    },
    onError: error => {
      console.error("❌ Error accepting client request:", error);
      addToast({
        type: "error",
        title: "Failed to Accept Client",
        message:
          error.message ||
          "An error occurred while accepting the client request.",
      });
    },
  });

  const rejectRequest = trpc.user.rejectClientRequest.useMutation({
    onSuccess: () => {
      // Refetch pending requests to remove rejected request from list
      refetch();
      // Also invalidate clients list in case client was deleted
      utils.clients.list.invalidate();
    },
    onError: error => {
      console.error("Error rejecting client request:", error);
      addToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to reject client request",
      });
    },
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-2xl font-bold"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Client Join Requests
          </h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: COLORS.TEXT_SECONDARY }}
            onMouseEnter={e => {
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {notificationsLoading ? (
          <div className="text-center py-8">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{ borderColor: COLORS.GOLDEN_ACCENT }}
            />
            <p style={{ color: COLORS.TEXT_SECONDARY }}>Loading requests...</p>
          </div>
        ) : pendingClientRequests.length === 0 ? (
          <div className="text-center py-8">
            <Mail
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: COLORS.TEXT_SECONDARY }}
            />
            <p style={{ color: COLORS.TEXT_SECONDARY }}>No pending requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingClientRequests.map((request: any) => {
              return (
                <div
                  key={request.id}
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className="font-semibold"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {request.name || "Unknown Client"}
                      </h3>
                      <p className="text-sm" style={{ color: "#9CA3B0" }}>
                        {request.email || "No email provided"}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: COLORS.TEXT_MUTED }}
                      >
                        Requested{" "}
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          acceptRequest.mutate({
                            notificationId: request.notificationId,
                          });
                        }}
                        disabled={
                          acceptRequest.isPending || rejectRequest.isPending
                        }
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        style={{
                          backgroundColor: COLORS.GREEN_PRIMARY,
                          color: "#FFFFFF",
                        }}
                        onMouseEnter={e => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor =
                              COLORS.GREEN_DARK;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor =
                              COLORS.GREEN_PRIMARY;
                          }
                        }}
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          rejectRequest.mutate({
                            notificationId: request.notificationId,
                          });
                        }}
                        disabled={
                          acceptRequest.isPending || rejectRequest.isPending
                        }
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        style={{
                          backgroundColor: COLORS.RED_ALERT,
                          color: "#FFFFFF",
                        }}
                        onMouseEnter={e => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor =
                              COLORS.RED_DARK;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor =
                              COLORS.RED_ALERT;
                          }
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: COLORS.GOLDEN_DARK,
              color: "#FFFFFF",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: Array<{
    id: string;
    content: string;
    title: string | null;
    type: string;
    priority: string;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
    coachId: string;
    clientId: string;
  }>;
  coachId: string | null;
  createdAt: string;
  updatedAt: string;
  nextLessonDate: string | null;
  lastCompletedWorkout: string | null;
  avatar: string | null;
  dueDate: string | null;
  lastActivity: string | null;
  updates: string | null;
  userId?: string | null;
  archived: boolean;
  archivedAt: string | null;
  // Pitching Information
  age?: number | null;
  height?: string | null;
  dominantHand?: string | null;
  movementStyle?: string | null;
  reachingAbility?: string | null;
  averageSpeed?: number | null;
  topSpeed?: number | null;
  dropSpinRate?: number | null;
  changeupSpinRate?: number | null;
  riseSpinRate?: number | null;
  curveSpinRate?: number | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    settings: {
      avatarUrl: string | null;
    } | null;
  } | null;
  programAssignments?: Array<{
    id: string;
    programId: string;
    assignedAt: string;
    startDate: string | null;
    progress: number;
    completed: boolean;
    completedAt: string | null;
    program: {
      id: string;
      title: string;
      status: string;
      sport: string | null;
      level: string;
      duration: number;
      weeks?: Array<{
        id: string;
        weekNumber: number;
        days: Array<{
          id: string;
          dayNumber: number;
          isRestDay: boolean;
        }>;
      }>;
    };
    replacements?: Array<{
      id: string;
      replacedDate: string;
      replacementReason: string;
    }>;
  }>;
  routineAssignments?: {
    id: string;
    routineId: string;
    assignedAt: string;
    startDate: string | null;
    progress: number;
    completedAt: string | null;
    routine: {
      id: string;
      name: string;
    };
  }[];
}

function ClientsPage() {
  const router = useRouter();
  const [archivingClientId, setArchivingClientId] = useState<string | null>(
    null
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Notes modal state
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notesClient, setNotesClient] = useState<Client | null>(null);

  // Quick message popup state
  const [isQuickMessageOpen, setIsQuickMessageOpen] = useState(false);
  const [quickMessageClient, setQuickMessageClient] = useState<Client | null>(
    null
  );
  const [quickMessageButtonRef, setQuickMessageButtonRef] =
    useState<HTMLButtonElement | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [selectedClientForProfile, setSelectedClientForProfile] =
    useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy, sortOrder, setSortOrder] = usePersistedSort({
    storageKey: "clients-sort",
    defaultSortBy: "name",
    defaultSortOrder: "asc",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  // Bulk operations state
  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    new Set()
  );
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const {
    data: clients = [],
    isLoading,
    error,
  } = trpc.clients.list.useQuery({
    archived: activeTab === "archived",
  });

  // Get counts for both tabs (keep these for the tab badges)
  const { data: activeClientsData = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  const { data: archivedClientsData = [] } = trpc.clients.list.useQuery({
    archived: true,
  });
  const utils = trpc.useUtils();

  const openNotes = (client: Client) => {
    setNotesClient(client);
    setIsNotesModalOpen(true);
  };

  const openQuickMessage = (client: Client, buttonRef: HTMLButtonElement) => {
    setQuickMessageClient(client);
    setQuickMessageButtonRef(buttonRef);
    setIsQuickMessageOpen(true);
  };

  const closeQuickMessage = () => {
    setIsQuickMessageOpen(false);
    setQuickMessageClient(null);
    setQuickMessageButtonRef(null);
  };

  const archiveClient = trpc.clients.archive.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
    },
    onError: error => {
      console.error("Failed to archive client:", error);
    },
  });

  const unarchiveClient = trpc.clients.unarchive.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
    },
    onError: error => {
      console.error("Failed to unarchive client:", error);
    },
  });

  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
    },
    onError: error => {
      console.error("Failed to delete client:", error);
      alert(
        error.message ||
          "Failed to delete client. Make sure the client is archived first."
      );
    },
  });

  const handleArchiveClientFromDelete = (
    clientId: string,
    clientName: string
  ) => {
    if (
      window.confirm(
        `Are you sure you want to archive ${clientName}? They will be moved to the archived section and all their assignments (programs, routines, lessons, and videos) will be removed. They can be restored later.`
      )
    ) {
      setArchivingClientId(clientId);
      archiveClient.mutate({ id: clientId });
    }
  };

  const handleArchiveClient = (clientId: string, clientName: string) => {
    if (
      window.confirm(
        `Are you sure you want to archive ${clientName}? They will be moved to the archived section and all their assignments (programs, routines, lessons, and videos) will be removed.`
      )
    ) {
      archiveClient.mutate({ id: clientId });
    }
  };

  const handleUnarchiveClient = (clientId: string, clientName: string) => {
    if (
      window.confirm(
        `Are you sure you want to unarchive ${clientName}? They will be moved back to the active section.`
      )
    ) {
      unarchiveClient.mutate({ id: clientId });
    }
  };

  const handleDeleteClient = (clientId: string, clientName: string) => {
    if (
      window.confirm(
        `⚠️ PERMANENT DELETION\n\nAre you absolutely sure you want to permanently delete ${clientName}?\n\nThis action:\n• Cannot be undone\n• Will remove the client from your list permanently\n• The client will be able to request a new coach\n\nThis is a permanent action.`
      )
    ) {
      deleteClient.mutate({ id: clientId });
    }
  };

  const handleOpenProfile = (client: Client) => {
    // Navigate to the new client detail page
    router.push(`/clients/${client.id}/detail`);
  };

  // Bulk operations functions
  const toggleClientSelection = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const selectAllClients = () => {
    const allClientIds = new Set<string>(
      filteredAndSortedClients.map((client: Client) => client.id)
    );
    setSelectedClients(allClientIds);
  };

  const clearSelection = () => {
    setSelectedClients(new Set());
  };

  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    if (isBulkMode) {
      clearSelection();
    }
  };

  // Bulk archive function
  const handleBulkArchive = async () => {
    if (selectedClients.size === 0) return;

    const clientNames = filteredAndSortedClients
      .filter(client => selectedClients.has(client.id))
      .map(client => client.name);

    if (
      window.confirm(
        `Archive ${selectedClients.size} client${
          selectedClients.size === 1 ? "" : "s"
        }? This will move them to the archived section and remove all their assignments (programs, routines, lessons, and videos).`
      )
    ) {
      try {
        await Promise.all(
          Array.from(selectedClients).map(clientId =>
            archiveClient.mutateAsync({ id: clientId })
          )
        );
        clearSelection();
        setShowBulkActions(false);
      } catch (error) {
        console.error("Failed to archive clients:", error);
      }
    }
  };

  // Export functions
  const exportToCSV = () => {
    const selectedClientsData = filteredAndSortedClients.filter(client =>
      selectedClients.has(client.id)
    );

    if (selectedClientsData.length === 0) {
      alert("No clients selected for export");
      return;
    }

    // Helper function to escape CSV values properly
    const escapeCSVValue = (value: string): string => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      // Escape quotes by doubling them and wrap in quotes if contains comma, quote, or newline
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n") ||
        stringValue.includes("\r")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvData = selectedClientsData.map(client => ({
      Name: client.name,
      Email: client.email || "",
      Phone: client.phone || "",
      "Next Lesson": client.nextLessonDate
        ? format(new Date(client.nextLessonDate), "MMM d, yyyy")
        : "No lesson scheduled",
      "Created Date": format(new Date(client.createdAt), "MMM d, yyyy"),
      Notes: Array.isArray(client.notes)
        ? client.notes.map((note: any) => note.content).join("; ")
        : "",
    }));

    // Create CSV with proper escaping
    const headers = Object.keys(csvData[0]);
    const csvRows = [
      headers.join(","), // Header row
      ...csvData.map(row =>
        headers
          .map(header => escapeCSVValue(row[header as keyof typeof row]))
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // For now, we'll create a simple HTML-based PDF
    const selectedClientsData = filteredAndSortedClients.filter(client =>
      selectedClients.has(client.id)
    );

    const htmlContent = `
      <html>
        <head>
          <title>Clients Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Clients Export - ${format(new Date(), "MMM d, yyyy")}</h1>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Next Lesson</th>
                <th>Created Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${selectedClientsData
                .map(
                  client => `
                <tr>
                  <td>${client.name}</td>
                  <td>${client.email || ""}</td>
                  <td>${client.phone || ""}</td>
                  <td>${
                    client.nextLessonDate
                      ? format(new Date(client.nextLessonDate), "MMM d, yyyy")
                      : "No lesson scheduled"
                  }</td>
                  <td>${format(new Date(client.createdAt), "MMM d, yyyy")}</td>
                  <td>${
                    Array.isArray(client.notes)
                      ? client.notes.map((note: any) => note.content).join("; ")
                      : ""
                  }</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-export-${format(new Date(), "yyyy-MM-dd")}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper function to check if a lesson date is valid (future only)
  const isValidLessonDate = (lessonDate: string | null) => {
    if (!lessonDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    const lesson = new Date(lessonDate);
    return lesson > today;
  };

  // Filter clients by search term
  const filteredClients = clients.filter(
    (client: Client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email &&
        client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort clients using the shared utility
  // Important: Create a copy to avoid mutating the original array from React Query
  const filteredAndSortedClients: Client[] = [...filteredClients].sort(
    (a: Client, b: Client) => {
      let aValue: any, bValue: any;
      const now = new Date();

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;

        case "dueDate":
          // Use the shared utility function for program due date sorting
          return compareClientsByProgramDueDate(a, b, sortOrder);

        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;

        case "nextLesson": {
          const today = getStartOfDay(now);

          const getNextLessonDate = (client: Client) => {
            if (client.nextLessonDate) {
              const lessonDate = new Date(client.nextLessonDate);
              return lessonDate > today ? lessonDate : null;
            }
            return null;
          };

          const aNextLesson = getNextLessonDate(a);
          const bNextLesson = getNextLessonDate(b);

          // Check if either client has a lesson today (but only if it's still upcoming)
          const aHasLessonToday =
            a.nextLessonDate &&
            new Date(a.nextLessonDate).getTime() === today.getTime() &&
            new Date(a.nextLessonDate) > now;
          const bHasLessonToday =
            b.nextLessonDate &&
            new Date(b.nextLessonDate).getTime() === today.getTime() &&
            new Date(b.nextLessonDate) > now;

          // If one has lesson today and the other doesn't, prioritize today
          if (aHasLessonToday && !bHasLessonToday) return -1;
          if (!aHasLessonToday && bHasLessonToday) return 1;

          // If both have lessons today, sort by time (earlier time first)
          if (aHasLessonToday && bHasLessonToday) {
            const aTime = new Date(a.nextLessonDate!).getTime();
            const bTime = new Date(b.nextLessonDate!).getTime();
            return aTime - bTime;
          }

          // If both have upcoming lessons (but not today), compare dates
          if (aNextLesson && bNextLesson) {
            aValue = aNextLesson;
            bValue = bNextLesson;
          } else if (aNextLesson && !bNextLesson) {
            return -1;
          } else if (!aNextLesson && bNextLesson) {
            return 1;
          } else {
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
          }
          break;
        }

        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      // Handle different sort types
      if (sortBy === "createdAt") {
        if (sortOrder === "asc") {
          return aValue < bValue ? 1 : -1; // Newest first (descending dates)
        } else {
          return aValue > bValue ? 1 : -1; // Oldest first (ascending dates)
        }
      } else {
        // For name and nextLesson, use normal logic
        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      }
    }
  );


  // Calculate stats
  const totalClients = clients.length;
  const activeClients = activeClientsData.length;
  const archivedClients = archivedClientsData.length;
  const recentClients = clients.filter((c: Client) => {
    const createdAt = new Date(c.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdAt > thirtyDaysAgo;
  }).length;
  const upcomingLessons = clients.filter((c: Client) => {
    if (!c.nextLessonDate) return false;
    const lessonDate = new Date(c.nextLessonDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return lessonDate > today;
  }).length;

  if (error) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-400">Error loading clients: {error.message}</p>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <style jsx>{`
        .hover-close .absolute {
          opacity: 1 !important;
        }
      `}</style>
      <div
        className="min-h-screen"
        style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
      >
        {/* Simplified Header */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div>
                <h1
                  className="text-lg font-semibold pl-2"
                  style={{
                    color: COLORS.TEXT_PRIMARY,
                    borderLeft: `3px solid ${COLORS.GOLDEN_HOVER}`,
                  }}
                >
                  Your Athletes
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={toggleBulkMode}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 flex-shrink-0 text-xs ${
                  isBulkMode ? "ring-2 ring-blue-400" : ""
                }`}
                style={{
                  backgroundColor: isBulkMode
                    ? getGoldenAccent(0.1)
                    : COLORS.BACKGROUND_CARD,
                  color: COLORS.TEXT_SECONDARY,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = getGoldenAccent(0.1);
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = isBulkMode
                    ? getGoldenAccent(0.1)
                    : COLORS.BACKGROUND_CARD;
                }}
              >
                <Users className="h-3 w-3" />
                <span className="whitespace-nowrap">
                  {isBulkMode ? "Exit Bulk Mode" : "Bulk Select"}
                </span>
              </button>

              {/* Invite Code Button */}
              <InviteCodeButton />

              {/* Requests Button */}
              <RequestsButton
                onOpenModal={() => setIsRequestsModalOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div
            className="flex space-x-1 p-0.5 rounded-lg border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                activeTab === "active" ? "shadow-lg" : ""
              }`}
              style={{
                backgroundColor:
                  activeTab === "active" ? getGoldenAccent(0.1) : "transparent",
                color:
                  activeTab === "active"
                    ? COLORS.TEXT_PRIMARY
                    : COLORS.TEXT_SECONDARY,
              }}
              onMouseEnter={e => {
                if (activeTab !== "active") {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== "active") {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                }
              }}
            >
              <span>Active Athletes</span>
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                activeTab === "archived" ? "shadow-lg" : ""
              }`}
              style={{
                backgroundColor:
                  activeTab === "archived"
                    ? getGoldenAccent(0.1)
                    : "transparent",
                color:
                  activeTab === "archived"
                    ? COLORS.TEXT_PRIMARY
                    : COLORS.TEXT_SECONDARY,
              }}
              onMouseEnter={e => {
                if (activeTab !== "archived") {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== "archived") {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                }
              }}
            >
              <span>Archived Athletes</span>
            </button>
          </div>
        </div>

        {/* Enhanced Search and Filters - Matching Programs/Library */}
        <div
          className="rounded-lg p-2 mb-4 border relative"
          style={{
            backgroundColor: COLORS.BACKGROUND_CARD,
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >
          <div className="flex gap-2 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3"
                style={{ color: COLORS.TEXT_MUTED }}
              />
              <input
                type="text"
                placeholder="Search athletes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 rounded-lg border focus:outline-none transition-all duration-300 text-xs placeholder:text-xs"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
              />
            </div>

            {/* Filters - Right Side */}
            <div className="flex gap-1 items-center flex-shrink-0">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-2 py-1 rounded-lg border focus:outline-none transition-all duration-300 text-xs whitespace-nowrap"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
              >
                <option value="name">
                  Name {sortOrder === "asc" ? "(A-Z)" : "(Z-A)"}
                </option>
                <option value="dueDate">
                  Program Due Date{" "}
                  {sortOrder === "asc" ? "(Soonest First)" : "(Farthest First)"}
                </option>
                <option value="createdAt">
                  Recently Added{" "}
                  {sortOrder === "asc" ? "(Newest First)" : "(Oldest First)"}
                </option>
                <option value="nextLesson">
                  Next Lesson{" "}
                  {sortOrder === "asc" ? "(Soonest First)" : "(Farthest First)"}
                </option>
              </select>

              {/* Sort Order Toggle */}
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-1.5 rounded-lg border transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor:
                    sortOrder === "desc"
                      ? getGoldenAccent(0.1)
                      : COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_SECONDARY,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor =
                    sortOrder === "desc"
                      ? COLORS.BACKGROUND_CARD_HOVER
                      : getGoldenAccent(0.1);
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor =
                    sortOrder === "desc"
                      ? getGoldenAccent(0.1)
                      : COLORS.BACKGROUND_CARD;
                }}
                title={
                  sortOrder === "asc" ? "Sort ascending" : "Sort descending"
                }
              >
                {sortOrder === "asc" ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {/* View Mode Toggle */}
              <div
                className="flex rounded-lg border overflow-hidden"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 transition-all duration-200`}
                  style={{
                    backgroundColor:
                      viewMode === "grid"
                        ? getGoldenAccent(0.1)
                        : COLORS.BACKGROUND_CARD,
                    color: COLORS.TEXT_SECONDARY,
                  }}
                  title="Grid View"
                >
                  <Grid3X3 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 transition-all duration-200`}
                  style={{
                    backgroundColor:
                      viewMode === "list"
                        ? getGoldenAccent(0.1)
                        : COLORS.BACKGROUND_CARD,
                    color: COLORS.TEXT_SECONDARY,
                  }}
                  title="List View"
                >
                  <List className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {isBulkMode && (
          <div
            className="mb-3 p-2 rounded-lg border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: getGoldenAccent(0.1) }}
                  >
                    <Users
                      className="h-2.5 w-2.5"
                      style={{ color: COLORS.GOLDEN_ACCENT }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {selectedClients.size > 0
                      ? `${selectedClients.size} client${
                          selectedClients.size === 1 ? "" : "s"
                        } selected`
                      : "Bulk Selection Mode - Select clients to perform actions"}
                  </span>
                </div>
                <button
                  onClick={selectAllClients}
                  className="text-xs px-2 py-1 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: COLORS.GOLDEN_DARK,
                    color: "#FFFFFF",
                    border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor =
                      COLORS.GOLDEN_ACCENT;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                  }}
                >
                  Select All ({filteredAndSortedClients.length})
                </button>
                {selectedClients.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-xs px-2 py-1 rounded-lg transition-all duration-200"
                    style={{
                      backgroundColor: "transparent",
                      color: COLORS.TEXT_SECONDARY,
                      border: `1px solid ${COLORS.BORDER_SUBTLE}`,
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
                    Clear Selection
                  </button>
                )}
              </div>
              {selectedClients.size > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 hover:scale-105 text-xs"
                    style={{
                      backgroundColor: COLORS.GREEN_PRIMARY,
                      color: "#FFFFFF",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.GREEN_PRIMARY;
                    }}
                  >
                    <Download className="h-3 w-3" />
                    Export CSV
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 hover:scale-105 text-xs"
                    style={{
                      backgroundColor: COLORS.GOLDEN_DARK,
                      color: "#FFFFFF",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.GOLDEN_ACCENT;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.GOLDEN_DARK;
                    }}
                  >
                    <Download className="h-3 w-3" />
                    Export PDF
                  </button>
                  {activeTab === "active" && (
                    <button
                      onClick={handleBulkArchive}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 hover:scale-105 text-xs"
                      style={{
                        backgroundColor: COLORS.GOLDEN_ACCENT,
                        color: "#FFFFFF",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor =
                          COLORS.GOLDEN_HOVER;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor =
                          COLORS.GOLDEN_ACCENT;
                      }}
                    >
                      Archive Selected
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Header */}
        {filteredAndSortedClients.length > 0 && (
          <div className="mb-2">
            <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
              {filteredAndSortedClients.length} of {totalClients}{" "}
              {totalClients === 1 ? "athlete" : "athletes"}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        )}

        {/* Enhanced Athletes List/Grid */}
        {isLoading ? (
          // Show skeleton cards while loading
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border shadow-sm animate-pulse"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                    />
                    <div className="flex-1">
                      <div
                        className="h-4 rounded mb-2"
                        style={{ backgroundColor: COLORS.BACKGROUND_DARK, width: "60%" }}
                      />
                      <div
                        className="h-3 rounded"
                        style={{ backgroundColor: COLORS.BACKGROUND_DARK, width: "40%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-red-400">Error loading clients: {error.message}</p>
          </div>
        ) : filteredAndSortedClients.length === 0 ? (
          <div
            className="rounded-lg border text-center relative overflow-hidden"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="relative p-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: getGoldenAccent(0.1) }}
              >
                <Users
                  className="h-5 w-5"
                  style={{ color: COLORS.GOLDEN_ACCENT }}
                />
              </div>
              <h3
                className="text-sm font-semibold mb-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {searchTerm
                  ? "No athletes found"
                  : activeTab === "active"
                  ? "No active athletes"
                  : "No archived athletes"}
              </h3>
              <p
                className="mb-3 max-w-sm mx-auto text-xs"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {searchTerm
                  ? `No athletes match "${searchTerm}". Try a different search term.`
                  : activeTab === "active"
                  ? "Athletes will appear here when they request to join your coaching program."
                  : "No athletes have been archived yet."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-xs px-2 py-1 rounded-lg transition-all duration-200 mx-auto"
                  style={{
                    backgroundColor: "transparent",
                    color: COLORS.TEXT_SECONDARY,
                    border: `1px solid ${COLORS.BORDER_SUBTLE}`,
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
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Grid View Container */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                viewMode === "grid"
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
              style={{
                transform:
                  viewMode === "grid" ? "translateY(0)" : "translateY(20px)",
              }}
            >
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredAndSortedClients.map(
                    (client: Client, index: number) => (
                      <div
                        key={client.id}
                        className="rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer relative overflow-hidden group animate-fadeIn"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_CARD,
                          borderColor: COLORS.BORDER_SUBTLE,
                          animationDelay: `${index * 50}ms`,
                        }}
                        onClick={() => {
                          if (!isBulkMode) {
                            handleOpenProfile(client);
                          }
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.BACKGROUND_CARD_HOVER;
                          e.currentTarget.style.borderColor =
                            COLORS.GOLDEN_ACCENT;
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.BACKGROUND_CARD;
                          e.currentTarget.style.borderColor =
                            COLORS.BORDER_SUBTLE;
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div className="p-[11px]">
                          <div className="flex items-start gap-2">
                            {isBulkMode && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleClientSelection(client.id);
                                }}
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5 ${
                                  selectedClients.has(client.id)
                                    ? "bg-blue-500 border-blue-500"
                                    : "border-gray-400 hover:border-blue-400"
                                }`}
                              >
                                {selectedClients.has(client.id) && (
                                  <Check className="h-2.5 w-2.5 text-white" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedClientForProfile(client);
                                setIsProfileModalOpen(true);
                              }}
                              className="relative transition-all duration-200 hover:scale-105 flex-shrink-0"
                              title="View client profile"
                            >
                              <ProfilePictureUploader
                                currentAvatarUrl={
                                  client.user?.settings?.avatarUrl ||
                                  client.avatar
                                }
                                userName={client.name}
                                onAvatarChange={() => {}}
                                readOnly={true}
                                size="sm"
                              />
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <h3
                                  className="text-sm font-semibold truncate"
                                  style={{ color: COLORS.TEXT_PRIMARY }}
                                >
                                  {client.name}
                                </h3>
                                {/* Archive button next to name */}
                                {activeTab === "active" && (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleArchiveClient(
                                        client.id,
                                        client.name
                                      );
                                    }}
                                    disabled={archivingClientId === client.id}
                                    className="p-0.5 rounded transition-all duration-200 hover:scale-110 disabled:opacity-50 flex-shrink-0"
                                    style={{
                                      color: COLORS.RED_ALERT,
                                      backgroundColor: "transparent",
                                    }}
                                    onMouseEnter={e => {
                                      if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.color =
                                          COLORS.RED_DARK;
                                      }
                                    }}
                                    onMouseLeave={e => {
                                      if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.color =
                                          COLORS.RED_ALERT;
                                      }
                                    }}
                                    title="Archive client"
                                  >
                                    {archivingClientId === client.id ? (
                                      <div
                                        className="animate-spin rounded-full h-2.5 w-2.5 border-b-2"
                                        style={{
                                          borderColor: COLORS.RED_ALERT,
                                        }}
                                      />
                                    ) : (
                                      <Archive className="h-2.5 w-2.5" />
                                    )}
                                  </button>
                                )}
                                {/* Unarchive and Delete buttons next to name for archived clients */}
                                {activeTab === "archived" && (
                                  <>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleUnarchiveClient(
                                          client.id,
                                          client.name
                                        );
                                      }}
                                      disabled={archivingClientId === client.id}
                                      className="p-0.5 rounded transition-all duration-200 hover:scale-110 disabled:opacity-50 flex-shrink-0"
                                      style={{
                                        color: COLORS.GREEN_PRIMARY,
                                        backgroundColor: "transparent",
                                      }}
                                      onMouseEnter={e => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.color =
                                            COLORS.GREEN_DARK;
                                        }
                                      }}
                                      onMouseLeave={e => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.color =
                                            COLORS.GREEN_PRIMARY;
                                        }
                                      }}
                                      title="Unarchive client"
                                    >
                                      {archivingClientId === client.id ? (
                                        <div
                                          className="animate-spin rounded-full h-2.5 w-2.5 border-b-2"
                                          style={{
                                            borderColor: COLORS.GREEN_PRIMARY,
                                          }}
                                        />
                                      ) : (
                                        <Archive className="h-2.5 w-2.5" />
                                      )}
                                    </button>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleDeleteClient(
                                          client.id,
                                          client.name
                                        );
                                      }}
                                      disabled={deleteClient.isPending}
                                      className="p-0.5 rounded transition-all duration-200 hover:scale-110 disabled:opacity-50 flex-shrink-0"
                                      style={{
                                        color: COLORS.RED_ALERT,
                                        backgroundColor: "transparent",
                                      }}
                                      onMouseEnter={e => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.color =
                                            COLORS.RED_DARK;
                                        }
                                      }}
                                      onMouseLeave={e => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.color =
                                            COLORS.RED_ALERT;
                                        }
                                      }}
                                      title="Permanently delete client"
                                    >
                                      {deleteClient.isPending ? (
                                        <div
                                          className="animate-spin rounded-full h-2.5 w-2.5 border-b-2"
                                          style={{
                                            borderColor: COLORS.RED_ALERT,
                                          }}
                                        />
                                      ) : (
                                        <Trash2 className="h-2.5 w-2.5" />
                                      )}
                                    </button>
                                  </>
                                )}
                                {/* Next Lesson Indicator */}
                                {activeTab === "active" &&
                                  isValidLessonDate(client.nextLessonDate) && (
                                    <span
                                      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                      style={{
                                        backgroundColor: "#7DD87D",
                                        color: "#000000",
                                      }}
                                    >
                                      <Calendar
                                        className="h-2.5 w-2.5 mr-0.5"
                                        style={{ color: "#000000" }}
                                      />
                                      {format(
                                        new Date(client.nextLessonDate!),
                                        "MMM d"
                                      )}
                                    </span>
                                  )}
                              </div>
                              <p
                                className="text-xs truncate mb-1"
                                style={{ color: "#9CA3B0" }}
                              >
                                {client.email || "No email"}
                              </p>
                              {/* Next Lesson */}
                              {activeTab === "active" && (
                                <div className="mt-1">
                                  <p
                                    className="text-[10px] font-medium mb-0.5"
                                    style={{ color: COLORS.TEXT_SECONDARY }}
                                  >
                                    Next Lesson:
                                  </p>
                                  <p
                                    className="text-xs font-semibold"
                                    style={{ color: COLORS.TEXT_PRIMARY }}
                                  >
                                    {isValidLessonDate(client.nextLessonDate)
                                      ? format(
                                          new Date(client.nextLessonDate!),
                                          "MMM d, yyyy"
                                        )
                                      : "No lesson scheduled"}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-start gap-1.5 ml-2">
                              {activeTab === "active" && (
                                <>
                                  <button
                                    ref={setQuickMessageButtonRef}
                                    onClick={e => {
                                      e.stopPropagation();
                                      openQuickMessage(client, e.currentTarget);
                                    }}
                                    className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0"
                                    style={{
                                      color: COLORS.TEXT_SECONDARY,
                                      backgroundColor: "transparent",
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.color =
                                        COLORS.TEXT_PRIMARY;
                                      e.currentTarget.style.backgroundColor =
                                        COLORS.BACKGROUND_CARD_HOVER;
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.color =
                                        COLORS.TEXT_SECONDARY;
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }}
                                    title="Send message"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      openNotes(client);
                                    }}
                                    className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0"
                                    style={{
                                      color: COLORS.TEXT_SECONDARY,
                                      backgroundColor: "transparent",
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.color =
                                        COLORS.TEXT_PRIMARY;
                                      e.currentTarget.style.backgroundColor =
                                        COLORS.BACKGROUND_CARD_HOVER;
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.color =
                                        COLORS.TEXT_SECONDARY;
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }}
                                    title="Add feedback"
                                  >
                                    <PenTool className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                              {activeTab === "active" && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedClientForProfile(client);
                                    setIsProfileModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0"
                                  style={{
                                    color: COLORS.TEXT_SECONDARY,
                                    backgroundColor: "transparent",
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.color =
                                      COLORS.TEXT_PRIMARY;
                                    e.currentTarget.style.backgroundColor =
                                      COLORS.BACKGROUND_CARD_HOVER;
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.color =
                                      COLORS.TEXT_SECONDARY;
                                    e.currentTarget.style.backgroundColor =
                                      "transparent";
                                  }}
                                  title="Edit client"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* List View Container */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                viewMode === "list"
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
              style={{
                transform:
                  viewMode === "list" ? "translateY(0)" : "translateY(20px)",
              }}
            >
              {viewMode === "list" && (
                <div className="space-y-2">
                  {filteredAndSortedClients.map(
                    (client: Client, index: number) => (
                      <div
                        key={client.id}
                        className="rounded-lg border transition-all duration-300 cursor-pointer relative overflow-hidden group"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_CARD,
                          borderColor: COLORS.BORDER_SUBTLE,
                          animationName: "fadeInUp",
                          animationDuration: "0.6s",
                          animationTimingFunction: "ease-out",
                          animationFillMode: "forwards",
                          animationDelay: `${index * 50}ms`,
                        }}
                        onClick={() => {
                          if (!isBulkMode) {
                            handleOpenProfile(client);
                          }
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.BACKGROUND_CARD_HOVER;
                          e.currentTarget.style.borderColor =
                            COLORS.GOLDEN_ACCENT;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.BACKGROUND_CARD;
                          e.currentTarget.style.borderColor =
                            COLORS.BORDER_SUBTLE;
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                          style={{
                            background: `linear-gradient(135deg, ${getGoldenAccent(
                              0.1
                            )} 0%, ${COLORS.BACKGROUND_CARD} 100%)`,
                          }}
                        />
                        <div className="relative p-[11px]">
                          <div className="flex items-start gap-2">
                            {isBulkMode && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleClientSelection(client.id);
                                }}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                  selectedClients.has(client.id)
                                    ? "bg-blue-500 border-blue-500"
                                    : "border-gray-400 hover:border-blue-400"
                                }`}
                              >
                                {selectedClients.has(client.id) && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedClientForProfile(client);
                                setIsProfileModalOpen(true);
                              }}
                              className="relative transition-all duration-200 hover:scale-105 flex-shrink-0"
                              title="View client profile"
                            >
                              <ProfilePictureUploader
                                currentAvatarUrl={
                                  client.user?.settings?.avatarUrl ||
                                  client.avatar
                                }
                                userName={client.name}
                                onAvatarChange={() => {}} // No-op for client cards
                                size="md"
                                readOnly={true}
                                className="flex-shrink-0"
                              />
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <h3
                                  className="text-sm font-semibold"
                                  style={{ color: COLORS.TEXT_PRIMARY }}
                                >
                                  {client.name}
                                </h3>
                                {/* Archive button next to name for active clients */}
                                {activeTab === "active" && (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleArchiveClient(
                                        client.id,
                                        client.name
                                      );
                                    }}
                                    disabled={archivingClientId === client.id}
                                    className="p-0.5 rounded transition-all duration-200 hover:scale-110 disabled:opacity-50 flex-shrink-0"
                                    style={{
                                      color: COLORS.RED_ALERT,
                                      backgroundColor: "transparent",
                                    }}
                                    onMouseEnter={e => {
                                      if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.color =
                                          COLORS.RED_DARK;
                                      }
                                    }}
                                    onMouseLeave={e => {
                                      if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.color =
                                          COLORS.RED_ALERT;
                                      }
                                    }}
                                    title="Archive client"
                                  >
                                    {archivingClientId === client.id ? (
                                      <div
                                        className="animate-spin rounded-full h-2.5 w-2.5 border-b-2"
                                        style={{
                                          borderColor: COLORS.RED_ALERT,
                                        }}
                                      />
                                    ) : (
                                      <Archive className="h-2.5 w-2.5" />
                                    )}
                                  </button>
                                )}
                                {/* Unarchive and Delete buttons next to name for archived clients */}
                                {activeTab === "archived" && (
                                  <>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleUnarchiveClient(
                                          client.id,
                                          client.name
                                        );
                                      }}
                                      disabled={archivingClientId === client.id}
                                      className="p-0.5 rounded transition-all duration-200 hover:scale-110 disabled:opacity-50 flex-shrink-0"
                                      style={{
                                        color: COLORS.GREEN_PRIMARY,
                                        backgroundColor: "transparent",
                                      }}
                                      onMouseEnter={e => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.color =
                                            COLORS.GREEN_DARK;
                                        }
                                      }}
                                      onMouseLeave={e => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.color =
                                            COLORS.GREEN_PRIMARY;
                                        }
                                      }}
                                      title="Unarchive client"
                                    >
                                      {archivingClientId === client.id ? (
                                        <div
                                          className="animate-spin rounded-full h-2.5 w-2.5 border-b-2"
                                          style={{
                                            borderColor: COLORS.GREEN_PRIMARY,
                                          }}
                                        />
                                      ) : (
                                        <Archive className="h-2.5 w-2.5" />
                                      )}
                                    </button>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleDeleteClient(
                                          client.id,
                                          client.name
                                        );
                                      }}
                                      disabled={deleteClient.isPending}
                                      className="p-0.5 rounded transition-all duration-200 hover:scale-110 disabled:opacity-50 flex-shrink-0"
                                      style={{
                                        color: COLORS.RED_ALERT,
                                        backgroundColor: "transparent",
                                      }}
                                      onMouseEnter={e => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.color =
                                            COLORS.RED_DARK;
                                        }
                                      }}
                                      onMouseLeave={e => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.color =
                                            COLORS.RED_ALERT;
                                        }
                                      }}
                                      title="Permanently delete client"
                                    >
                                      {deleteClient.isPending ? (
                                        <div
                                          className="animate-spin rounded-full h-2.5 w-2.5 border-b-2"
                                          style={{
                                            borderColor: COLORS.RED_ALERT,
                                          }}
                                        />
                                      ) : (
                                        <Trash2 className="h-2.5 w-2.5" />
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                              <p
                                className="text-xs mb-0.5"
                                style={{ color: COLORS.TEXT_SECONDARY }}
                              >
                                Added{" "}
                                {format(
                                  new Date(client.createdAt),
                                  "MMM d, yyyy"
                                )}
                              </p>
                              {client.email && (
                                <p
                                  className="text-xs flex items-center gap-1"
                                  style={{ color: "#9CA3B0" }}
                                >
                                  <Mail className="h-3 w-3" />
                                  {client.email}
                                </p>
                              )}

                              {/* Next Lesson */}
                              {activeTab === "active" && (
                                <div className="mt-1">
                                  <p
                                    className="text-[10px] font-medium mb-0.5"
                                    style={{ color: COLORS.TEXT_SECONDARY }}
                                  >
                                    Next Lesson:
                                  </p>
                                  <p
                                    className="text-xs font-semibold"
                                    style={{ color: COLORS.TEXT_PRIMARY }}
                                  >
                                    {isValidLessonDate(client.nextLessonDate)
                                      ? format(
                                          new Date(client.nextLessonDate!),
                                          "MMM d, yyyy"
                                        )
                                      : "No lesson scheduled"}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-start gap-1.5 ml-2">
                              {activeTab === "active" && (
                                <>
                                  <button
                                    ref={setQuickMessageButtonRef}
                                    onClick={e => {
                                      e.stopPropagation();
                                      openQuickMessage(client, e.currentTarget);
                                    }}
                                    className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0"
                                    style={{
                                      color: COLORS.TEXT_SECONDARY,
                                      backgroundColor: "transparent",
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.color =
                                        COLORS.TEXT_PRIMARY;
                                      e.currentTarget.style.backgroundColor =
                                        COLORS.BACKGROUND_CARD_HOVER;
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.color =
                                        COLORS.TEXT_SECONDARY;
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }}
                                    title="Send message"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      openNotes(client);
                                    }}
                                    className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0"
                                    style={{
                                      color: COLORS.TEXT_SECONDARY,
                                      backgroundColor: "transparent",
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.color =
                                        COLORS.TEXT_PRIMARY;
                                      e.currentTarget.style.backgroundColor =
                                        COLORS.BACKGROUND_CARD_HOVER;
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.color =
                                        COLORS.TEXT_SECONDARY;
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }}
                                    title="Add feedback"
                                  >
                                    <PenTool className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      setSelectedClientForProfile(client);
                                      setIsProfileModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0"
                                    style={{
                                      color: COLORS.TEXT_SECONDARY,
                                      backgroundColor: "transparent",
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.color =
                                        COLORS.TEXT_PRIMARY;
                                      e.currentTarget.style.backgroundColor =
                                        COLORS.BACKGROUND_CARD_HOVER;
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.color =
                                        COLORS.TEXT_SECONDARY;
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }}
                                    title="Edit client"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modals */}
        {selectedClientForProfile && (
          <ClientProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => {
              setIsProfileModalOpen(false);
              setSelectedClientForProfile(null);
            }}
            clientId={selectedClientForProfile.id}
            clientName={selectedClientForProfile.name}
            clientEmail={selectedClientForProfile.email}
            clientPhone={selectedClientForProfile.phone}
            clientNotes={selectedClientForProfile.notes
              .map(note => note.content)
              .join("\n\n")}
            clientAvatar={selectedClientForProfile.avatar}
          />
        )}

        <ClientRequestsModal
          isOpen={isRequestsModalOpen}
          onClose={() => setIsRequestsModalOpen(false)}
        />

        {/* Notes Modal */}
        {isNotesModalOpen && notesClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsNotesModalOpen(false)}
            />
            <div
              className="relative w-full max-w-4xl rounded-xl md:rounded-2xl shadow-2xl border p-4 md:p-6 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-lg md:text-xl font-bold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Notes for {notesClient.name}
                </h3>
                <button
                  onClick={() => setIsNotesModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <NotesDisplay
                clientId={notesClient.id}
                isClientView={false}
                showComposer={true}
              />
            </div>
          </div>
        )}

        {/* Quick Message Popup */}
        {isQuickMessageOpen && quickMessageClient && (
          <QuickMessagePopup
            isOpen={isQuickMessageOpen}
            onClose={closeQuickMessage}
            client={quickMessageClient}
            buttonRef={{ current: quickMessageButtonRef }}
          />
        )}
      </div>
    </Sidebar>
  );
}

// Export with mobile detection
export default withMobileDetection(MobileClientsPage, ClientsPage);
