"use client";

import { useState, useEffect } from "react";
import { Search, Video, X, Play, Clock } from "lucide-react";
import { trpc } from "@/app/_trpc/client";

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

export default function VideoLibraryDialog({
  isOpen,
  onClose,
  onSelectVideo,
  editingItem,
}: VideoLibraryDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"master" | "local">("master");

  // Fetch master library resources
  const { data: masterLibraryItems = [], isLoading: masterLoading } =
    trpc.admin.getMasterLibrary.useQuery(undefined, {
      enabled: activeTab === "master",
    });

  // Fetch local library resources
  const { data: localLibraryItems = [], isLoading: localLoading } =
    trpc.libraryResources.getAll.useQuery(undefined, {
      enabled: activeTab === "local",
    });

  // Get categories from the appropriate library
  const { data: categories = [] } =
    trpc.libraryResources.getCategories.useQuery();

  // Combine data based on active tab
  const libraryItems =
    activeTab === "master" ? masterLibraryItems : localLibraryItems;
  const isLoading = activeTab === "master" ? masterLoading : localLoading;

  // Filter items based on search term only (library type is already filtered by the queries)
  const filteredItems = libraryItems.filter((item: any) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesSearch;
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
      }}
      // Removed click-outside-to-close behavior - only close via X button
    >
      <div
        className="w-full max-w-4xl bg-[#2A3133] rounded-xl border border-gray-600 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
        style={{
          pointerEvents: "auto",
          backgroundColor: "#2A3133",
          borderColor: "#606364",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Add from Library</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-600">
          <button
            onClick={() => setActiveTab("master")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "master"
                ? "text-white border-b-2 border-blue-500 bg-gray-700/50"
                : "text-gray-400 hover:text-white hover:bg-gray-700/30"
            }`}
          >
            Master Library
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "local"
                ? "text-white border-b-2 border-blue-500 bg-gray-700/50"
                : "text-gray-400 hover:text-white hover:bg-gray-700/30"
            }`}
          >
            Local Library
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-600">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search videos..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-600 bg-[#353A3A] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Video className="h-8 w-8 mb-3 opacity-50" />
              <h3 className="text-lg font-medium mb-1">No videos found</h3>
              <p className="text-sm text-center">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : `No videos in your ${activeTab} library yet`}
              </p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-[#353A3A] rounded-lg border border-gray-600 overflow-hidden hover:border-blue-500 cursor-pointer group"
                    onClick={() => onSelectVideo(item)}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-700">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-6 w-6 text-gray-500" />
                        </div>
                      )}

                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      </div>

                      {/* Duration badge */}
                      {item.duration && (
                        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.duration}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h3 className="font-medium text-white mb-1 line-clamp-2 text-sm">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-1">
                        {item.category && (
                          <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">
                            {item.category}
                          </span>
                        )}
                        {item.difficulty && (
                          <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">
                            {item.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {filteredItems.length} video
              {filteredItems.length !== 1 ? "s" : ""} found
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
