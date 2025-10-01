"use client";

import { useState } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import AddClientModal from "./AddClientModal";
import Sidebar from "./Sidebar";

import ClientProfileModal from "./ClientProfileModal";
import ProfilePictureUploader from "./ProfilePictureUploader";

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

  // Feedback modal state
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackClient, setFeedbackClient] = useState<Client | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedClientForProfile, setSelectedClientForProfile] =
    useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

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

  const handleArchiveClientFromDelete = (
    clientId: string,
    clientName: string
  ) => {
    if (
      window.confirm(
        `Are you sure you want to archive ${clientName}? They will be moved to the archived section and can be restored later.`
      )
    ) {
      setArchivingClientId(clientId);
      archiveClient.mutate({ id: clientId });
    }
  };

  const handleArchiveClient = (clientId: string, clientName: string) => {
    if (
      window.confirm(
        `Are you sure you want to archive ${clientName}? They will be moved to the archived section.`
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

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
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
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <Users className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                  </div>
                  <div>
                    <h1
                      className="text-4xl font-bold mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Your Athletes
                    </h1>
                    <p
                      className="flex items-center gap-2 text-lg"
                      style={{ color: "#ABA4AA" }}
                    >
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                      {activeTab === "active"
                        ? activeClients > 0
                          ? `Managing ${activeClients} ${
                              activeClients === 1
                                ? "active athlete"
                                : "active athletes"
                            }`
                          : "Ready to build your coaching team"
                        : archivedClients > 0
                        ? `Viewing ${archivedClients} ${
                            archivedClients === 1
                              ? "archived athlete"
                              : "archived athletes"
                          }`
                        : "No archived athletes"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="text-sm" style={{ color: "#ABA4AA" }}>
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards removed for cleaner, people-focused design */}
        <div className="hidden">
          <div
            className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
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
                background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
              }}
            />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <Users className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                </div>
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: "#ABA4AA" }}
                >
                  {activeTab === "active"
                    ? "Active Athletes"
                    : "Archived Athletes"}
                </p>
                <p
                  className="text-3xl font-bold mb-1"
                  style={{ color: "#C3BCC2" }}
                >
                  {activeTab === "active" ? activeClients : archivedClients}
                </p>
                <p className="text-xs" style={{ color: "#ABA4AA" }}>
                  {activeTab === "active"
                    ? activeClients > 0
                      ? "Active athletes"
                      : "No active athletes"
                    : archivedClients > 0
                    ? "Archived athletes"
                    : "No archived athletes"}
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
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
                background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
              }}
            />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#DC2626" }}
                >
                  <Calendar className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                </div>
                <Activity className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: "#ABA4AA" }}
                >
                  Archived Athletes
                </p>
                <p
                  className="text-3xl font-bold mb-1"
                  style={{ color: "#C3BCC2" }}
                >
                  {archivedClients}
                </p>
                <p className="text-xs" style={{ color: "#ABA4AA" }}>
                  {archivedClients > 0
                    ? "Previously active"
                    : "No archived athletes"}
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
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
                background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
              }}
            />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#10B981" }}
                >
                  <Star className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                </div>
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: "#ABA4AA" }}
                >
                  Recent Additions
                </p>
                <p
                  className="text-3xl font-bold mb-1"
                  style={{ color: "#C3BCC2" }}
                >
                  {recentClients}
                </p>
                <p className="text-xs" style={{ color: "#ABA4AA" }}>
                  {recentClients > 0 ? "Last 30 days" : "No recent additions"}
                </p>
              </div>
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
                <option value="name">Name (A-Z)</option>
                <option value="createdAt">Recently Added</option>
                <option value="nextLesson">Next Lesson</option>
              </select>

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

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-2xl font-bold flex items-center gap-3 mb-2"
              style={{ color: "#C3BCC2" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Users className="h-4 w-4" style={{ color: "#C3BCC2" }} />
              </div>
              Athletes
            </h2>
            <p className="flex items-center gap-2" style={{ color: "#ABA4AA" }}>
              <Clock className="h-4 w-4" />
              {filteredAndSortedClients.length} of {totalClients}{" "}
              {totalClients === 1 ? "athlete" : "athletes"}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        </div>

        {/* Enhanced Athletes List/Grid */}
        {filteredAndSortedClients.length === 0 ? (
          <div
            className="rounded-2xl shadow-xl border text-center relative overflow-hidden group"
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div
              className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
              style={{
                background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
              }}
            />
            <div className="relative p-12">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Users className="h-10 w-10" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: "#C3BCC2" }}
              >
                {searchTerm ? "No athletes found" : "Ready to Start Coaching?"}
              </h3>
              <p
                className="mb-8 max-w-md mx-auto text-lg"
                style={{ color: "#ABA4AA" }}
              >
                {searchTerm
                  ? `No athletes match "${searchTerm}". Try a different search term.`
                  : "Add your first athlete to begin building your coaching career and transforming lives."}
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium mx-auto border"
                style={{
                  backgroundColor: "#4A5A70",
                  color: "#C3BCC2",
                  borderColor: "#606364",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#606364";
                  e.currentTarget.style.boxShadow =
                    "0 10px 25px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#4A5A70";
                  e.currentTarget.style.boxShadow =
                    "0 4px 15px rgba(0, 0, 0, 0.2)";
                }}
              >
                <Plus className="h-5 w-5" />
                {searchTerm ? "Add New Athlete" : "Add Your First Athlete"}
              </button>
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
                        className="rounded-xl border transition-all duration-300 hover:border-gray-500 cursor-pointer relative overflow-hidden group"
                        style={{
                          backgroundColor: "#353A3A",
                          borderColor: "#606364",
                        }}
                        onClick={() => handleOpenProfile(client)}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#3A4040";
                          e.currentTarget.style.borderColor = "#4A5A70";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "#353A3A";
                          e.currentTarget.style.borderColor = "#606364";
                        }}
                      >
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <ProfilePictureUploader
                                currentAvatarUrl={
                                  client.user?.settings?.avatarUrl ||
                                  client.avatar
                                }
                                userName={client.name}
                                onAvatarChange={() => {}}
                                readOnly={true}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
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
                                <p className="text-xs truncate text-gray-400">
                                  {client.email || "No email"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  openFeedback(client);
                                }}
                                className="p-1.5 rounded-lg transition-all duration-300 hover:bg-gray-600/50"
                                style={{ color: "#ABA4AA" }}
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
                                className="p-1.5 rounded-lg transition-all duration-300 hover:bg-gray-600/50"
                                style={{ color: "#ABA4AA" }}
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
                                    handleUnarchiveClient(
                                      client.id,
                                      client.name
                                    );
                                  }
                                }}
                                disabled={archivingClientId === client.id}
                                className="p-1.5 rounded-lg transition-all duration-300 hover:bg-gray-600/50 disabled:opacity-50"
                                style={{ color: "#ABA4AA" }}
                                title={
                                  activeTab === "active"
                                    ? "Archive client"
                                    : "Unarchive client"
                                }
                              >
                                {archivingClientId === client.id ? (
                                  <div
                                    className="animate-spin rounded-full h-4 w-4 border-b-2"
                                    style={{
                                      borderColor:
                                        activeTab === "active"
                                          ? "#F59E0B"
                                          : "#10B981",
                                    }}
                                  />
                                ) : (
                                  <Archive className="h-4 w-4" />
                                )}
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
                          console.log("Card clicked for client:", client.name);
                          handleOpenProfile(client);
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

                                {/* Program Assignments */}
                                {client.programAssignments &&
                                  client.programAssignments.length > 0 && (
                                    <div className="mt-2">
                                      <p
                                        className="text-xs font-medium mb-1"
                                        style={{ color: "#ABA4AA" }}
                                      >
                                        Active Programs:
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {client.programAssignments
                                          .slice(0, 3)
                                          .map(assignment => (
                                            <span
                                              key={assignment.id}
                                              className="inline-flex items-center px-2 py-1 rounded text-xs"
                                              style={{
                                                backgroundColor: "#3A4040",
                                                color: "#C3BCC2",
                                              }}
                                            >
                                              {assignment.program.title} (
                                              {assignment.progress}%)
                                            </span>
                                          ))}
                                        {client.programAssignments.length >
                                          3 && (
                                          <span className="text-xs text-gray-400">
                                            +
                                            {client.programAssignments.length -
                                              3}{" "}
                                            more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right mr-4">
                                <p
                                  className="text-sm font-medium mb-1"
                                  style={{ color: "#ABA4AA" }}
                                >
                                  Next Lesson
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
                                    : "Not scheduled"}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
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
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (activeTab === "active") {
                                      handleArchiveClient(
                                        client.id,
                                        client.name
                                      );
                                    } else {
                                      handleUnarchiveClient(
                                        client.id,
                                        client.name
                                      );
                                    }
                                  }}
                                  disabled={archivingClientId === client.id}
                                  className="p-2 rounded-xl transition-all duration-300 transform hover:scale-110 disabled:opacity-50"
                                  style={{ color: "#ABA4AA" }}
                                  onMouseEnter={e => {
                                    if (!e.currentTarget.disabled) {
                                      e.currentTarget.style.color =
                                        activeTab === "active"
                                          ? "#F59E0B"
                                          : "#10B981";
                                      e.currentTarget.style.backgroundColor =
                                        "#3A4040";
                                    }
                                  }}
                                  onMouseLeave={e => {
                                    if (!e.currentTarget.disabled) {
                                      e.currentTarget.style.color = "#ABA4AA";
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }
                                  }}
                                >
                                  {archivingClientId === client.id ? (
                                    <div
                                      className="animate-spin rounded-full h-4 w-4 border-b-2"
                                      style={{
                                        borderColor:
                                          activeTab === "active"
                                            ? "#F59E0B"
                                            : "#10B981",
                                      }}
                                    />
                                  ) : (
                                    <Archive className="h-4 w-4" />
                                  )}
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
            <div
              className="relative w-full max-w-lg rounded-xl md:rounded-2xl shadow-2xl border p-4 md:p-6 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
            >
              <h3
                className="text-lg md:text-xl font-bold mb-3 md:mb-4"
                style={{ color: "#C3BCC2" }}
              >
                Leave feedback for {feedbackClient.name}
              </h3>
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                className="w-full rounded-lg md:rounded-xl p-3 border mb-4 text-sm md:text-base resize-none"
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                }}
                rows={6}
                placeholder="Type feedback/notes here..."
              />
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2">
                <button
                  onClick={() => setIsFeedbackOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg md:rounded-xl border touch-manipulation"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "#606364",
                    color: "#ABA4AA",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedback}
                  disabled={updateNotes.isPending}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg md:rounded-xl shadow-lg border disabled:opacity-50 touch-manipulation"
                  style={{
                    backgroundColor: "#4A5A70",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                >
                  {updateNotes.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

// Export with mobile detection
export default withMobileDetection(MobileClientsPage, ClientsPage);
