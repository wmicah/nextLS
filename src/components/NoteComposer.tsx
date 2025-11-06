"use client";

import React, { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  X,
  Send,
  Image,
  Video,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle,
  Loader2,
  Paperclip,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

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
      setContent(editingNote.content);
      setType(editingNote.type as any);
      setPriority(editingNote.priority as any);
      setIsPrivate(editingNote.isPrivate);
      setAttachments([]); // Attachments are read-only for now
    } else if (!editingNote && isOpen) {
      // Reset form for new note
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        style={{ backgroundColor: "#1E1E1E" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b flex-shrink-0"
          style={{ borderColor: "#2a2a2a" }}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" style={{ color: "#4A5A70" }} />
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#ffffff" }}>
                {editingNote ? "Edit Note" : `Send Note to ${clientName}`}
              </h2>
              <p className="text-sm" style={{ color: "#9ca3af" }}>
                {editingNote
                  ? `Last updated: ${format(
                      new Date(),
                      "MMM d, yyyy 'at' h:mm a"
                    )}`
                  : format(new Date(), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6" style={{ color: "#9ca3af" }} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Note Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#C3BCC2" }}
                >
                  Note Type
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                >
                  <option value="GENERAL">General</option>
                  <option value="PROGRESS">Progress</option>
                  <option value="FEEDBACK">Feedback</option>
                  <option value="GOAL">Goal</option>
                  <option value="INJURY">Injury</option>
                  <option value="TECHNIQUE">Technique</option>
                  <option value="MOTIVATION">Motivation</option>
                  <option value="SCHEDULE">Schedule</option>
                </select>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#C3BCC2" }}
                >
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                >
                  <option value="LOW">🟢 Low</option>
                  <option value="NORMAL">🔵 Normal</option>
                  <option value="HIGH">🟡 High</option>
                  <option value="URGENT">🔴 Urgent</option>
                </select>
              </div>
            </div>

            {/* Content */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Note Content *
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your note here..."
                rows={6}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                }}
              />
            </div>

            {/* Attachments */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Attachments (Images, Videos, PDFs)
              </label>

              <div className="space-y-3">
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
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-all duration-200 hover:scale-105 ${
                            !ready || isUploading ? "opacity-50" : ""
                          }`}
                          style={{
                            borderColor: "#606364",
                            color: "#C3BCC2",
                          }}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Uploading... {uploadProgress}%</span>
                            </>
                          ) : (
                            <>
                              <Paperclip className="w-4 h-4" />
                              <span>Add Images, Videos or PDFs</span>
                            </>
                          )}
                        </div>
                      ),
                      allowedContent: "Images, Videos, PDFs (Max 50MB)",
                    }}
                  />
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ backgroundColor: "#2A3133" }}
                      >
                        <div className="flex items-center gap-3">
                          {attachment.fileType.startsWith("image/") ? (
                            <Image
                              className="w-5 h-5"
                              style={{ color: "#4A5A70" }}
                            />
                          ) : attachment.fileType.startsWith("video/") ? (
                            <Video
                              className="w-5 h-5"
                              style={{ color: "#4A5A70" }}
                            />
                          ) : (
                            <FileText
                              className="w-5 h-5"
                              style={{ color: "#4A5A70" }}
                            />
                          )}
                          <div>
                            <p
                              className="text-sm font-medium"
                              style={{ color: "#C3BCC2" }}
                            >
                              {attachment.fileName}
                            </p>
                            <p className="text-xs" style={{ color: "#9ca3af" }}>
                              {(attachment.fileSize / 1024 / 1024).toFixed(1)}{" "}
                              MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="p-1 rounded hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2
                            className="w-4 h-4"
                            style={{ color: "#EF4444" }}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Setting */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={e => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label
                htmlFor="isPrivate"
                className="text-sm"
                style={{ color: "#C3BCC2" }}
              >
                Private note (only visible to you and the client)
              </label>
            </div>
          </div>
        </div>

        {/* Footer - Always Visible */}
        <div
          className="flex items-center justify-end gap-3 p-6 border-t flex-shrink-0"
          style={{ borderColor: "#2a2a2a" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: "#353A3A",
              color: "#C3BCC2",
              borderColor: "#606364",
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
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#4A5A70",
              color: "#FFFFFF",
            }}
          >
            {(
              editingNote
                ? updateNoteMutation.isPending
                : createNoteMutation.isPending
            ) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {editingNote
              ? updateNoteMutation.isPending
                ? "Saving..."
                : "Save Changes"
              : createNoteMutation.isPending
              ? "Sending..."
              : "Send Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
