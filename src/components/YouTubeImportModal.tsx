"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { X, Upload, Youtube, Video, Plus, ChevronLeft } from "lucide-react";
import {
  isYouTubeUrl,
  isYouTubeShortsUrl,
  convertShortsToWatchUrl,
} from "@/lib/youtube-utils";

// Default categories that are always available
const DEFAULT_CATEGORIES = [
  "Conditioning",
  "Drive",
  "Whip",
  "Separation",
  "Stability",
  "Extension",
];

interface YouTubeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function YouTubeImportModal({
  isOpen,
  onClose,
  onSuccess,
}: YouTubeImportModalProps) {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [importType, setImportType] = useState<"single" | "playlist">("single");
  const [customName, setCustomName] = useState("");

  const utils = trpc.useUtils();

  // Fetch existing categories
  const { data: categoriesData = [] } =
    trpc.libraryResources.getCategories.useQuery();

  const importVideo = trpc.library.importYouTubeVideo.useMutation({
    onSuccess: () => {
      utils.library.list.invalidate();
      utils.library.getStats.invalidate();
      onSuccess();
      onClose();
      setUrl("");
      setCategory("");
      setCustomName("");
    },
  });

  const importPlaylist = trpc.library.importYouTubePlaylist.useMutation({
    onSuccess: () => {
      utils.library.list.invalidate();
      utils.library.getStats.invalidate();
      onSuccess();
      onClose();
      setUrl("");
      setCategory("");
      setCustomName("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use custom category if provided, otherwise use selected category
    const finalCategory = showCustomInput ? customCategory.trim() : category;

    if (!finalCategory) {
      alert("Please select or enter a category");
      return;
    }

    // Validate and convert YouTube URLs
    let processedUrl = url.trim();

    // Check if it's a valid YouTube URL
    if (!isYouTubeUrl(processedUrl)) {
      alert(
        "Please enter a valid YouTube URL (supports regular videos, Shorts, and playlists)"
      );
      return;
    }

    // Convert YouTube Shorts to regular watch URL for better compatibility
    if (isYouTubeShortsUrl(processedUrl)) {
      const convertedUrl = convertShortsToWatchUrl(processedUrl);
      if (convertedUrl) {
        processedUrl = convertedUrl;
      }
    }

    if (importType === "single") {
      importVideo.mutate({
        url: processedUrl,
        category: finalCategory,
        customTitle: customName.trim() || undefined,
      });
    } else {
      importPlaylist.mutate({
        playlistUrl: processedUrl,
        category: finalCategory,
        customName: customName.trim() || undefined,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="rounded-lg p-6 w-full max-w-lg shadow-lg border"
        style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: "#C3BCC2" }}
          >
            <Youtube className="h-5 w-5 text-red-500" />
            Import from YouTube
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-300"
            style={{ color: "#ABA4AA" }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Import Type */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#ABA4AA" }}
            >
              Import Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="single"
                  checked={importType === "single"}
                  onChange={e =>
                    setImportType(e.target.value as "single" | "playlist")
                  }
                  className="text-blue-500"
                />
                <span style={{ color: "#C3BCC2" }}>Single Video</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="playlist"
                  checked={importType === "playlist"}
                  onChange={e =>
                    setImportType(e.target.value as "single" | "playlist")
                  }
                  className="text-blue-500"
                />
                <span style={{ color: "#C3BCC2" }}>Entire Playlist</span>
              </label>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#ABA4AA" }}
            >
              YouTube {importType === "single" ? "Video" : "Playlist"} URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={`Paste YouTube ${
                importType === "single"
                  ? "video (including Shorts)"
                  : "playlist"
              } URL here...`}
              required
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            />
            <p className="text-xs mt-1" style={{ color: "#ABA4AA" }}>
              Supports: youtube.com/watch, youtu.be, youtube.com/shorts, and
              playlists
            </p>
          </div>

          {/* Custom Name */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#ABA4AA" }}
            >
              Custom Name (Optional)
            </label>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Enter a custom name for this video..."
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            />
            <p className="text-xs mt-1" style={{ color: "#ABA4AA" }}>
              Leave empty to use the original YouTube title
            </p>
          </div>

          {/* Category */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#ABA4AA" }}
            >
              Category *
            </label>

            {!showCustomInput ? (
              <div className="space-y-2">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required={!showCustomInput}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "#606364",
                    borderColor: "#ABA4AA",
                    color: "#C3BCC2",
                  }}
                >
                  <option
                    value=""
                    style={{ backgroundColor: "#353A3A", color: "#C3BCC2" }}
                  >
                    Select category...
                  </option>

                  {/* Standard Categories */}
                  <optgroup
                    label="Standard Categories"
                    style={{ backgroundColor: "#353A3A", color: "#C3BCC2" }}
                  >
                    <option
                      value="Conditioning"
                      style={{ backgroundColor: "#353A3A", color: "#C3BCC2" }}
                    >
                      Conditioning
                    </option>
                    <option
                      value="Drive"
                      style={{ backgroundColor: "#353A3A", color: "#C3BCC2" }}
                    >
                      Drive
                    </option>
                    <option
                      value="Whip"
                      style={{ backgroundColor: "#353A3A", color: "#C3BCC2" }}
                    >
                      Whip
                    </option>
                    <option
                      value="Separation"
                      style={{ backgroundColor: "#353A3A", color: "#C3BCC2" }}
                    >
                      Separation
                    </option>
                    <option
                      value="Stability"
                      style={{ backgroundColor: "#353A3A", color: "#C3BCC2" }}
                    >
                      Stability
                    </option>
                    <option
                      value="Extension"
                      style={{ backgroundColor: "#353A3A", color: "#C3BCC2" }}
                    >
                      Extension
                    </option>
                  </optgroup>

                  {/* User's Custom Categories */}
                  {categoriesData.filter(
                    cat => !DEFAULT_CATEGORIES.includes(cat.name)
                  ).length > 0 && (
                    <optgroup
                      label="Your Categories"
                      style={{ backgroundColor: "#353A3A", color: "#C3BCC2" }}
                    >
                      {categoriesData
                        .filter(cat => !DEFAULT_CATEGORIES.includes(cat.name))
                        .map(cat => (
                          <option
                            key={cat.name}
                            value={cat.name}
                            style={{
                              backgroundColor: "#353A3A",
                              color: "#C3BCC2",
                            }}
                          >
                            {cat.name} ({cat.count})
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>

                {/* Or Create New Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(true);
                    setCategory("");
                  }}
                  className="w-full p-3 rounded-lg border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm"
                  style={{
                    borderColor: "#606364",
                    color: "#ABA4AA",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#C3BCC2";
                    e.currentTarget.style.color = "#C3BCC2";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#606364";
                    e.currentTarget.style.color = "#ABA4AA";
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Or create a new category
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="Enter new category name (e.g., Pitching Mechanics)"
                  required
                  maxLength={50}
                  className="w-full p-3 rounded-lg border-2 focus:outline-none transition-all duration-200"
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#C3BCC2",
                    color: "#C3BCC2",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#DC2626";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "#C3BCC2";
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomCategory("");
                  }}
                  className="text-sm px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                  style={{
                    color: "#ABA4AA",
                    backgroundColor: "#2A3133",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = "#C3BCC2";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = "#ABA4AA";
                  }}
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back to categories
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border transition-all duration-300"
              style={{
                backgroundColor: "transparent",
                borderColor: "#606364",
                color: "#ABA4AA",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importVideo.isPending || importPlaylist.isPending}
              className="flex-1 px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              style={{
                backgroundColor: "#DC2626",
                color: "#FFFFFF",
              }}
            >
              {importVideo.isPending || importPlaylist.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import {importType === "single" ? "Video" : "Playlist"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
