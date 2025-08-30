"use client"

import { useState, useRef } from "react"
import { trpc } from "@/app/_trpc/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Play, Check, AlertCircle } from "lucide-react"
import { UploadButton } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import { cn } from "@/lib/utils"

interface ClientVideoSubmissionModalProps {
	isOpen: boolean
	onClose: () => void
	drillId?: string
	drillTitle?: string
}

// Removed categories and difficulties as requested

export default function ClientVideoSubmissionModal({
	isOpen,
	onClose,
	drillId,
	drillTitle,
}: ClientVideoSubmissionModalProps) {
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [comment, setComment] = useState("")
	const [videoUrl, setVideoUrl] = useState("")
	const [thumbnail, setThumbnail] = useState<string | null>(null)
	const [isPublic, setIsPublic] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState("")
	const videoRef = useRef<HTMLVideoElement>(null)

	const utils = trpc.useUtils()

	const submitVideoMutation = trpc.clientRouter.submitVideo.useMutation({
		onSuccess: () => {
			utils.clientRouter.getVideoSubmissions.invalidate()
			onClose()
			resetForm()
		},
		onError: (error) => {
			setError(error.message)
			setIsSubmitting(false)
		},
	})

	const resetForm = () => {
		setTitle("")
		setDescription("")
		setComment("")
		setVideoUrl("")
		setThumbnail(null)
		setIsPublic(false)
		setError("")
		setIsSubmitting(false)
	}

	const handleClose = () => {
		resetForm()
		onClose()
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!title.trim() || !videoUrl) {
			setError("Title and video are required")
			return
		}

		setIsSubmitting(true)
		setError("")

		await submitVideoMutation.mutateAsync({
			title: title.trim(),
			description: description.trim() || undefined,
			comment: comment.trim() || undefined,
			videoUrl,
			thumbnail: thumbnail || undefined,
			drillId,
			isPublic,
		})
	}

	const generateThumbnail = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const video = document.createElement("video")
			const canvas = document.createElement("canvas")
			const ctx = canvas.getContext("2d")

			video.onloadedmetadata = () => {
				canvas.width = video.videoWidth
				canvas.height = video.videoHeight
				const seekTime = Math.min(2, video.duration * 0.1)
				video.currentTime = seekTime
			}

			video.onseeked = () => {
				if (ctx) {
					ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
					const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.8)
					resolve(thumbnailDataUrl)
				} else {
					reject(new Error("Could not get canvas context"))
				}
			}

			video.onerror = () => {
				reject(new Error("Error loading video"))
			}

			const videoUrl = URL.createObjectURL(file)
			video.src = videoUrl
			video.load()
		})
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-slate-800 border border-slate-700 rounded-2xl w-[600px] max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2 className="text-xl font-bold text-white">Submit Video</h2>
							<p className="text-slate-400 text-sm mt-1">
								Share your progress with your coach
							</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleClose}
							className="text-slate-400 hover:text-white"
						>
							<X className="h-5 w-5" />
						</Button>
					</div>

					{drillId && drillTitle && (
						<Card className="mb-6 bg-slate-700 border-slate-600">
							<CardContent className="p-4">
								<div className="flex items-center gap-2">
									<Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
										Drill
									</Badge>
									<span className="text-white font-medium">{drillTitle}</span>
								</div>
							</CardContent>
						</Card>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
						{error && (
							<div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
								<AlertCircle className="h-4 w-4 text-red-400" />
								<span className="text-red-400 text-sm">{error}</span>
							</div>
						)}

						<div className="space-y-2">
							<label className="text-sm font-medium text-white">
								Video Title *
							</label>
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Enter a descriptive title for your video"
								className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium text-white">
								Description
							</label>
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Describe what you're working on, any challenges, or questions for your coach..."
								className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium text-white">
								Comment for Coach
							</label>
							<Textarea
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								placeholder="Add any specific feedback, questions, or notes for your coach about this video..."
								className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium text-white">
								Upload Video *
							</label>
							{!videoUrl ? (
								<div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
									<UploadButton<OurFileRouter, "videoUploader">
										endpoint="videoUploader"
										onClientUploadComplete={async (res) => {
											const file = res[0]
											setVideoUrl(file.url)

											// Generate thumbnail for video files
											if (file.type && file.type.startsWith("video/")) {
												try {
													const response = await fetch(file.url)
													const blob = await response.blob()
													const videoFile = new File([blob], file.name, {
														type: file.type,
													})

													const thumbnailDataUrl = await generateThumbnail(
														videoFile
													)
													setThumbnail(thumbnailDataUrl)
												} catch (error) {
													console.error("Error generating thumbnail:", error)
													setThumbnail(null)
												}
											}
										}}
										onUploadError={(error: Error) => {
											setError(`Upload failed: ${error.message}`)
										}}
									/>
								</div>
							) : (
								<div className="space-y-3">
									<div className="bg-slate-700 rounded-lg p-4">
										<div className="flex items-center gap-3">
											{thumbnail ? (
												<img
													src={thumbnail}
													alt="Video thumbnail"
													className="w-16 h-12 object-cover rounded"
												/>
											) : (
												<div className="w-16 h-12 bg-slate-600 rounded flex items-center justify-center">
													<Play className="h-6 w-6 text-slate-400" />
												</div>
											)}
											<div className="flex-1">
												<p className="text-white font-medium">
													Video uploaded successfully
												</p>
												<p className="text-slate-400 text-sm">
													Ready to submit
												</p>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => {
													setVideoUrl("")
													setThumbnail(null)
												}}
												className="text-red-400 hover:text-red-300"
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							)}
						</div>

						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="isPublic"
								checked={isPublic}
								onChange={(e) => setIsPublic(e.target.checked)}
								className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
							/>
							<label htmlFor="isPublic" className="text-sm text-slate-300">
								Make this video public in coach's library
							</label>
						</div>

						<div className="flex gap-3 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
								disabled={isSubmitting || !title.trim() || !videoUrl}
							>
								{isSubmitting ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
										Submitting...
									</>
								) : (
									<>
										<Check className="h-4 w-4 mr-2" />
										Submit Video
									</>
								)}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}
