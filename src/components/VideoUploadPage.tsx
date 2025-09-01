"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Upload, Video, FileText } from "lucide-react"

export default function VideoUploadPage() {
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [videoFile, setVideoFile] = useState<File | null>(null)
	const [isUploading, setIsUploading] = useState(false)

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			setVideoFile(file)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!videoFile) return

		setIsUploading(true)
		// TODO: Implement video upload logic
		console.log("Uploading video:", { title, description, videoFile })

		// Simulate upload delay
		setTimeout(() => {
			setIsUploading(false)
			setTitle("")
			setDescription("")
			setVideoFile(null)
		}, 2000)
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-2xl mx-auto">
				<Card className="bg-[#2A3133] border-gray-600">
					<CardHeader>
						<CardTitle className="text-white flex items-center gap-2">
							<Video className="h-5 w-5" />
							Upload Video
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<Label htmlFor="title" className="text-white">
									Video Title
								</Label>
								<Input
									id="title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="bg-[#3A4245] border-gray-600 text-white"
									placeholder="Enter video title"
									required
								/>
							</div>

							<div>
								<Label htmlFor="description" className="text-white">
									Description
								</Label>
								<Textarea
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="bg-[#3A4245] border-gray-600 text-white"
									placeholder="Enter video description"
									rows={3}
								/>
							</div>

							<div>
								<Label htmlFor="video" className="text-white">
									Video File
								</Label>
								<Input
									id="video"
									type="file"
									accept="video/*"
									onChange={handleFileChange}
									className="bg-[#3A4245] border-gray-600 text-white"
									required
								/>
							</div>

							<Button
								type="submit"
								disabled={!videoFile || isUploading}
								className="w-full bg-blue-600 hover:bg-blue-700"
							>
								{isUploading ? (
									<>
										<Upload className="h-4 w-4 mr-2 animate-spin" />
										Uploading...
									</>
								) : (
									<>
										<Upload className="h-4 w-4 mr-2" />
										Upload Video
									</>
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
