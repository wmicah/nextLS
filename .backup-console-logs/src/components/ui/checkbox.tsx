"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
	// Extends the input HTML attributes
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, ...props }, ref) => {
		return (
			<input
				type="checkbox"
				ref={ref}
				className={cn("checkbox", className)}
				{...props}
			/>
		)
	}
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
