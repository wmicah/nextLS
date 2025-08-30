"use client"

import { useState, useEffect, useRef } from "react"
// import { useRouter } from "next/navigation"
import { trpc } from "@/app/_trpc/client"
import {
	Search,
	Plus,
	MoreVertical,
	Send,
	Paperclip,
	File,
	CheckCheck,
	X,
	ArrowLeft,
} from "lucide-react"
import ClientSidebar from "./ClientSidebar"
import { format } from "date-fns"
import MessageFileUpload from "./MessageFileUpload"
import MessageNotification from "./MessageNotification"
import ProfilePictureUploader from "./ProfilePictureUploader"

interface ClientMessagesPageProps {
	// Add props here if needed in the future
}

export default function ClientMessagesPage({}: ClientMessagesPageProps) {
	// const router = useRouter()
	const [selectedConversation, setSelectedConversation] = useState<
		string | null
	>(null)
	const [searchTerm, setSearchTerm] = useState("")
	const [messageText, setMessageText] = useState("")
	// const [isTyping, setIsTyping] = useState(false)
	// const [showEmojiPicker, setShowEmojiPicker] = useState(false)
	const [showFileUpload, setShowFileUpload] = useState(false)
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [clientSearchTerm, setClientSearchTerm] = useState("")
	const [selectedFile, setSelectedFile] = useState<{
		file: File
		uploadData: {
			attachmentUrl: string
			attachmentType: string
			attachmentName: string
			attachmentSize: number
		}
	} | null>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	// const fileInputRef = useRef<HTMLInputElement>(null)

	// Get current user info
	const { data: currentUser } = trpc.user.getProfile.useQuery()

	// Get conversations
	const { data: conversations = [], refetch: refetchConversations } =
		trpc.messaging.getConversations.useQuery(undefined, {
			refetchInterval: 5000,
		})

	// Get messages for selected conversation
	const { data: messages = [], refetch: refetchMessages } =
		trpc.messaging.getMessages.useQuery(
			{ conversationId: selectedConversation! },
			{ enabled: !!selectedConversation, refetchInterval: 3000 }
		)

	// Get unread count
	const { data: unreadCount = 0 } = trpc.messaging.getUnreadCount.useQuery()

	// Get other clients for conversation creation (clients with same coach)
	const { data: otherClients = [] } = trpc.clients.getOtherClients.useQuery()

	// Mutations
	const sendMessageMutation = trpc.messaging.sendMessage.useMutation({
		onSuccess: () => {
			setMessageText("")
			setSelectedFile(null)
			refetchMessages()
			refetchConversations()
		},
		onError: (error) => {
			console.error("Failed to send message:", error)
		},
	})

	const createConversationMutation =
		trpc.messaging.createConversationWithAnotherClient.useMutation({
			onSuccess: (conversation) => {
				setSelectedConversation(conversation.id)
				refetchConversations()
				setShowCreateModal(false)
				setClientSearchTerm("")
			},
			onError: (error) => {
				console.error("Failed to create conversation:", error)
			},
		})

	// Get current user for sidebar
	const { data: authData } = trpc.authCallback.useQuery()
	const sidebarUser = authData?.user

	// Auto-select first conversation if none selected
	useEffect(() => {
		if (!selectedConversation && conversations.length > 0) {
			setSelectedConversation(conversations[0].id)
		}
	}, [conversations, selectedConversation])

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault()
		if (!messageText.trim() && !selectedFile) return

		sendMessageMutation.mutate({
			conversationId: selectedConversation!,
			content: messageText.trim(),
			...(selectedFile && {
				attachmentUrl: selectedFile.uploadData.attachmentUrl,
				attachmentType: selectedFile.uploadData.attachmentType,
				attachmentName: selectedFile.uploadData.attachmentName,
				attachmentSize: selectedFile.uploadData.attachmentSize,
			}),
		})
	}

	const handleFileSelect = (
		file: File,
		uploadData: {
			attachmentUrl: string
			attachmentType: string
			attachmentName: string
			attachmentSize: number
		}
	) => {
		setSelectedFile({ file, uploadData })
		setShowFileUpload(false)
	}

	const handleCreateConversation = (otherClientId: string) => {
		createConversationMutation.mutate({ otherClientId })
	}

	const filteredConversations = conversations.filter(
		(conversation: {
			id: string
			type: string
			client1?: { id: string; name?: string; email?: string }
			client2?: { id: string; name?: string; email?: string }
			coach?: { name?: string; email?: string }
		}) => {
			if (!searchTerm) return true

			// For client-client conversations, check both client names
			if (conversation.type === "CLIENT_CLIENT") {
				const client1Name =
					conversation.client1?.name || conversation.client1?.email || ""
				const client2Name =
					conversation.client2?.name || conversation.client2?.email || ""
				return (
					client1Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					client2Name.toLowerCase().includes(searchTerm.toLowerCase())
				)
			}

			// For coach-client conversations, check coach name
			const coachName =
				conversation.coach?.name || conversation.coach?.email || ""
			return coachName.toLowerCase().includes(searchTerm.toLowerCase())
		}
	)

	const filteredClients = otherClients.filter(
		(client: {
			id: string
			name?: string
			email?: string
			avatar?: string
			userId?: string
		}) => {
			if (!clientSearchTerm) return true
			const searchLower = clientSearchTerm.toLowerCase()
			return (
				client.name?.toLowerCase().includes(searchLower) ||
				client.email?.toLowerCase().includes(searchLower)
			)
		}
	)

	return (
		<ClientSidebar
			user={
				sidebarUser
					? { name: sidebarUser.name, email: sidebarUser.email }
					: undefined
			}
		>
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
									<div>
										<h1
											className="text-4xl font-bold mb-2"
											style={{ color: "#C3BCC2" }}
										>
											Messages
										</h1>
										<div
											className="flex items-center gap-2 text-lg"
											style={{ color: "#ABA4AA" }}
										>
											<div className="h-5 w-5 rounded-full bg-gray-500 flex items-center justify-center">
												<File className="h-3 w-3 text-white" />
											</div>
											<span>
												{conversations.length > 0
													? `Stay connected with ${conversations.length} ${
															conversations.length === 1
																? "conversation"
																: "conversations"
													  }`
													: "Start building relationships with your coach and teammates"}
											</span>
										</div>
									</div>
								</div>
								<div className="text-right">
									<div
										className="text-2xl font-bold"
										style={{ color: "#C3BCC2" }}
									>
										{unreadCount > 0
											? `${unreadCount} unread`
											: "All caught up"}
									</div>
									<div className="text-sm" style={{ color: "#ABA4AA" }}>
										{new Date().toLocaleDateString("en-US", {
											weekday: "long",
										})}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Messages Interface */}
				<div
					className="flex h-[calc(100vh-200px)] rounded-3xl border overflow-hidden shadow-2xl"
					style={{
						backgroundColor: "#1E1E1E",
						borderColor: "#2a2a2a",
						boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
					}}
				>
					{/* Conversations Sidebar */}
					<div
						className="w-80 border-r flex flex-col"
						style={{ borderColor: "#2a2a2a", backgroundColor: "#2a2a2a" }}
					>
						{/* Header */}
						<div className="p-6 border-b" style={{ borderColor: "#2a2a2a" }}>
							<div className="flex items-center justify-between mb-6">
								<h2
									className="text-2xl font-bold tracking-tight"
									style={{ color: "#ffffff" }}
								>
									Conversations
								</h2>
								<button
									onClick={() => setShowCreateModal(true)}
									className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
									style={{ backgroundColor: "#E0E0E0", color: "#000000" }}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = "#E0E0E1"
										e.currentTarget.style.transform = "scale(1.1)"
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = "#E0E0E0"
										e.currentTarget.style.transform = "scale(1)"
									}}
								>
									<Plus className="h-5 w-5" />
								</button>
							</div>

							{/* Search */}
							<div className="relative">
								<Search
									className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
									style={{ color: "#ABA4AA" }}
								/>
								<input
									type="text"
									placeholder="Search conversations..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full pl-10 pr-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 transition-all duration-200"
									style={{
										backgroundColor: "#353A3A",
										color: "#C3BCC2",
										borderColor: "#606364",
									}}
									onFocus={(e) => {
										e.currentTarget.style.borderColor = "#4A5A70"
									}}
									onBlur={(e) => {
										e.currentTarget.style.borderColor = "#606364"
									}}
								/>
							</div>
						</div>

						{/* Conversations List */}
						<div className="flex-1 overflow-y-auto">
							{filteredConversations.length === 0 ? (
								<div className="p-6 text-center">
									<File
										className="h-12 w-12 mx-auto mb-4 opacity-50"
										style={{ color: "#ABA4AA" }}
									/>
									<p className="text-sm" style={{ color: "#ABA4AA" }}>
										{searchTerm
											? "No conversations found"
											: "No conversations yet"}
									</p>
								</div>
							) : (
								filteredConversations.map(
									(conversation: {
										id: string
										type: string
										client1?: {
											id: string
											name?: string
											email?: string
											settings?: { avatarUrl?: string }
										}
										client2?: {
											id: string
											name?: string
											email?: string
											settings?: { avatarUrl?: string }
										}
										coach?: {
											name?: string
											email?: string
											settings?: { avatarUrl?: string }
										}
										messages: Array<{ createdAt: string; content: string }>
										_count?: { messages: number }
									}) => {
										// Determine the other participant
										let otherParticipant
										let conversationType

										if (conversation.type === "CLIENT_CLIENT") {
											// For client-client conversations, show the other client
											otherParticipant =
												conversation.client1?.id === currentUser?.id
													? conversation.client2
													: conversation.client1
											conversationType = "Client"
										} else {
											// For coach-client conversations, show the coach
											otherParticipant = conversation.coach
											conversationType = "Coach"
										}

										const lastMessage = conversation.messages[0]
										const unreadCount = conversation._count?.messages || 0

										return (
											<div
												key={conversation.id}
												className={`p-4 cursor-pointer transition-all duration-200 border-b ${
													selectedConversation === conversation.id
														? "bg-blue-500/10 border-blue-500/20"
														: "border-gray-700 hover:bg-gray-800/50"
												}`}
												onClick={() => setSelectedConversation(conversation.id)}
											>
												<div className="flex items-center gap-3">
													<ProfilePictureUploader
														currentAvatarUrl={
															otherParticipant?.settings?.avatarUrl
														}
														userName={
															otherParticipant?.name ||
															otherParticipant?.email ||
															"User"
														}
														onAvatarChange={() => {}}
														size="md"
														readOnly={true}
														className="flex-shrink-0"
													/>
													<div className="flex-1 min-w-0">
														<div className="flex items-center justify-between">
															<p
																className="font-medium truncate"
																style={{ color: "#C3BCC2" }}
															>
																{otherParticipant?.name ||
																	otherParticipant?.email?.split("@")[0] ||
																	"Unknown"}
															</p>
															{lastMessage && (
																<span
																	className="text-xs flex-shrink-0 ml-2"
																	style={{ color: "#ABA4AA" }}
																>
																	{format(
																		new Date(lastMessage.createdAt),
																		"HH:mm"
																	)}
																</span>
															)}
														</div>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-2">
																<span
																	className="text-xs px-2 py-1 rounded-full"
																	style={{
																		backgroundColor:
																			conversation.type === "CLIENT_CLIENT"
																				? "#4A5A70"
																				: "#E0E0E0",
																		color:
																			conversation.type === "CLIENT_CLIENT"
																				? "#C3BCC2"
																				: "#000000",
																	}}
																>
																	{conversationType}
																</span>
																{lastMessage && (
																	<p
																		className="text-sm truncate"
																		style={{ color: "#ABA4AA" }}
																	>
																		{lastMessage.content}
																	</p>
																)}
															</div>
															{unreadCount > 0 && (
																<span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
																	{unreadCount}
																</span>
															)}
														</div>
													</div>
												</div>
											</div>
										)
									}
								)
							)}
						</div>
					</div>

					{/* Chat Area */}
					<div
						className="flex-1 flex flex-col"
						style={{ backgroundColor: "#1E1E1E" }}
					>
						{selectedConversation ? (
							<>
								{/* Chat Header */}
								<div
									className="p-6 border-b"
									style={{ borderColor: "#2a2a2a" }}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<button
												onClick={() => setSelectedConversation(null)}
												className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
											>
												<ArrowLeft
													className="h-5 w-5"
													style={{ color: "#C3BCC2" }}
												/>
											</button>
											<ProfilePictureUploader
												currentAvatarUrl={(() => {
													const conversation = conversations.find(
														(c: {
															id: string
															type: string
															client1?: { id: string }
															client2?: {
																id: string
																settings?: { avatarUrl?: string }
															}
															coach?: { settings?: { avatarUrl?: string } }
														}) => c.id === selectedConversation
													)
													if (conversation?.type === "CLIENT_CLIENT") {
														const otherClient =
															conversation.client1?.id === currentUser?.id
																? conversation.client2
																: conversation.client1
														return otherClient?.settings?.avatarUrl
													} else {
														return conversation?.coach?.settings?.avatarUrl
													}
												})()}
												userName={(() => {
													const conversation = conversations.find(
														(c: {
															id: string
															type: string
															client1?: {
																id: string
																name?: string
																email?: string
															}
															client2?: {
																id: string
																name?: string
																email?: string
															}
															coach?: { name?: string; email?: string }
														}) => c.id === selectedConversation
													)
													if (conversation?.type === "CLIENT_CLIENT") {
														const otherClient =
															conversation.client1?.id === currentUser?.id
																? conversation.client2
																: conversation.client1
														return (
															otherClient?.name || otherClient?.email || "User"
														)
													} else {
														return (
															conversation?.coach?.name ||
															conversation?.coach?.email ||
															"User"
														)
													}
												})()}
												onAvatarChange={() => {}}
												size="md"
												readOnly={true}
												className="flex-shrink-0"
											/>
											<div>
												<h3
													className="font-semibold"
													style={{ color: "#C3BCC2" }}
												>
													{(() => {
														const conversation = conversations.find(
															(c: {
																id: string
																type: string
																client1?: {
																	id: string
																	name?: string
																	email?: string
																}
																client2?: {
																	id: string
																	name?: string
																	email?: string
																}
																coach?: { name?: string; email?: string }
															}) => c.id === selectedConversation
														)
														if (conversation?.type === "CLIENT_CLIENT") {
															const otherClient =
																conversation.client1?.id === currentUser?.id
																	? conversation.client2
																	: conversation.client1
															return (
																otherClient?.name ||
																otherClient?.email?.split("@")[0] ||
																"Unknown"
															)
														} else {
															return (
																conversation?.coach?.name ||
																conversation?.coach?.email?.split("@")[0] ||
																"Unknown"
															)
														}
													})()}
												</h3>
												<p className="text-sm" style={{ color: "#ABA4AA" }}>
													{(() => {
														const conversation = conversations.find(
															(c: { id: string; type: string }) =>
																c.id === selectedConversation
														)
														return conversation?.type === "CLIENT_CLIENT"
															? "Client"
															: "Coach"
													})()}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
												<MoreVertical
													className="h-4 w-4"
													style={{ color: "#ABA4AA" }}
												/>
											</button>
										</div>
									</div>
								</div>

								{/* Messages */}
								<div className="flex-1 overflow-y-auto p-6 space-y-4">
									{messages.map(
										(message: {
											id: string
											sender: { id: string }
											content: string
											createdAt: string
											isRead: boolean
											attachmentUrl?: string
											attachmentType?: string
											attachmentName?: string
										}) => {
											const isCurrentUser =
												message.sender.id === currentUser?.id

											return (
												<div
													key={message.id}
													className={`flex ${
														isCurrentUser ? "justify-end" : "justify-start"
													}`}
												>
													<div
														className={`max-w-[70%] px-4 py-3 rounded-2xl ${
															isCurrentUser
																? "bg-blue-500 text-white"
																: "bg-gray-700 text-gray-100"
														}`}
													>
														<p className="text-sm">{message.content}</p>
														{message.attachmentUrl && (
															<div className="mt-2">
																{message.attachmentType?.startsWith(
																	"image/"
																) ? (
																	<img
																		src={message.attachmentUrl}
																		alt="Attachment"
																		className="max-w-full rounded-lg"
																	/>
																) : (
																	<a
																		href={message.attachmentUrl}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="flex items-center gap-2 text-sm underline"
																	>
																		<File className="h-4 w-4" />
																		{message.attachmentName || "Attachment"}
																	</a>
																)}
															</div>
														)}
														<div className="flex items-center justify-end gap-1 mt-2">
															<span
																className={`text-xs ${
																	isCurrentUser
																		? "text-blue-100"
																		: "text-gray-400"
																}`}
															>
																{format(new Date(message.createdAt), "HH:mm")}
															</span>
															{isCurrentUser && (
																<CheckCheck
																	className={`h-3 w-3 ${
																		message.isRead
																			? "text-blue-300"
																			: "text-gray-400"
																	}`}
																/>
															)}
														</div>
													</div>
												</div>
											)
										}
									)}
									<div ref={messagesEndRef} />
								</div>

								{/* Message Input */}
								<div
									className="p-6 border-t"
									style={{ borderColor: "#2a2a2a" }}
								>
									<form
										onSubmit={handleSendMessage}
										className="flex items-end gap-3"
									>
										<div className="flex-1">
											<textarea
												value={messageText}
												onChange={(e) => setMessageText(e.target.value)}
												placeholder="Type a message..."
												className="w-full p-4 rounded-2xl border-0 resize-none focus:outline-none focus:ring-2 transition-all duration-200"
												style={{
													backgroundColor: "#353A3A",
													color: "#C3BCC2",
													borderColor: "#606364",
													minHeight: "60px",
													maxHeight: "120px",
												}}
												onFocus={(e) => {
													e.currentTarget.style.borderColor = "#4A5A70"
												}}
												onBlur={(e) => {
													e.currentTarget.style.borderColor = "#606364"
												}}
												onKeyDown={(e) => {
													if (e.key === "Enter" && !e.shiftKey) {
														e.preventDefault()
														handleSendMessage(e as React.FormEvent)
													}
												}}
											/>
										</div>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => setShowFileUpload(true)}
												className="p-3 rounded-xl hover:bg-gray-800 transition-colors"
												style={{ color: "#ABA4AA" }}
											>
												<Paperclip className="h-5 w-5" />
											</button>
											<button
												type="submit"
												disabled={
													(!messageText.trim() && !selectedFile) ||
													sendMessageMutation.isPending
												}
												className="p-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
												style={{
													backgroundColor: "#E0E0E0",
													color: "#000000",
												}}
												onMouseEnter={(e) => {
													if (!sendMessageMutation.isPending) {
														e.currentTarget.style.backgroundColor = "#E0E0E1"
													}
												}}
												onMouseLeave={(e) => {
													if (!sendMessageMutation.isPending) {
														e.currentTarget.style.backgroundColor = "#E0E0E0"
													}
												}}
											>
												<Send className="h-5 w-5" />
											</button>
										</div>
									</form>
								</div>
							</>
						) : (
							<div className="flex-1 flex items-center justify-center">
								<div className="text-center">
									<File
										className="h-16 w-16 mx-auto mb-4 opacity-50"
										style={{ color: "#ABA4AA" }}
									/>
									<h3
										className="text-xl font-medium mb-2"
										style={{ color: "#C3BCC2" }}
									>
										Select a conversation
									</h3>
									<p style={{ color: "#ABA4AA" }}>
										Choose a conversation from the sidebar to start messaging
									</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Create Conversation Modal */}
				{showCreateModal && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
						<div
							className="bg-gray-800 border border-gray-700 rounded-2xl w-96 max-h-[80vh] overflow-y-auto"
							style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
						>
							<div className="p-6 border-b" style={{ borderColor: "#606364" }}>
								<div className="flex items-center justify-between">
									<h3
										className="text-xl font-semibold"
										style={{ color: "#C3BCC2" }}
									>
										Start New Conversation
									</h3>
									<button
										onClick={() => setShowCreateModal(false)}
										className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
										style={{ color: "#ABA4AA" }}
									>
										<X className="h-5 w-5" />
									</button>
								</div>
							</div>

							<div className="p-6">
								<div className="mb-4">
									<div className="relative">
										<Search
											className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
											style={{ color: "#ABA4AA" }}
										/>
										<input
											type="text"
											placeholder="Search peers..."
											value={clientSearchTerm}
											onChange={(e) => setClientSearchTerm(e.target.value)}
											className="w-full pl-10 pr-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 transition-all duration-200"
											style={{
												backgroundColor: "#2A3133",
												color: "#C3BCC2",
												borderColor: "#606364",
											}}
											onFocus={(e) => {
												e.currentTarget.style.borderColor = "#4A5A70"
											}}
											onBlur={(e) => {
												e.currentTarget.style.borderColor = "#606364"
											}}
										/>
									</div>
								</div>

								<div className="max-h-64 overflow-y-auto">
									{filteredClients.length === 0 ? (
										<div className="text-center py-4">
											<p className="text-sm" style={{ color: "#ABA4AA" }}>
												{clientSearchTerm
													? "No clients found"
													: "No other clients available"}
											</p>
										</div>
									) : (
										filteredClients.map(
											(client: {
												id: string
												name?: string
												email?: string
												avatar?: string
												userId?: string
											}) => (
												<button
													key={client.id}
													onClick={() => handleCreateConversation(client.id)}
													disabled={createConversationMutation.isPending}
													className="w-full p-3 border-b cursor-pointer transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
													style={{
														borderColor: "#606364",
														color: "#C3BCC2",
													}}
													onMouseEnter={(e) => {
														if (!createConversationMutation.isPending) {
															e.currentTarget.style.backgroundColor = "#3A4040"
														}
													}}
													onMouseLeave={(e) => {
														if (!createConversationMutation.isPending) {
															e.currentTarget.style.backgroundColor =
																"transparent"
														}
													}}
												>
													{createConversationMutation.isPending && (
														<div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded">
															<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
														</div>
													)}
													<div className="flex items-center gap-3">
														<ProfilePictureUploader
															currentAvatarUrl={client.avatar}
															userName={client.name || client.email || "User"}
															onAvatarChange={() => {}}
															size="sm"
															readOnly={true}
															className="flex-shrink-0"
														/>
														<div className="text-left">
															<p
																className="font-medium"
																style={{ color: "#C3BCC2" }}
															>
																{client.name ||
																	client.email?.split("@")[0] ||
																	"Unknown"}
															</p>
															<div className="flex items-center gap-2">
																<p
																	className="text-sm"
																	style={{ color: "#ABA4AA" }}
																>
																	{client.email || "No email"}
																</p>
																{!client.userId && (
																	<span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
																		No Account
																	</span>
																)}
															</div>
														</div>
													</div>
												</button>
											)
										)
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* File Upload Modal */}
				{showFileUpload && (
					<MessageFileUpload
						onFileSelect={handleFileSelect}
						onClose={() => setShowFileUpload(false)}
					/>
				)}

				{/* Message Notifications */}
				<MessageNotification />
			</div>
		</ClientSidebar>
	)
}
