"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/app/_trpc/client"
import {
	Calendar,
	Clock,
	Settings,
	Save,
	ChevronLeft,
	ChevronRight,
	Plus,
	Users,
	X,
	Trash2,
} from "lucide-react"
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
} from "date-fns"
import Sidebar from "@/components/Sidebar"

export default function SchedulePageClient() {
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false)
	const [showScheduleModal, setShowScheduleModal] = useState(false)
	const [showDayOverviewModal, setShowDayOverviewModal] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [workingHours, setWorkingHours] = useState({
		startTime: "9:00 AM", // Default value
		endTime: "6:00 PM", // Default value
	})
	const [scheduleForm, setScheduleForm] = useState({
		clientId: "",
		time: "",
		date: "",
	})

	// Fetch coach's schedule for the current month
	const { data: coachSchedule = [] } =
		trpc.scheduling.getCoachSchedule.useQuery({
			month: currentMonth.getMonth(),
			year: currentMonth.getFullYear(),
		})

	// Fetch coach's profile for working hours
	const { data: coachProfile } = trpc.user.getProfile.useQuery()

	// Fetch coach's active clients for scheduling (exclude archived)
	const { data: clients = [] } = trpc.clients.list.useQuery({ archived: false })

	// Update working hours state when coach profile loads
	useEffect(() => {
		if (coachProfile?.workingHours) {
			setWorkingHours({
				startTime: coachProfile.workingHours.startTime,
				endTime: coachProfile.workingHours.endTime,
			})
		}
	}, [coachProfile])

	const utils = trpc.useUtils()
	const updateWorkingHoursMutation = trpc.user.updateWorkingHours.useMutation({
		onSuccess: () => {
			utils.user.getProfile.invalidate()
			setShowWorkingHoursModal(false)
		},
		onError: (error) => {
			alert(`Error updating working hours: ${error.message}`)
		},
	})

	const scheduleLessonMutation = trpc.scheduling.scheduleLesson.useMutation({
		onSuccess: () => {
			utils.scheduling.getCoachSchedule.invalidate()
			setShowScheduleModal(false)
			setScheduleForm({ clientId: "", time: "", date: "" })
			setSelectedDate(null)
		},
		onError: (error) => {
			alert(`Error scheduling lesson: ${error.message}`)
		},
	})

	const deleteLessonMutation = trpc.scheduling.deleteLesson.useMutation({
		onSuccess: () => {
			utils.scheduling.getCoachSchedule.invalidate()
		},
		onError: (error) => {
			alert(`Error deleting lesson: ${error.message}`)
		},
	})

	// Generate calendar days for the current month view
	const monthStart = startOfMonth(currentMonth)
	const monthEnd = endOfMonth(currentMonth)
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
	const calendarDays = eachDayOfInterval({
		start: calendarStart,
		end: calendarEnd,
	})

	const navigateMonth = (direction: "prev" | "next") => {
		setCurrentMonth(
			direction === "prev"
				? subMonths(currentMonth, 1)
				: addMonths(currentMonth, 1)
		)
	}

	const getLessonsForDate = (date: Date) => {
		const now = new Date()
		const lessons = coachSchedule.filter((lesson: any) => {
			const lessonDate = new Date(lesson.date)
			// Compare only the date part, not the time
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

			// Only include lessons that are in the future
			const isFuture = lessonDate > now

			return isSame && isFuture
		})

		return lessons
	}

	const getAllLessonsForDate = (date: Date) => {
		const lessons = coachSchedule.filter((lesson: any) => {
			const lessonDate = new Date(lesson.date)
			// Compare only the date part, not the time
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

			return isSame
		})

		// Sort by time
		return lessons.sort(
			(a: any, b: any) =>
				new Date(a.date).getTime() - new Date(b.date).getTime()
		)
	}

	const handleSaveWorkingHours = () => {
		updateWorkingHoursMutation.mutate({
			startTime: workingHours.startTime,
			endTime: workingHours.endTime,
		})
	}

	const handleDateClick = (date: Date) => {
		setSelectedDate(date)
		setScheduleForm({
			...scheduleForm,
			date: format(date, "yyyy-MM-dd"),
		})
		setShowDayOverviewModal(true)
	}

	const handleScheduleLesson = () => {
		if (!scheduleForm.clientId || !scheduleForm.time || !scheduleForm.date) {
			alert("Please fill in all fields")
			return
		}

		const selectedClient = clients.find(
			(c: any) => c.id === scheduleForm.clientId
		)

		if (!selectedClient) {
			alert("Please select a valid client")
			return
		}

		// Combine date and time into a single Date object
		const dateStr = scheduleForm.date
		const timeStr = scheduleForm.time

		// Parse the time string (e.g., "2:00 PM")
		const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
		if (!timeMatch) {
			alert("Invalid time format")
			return
		}

		let [_, hour, minute, period] = timeMatch
		let hour24 = parseInt(hour)

		// Convert to 24-hour format
		if (period.toUpperCase() === "PM" && hour24 !== 12) {
			hour24 += 12
		} else if (period.toUpperCase() === "AM" && hour24 === 12) {
			hour24 = 0
		}

		// Create the full date string
		const fullDateStr = `${dateStr}T${hour24
			.toString()
			.padStart(2, "0")}:${minute}:00`
		const lessonDate = new Date(fullDateStr)

		// Validate the date
		if (isNaN(lessonDate.getTime())) {
			alert("Invalid date/time combination")
			return
		}

		// Check if the lesson is in the past
		const now = new Date()
		if (lessonDate <= now) {
			alert(
				"Cannot schedule lessons in the past. Please select a future date and time."
			)
			return
		}

		scheduleLessonMutation.mutate({
			clientId: scheduleForm.clientId,
			lessonDate: fullDateStr, // Send as string instead of Date object
		})
	}

	const handleDeleteLesson = (lessonId: string, lessonTitle: string) => {
		if (confirm(`Are you sure you want to delete "${lessonTitle}"?`)) {
			deleteLessonMutation.mutate({
				lessonId: lessonId,
			})
		}
	}

	// Generate time slots based on coach's working hours
	const generateTimeSlots = () => {
		const startTime = coachProfile?.workingHours?.startTime || "9:00 AM"
		const endTime = coachProfile?.workingHours?.endTime || "6:00 PM"

		const slots = []

		// Parse start and end times
		const startMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i)
		const endMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i)

		if (!startMatch || !endMatch) {
			// Fallback to default hours
			for (let hour = 9; hour < 18; hour++) {
				const displayHour = hour > 12 ? hour - 12 : hour
				const period = hour >= 12 ? "PM" : "AM"
				slots.push(`${displayHour}:00 ${period}`)
			}
			return slots
		}

		let [_, startHour, startMinute, startPeriod] = startMatch
		let [__, endHour, endMinute, endPeriod] = endMatch

		let currentHour = parseInt(startHour)
		if (startPeriod.toUpperCase() === "PM" && currentHour !== 12)
			currentHour += 12
		if (startPeriod.toUpperCase() === "AM" && currentHour === 12)
			currentHour = 0

		let endHour24 = parseInt(endHour)
		if (endPeriod.toUpperCase() === "PM" && endHour24 !== 12) endHour24 += 12
		if (endPeriod.toUpperCase() === "AM" && endHour24 === 12) endHour24 = 0

		// Get current time to filter out past slots
		const now = new Date()
		const isToday =
			scheduleForm.date && format(now, "yyyy-MM-dd") === scheduleForm.date
		const currentHour24 = now.getHours()
		const currentMinute = now.getMinutes()

		while (currentHour < endHour24) {
			// Skip past time slots for today
			if (isToday && currentHour < currentHour24) {
				currentHour++
				continue
			}
			if (isToday && currentHour === currentHour24 && currentMinute >= 0) {
				currentHour++
				continue
			}

			const displayHour =
				currentHour === 0
					? 12
					: currentHour > 12
					? currentHour - 12
					: currentHour
			const period = currentHour >= 12 ? "PM" : "AM"
			slots.push(`${displayHour}:00 ${period}`)
			currentHour++
		}

		return slots
	}

	const timeSlots = generateTimeSlots()

	const generateAvailableTimeSlots = (date: Date) => {
		const startTime = coachProfile?.workingHours?.startTime || "9:00 AM"
		const endTime = coachProfile?.workingHours?.endTime || "6:00 PM"
		const slots = []

		// Parse start and end times
		const startMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i)
		const endMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i)

		if (!startMatch || !endMatch) {
			// Fallback to default hours
			for (let hour = 9; hour < 18; hour++) {
				const displayHour = hour > 12 ? hour - 12 : hour
				const period = hour >= 12 ? "PM" : "AM"
				slots.push(`${displayHour}:00 ${period}`)
			}
			return slots
		}

		let [_, startHour, startMinute, startPeriod] = startMatch
		let [__, endHour, endMinute, endPeriod] = endMatch

		let currentHour = parseInt(startHour)
		if (startPeriod.toUpperCase() === "PM" && currentHour !== 12)
			currentHour += 12
		if (startPeriod.toUpperCase() === "AM" && currentHour === 12)
			currentHour = 0

		let endHour24 = parseInt(endHour)
		if (endPeriod.toUpperCase() === "PM" && endHour24 !== 12) endHour24 += 12
		if (endPeriod.toUpperCase() === "AM" && endHour24 === 12) endHour24 = 0

		// Get current time to filter out past slots for today
		const now = new Date()
		const isToday = format(now, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
		const currentHour24 = now.getHours()
		const currentMinute = now.getMinutes()

		// Get existing lessons for this date
		const existingLessons = getAllLessonsForDate(date)
		const bookedTimes = existingLessons.map((lesson: any) => {
			const lessonDate = new Date(lesson.date)
			return format(lessonDate, "h:mm a")
		})

		while (currentHour < endHour24) {
			// Skip past time slots for today
			if (isToday && currentHour < currentHour24) {
				currentHour++
				continue
			}
			if (isToday && currentHour === currentHour24 && currentMinute >= 0) {
				currentHour++
				continue
			}

			const displayHour =
				currentHour === 0
					? 12
					: currentHour > 12
					? currentHour - 12
					: currentHour
			const period = currentHour >= 12 ? "PM" : "AM"
			const timeSlot = `${displayHour}:00 ${period}`

			// Only add if not already booked
			if (!bookedTimes.includes(timeSlot)) {
				slots.push(timeSlot)
			}

			currentHour++
		}

		return slots
	}

	return (
		<Sidebar>
			<div className="min-h-screen p-6" style={{ backgroundColor: "#2A3133" }}>
				<div className="max-w-6xl mx-auto">
					{/* Header */}
					<div className="flex items-center justify-between mb-8">
						<div className="flex items-center gap-4">
							<div
								className="p-3 rounded-lg"
								style={{ backgroundColor: "#4A5A70" }}
							>
								<Calendar className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-3xl font-bold text-white">
									Schedule Management
								</h1>
								<p className="text-gray-400">
									Manage your availability and schedule lessons
								</p>
							</div>
						</div>
						<div className="flex gap-3">
							<button
								onClick={() => setShowScheduleModal(true)}
								className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
								style={{
									backgroundColor: "#10B981",
									color: "#FFFFFF",
								}}
							>
								<Plus className="h-4 w-4" />
								Schedule Lesson
							</button>
							<button
								onClick={() => setShowWorkingHoursModal(true)}
								className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
								style={{
									backgroundColor: "#4A5A70",
									color: "#FFFFFF",
								}}
							>
								<Settings className="h-4 w-4" />
								Working Hours
							</button>
						</div>
					</div>

					{/* Current Working Hours Display */}
					<div
						className="mb-6 p-4 rounded-lg"
						style={{ backgroundColor: "#2A2F2F" }}
					>
						<div className="flex items-center gap-3 mb-2">
							<Clock className="h-5 w-5 text-sky-400" />
							<h2 className="text-lg font-semibold text-white">
								Current Working Hours
							</h2>
						</div>
						<p className="text-gray-300">
							{coachProfile?.workingHours?.startTime || "9:00 AM"} -{" "}
							{coachProfile?.workingHours?.endTime || "6:00 PM"}
						</p>
					</div>

					{/* Today's Lessons Summary */}
					{(() => {
						const today = new Date()
						const now = new Date()
						const todaysLessons = getLessonsForDate(today)
						const upcomingLessons = coachSchedule
							.filter((lesson: any) => new Date(lesson.date) > now)
							.slice(0, 5)

						return (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
								{/* Today's Lessons */}
								<div
									className="p-4 rounded-lg"
									style={{ backgroundColor: "#2A2F2F" }}
								>
									<div className="flex items-center gap-3 mb-3">
										<Calendar className="h-5 w-5 text-emerald-400" />
										<h3 className="text-lg font-semibold text-white">
											Today's Upcoming Lessons
										</h3>
									</div>
									{todaysLessons.length > 0 ? (
										<div className="space-y-2">
											{todaysLessons.map((lesson: any, index: number) => (
												<div
													key={index}
													className="flex items-center justify-between p-3 rounded bg-emerald-500/10 border border-emerald-500/20 group"
												>
													<div className="flex-1">
														<div className="font-medium text-emerald-300">
															{format(new Date(lesson.date), "h:mm a")}
														</div>
														<div className="text-sm text-emerald-200">
															{lesson.client?.name ||
																lesson.client?.email ||
																"Client"}
														</div>
													</div>
													<div className="flex items-center gap-2">
														<div className="text-xs text-emerald-400">
															{lesson.title}
														</div>
														<button
															onClick={() =>
																handleDeleteLesson(lesson.id, lesson.title)
															}
															className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
															title="Delete lesson"
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</div>
												</div>
											))}
										</div>
									) : (
										<p className="text-gray-400 text-sm">
											No upcoming lessons scheduled for today
										</p>
									)}
								</div>

								{/* Upcoming Lessons */}
								<div
									className="p-4 rounded-lg"
									style={{ backgroundColor: "#2A2F2F" }}
								>
									<div className="flex items-center gap-3 mb-3">
										<Users className="h-5 w-5 text-sky-400" />
										<h3 className="text-lg font-semibold text-white">
											Upcoming Lessons
										</h3>
									</div>
									{upcomingLessons.length > 0 ? (
										<div className="space-y-2">
											{upcomingLessons.map((lesson: any, index: number) => (
												<div
													key={index}
													className="flex items-center justify-between p-3 rounded bg-sky-500/10 border border-sky-500/20 group"
												>
													<div className="flex-1">
														<div className="font-medium text-sky-300">
															{format(new Date(lesson.date), "MMM d, h:mm a")}
														</div>
														<div className="text-sm text-sky-200">
															{lesson.client?.name ||
																lesson.client?.email ||
																"Client"}
														</div>
													</div>
													<div className="flex items-center gap-2">
														<div className="text-xs text-sky-400">
															{lesson.title}
														</div>
														<button
															onClick={() =>
																handleDeleteLesson(lesson.id, lesson.title)
															}
															className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
															title="Delete lesson"
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</div>
												</div>
											))}
										</div>
									) : (
										<p className="text-gray-400 text-sm">
											No upcoming lessons scheduled
										</p>
									)}
								</div>
							</div>
						)
					})()}

					{/* Month Navigation */}
					<div className="flex items-center justify-between mb-6">
						<button
							onClick={() => navigateMonth("prev")}
							className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
						>
							<ChevronLeft className="h-5 w-5 text-white" />
						</button>
						<h3 className="text-xl font-semibold text-white">
							{format(currentMonth, "MMMM yyyy")}
						</h3>
						<button
							onClick={() => navigateMonth("next")}
							className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
						>
							<ChevronRight className="h-5 w-5 text-white" />
						</button>
					</div>

					{/* Calendar Legend */}
					<div className="flex items-center gap-6 mb-4 text-sm">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30"></div>
							<span className="text-gray-300">Scheduled Lessons</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded bg-sky-500/20 border border-sky-500/30"></div>
							<span className="text-gray-300">Today</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded bg-gray-800/20 opacity-50"></div>
							<span className="text-gray-300">Past Date</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded bg-gray-600"></div>
							<span className="text-gray-300">Other Month</span>
						</div>
					</div>

					{/* Calendar */}
					<div
						className="p-6 rounded-lg"
						style={{ backgroundColor: "#2A2F2F" }}
					>
						<div className="grid grid-cols-7 gap-1">
							{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
								<div
									key={day}
									className="text-center text-sm font-medium text-gray-400 py-3"
								>
									{day}
								</div>
							))}
							{calendarDays.map((day) => {
								const isToday = isSameDay(day, new Date())
								const isCurrentMonth = isSameMonth(day, currentMonth)
								const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))
								const lessonsForDay = getLessonsForDate(day)
								const hasLessons = lessonsForDay.length > 0

								return (
									<div
										key={day.toISOString()}
										onClick={() => !isPast && handleDateClick(day)}
										className={`
                      p-3 text-sm rounded-lg transition-all duration-200 relative min-h-[100px] 
                      ${
												isPast
													? "cursor-not-allowed opacity-50"
													: "cursor-pointer"
											}
                      ${
												isToday
													? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
													: isPast
													? "text-gray-500 bg-gray-800/20"
													: isCurrentMonth
													? "text-white hover:bg-sky-500/10"
													: "text-gray-600"
											}
                    `}
									>
										<div className="font-medium mb-2">{format(day, "d")}</div>
										{hasLessons ? (
											<div className="space-y-1">
												{lessonsForDay
													.slice(0, 3)
													.map((lesson: any, index: number) => (
														<div
															key={index}
															className="text-xs p-2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 relative group"
														>
															<div className="flex items-center justify-between">
																<div className="flex-1">
																	<div className="font-medium">
																		{format(new Date(lesson.date), "h:mm a")}
																	</div>
																	<div className="truncate text-emerald-200">
																		{lesson.client?.name ||
																			lesson.client?.email ||
																			"Client"}
																	</div>
																</div>
																<button
																	onClick={(e) => {
																		e.stopPropagation()
																		handleDeleteLesson(lesson.id, lesson.title)
																	}}
																	className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
																	title="Delete lesson"
																>
																	<Trash2 className="h-3 w-3" />
																</button>
															</div>
														</div>
													))}
												{lessonsForDay.length > 3 && (
													<div className="text-xs text-gray-400 text-center py-1">
														+{lessonsForDay.length - 3} more lessons
													</div>
												)}
											</div>
										) : (
											<div className="text-xs text-gray-500 mt-2">
												{isCurrentMonth && !isPast ? "No lessons" : ""}
											</div>
										)}
										{!hasLessons && isCurrentMonth && !isPast && (
											<div className="text-xs text-gray-500 mt-2">
												Click to schedule
											</div>
										)}
										{!hasLessons && isCurrentMonth && isPast && (
											<div className="text-xs text-gray-600 mt-2">
												Past date
											</div>
										)}
									</div>
								)
							})}
						</div>
					</div>

					{/* Working Hours Modal */}
					{showWorkingHoursModal && (
						<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
							<div
								className="rounded-2xl shadow-xl border p-6 w-full max-w-md mx-4"
								style={{
									backgroundColor: "#353A3A",
									borderColor: "#606364",
								}}
							>
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-xl font-bold text-white">
										Set Working Hours
									</h2>
									<button
										onClick={() => setShowWorkingHoursModal(false)}
										className="text-gray-400 hover:text-white transition-colors"
									>
										×
									</button>
								</div>

								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-white mb-2">
											Start Time
										</label>
										<select
											value={workingHours.startTime}
											onChange={(e) =>
												setWorkingHours({
													...workingHours,
													startTime: e.target.value,
												})
											}
											className="w-full p-2 rounded-lg border text-white"
											style={{
												backgroundColor: "#2A2F2F",
												borderColor: "#606364",
											}}
										>
											{Array.from({ length: 12 }, (_, i) => {
												const hour = i + 1
												return (
													<option key={`${hour}-AM`} value={`${hour}:00 AM`}>
														{hour}:00 AM
													</option>
												)
											})}
											{Array.from({ length: 12 }, (_, i) => {
												const hour = i + 1
												return (
													<option key={`${hour}-PM`} value={`${hour}:00 PM`}>
														{hour}:00 PM
													</option>
												)
											})}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-white mb-2">
											End Time
										</label>
										<select
											value={workingHours.endTime}
											onChange={(e) =>
												setWorkingHours({
													...workingHours,
													endTime: e.target.value,
												})
											}
											className="w-full p-2 rounded-lg border text-white"
											style={{
												backgroundColor: "#2A2F2F",
												borderColor: "#606364",
											}}
										>
											{Array.from({ length: 12 }, (_, i) => {
												const hour = i + 1
												return (
													<option key={`${hour}-AM`} value={`${hour}:00 AM`}>
														{hour}:00 AM
													</option>
												)
											})}
											{Array.from({ length: 12 }, (_, i) => {
												const hour = i + 1
												return (
													<option key={`${hour}-PM`} value={`${hour}:00 PM`}>
														{hour}:00 PM
													</option>
												)
											})}
										</select>
									</div>
								</div>

								<div className="flex gap-3 mt-6">
									<button
										onClick={() => setShowWorkingHoursModal(false)}
										className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
										style={{
											backgroundColor: "transparent",
											borderColor: "#606364",
											color: "#FFFFFF",
										}}
									>
										Cancel
									</button>
									<button
										onClick={handleSaveWorkingHours}
										disabled={updateWorkingHoursMutation.isPending}
										className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
										style={{
											backgroundColor: "#4A5A70",
											color: "#FFFFFF",
										}}
									>
										{updateWorkingHoursMutation.isPending ? (
											<>
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
												Saving...
											</>
										) : (
											<>
												<Save className="h-4 w-4" />
												Save Hours
											</>
										)}
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Schedule Lesson Modal */}
					{showScheduleModal && (
						<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
							<div
								className="rounded-2xl shadow-xl border p-6 w-full max-w-md mx-4"
								style={{
									backgroundColor: "#353A3A",
									borderColor: "#606364",
								}}
							>
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-xl font-bold text-white">
										Schedule New Lesson
									</h2>
									<button
										onClick={() => {
											setShowScheduleModal(false)
											setScheduleForm({ clientId: "", time: "", date: "" })
											setSelectedDate(null)
										}}
										className="text-gray-400 hover:text-white transition-colors"
									>
										<X className="h-5 w-5" />
									</button>
								</div>

								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-white mb-2">
											Client
										</label>
										<select
											value={scheduleForm.clientId}
											onChange={(e) =>
												setScheduleForm({
													...scheduleForm,
													clientId: e.target.value,
												})
											}
											className="w-full p-2 rounded-lg border text-white"
											style={{
												backgroundColor: "#2A2F2F",
												borderColor: "#606364",
											}}
										>
											<option value="">Select a client</option>
											{clients.map((client: any) => (
												<option key={client.id} value={client.id}>
													{client.name || client.email}
												</option>
											))}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-white mb-2">
											Date
										</label>
										<input
											type="date"
											value={scheduleForm.date}
											onChange={(e) =>
												setScheduleForm({
													...scheduleForm,
													date: e.target.value,
												})
											}
											className="w-full p-2 rounded-lg border text-white"
											style={{
												backgroundColor: "#2A2F2F",
												borderColor: "#606364",
											}}
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-white mb-2">
											Time
										</label>
										<select
											value={scheduleForm.time}
											onChange={(e) =>
												setScheduleForm({
													...scheduleForm,
													time: e.target.value,
												})
											}
											className="w-full p-2 rounded-lg border text-white"
											style={{
												backgroundColor: "#2A2F2F",
												borderColor: "#606364",
											}}
										>
											<option value="">Select a time</option>
											{timeSlots.map((slot) => (
												<option key={slot} value={slot}>
													{slot}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="flex gap-3 mt-6">
									<button
										onClick={() => {
											setShowScheduleModal(false)
											setScheduleForm({ clientId: "", time: "", date: "" })
											setSelectedDate(null)
										}}
										className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
										style={{
											backgroundColor: "transparent",
											borderColor: "#606364",
											color: "#FFFFFF",
										}}
									>
										Cancel
									</button>
									<button
										onClick={handleScheduleLesson}
										disabled={scheduleLessonMutation.isPending}
										className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
										style={{
											backgroundColor: "#10B981",
											color: "#FFFFFF",
										}}
									>
										{scheduleLessonMutation.isPending ? (
											<>
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
												Scheduling...
											</>
										) : (
											<>
												<Calendar className="h-4 w-4" />
												Schedule Lesson
											</>
										)}
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Day Overview Modal */}
					{showDayOverviewModal && selectedDate && (
						<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
							<div
								className="rounded-2xl shadow-xl border p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
								style={{
									backgroundColor: "#353A3A",
									borderColor: "#606364",
								}}
							>
								<div className="flex items-center justify-between mb-6">
									<div>
										<h2 className="text-2xl font-bold text-white">
											{format(selectedDate, "EEEE, MMMM d, yyyy")}
										</h2>
										<p className="text-gray-400 text-sm">
											Working Hours:{" "}
											{coachProfile?.workingHours?.startTime || "9:00 AM"} -{" "}
											{coachProfile?.workingHours?.endTime || "6:00 PM"}
										</p>
									</div>
									<button
										onClick={() => {
											setShowDayOverviewModal(false)
											setSelectedDate(null)
											setScheduleForm({ clientId: "", time: "", date: "" })
										}}
										className="text-gray-400 hover:text-white transition-colors"
									>
										<X className="h-6 w-6" />
									</button>
								</div>

								{/* Existing Lessons */}
								<div className="mb-6">
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-lg font-semibold text-white">
											Scheduled Lessons
										</h3>
										<button
											onClick={() => setShowScheduleModal(true)}
											className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200"
											style={{
												backgroundColor: "#10B981",
												color: "#FFFFFF",
											}}
										>
											<Plus className="h-4 w-4" />
											Add Lesson
										</button>
									</div>

									{(() => {
										const dayLessons = getAllLessonsForDate(selectedDate)
										return dayLessons.length > 0 ? (
											<div className="space-y-3">
												{dayLessons.map((lesson: any, index: number) => {
													const lessonDate = new Date(lesson.date)
													const isPast = lessonDate < new Date()
													return (
														<div
															key={index}
															className={`flex items-center justify-between p-4 rounded-lg border group ${
																isPast
																	? "bg-gray-800/20 border-gray-600/30"
																	: "bg-emerald-500/10 border-emerald-500/20"
															}`}
														>
															<div className="flex-1">
																<div
																	className={`font-medium ${
																		isPast
																			? "text-gray-400"
																			: "text-emerald-300"
																	}`}
																>
																	{format(lessonDate, "h:mm a")}
																</div>
																<div
																	className={`text-sm ${
																		isPast
																			? "text-gray-500"
																			: "text-emerald-200"
																	}`}
																>
																	{lesson.client?.name ||
																		lesson.client?.email ||
																		"Client"}
																</div>
																<div
																	className={`text-xs ${
																		isPast
																			? "text-gray-600"
																			: "text-emerald-400"
																	}`}
																>
																	{lesson.title}
																</div>
															</div>
															{!isPast && (
																<button
																	onClick={() =>
																		handleDeleteLesson(lesson.id, lesson.title)
																	}
																	className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
																	title="Delete lesson"
																>
																	<Trash2 className="h-4 w-4" />
																</button>
															)}
														</div>
													)
												})}
											</div>
										) : (
											<div className="text-center py-8">
												<Calendar className="h-12 w-12 text-gray-500 mx-auto mb-3" />
												<p className="text-gray-400">
													No lessons scheduled for this day
												</p>
											</div>
										)
									})()}
								</div>

								{/* Available Time Slots */}
								<div>
									<h3 className="text-lg font-semibold text-white mb-4">
										Available Time Slots
									</h3>
									{(() => {
										const availableSlots =
											generateAvailableTimeSlots(selectedDate)
										return availableSlots.length > 0 ? (
											<div className="grid grid-cols-3 gap-2">
												{availableSlots.map((slot, index) => (
													<button
														key={index}
														onClick={() => {
															setScheduleForm({
																...scheduleForm,
																time: slot,
															})
															setShowDayOverviewModal(false)
															setShowScheduleModal(true)
														}}
														className="p-3 rounded-lg border text-center transition-all duration-200 hover:bg-sky-500/10 hover:border-sky-500/30"
														style={{
															backgroundColor: "#2A2F2F",
															borderColor: "#606364",
															color: "#FFFFFF",
														}}
													>
														{slot}
													</button>
												))}
											</div>
										) : (
											<div className="text-center py-6">
												<Clock className="h-10 w-10 text-gray-500 mx-auto mb-2" />
												<p className="text-gray-400">No available time slots</p>
												<p className="text-gray-500 text-sm">
													All working hours are booked
												</p>
											</div>
										)
									})()}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</Sidebar>
	)
}
