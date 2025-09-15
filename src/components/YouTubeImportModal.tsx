"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { X, Upload, Youtube } from "lucide-react"; // Changed Eye to Youtube

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
  const [importType, setImportType] = useState<"single" | "playlist">("single");

  const utils = trpc.useUtils();

  const importVideo = trpc.library.importYouTubeVideo.useMutation({
    onSuccess: () => {
      console.log("🎉 YouTube import successful, invalidating cache...");
      utils.library.list.invalidate();
      utils.library.getStats.invalidate();
      onSuccess();
      onClose();
      setUrl("");
      setCategory("");
    },
  });

  const importPlaylist = trpc.library.importYouTubePlaylist.useMutation({
    onSuccess: () => {
      console.log("🎉 YouTube playlist import successful, invalidating cache...");
      utils.library.list.invalidate();
      utils.library.getStats.invalidate();
      onSuccess();
      onClose();
      setUrl("");
      setCategory("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (importType === "single") {
      importVideo.mutate({
        url,
        category,
      });
    } else {
      importPlaylist.mutate({
        playlistUrl: url,
        category,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="rounded-lg p-6 w-full max-w-md shadow-lg border"
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
                importType === "single" ? "video" : "playlist"
              } URL here...`}
              required
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#ABA4AA" }}
            >
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            >
              <option value="">Select category...</option>
              <option value="Conditioning">Conditioning</option>
              <option value="Drive">Drive</option>
              <option value="Whip">Whip</option>
              <option value="Separation">Separation</option>
              <option value="Stability">Stability</option>
              <option value="Extension">Extension</option>
            </select>
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
                backgroundColor: "#4A5A70",
                color: "#C3BCC2",
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
