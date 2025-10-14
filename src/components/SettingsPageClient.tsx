"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileSettingsPage from "@/components/MobileSettingsPage";
import { Button } from "@/components/ui/button";
import {
  User,
  Users,
  Calendar,
  CreditCard,
  Save,
  Settings as SettingsIcon,
  AlertTriangle,
  Building2,
} from "lucide-react";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import Sidebar from "@/components/Sidebar";
import OrganizationUpgradeModal from "@/components/OrganizationUpgradeModal";
import { toast } from "sonner";
import Link from "next/link";

interface SettingsPageClientProps {
  // Add props here if needed in the future
}

function SettingsPageClient({}: SettingsPageClientProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Form state for each tab
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    location: "",
    bio: "",
    avatarUrl: "",
  });

  const [scheduleData, setScheduleData] = useState({
    timezone: "UTC-5",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  });

  const [clientSettingsData, setClientSettingsData] = useState({
    autoArchiveMonths: 3,
    requireClientEmail: false,
    defaultWelcomeMessage: "",
    messageRetentionMonths: 3,
  });

  // Get current user data
  const { data: currentUser, refetch: refetchUser } =
    trpc.user.getProfile.useQuery();

  // Get user settings
  const { data: userSettings, refetch: refetchSettings } =
    trpc.settings.getSettings.useQuery();

  // Get organization data
  const { data: organization, refetch: refetchOrganization } =
    trpc.organization.get.useQuery({});

  // Get pending invitations
  const { data: pendingInvitations = [], refetch: refetchInvitations } =
    trpc.organization.getPendingInvitations.useQuery(undefined, {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    });

  // Accept invitation mutation
  const acceptInvitationMutation =
    trpc.organization.acceptInvitation.useMutation({
      onSuccess: async () => {
        toast.success("Invitation accepted!");
        await refetchOrganization();
        await refetchInvitations();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to accept invitation");
      },
    });

  // Decline invitation mutation
  const declineInvitationMutation =
    trpc.organization.declineInvitation.useMutation({
      onSuccess: async () => {
        toast.success("Invitation declined");
        await refetchInvitations();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to decline invitation");
      },
    });

  const handleAcceptInvitation = (organizationId: string) => {
    acceptInvitationMutation.mutate({ organizationId });
  };

  const handleDeclineInvitation = (organizationId: string) => {
    declineInvitationMutation.mutate({ organizationId });
  };

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

  // Load user data into form
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || "",
        phone: userSettings?.phone || "",
        location: userSettings?.location || "",
        bio: userSettings?.bio || "",
        avatarUrl: userSettings?.avatarUrl || "",
      });
    }

    if (userSettings) {
      setScheduleData({
        timezone: userSettings.timezone || "UTC-5",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      });

      const autoArchiveDays = userSettings.autoArchiveDays ?? 90;
      const messageRetentionDays = userSettings.messageRetentionDays ?? 90;

      console.log("Loading client settings:", {
        autoArchiveDays,
        messageRetentionDays,
        userSettings: {
          autoArchiveDays: userSettings.autoArchiveDays,
          messageRetentionDays: userSettings.messageRetentionDays,
        },
      });

      setClientSettingsData({
        autoArchiveMonths: Math.round(autoArchiveDays / 30),
        requireClientEmail: userSettings.requireClientEmail || false,
        defaultWelcomeMessage: userSettings.defaultWelcomeMessage || "",
        messageRetentionMonths: Math.round(messageRetentionDays / 30),
      });
    }
  }, [userSettings?.id, currentUser?.id]);

  // Settings tabs
  const tabs = [
    { id: "profile", name: "Profile", icon: <User className="w-5 h-5" /> },
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
      id: "organization",
      name: "Organization",
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      id: "billing",
      name: "Billing & Payments",
      icon: <CreditCard className="w-5 h-5" />,
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

        case "clients":
          const clientSettingsPayload = {
            autoArchiveDays: clientSettingsData.autoArchiveMonths * 30,
            requireClientEmail: clientSettingsData.requireClientEmail,
            defaultWelcomeMessage: clientSettingsData.defaultWelcomeMessage,
            messageRetentionDays:
              clientSettingsData.messageRetentionMonths * 30,
          };
          console.log("Sending client settings:", clientSettingsPayload);
          await updateSettingsMutation.mutateAsync(clientSettingsPayload);
          break;

        case "schedule":
          await updateSettingsMutation.mutateAsync({
            timezone: scheduleData.timezone,
            workingDays: scheduleData.workingDays,
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
                {tabs.map(tab => (
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
                          onAvatarChange={url =>
                            setProfileData(prev => ({
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
                          onChange={e =>
                            setProfileData(prev => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-[#374151] border border-[#4B5563] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                          placeholder="Enter your full name"
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
                          onChange={e =>
                            setProfileData(prev => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-[#374151] border border-[#4B5563] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
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
                          onChange={e =>
                            setProfileData(prev => ({
                              ...prev,
                              location: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-[#374151] border border-[#4B5563] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                          placeholder="Enter your location"
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#9ca3af" }}
                        >
                          Bio
                        </label>
                        <textarea
                          value={profileData.bio}
                          onChange={e =>
                            setProfileData(prev => ({
                              ...prev,
                              bio: e.target.value,
                            }))
                          }
                          rows={3}
                          className="w-full px-3 py-2 bg-[#374151] border border-[#4B5563] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                          style={{
                            backgroundColor: "#374151",
                            borderColor: "#4B5563",
                            color: "#ffffff",
                            border: "1px solid",
                          }}
                          placeholder="Tell your clients about yourself..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div
                    className="mt-8 pt-6 border-t"
                    style={{ borderColor: "#2a2a2a" }}
                  >
                    <div className="flex justify-between items-center">
                      {saveSuccess && (
                        <div
                          className="flex items-center gap-2 px-4 py-2 rounded-xl"
                          style={{
                            backgroundColor: "#10b981",
                            color: "#ffffff",
                          }}
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
              )}

              {/* Client Management Tab */}
              {activeTab === "clients" && (
                <div>
                  <h3
                    className="text-2xl font-bold mb-6"
                    style={{ color: "#ffffff" }}
                  >
                    Client Management Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Client Onboarding */}
                    <div
                      className="rounded-xl border p-6"
                      style={{
                        backgroundColor: "#1E1E1E",
                        borderColor: "#2a2a2a",
                      }}
                    >
                      <h4
                        className="text-lg font-semibold mb-4"
                        style={{ color: "#ffffff" }}
                      >
                        Client Onboarding
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#9ca3af" }}
                          >
                            Default Welcome Message
                          </label>
                          <textarea
                            value={clientSettingsData.defaultWelcomeMessage}
                            onChange={e =>
                              setClientSettingsData(prev => ({
                                ...prev,
                                defaultWelcomeMessage: e.target.value,
                              }))
                            }
                            rows={4}
                            className="w-full px-3 py-2 bg-[#374151] border border-[#4B5563] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                            placeholder="Welcome! I'm excited to start working with you. Let me know if you have any questions..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This message will be automatically sent to new
                            clients
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="requireClientEmail"
                            checked={clientSettingsData.requireClientEmail}
                            onChange={e =>
                              setClientSettingsData(prev => ({
                                ...prev,
                                requireClientEmail: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <label
                            htmlFor="requireClientEmail"
                            className="text-sm font-medium"
                            style={{ color: "#9ca3af" }}
                          >
                            Require client email for new registrations
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Client Retention */}
                    <div
                      className="rounded-xl border p-6"
                      style={{
                        backgroundColor: "#1E1E1E",
                        borderColor: "#2a2a2a",
                      }}
                    >
                      <h4
                        className="text-lg font-semibold mb-4"
                        style={{ color: "#ffffff" }}
                      >
                        Client Retention & Archival
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#9ca3af" }}
                          >
                            Auto-Archive After Months of Inactivity
                          </label>
                          <input
                            type="number"
                            value={clientSettingsData.autoArchiveMonths}
                            onChange={e =>
                              setClientSettingsData(prev => ({
                                ...prev,
                                autoArchiveMonths:
                                  parseInt(e.target.value) || 3,
                              }))
                            }
                            className="w-full px-3 py-2 bg-[#374151] border border-[#4B5563] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                            placeholder="3"
                            min="1"
                            max="12"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Inactive clients will be automatically archived
                            after this many months (1-12)
                          </p>
                        </div>

                        <div>
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#9ca3af" }}
                          >
                            Message Retention (months)
                          </label>
                          <input
                            type="number"
                            value={clientSettingsData.messageRetentionMonths}
                            onChange={e =>
                              setClientSettingsData(prev => ({
                                ...prev,
                                messageRetentionMonths:
                                  parseInt(e.target.value) || 3,
                              }))
                            }
                            className="w-full px-3 py-2 bg-[#374151] border border-[#4B5563] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                            placeholder="3"
                            min="1"
                            max="12"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            How long to keep message history for archived
                            clients (1-12 months)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div
                    className="mt-8 pt-6 border-t"
                    style={{ borderColor: "#2a2a2a" }}
                  >
                    <div className="flex justify-between items-center">
                      {saveSuccess && (
                        <div
                          className="flex items-center gap-2 px-4 py-2 rounded-xl"
                          style={{
                            backgroundColor: "#10b981",
                            color: "#ffffff",
                          }}
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
              )}

              {/* Schedule Tab */}
              {activeTab === "schedule" && (
                <div>
                  <h3
                    className="text-2xl font-bold mb-6"
                    style={{ color: "#ffffff" }}
                  >
                    Schedule Settings
                  </h3>

                  <div className="space-y-6">
                    <div
                      className="rounded-xl border p-6"
                      style={{
                        backgroundColor: "#1E1E1E",
                        borderColor: "#2a2a2a",
                      }}
                    >
                      <h4
                        className="text-lg font-semibold mb-4"
                        style={{ color: "#ffffff" }}
                      >
                        Time Zone & Availability
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#9ca3af" }}
                          >
                            Time Zone
                          </label>
                          <select
                            value={scheduleData.timezone}
                            onChange={e =>
                              setScheduleData(prev => ({
                                ...prev,
                                timezone: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 bg-[#374151] border border-[#4B5563] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                          >
                            <option value="UTC-5">Eastern Time (UTC-5)</option>
                            <option value="UTC-6">Central Time (UTC-6)</option>
                            <option value="UTC-7">Mountain Time (UTC-7)</option>
                            <option value="UTC-8">Pacific Time (UTC-8)</option>
                            <option value="UTC+0">UTC (UTC+0)</option>
                          </select>
                        </div>

                        <div>
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#9ca3af" }}
                          >
                            Working Days
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                              "Sunday",
                            ].map(day => (
                              <label
                                key={day}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={scheduleData.workingDays.includes(
                                    day
                                  )}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setScheduleData(prev => ({
                                        ...prev,
                                        workingDays: [...prev.workingDays, day],
                                      }));
                                    } else {
                                      setScheduleData(prev => ({
                                        ...prev,
                                        workingDays: prev.workingDays.filter(
                                          d => d !== day
                                        ),
                                      }));
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <span
                                  className="text-sm"
                                  style={{ color: "#9ca3af" }}
                                >
                                  {day}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div
                    className="mt-8 pt-6 border-t"
                    style={{ borderColor: "#2a2a2a" }}
                  >
                    <div className="flex justify-between items-center">
                      {saveSuccess && (
                        <div
                          className="flex items-center gap-2 px-4 py-2 rounded-xl"
                          style={{
                            backgroundColor: "#10b981",
                            color: "#ffffff",
                          }}
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
              )}

              {/* Organization Tab */}
              {activeTab === "organization" && (
                <div>
                  <h3
                    className="text-2xl font-bold mb-6"
                    style={{ color: "#ffffff" }}
                  >
                    Organization Settings
                  </h3>

                  {/* Pending Invitations - Show at the top */}
                  {pendingInvitations.length > 0 && (
                    <div
                      className="mb-6 p-4 rounded-lg border"
                      style={{
                        backgroundColor: "#1a1a1a",
                        borderColor: "#2a2a2a",
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4
                            className="font-semibold text-lg mb-1"
                            style={{ color: "#ffffff" }}
                          >
                            Pending Invitations
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            You have {pendingInvitations.length} pending
                            invitation{pendingInvitations.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {pendingInvitations.map(invitation => (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between p-3 rounded-lg"
                            style={{ backgroundColor: "#0a0a0a" }}
                          >
                            <div>
                              <h5
                                className="font-medium"
                                style={{ color: "#ffffff" }}
                              >
                                {invitation.organization.name}
                              </h5>
                              {invitation.organization.description && (
                                <p className="text-sm text-muted-foreground">
                                  {invitation.organization.description}
                                </p>
                              )}
                              <span
                                className="inline-block mt-2 px-2 py-1 text-xs rounded"
                                style={{
                                  backgroundColor: "#2a2a2a",
                                  color: "#9ca3af",
                                }}
                              >
                                {invitation.organization.tier}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAcceptInvitation(
                                    invitation.organization.id
                                  )
                                }
                                disabled={
                                  acceptInvitationMutation.isPending ||
                                  declineInvitationMutation.isPending
                                }
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDeclineInvitation(
                                    invitation.organization.id
                                  )
                                }
                                disabled={
                                  acceptInvitationMutation.isPending ||
                                  declineInvitationMutation.isPending
                                }
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {organization ? (
                    <div className="space-y-6">
                      <div
                        className="rounded-2xl border p-6"
                        style={{
                          backgroundColor: "#353A3A",
                          borderColor: "#606364",
                        }}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4
                              className="text-2xl font-bold mb-2"
                              style={{ color: "#C3BCC2" }}
                            >
                              {organization.name}
                            </h4>
                            {organization.description && (
                              <p style={{ color: "#ABA4AA" }}>
                                {organization.description}
                              </p>
                            )}
                          </div>
                          <div
                            className="px-3 py-1 rounded-lg text-sm font-semibold"
                            style={{
                              backgroundColor: "#606364",
                              color: "#C3BCC2",
                            }}
                          >
                            {organization.tier}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div
                            className="p-4 rounded-xl"
                            style={{ backgroundColor: "#2A3133" }}
                          >
                            <div
                              className="text-2xl font-bold"
                              style={{ color: "#C3BCC2" }}
                            >
                              {organization._count.coaches}
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: "#ABA4AA" }}
                            >
                              Coaches (Max: {organization.coachLimit})
                            </div>
                          </div>
                          <div
                            className="p-4 rounded-xl"
                            style={{ backgroundColor: "#2A3133" }}
                          >
                            <div
                              className="text-2xl font-bold"
                              style={{ color: "#C3BCC2" }}
                            >
                              {organization._count.clients}
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: "#ABA4AA" }}
                            >
                              Clients (Max: {organization.clientLimit})
                            </div>
                          </div>
                        </div>

                        <Link href="/organization">
                          <Button size="lg" className="w-full">
                            <Building2 className="mr-2 h-4 w-4" />
                            Open Organization Dashboard
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h4
                        className="text-xl font-semibold mb-2"
                        style={{ color: "#ffffff" }}
                      >
                        Join or Create an Organization
                      </h4>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Collaborate with other coaches, share resources, and
                        manage clients together. Upgrade to access team
                        features.
                      </p>
                      <Button
                        onClick={() => setShowUpgradeModal(true)}
                        size="lg"
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Upgrade to Organization
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === "billing" && (
                <div>
                  <h3
                    className="text-2xl font-bold mb-6"
                    style={{ color: "#ffffff" }}
                  >
                    Billing & Payments
                  </h3>

                  <div className="space-y-6">
                    <div
                      className="rounded-xl border p-6"
                      style={{
                        backgroundColor: "#1E1E1E",
                        borderColor: "#2a2a2a",
                      }}
                    >
                      <h4
                        className="text-lg font-semibold mb-4"
                        style={{ color: "#ffffff" }}
                      >
                        Subscription Information
                      </h4>

                      <div className="space-y-4">
                        <div className="bg-yellow-950/10 border border-yellow-500/20 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1 flex-shrink-0"></div>
                            <div>
                              <h5 className="font-semibold text-yellow-400 mb-2">
                                Coming Soon
                              </h5>
                              <p className="text-sm text-gray-400">
                                Billing and payment management features are
                                currently in development. You'll be able to
                                manage your subscription, view invoices, and
                                update payment methods here soon.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Settings Tab */}
              {activeTab === "account" && (
                <div>
                  <h3
                    className="text-2xl font-bold mb-6"
                    style={{ color: "#ffffff" }}
                  >
                    Account Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Account Information */}
                    <div
                      className="rounded-xl border p-6"
                      style={{
                        backgroundColor: "#1E1E1E",
                        borderColor: "#2a2a2a",
                      }}
                    >
                      <h4
                        className="text-lg font-semibold mb-4"
                        style={{ color: "#ffffff" }}
                      >
                        Account Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#9ca3af" }}
                          >
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={currentUser?.email || ""}
                            disabled
                            className="w-full px-3 py-2 bg-[#374151] border border-[#4B5563] rounded-lg text-gray-400 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Contact support to change your email address
                          </p>
                        </div>
                        <div>
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#9ca3af" }}
                          >
                            Account Role
                          </label>
                          <input
                            type="text"
                            value={currentUser?.role || "COACH"}
                            disabled
                            className="w-full px-3 py-2 bg-[#374151] border border-[#4B5563] rounded-lg text-gray-400 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div
                      className="rounded-xl border p-6"
                      style={{
                        backgroundColor: "#1E1E1E",
                        borderColor: "#2a2a2a",
                      }}
                    >
                      <h4
                        className="text-lg font-semibold mb-4"
                        style={{ color: "#ffffff" }}
                      >
                        Danger Zone
                      </h4>

                      <div className="bg-red-950/10 border border-red-500/20 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h5 className="font-semibold text-red-400 mb-2">
                              Delete Account
                            </h5>
                            <p className="text-sm text-gray-400 mb-4">
                              Once you delete your account, there is no going
                              back. All your data, programs, clients, and
                              progress will be permanently removed. This action
                              cannot be undone.
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
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />

      {/* Organization Upgrade Modal */}
      <OrganizationUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => refetchOrganization()}
      />
    </Sidebar>
  );
}

export default withMobileDetection(MobileSettingsPage, SettingsPageClient);
