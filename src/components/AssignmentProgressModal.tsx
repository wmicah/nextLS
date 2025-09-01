"use client"

import { useState } from "react"
import { trpc } from "@/app/_trpc/client"
import { useUIStore } from "@/lib/stores/uiStore"
import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, X } from "lucide-react"
// import { format } from "date-fns"

interface AssignmentProgressModalProps {
	isOpen: boolean
	onClose: () => void
	assignmentId: string
	clientName: string
	clientEmail?: string | null
	clientAvatar?: string | null
	programTitle: string
	currentProgress: number
}

export default function AssignmentProgressModal({
	isOpen,
	onClose,
	assignmentId,
	clientName,
	clientEmail,
	clientAvatar,
	programTitle,
	currentProgress,
}: AssignmentProgressModalProps) {
	const [progress, setProgress] = useState(currentProgress)
	const [isUpdating, setIsUpdating] = useState(false)

	const { addToast } = useUIStore()
	const utils = trpc.useUtils()

	const updateProgressMutation =
		trpc.programs.updateAssignmentProgress.useMutation({
			onSuccess: () => {
				setIsUpdating(false)
				addToast({
					type: "success",
					title: "Progress updated",
					message: `Progress has been updated to ${progress}%.`,
				})
				onClose()

				// Invalidate and refetch data
				utils.clients.list.invalidate()
				utils.programs.list.invalidate()
			},
			onError: (error) => {
				setIsUpdating(false)
				addToast({
					type: "error",
					title: "Update failed",
					message: error.message || "Failed to update progress.",
				})
			},
		})

	const handleUpdateProgress = () => {
		setIsUpdating(true)
		updateProgressMutation.mutate({
			assignmentId,
			progress,
		})
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
			<div className="bg-gray-800 rounded-xl border border-gray-600 max-w-md w-full m-4">
				<div className="p-6">
					{/* Header */}
					<div className="flex items-center justify-between mb-6">
						<div>
							<h3 className="text-xl font-bold text-white">Update Progress</h3>
							<p className="text-gray-400 text-sm mt-1">
								Track client progress through the program
							</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="text-gray-400 hover:text-white"
						>
							<X className="h-5 w-5" />
						</Button>
					</div>

					{/* Client Info */}
					<Card className="bg-gray-700 border-gray-600 mb-6">
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<Avatar className="h-12 w-12">
									<AvatarImage src={clientAvatar || undefined} />
									<AvatarFallback className="bg-blue-600 text-white">
										{clientName.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<h4 className="text-white font-medium">{clientName}</h4>
									{clientEmail && (
										<p className="text-gray-400 text-sm">{clientEmail}</p>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Program Info */}
					<Card className="bg-gray-700 border-gray-600 mb-6">
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
									<Target className="h-5 w-5 text-blue-400" />
								</div>
								<div className="flex-1">
									<h4 className="text-white font-medium">{programTitle}</h4>
									<p className="text-gray-400 text-sm">Training Program</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Progress Section */}
					<div className="space-y-4">
						<div>
							<Label className="text-white text-sm font-medium mb-2 block">
								Current Progress: {progress}%
							</Label>
							<Progress value={progress} className="w-full h-3" />
						</div>

						<div>
							<Label className="text-white text-sm font-medium mb-4 block">
								Update Progress
							</Label>
							<Slider
								value={progress}
								onChange={(e) => setProgress(Number(e.target.value))}
								max={100}
								step={5}
								className="w-full"
							/>
							<div className="flex justify-between text-xs text-gray-400 mt-2">
								<span>0%</span>
								<span>25%</span>
								<span>50%</span>
								<span>75%</span>
								<span>100%</span>
							</div>
						</div>

						{/* Quick Progress Buttons */}
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setProgress(25)}
								className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
							>
								25%
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setProgress(50)}
								className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
							>
								50%
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setProgress(75)}
								className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
							>
								75%
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setProgress(100)}
								className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
							>
								100%
							</Button>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-600">
						<Button
							variant="outline"
							onClick={onClose}
							className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateProgress}
							disabled={isUpdating || progress === currentProgress}
							className="bg-blue-600 hover:bg-blue-700 text-white"
						>
							{isUpdating ? "Updating..." : "Update Progress"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
