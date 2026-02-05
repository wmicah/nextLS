"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileClientSettingsPage from "@/components/MobileClientSettingsPage";
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
} from "lucide-react";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import { pushNotificationService } from "@/lib/pushNotifications";
import { COLORS, getGoldenAccent } from "@/lib/colors";

function ClientSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state for each tabb
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
  useEffect(
    () => {
      if (userSettings) {
        setProfileData({
          name: currentUser?.name || "",
          phone: userSettings?.phone || "",
          location: userSettings?.location || "",
          bio: userSettings?.bio || "",
          avatarUrl: userSettings?.avatarUrl || "",
        });

        setNotificationData({
          emailNotifications: userSettings.emailNotifications ?? true,
          pushNotifications: userSettings.pushNotifications ?? true,
          soundNotifications: userSettings.soundNotifications ?? false,
          messageNotifications: userSettings.messageNotifications ?? true,
          scheduleNotifications: userSettings.scheduleNotifications ?? true,
        });

        setTrainingData({
          preferredWorkoutTime: "morning",
          workoutDuration: 60,
          experienceLevel: "beginner",
          goals: "",
          injuries: "",
        });

        setAppearanceData({
          compactSidebar: userSettings.compactSidebar ?? false,
          showAnimations: userSettings.showAnimations ?? true,
          darkMode: true,
        });
      }
    },
    [userSettings, currentUser] as const
  );

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
          // Training preferences are not supported in the current API
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

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
    >
      {/* Simple Header - matches client messages/notifications */}
      <div
        className="flex-shrink-0 border-b px-4 sm:px-6 py-4"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: getGoldenAccent(0.2),
                color: COLORS.GOLDEN_ACCENT,
              }}
            >
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Settings
              </h1>
              <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                {currentUser?.name || "Athlete"} · Account preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 p-4 sm:px-6 overflow-y-auto min-h-0">
        {/* Settings Sidebar */}
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <div
            className="rounded-xl border p-4 md:p-6"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Settings
            </h2>
            <nav className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:space-y-2 lg:block">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-2 lg:px-4 py-3 rounded-lg text-center lg:text-left transition-all duration-200 touch-manipulation min-h-[44px] ${
                    activeTab === tab.id ? "" : "hover:opacity-90"
                  }`}
                  style={{
                    backgroundColor:
                      activeTab === tab.id
                        ? getGoldenAccent(0.15)
                        : "transparent",
                    color:
                      activeTab === tab.id
                        ? COLORS.GOLDEN_ACCENT
                        : COLORS.TEXT_SECONDARY,
                    border:
                      activeTab === tab.id
                        ? `1px solid ${getGoldenAccent(0.3)}`
                        : "1px solid transparent",
                  }}
                >
                  {tab.icon}
                  <span className="font-medium text-xs lg:text-sm">
                    {tab.name}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-xl border p-4 md:p-8"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div>
                <h3
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Profile Settings
                </h3>
                <div className="space-y-4 md:space-y-6">
                  {/* Profile Picture */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-3"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
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
                      <div className="flex flex-col gap-2">
                        <p
                          className="text-sm"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          Click on your profile picture to upload a new one
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
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
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
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
                        className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 min-h-[44px]"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.TEXT_PRIMARY,
                          border: "1px solid",
                        }}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        value={currentUser?.email || ""}
                        disabled
                        className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 opacity-50 min-h-[44px]"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.TEXT_PRIMARY,
                          border: "1px solid",
                        }}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
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
                        className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 min-h-[44px]"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.TEXT_PRIMARY,
                          border: "1px solid",
                        }}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
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
                        className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 min-h-[44px]"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.TEXT_PRIMARY,
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
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
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
                      className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 resize-none"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
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
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: COLORS.TEXT_PRIMARY }}
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
                        key: "messageNotifications",
                        label: "Message Notifications",
                        description: "Notifications from your coach",
                      },
                      {
                        key: "scheduleNotifications",
                        label: "Schedule Reminders",
                        description: "Reminders about upcoming sessions",
                      },
                    ].map(notification => (
                      <div
                        key={notification.key}
                        className="flex items-center justify-between p-4 rounded-xl min-h-[44px]"
                        style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                      >
                        <div>
                          <h4
                            className="font-medium"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            {notification.label}
                          </h4>
                          <p
                            className="text-sm"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
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
                          onChange={async e => {
                            const checked = e.target.checked;
                            const key = notification.key;

                            // Special handling for push notifications
                            if (key === "pushNotifications" && checked) {
                              try {
                                // Check if browser supports notifications
                                if (
                                  "Notification" in window &&
                                  "serviceWorker" in navigator &&
                                  "PushManager" in window
                                ) {
                                  // Request permission if not already granted
                                  if (Notification.permission === "default") {
                                    const permission =
                                      await Notification.requestPermission();
                                    if (permission !== "granted") {
                                      alert(
                                        "Push notifications require browser permission. Please enable notifications in your browser settings."
                                      );
                                      return; // Don't update state if permission denied
                                    }
                                  }

                                  // Subscribe to push notifications
                                  if (Notification.permission === "granted") {
                                    const subscription =
                                      await pushNotificationService.subscribeToPush();
                                    if (!subscription) {
                                      alert(
                                        "Failed to enable push notifications. Please try again."
                                      );
                                      return;
                                    }
                                  }
                                } else {
                                  alert(
                                    "Push notifications are not supported in this browser."
                                  );
                                  return;
                                }
                              } catch (error: any) {
                                console.error(
                                  "Error enabling push notifications:",
                                  error
                                );
                                alert(
                                  "Failed to enable push notifications. Please check your browser settings."
                                );
                                return;
                              }
                            }

                            // Update state for all notification types
                            setNotificationData(prev => ({
                              ...prev,
                              [key]: checked,
                            }));
                          }}
                          className="w-5 h-5 rounded accent-[var(--golden)]"
                          style={{ accentColor: COLORS.GOLDEN_ACCENT }}
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
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Training Preferences
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
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
                        className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 min-h-[44px]"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.TEXT_PRIMARY,
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
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        Workout Duration (minutes)
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
                        className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 min-h-[44px]"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.TEXT_PRIMARY,
                          border: "1px solid",
                        }}
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
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
                        className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 min-h-[44px]"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.TEXT_PRIMARY,
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
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      Training Goals
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
                      className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 resize-none"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                        border: "1px solid",
                      }}
                      placeholder="Describe your training goals..."
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
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
                      className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 resize-none"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
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
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: COLORS.TEXT_PRIMARY }}
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
                    ].map(setting => (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between p-4 rounded-xl min-h-[44px]"
                        style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                      >
                        <div>
                          <h4
                            className="font-medium"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            {setting.label}
                          </h4>
                          <p
                            className="text-sm"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
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
                          onChange={e =>
                            setAppearanceData(prev => ({
                              ...prev,
                              [setting.key]: e.target.checked,
                            }))
                          }
                          disabled={setting.key === "darkMode"}
                          className="w-5 h-5 rounded disabled:opacity-50"
                          style={{ accentColor: COLORS.GOLDEN_ACCENT }}
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
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              <div className="flex justify-between items-center">
                {saveSuccess && (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl min-h-[44px]"
                    style={{
                      backgroundColor: COLORS.GREEN_PRIMARY,
                      color: COLORS.BACKGROUND_DARK,
                    }}
                  >
                    <Save className="w-4 h-4 flex-shrink-0" />
                    Settings saved successfully!
                  </div>
                )}
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg min-h-[44px] touch-manipulation"
                  style={{
                    backgroundColor: COLORS.GOLDEN_ACCENT,
                    color: COLORS.BACKGROUND_DARK,
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
  );
}

export default withMobileDetection(
  MobileClientSettingsPage,
  ClientSettingsPage
);
