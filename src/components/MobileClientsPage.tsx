"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
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
} from "lucide-react";
import { format } from "date-fns";
import AddClientModal from "./AddClientModal";
import ClientProfileModal from "./ClientProfileModal";
import ProfilePictureUploader from "./ProfilePictureUploader";
import MobileNavigation from "./MobileNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
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

// Mobile Invite Code Button Component
function MobileInviteCodeButton() {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-2 rounded-lg bg-[#4A5A70] text-white"
      >
        <Key className="h-4 w-4" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md bg-[#2B3038] border border-[#4A5A70] rounded-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-[#4A5A70]" />
                <h3 className="font-semibold text-white">Coach Invite Code</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {!generateInviteCode.data?.inviteCode ? (
              <div className="space-y-3">
                <p className="text-sm text-[#C3BCC2]">
                  Generate a unique invite code to share with your athletes
                </p>
                <button
                  onClick={handleGenerateInviteCode}
                  disabled={generateInviteCode.isPending}
                  className="w-full bg-[#4A5A70] hover:bg-[#606364] text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
      )}
    </>
  );
}

// Mobile Requests Button Component
function MobileRequestsButton({ onOpenModal }: { onOpenModal: () => void }) {
  const { data: pendingRequests = [] } =
    trpc.notifications.getNotifications.useQuery({
      unreadOnly: true,
      limit: 50,
    });

  const clientRequests = pendingRequests.filter(
    (req: any) =>
      req.type === "CLIENT_JOIN_REQUEST" && req.data?.requiresApproval
  );

  return (
    <button
      onClick={onOpenModal}
      className="relative p-2 rounded-lg bg-[#4A5A70] text-white"
    >
      <Mail className="h-4 w-4" />
      {clientRequests.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {clientRequests.length}
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

  const { data: pendingRequests = [], refetch } =
    trpc.notifications.getNotifications.useQuery({
      unreadOnly: true,
      limit: 50,
    });

  const clientRequests = pendingRequests.filter(
    (req: any) =>
      req.type === "CLIENT_JOIN_REQUEST" && req.data?.requiresApproval
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#2B3038] rounded-lg p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Client Join Requests</h2>
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
                <div className="space-y-3">
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
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

export default function MobileClientsPage() {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [archivingClientId, setArchivingClientId] = useState<string | null>(
    null
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackClient, setFeedbackClient] = useState<Client | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
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

  // Mutation to update notes
  const updateNotes = trpc.clients.updateNotes.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setIsFeedbackOpen(false);
      setFeedbackText("");
      setFeedbackClient(null);
    },
    onError: error => {
      console.error("Failed to update notes:", error);
    },
  });

  const openFeedback = (client: Client) => {
    setFeedbackClient(client);
    setFeedbackText(client.notes || "");
    setIsFeedbackOpen(true);
  };

  const submitFeedback = () => {
    if (!feedbackClient) return;
    updateNotes.mutate({ clientId: feedbackClient.id, notes: feedbackText });
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
      Notes: client.notes || "",
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
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "nextLesson":
          const now = new Date();
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

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
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortBy === "createdAt") {
        if (sortOrder === "asc") {
          return aValue < bValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      } else {
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
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-[#2A3133] border-b border-[#606364] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Your Athletes</h1>
              <p className="text-xs text-gray-400">
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
              className={`p-2 rounded-lg transition-all duration-200 ${
                isBulkMode ? "bg-blue-500" : "bg-[#4A5A70]"
              }`}
            >
              <Users className="h-4 w-4 text-white" />
            </button>
            <MobileInviteCodeButton />
            <MobileRequestsButton
              onOpenModal={() => setIsRequestsModalOpen(true)}
            />
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="p-2 rounded-lg bg-[#4A5A70] text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
            <MobileNavigation currentPage="clients" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-4">
        {/* Tabs */}
        <div className="flex space-x-1 p-1 rounded-xl border bg-[#353A3A] border-[#606364]">
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
          >
            <div className="flex items-center justify-center gap-2">
              <Archive className="h-4 w-4" />
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

        {/* Search and Filters */}
        <div className="bg-[#353A3A] border border-[#606364] rounded-xl p-4">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search athletes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#606364] border-[#ABA4AA] text-[#C3BCC2] text-sm"
              />
            </div>

            {/* Filters Row */}
            <div className="flex gap-2">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-lg border bg-[#606364] border-[#ABA4AA] text-[#C3BCC2] text-sm"
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
                className="p-2.5 rounded-lg border bg-[#606364] border-[#ABA4AA] text-[#C3BCC2]"
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
              <div className="flex rounded-lg border border-[#ABA4AA] overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-all duration-200 ${
                    viewMode === "grid" ? "bg-[#4A5A70]" : "bg-[#606364]"
                  } text-[#C3BCC2]`}
                  title="Grid View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-all duration-200 ${
                    viewMode === "list" ? "bg-[#4A5A70]" : "bg-[#606364]"
                  } text-[#C3BCC2]`}
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
          <div className="bg-[#353A3A] border border-[#4A5A70] rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#4A5A70] flex items-center justify-center">
                  <Users className="h-3 w-3 text-[#C3BCC2]" />
                </div>
                <span className="text-sm font-medium text-[#C3BCC2]">
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
                  className="text-sm px-3 py-1 rounded-lg bg-[#4A5A70] text-[#C3BCC2] border border-[#606364]"
                >
                  Select All ({filteredAndSortedClients.length})
                </button>
                {selectedClients.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-sm px-3 py-1 rounded-lg bg-transparent text-[#ABA4AA] border border-[#606364]"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {selectedClients.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#10B981] text-white"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                  {activeTab === "active" && (
                    <button
                      onClick={handleBulkArchive}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F59E0B] text-white"
                    >
                      <Archive className="h-4 w-4" />
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
                ? "Add your first athlete to start building your coaching team."
                : "No athletes have been archived yet."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#4A5A70] text-[#C3BCC2] font-medium mx-auto"
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
                    className="bg-[#353A3A] border border-[#606364] rounded-xl p-4 transition-all duration-200 hover:bg-[#3A4040] hover:border-[#4A5A70] cursor-pointer"
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
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold truncate text-[#C3BCC2]">
                              {client.name}
                            </h3>
                            {isValidLessonDate(client.nextLessonDate) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#10B981] text-white">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(
                                  new Date(client.nextLessonDate!),
                                  "MMM d"
                                )}
                              </span>
                            )}
                          </div>
                          <p className="text-sm truncate text-[#ABA4AA]">
                            {client.email || "No email"}
                          </p>
                          <div className="mt-2">
                            <p className="text-xs font-medium mb-1 text-[#ABA4AA]">
                              Next Lesson:
                            </p>
                            <p className="text-sm font-semibold text-[#C3BCC2]">
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

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            openFeedback(client);
                          }}
                          className="p-2 rounded-lg text-[#ABA4AA] hover:text-[#C3BCC2] hover:bg-[#3A4040]"
                          title="Add feedback"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedClientForProfile(client);
                            setIsProfileModalOpen(true);
                          }}
                          className="p-2 rounded-lg text-[#ABA4AA] hover:text-[#C3BCC2] hover:bg-[#3A4040]"
                          title="Edit client"
                        >
                          <Edit className="h-4 w-4" />
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
                          className="p-2 rounded-lg text-[#ABA4AA] hover:text-[#C3BCC2] hover:bg-[#3A4040] disabled:opacity-50"
                          title={
                            activeTab === "active"
                              ? "Archive client"
                              : "Unarchive client"
                          }
                        >
                          {archivingClientId === client.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F59E0B]" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {filteredAndSortedClients.map((client: Client) => (
                  <div
                    key={client.id}
                    className="bg-[#353A3A] border border-[#606364] rounded-2xl p-4 transition-all duration-200 hover:bg-[#3A4040] hover:border-[#4A5A70] cursor-pointer"
                    onClick={() => {
                      if (!isBulkMode) {
                        handleOpenProfile(client);
                      }
                    }}
                  >
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
                        <ProfilePictureUploader
                          currentAvatarUrl={
                            client.user?.settings?.avatarUrl || client.avatar
                          }
                          userName={client.name}
                          onAvatarChange={() => {}}
                          size="md"
                          readOnly={true}
                          className="flex-shrink-0"
                        />
                        <div>
                          <h3 className="text-xl font-bold mb-2 text-[#C3BCC2]">
                            {client.name}
                          </h3>
                          <p className="text-sm mb-1 text-[#ABA4AA]">
                            Added{" "}
                            {format(new Date(client.createdAt), "MMM d, yyyy")}
                          </p>
                          {client.email && (
                            <p className="text-sm flex items-center gap-1 text-[#ABA4AA]">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </p>
                          )}
                          <div className="mt-2">
                            <p className="text-xs font-medium mb-1 text-[#ABA4AA]">
                              Next Lesson:
                            </p>
                            <p className="text-sm font-semibold text-[#C3BCC2]">
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
                          className="p-2 rounded-xl text-[#ABA4AA] hover:text-[#C3BCC2] hover:bg-[#3A4040] disabled:opacity-50"
                        >
                          {archivingClientId === client.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F59E0B]" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </button>
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
          clientNotes={selectedClientForProfile.notes}
          clientAvatar={selectedClientForProfile.avatar}
        />
      )}

      {/* Feedback Modal */}
      {isFeedbackOpen && feedbackClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsFeedbackOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-xl shadow-2xl border p-4 max-h-[90vh] overflow-y-auto bg-[#2B3038] border-[#606364]">
            <h3 className="text-lg font-bold mb-3 text-[#C3BCC2]">
              Leave feedback for {feedbackClient.name}
            </h3>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              className="w-full rounded-lg p-3 border mb-4 text-sm resize-none bg-[#2A3133] border-[#606364] text-[#C3BCC2]"
              rows={6}
              placeholder="Type feedback/notes here..."
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="w-full px-4 py-2 rounded-lg border bg-transparent border-[#606364] text-[#ABA4AA]"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                disabled={updateNotes.isPending}
                className="w-full px-4 py-2 rounded-lg shadow-lg border disabled:opacity-50 bg-[#4A5A70] border-[#606364] text-[#C3BCC2]"
              >
                {updateNotes.isPending ? "Saving..." : "Save"}
              </button>
            </div>
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
