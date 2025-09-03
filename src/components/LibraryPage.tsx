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
} from "lucide-react";

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

export default function LibraryPage() {
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

  if (isLoading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "#4A5A70" }}
          />
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
      {/* Hero Header */}
      <div className="relative mb-12">
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/40" />
        </div>

        <div
          className="relative p-8 rounded-2xl border"
          style={{ borderColor: "#606364" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <BookOpen className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                </div>
                <div>
                  <h1
                    className="text-4xl font-bold mb-2"
                    style={{ color: "#C3BCC2" }}
                  >
                    Training Library
                  </h1>
                  <p
                    className="flex items-center gap-2"
                    style={{ color: "#ABA4AA" }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Access professional training resources and drills, or you
                    may upload your own.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div
                className="text-4xl font-bold mb-1"
                style={{ color: "#C3BCC2" }}
              >
                {stats?.total || 0}
              </div>
              <div className="text-sm" style={{ color: "#ABA4AA" }}>
                Resources Available
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div
          className="rounded-xl p-6 transform hover:scale-105 transition-all duration-300 shadow-xl border relative overflow-hidden group"
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div
            className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
            }}
          />
          <div className="relative flex items-center justify-between">
            <div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "#ABA4AA" }}
              >
                Total Resources
              </p>
              <p
                className="text-3xl font-bold mb-1"
                style={{ color: "#C3BCC2" }}
              >
                {stats?.total || 0}
              </p>
              <p className="text-xs" style={{ color: "#ABA4AA" }}>
                Videos & Documents
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <BookOpen className="h-6 w-6" style={{ color: "#C3BCC2" }} />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-6 transform hover:scale-105 transition-all duration-300 shadow-xl border relative overflow-hidden group"
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div
            className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
            }}
          />
          <div className="relative flex items-center justify-between">
            <div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "#ABA4AA" }}
              >
                Video Content
              </p>
              <p
                className="text-3xl font-bold mb-1"
                style={{ color: "#C3BCC2" }}
              >
                {stats?.videos || 0}
              </p>
              <p className="text-xs" style={{ color: "#ABA4AA" }}>
                Training Videos
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#DC2626" }}
            >
              <Video className="h-6 w-6" style={{ color: "#C3BCC2" }} />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-6 transform hover:scale-105 transition-all duration-300 shadow-xl border relative overflow-hidden group"
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div
            className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            }}
          />
          <div className="relative flex items-center justify-between">
            <div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "#ABA4AA" }}
              >
                Documents
              </p>
              <p
                className="text-3xl font-bold mb-1"
                style={{ color: "#C3BCC2" }}
              >
                {stats?.documents || 0}
              </p>
              <p className="text-xs" style={{ color: "#ABA4AA" }}>
                Guides & Plans
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#10B981" }}
            >
              <FileText className="h-6 w-6" style={{ color: "#C3BCC2" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div
        className="rounded-xl p-6 mb-8 shadow-xl border relative overflow-hidden"
        style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
          }}
        />
        <div className="relative flex flex-col lg:flex-row gap-6 items-center justify-center lg:justify-between">
          {/* Search */}
          <div className="relative w-full lg:flex-1 lg:max-w-md">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
              style={{ color: "#606364" }}
            />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-300"
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center justify-center lg:justify-end w-full lg:w-auto">
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: "#606364" }}
              />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-300 appearance-none min-w-[140px]"
                style={{
                  backgroundColor: "#606364",
                  borderColor: "#ABA4AA",
                  color: "#C3BCC2",
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="flex rounded-xl border overflow-hidden"
              style={{ borderColor: "#606364" }}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-3 transition-all duration-300 flex items-center gap-2 ${
                  viewMode === "grid" ? "font-medium" : ""
                }`}
                style={{
                  backgroundColor:
                    viewMode === "grid" ? "#4A5A70" : "transparent",
                  color: "#C3BCC2",
                }}
              >
                <Grid3X3 className="h-4 w-4" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-3 transition-all duration-300 flex items-center gap-2 ${
                  viewMode === "list" ? "font-medium" : ""
                }`}
                style={{
                  backgroundColor:
                    viewMode === "list" ? "#4A5A70" : "transparent",
                  color: "#C3BCC2",
                }}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Library Tabs */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-[#1A1D1E] rounded-lg p-1 border border-[#4A5A70]">
          <button
            onClick={() => setActiveTab("master")}
            className={`flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-200 font-medium ${
              activeTab === "master"
                ? "bg-[#4A5A70] text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-[#2D3748]"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Master Library
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-200 font-medium ${
              activeTab === "local"
                ? "bg-[#4A5A70] text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-[#2D3748]"
            }`}
          >
            <Video className="h-4 w-4" />
            Local Library
          </button>
        </div>

        {/* Tab Description */}
        <div className="mt-4 p-4 rounded-lg border border-[#4A5A70] bg-[#1A1D1E]">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              {activeTab === "master" ? (
                <BookOpen className="h-4 w-4 text-white" />
              ) : (
                <Video className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">
                {activeTab === "master" ? "Master Library" : "Local Library"}
              </h3>
              <p className="text-sm text-gray-400">
                {activeTab === "master"
                  ? "Access to the centralized training video library managed by administrators. These videos contain sensitive training content and are available to all coaches."
                  : "Your personal collection of training videos, documents, and imported YouTube content. You can upload, import, and manage your own resources here."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#C3BCC2" }}>
            {activeTab === "master" ? "Master Library" : "Local Library"}
          </h2>
          <p style={{ color: "#ABA4AA" }}>
            {libraryItems.length}{" "}
            {libraryItems.length === 1 ? "resource" : "resources"} found
          </p>
        </div>

        <div className="flex gap-3">
          {activeTab === "local" && (
            <>
              <button
                onClick={() => setIsYouTubeModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                style={{ backgroundColor: "#DC2626", color: "#C3BCC2" }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#B91C1C";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#DC2626";
                }}
              >
                <Video className="h-5 w-5" />
                Import YouTube
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#606364";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#4A5A70";
                }}
              >
                <Plus className="h-5 w-5" />
                Upload Resource
              </button>
            </>
          )}
          {activeTab === "master" && (
            <div className="text-sm text-gray-400 px-4 py-2">
              Master Library content is managed by administrators
            </div>
          )}
        </div>
      </div>

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
              <BookOpen className="h-10 w-10" style={{ color: "#C3BCC2" }} />
            </div>
            <h3
              className="text-2xl font-bold mb-3"
              style={{ color: "#C3BCC2" }}
            >
              No resources found
            </h3>
            <p
              className="text-center mb-8 max-w-md"
              style={{ color: "#ABA4AA" }}
            >
              {searchTerm || selectedCategory !== "All"
                ? "Try adjusting your search terms or filters"
                : activeTab === "master"
                ? "Master Library is empty. Contact an administrator to add training resources."
                : "Start building your library by uploading your first resource or importing from YouTube"}
            </p>
            <div className="flex gap-3 justify-center">
              {activeTab === "local" && (
                <>
                  <button
                    onClick={() => setIsYouTubeModalOpen(true)}
                    className="px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                    style={{ backgroundColor: "#DC2626", color: "#C3BCC2" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#B91C1C";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "#DC2626";
                    }}
                  >
                    Import from YouTube
                  </button>
                  <button
                    onClick={() => {
                      if (searchTerm || selectedCategory !== "All") {
                        setSearchTerm("");
                        setSelectedCategory("All");
                      } else {
                        setIsUploadModalOpen(true);
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
                      : "Upload First Resource"}
                  </button>
                </>
              )}
              {activeTab === "master" && (
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
                    : "Contact Admin"}
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
                  key={item.id}
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
                  key={item.id}
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
      />
    </Sidebar>
  );
}
