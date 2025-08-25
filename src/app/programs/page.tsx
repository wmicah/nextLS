"use client"

import { useState } from "react"
import { trpc } from "@/app/_trpc/client"
import {
	Plus,
	Users,
	MoreVertical,
	Edit,
	Copy,
	Trash2,
	Calendar,
	Dumbbell,
	TrendingUp,
	Target,
} from "lucide-react"
import Sidebar from "@/components/Sidebar"
import { useRouter } from "next/navigation"
import AssignProgramModal from "@/components/AssignProgramModal"

export default function ProgramsPage() {
	const [showAddModal, setShowAddModal] = useState(false)
	const [showAssignModal, setShowAssignModal] = useState(false)
	const [selectedProgram, setSelectedProgram] = useState<any>(null)
	const [newProgram, setNewProgram] = useState({ name: "", description: "" })
	const [openMenuId, setOpenMenuId] = useState<string | null>(null)
	const router = useRouter()

	// Fetch programs
	const { data: programs = [], refetch: refetchPrograms } =
		trpc.programs.list.useQuery()

	// Mutations
	const createProgramMutation = trpc.programs.create.useMutation({
		onSuccess: (data) => {
			refetchPrograms()
			setShowAddModal(false)
			setNewProgram({ name: "", description: "" })
			// Navigate to editor
			router.push(`/programs/${data.id}`)
		},
		onError: (error) => {
			alert(`Error creating program: ${error.message}`)
		},
	})

	const deleteProgramMutation = trpc.programs.delete.useMutation({
		onSuccess: () => {
			refetchPrograms()
		},
		onError: (error) => {
			alert(`Error deleting program: ${error.message}`)
		},
	})

	const duplicateProgramMutation = trpc.programs.duplicate.useMutation({
		onSuccess: (data) => {
			refetchPrograms()
			// Navigate to the new program
			router.push(`/programs/${data.id}`)
		},
		onError: (error) => {
			alert(`Error duplicating program: ${error.message}`)
		},
	})

	const handleCreateProgram = () => {
		if (!newProgram.name.trim()) {
			alert("Please enter a program name")
			return
		}

		createProgramMutation.mutate({
			name: newProgram.name,
			description: newProgram.description,
		})
	}

	const handleDeleteProgram = (programId: string, programName: string) => {
		if (confirm(`Are you sure you want to delete "${programName}"?`)) {
			deleteProgramMutation.mutate({ id: programId })
			setOpenMenuId(null)
		}
	}

	const handleDuplicateProgram = (programId: string) => {
		duplicateProgramMutation.mutate({ id: programId })
		setOpenMenuId(null)
	}

	const handleAssignProgram = (program: any) => {
		setSelectedProgram(program)
		setShowAssignModal(true)
		setOpenMenuId(null)
	}

	const handleEditProgram = (programId: string) => {
		router.push(`/programs/${programId}`)
		setOpenMenuId(null)
	}

	const totalPrograms = programs.length
	const activePrograms = programs.filter(
		(p: any) => p.activeClientCount > 0
	).length

	return (
		<Sidebar>
			<div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
				<div className="max-w-7xl mx-auto p-6">
					{/* Hero Header */}
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
										<div>
											<h1
												className="text-4xl font-bold mb-2"
												style={{ color: "#C3BCC2" }}
											>
												Training Programs
											</h1>
											<p
												className="flex items-center gap-2 text-lg"
												style={{ color: "#ABA4AA" }}
											>
												<TrendingUp className="h-5 w-5 text-green-400" />
												{totalPrograms > 0
													? `${totalPrograms} program${
															totalPrograms === 1 ? "" : "s"
													  } created`
													: "Ready to build your first training program"}
											</p>
										</div>
									</div>
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

					{/* Enhanced Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
						<div
							className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
							style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#3A4040"
								e.currentTarget.style.borderColor = "#4A5A70"
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#353A3A"
								e.currentTarget.style.borderColor = "#606364"
							}}
						>
							<div
								className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
								style={{
									background:
										"linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
								}}
							/>
							<div className="relative p-6">
								<div className="flex items-center justify-between mb-4">
									<div
										className="w-12 h-12 rounded-xl flex items-center justify-center"
										style={{ backgroundColor: "#4A5A70" }}
									>
										<Dumbbell
											className="h-6 w-6"
											style={{ color: "#C3BCC2" }}
										/>
									</div>
									<TrendingUp className="h-5 w-5 text-green-400" />
								</div>
								<div>
									<p
										className="text-sm font-medium mb-1"
										style={{ color: "#ABA4AA" }}
									>
										Total Programs
									</p>
									<p
										className="text-3xl font-bold mb-1"
										style={{ color: "#C3BCC2" }}
									>
										{totalPrograms}
									</p>
									<p className="text-xs" style={{ color: "#ABA4AA" }}>
										{totalPrograms > 0 ? "+1 this week" : "Create your first"}
									</p>
								</div>
							</div>
						</div>

						<div
							className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
							style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#3A4040"
								e.currentTarget.style.borderColor = "#4A5A70"
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#353A3A"
								e.currentTarget.style.borderColor = "#606364"
							}}
						>
							<div
								className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
								style={{
									background:
										"linear-gradient(135deg, #10B981 0%, #34D399 100%)",
								}}
							/>
							<div className="relative p-6">
								<div className="flex items-center justify-between mb-4">
									<div
										className="w-12 h-12 rounded-xl flex items-center justify-center"
										style={{ backgroundColor: "#10B981" }}
									>
										<Users className="h-6 w-6" style={{ color: "#C3BCC2" }} />
									</div>
									<TrendingUp className="h-5 w-5 text-green-400" />
								</div>
								<div>
									<p
										className="text-sm font-medium mb-1"
										style={{ color: "#ABA4AA" }}
									>
										Active Programs
									</p>
									<p
										className="text-3xl font-bold mb-1"
										style={{ color: "#C3BCC2" }}
									>
										{activePrograms}
									</p>
									<p className="text-xs" style={{ color: "#ABA4AA" }}>
										{activePrograms > 0 ? "In use" : "Assign to clients"}
									</p>
								</div>
							</div>
						</div>

						<div
							className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
							style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#3A4040"
								e.currentTarget.style.borderColor = "#4A5A70"
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#353A3A"
								e.currentTarget.style.borderColor = "#606364"
							}}
						>
							<div
								className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
								style={{
									background:
										"linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
								}}
							/>
							<div className="relative p-6">
								<div className="flex items-center justify-between mb-4">
									<div
										className="w-12 h-12 rounded-xl flex items-center justify-center"
										style={{ backgroundColor: "#F59E0B" }}
									>
										<Calendar
											className="h-6 w-6"
											style={{ color: "#C3BCC2" }}
										/>
									</div>
									<TrendingUp className="h-5 w-5 text-yellow-400" />
								</div>
								<div>
									<p
										className="text-sm font-medium mb-1"
										style={{ color: "#ABA4AA" }}
									>
										This Week
									</p>
									<p
										className="text-3xl font-bold mb-1"
										style={{ color: "#C3BCC2" }}
									>
										{totalPrograms}
									</p>
									<p className="text-xs" style={{ color: "#ABA4AA" }}>
										Programs created
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Enhanced Quick Actions */}
					<div
						className="rounded-2xl shadow-xl border mb-8 relative overflow-hidden group"
						style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
					>
						<div
							className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
							style={{
								background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
							}}
						/>
						<div className="relative p-6">
							<h3
								className="text-xl font-bold mb-6 flex items-center gap-3"
								style={{ color: "#C3BCC2" }}
							>
								<div
									className="w-8 h-8 rounded-lg flex items-center justify-center"
									style={{ backgroundColor: "#4A5A70" }}
								>
									<Target className="h-4 w-4" style={{ color: "#C3BCC2" }} />
								</div>
								Quick Actions
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<button
									onClick={() => setShowAddModal(true)}
									className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border group/action"
									style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = "#3A4040"
										e.currentTarget.style.borderColor = "#4A5A70"
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = "#353A3A"
										e.currentTarget.style.borderColor = "#606364"
									}}
								>
									<div
										className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover/action:scale-110"
										style={{ backgroundColor: "#10B981" }}
									>
										<Plus className="h-5 w-5" style={{ color: "#C3BCC2" }} />
									</div>
									<span className="font-medium" style={{ color: "#C3BCC2" }}>
										Create Program
									</span>
								</button>

								<button
									onClick={() => router.push("/clients")}
									className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border group/action"
									style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = "#3A4040"
										e.currentTarget.style.borderColor = "#4A5A70"
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = "#353A3A"
										e.currentTarget.style.borderColor = "#606364"
									}}
								>
									<div
										className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover/action:scale-110"
										style={{ backgroundColor: "#4A5A70" }}
									>
										<Users className="h-5 w-5" style={{ color: "#C3BCC2" }} />
									</div>
									<span className="font-medium" style={{ color: "#C3BCC2" }}>
										Assign to Clients
									</span>
								</button>

								<button
									onClick={() => router.push("/library")}
									className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border group/action"
									style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = "#3A4040"
										e.currentTarget.style.borderColor = "#4A5A70"
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = "#353A3A"
										e.currentTarget.style.borderColor = "#606364"
									}}
								>
									<div
										className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover/action:scale-110"
										style={{ backgroundColor: "#F59E0B" }}
									>
										<Calendar
											className="h-5 w-5"
											style={{ color: "#C3BCC2" }}
										/>
									</div>
									<span className="font-medium" style={{ color: "#C3BCC2" }}>
										Browse Library
									</span>
								</button>
							</div>
						</div>
					</div>

					{/* Enhanced Programs Section */}
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2
								className="text-2xl font-bold flex items-center gap-3 mb-2"
								style={{ color: "#C3BCC2" }}
							>
								<div
									className="w-8 h-8 rounded-lg flex items-center justify-center"
									style={{ backgroundColor: "#4A5A70" }}
								>
									<Dumbbell className="h-4 w-4" style={{ color: "#C3BCC2" }} />
								</div>
								Your Programs
							</h2>
							<p
								className="flex items-center gap-2"
								style={{ color: "#ABA4AA" }}
							>
								<Calendar className="h-4 w-4" />
								{totalPrograms} {totalPrograms === 1 ? "program" : "programs"}{" "}
								ready to use
							</p>
						</div>
						<button
							onClick={() => setShowAddModal(true)}
							className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium border"
							style={{
								backgroundColor: "#353A3A",
								color: "#C3BCC2",
								borderColor: "#606364",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#3A4040"
								e.currentTarget.style.borderColor = "#4A5A70"
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#353A3A"
								e.currentTarget.style.borderColor = "#606364"
							}}
						>
							<Plus className="h-5 w-5" />
							Create New Program
						</button>
					</div>

					{/* Programs Grid */}
					{programs.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{programs.map((program: any, index: number) => (
								<div
									key={program.id}
									className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
									style={{
										backgroundColor: "#353A3A",
										borderColor: "#606364",
										animationDelay: `${index * 100}ms`,
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = "#3A4040"
										e.currentTarget.style.borderColor = "#4A5A70"
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = "#353A3A"
										e.currentTarget.style.borderColor = "#606364"
									}}
								>
									<div
										className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
										style={{
											background:
												"linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
										}}
									/>
									<div className="relative p-6">
										<div className="flex items-start justify-between mb-4">
											<div className="flex-1">
												<h3
													className="text-lg font-semibold mb-2"
													style={{ color: "#C3BCC2" }}
												>
													{program.title}
												</h3>
												<p
													className="text-sm mb-3"
													style={{ color: "#ABA4AA" }}
												>
													{program.description || "No description"}
												</p>
												<div className="flex items-center gap-2 text-sm">
													<Users
														className="h-4 w-4"
														style={{ color: "#10B981" }}
													/>
													<span style={{ color: "#10B981" }}>
														Active: {program.activeClientCount || 0}
													</span>
												</div>
											</div>
											<div className="relative">
												<button
													onClick={() =>
														setOpenMenuId(
															openMenuId === program.id ? null : program.id
														)
													}
													className="p-2 rounded-lg transition-all duration-300 transform hover:scale-110"
													style={{ color: "#ABA4AA" }}
													onMouseEnter={(e) => {
														e.currentTarget.style.color = "#C3BCC2"
														e.currentTarget.style.backgroundColor = "#3A4040"
													}}
													onMouseLeave={(e) => {
														e.currentTarget.style.color = "#ABA4AA"
														e.currentTarget.style.backgroundColor =
															"transparent"
													}}
												>
													<MoreVertical className="h-4 w-4" />
												</button>
												{/* Dropdown Menu */}
												{openMenuId === program.id && (
													<div
														className="absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl z-20"
														style={{
															backgroundColor: "#353A3A",
															borderColor: "#606364",
														}}
													>
														<div className="p-2">
															<button
																onClick={() => handleEditProgram(program.id)}
																className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors"
																style={{ color: "#C3BCC2" }}
																onMouseEnter={(e) => {
																	e.currentTarget.style.backgroundColor =
																		"#3A4040"
																}}
																onMouseLeave={(e) => {
																	e.currentTarget.style.backgroundColor =
																		"transparent"
																}}
															>
																<Edit
																	className="h-4 w-4"
																	style={{ color: "#4A5A70" }}
																/>
																Edit
															</button>
															<button
																onClick={() =>
																	handleDuplicateProgram(program.id)
																}
																className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors"
																style={{ color: "#C3BCC2" }}
																onMouseEnter={(e) => {
																	e.currentTarget.style.backgroundColor =
																		"#3A4040"
																}}
																onMouseLeave={(e) => {
																	e.currentTarget.style.backgroundColor =
																		"transparent"
																}}
															>
																<Copy
																	className="h-4 w-4"
																	style={{ color: "#F59E0B" }}
																/>
																Duplicate
															</button>
															<div
																className="border-t my-2"
																style={{ borderColor: "#606364" }}
															></div>
															<button
																onClick={() =>
																	handleDeleteProgram(program.id, program.title)
																}
																className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors"
																style={{ color: "#EF4444" }}
																onMouseEnter={(e) => {
																	e.currentTarget.style.backgroundColor =
																		"#3A4040"
																}}
																onMouseLeave={(e) => {
																	e.currentTarget.style.backgroundColor =
																		"transparent"
																}}
															>
																<Trash2 className="h-4 w-4" />
																Delete
															</button>
														</div>
													</div>
												)}
											</div>
										</div>

										<div className="flex gap-2">
											<button
												onClick={() => router.push(`/programs/${program.id}`)}
												className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
												style={{
													backgroundColor: "transparent",
													borderColor: "#606364",
													color: "#C3BCC2",
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.backgroundColor = "#3A4040"
													e.currentTarget.style.borderColor = "#4A5A70"
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.backgroundColor = "transparent"
													e.currentTarget.style.borderColor = "#606364"
												}}
											>
												Edit Program
											</button>
											<button
												onClick={() => handleAssignProgram(program)}
												className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
												style={{
													backgroundColor: "#4A5A70",
													color: "#C3BCC2",
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.backgroundColor = "#606364"
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.backgroundColor = "#4A5A70"
												}}
											>
												Assign
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						/* Empty State */
						<div
							className="rounded-2xl shadow-xl border text-center relative overflow-hidden group"
							style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
						>
							<div
								className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
								style={{
									background:
										"linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
								}}
							/>
							<div className="relative p-12">
								<div
									className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
									style={{ backgroundColor: "#4A5A70" }}
								>
									<Dumbbell
										className="h-10 w-10"
										style={{ color: "#C3BCC2" }}
									/>
								</div>
								<h3
									className="text-2xl font-bold mb-3"
									style={{ color: "#C3BCC2" }}
								>
									Ready to Create Your First Program?
								</h3>
								<p
									className="mb-8 max-w-md mx-auto text-lg"
									style={{ color: "#ABA4AA" }}
								>
									Build comprehensive training programs to help your athletes
									reach their full potential.
								</p>
								<button
									onClick={() => setShowAddModal(true)}
									className="flex items-center gap-2 px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium mx-auto border"
									style={{
										backgroundColor: "#4A5A70",
										color: "#C3BCC2",
										borderColor: "#606364",
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = "#606364"
										e.currentTarget.style.boxShadow =
											"0 10px 25px rgba(0, 0, 0, 0.3)"
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = "#4A5A70"
										e.currentTarget.style.boxShadow =
											"0 4px 15px rgba(0, 0, 0, 0.2)"
									}}
								>
									<Plus className="h-5 w-5" />
									Create Your First Program
								</button>
							</div>
						</div>
					)}

					{/* Add Program Modal */}
					{showAddModal && (
						<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
							<div
								className="rounded-2xl shadow-xl border p-6 w-full max-w-md mx-4"
								style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
							>
								<div className="flex items-center justify-between mb-4">
									<h2
										className="text-xl font-bold"
										style={{ color: "#C3BCC2" }}
									>
										Create New Program
									</h2>
									<button
										onClick={() => setShowAddModal(false)}
										className="text-gray-400 hover:text-white transition-colors"
									>
										×
									</button>
								</div>

								<div className="space-y-4">
									<div>
										<label
											className="block text-sm font-medium mb-2"
											style={{ color: "#C3BCC2" }}
										>
											Program Name
										</label>
										<input
											type="text"
											value={newProgram.name}
											onChange={(e) =>
												setNewProgram({ ...newProgram, name: e.target.value })
											}
											className="w-full p-3 rounded-lg border text-white"
											style={{
												backgroundColor: "#2A2F2F",
												borderColor: "#606364",
											}}
											placeholder="Enter program name"
										/>
									</div>

									<div>
										<label
											className="block text-sm font-medium mb-2"
											style={{ color: "#C3BCC2" }}
										>
											Description (Optional)
										</label>
										<textarea
											value={newProgram.description}
											onChange={(e) =>
												setNewProgram({
													...newProgram,
													description: e.target.value,
												})
											}
											rows={3}
											className="w-full p-3 rounded-lg border text-white resize-none"
											style={{
												backgroundColor: "#2A2F2F",
												borderColor: "#606364",
											}}
											placeholder="Describe the program goals and focus areas"
										/>
									</div>
								</div>

								<div className="flex gap-3 mt-6">
									<button
										onClick={() => setShowAddModal(false)}
										className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
										style={{
											backgroundColor: "transparent",
											borderColor: "#606364",
											color: "#C3BCC2",
										}}
									>
										Cancel
									</button>
									<button
										onClick={handleCreateProgram}
										disabled={createProgramMutation.isPending}
										className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
										style={{
											backgroundColor: "#10B981",
											color: "#C3BCC2",
										}}
									>
										{createProgramMutation.isPending ? (
											<>
												<div
													className="animate-spin rounded-full h-4 w-4 border-b-2"
													style={{ borderColor: "#C3BCC2" }}
												></div>
												Creating...
											</>
										) : (
											<>
												<Plus className="h-4 w-4" />
												Create Program
											</>
										)}
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Assign Program Modal */}
					<AssignProgramModal
						isOpen={showAssignModal}
						onClose={() => setShowAssignModal(false)}
						programId={selectedProgram?.id}
						programTitle={selectedProgram?.title}
					/>
				</div>
			</div>
		</Sidebar>
	)
}
