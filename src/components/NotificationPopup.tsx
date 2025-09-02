"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
	Bell,
	X,
	Check,
	User,
	MessageSquare,
	Calendar,
	FileText,
	Users,
	Target,
	TrendingUp,
	Play,
	Plus,
	Shield,
	HelpCircle,
	Info,
	Star,
	DollarSign,
	MessageSquare as MessageIcon,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { trpc } from "@/app/_trpc/client"

interface NotificationPopupProps {
	isOpen: boolean
	onClose: () => void
}

export default function NotificationPopup({
	isOpen,
	onClose,
}: NotificationPopupProps) {
	const popupRef = useRef<HTMLDivElement>(null)

	// Get notifications from user router
	const { data: notifications = [], refetch: refetchNotifications } =
		trpc.user.getNotifications.useQuery(
			{ limit: 20, unreadOnly: false },
			{
				enabled: isOpen,
				refetchInterval: 5000, // Real-time updates every 5 seconds
				staleTime: 2000, // Consider data stale after 2 seconds
			}
		)

	// Get unread count from user router
	const { data: unreadCount = 0 } = trpc.user.getUnreadCount.useQuery(
		undefined,
		{
			refetchInterval: 3000,
			staleTime: 1000,
		}
	)

	// Mark as read mutation from user router
	const markAsReadMutation = trpc.user.markNotificationRead.useMutation({
		onSuccess: () => {
			refetchNotifications()
		},
	})

	// Handle click outside to close
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Element
			if (isOpen && !target.closest("[data-notification-popup]")) {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside)
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [isOpen, onClose])

	const handleMarkAsRead = (notificationId: string) => {
		markAsReadMutation.mutate({ notificationId })
	}

	const handleMarkAllAsRead = () => {
		// Mark all as read functionality would need to be implemented
		console.log("Mark all as read")
	}

	// Get notification icon based on type
	const getNotificationIcon = (type: string) => {
		switch (type) {
			case "CLIENT_JOIN_REQUEST":
				return <User className="h-4 w-4" />
			case "MESSAGE":
				return <MessageSquare className="h-4 w-4" />
			case "SCHEDULE":
				return <Calendar className="h-4 w-4" />
			case "PROGRAM":
				return <FileText className="h-4 w-4" />
			case "CLIENT_ADDED":
				return <Users className="h-4 w-4" />
			case "TRAINING":
				return <Target className="h-4 w-4" />
			case "PROGRESS":
				return <TrendingUp className="h-4 w-4" />
			case "VIDEO":
				return <Play className="h-4 w-4" />
			case "ASSIGNMENT":
				return <Plus className="h-4 w-4" />
			case "SECURITY":
				return <Shield className="h-4 w-4" />
			case "HELP":
				return <HelpCircle className="h-4 w-4" />
			case "INFO":
				return <Info className="h-4 w-4" />
			case "FEATURES":
				return <Star className="h-4 w-4" />
			case "PRICING":
				return <DollarSign className="h-4 w-4" />
			default:
				return <Bell className="h-4 w-4" />
		}
	}

	// Get notification color based on type
	const getNotificationColor = (type: string) => {
		switch (type) {
			case "CLIENT_JOIN_REQUEST":
				return "bg-blue-100 text-blue-800 border-blue-200"
			case "MESSAGE":
				return "bg-green-100 text-green-800 border-green-200"
			case "SCHEDULE":
				return "bg-purple-100 text-purple-800 border-purple-200"
			case "PROGRAM":
				return "bg-orange-100 text-orange-800 border-orange-200"
			case "CLIENT_ADDED":
				return "bg-indigo-100 text-indigo-800 border-indigo-200"
			case "TRAINING":
				return "bg-red-100 text-red-800 border-red-200"
			case "PROGRESS":
				return "bg-emerald-100 text-emerald-800 border-emerald-200"
			case "VIDEO":
				return "bg-cyan-100 text-cyan-800 border-cyan-200"
			case "ASSIGNMENT":
				return "bg-pink-100 text-pink-800 border-pink-200"
			case "SECURITY":
				return "bg-gray-100 text-gray-800 border-gray-200"
			case "HELP":
				return "bg-yellow-100 text-yellow-800 border-yellow-200"
			case "INFO":
				return "bg-slate-100 text-slate-800 border-slate-200"
			case "FEATURES":
				return "bg-amber-100 text-amber-800 border-amber-200"
			case "PRICING":
				return "bg-teal-100 text-teal-800 border-teal-200"
			default:
				return "bg-gray-100 text-gray-800 border-gray-200"
		}
	}

	// Format notification time
	const formatNotificationTime = (date: string) => {
		const notificationDate = new Date(date)
		const now = new Date()
		const diffInHours =
			(now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60)

		if (diffInHours < 1) {
			const diffInMinutes = Math.floor(diffInHours * 60)
			return `${diffInMinutes}m ago`
		} else if (diffInHours < 24) {
			return `${Math.floor(diffInHours)}h ago`
		} else {
			return format(notificationDate, "MMM d")
		}
	}

	if (!isOpen) return null

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 10, scale: 0.95 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 10, scale: 0.95 }}
				transition={{ duration: 0.2, ease: "easeOut" }}
				className="absolute bottom-full right-0 mb-2 z-50"
				data-notification-popup
			>
				<Card className="w-80 shadow-2xl border-0 bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
					<CardHeader className="pb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Bell className="h-5 w-5" />
								<CardTitle className="text-lg font-semibold">
									Notifications
								</CardTitle>
								{unreadCount > 0 && (
									<Badge variant="secondary" className="bg-white/20 text-white">
										{unreadCount}
									</Badge>
								)}
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={onClose}
								className="h-8 w-8 p-0 text-white hover:bg-white/20"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</CardHeader>

					<CardContent className="p-0 max-h-96 overflow-y-auto">
						{/* Notifications List */}
						<div className="p-4">
							{notifications.length === 0 ? (
								<div className="text-center py-8">
									<Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
									<p className="text-gray-500 text-sm">No notifications yet</p>
								</div>
							) : (
								<div className="space-y-3">
									{(notifications as any[]).map((notification) => (
										<div
											key={notification.id}
											className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
												!notification.isRead
													? "bg-blue-50 border-blue-200"
													: "bg-gray-50 border-gray-200"
											}`}
											onClick={() => {
												if (!notification.isRead) {
													handleMarkAsRead(notification.id)
												}
											}}
										>
											<div
												className="flex items-start gap-3"
												style={{
													backgroundColor: !notification.isRead
														? "rgba(59, 130, 246, 0.05)"
														: "transparent",
												}}
											>
												<div
													className={`mt-1 p-2 rounded-full border ${getNotificationColor(
														notification.type
													)}`}
												>
													{getNotificationIcon(notification.type)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<h4
															className={`text-sm ${
																!notification.isRead ? "font-semibold" : ""
															} text-gray-800 truncate`}
														>
															{notification.title}
														</h4>
														{!notification.isRead && (
															<div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
														)}
													</div>
													<p className="text-xs text-gray-600 mb-2 line-clamp-2">
														{notification.message}
													</p>
													<div className="flex items-center justify-between">
														<span className="text-xs text-gray-500">
															{formatNotificationTime(notification.createdAt)}
														</span>
														{notification.type === "CLIENT_JOIN_REQUEST" && (
															<div className="flex gap-1">
																<Button
																	size="sm"
																	variant="outline"
																	className="h-6 px-2 text-xs"
																>
																	Accept
																</Button>
																<Button
																	size="sm"
																	variant="outline"
																	className="h-6 px-2 text-xs"
																>
																	Decline
																</Button>
															</div>
														)}
													</div>
												</div>
												{!notification.isRead && (
													<Button
														variant="ghost"
														size="sm"
														onClick={(e) => {
															e.stopPropagation()
															handleMarkAsRead(notification.id)
														}}
														className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
													>
														<Check className="h-3 w-3" />
													</Button>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Footer Actions */}
						{notifications.length > 0 && (
							<div className="border-t border-gray-200 p-3 bg-gray-50">
								<div className="flex items-center justify-between">
									<Button
										variant="ghost"
										size="sm"
										onClick={handleMarkAllAsRead}
										className="text-xs text-gray-600 hover:text-gray-800"
									>
										Mark all as read
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											// Could navigate to a full notifications page here
											console.log("View all notifications")
										}}
										className="text-xs text-blue-600 hover:text-blue-800"
									>
										View all notifications
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</AnimatePresence>
	)
}

// Helper function for date formatting
function format(date: Date, format: string): string {
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	]

	if (format === "MMM d") {
		return `${months[date.getMonth()]} ${date.getDate()}`
	}

	return date.toLocaleDateString()
}
