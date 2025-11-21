"use client";

import { useState, useEffect, useMemo } from "react";
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
import YouTubePlayer from "./YouTubePlayer";
import YouTubeImportModal from "./YouTubeImportModal";
import UploadResourceModal from "./UploadResourceModal";
import VideoViewerModal from "./VideoViewerModal";
import MobileNavigation from "./MobileNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";
import CategoryDropdown from "./ui/CategoryDropdown";

// Default categories that are always available
const DEFAULT_CATEGORIES = [
  "Conditioning",
  "Drive",
  "Whip",
  "Separation",
  "Stability",
  "Extension",
];

export default function MobileLibraryPage() {
  const [activeTab, setActiveTab] = useState<"master" | "local">("local");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Fetch user's custom categories
  const { data: userCategoriesData = [] } =
    trpc.libraryResources.getCategories.useQuery();

  // Combine default categories with user's custom categories
  const categories = useMemo(() => {
    const userCategories = userCategoriesData.map(cat => cat.name);
    // Merge and deduplicate
    const allCategories = [
      ...new Set([...DEFAULT_CATEGORIES, ...userCategories]),
    ].sort();
    return ["All", ...allCategories];
  }, [userCategoriesData]);

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleItemClick = (item: any) => {
    const itemIndex = libraryItems.findIndex(
      (libItem: any) => libItem.id === item.id
    );
    setCurrentItemIndex(itemIndex);
    setSelectedItem(item);
    setIsVideoViewerOpen(true);
  };

  // Navigation functions
  const navigateToPrevious = () => {
    if (libraryItems.length === 0) return;
    const newIndex =
      currentItemIndex > 0 ? currentItemIndex - 1 : libraryItems.length - 1;
    setCurrentItemIndex(newIndex);
    setSelectedItem(libraryItems[newIndex]);
  };

  const navigateToNext = () => {
    if (libraryItems.length === 0) return;
    const newIndex =
      currentItemIndex < libraryItems.length - 1 ? currentItemIndex + 1 : 0;
    setCurrentItemIndex(newIndex);
    setSelectedItem(libraryItems[newIndex]);
  };

  // Use tRPC queries with refetch
  const {
    data: masterLibraryItems,
    isLoading: masterLoading,
    error: masterError,
    refetch: refetchMaster,
  } = trpc.admin.getMasterLibrary.useQuery(
    {
      page: 1,
      limit: 50,
      search: debouncedSearchTerm || undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
    },
    {
      enabled: activeTab === "master",
      placeholderData: previousData => previousData,
      staleTime: 30000,
    }
  );

  const {
    data: localLibraryItems,
    isLoading: localLoading,
    error: localError,
    refetch: refetchLocal,
  } = trpc.library.list.useQuery(
    {
      page: 1,
      limit: 50,
      search: debouncedSearchTerm || undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
    },
    {
      enabled: activeTab === "local",
      placeholderData: previousData => previousData,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    }
  );

  // Combine data based on active tab - handle paginated response
  const libraryItems =
    activeTab === "master"
      ? masterLibraryItems?.items || []
      : localLibraryItems?.items || [];
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

  // Handle upload/import success
  const handleUploadSuccess = () => {
    if (activeTab === "master") {
      refetchMaster();
    } else {
      refetchLocal();
    }
    refetchStats();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: "#4A5A70" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Error loading library: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile Header */}
      <div 
        className="sticky top-0 z-50 bg-[#2A3133] border-b border-[#606364] px-4 pb-3"
        style={{ paddingTop: `calc(0.75rem + env(safe-area-inset-top))` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Training Library</h1>
              <p className="text-xs text-gray-400">
                {activeTab === "master" ? "Shared resources" : "Your resources"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: "#4A5A70",
                color: "#C3BCC2",
              }}
            >
              {libraryItems.length}
            </span>
            <MobileNavigation currentPage="library" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-4">
        {/* Tabs */}
        <div className="flex space-x-1 p-1 rounded-xl border bg-[#353A3A] border-[#606364]">
          <button
            onClick={() => setActiveTab("master")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "master" ? "shadow-lg" : ""
            }`}
            style={{
              backgroundColor:
                activeTab === "master" ? "#4A5A70" : "transparent",
              color: activeTab === "master" ? "#FFFFFF" : "#ABA4AA",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Shared Library</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "local" ? "shadow-lg" : ""
            }`}
            style={{
              backgroundColor:
                activeTab === "local" ? "#4A5A70" : "transparent",
              color: activeTab === "local" ? "#FFFFFF" : "#ABA4AA",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Video className="h-4 w-4" />
              <span>My Library</span>
            </div>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#353A3A] border border-[#606364] rounded-xl p-4">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#606364] border-[#ABA4AA] text-[#C3BCC2] text-sm"
              />
            </div>

            {/* Filters Row */}
            <div className="flex gap-2">
              {/* Category Dropdown */}
              <CategoryDropdown
                value={selectedCategory}
                onChange={setSelectedCategory}
                standardCategories={DEFAULT_CATEGORIES}
                customCategories={userCategoriesData.filter(
                  cat => !DEFAULT_CATEGORIES.includes(cat.name)
                )}
                style={{
                  backgroundColor: "#606364",
                  borderColor: "#ABA4AA",
                  color: "#C3BCC2",
                }}
              />

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-[#ABA4AA] overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-all duration-200 ${
                    viewMode === "grid" ? "bg-[#4A5A70]" : "bg-[#606364]"
                  } text-[#C3BCC2]`}
                  title="Grid View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-all duration-200 ${
                    viewMode === "list" ? "bg-[#4A5A70]" : "bg-[#606364]"
                  } text-[#C3BCC2]`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {activeTab === "local" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsYouTubeModalOpen(true)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#DC2626] text-white"
            >
              <Video className="h-5 w-5" />
              <span className="text-xs font-medium">YouTube</span>
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#4A5A70] text-white"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium">Upload</span>
            </button>
          </div>
        )}

        {/* Permission Guidance */}
        {activeTab === "master" && (
          <div className="bg-[#2D3748] border border-[#4A5A70] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-[#4A5A70]" />
              <div>
                <h4 className="font-semibold text-sm text-[#C3BCC2]">
                  Shared Library Access
                </h4>
                <p className="text-xs text-[#ABA4AA]">
                  View and assign resources to clients. Only administrators can
                  modify.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Header */}
        {libraryItems.length > 0 && (
          <div>
            <p className="text-sm text-[#ABA4AA]">
              {libraryItems.length}{" "}
              {libraryItems.length === 1 ? "resource" : "resources"} found
            </p>
          </div>
        )}

        {/* Resources List/Grid */}
        {libraryItems.length === 0 ? (
          <div className="bg-[#353A3A] border border-[#606364] rounded-xl text-center p-8">
            <div className="w-16 h-16 rounded-xl bg-[#4A5A70] flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-[#C3BCC2]" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#C3BCC2]">
              {searchTerm
                ? "No resources found"
                : activeTab === "master"
                ? "No shared resources"
                : "No resources in your library"}
            </h3>
            <p className="mb-6 max-w-sm mx-auto text-[#ABA4AA]">
              {searchTerm
                ? `No resources match "${searchTerm}". Try a different search term.`
                : activeTab === "master"
                ? "No shared resources are available yet."
                : "Add your first resource to start building your library."}
            </p>
            {!searchTerm && activeTab === "local" && (
              <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                <button
                  onClick={() => setIsYouTubeModalOpen(true)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#DC2626] text-white"
                >
                  <Video className="h-5 w-5" />
                  <span className="text-xs font-medium">YouTube</span>
                </button>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#4A5A70] text-white"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-xs font-medium">Upload Video</span>
                </button>
              </div>
            )}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-sm px-4 py-2 rounded-lg bg-transparent text-[#ABA4AA] border border-[#606364] mx-auto"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 gap-3">
                {libraryItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-[#353A3A] border border-[#606364] rounded-xl p-3 transition-all duration-200 hover:bg-[#3A4040] hover:border-[#4A5A70] cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#C3BCC2] line-clamp-2 flex-1">
                          {item.title}
                        </h3>
                        {item.type === "VIDEO" && (
                          <Play className="h-3 w-3 text-[#ABA4AA] ml-1 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#ABA4AA] line-clamp-1">
                        {item.category || "Uncategorized"}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#4A5A70] text-[#C3BCC2]">
                          {item.type}
                        </span>
                        {item.isYoutube && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#DC2626] text-white">
                            YT
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {libraryItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-[#353A3A] border border-[#606364] rounded-xl p-5 transition-all duration-200 hover:bg-[#3A4040] hover:border-[#4A5A70] cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-[#C3BCC2] mb-1 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-[#ABA4AA] mb-2">
                            {item.category || "Uncategorized"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          {item.type === "VIDEO" && (
                            <div className="w-8 h-8 rounded-full bg-[#4A5A70] flex items-center justify-center">
                              <Play className="h-4 w-4 text-white ml-0.5" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm px-3 py-1.5 rounded-lg bg-[#4A5A70] text-[#C3BCC2] font-medium">
                          {item.type}
                        </span>
                        {item.isYoutube && (
                          <span className="text-sm px-3 py-1.5 rounded-lg bg-[#DC2626] text-white font-medium">
                            YouTube
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNavigation />

      {/* Modals */}
      <YouTubeImportModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <UploadResourceModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {selectedItem && (
        <VideoViewerModal
          isOpen={isVideoViewerOpen}
          onClose={() => setIsVideoViewerOpen(false)}
          item={selectedItem}
          onDelete={activeTab === "local" ? handleDeleteSuccess : undefined}
          onPrevious={navigateToPrevious}
          onNext={navigateToNext}
          currentIndex={currentItemIndex}
          totalItems={libraryItems.length}
          libraryItems={libraryItems}
          forceMobileLayout={true}
        />
      )}
    </div>
  );
}
