"use client"

import { useRef, useState, useEffect } from "react"
import { trpc } from "@/app/_trpc/client"
import {
	Play,
	Pause,
	Volume2,
	VolumeX,
	Maximize,
	RotateCcw,
	RotateCw,
	X,
} from "lucide-react"

interface VideoComparisonProps {
	video1Id: string
	video2Id?: string
}

export default function VideoComparison({
	video1Id,
	video2Id,
}: VideoComparisonProps) {
	const video1Ref = useRef<HTMLVideoElement>(null)
	const video2Ref = useRef<HTMLVideoElement>(null)
	const [isPlaying1, setIsPlaying1] = useState(false)
	const [isPlaying2, setIsPlaying2] = useState(false)
	const [currentTime1, setCurrentTime1] = useState(0)
	const [currentTime2, setCurrentTime2] = useState(0)
	const [duration1, setDuration1] = useState(0)
	const [duration2, setDuration2] = useState(0)
	const [volume1, setVolume1] = useState(1)
	const [volume2, setVolume2] = useState(1)
	const [isMuted1, setIsMuted1] = useState(false)
	const [isMuted2, setIsMuted2] = useState(false)
	const [syncPlayback, setSyncPlayback] = useState(true)

	// Get video data
	const { data: videos, isLoading } = trpc.videos.list.useQuery()
	const video1 = videos?.find((v) => v.id === video1Id)
	const video2 = videos?.find((v) => v.id === video2Id)

	useEffect(() => {
		const video1 = video1Ref.current
		const video2 = video2Ref.current

		if (!video1) return

		const handleTimeUpdate1 = () => {
			setCurrentTime1(video1.currentTime)
			if (
				syncPlayback &&
				video2 &&
				Math.abs(video1.currentTime - video2.currentTime) > 0.5
			) {
				video2.currentTime = video1.currentTime
			}
		}

		const handleTimeUpdate2 = () => {
			setCurrentTime2(video2?.currentTime || 0)
			if (
				syncPlayback &&
				video1 &&
				Math.abs((video2?.currentTime || 0) - video1.currentTime) > 0.5
			) {
				video1.currentTime = video2?.currentTime || 0
			}
		}

		const handleLoadedMetadata1 = () => {
			setDuration1(video1.duration)
		}

		const handleLoadedMetadata2 = () => {
			if (video2) setDuration2(video2.duration)
		}

		const handlePlay1 = () => setIsPlaying1(true)
		const handlePause1 = () => setIsPlaying1(false)
		const handlePlay2 = () => setIsPlaying2(true)
		const handlePause2 = () => setIsPlaying2(false)

		video1.addEventListener("timeupdate", handleTimeUpdate1)
		video1.addEventListener("loadedmetadata", handleLoadedMetadata1)
		video1.addEventListener("play", handlePlay1)
		video1.addEventListener("pause", handlePause1)

		if (video2) {
			video2.addEventListener("timeupdate", handleTimeUpdate2)
			video2.addEventListener("loadedmetadata", handleLoadedMetadata2)
			video2.addEventListener("play", handlePlay2)
			video2.addEventListener("pause", handlePause2)
		}

		return () => {
			video1.removeEventListener("timeupdate", handleTimeUpdate1)
			video1.removeEventListener("loadedmetadata", handleLoadedMetadata1)
			video1.removeEventListener("play", handlePlay1)
			video1.removeEventListener("pause", handlePause1)

			if (video2) {
				video2.removeEventListener("timeupdate", handleTimeUpdate2)
				video2.removeEventListener("loadedmetadata", handleLoadedMetadata2)
				video2.removeEventListener("play", handlePlay2)
				video2.removeEventListener("pause", handlePause2)
			}
		}
	}, [syncPlayback])

	const togglePlay1 = () => {
		if (video1Ref.current) {
			if (isPlaying1) {
				video1Ref.current.pause()
			} else {
				video1Ref.current.play()
			}
		}
	}

	const togglePlay2 = () => {
		if (video2Ref.current) {
			if (isPlaying2) {
				video2Ref.current.pause()
			} else {
				video2Ref.current.play()
			}
		}
	}

	const handleSeek1 = (e: React.ChangeEvent<HTMLInputElement>) => {
		const time = parseFloat(e.target.value)
		if (video1Ref.current) {
			video1Ref.current.currentTime = time
			setCurrentTime1(time)
			if (syncPlayback && video2Ref.current) {
				video2Ref.current.currentTime = time
			}
		}
	}

	const handleSeek2 = (e: React.ChangeEvent<HTMLInputElement>) => {
		const time = parseFloat(e.target.value)
		if (video2Ref.current) {
			video2Ref.current.currentTime = time
			setCurrentTime2(time)
			if (syncPlayback && video1Ref.current) {
				video1Ref.current.currentTime = time
			}
		}
	}

	const handleVolumeChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = parseFloat(e.target.value)
		setVolume1(newVolume)
		if (video1Ref.current) {
			video1Ref.current.volume = newVolume
		}
	}

	const handleVolumeChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = parseFloat(e.target.value)
		setVolume2(newVolume)
		if (video2Ref.current) {
			video2Ref.current.volume = newVolume
		}
	}

	const toggleMute1 = () => {
		if (video1Ref.current) {
			video1Ref.current.muted = !isMuted1
			setIsMuted1(!isMuted1)
		}
	}

	const toggleMute2 = () => {
		if (video2Ref.current) {
			video2Ref.current.muted = !isMuted2
			setIsMuted2(!isMuted2)
		}
	}

	const skipBackward = () => {
		const skipTime = 10
		if (video1Ref.current) {
			video1Ref.current.currentTime = Math.max(0, currentTime1 - skipTime)
		}
		if (video2Ref.current) {
			video2Ref.current.currentTime = Math.max(0, currentTime2 - skipTime)
		}
	}

	const skipForward = () => {
		const skipTime = 10
		if (video1Ref.current) {
			video1Ref.current.currentTime = Math.min(
				duration1,
				currentTime1 + skipTime
			)
		}
		if (video2Ref.current) {
			video2Ref.current.currentTime = Math.min(
				duration2,
				currentTime2 + skipTime
			)
		}
	}

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = Math.floor(seconds % 60)
		return `${mins}:${secs.toString().padStart(2, "0")}`
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
			</div>
		)
	}

	if (!video1) {
		return (
			<div className="text-center py-8">
				<p style={{ color: "#9ca3af" }}>Video not found</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold" style={{ color: "#ffffff" }}>
					Video Comparison
				</h2>
				<div className="flex items-center gap-4">
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={syncPlayback}
							onChange={(e) => setSyncPlayback(e.target.checked)}
							className="rounded"
						/>
						<span className="text-sm" style={{ color: "#9ca3af" }}>
							Sync Playback
						</span>
					</label>
				</div>
			</div>

			{/* Video Grid */}
			<div
				className={`grid gap-6 ${
					video2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
				}`}
			>
				{/* Video 1 */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
							{video1.title}
						</h3>
						<span
							className="text-xs px-2 py-1 rounded-full"
							style={{ backgroundColor: "#374151", color: "#9ca3af" }}
						>
							{video1.category}
						</span>
					</div>

					<div className="relative bg-black rounded-xl overflow-hidden">
						<video
							ref={video1Ref}
							src={video1.url}
							className="w-full h-auto"
							controls={false}
						/>

						{/* Video 1 Controls */}
						<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
							<input
								type="range"
								min="0"
								max={duration1 || 0}
								value={currentTime1}
								onChange={handleSeek1}
								className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
								style={{
									background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
										(currentTime1 / (duration1 || 1)) * 100
									}%, #6b7280 ${
										(currentTime1 / (duration1 || 1)) * 100
									}%, #6b7280 100%)`,
								}}
							/>

							<div className="flex items-center justify-between mt-2">
								<div className="flex items-center gap-2">
									<button
										onClick={togglePlay1}
										className="p-2 rounded-lg hover:bg-white/20 transition-colors"
									>
										{isPlaying1 ? (
											<Pause className="w-4 h-4" style={{ color: "#ffffff" }} />
										) : (
											<Play className="w-4 h-4" style={{ color: "#ffffff" }} />
										)}
									</button>

									<span className="text-xs" style={{ color: "#ffffff" }}>
										{formatTime(currentTime1)} / {formatTime(duration1)}
									</span>
								</div>

								<div className="flex items-center gap-2">
									<button
										onClick={toggleMute1}
										className="p-2 rounded-lg hover:bg-white/20 transition-colors"
									>
										{isMuted1 ? (
											<VolumeX
												className="w-3 h-3"
												style={{ color: "#ffffff" }}
											/>
										) : (
											<Volume2
												className="w-3 h-3"
												style={{ color: "#ffffff" }}
											/>
										)}
									</button>

									<input
										type="range"
										min="0"
										max="1"
										step="0.1"
										value={volume1}
										onChange={handleVolumeChange1}
										className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Video 2 */}
				{video2 ? (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3
								className="text-lg font-semibold"
								style={{ color: "#ffffff" }}
							>
								{video2.title}
							</h3>
							<span
								className="text-xs px-2 py-1 rounded-full"
								style={{ backgroundColor: "#374151", color: "#9ca3af" }}
							>
								{video2.category}
							</span>
						</div>

						<div className="relative bg-black rounded-xl overflow-hidden">
							<video
								ref={video2Ref}
								src={video2.url}
								className="w-full h-auto"
								controls={false}
							/>

							{/* Video 2 Controls */}
							<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
								<input
									type="range"
									min="0"
									max={duration2 || 0}
									value={currentTime2}
									onChange={handleSeek2}
									className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
									style={{
										background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
											(currentTime2 / (duration2 || 1)) * 100
										}%, #6b7280 ${
											(currentTime2 / (duration2 || 1)) * 100
										}%, #6b7280 100%)`,
									}}
								/>

								<div className="flex items-center justify-between mt-2">
									<div className="flex items-center gap-2">
										<button
											onClick={togglePlay2}
											className="p-2 rounded-lg hover:bg-white/20 transition-colors"
										>
											{isPlaying2 ? (
												<Pause
													className="w-4 h-4"
													style={{ color: "#ffffff" }}
												/>
											) : (
												<Play
													className="w-4 h-4"
													style={{ color: "#ffffff" }}
												/>
											)}
										</button>

										<span className="text-xs" style={{ color: "#ffffff" }}>
											{formatTime(currentTime2)} / {formatTime(duration2)}
										</span>
									</div>

									<div className="flex items-center gap-2">
										<button
											onClick={toggleMute2}
											className="p-2 rounded-lg hover:bg-white/20 transition-colors"
										>
											{isMuted2 ? (
												<VolumeX
													className="w-3 h-3"
													style={{ color: "#ffffff" }}
												/>
											) : (
												<Volume2
													className="w-3 h-3"
													style={{ color: "#ffffff" }}
												/>
											)}
										</button>

										<input
											type="range"
											min="0"
											max="1"
											step="0.1"
											value={volume2}
											onChange={handleVolumeChange2}
											className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				) : (
					<div
						className="flex items-center justify-center h-64 border-2 border-dashed rounded-xl"
						style={{ borderColor: "#374151" }}
					>
						<div className="text-center">
							<p className="text-sm" style={{ color: "#9ca3af" }}>
								Select a second video to compare
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Global Controls */}
			<div
				className="flex items-center justify-center gap-4 p-4 rounded-xl"
				style={{ backgroundColor: "#2a2a2a" }}
			>
				<button
					onClick={skipBackward}
					className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-700"
					style={{ color: "#ffffff" }}
				>
					<RotateCcw className="w-4 h-4" />
					<span className="text-sm">-10s</span>
				</button>

				<button
					onClick={skipForward}
					className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-700"
					style={{ color: "#ffffff" }}
				>
					<span className="text-sm">+10s</span>
					<RotateCw className="w-4 h-4" />
				</button>
			</div>

			{/* Video Info */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="p-4 rounded-xl" style={{ backgroundColor: "#2a2a2a" }}>
					<h4 className="font-medium mb-2" style={{ color: "#ffffff" }}>
						{video1.title}
					</h4>
					<div className="space-y-1 text-sm" style={{ color: "#9ca3af" }}>
						<p>Uploaded by: {video1.uploader.name}</p>
						<p>Category: {video1.category}</p>
						<p>Duration: {formatTime(duration1)}</p>
						<p>Uploaded: {new Date(video1.createdAt).toLocaleDateString()}</p>
					</div>
				</div>

				{video2 && (
					<div
						className="p-4 rounded-xl"
						style={{ backgroundColor: "#2a2a2a" }}
					>
						<h4 className="font-medium mb-2" style={{ color: "#ffffff" }}>
							{video2.title}
						</h4>
						<div className="space-y-1 text-sm" style={{ color: "#9ca3af" }}>
							<p>Uploaded by: {video2.uploader.name}</p>
							<p>Category: {video2.category}</p>
							<p>Duration: {formatTime(duration2)}</p>
							<p>Uploaded: {new Date(video2.createdAt).toLocaleDateString()}</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
