"use client"

import { useState } from "react"
import { trpc } from "@/app/_trpc/client"
import {
	BarChart3,
	TrendingUp,
	Users,
	Trophy,
	Target,
	Calendar,
	Clock,
	Star,
	Activity,
	Zap,
	ArrowUp,
	ArrowDown,
	Minus,
	Eye,
	MessageCircle,
	PlayCircle,
	CheckCircle,
	Settings,
	Goal,
	BarChart,
	LineChart,
} from "lucide-react"
import Sidebar from "./Sidebar"

export default function AnalyticsDashboard() {
	const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
	const [selectedMetric, setSelectedMetric] = useState<string>("overview")
	const [showGoals, setShowGoals] = useState(false)

	// Fetch analytics data
	const { data: analyticsData, isLoading } =
		trpc.analytics.getDashboardData.useQuery({
			timeRange,
		})

	const { data: clientProgress = [] } =
		trpc.analytics.getClientProgress.useQuery({
			timeRange,
		})

	const { data: programPerformance = [] } =
		trpc.analytics.getProgramPerformance.useQuery({
			timeRange,
		})

	const { data: engagementMetrics } =
		trpc.analytics.getEngagementMetrics.useQuery({
			timeRange,
		})

	// Mock goals data (you can make this real later)
	const goals = {
		activeClients: 20,
		averageProgress: 75,
		completionRate: 85,
		retentionRate: 90,
	}

	if (isLoading) {
		return (
			<Sidebar>
				<div className="flex items-center justify-center h-64">
					<div
						className="animate-spin rounded-full h-8 w-8 border-b-2"
						style={{ borderColor: "#4A5A70" }}
					></div>
				</div>
			</Sidebar>
		)
	}

	const formatPercentage = (value: number) => `${value.toFixed(1)}%`
	const formatNumber = (value: number) => value.toLocaleString()
	const formatCurrency = (value: number) => `$${value.toLocaleString()}`

	const getTrendIcon = (trend: number) => {
		if (trend > 0) return <ArrowUp className="h-4 w-4 text-green-400" />
		if (trend < 0) return <ArrowDown className="h-4 w-4 text-red-400" />
		return <Minus className="h-4 w-4 text-gray-400" />
	}

	const getTrendColor = (trend: number) => {
		if (trend > 0) return "text-green-400"
		if (trend < 0) return "text-red-400"
		return "text-gray-400"
	}

	const getGoalStatus = (current: number, goal: number) => {
		const percentage = (current / goal) * 100
		if (percentage >= 100)
			return { status: "achieved", color: "text-green-400" }
		if (percentage >= 80)
			return { status: "on-track", color: "text-yellow-400" }
		return { status: "needs-attention", color: "text-red-400" }
	}

	return (
		<Sidebar>
			<div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
				{/* Header */}
				<div className="mb-8">
					<div className="rounded-2xl border relative overflow-hidden group">
						<div
							className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
							style={{
								background:
									"linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
							}}
						/>
						<div className="relative p-8 bg-gradient-to-r from-transparent via-black/20 to-black/40">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div
										className="w-12 h-12 rounded-xl flex items-center justify-center"
										style={{ backgroundColor: "#4A5A70" }}
									>
										<BarChart3
											className="h-6 w-6"
											style={{ color: "#C3BCC2" }}
										/>
									</div>
									<div>
										<h1
											className="text-4xl font-bold mb-2"
											style={{ color: "#C3BCC2" }}
										>
											Analytics Dashboard
										</h1>
										<p
											className="flex items-center gap-2 text-lg"
											style={{ color: "#ABA4AA" }}
										>
											<Zap className="h-5 w-5 text-yellow-400" />
											Data-driven insights to optimize your coaching
										</p>
									</div>
								</div>
								<div className="flex items-center gap-4">
									<button
										onClick={() => setShowGoals(!showGoals)}
										className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
										style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = "#606364"
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = "#4A5A70"
										}}
									>
										<Goal className="h-4 w-4" />
										{showGoals ? "Hide Goals" : "Show Goals"}
									</button>
									<div className="text-right">
										<div
											className="text-2xl font-bold"
											style={{ color: "#C3BCC2" }}
										>
											{new Date().toLocaleDateString()}
										</div>
										<div className="text-sm" style={{ color: "#ABA4AA" }}>
											{new Date().toLocaleDateString("en-US", {
												weekday: "long",
											})}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Goals Section */}
				{showGoals && (
					<div className="mb-8">
						<div
							className="rounded-2xl shadow-xl border p-6"
							style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
						>
							<h3
								className="text-xl font-bold mb-4 flex items-center gap-2"
								style={{ color: "#C3BCC2" }}
							>
								<Target className="h-5 w-5" style={{ color: "#4A5A70" }} />
								Performance Goals
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{[
									{
										title: "Active Clients",
										current: analyticsData?.activeClients || 0,
										goal: goals.activeClients,
										icon: <Users className="h-5 w-5" />,
									},
									{
										title: "Average Progress",
										current: analyticsData?.averageProgress || 0,
										goal: goals.averageProgress,
										icon: <TrendingUp className="h-5 w-5" />,
									},
									{
										title: "Completion Rate",
										current: analyticsData?.completionRate || 0,
										goal: goals.completionRate,
										icon: <Trophy className="h-5 w-5" />,
									},
									{
										title: "Retention Rate",
										current: analyticsData?.retentionRate || 0,
										goal: goals.retentionRate,
										icon: <Star className="h-5 w-5" />,
									},
								].map((metric, index) => {
									const status = getGoalStatus(metric.current, metric.goal)
									return (
										<div
											key={index}
											className="p-4 rounded-lg"
											style={{ backgroundColor: "#2A2F2F" }}
										>
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<div style={{ color: "#4A5A70" }}>{metric.icon}</div>
													<span
														className="text-sm font-medium"
														style={{ color: "#ABA4AA" }}
													>
														{metric.title}
													</span>
												</div>
												<span
													className={`text-xs px-2 py-1 rounded-full ${status.color}`}
												>
													{status.status}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span
													className="text-lg font-bold"
													style={{ color: "#C3BCC2" }}
												>
													{metric.title.includes("Rate") ||
													metric.title.includes("Progress")
														? formatPercentage(metric.current)
														: metric.current}
												</span>
												<span className="text-sm" style={{ color: "#ABA4AA" }}>
													/{" "}
													{metric.title.includes("Rate") ||
													metric.title.includes("Progress")
														? formatPercentage(metric.goal)
														: metric.goal}
												</span>
											</div>
											<div
												className="w-full bg-gray-700 rounded-full h-2 mt-2"
												style={{ backgroundColor: "#606364" }}
											>
												<div
													className="h-2 rounded-full transition-all duration-300"
													style={{
														width: `${Math.min(
															(metric.current / metric.goal) * 100,
															100
														)}%`,
														background:
															status.status === "achieved"
																? "linear-gradient(to right, #10B981, #34D399)"
																: status.status === "on-track"
																? "linear-gradient(to right, #F59E0B, #FBBF24)"
																: "linear-gradient(to right, #EF4444, #F87171)",
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

				{/* Time Range Selector */}
				<div className="mb-6">
					<div
						className="flex space-x-1 p-1 rounded-xl border w-fit"
						style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
					>
						{[
							{ value: "7d", label: "7 Days" },
							{ value: "30d", label: "30 Days" },
							{ value: "90d", label: "90 Days" },
							{ value: "1y", label: "1 Year" },
						].map((range) => (
							<button
								key={range.value}
								onClick={() => setTimeRange(range.value as any)}
								className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
									timeRange === range.value ? "shadow-lg" : ""
								}`}
								style={{
									backgroundColor:
										timeRange === range.value ? "#4A5A70" : "transparent",
									color: timeRange === range.value ? "#FFFFFF" : "#ABA4AA",
								}}
								onMouseEnter={(e) => {
									if (timeRange !== range.value) {
										e.currentTarget.style.backgroundColor = "#3A4040"
										e.currentTarget.style.color = "#C3BCC2"
									}
								}}
								onMouseLeave={(e) => {
									if (timeRange !== range.value) {
										e.currentTarget.style.backgroundColor = "transparent"
										e.currentTarget.style.color = "#ABA4AA"
									}
								}}
							>
								{range.label}
							</button>
						))}
					</div>
				</div>

				{/* Key Metrics Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					{/* Active Clients */}
					<div
						className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
						style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
					>
						<div
							className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
							style={{
								background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
							}}
						/>
						<div className="relative p-6">
							<div className="flex items-center justify-between mb-4">
								<div
									className="w-12 h-12 rounded-xl flex items-center justify-center"
									style={{ backgroundColor: "#4A5A70" }}
								>
									<Users className="h-6 w-6" style={{ color: "#C3BCC2" }} />
								</div>
								{getTrendIcon(analyticsData?.activeClientsTrend || 0)}
							</div>
							<div>
								<p
									className="text-sm font-medium mb-1"
									style={{ color: "#ABA4AA" }}
								>
									Active Clients
								</p>
								<p
									className="text-3xl font-bold mb-1"
									style={{ color: "#C3BCC2" }}
								>
									{analyticsData?.activeClients || 0}
								</p>
								<p
									className={`text-xs flex items-center gap-1 ${getTrendColor(
										analyticsData?.activeClientsTrend || 0
									)}`}
								>
									{analyticsData?.activeClientsTrend || 0 > 0 ? "+" : ""}
									{analyticsData?.activeClientsTrend || 0}% from last period
								</p>
							</div>
						</div>
					</div>

					{/* Average Progress */}
					<div
						className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
						style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
					>
						<div
							className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
							style={{
								background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
							}}
						/>
						<div className="relative p-6">
							<div className="flex items-center justify-between mb-4">
								<div
									className="w-12 h-12 rounded-xl flex items-center justify-center"
									style={{ backgroundColor: "#10B981" }}
								>
									<TrendingUp
										className="h-6 w-6"
										style={{ color: "#C3BCC2" }}
									/>
								</div>
								{getTrendIcon(analyticsData?.averageProgressTrend || 0)}
							</div>
							<div>
								<p
									className="text-sm font-medium mb-1"
									style={{ color: "#ABA4AA" }}
								>
									Average Progress
								</p>
								<p
									className="text-3xl font-bold mb-1"
									style={{ color: "#C3BCC2" }}
								>
									{formatPercentage(analyticsData?.averageProgress || 0)}
								</p>
								<p
									className={`text-xs flex items-center gap-1 ${getTrendColor(
										analyticsData?.averageProgressTrend || 0
									)}`}
								>
									{analyticsData?.averageProgressTrend || 0 > 0 ? "+" : ""}
									{analyticsData?.averageProgressTrend || 0}% from last period
								</p>
							</div>
						</div>
					</div>

					{/* Program Completion Rate */}
					<div
						className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
						style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
					>
						<div
							className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
							style={{
								background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
							}}
						/>
						<div className="relative p-6">
							<div className="flex items-center justify-between mb-4">
								<div
									className="w-12 h-12 rounded-xl flex items-center justify-center"
									style={{ backgroundColor: "#F59E0B" }}
								>
									<Trophy className="h-6 w-6" style={{ color: "#C3BCC2" }} />
								</div>
								{getTrendIcon(analyticsData?.completionRateTrend || 0)}
							</div>
							<div>
								<p
									className="text-sm font-medium mb-1"
									style={{ color: "#ABA4AA" }}
								>
									Completion Rate
								</p>
								<p
									className="text-3xl font-bold mb-1"
									style={{ color: "#C3BCC2" }}
								>
									{formatPercentage(analyticsData?.completionRate || 0)}
								</p>
								<p
									className={`text-xs flex items-center gap-1 ${getTrendColor(
										analyticsData?.completionRateTrend || 0
									)}`}
								>
									{analyticsData?.completionRateTrend || 0 > 0 ? "+" : ""}
									{analyticsData?.completionRateTrend || 0}% from last period
								</p>
							</div>
						</div>
					</div>

					{/* Client Retention */}
					<div
						className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
						style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
					>
						<div
							className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
							style={{
								background: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
							}}
						/>
						<div className="relative p-6">
							<div className="flex items-center justify-between mb-4">
								<div
									className="w-12 h-12 rounded-xl flex items-center justify-center"
									style={{ backgroundColor: "#8B5CF6" }}
								>
									<Star className="h-6 w-6" style={{ color: "#C3BCC2" }} />
								</div>
								{getTrendIcon(analyticsData?.retentionRateTrend || 0)}
							</div>
							<div>
								<p
									className="text-sm font-medium mb-1"
									style={{ color: "#ABA4AA" }}
								>
									Client Retention
								</p>
								<p
									className="text-3xl font-bold mb-1"
									style={{ color: "#C3BCC2" }}
								>
									{formatPercentage(analyticsData?.retentionRate || 0)}
								</p>
								<p
									className={`text-xs flex items-center gap-1 ${getTrendColor(
										analyticsData?.retentionRateTrend || 0
									)}`}
								>
									{analyticsData?.retentionRateTrend || 0 > 0 ? "+" : ""}
									{analyticsData?.retentionRateTrend || 0}% from last period
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Detailed Analytics Sections */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Client Progress Chart */}
					<div
						className="rounded-2xl shadow-xl border p-6"
						style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
					>
						<h3
							className="text-xl font-bold mb-4 flex items-center gap-2"
							style={{ color: "#C3BCC2" }}
						>
							<Target className="h-5 w-5" style={{ color: "#4A5A70" }} />
							Client Progress Overview
						</h3>
						<div className="space-y-4">
							{clientProgress.slice(0, 5).map((client: any) => (
								<div
									key={client.id}
									className="flex items-center justify-between p-3 rounded-lg"
									style={{ backgroundColor: "#2A2F2F" }}
								>
									<div className="flex items-center gap-3">
										<div
											className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
											style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
										>
											{client.name.charAt(0).toUpperCase()}
										</div>
										<div>
											<p className="font-medium" style={{ color: "#C3BCC2" }}>
												{client.name}
											</p>
											<p className="text-sm" style={{ color: "#ABA4AA" }}>
												{client.programsCompleted} programs completed
											</p>
										</div>
									</div>
									<div className="text-right">
										<p
											className="font-bold text-lg"
											style={{ color: "#C3BCC2" }}
										>
											{formatPercentage(client.progress)}
										</p>
										<p
											className={`text-xs flex items-center gap-1 ${getTrendColor(
												client.trend
											)}`}
										>
											{getTrendIcon(client.trend)}
											{client.trend > 0 ? "+" : ""}
											{client.trend}%
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Program Performance */}
					<div
						className="rounded-2xl shadow-xl border p-6"
						style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
					>
						<h3
							className="text-xl font-bold mb-4 flex items-center gap-2"
							style={{ color: "#C3BCC2" }}
						>
							<Trophy className="h-5 w-5" style={{ color: "#4A5A70" }} />
							Program Performance
						</h3>
						<div className="space-y-4">
							{programPerformance.slice(0, 5).map((program: any) => (
								<div
									key={program.id}
									className="p-3 rounded-lg"
									style={{ backgroundColor: "#2A2F2F" }}
								>
									<div className="flex items-center justify-between mb-2">
										<p className="font-medium" style={{ color: "#C3BCC2" }}>
											{program.title}
										</p>
										<p
											className="text-sm font-bold"
											style={{ color: "#C3BCC2" }}
										>
											{formatPercentage(program.completionRate)}
										</p>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span style={{ color: "#ABA4AA" }}>
											{program.activeClients} active clients
										</span>
										<span style={{ color: "#ABA4AA" }}>
											{formatPercentage(program.averageProgress)} avg progress
										</span>
									</div>
									<div
										className="w-full bg-gray-700 rounded-full h-2 mt-2"
										style={{ backgroundColor: "#606364" }}
									>
										<div
											className="h-2 rounded-full transition-all duration-300"
											style={{
												width: `${program.completionRate}%`,
												background:
													"linear-gradient(to right, #4A5A70, #606364)",
											}}
										></div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Engagement Metrics */}
				<div className="mt-8">
					<div
						className="rounded-2xl shadow-xl border p-6"
						style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
					>
						<h3
							className="text-xl font-bold mb-6 flex items-center gap-2"
							style={{ color: "#C3BCC2" }}
						>
							<Activity className="h-5 w-5" style={{ color: "#4A5A70" }} />
							Engagement Metrics
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="text-center">
								<div
									className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
									style={{ backgroundColor: "#4A5A70" }}
								>
									<MessageCircle
										className="h-8 w-8"
										style={{ color: "#C3BCC2" }}
									/>
								</div>
								<p
									className="text-2xl font-bold mb-1"
									style={{ color: "#C3BCC2" }}
								>
									{engagementMetrics?.messageResponseRate || 0}%
								</p>
								<p className="text-sm" style={{ color: "#ABA4AA" }}>
									Message Response Rate
								</p>
							</div>
							<div className="text-center">
								<div
									className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
									style={{ backgroundColor: "#10B981" }}
								>
									<PlayCircle
										className="h-8 w-8"
										style={{ color: "#C3BCC2" }}
									/>
								</div>
								<p
									className="text-2xl font-bold mb-1"
									style={{ color: "#C3BCC2" }}
								>
									{engagementMetrics?.videoEngagement || 0}%
								</p>
								<p className="text-sm" style={{ color: "#ABA4AA" }}>
									Video Engagement
								</p>
							</div>
							<div className="text-center">
								<div
									className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
									style={{ backgroundColor: "#F59E0B" }}
								>
									<CheckCircle
										className="h-8 w-8"
										style={{ color: "#C3BCC2" }}
									/>
								</div>
								<p
									className="text-2xl font-bold mb-1"
									style={{ color: "#C3BCC2" }}
								>
									{engagementMetrics?.workoutCompletion || 0}%
								</p>
								<p className="text-sm" style={{ color: "#ABA4AA" }}>
									Workout Completion
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Sidebar>
	)
}
