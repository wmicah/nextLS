"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Search,
  Play,
  BookOpen,
  Video,
  FileText,
  Plus,
  Filter,
  Grid3X3,
  List,
  Sparkles,
  Users,
  Target,
  Eye,
  X,
} from "lucide-react";
import CustomSelect from "./ui/CustomSelect";

import YouTubePlayer from "./YouTubePlayer";
import YouTubeImportModal from "./YouTubeImportModal";
import UploadResourceModal from "./UploadResourceModal";
import VideoViewerModal from "./VideoViewerModal";
import Sidebar from "./Sidebar";
import { VideoThumbnail } from "./VideoThumbnail";

const categories = [
  "All",
  "Conditioning",
  "Drive",
  "Whip",
  "Separation",
  "Stability",
  "Extension",
];

export default function MobileLibraryPage() {
  const [activeTab, setActiveTab] = useState<"master" | "local">("master");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    title: string;
    type: string;
    isYoutube?: boolean;
    youtubeId?: string;
  } | null>(null);
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false);

  const handleItemClick = (item: {
    id: string;
    title: string;
    type: string;
    isYoutube?: boolean;
    youtubeId?: string;
  }) => {
    setSelectedItem(item);
    setIsVideoViewerOpen(true);
  };

  // Use tRPC queries with refetch
  const {
    data: masterLibraryItems = [],
    isLoading: masterLoading,
    error: masterError,
    refetch: refetchMaster,
  } = trpc.admin.getMasterLibrary.useQuery(undefined, {
    enabled: activeTab === "master",
  });

  const {
    data: localLibraryItems = [],
    isLoading: localLoading,
    error: localError,
    refetch: refetchLocal,
  } = trpc.library.list.useQuery(
    {
      search: searchTerm || undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
    },
    { enabled: activeTab === "local" }
  );

  // Combine data based on active tab
  const libraryItems =
    activeTab === "master" ? masterLibraryItems : localLibraryItems;
  const isLoading = activeTab === "master" ? masterLoading : localLoading;
  const error = activeTab === "master" ? masterError : localError;

  const { data: stats, refetch: refetchStats } =
    trpc.library.getStats.useQuery();

  const { data: clientVideoSubmissions = [] } =
    trpc.library.getClientVideoSubmissions.useQuery();

  // Handle delete success
  const handleDeleteSuccess = () => {
    setIsVideoViewerOpen(false);
    setSelectedItem(null);
    if (activeTab === "master") {
      refetchMaster();
    } else {
      refetchLocal();
    }
    refetchStats();
  };

  // Filter items based on search and category
  const filteredItems = libraryItems.filter((item: any) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Sidebar>
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        {/* Header */}
        <div
          className="sticky top-0 z-10 border-b px-4 py-4"
          style={{ backgroundColor: "#2A3133", borderColor: "#4A5A70" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">Video Library</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setIsYouTubeModalOpen(true)}
                className="p-2 rounded-lg transition-all duration-200"
                style={{ backgroundColor: "#EF4444" }}
                title="Import from YouTube"
              >
                <Play className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="p-2 rounded-lg transition-all duration-200"
                style={{ backgroundColor: "#10B981" }}
                title="Upload Video"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border text-white placeholder-gray-400"
              style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("master")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === "master" ? "text-white" : "text-gray-400"
              }`}
              style={{
                backgroundColor: activeTab === "master" ? "#4A5A70" : "#1F2426",
              }}
            >
              Master Library
            </button>
            <button
              onClick={() => setActiveTab("local")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === "local" ? "text-white" : "text-gray-400"
              }`}
              style={{
                backgroundColor: activeTab === "local" ? "#4A5A70" : "#1F2426",
              }}
            >
              My Library
            </button>
          </div>

          {/* Category Filter */}
          <div className="mb-4">
            <CustomSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories.map(cat => ({ value: cat, label: cat }))}
              placeholder="Select category"
              className="w-full"
              style={{
                backgroundColor: "#1F2426",
                border: "1px solid #4A5A70",
              }}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div
              className="flex gap-1 p-1 rounded-lg"
              style={{ backgroundColor: "#1F2426" }}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-blue-500 text-white"
                    : "text-gray-400"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-blue-500 text-white"
                    : "text-gray-400"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-gray-400">
              {filteredItems.length} videos
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading videos...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">Error loading videos</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ backgroundColor: "#4A5A70", color: "#FFFFFF" }}
              >
                Retry
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No videos found</p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
              >
                Upload Your First Video
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-3"
              }
            >
              {filteredItems.map((item: any, index: number) => (
                <div
                  key={item.id || index}
                  onClick={() => handleItemClick(item)}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                >
                  {viewMode === "grid" ? (
                    <div
                      className="rounded-lg border overflow-hidden"
                      style={{
                        backgroundColor: "#1F2426",
                        borderColor: "#4A5A70",
                      }}
                    >
                      <div className="aspect-video relative">
                        <VideoThumbnail
                          item={item}
                          videoType={activeTab === "master" ? "master" : "local"}
                          className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-white text-sm mb-1 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {item.category || "Uncategorized"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg border"
                      style={{
                        backgroundColor: "#1F2426",
                        borderColor: "#4A5A70",
                      }}
                    >
                      <div className="w-16 h-12 rounded relative flex-shrink-0">
                        <VideoThumbnail
                          item={item}
                          videoType={activeTab === "master" ? "master" : "local"}
                          className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm mb-1 line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {item.category || "Uncategorized"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {isYouTubeModalOpen && (
          <YouTubeImportModal
            isOpen={isYouTubeModalOpen}
            onClose={() => setIsYouTubeModalOpen(false)}
            onSuccess={() => {
              setIsYouTubeModalOpen(false);
              if (activeTab === "local") {
                refetchLocal();
              }
              refetchStats();
            }}
          />
        )}

        {isUploadModalOpen && (
          <UploadResourceModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onSuccess={() => {
              setIsUploadModalOpen(false);
              if (activeTab === "local") {
                refetchLocal();
              }
              refetchStats();
            }}
          />
        )}

        {isVideoViewerOpen && selectedItem && (
          <VideoViewerModal
            isOpen={isVideoViewerOpen}
            onClose={() => {
              setIsVideoViewerOpen(false);
              setSelectedItem(null);
            }}
            item={selectedItem}
            onDelete={handleDeleteSuccess}
          />
        )}
      </div>
    </Sidebar>
  );
}
