"use client"

import { Keyboard } from "lucide-react"

interface KbdHintsProps {
	shortcuts: Array<{
		key: string
		description: string
	}>
	className?: string
}

export default function KbdHints({ shortcuts, className = "" }: KbdHintsProps) {
	return (
		<div
			className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
		>
			<Keyboard className="h-3 w-3" />
			<span className="font-medium">Keyboard shortcuts:</span>
			<div className="flex items-center gap-3">
				{shortcuts.map((shortcut, index) => (
					<div key={index} className="flex items-center gap-1">
						<kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
							{shortcut.key}
						</kbd>
						<span>{shortcut.description}</span>
					</div>
				))}
			</div>
		</div>
	)
}
