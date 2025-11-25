"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { X, Upload, Youtube, Video, Plus, ChevronLeft } from "lucide-react";
import {
  isYouTubeUrl,
  isYouTubeShortsUrl,
  convertShortsToWatchUrl,
} from "@/lib/youtube-utils";
import { COLORS } from "@/lib/colors";

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
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}>
      <div
        className="rounded-lg p-4 w-full max-w-lg shadow-lg border"
        style={{ backgroundColor: COLORS.BACKGROUND_DARK, borderColor: COLORS.BORDER_SUBTLE }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            <Youtube className="h-4 w-4" style={{ color: COLORS.RED_ALERT }} />
            Import from YouTube
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md transition-all duration-200"
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
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Import Type */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Import Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  value="single"
                  checked={importType === "single"}
                  onChange={e =>
                    setImportType(e.target.value as "single" | "playlist")
                  }
                  style={{ accentColor: COLORS.GOLDEN_ACCENT }}
                />
                <span className="text-xs" style={{ color: COLORS.TEXT_PRIMARY }}>Single Video</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  value="playlist"
                  checked={importType === "playlist"}
                  onChange={e =>
                    setImportType(e.target.value as "single" | "playlist")
                  }
                  style={{ accentColor: COLORS.GOLDEN_ACCENT }}
                />
                <span className="text-xs" style={{ color: COLORS.TEXT_PRIMARY }}>Entire Playlist</span>
              </label>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: COLORS.TEXT_SECONDARY }}
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
              className="w-full px-2.5 py-1.5 rounded-md border text-xs focus:outline-none transition-all duration-200"
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
            />
            <p className="text-[10px] mt-1" style={{ color: COLORS.TEXT_MUTED }}>
              Supports: youtube.com/watch, youtu.be, youtube.com/shorts, and
              playlists
            </p>
          </div>

          {/* Custom Name */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Custom Name (Optional)
            </label>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Enter a custom name for this video..."
              className="w-full px-2.5 py-1.5 rounded-md border text-xs focus:outline-none transition-all duration-200"
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
            />
            <p className="text-[10px] mt-1" style={{ color: COLORS.TEXT_MUTED }}>
              Leave empty to use the original YouTube title
            </p>
          </div>

          {/* Category */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Category *
            </label>

            {!showCustomInput ? (
              <div className="space-y-1.5">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required={!showCustomInput}
                  className="w-full px-2.5 py-1.5 rounded-md border text-xs focus:outline-none transition-all duration-200"
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
                  <option
                    value=""
                    style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_SECONDARY }}
                  >
                    Select category...
                  </option>

                  {/* Standard Categories */}
                  <optgroup
                    label="Standard Categories"
                    style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}
                  >
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option
                        key={cat}
                        value={cat}
                        style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}
                      >
                        {cat}
                      </option>
                    ))}
                  </optgroup>

                  {/* User's Custom Categories */}
                  {categoriesData.filter(
                    cat => !DEFAULT_CATEGORIES.includes(cat.name)
                  ).length > 0 && (
                    <optgroup
                      label="Your Categories"
                      style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}
                    >
                      {categoriesData
                        .filter(cat => !DEFAULT_CATEGORIES.includes(cat.name))
                        .map(cat => (
                          <option
                            key={cat.name}
                            value={cat.name}
                            style={{
                              backgroundColor: COLORS.BACKGROUND_DARK,
                              color: COLORS.TEXT_PRIMARY,
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
                  className="w-full px-2.5 py-1.5 rounded-md border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-1.5 font-medium text-xs"
                  style={{
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_SECONDARY,
                    backgroundColor: COLORS.BACKGROUND_CARD,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Or create a new category
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="Enter new category name (e.g., Pitching Mechanics)"
                  required
                  maxLength={50}
                  className="w-full px-2.5 py-1.5 rounded-md border-2 text-xs focus:outline-none transition-all duration-200"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.GOLDEN_ACCENT,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomCategory("");
                  }}
                  className="text-xs px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5"
                  style={{
                    color: COLORS.TEXT_SECONDARY,
                    backgroundColor: COLORS.BACKGROUND_DARK,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                  }}
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back to categories
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-md border transition-all duration-200 text-xs font-medium"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_SECONDARY,
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
              type="submit"
              disabled={importVideo.isPending || importPlaylist.isPending}
              className="flex-1 px-3 py-2 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 text-xs font-medium disabled:opacity-50"
              style={{
                backgroundColor: COLORS.RED_ALERT,
                color: "#FFFFFF",
              }}
              onMouseEnter={e => {
                if (!importVideo.isPending && !importPlaylist.isPending) {
                  e.currentTarget.style.backgroundColor = COLORS.RED_DARK;
                }
              }}
              onMouseLeave={e => {
                if (!importVideo.isPending && !importPlaylist.isPending) {
                  e.currentTarget.style.backgroundColor = COLORS.RED_ALERT;
                }
              }}
            >
              {importVideo.isPending || importPlaylist.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
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
