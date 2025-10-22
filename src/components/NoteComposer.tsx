"use client";

import { useState, useRef } from "react";
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

interface NoteComposerProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
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
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createNoteMutation = trpc.notes.createNote.useMutation({
    onSuccess: () => {
      onSuccess?.();
      onClose();
      // Reset form
      setTitle("");
      setContent("");
      setType("GENERAL");
      setPriority("NORMAL");
      setIsPrivate(false);
      setTags([]);
      setAttachments([]);
    },
  });

  const addAttachmentMutation = trpc.notes.addAttachment.useMutation();

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type and size
        if (
          !file.type.startsWith("image/") &&
          !file.type.startsWith("video/")
        ) {
          alert("Only images and videos are allowed");
          continue;
        }

        if (file.size > 50 * 1024 * 1024) {
          // 50MB limit
          alert("File size must be less than 50MB");
          continue;
        }

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        // In a real app, you'd upload to your file storage service
        // For now, we'll create a mock URL
        const mockFileUrl = URL.createObjectURL(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Add to attachments
        const attachment: Attachment = {
          id: `temp-${Date.now()}-${i}`,
          fileName: file.name,
          fileUrl: mockFileUrl,
          fileType: file.type,
          fileSize: file.size,
        };

        setAttachments(prev => [...prev, attachment]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload files");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("Please enter note content");
      return;
    }

    try {
      await createNoteMutation.mutateAsync({
        clientId,
        title: title.trim() || undefined,
        content: content.trim(),
        type,
        priority,
        isPrivate,
        tags: tags.length > 0 ? tags : undefined,
      });

      // Handle attachments after note creation
      if (attachments.length > 0) {
        // In a real app, you'd upload files to your storage service
        // and then add them to the note
        console.log("Attachments to upload:", attachments);
      }
    } catch (error) {
      console.error("Error creating note:", error);
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: "#1E1E1E" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "#2a2a2a" }}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" style={{ color: "#4A5A70" }} />
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#ffffff" }}>
                Send Note to {clientName}
              </h2>
              <p className="text-sm" style={{ color: "#9ca3af" }}>
                {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
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

            {/* Title */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter a title for this note..."
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                }}
              />
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

            {/* Tags */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Tags (Optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && addTag()}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: "#4A5A70",
                    color: "#FFFFFF",
                  }}
                >
                  <Tag className="w-4 h-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: "#4A5A70",
                        color: "#FFFFFF",
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Attachments (Images & Videos)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={e =>
                  e.target.files && handleFileUpload(e.target.files)
                }
                className="hidden"
              />

              <div className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-all duration-200 hover:scale-105 disabled:opacity-50"
                  style={{
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                  {isUploading
                    ? `Uploading... ${uploadProgress}%`
                    : "Add Images or Videos"}
                </button>

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
                          ) : (
                            <Video
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

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 p-6 border-t"
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
            disabled={createNoteMutation.isPending || !content.trim()}
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#4A5A70",
              color: "#FFFFFF",
            }}
          >
            {createNoteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {createNoteMutation.isPending ? "Sending..." : "Send Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
