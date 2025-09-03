"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/app/_trpc/client"
import { Users, User, Search } from "lucide-react"

export default function RoleSelectionPage() {
	const [selectedRole, setSelectedRole] = useState<"COACH" | "CLIENT" | null>(
		null
	)
	// Make name optional in state too
	const [selectedCoach, setSelectedCoach] = useState<{
		id: string
		name?: string | null // ✅ Allow null
		email: string
	} | null>(null)
	const [coachSearch, setCoachSearch] = useState("")
	const [showCoachDropdown, setShowCoachDropdown] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	// Get all coaches for search
	const { data: coaches = [] } = trpc.user.getCoaches.useQuery()

	// Filter coaches based on search
	const filteredCoaches = coaches.filter(
		(coach) =>
			coach.name?.toLowerCase().includes(coachSearch.toLowerCase()) ||
			coach.email.toLowerCase().includes(coachSearch.toLowerCase())
	)

	const updateRole = trpc.user?.updateRole?.useMutation({
		onSuccess: (data) => {
			// ✅ Now check the actual returned role
			if (data.role === "COACH") {
				router.push("/dashboard")
			} else if (data.role === "CLIENT") {
				router.push("/client-dashboard")
			}
		},
		onError: (error: unknown) => {
			console.error("Error updating role:", error)
			setIsLoading(false)
		},
	})

	const handleRoleSelect = async () => {
		if (!selectedRole) return

		// If client is selected but no coach is chosen, don't proceed
		if (selectedRole === "CLIENT" && !selectedCoach) {
			return
		}

		setIsLoading(true)
		updateRole.mutate({
			role: selectedRole,
			coachId: selectedRole === "CLIENT" ? selectedCoach?.id : undefined,
		})
	}

	const handleCoachSelect = (coach: {
		id: string
		name?: string | null
		email: string
	}) => {
		setSelectedCoach(coach)
		const displayName = coach.name || coach.email.split("@")[0]
		setCoachSearch(`${displayName} {${coach.email}}`)
		setShowCoachDropdown(false)
	}

	const handleSearchChange = (value: string) => {
		setCoachSearch(value)
		setShowCoachDropdown(true)
		// Clear selected coach if search is modified
		if (selectedCoach) {
			setSelectedCoach(null)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						Choose your role
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						How will you be using Next Level Softball?
					</p>
				</div>

				<div className="space-y-4">
					{/* Coach Option */}
					<div
						className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
							selectedRole === "COACH"
								? "border-blue-600 bg-blue-50"
								: "border-gray-300 hover:border-gray-400"
						}`}
						onClick={() => {
							setSelectedRole("COACH")
							setSelectedCoach(null)
							setCoachSearch("")
						}}
					>
						<div className="flex items-center">
							<Users className="h-8 w-8 text-blue-600" />
							<div className="ml-4">
								<h3 className="text-lg font-medium text-gray-900">
									I&apos;m a Coach
								</h3>
								<p className="text-sm text-gray-500">
									Manage athletes, create programs, and track progress
								</p>
							</div>
							{selectedRole === "COACH" && (
								<div className="absolute top-4 right-4">
									<div className="h-4 w-4 rounded-full bg-blue-600" />
								</div>
							)}
						</div>
					</div>

					{/* Client Option */}
					<div
						className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
							selectedRole === "CLIENT"
								? "border-green-600 bg-green-50"
								: "border-gray-300 hover:border-gray-400"
						}`}
						onClick={() => setSelectedRole("CLIENT")}
					>
						<div className="flex items-center">
							<User className="h-8 w-8 text-green-600" />
							<div className="ml-4">
								<h3 className="text-lg font-medium text-gray-900">
									I&apos;m an Athlete
								</h3>
								<p className="text-sm text-gray-500">
									Follow training programs and track my progress
								</p>
							</div>
							{selectedRole === "CLIENT" && (
								<div className="absolute top-4 right-4">
									<div className="h-4 w-4 rounded-full bg-green-600" />
								</div>
							)}
						</div>
					</div>

					{/* Coach Selection - Only show when CLIENT is selected */}
					{selectedRole === "CLIENT" && (
						<div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Select your coach
							</label>
							<div className="relative">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<input
										type="text"
										value={coachSearch}
										onChange={(e) => handleSearchChange(e.target.value)}
										onFocus={() => setShowCoachDropdown(true)}
										placeholder="Search for your coach..."
										className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
									/>
								</div>

								{/* Dropdown */}
								{showCoachDropdown && filteredCoaches.length > 0 && (
									<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
										{filteredCoaches.map((coach) => (
											<div
												key={coach.id}
												onClick={() => handleCoachSelect(coach)}
												className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
											>
												<div className="font-medium text-gray-900">
													{coach.name || coach.email.split("@")[0]}
												</div>
												<div className="text-gray-500 text-xs">
													{coach.email}
												</div>
											</div>
										))}
									</div>
								)}

								{/* No coaches found */}
								{showCoachDropdown &&
									coachSearch &&
									filteredCoaches.length === 0 && (
										<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-sm text-gray-500 text-center">
											No coaches found matching &quot;{coachSearch}&quot;
										</div>
									)}
							</div>

							{/* Selected coach display */}
							{selectedCoach && (
								<div className="mt-2 p-2 bg-white rounded border border-green-300">
									<div className="text-sm font-medium text-green-800">
										Selected:{" "}
										{selectedCoach.name || selectedCoach.email.split("@")[0]}{" "}
										{selectedCoach.email}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				<div>
					<button
						onClick={handleRoleSelect}
						disabled={
							!selectedRole ||
							isLoading ||
							(selectedRole === "CLIENT" && !selectedCoach)
						}
						className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${
							selectedRole &&
							(selectedRole === "COACH" ||
								(selectedRole === "CLIENT" && selectedCoach)) &&
							!isLoading
								? "bg-blue-600 hover:bg-blue-700"
								: "bg-gray-400 cursor-not-allowed"
						}`}
					>
						{isLoading ? "Setting up account..." : "Continue"}
					</button>

					{selectedRole === "CLIENT" && !selectedCoach && (
						<p className="mt-2 text-sm text-red-600 text-center">
							Please select a coach to continue
						</p>
					)}
				</div>
			</div>
		</div>
	)
}
