"use client"

import { useState } from "react"
import { trpc } from "@/app/_trpc/client"
import {
	X,
	Calendar,
	Clock,
	Mail,
	Check,
	ChevronLeft,
	ChevronRight,
} from "lucide-react"
import {
	format,
	addDays,
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

interface ScheduleLessonModalProps {
	isOpen: boolean
	onClose: () => void
	clientId: string
	clientName: string
	clientEmail?: string | null
}

export default function ScheduleLessonModal({
	isOpen,
	onClose,
	clientId,
	clientName,
	clientEmail,
}: ScheduleLessonModalProps) {
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [selectedTime, setSelectedTime] = useState<string>("")
	const [isScheduling, setIsScheduling] = useState(false)
	const [sendEmail, setSendEmail] = useState(true)
	const [currentMonth, setCurrentMonth] = useState(new Date())

	// Fetch coach's profile for working hours
	const { data: coachProfile } = trpc.user.getProfile.useQuery()

	// Generate time slots based on coach's working hours
	const generateTimeSlots = () => {
		// Use coach's working hours if available, otherwise default to 9 AM to 6 PM
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

		while (currentHour < endHour24) {
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
	console.log("Generated time slots:", timeSlots) // Debug log

	// Generate calendar days for the current month view
	const monthStart = startOfMonth(currentMonth)
	const monthEnd = endOfMonth(currentMonth)
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
	const calendarDays = eachDayOfInterval({
		start: calendarStart,
		end: calendarEnd,
	})

	// Fetch coach's schedule for the current month
	const { data: coachSchedule = [] } =
		trpc.scheduling.getCoachSchedule.useQuery({
			month: currentMonth.getMonth(),
			year: currentMonth.getFullYear(),
		})

	const utils = trpc.useUtils()
	const scheduleLessonMutation = trpc.scheduling.scheduleLesson.useMutation({
		onSuccess: () => {
			setIsScheduling(false)
			onClose()
			setSelectedDate(null)
			setSelectedTime("")

			// Invalidate and refetch client data to show updated schedule
			utils.clients.getById.invalidate({ id: clientId })
			utils.scheduling.getWeeklySchedule.invalidate({ clientId })
			utils.scheduling.getCoachSchedule.invalidate()
		},
		onError: (error) => {
			setIsScheduling(false)
			alert(`Error scheduling lesson: ${error.message}`)
		},
	})

	const handleSchedule = async () => {
		if (!selectedDate || !selectedTime) {
			alert("Please select a date and time")
			return
		}

		setIsScheduling(true)

		// Parse the selected time and create the lesson date
		const timeMatch = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i)
		if (!timeMatch) {
			alert("Invalid time format")
			setIsScheduling(false)
			return
		}

		let [_, hours, minutes, period] = timeMatch
		let hour = parseInt(hours)

		// Convert to 24-hour format
		if (period.toUpperCase() === "PM" && hour !== 12) {
			hour += 12
		} else if (period.toUpperCase() === "AM" && hour === 12) {
			hour = 0
		}

		const lessonDate = new Date(selectedDate)
		lessonDate.setHours(hour, parseInt(minutes), 0, 0)

		scheduleLessonMutation.mutate({
			clientId,
			lessonDate: lessonDate.toISOString(),
			sendEmail,
		})
	}

	const navigateMonth = (direction: "prev" | "next") => {
		setCurrentMonth(
			direction === "prev"
				? subMonths(currentMonth, 1)
				: addMonths(currentMonth, 1)
		)
	}

	const getLessonsForDate = (date: Date) => {
		return coachSchedule.filter((lesson: any) =>
			isSameDay(new Date(lesson.date), date)
		)
	}

	const isTimeSlotAvailable = (date: Date, time: string) => {
		// Parse the time slot to 24-hour format for comparison
		const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
		if (!timeMatch) return false

		let [_, hours, minutes, period] = timeMatch
		let hour = parseInt(hours)

		// Convert to 24-hour format
		if (period.toUpperCase() === "PM" && hour !== 12) {
			hour += 12
		} else if (period.toUpperCase() === "AM" && hour === 12) {
			hour = 0
		}

		return !coachSchedule.some((lesson: any) => {
			const lessonDate = new Date(lesson.date)
			return isSameDay(lessonDate, date) && lessonDate.getHours() === hour
		})
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div
				className="rounded-2xl shadow-xl border p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
				style={{
					backgroundColor: "#353A3A",
					borderColor: "#606364",
				}}
			>
				{/* Header */}
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-bold text-white">Schedule Lesson</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Client Info */}
				<div
					className="mb-4 p-3 rounded-lg"
					style={{ backgroundColor: "#2A2F2F" }}
				>
					<p className="text-sm text-gray-300">Scheduling for:</p>
					<p className="text-white font-medium">{clientName}</p>
					{clientEmail && (
						<p className="text-sm text-gray-400">{clientEmail}</p>
					)}
				</div>

				{/* Coach Working Hours Info */}
				<div
					className="mb-4 p-3 rounded-lg"
					style={{ backgroundColor: "#2A2F2F" }}
				>
					<p className="text-sm text-gray-300">Coach's Working Hours:</p>
					<p className="text-white font-medium">
						{coachProfile?.workingHours?.startTime || "9:00 AM"} -{" "}
						{coachProfile?.workingHours?.endTime || "6:00 PM"}
					</p>
				</div>

				{/* Month Navigation */}
				<div className="flex items-center justify-between mb-4">
					<button
						onClick={() => navigateMonth("prev")}
						className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
					>
						<ChevronLeft className="h-5 w-5 text-white" />
					</button>
					<h3 className="text-lg font-semibold text-white">
						{format(currentMonth, "MMMM yyyy")}
					</h3>
					<button
						onClick={() => navigateMonth("next")}
						className="p-2 rounded-lg hover:bg-sky-500/20 transition-colors"
					>
						<ChevronRight className="h-5 w-5 text-white" />
					</button>
				</div>

				{/* Calendar */}
				<div className="mb-6">
					<h3 className="text-sm font-medium text-white mb-3">Select Date</h3>
					<div className="grid grid-cols-7 gap-1">
						{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
							<div key={day} className="text-center text-xs text-gray-400 py-2">
								{day}
							</div>
						))}
						{calendarDays.map((day) => {
							const isSelected = selectedDate && isSameDay(day, selectedDate)
							const isToday = isSameDay(day, new Date())
							const isPast = day < new Date()
							const isCurrentMonth = isSameMonth(day, currentMonth)
							const lessonsForDay = getLessonsForDate(day)
							const hasLessons = lessonsForDay.length > 0

							return (
								<button
									key={day.toISOString()}
									onClick={() =>
										!isPast && isCurrentMonth && setSelectedDate(day)
									}
									disabled={isPast || !isCurrentMonth}
									className={`
                    p-2 text-sm rounded-lg transition-all duration-200 relative
                    ${
											isSelected
												? "bg-sky-500 text-white"
												: isToday
												? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
												: isPast || !isCurrentMonth
												? "text-gray-600 cursor-not-allowed"
												: "text-white hover:bg-sky-500/20 hover:text-sky-400"
										}
                   `}
								>
									{format(day, "d")}
									{hasLessons && (
										<div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
									)}
								</button>
							)
						})}
					</div>

					{/* Legend */}
					<div className="flex items-center gap-4 mt-3 text-xs">
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-red-500 rounded-full"></div>
							<span className="text-gray-400">Existing lessons</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-sky-500 rounded-full"></div>
							<span className="text-gray-400">Available slots</span>
						</div>
					</div>
				</div>

				{/* Time Selection */}
				{selectedDate && (
					<div className="mb-6">
						<h3 className="text-sm font-medium text-white mb-3">
							Select Time for {format(selectedDate, "EEEE, MMMM d, yyyy")}
						</h3>
						<div className="grid grid-cols-3 gap-2">
							{timeSlots.map((time) => {
								const isAvailable = isTimeSlotAvailable(selectedDate, time)
								const isSelected = selectedTime === time

								return (
									<button
										key={time}
										onClick={() => isAvailable && setSelectedTime(time)}
										disabled={!isAvailable}
										className={`
                    p-2 text-sm rounded-lg transition-all duration-200
                    ${
											isSelected
												? "bg-sky-500 text-white"
												: isAvailable
												? "text-white hover:bg-sky-500/20 hover:text-sky-400"
												: "text-gray-600 cursor-not-allowed bg-gray-700"
										}
                   `}
									>
										{time}
									</button>
								)
							})}
						</div>
					</div>
				)}

				{/* Email Notification */}
				{clientEmail && (
					<div className="mb-6">
						<div
							className="flex items-center gap-3 p-3 rounded-lg"
							style={{ backgroundColor: "#2A2F2F" }}
						>
							<input
								type="checkbox"
								id="send-email"
								checked={sendEmail}
								onChange={(e) => setSendEmail(e.target.checked)}
								className="rounded border-gray-600 bg-gray-700 text-sky-500 focus:ring-sky-500"
							/>
							<label
								htmlFor="send-email"
								className="text-sm text-white cursor-pointer"
							>
								Send email notification to {clientEmail}
							</label>
						</div>
						{sendEmail && (
							<p className="text-xs text-gray-400 mt-2">
								Client will receive an email with a link to accept/decline the
								lesson
							</p>
						)}
					</div>
				)}

				{/* Selected Appointment Summary */}
				{selectedDate && selectedTime && (
					<div
						className="mb-6 p-4 rounded-lg"
						style={{ backgroundColor: "#2A2F2F" }}
					>
						<h3 className="text-sm font-medium text-white mb-2">
							Appointment Summary
						</h3>
						<div className="space-y-1 text-sm text-gray-300">
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4" />
								{format(selectedDate, "EEEE, MMMM d, yyyy")}
							</div>
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4" />
								{selectedTime}
							</div>
							{sendEmail && clientEmail && (
								<div className="flex items-center gap-2">
									<Mail className="h-4 w-4" />
									Email notification will be sent
								</div>
							)}
						</div>
					</div>
				)}

				{/* Actions */}
				<div className="flex gap-3">
					<button
						onClick={onClose}
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
						onClick={handleSchedule}
						disabled={!selectedDate || !selectedTime || isScheduling}
						className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						style={{
							backgroundColor: "#4A5A70",
							color: "#FFFFFF",
						}}
					>
						{isScheduling ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								Scheduling...
							</>
						) : (
							<>
								<Check className="h-4 w-4" />
								Schedule Lesson
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}
