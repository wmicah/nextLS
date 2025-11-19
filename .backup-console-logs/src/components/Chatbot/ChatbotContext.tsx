"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface ChatbotContextType {
	isOpen: boolean
	setIsOpen: (open: boolean) => void
	currentPage: string
	setCurrentPage: (page: string) => void
	userRole: string | null
	setUserRole: (role: string | null) => void
	recentActions: string[]
	addRecentAction: (action: string) => void
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined)

export function ChatbotProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false)
	const [currentPage, setCurrentPage] = useState("")
	const [userRole, setUserRole] = useState<string | null>(null)
	const [recentActions, setRecentActions] = useState<string[]>([])

	const addRecentAction = (action: string) => {
		setRecentActions((prev) => [action, ...prev.slice(0, 4)]) // Keep last 5 actions
	}

	return (
		<ChatbotContext.Provider
			value={{
				isOpen,
				setIsOpen,
				currentPage,
				setCurrentPage,
				userRole,
				setUserRole,
				recentActions,
				addRecentAction,
			}}
		>
			{children}
		</ChatbotContext.Provider>
	)
}

export function useChatbot() {
	const context = useContext(ChatbotContext)
	if (context === undefined) {
		throw new Error("useChatbot must be used within a ChatbotProvider")
	}
	return context
}
