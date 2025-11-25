"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Video, X, Play, Clock } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { COLORS } from "@/lib/colors";

interface VideoLibraryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (video: {
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  }) => void;
  editingItem?: {
    id: string;
    title: string;
    type?: "exercise" | "drill" | "video" | "routine";
    description?: string;
    notes?: string;
    sets?: number;
    reps?: number;
    tempo?: string;
    duration?: string;
    videoUrl?: string;
    videoId?: string;
    videoTitle?: string;
    videoThumbnail?: string;
    routineId?: string;
  } | null;
}

// Default categories
const DEFAULT_CATEGORIES = [
  "Conditioning",
  "Drive",
  "Whip",
  "Separation",
  "Stability",
  "Extension",
];

export default function VideoLibraryDialog({
  isOpen,
  onClose,
  onSelectVideo,
  editingItem,
}: VideoLibraryDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"master" | "local">("master");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch master library resources - only when dialog is open
  const { data: masterLibraryData, isLoading: masterLoading } =
    trpc.admin.getMasterLibrary.useQuery(
      {
        page: 1,
        limit: 50,
        search: searchTerm || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
      },
      {
        enabled: isOpen && activeTab === "master",
      }
    );

  const masterLibraryItems = masterLibraryData?.items || [];

  // Fetch local library resources - only when dialog is open
  const { data: localLibraryItems = [], isLoading: localLoading } =
    trpc.libraryResources.getAll.useQuery(undefined, {
      enabled: isOpen && activeTab === "local",
    });

  // Get categories from the appropriate library - only when dialog is open
  const { data: categories = [] } =
    trpc.libraryResources.getCategories.useQuery(undefined, {
      enabled: isOpen,
    });

  // Combine data based on active tab
  const libraryItems =
    activeTab === "master" ? masterLibraryItems : localLibraryItems;
  const isLoading = activeTab === "master" ? masterLoading : localLoading;

  // Filter items based on search term and category
  const filteredItems = libraryItems.filter((item: any) => {
    const matchesSearch =
      !searchTerm.trim() ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Handle body overflow when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset search when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }

    return undefined;
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        nested={true}
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl [&>button]:hidden"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>Add from Library</DialogTitle>
          <DialogDescription className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
            Select a video from your library to add.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <button
            onClick={() => setActiveTab("master")}
            className="px-4 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: activeTab === "master" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
              borderBottom: activeTab === "master" ? `2px solid ${COLORS.GOLDEN_ACCENT}` : "2px solid transparent",
              backgroundColor: activeTab === "master" ? COLORS.BACKGROUND_CARD_HOVER : "transparent",
            }}
            onMouseEnter={e => {
              if (activeTab !== "master") {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== "master") {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }
            }}
          >
            Master Library
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className="px-4 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: activeTab === "local" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
              borderBottom: activeTab === "local" ? `2px solid ${COLORS.GOLDEN_ACCENT}` : "2px solid transparent",
              backgroundColor: activeTab === "local" ? COLORS.BACKGROUND_CARD_HOVER : "transparent",
            }}
            onMouseEnter={e => {
              if (activeTab !== "local") {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== "local") {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }
            }}
          >
            Local Library
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-3 border-b space-y-2.5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5" style={{ color: COLORS.TEXT_SECONDARY }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search videos..."
              className="w-full pl-9 pr-3 py-2 rounded-md border text-sm"
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
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-md border text-sm"
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
              <option value="all" style={{ backgroundColor: COLORS.BACKGROUND_CARD, color: COLORS.TEXT_PRIMARY }}>All Categories</option>

              <optgroup
                label="Standard Categories"
                style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}
              >
                {DEFAULT_CATEGORIES.map(cat => (
                  <option
                    key={cat}
                    value={cat}
                    style={{ backgroundColor: COLORS.BACKGROUND_CARD, color: COLORS.TEXT_PRIMARY }}
                  >
                    {cat}
                  </option>
                ))}
              </optgroup>

              {categories.filter(
                (cat: any) => !DEFAULT_CATEGORIES.includes(cat.name)
              ).length > 0 && (
                <optgroup
                  label="Your Categories"
                  style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}
                >
                  {categories
                    .filter(
                      (cat: any) => !DEFAULT_CATEGORIES.includes(cat.name)
                    )
                    .map((cat: any) => (
                      <option
                        key={cat.name}
                        value={cat.name}
                        style={{ backgroundColor: COLORS.BACKGROUND_CARD, color: COLORS.TEXT_PRIMARY }}
                      >
                        {cat.name} ({cat.count})
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent" style={{ borderColor: COLORS.GOLDEN_ACCENT }}></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48" style={{ color: COLORS.TEXT_SECONDARY }}>
              <Video className="h-7 w-7 mb-2 opacity-50" />
              <h3 className="text-sm font-medium mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>No videos found</h3>
              <p className="text-xs text-center">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : `No videos in your ${activeTab} library yet`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredItems.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-md border overflow-hidden cursor-pointer group transition-colors"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                  }}
                  onClick={() => onSelectVideo(item)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-5 w-5" style={{ color: COLORS.TEXT_MUTED }} />
                      </div>
                    )}

                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5">
                        <Play className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>

                    {/* Duration badge */}
                    {item.duration && (
                      <div className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          color: COLORS.TEXT_PRIMARY,
                        }}
                      >
                        <Clock className="h-2.5 w-2.5" />
                        {item.duration}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-2.5">
                    <h3 className="font-medium mb-1 line-clamp-2 text-xs" style={{ color: COLORS.TEXT_PRIMARY }}>
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-[10px] mb-1.5 line-clamp-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1 flex-wrap">
                      {item.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: "rgba(229, 178, 50, 0.2)",
                            color: COLORS.GOLDEN_ACCENT,
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                      {item.difficulty && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: "rgba(112, 207, 112, 0.2)",
                            color: COLORS.GREEN_PRIMARY,
                          }}
                        >
                          {item.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
              {filteredItems.length} video
              {filteredItems.length !== 1 ? "s" : ""} found
              {filteredItems.length > 8 && (
                <span className="ml-2 text-[10px]" style={{ color: COLORS.GOLDEN_ACCENT }}>
                  (Scroll to see more)
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs transition-colors"
              style={{ color: COLORS.TEXT_SECONDARY }}
              onMouseEnter={e => {
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
