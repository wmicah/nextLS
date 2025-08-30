"use client"

import { useState, useEffect, useRef } from "react"
import { trpc } from "@/app/_trpc/client"
import { MessageCircle, X, Send, User, Search } from "lucide-react"
import ProfilePictureUploader from "./ProfilePictureUploader"

interface MessagePopupProps {
	isOpen: boolean
	onClose: () => void
}

export default function MessagePopup({ isOpen, onClose }: MessagePopupProps) {
	const [selectedConversation, setSelectedConversation] = useState<
		string | null
	>(null)
	const [messageText, setMessageText] = useState("")
	const [searchTerm, setSearchTerm] = useState("")
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const popupRef = useRef<HTMLDivElement>(null)

	const { data: conversations = [], refetch: refetchConversations } =
		trpc.messaging.getConversations.useQuery(undefined, {
			enabled: isOpen,
			refetchInterval: 5000, // Refresh every 5 seconds
		})

	const { data: messages = [], refetch: refetchMessages } =
		trpc.messaging.getMessages.useQuery(
			{ conversationId: selectedConversation! },
			{
				enabled: !!selectedConversation && isOpen,
				refetchInterval: 3000,
			}
		)

	const sendMessageMutation = trpc.messaging.sendMessage.useMutation({
		onSuccess: () => {
			setMessageText("")
			refetchMessages()
			refetchConversations()
		},
	})

	// Handle click outside to close
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				popupRef.current &&
				!popupRef.current.contains(event.target as Node)
			) {
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

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault()
		if (!messageText.trim() || !selectedConversation) return

		sendMessageMutation.mutate({
			conversationId: selectedConversation,
			content: messageText.trim(),
		})
	}

	const formatTime = (date: string) => {
		const messageDate = new Date(date)
		const now = new Date()
		const diffInHours =
			(now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)

		if (diffInHours < 24) {
			return messageDate.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			})
		} else if (diffInHours < 48) {
			return "Yesterday"
		} else {
			return messageDate.toLocaleDateString([], {
				month: "short",
				day: "numeric",
			})
		}
	}

	const filteredConversations = conversations.filter((conv: any) => {
		if (!searchTerm) return true
		const otherUser =
			conv.coach.id !== conv.messages[0]?.sender?.id ? conv.coach : conv.client
		return (
			otherUser.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			otherUser.email?.toLowerCase().includes(searchTerm.toLowerCase())
		)
	})

	if (!isOpen) return null

	return (
		<div className="fixed bottom-4 right-4 z-50">
			<div
				ref={popupRef}
				className="w-80 h-96 rounded-lg shadow-2xl border flex flex-col"
				style={{
					backgroundColor: "#2D3142",
					borderColor: "#4A5568",
				}}
			>
				{/* Header */}
				<div
					className="flex items-center justify-between p-3 border-b"
					style={{ borderColor: "#4A5568" }}
				>
					<div className="flex items-center gap-2">
						<MessageCircle className="h-5 w-5" style={{ color: "#E2E8F0" }} />
						<h3 className="font-semibold" style={{ color: "#E2E8F0" }}>
							{selectedConversation ? "Chat" : "Messages"}
						</h3>
					</div>
					<div className="flex items-center gap-1">
						{selectedConversation && (
							<button
								onClick={() => setSelectedConversation(null)}
								className="p-1.5 rounded-md hover:bg-gray-600 transition-colors"
							>
								<User className="h-4 w-4" style={{ color: "#CBD5E0" }} />
							</button>
						)}
						<button
							onClick={onClose}
							className="p-1.5 rounded-md hover:bg-gray-600 transition-colors"
						>
							<X className="h-4 w-4" style={{ color: "#CBD5E0" }} />
						</button>
					</div>
				</div>

				{!selectedConversation ? (
					/* Conversations List */
					<div className="flex-1 flex flex-col">
						{/* Search */}
						<div className="p-3 border-b" style={{ borderColor: "#4A5568" }}>
							<div className="relative">
								<Search
									className="absolute left-2.5 top-2.5 h-4 w-4"
									style={{ color: "#9CA3AF" }}
								/>
								<input
									type="text"
									placeholder="Search people"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full pl-9 pr-3 py-2 text-sm rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-blue-400"
									style={{
										backgroundColor: "#374151",
										color: "#E2E8F0",
										// Remove: focusRingColor: "#60A5FA",
									}}
								/>
							</div>
						</div>

						{/* Conversations */}
						<div className="flex-1 overflow-y-auto">
							{filteredConversations.length === 0 ? (
								<div className="p-4 text-center">
									<MessageCircle
										className="h-8 w-8 mx-auto mb-2 opacity-50"
										style={{ color: "#9CA3AF" }}
									/>
									<p className="text-sm" style={{ color: "#9CA3AF" }}>
										{searchTerm ? "No conversations found" : "No messages yet"}
									</p>
								</div>
							) : (
								filteredConversations.map((conversation: any) => {
									const otherUser =
										conversation.coach.id !==
										conversation.messages[0]?.sender?.id
											? conversation.coach
											: conversation.client
									const lastMessage = conversation.messages[0]
									const unreadCount = conversation._count.messages

									return (
										<div
											key={conversation.id}
											className="flex items-center gap-3 p-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 transition-colors"
											onClick={() => setSelectedConversation(conversation.id)}
										>
											<ProfilePictureUploader
												currentAvatarUrl={otherUser?.settings?.avatarUrl}
												userName={otherUser?.name || otherUser?.email || "User"}
												onAvatarChange={() => {}}
												size="sm"
												readOnly={true}
												className="flex-shrink-0"
											/>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between">
													<p
														className="text-sm font-medium truncate"
														style={{ color: "#E2E8F0" }}
													>
														{otherUser.name || otherUser.email.split("@")[0]}
													</p>
													{lastMessage && (
														<span
															className="text-xs flex-shrink-0 ml-2"
															style={{ color: "#9CA3AF" }}
														>
															{formatTime(lastMessage.createdAt)}
														</span>
													)}
												</div>
												<div className="flex items-center justify-between">
													{lastMessage && (
														<p
															className="text-xs truncate"
															style={{ color: "#9CA3AF" }}
														>
															{lastMessage.content}
														</p>
													)}
													{unreadCount > 0 && (
														<span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center ml-2">
															{unreadCount}
														</span>
													)}
												</div>
											</div>
										</div>
									)
								})
							)}
						</div>
					</div>
				) : (
					/* Chat View */
					<div className="flex-1 flex flex-col">
						{/* Messages */}
						<div className="flex-1 overflow-y-auto p-3 space-y-3">
							{messages.map((message: any) => {
								const isCurrentUser =
									message.sender.id ===
									conversations.find((c) => c.id === selectedConversation)
										?.coach.id // You'll need current user context

								return (
									<div
										key={message.id}
										className={`flex ${
											isCurrentUser ? "justify-end" : "justify-start"
										}`}
									>
										<div
											className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
												isCurrentUser
													? "bg-blue-500 text-white rounded-br-sm"
													: "bg-gray-600 text-gray-100 rounded-bl-sm"
											}`}
										>
											<p>{message.content}</p>
											<p
												className={`text-xs mt-1 ${
													isCurrentUser ? "text-blue-100" : "text-gray-400"
												}`}
											>
												{formatTime(message.createdAt)}
											</p>
										</div>
									</div>
								)
							})}
							<div ref={messagesEndRef} />
						</div>

						{/* Message Input */}
						<form
							onSubmit={handleSendMessage}
							className="p-3 border-t"
							style={{ borderColor: "#4A5568" }}
						>
							<div className="flex gap-2">
								<input
									type="text"
									value={messageText}
									onChange={(e) => setMessageText(e.target.value)}
									placeholder="Type a message..."
									className="flex-1 px-3 py-2 text-sm rounded-md border-0 focus:outline-none focus:ring-1"
									style={{
										backgroundColor: "#374151",
										color: "#E2E8F0",
									}}
									disabled={sendMessageMutation.isPending}
								/>
								<button
									type="submit"
									disabled={
										!messageText.trim() || sendMessageMutation.isPending
									}
									className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Send className="h-4 w-4" />
								</button>
							</div>
						</form>
					</div>
				)}
			</div>
		</div>
	)
}
