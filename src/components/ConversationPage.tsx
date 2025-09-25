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
import { downloadVideoFromMessage } from "@/lib/download-utils";

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
  const { data: conversation } = trpc.messaging.getConversation.useQuery(
    { conversationId },
    { refetchInterval: 5000 }
  );

  // Get messages
  const { data: messages = [], refetch: refetchMessages } =
    trpc.messaging.getMessages.useQuery(
      { conversationId },
      { refetchInterval: 3000 }
    );

  // Mutations
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation({
    onSuccess: data => {
      console.log("Message sent successfully:", data);
      setMessageText("");
      setSelectedFile(null);
      refetchMessages();
    },
    onError: error => {
      console.error("Failed to send message:", error);
    },
  });

  const markAsReadMutation = trpc.messaging.markAsRead.useMutation({
    onSuccess: () => {
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
        <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2
                className="text-xl font-semibold mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Conversation Not Found
              </h2>
              <p className="mb-4" style={{ color: "#ABA4AA" }}>
                The conversation you're looking for doesn't exist.
              </p>
              <button
                onClick={() => router.push("/messages")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: "#4A5A70",
                  color: "#C3BCC2",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#606364";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#4A5A70";
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
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
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
                  <button
                    onClick={() => router.push("/messages")}
                    className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: "#374151", color: "#ffffff" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#6b7280";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "#374151";
                    }}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ backgroundColor: "#374151", color: "#ffffff" }}
                    >
                      {otherUser.name?.[0] || otherUser.email?.[0] || "U"}
                    </div>
                    <div>
                      <h1
                        className="text-2xl font-bold mb-1"
                        style={{ color: "#C3BCC2" }}
                      >
                        {otherUser.name ||
                          otherUser.email?.split("@")[0] ||
                          "Unknown User"}
                      </h1>
                      <p className="text-sm" style={{ color: "#ABA4AA" }}>
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
                      style={{ color: "#ABA4AA" }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "#1f2937";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {showConversationMenu && (
                      <div
                        className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-50"
                        style={{
                          backgroundColor: "#353A3A",
                          borderColor: "#606364",
                          border: "1px solid",
                        }}
                      >
                        <button
                          className="w-full px-4 py-2 text-left flex items-center gap-2 transition-all duration-200 hover:scale-105"
                          style={{ color: "#ABA4AA" }}
                        >
                          <Archive className="h-4 w-4" />
                          Archive Conversation
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left flex items-center gap-2 transition-all duration-200 hover:scale-105"
                          style={{ color: "#EF4444" }}
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
            backgroundColor: "#1E1E1E",
            borderColor: "#374151",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div
                    className="h-20 w-20 mx-auto mb-6 opacity-50 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: "#374151", color: "#ffffff" }}
                  >
                    <File className="h-10 w-10" />
                  </div>
                  <h3
                    className="text-2xl font-bold mb-3 tracking-tight"
                    style={{ color: "#ffffff" }}
                  >
                    No messages yet
                  </h3>
                  <p
                    className="text-lg font-medium"
                    style={{ color: "#9ca3af" }}
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
                        backgroundColor: isCurrentUser ? "#3B82F6" : "#374151",
                        color: "#ffffff",
                        border: "1px solid",
                        borderColor: isCurrentUser ? "#2563EB" : "#4B5563",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {message.content && (
                        <p className="text-sm mb-2">{message.content}</p>
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
                                  ? "#1E40AF"
                                  : "#2A3133",
                                color: "#ffffff",
                                border: "1px solid",
                                borderColor: isCurrentUser
                                  ? "#1D4ED8"
                                  : "#606364",
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
                        <span className="text-xs" style={{ color: "#ABA4AA" }}>
                          {format(new Date(message.createdAt), "h:mm a")}
                        </span>
                        {isCurrentUser && (
                          <>
                            {message.isRead ? (
                              <CheckCheck
                                className="h-3 w-3"
                                style={{ color: "#ABA4AA" }}
                              />
                            ) : (
                              <Check
                                className="h-3 w-3"
                                style={{ color: "#ABA4AA" }}
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
            className="p-4 border-t bg-gray-50/5"
            style={{ borderColor: "#374151" }}
          >
            {/* Selected File Indicator */}
            {selectedFile && (
              <div
                className="mb-3 p-3 rounded-xl flex items-center justify-between border"
                style={{
                  backgroundColor: "#1f2937",
                  borderColor: "#374151",
                }}
              >
                <div className="flex items-center gap-3">
                  {selectedFile.file.type.startsWith("image/") ? (
                    <ImageIcon
                      className="h-5 w-5"
                      style={{ color: "#3B82F6" }}
                    />
                  ) : selectedFile.file.type.startsWith("video/") ? (
                    <Video className="h-5 w-5" style={{ color: "#3B82F6" }} />
                  ) : (
                    <File className="h-5 w-5" style={{ color: "#3B82F6" }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-sm font-medium block truncate"
                      style={{ color: "#f9fafb" }}
                    >
                      {selectedFile.file.name}
                    </span>
                    <span
                      className="text-xs opacity-75"
                      style={{ color: "#9CA3AF" }}
                    >
                      Ready to send
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-red-500/20"
                  style={{ color: "#EF4444" }}
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
                className="p-3 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-blue-500/10"
                style={{ color: "#6B7280" }}
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
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                    color: "#f9fafb",
                    border: "1px solid",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#3B82F6";
                    e.currentTarget.style.backgroundColor = "#111827";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "#374151";
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                />
                <div
                  className="absolute bottom-1 right-2 text-xs opacity-50"
                  style={{ color: "#9CA3AF" }}
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
                    messageText.trim() || selectedFile ? "#3B82F6" : "#6b7280",
                  color: "#ffffff",
                }}
                onMouseEnter={e => {
                  if (messageText.trim() || selectedFile) {
                    e.currentTarget.style.backgroundColor = "#2563EB";
                  }
                }}
                onMouseLeave={e => {
                  if (messageText.trim() || selectedFile) {
                    e.currentTarget.style.backgroundColor = "#3B82F6";
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
