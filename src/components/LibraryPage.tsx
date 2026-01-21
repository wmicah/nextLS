"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
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
import Sidebar from "./Sidebar";
import { VideoThumbnail } from "./VideoThumbnail";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileLibraryPage from "./MobileLibraryPage";
import CategoryDropdown from "./ui/CategoryDropdown";
import { LoadingState, DataLoadingState } from "@/components/LoadingState";
import { SkeletonVideoGrid, SkeletonCard } from "@/components/SkeletonLoader";
import { COLORS } from "@/lib/colors";

// Lazy load modals - only loaded when user interacts
const ModalLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
  </div>
);
const YouTubeImportModal = dynamic(() => import("./YouTubeImportModal"), {
  loading: ModalLoader,
  ssr: false,
});
const UploadResourceModal = dynamic(() => import("./UploadResourceModal"), {
  loading: ModalLoader,
  ssr: false,
});
const VideoViewerModal = dynamic(() => import("./VideoViewerModal"), {
  loading: ModalLoader,
  ssr: false,
});

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
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const videoIdParam = searchParams?.get("videoId");
  const [activeTab, setActiveTab] = useState<"master" | "local">(
    tabParam === "master" ? "master" : "local"
  );
  
  // Update active tab when URL param changes
  useEffect(() => {
    if (tabParam === "master") {
      setActiveTab("master");
    }
  }, [tabParam]);
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
    isFetching: masterFetching,
  } = trpc.admin.getMasterLibrary.useQuery(
    {
      search: debouncedSearchTerm.trim() || undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
      page: masterCurrentPage,
      limit: 24, // Load 24 items per page
    },
    {
      enabled: activeTab === "master", // Only fetch when master tab is active
      staleTime: 0, // Always refetch when search/filter changes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: true, // Refetch on mount to ensure fresh data
    }
  );

  const {
    data: localLibraryItems,
    isLoading: localLoading,
    error: localError,
    refetch: refetchLocal,
    isFetching: localFetching,
  } = trpc.library.list.useQuery(
    {
      search: debouncedSearchTerm.trim() || undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
      page: localCurrentPage,
      limit: 24, // Load 24 items per page
    },
    {
      enabled: activeTab === "local", // Only fetch when local tab is active
      staleTime: 0, // Always refetch when search/filter changes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: true, // Refetch on mount to ensure fresh data
    }
  );

  // Handle master library data - ensure it always updates when data arrives
  useEffect(() => {
    // Only update when we have data and we're not currently fetching
    if (masterLibraryItems && !masterFetching) {
      if (masterLibraryItems.items) {
        if (masterCurrentPage === 1) {
          // Always set items on page 1, even if empty array
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
        setMasterHasMore(hasNextPage);
      }
    }
  }, [masterLibraryItems, masterCurrentPage, masterFetching]);

  // Handle opening specific video from URL parameter
  useEffect(() => {
    if (videoIdParam && activeTab === "master") {
      // Wait for master items to load
      if (masterItems.length > 0) {
        const videoItem = masterItems.find((item: any) => item.id === videoIdParam);
        if (videoItem) {
          const itemIndex = masterItems.findIndex((item: any) => item.id === videoIdParam);
          setCurrentItemIndex(itemIndex);
          setSelectedItem(videoItem);
          setIsVideoViewerOpen(true);
          // Clean up URL parameter
          window.history.replaceState({}, "", "/library?tab=master");
        }
      } else if (!masterLoading && masterItems.length === 0) {
        // If items loaded but video not found, clean up URL
        window.history.replaceState({}, "", "/library?tab=master");
      }
    }
  }, [videoIdParam, activeTab, masterItems, masterLoading]);

  // Handle local library data - ensure it always updates when data arrives
  useEffect(() => {
    // Only update when we have data and we're not currently fetching
    if (localLibraryItems && !localFetching) {
      if (localLibraryItems.items) {
        if (localCurrentPage === 1) {
          // Always set items on page 1, even if empty array
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
        setLocalHasMore(hasNextPage);
      }
    }
  }, [localLibraryItems, localCurrentPage, localFetching]);

  // Ensure state syncs when queries return data - handles search/filter changes
  useEffect(() => {
    if (activeTab === "master" && masterLibraryItems && !masterFetching) {
      if (masterCurrentPage === 1 && masterLibraryItems.items) {
        setMasterItems(masterLibraryItems.items);
        setMasterHasMore(masterLibraryItems.pagination?.hasNextPage || false);
      }
    } else if (activeTab === "local" && localLibraryItems && !localFetching) {
      if (localCurrentPage === 1 && localLibraryItems.items) {
        setLocalItems(localLibraryItems.items);
        setLocalHasMore(localLibraryItems.pagination?.hasNextPage || false);
      }
    }
  }, [
    activeTab,
    masterLibraryItems,
    localLibraryItems,
    masterCurrentPage,
    localCurrentPage,
    masterFetching,
    localFetching,
    debouncedSearchTerm,
    selectedCategory,
  ]);

  // Reset pagination state on mount to ensure fresh start
  useEffect(() => {
    // Reset to page 1 and clear items when component first mounts
    setMasterCurrentPage(1);
    setLocalCurrentPage(1);
    setMasterItems([]);
    setLocalItems([]);
    setMasterHasMore(true);
    setLocalHasMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Reset items when search/category changes (but not on initial mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Skip reset on initial mount
    }
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

  // Track if this is the very first mount (not a search/filter change)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (libraryItems.length > 0) {
      isFirstMount.current = false;
    }
  }, [libraryItems.length]);

  // Only show full page loading on very first mount with no data
  const isInitialLoading = isFirstMount.current && isLoading && libraryItems.length === 0;

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

  // Show error inline, not blocking the entire page
  const showError = error && libraryItems.length === 0 && !isLoading;

  return (
    <Sidebar>
      {/* Header with Golden Bar Indicator */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div>
              <h1
                className="text-lg font-semibold pl-2"
                style={{
                  color: COLORS.TEXT_PRIMARY,
                  borderLeft: `3px solid ${COLORS.GOLDEN_ACCENT}`,
                }}
              >
                Training Library
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                color: COLORS.TEXT_SECONDARY,
                border: `1px solid ${COLORS.BORDER_SUBTLE}`,
              }}
            >
              {libraryItems.length}{" "}
              {libraryItems.length === 1 ? "Resource" : "Resources"}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div
        className="rounded-lg p-3 mb-4 shadow-lg border"
        style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}
      >
        <div className="flex gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5"
              style={{ color: COLORS.TEXT_SECONDARY }}
            />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => {
                // Prevent form submission on Enter key
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border text-xs focus:outline-none transition-all duration-300"
              style={{
                backgroundColor: COLORS.BACKGROUND_DARK,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
            />
          </div>

          {/* Filters - Right Side */}
          <div className="flex gap-1.5 items-center flex-shrink-0">
            <CategoryDropdown
              value={selectedCategory}
              onChange={setSelectedCategory}
              standardCategories={DEFAULT_CATEGORIES}
              customCategories={userCategoriesData.filter(
                cat => !DEFAULT_CATEGORIES.includes(cat.name)
              )}
              style={{
                backgroundColor: COLORS.BACKGROUND_DARK,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
            />

            <div
              className="flex rounded-md border overflow-hidden"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`px-2 py-1.5 transition-all duration-300 flex items-center gap-1 text-xs ${
                  viewMode === "grid" ? "font-medium" : ""
                }`}
                style={{
                  backgroundColor:
                    viewMode === "grid" ? COLORS.GOLDEN_DARK : "transparent",
                  color: viewMode === "grid" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                }}
                onMouseEnter={e => {
                  if (viewMode !== "grid") {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  }
                }}
                onMouseLeave={e => {
                  if (viewMode !== "grid") {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-2 py-1.5 transition-all duration-300 flex items-center gap-1 text-xs ${
                  viewMode === "list" ? "font-medium" : ""
                }`}
                style={{
                  backgroundColor:
                    viewMode === "list" ? COLORS.GOLDEN_DARK : "transparent",
                  color: viewMode === "list" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                }}
                onMouseEnter={e => {
                  if (viewMode !== "list") {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  }
                }}
                onMouseLeave={e => {
                  if (viewMode !== "list") {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <List className="h-3.5 w-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Actions Combined */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 rounded-lg p-2.5 border"
          style={{ 
            backgroundColor: COLORS.BACKGROUND_DARK, 
            borderColor: COLORS.BORDER_SUBTLE 
          }}
        >
          {/* Left: Tabs */}
          <div className="flex gap-1.5">
            <button
              onClick={() => handleTabChange("master")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                activeTab === "master" ? "" : ""
              }`}
              style={{
                backgroundColor: activeTab === "master" ? COLORS.GOLDEN_DARK : "transparent",
                color: activeTab === "master" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
              }}
              onMouseEnter={e => {
                if (activeTab !== "master") {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
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
              <BookOpen className="h-3.5 w-3.5" />
              <span>Shared</span>
            </button>
            <button
              onClick={() => handleTabChange("local")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                activeTab === "local" ? "" : ""
              }`}
              style={{
                backgroundColor: activeTab === "local" ? COLORS.GOLDEN_DARK : "transparent",
                color: activeTab === "local" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
              }}
              onMouseEnter={e => {
                if (activeTab !== "local") {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
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
              <Video className="h-3.5 w-3.5" />
              <span>My Library</span>
            </button>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex gap-1.5">
            {activeTab === "local" ? (
              <>
                <button
                  onClick={() => setIsYouTubeModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 text-xs font-medium"
                  style={{ backgroundColor: COLORS.RED_ALERT, color: "#FFFFFF" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = COLORS.RED_DARK;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.RED_ALERT;
                  }}
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Import YouTube</span>
                </button>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 text-xs font-medium"
                  style={{ backgroundColor: COLORS.GOLDEN_DARK, color: COLORS.TEXT_PRIMARY }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Upload</span>
                </button>
              </>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_SECONDARY,
                }}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Read-only</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_MUTED }}
                >
                  Admin Only
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Resource Count */}
        <div className="mt-2 px-1">
          <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
            {libraryItems.length}{" "}
            {libraryItems.length === 1 ? "resource" : "resources"} found
          </p>
        </div>
      </div>

      {/* Permission Guidance */}
      {activeTab === "master" && (
        <div
          className="mb-4 p-3 rounded-lg border"
          style={{
            backgroundColor: COLORS.BACKGROUND_CARD,
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" style={{ color: COLORS.GOLDEN_ACCENT }} />
            <div>
              <h4
                className="font-semibold text-xs"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Shared Library Access
              </h4>
              <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                You can view and assign these resources to clients, but only
                administrators can add or modify them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State - Show when not loading and no items (regardless of search/filter) */}
      {!isLoading && libraryItems.length === 0 && !showError && (
        <div
          className="flex flex-col items-center justify-center h-64 rounded-lg shadow-sm border relative overflow-hidden"
          style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="relative text-center">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
            >
              {activeTab === "master" ? (
                <BookOpen className="h-8 w-8" style={{ color: COLORS.GOLDEN_ACCENT }} />
              ) : (
                <Video className="h-8 w-8" style={{ color: COLORS.GOLDEN_ACCENT }} />
              )}
            </div>
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {searchTerm || selectedCategory !== "All"
                ? "No resources found"
                : activeTab === "master"
                ? "Shared Library is Empty"
                : "Start Building Your Library"}
            </h3>
            <p
              className="text-center mb-6 max-w-md text-xs"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              {searchTerm || selectedCategory !== "All"
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : activeTab === "master"
                ? "The shared library doesn't have any resources yet. Contact your administrator to add training resources that everyone can access."
                : "Upload your first training resource or import from YouTube to start building your personal library."}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {activeTab === "local" && (
                <>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium"
                    style={{ backgroundColor: COLORS.GOLDEN_DARK, color: COLORS.TEXT_PRIMARY }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                    }}
                  >
                    Upload Video
                  </button>
                  <button
                    onClick={() => setIsYouTubeModalOpen(true)}
                    className="px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium"
                    style={{ backgroundColor: COLORS.RED_ALERT, color: "#FFFFFF" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = COLORS.RED_DARK;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = COLORS.RED_ALERT;
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
                  className="px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium"
                  style={{ 
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    color: COLORS.TEXT_SECONDARY,
                    border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
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

      {/* Error Display - Inline */}
      {showError && (
        <div className="mb-4 p-4 rounded-lg border" style={{ 
          backgroundColor: COLORS.BACKGROUND_CARD, 
          borderColor: COLORS.RED_ALERT 
        }}>
          <p style={{ color: COLORS.RED_ALERT }}>
            Error loading library: {error?.message || "Unknown error"}
          </p>
        </div>
      )}

      {/* Enhanced Library Grid/List */}
      {isLoading && libraryItems.length === 0 && !isInitialLoading ? (
        // Show skeleton when loading and no items
        <div className="w-full">
          {viewMode === "grid" ? (
            <SkeletonVideoGrid />
          ) : (
            <div className="space-y-2.5">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
        </div>
      ) : libraryItems.length > 0 ? (
        // Show items when we have them
        <div className="w-full">
          {/* Show loading overlay when searching with existing items */}
          {isLoading && (
            <div className="mb-4 p-3 rounded-lg border flex items-center gap-2" style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.GOLDEN_BORDER,
            }}>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: COLORS.GOLDEN_ACCENT }}></div>
              <span className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                Searching...
              </span>
            </div>
          )}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 w-full">
              {libraryItems.map((item: any, index: number) => (
                <div
                  key={`${item.id}-${index}`}
                  className="rounded-lg shadow-sm border transition-all duration-200 cursor-pointer relative overflow-hidden group w-full h-full"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                    animationDelay: index * 50 + "ms",
                  }}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="relative">
                    <div
                      className="h-24 rounded-t-lg overflow-hidden relative"
                      style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                    >
                      <VideoThumbnail
                        item={item}
                        videoType={activeTab === "master" ? "master" : "local"}
                      />

                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                          style={{
                            backgroundColor: COLORS.GOLDEN_ACCENT,
                            border: `2px solid ${COLORS.BACKGROUND_DARK}`,
                          }}
                        >
                          <Play
                            className="h-5 w-5 ml-0.5"
                            style={{ color: COLORS.BACKGROUND_DARK }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-bold rounded-full border"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_DARK,
                            color: COLORS.TEXT_SECONDARY,
                            borderColor: COLORS.BORDER_SUBTLE,
                          }}
                        >
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.isYoutube ? (
                            <Video className="h-3 w-3" style={{ color: COLORS.RED_ALERT }} />
                          ) : item.type === "video" ? (
                            <Video
                              className="h-3 w-3"
                              style={{ color: COLORS.TEXT_SECONDARY }}
                            />
                          ) : (
                            <FileText
                              className="h-3 w-3"
                              style={{ color: COLORS.TEXT_SECONDARY }}
                            />
                          )}
                          {item.duration && (
                            <span
                              style={{ color: COLORS.TEXT_MUTED }}
                              className="text-[10px]"
                            >
                              {item.duration}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3
                        className="text-xs font-bold mb-1 line-clamp-1"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {item.title}
                      </h3>

                      <p
                        className="text-[10px] mb-2 line-clamp-2"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5 max-w-6xl mx-auto">
              {libraryItems.map((item: any, index: number) => (
                <div
                  key={`${item.id}-${index}`}
                  className="rounded-lg shadow-sm p-4 border transition-all duration-200 cursor-pointer relative overflow-hidden group w-full"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                    animationDelay: index * 30 + "ms",
                  }}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    e.currentTarget.style.transform = "translateX(2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="relative flex items-center gap-3">
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative border"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        borderColor: COLORS.BORDER_SUBTLE,
                      }}
                    >
                      <VideoThumbnail
                        item={item}
                        videoType={activeTab === "master" ? "master" : "local"}
                        className="w-16 h-16"
                      />

                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border"
                          style={{
                            backgroundColor: COLORS.GOLDEN_ACCENT,
                            borderColor: COLORS.BACKGROUND_DARK,
                          }}
                        >
                          <Play
                            className="h-4 w-4 ml-0.5"
                            style={{ color: COLORS.BACKGROUND_DARK }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span
                          className="px-2 py-0.5 text-[10px] font-bold rounded-full border"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_DARK,
                            color: COLORS.TEXT_SECONDARY,
                            borderColor: COLORS.BORDER_SUBTLE,
                          }}
                        >
                          {item.category}
                        </span>

                        {item.isYoutube && (
                          <span
                            className="px-1.5 py-0.5 text-[10px] rounded-full"
                            style={{
                              backgroundColor: COLORS.RED_ALERT,
                              color: "#FFFFFF",
                            }}
                          >
                            YouTube
                          </span>
                        )}
                      </div>

                      <h3
                        className="text-sm font-bold mb-1 line-clamp-1"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {item.title}
                      </h3>

                      <p
                        className="text-xs mb-2 line-clamp-1"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        {item.description}
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {item.isYoutube ? (
                            <Video className="h-3 w-3" style={{ color: COLORS.RED_ALERT }} />
                          ) : item.type === "video" ? (
                            <Video
                              className="h-3 w-3"
                              style={{ color: COLORS.TEXT_SECONDARY }}
                            />
                          ) : (
                            <FileText
                              className="h-3 w-3"
                              style={{ color: COLORS.TEXT_SECONDARY }}
                            />
                          )}
                          {item.duration && (
                            <span
                              style={{ color: COLORS.TEXT_MUTED }}
                              className="text-[10px]"
                            >
                              {item.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (item.isYoutube && item.youtubeId) {
                            window.open(item.url, "_blank");
                          } else {
                            window.open(item.url, "_blank");
                          }
                        }}
                        className="p-2 rounded-md transition-all duration-300 border"
                        style={{
                          backgroundColor: "transparent",
                          color: COLORS.TEXT_SECONDARY,
                          borderColor: COLORS.BORDER_SUBTLE,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                          e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                          e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                          e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                        }}
                      >
                        {item.isYoutube || item.type === "video" ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
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
            <div className="mt-4 text-center">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="text-xs transition-all duration-200 hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed underline decoration-dotted underline-offset-4"
                style={{
                  color: COLORS.TEXT_SECONDARY,
                }}
              >
                {isLoadingMore ? "Loading more..." : "Load more"}
              </button>
            </div>
          )}

          {/* Auto-loading indicator */}
          {isLoadingMore && (
            <div className="mt-3 text-center">
              <div
                className="inline-flex items-center gap-2 text-xs"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                Loading more content...
              </div>
            </div>
          )}

          {/* End of results indicator */}
          {!hasMore && libraryItems.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                You've reached the end of the results
              </p>
            </div>
          )}
        </div>
      ) : null}

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
