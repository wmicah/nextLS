"use client"

import { useState } from "react"
import Link from "next/link"
import { trpc } from "@/app/_trpc/client"
import {
  Search,
  Filter,
  Play,
  Clock,
  Star,
  BookOpen,
  Video,
  FileText,
  Download,
  Eye,
  Plus,
  Youtube,
} from "lucide-react"
import {
  FiSettings,
  FiBell,
  FiMessageSquare,
  FiSearch,
  FiUsers,
  FiBookOpen,
  FiClipboard,
  FiCalendar,
} from "react-icons/fi"

import YouTubePlayer from "./YouTubePlayer"
import YouTubeImportModal from "./YouTubeImportModal"

const navLinks = [
  { name: "Clients", icon: <FiUsers />, href: "/clients" },
  { name: "Library", icon: <FiBookOpen />, href: "/library" },
  { name: "Programs", icon: <FiClipboard />, href: "/programs" },
  { name: "Schedule", icon: <FiCalendar />, href: "/schedule" },
]

const bottomLinks = [
  { name: "Settings", icon: <FiSettings />, href: "/settings" },
  { name: "Notifications", icon: <FiBell />, href: "/notifications" },
  { name: "Messages", icon: <FiMessageSquare />, href: "/messages" },
  { name: "Search", icon: <FiSearch />, href: "/search" },
]

function Sidebar({ user }: { user?: { name?: string; email?: string } }) {
  const { data: authData } = trpc.authCallback.useQuery()
  const userInitials =
    user?.name || authData?.user?.name
      ? ((user?.name ?? authData?.user?.name) || "")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : (user?.email || authData?.user?.email)?.[0]?.toUpperCase() || "U"

  return (
    <aside
      className='flex flex-col justify-between w-20 md:w-64 h-screen fixed left-0 top-0 z-20 transition-all duration-300 border-r'
      style={{
        backgroundColor: "#2A3133",
        color: "#ABA4AA",
        borderColor: "#606364",
      }}
    >
      <div>
        <div className='flex items-center justify-center md:justify-start h-20 px-4 font-bold text-2xl'>
          <span
            className='hidden md:inline'
            style={{ color: "#C3BCC2" }}
          >
            Next Level Softball
          </span>
        </div>
        <nav className='mt-8 flex flex-col gap-2'>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded transition ${
                link.name === "Library" ? "text-white" : "hover:text-white"
              }`}
              style={{
                backgroundColor:
                  link.name === "Library" ? "#353A3A" : "transparent",
                color: link.name === "Library" ? "#C3BCC2" : "#606364",
              }}
              onMouseEnter={(e) => {
                if (link.name !== "Library") {
                  e.currentTarget.style.backgroundColor = "#353A3A"
                  e.currentTarget.style.color = "#C3BCC2"
                }
              }}
              onMouseLeave={(e) => {
                if (link.name !== "Library") {
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.color = "#606364"
                }
              }}
            >
              <span className='text-xl'>{link.icon}</span>
              <span className='hidden md:inline'>{link.name}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className='flex flex-col gap-4 mb-6 px-4'>
        <div className='flex gap-4 justify-between'>
          {bottomLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className='text-xl transition'
              style={{ color: "#606364" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#4A5A70"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#606364"
              }}
            >
              {link.icon}
            </Link>
          ))}
        </div>
        <div className='flex items-center gap-2 mt-4'>
          <div
            className='rounded-full w-10 h-10 flex items-center justify-center font-bold text-white'
            style={{ backgroundColor: "#4A5A70" }}
          >
            {userInitials}
          </div>
          <span
            className='hidden md:inline'
            style={{ color: "#ABA4AA" }}
          >
            {user?.name ||
              authData?.user?.name ||
              user?.email ||
              authData?.user?.email}
          </span>
        </div>
      </div>
    </aside>
  )
}

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

  // Use tRPC queries
  const {
    data: libraryItems = [],
    isLoading,
    error,
  } = trpc.library.list.useQuery({
    search: searchTerm || undefined,
    category: selectedCategory !== "All" ? selectedCategory : undefined,
    difficulty: selectedDifficulty !== "All" ? selectedDifficulty : undefined,
  })

  const { data: stats } = trpc.library.getStats.useQuery()

  if (isLoading) {
    return (
      <div
        className='flex min-h-screen'
        style={{ backgroundColor: "#2A3133" }}
      >
        <Sidebar />
        <div className='flex-1 md:ml-64 p-8'>
          <div className='flex items-center justify-center h-64'>
            <div
              className='animate-spin rounded-full h-8 w-8 border-b-2'
              style={{ borderColor: "#4A5A70" }}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className='flex min-h-screen'
        style={{ backgroundColor: "#2A3133" }}
      >
        <Sidebar />
        <div className='flex-1 md:ml-64 p-8'>
          <div className='flex items-center justify-center h-64'>
            <p className='text-red-400'>
              Error loading library: {error.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className='flex min-h-screen'
      style={{ backgroundColor: "#2A3133" }}
    >
      <Sidebar />
      <div className='flex-1 md:ml-64 p-8'>
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
                  style={{ color: "#606364" }}
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
                style={{ color: "#4A5A70" }}
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
                  style={{ color: "#606364" }}
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
                style={{ color: "#4A5A70" }}
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
                  style={{ color: "#606364" }}
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
                style={{ color: "#4A5A70" }}
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
                  style={{ color: "#606364" }}
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
                style={{ color: "#4A5A70" }}
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
                className='w-full pl-10 pr-4 py-2 rounded-lg border'
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
                className='px-4 py-2 rounded-lg border'
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
                className='px-4 py-2 rounded-lg border'
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
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className='px-4 py-2 rounded-lg border transition-all duration-300 transform hover:scale-105'
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

          {/* Updated button section with YouTube import */}
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
              <Youtube className='h-5 w-5' />
              Import YouTube
            </button>
            <button
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
                  setSearchTerm("")
                  setSelectedCategory("All")
                  setSelectedDifficulty("All")
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

        {/* Library Grid/List - Only show if we have items */}
        {libraryItems.length > 0 &&
          (viewMode === "grid" ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {libraryItems.map((item: any) => (
                <div
                  key={item.id}
                  className='rounded-lg shadow-lg border transition-all duration-300 transform hover:-translate-y-1'
                  style={{
                    backgroundColor: "#353A3A",
                    borderColor: "#606364",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#606364"
                    e.currentTarget.style.borderColor = "#ABA4AA"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#353A3A"
                    e.currentTarget.style.borderColor = "#606364"
                  }}
                >
                  {/* Updated Thumbnail with YouTube support */}
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
                    ) : (
                      <div className='text-6xl'>
                        {item.thumbnail ||
                          (item.type === "video" ? "🎥" : "📄")}
                      </div>
                    )}
                  </div>

                  <div className='p-6'>
                    {/* Header */}
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
                          <Youtube className='h-4 w-4 text-red-500' />
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

                    {/* Footer */}
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
                          onClick={() => {
                            if (item.isYoutube && item.youtubeId) {
                              window.open(item.url, "_blank")
                            } else {
                              // Handle regular videos/documents
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
                            e.currentTarget.style.backgroundColor =
                              "transparent"
                          }}
                        >
                          <Eye className='h-4 w-4' />
                        </button>
                        <button
                          className='p-2 rounded-lg transition-all duration-300 transform hover:scale-110'
                          style={{ color: "#ABA4AA" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#C3BCC2"
                            e.currentTarget.style.backgroundColor = "#606364"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#ABA4AA"
                            e.currentTarget.style.backgroundColor =
                              "transparent"
                          }}
                        >
                          <Download className='h-4 w-4' />
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
                  className='rounded-lg shadow-lg p-6 border transition-all duration-300 transform hover:-translate-y-1'
                  style={{
                    backgroundColor: "#353A3A",
                    borderColor: "#606364",
                  }}
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
                    {/* Updated Thumbnail with YouTube support */}
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

                    {/* Content */}
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
                            <Youtube className='h-4 w-4 text-red-500' />
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

                    {/* Actions */}
                    <div className='flex gap-2'>
                      <button
                        onClick={() => {
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
                      <button
                        className='p-3 rounded-lg transition-all duration-300 transform hover:scale-110'
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
                        <Download className='h-5 w-5' />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* YouTube Import Modal */}
        <YouTubeImportModal
          isOpen={isYouTubeModalOpen}
          onClose={() => setIsYouTubeModalOpen(false)}
          onSuccess={() => {
            console.log("YouTube content imported successfully!")
          }}
        />
      </div>
    </div>
  )
}
