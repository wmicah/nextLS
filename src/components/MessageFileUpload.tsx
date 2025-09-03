"use client"

import { useState, useRef, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { trpc } from "@/app/_trpc/client"
import {
	X,
	File,
	Image as ImageIcon,
	Video,
	Music,
	Paperclip,
	AlertCircle,
} from "lucide-react"

interface MessageFileUploadProps {
	onFileSelect: (
		file: File,
		uploadData: {
			attachmentUrl: string
			attachmentType: string
			attachmentName: string
			attachmentSize: number
		}
	) => void
	onClose: () => void
}

export default function MessageFileUpload({
	onFileSelect,
	onClose,
}: MessageFileUploadProps) {
	const [uploading, setUploading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [uploadProgress, setUploadProgress] = useState(0)

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			if (acceptedFiles.length === 0) return

			const file = acceptedFiles[0]
			setError(null)

			// Validate file size (100MB limit for videos, 50MB for other files)
			const maxSize = file.type.startsWith("video/")
				? 100 * 1024 * 1024
				: 50 * 1024 * 1024
			if (file.size > maxSize) {
				const maxSizeMB = file.type.startsWith("video/") ? "100MB" : "50MB"
				setError(`File size must be less than ${maxSizeMB}`)
				return
			}

			// Validate file type
			const allowedTypes = [
				"image/",
				"video/",
				"audio/",
				"application/pdf",
				"application/msword",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				"text/",
			]

			const isAllowed = allowedTypes.some((type) => file.type.startsWith(type))
			if (!isAllowed) {
				setError("File type not supported")
				return
			}

			try {
				setUploading(true)
				setUploadProgress(0)

				// For now, we'll create a simple file URL using FileReader
				// In a real app, you'd upload to a service like AWS S3, Cloudinary, etc.
				const reader = new FileReader()

				reader.onprogress = (e) => {
					if (e.lengthComputable) {
						const progress = Math.round((e.loaded / e.total) * 100)
						setUploadProgress(progress)
					}
				}

				reader.onload = (e) => {
					const result = e.target?.result as string

					// Create upload data
					const uploadData = {
						attachmentUrl: result,
						attachmentType: file.type,
						attachmentName: file.name,
						attachmentSize: file.size,
					}

					onFileSelect(file, uploadData)
				}

				reader.onerror = () => {
					setError("Failed to read file. File may be too large or corrupted.")
				}

				reader.readAsDataURL(file)
			} catch (err) {
				setError("Failed to upload file")
			} finally {
				setUploading(false)
				setUploadProgress(0)
			}
		},
		[onFileSelect]
	)

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
			"video/*": [".mp4", ".mov", ".avi", ".mkv"],
			"audio/*": [".mp3", ".wav", ".m4a"],
			"application/pdf": [".pdf"],
			"application/msword": [".doc"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
				[".docx"],
			"text/*": [".txt", ".md"],
		},
		maxFiles: 1,
	})

	const getFileIcon = (fileType: string) => {
		if (fileType.startsWith("image/")) return <ImageIcon className="h-6 w-6" />
		if (fileType.startsWith("video/")) return <Video className="h-6 w-6" />
		if (fileType.startsWith("audio/")) return <Music className="h-6 w-6" />
		return <File className="h-6 w-6" />
	}

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes"
		const k = 1024
		const sizes = ["Bytes", "KB", "MB", "GB"]
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-white">Upload File</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
						<AlertCircle className="h-4 w-4 text-red-400" />
						<span className="text-red-400 text-sm">{error}</span>
					</div>
				)}

				<div
					{...getRootProps()}
					className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
						isDragActive
							? "border-blue-500 bg-blue-500/10"
							: "border-gray-600 hover:border-gray-500"
					}`}
				>
					<input {...getInputProps()} />
					<Paperclip className="h-12 w-12 text-gray-400 mx-auto mb-4" />
					{isDragActive ? (
						<p className="text-blue-400">Drop the file here...</p>
					) : (
						<div>
							<p className="text-white mb-2">
								Drag & drop a file here, or click to select
							</p>
							<p className="text-gray-400 text-sm">
								Supports images, videos, audio, PDFs, and documents (videos up
								to 100MB, others up to 50MB)
							</p>
						</div>
					)}
				</div>

				{uploading && (
					<div className="mt-4 space-y-2">
						<div className="flex items-center justify-center gap-2">
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
							<span className="text-gray-300">
								{uploadProgress > 0
									? `Processing... ${uploadProgress}%`
									: "Processing file..."}
							</span>
						</div>
						{uploadProgress > 0 && (
							<div className="w-full bg-gray-700 rounded-full h-2">
								<div
									className="bg-gray-400 h-2 rounded-full transition-all duration-300"
									style={{ width: `${uploadProgress}%` }}
								 />
							</div>
						)}
					</div>
				)}

				<div className="mt-4 flex gap-2">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	)
}
