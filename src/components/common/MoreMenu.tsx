"use client"

import { MoreHorizontal, Edit, Copy, Trash2, Link, Unlink } from "lucide-react"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface MoreMenuProps {
	items: Array<{
		id: string
		label: string
		icon?: React.ReactNode
		onClick: () => void
		disabled?: boolean
		variant?: "default" | "destructive"
	}>
	className?: string
}

export default function MoreMenu({ items, className = "" }: MoreMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={`h-8 w-8 p-0 ${className}`}
				>
					<MoreHorizontal className="h-4 w-4" />
					<span className="sr-only">Open menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{items.map((item, index) => (
					<div key={item.id}>
						<DropdownMenuItem
							onClick={item.onClick}
							disabled={item.disabled}
							className={
								item.variant === "destructive" ? "text-destructive" : ""
							}
						>
							{item.icon && <span className="mr-2">{item.icon}</span>}
							{item.label}
						</DropdownMenuItem>
						{index < items.length - 1 && <DropdownMenuSeparator />}
					</div>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

// Predefined menu items for common actions
export const menuItems = {
	edit: {
		id: "edit",
		label: "Edit",
		icon: <Edit className="h-4 w-4" />,
	},
	copy: {
		id: "copy",
		label: "Copy",
		icon: <Copy className="h-4 w-4" />,
	},
	delete: {
		id: "delete",
		label: "Delete",
		icon: <Trash2 className="h-4 w-4" />,
		variant: "destructive" as const,
	},
	linkSuperset: {
		id: "linkSuperset",
		label: "Link Superset",
		icon: <Link className="h-4 w-4" />,
	},
	unlinkSuperset: {
		id: "unlinkSuperset",
		label: "Unlink Superset",
		icon: <Unlink className="h-4 w-4" />,
	},
}
