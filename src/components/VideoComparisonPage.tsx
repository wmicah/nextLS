"use client"

import { useState } from "react"
import VideoComparison from "@/components/VideoComparison"
import { ArrowLeft, Video } from "lucide-react"
import Link from "next/link"
import { trpc } from "@/app/_trpc/client"
import Sidebar from "./Sidebar"

export default function VideoComparisonPage() {
	const [video1Id, setVideo1Id] = useState("")
	const [video2Id, setVideo2Id] = useState("")
	const { data: videos = [] } = trpc.videos.list.useQuery()

	return (
		<Sidebar>
			<div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
				{/* Hero Header */}
				<div className="mb-8">
					<div className="rounded-2xl border relative overflow-hidden group">
						<div
							className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
							style={{
								background:
									"linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
							}}
						/>
						<div className="relative p-8 bg-gradient-to-r from-transparent via-black/20 to-black/40">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<Link
										href="/videos"
										className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
										style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
									>
										<ArrowLeft className="w-4 h-4" />
										<span>Back to Videos</span>
									</Link>
									<div>
										<h1
											className="text-4xl font-bold mb-2"
											style={{ color: "#C3BCC2" }}
										>
											Video Comparison
										</h1>
										<p className="text-lg" style={{ color: "#ABA4AA" }}>
											Compare videos side by side
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Video Selection */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<div className="space-y-4">
						<label
							className="block text-sm font-medium"
							style={{ color: "#C3BCC2" }}
						>
							Primary Video
						</label>
						<select
							value={video1Id}
							onChange={(e) => setVideo1Id(e.target.value)}
							className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
							style={{
								backgroundColor: "#353A3A",
								borderColor: "#606364",
								color: "#C3BCC2",
								border: "1px solid",
							}}
						>
							<option value="">Select a video...</option>
							{videos.map((video) => (
								<option key={video.id} value={video.id}>
									{video.title}
								</option>
							))}
						</select>
					</div>

					<div className="space-y-4">
						<label
							className="block text-sm font-medium"
							style={{ color: "#C3BCC2" }}
						>
							Comparison Video (Optional)
						</label>
						<select
							value={video2Id}
							onChange={(e) => setVideo2Id(e.target.value)}
							className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
							style={{
								backgroundColor: "#353A3A",
								borderColor: "#606364",
								color: "#C3BCC2",
								border: "1px solid",
							}}
						>
							<option value="">Select a video...</option>
							{videos.map((video) => (
								<option key={video.id} value={video.id}>
									{video.title}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Video Comparison Component */}
				{video1Id ? (
					<VideoComparison
						video1Id={video1Id}
						video2Id={video2Id || undefined}
					/>
				) : (
					<div className="text-center py-12">
						<div
							className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
							style={{ backgroundColor: "#353A3A" }}
						>
							<Video className="w-12 h-12" style={{ color: "#ABA4AA" }} />
						</div>
						<h3
							className="text-2xl font-bold mb-3"
							style={{ color: "#C3BCC2" }}
						>
							Select a video to start comparing
						</h3>
						<p className="text-lg" style={{ color: "#ABA4AA" }}>
							Choose at least one video to begin the comparison
						</p>
					</div>
				)}
			</div>
		</Sidebar>
	)
}
