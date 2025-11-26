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
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import NoteComposer from "./NoteComposer";
import {
  COLORS,
  getGoldenAccent,
  getRedAlert,
  getGreenPrimary,
} from "@/lib/colors";

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
        return COLORS.GREEN_PRIMARY;
      case "FEEDBACK":
        return COLORS.GOLDEN_ACCENT;
      case "GOAL":
        return COLORS.GOLDEN_HOVER;
      case "INJURY":
        return COLORS.RED_ALERT;
      case "TECHNIQUE":
        return COLORS.GOLDEN_ACCENT;
      case "MOTIVATION":
        return COLORS.GOLDEN_HOVER;
      case "SCHEDULE":
        return COLORS.GOLDEN_ACCENT;
      default:
        return COLORS.TEXT_MUTED;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return COLORS.GREEN_PRIMARY;
      case "NORMAL":
        return COLORS.GOLDEN_ACCENT;
      case "HIGH":
        return COLORS.GOLDEN_HOVER;
      case "URGENT":
        return COLORS.RED_ALERT;
      default:
        return COLORS.GOLDEN_ACCENT;
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
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: COLORS.GOLDEN_ACCENT }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
          <div>
          <h2 className="text-sm font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
              {isClientView ? "Coach's Notes" : "Client Notes"}
            </h2>
          <p className="text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
              {notes.length} note{notes.length !== 1 ? "s" : ""}
            </p>
        </div>

        {showComposer && !isClientView && (
          <button
            onClick={() => setShowComposerModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              backgroundColor: COLORS.GOLDEN_DARK,
              color: COLORS.TEXT_PRIMARY,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Note
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5" style={{ color: COLORS.TEXT_MUTED }} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
              color: COLORS.TEXT_PRIMARY,
              flex: 1,
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(0.2)}`;
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-2 py-1.5 rounded-lg border text-xs focus:outline-none"
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
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all duration-200"
          style={{
            backgroundColor: COLORS.BACKGROUND_CARD,
            borderColor: COLORS.BORDER_SUBTLE,
            color: COLORS.TEXT_SECONDARY,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
            e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
            e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
            e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
          }}
        >
          {sortOrder === "newest" ? (
            <SortDesc className="w-3.5 h-3.5" />
          ) : (
            <SortAsc className="w-3.5 h-3.5" />
          )}
          {sortOrder === "newest" ? "Newest" : "Oldest"}
        </button>

        {!isClientView && (
          <button
            onClick={() => setShowPrivate(!showPrivate)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all duration-200"
            style={{
              backgroundColor: showPrivate ? getGoldenAccent(0.1) : COLORS.BACKGROUND_CARD,
              borderColor: showPrivate ? COLORS.GOLDEN_ACCENT : COLORS.BORDER_SUBTLE,
              color: showPrivate ? COLORS.GOLDEN_ACCENT : COLORS.TEXT_SECONDARY,
            }}
            onMouseEnter={e => {
              if (!showPrivate) {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }
            }}
            onMouseLeave={e => {
              if (!showPrivate) {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }
            }}
          >
            {showPrivate ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            {showPrivate ? "Hide Private" : "Show Private"}
          </button>
        )}
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <FileText
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: COLORS.TEXT_MUTED }}
          />
          <h3
            className="text-sm font-semibold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            No Notes Found
          </h3>
          <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
            {searchTerm || filterType !== "ALL"
              ? "Try adjusting your filters or search terms."
              : isClientView
              ? "Your coach hasn't sent any notes yet."
              : "No notes have been created for this client yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.slice(0, 4).map((note: Note) => (
            <div
              key={note.id}
              className={`p-4 rounded-lg border ${
                note.isPinned ? "ring-2" : ""
              }`}
              style={{
                backgroundColor: note.isPinned
                  ? getGoldenAccent(0.1)
                  : COLORS.BACKGROUND_CARD,
                borderColor: note.isPinned
                  ? COLORS.GOLDEN_ACCENT
                  : COLORS.BORDER_SUBTLE,
                boxShadow: note.isPinned
                  ? `0 0 0 2px ${getGoldenAccent(0.2)}`
                  : "none",
              }}
            >
              {/* Note Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {note.title && (
                      <h3
                            className="text-sm font-semibold truncate"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                            {note.title}
                      </h3>
                        )}
                        {!note.title && (
                          <span
                            className="text-xs font-medium"
                            style={{ color: COLORS.TEXT_MUTED }}
                          >
                            {note.type}
                          </span>
                        )}
                      {note.isPrivate && (
                        <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{
                              backgroundColor: COLORS.BACKGROUND_CARD_HOVER,
                              color: COLORS.TEXT_SECONDARY,
                              border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                          }}
                        >
                          Private
                        </span>
                      )}
                    </div>
                    <div
                        className="flex items-center gap-3 text-[10px] flex-wrap"
                        style={{ color: COLORS.TEXT_MUTED }}
                    >
                        <span>{note.coach.name || "Unknown Coach"}</span>
                        <span>
                        {format(
                          new Date(note.createdAt),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                        <span>{note.priority}</span>
                  </div>
                </div>

                {!isClientView && (
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => setEditingNote(note)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{
                            backgroundColor: "transparent",
                            color: COLORS.TEXT_SECONDARY,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                            e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                          }}
                      title="Edit note"
                    >
                          <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        togglePinNoteMutation.mutate({ noteId: note.id })
                      }
                      disabled={togglePinNoteMutation.isPending}
                          className="p-1.5 rounded-lg transition-all"
                          style={{
                            backgroundColor: note.isPinned
                              ? getGoldenAccent(0.1)
                              : "transparent",
                            color: note.isPinned
                              ? COLORS.GOLDEN_ACCENT
                              : COLORS.TEXT_SECONDARY,
                          }}
                          onMouseEnter={e => {
                            if (!note.isPinned) {
                              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                              e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                            }
                          }}
                          onMouseLeave={e => {
                            if (!note.isPinned) {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                            }
                          }}
                      title={note.isPinned ? "Unpin note" : "Pin note"}
                    >
                      {note.isPinned ? (
                        <Pin
                              className="w-3.5 h-3.5"
                              style={{ color: COLORS.GOLDEN_ACCENT }}
                              fill={COLORS.GOLDEN_ACCENT}
                        />
                      ) : (
                        <PinOff
                              className="w-3.5 h-3.5"
                        />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{
                            backgroundColor: "transparent",
                            color: COLORS.TEXT_SECONDARY,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = getRedAlert(0.1);
                            e.currentTarget.style.color = COLORS.RED_ALERT;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Note Content */}
              <div className="mb-3">
                <p
                  className="whitespace-pre-wrap text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {note.content}
                </p>
              </div>

              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {note.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                      style={{
                        backgroundColor: tag.color + "20",
                        color: tag.color,
                        border: `1px solid ${tag.color}40`,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Attachments */}
              {note.attachments && note.attachments.length > 0 && (
                <div className="space-y-2 pt-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <h4
                    className="text-xs font-medium mb-2"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Attachments ({note.attachments.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {note.attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="p-2 rounded-lg border"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_CARD_HOVER,
                          borderColor: COLORS.BORDER_SUBTLE,
                        }}
                      >
                        <div className="mb-1">
                          <span
                            className="text-[10px] font-medium truncate block"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            {attachment.fileName}
                          </span>
                        </div>
                        <p className="text-[10px] mb-1" style={{ color: COLORS.TEXT_MUTED }}>
                          {(attachment.fileSize / 1024 / 1024).toFixed(1)} MB
                        </p>
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] transition-colors"
                          style={{ color: COLORS.GOLDEN_ACCENT }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = COLORS.GOLDEN_HOVER;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                          }}
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
              className="w-full py-2 rounded-lg border text-xs font-medium transition-all duration-200 text-center"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_SECONDARY,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
                View All {filteredNotes.length} Notes
            </button>
          )}
        </div>
      )}

      {/* All Notes Modal */}
      {showAllNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowAllNotesModal(false)}
          />
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl border p-6"
            style={{
              backgroundColor: COLORS.BACKGROUND_DARK,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                All Notes ({filteredNotes.length})
              </h2>
              <button
                onClick={() => setShowAllNotesModal(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: COLORS.TEXT_SECONDARY }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {filteredNotes.map((note: Note) => (
                <div
                  key={note.id}
                  className={`p-4 rounded-lg border ${
                    note.isPinned ? "ring-2" : ""
                  }`}
                  style={{
                    backgroundColor: note.isPinned
                      ? getGoldenAccent(0.1)
                      : COLORS.BACKGROUND_CARD,
                    borderColor: note.isPinned
                      ? COLORS.GOLDEN_ACCENT
                      : COLORS.BORDER_SUBTLE,
                    boxShadow: note.isPinned
                      ? `0 0 0 2px ${getGoldenAccent(0.2)}`
                      : "none",
                  }}
                >
                  {/* Note Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                        {note.title && (
                          <h3
                            className="text-sm font-semibold truncate"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            {note.title}
                          </h3>
                        )}
                        {!note.title && (
                          <span
                            className="text-xs font-medium"
                            style={{ color: COLORS.TEXT_MUTED }}
                          >
                            {note.type}
                          </span>
                        )}
                          {note.isPrivate && (
                            <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{
                              backgroundColor: COLORS.BACKGROUND_CARD_HOVER,
                              color: COLORS.TEXT_SECONDARY,
                              border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                              }}
                            >
                              Private
                            </span>
                          )}
                        </div>
                        <div
                        className="flex items-center gap-3 text-[10px] flex-wrap"
                        style={{ color: COLORS.TEXT_MUTED }}
                        >
                        <span>{note.coach.name || "Unknown Coach"}</span>
                        <span>
                            {format(
                              new Date(note.createdAt),
                              "MMM d, yyyy 'at' h:mm a"
                            )}
                          </span>
                        <span>{note.priority}</span>
                      </div>
                    </div>

                    {!isClientView && (
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingNote(note);
                            setShowAllNotesModal(false);
                          }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{
                            backgroundColor: "transparent",
                            color: COLORS.TEXT_SECONDARY,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                            e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                          }}
                          title="Edit note"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            togglePinNoteMutation.mutate({ noteId: note.id })
                          }
                          disabled={togglePinNoteMutation.isPending}
                          className="p-1.5 rounded-lg transition-all"
                          style={{
                            backgroundColor: note.isPinned
                              ? getGoldenAccent(0.1)
                              : "transparent",
                            color: note.isPinned
                              ? COLORS.GOLDEN_ACCENT
                              : COLORS.TEXT_SECONDARY,
                          }}
                          onMouseEnter={e => {
                            if (!note.isPinned) {
                              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                              e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                            }
                          }}
                          onMouseLeave={e => {
                            if (!note.isPinned) {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                            }
                          }}
                          title={note.isPinned ? "Unpin note" : "Pin note"}
                        >
                          {note.isPinned ? (
                            <Pin
                              className="w-3.5 h-3.5"
                              style={{ color: COLORS.GOLDEN_ACCENT }}
                              fill={COLORS.GOLDEN_ACCENT}
                            />
                          ) : (
                            <PinOff
                              className="w-3.5 h-3.5"
                            />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{
                            backgroundColor: "transparent",
                            color: COLORS.TEXT_SECONDARY,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = getRedAlert(0.1);
                            e.currentTarget.style.color = COLORS.RED_ALERT;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Note Content */}
                  <div className="mb-3">
                    <p
                      className="whitespace-pre-wrap text-sm"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {note.content}
                    </p>
                  </div>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {note.tags.map(tag => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            backgroundColor: tag.color + "20",
                            color: tag.color,
                            border: `1px solid ${tag.color}40`,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Attachments */}
                  {note.attachments && note.attachments.length > 0 && (
                    <div className="space-y-2 pt-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <h4
                        className="text-xs font-medium mb-2"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        Attachments ({note.attachments.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {note.attachments.map(attachment => (
                          <div
                            key={attachment.id}
                            className="p-2 rounded-lg border"
                            style={{
                              backgroundColor: COLORS.BACKGROUND_CARD_HOVER,
                              borderColor: COLORS.BORDER_SUBTLE,
                            }}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              {attachment.fileType.startsWith("image/") ? (
                                <Image
                                  className="w-3 h-3"
                                  style={{ color: COLORS.TEXT_MUTED }}
                                />
                              ) : attachment.fileType.startsWith("video/") ? (
                                <Video
                                  className="w-3 h-3"
                                  style={{ color: COLORS.TEXT_MUTED }}
                                />
                              ) : (
                                <FileText
                                  className="w-3 h-3"
                                  style={{ color: COLORS.TEXT_MUTED }}
                                />
                              )}
                              <span
                                className="text-[10px] font-medium truncate"
                                style={{ color: COLORS.TEXT_PRIMARY }}
                              >
                                {attachment.fileName}
                              </span>
                            </div>
                            <p className="text-[10px] mb-1" style={{ color: COLORS.TEXT_MUTED }}>
                              {(attachment.fileSize / 1024 / 1024).toFixed(1)}{" "}
                              MB
                            </p>
                            <a
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] transition-colors"
                              style={{ color: COLORS.GOLDEN_ACCENT }}
                              onMouseEnter={e => {
                                e.currentTarget.style.color = COLORS.GOLDEN_HOVER;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                              }}
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
