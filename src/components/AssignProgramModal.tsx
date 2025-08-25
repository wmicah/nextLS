"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/app/_trpc/client"
import { useUIStore } from "@/lib/stores/uiStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Target, Clock, CheckCircle, X } from "lucide-react"
import { format } from "date-fns"

interface AssignProgramModalProps {
	isOpen: boolean
	onClose: () => void
	programId?: string
	programTitle?: string
	clientId?: string
	clientName?: string
}

interface Client {
	id: string
	name: string
	email: string | null
	avatar: string | null
	programAssignments?: {
		id: string
		programId: string
		progress: number
		program: {
			id: string
			title: string
		}
	}[]
}

interface Program {
	id: string
	title: string
	description: string | null
	sport: string
	level: string
	duration: number
	status: string
	assignments?: {
		id: string
		clientId: string
		progress: number
		client: {
			id: string
			name: string
			email: string | null
		}
	}[]
}

export default function AssignProgramModal({
	isOpen,
	onClose,
	programId,
	programTitle,
	clientId,
	clientName,
}: AssignProgramModalProps) {
	const [selectedProgram, setSelectedProgram] = useState<string>(
		programId || ""
	)

	// Update selectedProgram when programId prop changes
	useEffect(() => {
		if (programId) {
			setSelectedProgram(programId)
		}
	}, [programId])
	const [selectedClients, setSelectedClients] = useState<string[]>(
		clientId ? [clientId] : []
	)
	const [startDate, setStartDate] = useState<string>("")
	const [isAssigning, setIsAssigning] = useState(false)
	const [viewMode, setViewMode] = useState<"assign" | "manage">("assign")

	const { addToast } = useUIStore()
	const utils = trpc.useUtils()

	// Get all programs
	const { data: programs = [], isLoading: programsLoading } =
		trpc.programs.list.useQuery()

	// Get all active clients (exclude archived)
	const { data: clients = [], isLoading: clientsLoading } =
		trpc.clients.list.useQuery({ archived: false })

	// Get selected program details
	const { data: selectedProgramData } = trpc.programs.getById.useQuery(
		{ id: selectedProgram },
		{ enabled: !!selectedProgram }
	)

	// Get program assignments if in manage mode
	const { data: programAssignments = [] } =
		trpc.programs.getProgramAssignments.useQuery(
			{ programId: selectedProgram },
			{ enabled: !!selectedProgram && viewMode === "manage" }
		)

	const assignProgramMutation = trpc.programs.assignToClients.useMutation({
		onSuccess: () => {
			setIsAssigning(false)
			addToast({
				type: "success",
				title: "Program assigned",
				message: `Program has been assigned to ${selectedClients.length} client(s) successfully.`,
			})
			onClose()
			setSelectedProgram("")
			setSelectedClients([])
			setStartDate("")

			// Invalidate and refetch data
			utils.clients.list.invalidate()
			utils.programs.list.invalidate()
			if (selectedProgram) {
				utils.programs.getProgramAssignments.invalidate({
					programId: selectedProgram,
				})
			}
		},
		onError: (error) => {
			setIsAssigning(false)
			addToast({
				type: "error",
				title: "Assignment failed",
				message: error.message || "Failed to assign program to clients.",
			})
		},
	})

	const unassignProgramMutation = trpc.programs.unassignFromClients.useMutation(
		{
			onSuccess: (data) => {
				addToast({
					type: "success",
					title: "Program unassigned",
					message: `Program has been unassigned from ${data.deletedCount} client(s).`,
				})

				// Invalidate and refetch data
				utils.clients.list.invalidate()
				utils.programs.list.invalidate()
				if (selectedProgram) {
					utils.programs.getProgramAssignments.invalidate({
						programId: selectedProgram,
					})
				}
			},
			onError: (error) => {
				addToast({
					type: "error",
					title: "Unassignment failed",
					message: error.message || "Failed to unassign program from clients.",
				})
			},
		}
	)

	const handleAssign = async () => {
		if (!selectedProgram) {
			addToast({
				type: "error",
				title: "No program selected",
				message: "Please select a program to assign.",
			})
			return
		}

		if (selectedClients.length === 0) {
			addToast({
				type: "error",
				title: "No clients selected",
				message: "Please select at least one client to assign the program to.",
			})
			return
		}

		const requestData = {
			programId: selectedProgram,
			clientIds: selectedClients,
			startDate: startDate ? startDate + "T00:00:00.000Z" : undefined,
		}

		console.log("Sending assignment request:", requestData)
		console.log("startDate type:", typeof requestData.startDate)
		console.log("startDate value:", requestData.startDate)

		setIsAssigning(true)
		assignProgramMutation.mutate(requestData)
	}

	const handleUnassign = (clientIds: string[]) => {
		if (!selectedProgram) return

		if (
			confirm(
				`Are you sure you want to unassign this program from ${clientIds.length} client(s)?`
			)
		) {
			unassignProgramMutation.mutate({
				programId: selectedProgram,
				clientIds,
			})
		}
	}

	const toggleClientSelection = (clientId: string) => {
		setSelectedClients((prev) =>
			prev.includes(clientId)
				? prev.filter((id) => id !== clientId)
				: [...prev, clientId]
		)
	}

	const toggleAllClients = () => {
		if (selectedClients.length === clients.length) {
			setSelectedClients([])
		} else {
			setSelectedClients(clients.map((client) => client.id))
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
			<div className="bg-gray-800 rounded-xl border border-gray-600 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
				<div className="p-6">
					{/* Header */}
					<div className="flex items-center justify-between mb-6">
						<div>
							<h3 className="text-xl font-bold text-white">
								{viewMode === "assign"
									? "Assign Program"
									: "Manage Assignments"}
							</h3>
							<p className="text-gray-400 text-sm mt-1">
								{viewMode === "assign"
									? "Select a program and clients to assign"
									: "View and manage program assignments"}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setViewMode(viewMode === "assign" ? "manage" : "assign")
								}
								className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
							>
								{viewMode === "assign" ? "Manage" : "Assign"}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={onClose}
								className="text-gray-400 hover:text-white"
							>
								<X className="h-5 w-5" />
							</Button>
						</div>
					</div>

					{/* Program Selection */}
					<div className="mb-6">
						<Label className="text-white text-sm font-medium mb-2 block">
							Select Program
						</Label>
						<select
							value={selectedProgram}
							onChange={(e) => setSelectedProgram(e.target.value)}
							className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Choose a program...</option>
							{programs.map((program) => (
								<option key={program.id} value={program.id}>
									{program.title} ({program.activeClientCount} active clients)
								</option>
							))}
						</select>
					</div>

					{/* Selected Program Details */}
					{selectedProgramData && (
						<Card className="bg-gray-700 border-gray-600 mb-6">
							<CardContent className="p-4">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h4 className="text-lg font-semibold text-white mb-2">
											{selectedProgramData.title}
										</h4>
										{selectedProgramData.description && (
											<p className="text-gray-300 text-sm mb-3">
												{selectedProgramData.description}
											</p>
										)}
										<div className="flex items-center gap-4 text-sm">
											<Badge
												variant="secondary"
												className="bg-blue-500/20 text-blue-300"
											>
												{selectedProgramData.sport}
											</Badge>
											<Badge
												variant="secondary"
												className="bg-green-500/20 text-green-300"
											>
												{selectedProgramData.level}
											</Badge>
											<Badge
												variant="secondary"
												className="bg-purple-500/20 text-purple-300"
											>
												{selectedProgramData.duration} weeks
											</Badge>
										</div>
									</div>
									<div className="text-right">
										<div className="flex items-center gap-2 text-sm text-gray-400">
											<Users className="h-4 w-4" />
											<span>{selectedProgramData.duration} weeks</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{viewMode === "assign" ? (
						/* Assignment Mode */
						<div className="space-y-6">
							{/* Start Date */}
							<div>
								<Label className="text-white text-sm font-medium mb-2 block">
									Start Date (Optional)
								</Label>
								<Input
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="bg-gray-700 border-gray-600 text-white"
								/>
							</div>

							{/* Client Selection */}
							<div>
								<div className="flex items-center justify-between mb-4">
									<Label className="text-white text-sm font-medium">
										Select Clients ({selectedClients.length} selected)
									</Label>
									<Button
										variant="outline"
										size="sm"
										onClick={toggleAllClients}
										className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
									>
										{selectedClients.length === clients.length
											? "Deselect All"
											: "Select All"}
									</Button>
								</div>

								<ScrollArea className="h-64 border border-gray-600 rounded-lg">
									<div className="p-4 space-y-2">
										{clients.map((client: Client) => {
											const isSelected = selectedClients.includes(client.id)
											const hasCurrentProgram = client.programAssignments?.some(
												(assignment) => assignment.programId === selectedProgram
											)

											return (
												<div
													key={client.id}
													className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
														isSelected
															? "bg-blue-500/20 border-blue-500/50"
															: "bg-gray-700/50 border-gray-600 hover:bg-gray-700"
													}`}
													onClick={() => toggleClientSelection(client.id)}
												>
													<Checkbox
														checked={isSelected}
														onChange={() => toggleClientSelection(client.id)}
														className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
													/>
													<Avatar className="h-10 w-10">
														<AvatarImage src={client.avatar || undefined} />
														<AvatarFallback className="bg-blue-600 text-white">
															{client.name.charAt(0).toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2">
															<h4 className="text-white font-medium truncate">
																{client.name}
															</h4>
															{hasCurrentProgram && (
																<Badge
																	variant="secondary"
																	className="bg-orange-500/20 text-orange-300 text-xs"
																>
																	Already Assigned
																</Badge>
															)}
														</div>
														{client.email && (
															<p className="text-gray-400 text-sm truncate">
																{client.email}
															</p>
														)}
													</div>
													{client.programAssignments &&
														client.programAssignments.length > 0 && (
															<div className="text-right">
																<div className="text-xs text-gray-400">
																	{client.programAssignments.length} program(s)
																</div>
															</div>
														)}
												</div>
											)
										})}
									</div>
								</ScrollArea>
							</div>

							{/* Action Buttons */}
							<div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-600">
								<Button
									variant="outline"
									onClick={onClose}
									className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
								>
									Cancel
								</Button>
								<Button
									onClick={handleAssign}
									disabled={
										isAssigning ||
										!selectedProgram ||
										selectedClients.length === 0
									}
									className="bg-blue-600 hover:bg-blue-700 text-white"
								>
									{isAssigning
										? "Assigning..."
										: `Assign to ${selectedClients.length} Client(s)`}
								</Button>
							</div>
						</div>
					) : (
						/* Management Mode */
						<div className="space-y-6">
							{/* Assignment List */}
							<div>
								<Label className="text-white text-sm font-medium mb-4 block">
									Current Assignments ({programAssignments.length})
								</Label>

								<ScrollArea className="h-64 border border-gray-600 rounded-lg">
									<div className="p-4 space-y-3">
										{programAssignments.length === 0 ? (
											<div className="text-center py-8">
												<Users className="h-12 w-12 text-gray-500 mx-auto mb-3" />
												<p className="text-gray-400">
													No clients assigned to this program
												</p>
											</div>
										) : (
											programAssignments.map((assignment) => (
												<Card
													key={assignment.id}
													className="bg-gray-700 border-gray-600"
												>
													<CardContent className="p-4">
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-3">
																<Avatar className="h-10 w-10">
																	<AvatarImage
																		src={assignment.client.avatar || undefined}
																	/>
																	<AvatarFallback className="bg-blue-600 text-white">
																		{assignment.client.name
																			.charAt(0)
																			.toUpperCase()}
																	</AvatarFallback>
																</Avatar>
																<div>
																	<h4 className="text-white font-medium">
																		{assignment.client.name}
																	</h4>
																	{assignment.client.email && (
																		<p className="text-gray-400 text-sm">
																			{assignment.client.email}
																		</p>
																	)}
																	<div className="flex items-center gap-2 mt-1">
																		<Calendar className="h-3 w-3 text-gray-400" />
																		<span className="text-xs text-gray-400">
																			Assigned{" "}
																			{format(
																				new Date(assignment.assignedAt),
																				"MMM dd, yyyy"
																			)}
																		</span>
																	</div>
																</div>
															</div>
															<div className="flex items-center gap-4">
																<div className="text-right">
																	<div className="flex items-center gap-2">
																		<Target className="h-4 w-4 text-green-400" />
																		<span className="text-white font-medium">
																			{assignment.progress}%
																		</span>
																	</div>
																	<div className="w-24 bg-gray-600 rounded-full h-2 mt-1">
																		<div
																			className="bg-green-500 h-2 rounded-full transition-all duration-300"
																			style={{
																				width: `${assignment.progress}%`,
																			}}
																		/>
																	</div>
																</div>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() =>
																		handleUnassign([assignment.clientId])
																	}
																	className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
																>
																	<X className="h-4 w-4" />
																</Button>
															</div>
														</div>
													</CardContent>
												</Card>
											))
										)}
									</div>
								</ScrollArea>
							</div>

							{/* Bulk Actions */}
							{programAssignments.length > 0 && (
								<div className="flex items-center justify-between pt-4 border-t border-gray-600">
									<Button
										variant="outline"
										onClick={() =>
											handleUnassign(programAssignments.map((a) => a.clientId))
										}
										className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
									>
										Unassign All
									</Button>
									<Button
										onClick={onClose}
										className="bg-gray-600 hover:bg-gray-700 text-white"
									>
										Close
									</Button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
