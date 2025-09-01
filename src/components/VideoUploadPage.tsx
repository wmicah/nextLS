"use client"

import VideoUpload from "@/components/VideoUpload"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Sidebar from "./Sidebar"

export default function VideoUploadPage() {
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
											Upload Video
										</h1>
										<p className="text-lg" style={{ color: "#ABA4AA" }}>
											Upload bullpen or practice clips for review
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Upload Component */}
				<div className="max-w-4xl mx-auto">
					<VideoUpload />
				</div>
			</div>
		</Sidebar>
	)
}







<<<<<<< HEAD
=======

>>>>>>> d7c42b1 (Re-initialize repository)
