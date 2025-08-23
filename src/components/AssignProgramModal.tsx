"use client"

import { useState } from "react"
import { trpc } from "@/app/_trpc/client"
import { X, Check, Clock, Users } from "lucide-react"

interface AssignProgramModalProps {
	isOpen: boolean
	onClose: () => void
	clientId: string
	clientName: string
}

export default function AssignProgramModal({
	isOpen,
	onClose,
	clientId,
	clientName,
}: AssignProgramModalProps) {
	const [selectedProgram, setSelectedProgram] = useState<string>("")
	const [isAssigning, setIsAssigning] = useState(false)

	const { data: programs = [], isLoading: programsLoading } =
		trpc.programs.list.useQuery({})

	// Debug: Log programs data
	console.log("Available programs:", programs)
	const utils = trpc.useUtils()
	const assignProgramMutation = trpc.programs.assignToClients.useMutation({
		onSuccess: () => {
			setIsAssigning(false)
			onClose()
			setSelectedProgram("")

			// Invalidate and refetch client data to show updated assignments
			utils.clients.getById.invalidate({ id: clientId })
			utils.clients.getAssignedPrograms.invalidate({ clientId })
			utils.workouts.getClientWorkouts.invalidate({ clientId })
			utils.library.getClientAssignedVideos.invalidate({ clientId })
		},
		onError: (error) => {
			setIsAssigning(false)
			alert(`Error assigning program: ${error.message}`)
		},
	})

	const handleAssign = async () => {
		if (!selectedProgram) {
			alert("Please select a program")
			return
		}

		console.log("Assigning program:", selectedProgram, "to client:", clientId)
		setIsAssigning(true)
		assignProgramMutation.mutate({
			programId: selectedProgram,
			clientIds: [clientId],
		})
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div
				className="rounded-2xl shadow-xl border p-6 w-full max-w-md mx-4"
				style={{
					backgroundColor: "#353A3A",
					borderColor: "#606364",
				}}
			>
				{/* Header */}
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-bold text-white">Assign Program</h2>
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
					<p className="text-sm text-gray-300">Assigning to:</p>
					<p className="text-white font-medium">{clientName}</p>
				</div>

				{/* Program Selection */}
				<div className="mb-6">
					<label className="block text-sm font-medium text-white mb-2">
						Select Program
					</label>
					{programsLoading ? (
						<div
							className="w-full p-3 rounded-lg border text-center"
							style={{
								backgroundColor: "#2A2F2F",
								borderColor: "#606364",
								color: "#FFFFFF",
							}}
						>
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
							<span className="ml-2">Loading programs...</span>
						</div>
					) : (
						<select
							value={selectedProgram}
							onChange={(e) => setSelectedProgram(e.target.value)}
							className="w-full p-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
							style={{
								backgroundColor: "#2A2F2F",
								borderColor: "#606364",
								color: "#FFFFFF",
							}}
						>
							<option value="">Choose a program...</option>
							{programs.map((program: any) => (
								<option key={program.id} value={program.id}>
									{program.title} ({program.sport} - {program.level})
								</option>
							))}
						</select>
					)}
				</div>

				{/* Selected Program Details */}
				{selectedProgram && (
					<div
						className="mb-6 p-4 rounded-lg"
						style={{ backgroundColor: "#2A2F2F" }}
					>
						{(() => {
							const program = programs.find(
								(p: any) => p.id === selectedProgram
							)
							if (!program) return null

							return (
								<div className="space-y-2">
									<h3 className="font-medium text-white">{program.title}</h3>
									<p className="text-sm text-gray-300">{program.description}</p>
									<div className="flex items-center gap-4 text-xs text-gray-400">
										<div className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											{program.duration} weeks
										</div>
										<div className="flex items-center gap-1">
											<Users className="h-3 w-3" />
											{program.totalAssignments || 0} assigned
										</div>
									</div>
								</div>
							)
						})()}
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
						onClick={handleAssign}
						disabled={!selectedProgram || isAssigning}
						className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						style={{
							backgroundColor: "#4A5A70",
							color: "#FFFFFF",
						}}
					>
						{isAssigning ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								Assigning...
							</>
						) : (
							<>
								<Check className="h-4 w-4" />
								Assign Program
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}
