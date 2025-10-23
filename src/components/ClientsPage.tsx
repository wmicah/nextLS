"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileClientsPage from "./MobileClientsPage";
import {
  Plus,
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
  PenTool,
  Send,
  X,
} from "lucide-react";
import { format } from "date-fns";
import AddClientModal from "./AddClientModal";
import Sidebar from "./Sidebar";
import Link from "next/link";
import FormattedMessage from "./FormattedMessage";

import ClientProfileModal from "./ClientProfileModal";
import ProfilePictureUploader from "./ProfilePictureUploader";
import NotesDisplay from "./NotesDisplay";

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

  // Debug logging
  console.log("QuickMessagePopup Debug:", {
    clientId: client.id,
    clientUserId: client.userId,
    conversationsCount: conversations.length,
    conversations: conversations.map(conv => ({
      id: conv.id,
      type: conv.type,
      clientId: conv.clientId,
      clientUserId: conv.client?.id,
      messagesCount: conv.messages?.length || 0,
    })),
  });

  // Log each conversation to see the actual structure
  conversations.forEach((conv, index) => {
    console.log(`Conversation ${index}:`, {
      id: conv.id,
      type: conv.type,
      clientId: conv.clientId,
      clientUserId: conv.client?.id,
      coachId: conv.coachId,
      messagesCount: conv.messages?.length || 0,
    });
  });

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

  console.log("Found clientConversation:", clientConversation);

  // Debug the messages in the conversation
  if (clientConversation) {
    console.log("Conversation messages:", {
      conversationId: clientConversation.id,
      messagesCount: clientConversation.messages?.length || 0,
      messages:
        clientConversation.messages?.map(msg => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          createdAt: msg.createdAt,
        })) || [],
    });
  }

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
        className={`fixed w-[400px] h-[500px] max-w-[90vw] max-h-[80vh] rounded-lg shadow-lg border z-50 ${
          isAnimating && !isOpen
            ? "animate-[fadeOut_0.2s_ease-in-out_forwards]"
            : isAnimating
            ? "animate-[slideInDown_0.3s_ease-out_forwards]"
            : "transform scale-100 opacity-100"
        }`}
        style={{
          top: buttonPosition.top,
          left: buttonPosition.left,
          backgroundColor: "#353A3A",
          borderColor: "#606364",
          transformOrigin: "top center",
          animation:
            !isAnimating && isOpen ? "slideInDown 0.3s ease-out" : undefined,
          boxShadow:
            "0 20px 40px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
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
                Messages with {client.name}
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
          <div
            className="flex-1 overflow-y-auto"
            style={{
              maxHeight: "350px", // Reduced for smaller popup
              minHeight: "200px", // Reduced minimum height
            }}
          >
            {!conversationToUse || conversationToUse.messages.length === 0 ? (
              <div className="p-4 text-center">
                <MessageCircle
                  className="h-8 w-8 mx-auto mb-2 opacity-50"
                  style={{ color: "#ABA4AA" }}
                />
                <p className="text-sm" style={{ color: "#ABA4AA" }}>
                  No messages with {client.name} yet
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {conversationToUse.messages
                  .slice()
                  .reverse()
                  .map((message: any, index: number) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.senderId === currentUserId
                          ? "ml-8 bg-[#4A5A70]"
                          : "mr-8 bg-[#2A3133]"
                      }`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation:
                          isOpen && !isAnimating
                            ? `slideInLeft 0.3s ease-out ${index * 50}ms both`
                            : undefined,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <FormattedMessage content={message.content} />
                        </div>
                        <span
                          className="text-xs ml-2 flex-shrink-0"
                          style={{ color: "#ABA4AA" }}
                        >
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          {conversationToUse && (
            <div className="p-3 border-t" style={{ borderColor: "#606364" }}>
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
                  className="flex-1 px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                  disabled={isSending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || isSending}
                  className="px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{
                    backgroundColor: "#4A5A70",
                    color: "white",
                  }}
                  onMouseEnter={e => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#5A6A80";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#4A5A70";
                    }
                  }}
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-3 border-t" style={{ borderColor: "#606364" }}>
            <Link
              href="/messages"
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

// Small Invite Code Button Component
function InviteCodeButton() {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const generateInviteCode = trpc.user.generateInviteCode.useMutation();

  const handleGenerateInviteCode = () => {
    generateInviteCode.mutate();
  };

  const handleCopyInviteCode = () => {
    if (generateInviteCode.data?.inviteCode) {
      navigator.clipboard.writeText(generateInviteCode.data.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
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
        <Key className="h-4 w-4" />
        Invite Code
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-[#2B3038] border border-[#4A5A70] rounded-lg p-4 shadow-xl z-50">
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-5 w-5 text-[#4A5A70]" />
            <h3 className="font-semibold text-white">Coach Invite Code</h3>
          </div>

          {!generateInviteCode.data?.inviteCode ? (
            <div className="space-y-3">
              <p className="text-sm text-[#C3BCC2]">
                Generate a unique invite code to share with your athletes
              </p>
              <button
                onClick={handleGenerateInviteCode}
                disabled={generateInviteCode.isPending}
                className="w-full bg-[#4A5A70] hover:bg-[#606364] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <div className="space-y-3">
              <p className="text-sm text-[#C3BCC2]">
                Share this code with your athletes
              </p>
              <div className="flex items-center gap-2">
                <input
                  type={isVisible ? "text" : "password"}
                  value={generateInviteCode.data.inviteCode}
                  readOnly
                  className="flex-1 px-3 py-2 bg-[#2A3133] border border-[#606364] rounded-lg text-white font-mono text-sm"
                />
                <button
                  onClick={() => setIsVisible(!isVisible)}
                  className="p-2 text-[#ABA4AA] hover:text-white transition-colors"
                  title={isVisible ? "Hide code" : "Show code"}
                >
                  {isVisible ? "👁️" : "👁️‍🗨️"}
                </button>
                <button
                  onClick={handleCopyInviteCode}
                  className="p-2 bg-[#4A5A70] hover:bg-[#606364] text-white rounded-lg transition-colors"
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
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Copied to clipboard!
                </p>
              )}
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
    (req: any) =>
      req.type === "CLIENT_JOIN_REQUEST" &&
      req.title === "New Athlete Join Request" // Only show email-based requests that need approval
  );

  return (
    <button
      onClick={onOpenModal}
      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
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
      <Mail className="h-4 w-4" />
      Requests
      {clientRequests.length > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
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

  // Get pending client requests
  const { data: pendingRequests = [], refetch } =
    trpc.notifications.getNotifications.useQuery({
      unreadOnly: true,
      limit: 50,
    });

  const clientRequests = pendingRequests.filter(
    (req: any) =>
      req.type === "CLIENT_JOIN_REQUEST" &&
      req.title === "New Athlete Join Request" // Only show email-based requests that need approval
  );

  const acceptRequest = trpc.user.acceptClientRequest.useMutation({
    onSuccess: () => {
      refetch();
      utils.clients.list.invalidate();
    },
  });

  const rejectRequest = trpc.user.rejectClientRequest.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2B3038] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Client Join Requests
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {clientRequests.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientRequests.map((request: any) => (
              <div
                key={request.id}
                className="bg-[#353A3A] rounded-lg p-4 border border-[#4A5A70]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {request.data?.clientName || "Unknown Client"}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {request.data?.clientEmail || "No email provided"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Requested{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        acceptRequest.mutate({ notificationId: request.id });
                      }}
                      disabled={
                        acceptRequest.isPending || rejectRequest.isPending
                      }
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        rejectRequest.mutate({ notificationId: request.id });
                      }}
                      disabled={
                        acceptRequest.isPending || rejectRequest.isPending
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
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
  programAssignments?: {
    id: string;
    programId: string;
    assignedAt: string;
    progress: number;
    program: {
      id: string;
      title: string;
      status: string;
      sport: string | null;
      level: string;
    };
  }[];
}

function ClientsPage() {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
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

  // Get counts for both tabs
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
    const allClientIds = new Set(
      filteredAndSortedClients.map(client => client.id)
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
      Notes: client.notes.map(note => note.content).join("; "),
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
                  <td>${client.notes.map(note => note.content).join("; ")}</td>
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

  // Filter and sort clients
  const filteredAndSortedClients = clients
    .filter(
      (client: Client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email &&
          client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a: Client, b: Client) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "createdAt":
          // For "Newest First" (asc), we want descending date order
          // For "Oldest First" (desc), we want ascending date order
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "nextLesson":
          // Handle lesson date sorting properly
          const now = new Date();
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          // Get the actual next lesson date for each client
          const getNextLessonDate = (client: Client) => {
            if (client.nextLessonDate) {
              const lessonDate = new Date(client.nextLessonDate);
              // If lesson is in the future (after today), it's valid
              // If lesson is today or in the past, treat as no lesson
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
            new Date(a.nextLessonDate) > now; // Only count today if time hasn't passed
          const bHasLessonToday =
            b.nextLessonDate &&
            new Date(b.nextLessonDate).getTime() === today.getTime() &&
            new Date(b.nextLessonDate) > now; // Only count today if time hasn't passed

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
          }
          // If only one has upcoming lesson, put the one with lesson first
          else if (aNextLesson && !bNextLesson) {
            return -1;
          } else if (!aNextLesson && bNextLesson) {
            return 1;
          }
          // Both have no upcoming lessons, sort by creation date
          else {
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
          }
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortBy === "createdAt") {
        // For date sorting, we need to reverse the logic
        // "Newest First" (asc) = descending date order
        // "Oldest First" (desc) = ascending date order
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
    });

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

  if (isLoading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "#4A5A70" }}
          />
        </div>
      </Sidebar>
    );
  }

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
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        {/* Simplified Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Users className="h-4 w-4" style={{ color: "#C3BCC2" }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#C3BCC2" }}>
                  Your Athletes
                </h1>
                <p className="text-sm" style={{ color: "#ABA4AA" }}>
                  {activeTab === "active"
                    ? activeClients > 0
                      ? `${activeClients} active athlete${
                          activeClients === 1 ? "" : "s"
                        }`
                      : "No active athletes"
                    : archivedClients > 0
                    ? `${archivedClients} archived athlete${
                        archivedClients === 1 ? "" : "s"
                      }`
                    : "No archived athletes"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleBulkMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  isBulkMode ? "ring-2 ring-blue-400" : ""
                }`}
                style={{
                  backgroundColor: isBulkMode ? "#4A5A70" : "#606364",
                  color: "#C3BCC2",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#4A5A70";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = isBulkMode
                    ? "#4A5A70"
                    : "#606364";
                }}
              >
                <Users className="h-4 w-4" />
                {isBulkMode ? "Exit Bulk Mode" : "Bulk Select"}
              </button>

              {/* Invite Code Button */}
              <InviteCodeButton />

              {/* Requests Button */}
              <RequestsButton
                onOpenModal={() => setIsRequestsModalOpen(true)}
              />

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
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
                <Plus className="h-4 w-4" />
                Add Athlete
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div
            className="flex space-x-1 p-1 rounded-xl border"
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === "active" ? "shadow-lg" : ""
              }`}
              style={{
                backgroundColor:
                  activeTab === "active" ? "#4A5A70" : "transparent",
                color: activeTab === "active" ? "#FFFFFF" : "#ABA4AA",
              }}
              onMouseEnter={e => {
                if (activeTab !== "active") {
                  e.currentTarget.style.backgroundColor = "#3A4040";
                  e.currentTarget.style.color = "#C3BCC2";
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== "active") {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#ABA4AA";
                }
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                <span>Active Athletes</span>
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor:
                      activeTab === "active" ? "#FFFFFF" : "#4A5A70",
                    color: activeTab === "active" ? "#4A5A70" : "#C3BCC2",
                  }}
                >
                  {activeClientsData.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === "archived" ? "shadow-lg" : ""
              }`}
              style={{
                backgroundColor:
                  activeTab === "archived" ? "#4A5A70" : "transparent",
                color: activeTab === "archived" ? "#FFFFFF" : "#ABA4AA",
              }}
              onMouseEnter={e => {
                if (activeTab !== "archived") {
                  e.currentTarget.style.backgroundColor = "#3A4040";
                  e.currentTarget.style.color = "#C3BCC2";
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== "archived") {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#ABA4AA";
                }
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <span>Archived Athletes</span>
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor:
                      activeTab === "archived" ? "#FFFFFF" : "#4A5A70",
                    color: activeTab === "archived" ? "#4A5A70" : "#C3BCC2",
                  }}
                >
                  {archivedClientsData.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Enhanced Search and Filters - Matching Programs/Library */}
        <div
          className="rounded-xl p-4 mb-8 shadow-xl border relative"
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className="flex gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: "#ABA4AA" }}
              />
              <input
                type="text"
                placeholder="Search athletes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-300 text-sm"
                style={{
                  backgroundColor: "#606364",
                  borderColor: "#ABA4AA",
                  color: "#C3BCC2",
                }}
              />
            </div>

            {/* Filters - Right Side */}
            <div className="flex gap-2 items-center flex-shrink-0">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-300 text-sm whitespace-nowrap"
                style={{
                  backgroundColor: "#606364",
                  borderColor: "#ABA4AA",
                  color: "#C3BCC2",
                }}
              >
                <option value="name">
                  Name {sortOrder === "asc" ? "(A-Z)" : "(Z-A)"}
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
                className="p-2.5 rounded-lg border transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: sortOrder === "desc" ? "#4A5A70" : "#606364",
                  borderColor: "#ABA4AA",
                  color: "#C3BCC2",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor =
                    sortOrder === "desc" ? "#606364" : "#4A5A70";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor =
                    sortOrder === "desc" ? "#4A5A70" : "#606364";
                }}
                title={
                  sortOrder === "asc" ? "Sort ascending" : "Sort descending"
                }
              >
                {sortOrder === "asc" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {/* View Mode Toggle */}
              <div
                className="flex rounded-lg border overflow-hidden"
                style={{ borderColor: "#ABA4AA" }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-all duration-200`}
                  style={{
                    backgroundColor:
                      viewMode === "grid" ? "#4A5A70" : "#606364",
                    color: "#C3BCC2",
                  }}
                  title="Grid View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-all duration-200`}
                  style={{
                    backgroundColor:
                      viewMode === "list" ? "#4A5A70" : "#606364",
                    color: "#C3BCC2",
                  }}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {isBulkMode && (
          <div
            className="mb-4 p-4 rounded-lg border"
            style={{ backgroundColor: "#353A3A", borderColor: "#4A5A70" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <Users className="h-3 w-3" style={{ color: "#C3BCC2" }} />
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#C3BCC2" }}
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
                  className="text-sm px-3 py-1 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: "#4A5A70",
                    color: "#C3BCC2",
                    border: "1px solid #606364",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#606364";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#4A5A70";
                  }}
                >
                  Select All ({filteredAndSortedClients.length})
                </button>
                {selectedClients.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-sm px-3 py-1 rounded-lg transition-all duration-200"
                    style={{
                      backgroundColor: "transparent",
                      color: "#ABA4AA",
                      border: "1px solid #606364",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#3A4040";
                      e.currentTarget.style.color = "#C3BCC2";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#ABA4AA";
                    }}
                  >
                    Clear Selection
                  </button>
                )}
              </div>
              {selectedClients.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: "#10B981",
                      color: "#FFFFFF",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#059669";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "#10B981";
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: "#3B82F6",
                      color: "#FFFFFF",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#2563EB";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "#3B82F6";
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </button>
                  {activeTab === "active" && (
                    <button
                      onClick={handleBulkArchive}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: "#F59E0B",
                        color: "#FFFFFF",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "#D97706";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "#F59E0B";
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
          <div className="mb-4">
            <p className="text-sm" style={{ color: "#ABA4AA" }}>
              {filteredAndSortedClients.length} of {totalClients}{" "}
              {totalClients === 1 ? "athlete" : "athletes"}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        )}

        {/* Enhanced Athletes List/Grid */}
        {filteredAndSortedClients.length === 0 ? (
          <div
            className="rounded-xl border text-center relative overflow-hidden"
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div className="relative p-8">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Users className="h-8 w-8" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: "#C3BCC2" }}
              >
                {searchTerm
                  ? "No athletes found"
                  : activeTab === "active"
                  ? "No active athletes"
                  : "No archived athletes"}
              </h3>
              <p className="mb-6 max-w-sm mx-auto" style={{ color: "#ABA4AA" }}>
                {searchTerm
                  ? `No athletes match "${searchTerm}". Try a different search term.`
                  : activeTab === "active"
                  ? "Add your first athlete to start building your coaching team."
                  : "No athletes have been archived yet."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 font-medium mx-auto"
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
                  <Plus className="h-4 w-4" />
                  {activeTab === "active"
                    ? "Add Your First Athlete"
                    : "Add Athlete"}
                </button>
              )}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-sm px-4 py-2 rounded-lg transition-all duration-200 mx-auto"
                  style={{
                    backgroundColor: "transparent",
                    color: "#ABA4AA",
                    border: "1px solid #606364",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#3A4040";
                    e.currentTarget.style.color = "#C3BCC2";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#ABA4AA";
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAndSortedClients.map(
                    (client: Client, index: number) => (
                      <div
                        key={client.id}
                        className="rounded-xl border transition-all duration-200 hover:shadow-lg cursor-pointer relative overflow-hidden group"
                        style={{
                          backgroundColor: "#353A3A",
                          borderColor: "#606364",
                        }}
                        onClick={() => {
                          if (!isBulkMode) {
                            handleOpenProfile(client);
                          }
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#3A4040";
                          e.currentTarget.style.borderColor = "#4A5A70";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "#353A3A";
                          e.currentTarget.style.borderColor = "#606364";
                        }}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
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
                                  if (activeTab === "active") {
                                    handleArchiveClient(client.id, client.name);
                                  } else {
                                    handleUnarchiveClient(
                                      client.id,
                                      client.name
                                    );
                                  }
                                }}
                                disabled={archivingClientId === client.id}
                                className="relative transition-all duration-200 hover:scale-105 disabled:opacity-50 group"
                                onMouseEnter={e => {
                                  e.currentTarget.classList.add("hover-close");
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.classList.remove(
                                    "hover-close"
                                  );
                                }}
                                title={
                                  activeTab === "active"
                                    ? "Click to archive client"
                                    : "Click to unarchive client"
                                }
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
                                {/* Hover overlay with trash icon */}
                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover-close:opacity-100 transition-opacity duration-200">
                                  {archivingClientId === client.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                  ) : (
                                    <Trash2
                                      className="h-4 w-4 text-white"
                                      style={{
                                        color: "#EF4444", // Red color for both archive and unarchive
                                      }}
                                    />
                                  )}
                                </div>
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3
                                    className="text-base font-semibold truncate"
                                    style={{ color: "#C3BCC2" }}
                                  >
                                    {client.name}
                                  </h3>
                                  {/* Next Lesson Indicator */}
                                  {isValidLessonDate(client.nextLessonDate) && (
                                    <span
                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                      style={{
                                        backgroundColor: "#10B981",
                                        color: "#FFFFFF",
                                      }}
                                    >
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {format(
                                        new Date(client.nextLessonDate!),
                                        "MMM d"
                                      )}
                                    </span>
                                  )}
                                </div>
                                <p
                                  className="text-sm truncate"
                                  style={{ color: "#ABA4AA" }}
                                >
                                  {client.email || "No email"}
                                </p>
                                {/* Next Lesson */}
                                <div className="mt-2">
                                  <p
                                    className="text-xs font-medium mb-1"
                                    style={{ color: "#ABA4AA" }}
                                  >
                                    Next Lesson:
                                  </p>
                                  <p
                                    className="text-sm font-semibold"
                                    style={{ color: "#C3BCC2" }}
                                  >
                                    {isValidLessonDate(client.nextLessonDate)
                                      ? format(
                                          new Date(client.nextLessonDate!),
                                          "MMM d, yyyy"
                                        )
                                      : "No lesson scheduled"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 ml-2">
                              {activeTab === "active" ? (
                                <>
                                  <button
                                    ref={setQuickMessageButtonRef}
                                    onClick={e => {
                                      e.stopPropagation();
                                      openQuickMessage(client, e.currentTarget);
                                    }}
                                    className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                    style={{
                                      color: "#ABA4AA",
                                      backgroundColor: "transparent",
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.color = "#C3BCC2";
                                      e.currentTarget.style.backgroundColor =
                                        "#3A4040";
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.color = "#ABA4AA";
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }}
                                    title="Send message"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      openNotes(client);
                                    }}
                                    className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                    style={{
                                      color: "#ABA4AA",
                                      backgroundColor: "transparent",
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.color = "#C3BCC2";
                                      e.currentTarget.style.backgroundColor =
                                        "#3A4040";
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.color = "#ABA4AA";
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }}
                                    title="Add feedback"
                                  >
                                    <PenTool className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleUnarchiveClient(
                                      client.id,
                                      client.name
                                    );
                                  }}
                                  disabled={archivingClientId === client.id}
                                  className="p-2 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50"
                                  style={{
                                    color: "#10B981",
                                    backgroundColor: "transparent",
                                  }}
                                  onMouseEnter={e => {
                                    if (!e.currentTarget.disabled) {
                                      e.currentTarget.style.color = "#059669";
                                      e.currentTarget.style.backgroundColor =
                                        "#3A4040";
                                    }
                                  }}
                                  onMouseLeave={e => {
                                    if (!e.currentTarget.disabled) {
                                      e.currentTarget.style.color = "#10B981";
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }
                                  }}
                                  title="Unarchive client"
                                >
                                  {archivingClientId === client.id ? (
                                    <div
                                      className="animate-spin rounded-full h-4 w-4 border-b-2"
                                      style={{
                                        borderColor: "#10B981",
                                      }}
                                    />
                                  ) : (
                                    <Archive className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedClientForProfile(client);
                                  setIsProfileModalOpen(true);
                                }}
                                className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                style={{
                                  color: "#ABA4AA",
                                  backgroundColor: "transparent",
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.color = "#C3BCC2";
                                  e.currentTarget.style.backgroundColor =
                                    "#3A4040";
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.color = "#ABA4AA";
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }}
                                title="Edit client"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
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
                <div className="space-y-4">
                  {filteredAndSortedClients.map(
                    (client: Client, index: number) => (
                      <div
                        key={client.id}
                        className="rounded-2xl shadow-xl border transition-all duration-500 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group"
                        style={{
                          backgroundColor: "#353A3A",
                          borderColor: "#606364",
                          animationName: "fadeInUp",
                          animationDuration: "0.6s",
                          animationTimingFunction: "ease-out",
                          animationFillMode: "forwards",
                          animationDelay: `${index * 50}ms`,
                        }}
                        onClick={() => {
                          if (!isBulkMode) {
                            console.log(
                              "Card clicked for client:",
                              client.name
                            );
                            handleOpenProfile(client);
                          }
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#3A4040";
                          e.currentTarget.style.borderColor = "#4A5A70";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "#353A3A";
                          e.currentTarget.style.borderColor = "#606364";
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                          style={{
                            background:
                              "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                          }}
                        />
                        <div className="relative p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
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
                                  if (activeTab === "active") {
                                    handleArchiveClient(client.id, client.name);
                                  } else {
                                    handleUnarchiveClient(
                                      client.id,
                                      client.name
                                    );
                                  }
                                }}
                                disabled={archivingClientId === client.id}
                                className="relative transition-all duration-200 hover:scale-105 disabled:opacity-50 flex-shrink-0 group"
                                onMouseEnter={e => {
                                  e.currentTarget.classList.add("hover-close");
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.classList.remove(
                                    "hover-close"
                                  );
                                }}
                                title={
                                  activeTab === "active"
                                    ? "Click to archive client"
                                    : "Click to unarchive client"
                                }
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
                                {/* Hover overlay with trash icon */}
                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover-close:opacity-100 transition-opacity duration-200">
                                  {archivingClientId === client.id ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                  ) : (
                                    <Trash2
                                      className="h-5 w-5 text-white"
                                      style={{
                                        color: "#EF4444", // Red color for both archive and unarchive
                                      }}
                                    />
                                  )}
                                </div>
                              </button>
                              <div>
                                <h3
                                  className="text-xl font-bold mb-2"
                                  style={{ color: "#C3BCC2" }}
                                >
                                  {client.name}
                                </h3>
                                <p
                                  className="text-sm mb-1"
                                  style={{ color: "#ABA4AA" }}
                                >
                                  Added{" "}
                                  {format(
                                    new Date(client.createdAt),
                                    "MMM d, yyyy"
                                  )}
                                </p>
                                {client.email && (
                                  <p
                                    className="text-sm flex items-center gap-1"
                                    style={{ color: "#ABA4AA" }}
                                  >
                                    <Mail className="h-3 w-3" />
                                    {client.email}
                                  </p>
                                )}

                                {/* Next Lesson */}
                                <div className="mt-2">
                                  <p
                                    className="text-xs font-medium mb-1"
                                    style={{ color: "#ABA4AA" }}
                                  >
                                    Next Lesson:
                                  </p>
                                  <p
                                    className="text-sm font-semibold"
                                    style={{ color: "#C3BCC2" }}
                                  >
                                    {isValidLessonDate(client.nextLessonDate)
                                      ? format(
                                          new Date(client.nextLessonDate!),
                                          "MMM d, yyyy"
                                        )
                                      : "No lesson scheduled"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {activeTab === "archived" && (
                                <div className="px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 mr-2">
                                  <span className="text-sm font-medium text-amber-300">
                                    Archived Client
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col gap-1">
                                {activeTab === "archived" && (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleUnarchiveClient(
                                        client.id,
                                        client.name
                                      );
                                    }}
                                    disabled={archivingClientId === client.id}
                                    className="p-2 rounded-xl transition-all duration-300 transform hover:scale-110 disabled:opacity-50"
                                    style={{ color: "#10B981" }}
                                    onMouseEnter={e => {
                                      if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.color = "#059669";
                                        e.currentTarget.style.backgroundColor =
                                          "#3A4040";
                                      }
                                    }}
                                    onMouseLeave={e => {
                                      if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.color = "#10B981";
                                        e.currentTarget.style.backgroundColor =
                                          "transparent";
                                      }
                                    }}
                                    title="Unarchive client"
                                  >
                                    {archivingClientId === client.id ? (
                                      <div
                                        className="animate-spin rounded-full h-4 w-4 border-b-2"
                                        style={{
                                          borderColor: "#10B981",
                                        }}
                                      />
                                    ) : (
                                      <Archive className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedClientForProfile(client);
                                    setIsProfileModalOpen(true);
                                  }}
                                  className="p-2 rounded-xl transition-all duration-300 transform hover:scale-110"
                                  style={{ color: "#ABA4AA" }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.color = "#C3BCC2";
                                    e.currentTarget.style.backgroundColor =
                                      "#3A4040";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.color = "#ABA4AA";
                                    e.currentTarget.style.backgroundColor =
                                      "transparent";
                                  }}
                                  title="Edit client"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
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
        <AddClientModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddClient={() => {
            console.log("Client added successfully!");
          }}
        />

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
                  style={{ color: "#C3BCC2" }}
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
