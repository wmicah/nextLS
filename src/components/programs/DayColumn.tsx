"use client"

import { useState } from "react"
import { Plus, Play, MoreVertical, Trash2 } from "lucide-react"
import ExerciseLibraryModal from "./ExerciseLibraryModal"
import { trpc } from "@/app/_trpc/client"
import { useUIStore } from "@/lib/stores/uiStore"

interface DayColumnProps {
	day: any
	dayNumber: number
	weekNumber: number
	programId: string
	isSelected: boolean
}

// Simple Exercise Item Component
function ExerciseItem({ exercise, onDelete }: any) {
	return (
		<div className="group relative rounded-lg border border-gray-600 hover:border-gray-500 bg-gray-800/50 transition-all duration-200 hover:shadow-md">
			<div className="p-3">
				<div className="flex items-center justify-between">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-3">
							{/* Video Thumbnail */}
							{exercise.videoUrl && (
								<div className="relative w-12 h-8 bg-gray-700 rounded overflow-hidden flex-shrink-0">
									<div className="absolute inset-0 flex items-center justify-center">
										<Play className="h-4 w-4 text-white" />
									</div>
								</div>
							)}

							{/* Exercise Info */}
							<div className="flex-1 min-w-0">
								<h4 className="text-sm font-medium text-white truncate">
									{exercise.title}
								</h4>
								{exercise.description && (
									<p className="text-xs text-gray-400 truncate mt-1">
										{exercise.description}
									</p>
								)}
							</div>
						</div>

						{/* Exercise Details */}
						<div className="flex items-center gap-4 mt-2">
							{exercise.sets && (
								<div className="flex items-center gap-1">
									<span className="text-xs text-gray-400">Sets:</span>
									<span className="text-xs font-medium text-white">
										{exercise.sets}
									</span>
								</div>
							)}
							{exercise.reps && (
								<div className="flex items-center gap-1">
									<span className="text-xs text-gray-400">Reps:</span>
									<span className="text-xs font-medium text-white">
										{exercise.reps}
									</span>
								</div>
							)}
							{exercise.tempo && (
								<div className="flex items-center gap-1">
									<span className="text-xs text-gray-400">Tempo:</span>
									<span className="text-xs font-medium text-white">
										{exercise.tempo}
									</span>
								</div>
							)}
							{exercise.supersetWithId && (
								<div className="flex items-center gap-1">
									<span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
										Superset
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Actions Menu */}
					<div className="flex items-center gap-2 ml-3">
						<button
							onClick={() => onDelete(exercise.id)}
							className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
							title="Delete exercise"
						>
							<Trash2 className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default function DayColumn({
	day,
	dayNumber,
	weekNumber,
	programId,
	isSelected,
}: DayColumnProps) {
	const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)
	const [showHoverMenu, setShowHoverMenu] = useState(false)
	const { addToast } = useUIStore()

	const utils = trpc.useUtils()

	const addExerciseMutation = trpc.programs.addExercise.useMutation({
		onSuccess: () => {
			utils.programs.getById.invalidate({ id: programId })
			addToast({
				type: "success",
				title: "Exercise added",
				message: "Exercise has been added successfully.",
			})
		},
		onError: (error: any) => {
			addToast({
				type: "error",
				title: "Error",
				message: error.message || "Failed to add exercise.",
			})
		},
	})

	const toggleRestDayMutation = trpc.programs.toggleRestDay.useMutation({
		onSuccess: () => {
			utils.programs.getById.invalidate({ id: programId })
			addToast({
				type: "success",
				title: "Rest day updated",
				message: "Rest day status has been updated successfully.",
			})
		},
		onError: (error: any) => {
			addToast({
				type: "error",
				title: "Error",
				message: error.message || "Failed to update rest day status.",
			})
		},
	})

	const deleteExerciseMutation = trpc.programs.deleteExercise.useMutation({
		onSuccess: () => {
			utils.programs.getById.invalidate({ id: programId })
			addToast({
				type: "success",
				title: "Exercise deleted",
				message: "Exercise has been deleted successfully.",
			})
		},
		onError: (error: any) => {
			addToast({
				type: "error",
				title: "Error",
				message: error.message || "Failed to delete exercise.",
			})
		},
	})

	const handleSelectExercise = (exercise: any) => {
		addExerciseMutation.mutate({
			programId,
			weekNumber,
			dayNumber,
			title: exercise.title,
			description: exercise.description || "",
			duration: exercise.duration || "",
			videoUrl: exercise.url || "",
			notes: "",
			sets: exercise.sets,
			reps: exercise.reps,
			tempo: "",
		})
		setShowExerciseLibrary(false)
	}

	const handleDeleteExercise = (exerciseId: string) => {
		if (confirm("Are you sure you want to delete this exercise?")) {
			deleteExerciseMutation.mutate({ exerciseId })
		}
	}

	const handleToggleRestDay = () => {
		toggleRestDayMutation.mutate({
			programId,
			weekNumber,
			dayNumber,
		})
	}

	// If it's a rest day, show a clean rest day interface
	if (day.isRestDay) {
		return (
			<div className="relative group">
				{/* Rest Day Display */}
				<div className="text-center py-12">
					<div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<div className="w-8 h-8 bg-orange-400 rounded-full"></div>
					</div>
					<div className="text-orange-300 text-lg font-medium mb-2">
						Rest Day
					</div>
					<p className="text-gray-500 text-sm">No exercises scheduled</p>
				</div>

				{/* Hover Menu */}
				<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
					<div className="flex flex-col gap-3">
						<button
							onClick={() => setShowExerciseLibrary(true)}
							className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white"
						>
							<Plus className="h-4 w-4" />
							Add Exercise
						</button>
						<button
							onClick={handleToggleRestDay}
							className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-600 hover:bg-gray-700 text-white"
						>
							Remove Rest Day
						</button>
					</div>
				</div>

				{/* Exercise Library Modal */}
				{showExerciseLibrary && (
					<ExerciseLibraryModal
						isOpen={showExerciseLibrary}
						onClose={() => setShowExerciseLibrary(false)}
						onSelect={handleSelectExercise}
					/>
				)}
			</div>
		)
	}

	// Regular day with exercises
	return (
		<div className="space-y-4">
			{/* Day Header */}
			<div className="flex items-center justify-between">
				<div>
					<h4 className="text-lg font-semibold text-white">
						{day.title || `Day ${dayNumber}`}
					</h4>
					{day.description && (
						<p className="text-sm text-gray-400 mt-1">{day.description}</p>
					)}
				</div>

				{/* Hover Menu */}
				<div className="relative group">
					<button
						onClick={() => setShowHoverMenu(!showHoverMenu)}
						className="p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200"
					>
						<Plus className="h-5 w-5 text-gray-400" />
					</button>

					{showHoverMenu && (
						<div className="absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl z-20 bg-gray-800 border-gray-600">
							<div className="p-2">
								<button
									onClick={() => {
										setShowExerciseLibrary(true)
										setShowHoverMenu(false)
									}}
									className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white hover:bg-gray-700/50 rounded-lg transition-colors"
								>
									<Plus className="h-4 w-4 text-blue-400" />
									Add Exercise
								</button>
								<button
									onClick={() => {
										handleToggleRestDay()
										setShowHoverMenu(false)
									}}
									className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white hover:bg-gray-700/50 rounded-lg transition-colors"
								>
									<div className="w-4 h-4 bg-orange-400 rounded-full"></div>
									Set as Rest Day
								</button>
								<button
									onClick={() => {
										addToast({
											type: "info",
											title: "Add Warmup",
											message: "Warmup functionality will be implemented.",
										})
										setShowHoverMenu(false)
									}}
									className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white hover:bg-gray-700/50 rounded-lg transition-colors"
								>
									<div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
									Add Warmup
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Warmup Section */}
			{day.warmupTitle && (
				<div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
					<div className="flex items-center gap-2 mb-2">
						<div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
						<h5 className="text-sm font-medium text-yellow-300">Warmup</h5>
					</div>
					<h6 className="text-sm font-medium text-white">{day.warmupTitle}</h6>
					{day.warmupDescription && (
						<p className="text-xs text-gray-400 mt-1">
							{day.warmupDescription}
						</p>
					)}
				</div>
			)}

			{/* Exercises List */}
			<div className="space-y-3">
				{day.drills && day.drills.length > 0 ? (
					day.drills.map((exercise: any) => (
						<ExerciseItem
							key={exercise.id}
							exercise={exercise}
							onDelete={handleDeleteExercise}
						/>
					))
				) : (
					<div className="text-center py-8">
						<div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
							<Plus className="h-6 w-6 text-gray-400" />
						</div>
						<p className="text-gray-500 text-sm">No exercises yet</p>
						<button
							onClick={() => setShowExerciseLibrary(true)}
							className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 mx-auto bg-blue-600 hover:bg-blue-700 text-white"
						>
							<Plus className="h-4 w-4" />
							Add Exercise
						</button>
					</div>
				)}
			</div>

			{/* Exercise Library Modal */}
			{showExerciseLibrary && (
				<ExerciseLibraryModal
					isOpen={showExerciseLibrary}
					onClose={() => setShowExerciseLibrary(false)}
					onSelect={handleSelectExercise}
				/>
			)}
		</div>
	)
}
