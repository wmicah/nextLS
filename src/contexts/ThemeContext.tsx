"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { trpc } from "@/app/_trpc/client"

type Theme = "dark"

interface ThemeContextType {
	theme: Theme
	setTheme: (theme: Theme) => void
	isDark: boolean
	isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("dark")
	const [isDark, setIsDark] = useState(true)
	const [isLoading, setIsLoading] = useState(false)

	// Get user settings
	const { data: userSettings } = trpc.settings.getSettings.useQuery()

	// Update settings mutation
	const updateSettingsMutation = trpc.settings.updateSettings.useMutation()

	// Initialize theme from user settings
	useEffect(() => {
		if (userSettings?.theme) {
			setThemeState(userSettings.theme as Theme)
		}
	}, [userSettings?.theme])

	// Apply theme to document
	useEffect(() => {
		const root = document.documentElement
		setIsDark(true)
		root.classList.remove("light")
		root.classList.add("dark")
	}, [theme])

	const setTheme = async (newTheme: Theme) => {
		// No-op since we only support dark theme
	}

	return (
		<ThemeContext.Provider value={{ theme, setTheme, isDark, isLoading }}>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider")
	}
	return context
}
