"use client"

import { useState, useRef } from "react"
import { Mic, Square, Play, Pause, Trash2, Save } from "lucide-react"
// import { UploadButton } from "@uploadthing/react"
// import type { OurFileRouter } from "@/app/api/uploadthing/core"

interface AudioRecorderProps {
	onSaveAudio: (audioData: {
		url: string
		duration: number
		timestamp: number
		title?: string
	}) => void
	videoTimestamp: number
}

export default function AudioRecorder({
	onSaveAudio,
	videoTimestamp,
}: AudioRecorderProps) {
	const [isRecording, setIsRecording] = useState(false)
	const [isPlaying, setIsPlaying] = useState(false)
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
	const [audioUrl, setAudioUrl] = useState<string | null>(null)
	const [duration, setDuration] = useState(0)
	const [title, setTitle] = useState("")
	const [isUploading, setIsUploading] = useState(false)

	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const audioChunksRef = useRef<Blob[]>([])
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const startTimeRef = useRef<number>(0)

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			const mediaRecorder = new MediaRecorder(stream)
			mediaRecorderRef.current = mediaRecorder
			audioChunksRef.current = []

			mediaRecorder.ondataavailable = (event) => {
				audioChunksRef.current.push(event.data)
			}

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunksRef.current, {
					type: "audio/wav",
				})
				const audioUrl = URL.createObjectURL(audioBlob)
				setAudioBlob(audioBlob)
				setAudioUrl(audioUrl)

				// Calculate duration from start time
				const endTime = Date.now()
				const recordedDuration = (endTime - startTimeRef.current) / 1000
				setDuration(recordedDuration)
			}

			mediaRecorder.start()
			setIsRecording(true)
			startTimeRef.current = Date.now()
		} catch (error) {
			console.error("Error starting recording:", error)
		}
	}

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop()
			mediaRecorderRef.current.stream
				.getTracks()
				.forEach((track) => track.stop())
			setIsRecording(false)
		}
	}

	const playAudio = () => {
		if (audioRef.current) {
			audioRef.current.play()
			setIsPlaying(true)
		}
	}

	const pauseAudio = () => {
		if (audioRef.current) {
			audioRef.current.pause()
			setIsPlaying(false)
		}
	}

	const handleAudioEnded = () => {
		setIsPlaying(false)
	}

	const handleSave = async () => {
		if (!audioBlob) return

		setIsUploading(true)
		// For now, we'll simulate the upload process
		// In a real implementation, you'd upload to UploadThing
		setTimeout(() => {
			onSaveAudio({
				url: audioUrl || "",
				duration,
				timestamp: videoTimestamp,
				title: title.trim() || undefined,
			})
			setIsUploading(false)
			setAudioBlob(null)
			setAudioUrl(null)
			setTitle("")
			setDuration(0)
		}, 1000)
	}

	const handleDelete = () => {
		setAudioBlob(null)
		setAudioUrl(null)
		setTitle("")
		setDuration(0)
		if (audioRef.current) {
			audioRef.current.pause()
			setIsPlaying(false)
		}
	}

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = Math.floor(seconds % 60)
		return `${mins}:${secs.toString().padStart(2, "0")}`
	}

	return (
		<div className="space-y-4">
			{/* Recording Controls */}
			<div className="p-4 rounded-xl" style={{ backgroundColor: "#2a2a2a" }}>
				{!audioBlob ? (
					<div className="flex justify-center">
						<button
							onClick={isRecording ? stopRecording : startRecording}
							className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg ${
								isRecording
									? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
									: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
							}`}
							style={{ color: "#ffffff" }}
						>
							{isRecording ? (
								<Square className="w-5 h-5" />
							) : (
								<Mic className="w-5 h-5" />
							)}
							<span className="text-base">
								{isRecording ? "Stop Recording" : "Start Recording"}
							</span>
						</button>
					</div>
				) : (
					<div className="flex flex-col items-center gap-3">
						<div
							className="text-center px-4 py-3 rounded-lg"
							style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
						>
							<div
								className="text-xl font-mono font-bold"
								style={{ color: "#ffffff" }}
							>
								{formatTime(duration)}
							</div>
							<div className="text-xs font-medium" style={{ color: "#9ca3af" }}>
								Duration
							</div>
						</div>

						<div className="flex items-center gap-3">
							<button
								onClick={isPlaying ? pauseAudio : playAudio}
								className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 bg-green-500 hover:bg-green-600 shadow-md hover:shadow-lg shadow-green-500/20"
								style={{ color: "#ffffff" }}
							>
								{isPlaying ? (
									<Pause className="w-4 h-4" />
								) : (
									<Play className="w-4 h-4" />
								)}
								<span className="text-sm font-medium">
									{isPlaying ? "Pause" : "Play"}
								</span>
							</button>

							<button
								onClick={handleDelete}
								className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg shadow-red-500/20"
								style={{ color: "#ffffff" }}
							>
								<Trash2 className="w-4 h-4" />
								<span className="text-sm font-medium">Delete</span>
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Audio Player */}
			{audioUrl && (
				<audio
					ref={audioRef}
					src={audioUrl}
					onEnded={handleAudioEnded}
					className="w-full"
				/>
			)}

			{/* Title Input and Save */}
			{audioBlob && (
				<div className="p-4 rounded-xl" style={{ backgroundColor: "#2a2a2a" }}>
					<div className="space-y-4">
						<div>
							<label
								className="block text-sm font-medium mb-2"
								style={{ color: "#9ca3af" }}
							>
								Audio Note Title (Optional)
							</label>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g., Mechanics feedback at 0:30"
								className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
								style={{
									backgroundColor: "#374151",
									borderColor: "#606364",
									color: "#ffffff",
									border: "1px solid",
								}}
							/>
						</div>

						<div className="flex justify-center">
							<button
								onClick={handleSave}
								disabled={isUploading}
								className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 font-medium shadow-md hover:shadow-lg"
								style={{
									backgroundColor: isUploading ? "#374151" : "#059669",
									color: "#ffffff",
									boxShadow: isUploading
										? "0 2px 4px -1px rgba(0, 0, 0, 0.1)"
										: "0 2px 4px -1px rgba(5, 150, 105, 0.2)",
								}}
							>
								{isUploading ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
										<span className="text-base">Saving...</span>
									</>
								) : (
									<>
										<Save className="w-4 h-4" />
										<span className="text-base">Save Audio Note</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
