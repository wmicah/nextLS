"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useChatbot } from "./ChatbotContext"

export function usePageTracking() {
	const pathname = usePathname()
	const { setCurrentPage } = useChatbot()

	useEffect(() => {
		// Extract page name from pathname
		const pageName = pathname.split("/").filter(Boolean).pop() || "home"
		const formattedPageName = pageName
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ")

		setCurrentPage(formattedPageName)
	}, [pathname, setCurrentPage])
}
