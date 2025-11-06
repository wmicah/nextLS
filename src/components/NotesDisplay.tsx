"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  FileText,
  Image,
  Video,
  Tag,
  Calendar,
  User,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Pin,
  PinOff,
  X,
} from "lucide-react";
import { format } from "date-fns";
import NoteComposer from "./NoteComposer";

interface NotesDisplayProps {
  clientId?: string; // For coach view
  isClientView?: boolean; // For client view
  showComposer?: boolean; // Show add note button
}

interface Note {
  id: string;
  title: string | null;
  content: string;
  type: string;
  priority: string;
  isPrivate: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  coach: {
    id: string;
    name: string | null;
  };
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export default function NotesDisplay({
  clientId,
  isClientView = false,
  showComposer = true,
}: NotesDisplayProps) {
  console.log("NotesDisplay - clientId:", clientId);
  console.log("NotesDisplay - isClientView:", isClientView);
  console.log("NotesDisplay - showComposer:", showComposer);

  const [showComposerModal, setShowComposerModal] = useState(false);
  const [showAllNotesModal, setShowAllNotesModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showPrivate, setShowPrivate] = useState(false);

  // Fetch notes based on view type
  const {
    data: notes = [],
    isLoading,
    refetch,
  } = isClientView
    ? trpc.notes.getMyNotes.useQuery(undefined, {
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    : trpc.notes.getClientNotes.useQuery(
        { clientId: clientId! },
        {
          enabled: !!clientId,
          staleTime: 5 * 60 * 1000, // 5 minutes
        }
      );

  const deleteNoteMutation = trpc.notes.deleteNote.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const togglePinNoteMutation = trpc.clients.togglePinNote.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PROGRESS":
        return "";
      case "FEEDBACK":
        return "";
      case "GOAL":
        return "";
      case "INJURY":
        return "";
      case "TECHNIQUE":
        return "";
      case "MOTIVATION":
        return "";
      case "SCHEDULE":
        return "";
      default:
        return "";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PROGRESS":
        return "#10B981";
      case "FEEDBACK":
        return "#3B82F6";
      case "GOAL":
        return "#8B5CF6";
      case "INJURY":
        return "#EF4444";
      case "TECHNIQUE":
        return "#F59E0B";
      case "MOTIVATION":
        return "#EC4899";
      case "SCHEDULE":
        return "#06B6D4";
      default:
        return "#4A5A70";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "#10B981";
      case "NORMAL":
        return "#3B82F6";
      case "HIGH":
        return "#F59E0B";
      case "URGENT":
        return "#EF4444";
      default:
        return "#3B82F6";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "🟢";
      case "NORMAL":
        return "🔵";
      case "HIGH":
        return "🟡";
      case "URGENT":
        return "🔴";
      default:
        return "🔵";
    }
  };

  // Filter and sort notes
  const filteredNotes = notes
    .filter((note: Note) => {
      const matchesSearch =
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some(tag =>
          tag.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesType = filterType === "ALL" || note.type === filterType;
      const matchesPrivacy = showPrivate || !note.isPrivate;

      return matchesSearch && matchesType && matchesPrivacy;
    })
    .sort((a: Note, b: Note) => {
      // Always show pinned notes first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then sort by date
      if (sortOrder === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    });

  const handleDeleteNote = async (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNoteMutation.mutateAsync({ noteId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6" style={{ color: "#4A5A70" }} />
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#ffffff" }}>
              {isClientView ? "Coach's Notes" : "Client Notes"}
            </h2>
            <p className="text-sm" style={{ color: "#9ca3af" }}>
              {notes.length} note{notes.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {showComposer && !isClientView && (
          <button
            onClick={() => setShowComposerModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: "#4A5A70",
              color: "#FFFFFF",
            }}
          >
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4" style={{ color: "#9ca3af" }} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            style={{
              backgroundColor: "#2A3133",
              borderColor: "#606364",
              color: "#C3BCC2",
            }}
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          style={{
            backgroundColor: "#2A3133",
            borderColor: "#606364",
            color: "#C3BCC2",
          }}
        >
          <option value="ALL">All Types</option>
          <option value="GENERAL">General</option>
          <option value="PROGRESS">Progress</option>
          <option value="FEEDBACK">Feedback</option>
          <option value="GOAL">Goal</option>
          <option value="INJURY">Injury</option>
          <option value="TECHNIQUE">Technique</option>
          <option value="MOTIVATION">Motivation</option>
          <option value="SCHEDULE">Schedule</option>
        </select>

        <button
          onClick={() =>
            setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
          }
          className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: "#2A3133",
            borderColor: "#606364",
            color: "#C3BCC2",
          }}
        >
          {sortOrder === "newest" ? (
            <SortDesc className="w-4 h-4" />
          ) : (
            <SortAsc className="w-4 h-4" />
          )}
          {sortOrder === "newest" ? "Newest" : "Oldest"}
        </button>

        {!isClientView && (
          <button
            onClick={() => setShowPrivate(!showPrivate)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: showPrivate ? "#4A5A70" : "#2A3133",
              borderColor: "#606364",
              color: "#C3BCC2",
            }}
          >
            {showPrivate ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            {showPrivate ? "Hide Private" : "Show Private"}
          </button>
        )}
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <FileText
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: "#606364" }}
          />
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: "#C3BCC2" }}
          >
            No Notes Found
          </h3>
          <p className="text-sm" style={{ color: "#9ca3af" }}>
            {searchTerm || filterType !== "ALL"
              ? "Try adjusting your filters or search terms."
              : isClientView
              ? "Your coach hasn't sent any notes yet."
              : "No notes have been created for this client yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.slice(0, 4).map((note: Note) => (
            <div
              key={note.id}
              className={`p-6 rounded-lg border ${
                note.isPinned ? "ring-2 ring-yellow-500/50" : ""
              }`}
              style={{
                backgroundColor: note.isPinned ? "#4A5A70/20" : "#2A2F2F",
                borderColor: note.isPinned ? "#FCD34D" : "#606364",
              }}
            >
              {/* Note Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: getTypeColor(note.type) + "20" }}
                  >
                    <span className="text-lg">{getTypeIcon(note.type)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className="font-semibold"
                        style={{ color: "#C3BCC2" }}
                      >
                        {note.title || `${getTypeIcon(note.type)} ${note.type}`}
                      </h3>
                      {note.isPrivate && (
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: "#4A5A70",
                            color: "#FFFFFF",
                          }}
                        >
                          Private
                        </span>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-4 text-xs"
                      style={{ color: "#9ca3af" }}
                    >
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {note.coach.name || "Unknown Coach"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(
                          new Date(note.createdAt),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        {getPriorityIcon(note.priority)} {note.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {!isClientView && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingNote(note)}
                      className="p-2 rounded-lg hover:bg-blue-500/20 transition-colors"
                      title="Edit note"
                    >
                      <Edit className="w-4 h-4" style={{ color: "#3B82F6" }} />
                    </button>
                    <button
                      onClick={() =>
                        togglePinNoteMutation.mutate({ noteId: note.id })
                      }
                      disabled={togglePinNoteMutation.isPending}
                      className={`p-2 rounded-lg transition-all ${
                        note.isPinned
                          ? "bg-yellow-500/20 hover:bg-yellow-500/30"
                          : "hover:bg-gray-500/20"
                      }`}
                      title={note.isPinned ? "Unpin note" : "Pin note"}
                    >
                      {note.isPinned ? (
                        <Pin
                          className="w-4 h-4"
                          style={{ color: "#FCD34D" }}
                          fill="#FCD34D"
                        />
                      ) : (
                        <PinOff
                          className="w-4 h-4"
                          style={{ color: "#9ca3af" }}
                        />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2
                        className="w-4 h-4"
                        style={{ color: "#EF4444" }}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Note Content */}
              <div className="mb-4">
                <p className="whitespace-pre-wrap" style={{ color: "#ABA4AA" }}>
                  {note.content}
                </p>
              </div>

              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {note.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: tag.color + "20",
                        color: tag.color,
                      }}
                    >
                      <Tag className="w-3 h-3" />
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Attachments */}
              {note.attachments.length > 0 && (
                <div className="space-y-2">
                  <h4
                    className="text-sm font-medium"
                    style={{ color: "#C3BCC2" }}
                  >
                    Attachments ({note.attachments.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {note.attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="p-3 rounded-lg border"
                        style={{
                          backgroundColor: "#353A3A",
                          borderColor: "#606364",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {attachment.fileType.startsWith("image/") ? (
                            <Image
                              className="w-4 h-4"
                              style={{ color: "#4A5A70" }}
                            />
                          ) : attachment.fileType.startsWith("video/") ? (
                            <Video
                              className="w-4 h-4"
                              style={{ color: "#4A5A70" }}
                            />
                          ) : (
                            <FileText
                              className="w-4 h-4"
                              style={{ color: "#4A5A70" }}
                            />
                          )}
                          <span
                            className="text-xs font-medium"
                            style={{ color: "#C3BCC2" }}
                          >
                            {attachment.fileName}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: "#9ca3af" }}>
                          {(attachment.fileSize / 1024 / 1024).toFixed(1)} MB
                        </p>
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View File
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Load More Button */}
          {filteredNotes.length > 4 && (
            <button
              onClick={() => setShowAllNotesModal(true)}
              className="w-full py-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] text-center"
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
                color: "#C3BCC2",
              }}
            >
              <span className="font-medium">
                View All {filteredNotes.length} Notes
              </span>
            </button>
          )}
        </div>
      )}

      {/* All Notes Modal */}
      {showAllNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowAllNotesModal(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border p-6 bg-[#2B3038] border-[#606364]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#ffffff" }}>
                All Notes ({filteredNotes.length})
              </h2>
              <button
                onClick={() => setShowAllNotesModal(false)}
                className="p-2 rounded-lg hover:bg-[#4A5A70] transition-colors"
              >
                <X className="h-5 w-5" style={{ color: "#ABA4AA" }} />
              </button>
            </div>

            <div className="space-y-4">
              {filteredNotes.map((note: Note) => (
                <div
                  key={note.id}
                  className={`p-6 rounded-lg border ${
                    note.isPinned ? "ring-2 ring-yellow-500/50" : ""
                  }`}
                  style={{
                    backgroundColor: note.isPinned ? "#4A5A70/20" : "#2A2F2F",
                    borderColor: note.isPinned ? "#FCD34D" : "#606364",
                  }}
                >
                  {/* Note Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: getTypeColor(note.type) + "20",
                        }}
                      >
                        <span className="text-lg">
                          {getTypeIcon(note.type)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className="font-semibold"
                            style={{ color: "#C3BCC2" }}
                          >
                            {note.title ||
                              `${getTypeIcon(note.type)} ${note.type}`}
                          </h3>
                          {note.isPrivate && (
                            <span
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: "#4A5A70",
                                color: "#FFFFFF",
                              }}
                            >
                              Private
                            </span>
                          )}
                        </div>
                        <div
                          className="flex items-center gap-4 text-xs"
                          style={{ color: "#9ca3af" }}
                        >
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {note.coach.name || "Unknown Coach"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(
                              new Date(note.createdAt),
                              "MMM d, yyyy 'at' h:mm a"
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            {getPriorityIcon(note.priority)} {note.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isClientView && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingNote(note);
                            setShowAllNotesModal(false);
                          }}
                          className="p-2 rounded-lg hover:bg-blue-500/20 transition-colors"
                          title="Edit note"
                        >
                          <Edit
                            className="w-4 h-4"
                            style={{ color: "#3B82F6" }}
                          />
                        </button>
                        <button
                          onClick={() =>
                            togglePinNoteMutation.mutate({ noteId: note.id })
                          }
                          disabled={togglePinNoteMutation.isPending}
                          className={`p-2 rounded-lg transition-all ${
                            note.isPinned
                              ? "bg-yellow-500/20 hover:bg-yellow-500/30"
                              : "hover:bg-gray-500/20"
                          }`}
                          title={note.isPinned ? "Unpin note" : "Pin note"}
                        >
                          {note.isPinned ? (
                            <Pin
                              className="w-4 h-4"
                              style={{ color: "#FCD34D" }}
                              fill="#FCD34D"
                            />
                          ) : (
                            <PinOff
                              className="w-4 h-4"
                              style={{ color: "#9ca3af" }}
                            />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2
                            className="w-4 h-4"
                            style={{ color: "#EF4444" }}
                          />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Note Content */}
                  <div className="mb-4">
                    <p
                      className="whitespace-pre-wrap"
                      style={{ color: "#ABA4AA" }}
                    >
                      {note.content}
                    </p>
                  </div>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags.map(tag => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: tag.color + "20",
                            color: tag.color,
                          }}
                        >
                          <Tag className="w-3 h-3" />
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Attachments */}
                  {note.attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4
                        className="text-sm font-medium"
                        style={{ color: "#C3BCC2" }}
                      >
                        Attachments ({note.attachments.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {note.attachments.map(attachment => (
                          <div
                            key={attachment.id}
                            className="p-3 rounded-lg border"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {attachment.fileType.startsWith("image/") ? (
                                <Image
                                  className="w-4 h-4"
                                  style={{ color: "#4A5A70" }}
                                />
                              ) : attachment.fileType.startsWith("video/") ? (
                                <Video
                                  className="w-4 h-4"
                                  style={{ color: "#4A5A70" }}
                                />
                              ) : (
                                <FileText
                                  className="w-4 h-4"
                                  style={{ color: "#4A5A70" }}
                                />
                              )}
                              <span
                                className="text-xs font-medium"
                                style={{ color: "#C3BCC2" }}
                              >
                                {attachment.fileName}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: "#9ca3af" }}>
                              {(attachment.fileSize / 1024 / 1024).toFixed(1)}{" "}
                              MB
                            </p>
                            <a
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              View File
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Note Composer Modal - Create */}
      {showComposerModal && clientId && (
        <NoteComposer
          isOpen={showComposerModal}
          onClose={() => {
            setShowComposerModal(false);
            setEditingNote(null);
          }}
          clientId={clientId}
          clientName="Client" // You might want to pass the actual client name
          onSuccess={() => {
            refetch();
            setShowComposerModal(false);
            setEditingNote(null);
          }}
        />
      )}

      {/* Note Composer Modal - Edit */}
      {editingNote && clientId && (
        <NoteComposer
          isOpen={!!editingNote}
          onClose={() => setEditingNote(null)}
          clientId={clientId}
          clientName="Client" // You might want to pass the actual client name
          editingNote={editingNote}
          onSuccess={() => {
            refetch();
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}
