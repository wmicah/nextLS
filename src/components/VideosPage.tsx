"use client"

import { useState, useMemo } from "react"
import { trpc } from "@/app/_trpc/client"
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
} from "lucide-react"
import Link from "next/link"
import Sidebar from "./Sidebar"

export default function VideosPage() {
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedCategory, setSelectedCategory] = useState<string>("all")
	const [activeTab, setActiveTab] = useState<"coach" | "client">("coach")
	const [sortBy, setSortBy] = useState<"date" | "client" | "title">("date")
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

	const {
		data: videos = [],
		isLoading: videosLoading,
		error: videosError,
	} = trpc.videos.list.useQuery()
	const {
		data: clientSubmissions = [],
		isLoading: clientSubmissionsLoading,
		error: clientSubmissionsError,
	} = trpc.clientRouter.getClientVideoSubmissions.useQuery()

	// Memoized filtered and sorted data
	const filteredVideos = useMemo(() => {
		return videos.filter((video) => {
			const matchesSearch =
				video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				video.description?.toLowerCase().includes(searchQuery.toLowerCase())
			const matchesCategory =
				selectedCategory === "all" || video.category === selectedCategory
			return matchesSearch && matchesCategory
		})
	}, [videos, searchQuery, selectedCategory])

	const filteredClientSubmissions = useMemo(() => {
		let filtered = clientSubmissions.filter((submission) => {
			const matchesSearch =
				submission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				submission.description
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				submission.client.name.toLowerCase().includes(searchQuery.toLowerCase())
			return matchesSearch
		})

		// Sort submissions
		filtered.sort((a, b) => {
			let comparison = 0
			switch (sortBy) {
				case "date":
					comparison =
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
					break
				case "client":
					comparison = a.client.name.localeCompare(b.client.name)
					break
				case "title":
					comparison = a.title.localeCompare(b.title)
					break
			}
			return sortOrder === "asc" ? comparison : -comparison
		})

		return filtered
	}, [clientSubmissions, searchQuery, sortBy, sortOrder])

	const categories = [
		{ value: "all", label: "All Categories" },
		{ value: "BULLPEN", label: "Bullpen" },
		{ value: "PRACTICE", label: "Practice" },
		{ value: "GAME_FOOTAGE", label: "Game Footage" },
		{ value: "REFERENCE", label: "Reference" },
		{ value: "COMPARISON", label: "Comparison" },
		{ value: "OTHER", label: "Other" },
	]

	const formatDuration = (seconds: number | null) => {
		if (!seconds) return "Unknown"
		const mins = Math.floor(seconds / 60)
		const secs = Math.floor(seconds % 60)
		return `${mins}:${secs.toString().padStart(2, "0")}`
	}

	const formatFileSize = (bytes: number | null) => {
		if (!bytes) return "Unknown"
		const mb = bytes / (1024 * 1024)
		return `${mb.toFixed(1)} MB`
	}

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(date))
	}

	const getTimeAgo = (date: string | Date) => {
		const now = new Date()
		const dateObj = typeof date === "string" ? new Date(date) : date
		const diffInMs = now.getTime() - dateObj.getTime()
		const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
		const diffInDays = Math.floor(diffInHours / 24)

		if (diffInDays > 0) {
			return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`
		} else if (diffInHours > 0) {
			return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`
		} else {
			return "Just now"
		}
	}

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
						></div>
						<p style={{ color: "#C3BCC2" }}>Loading video library...</p>
					</div>
				</div>
			</Sidebar>
		)
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
		)
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
											Video Library
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
							onChange={(e) => setSearchQuery(e.target.value)}
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
								onChange={(e) => setSelectedCategory(e.target.value)}
								className="pl-10 pr-8 py-3 rounded-xl text-sm transition-all duration-200 appearance-none"
								style={{
									backgroundColor: "#353A3A",
									borderColor: "#606364",
									color: "#C3BCC2",
									border: "1px solid",
								}}
							>
								{categories.map((category) => (
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
									onChange={(e) =>
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
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredVideos.map((video) => (
								<div
									key={video.id}
									className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
									style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = "#3A4040"
										e.currentTarget.style.borderColor = "#4A5A70"
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = "#353A3A"
										e.currentTarget.style.borderColor = "#606364"
									}}
								>
									<div
										className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
										style={{
											background:
												"linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
										}}
									/>
									<div className="relative p-6">
										{/* Video Thumbnail */}
										<div className="relative mb-4 bg-black rounded-xl overflow-hidden aspect-video">
											{video.thumbnail ? (
												<img
													src={video.thumbnail}
													alt={video.title}
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center">
													<Video
														className="w-16 h-16"
														style={{ color: "#ABA4AA" }}
													/>
												</div>
											)}
											<div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
												<Play
													className="w-10 h-10 opacity-0 hover:opacity-100 transition-opacity"
													style={{ color: "#C3BCC2" }}
												/>
											</div>
										</div>

										{/* Video Info */}
										<div className="space-y-3">
											<div className="flex items-start justify-between">
												<h3
													className="font-semibold text-lg line-clamp-2"
													style={{ color: "#C3BCC2" }}
												>
													{video.title}
												</h3>
												<span
													className="text-xs px-3 py-1 rounded-full flex-shrink-0 ml-3"
													style={{
														backgroundColor: "#4A5A70",
														color: "#ABA4AA",
													}}
												>
													{video.category}
												</span>
											</div>

											{video.description && (
												<p
													className="text-sm line-clamp-2"
													style={{ color: "#ABA4AA" }}
												>
													{video.description}
												</p>
											)}

											<div
												className="flex items-center justify-between text-sm"
												style={{ color: "#ABA4AA" }}
											>
												<span>{formatDuration(video.duration)}</span>
												<span>{formatFileSize(video.fileSize)}</span>
											</div>

											<div
												className="flex items-center justify-between text-sm"
												style={{ color: "#ABA4AA" }}
											>
												<span>By {video.uploader.name}</span>
												<span>
													{new Date(video.createdAt).toLocaleDateString()}
												</span>
											</div>

											{/* Action Buttons */}
											<div className="flex items-center gap-3 pt-3">
												<Link
													href={`/videos/${video.id}`}
													className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105"
													style={{
														backgroundColor: "#4A5A70",
														color: "#C3BCC2",
													}}
												>
													<Eye className="w-4 h-4" />
													<span>Review</span>
												</Link>
												{video.feedback && video.feedback.length > 0 && (
													<span
														className="text-xs px-3 py-1 rounded-full"
														style={{
															backgroundColor: "#10b981",
															color: "#ffffff",
														}}
													>
														{video.feedback.length} feedback
													</span>
												)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)
				) : (
					// Client Submissions Tab - Completely Revamped
					<div className="space-y-6">
						{/* Summary Stats */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
											{new Set(clientSubmissions.map((s) => s.clientId)).size}
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
												clientSubmissions.filter((s) => {
													const weekAgo = new Date()
													weekAgo.setDate(weekAgo.getDate() - 7)
													return new Date(s.createdAt) > weekAgo
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
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{filteredClientSubmissions.map((submission) => (
									<div
										key={submission.id}
										className="rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group"
										style={{
											backgroundColor: "#353A3A",
											borderColor: "#606364",
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = "#3A4040"
											e.currentTarget.style.borderColor = "#4A5A70"
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = "#353A3A"
											e.currentTarget.style.borderColor = "#606364"
										}}
									>
										<div className="relative p-6">
											{/* Header with client info and timestamp */}
											<div className="flex items-start justify-between mb-4">
												<div className="flex items-center gap-3">
													<div
														className="w-10 h-10 rounded-full flex items-center justify-center"
														style={{ backgroundColor: "#4A5A70" }}
													>
														<User
															className="w-5 h-5"
															style={{ color: "#C3BCC2" }}
														/>
													</div>
													<div>
														<p
															className="font-semibold"
															style={{ color: "#C3BCC2" }}
														>
															{submission.client.name}
														</p>
														<p className="text-sm" style={{ color: "#ABA4AA" }}>
															{getTimeAgo(submission.createdAt)}
														</p>
													</div>
												</div>
												<span
													className="text-xs px-3 py-1 rounded-full flex-shrink-0"
													style={{
														backgroundColor: "#10B981",
														color: "#ffffff",
													}}
												>
													Client Submission
												</span>
											</div>

											{/* Video Thumbnail */}
											<div className="relative mb-4 bg-black rounded-xl overflow-hidden aspect-video">
												{submission.thumbnail ? (
													<img
														src={submission.thumbnail}
														alt={submission.title}
														className="w-full h-full object-cover"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<Video
															className="w-16 h-16"
															style={{ color: "#ABA4AA" }}
														/>
													</div>
												)}
												<div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
													<Play
														className="w-10 h-10 opacity-0 hover:opacity-100 transition-opacity"
														style={{ color: "#C3BCC2" }}
													/>
												</div>
											</div>

											{/* Submission Details */}
											<div className="space-y-3">
												<div>
													<h3
														className="font-semibold text-lg mb-2"
														style={{ color: "#C3BCC2" }}
													>
														{submission.title}
													</h3>
													{submission.description && (
														<p
															className="text-sm line-clamp-2"
															style={{ color: "#ABA4AA" }}
														>
															{submission.description}
														</p>
													)}
												</div>

												{/* Drill Info if available */}
												{submission.drill && (
													<div
														className="p-3 rounded-lg"
														style={{ backgroundColor: "#2A3133" }}
													>
														<p
															className="text-sm font-medium"
															style={{ color: "#C3BCC2" }}
														>
															Related Drill: {submission.drill.title}
														</p>
													</div>
												)}

												{/* Metadata */}
												<div
													className="flex items-center justify-between text-sm"
													style={{ color: "#ABA4AA" }}
												>
													<div className="flex items-center gap-4">
														<span className="flex items-center gap-1">
															<Calendar className="w-4 h-4" />
															{formatDate(new Date(submission.createdAt))}
														</span>
													</div>
												</div>

												{/* Action Buttons */}
												<div className="flex items-center gap-3 pt-3">
													<Link
														href={`/videos/${submission.id}`}
														className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105"
														style={{
															backgroundColor: "#4A5A70",
															color: "#C3BCC2",
														}}
													>
														<Eye className="w-4 h-4" />
														<span>Review & Respond</span>
													</Link>
													{submission.description && (
														<span
															className="text-xs px-3 py-1 rounded-full flex items-center gap-1"
															style={{
																backgroundColor: "#3B82F6",
																color: "#ffffff",
															}}
														>
															<MessageSquare className="w-3 h-3" />
															Has Comment
														</span>
													)}
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</Sidebar>
	)
}
