"use client"

import { useState } from "react"
import { trpc } from "@/app/_trpc/client"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select"
import { Search, Play, Clock, Plus } from "lucide-react"

interface DrillSelectionModalProps {
	isOpen: boolean
	onClose: () => void
	onSelectDrill: (drill: {
		title: string
		description?: string
		duration?: string
		videoUrl?: string
		notes?: string
	}) => void
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

export default function DrillSelectionModal({
	isOpen,
	onClose,
	onSelectDrill,
}: DrillSelectionModalProps) {
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedCategory, setSelectedCategory] = useState("All")
	const [selectedDifficulty, setSelectedDifficulty] = useState("All")

	const { data: libraryItems = [], isLoading } = trpc.library.list.useQuery({
		search: searchTerm || undefined,
		category: selectedCategory !== "All" ? selectedCategory : undefined,
		difficulty: selectedDifficulty !== "All" ? selectedDifficulty : undefined,
	})

	const handleSelectDrill = (item: any) => {
		onSelectDrill({
			title: item.title,
			description: item.description,
			duration: item.duration || "",
			videoUrl: item.url || "",
			notes: "",
		})
		onClose()
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#2A3133] border-gray-600">
				<DialogHeader>
					<DialogTitle className="text-white">
						Select Drill from Library
					</DialogTitle>
					<DialogDescription className="text-gray-400">
						Choose a drill from your library to add to this day
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Search and Filters */}
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									placeholder="Search drills..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10 bg-[#3A4245] border-gray-600 text-white"
								/>
							</div>
						</div>
						<Select
							value={selectedCategory}
							onValueChange={setSelectedCategory}
						>
							<SelectTrigger className="w-full sm:w-40 bg-[#3A4245] border-gray-600">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="bg-[#3A4245] border-gray-600">
								{categories.map((category) => (
									<SelectItem
										key={category}
										value={category}
										className="text-white hover:bg-[#2A3133]"
									>
										{category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={selectedDifficulty}
							onValueChange={setSelectedDifficulty}
						>
							<SelectTrigger className="w-full sm:w-40 bg-[#3A4245] border-gray-600">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="bg-[#3A4245] border-gray-600">
								{difficulties.map((difficulty) => (
									<SelectItem
										key={difficulty}
										value={difficulty}
										className="text-white hover:bg-[#2A3133]"
									>
										{difficulty}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Drill List */}
					<div className="space-y-3">
						{isLoading ? (
							<div className="flex items-center justify-center h-32">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
							</div>
						) : libraryItems.length === 0 ? (
							<div className="text-center text-gray-400 py-8">
								No drills found. Try adjusting your search or filters.
							</div>
						) : (
							libraryItems.map((item) => (
								<Card
									key={item.id}
									className="bg-[#3A4245] border-gray-600 hover:bg-[#4A5457] transition-colors cursor-pointer"
									onClick={() => handleSelectDrill(item)}
								>
									<CardContent className="p-4">
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													<h3 className="text-white font-medium">
														{item.title}
													</h3>
													<Badge
														variant="outline"
														className="bg-blue-500/10 text-blue-600 border-blue-500/20"
													>
														{item.category}
													</Badge>
													<Badge
														variant="outline"
														className="bg-green-500/10 text-green-600 border-green-500/20"
													>
														{item.difficulty}
													</Badge>
												</div>
												{item.description && (
													<p className="text-gray-400 text-sm mb-2">
														{item.description}
													</p>
												)}
												<div className="flex items-center gap-4 text-sm text-gray-400">
													{item.duration && (
														<div className="flex items-center gap-1">
															<Clock className="h-3 w-3" />
															<span>{item.duration}</span>
														</div>
													)}
													{item.type === "video" && (
														<div className="flex items-center gap-1">
															<Play className="h-3 w-3" />
															<span>Video</span>
														</div>
													)}
												</div>
											</div>
											<Button
												size="sm"
												className="bg-blue-600 hover:bg-blue-700"
											>
												<Plus className="h-4 w-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
