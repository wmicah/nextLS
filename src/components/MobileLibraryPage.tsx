"use client";

import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/app/_trpc/client";
// Icons removed - using text-only design
import YouTubePlayer from "./YouTubePlayer";
import YouTubeImportModal from "./YouTubeImportModal";
import UploadResourceModal from "./UploadResourceModal";
import VideoViewerModal from "./VideoViewerModal";
import MobileNavigation from "./MobileNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";
import CategoryDropdown from "./ui/CategoryDropdown";
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
      <div className="flex items-center justify-center h-64" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: COLORS.GOLDEN_ACCENT }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
        <p style={{ color: COLORS.RED_ALERT }}>Error loading library: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
      {/* Mobile Header */}
      <div 
        className="sticky top-0 z-50 border-b px-4 pb-3"
        style={{ 
          paddingTop: `calc(0.75rem + env(safe-area-inset-top))`,
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>Training Library</h1>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              {activeTab === "master" ? "Shared resources" : "Your resources"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: COLORS.GOLDEN_DARK,
                color: COLORS.TEXT_PRIMARY,
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
        <div 
          className="flex space-x-1 p-1 rounded-xl border"
          style={{ 
            backgroundColor: "#1C2021",
            borderColor: COLORS.BORDER_SUBTLE
          }}
        >
          <button
            onClick={() => setActiveTab("master")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "master" ? "shadow-lg" : ""
            }`}
            style={{
              backgroundColor:
                activeTab === "master" ? COLORS.GOLDEN_ACCENT : "transparent",
              color: activeTab === "master" ? COLORS.BACKGROUND_DARK : COLORS.TEXT_SECONDARY,
            }}
          >
            <span>Shared Library</span>
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "local" ? "shadow-lg" : ""
            }`}
            style={{
              backgroundColor:
                activeTab === "local" ? COLORS.GOLDEN_ACCENT : "transparent",
              color: activeTab === "local" ? COLORS.BACKGROUND_DARK : COLORS.TEXT_SECONDARY,
            }}
          >
            <span>My Library</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div 
          className="border rounded-xl p-4"
          style={{ 
            backgroundColor: "#1C2021",
            borderColor: COLORS.BORDER_SUBTLE
          }}
        >
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
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
                  backgroundColor: "#2A2F2F",
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
              />

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button
                  onClick={() => setViewMode("grid")}
                  className="px-3 py-2 text-xs transition-all duration-200"
                  style={{
                    backgroundColor: viewMode === "grid" ? COLORS.GOLDEN_ACCENT : "#2A2F2F",
                    color: viewMode === "grid" ? COLORS.BACKGROUND_DARK : COLORS.TEXT_PRIMARY,
                  }}
                  title="Grid View"
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="px-3 py-2 text-xs transition-all duration-200"
                  style={{
                    backgroundColor: viewMode === "list" ? COLORS.GOLDEN_ACCENT : "#2A2F2F",
                    color: viewMode === "list" ? COLORS.BACKGROUND_DARK : COLORS.TEXT_PRIMARY,
                  }}
                  title="List View"
                >
                  List
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
              className="p-3 rounded-lg transition-colors text-sm font-medium"
              style={{ backgroundColor: COLORS.RED_ALERT, color: COLORS.TEXT_PRIMARY }}
              onMouseEnter={(e) => {
                if (window.matchMedia("(hover: hover)").matches) {
                  e.currentTarget.style.backgroundColor = COLORS.RED_DARK;
                }
              }}
              onMouseLeave={(e) => {
                if (window.matchMedia("(hover: hover)").matches) {
                  e.currentTarget.style.backgroundColor = COLORS.RED_ALERT;
                }
              }}
            >
              YouTube
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="p-3 rounded-lg transition-colors text-sm font-medium"
              style={{ backgroundColor: COLORS.GOLDEN_DARK, color: COLORS.TEXT_PRIMARY }}
              onMouseEnter={(e) => {
                if (window.matchMedia("(hover: hover)").matches) {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                }
              }}
              onMouseLeave={(e) => {
                if (window.matchMedia("(hover: hover)").matches) {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                }
              }}
            >
              Upload
            </button>
          </div>
        )}

        {/* Permission Guidance */}
        {activeTab === "master" && (
          <div 
            className="border rounded-lg p-4"
            style={{ 
              backgroundColor: "#1C2021",
              borderColor: COLORS.BORDER_SUBTLE
            }}
          >
            <div>
              <h4 className="font-semibold text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
                Shared Library Access
              </h4>
              <p className="text-xs mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                View and assign resources to clients. Only administrators can
                modify.
              </p>
            </div>
          </div>
        )}

        {/* Results Header */}
        {libraryItems.length > 0 && (
          <div>
            <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
              {libraryItems.length}{" "}
              {libraryItems.length === 1 ? "resource" : "resources"} found
            </p>
          </div>
        )}

        {/* Resources List/Grid */}
        {libraryItems.length === 0 ? (
          <div 
            className="border rounded-xl text-center p-8"
            style={{ 
              backgroundColor: "#1C2021",
              borderColor: COLORS.BORDER_SUBTLE
            }}
          >
            <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
              {searchTerm
                ? "No resources found"
                : activeTab === "master"
                ? "No shared resources"
                : "No resources in your library"}
            </h3>
            <p className="mb-6 max-w-sm mx-auto" style={{ color: COLORS.TEXT_SECONDARY }}>
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
                  className="p-3 rounded-lg transition-colors text-xs font-medium"
                  style={{ backgroundColor: COLORS.RED_ALERT, color: COLORS.TEXT_PRIMARY }}
                  onMouseEnter={(e) => {
                    if (window.matchMedia("(hover: hover)").matches) {
                      e.currentTarget.style.backgroundColor = COLORS.RED_DARK;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (window.matchMedia("(hover: hover)").matches) {
                      e.currentTarget.style.backgroundColor = COLORS.RED_ALERT;
                    }
                  }}
                >
                  YouTube
                </button>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="p-3 rounded-lg transition-colors text-xs font-medium"
                  style={{ backgroundColor: COLORS.GOLDEN_DARK, color: COLORS.TEXT_PRIMARY }}
                  onMouseEnter={(e) => {
                    if (window.matchMedia("(hover: hover)").matches) {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (window.matchMedia("(hover: hover)").matches) {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                    }
                  }}
                >
                  Upload Video
                </button>
              </div>
            )}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-sm px-4 py-2 rounded-lg border mx-auto transition-colors"
                style={{ 
                  backgroundColor: "transparent",
                  color: COLORS.TEXT_SECONDARY,
                  borderColor: COLORS.BORDER_SUBTLE
                }}
                onMouseEnter={(e) => {
                  if (window.matchMedia("(hover: hover)").matches) {
                    e.currentTarget.style.backgroundColor = "#2A2F2F";
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.matchMedia("(hover: hover)").matches) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }
                }}
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
                    className="border rounded-xl p-3 transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor: "#1C2021",
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                    onMouseEnter={(e) => {
                      if (window.matchMedia("(hover: hover)").matches) {
                        e.currentTarget.style.backgroundColor = "#2A2F2F";
                        e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (window.matchMedia("(hover: hover)").matches) {
                        e.currentTarget.style.backgroundColor = "#1C2021";
                        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      }
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.backgroundColor = "#1C2021";
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold line-clamp-2 flex-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-xs line-clamp-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                        {item.category || "Uncategorized"}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.GOLDEN_DARK, color: COLORS.TEXT_PRIMARY }}>
                          {item.type}
                        </span>
                        {item.isYoutube && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.RED_ALERT, color: COLORS.TEXT_PRIMARY }}>
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
                    className="border rounded-xl p-5 transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor: "#1C2021",
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                    onMouseEnter={(e) => {
                      if (window.matchMedia("(hover: hover)").matches) {
                        e.currentTarget.style.backgroundColor = "#2A2F2F";
                        e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (window.matchMedia("(hover: hover)").matches) {
                        e.currentTarget.style.backgroundColor = "#1C2021";
                        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      }
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.backgroundColor = "#1C2021";
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold mb-1 line-clamp-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                            {item.title}
                          </h3>
                          <p className="text-sm mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                            {item.category || "Uncategorized"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: COLORS.GOLDEN_DARK, color: COLORS.TEXT_PRIMARY }}>
                          {item.type}
                        </span>
                        {item.isYoutube && (
                          <span className="text-sm px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: COLORS.RED_ALERT, color: COLORS.TEXT_PRIMARY }}>
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
