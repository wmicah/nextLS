"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import YouTubePlayer from "./YouTubePlayer";
import YouTubeImportModal from "./YouTubeImportModal";
import OnFormImportModal from "./OnFormImportModal";
import UploadResourceModal from "./UploadResourceModal";
import VideoViewerModal from "./VideoViewerModal";
import Sidebar from "./Sidebar";
import { VideoThumbnail } from "./VideoThumbnail";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileLibraryPage from "./MobileLibraryPage";
import CategoryDropdown from "./ui/CategoryDropdown";
import { LoadingState, DataLoadingState } from "@/components/LoadingState";
import { SkeletonVideoGrid, SkeletonCard } from "@/components/SkeletonLoader";
import {
  LibraryPerformanceMonitor,
  useLibraryPerformance,
} from "@/components/LibraryPerformanceMonitor";

// Default categories that are always available
const DEFAULT_CATEGORIES = [
  "Conditioning",
  "Drive",
  "Whip",
  "Separation",
  "Stability",
  "Extension",
];

// Pagination constants
const ITEMS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 300;

// Virtual scrolling constants
const ITEM_HEIGHT = 200; // Approximate height of each item
const CONTAINER_HEIGHT = 600; // Height of the scrollable container

function LibraryPageOptimized() {
  const [activeTab, setActiveTab] = useState<"master" | "local">("local");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [isOnFormModalOpen, setIsOnFormModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Virtual scrolling state
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Performance monitoring
  const performance = useLibraryPerformance();

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, activeTab]);

  // Fetch user's custom categories with caching
  const { data: userCategoriesData = [] } =
    trpc.libraryResources.getCategories.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });

  // Combine default categories with user's custom categories
  const categories = useMemo(() => {
    const userCategories = userCategoriesData.map(cat => cat.name);
    const allCategories = [
      ...new Set([...DEFAULT_CATEGORIES, ...userCategories]),
    ].sort();
    return ["All", ...allCategories];
  }, [userCategoriesData]);

  // Optimized tRPC queries with pagination and better caching
  const {
    data: masterLibraryData,
    isLoading: masterLoading,
    error: masterError,
    refetch: refetchMaster,
  } = trpc.admin.getMasterLibrary.useQuery(
    {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: debouncedSearchTerm || undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
    },
    {
      enabled: activeTab === "master",
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  const {
    data: localLibraryData,
    isLoading: localLoading,
    error: localError,
    refetch: refetchLocal,
  } = trpc.library.list.useQuery(
    {
      search: debouncedSearchTerm || undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    },
    {
      enabled: activeTab === "local",
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Combine data based on active tab
  const libraryData =
    activeTab === "master" ? masterLibraryData : localLibraryData;
  const libraryItems = libraryData?.items || [];
  const pagination = libraryData?.pagination;
  const isLoading = activeTab === "master" ? masterLoading : localLoading;
  const error = activeTab === "master" ? masterError : localError;

  // Update total pages when pagination data changes
  useEffect(() => {
    if (pagination) {
      setTotalPages(pagination.totalPages);
    }
  }, [pagination]);

  // Memoized filtered items to prevent unnecessary re-renders
  const filteredItems = useMemo(() => {
    if (!libraryItems) return [];

    // Server-side filtering is now handled by the API
    return libraryItems;
  }, [libraryItems]);

  // Performance monitoring for render
  useEffect(() => {
    if (filteredItems.length > 0) {
      performance.startRender();
      // Use requestAnimationFrame to measure actual render time
      requestAnimationFrame(() => {
        performance.endRender(filteredItems.length);
      });
    }
  }, [filteredItems.length, performance]);

  // Optimized item click handler
  const handleItemClick = useCallback(
    (item: any) => {
      const itemIndex = filteredItems.findIndex(
        libItem => libItem.id === item.id
      );
      setCurrentItemIndex(itemIndex);
      setSelectedItem(item);
      setIsVideoViewerOpen(true);
    },
    [filteredItems]
  );

  // Navigation functions with bounds checking
  const navigateToPrevious = useCallback(() => {
    if (filteredItems.length === 0) return;
    const newIndex =
      currentItemIndex > 0 ? currentItemIndex - 1 : filteredItems.length - 1;
    setCurrentItemIndex(newIndex);
    setSelectedItem(filteredItems[newIndex]);
  }, [currentItemIndex, filteredItems]);

  const navigateToNext = useCallback(() => {
    if (filteredItems.length === 0) return;
    const newIndex =
      currentItemIndex < filteredItems.length - 1 ? currentItemIndex + 1 : 0;
    setCurrentItemIndex(newIndex);
    setSelectedItem(filteredItems[newIndex]);
  }, [currentItemIndex, filteredItems]);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Virtual scrolling calculation
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    const endIndex = Math.min(
      startIndex + Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + 1,
      filteredItems.length
    );

    return {
      startIndex,
      endIndex,
      items: filteredItems.slice(startIndex, endIndex),
      offsetY: startIndex * ITEM_HEIGHT,
    };
  }, [scrollTop, filteredItems]);

  // Handle scroll for virtual scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Optimized refetch function with performance monitoring
  const handleRefetch = useCallback(() => {
    performance.startApiCall();
    if (activeTab === "master") {
      refetchMaster();
    } else {
      refetchLocal();
    }
  }, [activeTab, refetchMaster, refetchLocal, performance]);

  // Performance monitoring for search
  useEffect(() => {
    if (debouncedSearchTerm) {
      performance.startSearch();
      // End search timing when results are loaded
      if (!isLoading && libraryItems.length >= 0) {
        performance.endSearch();
      }
    }
  }, [debouncedSearchTerm, isLoading, libraryItems.length, performance]);

  // Performance monitoring for filter changes
  useEffect(() => {
    if (selectedCategory !== "All") {
      performance.startFilter();
      // End filter timing when results are loaded
      if (!isLoading && libraryItems.length >= 0) {
        performance.endFilter();
      }
    }
  }, [selectedCategory, isLoading, libraryItems.length, performance]);

  // Loading state with better UX
  if (isLoading && filteredItems.length === 0) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading library resources...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  // Error state
  if (error) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Error Loading Library
            </h2>
            <p className="text-gray-400 mb-4">{error.message}</p>
            <button
              onClick={handleRefetch}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <LibraryPerformanceMonitor />

      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Library</h1>
          <p className="text-gray-400">Manage your training resources</p>
        </div>

        {/* Controls */}
        <div className="mb-8 space-y-4">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("local")}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === "local"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              My Library
            </button>
            <button
              onClick={() => setActiveTab("master")}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === "master"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Master Library
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search library..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Add Resource Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsYouTubeModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Video className="w-4 h-4" />
                YouTube
              </button>
              <button
                onClick={() => setIsOnFormModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                OnForm
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Upload
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="text-gray-400">
              {isLoading
                ? "Loading..."
                : `${filteredItems.length} ${
                    filteredItems.length === 1 ? "item" : "items"
                  } found`}
            </div>

            {filteredItems.length > 0 && (
              <button
                onClick={handleRefetch}
                className="text-gray-400 hover:text-white transition-colors"
                disabled={isLoading}
              >
                Refresh
              </button>
            )}
          </div>

          {/* Items Grid/List */}
          {filteredItems.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No items found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCategory !== "All"
                  ? "Try adjusting your search or filters"
                  : "Start by adding some resources to your library"}
              </p>
              {!searchTerm && selectedCategory === "All" && (
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setIsYouTubeModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Import from YouTube
                  </button>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Upload File
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Virtual Scrolling Container */}
              <div
                ref={scrollContainerRef}
                className="relative overflow-auto"
                style={{ height: CONTAINER_HEIGHT }}
                onScroll={handleScroll}
              >
                {/* Virtual scrolling spacer */}
                <div
                  style={{
                    height: filteredItems.length * ITEM_HEIGHT,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      transform: `translateY(${visibleItems.offsetY}px)`,
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                    }}
                  >
                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {visibleItems.items.map((item: any, index: number) => (
                          <LibraryItemCard
                            key={item.id}
                            item={item}
                            index={index}
                            onClick={handleItemClick}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {visibleItems.items.map((item: any, index: number) => (
                          <LibraryItemList
                            key={item.id}
                            item={item}
                            index={index}
                            onClick={handleItemClick}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "bg-gray-800 text-gray-400 hover:text-white"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <YouTubeImportModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        onSuccess={() => {
          setIsYouTubeModalOpen(false);
          handleRefetch();
        }}
      />

      <OnFormImportModal
        isOpen={isOnFormModalOpen}
        onClose={() => setIsOnFormModalOpen(false)}
        onSuccess={() => {
          setIsOnFormModalOpen(false);
          handleRefetch();
        }}
      />

      <UploadResourceModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          setIsUploadModalOpen(false);
          handleRefetch();
        }}
      />

      <VideoViewerModal
        isOpen={isVideoViewerOpen}
        onClose={() => setIsVideoViewerOpen(false)}
        item={selectedItem}
        onPrevious={navigateToPrevious}
        onNext={navigateToNext}
        currentIndex={currentItemIndex}
        totalItems={filteredItems.length}
      />
    </Sidebar>
  );
}

// Optimized Library Item Card Component
const LibraryItemCard = React.memo(
  ({
    item,
    index,
    onClick,
  }: {
    item: any;
    index: number;
    onClick: (item: any) => void;
  }) => {
    const handleClick = useCallback(() => {
      onClick(item);
    }, [item, onClick]);

    return (
      <div
        className="rounded-xl shadow-lg border border-gray-700 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group bg-gray-800 hover:bg-gray-750"
        onClick={handleClick}
      >
        <div className="relative">
          <div className="h-32 rounded-t-xl overflow-hidden relative bg-gray-900">
            <VideoThumbnail
              item={item}
              videoType={item.type}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-black bg-opacity-50 rounded-full p-2">
                <Play className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">
              {item.title}
            </h3>
            <p className="text-gray-400 text-xs line-clamp-2 mb-3">
              {item.description}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {item.views || 0}
              </span>
              <span className="bg-gray-700 px-2 py-1 rounded">
                {item.category}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

// Optimized Library Item List Component
const LibraryItemList = React.memo(
  ({
    item,
    index,
    onClick,
  }: {
    item: any;
    index: number;
    onClick: (item: any) => void;
  }) => {
    const handleClick = useCallback(() => {
      onClick(item);
    }, [item, onClick]);

    return (
      <div
        className="flex items-center space-x-4 p-4 rounded-lg border border-gray-700 transition-all duration-200 hover:bg-gray-800 cursor-pointer group"
        onClick={handleClick}
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-900 flex-shrink-0">
          <VideoThumbnail
            item={item}
            videoType={item.type}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">
            {item.title}
          </h3>
          <p className="text-gray-400 text-xs line-clamp-2 mb-2">
            {item.description}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {item.views || 0}
            </span>
            <span className="bg-gray-700 px-2 py-1 rounded">
              {item.category}
            </span>
          </div>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Play className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    );
  }
);

export default withMobileDetection(MobileLibraryPage, LibraryPageOptimized);
