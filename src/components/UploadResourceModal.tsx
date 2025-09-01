"use client"

import { useState, useRef } from "react"
import { X, Upload, CheckCircle } from "lucide-react"
import { trpc } from "@/app/_trpc/client"
import { UploadButton } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

interface UploadResourceModalProps {
	isOpen: boolean
	onClose: () => void
	onSuccess: () => void
}

export default function UploadResourceModal({
	isOpen,
	onClose,
	onSuccess,
}: UploadResourceModalProps) {
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [category, setCategory] = useState<
		"Drive" | "Whip" | "Separation" | "Stability" | "Extension"
	>("Drive")
	const [uploadedFile, setUploadedFile] = useState<{
		url: string
		name: string
		size: number
		type: string
	} | null>(null)
	const [thumbnail, setThumbnail] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const videoRef = useRef<HTMLVideoElement>(null)

	// Generate thumbnail from video
	const generateThumbnail = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const video = document.createElement("video")
			const canvas = document.createElement("canvas")
			const ctx = canvas.getContext("2d")

			video.onloadedmetadata = () => {
				// Set canvas dimensions to video dimensions
				canvas.width = video.videoWidth
				canvas.height = video.videoHeight

				// Seek to 2 seconds or 10% of video duration (whichever is smaller)
				const seekTime = Math.min(2, video.duration * 0.1)
				video.currentTime = seekTime
			}

			video.onseeked = () => {
				if (ctx) {
					// Draw video frame to canvas
					ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

					// Convert canvas to base64 image
					const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.8)
					resolve(thumbnailDataUrl)
				} else {
					reject(new Error("Could not get canvas context"))
				}
			}

			video.onerror = () => {
				reject(new Error("Error loading video"))
			}

			// Create object URL for the video file
			const videoUrl = URL.createObjectURL(file)
			video.src = videoUrl
			video.load()
		})
	}

	const uploadMutation = trpc.library.upload.useMutation({
		onSuccess: () => {
			onSuccess()
			handleClose()
		},
		onError: (error) => {
			console.error("Upload error:", error)
			alert(`Save failed: ${error.message}`)
			setIsSubmitting(false)
		},
	})

	const handleClose = () => {
		// Reset form
		setTitle("")
		setDescription("")
		setCategory("Drive")
		setUploadedFile(null)
		setThumbnail(null)
		setIsSubmitting(false)
		onClose()
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!uploadedFile) {
			alert("Please upload a file first")
			return
		}

		if (!title.trim() || !category) {
			alert("Please fill in all required fields")
			return
		}

		setIsSubmitting(true)

		try {
			await uploadMutation.mutateAsync({
				title: title.trim(),
				description: description.trim(),
				category: category,
				fileUrl: uploadedFile.url,
				filename: uploadedFile.name,
				contentType: uploadedFile.type,
				size: uploadedFile.size,
				thumbnail: thumbnail || undefined, // Include the generated thumbnail
			})
		} catch (error) {
			// Error handled in mutation
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
			<div
				className="rounded-lg p-6 w-full max-w-lg border max-h-[90vh] overflow-y-auto"
				style={{
					backgroundColor: "#353A3A",
					borderColor: "#606364",
				}}
			>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold" style={{ color: "#C3BCC2" }}>
						Upload Resource
					</h2>
					<button
						onClick={handleClose}
						className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
						style={{ color: "#ABA4AA" }}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = "#606364"
							e.currentTarget.style.color = "#C3BCC2"
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = "transparent"
							e.currentTarget.style.color = "#ABA4AA"
						}}
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* File Upload Section */}
					<div>
						<label className="block text-sm mb-2" style={{ color: "#ABA4AA" }}>
							File Upload *
						</label>

						{!uploadedFile ? (
							<div
								className="border-2 border-dashed rounded-lg p-6 text-center"
								style={{ borderColor: "#606364" }}
							>
								<UploadButton<OurFileRouter, "videoUploader">
									endpoint="videoUploader"
									onClientUploadComplete={async (res) => {
										const file = res[0]
										const uploadedFileData = {
											url: file.url,
											name: file.name,
											size: file.size,
											type: file.type || "application/octet-stream",
										}

										setUploadedFile(uploadedFileData)

										// Generate thumbnail for video files
										if (file.type && file.type.startsWith("video/")) {
											try {
												// We need to get the actual file, not just the URL
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
												// Fallback to default video icon
												setThumbnail(null)
											}
										}
									}}
									onUploadError={(error: Error) => {
										console.error("Upload error:", error)
										alert(`Upload failed: ${error.message}`)
									}}
									appearance={{
										button: {
											background: "#4A5A70",
											color: "#C3BCC2",
											border: "none",
											borderRadius: "8px",
											padding: "12px 24px",
											fontSize: "14px",
											fontWeight: "500",
											cursor: "pointer",
											transition: "all 0.2s",
										},
										container: {
											width: "100%",
										},
										allowedContent: {
											color: "#ABA4AA",
											fontSize: "12px",
											marginTop: "8px",
										},
									}}
								/>
							</div>
						) : (
							<div
								className="border rounded-lg p-4"
								style={{
									borderColor: "#606364",
									backgroundColor: "#606364",
								}}
							>
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-3">
										<CheckCircle className="h-5 w-5 text-green-400" />
										<div>
											<p style={{ color: "#C3BCC2" }} className="font-medium">
												{uploadedFile.name}
											</p>
											<p style={{ color: "#ABA4AA" }} className="text-sm">
												{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
											</p>
										</div>
									</div>
									<button
										type="button"
										onClick={() => {
											setUploadedFile(null)
											setThumbnail(null)
										}}
										className="p-2 rounded-lg transition-all duration-200"
										style={{ color: "#ABA4AA" }}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = "#353A3A"
											e.currentTarget.style.color = "#C3BCC2"
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = "transparent"
											e.currentTarget.style.color = "#ABA4AA"
										}}
									>
										<X className="h-4 w-4" />
									</button>
								</div>

								{/* Thumbnail Preview */}
								{thumbnail && (
									<div className="mt-3">
										<p style={{ color: "#ABA4AA" }} className="text-sm mb-2">
											Generated Thumbnail:
										</p>
										<img
											src={thumbnail}
											alt="Video thumbnail"
											className="w-full h-32 object-cover rounded-lg"
											style={{ backgroundColor: "#353A3A" }}
										/>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Rest of form fields remain the same */}
					<div>
						<label className="block text-sm mb-1" style={{ color: "#ABA4AA" }}>
							Title *
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200"
							style={{
								backgroundColor: "#606364",
								borderColor: "#ABA4AA",
								color: "#C3BCC2",
							}}
							onFocus={(e) => {
								e.currentTarget.style.borderColor = "#C3BCC2"
							}}
							onBlur={(e) => {
								e.currentTarget.style.borderColor = "#ABA4AA"
							}}
							required
							disabled={isSubmitting}
						/>
					</div>

					<div>
						<label className="block text-sm mb-1" style={{ color: "#ABA4AA" }}>
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="w-full p-3 rounded-lg border h-24 focus:outline-none focus:ring-2 transition-all duration-200 resize-none"
							style={{
								backgroundColor: "#606364",
								borderColor: "#ABA4AA",
								color: "#C3BCC2",
							}}
							onFocus={(e) => {
								e.currentTarget.style.borderColor = "#C3BCC2"
							}}
							onBlur={(e) => {
								e.currentTarget.style.borderColor = "#ABA4AA"
							}}
							placeholder="Optional description..."
							disabled={isSubmitting}
						/>
					</div>

					<div>
						<label className="block text-sm mb-1" style={{ color: "#ABA4AA" }}>
							Focus Area *
						</label>
						<select
							value={category}
							onChange={(e) =>
								setCategory(
									e.target.value as
										| "Drive"
										| "Whip"
										| "Separation"
										| "Stability"
										| "Extension"
								)
							}
							className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200"
							style={{
								backgroundColor: "#606364",
								borderColor: "#ABA4AA",
								color: "#C3BCC2",
							}}
							onFocus={(e) => {
								e.currentTarget.style.borderColor = "#C3BCC2"
							}}
							onBlur={(e) => {
								e.currentTarget.style.borderColor = "#ABA4AA"
							}}
							required
							disabled={isSubmitting}
						>
							<option value="Drive">Drive</option>
							<option value="Whip">Whip</option>
							<option value="Separation">Separation</option>
							<option value="Stability">Stability</option>
							<option value="Extension">Extension</option>
						</select>
					</div>

					<div className="flex gap-3 pt-4">
						<button
							type="button"
							onClick={handleClose}
							className="flex-1 py-3 rounded-lg transition-all duration-200 font-medium border"
							style={{
								backgroundColor: "transparent",
								borderColor: "#606364",
								color: "#ABA4AA",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#606364"
								e.currentTarget.style.color = "#C3BCC2"
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "transparent"
								e.currentTarget.style.color = "#ABA4AA"
							}}
							disabled={isSubmitting}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="flex-1 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
							style={{
								backgroundColor: "#4A5A70",
								color: "#C3BCC2",
							}}
							onMouseEnter={(e) => {
								if (!isSubmitting) {
									e.currentTarget.style.backgroundColor = "#606364"
								}
							}}
							onMouseLeave={(e) => {
								if (!isSubmitting) {
									e.currentTarget.style.backgroundColor = "#4A5A70"
								}
							}}
							disabled={isSubmitting || !uploadedFile}
						>
							{isSubmitting ? (
								<>
									<div
										className="animate-spin rounded-full h-4 w-4 border-b-2"
										style={{ borderColor: "#C3BCC2" }}
									></div>
									Saving...
								</>
							) : (
								<>
									<Upload className="h-4 w-4" />
									Save Resource
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
