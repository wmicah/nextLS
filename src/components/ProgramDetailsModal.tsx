"use client"

import { format } from "date-fns"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card"
import { Progress } from "./ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import {
	Calendar,
	Users,
	TrendingUp,
	Clock,
	Play,
	CheckCircle,
	BookOpen,
	Target,
	Award,
} from "lucide-react"

interface Program {
	id: string
	title: string
	description: string | null
	sport: string
	level: string
	status: "DRAFT" | "ACTIVE" | "ARCHIVED"
	duration: number
	coachId: string
	completionRate: number
	totalAssignments: number
	createdAt: string
	updatedAt: string
	weeks: ProgramWeek[]
	assignments: ProgramAssignment[]
}

interface ProgramWeek {
	id: string
	weekNumber: number
	title: string
	description: string | null
	days: ProgramDay[]
}

interface ProgramDay {
	id: string
	dayNumber: number
	title: string
	description: string | null
	drills: ProgramDrill[]
}

interface ProgramDrill {
	id: string
	order: number
	title: string
	description: string | null
	duration: string | null
	videoUrl: string | null
	notes: string | null
}

interface ProgramAssignment {
	id: string
	programId: string
	clientId: string
	assignedAt: string
	startDate: string | null
	completedAt: string | null
	progress: number
	client: {
		id: string
		name: string
		email: string | null
		avatar: string | null
	}
}

interface ProgramDetailsModalProps {
	isOpen: boolean
	onClose: () => void
	program: Program | null
}

export default function ProgramDetailsModal({
	isOpen,
	onClose,
	program,
}: ProgramDetailsModalProps) {
	if (!program) return null

	const getStatusColor = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "bg-green-500/10 text-green-600 border-green-500/20"
			case "DRAFT":
				return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
			case "ARCHIVED":
				return "bg-gray-500/10 text-gray-600 border-gray-500/20"
			default:
				return "bg-gray-500/10 text-gray-600 border-gray-500/20"
		}
	}

	const getLevelColor = (level: string) => {
		switch (level) {
			case "Beginner":
				return "bg-blue-500/10 text-blue-600 border-blue-500/20"
			case "Intermediate":
				return "bg-orange-500/10 text-orange-600 border-orange-500/20"
			case "Advanced":
				return "bg-red-500/10 text-red-600 border-red-500/20"
			default:
				return "bg-gray-500/10 text-gray-600 border-gray-500/20"
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] bg-[#2A3133] border-gray-600">
				<DialogHeader>
					<DialogTitle className="text-white text-2xl">
						{program.title}
					</DialogTitle>
					<DialogDescription className="text-gray-400">
						{program.description || "No description provided"}
					</DialogDescription>
				</DialogHeader>

				<div className="mt-6">
					<Tabs defaultValue="overview" className="w-full">
						<TabsList className="grid w-full grid-cols-4 bg-[#3A4245] border-gray-600">
							<TabsTrigger
								value="overview"
								className="text-white data-[state=active]:bg-[#4A5A70]"
							>
								Overview
							</TabsTrigger>
							<TabsTrigger
								value="structure"
								className="text-white data-[state=active]:bg-[#4A5A70]"
							>
								Structure
							</TabsTrigger>
							<TabsTrigger
								value="assignments"
								className="text-white data-[state=active]:bg-[#4A5A70]"
							>
								Assignments
							</TabsTrigger>
							<TabsTrigger
								value="analytics"
								className="text-white data-[state=active]:bg-[#4A5A70]"
							>
								Analytics
							</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="space-y-6 mt-6">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<Card className="bg-[#3A4245] border-gray-600">
									<CardHeader className="pb-3">
										<CardTitle className="text-white text-lg flex items-center gap-2">
											<Calendar className="h-5 w-5" />
											Duration
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-3xl font-bold text-white">
											{program.duration}
										</p>
										<p className="text-gray-400 text-sm">Weeks</p>
									</CardContent>
								</Card>

								<Card className="bg-[#3A4245] border-gray-600">
									<CardHeader className="pb-3">
										<CardTitle className="text-white text-lg flex items-center gap-2">
											<Users className="h-5 w-5" />
											Assignments
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-3xl font-bold text-white">
											{program.totalAssignments}
										</p>
										<p className="text-gray-400 text-sm">Active Clients</p>
									</CardContent>
								</Card>

								<Card className="bg-[#3A4245] border-gray-600">
									<CardHeader className="pb-3">
										<CardTitle className="text-white text-lg flex items-center gap-2">
											<TrendingUp className="h-5 w-5" />
											Completion
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-3xl font-bold text-white">
											{program.completionRate}%
										</p>
										<p className="text-gray-400 text-sm">Average Progress</p>
									</CardContent>
								</Card>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Card className="bg-[#3A4245] border-gray-600">
									<CardHeader>
										<CardTitle className="text-white">
											Program Details
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="flex items-center justify-between">
											<span className="text-gray-400">Sport:</span>
											<Badge
												variant="outline"
												className="text-white border-gray-600"
											>
												{program.sport}
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-gray-400">Level:</span>
											<Badge
												variant="outline"
												className={getLevelColor(program.level)}
											>
												{program.level}
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-gray-400">Status:</span>
											<Badge
												variant="outline"
												className={getStatusColor(program.status)}
											>
												{program.status}
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-gray-400">Created:</span>
											<span className="text-white">
												{format(new Date(program.createdAt), "MMM dd, yyyy")}
											</span>
										</div>
									</CardContent>
								</Card>

								<Card className="bg-[#3A4245] border-gray-600">
									<CardHeader>
										<CardTitle className="text-white">
											Program Structure
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="flex items-center justify-between">
											<span className="text-gray-400">Total Weeks:</span>
											<span className="text-white font-medium">
												{program.weeks?.length || 0}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-gray-400">Total Days:</span>
											<span className="text-white font-medium">
												{program.weeks?.reduce(
													(acc, week) => acc + (week.days?.length || 0),
													0
												) || 0}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-gray-400">Total Drills:</span>
											<span className="text-white font-medium">
												{program.weeks?.reduce(
													(acc, week) =>
														acc +
														(week.days?.reduce(
															(dayAcc, day) =>
																dayAcc + (day.drills?.length || 0),
															0
														) || 0),
													0
												) || 0}
											</span>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value="structure" className="space-y-6 mt-6">
							<ScrollArea className="h-96">
								<div className="space-y-4">
									{program.weeks?.map((week) => (
										<Card
											key={week.id}
											className="bg-[#3A4245] border-gray-600"
										>
											<CardHeader>
												<CardTitle className="text-white flex items-center gap-2">
													<BookOpen className="h-5 w-5" />
													{week.title}
												</CardTitle>
												{week.description && (
													<CardDescription className="text-gray-400">
														{week.description}
													</CardDescription>
												)}
											</CardHeader>
											<CardContent>
												<div className="space-y-3">
													{week.days?.map((day) => (
														<div
															key={day.id}
															className="border-l-2 border-gray-600 pl-4"
														>
															<div className="flex items-center gap-2 mb-2">
																<Target className="h-4 w-4 text-gray-400" />
																<h4 className="text-white font-medium">
																	{day.title}
																</h4>
															</div>
															{day.description && (
																<p className="text-gray-400 text-sm mb-2">
																	{day.description}
																</p>
															)}
															<div className="space-y-2">
																{day.drills?.map((drill) => (
																	<div
																		key={drill.id}
																		className="flex items-center gap-3 p-2 bg-[#2A3133] rounded"
																	>
																		<div className="flex items-center gap-2 flex-1">
																			<Play className="h-3 w-3 text-gray-400" />
																			<span className="text-white text-sm">
																				{drill.title}
																			</span>
																		</div>
																		{drill.duration && (
																			<span className="text-gray-400 text-xs">
																				{drill.duration}
																			</span>
																		)}
																	</div>
																))}
															</div>
														</div>
													))}
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</ScrollArea>
						</TabsContent>

						<TabsContent value="assignments" className="space-y-6 mt-6">
							<ScrollArea className="h-96">
								<div className="space-y-4">
									{program.assignments?.map((assignment) => (
										<Card
											key={assignment.id}
											className="bg-[#3A4245] border-gray-600"
										>
											<CardContent className="p-4">
												<div className="flex items-center space-x-3">
													<Avatar className="h-10 w-10">
														<AvatarImage
															src={assignment.client.avatar || undefined}
														/>
														<AvatarFallback className="bg-blue-600 text-white">
															{assignment.client.name.charAt(0).toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<div className="flex-1">
														<h4 className="text-white font-medium">
															{assignment.client.name}
														</h4>
														{assignment.client.email && (
															<p className="text-gray-400 text-sm">
																{assignment.client.email}
															</p>
														)}
													</div>
													<div className="text-right">
														<div className="flex items-center space-x-2">
															<CheckCircle className="h-4 w-4 text-green-400" />
															<span className="text-white font-medium">
																{assignment.progress}%
															</span>
														</div>
														<Progress
															value={assignment.progress}
															className="w-20 h-2 mt-1"
														/>
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</ScrollArea>
						</TabsContent>

						<TabsContent value="analytics" className="space-y-6 mt-6">
							<Card className="bg-[#3A4245] border-gray-600">
								<CardHeader>
									<CardTitle className="text-white">
										Completion Analytics
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div>
											<div className="flex items-center justify-between text-sm mb-2">
												<span className="text-gray-400">Overall Progress</span>
												<span className="text-white">
													{program.completionRate}%
												</span>
											</div>
											<Progress
												value={program.completionRate}
												className="h-3"
											/>
										</div>
										<Separator className="bg-gray-600" />
										<div className="grid grid-cols-2 gap-4 text-sm">
											<div>
												<span className="text-gray-400">
													Active Assignments:
												</span>
												<p className="text-white font-medium">
													{program.totalAssignments}
												</p>
											</div>
											<div>
												<span className="text-gray-400">Total Weeks:</span>
												<p className="text-white font-medium">
													{program.duration}
												</p>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</DialogContent>
		</Dialog>
	)
}
