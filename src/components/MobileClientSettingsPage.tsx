"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { ChevronLeft } from "lucide-react";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import MobileClientNavigation from "./MobileClientNavigation";
import MobileClientBottomNavigation from "./MobileClientBottomNavigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { pushNotificationService } from "@/lib/pushNotifications";
import { COLORS, getGoldenAccent } from "@/lib/colors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MobileClientSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const updateProfileMutation = trpc.settings.updateProfile.useMutation({
    onSuccess: () => {
      refetchSettings();
      refetchUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  // Update form data when settings load
  useEffect(() => {
    if (userSettings && currentUser) {
      setProfileData({
        name: currentUser.name || "",
        phone: userSettings.phone || "",
        location: userSettings.location || "",
        bio: userSettings.bio || "",
        avatarUrl: userSettings.avatarUrl || "",
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
        compactSidebar: false,
        showAnimations: true,
        darkMode: true,
      });
    }
  }, [userSettings]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await updateProfileMutation.mutateAsync({
        name: profileData.name,
        phone: profileData.phone,
        location: profileData.location,
        bio: profileData.bio,
        avatarUrl: profileData.avatarUrl,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await updateSettingsMutation.mutateAsync({
        emailNotifications: notificationData.emailNotifications,
        pushNotifications: notificationData.pushNotifications,
        soundNotifications: notificationData.soundNotifications,
        messageNotifications: notificationData.messageNotifications,
        scheduleNotifications: notificationData.scheduleNotifications,
        compactSidebar: appearanceData.compactSidebar,
        showAnimations: appearanceData.showAnimations,
      });
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "notifications", label: "Notifications" },
    { id: "training", label: "Training" },
    { id: "appearance", label: "Appearance" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
    >
      {/* Mobile Header */}
      <div
        className="sticky top-0 z-50 border-b px-4 pb-3"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          paddingTop: "calc(0.75rem + env(safe-area-inset-top))",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/client-dashboard")}
              className="p-2 rounded-lg transition-colors touch-manipulation flex-shrink-0"
              style={{
                minWidth: 44,
                minHeight: 44,
                backgroundColor: "transparent",
                color: COLORS.TEXT_PRIMARY,
              }}
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1
                className="text-lg font-bold truncate"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Settings
              </h1>
              <p
                className="text-sm truncate"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                Account preferences
              </p>
            </div>
          </div>
          <MobileClientNavigation currentPage="settings" />
        </div>
      </div>

      {/* Main Content - bottom padding clears bottom nav + safe area */}
      <div
        className="p-4 space-y-6"
        style={{
          paddingBottom:
            "max(5rem, calc(5rem + env(safe-area-inset-bottom, 0px)))",
        }}
      >
        {/* Tab Navigation */}
        <div className="grid grid-cols-2 gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="p-3 rounded-lg transition-colors flex items-center gap-2 min-h-[44px] touch-manipulation"
              style={{
                backgroundColor:
                  activeTab === tab.id
                    ? getGoldenAccent(0.2)
                    : COLORS.BACKGROUND_CARD,
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
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="space-y-4">
              <div className="text-center">
                <ProfilePictureUploader
                  currentAvatarUrl={profileData.avatarUrl}
                  userName={profileData.name}
                  onAvatarChange={newUrl => {
                    setProfileData(prev => ({ ...prev, avatarUrl: newUrl }));
                  }}
                  size="lg"
                  readOnly={false}
                />
                <p
                  className="text-sm mt-2"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  Tap to change profile picture
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={e =>
                      setProfileData(prev => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="mt-1 text-base min-h-[44px]"
                    placeholder="Enter your full name"
                    style={{
                      fontSize: 16,
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={e =>
                      setProfileData(prev => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="mt-1 text-base min-h-[44px]"
                    placeholder="Enter your phone number"
                    style={{
                      fontSize: 16,
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="location"
                    className="text-sm font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={e =>
                      setProfileData(prev => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="mt-1 text-base min-h-[44px]"
                    placeholder="Enter your location"
                    style={{
                      fontSize: 16,
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="bio"
                    className="text-sm font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={e =>
                      setProfileData(prev => ({ ...prev, bio: e.target.value }))
                    }
                    className="mt-1 text-base"
                    placeholder="Tell us about yourself..."
                    rows={3}
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="w-full min-h-[44px] touch-manipulation"
                style={{
                  backgroundColor: COLORS.GOLDEN_ACCENT,
                  color: COLORS.BACKGROUND_DARK,
                }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </div>
                ) : (
                  <>Save Profile</>
                )}
              </Button>

              {saveSuccess && (
                <div
                  className="text-center text-sm"
                  style={{ color: COLORS.GREEN_PRIMARY }}
                >
                  Profile saved successfully!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between min-h-[44px] py-2">
                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Email Notifications
                  </Label>
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    Receive email updates
                  </p>
                </div>
                <Switch
                  checked={notificationData.emailNotifications}
                  onCheckedChange={checked =>
                    setNotificationData(prev => ({
                      ...prev,
                      emailNotifications: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between min-h-[44px] py-2">
                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Push Notifications
                  </Label>
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    Receive push notifications
                  </p>
                </div>
                <Switch
                  checked={notificationData.pushNotifications}
                  onCheckedChange={async checked => {
                    if (checked) {
                      // Request browser permission when enabling
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
                      pushNotifications: checked,
                    }));
                  }}
                />
              </div>

              <div className="flex items-center justify-between min-h-[44px] py-2">
                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Sound Notifications
                  </Label>
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    Play sounds for notifications
                  </p>
                </div>
                <Switch
                  checked={notificationData.soundNotifications}
                  onCheckedChange={checked =>
                    setNotificationData(prev => ({
                      ...prev,
                      soundNotifications: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between min-h-[44px] py-2">
                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Message Notifications
                  </Label>
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    Notify about new messages
                  </p>
                </div>
                <Switch
                  checked={notificationData.messageNotifications}
                  onCheckedChange={checked =>
                    setNotificationData(prev => ({
                      ...prev,
                      messageNotifications: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between min-h-[44px] py-2">
                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Schedule Notifications
                  </Label>
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    Notify about schedule changes
                  </p>
                </div>
                <Switch
                  checked={notificationData.scheduleNotifications}
                  onCheckedChange={checked =>
                    setNotificationData(prev => ({
                      ...prev,
                      scheduleNotifications: checked,
                    }))
                  }
                />
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="w-full min-h-[44px] touch-manipulation"
                style={{
                  backgroundColor: COLORS.GOLDEN_ACCENT,
                  color: COLORS.BACKGROUND_DARK,
                }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Saving...
                  </div>
                ) : (
                  <>Save Notifications</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Training Tab */}
        {activeTab === "training" && (
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="space-y-4">
              <div>
                <Label
                  className="text-sm font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Preferred Workout Time
                </Label>
                <Select
                  value={trainingData.preferredWorkoutTime}
                  onValueChange={value =>
                    setTrainingData(prev => ({
                      ...prev,
                      preferredWorkoutTime: value,
                    }))
                  }
                >
                  <SelectTrigger
                    className="mt-1 min-h-[44px] text-base"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  className="text-sm font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Workout Duration (minutes)
                </Label>
                <Input
                  type="number"
                  value={trainingData.workoutDuration}
                  onChange={e =>
                    setTrainingData(prev => ({
                      ...prev,
                      workoutDuration: parseInt(e.target.value) || 60,
                    }))
                  }
                  className="mt-1 text-base min-h-[44px]"
                  placeholder="60"
                  style={{
                    fontSize: 16,
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                />
              </div>

              <div>
                <Label
                  className="text-sm font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Experience Level
                </Label>
                <Select
                  value={trainingData.experienceLevel}
                  onValueChange={value =>
                    setTrainingData(prev => ({
                      ...prev,
                      experienceLevel: value,
                    }))
                  }
                >
                  <SelectTrigger
                    className="mt-1 min-h-[44px] text-base"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="goals"
                  className="text-sm font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Training Goals
                </Label>
                <Textarea
                  id="goals"
                  value={trainingData.goals}
                  onChange={e =>
                    setTrainingData(prev => ({
                      ...prev,
                      goals: e.target.value,
                    }))
                  }
                  className="mt-1 text-base"
                  placeholder="What are your training goals?"
                  rows={3}
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                />
              </div>

              <div>
                <Label
                  htmlFor="injuries"
                  className="text-sm font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Injuries or Limitations
                </Label>
                <Textarea
                  id="injuries"
                  value={trainingData.injuries}
                  onChange={e =>
                    setTrainingData(prev => ({
                      ...prev,
                      injuries: e.target.value,
                    }))
                  }
                  className="mt-1 text-base"
                  placeholder="Any injuries or limitations we should know about?"
                  rows={3}
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                />
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="w-full min-h-[44px] touch-manipulation"
                style={{
                  backgroundColor: COLORS.GOLDEN_ACCENT,
                  color: COLORS.BACKGROUND_DARK,
                }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Saving...
                  </div>
                ) : (
                  <>Save Training Info</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === "appearance" && (
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between min-h-[44px] py-2">
                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Compact Sidebar
                  </Label>
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    Use a more compact sidebar layout
                  </p>
                </div>
                <Switch
                  checked={appearanceData.compactSidebar}
                  onCheckedChange={checked =>
                    setAppearanceData(prev => ({
                      ...prev,
                      compactSidebar: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between min-h-[44px] py-2">
                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Show Animations
                  </Label>
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    Enable UI animations and transitions
                  </p>
                </div>
                <Switch
                  checked={appearanceData.showAnimations}
                  onCheckedChange={checked =>
                    setAppearanceData(prev => ({
                      ...prev,
                      showAnimations: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between min-h-[44px] py-2">
                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Dark Mode
                  </Label>
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    Use dark theme (always enabled on mobile)
                  </p>
                </div>
                <Switch
                  checked={appearanceData.darkMode}
                  onCheckedChange={checked =>
                    setAppearanceData(prev => ({ ...prev, darkMode: checked }))
                  }
                />
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="w-full min-h-[44px] touch-manipulation"
                style={{
                  backgroundColor: COLORS.GOLDEN_ACCENT,
                  color: COLORS.BACKGROUND_DARK,
                }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Saving...
                  </div>
                ) : (
                  <>Save Appearance</>
                )}
              </Button>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div
            className="text-center text-sm"
            style={{ color: COLORS.GREEN_PRIMARY }}
          >
            Settings saved successfully!
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileClientBottomNavigation />
    </div>
  );
}
