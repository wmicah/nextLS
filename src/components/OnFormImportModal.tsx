"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  X,
  Upload,
  Video,
  HelpCircle,
  ExternalLink,
  Plus,
  ChevronLeft,
} from "lucide-react";

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
  const [importMode, setImportMode] = useState<"single" | "batch">("single");
  const [batchUrls, setBatchUrls] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
  });
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const utils = trpc.useUtils();

  // Check authentication status
  const { data: authData } = trpc.authCallback.useQuery();

  // Fetch existing categories
  const { data: categoriesData = [] } =
    trpc.libraryResources.getCategories.useQuery();

  const importOnFormVideo = trpc.library.importOnFormVideo.useMutation({
    onSuccess: data => {
      console.log("🎉 OnForm import successful:", data);
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
      console.error("❌ OnForm import error:", error);
      console.error("❌ OnForm import error details:", {
        message: error.message,
        code: error.data?.code,
        httpStatus: error.data?.httpStatus,
        stack: (error as any).stack,
      });

      // Check if it's an authentication error
      if (
        error.data?.code === "UNAUTHORIZED" ||
        error.message.includes("UNAUTHORIZED")
      ) {
        alert(
          "You need to log in to import videos. Please refresh the page and try again."
        );
        // Optionally redirect to login
        window.location.href = "/api/auth/login";
      } else {
        alert(`Import failed: ${error.message}`);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication first
    if (!authData?.success || !authData?.user?.id) {
      alert(
        "You need to be logged in to import videos. Please refresh the page and try again."
      );
      return;
    }

    console.log("🚀 OnForm import form submitted with data:", {
      url,
      category,
      customCategory,
      showCustomInput,
      title,
      description,
      importMode,
      authData: {
        success: authData.success,
        userId: authData.user?.id,
        userRole: authData.user?.role,
      },
    });

    // Use custom category if provided, otherwise use selected category
    const finalCategory = showCustomInput ? customCategory.trim() : category;

    if (!finalCategory) {
      alert("Please select or enter a category");
      return;
    }

    if (importMode === "single") {
      // Single video import
      console.log("🚀 Starting single OnForm import with:", {
        url,
        category: finalCategory,
        customTitle: title || undefined,
        customDescription: description || undefined,
      });

      importOnFormVideo.mutate({
        url,
        category: finalCategory,
        customTitle: title || undefined,
        customDescription: description || undefined,
      });
    } else {
      // Batch import
      await handleBatchImport(finalCategory);
    }
  };

  const handleBatchImport = async (finalCategory: string) => {
    // Parse URLs from textarea (one per line)
    const urls = batchUrls
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (urls.length === 0) {
      alert("Please enter at least one OnForm video URL");
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: urls.length });
    setImportErrors([]);

    const errors: string[] = [];

    for (let i = 0; i < urls.length; i++) {
      try {
        setImportProgress({ current: i + 1, total: urls.length });

        await new Promise<void>((resolve, reject) => {
          importOnFormVideo.mutate(
            {
              url: urls[i],
              category: finalCategory,
            },
            {
              onSuccess: () => resolve(),
              onError: error => {
                errors.push(`${urls[i]}: ${error.message}`);
                resolve(); // Continue even if one fails
              },
            }
          );
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        errors.push(`${urls[i]}: ${error.message}`);
      }
    }

    setIsImporting(false);
    setImportErrors(errors);

    // Invalidate cache
    utils.library.list.invalidate();
    utils.library.getStats.invalidate();

    if (errors.length === 0) {
      alert(`Successfully imported ${urls.length} videos!`);
      onSuccess();
      onClose();
      setBatchUrls("");
      setCategory("");
    } else {
      alert(
        `Imported ${urls.length - errors.length} videos successfully.\n${
          errors.length
        } failed (see details below).`
      );
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
          {/* Import Mode Toggle */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#C3BCC2" }}
            >
              Import Type
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="single"
                  checked={importMode === "single"}
                  onChange={e =>
                    setImportMode(e.target.value as "single" | "batch")
                  }
                  className="text-orange-500"
                  disabled={isImporting}
                />
                <span style={{ color: "#C3BCC2" }}>Single Video</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="batch"
                  checked={importMode === "batch"}
                  onChange={e =>
                    setImportMode(e.target.value as "single" | "batch")
                  }
                  className="text-orange-500"
                  disabled={isImporting}
                />
                <span style={{ color: "#C3BCC2" }}>
                  Batch Import (Multiple Videos)
                </span>
              </label>
            </div>
          </div>

          {/* URL Input - Single or Batch */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "#ABA4AA" }}
            >
              {importMode === "single"
                ? "OnForm Video URL *"
                : "OnForm Video URLs *"}
            </label>

            {importMode === "single" ? (
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://onform.net/video/12345 or https://link.getonform.com/view?id=BEuFtDTZaoCrP7fCpeV9"
                required
                disabled={isImporting}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: "#606364",
                  borderColor: "#ABA4AA",
                  color: "#C3BCC2",
                }}
              />
            ) : (
              <>
                <textarea
                  value={batchUrls}
                  onChange={e => setBatchUrls(e.target.value)}
                  placeholder={[
                    "Paste OnForm video URLs here (one per line)",
                    "https://onform.net/video/12345",
                    "https://link.getonform.com/view?id=BEuFtDTZaoCrP7fCpeV9",
                    "https://link.getonform.com/view?id=67890",
                    "...and so on",
                  ].join("\n")}
                  required
                  disabled={isImporting}
                  rows={8}
                  className="w-full px-3 py-2 rounded-lg border resize-none font-mono text-xs"
                  style={{
                    backgroundColor: "#606364",
                    borderColor: "#ABA4AA",
                    color: "#C3BCC2",
                  }}
                />
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                  {batchUrls.split("\n").filter(line => line.trim()).length}{" "}
                  URLs entered
                </p>
              </>
            )}

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
              <div className="space-y-2">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required={!showCustomInput}
                  disabled={isImporting}
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
                </select>

                {/* Or Create New Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(true);
                    setCategory("");
                  }}
                  disabled={isImporting}
                  className="w-full p-3 rounded-lg border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm disabled:opacity-50"
                  style={{
                    borderColor: "#606364",
                    color: "#ABA4AA",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={e => {
                    if (!isImporting) {
                      e.currentTarget.style.borderColor = "#C3BCC2";
                      e.currentTarget.style.color = "#C3BCC2";
                    }
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
                  disabled={isImporting}
                  className="w-full p-3 rounded-lg border-2 focus:outline-none transition-all duration-200"
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#C3BCC2",
                    color: "#C3BCC2",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#F59E0B";
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
                  disabled={isImporting}
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

          {/* Optional: Custom Title (Only for single import) */}
          {importMode === "single" && (
            <>
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
                  disabled={isImporting}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "#606364",
                    borderColor: "#ABA4AA",
                    color: "#C3BCC2",
                  }}
                />
              </div>

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
                  disabled={isImporting}
                  className="w-full px-3 py-2 rounded-lg border resize-none"
                  style={{
                    backgroundColor: "#606364",
                    borderColor: "#ABA4AA",
                    color: "#C3BCC2",
                  }}
                />
              </div>
            </>
          )}

          {/* Progress Indicator (Batch Import) */}
          {isImporting && importMode === "batch" && (
            <div
              className="p-4 rounded-xl border-2"
              style={{
                backgroundColor: "#2A3133",
                borderColor: "#F59E0B",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium" style={{ color: "#C3BCC2" }}>
                  Importing videos...
                </span>
                <span
                  className="text-sm font-mono"
                  style={{ color: "#F59E0B" }}
                >
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              {/* Progress Bar */}
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "#353A3A" }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    backgroundColor: "#F59E0B",
                    width: `${
                      (importProgress.current / importProgress.total) * 100
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: "#ABA4AA" }}>
                Please wait, this may take a few minutes for large batches...
              </p>
            </div>
          )}

          {/* Error List (if any) */}
          {importErrors.length > 0 && (
            <div
              className="p-4 rounded-xl border-2 max-h-48 overflow-y-auto"
              style={{
                backgroundColor: "#2A3133",
                borderColor: "#DC2626",
              }}
            >
              <p className="font-medium mb-2" style={{ color: "#DC2626" }}>
                ⚠️ {importErrors.length} videos failed to import:
              </p>
              <ul
                className="space-y-1 text-xs font-mono"
                style={{ color: "#ABA4AA" }}
              >
                {importErrors.map((error, index) => (
                  <li key={index} className="truncate">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="flex-1 px-4 py-2 rounded-lg border transition-all duration-300 disabled:opacity-50"
              style={{
                backgroundColor: "transparent",
                borderColor: "#606364",
                color: "#ABA4AA",
              }}
            >
              {isImporting ? "Importing..." : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={importOnFormVideo.isPending || isImporting}
              className="flex-1 px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: "#F59E0B",
                color: "#FFFFFF",
              }}
              onMouseEnter={e => {
                if (!importOnFormVideo.isPending && !isImporting) {
                  e.currentTarget.style.backgroundColor = "#D97706";
                }
              }}
              onMouseLeave={e => {
                if (!importOnFormVideo.isPending && !isImporting) {
                  e.currentTarget.style.backgroundColor = "#F59E0B";
                }
              }}
            >
              {importOnFormVideo.isPending || isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  {isImporting
                    ? `Importing ${importProgress.current}/${importProgress.total}...`
                    : "Importing..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {importMode === "single"
                    ? "Import Video"
                    : `Import ${
                        batchUrls.split("\n").filter(l => l.trim()).length
                      } Videos`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
