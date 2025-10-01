"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { X, Upload, Video, HelpCircle, ExternalLink } from "lucide-react";

// Default categories that are always available
const DEFAULT_CATEGORIES = [
  "Conditioning",
  "Drive",
  "Whip",
  "Separation",
  "Stability",
  "Extension",
];

interface OnFormImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OnFormImportModal({
  isOpen,
  onClose,
  onSuccess,
}: OnFormImportModalProps) {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const utils = trpc.useUtils();

  // Fetch existing categories
  const { data: categoriesData = [] } =
    trpc.libraryResources.getCategories.useQuery();

  const importOnFormVideo = trpc.library.importOnFormVideo.useMutation({
    onSuccess: () => {
      console.log("🎉 OnForm import successful, invalidating cache...");
      utils.library.list.invalidate();
      utils.library.getStats.invalidate();
      onSuccess();
      onClose();
      setUrl("");
      setCategory("");
      setTitle("");
      setDescription("");
    },
    onError: error => {
      console.error("OnForm import error:", error);
      alert(`Import failed: ${error.message}`);
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

    importOnFormVideo.mutate({
      url,
      category: finalCategory,
      customTitle: title || undefined,
      customDescription: description || undefined,
    });
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
            <Video className="h-5 w-5" style={{ color: "#F59E0B" }} />
            Import from OnForm
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
          {/* URL Input */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#ABA4AA" }}
            >
              OnForm Video URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://onform.net/video/12345 or https://onform.net/embed/12345"
              required
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            />

            {/* Need Help Button with Hover Popup */}
            <div className="relative mt-2">
              <button
                type="button"
                onMouseEnter={() => setShowHelp(true)}
                onMouseLeave={() => setShowHelp(false)}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 transform hover:scale-105 border"
                style={{
                  color: showHelp ? "#FFFFFF" : "#ABA4AA",
                  backgroundColor: showHelp ? "#F59E0B" : "transparent",
                  borderColor: showHelp ? "#F59E0B" : "#606364",
                  boxShadow: showHelp
                    ? "0 0 12px rgba(245, 158, 11, 0.4)"
                    : "none",
                }}
              >
                <HelpCircle
                  className={`h-4 w-4 transition-transform duration-300 ${
                    showHelp ? "rotate-12 animate-pulse" : ""
                  }`}
                />
                <span className="font-medium">Need help?</span>
              </button>

              {/* Help Popup on Hover */}
              {showHelp && (
                <div
                  className="absolute left-0 top-full mt-2 p-4 rounded-xl border-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#F59E0B",
                    width: "420px",
                    boxShadow: "0 0 20px rgba(245, 158, 11, 0.3)",
                  }}
                  onMouseEnter={() => setShowHelp(true)}
                  onMouseLeave={() => setShowHelp(false)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#F59E0B" }}
                    >
                      <HelpCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-semibold mb-2 text-base"
                        style={{ color: "#F59E0B" }}
                      >
                        How to Import OnForm Videos
                      </h3>
                      <div
                        className="space-y-2 text-sm"
                        style={{ color: "#C3BCC2" }}
                      >
                        <p className="font-medium">📋 Step-by-Step:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Open your OnForm video</li>
                          <li>Click the "Share" button</li>
                          <li>
                            Set permissions to{" "}
                            <span
                              className="font-semibold"
                              style={{ color: "#F59E0B" }}
                            >
                              "Anyone with link can view"
                            </span>
                          </li>
                          <li>Copy the video link</li>
                          <li>Paste it above and submit</li>
                        </ol>

                        <div
                          className="mt-3 p-3 rounded-lg"
                          style={{ backgroundColor: "#353A3A" }}
                        >
                          <p
                            className="font-medium mb-1"
                            style={{ color: "#F59E0B" }}
                          >
                            ⚠️ Important:
                          </p>
                          <p style={{ color: "#ABA4AA" }}>
                            If the video is private, your clients won't be able
                            to view it. Make sure to set proper sharing
                            permissions in OnForm.
                          </p>
                        </div>

                        <p
                          className="text-xs mt-2"
                          style={{ color: "#ABA4AA" }}
                        >
                          💡 Tip: Both regular and embed URLs work
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
              <>
                <select
                  value={category}
                  onChange={e => {
                    if (e.target.value === "__custom__") {
                      setShowCustomInput(true);
                      setCategory("");
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
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
                    Select a category
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

                  {/* Create Custom Option */}
                  <option
                    value="__custom__"
                    style={{
                      backgroundColor: "#3B82F6",
                      color: "#FFFFFF",
                      fontWeight: "bold",
                    }}
                  >
                    ➕ Create New Category
                  </option>
                </select>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="Enter new category name"
                  required
                  maxLength={50}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "#606364",
                    borderColor: "#ABA4AA",
                    color: "#C3BCC2",
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomCategory("");
                  }}
                  className="text-sm px-3 py-1 rounded transition-all"
                  style={{
                    color: "#ABA4AA",
                    textDecoration: "underline",
                  }}
                >
                  ← Back to categories
                </button>
              </div>
            )}
          </div>

          {/* Optional: Custom Title */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#ABA4AA" }}
            >
              Custom Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Leave empty to use default title"
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            />
          </div>

          {/* Optional: Custom Description */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#ABA4AA" }}
            >
              Custom Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add notes or training instructions"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border resize-none"
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            />
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
              disabled={importOnFormVideo.isPending}
              className="flex-1 px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              style={{
                backgroundColor: "#F59E0B",
                color: "#FFFFFF",
              }}
              onMouseEnter={e => {
                if (!importOnFormVideo.isPending) {
                  e.currentTarget.style.backgroundColor = "#D97706";
                }
              }}
              onMouseLeave={e => {
                if (!importOnFormVideo.isPending) {
                  e.currentTarget.style.backgroundColor = "#F59E0B";
                }
              }}
            >
              {importOnFormVideo.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-black" />
                  <span className="text-black">Import from OnForm</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
