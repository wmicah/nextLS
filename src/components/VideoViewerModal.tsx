"use client"

import { useState, useEffect } from "react"
import { X, Star, Eye, Play, Pause, Trash2 } from "lucide-react"
import { trpc } from "@/app/_trpc/client"

interface VideoViewerModalProps {
	isOpen: boolean
	onClose: () => void
	item: any
	onDelete?: () => void // Add this callback
}

export default function VideoViewerModal({
	isOpen,
	onClose,
	item,
	onDelete,
}: VideoViewerModalProps) {
	const [isPlaying, setIsPlaying] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	// Get client comments for this video
	const { data: clientComments = [] } =
		trpc.library.getClientCommentsForVideo.useQuery(
			{ videoId: item?.id },
			{ enabled: !!item?.id }
		)

	const deleteMutation = trpc.library.delete.useMutation({
		onSuccess: () => {
			setShowDeleteConfirm(false)
			onDelete?.() // Call the callback to refresh the list
			onClose() // Close the modal
		},
		onError: (error) => {
			console.error("Delete error:", error)
			alert(`Delete failed: ${error.message}`)
		},
	})

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden"
		} else {
			document.body.style.overflow = "unset"
		}

		return () => {
			document.body.style.overflow = "unset"
		}
	}, [isOpen])

	if (!isOpen || !item) return null

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose()
		}
	}

	const handleDelete = () => {
		deleteMutation.mutate({ id: item.id })
	}

	const renderVideoPlayer = () => {
		if (item.isYoutube && item.youtubeId) {
			// YouTube video
			return (
				<iframe
					width="100%"
					height="100%"
					src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=0&rel=0&disablekb=1&modestbranding=1&showinfo=0`}
					title={item.title}
					frameBorder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					className="w-full h-full"
					style={{ pointerEvents: "auto" }}
					onContextMenu={(e) => e.preventDefault()} // Disable right-click
				/>
			)
		} else if (item.type === "video" && item.url) {
			// User uploaded video with protection
			return (
				<video
					controls
					controlsList="nodownload nofullscreen" // Disable download button
					disablePictureInPicture // Disable picture-in-picture
					className="w-full h-full object-contain"
					style={{ backgroundColor: "#000" }}
					onPlay={() => setIsPlaying(true)}
					onPause={() => setIsPlaying(false)}
					onContextMenu={(e) => e.preventDefault()} // Disable right-click
					onError={(e) => {
						console.error("Video load error:", e)
					}}
				>
					<source src={item.url} type="video/mp4" />
					<source src={item.url} type="video/webm" />
					<source src={item.url} type="video/ogg" />
					Your browser does not support the video tag.
				</video>
			)
		} else if (item.type === "document") {
			// Document preview
			return (
				<div className="w-full h-full flex items-center justify-center">
					<div className="text-center">
						<div className="text-8xl mb-4">📄</div>
						<p style={{ color: "#C3BCC2" }} className="text-lg">
							Document Preview
						</p>
						<p style={{ color: "#ABA4AA" }} className="text-sm">
							{item.filename || "Document file"}
						</p>
						<button
							onClick={() => window.open(item.url, "_blank")}
							className="mt-4 px-6 py-2 rounded-lg transition-all duration-200"
							style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#606364"
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#4A5A70"
							}}
						>
							Open Document
						</button>
					</div>
				</div>
			)
		} else {
			// Fallback for unknown types
			return (
				<div className="w-full h-full flex items-center justify-center">
					<div className="text-center">
						<Play
							className="h-16 w-16 mb-4 mx-auto"
							style={{ color: "#C3BCC2" }}
						/>
						<p style={{ color: "#C3BCC2" }} className="text-lg">
							Media Player
						</p>
						<p style={{ color: "#ABA4AA" }} className="text-sm">
							Unable to preview this file type
						</p>
						<button
							onClick={() => window.open(item.url, "_blank")}
							className="mt-4 px-6 py-2 rounded-lg transition-all duration-200"
							style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#606364"
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#4A5A70"
							}}
						>
							Open File
						</button>
					</div>
				</div>
			)
		}
	}

	return (
		<div
			className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
			onClick={handleBackdropClick}
		>
			<div
				className="rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto"
				style={{ backgroundColor: "#353A3A" }}
			>
				{/* Header */}
				<div
					className="flex items-center justify-between p-6 border-b sticky top-0 z-10"
					style={{
						borderColor: "#606364",
						backgroundColor: "#353A3A",
					}}
				>
					<div className="flex items-center gap-3">
						<span
							className="px-3 py-1 text-sm font-medium rounded-full"
							style={{
								backgroundColor: "#4A5A70",
								color: "#C3BCC2",
							}}
						>
							{item.category}
						</span>
						<span
							className="px-3 py-1 text-sm rounded-full border"
							style={{
								backgroundColor: "transparent",
								borderColor: "#606364",
								color: "#ABA4AA",
							}}
						>
							{item.difficulty}
						</span>
						{item.isYoutube && (
							<span
								className="px-3 py-1 text-sm rounded-full"
								style={{
									backgroundColor: "#DC2626",
									color: "#C3BCC2",
								}}
							>
								YouTube
							</span>
						)}
					</div>
					<button
						onClick={onClose}
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

				{/* Video/Content Area */}
				<div className="p-6">
					<div className="mb-6">
						{/* Video Player */}
						<div
							className="w-full rounded-lg overflow-hidden"
							style={{ backgroundColor: "#606364", aspectRatio: "16/9" }}
						>
							{renderVideoPlayer()}
						</div>
					</div>

					{/* Content Info */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Main Content */}
						<div className="lg:col-span-2">
							<h1
								className="text-3xl font-bold mb-4"
								style={{ color: "#C3BCC2" }}
							>
								{item.title}
							</h1>

							<div className="flex items-center gap-6 mb-6">
								<div className="flex items-center gap-2">
									<Star className="h-5 w-5 text-yellow-400" />
									<span
										style={{ color: "#C3BCC2" }}
										className="text-lg font-semibold"
									>
										{item.rating || 0}
									</span>
									<span style={{ color: "#ABA4AA" }} className="text-sm">
										rating
									</span>
								</div>

								<div className="flex items-center gap-2">
									<Eye className="h-5 w-5" style={{ color: "#ABA4AA" }} />
									<span style={{ color: "#C3BCC2" }} className="font-semibold">
										{item.views || 0}
									</span>
									<span style={{ color: "#ABA4AA" }} className="text-sm">
										views
									</span>
								</div>

								{item.duration && (
									<div className="flex items-center gap-2">
										<Play className="h-5 w-5" style={{ color: "#ABA4AA" }} />
										<span
											style={{ color: "#C3BCC2" }}
											className="font-semibold"
										>
											{item.duration}
										</span>
									</div>
								)}
							</div>

							{/* Description */}
							<div
								className="rounded-lg p-6 border"
								style={{ backgroundColor: "#606364", borderColor: "#ABA4AA" }}
							>
								<h3
									className="text-lg font-semibold mb-3"
									style={{ color: "#C3BCC2" }}
								>
									Description
								</h3>
								<p
									style={{ color: "#ABA4AA" }}
									className="leading-relaxed whitespace-pre-wrap"
								>
									{item.description || "No description available."}
								</p>
							</div>

							{/* Client Comments */}
							{clientComments.length > 0 && (
								<div
									className="rounded-lg p-6 border mt-6"
									style={{ backgroundColor: "#606364", borderColor: "#ABA4AA" }}
								>
									<h3
										className="text-lg font-semibold mb-4"
										style={{ color: "#C3BCC2" }}
									>
										Client Comments ({clientComments.length})
									</h3>
									<div className="space-y-4">
										{clientComments.map((comment: any) => (
											<div
												key={comment.id}
												className="p-4 rounded-lg border"
												style={{
													backgroundColor: "#2A3133",
													borderColor: "#4A5A70",
												}}
											>
												<div className="flex items-center gap-3 mb-3">
													{comment.client?.avatar ? (
														<img
															src={comment.client.avatar}
															alt={comment.client.name}
															className="w-8 h-8 rounded-full object-cover"
														/>
													) : (
														<div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm text-white font-bold">
															{comment.client?.name?.charAt(0) || "C"}
														</div>
													)}
													<div>
														<div
															className="font-semibold"
															style={{ color: "#C3BCC2" }}
														>
															{comment.client?.name || "Unknown Client"}
														</div>
														<div
															className="text-xs"
															style={{ color: "#ABA4AA" }}
														>
															{new Date(comment.createdAt).toLocaleDateString()}
														</div>
													</div>
												</div>
												<p
													style={{ color: "#ABA4AA" }}
													className="leading-relaxed"
												>
													"{comment.comment}"
												</p>
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Sidebar */}
						<div>
							{/* Actions */}
							<div
								className="rounded-lg p-6 mb-6 border"
								style={{ backgroundColor: "#606364", borderColor: "#ABA4AA" }}
							>
								<h3
									className="text-lg font-semibold mb-4"
									style={{ color: "#C3BCC2" }}
								>
									Actions
								</h3>
								<div className="space-y-3">
									{item.isYoutube ? (
										<button
											onClick={() => window.open(item.url, "_blank")}
											className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium"
											style={{ backgroundColor: "#DC2626", color: "#C3BCC2" }}
											onMouseEnter={(e) => {
												e.currentTarget.style.backgroundColor = "#B91C1C"
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.backgroundColor = "#DC2626"
											}}
										>
											<Play className="h-5 w-5" />
											Watch on YouTube
										</button>
									) : (
										<div className="text-center py-4">
											<p style={{ color: "#ABA4AA" }} className="text-sm">
												🔒 This video is protected and can only be viewed here
											</p>
										</div>
									)}

									{/* Delete Button */}
									<button
										onClick={() => setShowDeleteConfirm(true)}
										className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium border"
										style={{
											backgroundColor: "transparent",
											borderColor: "#DC2626",
											color: "#DC2626",
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = "#DC2626"
											e.currentTarget.style.color = "#C3BCC2"
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = "transparent"
											e.currentTarget.style.color = "#DC2626"
										}}
									>
										<Trash2 className="h-5 w-5" />
										Delete Resource
									</button>
								</div>
							</div>

							{/* Details */}
							<div
								className="rounded-lg p-6 border"
								style={{ backgroundColor: "#606364", borderColor: "#ABA4AA" }}
							>
								<h3
									className="text-lg font-semibold mb-4"
									style={{ color: "#C3BCC2" }}
								>
									Details
								</h3>
								<div className="space-y-3">
									<div className="flex justify-between">
										<span style={{ color: "#ABA4AA" }}>Type:</span>
										<span style={{ color: "#C3BCC2" }} className="capitalize">
											{item.isYoutube ? "YouTube Video" : item.type}
										</span>
									</div>
									<div className="flex justify-between">
										<span style={{ color: "#ABA4AA" }}>Category:</span>
										<span style={{ color: "#C3BCC2" }}>{item.category}</span>
									</div>
									<div className="flex justify-between">
										<span style={{ color: "#ABA4AA" }}>Difficulty:</span>
										<span style={{ color: "#C3BCC2" }}>{item.difficulty}</span>
									</div>
									{item.duration && (
										<div className="flex justify-between">
											<span style={{ color: "#ABA4AA" }}>Duration:</span>
											<span style={{ color: "#C3BCC2" }}>{item.duration}</span>
										</div>
									)}
									{item.filename && (
										<div className="flex justify-between">
											<span style={{ color: "#ABA4AA" }}>File:</span>
											<span
												style={{ color: "#C3BCC2" }}
												className="text-sm truncate"
											>
												{item.filename}
											</span>
										</div>
									)}
									<div className="flex justify-between">
										<span style={{ color: "#ABA4AA" }}>Added:</span>
										<span style={{ color: "#C3BCC2" }}>
											{item.createdAt
												? new Date(item.createdAt).toLocaleDateString()
												: "Unknown"}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-60">
					<div
						className="rounded-lg p-6 w-full max-w-md border"
						style={{
							backgroundColor: "#353A3A",
							borderColor: "#606364",
						}}
					>
						<div className="text-center">
							<div
								className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4"
								style={{ backgroundColor: "#DC2626" }}
							>
								<Trash2 className="h-6 w-6" style={{ color: "#C3BCC2" }} />
							</div>
							<h3
								className="text-lg font-medium mb-2"
								style={{ color: "#C3BCC2" }}
							>
								Delete Resource
							</h3>
							<p className="text-sm mb-6" style={{ color: "#ABA4AA" }}>
								Are you sure you want to delete "{item.title}"? This action
								cannot be undone.
							</p>
							<div className="flex gap-3">
								<button
									onClick={() => setShowDeleteConfirm(false)}
									className="flex-1 py-2 px-4 rounded-lg border transition-all duration-200"
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
								>
									Cancel
								</button>
								<button
									onClick={handleDelete}
									disabled={deleteMutation.isPending}
									className="flex-1 py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
									style={{
										backgroundColor: "#DC2626",
										color: "#C3BCC2",
									}}
									onMouseEnter={(e) => {
										if (!deleteMutation.isPending) {
											e.currentTarget.style.backgroundColor = "#B91C1C"
										}
									}}
									onMouseLeave={(e) => {
										if (!deleteMutation.isPending) {
											e.currentTarget.style.backgroundColor = "#DC2626"
										}
									}}
								>
									{deleteMutation.isPending ? "Deleting..." : "Delete"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
