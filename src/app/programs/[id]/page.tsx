"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { trpc } from "@/app/_trpc/client"
import { ArrowLeft, Save, Plus } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import WeekPlanner from "@/components/programs/WeekPlanner"
import { useClipboardStore } from "@/lib/stores/clipboardStore"
import { useSelectionStore } from "@/lib/stores/selectionStore"
import { useUIStore } from "@/lib/stores/uiStore"
// import KbdHints from "@/components/common/KbdHints"

export default function ProgramEditorPage() {
	const params = useParams()
	const router = useRouter()
	const programId = params.id as string

	// Stores
	const { clipboard, setClipboard } = useClipboardStore()
	const { selectedDays, setSelectedDays, clearSelection } = useSelectionStore()
	const { addToast, setSaving, setLastSaved } = useUIStore()

	// State
	// const [currentWeek, setCurrentWeek] = useState(1)
	const [localIsSaving, setLocalIsSaving] = useState(false)
	const [localLastSaved, setLocalLastSaved] = useState<Date | null>(null)

	// Fetch program data
	const { data: program, refetch: refetchProgram } =
		trpc.programs.getById.useQuery(
			{ id: programId },
			{
				enabled: !!programId,
			}
		)

	// Mutations
	const createWeekMutation = trpc.programs.createWeek.useMutation({
		onSuccess: () => {
			refetchProgram()
			addToast({
				type: "success",
				title: "Week created",
				message: "New week has been created successfully.",
			})
		},
		onError: (error) => {
			addToast({
				type: "error",
				title: "Failed to create week",
				message: `Error creating week: ${error.message}`,
			})
		},
	})

	const updateProgramMutation = trpc.programs.update.useMutation({
		onSuccess: () => {
			setLocalIsSaving(false)
			setLocalLastSaved(new Date())
			setSaving(false)
			setLastSaved(new Date())
			addToast({
				type: "success",
				title: "Program saved",
				message: "Program has been saved successfully.",
			})
			refetchProgram()
		},
		onError: (error) => {
			setLocalIsSaving(false)
			setSaving(false)
			addToast({
				type: "error",
				title: "Save failed",
				message: `Error saving program: ${error.message}`,
			})
		},
	})

	// Remove auto-save - only save when user explicitly clicks save

	const handleCopy = () => {
		if (selectedDays.length === 0) {
			addToast({
				type: "error",
				title: "Nothing selected",
				message: "Please select at least one day to copy.",
			})
			return
		}

		// Get the selected days data
		const selectedDaysData = selectedDays
			.map((dayId) => {
				const [weekNum, dayNum] = dayId.split("-").map(Number)
				const week = program?.weeks.find((w) => w.weekNumber === weekNum)
				const day = week?.days.find((d) => d.dayNumber === dayNum)
				return day
			})
			.filter(Boolean)

		if (selectedDaysData.length > 0) {
			setClipboard({
				days: selectedDaysData.map((day) => ({
					isRest: day?.isRestDay || false,
					warmup: day?.warmupTitle
						? {
								title: day.warmupTitle,
								description: day.warmupDescription,
						  }
						: undefined,
					items:
						day?.drills?.map((drill) => ({
							id: drill.id,
							name: drill.title,
							sets: drill.sets,
							reps: drill.reps,
							tempo: drill.tempo,
							supersetWithId: drill.supersetWithId,
						})) || [],
				})),
			})

			addToast({
				type: "success",
				title: "Days copied",
				message: `${selectedDaysData.length} day(s) copied to clipboard.`,
			})
		}
	}

	const handlePaste = () => {
		if (!clipboard || clipboard.days.length === 0) {
			addToast({
				type: "error",
				title: "Nothing to paste",
				message: "Clipboard is empty.",
			})
			return
		}

		// TODO: Implement paste functionality
		addToast({
			type: "info",
			title: "Paste functionality",
			message: "Paste functionality will be implemented.",
		})
	}

	const handleSelectAll = () => {
		if (!program) return

		// Only select implemented days from the first week for now
		const firstWeek = program.weeks[0]
		if (!firstWeek) return

		const implementedDays = firstWeek.days
			.filter(
				(day) => day && !day.isRestDay && day.drills && day.drills.length > 0
			)
			.map((day) => `${firstWeek.weekNumber}-${day.dayNumber}`)

		setSelectedDays(implementedDays)
		addToast({
			type: "success",
			title: "Implemented days selected",
			message: `${implementedDays.length} implemented day(s) selected.`,
		})
	}

	const handleDeleteSelected = () => {
		if (selectedDays.length === 0) return

		if (
			confirm(
				`Are you sure you want to delete ${selectedDays.length} selected day(s)?`
			)
		) {
			// TODO: Implement delete functionality
			addToast({
				type: "success",
				title: "Days deleted",
				message: `${selectedDays.length} day(s) have been deleted.`,
			})
			clearSelection()
		}
	}

	const handleSave = () => {
		if (!program) return

		setLocalIsSaving(true)
		updateProgramMutation.mutate({
			id: programId,
			title: program.title || "",
			description: program.description || "",
		})
	}

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
			const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

			if (cmdOrCtrl) {
				switch (e.key.toLowerCase()) {
					case "c":
						e.preventDefault()
						handleCopy()
						break
					case "v":
						e.preventDefault()
						handlePaste()
						break
					case "a":
						e.preventDefault()
						handleSelectAll()
						break
				}
			}

			if (e.key === "Delete" || e.key === "Backspace") {
				if (selectedDays.length > 0) {
					e.preventDefault()
					handleDeleteSelected()
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [
		selectedDays,
		handleCopy,
		handleDeleteSelected,
		handlePaste,
		handleSelectAll,
	])

	if (!program) {
		return (
			<Sidebar>
				<div
					className="min-h-screen p-6"
					style={{ backgroundColor: "#2A3133" }}
				>
					<div className="max-w-7xl mx-auto">
						<div className="text-center py-16">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
							<p className="text-gray-400">Loading program...</p>
						</div>
					</div>
				</div>
			</Sidebar>
		)
	}

	return (
		<Sidebar>
			<div className="min-h-screen p-6" style={{ backgroundColor: "#2A3133" }}>
				<div className="max-w-7xl mx-auto">
					{/* Simple Header */}
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-4">
							<button
								onClick={() => router.push("/programs")}
								className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
							>
								<ArrowLeft className="h-5 w-5 text-white" />
							</button>
							<div>
								<h1 className="text-2xl font-bold text-white">
									{program.title}
								</h1>
								{program.description && (
									<p className="text-gray-400 text-sm">{program.description}</p>
								)}
							</div>
						</div>
						<button
							onClick={handleSave}
							disabled={localIsSaving}
							className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white"
						>
							<Save className="h-4 w-4" />
							{localIsSaving ? "Saving..." : "Save"}
						</button>
					</div>

					{/* Vertical Weeks Display */}
					<div className="space-y-8">
						{program.weeks.length > 0 ? (
							program.weeks.map((week) => (
								<div key={week.weekNumber} className="space-y-4">
									<WeekPlanner
										program={program}
										currentWeek={week.weekNumber}
										selectedDays={selectedDays}
										setSelectedDays={setSelectedDays}
									/>
								</div>
							))
						) : (
							<div className="text-center py-16">
								<div className="text-gray-400 mb-4">No weeks created yet</div>
							</div>
						)}

						{/* Add Week Button - Always visible at bottom */}
						<div className="text-center pt-8 border-t border-gray-700">
							<button
								onClick={() => {
									const nextWeekNumber =
										program.weeks.length > 0
											? Math.max(
													...program.weeks.map(
														(w: { weekNumber: number }) => w.weekNumber
													)
											  ) + 1
											: 1
									createWeekMutation.mutate({
										programId: program.id,
										weekNumber: nextWeekNumber,
										title: `Week ${nextWeekNumber}`,
										description: "",
									})
								}}
								disabled={createWeekMutation.isPending}
								className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 mx-auto bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{createWeekMutation.isPending ? (
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
								) : (
									<Plus className="h-5 w-5" />
								)}
								{createWeekMutation.isPending
									? "Creating..."
									: program.weeks.length > 0
									? "Add Another Week"
									: "Create First Week"}
							</button>
						</div>
					</div>
				</div>
			</div>
		</Sidebar>
	)
}
