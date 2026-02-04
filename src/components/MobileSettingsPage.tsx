"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
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
  ChevronLeft,
  Menu,
  AlertTriangle,
  Home,
} from "lucide-react";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import { useMobileDetection } from "@/lib/mobile-detection";
import { pushNotificationService } from "@/lib/pushNotifications";
import { useRouter } from "next/navigation";

/** Minimal settings type to avoid deep tRPC inference from getSettings. */
interface MobileSettingsShape {
  id?: string;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  soundNotifications?: boolean;
  newClientNotifications?: boolean;
  messageNotifications?: boolean;
  scheduleNotifications?: boolean;
  defaultWelcomeMessage?: string | null;
  messageRetentionDays?: number;
  maxFileSizeMB?: number;
  defaultLessonDuration?: number;
  autoArchiveDays?: number;
  requireClientEmail?: boolean;
  timezone?: string;
  workingDays?: string[] | string | unknown;
  clientScheduleAdvanceLimitDays?: number;
  compactSidebar?: boolean;
  showAnimations?: boolean;
}

export default function MobileSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showTabMenu, setShowTabMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    newClientNotifications: true,
    messageNotifications: true,
    scheduleNotifications: true,
  });

  const [messagingData, setMessagingData] = useState({
    defaultWelcomeMessage: "",
    messageRetentionDays: 90,
    maxFileSizeMB: 50,
  });

  const [clientData, setClientData] = useState({
    defaultLessonDuration: 60,
    autoArchiveDays: 90,
    requireClientEmail: false,
  });

  const [scheduleData, setScheduleData] = useState({
    timezone: "UTC-5",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    clientScheduleAdvanceLimitDays: 30,
  });

  const [appearanceData, setAppearanceData] = useState({
    compactSidebar: false,
    showAnimations: true,
  });

  // Get current user data
  const { data: currentUser, refetch: refetchUser } =
    trpc.user.getProfile.useQuery();

  // Get user settings
  const { data: userSettingsRaw, refetch: refetchSettings } =
    trpc.settings.getSettings.useQuery();
  const userSettings = userSettingsRaw as
    | MobileSettingsShape
    | null
    | undefined;

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
        emailNotifications:
          userSettings.emailNotifications ?? prev.emailNotifications,
        pushNotifications:
          userSettings.pushNotifications ?? prev.pushNotifications,
        soundNotifications:
          userSettings.soundNotifications ?? prev.soundNotifications,
        newClientNotifications:
          userSettings.newClientNotifications ?? prev.newClientNotifications,
        messageNotifications:
          userSettings.messageNotifications ?? prev.messageNotifications,
        scheduleNotifications:
          userSettings.scheduleNotifications ?? prev.scheduleNotifications,
      }));

      setMessagingData(prev => ({
        ...prev,
        defaultWelcomeMessage: userSettings.defaultWelcomeMessage || "",
        messageRetentionDays:
          userSettings.messageRetentionDays ?? prev.messageRetentionDays,
        maxFileSizeMB: userSettings.maxFileSizeMB ?? prev.maxFileSizeMB,
      }));

      setClientData(prev => ({
        ...prev,
        defaultLessonDuration:
          userSettings.defaultLessonDuration ?? prev.defaultLessonDuration,
        autoArchiveDays: userSettings.autoArchiveDays ?? prev.autoArchiveDays,
        requireClientEmail:
          userSettings.requireClientEmail ?? prev.requireClientEmail,
      }));

      let workingDays: string[] = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ];

      if (userSettings.workingDays) {
        if (Array.isArray(userSettings.workingDays)) {
          workingDays = userSettings.workingDays as string[];
        } else if (typeof userSettings.workingDays === "string") {
          try {
            const parsed = JSON.parse(userSettings.workingDays) as string[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              workingDays = parsed;
            }
          } catch (error) {
            console.warn("Failed to parse workingDays from settings:", error);
          }
        }
      }

      setScheduleData(prev => ({
        ...prev,
        timezone: userSettings.timezone ?? prev.timezone,
        workingDays,
        clientScheduleAdvanceLimitDays:
          userSettings.clientScheduleAdvanceLimitDays ??
          prev.clientScheduleAdvanceLimitDays,
      }));

      setAppearanceData(prev => ({
        ...prev,
        compactSidebar: userSettings.compactSidebar ?? prev.compactSidebar,
        showAnimations: userSettings.showAnimations ?? prev.showAnimations,
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
    {
      id: "account",
      name: "Account Settings",
      icon: <SettingsIcon className="w-5 h-5" />,
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
            newClientNotifications: notificationData.newClientNotifications,
            messageNotifications: notificationData.messageNotifications,
            scheduleNotifications: notificationData.scheduleNotifications,
          });
          break;
        case "messaging":
          await updateSettingsMutation.mutateAsync({
            defaultWelcomeMessage: messagingData.defaultWelcomeMessage,
            messageRetentionDays: messagingData.messageRetentionDays,
            maxFileSizeMB: messagingData.maxFileSizeMB,
          });
          break;
        case "clients":
          await updateSettingsMutation.mutateAsync({
            defaultLessonDuration: clientData.defaultLessonDuration,
            autoArchiveDays: clientData.autoArchiveDays,
            requireClientEmail: clientData.requireClientEmail,
          });
          break;
        case "schedule":
          await updateSettingsMutation.mutateAsync({
            timezone: scheduleData.timezone,
            workingDays: scheduleData.workingDays,
            clientScheduleAdvanceLimitDays:
              scheduleData.clientScheduleAdvanceLimitDays,
          });
          break;
        case "billing":
          // Billing is handled by Stripe Customer Portal
          // No local settings to save
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
      <div
        className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-4 pb-4"
        style={{ paddingTop: `calc(1rem + env(safe-area-inset-top))` }}
      >
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              style={{ minWidth: "44px", minHeight: "44px" }}
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
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
                placeholder="Tell your clients about yourself..."
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
                {
                  key: "newClientNotifications",
                  label: "New Client Notifications",
                },
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
                    onClick={async () => {
                      const newValue =
                        !notificationData[key as keyof typeof notificationData];

                      // Special handling for push notifications
                      if (key === "pushNotifications" && newValue) {
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

                      // Update state
                      setNotificationData(prev => ({
                        ...prev,
                        [key]: newValue,
                      }));
                    }}
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

        {/* Messaging Settings */}
        {activeTab === "messaging" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">
              Messaging Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Default Welcome Message
                </label>
                <textarea
                  rows={3}
                  value={messagingData.defaultWelcomeMessage}
                  onChange={e =>
                    setMessagingData(prev => ({
                      ...prev,
                      defaultWelcomeMessage: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  placeholder="Enter your default welcome message..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Message Retention (Days)
                </label>
                <input
                  type="number"
                  value={messagingData.messageRetentionDays}
                  onChange={e =>
                    setMessagingData(prev => ({
                      ...prev,
                      messageRetentionDays: parseInt(e.target.value) || 90,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Max File Size (MB)
                </label>
                <input
                  type="number"
                  value={messagingData.maxFileSizeMB}
                  onChange={e =>
                    setMessagingData(prev => ({
                      ...prev,
                      maxFileSizeMB: parseInt(e.target.value) || 50,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Client Management Settings */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">
              Client Management
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Default Lesson Duration (minutes)
                </label>
                <input
                  type="number"
                  value={clientData.defaultLessonDuration}
                  onChange={e =>
                    setClientData(prev => ({
                      ...prev,
                      defaultLessonDuration: parseInt(e.target.value) || 60,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Auto Archive Days
                </label>
                <input
                  type="number"
                  value={clientData.autoArchiveDays}
                  onChange={e =>
                    setClientData(prev => ({
                      ...prev,
                      autoArchiveDays: parseInt(e.target.value) || 90,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="90"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <span className="text-white font-medium">
                  Require Client Email
                </span>
                <button
                  onClick={() =>
                    setClientData(prev => ({
                      ...prev,
                      requireClientEmail: !prev.requireClientEmail,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    clientData.requireClientEmail
                      ? "bg-blue-600"
                      : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      clientData.requireClientEmail
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Settings */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">
              Schedule Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Timezone
                </label>
                <select
                  value={scheduleData.timezone}
                  onChange={e =>
                    setScheduleData(prev => ({
                      ...prev,
                      timezone: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="UTC-5">UTC-5 (Eastern)</option>
                  <option value="UTC-6">UTC-6 (Central)</option>
                  <option value="UTC-7">UTC-7 (Mountain)</option>
                  <option value="UTC-8">UTC-8 (Pacific)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Client Scheduling Window (days)
                </label>
                <input
                  type="number"
                  min={0}
                  value={scheduleData.clientScheduleAdvanceLimitDays}
                  onChange={e =>
                    setScheduleData(prev => ({
                      ...prev,
                      clientScheduleAdvanceLimitDays: Math.max(
                        0,
                        parseInt(e.target.value, 10) || 0
                      ),
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="30"
                />
                <p className="mt-2 text-xs text-gray-400">
                  Clients can request lessons up to this many days in advance.
                  Use 0 for no limit.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Working Days
                </label>
                <div className="space-y-2">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map(day => (
                    <div
                      key={day}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    >
                      <span className="text-white">{day}</span>
                      <button
                        onClick={() => {
                          setScheduleData(prev => ({
                            ...prev,
                            workingDays: prev.workingDays.includes(day)
                              ? prev.workingDays.filter(d => d !== day)
                              : [...prev.workingDays, day],
                          }));
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          scheduleData.workingDays.includes(day)
                            ? "bg-blue-600"
                            : "bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            scheduleData.workingDays.includes(day)
                              ? "translate-x-5"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing Settings */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">
              Billing & Payments
            </h2>

            <div className="p-6 bg-gray-800 rounded-xl text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Manage Billing
              </h3>
              <p className="text-gray-400 mb-4">
                Access your billing information and manage your subscription
                through our secure portal.
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Open Billing Portal
              </button>
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
            </div>
          </div>
        )}

        {/* Delete Account Section */}
        <div className="mt-6 p-4 bg-red-950/10 border border-red-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-400 mb-4">
                Once you delete your account, there is no going back. All your
                data, programs, clients, and progress will be permanently
                removed.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-colors"
              >
                <AlertTriangle className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
