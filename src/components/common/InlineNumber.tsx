"use client"

import { useState, useRef, useEffect } from "react"

interface InlineNumberProps {
	value: number | null
	onChange: (value: number | null) => void
	placeholder?: string
	min?: number
	max?: number
	className?: string
}

export default function InlineNumber({
	value,
	onChange,
	placeholder = "0",
	min,
	max,
	className = "",
}: InlineNumberProps) {
	const [isEditing, setIsEditing] = useState(false)
	const [editValue, setEditValue] = useState(value?.toString() || "")
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus()
			inputRef.current.select()
		}
	}, [isEditing])

	const handleClick = () => {
		setIsEditing(true)
		setEditValue(value?.toString() || "")
	}

	const handleBlur = () => {
		setIsEditing(false)
		const numValue = editValue.trim() === "" ? null : parseInt(editValue, 10)

		if (numValue !== null && !isNaN(numValue)) {
			if (min !== undefined && numValue < min) return
			if (max !== undefined && numValue > max) return
			onChange(numValue)
		} else {
			onChange(null)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleBlur()
		} else if (e.key === "Escape") {
			setIsEditing(false)
			setEditValue(value?.toString() || "")
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
		// Only allow numbers and empty string
		if (newValue === "" || /^\d+$/.test(newValue)) {
			setEditValue(newValue)
		}
	}

	if (isEditing) {
		return (
			<input
				ref={inputRef}
				type="text"
				value={editValue}
				onChange={handleChange}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				className={`w-12 p-1 rounded border text-center text-sm ${className}`}
				style={{
					backgroundColor: "#1F2323",
					borderColor: "#606364",
					color: "#FFFFFF",
				}}
				placeholder={placeholder}
			/>
		)
	}

	return (
		<button
			onClick={handleClick}
			className={`w-12 p-1 rounded border text-center text-sm transition-colors hover:bg-gray-700/50 ${className}`}
			style={{
				backgroundColor: "transparent",
				borderColor: "#606364",
				color: value !== null ? "#FFFFFF" : "#6B7280",
			}}
		>
			{value !== null ? value : placeholder}
		</button>
	)
}
