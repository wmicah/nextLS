"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { trpc } from "@/app/_trpc/client";
import { useUIStore } from "@/lib/stores/uiStore";
import { usePersistedSort } from "@/lib/hooks/usePersistedSort";
import { compareClientsByProgramDueDate } from "@/lib/client-sorting-utils";
import { getStartOfDay } from "@/lib/date-utils";
import { extractNoteContent } from "@/lib/note-utils";
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
  MessageSquare,
  MoreVertical,
  X,
  Check,
  Download,
  Grid3X3,
  List,
  Key,
  Copy,
  XCircle,
  Loader2,
  PenTool,
} from "lucide-react";
import { format } from "date-fns";
import ProfilePictureUploader from "./ProfilePictureUploader";
import MobileNavigation from "./MobileNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";
import NotesDisplay from "./NotesDisplay";
import { COLORS, getGoldenAccent } from "@/lib/colors";

// Lazy load heavy modal
const ClientProfileModal = dynamic(() => import("./ClientProfileModal"), {
  ssr: false,
});

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

// Mobile Invite Code Button Component
function MobileInviteCodeButton() {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const generateInviteCode = trpc.user.generateInviteCode.useMutation();

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
          await navigator.clipboard.writeText(
            generateInviteCode.data.inviteCode
          );
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
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-1.5 rounded-lg border transition-all duration-200"
        style={{
          backgroundColor: COLORS.BACKGROUND_CARD,
          borderColor: COLORS.BORDER_SUBTLE,
          color: COLORS.TEXT_PRIMARY,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
          e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
          e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
        }}
      >
        <Key className="h-4 w-4" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
            onClick={() => setShowModal(false)}
          />
          <div
            className="relative w-full max-w-md rounded-lg p-6 shadow-xl border"
            style={{
              backgroundColor: "#1F2426",
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key
                  className="h-5 w-5"
                  style={{ color: COLORS.GOLDEN_ACCENT }}
                />
                <h3
                  className="font-semibold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Coach Invite Code
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="transition-colors"
                style={{ color: COLORS.TEXT_MUTED }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = COLORS.TEXT_MUTED;
                }}
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {!generateInviteCode.data?.inviteCode ? (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                  Generate a unique invite code to share with your athletes
                </p>
                <button
                  onClick={handleGenerateInviteCode}
                  disabled={generateInviteCode.isPending}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: COLORS.GOLDEN_DARK,
                    color: "#FFFFFF",
                  }}
                  onMouseEnter={e => {
                    if (!generateInviteCode.isPending) {
                      e.currentTarget.style.backgroundColor =
                        COLORS.GOLDEN_ACCENT;
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                  }}
                >
                  {generateInviteCode.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
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
                  <p
                    className="text-sm mb-2"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Share this invite link (recommended)
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inviteLink || ""}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-mono border"
                      style={{
                        backgroundColor: "#2A2F2F",
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                    />
                    <button
                      onClick={handleCopyInviteLink}
                      className="p-2 rounded-lg transition-colors border"
                      style={{
                        backgroundColor: "#2A2F2F",
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "#353A3A";
                        e.currentTarget.style.borderColor =
                          COLORS.GOLDEN_ACCENT;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "#2A2F2F";
                        e.currentTarget.style.borderColor =
                          COLORS.BORDER_SUBTLE;
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
                    <p
                      className="text-xs flex items-center gap-1 mt-1"
                      style={{ color: COLORS.GREEN_PRIMARY }}
                    >
                      <Check className="h-3 w-3" />
                      Link copied!
                    </p>
                  )}
                </div>

                <div
                  className="border-t pt-3"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <p
                    className="text-sm mb-2"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Or share this code
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type={isVisible ? "text" : "password"}
                      value={generateInviteCode.data.inviteCode}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg font-mono text-sm border"
                      style={{
                        backgroundColor: "#2A2F2F",
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
                      className="p-2 rounded-lg transition-colors border"
                      style={{
                        backgroundColor: "#2A2F2F",
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "#353A3A";
                        e.currentTarget.style.borderColor =
                          COLORS.GOLDEN_ACCENT;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "#2A2F2F";
                        e.currentTarget.style.borderColor =
                          COLORS.BORDER_SUBTLE;
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
                    <p
                      className="text-xs flex items-center gap-1 mt-1"
                      style={{ color: COLORS.GREEN_PRIMARY }}
                    >
                      <Check className="h-3 w-3" />
                      Code copied!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Mobile Requests Button Component
function MobileRequestsButton({ onOpenModal }: { onOpenModal: () => void }) {
  const { data: pendingClientRequests = [] } =
    trpc.clients.getPendingRequests.useQuery();

  return (
    <button
      onClick={onOpenModal}
      className="relative p-1.5 rounded-lg border transition-all duration-200"
      style={{
        backgroundColor: COLORS.BACKGROUND_CARD,
        borderColor: COLORS.BORDER_SUBTLE,
        color: COLORS.TEXT_PRIMARY,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
        e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
      }}
    >
      <Mail className="h-4 w-4" />
      {pendingClientRequests.length > 0 && (
        <span
          className="absolute -top-1 -right-1 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold"
          style={{
            backgroundColor: COLORS.RED_ALERT,
          }}
        >
          {pendingClientRequests.length}
        </span>
      )}
    </button>
  );
}

// Mobile Client Requests Modal Component
function MobileClientRequestsModal({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-lg p-6 max-h-[80vh] overflow-y-auto border"
        style={{
          backgroundColor: "#1F2426",
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-bold"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Client Join Requests
          </h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: COLORS.TEXT_MUTED }}
            onMouseEnter={e => {
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = COLORS.TEXT_MUTED;
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
            <p style={{ color: COLORS.TEXT_MUTED }}>Loading requests...</p>
          </div>
        ) : pendingClientRequests.length === 0 ? (
          <div className="text-center py-8">
            <Mail
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: COLORS.TEXT_MUTED }}
            />
            <p style={{ color: COLORS.TEXT_MUTED }}>No pending requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingClientRequests.map((request: any) => {
              return (
                <div
                  key={request.id}
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <div className="space-y-3">
                    <div>
                      <h3
                        className="font-semibold"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {request.name || "Unknown Client"}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
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
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: COLORS.GREEN_DARK,
                          color: "#FFFFFF",
                        }}
                        onMouseEnter={e => {
                          if (
                            !acceptRequest.isPending &&
                            !rejectRequest.isPending
                          ) {
                            e.currentTarget.style.backgroundColor =
                              COLORS.GREEN_PRIMARY;
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.GREEN_DARK;
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
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: COLORS.RED_DARK,
                          color: "#FFFFFF",
                        }}
                        onMouseEnter={e => {
                          if (
                            !acceptRequest.isPending &&
                            !rejectRequest.isPending
                          ) {
                            e.currentTarget.style.backgroundColor =
                              COLORS.RED_ALERT;
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor =
                            COLORS.RED_DARK;
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
            className="px-6 py-2 rounded-lg transition-colors border"
            style={{
              backgroundColor: "#2A2F2F",
              borderColor: COLORS.BORDER_SUBTLE,
              color: COLORS.TEXT_PRIMARY,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#353A3A";
              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "#2A2F2F";
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MobileClientsPage() {
  const router = useRouter();
  const [archivingClientId, setArchivingClientId] = useState<string | null>(
    null
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notesClient, setNotesClient] = useState<Client | null>(null);
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
    const clientIds: string[] = filteredAndSortedClients.map(
      client => client.id
    );
    setSelectedClients(new Set<string>(clientIds));
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
      Notes: extractNoteContent(client.notes),
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
          return aValue < bValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
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

  // Debug: Log final sorted order when sorting by dueDate
  if (process.env.NODE_ENV === "development" && sortBy === "dueDate") {
    console.log(
      "[FINAL SORT ORDER]",
      filteredAndSortedClients.slice(0, 15).map((c, i) => ({
        position: i + 1,
        name: c.name,
        programCount:
          c.programAssignments?.filter(p => !p.completed && !p.completedAt)
            .length || 0,
        routineCount:
          c.routineAssignments?.filter(r => !r.completedAt).length || 0,
      }))
    );
  }

  // Calculate stats
  const totalClients = clients.length;
  const activeClients = activeClientsData.length;
  const archivedClients = archivedClientsData.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: "#4A5A70" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Error loading clients: {error.message}</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
    >
      {/* Mobile Header */}
      <div
        className="sticky top-0 z-50 border-b px-4"
        style={{
          paddingTop: `calc(0.75rem + env(safe-area-inset-top))`,
          paddingBottom: "0.75rem",
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1
              className="text-lg font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Your Athletes
            </h1>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleBulkMode}
              className="p-1.5 rounded-lg border transition-all duration-200"
              style={{
                backgroundColor: isBulkMode
                  ? COLORS.GOLDEN_ACCENT
                  : COLORS.BACKGROUND_CARD,
                borderColor: isBulkMode
                  ? COLORS.GOLDEN_ACCENT
                  : COLORS.BORDER_SUBTLE,
                color: isBulkMode ? "#FFFFFF" : COLORS.TEXT_PRIMARY,
              }}
              onMouseEnter={e => {
                if (!isBulkMode) {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }
              }}
              onMouseLeave={e => {
                if (!isBulkMode) {
                  e.currentTarget.style.backgroundColor =
                    COLORS.BACKGROUND_CARD;
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }
              }}
            >
              <Users className="h-4 w-4" />
            </button>
            <MobileInviteCodeButton />
            <MobileRequestsButton
              onOpenModal={() => setIsRequestsModalOpen(true)}
            />
            <MobileNavigation currentPage="clients" />
          </div>
        </div>

        {/* Search Bar - Integrated into Header */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10"
            style={{ color: COLORS.TEXT_MUTED }}
          />
          <input
            type="text"
            placeholder="Search athletes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm transition-all duration-200"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
              color: COLORS.TEXT_PRIMARY,
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-4">
        {/* Tabs */}
        <div
          className="flex space-x-1 p-1 rounded-xl border"
          style={{
            backgroundColor: COLORS.BACKGROUND_CARD,
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "active" ? "shadow-lg" : ""
            }`}
            style={{
              backgroundColor:
                activeTab === "active" ? COLORS.GOLDEN_ACCENT : "transparent",
              color: activeTab === "active" ? "#FFFFFF" : COLORS.TEXT_SECONDARY,
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm">Active Athletes</span>
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor:
                    activeTab === "active"
                      ? "#FFFFFF"
                      : COLORS.BACKGROUND_CARD_HOVER,
                  color:
                    activeTab === "active"
                      ? COLORS.GOLDEN_ACCENT
                      : COLORS.TEXT_PRIMARY,
                }}
              >
                {activeClientsData.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "archived" ? "shadow-lg" : ""
            }`}
            style={{
              backgroundColor:
                activeTab === "archived" ? COLORS.GOLDEN_ACCENT : "transparent",
              color:
                activeTab === "archived" ? "#FFFFFF" : COLORS.TEXT_SECONDARY,
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm">Archived Athletes</span>
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor:
                    activeTab === "archived"
                      ? "#FFFFFF"
                      : COLORS.BACKGROUND_CARD_HOVER,
                  color:
                    activeTab === "archived"
                      ? COLORS.GOLDEN_ACCENT
                      : COLORS.TEXT_PRIMARY,
                }}
              >
                {archivedClientsData.length}
              </span>
            </div>
          </button>
        </div>

        {/* Filters */}
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: COLORS.BACKGROUND_CARD,
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >
          <div className="space-y-3">
            {/* Filters Row */}
            <div className="flex gap-2">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-lg border text-sm"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD_HOVER,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
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
                className="p-2.5 rounded-lg border"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD_HOVER,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
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
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  className="p-2 transition-all duration-200"
                  style={{
                    backgroundColor:
                      viewMode === "grid"
                        ? COLORS.GOLDEN_ACCENT
                        : COLORS.BACKGROUND_CARD_HOVER,
                    color:
                      viewMode === "grid" ? "#FFFFFF" : COLORS.TEXT_PRIMARY,
                  }}
                  title="Grid View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="p-2 transition-all duration-200"
                  style={{
                    backgroundColor:
                      viewMode === "list"
                        ? COLORS.GOLDEN_ACCENT
                        : COLORS.BACKGROUND_CARD_HOVER,
                    color:
                      viewMode === "list" ? "#FFFFFF" : COLORS.TEXT_PRIMARY,
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
            className="rounded-lg border p-4"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: COLORS.BACKGROUND_CARD_HOVER }}
                >
                  <Users
                    className="h-3 w-3"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  />
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {selectedClients.size > 0
                    ? `${selectedClients.size} client${
                        selectedClients.size === 1 ? "" : "s"
                      } selected`
                    : "Bulk Selection Mode - Select clients to perform actions"}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={selectAllClients}
                  className="text-xs px-2 py-1 rounded border transition-colors"
                  style={{
                    backgroundColor: COLORS.GOLDEN_DARK,
                    color: "#FFFFFF",
                    borderColor: COLORS.BORDER_SUBTLE,
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
                    className="text-xs px-2 py-1 rounded border transition-colors"
                    style={{
                      backgroundColor: "transparent",
                      color: COLORS.TEXT_SECONDARY,
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {selectedClients.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: COLORS.GREEN_DARK,
                      color: "#FFFFFF",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.GREEN_PRIMARY;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </button>
                  {activeTab === "active" && (
                    <button
                      onClick={handleBulkArchive}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors"
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
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Header */}
        {filteredAndSortedClients.length > 0 && (
          <div>
            <p className="text-sm text-[#ABA4AA]">
              {filteredAndSortedClients.length} of {totalClients}{" "}
              {totalClients === 1 ? "athlete" : "athletes"}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        )}

        {/* Athletes List/Grid */}
        {filteredAndSortedClients.length === 0 ? (
          <div className="bg-[#353A3A] border border-[#606364] rounded-xl text-center p-8">
            <div className="w-16 h-16 rounded-xl bg-[#4A5A70] flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-[#C3BCC2]" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#C3BCC2]">
              {searchTerm
                ? "No athletes found"
                : activeTab === "active"
                  ? "No active athletes"
                  : "No archived athletes"}
            </h3>
            <p className="mb-6 max-w-sm mx-auto text-[#ABA4AA]">
              {searchTerm
                ? `No athletes match "${searchTerm}". Try a different search term.`
                : activeTab === "active"
                  ? "Athletes will appear here when they request to join your coaching program."
                  : "No athletes have been archived yet."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-sm px-4 py-2 rounded-lg bg-transparent text-[#ABA4AA] border border-[#606364] mx-auto"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 gap-4">
                {filteredAndSortedClients.map((client: Client) => (
                  <div
                    key={client.id}
                    className="rounded-lg border p-4 transition-colors cursor-pointer"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_CARD,
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                    onMouseEnter={e => {
                      // Only apply hover on non-touch devices
                      if (window.matchMedia("(hover: hover)").matches) {
                        e.currentTarget.style.backgroundColor =
                          COLORS.BACKGROUND_CARD_HOVER;
                        e.currentTarget.style.borderColor =
                          COLORS.GOLDEN_ACCENT;
                      }
                    }}
                    onMouseLeave={e => {
                      // Only apply hover on non-touch devices
                      if (window.matchMedia("(hover: hover)").matches) {
                        e.currentTarget.style.backgroundColor =
                          COLORS.BACKGROUND_CARD;
                        e.currentTarget.style.borderColor =
                          COLORS.BORDER_SUBTLE;
                      }
                    }}
                    onTouchStart={e => {
                      // Prevent hover state on touch
                      e.currentTarget.style.backgroundColor =
                        COLORS.BACKGROUND_CARD;
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
                    onClick={() => {
                      if (!isBulkMode) {
                        handleOpenProfile(client);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isBulkMode && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              toggleClientSelection(client.id);
                            }}
                            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200"
                            style={{
                              backgroundColor: selectedClients.has(client.id)
                                ? COLORS.GOLDEN_ACCENT
                                : "transparent",
                              borderColor: selectedClients.has(client.id)
                                ? COLORS.GOLDEN_ACCENT
                                : COLORS.BORDER_SUBTLE,
                            }}
                          >
                            {selectedClients.has(client.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </button>
                        )}
                        <ProfilePictureUploader
                          currentAvatarUrl={
                            client.user?.settings?.avatarUrl || client.avatar
                          }
                          userName={client.name}
                          onAvatarChange={() => {}}
                          readOnly={true}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3
                              className="text-sm font-semibold"
                              style={{ color: COLORS.TEXT_PRIMARY }}
                            >
                              {client.name}
                            </h3>
                            {isValidLessonDate(client.nextLessonDate) && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                                style={{
                                  backgroundColor: COLORS.GREEN_DARK,
                                  color: "#FFFFFF",
                                }}
                              >
                                <Calendar className="h-2.5 w-2.5 mr-0.5" />
                                {format(
                                  new Date(client.nextLessonDate!),
                                  "MMM d"
                                )}
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xs truncate"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            {client.email || "No email"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 ml-2 flex-shrink-0">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            router.push(`/messages?clientId=${client.id}`);
                          }}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                            e.currentTarget.style.backgroundColor =
                              COLORS.BACKGROUND_CARD_HOVER;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                          title="Send message"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            openNotes(client);
                          }}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                            e.currentTarget.style.backgroundColor =
                              COLORS.BACKGROUND_CARD_HOVER;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
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
                          className="p-1.5 rounded transition-colors"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                            e.currentTarget.style.backgroundColor =
                              COLORS.BACKGROUND_CARD_HOVER;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                          title="Edit client"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (activeTab === "active") {
                              handleArchiveClient(client.id, client.name);
                            } else {
                              handleUnarchiveClient(client.id, client.name);
                            }
                          }}
                          disabled={archivingClientId === client.id}
                          className="p-1.5 rounded transition-colors disabled:opacity-50"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                          onMouseEnter={e => {
                            if (!archivingClientId) {
                              e.currentTarget.style.color =
                                COLORS.GOLDEN_ACCENT;
                              e.currentTarget.style.backgroundColor =
                                COLORS.BACKGROUND_CARD_HOVER;
                            }
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                          title={
                            activeTab === "active"
                              ? "Archive client"
                              : "Unarchive client"
                          }
                        >
                          {archivingClientId === client.id ? (
                            <div
                              className="animate-spin rounded-full h-3.5 w-3.5 border-b-2"
                              style={{ borderColor: COLORS.GOLDEN_ACCENT }}
                            />
                          ) : (
                            <Archive className="h-3.5 w-3.5" />
                          )}
                        </button>
                        {/* Permanent Delete Button - Only for archived clients */}
                        {activeTab === "archived" && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteClient(client.id, client.name);
                            }}
                            disabled={deleteClient.isPending}
                            className="p-2 rounded-lg text-[#EF4444] hover:text-[#DC2626] hover:bg-[#3A4040] disabled:opacity-50"
                            title="Permanently delete client"
                          >
                            {deleteClient.isPending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#EF4444]" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-3">
                {filteredAndSortedClients.map((client: Client) => (
                  <div
                    key={client.id}
                    className="rounded-lg border p-3 transition-colors cursor-pointer"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_CARD,
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                    onMouseEnter={e => {
                      // Only apply hover on non-touch devices
                      if (window.matchMedia("(hover: hover)").matches) {
                        e.currentTarget.style.backgroundColor =
                          COLORS.BACKGROUND_CARD_HOVER;
                        e.currentTarget.style.borderColor =
                          COLORS.GOLDEN_ACCENT;
                      }
                    }}
                    onMouseLeave={e => {
                      // Only apply hover on non-touch devices
                      if (window.matchMedia("(hover: hover)").matches) {
                        e.currentTarget.style.backgroundColor =
                          COLORS.BACKGROUND_CARD;
                        e.currentTarget.style.borderColor =
                          COLORS.BORDER_SUBTLE;
                      }
                    }}
                    onTouchStart={e => {
                      // Prevent hover state on touch
                      e.currentTarget.style.backgroundColor =
                        COLORS.BACKGROUND_CARD;
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
                    onClick={() => {
                      if (!isBulkMode) {
                        handleOpenProfile(client);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isBulkMode && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              toggleClientSelection(client.id);
                            }}
                            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0"
                            style={{
                              backgroundColor: selectedClients.has(client.id)
                                ? COLORS.GOLDEN_ACCENT
                                : "transparent",
                              borderColor: selectedClients.has(client.id)
                                ? COLORS.GOLDEN_ACCENT
                                : COLORS.BORDER_SUBTLE,
                            }}
                          >
                            {selectedClients.has(client.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </button>
                        )}
                        <ProfilePictureUploader
                          currentAvatarUrl={
                            client.user?.settings?.avatarUrl || client.avatar
                          }
                          userName={client.name}
                          onAvatarChange={() => {}}
                          size="sm"
                          readOnly={true}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-sm font-semibold mb-0.5 truncate"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            {client.name}
                          </h3>
                          <p
                            className="text-xs mb-0.5 truncate"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            {client.email || "No email"}
                          </p>
                          {isValidLessonDate(client.nextLessonDate) && (
                            <p
                              className="text-[10px] truncate"
                              style={{ color: COLORS.TEXT_MUTED }}
                            >
                              Next:{" "}
                              {format(
                                new Date(client.nextLessonDate!),
                                "MMM d"
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            router.push(`/messages?clientId=${client.id}`);
                          }}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                            e.currentTarget.style.backgroundColor =
                              COLORS.BACKGROUND_CARD_HOVER;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                          title="Send message"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            openNotes(client);
                          }}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                            e.currentTarget.style.backgroundColor =
                              COLORS.BACKGROUND_CARD_HOVER;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
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
                          className="p-1.5 rounded transition-colors"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                            e.currentTarget.style.backgroundColor =
                              COLORS.BACKGROUND_CARD_HOVER;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                          title="Edit client"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (activeTab === "active") {
                              handleArchiveClient(client.id, client.name);
                            } else {
                              handleUnarchiveClient(client.id, client.name);
                            }
                          }}
                          disabled={archivingClientId === client.id}
                          className="p-1.5 rounded transition-colors disabled:opacity-50"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                          onMouseEnter={e => {
                            if (!archivingClientId) {
                              e.currentTarget.style.color =
                                COLORS.GOLDEN_ACCENT;
                              e.currentTarget.style.backgroundColor =
                                COLORS.BACKGROUND_CARD_HOVER;
                            }
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                          title={
                            activeTab === "active"
                              ? "Archive client"
                              : "Unarchive client"
                          }
                        >
                          {archivingClientId === client.id ? (
                            <div
                              className="animate-spin rounded-full h-3.5 w-3.5 border-b-2"
                              style={{ borderColor: COLORS.GOLDEN_ACCENT }}
                            />
                          ) : (
                            <Archive className="h-3.5 w-3.5" />
                          )}
                        </button>
                        {/* Permanent Delete Button - Only for archived clients */}
                        {activeTab === "archived" && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteClient(client.id, client.name);
                            }}
                            disabled={deleteClient.isPending}
                            className="p-1.5 rounded transition-colors disabled:opacity-50"
                            style={{ color: COLORS.RED_ALERT }}
                            onMouseEnter={e => {
                              if (!deleteClient.isPending) {
                                e.currentTarget.style.color = COLORS.RED_DARK;
                                e.currentTarget.style.backgroundColor =
                                  COLORS.BACKGROUND_CARD_HOVER;
                              }
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = COLORS.RED_ALERT;
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                            title="Permanently delete client"
                          >
                            {deleteClient.isPending ? (
                              <div
                                className="animate-spin rounded-full h-3.5 w-3.5 border-b-2"
                                style={{ borderColor: COLORS.RED_ALERT }}
                              />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

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
          clientNotes={extractNoteContent(selectedClientForProfile.notes)}
          clientAvatar={selectedClientForProfile.avatar}
        />
      )}

      {/* Notes Modal */}
      {isNotesModalOpen && notesClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setIsNotesModalOpen(false);
              setNotesClient(null);
            }}
          />
          <div className="relative w-full max-w-lg rounded-xl shadow-2xl border p-4 max-h-[90vh] overflow-y-auto bg-[#2B3038] border-[#606364]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#C3BCC2]">
                Notes for {notesClient.name}
              </h3>
              <button
                onClick={() => {
                  setIsNotesModalOpen(false);
                  setNotesClient(null);
                }}
                className="p-1 rounded-lg hover:bg-[#4A5A70] transition-colors"
              >
                <X className="h-5 w-5 text-[#ABA4AA]" />
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

      {/* Client Requests Modal */}
      <MobileClientRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
      />

      {/* Bottom Navigation */}
      <MobileBottomNavigation />
    </div>
  );
}
