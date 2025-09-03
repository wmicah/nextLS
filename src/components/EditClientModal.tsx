"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/app/_trpc/client"
import { useUIStore } from "@/lib/stores/uiStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface EditClientModalProps {
	isOpen: boolean
	onClose: () => void
	client: {
		id: string
		name: string
		email: string | null
		phone: string | null
		notes: string | null
		age?: number | null
		height?: string | null
		dominantHand?: string | null
		movementStyle?: string | null
		reachingAbility?: string | null
		averageSpeed?: number | null
		topSpeed?: number | null
		dropSpinRate?: number | null
		changeupSpinRate?: number | null
		riseSpinRate?: number | null
		curveSpinRate?: number | null
	}
}

export default function EditClientModal({
	isOpen,
	onClose,
	client,
}: EditClientModalProps) {
	const [formData, setFormData] = useState({
		name: client.name,
		email: client.email || "",
		phone: client.phone || "",
		notes: client.notes || "",
		age: client.age || "",
		height: client.height || "",
		dominantHand: client.dominantHand || "",
		movementStyle: client.movementStyle || "",
		reachingAbility: client.reachingAbility || "",
		averageSpeed: client.averageSpeed || "",
		topSpeed: client.topSpeed || "",
		dropSpinRate: client.dropSpinRate || "",
		changeupSpinRate: client.changeupSpinRate || "",
		riseSpinRate: client.riseSpinRate || "",
		curveSpinRate: client.curveSpinRate || "",
	})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [emailExists, setEmailExists] = useState<boolean | null>(null)

	const { addToast } = useUIStore()
	const utils = trpc.useUtils()

	// Update form data when client prop changes
	useEffect(() => {
		setFormData({
			name: client.name,
			email: client.email || "",
			phone: client.phone || "",
			notes: client.notes || "",
			age: client.age || "",
			height: client.height || "",
			dominantHand: client.dominantHand || "",
			movementStyle: client.movementStyle || "",
			reachingAbility: client.reachingAbility || "",
			averageSpeed: client.averageSpeed || "",
			topSpeed: client.topSpeed || "",
			dropSpinRate: client.dropSpinRate || "",
			changeupSpinRate: client.changeupSpinRate || "",
			riseSpinRate: client.riseSpinRate || "",
			curveSpinRate: client.curveSpinRate || "",
		})
	}, [client])

	const updateClient = trpc.clients.update.useMutation({
		onSuccess: () => {
			utils.clients.list.invalidate()
			utils.clients.getById.invalidate({ id: client.id })
			addToast({
				type: "success",
				title: "Client updated",
				message: "Client information has been updated successfully.",
			})
			setIsSubmitting(false)
			onClose()
		},
		onError: (error) => {
			console.error("Failed to update client:", error)
			addToast({
				type: "error",
				title: "Update failed",
				message: error.message || "Failed to update client information.",
			})
			setIsSubmitting(false)
		},
	})

	const checkEmail = async (email: string) => {
		if (!email?.includes("@")) {
			setEmailExists(null)
			return
		}

		// Only check if email is different from current client email
		if (email === client.email) {
			setEmailExists(null)
			return
		}

		try {
			const exists = await utils.user.checkEmailExists.fetch({ email })
			setEmailExists(exists)
		} catch (error) {
			setEmailExists(null)
		}
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.name.trim()) {
			addToast({
				type: "error",
				title: "Validation error",
				message: "Client name is required.",
			})
			return
		}

		if (emailExists) {
			addToast({
				type: "error",
				title: "Email already exists",
				message: "This email is already registered to another user.",
			})
			return
		}

		setIsSubmitting(true)
		updateClient.mutate({
			id: client.id,
			name: formData.name.trim(),
			email: formData.email.trim() || undefined,
			phone: formData.phone.trim() || undefined,
			notes: formData.notes.trim() || undefined,
			age: formData.age ? parseInt(formData.age as string) : undefined,
			height: formData.height.trim() || undefined,
			dominantHand: (formData.dominantHand as "RIGHT" | "LEFT" | undefined) || undefined,
			movementStyle: (formData.movementStyle as "AIRPLANE" | "HELICOPTER" | undefined) || undefined,
			reachingAbility: (formData.reachingAbility as "REACHER" | "NON_REACHER" | undefined) || undefined,
			averageSpeed: formData.averageSpeed
				? parseFloat(formData.averageSpeed as string)
				: undefined,
			topSpeed: formData.topSpeed
				? parseFloat(formData.topSpeed as string)
				: undefined,
			dropSpinRate: formData.dropSpinRate
				? parseInt(formData.dropSpinRate as string)
				: undefined,
			changeupSpinRate: formData.changeupSpinRate
				? parseInt(formData.changeupSpinRate as string)
				: undefined,
			riseSpinRate: formData.riseSpinRate
				? parseInt(formData.riseSpinRate as string)
				: undefined,
			curveSpinRate: formData.curveSpinRate
				? parseInt(formData.curveSpinRate as string)
				: undefined,
		})
	}

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))

		if (name === "email") {
			checkEmail(value)
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl max-w-md w-full">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-700/50">
					<h3 className="text-xl font-bold text-white">Edit Client</h3>
					<button
						onClick={onClose}
						className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					<div>
						<Label htmlFor="name" className="text-white text-sm font-medium">
							Name *
						</Label>
						<Input
							id="name"
							name="name"
							type="text"
							value={formData.name}
							onChange={handleInputChange}
							className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
							placeholder="Enter client name"
							required
						/>
					</div>

					<div>
						<Label htmlFor="email" className="text-white text-sm font-medium">
							Email
						</Label>
						<Input
							id="email"
							name="email"
							type="email"
							value={formData.email}
							onChange={handleInputChange}
							className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
							placeholder="Enter email address"
						/>
						{emailExists !== null && (
							<p
								className={`text-sm mt-1 ${
									emailExists ? "text-red-400" : "text-green-400"
								}`}
							>
								{emailExists ? "Email already exists" : "Email available"}
							</p>
						)}
					</div>

					<div>
						<Label htmlFor="phone" className="text-white text-sm font-medium">
							Phone
						</Label>
						<Input
							id="phone"
							name="phone"
							type="tel"
							value={formData.phone}
							onChange={handleInputChange}
							className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
							placeholder="Enter phone number"
						/>
					</div>

					<div>
						<Label htmlFor="notes" className="text-white text-sm font-medium">
							Notes
						</Label>
						<Textarea
							id="notes"
							name="notes"
							value={formData.notes}
							onChange={handleInputChange}
							className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
							placeholder="Enter any notes about the client"
							rows={3}
						/>
					</div>

					{/* Softball Pitching Information */}
					<div className="pt-4 border-t border-gray-600/50">
						<h4 className="text-lg font-semibold text-white mb-4">
							Pitching Information
						</h4>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="age" className="text-white text-sm font-medium">
									Age
								</Label>
								<Input
									id="age"
									name="age"
									type="number"
									value={formData.age}
									onChange={handleInputChange}
									className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
									placeholder="Age"
								/>
							</div>

							<div>
								<Label
									htmlFor="height"
									className="text-white text-sm font-medium"
								>
									Height
								</Label>
								<Input
									id="height"
									name="height"
									type="text"
									value={formData.height}
									onChange={handleInputChange}
									className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 mt-4">
							<div>
								<Label
									htmlFor="dominantHand"
									className="text-white text-sm font-medium"
								>
									Dominant Hand
								</Label>
								<select
									id="dominantHand"
									name="dominantHand"
									value={formData.dominantHand}
									onChange={handleInputChange}
									className="mt-2 w-full bg-gray-800/50 border border-gray-600/50 text-white focus:border-blue-500/50 rounded-md px-3 py-2"
								>
									<option value="">Select hand</option>
									<option value="RIGHT">Right</option>
									<option value="LEFT">Left</option>
								</select>
							</div>

							<div>
								<Label
									htmlFor="movementStyle"
									className="text-white text-sm font-medium"
								>
									Movement Style
								</Label>
								<select
									id="movementStyle"
									name="movementStyle"
									value={formData.movementStyle}
									onChange={handleInputChange}
									className="mt-2 w-full bg-gray-800/50 border border-gray-600/50 text-white focus:border-blue-500/50 rounded-md px-3 py-2"
								>
									<option value="">Select style</option>
									<option value="AIRPLANE">Airplane</option>
									<option value="HELICOPTER">Helicopter</option>
								</select>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 mt-4">
							<div>
								<Label
									htmlFor="reachingAbility"
									className="text-white text-sm font-medium"
								>
									Reaching Ability
								</Label>
								<select
									id="reachingAbility"
									name="reachingAbility"
									value={formData.reachingAbility}
									onChange={handleInputChange}
									className="mt-2 w-full bg-gray-800/50 border border-gray-600/50 text-white focus:border-blue-500/50 rounded-md px-3 py-2"
								>
									<option value="">Select ability</option>
									<option value="REACHER">Reacher</option>
									<option value="NON_REACHER">Non Reacher</option>
								</select>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 mt-4">
							<div>
								<Label
									htmlFor="averageSpeed"
									className="text-white text-sm font-medium"
								>
									Average Speed (mph)
								</Label>
								<Input
									id="averageSpeed"
									name="averageSpeed"
									type="number"
									step="0.1"
									value={formData.averageSpeed}
									onChange={handleInputChange}
									className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
									placeholder="0.0"
								/>
							</div>

							<div>
								<Label
									htmlFor="topSpeed"
									className="text-white text-sm font-medium"
								>
									Top Speed (mph)
								</Label>
								<Input
									id="topSpeed"
									name="topSpeed"
									type="number"
									step="0.1"
									value={formData.topSpeed}
									onChange={handleInputChange}
									className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
									placeholder="0.0"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 mt-4">
							<div>
								<Label
									htmlFor="dropSpinRate"
									className="text-white text-sm font-medium"
								>
									Drop Spin Rate (rpm)
								</Label>
								<Input
									id="dropSpinRate"
									name="dropSpinRate"
									type="number"
									value={formData.dropSpinRate}
									onChange={handleInputChange}
									className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
									placeholder="0"
								/>
							</div>

							<div>
								<Label
									htmlFor="changeupSpinRate"
									className="text-white text-sm font-medium"
								>
									Changeup Spin Rate (rpm)
								</Label>
								<Input
									id="changeupSpinRate"
									name="changeupSpinRate"
									type="number"
									value={formData.changeupSpinRate}
									onChange={handleInputChange}
									className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
									placeholder="0"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 mt-4">
							<div>
								<Label
									htmlFor="riseSpinRate"
									className="text-white text-sm font-medium"
								>
									Rise Spin Rate (rpm)
								</Label>
								<Input
									id="riseSpinRate"
									name="riseSpinRate"
									type="number"
									value={formData.riseSpinRate}
									onChange={handleInputChange}
									className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
									placeholder="0"
								/>
							</div>

							<div>
								<Label
									htmlFor="curveSpinRate"
									className="text-white text-sm font-medium"
								>
									Curve Spin Rate (rpm)
								</Label>
								<Input
									id="curveSpinRate"
									name="curveSpinRate"
									type="number"
									value={formData.curveSpinRate}
									onChange={handleInputChange}
									className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
									placeholder="0"
								/>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-600/50">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							className="bg-gray-700/50 hover:bg-gray-600/50 text-white border-gray-600/50"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || emailExists === true}
							className="bg-blue-600 hover:bg-blue-700 text-white"
						>
							{isSubmitting ? "Updating..." : "Update Client"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}
