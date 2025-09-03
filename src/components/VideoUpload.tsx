"use client"

import { useState } from "react"
import { UploadButton } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import { trpc } from "@/app/_trpc/client"
import { Video, Upload, X, CheckCircle, AlertCircle } from "lucide-react"

interface VideoUploadProps {
	clientId?: string
	onUploadComplete?: (videoId: string) => void
}

export default function VideoUpload({
	clientId,
	onUploadComplete,
}: VideoUploadProps) {
	const [isUploading, setIsUploading] = useState(false)
	const [uploadedFile, setUploadedFile] = useState<any>(null)
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		category: "BULLPEN" as const,
	})

	const createVideoMutation = trpc.videos.create.useMutation({
		onSuccess: (video) => {
			setIsUploading(false)
			setUploadedFile(null)
			setFormData({ title: "", description: "", category: "BULLPEN" })
			onUploadComplete?.(video.id)
		},
		onError: (error) => {
			console.error("Failed to create video:", error)
			setIsUploading(false)
		},
	})

	const handleUploadComplete = (res: any) => {
		console.log("Upload complete:", res)
		if (res?.[0]) {
			setUploadedFile(res[0])
			setIsUploading(false)
		}
	}

	const handleSave = async () => {
		if (!uploadedFile || !formData.title.trim()) return

		console.log("Saving video with data:", {
			title: formData.title,
			description: formData.description,
			url: uploadedFile.url,
			fileSize: uploadedFile.size,
			clientId,
			category: formData.category,
		})

		setIsUploading(true)
		try {
			const result = await createVideoMutation.mutateAsync({
				title: formData.title,
				description: formData.description,
				url: uploadedFile.url,
				fileSize: uploadedFile.size,
				clientId,
				category: formData.category,
			})
			console.log("Video saved successfully:", result)
		} catch (error) {
			console.error("Error saving video:", error)
		}
	}

	return (
		<div className="w-full max-w-2xl mx-auto">
			<div
				className="p-6 rounded-2xl border-2 border-dashed transition-all duration-200"
				style={{
					backgroundColor: "#2a2a2a",
					borderColor: "#374151",
				}}
			>
				{!uploadedFile ? (
					<div className="text-center">
						<Video
							className="w-12 h-12 mx-auto mb-4"
							style={{ color: "#9ca3af" }}
						/>
						<h3
							className="text-lg font-semibold mb-2"
							style={{ color: "#ffffff" }}
						>
							Upload Video
						</h3>
						<p className="text-sm mb-6" style={{ color: "#9ca3af" }}>
							Upload your bullpen or practice footage for coach review
						</p>

						<UploadButton<OurFileRouter, "feedbackVideoUploader">
							endpoint="feedbackVideoUploader"
							onUploadBegin={() => setIsUploading(true)}
							onClientUploadComplete={handleUploadComplete}
							onUploadError={(error: Error) => {
								console.error("Upload error:", error)
								setIsUploading(false)
							}}
							className="w-full"
						/>

						<div className="mt-4 text-xs" style={{ color: "#6b7280" }}>
							Supports MP4, MOV, AVI up to 100MB
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<CheckCircle className="w-5 h-5" style={{ color: "#10b981" }} />
								<span className="font-medium" style={{ color: "#ffffff" }}>
									Video uploaded successfully
								</span>
							</div>
							<button
								onClick={() => setUploadedFile(null)}
								className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
							>
								<X className="w-4 h-4" style={{ color: "#9ca3af" }} />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label
									className="block text-sm font-medium mb-2"
									style={{ color: "#9ca3af" }}
								>
									Video Title *
								</label>
								<input
									type="text"
									value={formData.title}
									onChange={(e) =>
										setFormData({ ...formData, title: e.target.value })
									}
									placeholder="e.g., Bullpen Session - Fastball Focus"
									className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
									style={{
										backgroundColor: "#374151",
										borderColor: "#606364",
										color: "#ffffff",
										border: "1px solid",
									}}
								/>
							</div>

							<div>
								<label
									className="block text-sm font-medium mb-2"
									style={{ color: "#9ca3af" }}
								>
									Category
								</label>
								<select
									value={formData.category}
									onChange={(e) =>
										setFormData({
											...formData,
											category: e.target.value as any,
										})
									}
									className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
									style={{
										backgroundColor: "#374151",
										borderColor: "#606364",
										color: "#ffffff",
										border: "1px solid",
									}}
								>
									<option value="BULLPEN">Bullpen</option>
									<option value="PRACTICE">Practice</option>
									<option value="GAME_FOOTAGE">Game Footage</option>
									<option value="REFERENCE">Reference</option>
									<option value="COMPARISON">Comparison</option>
									<option value="OTHER">Other</option>
								</select>
							</div>

							<div>
								<label
									className="block text-sm font-medium mb-2"
									style={{ color: "#9ca3af" }}
								>
									Description (Optional)
								</label>
								<textarea
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder="Add any notes about this video..."
									rows={3}
									className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 resize-none"
									style={{
										backgroundColor: "#374151",
										borderColor: "#606364",
										color: "#ffffff",
										border: "1px solid",
									}}
								/>
							</div>

							<button
								onClick={handleSave}
								disabled={!formData.title.trim() || isUploading}
								className="w-full px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
								style={{ backgroundColor: "#374151", color: "#ffffff" }}
							>
								{isUploading ? "Saving..." : "Save Video"}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
