"use client"

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { trpc } from "@/app/_trpc/client"
import { useState } from "react"
import {
	PlayCircle,
	CheckCircle2,
	Calendar,
	MessageCircle,
	Upload,
	Bell,
	TrendingUp,
	Target,
	Clock,
	Loader2,
	ChevronRight,
	User,
	BookOpen,
	BarChart3,
} from "lucide-react"

import ClientSidebar from "@/components/ClientSidebar"

export default function ClientDashboard() {
	const {
		user,
		isAuthenticated,
		isLoading: authLoading,
	} = useKindeBrowserClient()

	// tRPC queries for real data
	const { data: userProfile, isLoading: profileLoading } =
		trpc.user.getProfile.useQuery()
	const { data: todaysWorkouts = [], isLoading: workoutsLoading } =
		trpc.workouts.getTodaysWorkouts.useQuery()
	const { data: assignedVideos = [], isLoading: videosLoading } =
		trpc.library.getAssignedVideos.useQuery()
	const { data: progressData, isLoading: progressLoading } =
		trpc.progress.getClientProgress.useQuery()
	const { data: upcomingEvents = [], isLoading: eventsLoading } =
		trpc.events.getUpcoming.useQuery()
	const { data: conversations = [], isLoading: messagesLoading } =
		trpc.messaging.getConversations.useQuery()
	const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery()

	const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([])
	const [watchedVideos, setWatchedVideos] = useState<string[]>([])

	// Mutation for marking workouts as complete
	const markWorkoutComplete = trpc.workouts.markComplete.useMutation({
		onSuccess: () => {
			// Refetch today's workouts to get updated completion status
			// The query will automatically refetch due to the mutation
		},
		onError: (error: any) => {
			console.error("Failed to mark workout as complete:", error)
		},
	})

	const toggleWorkoutComplete = async (workoutId: string) => {
		const isCurrentlyCompleted = completedWorkouts.includes(workoutId)

		// Optimistically update UI
		setCompletedWorkouts((prev) =>
			isCurrentlyCompleted
				? prev.filter((id) => id !== workoutId)
				: [...prev, workoutId]
		)

		// Update database
		try {
			await markWorkoutComplete.mutateAsync({
				workoutId,
				completed: !isCurrentlyCompleted,
			})
		} catch (error) {
			// Revert optimistic update on error
			setCompletedWorkouts((prev) =>
				isCurrentlyCompleted
					? [...prev, workoutId]
					: prev.filter((id) => id !== workoutId)
			)
		}
	}

	const toggleVideoWatched = (videoId: string) => {
		setWatchedVideos((prev) =>
			prev.includes(videoId)
				? prev.filter((id) => id !== videoId)
				: [...prev, videoId]
		)
	}

	if (authLoading || profileLoading) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ backgroundColor: "#2B3038" }}
			>
				<div
					className="flex items-center space-x-3"
					style={{ color: "#C3BCC2" }}
				>
					<Loader2
						className="h-8 w-8 animate-spin"
						style={{ color: "#4A5A70" }}
					/>
					<span className="text-lg">Loading your dashboard...</span>
				</div>
			</div>
		)
	}

	if (!isAuthenticated) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ backgroundColor: "#2B3038" }}
			>
				<div className="text-center">
					<h2
						className="text-2xl font-semibold mb-3"
						style={{ color: "#C3BCC2" }}
					>
						Access Denied
					</h2>
					<p className="text-lg" style={{ color: "#ABA4AA" }}>
						Please sign in to access your dashboard.
					</p>
				</div>
			</div>
		)
	}

	const getGreeting = () => {
		const hour = new Date().getHours()
		if (hour < 12) return "Good morning"
		if (hour < 17) return "Good afternoon"
		return "Good evening"
	}

	// Calculate real metrics
	const todaysWorkoutCount = todaysWorkouts.length
	const completedCount = todaysWorkouts.filter((w) => w.completed).length
	const weeklyProgress =
		todaysWorkoutCount > 0
			? Math.round((completedCount / todaysWorkoutCount) * 100)
			: 0
	const upcomingSessionsCount = upcomingEvents.length

	return (
		<ClientSidebar
			user={{
				name: userProfile?.name || "",
				email: userProfile?.email || user?.email || "",
			}}
		>
			<div className="min-h-screen p-8" style={{ backgroundColor: "#2A3133" }}>
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
									{getGreeting()},{" "}
									{userProfile?.name ||
										user?.given_name ||
										user?.email?.split("@")[0]}
									!
								</h1>
								<div
									className="text-xl flex items-center gap-3"
									style={{ color: "#ABA4AA" }}
								>
									<div
										className="p-2 rounded-full"
										style={{ backgroundColor: "#4A5A70" }}
									>
										<TrendingUp
											className="h-5 w-5"
											style={{ color: "#C3BCC2" }}
										/>
									</div>
									<span>Ready to crush today's training?</span>
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

					{/* Enhanced Stats Row */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
						<div
							className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
							style={{
								background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
								borderColor: "#4A5A70",
							}}
						>
							{/* Animated background */}
							<div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

							<div className="relative z-10">
								<div className="flex items-center justify-between mb-6">
									<div
										className="p-3 rounded-2xl"
										style={{ backgroundColor: "#4A5A70" }}
									>
										<Target className="h-8 w-8" style={{ color: "#C3BCC2" }} />
									</div>
									<span
										className="text-4xl font-bold"
										style={{ color: "#C3BCC2" }}
									>
										{todaysWorkoutCount}
									</span>
								</div>
								<h3
									className="text-xl font-bold mb-3"
									style={{ color: "#C3BCC2" }}
								>
									Today's Drills
								</h3>
								<p className="text-base" style={{ color: "#ABA4AA" }}>
									{todaysWorkoutCount > 0 ? "Ready to go!" : "No drills today"}
								</p>
							</div>
						</div>

						<div
							className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
							style={{
								background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
								borderColor: "#10B981",
							}}
						>
							{/* Animated background */}
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
										{weeklyProgress}%
									</span>
								</div>
								<h3
									className="text-xl font-bold mb-3"
									style={{ color: "#C3BCC2" }}
								>
									Today's Progress
								</h3>
								<p className="text-base" style={{ color: "#ABA4AA" }}>
									{weeklyProgress > 0 ? "Great work!" : "Let's get started"}
								</p>
							</div>
						</div>

						<div
							className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
							style={{
								background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
								borderColor: "#F59E0B",
							}}
						>
							{/* Animated background */}
							<div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

							<div className="relative z-10">
								<div className="flex items-center justify-between mb-6">
									<div
										className="p-3 rounded-2xl"
										style={{ backgroundColor: "#F59E0B" }}
									>
										<Calendar
											className="h-8 w-8"
											style={{ color: "#C3BCC2" }}
										/>
									</div>
									<span
										className="text-4xl font-bold"
										style={{ color: "#C3BCC2" }}
									>
										{upcomingSessionsCount}
									</span>
								</div>
								<h3
									className="text-xl font-bold mb-3"
									style={{ color: "#C3BCC2" }}
								>
									Upcoming Sessions
								</h3>
								<p className="text-base" style={{ color: "#ABA4AA" }}>
									{upcomingSessionsCount > 0 ? "This week" : "Schedule clear"}
								</p>
							</div>
						</div>

						<div
							className="rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 shadow-2xl border relative overflow-hidden group"
							style={{
								background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
								borderColor: "#8B5CF6",
							}}
						>
							{/* Animated background */}
							<div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

							<div className="relative z-10">
								<div className="flex items-center justify-between mb-6">
									<div
										className="p-3 rounded-2xl"
										style={{ backgroundColor: "#8B5CF6" }}
									>
										<MessageCircle
											className="h-8 w-8"
											style={{ color: "#C3BCC2" }}
										/>
									</div>
									<span
										className="text-4xl font-bold"
										style={{ color: "#C3BCC2" }}
									>
										{unreadCount}
									</span>
								</div>
								<h3
									className="text-xl font-bold mb-3"
									style={{ color: "#C3BCC2" }}
								>
									New Messages
								</h3>
								<p className="text-base" style={{ color: "#ABA4AA" }}>
									{unreadCount > 0 ? "From your coach" : "All caught up"}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
					{/* Left Column - Main Content */}
					<div className="xl:col-span-2 space-y-8">
						{/* Today's Plan Section */}
						<div
							className="rounded-3xl p-8 shadow-2xl border relative overflow-hidden"
							style={{
								background: "linear-gradient(135deg, #353A3A 0%, #2B3038 100%)",
								borderColor: "#4A5A70",
							}}
						>
							{/* Decorative background */}
							<div className="absolute top-0 right-0 w-24 h-24 opacity-5">
								<div
									className="w-full h-full rounded-full"
									style={{
										background: "linear-gradient(45deg, #4A5A70, #606364)",
									}}
								></div>
							</div>

							<div className="relative z-10">
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

								{workoutsLoading ? (
									<div className="flex items-center justify-center py-12">
										<Loader2
											className="h-8 w-8 animate-spin"
											style={{ color: "#4A5A70" }}
										/>
									</div>
								) : todaysWorkouts.length > 0 ? (
									<div className="space-y-6">
										{todaysWorkouts.map((workout) => (
											<div
												key={workout.id}
												className="rounded-xl p-6 transition-all duration-200 hover:scale-102 shadow-lg border"
												style={{
													backgroundColor: "#2B3038",
													borderColor: "#606364",
													borderWidth: "1px",
												}}
											>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<h3
															className="text-xl font-semibold mb-3"
															style={{ color: "#C3BCC2" }}
														>
															{workout.title}
														</h3>
														<p
															className="text-base mb-4"
															style={{ color: "#ABA4AA" }}
														>
															{workout.description || workout.notes}
														</p>
														<div className="flex items-center space-x-6">
															{workout.videoUrl && (
																<button
																	className="flex items-center text-base font-medium transition-colors hover:scale-105"
																	style={{ color: "#4A5A70" }}
																>
																	<PlayCircle className="w-5 h-5 mr-2" />
																	Watch Video
																</button>
															)}
															<span
																className="text-base"
																style={{ color: "#ABA4AA" }}
															>
																{workout.duration || "15 mins"}
															</span>
														</div>
													</div>
													<button
														onClick={() => toggleWorkoutComplete(workout.id)}
														disabled={markWorkoutComplete.isPending}
														className={`ml-6 p-3 rounded-xl transition-all duration-200 ${
															workout.completed
																? "shadow-lg border"
																: "shadow-lg border"
														} ${
															markWorkoutComplete.isPending
																? "opacity-50 cursor-not-allowed"
																: ""
														}`}
														style={{
															backgroundColor: workout.completed
																? "#10B981"
																: "#606364",
															borderColor: workout.completed
																? "#10B981"
																: "#ABA4AA",
															color: workout.completed ? "#C3BCC2" : "#ABA4AA",
														}}
													>
														{markWorkoutComplete.isPending ? (
															<Loader2 className="w-6 h-6 animate-spin" />
														) : (
															<CheckCircle2 className="w-6 h-6" />
														)}
													</button>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-16">
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
										<p className="text-base" style={{ color: "#ABA4AA" }}>
											Check back later or contact your coach
										</p>
									</div>
								)}
							</div>
						</div>

						{/* Video Library Section */}
						<div
							className="rounded-2xl p-8 shadow-xl border"
							style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
						>
							<div className="flex items-center justify-between mb-8">
								<div className="flex items-center gap-3">
									<PlayCircle
										className="h-6 w-6"
										style={{ color: "#4A5A70" }}
									/>
									<h2
										className="text-2xl font-bold"
										style={{ color: "#C3BCC2" }}
									>
										Assigned Videos
									</h2>
								</div>
								<button
									className="flex items-center text-base font-medium transition-colors hover:scale-105"
									style={{ color: "#4A5A70" }}
								>
									<Upload className="w-5 h-5 mr-2" />
									Upload for Review
								</button>
							</div>

							{videosLoading ? (
								<div className="flex items-center justify-center py-12">
									<Loader2
										className="h-8 w-8 animate-spin"
										style={{ color: "#4A5A70" }}
									/>
								</div>
							) : assignedVideos.length > 0 ? (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									{assignedVideos.map((video) => (
										<div
											key={video.id}
											className="rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 shadow-lg border"
											style={{
												backgroundColor: "#2B3038",
												borderColor: "#606364",
												borderWidth: "1px",
											}}
										>
											<div
												className="aspect-video relative"
												style={{ backgroundColor: "#606364" }}
											>
												{video.thumbnail ? (
													<img
														src={video.thumbnail}
														alt={video.title}
														className="w-full h-full object-cover"
													/>
												) : (
													<div className="absolute inset-0 flex items-center justify-center">
														<PlayCircle
															className="w-16 h-16"
															style={{ color: "#ABA4AA" }}
														/>
													</div>
												)}
											</div>
											<div className="p-6">
												<h3
													className="text-lg font-semibold mb-3"
													style={{ color: "#C3BCC2" }}
												>
													{video.title}
												</h3>
												<p
													className="text-base mb-4"
													style={{ color: "#ABA4AA" }}
												>
													{video.description}
												</p>
												<button
													onClick={() => toggleVideoWatched(video.id)}
													className={`w-full py-3 px-6 rounded-xl text-base font-medium transition-all duration-200 ${
														watchedVideos.includes(video.id)
															? "shadow-lg border"
															: "shadow-lg border"
													}`}
													style={{
														backgroundColor: watchedVideos.includes(video.id)
															? "#4A5A70"
															: "#4A5A70",
														borderColor: watchedVideos.includes(video.id)
															? "#4A5A70"
															: "#4A5A70",
														color: "#C3BCC2",
													}}
												>
													{watchedVideos.includes(video.id)
														? "Watched ✓"
														: "Mark as Watched"}
												</button>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-16">
									<PlayCircle
										className="w-16 h-16 mx-auto mb-6"
										style={{ color: "#606364" }}
									/>
									<h3
										className="text-xl font-semibold mb-3"
										style={{ color: "#C3BCC2" }}
									>
										No videos assigned yet
									</h3>
									<p className="text-base" style={{ color: "#ABA4AA" }}>
										Your coach will assign training videos soon
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Right Column - Sidebar */}
					<div className="space-y-8">
						{/* Progress Tracking */}
						<div
							className="rounded-2xl p-8 shadow-xl border"
							style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
						>
							<div className="flex items-center gap-3 mb-8">
								<BarChart3 className="h-6 w-6" style={{ color: "#4A5A70" }} />
								<h2 className="text-2xl font-bold" style={{ color: "#C3BCC2" }}>
									Progress Tracking
								</h2>
							</div>

							{progressLoading ? (
								<div className="flex items-center justify-center py-8">
									<Loader2
										className="h-6 w-6 animate-spin"
										style={{ color: "#4A5A70" }}
									/>
								</div>
							) : (
								<div className="space-y-6">
									{/* Weekly Streak */}
									<div>
										<div className="flex items-center justify-between mb-3">
											<span
												className="text-base font-medium"
												style={{ color: "#ABA4AA" }}
											>
												Weekly Streak
											</span>
											<span
												className="text-lg font-semibold"
												style={{ color: "#C3BCC2" }}
											>
												{progressData?.currentStreak || 0} days
											</span>
										</div>
										<div
											className="w-full rounded-full h-3"
											style={{ backgroundColor: "#606364" }}
										>
											<div
												className="h-3 rounded-full transition-all duration-300"
												style={{
													width: `${progressData?.streakPercentage || 0}%`,
													background:
														"linear-gradient(to right, #4A5A70, #606364)",
												}}
											></div>
										</div>
									</div>

									{/* Skill Improvements */}
									<div>
										<h3
											className="text-lg font-semibold mb-4"
											style={{ color: "#ABA4AA" }}
										>
											Skill Improvements
										</h3>
										{progressData?.skills && progressData.skills.length > 0 ? (
											<div className="space-y-4">
												{progressData.skills.map(
													(skill: { name: string; progress: number }) => (
														<div key={skill.name}>
															<div className="flex items-center justify-between mb-2">
																<span
																	className="text-base"
																	style={{ color: "#ABA4AA" }}
																>
																	{skill.name}
																</span>
																<span
																	className="text-base font-semibold"
																	style={{ color: "#C3BCC2" }}
																>
																	{skill.progress}%
																</span>
															</div>
															<div
																className="w-full rounded-full h-2"
																style={{ backgroundColor: "#606364" }}
															>
																<div
																	className="h-2 rounded-full transition-all duration-300"
																	style={{
																		width: `${skill.progress}%`,
																		background:
																			"linear-gradient(to right, #4A5A70, #606364)",
																	}}
																></div>
															</div>
														</div>
													)
												)}
											</div>
										) : (
											<p className="text-base" style={{ color: "#ABA4AA" }}>
												No progress data available yet
											</p>
										)}
									</div>
								</div>
							)}
						</div>

						{/* Upcoming Events */}
						<div
							className="rounded-2xl p-8 shadow-xl border"
							style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
						>
							<div className="flex items-center gap-3 mb-8">
								<Calendar className="h-6 w-6" style={{ color: "#4A5A70" }} />
								<h2 className="text-2xl font-bold" style={{ color: "#C3BCC2" }}>
									Upcoming Events
								</h2>
							</div>

							{eventsLoading ? (
								<div className="flex items-center justify-center py-8">
									<Loader2
										className="h-6 w-6 animate-spin"
										style={{ color: "#4A5A70" }}
									/>
								</div>
							) : upcomingEvents.length > 0 ? (
								<div className="space-y-6">
									{/* Next Event Countdown */}
									{upcomingEvents[0] && (
										<div
											className="rounded-xl p-6 shadow-lg border"
											style={{
												background:
													"linear-gradient(to right, #4A5A70, #606364)",
												borderColor: "#4A5A70",
											}}
										>
											<div className="text-center">
												<div
													className="text-base opacity-90 mb-2"
													style={{ color: "#C3BCC2" }}
												>
													Next Event
												</div>
												<div
													className="text-3xl font-bold mb-2"
													style={{ color: "#C3BCC2" }}
												>
													{Math.ceil(
														(new Date(upcomingEvents[0].date).getTime() -
															new Date().getTime()) /
															(1000 * 60 * 60 * 24)
													)}{" "}
													Days
												</div>
												<div
													className="text-base opacity-90"
													style={{ color: "#C3BCC2" }}
												>
													{upcomingEvents[0].title}
												</div>
											</div>
										</div>
									)}

									{/* Event List */}
									<div className="space-y-4">
										{upcomingEvents.slice(0, 3).map((event) => (
											<div
												key={event.id}
												className="flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:scale-105 shadow-lg"
												style={{
													backgroundColor: "#2B3038",
													borderColor: "#606364",
													borderWidth: "1px",
												}}
											>
												<div className="flex items-center space-x-4">
													<div
														className="text-base font-semibold px-3 py-2 rounded-lg border"
														style={{
															color: "#C3BCC2",
															backgroundColor: "#606364",
															borderColor: "#ABA4AA",
														}}
													>
														{new Date(event.date).toLocaleDateString("en-US", {
															month: "numeric",
															day: "numeric",
														})}
													</div>
													<div>
														<div
															className="text-base font-semibold"
															style={{ color: "#C3BCC2" }}
														>
															{event.title}
														</div>
														<div
															className="text-sm"
															style={{ color: "#ABA4AA" }}
														>
															{new Date(event.date).toLocaleTimeString(
																"en-US",
																{
																	hour: "numeric",
																	minute: "2-digit",
																}
															)}
														</div>
													</div>
												</div>
												<Clock
													className="w-5 h-5"
													style={{ color: "#ABA4AA" }}
												/>
											</div>
										))}
									</div>
								</div>
							) : (
								<div className="text-center py-12">
									<Calendar
										className="w-16 h-16 mx-auto mb-6"
										style={{ color: "#606364" }}
									/>
									<h3
										className="text-xl font-semibold mb-3"
										style={{ color: "#C3BCC2" }}
									>
										No upcoming events
									</h3>
									<p className="text-base" style={{ color: "#ABA4AA" }}>
										Your schedule is clear for now
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</ClientSidebar>
	)
}
