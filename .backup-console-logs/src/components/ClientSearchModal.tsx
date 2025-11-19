"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/app/_trpc/client"
import { Search, X, User, Mail, Phone } from "lucide-react"
import ProfilePictureUploader from "./ProfilePictureUploader"

interface ClientSearchModalProps {
	isOpen: boolean
	onClose: () => void
}

interface Client {
	id: string
	name: string
	email?: string
	phone?: string
	status: string
}

export default function ClientSearchModal({
	isOpen,
	onClose,
}: ClientSearchModalProps) {
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedIndex, setSelectedIndex] = useState(0)
	const inputRef = useRef<HTMLInputElement>(null)
	const router = useRouter()

	// Get all clients for search
	const { data: clients = [] } = trpc.clients.list.useQuery()

	// Filter clients based on search query
	const filteredClients = clients.filter((client) => {
		const query = searchQuery.toLowerCase()
		return (
			client.name.toLowerCase().includes(query) ||
			(client.email && client.email.toLowerCase().includes(query)) ||
			(client.phone && client.phone.toLowerCase().includes(query))
		)
	})

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) return

			switch (e.key) {
				case "Escape":
					onClose()
					break
				case "ArrowDown":
					e.preventDefault()
					setSelectedIndex((prev) =>
						prev < filteredClients.length - 1 ? prev + 1 : 0
					)
					break
				case "ArrowUp":
					e.preventDefault()
					setSelectedIndex((prev) =>
						prev > 0 ? prev - 1 : filteredClients.length - 1
					)
					break
				case "Enter":
					e.preventDefault()
					if (filteredClients[selectedIndex]) {
						handleClientSelect(filteredClients[selectedIndex])
					}
					break
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [isOpen, filteredClients, selectedIndex, onClose])

	// Focus input when modal opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus()
			setSearchQuery("")
			setSelectedIndex(0)
		}
	}, [isOpen])

	// Reset selected index when search changes
	useEffect(() => {
		setSelectedIndex(0)
	}, [searchQuery])

	const handleClientSelect = (client: any) => {
		router.push(`/clients/${client.id}`)
		onClose()
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black bg-opacity-50"
				onClick={onClose}
			/>

			{/* Modal */}
			<div
				className="relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl"
				style={{ backgroundColor: "#2a2a2a" }}
			>
				{/* Header */}
				<div
					className="flex items-center justify-between p-4 border-b"
					style={{ borderColor: "#374151" }}
				>
					<h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
						Jump to Client
					</h3>
					<button
						onClick={onClose}
						className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
					>
						<X className="w-5 h-5" style={{ color: "#9ca3af" }} />
					</button>
				</div>

				{/* Search Input */}
				<div className="p-4">
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
							style={{ color: "#9ca3af" }}
						/>
						<input
							ref={inputRef}
							type="text"
							placeholder="Search clients by name, email, or phone..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200"
							style={{
								backgroundColor: "#374151",
								borderColor: "#606364",
								color: "#ffffff",
								border: "1px solid",
							}}
						/>
					</div>
				</div>

				{/* Results */}
				<div className="max-h-64 overflow-y-auto">
					{filteredClients.length === 0 ? (
						<div className="p-4 text-center">
							<p style={{ color: "#9ca3af" }}>
								{searchQuery
									? "No clients found"
									: "Start typing to search clients"}
							</p>
						</div>
					) : (
						<div className="space-y-1 p-2">
							{filteredClients.map((client, index: number) => (
								<button
									key={client.id}
									onClick={() => handleClientSelect(client)}
									className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
										index === selectedIndex
											? "bg-gray-700"
											: "hover:bg-gray-700"
									}`}
								>
									<div className="flex-shrink-0">
										<ProfilePictureUploader
											currentAvatarUrl={
												client.user?.settings?.avatarUrl || client.avatar
											}
											userName={client.name}
											onAvatarChange={() => {}}
											size="sm"
											readOnly={true}
											className="flex-shrink-0"
										/>
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<User className="w-4 h-4" style={{ color: "#9ca3af" }} />
											<p
												className="font-medium truncate"
												style={{ color: "#ffffff" }}
											>
												{client.name}
											</p>
										</div>
										{client.email && (
											<div className="flex items-center gap-2 mt-1">
												<Mail
													className="w-3 h-3"
													style={{ color: "#9ca3af" }}
												/>
												<p
													className="text-sm truncate"
													style={{ color: "#9ca3af" }}
												>
													{client.email}
												</p>
											</div>
										)}
										{client.phone && (
											<div className="flex items-center gap-2 mt-1">
												<Phone
													className="w-3 h-3"
													style={{ color: "#9ca3af" }}
												/>
												<p
													className="text-sm truncate"
													style={{ color: "#9ca3af" }}
												>
													{client.phone}
												</p>
											</div>
										)}
									</div>
									{/* Status removed - property doesn't exist */}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 border-t" style={{ borderColor: "#374151" }}>
					<div
						className="flex items-center justify-between text-xs"
						style={{ color: "#9ca3af" }}
					>
						<span>Use ↑↓ to navigate, Enter to select</span>
						<span>
							{filteredClients.length} client
							{filteredClients.length !== 1 ? "s" : ""}
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}
