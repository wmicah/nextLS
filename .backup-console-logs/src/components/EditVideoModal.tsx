"use client";

import { useState, useEffect } from "react";
import { X, Save, Edit3 } from "lucide-react";
import { trpc } from "@/app/_trpc/client";

interface EditVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: {
    id: string;
    title: string;
    description: string;
    category: string;
    type: string;
    isYoutube?: boolean;
    youtubeId?: string;
  };
  onSuccess: () => void;
}

const categories = [
  "Conditioning",
  "Drive",
  "Whip",
  "Separation",
  "Stability",
  "Extension",
];

export default function EditVideoModal({
  isOpen,
  onClose,
  video,
  onSuccess,
}: EditVideoModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();

  // Initialize form with current video data
  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description);
      setCategory(video.category);
    }
  }, [video]);

  const updateMutation = trpc.library.update.useMutation({
    onSuccess: () => {
      utils.library.list.invalidate();
      onSuccess();
      onClose();
      setIsSubmitting(false);
    },
    onError: error => {
      console.error("Update error:", error);
      alert(`Update failed: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !category) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateMutation.mutateAsync({
        id: video.id,
        title: title.trim(),
        description: description.trim(),
        category,
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleClose = () => {
    // Reset form to original values
    setTitle(video.title);
    setDescription(video.description);
    setCategory(video.category);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div
        className="rounded-lg p-6 w-full max-w-lg border max-h-[90vh] overflow-y-auto shadow-lg"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Edit3 className="w-5 h-5" style={{ color: "#C3BCC2" }} />
            </div>
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ color: "#C3BCC2" }}
              >
                Edit {video.isYoutube ? "YouTube Video" : "Video"}
              </h2>
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                Update video information and metadata
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
            style={{ color: "#ABA4AA" }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#606364";
              e.currentTarget.style.color = "#C3BCC2";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#ABA4AA";
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Type Indicator */}
        {video.isYoutube && (
          <div
            className="mb-4 p-3 rounded-lg border"
            style={{
              backgroundColor: "#DC2626",
              borderColor: "#B91C1C",
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span
                className="text-sm font-medium"
                style={{ color: "#FFFFFF" }}
              >
                YouTube Video
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: "#FECACA" }}>
              YouTube ID: {video.youtubeId}
            </p>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#ABA4AA" }}
            >
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter video title..."
              required
              className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-offset-0"
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
                outline: "none",
              }}
              onFocus={e => {
                e.target.style.borderColor = "#4A5A70";
                e.target.style.backgroundColor = "#6B7280";
              }}
              onBlur={e => {
                e.target.style.borderColor = "#ABA4AA";
                e.target.style.backgroundColor = "#606364";
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#ABA4AA" }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter video description..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border transition-all duration-200 resize-none focus:ring-2 focus:ring-offset-0"
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
                outline: "none",
              }}
              onFocus={e => {
                e.target.style.borderColor = "#4A5A70";
                e.target.style.backgroundColor = "#6B7280";
              }}
              onBlur={e => {
                e.target.style.borderColor = "#ABA4AA";
                e.target.style.backgroundColor = "#606364";
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#ABA4AA" }}
            >
              Category *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-offset-0"
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
                outline: "none",
              }}
              onFocus={e => {
                e.target.style.borderColor = "#4A5A70";
                e.target.style.backgroundColor = "#6B7280";
              }}
              onBlur={e => {
                e.target.style.borderColor = "#ABA4AA";
                e.target.style.backgroundColor = "#606364";
              }}
            >
              <option value="">Select category...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 rounded-lg border transition-all duration-300"
              style={{
                backgroundColor: "transparent",
                borderColor: "#606364",
                color: "#ABA4AA",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#606364";
                e.currentTarget.style.color = "#C3BCC2";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#ABA4AA";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#4A5A70",
                color: "#C3BCC2",
              }}
              onMouseEnter={e => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = "#606364";
                }
              }}
              onMouseLeave={e => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = "#4A5A70";
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
