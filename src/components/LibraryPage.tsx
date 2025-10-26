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
} from "lucide-react";

import YouTubePlayer from "./YouTubePlayer";
import YouTubeImportModal from "./YouTubeImportModal";
import UploadResourceModal from "./UploadResourceModal";
import VideoViewerModal from "./VideoViewerModal";
import Sidebar from "./Sidebar";
import { VideoThumbnail } from "./VideoThumbnail";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileLibraryPage from "./MobileLibraryPage";
import CategoryDropdown from "./ui/CategoryDropdown";
import { LoadingState, DataLoadingState } from "@/components/LoadingState";
import { SkeletonVideoGrid, SkeletonCard } from "@/components/SkeletonLoader";

// Default categories that are always available
const DEFAULT_CATEGORIES = [
  "Conditioning",
  "Drive",
  "Whip",
  "Separation",
  "Stability",
  "Extension",
];

function LibraryPage() {
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

  // Pagination state - separate for each tab
  const [masterCurrentPage, setMasterCurrentPage] = useState(1);
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [masterItems, setMasterItems] = useState<any[]>([]);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [masterHasMore, setMasterHasMore] = useState(true);
  const [localHasMore, setLocalHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  // Load more function
  const loadMore = () => {
    console.log("🔍 Load More Called:", {
      activeTab,
      hasMore,
      isLoadingMore,
      masterCurrentPage,
      localCurrentPage,
    });

    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      if (activeTab === "master") {
        setMasterCurrentPage(prev => prev + 1);
      } else {
        setLocalCurrentPage(prev => prev + 1);
      }
    }
  };

  // Handle tab switching with better state management
  const handleTabChange = (tab: "master" | "local") => {
    setActiveTab(tab);
    // Each tab maintains its own pagination state
  };

  // Use tRPC queries with pagination and better caching
  const {
    data: masterLibraryItems,
    isLoading: masterLoading,
    error: masterError,
    refetch: refetchMaster,
  } = trpc.admin.getMasterLibrary.useQuery(
    {
      search: debouncedSearchTerm || undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
      page: masterCurrentPage,
      limit: 24, // Load 24 items per page
    },
    {
      placeholderData: previousData => previousData, // Prevent flash when switching tabs
      staleTime: 0, // Always refetch when search changes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
    }
  );

  const {
    data: localLibraryItems,
    isLoading: localLoading,
    error: localError,
    refetch: refetchLocal,
  } = trpc.library.list.useQuery(
    {
      search: debouncedSearchTerm || undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
      page: localCurrentPage,
      limit: 24, // Load 24 items per page
    },
    {
      placeholderData: previousData => previousData, // Prevent flash when search changes
      staleTime: 0, // Always refetch when search changes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
    }
  );

  // Handle master library data
  useEffect(() => {
    if (masterLibraryItems?.items) {
      if (masterCurrentPage === 1) {
        setMasterItems(masterLibraryItems.items);
      } else {
        setMasterItems(prev => {
          // Prevent duplicates by checking if item already exists
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = masterLibraryItems.items.filter(
            item => !existingIds.has(item.id)
          );
          return [...prev, ...newItems];
        });
      }
      const hasNextPage = masterLibraryItems.pagination?.hasNextPage || false;
      console.log("🔍 Master Library Pagination:", {
        currentPage: masterCurrentPage,
        totalPages: masterLibraryItems.pagination?.totalPages,
        totalCount: masterLibraryItems.pagination?.totalCount,
        hasNextPage,
        itemsInThisPage: masterLibraryItems.items.length,
      });
      setMasterHasMore(hasNextPage);
    } else if (masterLibraryItems && masterLibraryItems.items?.length === 0) {
      if (masterCurrentPage === 1) {
        setMasterItems([]);
      }
      setMasterHasMore(false);
    }
  }, [masterLibraryItems, masterCurrentPage]);

  // Force update when search changes to ensure data is refreshed
  useEffect(() => {
    if (masterLibraryItems?.items && masterCurrentPage === 1) {
      setMasterItems(masterLibraryItems.items);
      setMasterHasMore(masterLibraryItems.pagination?.hasNextPage || false);
    }
  }, [debouncedSearchTerm, selectedCategory, masterLibraryItems]);

  // Debug logging for search issues
  useEffect(() => {
    console.log("🔍 Search Debug:", {
      searchTerm,
      debouncedSearchTerm,
      selectedCategory,
      masterItems: masterItems.length,
      localItems: localItems.length,
      masterCurrentPage,
      localCurrentPage,
      masterLibraryItems: masterLibraryItems?.items?.length,
      localLibraryItems: localLibraryItems?.items?.length,
    });
  }, [
    searchTerm,
    debouncedSearchTerm,
    selectedCategory,
    masterItems.length,
    localItems.length,
    masterCurrentPage,
    localCurrentPage,
    masterLibraryItems,
    localLibraryItems,
  ]);

  // Handle local library data
  useEffect(() => {
    if (localLibraryItems?.items) {
      if (localCurrentPage === 1) {
        setLocalItems(localLibraryItems.items);
      } else {
        setLocalItems(prev => {
          // Prevent duplicates by checking if item already exists
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = localLibraryItems.items.filter(
            item => !existingIds.has(item.id)
          );
          return [...prev, ...newItems];
        });
      }
      const hasNextPage = localLibraryItems.pagination?.hasNextPage || false;
      console.log("🔍 Local Library Pagination:", {
        currentPage: localCurrentPage,
        totalPages: localLibraryItems.pagination?.totalPages,
        totalCount: localLibraryItems.pagination?.totalCount,
        hasNextPage,
        itemsInThisPage: localLibraryItems.items.length,
      });
      setLocalHasMore(hasNextPage);
    } else if (localLibraryItems && localLibraryItems.items?.length === 0) {
      if (localCurrentPage === 1) {
        setLocalItems([]);
      }
      setLocalHasMore(false);
    }
  }, [localLibraryItems, localCurrentPage]);

  // Force update when search changes to ensure data is refreshed
  useEffect(() => {
    if (localLibraryItems?.items && localCurrentPage === 1) {
      setLocalItems(localLibraryItems.items);
      setLocalHasMore(localLibraryItems.pagination?.hasNextPage || false);
    }
  }, [debouncedSearchTerm, selectedCategory, localLibraryItems]);

  // Reset items when search/category changes
  useEffect(() => {
    setMasterItems([]);
    setLocalItems([]);
    setMasterCurrentPage(1);
    setLocalCurrentPage(1);
    setMasterHasMore(true);
    setLocalHasMore(true);
  }, [debouncedSearchTerm, selectedCategory]);

  // Use accumulated items based on active tab
  const libraryItems = activeTab === "master" ? masterItems : localItems;
  const isLoading = activeTab === "master" ? masterLoading : localLoading;
  const error = activeTab === "master" ? masterError : localError;
  const hasMore = activeTab === "master" ? masterHasMore : localHasMore;

  // Show loading when switching tabs and no items are loaded yet
  const isInitialLoading = isLoading && libraryItems.length === 0;

  // Reset loading more state when new data arrives
  useEffect(() => {
    if (isLoadingMore && !isLoading) {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore]);

  // Auto-load more when scrolling near bottom
  useEffect(() => {
    const handleScroll = () => {
      if (hasMore && !isLoadingMore && !isLoading) {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Load more when user is within 200px of bottom
        if (scrollTop + windowHeight >= documentHeight - 200) {
          loadMore();
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoadingMore, isLoading, loadMore]);

  // Debug logging with useEffect to monitor changes
  useEffect(() => {
    console.log("🔍 LibraryPage Debug:", {
      activeTab,
      masterCurrentPage,
      localCurrentPage,
      localLibraryItems: localLibraryItems?.items?.length,
      masterLibraryItems: masterLibraryItems?.items?.length,
      libraryItems: libraryItems?.length,
      hasMore,
      pagination:
        activeTab === "master"
          ? masterLibraryItems?.pagination
          : localLibraryItems?.pagination,
      localLoading,
      localError: localError?.message,
      searchTerm,
      debouncedSearchTerm,
      selectedCategory,
      timestamp: new Date().toISOString(),
    });

    if (localLibraryItems?.items && localLibraryItems.items.length > 0) {
      console.log(
        "🎉 Local library items found:",
        localLibraryItems.items.map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          category: item.category,
          createdAt: item.createdAt,
        }))
      );
    } else if (
      localLibraryItems?.items &&
      localLibraryItems.items.length === 0
    ) {
      console.log("⚠️ Local library items array is empty");
    }

    if (masterLibraryItems?.items && masterLibraryItems.items.length > 0) {
      console.log(
        "🎉 Master library items found:",
        masterLibraryItems.items.map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          category: item.category,
        }))
      );
    }

    if (localError) {
      console.error("❌ Local library error:", localError);
    }

    if (masterError) {
      console.error("❌ Master library error:", masterError);
    }
  }, [
    activeTab,
    localLibraryItems,
    masterLibraryItems,
    libraryItems,
    localLoading,
    localError,
    masterError,
    searchTerm,
    debouncedSearchTerm,
    selectedCategory,
  ]);

  const { data: stats, refetch: refetchStats } =
    trpc.library.getStats.useQuery();

  const { data: clientVideoSubmissions = [] } =
    trpc.library.getClientVideoSubmissions.useQuery();

  // Handle delete success
  const handleDeleteSuccess = () => {
    setIsVideoViewerOpen(false);
    setSelectedItem(null);
    if (activeTab === "master") {
      refetchMaster(); // Refresh master library items
    } else {
      refetchLocal(); // Refresh local library items
    }
    refetchStats(); // Refresh stats
  };

  // Handle upload/import success
  const handleUploadSuccess = () => {
    if (activeTab === "master") {
      refetchMaster(); // Refresh master library items
    } else {
      refetchLocal(); // Refresh local library items
    }
    refetchStats(); // Refresh stats
  };

  if (isInitialLoading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <LoadingState
            isLoading={true}
            skeleton={<SkeletonVideoGrid />}
            className="p-8"
          >
            <div />
          </LoadingState>
        </div>
      </Sidebar>
    );
  }

  if (error) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-400">Error loading library: {error.message}</p>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#C3BCC2" }}>
            Training Library
          </h1>
          <p className="text-sm" style={{ color: "#ABA4AA" }}>
            {activeTab === "master"
              ? "Browse shared training resources from administrators"
              : "Manage your personal training resources and uploads"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: "#4A5A70",
              color: "#C3BCC2",
            }}
          >
            {libraryItems.length}{" "}
            {libraryItems.length === 1 ? "Resource" : "Resources"}
          </span>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div
        className="rounded-xl p-4 mb-8 shadow-xl border relative"
        style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
      >
        <div className="flex gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
              style={{ color: "#ABA4AA" }}
            />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-300 text-sm"
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            />
          </div>

          {/* Filters - Right Side */}
          <div className="flex gap-2 items-center flex-shrink-0">
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

            <div
              className="flex rounded-lg border overflow-hidden"
              style={{ borderColor: "#606364" }}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2.5 transition-all duration-300 flex items-center gap-1.5 text-sm ${
                  viewMode === "grid" ? "font-medium" : ""
                }`}
                style={{
                  backgroundColor:
                    viewMode === "grid" ? "#4A5A70" : "transparent",
                  color: "#C3BCC2",
                }}
              >
                <Grid3X3 className="h-4 w-4" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2.5 transition-all duration-300 flex items-center gap-1.5 text-sm ${
                  viewMode === "list" ? "font-medium" : ""
                }`}
                style={{
                  backgroundColor:
                    viewMode === "list" ? "#4A5A70" : "transparent",
                  color: "#C3BCC2",
                }}
              >
                <List className="h-4 w-4" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Actions Combined */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 bg-[#1A1D1E] rounded-xl p-3 border border-[#4A5A70]">
          {/* Left: Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => handleTabChange("master")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                activeTab === "master"
                  ? "bg-[#4A5A70] text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-[#2D3748]"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span>Shared Library</span>
                <span className="text-xs opacity-70">(Read-only)</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange("local")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                activeTab === "local"
                  ? "bg-[#4A5A70] text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-[#2D3748]"
              }`}
            >
              <Video className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span>My Library</span>
                <span className="text-xs opacity-70">(Full access)</span>
              </div>
            </button>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex gap-2">
            {activeTab === "local" ? (
              <>
                <button
                  onClick={() => setIsYouTubeModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
                  style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#B91C1C";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#DC2626";
                  }}
                >
                  <Video className="h-4 w-4" />
                  Import YouTube
                </button>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
                  style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#606364";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#4A5A70";
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Upload
                </button>
              </>
            ) : (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: "#2D3748",
                  borderColor: "#4A5A70",
                  color: "#ABA4AA",
                }}
              >
                <BookOpen className="h-4 w-4" />
                <span className="text-sm">Read-only access</span>
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                >
                  Admin Only
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Resource Count */}
        <div className="mt-3 px-2">
          <p className="text-sm" style={{ color: "#ABA4AA" }}>
            {libraryItems.length}{" "}
            {libraryItems.length === 1 ? "resource" : "resources"} found
          </p>
        </div>
      </div>

      {/* Permission Guidance */}
      {activeTab === "master" && (
        <div
          className="mb-6 p-4 rounded-lg border"
          style={{
            backgroundColor: "#2D3748",
            borderColor: "#4A5A70",
          }}
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5" style={{ color: "#4A5A70" }} />
            <div>
              <h4
                className="font-semibold text-sm"
                style={{ color: "#C3BCC2" }}
              >
                Shared Library Access
              </h4>
              <p className="text-xs" style={{ color: "#ABA4AA" }}>
                You can view and assign these resources to clients, but only
                administrators can add or modify them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {libraryItems.length === 0 && (
        <div
          className="flex flex-col items-center justify-center h-96 rounded-2xl shadow-xl border relative overflow-hidden"
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
            }}
          />
          <div className="relative text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#4A5A70" }}
            >
              {activeTab === "master" ? (
                <BookOpen className="h-10 w-10" style={{ color: "#C3BCC2" }} />
              ) : (
                <Video className="h-10 w-10" style={{ color: "#C3BCC2" }} />
              )}
            </div>
            <h3
              className="text-2xl font-bold mb-3"
              style={{ color: "#C3BCC2" }}
            >
              {searchTerm || selectedCategory !== "All"
                ? "No resources found"
                : activeTab === "master"
                ? "Shared Library is Empty"
                : "Start Building Your Library"}
            </h3>
            <p
              className="text-center mb-8 max-w-md"
              style={{ color: "#ABA4AA" }}
            >
              {searchTerm || selectedCategory !== "All"
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : activeTab === "master"
                ? "The shared library doesn't have any resources yet. Contact your administrator to add training resources that everyone can access."
                : "Upload your first training resource or import from YouTube to start building your personal library."}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {activeTab === "local" && (
                <>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                    style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#606364";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "#4A5A70";
                    }}
                  >
                    Upload Video
                  </button>
                  <button
                    onClick={() => setIsYouTubeModalOpen(true)}
                    className="px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                    style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#B91C1C";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "#DC2626";
                    }}
                  >
                    Import from YouTube
                  </button>
                </>
              )}
              {(activeTab === "master" ||
                searchTerm ||
                selectedCategory !== "All") && (
                <button
                  onClick={() => {
                    if (searchTerm || selectedCategory !== "All") {
                      setSearchTerm("");
                      setSelectedCategory("All");
                    }
                  }}
                  className="px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                  style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#606364";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#4A5A70";
                  }}
                >
                  {searchTerm || selectedCategory !== "All"
                    ? "Clear Filters"
                    : "Contact Administrator"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Library Grid/List */}
      {libraryItems.length > 0 && (
        <div className="w-full">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6 w-full">
              {libraryItems.map((item: any, index: number) => (
                <div
                  key={`${item.id}-${index}`}
                  className="rounded-xl shadow-2xl border-2 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group w-full h-full"
                  style={{
                    backgroundColor: "#1A1D1E",
                    borderColor: "#2D3748",
                    animationDelay: index * 50 + "ms",
                  }}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#2D3748";
                    e.currentTarget.style.borderColor = "#4A5A70";
                    e.currentTarget.style.boxShadow =
                      "0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px #4A5A70";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#1A1D1E";
                    e.currentTarget.style.borderColor = "#2D3748";
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px rgba(0, 0, 0, 0.4)";
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(135deg, #4A5A70 0%, #2D3748 50%, #1A1D1E 100%)",
                    }}
                  />

                  <div className="relative">
                    <div
                      className="h-28 lg:h-32 rounded-t-xl overflow-hidden relative"
                      style={{ backgroundColor: "#0F1416" }}
                    >
                      <VideoThumbnail
                        item={item}
                        videoType={activeTab === "master" ? "master" : "local"}
                      />

                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl"
                          style={{
                            backgroundColor: "#4A5A70",
                            border: "2px solid #C3BCC2",
                          }}
                        >
                          <Play
                            className="h-6 w-6 ml-0.5"
                            style={{ color: "#FFFFFF" }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 lg:p-5">
                      <div className="flex items-center justify-between mb-2 lg:mb-3">
                        <span
                          className="px-2 lg:px-3 py-1 text-xs font-bold rounded-full border"
                          style={{
                            backgroundColor: "#4A5A70",
                            color: "#FFFFFF",
                            borderColor: "#6B7280",
                          }}
                        >
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.isYoutube ? (
                            <Video className="h-3 w-3 text-red-500" />
                          ) : item.type === "video" ? (
                            <Video
                              className="h-3 w-3"
                              style={{ color: "#ABA4AA" }}
                            />
                          ) : (
                            <FileText
                              className="h-3 w-3"
                              style={{ color: "#ABA4AA" }}
                            />
                          )}
                          {item.duration && (
                            <span
                              style={{ color: "#ABA4AA" }}
                              className="text-xs"
                            >
                              {item.duration}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3
                        className="text-sm lg:text-base font-bold mb-2 lg:mb-3 line-clamp-1"
                        style={{ color: "#FFFFFF" }}
                      >
                        {item.title}
                      </h3>

                      <p
                        className="text-xs lg:text-sm mb-3 lg:mb-4 line-clamp-2"
                        style={{ color: "#D1D5DB" }}
                      >
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 lg:gap-2">
                          {/* Rating and views removed - not necessary */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-w-6xl mx-auto">
              {libraryItems.map((item: any, index: number) => (
                <div
                  key={`${item.id}-${index}`}
                  className="rounded-xl shadow-2xl p-5 border-2 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group w-full"
                  style={{
                    backgroundColor: "#1A1D1E",
                    borderColor: "#2D3748",
                    animationDelay: index * 30 + "ms",
                  }}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#2D3748";
                    e.currentTarget.style.borderColor = "#4A5A70";
                    e.currentTarget.style.boxShadow =
                      "0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px #4A5A70";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#1A1D1E";
                    e.currentTarget.style.borderColor = "#2D3748";
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px rgba(0, 0, 0, 0.4)";
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(135deg, #4A5A70 0%, #2D3748 50%, #1A1D1E 100%)",
                    }}
                  />

                  <div className="relative flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-xl flex items-center justify-center text-xl flex-shrink-0 overflow-hidden relative border"
                      style={{
                        backgroundColor: "#0F1416",
                        borderColor: "#4A5A70",
                      }}
                    >
                      <VideoThumbnail
                        item={item}
                        videoType={activeTab === "master" ? "master" : "local"}
                        className="w-20 h-20"
                      />

                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-xl border"
                          style={{
                            backgroundColor: "#4A5A70",
                            borderColor: "#C3BCC2",
                          }}
                        >
                          <Play
                            className="h-5 w-5 ml-0.5"
                            style={{ color: "#FFFFFF" }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="px-3 py-1 text-xs font-bold rounded-full border"
                          style={{
                            backgroundColor: "#4A5A70",
                            color: "#FFFFFF",
                            borderColor: "#6B7280",
                          }}
                        >
                          {item.category}
                        </span>

                        {item.isYoutube && (
                          <span
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: "#DC2626",
                              color: "#C3BCC2",
                            }}
                          >
                            YouTube
                          </span>
                        )}
                      </div>

                      <h3
                        className="text-lg font-bold mb-2 line-clamp-1"
                        style={{ color: "#FFFFFF" }}
                      >
                        {item.title}
                      </h3>

                      <p
                        className="text-sm mb-3 line-clamp-1"
                        style={{ color: "#D1D5DB" }}
                      >
                        {item.description}
                      </p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {item.isYoutube ? (
                            <Video className="h-3 w-3 text-red-500" />
                          ) : item.type === "video" ? (
                            <Video
                              className="h-3 w-3"
                              style={{ color: "#ABA4AA" }}
                            />
                          ) : (
                            <FileText
                              className="h-3 w-3"
                              style={{ color: "#ABA4AA" }}
                            />
                          )}
                          {item.duration && (
                            <span
                              style={{ color: "#ABA4AA" }}
                              className="text-xs"
                            >
                              {item.duration}
                            </span>
                          )}
                        </div>

                        {/* Rating and views removed - not necessary */}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (item.isYoutube && item.youtubeId) {
                            window.open(item.url, "_blank");
                          } else {
                            window.open(item.url, "_blank");
                          }
                        }}
                        className="p-3 rounded-lg transition-all duration-300 transform hover:scale-110 border-2"
                        style={{
                          backgroundColor: "transparent",
                          color: "#9CA3AF",
                          borderColor: "#4A5A70",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#4A5A70";
                          e.currentTarget.style.color = "#FFFFFF";
                          e.currentTarget.style.borderColor = "#6B7280";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#9CA3AF";
                          e.currentTarget.style.borderColor = "#4A5A70";
                        }}
                      >
                        {item.isYoutube || item.type === "video" ? (
                          <Play className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="text-sm transition-all duration-200 hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed underline decoration-dotted underline-offset-4"
                style={{
                  color: "#ABA4AA",
                }}
              >
                {isLoadingMore ? "Loading more..." : "Load more"}
              </button>
            </div>
          )}

          {/* Auto-loading indicator */}
          {isLoadingMore && (
            <div className="mt-4 text-center">
              <div
                className="inline-flex items-center gap-2 text-sm"
                style={{ color: "#ABA4AA" }}
              >
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                Loading more content...
              </div>
            </div>
          )}

          {/* End of results indicator */}
          {!hasMore && libraryItems.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                You've reached the end of the results
              </p>
            </div>
          )}
        </div>
      )}

      {/* Client Video Submissions Section - Temporarily disabled */}
      {/* {clientVideoSubmissions.length > 0 && (
				<div className="mt-12">
					<div className="text-center py-8 text-gray-400">
						Client submissions feature coming soon
					</div>
				</div>
			)} */}

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

      <VideoViewerModal
        isOpen={isVideoViewerOpen}
        onClose={() => {
          setIsVideoViewerOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onDelete={handleDeleteSuccess}
        // Navigation props
        currentIndex={currentItemIndex}
        totalItems={libraryItems.length}
        onPrevious={navigateToPrevious}
        onNext={navigateToNext}
        libraryItems={libraryItems}
      />
    </Sidebar>
  );
}

// Export with mobile detection
export default withMobileDetection(MobileLibraryPage, LibraryPage);
