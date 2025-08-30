"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/app/_trpc/client"
import {
	Calendar,
	ChevronLeft,
	ChevronRight,
	Check,
	Clock,
	Play,
	MessageSquare,
	Upload,
	Calendar as CalendarIcon,
	CalendarDays,
	Target,
	User,
	Send,
	X,
	Users,
	Video,
	TrendingUp,
	BarChart3,
	Loader2,
	ArrowRight,
	ArrowLeft,
	BookOpen,
	Dumbbell,
	Zap,
	Star,
	CheckCircle2,
	PlayCircle,
	Timer,
	Award,
	CalendarCheck,
	CalendarX,
	CalendarClock,
} from "lucide-react"
import ClientVideoSubmissionModal from "./ClientVideoSubmissionModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
	format,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	isSameDay,
	addMonths,
	subMonths,
	startOfWeek,
	endOfWeek,
	isSameMonth,
	addDays,
	isToday,
	isPast,
	isFuture,
} from "date-fns"
import ClientSidebar from "@/components/ClientSidebar"

interface Drill {
	id: string
	title: string
	sets?: number
	reps?: number
	tempo?: string
	tags?: string[]
	completed?: boolean
	videoUrl?: string
}

interface DayData {
	date: string
	drills: Drill[]
	isRestDay: boolean
	expectedTime: number
	completedDrills: number
	totalDrills: number
}

interface ProgramInfo {
	id: string
	title: string
	description?: string
	startDate: string
	endDate: string
	currentWeek: number
	totalWeeks: number
	overallProgress: number
	coachName: string
}

interface WeeklyStats {
	totalWorkouts: number
	completedWorkouts: number
	totalDrills: number
	completedDrills: number
	weeklyProgress: number
	streak: number
}

export default function ClientProgramPage() {
	const [currentDate, setCurrentDate] = useState(new Date())
	const [viewMode, setViewMode] = useState<"month" | "week">("month")
	const [selectedDay, setSelectedDay] = useState<DayData | null>(null)
	const [isDaySheetOpen, setIsDaySheetOpen] = useState(false)
	const [noteToCoach, setNoteToCoach] = useState("")
	const [isSubmittingNote, setIsSubmittingNote] = useState(false)
	const [isVideoSubmissionModalOpen, setIsVideoSubmissionModalOpen] =
		useState(false)
	const [selectedDrillForVideo, setSelectedDrillForVideo] = useState<{
		id: string
		title: string
	} | null>(null)
	const [selectedVideo, setSelectedVideo] = useState<any>(null)
	const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false)
	const [selectedDrillForComment, setSelectedDrillForComment] =
		useState<any>(null)
	const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
	const [commentText, setCommentText] = useState("")
	const [isSubmittingComment, setIsSubmittingComment] = useState(false)
	const [activeTab, setActiveTab] = useState<
		"overview" | "calendar" | "progress"
	>("overview")

	// Get client's assigned program
	const { data: programInfo } = trpc.clientRouter.getAssignedProgram.useQuery()
	const { data: calendarData } = trpc.clientRouter.getProgramCalendar.useQuery({
		year: currentDate.getFullYear(),
		month: currentDate.getMonth() + 1,
		viewMode,
	})

	// Get client's lessons
	const { data: clientLessons = [] } =
		trpc.clientRouter.getClientLessons.useQuery({
			month: currentDate.getMonth(),
			year: currentDate.getFullYear(),
		})

	// Get library items for video lookup
	const { data: libraryItems = [] } = trpc.library.list.useQuery({})

	// Add comment to drill mutation (handles both video comments and messages)
	const addCommentToDrillMutation =
		trpc.clientRouter.addCommentToDrill.useMutation()

	// Mutations
	const markDrillCompleteMutation = trpc.workouts.markComplete.useMutation()

	const sendNoteToCoachMutation = trpc.clientRouter.sendNoteToCoach.useMutation(
		{
			onSuccess: () => {
				setNoteToCoach("")
				setIsSubmittingNote(false)
			},
		}
	)

	// Calendar navigation
	const goToPreviousMonth = () => {
		setCurrentDate((prev) => {
			const newDate = new Date(prev)
			newDate.setMonth(prev.getMonth() - 1)
			return newDate
		})
	}

	const goToNextMonth = () => {
		setCurrentDate((prev) => {
			const newDate = new Date(prev)
			newDate.setMonth(prev.getMonth() + 1)
			return newDate
		})
	}

	const goToToday = () => {
		setCurrentDate(new Date())
	}

	// Generate calendar days for the current month view
	const monthStart = startOfMonth(currentDate)
	const monthEnd = endOfMonth(currentDate)
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
	const calendarDays = eachDayOfInterval({
		start: calendarStart,
		end: calendarEnd,
	})

	const navigateMonth = (direction: "prev" | "next") => {
		setCurrentDate(
			direction === "prev"
				? subMonths(currentDate, 1)
				: addMonths(currentDate, 1)
		)
	}

	const getLessonsForDate = (date: Date) => {
		const now = new Date()
		const lessons = clientLessons.filter((lesson: any) => {
			const lessonDate = new Date(lesson.date)
			const lessonDateOnly = new Date(
				lessonDate.getFullYear(),
				lessonDate.getMonth(),
				lessonDate.getDate()
			)
			const targetDateOnly = new Date(
				date.getFullYear(),
				date.getMonth(),
				date.getDate()
			)
			const isSame = lessonDateOnly.getTime() === targetDateOnly.getTime()
			const isFuture = lessonDate > now
			return isSame && isFuture
		})
		return lessons
	}

	// Get day data from calendar data
	const getDayData = (date: Date): DayData | null => {
		if (!calendarData) return null
		const dateString = date.toISOString().split("T")[0]
		return calendarData[dateString] || null
	}

	// Handle drill completion
	const handleMarkDrillComplete = async (
		drillId: string,
		completed: boolean
	) => {
		await markDrillCompleteMutation.mutateAsync({
			workoutId: drillId,
			completed,
		})
	}

	// Handle marking all drills complete
	const handleMarkAllComplete = async () => {
		if (!selectedDay) return

		if (confirm("Mark all drills for this day as complete?")) {
			for (const drill of selectedDay.drills) {
				if (!drill.completed) {
					await markDrillCompleteMutation.mutateAsync({
						workoutId: drill.id,
						completed: true,
					})
				}
			}
		}
	}

	// Handle sending note to coach
	const handleSendNote = async () => {
		if (!noteToCoach.trim() || !selectedDay) return

		setIsSubmittingNote(true)
		await sendNoteToCoachMutation.mutateAsync({
			date: selectedDay.date,
			note: noteToCoach,
		})
	}

	// Handle video submission
	const handleSubmitVideo = (drillId: string, drillTitle: string) => {
		setSelectedDrillForVideo({ id: drillId, title: drillTitle })
		setIsVideoSubmissionModalOpen(true)
	}

	// Handle opening video player
	const handleOpenVideo = async (videoUrl: string) => {
		console.log("Opening video with URL:", videoUrl)
		console.log("Available library items:", libraryItems)

		// Find the video in the library based on the URL
		const videoItem = libraryItems?.find((item: any) => {
			// Direct URL match
			if (item.url === videoUrl) return true

			// YouTube ID match
			if (item.isYoutube && item.youtubeId) {
				// Check if the videoUrl contains the YouTube ID
				if (videoUrl.includes(item.youtubeId)) return true

				// Check if it's a YouTube embed URL
				if (videoUrl.includes(`youtube.com/embed/${item.youtubeId}`))
					return true

				// Check if it's a YouTube watch URL
				if (videoUrl.includes(`youtube.com/watch?v=${item.youtubeId}`))
					return true
			}

			return false
		})

		console.log("Found video item:", videoItem)

		if (videoItem) {
			setSelectedVideo(videoItem)
			setIsVideoPlayerOpen(true)
		} else {
			// If no match found, try to extract YouTube ID from URL
			const youtubeIdMatch = videoUrl.match(
				/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
			)
			if (youtubeIdMatch) {
				const youtubeId = youtubeIdMatch[1]
				setSelectedVideo({
					isYoutube: true,
					youtubeId: youtubeId,
					title: "YouTube Video",
					url: videoUrl,
				})
				setIsVideoPlayerOpen(true)
			} else {
				// Fallback: treat as direct video URL
				setSelectedVideo({ url: videoUrl, type: "video" })
				setIsVideoPlayerOpen(true)
			}
		}
	}

	// Handle closing video player
	const handleCloseVideo = () => {
		setIsVideoPlayerOpen(false)
		setSelectedVideo(null)
	}

	// Handle opening comment modal
	const handleOpenCommentModal = (drill: any) => {
		setSelectedDrillForComment(drill)
		setIsCommentModalOpen(true)
	}

	// Handle closing comment modal
	const handleCloseCommentModal = () => {
		setIsCommentModalOpen(false)
		setSelectedDrillForComment(null)
		setCommentText("")
	}

	// Handle submitting comment
	const handleSubmitComment = async () => {
		if (!commentText.trim() || !selectedDrillForComment) return

		setIsSubmittingComment(true)
		try {
			// Use the new mutation that handles both video comments and messages
			const result = await addCommentToDrillMutation.mutateAsync({
				drillId: selectedDrillForComment.id,
				comment: commentText,
			})

			console.log("Comment submission result:", result)
		} catch (error) {
			console.error("Failed to submit comment:", error)
		} finally {
			setIsSubmittingComment(false)
			handleCloseCommentModal()
		}
	}

	// Get status for a day
	const getDayStatus = (dayData: DayData | null) => {
		if (!dayData) return null
		if (dayData.isRestDay) return { type: "rest", label: "Rest", icon: "🛌" }
		if (dayData.completedDrills === dayData.totalDrills)
			return { type: "complete", label: "Complete", icon: "✅" }
		if (dayData.completedDrills > 0)
			return { type: "partial", label: "Partial", icon: "🔄" }
		return { type: "pending", label: "Pending", icon: "⏳" }
	}

	// Get status color
	const getStatusColor = (status: string) => {
		switch (status) {
			case "complete":
				return "bg-green-100 text-green-800 border-green-200"
			case "partial":
				return "bg-yellow-100 text-yellow-800 border-yellow-200"
			case "rest":
				return "bg-blue-100 text-blue-800 border-blue-200"
			default:
				return "bg-gray-100 text-gray-800 border-gray-200"
		}
	}

	return (
		<ClientSidebar>
			<div className="min-h-screen p-8" style={{ backgroundColor: "#2a3133" }}>
				{/* Header Section with Gradient Background */}
				<div className="mb-12">
					<div
						className="rounded-3xl p-8 mb-8 relative overflow-hidden"
						style={{
							background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
							border: "1px solid #606364",
						}}
					>
						{/* Decorative background elements */}
						<div className="absolute top-0 right-0 w-32 h-32 opacity-10">
							<div
								className="w-full h-full rounded-full"
								style={{
									background: "linear-gradient(45deg, #4A5A70, #606364)",
								}}
							></div>
						</div>
						<div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
							<div
								className="w-full h-full rounded-full"
								style={{
									background: "linear-gradient(45deg, #4A5A70, #606364)",
								}}
							></div>
						</div>

						<div className="relative z-10 flex items-center justify-between">
							<div>
								<h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
									My Training Program
								</h1>
								<div
									className="text-xl flex items-center gap-3"
									style={{ color: "#ABA4AA" }}
								>
									<div
										className="p-2 rounded-full"
										style={{ backgroundColor: "#4A5A70" }}
									>
										<Dumbbell
											className="h-5 w-5"
											style={{ color: "#C3BCC2" }}
										/>
									</div>
									<span>Track your progress and stay on schedule</span>
								</div>
								<div className="mt-4">
									<button
										onClick={() => setActiveTab("calendar")}
										className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
										style={{
											backgroundColor: "#10B981",
											color: "#C3BCC2",
										}}
									>
										<Calendar className="h-4 w-4" />
										View Full Program Calendar
									</button>
								</div>
							</div>
							<div className="text-right">
								<div
									className="text-4xl font-bold mb-2"
									style={{ color: "#C3BCC2" }}
								>
									{new Date().toLocaleDateString()}
								</div>
								<div
									className="text-lg px-4 py-2 rounded-full inline-block"
									style={{
										backgroundColor: "#4A5A70",
										color: "#C3BCC2",
									}}
								>
									{new Date().toLocaleDateString("en-US", { weekday: "long" })}
								</div>
							</div>
						</div>
					</div>

					{/* Navigation Tabs */}
					<div className="flex items-center justify-center mb-8">
						<div
							className="flex rounded-2xl p-1"
							style={{
								backgroundColor: "#353A3A",
								border: "1px solid #606364",
							}}
						>
							{[
								{
									id: "overview",
									label: "Overview",
									icon: <BarChart3 className="h-4 w-4" />,
								},
								{
									id: "calendar",
									label: "Calendar",
									icon: <Calendar className="h-4 w-4" />,
								},
								{
									id: "progress",
									label: "Progress",
									icon: <TrendingUp className="h-4 w-4" />,
								},
							].map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id as any)}
									className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
										activeTab === tab.id
											? "shadow-lg border"
											: "hover:scale-105"
									}`}
									style={{
										backgroundColor:
											activeTab === tab.id ? "#4A5A70" : "transparent",
										borderColor:
											activeTab === tab.id ? "#4A5A70" : "transparent",
										color: activeTab === tab.id ? "#C3BCC2" : "#ABA4AA",
									}}
								>
									{tab.icon}
									<span className="font-medium">{tab.label}</span>
								</button>
							))}
						</div>
					</div>

					{/* Main Content Based on Active Tab */}
					{activeTab === "overview" && (
						<div className="space-y-8">
							{/* Program Overview Cards */}
							{programInfo && (
								<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
									<div
										className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
										style={{
											background:
												"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
											borderColor: "#4A5A70",
										}}
									>
										<div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										<div className="relative z-10">
											<div className="flex items-center justify-between mb-6">
												<div
													className="p-3 rounded-2xl"
													style={{ backgroundColor: "#4A5A70" }}
												>
													<BookOpen
														className="h-8 w-8"
														style={{ color: "#C3BCC2" }}
													/>
												</div>
												<span
													className="text-4xl font-bold"
													style={{ color: "#C3BCC2" }}
												>
													{programInfo.currentWeek}
												</span>
											</div>
											<h3
												className="text-xl font-bold mb-3"
												style={{ color: "#C3BCC2" }}
											>
												Current Week
											</h3>
											<p className="text-base" style={{ color: "#ABA4AA" }}>
												of {programInfo.totalWeeks} weeks
											</p>
										</div>
									</div>

									<div
										className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
										style={{
											background:
												"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
											borderColor: "#10B981",
										}}
									>
										<div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										<div className="relative z-10">
											<div className="flex items-center justify-between mb-6">
												<div
													className="p-3 rounded-2xl"
													style={{ backgroundColor: "#10B981" }}
												>
													<TrendingUp
														className="h-8 w-8"
														style={{ color: "#C3BCC2" }}
													/>
												</div>
												<span
													className="text-4xl font-bold"
													style={{ color: "#C3BCC2" }}
												>
													{Math.round(programInfo.overallProgress)}%
												</span>
											</div>
											<h3
												className="text-xl font-bold mb-3"
												style={{ color: "#C3BCC2" }}
											>
												Overall Progress
											</h3>
											<p className="text-base" style={{ color: "#ABA4AA" }}>
												Program completion
											</p>
										</div>
									</div>

									<div
										className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
										style={{
											background:
												"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
											borderColor: "#F59E0B",
										}}
									>
										<div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										<div className="relative z-10">
											<div className="flex items-center justify-between mb-6">
												<div
													className="p-3 rounded-2xl"
													style={{ backgroundColor: "#F59E0B" }}
												>
													<User
														className="h-8 w-8"
														style={{ color: "#C3BCC2" }}
													/>
												</div>
												<span
													className="text-2xl font-bold"
													style={{ color: "#C3BCC2" }}
												>
													{programInfo.coachName}
												</span>
											</div>
											<h3
												className="text-xl font-bold mb-3"
												style={{ color: "#C3BCC2" }}
											>
												Your Coach
											</h3>
											<p className="text-base" style={{ color: "#ABA4AA" }}>
												Professional guidance
											</p>
										</div>
									</div>

									<div
										className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
										style={{
											background:
												"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
											borderColor: "#8B5CF6",
										}}
									>
										<div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										<div className="relative z-10">
											<div className="flex items-center justify-between mb-6">
												<div
													className="p-3 rounded-2xl"
													style={{ backgroundColor: "#8B5CF6" }}
												>
													<Award
														className="h-8 w-8"
														style={{ color: "#C3BCC2" }}
													/>
												</div>
												<span
													className="text-4xl font-bold"
													style={{ color: "#C3BCC2" }}
												>
													{programInfo.title}
												</span>
											</div>
											<h3
												className="text-xl font-bold mb-3"
												style={{ color: "#C3BCC2" }}
											>
												Program Name
											</h3>
											<p className="text-base" style={{ color: "#ABA4AA" }}>
												Active training plan
											</p>
										</div>
									</div>
								</div>
							)}

							{/* All Assigned Programs Section */}
							{programInfo && programInfo.totalPrograms > 1 && (
								<div
									className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
									style={{
										background:
											"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
										borderColor: "#4A5A70",
									}}
								>
									<div className="flex items-center justify-between mb-8">
										<div className="flex items-center gap-4">
											<div
												className="p-3 rounded-2xl"
												style={{ backgroundColor: "#4A5A70" }}
											>
												<BookOpen
													className="h-6 w-6"
													style={{ color: "#C3BCC2" }}
												/>
											</div>
											<h2
												className="text-3xl font-bold"
												style={{ color: "#C3BCC2" }}
											>
												All Your Programs
											</h2>
										</div>
										<div
											className="px-4 py-2 rounded-full"
											style={{ backgroundColor: "#4A5A70" }}
										>
											<span
												className="text-lg font-semibold"
												style={{ color: "#C3BCC2" }}
											>
												{programInfo.totalPrograms} Active
											</span>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
										{programInfo.allPrograms?.map(
											(program: any, index: number) => (
												<div
													key={program.id}
													className={`rounded-2xl p-6 transition-all duration-200 hover:scale-105 shadow-lg border ${
														index === 0 ? "ring-2 ring-blue-500" : ""
													}`}
													style={{
														backgroundColor: "#2B3038",
														borderColor: index === 0 ? "#3B82F6" : "#4A5A70",
														borderWidth: "1px",
													}}
												>
													<div className="flex items-center justify-between mb-4">
														<h3
															className="text-lg font-bold"
															style={{ color: "#C3BCC2" }}
														>
															{program.title}
														</h3>
														{index === 0 && (
															<span
																className="px-2 py-1 rounded-full text-xs font-medium"
																style={{
																	backgroundColor: "#3B82F6",
																	color: "#ffffff",
																}}
															>
																Primary
															</span>
														)}
													</div>
													<div className="space-y-3">
														<div className="flex items-center justify-between">
															<span
																className="text-sm"
																style={{ color: "#ABA4AA" }}
															>
																Week:
															</span>
															<span
																className="text-sm font-medium"
																style={{ color: "#C3BCC2" }}
															>
																{program.currentWeek} of {program.totalWeeks}
															</span>
														</div>
														<div className="flex items-center justify-between">
															<span
																className="text-sm"
																style={{ color: "#ABA4AA" }}
															>
																Progress:
															</span>
															<span
																className="text-sm font-medium"
																style={{ color: "#C3BCC2" }}
															>
																{Math.round(program.overallProgress)}%
															</span>
														</div>
														<div className="flex items-center justify-between">
															<span
																className="text-sm"
																style={{ color: "#ABA4AA" }}
															>
																Started:
															</span>
															<span
																className="text-sm font-medium"
																style={{ color: "#C3BCC2" }}
															>
																{new Date(
																	program.assignedAt
																).toLocaleDateString()}
															</span>
														</div>
													</div>
													{program.description && (
														<p
															className="text-sm mt-3"
															style={{ color: "#ABA4AA" }}
														>
															{program.description}
														</p>
													)}
												</div>
											)
										)}
									</div>
									<div
										className="mt-6 p-4 rounded-xl"
										style={{ backgroundColor: "#2B3038" }}
									>
										<p className="text-sm" style={{ color: "#ABA4AA" }}>
											💡 <strong>Note:</strong> Your calendar shows workouts
											from all assigned programs. The primary program
											(highlighted) is your most recent assignment.
										</p>
									</div>
								</div>
							)}

							{/* Quick Actions */}
							{programInfo && (
								<div
									className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden mb-8"
									style={{
										background:
											"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
										borderColor: "#4A5A70",
									}}
								>
									<div className="flex items-center justify-between mb-8">
										<div className="flex items-center gap-4">
											<div
												className="p-3 rounded-2xl"
												style={{ backgroundColor: "#4A5A70" }}
											>
												<Zap className="h-6 w-6" style={{ color: "#C3BCC2" }} />
											</div>
											<h2
												className="text-3xl font-bold"
												style={{ color: "#C3BCC2" }}
											>
												Quick Actions
											</h2>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
										<button
											onClick={() => setActiveTab("calendar")}
											className="rounded-2xl p-6 border transition-all duration-200 hover:scale-105 text-left"
											style={{
												backgroundColor: "#2B3038",
												borderColor: "#4A5A70",
											}}
										>
											<div className="flex items-center gap-3 mb-3">
												<div
													className="p-2 rounded-xl"
													style={{ backgroundColor: "#10B981" }}
												>
													<Calendar
														className="h-5 w-5"
														style={{ color: "#C3BCC2" }}
													/>
												</div>
												<h3
													className="text-lg font-bold"
													style={{ color: "#C3BCC2" }}
												>
													View Calendar
												</h3>
											</div>
											<p className="text-sm" style={{ color: "#ABA4AA" }}>
												See your complete program schedule with all workouts and
												rest days
											</p>
										</button>

										<button
											onClick={() => setActiveTab("progress")}
											className="rounded-2xl p-6 border transition-all duration-200 hover:scale-105 text-left"
											style={{
												backgroundColor: "#2B3038",
												borderColor: "#4A5A70",
											}}
										>
											<div className="flex items-center gap-3 mb-3">
												<div
													className="p-2 rounded-xl"
													style={{ backgroundColor: "#F59E0B" }}
												>
													<TrendingUp
														className="h-5 w-5"
														style={{ color: "#C3BCC2" }}
													/>
												</div>
												<h3
													className="text-lg font-bold"
													style={{ color: "#C3BCC2" }}
												>
													Track Progress
												</h3>
											</div>
											<p className="text-sm" style={{ color: "#ABA4AA" }}>
												Monitor your weekly progress and completion rates
											</p>
										</button>

										<div
											className="rounded-2xl p-6 border"
											style={{
												backgroundColor: "#2B3038",
												borderColor: "#4A5A70",
											}}
										>
											<div className="flex items-center gap-3 mb-3">
												<div
													className="p-2 rounded-xl"
													style={{ backgroundColor: "#8B5CF6" }}
												>
													<MessageSquare
														className="h-5 w-5"
														style={{ color: "#C3BCC2" }}
													/>
												</div>
												<h3
													className="text-lg font-bold"
													style={{ color: "#C3BCC2" }}
												>
													Contact Coach
												</h3>
											</div>
											<p className="text-sm" style={{ color: "#ABA4AA" }}>
												Send notes or questions to your coach
											</p>
										</div>

										<div
											className="rounded-2xl p-6 border"
											style={{
												backgroundColor: "#2B3038",
												borderColor: "#4A5A70",
											}}
										>
											<div className="flex items-center gap-3 mb-3">
												<div
													className="p-2 rounded-xl"
													style={{ backgroundColor: "#EF4444" }}
												>
													<Video
														className="h-5 w-5"
														style={{ color: "#C3BCC2" }}
													/>
												</div>
												<h3
													className="text-lg font-bold"
													style={{ color: "#C3BCC2" }}
												>
													Submit Videos
												</h3>
											</div>
											<p className="text-sm" style={{ color: "#ABA4AA" }}>
												Record and submit workout videos for feedback
											</p>
										</div>
									</div>
								</div>
							)}

							{/* This Week's Schedule */}
							<div
								className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden mb-8"
								style={{
									background:
										"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
									borderColor: "#4A5A70",
								}}
							>
								<div className="flex items-center justify-between mb-8">
									<div className="flex items-center gap-4">
										<div
											className="p-3 rounded-2xl"
											style={{ backgroundColor: "#4A5A70" }}
										>
											<Calendar
												className="h-6 w-6"
												style={{ color: "#C3BCC2" }}
											/>
										</div>
										<h2
											className="text-3xl font-bold"
											style={{ color: "#C3BCC2" }}
										>
											This Week's Schedule
										</h2>
									</div>
									<button
										onClick={() => setActiveTab("calendar")}
										className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
										style={{
											backgroundColor: "#10B981",
											color: "#C3BCC2",
										}}
									>
										<Calendar className="h-4 w-4" />
										View Full Calendar
									</button>
								</div>

								{/* Weekly Schedule Grid */}
								<div className="grid grid-cols-7 gap-4">
									{Array.from({ length: 7 }, (_, i) => {
										const day = addDays(startOfWeek(new Date()), i)
										const dayData = getDayData(day)
										const isTodayDay = isToday(day)
										const dayName = format(day, "EEE")
										const dayNumber = format(day, "d")

										return (
											<div
												key={i}
												className={`rounded-2xl p-4 transition-all duration-200 hover:scale-105 cursor-pointer ${
													isTodayDay ? "ring-2 ring-blue-500" : ""
												}`}
												style={{
													backgroundColor: "#2B3038",
													border: "1px solid #4A5A70",
												}}
												onClick={() => {
													if (
														dayData &&
														(dayData.drills.length > 0 || dayData.isRestDay)
													) {
														setSelectedDay(dayData)
														setIsDaySheetOpen(true)
													}
												}}
											>
												<div className="text-center mb-3">
													<div
														className={`text-sm font-medium mb-1 ${
															isTodayDay ? "text-blue-400" : "text-gray-400"
														}`}
													>
														{dayName}
													</div>
													<div
														className={`text-2xl font-bold ${
															isTodayDay ? "text-blue-400" : "text-white"
														}`}
													>
														{dayNumber}
													</div>
												</div>

												{dayData ? (
													dayData.isRestDay ? (
														<div className="text-center">
															<div className="text-2xl mb-1">🛌</div>
															<div className="text-xs text-gray-400">Rest</div>
														</div>
													) : dayData.drills.length > 0 ? (
														<div className="space-y-2">
															<div className="text-center">
																<div
																	className="text-xs font-medium"
																	style={{ color: "#10B981" }}
																>
																	{dayData.completedDrills}/
																	{dayData.totalDrills}
																</div>
															</div>
															{dayData.drills
																.slice(0, 2)
																.map((drill, index) => (
																	<div
																		key={index}
																		className="text-xs p-2 rounded"
																		style={{
																			backgroundColor: "#1F2426",
																			border: "1px solid #2A3133",
																		}}
																	>
																		<div
																			className="font-medium truncate"
																			style={{ color: "#C3BCC2" }}
																		>
																			{drill.title}
																		</div>
																		{drill.sets && drill.reps && (
																			<div
																				className="text-xs"
																				style={{ color: "#ABA4AA" }}
																			>
																				{drill.sets}×{drill.reps}
																			</div>
																		)}
																	</div>
																))}
															{dayData.drills.length > 2 && (
																<div className="text-center">
																	<span
																		className="text-xs"
																		style={{ color: "#ABA4AA" }}
																	>
																		+{dayData.drills.length - 2} more
																	</span>
																</div>
															)}
														</div>
													) : (
														<div className="text-center">
															<div
																className="text-xs"
																style={{ color: "#606364" }}
															>
																No workouts
															</div>
														</div>
													)
												) : (
													<div className="text-center">
														<div
															className="text-xs"
															style={{ color: "#606364" }}
														>
															No program
														</div>
													</div>
												)}
											</div>
										)
									})}
								</div>

								{/* Guidance Text */}
								<div
									className="mt-6 p-4 rounded-xl"
									style={{ backgroundColor: "#2B3038" }}
								>
									<p className="text-sm" style={{ color: "#ABA4AA" }}>
										💡 <strong>Tip:</strong> Click on any day to see detailed
										workouts, or use the "Calendar" tab above to view your full
										program schedule for the entire month.
									</p>
								</div>
							</div>

							{/* Today's Schedule */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
								{/* Today's Workouts */}
								<div
									className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
									style={{
										background:
											"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
										borderColor: "#4A5A70",
									}}
								>
									<div className="flex items-center justify-between mb-8">
										<div className="flex items-center gap-4">
											<div
												className="p-3 rounded-2xl"
												style={{ backgroundColor: "#4A5A70" }}
											>
												<Target
													className="h-6 w-6"
													style={{ color: "#C3BCC2" }}
												/>
											</div>
											<h2
												className="text-3xl font-bold"
												style={{ color: "#C3BCC2" }}
											>
												Today's Plan
											</h2>
										</div>
										<div
											className="px-4 py-2 rounded-full"
											style={{ backgroundColor: "#4A5A70" }}
										>
											<span
												className="text-lg font-semibold"
												style={{ color: "#C3BCC2" }}
											>
												{new Date().toLocaleDateString()}
											</span>
										</div>
									</div>

									{(() => {
										const today = new Date()
										const todaysLessons = getLessonsForDate(today)
										const todayData = getDayData(today)

										return (
											<div className="space-y-6">
												{/* Today's Lessons */}
												{todaysLessons.length > 0 && (
													<div className="space-y-4">
														<h3
															className="text-xl font-semibold"
															style={{ color: "#C3BCC2" }}
														>
															📅 Scheduled Lessons
														</h3>
														{todaysLessons.map((lesson: any, index: number) => (
															<div
																key={index}
																className="rounded-xl p-6 transition-all duration-200 hover:scale-102 shadow-lg border"
																style={{
																	backgroundColor: "#2B3038",
																	borderColor: "#10B981",
																	borderWidth: "1px",
																}}
															>
																<div className="flex items-center justify-between">
																	<div className="flex-1">
																		<div className="flex items-center gap-3 mb-2">
																			<div
																				className="p-2 rounded-full"
																				style={{ backgroundColor: "#10B981" }}
																			>
																				<CalendarCheck
																					className="h-4 w-4"
																					style={{ color: "#C3BCC2" }}
																				/>
																			</div>
																			<h4
																				className="text-lg font-semibold"
																				style={{ color: "#C3BCC2" }}
																			>
																				{format(
																					new Date(lesson.date),
																					"h:mm a"
																				)}
																			</h4>
																		</div>
																		<p
																			className="text-base mb-2"
																			style={{ color: "#ABA4AA" }}
																		>
																			{lesson.title || "Lesson with Coach"}
																		</p>
																		<div className="flex items-center gap-2">
																			<User
																				className="h-4 w-4"
																				style={{ color: "#ABA4AA" }}
																			/>
																			<span
																				className="text-sm"
																				style={{ color: "#ABA4AA" }}
																			>
																				{lesson.coach?.name || "Coach"}
																			</span>
																		</div>
																	</div>
																	<button
																		className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
																		style={{
																			backgroundColor: "#10B981",
																			color: "#C3BCC2",
																		}}
																	>
																		Join
																	</button>
																</div>
															</div>
														))}
													</div>
												)}

												{/* Today's Workouts */}
												{todayData && !todayData.isRestDay && (
													<div className="space-y-4">
														<h3
															className="text-xl font-semibold"
															style={{ color: "#C3BCC2" }}
														>
															💪 Today's Workouts
														</h3>
														{todayData.drills.map((drill) => (
															<div
																key={drill.id}
																className="rounded-xl p-6 transition-all duration-200 hover:scale-102 shadow-lg border"
																style={{
																	backgroundColor: "#2B3038",
																	borderColor: drill.completed
																		? "#10B981"
																		: "#606364",
																	borderWidth: "1px",
																}}
															>
																<div className="flex items-start justify-between">
																	<div className="flex-1">
																		<div className="flex items-center gap-3 mb-3">
																			<div
																				className={`p-2 rounded-full ${
																					drill.completed
																						? "bg-green-500"
																						: "bg-gray-600"
																				}`}
																			>
																				{drill.completed ? (
																					<CheckCircle2
																						className="h-4 w-4"
																						style={{ color: "#C3BCC2" }}
																					/>
																				) : (
																					<Dumbbell
																						className="h-4 w-4"
																						style={{ color: "#C3BCC2" }}
																					/>
																				)}
																			</div>
																			<h4
																				className="text-lg font-semibold"
																				style={{ color: "#C3BCC2" }}
																			>
																				{drill.title}
																			</h4>
																		</div>
																		<div
																			className="flex items-center gap-4 text-sm mb-3"
																			style={{ color: "#ABA4AA" }}
																		>
																			{drill.sets && (
																				<span>{drill.sets} sets</span>
																			)}
																			{drill.reps && (
																				<span>{drill.reps} reps</span>
																			)}
																			{drill.tempo && (
																				<span>Tempo: {drill.tempo}</span>
																			)}
																		</div>
																		{drill.tags && drill.tags.length > 0 && (
																			<div className="flex flex-wrap gap-2">
																				{drill.tags.map((tag, index) => (
																					<Badge
																						key={index}
																						variant="outline"
																						className="text-xs"
																						style={{
																							borderColor: "#606364",
																							color: "#ABA4AA",
																						}}
																					>
																						{tag}
																					</Badge>
																				))}
																			</div>
																		)}
																	</div>
																	<div className="flex items-center gap-2 ml-4">
																		<button
																			onClick={() =>
																				handleMarkDrillComplete(
																					drill.id,
																					!drill.completed
																				)
																			}
																			className={`p-2 rounded-lg transition-all duration-200 ${
																				drill.completed
																					? "bg-green-500 text-white"
																					: "bg-gray-600 text-gray-300 hover:bg-gray-500"
																			}`}
																		>
																			<Check className="h-4 w-4" />
																		</button>
																		{drill.videoUrl && (
																			<button className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200">
																				<Play className="h-4 w-4" />
																			</button>
																		)}
																		<button
																			onClick={() =>
																				handleSubmitVideo(drill.id, drill.title)
																			}
																			className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200"
																		>
																			<Upload className="h-4 w-4" />
																		</button>
																	</div>
																</div>
															</div>
														))}
													</div>
												)}

												{/* Rest Day */}
												{todayData && todayData.isRestDay && (
													<div className="text-center py-12">
														<div className="text-6xl mb-4">🔋</div>
														<h3
															className="text-2xl font-bold mb-3"
															style={{ color: "#C3BCC2" }}
														>
															Recharge Day
														</h3>
														<p
															className="text-base mb-4"
															style={{ color: "#F59E0B" }}
														>
															Take it easy and recover. You've earned it!
														</p>
														<button
															onClick={() => setActiveTab("calendar")}
															className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto"
															style={{
																backgroundColor: "#4A5A70",
																color: "#C3BCC2",
															}}
														>
															<Calendar className="h-4 w-4" />
															View Full Schedule
														</button>
													</div>
												)}

												{/* No Workouts Today */}
												{!todayData && todaysLessons.length === 0 && (
													<div className="text-center py-12">
														<Target
															className="w-16 h-16 mx-auto mb-6"
															style={{ color: "#606364" }}
														/>
														<h3
															className="text-xl font-semibold mb-3"
															style={{ color: "#C3BCC2" }}
														>
															No workouts assigned for today
														</h3>
														<p
															className="text-base mb-4"
															style={{ color: "#ABA4AA" }}
														>
															Check your full program schedule to see upcoming
															workouts
														</p>
														<button
															onClick={() => setActiveTab("calendar")}
															className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto"
															style={{
																backgroundColor: "#10B981",
																color: "#C3BCC2",
															}}
														>
															<Calendar className="h-4 w-4" />
															View Full Program
														</button>
													</div>
												)}
											</div>
										)
									})()}
								</div>

								{/* Upcoming Schedule */}
								<div
									className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
									style={{
										background:
											"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
										borderColor: "#4A5A70",
									}}
								>
									<div className="flex items-center justify-between mb-8">
										<div className="flex items-center gap-4">
											<div
												className="p-3 rounded-2xl"
												style={{ backgroundColor: "#4A5A70" }}
											>
												<Calendar
													className="h-6 w-6"
													style={{ color: "#C3BCC2" }}
												/>
											</div>
											<h2
												className="text-3xl font-bold"
												style={{ color: "#C3BCC2" }}
											>
												Upcoming Schedule
											</h2>
										</div>
									</div>

									{(() => {
										const now = new Date()
										const upcomingLessons = clientLessons
											.filter((lesson: any) => new Date(lesson.date) > now)
											.slice(0, 5)

										return (
											<div className="space-y-4">
												{upcomingLessons.length > 0 ? (
													upcomingLessons.map((lesson: any, index: number) => (
														<div
															key={index}
															className="rounded-xl p-6 transition-all duration-200 hover:scale-102 shadow-lg border"
															style={{
																backgroundColor: "#2B3038",
																borderColor: "#606364",
																borderWidth: "1px",
															}}
														>
															<div className="flex items-center justify-between">
																<div className="flex-1">
																	<div className="flex items-center gap-3 mb-2">
																		<div
																			className="p-2 rounded-full"
																			style={{ backgroundColor: "#4A5A70" }}
																		>
																			<CalendarClock
																				className="h-4 w-4"
																				style={{ color: "#C3BCC2" }}
																			/>
																		</div>
																		<h4
																			className="text-lg font-semibold"
																			style={{ color: "#C3BCC2" }}
																		>
																			{format(
																				new Date(lesson.date),
																				"MMM d, h:mm a"
																			)}
																		</h4>
																	</div>
																	<p
																		className="text-base mb-2"
																		style={{ color: "#ABA4AA" }}
																	>
																		{lesson.title || "Lesson with Coach"}
																	</p>
																	<div className="flex items-center gap-2">
																		<User
																			className="h-4 w-4"
																			style={{ color: "#ABA4AA" }}
																		/>
																		<span
																			className="text-sm"
																			style={{ color: "#ABA4AA" }}
																		>
																			{lesson.coach?.name || "Coach"}
																		</span>
																	</div>
																</div>
																<button
																	className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
																	style={{
																		backgroundColor: "#4A5A70",
																		color: "#C3BCC2",
																	}}
																>
																	Details
																</button>
															</div>
														</div>
													))
												) : (
													<div className="text-center py-12">
														<CalendarX
															className="w-16 h-16 mx-auto mb-6"
															style={{ color: "#606364" }}
														/>
														<h3
															className="text-xl font-semibold mb-3"
															style={{ color: "#C3BCC2" }}
														>
															No upcoming lessons
														</h3>
														<p
															className="text-base"
															style={{ color: "#ABA4AA" }}
														>
															Your schedule is clear for now
														</p>
													</div>
												)}
											</div>
										)
									})()}
								</div>
							</div>
						</div>
					)}

					{/* Calendar Tab */}
					{activeTab === "calendar" && (
						<div className="space-y-4 md:space-y-8">
							{/* Modern Calendar Header */}
							<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 mb-6 md:mb-12">
								<div className="flex items-center justify-center md:justify-start gap-4 md:gap-8">
									<Button
										onClick={() => navigateMonth("prev")}
										variant="ghost"
										size="lg"
										className="p-2 md:p-4 rounded-xl md:rounded-2xl hover:bg-gray-700/30 transition-all duration-300 hover:scale-105"
									>
										<ChevronLeft className="h-6 w-6 md:h-8 md:w-8 text-white" />
									</Button>
									<h2 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent text-center md:text-left">
										{format(currentDate, "MMMM yyyy")}
									</h2>
									<Button
										onClick={() => navigateMonth("next")}
										variant="ghost"
										size="lg"
										className="p-2 md:p-4 rounded-xl md:rounded-2xl hover:bg-gray-700/30 transition-all duration-300 hover:scale-105"
									>
										<ChevronRight className="h-6 w-6 md:h-8 md:w-8 text-white" />
									</Button>
								</div>
								<div className="flex items-center justify-center md:justify-end gap-2 md:gap-4">
									<Button
										onClick={() => setViewMode("week")}
										variant={viewMode === "week" ? "default" : "ghost"}
										size="lg"
										className="px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-2xl text-white font-medium transition-all duration-300 hover:scale-105 text-sm md:text-base"
										style={{
											backgroundColor:
												viewMode === "week" ? "#4A5A70" : "transparent",
											border:
												viewMode === "week"
													? "2px solid #4A5A70"
													: "2px solid transparent",
										}}
									>
										<CalendarDays className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-3" />
										Week
									</Button>
									<Button
										onClick={() => setViewMode("month")}
										variant={viewMode === "month" ? "default" : "ghost"}
										size="lg"
										className="px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-2xl text-white font-medium transition-all duration-300 hover:scale-105 text-sm md:text-base"
										style={{
											backgroundColor:
												viewMode === "month" ? "#4A5A70" : "transparent",
											border:
												viewMode === "month"
													? "2px solid #4A5A70"
													: "2px solid transparent",
										}}
									>
										<Calendar className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-3" />
										Month
									</Button>
								</div>
							</div>

							{/* Modern Calendar Grid */}
							<div className="grid grid-cols-7 gap-2 md:gap-6">
								{/* Day headers */}
								{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
									(day) => (
										<div
											key={day}
											className="p-2 md:p-8 text-center text-sm md:text-2xl font-bold mb-2 md:mb-4"
											style={{ color: "#ABA4AA" }}
										>
											{day}
										</div>
									)
								)}

								{/* Calendar days */}
								{calendarDays.map((date, index) => {
									const dayData = getDayData(date)
									const isToday = isSameDay(date, new Date())
									const isCurrentMonth = isSameMonth(date, currentDate)
									const lessonsForDay = getLessonsForDate(date)

									return (
										<div
											key={index}
											className={cn(
												"min-h-[200px] md:min-h-[320px] p-2 md:p-6 rounded-xl md:rounded-3xl transition-all duration-500 cursor-pointer hover:scale-105 hover:shadow-2xl border-2",
												isCurrentMonth
													? "bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-600/50 hover:border-gray-500 hover:bg-gradient-to-br hover:from-gray-700/90 hover:to-gray-800/90"
													: "bg-gray-900/30 border-gray-700/30",
												isToday &&
													"ring-4 ring-blue-500/30 border-blue-400/50 shadow-2xl"
											)}
											onClick={() => {
												if (
													dayData &&
													(dayData.drills.length > 0 || dayData.isRestDay)
												) {
													setSelectedDay(dayData)
													setIsDaySheetOpen(true)
												}
											}}
										>
											{/* Date Header */}
											<div className="flex items-center justify-between mb-2 md:mb-6">
												<span
													className={cn(
														"text-lg md:text-3xl font-bold",
														isCurrentMonth ? "text-white" : "text-gray-500"
													)}
												>
													{format(date, "d")}
												</span>
												{dayData && dayData.totalDrills > 0 && (
													<Badge
														variant="secondary"
														className="text-xs md:text-sm px-2 md:px-4 py-1 md:py-2 rounded-full font-bold shadow-lg"
														style={{
															background:
																"linear-gradient(135deg, #10B981, #059669)",
															color: "#FFFFFF",
														}}
													>
														{dayData.completedDrills}/{dayData.totalDrills}
													</Badge>
												)}
											</div>

											{/* Workout Details */}
											{dayData &&
												dayData.drills &&
												dayData.drills.length > 0 && (
													<div className="space-y-2 md:space-y-3">
														{dayData.drills
															.slice(0, 3)
															.map((drill, drillIndex) => (
																<div
																	key={drillIndex}
																	className="p-2 md:p-4 rounded-xl md:rounded-2xl cursor-pointer hover:bg-gray-700/50 transition-all duration-300 hover:scale-102"
																	style={{
																		background:
																			"linear-gradient(135deg, #1F2426, #2A3133)",
																		border: "1px solid #353A3A",
																	}}
																>
																	<div className="flex items-center justify-between">
																		<div className="flex-1">
																			<div className="font-semibold text-white text-xs md:text-sm mb-1 md:mb-2">
																				{drill.title}
																			</div>
																			{drill.sets && drill.reps && (
																				<div
																					className="text-xs"
																					style={{ color: "#10B981" }}
																				>
																					{drill.sets}×{drill.reps}
																					{drill.tempo && ` @ ${drill.tempo}`}
																				</div>
																			)}
																		</div>
																		{drill.completed && (
																			<CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
																		)}
																	</div>
																</div>
															))}
														{dayData.drills.length > 3 && (
															<div className="text-center py-2 md:py-3">
																<span
																	className="text-xs md:text-sm"
																	style={{ color: "#ABA4AA" }}
																>
																	+{dayData.drills.length - 3} more exercises
																</span>
															</div>
														)}
													</div>
												)}

											{/* Rest Day Indicator */}
											{dayData && dayData.isRestDay && (
												<div className="flex items-center justify-center h-20 md:h-32 mt-2 md:mt-4">
													<div
														className="text-center p-2 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105"
														style={{
															background:
																"linear-gradient(135deg, #1F2426, #2A3133)",
															border: "2px solid #F59E0B",
															boxShadow: "0 4px 16px rgba(245, 158, 11, 0.15)",
														}}
													>
														<div className="text-2xl md:text-3xl mb-1 md:mb-2">
															🔋
														</div>
														<div className="font-bold text-white text-sm md:text-base mb-1">
															Recharge Day
														</div>
														<div
															className="text-xs md:text-sm"
															style={{ color: "#F59E0B" }}
														>
															Recovery time
														</div>
													</div>
												</div>
											)}

											{/* Lessons */}
											{lessonsForDay.length > 0 && (
												<div className="mt-4 md:mt-6 space-y-2 md:space-y-3">
													<div className="text-xs md:text-sm font-semibold text-blue-400 mb-2 md:mb-3">
														📅 Lessons Today
													</div>
													{lessonsForDay
														.slice(0, 2)
														.map((lesson: any, lessonIndex: number) => (
															<div
																key={lessonIndex}
																className="p-2 md:p-4 rounded-xl md:rounded-2xl"
																style={{
																	background:
																		"linear-gradient(135deg, #10B981, #059669)",
																	border: "1px solid #059669",
																}}
															>
																<div className="font-bold text-white text-xs md:text-sm">
																	{format(new Date(lesson.date), "h:mm a")}
																</div>
																<div className="text-xs text-green-100 truncate">
																	{lesson.title || "Lesson"}
																</div>
															</div>
														))}
													{lessonsForDay.length > 2 && (
														<div className="text-center">
															<span className="text-xs md:text-sm text-gray-400">
																+{lessonsForDay.length - 2} more lessons
															</span>
														</div>
													)}
												</div>
											)}

											{/* Empty Day */}
											{!dayData && isCurrentMonth && (
												<div className="flex items-center justify-center h-20 md:h-40">
													<div className="text-center">
														<div className="text-gray-500 text-xs md:text-sm">
															No program
														</div>
													</div>
												</div>
											)}

											{/* Program Time */}
											{dayData &&
												dayData.expectedTime > 0 &&
												!lessonsForDay.length && (
													<div className="flex items-center gap-1 md:gap-2 mt-2 md:mt-4">
														<Clock
															className="h-3 w-3 md:h-4 md:w-4"
															style={{ color: "#ABA4AA" }}
														/>
														<span
															className="text-xs"
															style={{ color: "#ABA4AA" }}
														>
															{dayData.expectedTime}min
														</span>
													</div>
												)}
										</div>
									)
								})}
							</div>
						</div>
					)}

					{/* Progress Tab */}
					{activeTab === "progress" && (
						<div className="space-y-8">
							{/* Progress Overview */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div
									className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
									style={{
										background:
											"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
										borderColor: "#10B981",
									}}
								>
									<div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<div className="relative z-10">
										<div className="flex items-center justify-between mb-6">
											<div
												className="p-3 rounded-2xl"
												style={{ backgroundColor: "#10B981" }}
											>
												<TrendingUp
													className="h-8 w-8"
													style={{ color: "#C3BCC2" }}
												/>
											</div>
											<span
												className="text-4xl font-bold"
												style={{ color: "#C3BCC2" }}
											>
												{Math.round(programInfo?.overallProgress || 0)}%
											</span>
										</div>
										<h3
											className="text-xl font-bold mb-3"
											style={{ color: "#C3BCC2" }}
										>
											Overall Progress
										</h3>
										<p className="text-base" style={{ color: "#ABA4AA" }}>
											Program completion
										</p>
									</div>
								</div>

								<div
									className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
									style={{
										background:
											"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
										borderColor: "#F59E0B",
									}}
								>
									<div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<div className="relative z-10">
										<div className="flex items-center justify-between mb-6">
											<div
												className="p-3 rounded-2xl"
												style={{ backgroundColor: "#F59E0B" }}
											>
												<Star
													className="h-8 w-8"
													style={{ color: "#C3BCC2" }}
												/>
											</div>
											<span
												className="text-4xl font-bold"
												style={{ color: "#C3BCC2" }}
											>
												7
											</span>
										</div>
										<h3
											className="text-xl font-bold mb-3"
											style={{ color: "#C3BCC2" }}
										>
											Day Streak
										</h3>
										<p className="text-base" style={{ color: "#ABA4AA" }}>
											Keep it going!
										</p>
									</div>
								</div>

								<div
									className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
									style={{
										background:
											"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
										borderColor: "#8B5CF6",
									}}
								>
									<div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<div className="relative z-10">
										<div className="flex items-center justify-between mb-6">
											<div
												className="p-3 rounded-2xl"
												style={{ backgroundColor: "#8B5CF6" }}
											>
												<Award
													className="h-8 w-8"
													style={{ color: "#C3BCC2" }}
												/>
											</div>
											<span
												className="text-4xl font-bold"
												style={{ color: "#C3BCC2" }}
											>
												24
											</span>
										</div>
										<h3
											className="text-xl font-bold mb-3"
											style={{ color: "#C3BCC2" }}
										>
											Workouts Completed
										</h3>
										<p className="text-base" style={{ color: "#ABA4AA" }}>
											This month
										</p>
									</div>
								</div>
							</div>

							{/* Progress Chart */}
							<div
								className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
								style={{
									background:
										"linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
									borderColor: "#4A5A70",
								}}
							>
								<div className="flex items-center justify-between mb-8">
									<div className="flex items-center gap-4">
										<div
											className="p-3 rounded-2xl"
											style={{ backgroundColor: "#4A5A70" }}
										>
											<BarChart3
												className="h-6 w-6"
												style={{ color: "#C3BCC2" }}
											/>
										</div>
										<h2
											className="text-3xl font-bold"
											style={{ color: "#C3BCC2" }}
										>
											Weekly Progress
										</h2>
									</div>
								</div>

								<div className="space-y-6">
									{/* Weekly Progress Bars */}
									{Array.from({ length: 7 }, (_, i) => {
										const day = addDays(startOfWeek(new Date()), i)
										const dayData = getDayData(day)
										const progress = dayData
											? dayData.totalDrills > 0
												? (dayData.completedDrills / dayData.totalDrills) * 100
												: 0
											: 0

										return (
											<div key={i} className="space-y-2">
												<div className="flex items-center justify-between">
													<span
														className="text-base font-medium"
														style={{ color: "#ABA4AA" }}
													>
														{format(day, "EEEE")}
													</span>
													<span
														className="text-base font-semibold"
														style={{ color: "#C3BCC2" }}
													>
														{Math.round(progress)}%
													</span>
												</div>
												<div
													className="w-full rounded-full h-3"
													style={{ backgroundColor: "#606364" }}
												>
													<div
														className="h-3 rounded-full transition-all duration-300"
														style={{
															width: `${progress}%`,
															background:
																"linear-gradient(to right, #4A5A70, #606364)",
														}}
													></div>
												</div>
											</div>
										)
									})}
								</div>
							</div>
						</div>
					)}

					{/* Day Detail Modal */}
					{isDaySheetOpen && selectedDay && (
						<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
							<div
								className="bg-gray-800 rounded-3xl border-2 border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out"
								style={{
									animation: "modalSlideIn 0.3s ease-out",
								}}
							>
								{/* Modal Header */}
								<div className="p-6 border-b border-gray-700">
									<div className="flex items-center justify-between">
										<div>
											<h2 className="text-2xl font-bold text-white">
												{new Date(selectedDay.date).toLocaleDateString(
													"en-US",
													{
														weekday: "long",
														month: "long",
														day: "numeric",
													}
												)}
											</h2>
											<div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
												<span>Assigned by {programInfo?.coachName}</span>
												<div className="flex items-center gap-1">
													<Clock className="h-4 w-4" />
													{selectedDay.expectedTime} min
												</div>
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setIsDaySheetOpen(false)}
											className="text-gray-400 hover:text-white"
										>
											<X className="h-6 w-6" />
										</Button>
									</div>
								</div>

								{/* Modal Content */}
								<div className="p-6">
									{selectedDay.isRestDay ? (
										<div className="text-center py-12">
											<div className="text-6xl mb-4">🔋</div>
											<h3 className="text-2xl font-bold text-white mb-2">
												Recharge Day
											</h3>
											<p className="text-lg" style={{ color: "#F59E0B" }}>
												Take it easy and recover
											</p>
										</div>
									) : (
										<div className="space-y-6">
											{/* Drills List */}
											<div className="space-y-4">
												{selectedDay.drills.map((drill) => (
													<div
														key={drill.id}
														className="bg-gray-700 rounded-2xl p-6 border border-gray-600"
													>
														<div className="flex items-start justify-between mb-4">
															<div className="flex-1">
																<h3 className="text-xl font-bold text-white mb-2">
																	{drill.title}
																</h3>

																{/* Sets, Reps, Tempo */}
																<div className="flex items-center gap-6 mb-3">
																	{drill.sets && (
																		<div className="flex items-center gap-2">
																			<span className="text-sm text-gray-400">
																				Sets:
																			</span>
																			<span className="text-white font-semibold">
																				{drill.sets}
																			</span>
																		</div>
																	)}
																	{drill.reps && (
																		<div className="flex items-center gap-2">
																			<span className="text-sm text-gray-400">
																				Reps:
																			</span>
																			<span className="text-white font-semibold">
																				{drill.reps}
																			</span>
																		</div>
																	)}
																	{drill.tempo && (
																		<div className="flex items-center gap-2">
																			<span className="text-sm text-gray-400">
																				Tempo:
																			</span>
																			<span className="text-white font-semibold">
																				{drill.tempo}
																			</span>
																		</div>
																	)}
																</div>

																{/* Tags */}
																{drill.tags && drill.tags.length > 0 && (
																	<div className="flex flex-wrap gap-2 mb-4">
																		{drill.tags.map((tag, index) => (
																			<Badge
																				key={index}
																				variant="outline"
																				className="text-xs border-blue-500 text-blue-400"
																			>
																				{tag}
																			</Badge>
																		))}
																	</div>
																)}

																{/* Video URL if available */}
																{drill.videoUrl && (
																	<div className="mb-4">
																		<Button
																			variant="outline"
																			size="sm"
																			onClick={() =>
																				drill.videoUrl &&
																				handleOpenVideo(drill.videoUrl)
																			}
																			className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
																		>
																			<Play className="h-4 w-4 mr-2" />
																			Watch Demo
																		</Button>
																	</div>
																)}
															</div>

															{/* Action Buttons */}
															<div className="flex items-center gap-2 ml-4">
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() =>
																		handleMarkDrillComplete(
																			drill.id,
																			!drill.completed
																		)
																	}
																	className={cn(
																		"h-10 w-10 p-0 rounded-xl transition-all duration-200",
																		drill.completed
																			? "bg-green-500 text-white hover:bg-green-600"
																			: "bg-gray-600 text-gray-300 hover:bg-gray-500"
																	)}
																>
																	<Check className="h-5 w-5" />
																</Button>
															</div>
														</div>

														{/* Comment Section */}
														<div className="border-t border-gray-600 pt-4">
															<div className="flex items-center gap-3 mb-3">
																<MessageSquare className="h-5 w-5 text-blue-400" />
																<h4 className="font-semibold text-white">
																	Add Comment
																</h4>
															</div>
															<div className="flex gap-3">
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => {
																		setSelectedDrillForVideo(drill)
																		setIsVideoSubmissionModalOpen(true)
																	}}
																	className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
																>
																	<Video className="h-4 w-4 mr-2" />
																	Record Video
																</Button>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => handleOpenCommentModal(drill)}
																	className="border-gray-500 text-gray-400 hover:bg-gray-600"
																>
																	<MessageSquare className="h-4 w-4 mr-2" />
																	Add Note
																</Button>
															</div>
														</div>
													</div>
												))}
											</div>

											{/* Mark All Complete Button */}
											<Button
												onClick={handleMarkAllComplete}
												className="w-full py-4 text-lg font-semibold rounded-2xl"
												disabled={
													selectedDay.completedDrills ===
													selectedDay.totalDrills
												}
												style={{
													backgroundColor:
														selectedDay.completedDrills ===
														selectedDay.totalDrills
															? "#10B981"
															: "#4A5A70",
												}}
											>
												<Check className="h-5 w-5 mr-2" />
												{selectedDay.completedDrills === selectedDay.totalDrills
													? "All Complete!"
													: "Mark All Complete"}
											</Button>

											{/* Note to Coach */}
											<div className="space-y-4">
												<h4 className="font-semibold text-white text-lg">
													Note to Coach
												</h4>
												<Textarea
													placeholder="Add a note about your workout..."
													value={noteToCoach}
													onChange={(e) => setNoteToCoach(e.target.value)}
													className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-xl"
													rows={4}
												/>
												<Button
													onClick={handleSendNote}
													disabled={!noteToCoach.trim() || isSubmittingNote}
													className="w-full py-3 rounded-xl"
													style={{ backgroundColor: "#10B981" }}
												>
													<Send className="h-4 w-4 mr-2" />
													{isSubmittingNote ? "Sending..." : "Send Note"}
												</Button>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Video Submission Modal */}
					{isVideoSubmissionModalOpen && (
						<ClientVideoSubmissionModal
							isOpen={isVideoSubmissionModalOpen}
							onClose={() => setIsVideoSubmissionModalOpen(false)}
							drillId={selectedDrillForVideo?.id}
							drillTitle={selectedDrillForVideo?.title}
						/>
					)}

					{/* Video Player Modal */}
					{isVideoPlayerOpen && selectedVideo && (
						<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
							<div
								className="bg-gray-900 rounded-3xl border-2 border-gray-600 w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out"
								style={{
									animation: "modalSlideIn 0.3s ease-out",
								}}
							>
								{/* Video Player Header */}
								<div className="p-4 border-b border-gray-700 flex items-center justify-between">
									<h3 className="text-xl font-bold text-white">Video Demo</h3>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleCloseVideo}
										className="text-gray-400 hover:text-white"
									>
										<X className="h-6 w-6" />
									</Button>
								</div>

								{/* Video Player Content */}
								<div className="p-4">
									<div className="aspect-video bg-black rounded-xl overflow-hidden">
										{selectedVideo &&
										selectedVideo.isYoutube &&
										selectedVideo.youtubeId ? (
											// YouTube video
											<iframe
												src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=0&rel=0&disablekb=1&modestbranding=1&showinfo=0`}
												title={selectedVideo.title || "Video Demo"}
												frameBorder="0"
												allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
												allowFullScreen
												className="w-full h-full"
												style={{ pointerEvents: "auto" }}
												onContextMenu={(e) => e.preventDefault()}
											/>
										) : selectedVideo && selectedVideo.url ? (
											// Custom uploaded video
											<video
												controls
												controlsList="nodownload nofullscreen"
												disablePictureInPicture
												className="w-full h-full object-contain"
												style={{ backgroundColor: "#000" }}
												onContextMenu={(e) => e.preventDefault()}
												onError={(e) => {
													console.error("Video load error:", e)
												}}
											>
												<source src={selectedVideo.url} type="video/mp4" />
												<source src={selectedVideo.url} type="video/webm" />
												<source src={selectedVideo.url} type="video/ogg" />
												Your browser does not support the video tag.
											</video>
										) : (
											// Fallback: show error message
											<div className="flex items-center justify-center h-full">
												<div className="text-center text-white">
													<div className="text-4xl mb-4">🎥</div>
													<div className="text-lg font-semibold mb-2">
														Video Not Available
													</div>
													<div className="text-sm text-gray-400">
														This video could not be loaded. Please check with
														your coach.
													</div>
												</div>
											</div>
										)}
									</div>

									{/* Back to Full View Button */}
									<div className="mt-4 flex justify-center">
										<Button
											onClick={handleCloseVideo}
											className="px-6 py-3 rounded-xl font-semibold"
											style={{ backgroundColor: "#4A5A70" }}
										>
											<ArrowLeft className="h-4 w-4 mr-2" />
											Back to Full View
										</Button>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Comment Modal */}
					{isCommentModalOpen && selectedDrillForComment && (
						<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
							<div
								className="bg-gray-800 rounded-3xl border-2 border-gray-600 w-full max-w-md transform transition-all duration-300 ease-out"
								style={{
									animation: "modalSlideIn 0.3s ease-out",
								}}
							>
								{/* Comment Modal Header */}
								<div className="p-6 border-b border-gray-700">
									<div className="flex items-center justify-between">
										<div>
											<h3 className="text-xl font-bold text-white">
												Add Comment
											</h3>
											<p className="text-sm text-gray-400 mt-1">
												{selectedDrillForComment.title}
											</p>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleCloseCommentModal}
											className="text-gray-400 hover:text-white"
										>
											<X className="h-5 w-5" />
										</Button>
									</div>
								</div>

								{/* Comment Modal Content */}
								<div className="p-6">
									<div className="space-y-4">
										<Textarea
											placeholder="Add your comment about this exercise..."
											value={commentText}
											onChange={(e) => setCommentText(e.target.value)}
											className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-xl min-h-[120px]"
											rows={4}
										/>

										<div className="flex gap-3">
											<Button
												variant="outline"
												onClick={handleCloseCommentModal}
												className="flex-1 border-gray-500 text-gray-400 hover:bg-gray-700"
											>
												Cancel
											</Button>
											<Button
												onClick={handleSubmitComment}
												disabled={!commentText.trim() || isSubmittingComment}
												className="flex-1"
												style={{ backgroundColor: "#10B981" }}
											>
												{isSubmittingComment ? (
													<>
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
														Submitting...
													</>
												) : (
													<>
														<Send className="h-4 w-4 mr-2" />
														Submit Comment
													</>
												)}
											</Button>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Video Submission Modal */}
					<ClientVideoSubmissionModal
						isOpen={isVideoSubmissionModalOpen}
						onClose={() => setIsVideoSubmissionModalOpen(false)}
						drillId={selectedDrillForVideo?.id}
						drillTitle={selectedDrillForVideo?.title}
					/>
				</div>
			</div>
		</ClientSidebar>
	)
}
