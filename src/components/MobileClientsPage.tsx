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
} from "lucide-react";
import { format } from "date-fns";
import CustomSelect from "./ui/CustomSelect";
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
  const [selectedClientForProfile, setSelectedClientForProfile] =
    useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);

  const {
    data: clients = [],
    isLoading,
    error,
  } = trpc.clients.list.useQuery({
    archived: activeTab === "archived",
  });

  const { data: activeClientsData = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  const { data: archivedClientsData = [] } = trpc.clients.list.useQuery({
    archived: true,
  });
  const utils = trpc.useUtils();

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
    router.push(`/clients/${client.id}/detail`);
  };

  const isValidLessonDate = (lessonDate: string | null) => {
    if (!lessonDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lesson = new Date(lessonDate);
    return lesson > today;
  };

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

          const aHasLessonToday =
            a.nextLessonDate &&
            new Date(a.nextLessonDate).getTime() === today.getTime() &&
            new Date(a.nextLessonDate) > now;
          const bHasLessonToday =
            b.nextLessonDate &&
            new Date(b.nextLessonDate).getTime() === today.getTime() &&
            new Date(b.nextLessonDate) > now;

          if (aHasLessonToday && !bHasLessonToday) return -1;
          if (!aHasLessonToday && bHasLessonToday) return 1;

          if (aHasLessonToday && bHasLessonToday) {
            const aTime = new Date(a.nextLessonDate!).getTime();
            const bTime = new Date(b.nextLessonDate!).getTime();
            return aTime - bTime;
          }

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

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalClients = clients.length;
  const activeClients = activeClientsData.length;
  const archivedClients = archivedClientsData.length;
  const recentClients = clients.filter((c: Client) => {
    const createdAt = new Date(c.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdAt > thirtyDaysAgo;
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
      <div
        className="min-h-screen w-full max-w-full overflow-x-hidden"
        style={{ backgroundColor: "#2A3133" }}
      >
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 bg-[#2A3133] border-b border-[#606364] py-3">
          <div className="flex items-center justify-between w-full min-w-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Users className="h-4 w-4" style={{ color: "#C3BCC2" }} />
              </div>
              <h1 className="text-lg font-bold text-[#C3BCC2] truncate">
                Athletes
              </h1>
              <span
                className="px-2 py-1 rounded-full text-xs font-medium flex-shrink-0"
                style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
              >
                {activeTab === "active" ? activeClients : archivedClients}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-lg bg-[#353A3A] border border-[#606364] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Search className="h-4 w-4 text-[#C3BCC2]" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-lg bg-[#353A3A] border border-[#606364] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Filter className="h-4 w-4 text-[#C3BCC2]" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="py-3 bg-[#353A3A] border-b border-[#606364] w-full">
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: "#ABA4AA" }}
              />
              <input
                type="text"
                placeholder="Search athletes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                }}
              />
              <button
                onClick={() => setShowSearch(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
              >
                <X className="h-4 w-4 text-[#ABA4AA]" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Filters */}
        {showFilters && (
          <div className="py-3 bg-[#353A3A] border-b border-[#606364] w-full">
            <div className="flex items-center gap-2 mb-3 w-full">
              <Filter className="h-4 w-4 text-[#ABA4AA] flex-shrink-0" />
              <span className="text-sm font-medium text-[#C3BCC2] flex-1 min-w-0">
                Filters
              </span>
              <button
                onClick={() => setShowFilters(false)}
                className="ml-auto flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
              >
                <X className="h-4 w-4 text-[#ABA4AA]" />
              </button>
            </div>
            <div className="flex gap-2 mb-3 w-full">
              <CustomSelect
                value={sortBy}
                onChange={value => setSortBy(value)}
                options={[
                  { value: "name", label: "Sort by Name" },
                  { value: "createdAt", label: "Sort by Date Added" },
                  { value: "nextLesson", label: "Sort by Next Lesson" },
                ]}
                placeholder="Sort by"
                className="flex-1"
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                }}
              />
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2 rounded-lg border flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                }}
              >
                {sortOrder === "asc" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mobile Stats - Horizontal Scroll */}
        <div className="py-4 w-full">
          <div className="flex gap-3 overflow-x-auto pb-2 w-full">
            <div
              className="flex-shrink-0 w-32 rounded-xl border p-3"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <Users className="h-3 w-3" style={{ color: "#C3BCC2" }} />
                </div>
                <TrendingUp className="h-3 w-3 text-green-400" />
              </div>
              <div>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: "#ABA4AA" }}
                >
                  Active
                </p>
                <p className="text-lg font-bold" style={{ color: "#C3BCC2" }}>
                  {activeClients}
                </p>
              </div>
            </div>

            <div
              className="flex-shrink-0 w-32 rounded-xl border p-3"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#DC2626" }}
                >
                  <Archive className="h-3 w-3" style={{ color: "#C3BCC2" }} />
                </div>
                <Activity className="h-3 w-3 text-red-400" />
              </div>
              <div>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: "#ABA4AA" }}
                >
                  Archived
                </p>
                <p className="text-lg font-bold" style={{ color: "#C3BCC2" }}>
                  {archivedClients}
                </p>
              </div>
            </div>

            <div
              className="flex-shrink-0 w-32 rounded-xl border p-3"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#10B981" }}
                >
                  <Star className="h-3 w-3" style={{ color: "#C3BCC2" }} />
                </div>
                <Sparkles className="h-3 w-3 text-green-400" />
              </div>
              <div>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: "#ABA4AA" }}
                >
                  Recent
                </p>
                <p className="text-lg font-bold" style={{ color: "#C3BCC2" }}>
                  {recentClients}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="mb-4 w-full">
          <div
            className="flex rounded-xl border p-1 w-full"
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
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                <span>Active</span>
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
                <span>Archived</span>
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

        {/* Mobile Client Cards */}
        <div className="pb-20 w-full">
          {filteredAndSortedClients.length === 0 ? (
            <div
              className="rounded-2xl border text-center py-12"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Users className="h-8 w-8" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: "#C3BCC2" }}
              >
                {searchTerm ? "No athletes found" : "Ready to Start Coaching?"}
              </h3>
              <p className="mb-6 text-sm" style={{ color: "#ABA4AA" }}>
                {searchTerm
                  ? `No athletes match "${searchTerm}". Try a different search term.`
                  : "Add your first athlete to begin building your coaching career."}
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 shadow-lg font-medium mx-auto border"
                style={{
                  backgroundColor: "#4A5A70",
                  color: "#C3BCC2",
                  borderColor: "#606364",
                }}
              >
                <Plus className="h-4 w-4" />
                {searchTerm ? "Add New Athlete" : "Add Your First Athlete"}
              </button>
            </div>
          ) : (
            <div className="space-y-3 w-full">
              {filteredAndSortedClients.map((client: Client, index: number) => (
                <div
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}/detail`)}
                  className="rounded-2xl border transition-all duration-300 relative overflow-hidden w-full cursor-pointer hover:opacity-90"
                  style={{
                    backgroundColor: "#353A3A",
                    borderColor: "#606364",
                  }}
                >
                  <div className="p-4 w-full">
                    <div className="flex items-center gap-3 mb-3 w-full">
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
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className="text-base font-bold truncate flex-1 min-w-0"
                            style={{ color: "#C3BCC2" }}
                          >
                            {client.name}
                          </h3>
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isValidLessonDate(client.nextLessonDate)
                                ? "bg-green-400"
                                : "bg-gray-400"
                            }`}
                          />
                        </div>
                        <p
                          className="text-xs truncate"
                          style={{ color: "#ABA4AA" }}
                        >
                          Added{" "}
                          {format(new Date(client.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <button
                        onClick={e => e.stopPropagation()}
                        className="p-2 rounded-lg flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        style={{ color: "#ABA4AA" }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div
                        className="rounded-lg p-3"
                        style={{ backgroundColor: "#3A4040" }}
                      >
                        <p
                          className="text-xs font-medium mb-1"
                          style={{ color: "#ABA4AA" }}
                        >
                          Next Lesson
                        </p>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#C3BCC2" }}
                        >
                          {isValidLessonDate(client.nextLessonDate)
                            ? format(new Date(client.nextLessonDate!), "MMM d")
                            : "Not scheduled"}
                        </p>
                      </div>
                      <div
                        className="rounded-lg p-3"
                        style={{ backgroundColor: "#3A4040" }}
                      >
                        <p
                          className="text-xs font-medium mb-1"
                          style={{ color: "#ABA4AA" }}
                        >
                          Last Workout
                        </p>
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: "#C3BCC2" }}
                        >
                          {client.lastCompletedWorkout || "None"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium flex-shrink-0`}
                        style={{
                          backgroundColor: isValidLessonDate(
                            client.nextLessonDate
                          )
                            ? "#10B981"
                            : "#3A4040",
                          color: isValidLessonDate(client.nextLessonDate)
                            ? "#DCFCE7"
                            : "#C3BCC2",
                        }}
                      >
                        {isValidLessonDate(client.nextLessonDate)
                          ? "🔥 Active"
                          : "💤 Available"}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {client.email && (
                          <button
                            onClick={e => e.stopPropagation()}
                            className="p-2 rounded-lg transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            style={{ color: "#ABA4AA" }}
                            title={client.email}
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}
                        {client.phone && (
                          <button
                            onClick={e => e.stopPropagation()}
                            className="p-2 rounded-lg transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            style={{ color: "#ABA4AA" }}
                            title={client.phone}
                          >
                            <Phone className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            openFeedback(client);
                          }}
                          className="p-2 rounded-lg transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                          style={{ color: "#ABA4AA" }}
                          title="Add feedback"
                        >
                          <MessageCircle className="h-4 w-4" />
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
                          className="p-2 rounded-lg transition-all duration-300 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                          style={{ color: "#ABA4AA" }}
                        >
                          {archivingClientId === client.id ? (
                            <div
                              className="animate-spin rounded-full h-4 w-4 border-b-2"
                              style={{ borderColor: "#EF4444" }}
                            />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg border flex items-center justify-center transition-all duration-300 transform hover:scale-110"
          style={{
            backgroundColor: "#4A5A70",
            borderColor: "#606364",
            color: "#C3BCC2",
          }}
        >
          <Plus className="h-6 w-6" />
        </button>

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
              className="relative w-full max-w-lg rounded-xl shadow-2xl border p-6 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
            >
              <h3
                className="text-lg font-bold mb-4"
                style={{ color: "#C3BCC2" }}
              >
                Leave feedback for {feedbackClient.name}
              </h3>
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                className="w-full rounded-lg p-3 border mb-4 text-sm resize-none"
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                }}
                rows={6}
                placeholder="Type feedback/notes here..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsFeedbackOpen(false)}
                  className="px-4 py-2 rounded-lg border"
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
                  className="px-4 py-2 rounded-lg shadow-lg border disabled:opacity-50"
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
