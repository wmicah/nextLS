"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import ChatbotQuickActions from "./ChatbotQuickActions"
import { useChatbot } from "./ChatbotContext"

interface Message {
	id: string
	content: string
	role: "user" | "assistant"
	timestamp: Date
}

export default function ChatbotWidget() {
	const { isOpen, setIsOpen, currentPage, userRole, recentActions } =
		useChatbot()
	const chatRef = useRef<HTMLDivElement>(null)
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			content:
				"Hi! I'm your Next Level Softball assistant. How can I help you today?",
			role: "assistant",
			timestamp: new Date(),
		},
	])
	const [inputValue, setInputValue] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [showQuickActions, setShowQuickActions] = useState(true)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus()
		}
	}, [isOpen])

	// Handle click outside to close
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside)
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [isOpen, setIsOpen])

	const handleSendMessage = async () => {
		if (!inputValue.trim() || isLoading) return

		const userMessage: Message = {
			id: Date.now().toString(),
			content: inputValue,
			role: "user",
			timestamp: new Date(),
		}

		setMessages((prev) => [...prev, userMessage])
		setInputValue("")
		setIsLoading(true)
		setShowQuickActions(false)

		try {
			const response = await fetch("/api/chatbot", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message: inputValue,
					history: messages.slice(-5), // Send last 5 messages for context
					context: {
						currentPage,
						userRole,
						recentActions,
					},
				}),
			})

			if (!response.ok) {
				throw new Error("Failed to get response")
			}

			const data = await response.json()

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				content: data.response,
				role: "assistant",
				timestamp: new Date(),
			}

			setMessages((prev) => [...prev, assistantMessage])
		} catch (error) {
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				content:
					"Sorry, I'm having trouble connecting right now. Please try again later.",
				role: "assistant",
				timestamp: new Date(),
			}
			setMessages((prev) => [...prev, errorMessage])
		} finally {
			setIsLoading(false)
		}
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleSendMessage()
		}
	}

	const handleQuickAction = (message: string) => {
		setInputValue(message)
		setShowQuickActions(false)
		// Automatically send the quick action message
		setTimeout(() => {
			handleSendMessage()
		}, 100)
	}

	return (
		<div className="fixed bottom-6 right-6 z-50">
			{/* Floating Chat Button */}
			<AnimatePresence>
				{!isOpen && (
					<motion.div
						initial={{ scale: 0, opacity: 0, y: 20 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0, opacity: 0, y: 20 }}
						transition={{
							type: "spring",
							stiffness: 300,
							damping: 25,
						}}
						className="relative"
					>
						{/* Glow effect */}
						<div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />

						<Button
							onClick={() => setIsOpen(true)}
							size="lg"
							className="relative h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 shadow-2xl border-0 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/25"
						>
							<MessageCircle className="h-7 w-7 text-white" />

							{/* AI indicator */}
							<div className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
								<Sparkles className="h-3 w-3 text-white" />
							</div>
						</Button>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Chat Window */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ scale: 0.8, opacity: 0, y: 20, rotateX: -15 }}
						animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
						exit={{ scale: 0.8, opacity: 0, y: 20, rotateX: -15 }}
						transition={{
							type: "spring",
							stiffness: 300,
							damping: 30,
						}}
						className="absolute bottom-20 right-0"
					>
						{/* Backdrop blur */}
						<div className="absolute inset-0 bg-black/5 backdrop-blur-sm rounded-3xl" />

						<Card
							ref={chatRef}
							className="relative w-[450px] h-[600px] shadow-2xl border-0 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden"
						>
							{/* Gradient border effect */}
							<div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl" />

							<CardContent className="p-0 h-full flex flex-col bg-gradient-to-b from-white/50 to-gray-50/50">
								{/* Header Section */}
								<div className="px-6 py-4 border-b border-gray-200/30 bg-white/40 backdrop-blur-sm">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
												<Bot className="h-4 w-4 text-white" />
											</div>
											<div>
												<h3 className="text-sm font-semibold text-gray-800">
													AI Assistant
												</h3>
												<p className="text-xs text-gray-600">
													Ready to help you
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
											<span className="text-xs text-gray-600">Online</span>
										</div>
									</div>
								</div>

								{/* Messages Area */}
								<div className="flex-1 overflow-hidden">
									<div className="h-full overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100/50 [&::-webkit-scrollbar-thumb]:bg-gray-300/70 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-400/70">
										{/* Show Quick Actions on first load or when requested */}
										{showQuickActions && (
											<motion.div
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: 0.2 }}
											>
												<ChatbotQuickActions
													onActionClick={handleQuickAction}
													userRole={userRole as "coach" | "client" | "visitor"}
												/>
											</motion.div>
										)}

										{/* Show Quick Actions Button when hidden */}
										{!showQuickActions && messages.length > 1 && (
											<motion.div
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												className="flex justify-center"
											>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setShowQuickActions(true)}
													className="bg-white/80 backdrop-blur-sm border-gray-200/50 text-gray-700 hover:bg-white/90 transition-all duration-200"
												>
													<Sparkles className="h-4 w-4 mr-2" />
													Show Quick Actions
												</Button>
											</motion.div>
										)}

										{messages.map((message, index) => (
											<motion.div
												key={message.id}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.1 }}
												className={cn(
													"flex gap-3",
													message.role === "user"
														? "justify-end"
														: "justify-start"
												)}
											>
												{message.role === "assistant" && (
													<div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
														<Bot className="h-4 w-4 text-white" />
													</div>
												)}
												<div
													className={cn(
														"max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
														message.role === "user"
															? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
															: "bg-white/90 backdrop-blur-sm border border-gray-200/50 text-gray-800"
													)}
												>
													<div
														className="whitespace-pre-wrap"
														dangerouslySetInnerHTML={{
															__html:
																message.role === "assistant"
																	? message.content
																			.replace(
																				/\*\*(.*?)\*\*/g,
																				"<strong>$1</strong>"
																			)
																			.replace(/\*(.*?)\*/g, "<em>$1</em>")
																			.replace(/\n/g, "<br>")
																	: message.content,
														}}
													/>
												</div>
												{message.role === "user" && (
													<div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 shadow-lg">
														<User className="h-4 w-4 text-white" />
													</div>
												)}
											</motion.div>
										))}

										{isLoading && (
											<motion.div
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												className="flex gap-3 justify-start"
											>
												<div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
													<Bot className="h-4 w-4 text-white" />
												</div>
												<div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-4 py-3">
													<div className="flex space-x-1">
														<div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce" />
														<div
															className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce"
															style={{ animationDelay: "0.1s" }}
														/>
														<div
															className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce"
															style={{ animationDelay: "0.2s" }}
														/>
													</div>
												</div>
											</motion.div>
										)}
										<div ref={messagesEndRef} />
									</div>
								</div>

								{/* Input Area */}
								<div className="p-6 border-t border-gray-200/30 bg-white/40 backdrop-blur-sm">
									<div className="flex gap-3">
										<Input
											ref={inputRef}
											value={inputValue}
											onChange={(e) => setInputValue(e.target.value)}
											onKeyPress={handleKeyPress}
											placeholder="Ask me anything..."
											disabled={isLoading}
											className="flex-1 text-black bg-white/80 backdrop-blur-sm border-gray-200/50 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
										/>
										<Button
											onClick={handleSendMessage}
											disabled={!inputValue.trim() || isLoading}
											size="icon"
											className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
										>
											<Send className="h-5 w-5 text-white" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
