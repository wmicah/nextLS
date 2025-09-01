"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/app/_trpc/client"
import {
	User,
	Bell,
	MessageSquare,
	Target,
	Calendar,
	Palette,
	Save,
	Settings as SettingsIcon,
	Activity,
	Clock,
} from "lucide-react"
import ProfilePictureUploader from "@/components/ProfilePictureUploader"

export default function ClientSettingsPage() {
	const [activeTab, setActiveTab] = useState("profile")
	const [isLoading, setIsLoading] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState(false)

	// Form state for each tabb
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
		messageNotifications: true,
		scheduleNotifications: true,
	})

	const [trainingData, setTrainingData] = useState({
		preferredWorkoutTime: "morning",
		workoutDuration: 60,
		experienceLevel: "beginner",
		goals: "",
		injuries: "",
	})

	const [appearanceData, setAppearanceData] = useState({
		compactSidebar: false,
		showAnimations: true,
		darkMode: true,
	})

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
	useEffect(
		() => {
			if (userSettings) {
				setProfileData({
					name: currentUser?.name || "",
					phone: userSettings.phone || "",
					location: userSettings.location || "",
					bio: userSettings.bio || "",
					avatarUrl: userSettings.avatarUrl || "",
				})

				setNotificationData({
					emailNotifications: userSettings.emailNotifications ?? true,
					pushNotifications: userSettings.pushNotifications ?? true,
					soundNotifications: userSettings.soundNotifications ?? false,
					messageNotifications: userSettings.messageNotifications ?? true,
					scheduleNotifications: userSettings.scheduleNotifications ?? true,
				})

				setTrainingData({
					preferredWorkoutTime: "morning",
					workoutDuration: 60,
					experienceLevel: "beginner",
					goals: "",
					injuries: "",
				})

				setAppearanceData({
					compactSidebar: userSettings.compactSidebar ?? false,
					showAnimations: userSettings.showAnimations ?? true,
					darkMode: true,
				})
			}
		},
		[userSettings, currentUser] as const
	)

	// Settings tabs
	const tabs = [
		{ id: "profile", name: "Profile", icon: <User className="w-5 h-5" /> },
		{
			id: "notifications",
			name: "Notifications",
			icon: <Bell className="w-5 h-5" />,
		},
		{
			id: "training",
			name: "Training Preferences",
			icon: <Target className="w-5 h-5" />,
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
						messageNotifications: notificationData.messageNotifications,
						scheduleNotifications: notificationData.scheduleNotifications,
					})
					break
				case "training":
					// Training preferences are not supported in the current API
					console.log("Training preferences not supported")
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
		<div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
			{/* Hero Header */}
			<div className="mb-6 md:mb-8">
				<div className="rounded-xl md:rounded-2xl border relative overflow-hidden group">
					<div
						className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
						style={{
							background:
								"linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
						}}
					/>
					<div className="relative p-4 md:p-8 bg-gradient-to-r from-transparent via-black/20 to-black/40">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
							<div className="flex items-center gap-3 md:gap-4">
								<div>
									<h1
										className="text-2xl md:text-4xl font-bold mb-1 md:mb-2"
										style={{ color: "#C3BCC2" }}
									>
										Settings
									</h1>
									<div
										className="flex items-center gap-2 text-sm md:text-lg"
										style={{ color: "#ABA4AA" }}
									>
										<div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-gray-500 flex items-center justify-center">
											<SettingsIcon className="h-2 w-2 md:h-3 md:w-3 text-white" />
										</div>
										<span>Customize your training experience</span>
									</div>
								</div>
							</div>
							<div className="text-left md:text-right">
								<div
									className="text-lg md:text-2xl font-bold"
									style={{ color: "#C3BCC2" }}
								>
									{currentUser?.name || "Athlete"}
								</div>
								<div
									className="text-xs md:text-sm"
									style={{ color: "#ABA4AA" }}
								>
									Training Settings
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Settings Content */}
			<div className="flex flex-col lg:flex-row gap-4 md:gap-6">
				{/* Settings Sidebar */}
				<div className="w-full lg:w-80 lg:flex-shrink-0">
					<div
						className="rounded-xl md:rounded-2xl border p-4 md:p-6"
						style={{ backgroundColor: "#1E1E1E", borderColor: "#2a2a2a" }}
					>
						<h2
							className="text-lg md:text-xl font-bold mb-4 md:mb-6"
							style={{ color: "#ffffff" }}
						>
							Settings
						</h2>
						<nav className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:space-y-2 lg:block">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`w-full flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-2 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl text-center lg:text-left transition-all duration-200 touch-manipulation ${
										activeTab === tab.id
											? "bg-gray-500/10 border border-gray-500/20"
											: "hover:bg-gray-500/5"
									}`}
									style={{
										color: activeTab === tab.id ? "#ffffff" : "#9ca3af",
									}}
								>
									{tab.icon}
									<span className="font-medium text-xs lg:text-base">
										{tab.name}
									</span>
								</button>
							))}
						</nav>
					</div>
				</div>

				{/* Settings Panel */}
				<div className="flex-1">
					<div
						className="rounded-xl md:rounded-2xl border p-4 md:p-8"
						style={{ backgroundColor: "#1E1E1E", borderColor: "#2a2a2a" }}
					>
						{/* Profile Settings */}
						{activeTab === "profile" && (
							<div>
								<h3
									className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
									style={{ color: "#ffffff" }}
								>
									Profile Settings
								</h3>
								<div className="space-y-4 md:space-y-6">
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
											placeholder="Tell your coach about yourself..."
										/>
									</div>
								</div>
							</div>
						)}

						{/* Notifications Settings */}
						{activeTab === "notifications" && (
							<div>
								<h3
									className="text-2xl font-bold mb-6"
									style={{ color: "#ffffff" }}
								>
									Notification Settings
								</h3>
								<div className="space-y-6">
									<div className="space-y-4">
										{[
											{
												key: "emailNotifications",
												label: "Email Notifications",
												description: "Receive updates via email",
											},
											{
												key: "pushNotifications",
												label: "Push Notifications",
												description: "Get notified in your browser",
											},
											{
												key: "soundNotifications",
												label: "Sound Notifications",
												description: "Play sounds for notifications",
											},
											{
												key: "programNotifications",
												label: "Program Updates",
												description:
													"Notifications about your training program",
											},
											{
												key: "messageNotifications",
												label: "Message Notifications",
												description: "Notifications from your coach",
											},
											{
												key: "scheduleNotifications",
												label: "Schedule Reminders",
												description: "Reminders about upcoming sessions",
											},
										].map((notification) => (
											<div
												key={notification.key}
												className="flex items-center justify-between p-4 rounded-xl"
												style={{ backgroundColor: "#2a2a2a" }}
											>
												<div>
													<h4 className="font-medium text-white">
														{notification.label}
													</h4>
													<p className="text-sm" style={{ color: "#9ca3af" }}>
														{notification.description}
													</p>
												</div>
												<input
													type="checkbox"
													checked={
														notificationData[
															notification.key as keyof typeof notificationData
														]
													}
													onChange={(e) =>
														setNotificationData((prev) => ({
															...prev,
															[notification.key]: e.target.checked,
														}))
													}
													className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
												/>
											</div>
										))}
									</div>
								</div>
							</div>
						)}

						{/* Training Preferences */}
						{activeTab === "training" && (
							<div>
								<h3
									className="text-2xl font-bold mb-6"
									style={{ color: "#ffffff" }}
								>
									Training Preferences
								</h3>
								<div className="space-y-6">
									<div className="grid grid-cols-2 gap-6">
										<div>
											<label
												className="block text-sm font-medium mb-2"
												style={{ color: "#9ca3af" }}
											>
												Preferred Workout Time
											</label>
											<select
												value={trainingData.preferredWorkoutTime}
												onChange={(e) =>
													setTrainingData((prev) => ({
														...prev,
														preferredWorkoutTime: e.target.value,
													}))
												}
												className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
												style={{
													backgroundColor: "#2a2a2a",
													borderColor: "#374151",
													color: "#ffffff",
													border: "1px solid",
												}}
											>
												<option value="morning">Morning</option>
												<option value="afternoon">Afternoon</option>
												<option value="evening">Evening</option>
												<option value="flexible">Flexible</option>
											</select>
										</div>
										<div>
											<label
												className="block text-sm font-medium mb-2"
												style={{ color: "#9ca3af" }}
											>
												Workout Duration (minutes)
											</label>
											<input
												type="number"
												value={trainingData.workoutDuration}
												onChange={(e) =>
													setTrainingData((prev) => ({
														...prev,
														workoutDuration: parseInt(e.target.value) || 60,
													}))
												}
												className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
												style={{
													backgroundColor: "#2a2a2a",
													borderColor: "#374151",
													color: "#ffffff",
													border: "1px solid",
												}}
												placeholder="60"
											/>
										</div>
										<div>
											<label
												className="block text-sm font-medium mb-2"
												style={{ color: "#9ca3af" }}
											>
												Experience Level
											</label>
											<select
												value={trainingData.experienceLevel}
												onChange={(e) =>
													setTrainingData((prev) => ({
														...prev,
														experienceLevel: e.target.value,
													}))
												}
												className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
												style={{
													backgroundColor: "#2a2a2a",
													borderColor: "#374151",
													color: "#ffffff",
													border: "1px solid",
												}}
											>
												<option value="beginner">Beginner</option>
												<option value="intermediate">Intermediate</option>
												<option value="advanced">Advanced</option>
												<option value="professional">Professional</option>
											</select>
										</div>
									</div>

									<div>
										<label
											className="block text-sm font-medium mb-2"
											style={{ color: "#9ca3af" }}
										>
											Training Goals
										</label>
										<textarea
											rows={3}
											value={trainingData.goals}
											onChange={(e) =>
												setTrainingData((prev) => ({
													...prev,
													goals: e.target.value,
												}))
											}
											className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 resize-none"
											style={{
												backgroundColor: "#2a2a2a",
												borderColor: "#374151",
												color: "#ffffff",
												border: "1px solid",
											}}
											placeholder="Describe your training goals..."
										/>
									</div>

									<div>
										<label
											className="block text-sm font-medium mb-2"
											style={{ color: "#9ca3af" }}
										>
											Injuries or Limitations
										</label>
										<textarea
											rows={3}
											value={trainingData.injuries}
											onChange={(e) =>
												setTrainingData((prev) => ({
													...prev,
													injuries: e.target.value,
												}))
											}
											className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 resize-none"
											style={{
												backgroundColor: "#2a2a2a",
												borderColor: "#374151",
												color: "#ffffff",
												border: "1px solid",
											}}
											placeholder="List any injuries or physical limitations..."
										/>
									</div>
								</div>
							</div>
						)}

						{/* Appearance Settings */}
						{activeTab === "appearance" && (
							<div>
								<h3
									className="text-2xl font-bold mb-6"
									style={{ color: "#ffffff" }}
								>
									Appearance Settings
								</h3>
								<div className="space-y-6">
									<div className="space-y-4">
										{[
											{
												key: "compactSidebar",
												label: "Compact Sidebar",
												description: "Use a more compact sidebar layout",
											},
											{
												key: "showAnimations",
												label: "Show Animations",
												description: "Enable smooth animations and transitions",
											},
											{
												key: "darkMode",
												label: "Dark Mode",
												description: "Use dark theme (always enabled)",
											},
										].map((setting) => (
											<div
												key={setting.key}
												className="flex items-center justify-between p-4 rounded-xl"
												style={{ backgroundColor: "#2a2a2a" }}
											>
												<div>
													<h4 className="font-medium text-white">
														{setting.label}
													</h4>
													<p className="text-sm" style={{ color: "#9ca3af" }}>
														{setting.description}
													</p>
												</div>
												<input
													type="checkbox"
													checked={
														appearanceData[
															setting.key as keyof typeof appearanceData
														]
													}
													onChange={(e) =>
														setAppearanceData((prev) => ({
															...prev,
															[setting.key]: e.target.checked,
														}))
													}
													disabled={setting.key === "darkMode"}
													className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 disabled:opacity-50"
												/>
											</div>
										))}
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
	)
}
