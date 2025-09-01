"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/app/_trpc/client"
import Sidebar from "@/components/Sidebar"

import {
	User,
	Bell,
	MessageSquare,
	Users,
	Calendar,
	Palette,
	CreditCard,
	Save,
	Settings as SettingsIcon,
} from "lucide-react"
import ProfilePictureUploader from "@/components/ProfilePictureUploader"

interface SettingsPageClientProps {
	// Add props here if needed in the future
}

export default function SettingsPageClient({}: SettingsPageClientProps) {
	const [activeTab, setActiveTab] = useState("profile")
	const [isLoading, setIsLoading] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState(false)

	// Form state for each tab
	const [profileData, setProfileData] = useState({
		name: "",
		phone: "",
		location: "",
		bio: "",
		avatarUrl: "",
	})

	const [notificationData, setNotificationData] = useState({
		emailNotifications: true,
		pushNotifications: true,
		soundNotifications: false,
		newClientNotifications: true,
		messageNotifications: true,
		scheduleNotifications: true,
	})

	const [messagingData, setMessagingData] = useState({
		defaultWelcomeMessage: "",
		messageRetentionDays: 90,
		maxFileSizeMB: 50,
	})

	const [clientData, setClientData] = useState({
		defaultLessonDuration: 60,
		autoArchiveDays: 90,
		requireClientEmail: false,
	})

	const [scheduleData, setScheduleData] = useState({
		timezone: "UTC-5",
		workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
	})

	const [appearanceData, setAppearanceData] = useState({
		compactSidebar: false,
		showAnimations: true,
	})

	// const [billingData, setBillingData] = useState({
	// 	subscriptionStatus: "active",
	// 	planName: "Pro Plan",
	// 	nextBillingDate: "2024-01-15",
	// 	stripeCustomerId: "",
	// })

	// Get current user data
	const { data: currentUser, refetch: refetchUser } =
		trpc.user.getProfile.useQuery()

	// Get user settings
	const { data: userSettings, refetch: refetchSettings } =
		trpc.settings.getSettings.useQuery()

	// Settings mutations
	const updateSettingsMutation = trpc.settings.updateSettings.useMutation({
		onSuccess: () => {
			refetchSettings()
		},
	})

	const updateProfileMutation = trpc.settings.updateProfile.useMutation({
		onSuccess: () => {
			refetchSettings()
			refetchUser()
		},
	})

	// Update form data when settings load
	useEffect(() => {
		if (userSettings) {
			setProfileData({
				name: currentUser?.name || "",
				phone: userSettings.phone || "",
				location: userSettings.location || "",
				bio: userSettings.bio || "",
				avatarUrl: userSettings.avatarUrl || "",
			})

			setNotificationData({
				emailNotifications: userSettings.emailNotifications,
				pushNotifications: userSettings.pushNotifications,
				soundNotifications: userSettings.soundNotifications,
				newClientNotifications: userSettings.newClientNotifications,
				messageNotifications: userSettings.messageNotifications,
				scheduleNotifications: userSettings.scheduleNotifications,
			})

			setMessagingData({
				defaultWelcomeMessage: userSettings.defaultWelcomeMessage || "",
				messageRetentionDays: userSettings.messageRetentionDays,
				maxFileSizeMB: userSettings.maxFileSizeMB,
			})

			setClientData({
				defaultLessonDuration: userSettings.defaultLessonDuration,
				autoArchiveDays: userSettings.autoArchiveDays,
				requireClientEmail: userSettings.requireClientEmail,
			})

			setScheduleData({
				timezone: userSettings.timezone,
				workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
			})

			setAppearanceData({
				compactSidebar: userSettings.compactSidebar,
				showAnimations: userSettings.showAnimations,
			})
		}
	}, [])

	// Settings tabs
	const tabs = [
		{ id: "profile", name: "Profile", icon: <User className="w-5 h-5" /> },
		{
			id: "notifications",
			name: "Notifications",
			icon: <Bell className="w-5 h-5" />,
		},
		{
			id: "messaging",
			name: "Messaging",
			icon: <MessageSquare className="w-5 h-5" />,
		},
		{
			id: "clients",
			name: "Client Management",
			icon: <Users className="w-5 h-5" />,
		},
		{
			id: "schedule",
			name: "Schedule",
			icon: <Calendar className="w-5 h-5" />,
		},

		{
			id: "billing",
			name: "Billing & Payments",
			icon: <CreditCard className="w-5 h-5" />,
		},
		{
			id: "appearance",
			name: "Appearance",
			icon: <Palette className="w-5 h-5" />,
		},
	]

	const handleSave = async () => {
		setIsLoading(true)
		setSaveSuccess(false)
		try {
			// Save current tab settings based on active tab
			switch (activeTab) {
				case "profile":
					await updateProfileMutation.mutateAsync({
						name: profileData.name,
						phone: profileData.phone,
						location: profileData.location,
						bio: profileData.bio,
						avatarUrl: profileData.avatarUrl,
					})
					break
				case "notifications":
					await updateSettingsMutation.mutateAsync({
						emailNotifications: notificationData.emailNotifications,
						pushNotifications: notificationData.pushNotifications,
						soundNotifications: notificationData.soundNotifications,
						newClientNotifications: notificationData.newClientNotifications,
						messageNotifications: notificationData.messageNotifications,
						scheduleNotifications: notificationData.scheduleNotifications,
					})
					break
				case "messaging":
					await updateSettingsMutation.mutateAsync({
						defaultWelcomeMessage: messagingData.defaultWelcomeMessage,
						messageRetentionDays: messagingData.messageRetentionDays,
						maxFileSizeMB: messagingData.maxFileSizeMB,
					})
					break
				case "clients":
					await updateSettingsMutation.mutateAsync({
						defaultLessonDuration: clientData.defaultLessonDuration,
						autoArchiveDays: clientData.autoArchiveDays,
						requireClientEmail: clientData.requireClientEmail,
					})
					break
				case "schedule":
					await updateSettingsMutation.mutateAsync({
						timezone: scheduleData.timezone,
						workingDays: scheduleData.workingDays,
					})
					break

				case "billing":
					// Billing is handled by Stripe Customer Portal
					// No local settings to save
					break
				case "appearance":
					await updateSettingsMutation.mutateAsync({
						compactSidebar: appearanceData.compactSidebar,
						showAnimations: appearanceData.showAnimations,
					})
					break
			}
		} catch (error) {
			console.error("Failed to save settings:", error)
		} finally {
			setIsLoading(false)
			setSaveSuccess(true)
			// Hide success message after 3 seconds
			setTimeout(() => setSaveSuccess(false), 3000)
		}
	}

	return (
		<Sidebar>
			<div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
				{/* Hero Header */}
				<div className="mb-8">
					<div className="rounded-2xl border relative overflow-hidden group">
						<div
							className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
							style={{
								background:
									"linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
							}}
						/>
						<div className="relative p-8 bg-gradient-to-r from-transparent via-black/20 to-black/40">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div>
										<h1
											className="text-4xl font-bold mb-2"
											style={{ color: "#C3BCC2" }}
										>
											Settings
										</h1>
										<div
											className="flex items-center gap-2 text-lg"
											style={{ color: "#ABA4AA" }}
										>
											<div className="h-5 w-5 rounded-full bg-gray-500 flex items-center justify-center">
												<SettingsIcon className="h-3 w-3 text-white" />
											</div>
											<span>Customize your coaching experience</span>
										</div>
									</div>
								</div>
								<div className="text-right">
									<div
										className="text-2xl font-bold"
										style={{ color: "#C3BCC2" }}
									>
										{currentUser?.name || "Coach"}
									</div>
									<div className="text-sm" style={{ color: "#ABA4AA" }}>
										Account Settings
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Settings Content */}
				<div className="flex gap-6">
					{/* Settings Sidebar */}
					<div className="w-80 flex-shrink-0">
						<div
							className="rounded-2xl border p-6"
							style={{ backgroundColor: "#1E1E1E", borderColor: "#2a2a2a" }}
						>
							<h2
								className="text-xl font-bold mb-6"
								style={{ color: "#ffffff" }}
							>
								Settings
							</h2>
							<nav className="space-y-2">
								{tabs.map((tab) => (
									<button
										key={tab.id}
										onClick={() => setActiveTab(tab.id)}
										className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
											activeTab === tab.id
												? "bg-gray-500/10 border border-gray-500/20"
												: "hover:bg-gray-500/5"
										}`}
										style={{
											color: activeTab === tab.id ? "#ffffff" : "#9ca3af",
										}}
									>
										{tab.icon}
										<span className="font-medium">{tab.name}</span>
									</button>
								))}
							</nav>
						</div>
					</div>

					{/* Settings Panel */}
					<div className="flex-1">
						<div
							className="rounded-2xl border p-8"
							style={{ backgroundColor: "#1E1E1E", borderColor: "#2a2a2a" }}
						>
							{/* Profile Settings */}
							{activeTab === "profile" && (
								<div>
									<h3
										className="text-2xl font-bold mb-6"
										style={{ color: "#ffffff" }}
									>
										Profile Settings
									</h3>
									<div className="space-y-6">
										{/* Profile Picture */}
										<div>
											<label
												className="block text-sm font-medium mb-3"
												style={{ color: "#9ca3af" }}
											>
												Profile Picture
											</label>
											<div className="flex items-center gap-4">
												<ProfilePictureUploader
													currentAvatarUrl={profileData.avatarUrl}
													userName={currentUser?.name || "User"}
													onAvatarChange={(url) =>
														setProfileData((prev) => ({
															...prev,
															avatarUrl: url,
														}))
													}
													size="lg"
												/>
												<div className="flex flex-col gap-2">
													<p className="text-sm" style={{ color: "#9ca3af" }}>
														Click on your profile picture to upload a new one
													</p>
													<p className="text-xs" style={{ color: "#6b7280" }}>
														Supports JPG, PNG up to 4MB
													</p>
												</div>
											</div>
										</div>

										{/* Personal Information */}
										<div className="grid grid-cols-2 gap-6">
											<div>
												<label
													className="block text-sm font-medium mb-2"
													style={{ color: "#9ca3af" }}
												>
													Full Name
												</label>
												<input
													type="text"
													value={profileData.name}
													onChange={(e) =>
														setProfileData((prev) => ({
															...prev,
															name: e.target.value,
														}))
													}
													className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
													style={{
														backgroundColor: "#2a2a2a",
														borderColor: "#374151",
														color: "#ffffff",
														border: "1px solid",
													}}
													placeholder="Enter your full name"
												/>
											</div>
											<div>
												<label
													className="block text-sm font-medium mb-2"
													style={{ color: "#9ca3af" }}
												>
													Email
												</label>
												<input
													type="email"
													value={currentUser?.email || ""}
													disabled
													className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 opacity-50"
													style={{
														backgroundColor: "#2a2a2a",
														borderColor: "#374151",
														color: "#ffffff",
														border: "1px solid",
													}}
													placeholder="Enter your email"
												/>
											</div>
											<div>
												<label
													className="block text-sm font-medium mb-2"
													style={{ color: "#9ca3af" }}
												>
													Phone Number
												</label>
												<input
													type="tel"
													value={profileData.phone}
													onChange={(e) =>
														setProfileData((prev) => ({
															...prev,
															phone: e.target.value,
														}))
													}
													className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
													style={{
														backgroundColor: "#2a2a2a",
														borderColor: "#374151",
														color: "#ffffff",
														border: "1px solid",
													}}
													placeholder="Enter your phone number"
												/>
											</div>
											<div>
												<label
													className="block text-sm font-medium mb-2"
													style={{ color: "#9ca3af" }}
												>
													Location
												</label>
												<input
													type="text"
													value={profileData.location}
													onChange={(e) =>
														setProfileData((prev) => ({
															...prev,
															location: e.target.value,
														}))
													}
													className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
													style={{
														backgroundColor: "#2a2a2a",
														borderColor: "#374151",
														color: "#ffffff",
														border: "1px solid",
													}}
													placeholder="Enter your location"
												/>
											</div>
										</div>

										{/* Bio */}
										<div>
											<label
												className="block text-sm font-medium mb-2"
												style={{ color: "#9ca3af" }}
											>
												Bio
											</label>
											<textarea
												rows={4}
												value={profileData.bio}
												onChange={(e) =>
													setProfileData((prev) => ({
														...prev,
														bio: e.target.value,
													}))
												}
												className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 resize-none"
												style={{
													backgroundColor: "#2a2a2a",
													borderColor: "#374151",
													color: "#ffffff",
													border: "1px solid",
												}}
												placeholder="Tell your clients about yourself..."
											/>
										</div>
									</div>
								</div>
							)}

							{/* Save Button */}
							<div
								className="mt-8 pt-6 border-t"
								style={{ borderColor: "#2a2a2a" }}
							>
								<div className="flex justify-between items-center">
									{saveSuccess && (
										<div
											className="flex items-center gap-2 px-4 py-2 rounded-xl"
											style={{ backgroundColor: "#10b981", color: "#ffffff" }}
										>
											<Save className="w-4 h-4" />
											Settings saved successfully!
										</div>
									)}
									<button
										onClick={handleSave}
										disabled={isLoading}
										className="px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
										style={{ backgroundColor: "#374151", color: "#ffffff" }}
									>
										{isLoading ? (
											<>
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
												Saving...
											</>
										) : (
											<>
												<Save className="w-4 h-4" />
												Save Changes
											</>
										)}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Sidebar>
	)
}
