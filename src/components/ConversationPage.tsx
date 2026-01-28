"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import {
  Send,
  Paperclip,
  ArrowLeft,
  Check,
  CheckCheck,
  MoreVertical,
  Archive,
  Trash2,
  User,
  Clock,
  Image as ImageIcon,
  File,
  Video,
  Music,
  X,
  Download,
} from "lucide-react";
import Sidebar from "./Sidebar";
import { format } from "date-fns";
import MessageFileUpload from "./MessageFileUpload";
import MessageNotification from "./MessageNotification";
import FormattedMessage from "./FormattedMessage";
import { downloadVideoFromMessage } from "@/lib/download-utils";
import { COLORS, getGoldenAccent, getRedAlert } from "@/lib/colors";

interface ConversationPageProps {
  conversationId: string;
}

export default function ConversationPage({
  conversationId,
}: ConversationPageProps) {
  const router = useRouter();
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    uploadData: {
      attachmentUrl: string;
      attachmentType: string;
      attachmentName: string;
      attachmentSize: number;
    };
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get current user info
  const { data: currentUser } = trpc.user.getProfile.useQuery();

  // Get conversation details
  const { data: conversation, error: conversationError } =
    trpc.messaging.getConversation.useQuery(
      { conversationId },
      { refetchInterval: false } // NO POLLING - updates via Supabase Realtime
    );

  // Debug logging
  useEffect(() => {
    if (conversationError) {
      console.error("❌ Conversation error:", conversationError);
    }
    if (conversation) {
      console.log("✅ Conversation loaded:", conversation.id);
    }
  }, [conversation, conversationError]);

  // Get messages
  const { data: messages = [], refetch: refetchMessages } =
    trpc.messaging.getMessages.useQuery(
      { conversationId },
      { refetchInterval: false } // NO POLLING - updates via Supabase Realtime
    ) as { data: any[]; refetch: any };

  // Mutations
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation({
    onSuccess: (data: any) => {
      console.log("Message sent successfully:", data);
      setMessageText("");
      setSelectedFile(null);
      refetchMessages();
    },
    onError: (error: any) => {
      console.error("Failed to send message:", error);
    },
  }) as any;

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
      refetchMessages();
    },
  });

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversationId && currentUser) {
      markAsReadMutation.mutate({ conversationId });
    }
  }, [conversationId, currentUser]);

  // Handle click outside menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowConversationMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle sending message
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim() && !selectedFile) return;

    console.log("Sending message with data:", {
      conversationId,
      content: messageText.trim() || "",
      selectedFile: selectedFile
        ? {
            attachmentUrl: selectedFile.uploadData.attachmentUrl,
            attachmentType: selectedFile.uploadData.attachmentType,
            attachmentName: selectedFile.uploadData.attachmentName,
            attachmentSize: selectedFile.uploadData.attachmentSize,
          }
        : null,
    });

    sendMessageMutation.mutate({
      conversationId,
      content: messageText.trim() || "",
      ...(selectedFile && {
        attachmentUrl: selectedFile.uploadData.attachmentUrl,
        attachmentType: selectedFile.uploadData.attachmentType,
        attachmentName: selectedFile.uploadData.attachmentName,
        attachmentSize: selectedFile.uploadData.attachmentSize,
      }),
    });
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

  // Get other user in conversation
  const getOtherUser = () => {
    if (!conversation || !currentUser || !conversation.coach) return null;
    return conversation.coach.id === currentUser.id
      ? conversation.client
      : conversation.coach;
  };

  const otherUser = getOtherUser();

  if (!conversation || !otherUser) {
    return (
      <Sidebar>
        <div
          className="min-h-screen"
          style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
        >
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2
                className="text-xl font-semibold mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Conversation Not Found
              </h2>
              <p className="mb-4" style={{ color: COLORS.TEXT_SECONDARY }}>
                The conversation you're looking for doesn't exist.
              </p>
              <button
                onClick={() => router.push("/messages")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: COLORS.GOLDEN_ACCENT,
                  color: "#ffffff",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_HOVER;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Messages
              </button>
            </div>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div
        className="min-h-screen"
        style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
      >
        {/* Hero Header */}
        <div className="mb-8">
          <div
            className="rounded-2xl border relative overflow-hidden group"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <div
              className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, ${getGoldenAccent(
                  0.3
                )} 0%, ${getGoldenAccent(0.2)} 50%, ${getGoldenAccent(
                  0.1
                )} 100%)`,
              }}
            />
            <div className="relative p-8 bg-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.push("/messages")}
                    className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_CARD,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.BACKGROUND_CARD;
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        backgroundColor: getGoldenAccent(0.2),
                        color: COLORS.GOLDEN_ACCENT,
                      }}
                    >
                      {otherUser.name?.[0] || otherUser.email?.[0] || "U"}
                    </div>
                    <div>
                      <h1
                        className="text-2xl font-bold mb-1"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {otherUser.name ||
                          otherUser.email?.split("@")[0] ||
                          "Unknown User"}
                      </h1>
                      <p
                        className="text-sm"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        {otherUser.email || "No email"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() =>
                        setShowConversationMenu(!showConversationMenu)
                      }
                      className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor =
                          COLORS.BACKGROUND_CARD_HOVER;
                        e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {showConversationMenu && (
                      <div
                        className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-50"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                          border: "1px solid",
                          boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px ${getGoldenAccent(
                            0.1
                          )}`,
                        }}
                      >
                        <button
                          className="w-full px-4 py-2 text-left flex items-center gap-2 transition-all duration-200 hover:scale-105"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor =
                              COLORS.BACKGROUND_CARD_HOVER;
                            e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                          }}
                        >
                          <Archive className="h-4 w-4" />
                          Archive Conversation
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left flex items-center gap-2 transition-all duration-200 hover:scale-105"
                          style={{ color: COLORS.RED_ALERT }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor =
                              getRedAlert(0.1);
                            e.currentTarget.style.color = COLORS.RED_ALERT;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color = COLORS.RED_ALERT;
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div
          className="flex flex-col h-[calc(100vh-200px)] rounded-2xl border overflow-hidden shadow-xl"
          style={{
            backgroundColor: COLORS.BACKGROUND_CARD,
            borderColor: COLORS.BORDER_SUBTLE,
            boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px ${getGoldenAccent(
              0.1
            )}`,
          }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div
                    className="h-20 w-20 mx-auto mb-6 opacity-50 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      backgroundColor: getGoldenAccent(0.1),
                      color: COLORS.GOLDEN_ACCENT,
                    }}
                  >
                    <File className="h-10 w-10" />
                  </div>
                  <h3
                    className="text-2xl font-bold mb-3 tracking-tight"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    No messages yet
                  </h3>
                  <p
                    className="text-lg font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Start the conversation by sending a message
                  </p>
                </div>
              </div>
            ) : (
              messages.map(message => {
                const isCurrentUser = message.sender.id === currentUser?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-2xl ${
                        isCurrentUser ? "rounded-br-sm" : "rounded-bl-sm"
                      }`}
                      style={{
                        backgroundColor: isCurrentUser
                          ? COLORS.GOLDEN_ACCENT
                          : COLORS.BACKGROUND_CARD,
                        color: isCurrentUser ? "#000000" : COLORS.TEXT_PRIMARY,
                        border: "1px solid",
                        borderColor: isCurrentUser
                          ? COLORS.GOLDEN_BORDER
                          : COLORS.BORDER_SUBTLE,
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {message.content && (
                        <div className="text-sm mb-2">
                          <FormattedMessage content={message.content} />
                        </div>
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
                                  window.open(message.attachmentUrl, "_blank")
                                }
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="text-white text-sm font-medium">
                                  Click to view
                                </span>
                              </div>
                            </div>
                          ) : message.attachmentType?.startsWith("video/") ? (
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
                              {/* Download button for coaches */}
                              {currentUser?.role === "COACH" && (
                                <button
                                  onClick={() =>
                                    handleDownloadVideo(message.id)
                                  }
                                  className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                                  title="Download video"
                                >
                                  <Download className="h-4 w-4 text-white" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <a
                              href={message.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
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
                              {message.attachmentType?.startsWith("audio/") ? (
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

                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span
                          className="text-xs"
                          style={{
                            color: isCurrentUser
                              ? "rgba(0, 0, 0, 0.6)"
                              : COLORS.TEXT_MUTED,
                          }}
                        >
                          {format(new Date(message.createdAt), "h:mm a")}
                        </span>
                        {isCurrentUser && (
                          <>
                            {message.isRead ? (
                              <CheckCheck
                                className="h-3 w-3"
                                style={{ color: "rgba(0, 0, 0, 0.6)" }}
                              />
                            ) : (
                              <Check
                                className="h-3 w-3"
                                style={{ color: "rgba(0, 0, 0, 0.6)" }}
                              />
                            )}
                          </>
                        )}
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
            className="p-4 border-t"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              backgroundColor: COLORS.BACKGROUND_DARK,
            }}
          >
            {/* Selected File Indicator */}
            {selectedFile && (
              <div
                className="mb-3 p-3 rounded-xl flex items-center justify-between border"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
              >
                <div className="flex items-center gap-3">
                  {selectedFile.file.type.startsWith("image/") ? (
                    <ImageIcon
                      className="h-5 w-5"
                      style={{ color: COLORS.GOLDEN_ACCENT }}
                    />
                  ) : selectedFile.file.type.startsWith("video/") ? (
                    <Video
                      className="h-5 w-5"
                      style={{ color: COLORS.GOLDEN_ACCENT }}
                    />
                  ) : (
                    <File
                      className="h-5 w-5"
                      style={{ color: COLORS.GOLDEN_ACCENT }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-sm font-medium block truncate"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {selectedFile.file.name}
                    </span>
                    <span
                      className="text-xs opacity-75"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      Ready to send
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{ color: COLORS.RED_ALERT }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = getRedAlert(0.1);
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-3"
            >
              <button
                type="button"
                onClick={() => setShowFileUpload(true)}
                className="p-3 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ color: COLORS.TEXT_MUTED }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = getGoldenAccent(0.1);
                  e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = COLORS.TEXT_MUTED;
                }}
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 focus:outline-none"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                    border: "1px solid",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_DARK;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(
                      0.2
                    )}`;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <div
                  className="absolute bottom-1 right-2 text-xs opacity-50"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  Shift+Enter for new line
                </div>
              </div>
              <button
                type="submit"
                disabled={
                  (!messageText.trim() && !selectedFile) ||
                  sendMessageMutation.isPending
                }
                className="p-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  backgroundColor:
                    messageText.trim() || selectedFile
                      ? COLORS.GOLDEN_ACCENT
                      : COLORS.TEXT_MUTED,
                  color:
                    messageText.trim() || selectedFile
                      ? "#ffffff"
                      : COLORS.TEXT_SECONDARY,
                }}
                onMouseEnter={e => {
                  if (messageText.trim() || selectedFile) {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_HOVER;
                  }
                }}
                onMouseLeave={e => {
                  if (messageText.trim() || selectedFile) {
                    e.currentTarget.style.backgroundColor =
                      COLORS.GOLDEN_ACCENT;
                  }
                }}
                title="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
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
    </Sidebar>
  );
}
