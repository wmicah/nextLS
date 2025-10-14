"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import {
  Calendar,
  Edit,
  Archive,
  Search,
  Users,
  MessageCircle,
  Grid3X3,
  List,
  Check,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { format } from "date-fns";
import ProfilePictureUploader from "./ProfilePictureUploader";
import ClientProfileModal from "./ClientProfileModal";

interface Client {
  id: string;
  name: string;
  email: string | null;
  avatar?: string | null;
  notes?: string | null;
  archived: boolean;
  nextLessonDate?: string | null;
  coach?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  user?: {
    settings?: {
      avatarUrl?: string | null;
    };
  } | null;
}

// Helper function to validate lesson dates
const isValidLessonDate = (date: string | null | undefined): boolean => {
  if (!date) return false;
  const lessonDate = new Date(date);
  const now = new Date();
  return lessonDate > now && !isNaN(lessonDate.getTime());
};

export default function OrganizationClientsView() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Feedback modal state
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackClient, setFeedbackClient] = useState<Client | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedClientForProfile, setSelectedClientForProfile] =
    useState<Client | null>(null);

  const { data: currentUser } = trpc.user.getProfile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const { data: organization } = trpc.organization.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all clients from the organization
  const { data: allClients = [], isLoading } =
    trpc.organization.getOrganizationClients.useQuery(undefined, {
      enabled: !!organization,
      staleTime: 2 * 60 * 1000,
    });

  const utils = trpc.useUtils();

  // Mutation to update notes
  const updateNotes = trpc.clients.updateNotes.useMutation({
    onSuccess: () => {
      utils.organization.getOrganizationClients.invalidate();
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

  // Filter and sort clients (only show active clients)
  const filteredAndSortedClients = allClients
    .filter((client: Client) => !client.archived)
    .filter((client: Client) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        client.name.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.coach?.name?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a: Client, b: Client) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "coach":
          comparison = (a.coach?.name || "").localeCompare(b.coach?.name || "");
          break;
        case "nextLesson":
          const aDate = a.nextLessonDate
            ? new Date(a.nextLessonDate).getTime()
            : 0;
          const bDate = b.nextLessonDate
            ? new Date(b.nextLessonDate).getTime()
            : 0;
          comparison = aDate - bDate;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const activeCount = allClients.filter((c: Client) => !c.archived).length;
  const totalClients = activeCount;

  const handleOpenProfile = (client: Client) => {
    router.push(`/organization/clients/${client.id}/detail`);
  };

  if (!organization) return null;

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* Compact Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div>
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: "#C3BCC2" }}
          >
            Organization Clients
          </h1>
          <p className="text-xs" style={{ color: "#ABA4AA" }}>
            {activeCount} active clients across {organization.coaches.length}{" "}
            coaches
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div
        className="rounded-xl border p-4"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
              style={{ color: "#ABA4AA" }}
            />
            <input
              type="text"
              placeholder="Search by name, email, or coach..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4A5A70]"
              style={{
                backgroundColor: "#2A3133",
                color: "#C3BCC2",
                border: "1px solid #606364",
              }}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[#3A4040] whitespace-nowrap"
              style={{
                backgroundColor: "#2A3133",
                color: "#C3BCC2",
                border: "1px solid #606364",
              }}
            >
              Sort:{" "}
              {sortBy === "name"
                ? "Name"
                : sortBy === "coach"
                ? "Coach"
                : "Next Lesson"}
              {sortOrder === "asc" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showSortDropdown && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-10"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                }}
              >
                <div className="p-2">
                  {["name", "coach", "nextLesson"].map(option => (
                    <button
                      key={option}
                      onClick={() => {
                        if (sortBy === option) {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy(option);
                          setSortOrder("asc");
                        }
                        setShowSortDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-[#3A4040]"
                      style={{ color: "#C3BCC2" }}
                    >
                      {option === "name"
                        ? "Name"
                        : option === "coach"
                        ? "Coach"
                        : "Next Lesson"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div
            className="flex gap-1 border rounded-lg p-1"
            style={{ borderColor: "#606364" }}
          >
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-all duration-200 ${
                viewMode === "grid" ? "shadow-lg" : ""
              }`}
              style={{
                backgroundColor:
                  viewMode === "grid" ? "#4A5A70" : "transparent",
                color: viewMode === "grid" ? "#fff" : "#ABA4AA",
              }}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-all duration-200 ${
                viewMode === "list" ? "shadow-lg" : ""
              }`}
              style={{
                backgroundColor:
                  viewMode === "list" ? "#4A5A70" : "transparent",
                color: viewMode === "list" ? "#fff" : "#ABA4AA",
              }}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

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

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "#4A5A70" }}
          />
        </div>
      ) : filteredAndSortedClients.length === 0 ? (
        /* Empty State */
        <div
          className="rounded-xl border text-center"
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className="p-12">
            <Users
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: "#606364" }}
            />
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "#C3BCC2" }}
            >
              No clients found
            </h3>
            <p style={{ color: "#ABA4AA" }}>
              {searchTerm
                ? "Try adjusting your search"
                : "No active clients in the organization yet"}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedClients.map((client: Client) => (
                <div
                  key={client.id}
                  className="rounded-xl border transition-all duration-200 hover:shadow-lg cursor-pointer relative overflow-hidden group"
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
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
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
                            <h3
                              className="text-base font-semibold truncate"
                              style={{ color: "#C3BCC2" }}
                            >
                              {client.name}
                            </h3>
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
                          {/* Coach Info */}
                          <div className="mt-2 flex items-center gap-1">
                            <User
                              className="h-3 w-3"
                              style={{ color: "#ABA4AA" }}
                            />
                            <p
                              className="text-xs truncate"
                              style={{ color: "#ABA4AA" }}
                            >
                              Coach: {client.coach?.name || "Unknown"}
                            </p>
                          </div>
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

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            openFeedback(client);
                          }}
                          className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                          style={{
                            color: "#ABA4AA",
                            backgroundColor: "transparent",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = "#C3BCC2";
                            e.currentTarget.style.backgroundColor = "#3A4040";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = "#ABA4AA";
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                          title="View feedback"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
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
                            e.currentTarget.style.backgroundColor = "#3A4040";
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
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-4">
              {filteredAndSortedClients.map((client: Client) => (
                <div
                  key={client.id}
                  className="rounded-xl border transition-all duration-200 hover:shadow-lg cursor-pointer"
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
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <ProfilePictureUploader
                          currentAvatarUrl={
                            client.user?.settings?.avatarUrl || client.avatar
                          }
                          userName={client.name}
                          onAvatarChange={() => {}}
                          readOnly={true}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3
                              className="text-lg font-semibold"
                              style={{ color: "#C3BCC2" }}
                            >
                              {client.name}
                            </h3>
                            {isValidLessonDate(client.nextLessonDate) && (
                              <span
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
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
                            className="text-sm mb-1"
                            style={{ color: "#ABA4AA" }}
                          >
                            {client.email || "No email"}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <User
                                className="h-4 w-4"
                                style={{ color: "#ABA4AA" }}
                              />
                              <span style={{ color: "#ABA4AA" }}>
                                Coach: {client.coach?.name || "Unknown"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar
                                className="h-4 w-4"
                                style={{ color: "#ABA4AA" }}
                              />
                              <span style={{ color: "#ABA4AA" }}>
                                Next:{" "}
                                {isValidLessonDate(client.nextLessonDate)
                                  ? format(
                                      new Date(client.nextLessonDate!),
                                      "MMM d, yyyy"
                                    )
                                  : "No lesson"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            openFeedback(client);
                          }}
                          className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                          style={{
                            color: "#ABA4AA",
                            backgroundColor: "transparent",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = "#C3BCC2";
                            e.currentTarget.style.backgroundColor = "#3A4040";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = "#ABA4AA";
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                          title="View feedback"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
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
                            e.currentTarget.style.backgroundColor = "#3A4040";
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
              ))}
            </div>
          )}
        </>
      )}

      {/* Client Profile Modal */}
      {isProfileModalOpen && selectedClientForProfile && (
        <ClientProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setSelectedClientForProfile(null);
            utils.organization.getOrganizationClients.invalidate();
          }}
          clientId={selectedClientForProfile.id}
          clientName={selectedClientForProfile.name}
          clientEmail={selectedClientForProfile.email}
          clientNotes={selectedClientForProfile.notes}
          clientAvatar={selectedClientForProfile.avatar}
        />
      )}

      {/* Feedback Modal */}
      {isFeedbackOpen && feedbackClient && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsFeedbackOpen(false)}
        >
          <div
            className="rounded-2xl shadow-2xl p-6 max-w-2xl w-full"
            style={{ backgroundColor: "#353A3A" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: "#C3BCC2" }}>
              Notes for {feedbackClient.name}
            </h3>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Add notes about this client..."
              className="w-full h-40 p-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4A5A70]"
              style={{
                backgroundColor: "#2A3133",
                color: "#C3BCC2",
                border: "1px solid #606364",
              }}
              readOnly
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: "transparent",
                  color: "#ABA4AA",
                  border: "1px solid #606364",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
