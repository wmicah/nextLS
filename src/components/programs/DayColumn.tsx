"use client"

import { useState, useEffect } from "react"
import { Plus, Play, MoreVertical, Trash2, GripVertical } from "lucide-react"
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from "@dnd-kit/core"
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import DrillSelectionModal from "../DrillSelectionModal"
import { trpc } from "@/app/_trpc/client"
import { useUIStore } from "@/lib/stores/uiStore"

interface DayColumnProps {
	day: any
	dayNumber: number
	weekNumber: number
	programId: string
	isSelected: boolean
	currentWeekData: any // Add this prop
	onExerciseAdded?: () => void // Add callback prop
}

// Draggable Exercise Item Component
function SortableExerciseItem({ exercise, onDelete }: any) {
	// Defensive check to ensure exercise has an ID
	if (!exercise?.id) {
		console.warn("Exercise without ID:", exercise)
		return null
	}

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: exercise.id,
		transition: {
			duration: 250,
			easing: "cubic-bezier(0.25, 1, 0.5, 1)",
		},
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition: isDragging ? "none" : transition,
		opacity: isDragging ? 0.85 : 1,
		scale: isDragging ? 1.02 : 1,
		zIndex: isDragging ? 1000 : "auto",
		boxShadow: isDragging ? "0 25px 50px rgba(0, 0, 0, 0.4)" : "none",
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`group relative rounded-lg border transition-all duration-250 ease-out hover:shadow-lg ${
				isDragging
					? "border-blue-400 shadow-xl scale-105 bg-gray-700/80"
					: "border-gray-600 hover:border-gray-500 bg-gray-800/50 hover:shadow-md"
			}`}
		>
			<div className="p-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4 flex-1 min-w-0">
						{/* Drag Handle */}
						<button
							{...attributes}
							{...listeners}
							className="p-3 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-300 transition-colors duration-150 cursor-grab active:cursor-grabbing flex-shrink-0"
							title="Drag to reorder"
						>
							<GripVertical className="h-6 w-6" />
						</button>

						{/* Video Thumbnail */}
						{exercise.videoUrl && (
							<div className="relative w-20 h-14 bg-gray-700 rounded overflow-hidden flex-shrink-0">
								<div className="absolute inset-0 flex items-center justify-center">
									<Play className="h-6 w-6 text-white" />
								</div>
							</div>
						)}

						{/* Exercise Info */}
						<div className="flex-1 min-w-0">
							<h4 className="text-lg font-medium text-white break-words">
								{exercise.title}
							</h4>
							{exercise.description && (
								<p className="text-base text-gray-400 break-words mt-2">
									{exercise.description}
								</p>
							)}
						</div>
					</div>

					{/* Exercise Details */}
					<div className="flex items-center gap-4 flex-shrink-0 ml-4">
						{exercise.sets && (
							<div className="flex items-center gap-2">
								<span className="text-sm text-gray-400">Sets:</span>
								<span className="text-lg font-medium text-white">
									{exercise.sets}
								</span>
							</div>
						)}
						{exercise.reps && (
							<div className="flex items-center gap-2">
								<span className="text-sm text-gray-400">Reps:</span>
								<span className="text-lg font-medium text-white">
									{exercise.reps}
								</span>
							</div>
						)}
						{exercise.tempo && (
							<div className="flex items-center gap-2">
								<span className="text-sm text-gray-400">Tempo:</span>
								<span className="text-lg font-medium text-white">
									{exercise.tempo}
								</span>
							</div>
						)}
						{exercise.supersetWithId && (
							<div className="flex items-center gap-2">
								<span className="text-sm bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
									Superset
								</span>
							</div>
						)}
					</div>

					{/* Actions Menu */}
					<div className="flex items-center gap-2 ml-4 flex-shrink-0">
						<button
							onClick={() => onDelete(exercise.id)}
							className="p-3 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors duration-150 opacity-0 group-hover:opacity-100"
							title="Delete exercise"
						>
							<Trash2 className="h-5 w-5" />
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
	currentWeekData,
	onExerciseAdded,
}: DayColumnProps) {
	const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)
	const [showHoverMenu, setShowHoverMenu] = useState(false)
	const { addToast } = useUIStore()

	const utils = trpc.useUtils()

	// DnD sensors - optimized for better performance
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5, // Reduced for more responsive dragging
				delay: 100, // Small delay to prevent accidental drags
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	const addExerciseMutation = trpc.programs.addExercise.useMutation({
		onSuccess: (data) => {
			console.log("Exercise added successfully:", data)
			console.log("Current day data before update:", day)
			console.log("Current week data before update:", currentWeekData)

			addToast({
				type: "success",
				title: "Exercise added",
				message: "Exercise has been added successfully.",
			})
			onExerciseAdded?.()
		},
		onError: (error: any) => {
			console.error("Error adding exercise:", error)
			addToast({
				type: "error",
				title: "Error",
				message: error.message || "Failed to add exercise.",
			})
		},
		onSettled: async () => {
			console.log("Mutation settled, invalidating cache")

			// Force a complete cache invalidation
			await utils.programs.getById.invalidate({ id: programId })
			console.log("Cache invalidated")

			// Force a refetch to ensure all components get updated data
			await utils.programs.getById.refetch({ id: programId })
			console.log("Cache refetched")
		},
	})

	const updateWeekMutation = trpc.programs.updateWeek.useMutation({
		onMutate: async (variables) => {
			// Cancel any outgoing refetches
			await utils.programs.getById.cancel({ id: programId })

			// Snapshot the previous value
			const previousData = utils.programs.getById.getData({ id: programId })

			// Optimistically update to the new value
			utils.programs.getById.setData({ id: programId }, (old) => {
				if (!old) return old

				return {
					...old,
					weeks: old.weeks.map((week: any) => {
						if (week.weekNumber === weekNumber) {
							return {
								...week,
								days: variables.days,
							}
						}
						return week
					}),
				}
			})

			// Return a context object with the snapshotted value
			return { previousData }
		},
		onError: (err, variables, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousData) {
				utils.programs.getById.setData({ id: programId }, context.previousData)
			}
			addToast({
				type: "error",
				title: "Error",
				message: err.message || "Failed to update exercise order.",
			})
		},
		onSettled: () => {
			// Always refetch after error or success
			utils.programs.getById.invalidate({ id: programId })
		},
		onSuccess: () => {
			addToast({
				type: "success",
				title: "Order updated",
				message: "Exercise order has been updated successfully.",
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
			videoUrl: exercise.videoUrl || "",
			notes: exercise.notes || "",
			sets: exercise.sets || 0,
			reps: exercise.reps || 0,
			tempo: exercise.tempo || "",
		})
		// Don't close the modal automatically - let user add more exercises
		// setShowExerciseLibrary(false)
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

	// Helper function to clean data before sending to mutation
	const cleanDaysData = (days: any[]) => {
		return days.map((day: any) => ({
			...day,
			title: day.title || "",
			description: day.description || "",
			warmupTitle: day.warmupTitle || "",
			warmupDescription: day.warmupDescription || "",
			drills: day.drills.map((drill: any) => ({
				...drill,
				title: drill.title || "",
				description: drill.description || "",
				duration: drill.duration || "",
				videoUrl: drill.videoUrl || "",
				notes: drill.notes || "",
				tempo: drill.tempo || "",
				supersetWithId: drill.supersetWithId || "",
			})),
		}))
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event

		// Defensive checks to prevent errors with undefined IDs
		if (!active?.id || !over?.id || !day.drills || !currentWeekData) {
			return
		}

		if (active.id !== over.id) {
			const oldIndex = day.drills.findIndex(
				(drill: any) => drill.id === active.id
			)
			const newIndex = day.drills.findIndex(
				(drill: any) => drill.id === over.id
			)

			// Additional defensive check for valid indices
			if (oldIndex === -1 || newIndex === -1) {
				return
			}

			const reorderedDrills = arrayMove(day.drills, oldIndex, newIndex)

			// Update the order property for each drill
			const updatedDrills = reorderedDrills.map(
				(drill: any, index: number) => ({
					...drill,
					order: index + 1,
				})
			)

			// Update the week data with the new drill order for this specific day
			const updatedDays = currentWeekData.days.map((d: any) => {
				if (d.dayNumber === dayNumber) {
					return {
						...d,
						drills: updatedDrills,
					}
				}
				return d
			})

			// Call the update week mutation with all days
			updateWeekMutation.mutate({
				programId,
				weekNumber,
				days: cleanDaysData(updatedDays),
			})
		}
	}

	// If it's a rest day, show a clean rest day interface
	if (day.isRestDay) {
		return (
			<div className="relative group">
				{/* Rest Day Display */}
				<div className="text-center py-16">
					<div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
						<div className="w-10 h-10 bg-orange-400 rounded-full" />
					</div>
					<div className="text-orange-300 text-xl font-medium mb-3">
						Rest Day
					</div>
					<p className="text-gray-500 text-sm">No exercises scheduled</p>
				</div>

				{/* Hover Menu */}
				<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
					<div className="flex flex-col gap-4">
						<button
							onClick={() => setShowExerciseLibrary(true)}
							className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white"
						>
							<Plus className="h-4 w-4" />
							Add Exercise
						</button>
						<button
							onClick={handleToggleRestDay}
							className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-600 hover:bg-gray-700 text-white"
						>
							Remove Rest Day
						</button>
					</div>
				</div>

				{/* Exercise Library Modal */}
				{showExerciseLibrary && (
					<DrillSelectionModal
						isOpen={showExerciseLibrary}
						onClose={() => setShowExerciseLibrary(false)}
						onSelectDrill={handleSelectExercise}
					/>
				)}
			</div>
		)
	}

	// Regular day with exercises
	return (
		<div className="space-y-6">
			{/* Day Header */}
			<div className="flex items-center justify-between">
				<div>
					<h4 className="text-xl font-semibold text-white">
						{day.title || `Day ${dayNumber}`}
					</h4>
					{day.description && (
						<p className="text-base text-gray-400 mt-2">{day.description}</p>
					)}
				</div>

				{/* Hover Menu */}
				<div className="relative group">
					<button
						onClick={() => setShowHoverMenu(!showHoverMenu)}
						className="p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200"
					>
						<Plus className="h-6 w-6 text-gray-400" />
					</button>

					{showHoverMenu && (
						<div className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl z-20 bg-gray-800 border-gray-600">
							<div className="p-3">
								<button
									onClick={() => {
										setShowExerciseLibrary(true)
										setShowHoverMenu(false)
									}}
									className="flex items-center gap-3 w-full px-3 py-3 text-sm text-white hover:bg-gray-700/50 rounded-lg transition-colors"
								>
									<Plus className="h-5 w-5 text-blue-400" />
									Add Exercise
								</button>
								<button
									onClick={() => {
										handleToggleRestDay()
										setShowHoverMenu(false)
									}}
									className="flex items-center gap-3 w-full px-3 py-3 text-sm text-white hover:bg-gray-700/50 rounded-lg transition-colors"
								>
									<div className="w-5 h-5 bg-orange-400 rounded-full" />
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
									className="flex items-center gap-3 w-full px-3 py-3 text-sm text-white hover:bg-gray-700/50 rounded-lg transition-colors"
								>
									<div className="w-5 h-5 bg-yellow-400 rounded-full" />
									Add Warmup
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Warmup Section */}
			{day.warmupTitle && (
				<div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
					<div className="flex items-center gap-3 mb-4">
						<div className="w-5 h-5 bg-yellow-400 rounded-full" />
						<h5 className="text-lg font-medium text-yellow-300">Warmup</h5>
					</div>
					<h6 className="text-lg font-medium text-white">{day.warmupTitle}</h6>
					{day.warmupDescription && (
						<p className="text-base text-gray-400 mt-3">
							{day.warmupDescription}
						</p>
					)}
				</div>
			)}

			{/* Exercises List with Drag and Drop */}
			<div className="space-y-4">
				{day.drills && day.drills.length > 0 ? (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={day.drills
								.filter((drill: any) => drill.id)
								.map((drill: any) => drill.id)}
							strategy={verticalListSortingStrategy}
						>
							<div className="space-y-4">
								{day.drills
									.filter((exercise: any) => exercise.id)
									.map((exercise: any) => (
										<SortableExerciseItem
											key={exercise.id}
											exercise={exercise}
											onDelete={handleDeleteExercise}
										/>
									))}
							</div>
						</SortableContext>
					</DndContext>
				) : (
					<div className="text-center py-12">
						<div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
							<Plus className="h-8 w-8 text-gray-400" />
						</div>
						<p className="text-gray-500 text-base mb-4">No exercises yet</p>
						<button
							onClick={() => setShowExerciseLibrary(true)}
							className="flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-200 mx-auto bg-blue-600 hover:bg-blue-700 text-white"
						>
							<Plus className="h-5 w-5" />
							Add Exercise
						</button>
					</div>
				)}
			</div>

			{/* Exercise Library Modal */}
			{showExerciseLibrary && (
				<DrillSelectionModal
					isOpen={showExerciseLibrary}
					onClose={() => setShowExerciseLibrary(false)}
					onSelectDrill={handleSelectExercise}
				/>
			)}
		</div>
	)
}
