"use client"

import { usePageTracking } from "./usePageTracking"
import ChatbotWidget from "./ChatbotWidget"

export default function ChatbotWrapper() {
	usePageTracking()

	return <ChatbotWidget />
}
