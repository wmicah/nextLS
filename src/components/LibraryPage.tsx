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
	Eye,
	Plus,
	Filter,
	Grid3X3,
	List,
	Sparkles,
	Users,
	Target,
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
	const [selectedItem, setSelectedItem] = useState<{
		id: string
		title: string
		type: string
		isYoutube?: boolean
		youtubeId?: string
	} | null>(null)
	const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false)

	const handleItemClick = (item: {
		id: string
		title: string
		type: string
		isYoutube?: boolean
		youtubeId?: string
	}) => {
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

	const { data: clientVideoSubmissions = [] } =
		trpc.library.getClientVideoSubmissions.useQuery()

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
				<div className="flex items-center justify-center h-64">
					<div
						className="animate-spin rounded-full h-8 w-8 border-b-2"
						style={{ borderColor: "#4A5A70" }}
					></div>
				</div>
			</Sidebar>
		)
	}

	if (error) {
		return (
			<Sidebar>
				<div className="flex items-center justify-center h-64">
					<p className="text-red-400">Error loading library: {error.message}</p>
				</div>
			</Sidebar>
		)
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
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
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

				<div
					className="rounded-xl p-6 transform hover:scale-105 transition-all duration-300 shadow-xl border relative overflow-hidden group"
					style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
				>
					<div
						className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
						style={{
							background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
						}}
					/>
					<div className="relative flex items-center justify-between">
						<div>
							<p
								className="text-sm font-medium mb-1"
								style={{ color: "#ABA4AA" }}
							>
								Avg Rating
							</p>
							<p
								className="text-3xl font-bold mb-1"
								style={{ color: "#C3BCC2" }}
							>
								N/A
							</p>
							<p className="text-xs" style={{ color: "#ABA4AA" }}>
								User Rating
							</p>
						</div>
						<div
							className="w-12 h-12 rounded-xl flex items-center justify-center"
							style={{ backgroundColor: "#F59E0B" }}
						>
							<Star className="h-6 w-6" style={{ color: "#C3BCC2" }} />
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
				<div className="relative flex flex-col md:flex-row gap-6 items-center justify-between">
					{/* Search */}
					<div className="relative flex-1 max-w-md">
						<Search
							className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
							style={{ color: "#606364" }}
						/>
						<input
							type="text"
							placeholder="Search resources..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-300"
							style={{
								backgroundColor: "#606364",
								borderColor: "#ABA4AA",
								color: "#C3BCC2",
							}}
						/>
					</div>

					{/* Filters */}
					<div className="flex gap-4 items-center">
						<div className="relative">
							<Filter
								className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
								style={{ color: "#606364" }}
							/>
							<select
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
								className="pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-300 appearance-none"
								style={{
									backgroundColor: "#606364",
									borderColor: "#ABA4AA",
									color: "#C3BCC2",
								}}
							>
								{categories.map((category) => (
									<option key={category} value={category}>
										{category}
									</option>
								))}
							</select>
						</div>

						<div className="relative">
							<Target
								className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
								style={{ color: "#606364" }}
							/>
							<select
								value={selectedDifficulty}
								onChange={(e) => setSelectedDifficulty(e.target.value)}
								className="pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-300 appearance-none"
								style={{
									backgroundColor: "#606364",
									borderColor: "#ABA4AA",
									color: "#C3BCC2",
								}}
							>
								{difficulties.map((difficulty) => (
									<option key={difficulty} value={difficulty}>
										{difficulty}
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

			{/* Results Header */}
			<div className="flex items-center justify-between mb-8">
				<div>
					<h2 className="text-2xl font-bold mb-2" style={{ color: "#C3BCC2" }}>
						Training Resources
					</h2>
					<p style={{ color: "#ABA4AA" }}>
						{libraryItems.length}{" "}
						{libraryItems.length === 1 ? "resource" : "resources"} found
					</p>
				</div>

				<div className="flex gap-3">
					<button
						onClick={() => setIsYouTubeModalOpen(true)}
						className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
						style={{ backgroundColor: "#DC2626", color: "#C3BCC2" }}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = "#B91C1C"
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = "#DC2626"
						}}
					>
						<Video className="h-5 w-5" />
						Import YouTube
					</button>
					<button
						onClick={() => setIsUploadModalOpen(true)}
						className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
						style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = "#606364"
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = "#4A5A70"
						}}
					>
						<Plus className="h-5 w-5" />
						Upload Resource
					</button>
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
							{searchTerm ||
							selectedCategory !== "All" ||
							selectedDifficulty !== "All"
								? "Try adjusting your search terms or filters"
								: "Start building your library by uploading your first resource or importing from YouTube"}
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setIsYouTubeModalOpen(true)}
								className="px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
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
								className="px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
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
				</div>
			)}

			{/* Enhanced Library Grid/List */}
			{libraryItems.length > 0 &&
				(viewMode === "grid" ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
						{libraryItems.map((item: any, index: number) => (
							<div
								key={item.id}
								className="rounded-xl shadow-lg border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group"
								style={{
									backgroundColor: "#353A3A",
									borderColor: "#606364",
									animationDelay: `${index * 50}ms`,
								}}
								onClick={() => handleItemClick(item)}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = "#606364"
									e.currentTarget.style.borderColor = "#ABA4AA"
									e.currentTarget.style.boxShadow =
										"0 8px 20px rgba(0, 0, 0, 0.25)"
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = "#353A3A"
									e.currentTarget.style.borderColor = "#606364"
									e.currentTarget.style.boxShadow =
										"0 4px 6px rgba(0, 0, 0, 0.1)"
								}}
							>
								<div
									className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
									style={{
										background:
											"linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
									}}
								/>

								<div className="relative">
									<div
										className="h-32 rounded-t-xl flex items-center justify-center overflow-hidden relative"
										style={{ backgroundColor: "#606364" }}
									>
										{item.isYoutube && item.youtubeId ? (
											<YouTubePlayer
												videoId={item.youtubeId}
												title={item.title}
												width="100%"
												height="128"
											/>
										) : item.thumbnail &&
										  item.thumbnail.startsWith("data:image") ? (
											<img
												src={item.thumbnail}
												alt={item.title}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="text-4xl">
												{item.thumbnail ||
													(item.type === "video" ? "🎥" : "📄")}
											</div>
										)}

										{/* Play overlay */}
										<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
											<div
												className="w-10 h-10 rounded-full flex items-center justify-center"
												style={{ backgroundColor: "#4A5A70" }}
											>
												<Play
													className="h-5 w-5 ml-0.5"
													style={{ color: "#C3BCC2" }}
												/>
											</div>
										</div>
									</div>

									<div className="p-4">
										<div className="flex items-center justify-between mb-2">
											<span
												className="px-2 py-0.5 text-xs font-medium rounded-full"
												style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
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
											className="text-sm font-bold mb-2 line-clamp-1"
											style={{ color: "#C3BCC2" }}
										>
											{item.title}
										</h3>

										<p
											className="text-xs mb-3 line-clamp-2"
											style={{ color: "#ABA4AA" }}
										>
											{item.description}
										</p>

										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<div className="flex items-center gap-1">
													<Star className="h-3 w-3 text-yellow-400" />
													<span
														style={{ color: "#C3BCC2" }}
														className="text-xs font-medium"
													>
														{item.rating || 0}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Eye
														className="h-3 w-3"
														style={{ color: "#ABA4AA" }}
													/>
													<span
														style={{ color: "#ABA4AA" }}
														className="text-xs"
													>
														{item.views || 0}
													</span>
												</div>
											</div>

											<button
												onClick={(e) => {
													e.stopPropagation()
													if (item.isYoutube && item.youtubeId) {
														window.open(item.url, "_blank")
													} else {
														window.open(item.url, "_blank")
													}
												}}
												className="p-1.5 rounded-lg transition-all duration-300 transform hover:scale-110"
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
												<Eye className="h-3 w-3" />
											</button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="space-y-4">
						{libraryItems.map((item: any, index: number) => (
							<div
								key={item.id}
								className="rounded-xl shadow-lg p-4 border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group"
								style={{
									backgroundColor: "#353A3A",
									borderColor: "#606364",
									animationDelay: `${index * 30}ms`,
								}}
								onClick={() => handleItemClick(item)}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = "#606364"
									e.currentTarget.style.borderColor = "#ABA4AA"
									e.currentTarget.style.boxShadow =
										"0 6px 15px rgba(0, 0, 0, 0.2)"
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = "#353A3A"
									e.currentTarget.style.borderColor = "#606364"
									e.currentTarget.style.boxShadow =
										"0 2px 4px rgba(0, 0, 0, 0.1)"
								}}
							>
								<div
									className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
									style={{
										background:
											"linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
									}}
								/>

								<div className="relative flex items-center gap-4">
									<div
										className="w-16 h-16 rounded-xl flex items-center justify-center text-xl flex-shrink-0 overflow-hidden relative"
										style={{ backgroundColor: "#606364" }}
									>
										{item.isYoutube && item.youtubeId ? (
											<YouTubePlayer
												videoId={item.youtubeId}
												title={item.title}
												width="64"
												height="64"
											/>
										) : (
											<div>
												{item.thumbnail ||
													(item.type === "video" ? "🎥" : "📄")}
											</div>
										)}

										{/* Play overlay */}
										<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
											<div
												className="w-8 h-8 rounded-full flex items-center justify-center"
												style={{ backgroundColor: "#4A5A70" }}
											>
												<Play
													className="h-4 w-4 ml-0.5"
													style={{ color: "#C3BCC2" }}
												/>
											</div>
										</div>
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-2">
											<span
												className="px-2 py-0.5 text-xs font-medium rounded-full"
												style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
											>
												{item.category}
											</span>
											<span
												className="px-2 py-0.5 text-xs rounded-full border"
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
											className="text-base font-bold mb-1 line-clamp-1"
											style={{ color: "#C3BCC2" }}
										>
											{item.title}
										</h3>

										<p
											className="text-sm mb-2 line-clamp-1"
											style={{ color: "#ABA4AA" }}
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

											<div className="flex items-center gap-1">
												<Star className="h-3 w-3 text-yellow-400" />
												<span
													style={{ color: "#C3BCC2" }}
													className="text-xs font-medium"
												>
													{item.rating || 0}
												</span>
											</div>

											<div className="flex items-center gap-1">
												<Eye className="h-3 w-3" style={{ color: "#ABA4AA" }} />
												<span style={{ color: "#ABA4AA" }} className="text-xs">
													{item.views || 0} views
												</span>
											</div>
										</div>
									</div>

									<div className="flex gap-2">
										<button
											onClick={(e) => {
												e.stopPropagation()
												if (item.isYoutube && item.youtubeId) {
													window.open(item.url, "_blank")
												} else {
													window.open(item.url, "_blank")
												}
											}}
											className="p-2 rounded-lg transition-all duration-300 transform hover:scale-110"
											style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
											onMouseEnter={(e) => {
												e.currentTarget.style.backgroundColor = "#606364"
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.backgroundColor = "#4A5A70"
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
				))}

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
					setIsVideoViewerOpen(false)
					setSelectedItem(null)
				}}
				item={selectedItem}
				onDelete={handleDeleteSuccess}
			/>
		</Sidebar>
	)
}
