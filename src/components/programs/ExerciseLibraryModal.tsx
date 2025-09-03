"use client"

import { useState, useEffect } from "react"
import { Search, Video, Star, Eye, X, Filter, Play, Plus } from "lucide-react"
import { trpc } from "@/app/_trpc/client"

interface ExerciseLibraryModalProps {
	isOpen: boolean
	onClose: () => void
	onSelect: (exercise: any) => void
}

export default function ExerciseLibraryModal({
	isOpen,
	onClose,
	onSelect,
}: ExerciseLibraryModalProps) {
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedCategory, setSelectedCategory] = useState("all")
	const [selectedDifficulty, setSelectedDifficulty] = useState("all")

	// Fetch library resources
	const { data: libraryItems = [], isLoading } =
		trpc.libraryResources.getAll.useQuery()
	const { data: categories = [] } =
		trpc.libraryResources.getCategories.useQuery()

	const difficulties = ["Beginner", "Intermediate", "Advanced", "All Levels"]

	// Filter items based on search and filters
	const filteredItems = libraryItems.filter((item: any) => {
		const matchesSearch =
			item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.description?.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesCategory =
			selectedCategory === "all" || item.category === selectedCategory
		const matchesDifficulty =
			selectedDifficulty === "all" || item.difficulty === selectedDifficulty

		return matchesSearch && matchesCategory && matchesDifficulty
	})

	const handleSelect = (exercise: any) => {
		onSelect({
			title: exercise.title,
			description: exercise.description || "",
			duration: exercise.duration || "",
			videoUrl: exercise.url || "",
			notes: "",
			sets: undefined,
			reps: undefined,
			tempo: "",
		})
		onClose()
	}

	// Close modal on escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener("keydown", handleEscape)
			return () => document.removeEventListener("keydown", handleEscape)
		}
		
		return undefined
	}, [isOpen, onClose])

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="w-full max-w-5xl bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-700">
					<div>
						<h2 className="text-2xl font-bold text-white">Exercise Library</h2>
						<p className="text-gray-400 text-sm mt-1">
							Select exercises from your video library
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Search and Filters */}
				<div className="p-6 border-b border-gray-700">
					<div className="flex flex-col lg:flex-row gap-4">
						{/* Search Bar */}
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search exercises..."
								className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						{/* Filters */}
						<div className="flex gap-3">
							<select
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
								className="px-4 py-3 rounded-xl border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="all">All Categories</option>
								{categories.map((cat: any) => (
									<option key={cat.name} value={cat.name}>
										{cat.name} ({cat.count})
									</option>
								))}
							</select>
							<select
								value={selectedDifficulty}
								onChange={(e) => setSelectedDifficulty(e.target.value)}
								className="px-4 py-3 rounded-xl border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="all">All Levels</option>
								{difficulties.map((diff) => (
									<option key={diff} value={diff}>
										{diff}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Results Count */}
					<div className="flex items-center justify-between mt-4">
						<div className="text-sm text-gray-400">
							{isLoading
								? "Loading..."
								: `${filteredItems.length} exercise${
										filteredItems.length !== 1 ? "s" : ""
								  } found`}
						</div>
						{searchTerm && (
							<button
								onClick={() => setSearchTerm("")}
								className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
							>
								Clear search
							</button>
						)}
					</div>
				</div>

				{/* Exercise List */}
				<div className="overflow-y-auto max-h-[60vh] p-6">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
						</div>
					) : filteredItems.length > 0 ? (
						<div className="grid gap-4">
							{filteredItems.map((item: any) => (
								<div
									key={item.id}
									onClick={() => handleSelect(item)}
									className="group p-4 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-750 hover:border-gray-600 cursor-pointer transition-all duration-200 hover:shadow-lg"
								>
									<div className="flex items-start gap-4">
										{/* Thumbnail */}
										<div className="relative flex-shrink-0">
											{item.thumbnail ? (
												<img
													src={item.thumbnail}
													alt={item.title}
													className="w-20 h-14 object-cover rounded-lg"
												/>
											) : (
												<div className="w-20 h-14 bg-gray-700 rounded-lg flex items-center justify-center">
													<Video className="h-6 w-6 text-gray-500" />
												</div>
											)}
											<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg flex items-center justify-center transition-colors">
												<Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
											</div>
										</div>

										{/* Content */}
										<div className="flex-1 min-w-0">
											<h3 className="text-white font-semibold mb-2 group-hover:text-blue-400 transition-colors">
												{item.title}
											</h3>
											{item.description && (
												<p className="text-gray-400 text-sm mb-3 line-clamp-2">
													{item.description}
												</p>
											)}
											<div className="flex items-center gap-3 text-xs">
												{item.category && (
													<span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
														{item.category}
													</span>
												)}
												{item.difficulty && (
													<span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300">
														{item.difficulty}
													</span>
												)}
												{item.duration && (
													<span className="text-gray-500">{item.duration}</span>
												)}
												<div className="flex items-center gap-1 text-gray-500">
													<Star className="h-3 w-3 text-yellow-400" />
													<span>{item.rating || 0}</span>
												</div>
												<div className="flex items-center gap-1 text-gray-500">
													<Eye className="h-3 w-3" />
													<span>{item.views || 0}</span>
												</div>
											</div>
										</div>

										{/* Add Button */}
										<div className="flex-shrink-0">
											<button className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors opacity-0 group-hover:opacity-100">
												<Plus className="h-4 w-4" />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
								<Video className="h-8 w-8 text-gray-500" />
							</div>
							<h3 className="text-lg font-semibold text-white mb-2">
								No exercises found
							</h3>
							<p className="text-gray-400">
								{searchTerm ||
								selectedCategory !== "all" ||
								selectedDifficulty !== "all"
									? "Try adjusting your search or filters"
									: "Add some exercises to your library to get started"}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
