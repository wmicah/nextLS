"use client"

import { useState } from "react"
import { trpc } from "@/app/_trpc/client"
import { useUIStore } from "@/lib/stores/uiStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
	Calendar,
	Users,
	Target,
	Clock,
	Mail,
	Phone,
	FileText,
	X,
	Edit,
	TrendingUp,
	Activity,
	BookOpen,
	Star,
} from "lucide-react"
import { format } from "date-fns"

interface ClientProfileModalProps {
	isOpen: boolean
	onClose: () => void
	clientId: string
	clientName: string
	clientEmail?: string | null
	clientPhone?: string | null
	clientNotes?: string | null
	clientAvatar?: string | null
}

interface Client {
	id: string
	name: string
	email: string | null
	phone: string | null
	notes: string | null
	avatar: string | null
	createdAt: string
	updatedAt: string
	nextLessonDate: string | null
	lastCompletedWorkout: string | null
	programAssignments?: {
		id: string
		programId: string
		assignedAt: string
		progress: number
		program: {
			id: string
			title: string
			status: string
			sport: string
			level: string
		}
	}[]
}

export default function ClientProfileModal({
	isOpen,
	onClose,
	clientId,
	clientName,
	clientEmail,
	clientPhone,
	clientNotes,
	clientAvatar,
}: ClientProfileModalProps) {
	console.log("ClientProfileModal rendered with props:", {
		isOpen,
		clientId,
		clientName,
	})

	const [isEditing, setIsEditing] = useState(false)
	const [editedNotes, setEditedNotes] = useState(clientNotes || "")
	const [isUpdating, setIsUpdating] = useState(false)

	const { addToast } = useUIStore()
	const utils = trpc.useUtils()

	// Get detailed client data
	const { data: client, isLoading } = trpc.clients.getById.useQuery(
		{ id: clientId },
		{ enabled: isOpen && !!clientId }
	)

	// Update client notes mutation
	const updateClientMutation = trpc.clients.update.useMutation({
		onSuccess: () => {
			setIsUpdating(false)
			setIsEditing(false)
			addToast({
				type: "success",
				title: "Profile updated",
				message: "Client profile has been updated successfully.",
			})
			utils.clients.list.invalidate()
			utils.clients.getById.invalidate({ id: clientId })
		},
		onError: (error) => {
			setIsUpdating(false)
			addToast({
				type: "error",
				title: "Update failed",
				message: error.message || "Failed to update client profile.",
			})
		},
	})

	const handleSaveNotes = () => {
		setIsUpdating(true)
		updateClientMutation.mutate({
			id: clientId,
			notes: editedNotes,
		})
	}

	const handleCancelEdit = () => {
		setIsEditing(false)
		setEditedNotes(clientNotes || "")
	}

	if (!isOpen) {
		console.log("Modal not open, returning null")
		return null
	}

	console.log("Modal is open, rendering content")

	return (
		<div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div
				className="rounded-2xl border max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl shadow-black/50"
				style={{
					backgroundColor: "#353A3A",
					borderColor: "#606364",
				}}
			>
				{/* Header - Fixed */}
				<div className="p-6 border-b" style={{ borderColor: "#606364" }}>
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-xl font-bold" style={{ color: "#C3BCC2" }}>
								Client Profile
							</h3>
							<p className="text-sm mt-1" style={{ color: "#ABA4AA" }}>
								Overview of {clientName}'s information and progress
							</p>
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setIsEditing(!isEditing)}
								className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer"
								style={{
									backgroundColor: "#4A5A70",
									color: "#FFFFFF",
								}}
							>
								<Edit className="h-4 w-4" />
								{isEditing ? "Cancel" : "Edit"}
							</button>
							<button
								onClick={onClose}
								className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
								style={{ color: "#ABA4AA" }}
								onMouseEnter={(e) => {
									e.currentTarget.style.color = "#C3BCC2"
									e.currentTarget.style.backgroundColor = "#3A4040"
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.color = "#ABA4AA"
									e.currentTarget.style.backgroundColor = "transparent"
								}}
							>
								<X className="h-5 w-5" />
							</button>
						</div>
					</div>
				</div>

				{/* Scrollable Content */}
				<ScrollArea className="h-[calc(95vh-120px)]">
					<div className="p-6">
						{isLoading ? (
							<div className="flex items-center justify-center h-64">
								<div
									className="animate-spin rounded-full h-8 w-8 border-2"
									style={{ borderColor: "#4A5A70", borderTopColor: "#C3BCC2" }}
								></div>
							</div>
						) : (
							<div className="space-y-6">
								{/* Client Info Card */}
								<div
									className="rounded-2xl shadow-xl border p-6"
									style={{
										backgroundColor: "#2A2F2F",
										borderColor: "#606364",
									}}
								>
									<div className="flex items-center gap-3 mb-4">
										<div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
											<span
												className="text-white font-bold text-xl rounded-full w-full h-full flex items-center justify-center"
												style={{ backgroundColor: "#4A5A70" }}
											>
												{clientName.charAt(0).toUpperCase()}
											</span>
										</div>
										<div>
											<h2
												className="text-2xl font-bold"
												style={{ color: "#C3BCC2" }}
											>
												{clientName}
											</h2>
											<div className="flex items-center gap-4 text-sm mt-1">
												{clientEmail && (
													<div
														className="flex items-center gap-1"
														style={{ color: "#ABA4AA" }}
													>
														<Mail className="h-3 w-3" />
														{clientEmail}
													</div>
												)}
												{clientPhone && (
													<div
														className="flex items-center gap-1"
														style={{ color: "#ABA4AA" }}
													>
														<Phone className="h-3 w-3" />
														{clientPhone}
													</div>
												)}
											</div>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div
											className="flex items-center gap-3 p-3 rounded-lg"
											style={{ backgroundColor: "#353A3A" }}
										>
											<Calendar
												className="h-5 w-5"
												style={{ color: "#4A5A70" }}
											/>
											<div>
												<p className="text-sm" style={{ color: "#ABA4AA" }}>
													Member Since
												</p>
												<p className="font-medium" style={{ color: "#C3BCC2" }}>
													{client?.createdAt
														? format(new Date(client.createdAt), "MMM dd, yyyy")
														: "N/A"}
												</p>
											</div>
										</div>
										<div
											className="flex items-center gap-3 p-3 rounded-lg"
											style={{ backgroundColor: "#353A3A" }}
										>
											<Clock className="h-5 w-5" style={{ color: "#10B981" }} />
											<div>
												<p className="text-sm" style={{ color: "#ABA4AA" }}>
													Next Lesson
												</p>
												<p className="font-medium" style={{ color: "#C3BCC2" }}>
													{client?.nextLessonDate
														? format(
																new Date(client.nextLessonDate),
																"MMM dd, yyyy"
														  )
														: "No upcoming lessons"}
												</p>
											</div>
										</div>
										<div
											className="flex items-center gap-3 p-3 rounded-lg"
											style={{ backgroundColor: "#353A3A" }}
										>
											<Activity
												className="h-5 w-5"
												style={{ color: "#8B5CF6" }}
											/>
											<div>
												<p className="text-sm" style={{ color: "#ABA4AA" }}>
													Last Activity
												</p>
												<p className="font-medium" style={{ color: "#C3BCC2" }}>
													{client?.lastCompletedWorkout
														? format(
																new Date(client.lastCompletedWorkout),
																"MMM dd, yyyy"
														  )
														: "No recent activity"}
												</p>
											</div>
										</div>
									</div>
								</div>

								{/* Notes Section */}
								<div
									className="rounded-2xl shadow-xl border p-6"
									style={{
										backgroundColor: "#2A2F2F",
										borderColor: "#606364",
									}}
								>
									<div className="flex items-center gap-2 mb-4">
										<FileText
											className="h-5 w-5"
											style={{ color: "#C3BCC2" }}
										/>
										<h3 className="font-bold" style={{ color: "#C3BCC2" }}>
											Notes & Description
										</h3>
									</div>
									<div>
										{isEditing ? (
											<div className="space-y-4">
												<Label
													className="text-sm font-medium"
													style={{ color: "#C3BCC2" }}
												>
													Client Notes
												</Label>
												<textarea
													value={editedNotes}
													onChange={(e) => setEditedNotes(e.target.value)}
													rows={4}
													className="w-full p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
													style={{
														backgroundColor: "#353A3A",
														borderColor: "#606364",
														color: "#C3BCC2",
													}}
													placeholder="Add notes about this client..."
												/>
												<div className="flex gap-3">
													<button
														onClick={handleSaveNotes}
														disabled={isUpdating}
														className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
														style={{
															backgroundColor: "#4A5A70",
															color: "#FFFFFF",
														}}
													>
														{isUpdating ? "Saving..." : "Save Notes"}
													</button>
													<button
														onClick={handleCancelEdit}
														className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
														style={{
															backgroundColor: "#353A3A",
															color: "#C3BCC2",
															borderColor: "#606364",
														}}
													>
														Cancel
													</button>
												</div>
											</div>
										) : (
											<div>
												{client?.notes ? (
													<p
														className="whitespace-pre-wrap"
														style={{ color: "#ABA4AA" }}
													>
														{client.notes}
													</p>
												) : (
													<p className="italic" style={{ color: "#ABA4AA" }}>
														No notes available
													</p>
												)}
											</div>
										)}
									</div>
								</div>

								{/* Assigned Programs Section */}
								<div
									className="rounded-2xl shadow-xl border p-6"
									style={{
										backgroundColor: "#2A2F2F",
										borderColor: "#606364",
									}}
								>
									<div className="flex items-center gap-2 mb-4">
										<BookOpen
											className="h-5 w-5"
											style={{ color: "#C3BCC2" }}
										/>
										<h3 className="font-bold" style={{ color: "#C3BCC2" }}>
											Assigned Programs (
											{client?.programAssignments?.length || 0})
										</h3>
									</div>
									<div>
										{client?.programAssignments &&
										client.programAssignments.length > 0 ? (
											<div className="space-y-4">
												{client.programAssignments.map((assignment) => (
													<div
														key={assignment.id}
														className="p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02]"
														style={{
															backgroundColor: "#353A3A",
															borderColor: "#606364",
														}}
													>
														<div className="flex items-start justify-between mb-3">
															<div>
																<h4
																	className="font-medium mb-1"
																	style={{ color: "#C3BCC2" }}
																>
																	{assignment.program.title}
																</h4>
																<div className="flex items-center gap-2">
																	<span
																		className="px-2 py-1 rounded-full text-xs font-medium"
																		style={{
																			backgroundColor: "#4A5A70",
																			color: "#C3BCC2",
																		}}
																	>
																		{assignment.program.sport}
																	</span>
																	<span
																		className="px-2 py-1 rounded-full text-xs font-medium"
																		style={{
																			backgroundColor: "#10B981",
																			color: "#FFFFFF",
																		}}
																	>
																		{assignment.program.level}
																	</span>
																	<span
																		className="px-2 py-1 rounded-full text-xs font-medium"
																		style={{
																			backgroundColor: "#8B5CF6",
																			color: "#FFFFFF",
																		}}
																	>
																		{assignment.program.status}
																	</span>
																</div>
															</div>
															<div className="text-right">
																<div
																	className="text-sm"
																	style={{ color: "#ABA4AA" }}
																>
																	Assigned{" "}
																	{format(
																		new Date(assignment.assignedAt),
																		"MMM dd, yyyy"
																	)}
																</div>
															</div>
														</div>
														<div>
															<div className="flex items-center justify-between mb-2">
																<span
																	className="text-sm"
																	style={{ color: "#ABA4AA" }}
																>
																	Progress
																</span>
																<span
																	className="font-medium"
																	style={{ color: "#C3BCC2" }}
																>
																	{assignment.progress}%
																</span>
															</div>
															<div
																className="w-full rounded-full h-2"
																style={{ backgroundColor: "#2A2F2F" }}
															>
																<div
																	className="h-2 rounded-full transition-all duration-300"
																	style={{
																		backgroundColor: "#4A5A70",
																		width: `${assignment.progress}%`,
																	}}
																></div>
															</div>
														</div>
													</div>
												))}
											</div>
										) : (
											<div className="text-center py-8">
												<BookOpen
													className="h-12 w-12 mx-auto mb-3"
													style={{ color: "#ABA4AA" }}
												/>
												<p style={{ color: "#ABA4AA" }}>
													No programs assigned to this client
												</p>
											</div>
										)}
									</div>
								</div>

								{/* Recent Activity Section */}
								<div
									className="rounded-2xl shadow-xl border p-6"
									style={{
										backgroundColor: "#2A2F2F",
										borderColor: "#606364",
									}}
								>
									<div className="flex items-center gap-2 mb-4">
										<TrendingUp
											className="h-5 w-5"
											style={{ color: "#C3BCC2" }}
										/>
										<h3 className="font-bold" style={{ color: "#C3BCC2" }}>
											Recent Activity
										</h3>
									</div>
									<div className="space-y-3">
										{client?.lastCompletedWorkout ? (
											<div
												className="flex items-center gap-3 p-3 rounded-lg"
												style={{ backgroundColor: "#353A3A" }}
											>
												<Target
													className="h-5 w-5"
													style={{ color: "#10B981" }}
												/>
												<div>
													<p
														className="font-medium"
														style={{ color: "#C3BCC2" }}
													>
														Last Completed Workout
													</p>
													<p className="text-sm" style={{ color: "#ABA4AA" }}>
														{format(
															new Date(client.lastCompletedWorkout),
															"MMM dd, yyyy 'at' h:mm a"
														)}
													</p>
												</div>
											</div>
										) : (
											<div
												className="flex items-center gap-3 p-3 rounded-lg"
												style={{ backgroundColor: "#353A3A" }}
											>
												<Clock
													className="h-5 w-5"
													style={{ color: "#ABA4AA" }}
												/>
												<div>
													<p
														className="font-medium"
														style={{ color: "#C3BCC2" }}
													>
														No Recent Activity
													</p>
													<p className="text-sm" style={{ color: "#ABA4AA" }}>
														This client hasn't completed any workouts yet
													</p>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	)
}
