"use client"

import { BarChart3, RefreshCw } from "lucide-react"
import Sidebar from "./Sidebar"

export default function AnalyticsFallback() {
	return (
		<Sidebar>
			<div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
				{/* Header */}
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
									<div
										className="w-12 h-12 rounded-xl flex items-center justify-center"
										style={{ backgroundColor: "#4A5A70" }}
									>
										<BarChart3
											className="h-6 w-6"
											style={{ color: "#C3BCC2" }}
										/>
									</div>
									<div>
										<h1
											className="text-4xl font-bold mb-2"
											style={{ color: "#C3BCC2" }}
										>
											Analytics Dashboard
										</h1>
										<p
											className="flex items-center gap-2 text-lg"
											style={{ color: "#ABA4AA" }}
										>
											<BarChart3 className="h-5 w-5 text-yellow-400" />
											Data temporarily unavailable
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Error Message */}
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div
							className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
							style={{ backgroundColor: "#EF4444" }}
						>
							<BarChart3 className="h-8 w-8" style={{ color: "#FFFFFF" }} />
						</div>
						<h3
							className="text-xl font-bold mb-2"
							style={{ color: "#C3BCC2" }}
						>
							Analytics Unavailable
						</h3>
						<p className="text-lg mb-4" style={{ color: "#ABA4AA" }}>
							Unable to load analytics data at this time.
						</p>
						<button
							onClick={() => window.location.reload()}
							className="flex items-center gap-2 px-4 py-2 rounded-lg mx-auto"
							style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
						>
							<RefreshCw className="h-4 w-4" />
							Try Again
						</button>
					</div>
				</div>
			</div>
		</Sidebar>
	)
}
