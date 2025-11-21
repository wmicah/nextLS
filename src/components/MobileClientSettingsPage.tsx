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
  Activity,
  Clock,
  Home,
} from "lucide-react";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import MobileClientNavigation from "./MobileClientNavigation";
import MobileClientBottomNavigation from "./MobileClientBottomNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MobileClientSettingsPage() {
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
    { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
    },
    { id: "training", label: "Training", icon: <Target className="h-4 w-4" /> },
    {
      id: "appearance",
      label: "Appearance",
      icon: <Palette className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-[#2A3133] border-b border-[#606364] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <SettingsIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Settings</h1>
              <p className="text-xs text-gray-400">Account preferences</p>
            </div>
          </div>
          <MobileClientNavigation currentPage="settings" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-6">
        {/* Tab Navigation */}
        <div className="grid grid-cols-2 gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-[#4A5A70] text-white"
                  : "bg-[#353A3A] text-[#C3BCC2] hover:bg-[#4A5A70] hover:text-white"
              }`}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div
            className="p-4 rounded-lg border-2"
            style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
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
                <p className="text-sm text-[#ABA4AA] mt-2">
                  Tap to change profile picture
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-[#C3BCC2] text-sm font-medium"
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
                    className="mt-1 bg-[#353A3A] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] focus:ring-[#4A5A70]"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="phone"
                    className="text-[#C3BCC2] text-sm font-medium"
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
                    className="mt-1 bg-[#353A3A] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] focus:ring-[#4A5A70]"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="location"
                    className="text-[#C3BCC2] text-sm font-medium"
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
                    className="mt-1 bg-[#353A3A] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] focus:ring-[#4A5A70]"
                    placeholder="Enter your location"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="bio"
                    className="text-[#C3BCC2] text-sm font-medium"
                  >
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={e =>
                      setProfileData(prev => ({ ...prev, bio: e.target.value }))
                    }
                    className="mt-1 bg-[#353A3A] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] focus:ring-[#4A5A70]"
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="w-full bg-[#4A5A70] hover:bg-[#606364] text-white"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Profile
                  </div>
                )}
              </Button>

              {saveSuccess && (
                <div className="text-center text-green-400 text-sm">
                  Profile saved successfully!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div
            className="p-4 rounded-lg border-2"
            style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C3BCC2] text-sm font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-[#ABA4AA]">
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

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C3BCC2] text-sm font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-xs text-[#ABA4AA]">
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
                            const permission = await Notification.requestPermission();
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
                        console.error("Error enabling push notifications:", error);
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

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C3BCC2] text-sm font-medium">
                    Sound Notifications
                  </Label>
                  <p className="text-xs text-[#ABA4AA]">
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

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C3BCC2] text-sm font-medium">
                    Message Notifications
                  </Label>
                  <p className="text-xs text-[#ABA4AA]">
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

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C3BCC2] text-sm font-medium">
                    Schedule Notifications
                  </Label>
                  <p className="text-xs text-[#ABA4AA]">
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
                className="w-full bg-[#4A5A70] hover:bg-[#606364] text-white"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Notifications
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Training Tab */}
        {activeTab === "training" && (
          <div
            className="p-4 rounded-lg border-2"
            style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-[#C3BCC2] text-sm font-medium">
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
                  <SelectTrigger className="mt-1 bg-[#353A3A] border-[#606364] text-[#C3BCC2]">
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
                <Label className="text-[#C3BCC2] text-sm font-medium">
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
                  className="mt-1 bg-[#353A3A] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] focus:ring-[#4A5A70]"
                  placeholder="60"
                />
              </div>

              <div>
                <Label className="text-[#C3BCC2] text-sm font-medium">
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
                  <SelectTrigger className="mt-1 bg-[#353A3A] border-[#606364] text-[#C3BCC2]">
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
                  className="text-[#C3BCC2] text-sm font-medium"
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
                  className="mt-1 bg-[#353A3A] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] focus:ring-[#4A5A70]"
                  placeholder="What are your training goals?"
                  rows={3}
                />
              </div>

              <div>
                <Label
                  htmlFor="injuries"
                  className="text-[#C3BCC2] text-sm font-medium"
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
                  className="mt-1 bg-[#353A3A] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] focus:ring-[#4A5A70]"
                  placeholder="Any injuries or limitations we should know about?"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="w-full bg-[#4A5A70] hover:bg-[#606364] text-white"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Training Info
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === "appearance" && (
          <div
            className="p-4 rounded-lg border-2"
            style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C3BCC2] text-sm font-medium">
                    Compact Sidebar
                  </Label>
                  <p className="text-xs text-[#ABA4AA]">
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

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C3BCC2] text-sm font-medium">
                    Show Animations
                  </Label>
                  <p className="text-xs text-[#ABA4AA]">
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

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C3BCC2] text-sm font-medium">
                    Dark Mode
                  </Label>
                  <p className="text-xs text-[#ABA4AA]">
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
                className="w-full bg-[#4A5A70] hover:bg-[#606364] text-white"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Appearance
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="text-center text-green-400 text-sm">
            Settings saved successfully!
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileClientBottomNavigation />
    </div>
  );
}
