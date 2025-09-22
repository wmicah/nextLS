"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Video,
  Plus,
  Search,
  Filter,
  Play,
  Eye,
  TrendingUp,
  Calendar,
  User,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  SortAsc,
  SortDesc,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileVideosPage from "./MobileVideosPage";

function VideosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"coach" | "client">("coach");
  const [sortBy, setSortBy] = useState<"date" | "client" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const {
    data: videos = [],
    isLoading: videosLoading,
    error: videosError,
  } = trpc.videos.list.useQuery();
  const {
    data: clientSubmissions = [],
    isLoading: clientSubmissionsLoading,
    error: clientSubmissionsError,
  } = trpc.clientRouter.getClientVideoSubmissions.useQuery();

  // Memoized filtered and sorted data
  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesSearch =
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || video.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [videos, searchQuery, selectedCategory]);

  const filteredClientSubmissions = useMemo(() => {
    const filtered = clientSubmissions.filter(submission => {
      const matchesSearch =
        submission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        submission.client.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    // Sort submissions
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "client":
          comparison = a.client.name.localeCompare(b.client.name);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [clientSubmissions, searchQuery, sortBy, sortOrder]);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "BULLPEN", label: "Bullpen" },
    { value: "PRACTICE", label: "Practice" },
    { value: "GAME_FOOTAGE", label: "Game Footage" },
    { value: "REFERENCE", label: "Reference" },
    { value: "COMPARISON", label: "Comparison" },
    { value: "OTHER", label: "Other" },
  ];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "Unknown";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    } else {
      return "Just now";
    }
  };

  // Loading state
  if (videosLoading || clientSubmissionsLoading) {
    return (
      <Sidebar>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#2A3133" }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: "#4A5A70" }}
            />
            <p style={{ color: "#C3BCC2" }}>Loading video library...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  // Error state
  if (videosError || clientSubmissionsError) {
    return (
      <Sidebar>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#2A3133" }}
        >
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: "#ef4444" }}
            />
            <h3 className="text-xl font-bold mb-2" style={{ color: "#C3BCC2" }}>
              Something went wrong
            </h3>
            <p className="text-sm mb-4" style={{ color: "#ABA4AA" }}>
              {activeTab === "coach"
                ? "Unable to load coach videos. Please try refreshing the page."
                : "Unable to load client submissions. Please try refreshing the page."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        {/* Hero Header */}
        <div className="mb-8">
          <div className="rounded-2xl border relative overflow-hidden group">
            <div
              className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
              }}
            />
            <div className="relative p-8 bg-gradient-to-r from-transparent via-black/20 to-black/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h1
                      className="text-4xl font-bold mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Video Feedback
                    </h1>
                    <p
                      className="flex items-center gap-2 text-lg"
                      style={{ color: "#ABA4AA" }}
                    >
                      <TrendingUp className="h-5 w-5 text-yellow-400" />
                      {activeTab === "coach"
                        ? `${videos.length} videos uploaded for review`
                        : `${clientSubmissions.length} client submissions received`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/videos/compare"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                  >
                    <Video className="w-4 h-4" />
                    <span>Compare</span>
                  </Link>
                  <Link
                    href="/videos/upload"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Video</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("coach")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === "coach"
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Coach Videos ({videos.length})
          </button>
          <button
            onClick={() => setActiveTab("client")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === "client"
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Client Submissions ({clientSubmissions.length})
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: "#ABA4AA" }}
            />
            <input
              type="text"
              placeholder={
                activeTab === "coach"
                  ? "Search videos..."
                  : "Search submissions by title, description, or client name..."
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200"
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
                color: "#C3BCC2",
                border: "1px solid",
              }}
            />
          </div>

          {activeTab === "coach" && (
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: "#ABA4AA" }}
              />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-xl text-sm transition-all duration-200 appearance-none"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                  border: "1px solid",
                }}
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "client" && (
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e =>
                    setSortBy(e.target.value as "date" | "client" | "title")
                  }
                  className="pl-4 pr-8 py-3 rounded-xl text-sm transition-all duration-200 appearance-none"
                  style={{
                    backgroundColor: "#353A3A",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                    border: "1px solid",
                  }}
                >
                  <option value="date">Sort by Date</option>
                  <option value="client">Sort by Client</option>
                  <option value="title">Sort by Title</option>
                </select>
              </div>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                  border: "1px solid",
                }}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Video Grid */}
        {activeTab === "coach" ? (
          // Coach Videos Tab
          filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <div
                className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: "#353A3A" }}
              >
                <Video className="w-12 h-12" style={{ color: "#ABA4AA" }} />
              </div>
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: "#C3BCC2" }}
              >
                {searchQuery || selectedCategory !== "all"
                  ? "No videos found"
                  : "No videos yet"}
              </h3>
              <p className="text-lg mb-8" style={{ color: "#ABA4AA" }}>
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filters"
                  : "Upload your first video to get started"}
              </p>
              {!searchQuery && selectedCategory === "all" && (
                <Link
                  href="/videos/upload"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-lg">Upload First Video</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVideos.map(video => (
                <div
                  key={video.id}
                  className="group relative rounded-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border"
                  style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#3A4040";
                    e.currentTarget.style.borderColor = "#4A5A70";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#353A3A";
                    e.currentTarget.style.borderColor = "#606364";
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                    }}
                  />

                  {/* Video Thumbnail */}
                  <div
                    className="relative aspect-video overflow-hidden"
                    style={{ backgroundColor: "#2A3133" }}
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video
                          className="w-8 h-8"
                          style={{ color: "#ABA4AA" }}
                        />
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "#4A5A70" }}
                        >
                          <Play
                            className="w-6 h-6 ml-1"
                            style={{ color: "#C3BCC2" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{ backgroundColor: "#4A5A70", color: "#ABA4AA" }}
                      >
                        {video.category}
                      </span>
                    </div>

                    {/* Duration */}
                    {video.duration && (
                      <div className="absolute bottom-3 right-3">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded"
                          style={{
                            backgroundColor: "#2A3133",
                            color: "#C3BCC2",
                          }}
                        >
                          {formatDuration(video.duration)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="relative p-4 space-y-3">
                    {/* Title */}
                    <div>
                      <h3
                        className="font-semibold text-sm line-clamp-2 group-hover:text-blue-400 transition-colors"
                        style={{ color: "#C3BCC2" }}
                      >
                        {video.title}
                      </h3>
                    </div>

                    {/* Description */}
                    {video.description && (
                      <p
                        className="text-xs line-clamp-2"
                        style={{ color: "#ABA4AA" }}
                      >
                        {video.description}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div
                      className="flex items-center justify-between text-xs"
                      style={{ color: "#ABA4AA" }}
                    >
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{video.uploader.name}</span>
                      </div>
                      <span>
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Stats */}
                    <div
                      className="flex items-center justify-between text-xs"
                      style={{ color: "#ABA4AA" }}
                    >
                      <span>{formatFileSize(video.fileSize)}</span>
                      {video.feedback && video.feedback.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{video.feedback.length} feedback</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/videos/${video.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                    >
                      <Eye className="w-4 h-4" />
                      <span>Review</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Client Submissions Tab - Completely Revamped
          <div className="space-y-4 md:space-y-6">
            {/* Mobile Stats - Horizontal Scroll */}
            <div className="md:hidden mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <div
                  className="flex-shrink-0 w-24 rounded-lg border p-2"
                  style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
                >
                  <div className="text-center">
                    <div
                      className="text-lg font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      {clientSubmissions.length}
                    </div>
                    <div className="text-xs" style={{ color: "#ABA4AA" }}>
                      Total
                    </div>
                  </div>
                </div>
                <div
                  className="flex-shrink-0 w-24 rounded-lg border p-2"
                  style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
                >
                  <div className="text-center">
                    <div
                      className="text-lg font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      {new Set(clientSubmissions.map(s => s.clientId)).size}
                    </div>
                    <div className="text-xs" style={{ color: "#ABA4AA" }}>
                      Clients
                    </div>
                  </div>
                </div>
                <div
                  className="flex-shrink-0 w-24 rounded-lg border p-2"
                  style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
                >
                  <div className="text-center">
                    <div
                      className="text-lg font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      {
                        clientSubmissions.filter(s => {
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return new Date(s.createdAt) > weekAgo;
                        }).length
                      }
                    </div>
                    <div className="text-xs" style={{ color: "#ABA4AA" }}>
                      This Week
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Summary Stats */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div
                className="p-4 rounded-xl border"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <Video className="w-5 h-5" style={{ color: "#C3BCC2" }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "#ABA4AA" }}>
                      Total Submissions
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      {clientSubmissions.length}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="p-4 rounded-xl border"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: "#10B981" }}
                  >
                    <User className="w-5 h-5" style={{ color: "#ffffff" }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "#ABA4AA" }}>
                      Active Clients
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      {new Set(clientSubmissions.map(s => s.clientId)).size}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="p-4 rounded-xl border"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: "#F59E0B" }}
                  >
                    <Clock className="w-5 h-5" style={{ color: "#ffffff" }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "#ABA4AA" }}>
                      This Week
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      {
                        clientSubmissions.filter(s => {
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return new Date(s.createdAt) > weekAgo;
                        }).length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            {filteredClientSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: "#353A3A" }}
                >
                  <Video className="w-12 h-12" style={{ color: "#ABA4AA" }} />
                </div>
                <h3
                  className="text-2xl font-bold mb-3"
                  style={{ color: "#C3BCC2" }}
                >
                  {searchQuery
                    ? "No client submissions found"
                    : "No client submissions yet"}
                </h3>
                <p className="text-lg mb-8" style={{ color: "#ABA4AA" }}>
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : "Client video submissions will appear here once they start submitting"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredClientSubmissions.map(submission => (
                  <div
                    key={submission.id}
                    className="group relative rounded-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border"
                    style={{
                      backgroundColor: "#353A3A",
                      borderColor: "#606364",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#3A4040";
                      e.currentTarget.style.borderColor = "#4A5A70";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "#353A3A";
                      e.currentTarget.style.borderColor = "#606364";
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                      style={{
                        background:
                          "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                      }}
                    />

                    {/* Video Thumbnail */}
                    <div
                      className="relative aspect-video overflow-hidden"
                      style={{ backgroundColor: "#2A3133" }}
                    >
                      {submission.thumbnail ? (
                        <img
                          src={submission.thumbnail}
                          alt={submission.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video
                            className="w-8 h-8"
                            style={{ color: "#ABA4AA" }}
                          />
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "#4A5A70" }}
                          >
                            <Play
                              className="w-6 h-6 ml-1"
                              style={{ color: "#C3BCC2" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Client Badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: "#10B981",
                            color: "#ffffff",
                          }}
                        >
                          Client
                        </span>
                      </div>

                      {/* Client Submission Badge */}
                      <div className="absolute bottom-3 right-3">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded"
                          style={{
                            backgroundColor: "#2A3133",
                            color: "#C3BCC2",
                          }}
                        >
                          Submission
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative p-4 space-y-3">
                      {/* Title */}
                      <div>
                        <h3
                          className="font-semibold text-sm line-clamp-2 group-hover:text-blue-400 transition-colors"
                          style={{ color: "#C3BCC2" }}
                        >
                          {submission.title}
                        </h3>
                      </div>

                      {/* Description */}
                      {submission.description && (
                        <p
                          className="text-xs line-clamp-2"
                          style={{ color: "#ABA4AA" }}
                        >
                          {submission.description}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div
                        className="flex items-center justify-between text-xs"
                        style={{ color: "#ABA4AA" }}
                      >
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{submission.client.name}</span>
                        </div>
                        <span>
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Stats */}
                      <div
                        className="flex items-center justify-between text-xs"
                        style={{ color: "#ABA4AA" }}
                      >
                        <span>Client Submission</span>
                        <span>{getTimeAgo(submission.createdAt)}</span>
                      </div>

                      {/* Action Button */}
                      <Link
                        href={`/videos/${submission.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105"
                        style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                      >
                        <Eye className="w-4 h-4" />
                        <span>Review</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Sidebar>
  );
}

// Export with mobile detection
export default withMobileDetection(MobileVideosPage, VideosPage);
