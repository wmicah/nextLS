"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, X, Volume2, VolumeX } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { trpc } from "@/app/_trpc/client"

interface MessageNotificationProps {
	// Add any props if needed
}

export default function MessageNotification({}: MessageNotificationProps) {
	const [isVisible, setIsVisible] = useState(false)
	const [isMuted, setIsMuted] = useState(false)
	const [notification, setNotification] = useState<any>(null)
	const audio = new Audio("/notification.mp3") // You'll need to add this file

	// Get recent messages to check for new ones
	const { data: recentMessages } = trpc.messages.getRecentMessages.useQuery(
		undefined,
		{
			refetchInterval: 5000, // Check every 5 seconds
			staleTime: 2000,
		}
	)

	const lastMessageRef = useRef<any>(null)

	useEffect(() => {
		if (recentMessages && recentMessages.length > 0) {
			const latestMessage = recentMessages[0]

			// Check if this is a new message (not the same as last one)
			if (lastMessageRef.current?.id !== latestMessage.id) {
				lastMessageRef.current = latestMessage

				// Show notification for new messages
				if (!isMuted) {
					setNotification(latestMessage)
					setIsVisible(true)

					// Play sound
					try {
						audio.play().catch(() => {
							// Ignore audio play errors
						})
					} catch (error) {
						// Ignore audio errors
					}

					// Auto-hide after 5 seconds
					setTimeout(() => {
						setIsVisible(false)
					}, 5000)
				}
			}
		}
	}, [recentMessages, isMuted, audio])

	const handleClose = () => {
		setIsVisible(false)
	}

	const toggleMute = () => {
		setIsMuted(!isMuted)
	}

	if (!isVisible || !notification) return null

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 20, scale: 0.9 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 20, scale: 0.9 }}
				transition={{ duration: 0.3, ease: "easeOut" }}
				className="fixed bottom-24 right-6 z-50"
			>
				<Card className="w-80 shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
					<CardContent className="p-4">
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
									<Bell className="h-5 w-5 text-white" />
								</div>
								<div className="flex-1">
									<h4 className="text-sm font-semibold text-gray-800">
										New Message
									</h4>
									<p className="text-xs text-gray-600 mt-1 line-clamp-2">
										{notification.content}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="sm"
									onClick={toggleMute}
									className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
								>
									{isMuted ? (
										<VolumeX className="h-4 w-4" />
									) : (
										<Volume2 className="h-4 w-4" />
									)}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleClose}
									className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</AnimatePresence>
	)
}
