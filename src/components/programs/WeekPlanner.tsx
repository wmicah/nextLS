"use client"

import { useState } from "react"
import { Plus, MoreVertical, Copy, Scissors, Trash2, Zap } from "lucide-react"
import DayColumn from "./DayColumn"
import { useSelectionStore } from "@/lib/stores/selectionStore"
import { useClipboardStore } from "@/lib/stores/clipboardStore"
import { useUIStore } from "@/lib/stores/uiStore"
import { trpc } from "@/app/_trpc/client"
import LoadingSpinner from "@/components/common/LoadingSpinner"

interface WeekPlannerProps {
	program: any
	currentWeek: number
	selectedDays: string[]
	setSelectedDays: (days: string[]) => void
}

const DAYS_OF_WEEK = [
	{ number: 1, name: "Monday" },
	{ number: 2, name: "Tuesday" },
	{ number: 3, name: "Wednesday" },
	{ number: 4, name: "Thursday" },
	{ number: 5, name: "Friday" },
	{ number: 6, name: "Saturday" },
	{ number: 7, name: "Sunday" },
]

export default function WeekPlanner({
	program,
	currentWeek,
	selectedDays,
	setSelectedDays,
}: WeekPlannerProps) {
	const { toggleSelectedDay } = useSelectionStore()
	const { clipboard, setClipboard } = useClipboardStore()
	const { addToast } = useUIStore()
	const [showDayMenu, setShowDayMenu] = useState<string | null>(null)

	const utils = trpc.useUtils()

	const toggleRestDayMutation = trpc.programs.toggleRestDay.useMutation({
		onSuccess: () => {
			utils.programs.getById.invalidate({ id: program.id })
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

	const updateWeekMutation = trpc.programs.updateWeek.useMutation({
		onSuccess: () => {
			utils.programs.getById.invalidate({ id: program.id })
			addToast({
				type: "success",
				title: "Week updated",
				message: "Week data has been updated successfully.",
			})
		},
		onError: (error: any) => {
			addToast({
				type: "error",
				title: "Error",
				message: error.message || "Failed to update week data.",
			})
		},
	})

	const createWeekMutation = trpc.programs.createWeek.useMutation({
		onSuccess: () => {
			utils.programs.getById.invalidate({ id: program.id })
			addToast({
				type: "success",
				title: "Week created",
				message: `Week ${currentWeek} has been created successfully.`,
			})
		},
		onError: (error: any) => {
			addToast({
				type: "error",
				title: "Error",
				message: error.message || "Failed to create week.",
			})
		},
	})

	const createDayMutation = trpc.programs.createDay.useMutation({
		onSuccess: () => {
			utils.programs.getById.invalidate({ id: program.id })
			addToast({
				type: "success",
				title: "Day created",
				message: "Day has been created successfully.",
			})
		},
		onError: (error: any) => {
			addToast({
				type: "error",
				title: "Error",
				message: error.message || "Failed to create day.",
			})
		},
	})

	const deleteWeekMutation = trpc.programs.deleteWeek.useMutation({
		onSuccess: () => {
			utils.programs.getById.invalidate({ id: program.id })
			addToast({
				type: "success",
				title: "Week deleted",
				message: `Week ${currentWeek} has been deleted successfully.`,
			})
		},
		onError: (error: any) => {
			addToast({
				type: "error",
				title: "Error",
				message: error.message || "Failed to delete week.",
			})
		},
	})

	const currentWeekData = program.weeks.find(
		(w: any) => w.weekNumber === currentWeek
	)

	if (!currentWeekData) {
		return (
			<div className="text-center py-16">
				<div className="text-gray-400 mb-4">No week data found</div>
				<button
					onClick={() => {
						createWeekMutation.mutate({
							programId: program.id,
							weekNumber: currentWeek,
							title: `Week ${currentWeek}`,
							description: "",
						})
					}}
					disabled={createWeekMutation.isPending}
					className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 mx-auto disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white"
				>
					{createWeekMutation.isPending ? (
						<LoadingSpinner size="sm" />
					) : (
						<Plus className="h-4 w-4" />
					)}
					{createWeekMutation.isPending
						? "Creating..."
						: `Create Week ${currentWeek}`}
				</button>
			</div>
		)
	}

	const handleDayClick = (dayNumber: number, event: React.MouseEvent) => {
		const dayId = `${currentWeek}-${dayNumber}`

		// Handle Ctrl/Cmd+click for multi-select
		if (event.ctrlKey || event.metaKey) {
			toggleSelectedDay(dayId)
		} else {
			// Single click - select only this day
			setSelectedDays([dayId])
		}
	}

	const handleDayMenuClick = (dayNumber: number, action: string) => {
		const dayId = `${currentWeek}-${dayNumber}`
		const dayData = currentWeekData.days.find(
			(d: any) => d.dayNumber === dayNumber
		)

		// Close menu immediately for better UX
		setShowDayMenu(null)

		switch (action) {
			case "copy":
				if (dayData) {
					const clipboardData = {
						days: [
							{
								isRest: dayData.isRestDay || false,
								warmup: dayData.warmupTitle
									? {
											title: dayData.warmupTitle,
											description: dayData.warmupDescription,
									  }
									: undefined,
								items:
									dayData.drills?.map((drill: any) => ({
										id: drill.id,
										name: drill.title,
										sets: drill.sets,
										reps: drill.reps,
										tempo: drill.tempo,
										supersetWithId: drill.supersetWithId,
									})) || [],
							},
						],
					}
					setClipboard(clipboardData)
					addToast({
						type: "success",
						title: "Day copied",
						message: `Day ${dayNumber} has been copied to clipboard.`,
					})
				}
				break
			case "cut":
				if (dayData) {
					// Copy first, then delete
					const clipboardData = {
						days: [
							{
								isRest: dayData.isRestDay || false,
								warmup: dayData.warmupTitle
									? {
											title: dayData.warmupTitle,
											description: dayData.warmupDescription,
									  }
									: undefined,
								items:
									dayData.drills?.map((drill: any) => ({
										id: drill.id,
										name: drill.title,
										sets: drill.sets,
										reps: drill.reps,
										tempo: drill.tempo,
										supersetWithId: drill.supersetWithId,
									})) || [],
							},
						],
					}
					setClipboard(clipboardData)

					// Remove the day from the week data
					const updatedDays = currentWeekData.days.filter(
						(d: any) => d.dayNumber !== dayNumber
					)

					// Call the update week mutation
					updateWeekMutation.mutate({
						programId: program.id,
						weekNumber: currentWeek,
						days: updatedDays,
					})

					addToast({
						type: "success",
						title: "Day cut",
						message: `Day ${dayNumber} has been cut to clipboard.`,
					})
				}
				break
			case "delete":
				if (confirm(`Are you sure you want to delete Day ${dayNumber}?`)) {
					// Remove the day from the week data
					const updatedDays = currentWeekData.days.filter(
						(d: any) => d.dayNumber !== dayNumber
					)

					// Call the update week mutation
					updateWeekMutation.mutate({
						programId: program.id,
						weekNumber: currentWeek,
						days: updatedDays,
					})

					addToast({
						type: "success",
						title: "Day deleted",
						message: `Day ${dayNumber} has been deleted.`,
					})
				}
				break
			case "rest":
				if (dayData) {
					toggleRestDayMutation.mutate({
						programId: program.id,
						weekNumber: currentWeek,
						dayNumber: dayNumber,
					})
				} else {
					addToast({
						type: "error",
						title: "Error",
						message: "Day data not found.",
					})
				}
				break
			case "warmup":
				// TODO: Implement add warmup functionality
				addToast({
					type: "info",
					title: "Add warmup",
					message: "Warmup functionality will be implemented.",
				})
				break
			case "paste":
				if (clipboard && clipboard.days.length > 0) {
					const clipboardDay = clipboard.days[0] // Use first day from clipboard

					// Find or create the target day
					let targetDay = currentWeekData.days.find(
						(d: any) => d.dayNumber === dayNumber
					)

					if (!targetDay) {
						// Create new day if it doesn't exist
						targetDay = {
							id: `temp-${currentWeek}-${dayNumber}`,
							dayNumber: dayNumber,
							weekNumber: currentWeek,
							isRestDay: false,
							warmupTitle: null,
							warmupDescription: null,
							drills: [],
						}
					}

					// Update the day with clipboard data
					const updatedDay = {
						...targetDay,
						isRestDay: clipboardDay.isRest,
						warmupTitle: clipboardDay.warmup?.title || null,
						warmupDescription: clipboardDay.warmup?.description || null,
						drills: clipboardDay.items.map((item: any, index: number) => ({
							id: `temp-${Date.now()}-${index}`,
							title: item.name,
							description: "",
							duration: 0,
							notes: "",
							sets: item.sets,
							reps: item.reps,
							tempo: item.tempo,
							supersetWithId: item.supersetWithId,
							orderIndex: index,
						})),
					}

					// Update the week data
					const updatedDays = currentWeekData.days.filter(
						(d: any) => d.dayNumber !== dayNumber
					)
					updatedDays.push(updatedDay)

					// Sort days by dayNumber
					updatedDays.sort((a: any, b: any) => a.dayNumber - b.dayNumber)

					// Call the update week mutation
					updateWeekMutation.mutate({
						programId: program.id,
						weekNumber: currentWeek,
						days: updatedDays,
					})

					addToast({
						type: "success",
						title: "Day pasted",
						message: `Day ${dayNumber} has been updated with clipboard content.`,
					})
				} else {
					addToast({
						type: "error",
						title: "Nothing to paste",
						message: "Clipboard is empty.",
					})
				}
				break
		}
	}

	return (
		<div className="space-y-6">
			{/* Clean Week Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-2xl font-bold text-white">
						{currentWeekData.title || `Week ${currentWeek}`}
					</h3>
					{currentWeekData.description && (
						<p className="text-gray-400 text-sm mt-1">
							{currentWeekData.description}
						</p>
					)}
				</div>
				{/* Remove Week Button - Clean Design */}
				<button
					onClick={() => {
						if (
							confirm(
								`Are you sure you want to delete Week ${currentWeek}? This will remove all days and exercises in this week.`
							)
						) {
							deleteWeekMutation.mutate({
								programId: program.id,
								weekNumber: currentWeek,
							})
						}
					}}
					disabled={deleteWeekMutation.isPending}
					className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
					title="Remove Week"
				>
					{deleteWeekMutation.isPending ? (
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
					) : (
						<Trash2 className="h-4 w-4" />
					)}
					{deleteWeekMutation.isPending ? "Deleting..." : "Remove Week"}
				</button>
			</div>

			{/* Clean Days Grid */}
			<div className="grid grid-cols-7 gap-6">
				{DAYS_OF_WEEK.map((day) => {
					const dayData = currentWeekData.days.find(
						(d: any) => d.dayNumber === day.number
					)
					const dayId = `${currentWeek}-${day.number}`
					const isSelected = selectedDays.includes(dayId)
					const isRestDay = dayData?.isRestDay || false

					return (
						<div
							key={day.number}
							className={`relative rounded-xl border transition-all duration-300 hover:shadow-lg ${
								isSelected
									? "ring-2 ring-blue-500 border-blue-500 shadow-blue-500/20"
									: "border-gray-700 hover:border-gray-600 hover:shadow-gray-500/10"
							}`}
							style={{
								backgroundColor: "#1F2323",
							}}
						>
							{/* Clean Day Header */}
							<div className="flex items-center justify-between p-4 border-b border-gray-700">
								<div className="flex items-center gap-3">
									<button
										onClick={(e) => handleDayClick(day.number, e)}
										className={`text-sm font-semibold transition-colors ${
											isSelected ? "text-blue-400" : "text-white"
										}`}
									>
										{day.name}
									</button>
									{isRestDay && (
										<span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
											Rest
										</span>
									)}
								</div>
								{/* Clean Menu Button */}
								<div className="relative">
									<button
										onClick={() =>
											setShowDayMenu(showDayMenu === dayId ? null : dayId)
										}
										className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-all duration-200 hover:scale-105"
									>
										<MoreVertical className="h-4 w-4 text-gray-400" />
									</button>

									{/* Clean Day Menu */}
									{showDayMenu === dayId && (
										<div className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl z-20 bg-gray-800 border-gray-600">
											<div className="p-2">
												<div className="text-xs font-medium text-gray-400 px-3 py-2">
													Day Actions
												</div>
												<button
													onClick={() => handleDayMenuClick(day.number, "rest")}
													className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white hover:bg-gray-700/50 rounded-lg transition-colors"
												>
													<Zap className="h-4 w-4 text-orange-400" />
													{isRestDay ? "Remove Rest Day" : "Set as Rest Day"}
												</button>
												<button
													onClick={() =>
														handleDayMenuClick(day.number, "warmup")
													}
													className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white hover:bg-gray-700/50 rounded-lg transition-colors"
												>
													<Zap className="h-4 w-4 text-yellow-400" />
													Add Warmup
												</button>
												<div className="border-t border-gray-600 my-2"></div>
												<div className="text-xs font-medium text-gray-400 px-3 py-2">
													Clipboard
												</div>
												<button
													onClick={() =>
														handleDayMenuClick(day.number, "paste")
													}
													className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white hover:bg-gray-700/50 rounded-lg transition-colors"
												>
													<Plus className="h-4 w-4 text-green-400" />
													Paste
												</button>
												<button
													onClick={() => handleDayMenuClick(day.number, "copy")}
													className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white hover:bg-gray-700/50 rounded-lg transition-colors"
												>
													<Copy className="h-4 w-4 text-blue-400" />
													Copy
												</button>
												<button
													onClick={() => handleDayMenuClick(day.number, "cut")}
													className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white hover:bg-gray-700/50 rounded-lg transition-colors"
												>
													<Scissors className="h-4 w-4 text-purple-400" />
													Cut
												</button>
												<div className="border-t border-gray-600 my-2"></div>
												<button
													onClick={() =>
														handleDayMenuClick(day.number, "delete")
													}
													className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
												>
													<Trash2 className="h-4 w-4" />
													Delete Day
												</button>
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Clean Day Content */}
							<div className="p-4">
								{isRestDay ? (
									<div className="text-center py-12">
										<div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
											<Zap className="h-6 w-6 text-orange-400" />
										</div>
										<div className="text-orange-300 text-sm font-medium">
											Rest Day
										</div>
										<p className="text-gray-500 text-xs mt-1">
											No exercises scheduled
										</p>
									</div>
								) : dayData ? (
									<DayColumn
										day={dayData}
										dayNumber={day.number}
										weekNumber={currentWeek}
										programId={program.id}
										isSelected={isSelected}
									/>
								) : (
									<div className="text-center py-12">
										<div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
											<Plus className="h-6 w-6 text-gray-400" />
										</div>
										<button
											onClick={() => {
												createDayMutation.mutate({
													programId: program.id,
													weekNumber: currentWeek,
													dayNumber: day.number,
													title: day.name,
													description: "",
												})
											}}
											disabled={createDayMutation.isPending}
											className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 mx-auto disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white"
										>
											{createDayMutation.isPending ? (
												<LoadingSpinner size="sm" />
											) : (
												<Plus className="h-4 w-4" />
											)}
											{createDayMutation.isPending ? "Creating..." : "Add Day"}
										</button>
									</div>
								)}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
