"use client"

import { useState } from "react"
import { trpc } from "@/app/_trpc/client"
import {
  Search,
  Play,
  Star,
  BookOpen,
  Video,
  FileText,
  Download,
  Eye,
  Plus,
} from "lucide-react"

import YouTubePlayer from "./YouTubePlayer"
import YouTubeImportModal from "./YouTubeImportModal"
import UploadResourceModal from "./UploadResourceModal"
import VideoViewerModal from "./VideoViewerModal"
import Sidebar from "./Sidebar"

const categories = [
  "All",
  "Batting",
  "Pitching",
  "Defense",
  "Base Running",
  "Mental",
  "Conditioning",
]
const difficulties = [
  "All",
  "Beginner",
  "Intermediate",
  "Advanced",
  "All Levels",
]

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false)

  const handleItemClick = (item: any) => {
    setSelectedItem(item)
    setIsVideoViewerOpen(true)
  }

  // Use tRPC queries with refetch
  const {
    data: libraryItems = [],
    isLoading,
    error,
    refetch,
  } = trpc.library.list.useQuery({
    search: searchTerm || undefined,
    category: selectedCategory !== "All" ? selectedCategory : undefined,
    difficulty: selectedDifficulty !== "All" ? selectedDifficulty : undefined,
  })

  const { data: stats, refetch: refetchStats } =
    trpc.library.getStats.useQuery()

  // Handle delete success
  const handleDeleteSuccess = () => {
    setIsVideoViewerOpen(false)
    setSelectedItem(null)
    refetch() // Refresh library items
    refetchStats() // Refresh stats
  }

  // Handle upload/import success
  const handleUploadSuccess = () => {
    refetch() // Refresh library items
    refetchStats() // Refresh stats
  }

  if (isLoading) {
    return (
      <Sidebar>
        <div className='flex items-center justify-center h-64'>
          <div
            className='animate-spin rounded-full h-8 w-8 border-b-2'
            style={{ borderColor: "#4A5A70" }}
          ></div>
        </div>
      </Sidebar>
    )
  }

  if (error) {
    return (
      <Sidebar>
        <div className='flex items-center justify-center h-64'>
          <p className='text-red-400'>Error loading library: {error.message}</p>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1
              className='text-4xl font-bold mb-2'
              style={{ color: "#C3BCC2" }}
            >
              Training Library
            </h1>
            <p
              className='flex items-center gap-2'
              style={{ color: "#ABA4AA" }}
            >
              <BookOpen className='h-4 w-4' />
              Access professional training resources and drills
            </p>
          </div>
          <div className='text-right'>
            <div
              className='text-2xl font-bold'
              style={{ color: "#C3BCC2" }}
            >
              {stats?.totalResources || 0}
            </div>
            <div
              className='text-sm'
              style={{ color: "#ABA4AA" }}
            >
              Resources Available
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <div
          className='rounded-lg p-6 transform hover:scale-105 transition-all duration-300 shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p
                className='text-sm font-medium'
                style={{ color: "#ABA4AA" }}
              >
                Total Resources
              </p>
              <p
                className='text-3xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                {stats?.totalResources || 0}
              </p>
              <p
                className='text-xs mt-1'
                style={{ color: "#ABA4AA" }}
              >
                Videos & Documents
              </p>
            </div>
            <BookOpen
              className='h-12 w-12'
              style={{ color: "#FFFFFF" }}
            />
          </div>
        </div>

        <div
          className='rounded-lg p-6 transform hover:scale-105 transition-all duration-300 shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p
                className='text-sm font-medium'
                style={{ color: "#ABA4AA" }}
              >
                Video Content
              </p>
              <p
                className='text-3xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                {stats?.videoCount || 0}
              </p>
              <p
                className='text-xs mt-1'
                style={{ color: "#ABA4AA" }}
              >
                Training Videos
              </p>
            </div>
            <Video
              className='h-12 w-12'
              style={{ color: "#FFFFFF" }}
            />
          </div>
        </div>

        <div
          className='rounded-lg p-6 transform hover:scale-105 transition-all duration-300 shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p
                className='text-sm font-medium'
                style={{ color: "#ABA4AA" }}
              >
                Documents
              </p>
              <p
                className='text-3xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                {stats?.documentCount || 0}
              </p>
              <p
                className='text-xs mt-1'
                style={{ color: "#ABA4AA" }}
              >
                Guides & Plans
              </p>
            </div>
            <FileText
              className='h-12 w-12'
              style={{ color: "#FFFFFF" }}
            />
          </div>
        </div>

        <div
          className='rounded-lg p-6 transform hover:scale-105 transition-all duration-300 shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p
                className='text-sm font-medium'
                style={{ color: "#ABA4AA" }}
              >
                Avg Rating
              </p>
              <p
                className='text-3xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                {stats?.avgRating?.toFixed(1) || "0.0"}
              </p>
              <p
                className='text-xs mt-1'
                style={{ color: "#ABA4AA" }}
              >
                User Rating
              </p>
            </div>
            <Star
              className='h-12 w-12'
              style={{ color: "#FFFFFF" }}
            />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div
        className='rounded-lg p-6 mb-8 shadow-lg border'
        style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
      >
        <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
          {/* Search */}
          <div className='relative flex-1 max-w-md'>
            <Search
              className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4'
              style={{ color: "#606364" }}
            />
            <input
              type='text'
              placeholder='Search resources...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition'
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            />
          </div>

          {/* Filters */}
          <div className='flex gap-4 items-center'>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className='px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition'
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className='px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition'
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            >
              {difficulties.map((difficulty) => (
                <option
                  key={difficulty}
                  value={difficulty}
                >
                  {difficulty}
                </option>
              ))}
            </select>

            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className='px-4 py-2 rounded-lg border transition-all duration-300 transform hover:scale-105 font-medium'
              style={{
                backgroundColor: "#4A5A70",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#606364"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#4A5A70"
              }}
            >
              {viewMode === "grid" ? "List View" : "Grid View"}
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2
            className='text-2xl font-bold'
            style={{ color: "#C3BCC2" }}
          >
            Training Resources
          </h2>
          <p style={{ color: "#ABA4AA" }}>
            {libraryItems.length}{" "}
            {libraryItems.length === 1 ? "resource" : "resources"} found
          </p>
        </div>

        <div className='flex gap-2'>
          <button
            onClick={() => setIsYouTubeModalOpen(true)}
            className='flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg font-medium'
            style={{ backgroundColor: "#DC2626", color: "#C3BCC2" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#B91C1C"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#DC2626"
            }}
          >
            <Video className='h-5 w-5' />
            Import YouTube
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className='flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg font-medium'
            style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#606364"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4A5A70"
            }}
          >
            <Plus className='h-5 w-5' />
            Upload Resource
          </button>
        </div>
      </div>

      {/* Empty State */}
      {libraryItems.length === 0 && (
        <div
          className='flex flex-col items-center justify-center h-64 rounded-lg shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <BookOpen
            className='h-16 w-16 mb-4'
            style={{ color: "#606364" }}
          />
          <h3
            className='text-xl font-bold mb-2'
            style={{ color: "#C3BCC2" }}
          >
            No resources found
          </h3>
          <p
            className='text-center mb-4'
            style={{ color: "#ABA4AA" }}
          >
            {searchTerm ||
            selectedCategory !== "All" ||
            selectedDifficulty !== "All"
              ? "Try adjusting your search terms or filters"
              : "Start building your library by uploading your first resource or importing from YouTube"}
          </p>
          <div className='flex gap-2'>
            <button
              onClick={() => setIsYouTubeModalOpen(true)}
              className='px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg font-medium'
              style={{ backgroundColor: "#DC2626", color: "#C3BCC2" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#B91C1C"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#DC2626"
              }}
            >
              Import from YouTube
            </button>
            <button
              onClick={() => {
                if (
                  searchTerm ||
                  selectedCategory !== "All" ||
                  selectedDifficulty !== "All"
                ) {
                  setSearchTerm("")
                  setSelectedCategory("All")
                  setSelectedDifficulty("All")
                } else {
                  setIsUploadModalOpen(true)
                }
              }}
              className='px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg font-medium'
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#606364"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#4A5A70"
              }}
            >
              {searchTerm ||
              selectedCategory !== "All" ||
              selectedDifficulty !== "All"
                ? "Clear Filters"
                : "Upload First Resource"}
            </button>
          </div>
        </div>
      )}

      {/* Library Grid/List */}
      {libraryItems.length > 0 &&
        (viewMode === "grid" ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {libraryItems.map((item: any) => (
              <div
                key={item.id}
                className='rounded-lg shadow-lg border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer'
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                }}
                onClick={() => handleItemClick(item)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#606364"
                  e.currentTarget.style.borderColor = "#ABA4AA"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#353A3A"
                  e.currentTarget.style.borderColor = "#606364"
                }}
              >
                <div
                  className='h-48 rounded-t-lg flex items-center justify-center overflow-hidden'
                  style={{ backgroundColor: "#606364" }}
                >
                  {item.isYoutube && item.youtubeId ? (
                    <YouTubePlayer
                      videoId={item.youtubeId}
                      title={item.title}
                      width='100%'
                      height='192'
                    />
                  ) : item.thumbnail &&
                    item.thumbnail.startsWith("data:image") ? (
                    // Display generated thumbnail
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    // Fallback to emoji
                    <div className='text-6xl'>
                      {item.thumbnail || (item.type === "video" ? "🎥" : "📄")}
                    </div>
                  )}
                </div>
                <div className='p-6'>
                  <div className='flex items-center justify-between mb-2'>
                    <span
                      className='px-2 py-1 text-xs font-medium rounded-full'
                      style={{
                        backgroundColor: "#4A5A70",
                        color: "#C3BCC2",
                      }}
                    >
                      {item.category}
                    </span>
                    <div className='flex items-center gap-1'>
                      {item.isYoutube ? (
                        <Video className='h-4 w-4 text-red-500' />
                      ) : item.type === "video" ? (
                        <Video
                          className='h-4 w-4'
                          style={{ color: "#ABA4AA" }}
                        />
                      ) : (
                        <FileText
                          className='h-4 w-4'
                          style={{ color: "#ABA4AA" }}
                        />
                      )}
                      {item.duration && (
                        <span
                          style={{ color: "#ABA4AA" }}
                          className='text-sm'
                        >
                          {item.duration}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3
                    className='text-lg font-bold mb-2'
                    style={{ color: "#C3BCC2" }}
                  >
                    {item.title}
                  </h3>

                  <p
                    className='text-sm mb-4 line-clamp-2'
                    style={{ color: "#ABA4AA" }}
                  >
                    {item.description}
                  </p>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Star className='h-4 w-4 text-yellow-400' />
                      <span
                        style={{ color: "#C3BCC2" }}
                        className='text-sm font-medium'
                      >
                        {item.rating || 0}
                      </span>
                      <span
                        style={{ color: "#606364" }}
                        className='text-sm'
                      >
                        ({item.views || 0} views)
                      </span>
                    </div>

                    <div className='flex gap-2'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (item.isYoutube && item.youtubeId) {
                            window.open(item.url, "_blank")
                          } else {
                            window.open(item.url, "_blank")
                          }
                        }}
                        className='p-2 rounded-lg transition-all duration-300 transform hover:scale-110'
                        style={{ color: "#ABA4AA" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#C3BCC2"
                          e.currentTarget.style.backgroundColor = "#606364"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#ABA4AA"
                          e.currentTarget.style.backgroundColor = "transparent"
                        }}
                      >
                        <Eye className='h-4 w-4' />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='space-y-4'>
            {libraryItems.map((item: any) => (
              <div
                key={item.id}
                className='rounded-lg shadow-lg p-6 border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer'
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                }}
                onClick={() => handleItemClick(item)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#606364"
                  e.currentTarget.style.borderColor = "#ABA4AA"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#353A3A"
                  e.currentTarget.style.borderColor = "#606364"
                }}
              >
                <div className='flex items-center gap-6'>
                  <div
                    className='w-20 h-20 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden'
                    style={{ backgroundColor: "#606364" }}
                  >
                    {item.isYoutube && item.youtubeId ? (
                      <YouTubePlayer
                        videoId={item.youtubeId}
                        title={item.title}
                        width='80'
                        height='80'
                      />
                    ) : (
                      <div>
                        {item.thumbnail ||
                          (item.type === "video" ? "🎥" : "📄")}
                      </div>
                    )}
                  </div>

                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <span
                        className='px-2 py-1 text-xs font-medium rounded-full'
                        style={{
                          backgroundColor: "#4A5A70",
                          color: "#C3BCC2",
                        }}
                      >
                        {item.category}
                      </span>
                      <span
                        className='px-2 py-1 text-xs rounded-full border'
                        style={{
                          backgroundColor: "transparent",
                          borderColor: "#606364",
                          color: "#ABA4AA",
                        }}
                      >
                        {item.difficulty}
                      </span>
                      {item.isYoutube && (
                        <span
                          className='px-2 py-1 text-xs rounded-full'
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
                      className='text-xl font-bold mb-2'
                      style={{ color: "#C3BCC2" }}
                    >
                      {item.title}
                    </h3>

                    <p
                      className='mb-3'
                      style={{ color: "#ABA4AA" }}
                    >
                      {item.description}
                    </p>

                    <div className='flex items-center gap-4'>
                      <div className='flex items-center gap-1'>
                        {item.isYoutube ? (
                          <Video className='h-4 w-4 text-red-500' />
                        ) : item.type === "video" ? (
                          <Video
                            className='h-4 w-4'
                            style={{ color: "#ABA4AA" }}
                          />
                        ) : (
                          <FileText
                            className='h-4 w-4'
                            style={{ color: "#ABA4AA" }}
                          />
                        )}
                        {item.duration && (
                          <span
                            style={{ color: "#ABA4AA" }}
                            className='text-sm'
                          >
                            {item.duration}
                          </span>
                        )}
                      </div>

                      <div className='flex items-center gap-1'>
                        <Star className='h-4 w-4 text-yellow-400' />
                        <span
                          style={{ color: "#C3BCC2" }}
                          className='text-sm font-medium'
                        >
                          {item.rating || 0}
                        </span>
                      </div>

                      <div className='flex items-center gap-1'>
                        <Eye
                          className='h-4 w-4'
                          style={{ color: "#ABA4AA" }}
                        />
                        <span
                          style={{ color: "#ABA4AA" }}
                          className='text-sm'
                        >
                          {item.views || 0} views
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (item.isYoutube && item.youtubeId) {
                          window.open(item.url, "_blank")
                        } else {
                          window.open(item.url, "_blank")
                        }
                      }}
                      className='p-3 rounded-lg transition-all duration-300 transform hover:scale-110'
                      style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#606364"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#4A5A70"
                      }}
                    >
                      {item.isYoutube || item.type === "video" ? (
                        <Play className='h-5 w-5' />
                      ) : (
                        <Eye className='h-5 w-5' />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

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
          setIsVideoViewerOpen(false)
          setSelectedItem(null)
        }}
        item={selectedItem}
        onDelete={handleDeleteSuccess}
      />
    </Sidebar>
  )
}
