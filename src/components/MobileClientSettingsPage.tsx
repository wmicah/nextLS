"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  User,
  Bell,
  MessageSquare,
  Target,
  Calendar,
  Palette,
  Save,
  Settings as SettingsIcon,
  ChevronLeft,
  Menu,
  Activity,
  Clock,
} from "lucide-react";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";

export default function MobileClientSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showTabMenu, setShowTabMenu] = useState(false);

  // Form state for each tab
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    location: "",
    bio: "",
    avatarUrl: "",
  });

  const [notificationData, setNotificationData] = useState({
    emailNotifications: true,
    pushNotifications: true,
    soundNotifications: false,
    messageNotifications: true,
    scheduleNotifications: true,
  });

  const [trainingData, setTrainingData] = useState({
    preferredWorkoutTime: "morning",
    workoutDuration: 60,
    experienceLevel: "beginner",
    goals: "",
    injuries: "",
  });

  const [appearanceData, setAppearanceData] = useState({
    compactSidebar: false,
    showAnimations: true,
    darkMode: true,
  });

  // Get current user data
  const { data: currentUser, refetch: refetchUser } =
    trpc.user.getProfile.useQuery();

  // Get user settings
  const { data: userSettings, refetch: refetchSettings } =
    trpc.settings.getSettings.useQuery();

  // Settings mutations
  const updateSettingsMutation = trpc.settings.updateSettings.useMutation({
    onSuccess: () => {
      refetchSettings();
    },
  });

  const updateProfileMutation = trpc.settings.updateProfile.useMutation({
    onSuccess: () => {
      refetchSettings();
      refetchUser();
    },
  });

  // Update form data when settings load
  useEffect(() => {
    if (userSettings && currentUser) {
      setProfileData(prev => ({
        ...prev,
        name: currentUser.name || "",
        phone: userSettings.phone || "",
        location: userSettings.location || "",
        bio: userSettings.bio || "",
        avatarUrl: userSettings.avatarUrl || "",
      }));

      setNotificationData(prev => ({
        ...prev,
        emailNotifications: userSettings.emailNotifications ?? true,
        pushNotifications: userSettings.pushNotifications ?? true,
        soundNotifications: userSettings.soundNotifications ?? false,
        messageNotifications: userSettings.messageNotifications ?? true,
        scheduleNotifications: userSettings.scheduleNotifications ?? true,
      }));

      setTrainingData(prev => ({
        ...prev,
        preferredWorkoutTime: "morning",
        workoutDuration: 60,
        experienceLevel: "beginner",
        goals: "",
        injuries: "",
      }));

      setAppearanceData(prev => ({
        ...prev,
        compactSidebar: userSettings.compactSidebar ?? false,
        showAnimations: userSettings.showAnimations ?? true,
        darkMode: true,
      }));
    }
  }, [userSettings?.id, currentUser?.id]);

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
  ];

  const handleSave = async () => {
    setIsLoading(true);
    setSaveSuccess(false);
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
          });
          break;
        case "notifications":
          await updateSettingsMutation.mutateAsync({
            emailNotifications: notificationData.emailNotifications,
            pushNotifications: notificationData.pushNotifications,
            soundNotifications: notificationData.soundNotifications,
            messageNotifications: notificationData.messageNotifications,
            scheduleNotifications: notificationData.scheduleNotifications,
          });
          break;
        case "training":
          // Training preferences would be saved here
          // This would need to be implemented in the backend
          break;
        case "appearance":
          await updateSettingsMutation.mutateAsync({
            compactSidebar: appearanceData.compactSidebar,
            showAnimations: appearanceData.showAnimations,
          });
          break;
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsLoading(false);
      setSaveSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTabMenu(true)}
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Settings</h1>
              <p className="text-sm text-gray-400">{currentTab?.name}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tab Menu Modal */}
      {showTabMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-80 bg-gray-900 border-r border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Settings</h2>
                <button
                  onClick={() => setShowTabMenu(false)}
                  className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowTabMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-600 text-white rounded-lg flex items-center gap-2">
            <Save className="w-4 h-4" />
            Settings saved successfully!
          </div>
        )}

        {/* Profile Settings */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">
              Profile Settings
            </h2>

            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">
                Profile Picture
              </label>
              <div className="flex flex-col items-center gap-4">
                <ProfilePictureUploader
                  currentAvatarUrl={profileData.avatarUrl}
                  userName={currentUser?.name || "User"}
                  onAvatarChange={url =>
                    setProfileData(prev => ({
                      ...prev,
                      avatarUrl: url,
                    }))
                  }
                  size="lg"
                />
                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    Tap your profile picture to upload a new one
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports JPG, PNG up to 4MB
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={e =>
                    setProfileData(prev => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-gray-400 opacity-50"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={e =>
                    setProfileData(prev => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Location
                </label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={e =>
                    setProfileData(prev => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Enter your location"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Bio
              </label>
              <textarea
                rows={4}
                value={profileData.bio}
                onChange={e =>
                  setProfileData(prev => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                placeholder="Tell your coach about yourself..."
              />
            </div>
          </div>
        )}

        {/* Notifications Settings */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">
              Notification Settings
            </h2>

            <div className="space-y-4">
              {[
                { key: "emailNotifications", label: "Email Notifications" },
                { key: "pushNotifications", label: "Push Notifications" },
                { key: "soundNotifications", label: "Sound Notifications" },
                { key: "messageNotifications", label: "Message Notifications" },
                {
                  key: "scheduleNotifications",
                  label: "Schedule Notifications",
                },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-xl"
                >
                  <span className="text-white font-medium">{label}</span>
                  <button
                    onClick={() =>
                      setNotificationData(prev => ({
                        ...prev,
                        [key]: !prev[key as keyof typeof notificationData],
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationData[key as keyof typeof notificationData]
                        ? "bg-blue-600"
                        : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationData[key as keyof typeof notificationData]
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training Preferences */}
        {activeTab === "training" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">
              Training Preferences
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Preferred Workout Time
                </label>
                <select
                  value={trainingData.preferredWorkoutTime}
                  onChange={e =>
                    setTrainingData(prev => ({
                      ...prev,
                      preferredWorkoutTime: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="morning">Morning (6 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                  <option value="evening">Evening (6 PM - 10 PM)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Preferred Workout Duration (minutes)
                </label>
                <input
                  type="number"
                  value={trainingData.workoutDuration}
                  onChange={e =>
                    setTrainingData(prev => ({
                      ...prev,
                      workoutDuration: parseInt(e.target.value) || 60,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Experience Level
                </label>
                <select
                  value={trainingData.experienceLevel}
                  onChange={e =>
                    setTrainingData(prev => ({
                      ...prev,
                      experienceLevel: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="professional">Professional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Goals
                </label>
                <textarea
                  rows={3}
                  value={trainingData.goals}
                  onChange={e =>
                    setTrainingData(prev => ({
                      ...prev,
                      goals: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  placeholder="What are your training goals?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Injuries or Limitations
                </label>
                <textarea
                  rows={3}
                  value={trainingData.injuries}
                  onChange={e =>
                    setTrainingData(prev => ({
                      ...prev,
                      injuries: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  placeholder="Any injuries or physical limitations your coach should know about?"
                />
              </div>
            </div>
          </div>
        )}

        {/* Appearance Settings */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">
              Appearance Settings
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <span className="text-white font-medium">Compact Sidebar</span>
                <button
                  onClick={() =>
                    setAppearanceData(prev => ({
                      ...prev,
                      compactSidebar: !prev.compactSidebar,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    appearanceData.compactSidebar
                      ? "bg-blue-600"
                      : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      appearanceData.compactSidebar
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <span className="text-white font-medium">Show Animations</span>
                <button
                  onClick={() =>
                    setAppearanceData(prev => ({
                      ...prev,
                      showAnimations: !prev.showAnimations,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    appearanceData.showAnimations
                      ? "bg-blue-600"
                      : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      appearanceData.showAnimations
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <span className="text-white font-medium">Dark Mode</span>
                <button
                  onClick={() =>
                    setAppearanceData(prev => ({
                      ...prev,
                      darkMode: !prev.darkMode,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    appearanceData.darkMode ? "bg-blue-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      appearanceData.darkMode
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
