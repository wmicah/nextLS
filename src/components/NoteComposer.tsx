"use client";

import React, { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  X,
  Send,
  Loader2,
  Paperclip,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import {
  COLORS,
  getGoldenAccent,
  getRedAlert,
} from "@/lib/colors";

interface NoteComposerProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
  editingNote?: {
    id: string;
    title: string | null;
    content: string;
    type: string;
    priority: string;
    isPrivate: boolean;
    tags: Array<{ id: string; name: string }>;
    attachments?: Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }>;
  } | null;
}

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export default function NoteComposer({
  isOpen,
  onClose,
  clientId,
  clientName,
  onSuccess,
  editingNote = null,
}: NoteComposerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<
    | "GENERAL"
    | "PROGRESS"
    | "FEEDBACK"
    | "GOAL"
    | "INJURY"
    | "TECHNIQUE"
    | "MOTIVATION"
    | "SCHEDULE"
  >("GENERAL");
  const [priority, setPriority] = useState<
    "LOW" | "NORMAL" | "HIGH" | "URGENT"
  >("NORMAL");
  const [isPrivate, setIsPrivate] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initialize form when editingNote changes
  React.useEffect(() => {
    if (editingNote && isOpen) {
      setTitle(editingNote.title || "");
      setContent(editingNote.content);
      setType(editingNote.type as any);
      setPriority(editingNote.priority as any);
      setIsPrivate(editingNote.isPrivate);
      setAttachments([]); // Attachments are read-only for now
    } else if (!editingNote && isOpen) {
      // Reset form for new note
      setTitle("");
      setContent("");
      setType("GENERAL");
      setPriority("NORMAL");
      setIsPrivate(false);
      setAttachments([]);
    }
  }, [editingNote, isOpen]);

  const createNoteMutation = trpc.notes.createNote.useMutation({
    onSuccess: async newNote => {
      // Handle attachments after note creation, before closing
      if (attachments.length > 0) {
        try {
          // Add attachments to the newly created note
          for (const attachment of attachments) {
            try {
              await addAttachmentMutation.mutateAsync({
                noteId: newNote.id,
                fileName: attachment.fileName,
                fileUrl: attachment.fileUrl,
                fileType: attachment.fileType,
                fileSize: attachment.fileSize,
              });
            } catch (error) {
              console.error("Failed to add attachment:", error);
            }
          }
        } catch (error) {
          console.error("Error adding attachments:", error);
        }
      }

      onSuccess?.();
      onClose();
      // Reset form
      setTitle("");
      setContent("");
      setType("GENERAL");
      setPriority("NORMAL");
      setIsPrivate(false);
      setAttachments([]);
    },
  });

  const updateNoteMutation = trpc.notes.updateNote.useMutation({
    onSuccess: () => {
      onSuccess?.();
      onClose();
      // Reset form
      setTitle("");
      setContent("");
      setType("GENERAL");
      setPriority("NORMAL");
      setIsPrivate(false);
      setAttachments([]);
    },
  });

  const addAttachmentMutation = trpc.notes.addAttachment.useMutation();

  const handleFileUploadComplete = (res: any) => {
    if (res && res.length > 0) {
      res.forEach((file: any) => {
        // Validate file type
        const isValidType =
          file.type?.startsWith("image/") ||
          file.type?.startsWith("video/") ||
          file.type === "application/pdf";

        if (!isValidType) {
          alert(
            `File ${file.name} is not a supported type (images, videos, or PDFs only)`
          );
          return;
        }

        // Add to attachments
        const attachment: Attachment = {
          id: `upload-${Date.now()}-${Math.random()}`,
          fileName: file.name,
          fileUrl: file.url,
          fileType: file.type || "application/pdf",
          fileSize: file.size,
        };

        setAttachments(prev => [...prev, attachment]);
      });

      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUploadError = (error: Error) => {
    console.error("Upload error:", error);
    alert(`Failed to upload files: ${error.message}`);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("Please enter note content");
      return;
    }

    try {
      let noteId: string;

      if (editingNote) {
        // Update existing note
        const updatedNote = await updateNoteMutation.mutateAsync({
          noteId: editingNote.id,
          title: title.trim() || undefined,
          content: content.trim(),
          type,
          priority,
          isPrivate,
        });
        noteId = updatedNote.id;

        // Handle attachments when editing (add new ones)
        if (attachments.length > 0) {
          for (const attachment of attachments) {
            try {
              await addAttachmentMutation.mutateAsync({
                noteId,
                fileName: attachment.fileName,
                fileUrl: attachment.fileUrl,
                fileType: attachment.fileType,
                fileSize: attachment.fileSize,
              });
            } catch (error) {
              console.error("Failed to add attachment:", error);
            }
          }
        }
      } else {
        // Create new note - attachments will be handled in onSuccess
        await createNoteMutation.mutateAsync({
          clientId,
          title: title.trim() || undefined,
          content: content.trim(),
          type,
          priority,
          isPrivate,
        });
        // Don't close here - let onSuccess handle it after attachments are added
        return;
      }
    } catch (error) {
      console.error(
        `Error ${editingNote ? "updating" : "creating"} note:`,
        error
      );
    }
  };

  const getTypeIcon = (noteType: string) => {
    switch (noteType) {
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


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          border: `1px solid ${COLORS.BORDER_SUBTLE}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b flex-shrink-0"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {editingNote ? "Edit Note" : `Send Note to ${clientName}`}
            </h2>
            <p className="text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
              {editingNote
                ? `Last updated: ${format(
                    new Date(),
                    "MMM d, yyyy 'at' h:mm a"
                  )}`
                : format(new Date(), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <button
            onClick={onClose}
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
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
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

            {/* Note Type and Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Type
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
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
                  <option 
                    value="GENERAL"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    General
                  </option>
                  <option 
                    value="PROGRESS"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    Progress
                  </option>
                  <option 
                    value="FEEDBACK"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    Feedback
                  </option>
                  <option 
                    value="GOAL"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    Goal
                  </option>
                  <option 
                    value="INJURY"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    Injury
                  </option>
                  <option 
                    value="TECHNIQUE"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    Technique
                  </option>
                  <option 
                    value="MOTIVATION"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    Motivation
                  </option>
                  <option 
                    value="SCHEDULE"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    Schedule
                  </option>
                </select>
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
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
                  <option 
                    value="LOW"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    Low
                  </option>
                  <option 
                    value="NORMAL"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    Normal
                  </option>
                  <option 
                    value="HIGH"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    High
                  </option>
                  <option 
                    value="URGENT"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    Urgent
                  </option>
                </select>
              </div>
            </div>

            {/* Content */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Content *
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your note here..."
                rows={6}
                className="w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none resize-none"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
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

            {/* Attachments */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Attachments
              </label>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UploadButton<OurFileRouter, "noteAttachmentUploader">
                    endpoint="noteAttachmentUploader"
                    onBeforeUploadBegin={files => {
                      setIsUploading(true);
                      setUploadProgress(0);
                      return files;
                    }}
                    onUploadProgress={(progress: number) => {
                      setUploadProgress(progress);
                    }}
                    onClientUploadComplete={handleFileUploadComplete}
                    onUploadError={handleFileUploadError}
                    content={{
                      button: ({ ready }) => (
                        <div
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-dashed text-xs transition-all duration-200 ${
                            !ready || isUploading ? "opacity-50" : ""
                          }`}
                          style={{
                            borderColor: COLORS.BORDER_SUBTLE,
                            color: COLORS.TEXT_SECONDARY,
                            backgroundColor: COLORS.BACKGROUND_CARD,
                          }}
                          onMouseEnter={e => {
                            if (ready && !isUploading) {
                              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                            }
                          }}
                          onMouseLeave={e => {
                            if (ready && !isUploading) {
                              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                            }
                          }}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Uploading... {uploadProgress}%</span>
                            </>
                          ) : (
                            <>
                              <Paperclip className="w-3 h-3" />
                              <span>Add Files</span>
                            </>
                          )}
                        </div>
                      ),
                      allowedContent: "Max 50MB",
                    }}
                  />
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-1.5">
                    {attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2 rounded-lg"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_CARD_HOVER,
                          border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-medium truncate"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            {attachment.fileName}
                          </p>
                          <p className="text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
                            {(attachment.fileSize / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="p-1 rounded transition-colors ml-2 flex-shrink-0"
                          style={{ color: COLORS.TEXT_SECONDARY }}
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
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Setting */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={e => setIsPrivate(e.target.checked)}
                className="w-3.5 h-3.5 rounded"
                style={{
                  accentColor: COLORS.GOLDEN_ACCENT,
                }}
              />
              <label
                htmlFor="isPrivate"
                className="text-xs"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Private note
              </label>
            </div>
          </div>
        </div>

        {/* Footer - Always Visible */}
        <div
          className="flex items-center justify-end gap-2 p-4 border-t flex-shrink-0"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              color: COLORS.TEXT_SECONDARY,
              border: `1px solid ${COLORS.BORDER_SUBTLE}`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              (editingNote
                ? updateNoteMutation.isPending
                : createNoteMutation.isPending) || !content.trim()
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: COLORS.GOLDEN_DARK,
              color: COLORS.TEXT_PRIMARY,
            }}
            onMouseEnter={e => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
              }
            }}
          >
            {(
              editingNote
                ? updateNoteMutation.isPending
                : createNoteMutation.isPending
            ) ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {editingNote
              ? updateNoteMutation.isPending
                ? "Saving..."
                : "Save"
              : createNoteMutation.isPending
              ? "Sending..."
              : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
