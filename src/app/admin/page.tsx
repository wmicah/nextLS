"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import {
  BookOpen,
  Users,
  Video,
  Settings,
  Shield,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  ArrowLeft,
  X,
  CheckCircle,
  Bug,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import AdminSecurityDashboard from "@/components/AdminSecurityDashboard";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Youtube } from "lucide-react";
import { isYouTubeUrl } from "@/lib/youtube-utils";
import { extractYouTubeVideoId, getYouTubeThumbnail } from "@/lib/youtube";
import { COLORS, getGoldenAccent } from "@/lib/colors";

// Component for sending bug report announcement
function SendBugReportAnnouncementButton() {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  const sendAnnouncementMutation =
    trpc.admin.sendBugReportAnnouncement.useMutation({
      onSuccess: data => {
        setIsSending(false);
        setResult({ success: data.success, failed: data.failed });
        alert(
          `Announcement sent! ${data.success} emails sent successfully, ${data.failed} failed.`
        );
      },
      onError: error => {
        setIsSending(false);
        console.error("Failed to send announcement:", error);
        alert(`Failed to send announcement: ${error.message}`);
      },
    });

  const handleSend = () => {
    if (
      !confirm(
        "Are you sure you want to send this announcement to ALL users? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsSending(true);
    setResult(null);
    sendAnnouncementMutation.mutate();
  };

  return (
    <div>
      <button
        onClick={handleSend}
        disabled={isSending}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isSending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4" />
            Send Bug Report Announcement
          </>
        )}
      </button>
      {result && (
        <div className="mt-3 text-sm">
          <p className="text-green-400">
            ✓ {result.success} emails sent successfully
          </p>
          {result.failed > 0 && (
            <p className="text-red-400">✗ {result.failed} emails failed</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    category: "",
    type: "Video", // Default to Video since these are training videos
    filename: "",
    contentType: "",
    size: 0,
    thumbnail: "",
    onformUrl: "",
    youtubeUrl: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editResource, setEditResource] = useState({
    title: "",
    description: "",
    category: "",
    type: "video",
  });

  // Check if user is admin
  const { data: authData } = trpc.authCallback.useQuery();
  const { data: masterLibrary = [], refetch: refetchMasterLibrary } =
    trpc.admin.getMasterLibraryForAdmin.useQuery();
  const { data: stats } = trpc.admin.getStats.useQuery();
  const { data: deletionAnalytics } =
    trpc.user.getAccountDeletionAnalytics.useQuery();
  const [showArchivedBugReports, setShowArchivedBugReports] = useState(false);
  const { data: bugReportsData, refetch: refetchBugReports } =
    trpc.bugReports.list.useQuery({
      includeArchived: false,
    });
  const { data: allBugReportsData, refetch: refetchAllBugReports } =
    trpc.bugReports.list.useQuery({
      includeArchived: true,
    });
  
  // Filter archived reports from all reports
  const archivedBugReportsData = allBugReportsData ? {
    ...allBugReportsData,
    bugReports: allBugReportsData.bugReports?.filter((b: any) => b.isArchived) || [],
    total: allBugReportsData.bugReports?.filter((b: any) => b.isArchived).length || 0,
  } : undefined;
  
  const updateBugStatusMutation = trpc.bugReports.updateStatus.useMutation({
    onSuccess: () => {
      refetchBugReports();
      refetchAllBugReports();
    },
  });
  const archiveBugReportMutation = trpc.bugReports.archive.useMutation({
    onSuccess: () => {
      refetchBugReports();
      refetchAllBugReports();
    },
  });

  const addResourceMutation = trpc.admin.addToMasterLibrary.useMutation({
    onSuccess: () => {
      setUploadProgress(100);
      setTimeout(() => {
        refetchMasterLibrary();
        setIsAddResourceModalOpen(false);
        setIsUploading(false);
        setUploadProgress(0);
        // Reset form
        setNewResource({
          title: "",
          description: "",
          category: "",
          type: "Video",
          filename: "",
          contentType: "",
          size: 0,
          thumbnail: "",
          onformUrl: "",
          youtubeUrl: "",
        });
        setSelectedFile(null);
      }, 1000);
    },
    onError: error => {
      console.error("Failed to add resource:", error);
      alert(`Failed to add resource: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const updateResourceMutation = trpc.admin.updateMasterResource.useMutation({
    onSuccess: () => {
      refetchMasterLibrary();
      setIsEditModalOpen(false);
      setSelectedResource(null);
      alert("Resource updated successfully!");
    },
    onError: error => {
      console.error("Failed to update resource:", error);
      alert(`Failed to update resource: ${error.message}`);
    },
  });

  // Redirect if not admin
  useEffect(() => {
    if (authData?.user && !authData.user.isAdmin) {
      router.push("/dashboard");
    }
  }, [authData, router]);

  // Populate edit form when resource is selected
  useEffect(() => {
    if (selectedResource && isEditModalOpen) {
      setEditResource({
        title: selectedResource.title || "",
        description: selectedResource.description || "",
        category: selectedResource.category || "",
        type: selectedResource.type || "video",
      });
    }
  }, [selectedResource, isEditModalOpen]);

  if (!authData?.user || !authData.user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: COLORS.RED_ALERT }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>Access Denied</h1>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  const categories = [
    "Conditioning",
    "Drive",
    "Whip",
    "Separation",
    "Stability",
    "Extension",
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "master-library", label: "Master Library", icon: BookOpen },
    { id: "users", label: "User Management", icon: Users },
    { id: "bug-reports", label: "Bug Reports", icon: AlertTriangle },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "security", label: "Security", icon: Shield },
    { id: "analytics", label: "Account Analytics", icon: AlertTriangle },
    { id: "settings", label: "Admin Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}>
      {/* Mobile Header */}
      <div className="md:hidden border-b p-4" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
              <Shield className="w-5 h-5" style={{ color: COLORS.GOLDEN_ACCENT }} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>Admin</h1>
              <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                {authData.user.name || authData.user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, color: COLORS.TEXT_PRIMARY, borderColor: COLORS.BORDER_SUBTLE }}>
              {authData.user.role}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: getGoldenAccent(0.2), color: COLORS.TEXT_PRIMARY }}>
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block border-b p-6" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                <Shield className="w-6 h-6" style={{ color: COLORS.GOLDEN_ACCENT }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>Admin Dashboard</h1>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  Welcome back, {authData.user.name || authData.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, color: COLORS.TEXT_PRIMARY, borderColor: COLORS.BORDER_SUBTLE }}>
                  {authData.user.role}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: getGoldenAccent(0.2), color: COLORS.TEXT_PRIMARY }}>
                  Admin
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border text-sm"
            style={{ 
              color: COLORS.TEXT_SECONDARY, 
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              e.currentTarget.style.borderColor = getGoldenAccent(0.3);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Desktop Back Button */}
        <div className="hidden md:block mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border"
            style={{ 
              color: COLORS.TEXT_SECONDARY, 
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              e.currentTarget.style.borderColor = getGoldenAccent(0.3);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden mb-4">
          <div className="flex space-x-1 rounded-lg p-1 overflow-x-auto border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1 px-3 py-2 rounded-md transition-all duration-200 whitespace-nowrap border"
                  style={{
                    backgroundColor: activeTab === tab.id ? getGoldenAccent(0.2) : "transparent",
                    color: activeTab === tab.id ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                    borderColor: activeTab === tab.id ? getGoldenAccent(0.4) : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex space-x-1 rounded-lg p-1 mb-8 border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 border"
                style={{
                  backgroundColor: activeTab === tab.id ? getGoldenAccent(0.2) : "transparent",
                  color: activeTab === tab.id ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                  borderColor: activeTab === tab.id ? getGoldenAccent(0.4) : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-4 md:space-y-6">
            {/* Mobile Stats - Horizontal Scroll */}
            <div className="md:hidden mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <div
                  className="flex-shrink-0 w-24 rounded-lg border p-2"
                  style={{ backgroundColor: "#1A1D1E", borderColor: "#4A5A70" }}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {stats?.totalResources || 0}
                    </div>
                    <div className="text-xs text-gray-400">Resources</div>
                  </div>
                </div>
                <div
                  className="flex-shrink-0 w-24 rounded-lg border p-2"
                  style={{ backgroundColor: "#1A1D1E", borderColor: "#4A5A70" }}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {stats?.masterLibraryCount || 0}
                    </div>
                    <div className="text-xs text-gray-400">Master</div>
                  </div>
                </div>
                <div
                  className="flex-shrink-0 w-24 rounded-lg border p-2"
                  style={{ backgroundColor: "#1A1D1E", borderColor: "#4A5A70" }}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {stats?.activeUsers || 0}
                    </div>
                    <div className="text-xs text-gray-400">Users</div>
                  </div>
                </div>
                <div
                  className="flex-shrink-0 w-24 rounded-lg border p-2"
                  style={{ backgroundColor: "#1A1D1E", borderColor: "#4A5A70" }}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {stats?.activeUsers || 0}
                    </div>
                    <div className="text-xs text-gray-400">Active</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Stats Cards */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Resources</p>
                    <p className="text-3xl font-bold text-white">
                      {stats?.totalResources || 0}
                    </p>
                  </div>
                  <BookOpen className="w-8 h-8 text-[#4A5A70]" />
                </div>
              </div>

              <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Master Library</p>
                    <p className="text-3xl font-bold text-white">
                      {stats?.masterLibraryCount || 0}
                    </p>
                  </div>
                  <Video className="w-8 h-8 text-[#4A5A70]" />
                </div>
              </div>

              <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Users</p>
                    <p className="text-3xl font-bold text-white">
                      {stats?.activeUsers || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-[#4A5A70]" />
                </div>
              </div>

              <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Resources</p>
                    <p className="text-3xl font-bold text-white">
                      {stats?.totalResources || 0}
                    </p>
                  </div>
                  <BookOpen className="w-8 h-8 text-[#4A5A70]" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <p className="text-gray-400">No recent activity to display.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "master-library" && (
          <div className="space-y-6">
            {/* Master Library Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Master Library Management
                </h2>
                <p className="text-gray-400">
                  Manage the central video library available to all coaches
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        "/api/admin/fix-master-library-types",
                        {
                          method: "POST",
                        }
                      );
                      const result = await response.json();
                      if (response.ok) {
                        alert(`Fixed ${result.updatedCount} resources!`);
                        refetchMasterLibrary();
                      } else {
                        alert(`Error: ${result.error}`);
                      }
                    } catch (error) {
                      alert(`Error: ${error}`);
                    }
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Fix Types
                </button>
                <button
                  onClick={() => setIsAddResourceModalOpen(true)}
                  className="px-4 py-2 bg-[#4A5A70] text-white rounded-lg hover:bg-[#606364] transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Resource
                </button>
              </div>
            </div>

            {/* Master Library Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {masterLibrary.map((resource: any) => (
                <div
                  key={resource.id}
                  className="bg-[#1A1D1E] rounded-xl border-2 border-[#2D3748] hover:border-[#4A5A70] transition-all duration-300 cursor-pointer group"
                >
                  {/* Thumbnail */}
                  <div className="h-32 rounded-t-xl bg-[#0F1416] flex items-center justify-center relative">
                    <VideoThumbnail
                      item={resource}
                      videoType="master"
                      className="h-32"
                    />

                    {/* Status Indicators */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {!resource.isActive && (
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      )}
                      {resource.isFeatured && (
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#4A5A70] text-white">
                        {resource.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">
                          {resource.type}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-white mb-2 line-clamp-1">
                      {resource.title}
                    </h3>

                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {resource.description}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedResource(resource);
                          setIsEditModalOpen(true);
                        }}
                        className="flex-1 px-3 py-2 bg-[#4A5A70] text-white rounded-lg hover:bg-[#606364] transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          // Toggle active status
                        }}
                        className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center ${
                          resource.isActive
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                        title={resource.isActive ? "Deactivate" : "Activate"}
                      >
                        {resource.isActive ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
            <h2 className="text-xl font-bold mb-4">User Management</h2>
            <p className="text-gray-400">
              User management features coming soon...
            </p>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
            <PerformanceDashboard />
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
            <AdminSecurityDashboard />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-bold">
                  Account Deletion Analytics
                </h2>
              </div>

              {deletionAnalytics && (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#2A3133] rounded-lg p-4 border border-[#4A5A70]">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {deletionAnalytics.totalDeletions}
                        </div>
                        <div className="text-sm text-gray-400">
                          Total Deletions
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#2A3133] rounded-lg p-4 border border-[#4A5A70]">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {deletionAnalytics.deletionsThisMonth}
                        </div>
                        <div className="text-sm text-gray-400">This Month</div>
                      </div>
                    </div>
                    <div className="bg-[#2A3133] rounded-lg p-4 border border-[#4A5A70]">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {deletionAnalytics.deletionsThisWeek}
                        </div>
                        <div className="text-sm text-gray-400">This Week</div>
                      </div>
                    </div>
                  </div>

                  {/* Top Reasons */}
                  <div className="bg-[#2A3133] rounded-lg p-4 border border-[#4A5A70]">
                    <h3 className="text-lg font-semibold mb-4">
                      Top Deletion Reasons
                    </h3>
                    <div className="space-y-3">
                      {deletionAnalytics.topReasons.map((reason, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#4A5A70] flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <span className="text-gray-300 capitalize">
                              {reason.reason.replace(/_/g, " ")}
                            </span>
                          </div>
                          <span className="text-white font-medium">
                            {reason.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Deletions */}
                  <div className="bg-[#2A3133] rounded-lg p-4 border border-[#4A5A70]">
                    <h3 className="text-lg font-semibold mb-4">
                      Recent Account Deletions
                    </h3>
                    <div className="space-y-3">
                      {deletionAnalytics.recentDeletions.length > 0 ? (
                        deletionAnalytics.recentDeletions.map(
                          (deletion, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 border-b border-[#4A5A70] last:border-b-0"
                            >
                              <div className="flex-1">
                                <div className="text-white font-medium">
                                  {deletion.userEmail}
                                </div>
                                <div className="text-sm text-gray-400">
                                  Reason:{" "}
                                  {deletion.reason?.replace(/_/g, " ") ||
                                    "No reason provided"}
                                </div>
                              </div>
                              <div className="text-sm text-gray-400">
                                {new Date(
                                  deletion.deletedAt
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <div className="text-gray-400 text-center py-4">
                          No recent deletions to display
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kinde Deletion Status */}
                  <div className="bg-[#2A3133] rounded-lg p-4 border border-[#4A5A70]">
                    <h3 className="text-lg font-semibold mb-4">
                      Kinde Integration Status
                    </h3>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          deletionAnalytics.kindeIntegrationEnabled
                            ? "bg-green-500"
                            : "bg-orange-500"
                        }`}
                      ></div>
                      <span className="text-gray-300">
                        {deletionAnalytics.kindeIntegrationEnabled
                          ? "Kinde Management API configured - Complete account deletion enabled"
                          : "Kinde Management API not configured - Database-only deletion"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "bug-reports" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>Bug Reports</h2>
              <p style={{ color: COLORS.TEXT_SECONDARY }}>
                Review and manage bug reports submitted by users
              </p>
            </div>

            {/* Bug Reports Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl p-4 border transition-all duration-200 hover:scale-105" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>Total Reports</p>
                    <p className="text-2xl font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                      {bugReportsData?.total || 0}
                    </p>
                  </div>
                  <Bug className="w-8 h-8" style={{ color: COLORS.TEXT_MUTED }} />
                </div>
              </div>
              <div className="rounded-xl p-4 border transition-all duration-200 hover:scale-105" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>Open</p>
                    <p className="text-2xl font-bold" style={{ color: COLORS.GOLDEN_ACCENT }}>
                      {bugReportsData?.bugReports?.filter(
                        (b: any) => b.status === "OPEN"
                      ).length || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8" style={{ color: COLORS.GOLDEN_ACCENT }} />
                </div>
              </div>
              <div className="rounded-xl p-4 border transition-all duration-200 hover:scale-105" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>In Progress</p>
                    <p className="text-2xl font-bold" style={{ color: COLORS.BLUE_PRIMARY }}>
                      {bugReportsData?.bugReports?.filter(
                        (b: any) => b.status === "IN_PROGRESS"
                      ).length || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8" style={{ color: COLORS.BLUE_PRIMARY }} />
                </div>
              </div>
              <div className="rounded-xl p-4 border transition-all duration-200 hover:scale-105" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>Resolved</p>
                    <p className="text-2xl font-bold" style={{ color: COLORS.GREEN_PRIMARY }}>
                      {bugReportsData?.bugReports?.filter(
                        (b: any) => b.status === "RESOLVED"
                      ).length || 0}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8" style={{ color: COLORS.GREEN_PRIMARY }} />
                </div>
              </div>
            </div>

            {/* Bug Reports List */}
            <div className="bg-[#1A1D1E] rounded-xl border border-[#4A5A70]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Active Bug Reports</h3>
                  <button
                    onClick={() => setShowArchivedBugReports(!showArchivedBugReports)}
                    className="px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm flex items-center gap-2 border"
                    style={{ 
                      backgroundColor: COLORS.BACKGROUND_CARD,
                      color: COLORS.TEXT_PRIMARY,
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
                  >
                    {showArchivedBugReports ? "Hide" : "Show"} Archived ({archivedBugReportsData?.bugReports?.filter((b: any) => b.isArchived).length || 0})
                  </button>
                </div>
                {bugReportsData?.bugReports &&
                bugReportsData.bugReports.filter((b: any) => !b.isArchived).length > 0 ? (
                  <div className="space-y-4">
                    {bugReportsData.bugReports.filter((b: any) => !b.isArchived).map((report: any) => {
                      const priorityColors: Record<string, string> = {
                        CRITICAL: "bg-red-500",
                        HIGH: "bg-orange-500",
                        MEDIUM: "bg-yellow-500",
                        LOW: "bg-green-500",
                      };
                      const statusColors: Record<string, string> = {
                        OPEN: "bg-yellow-500",
                        IN_PROGRESS: "bg-blue-500",
                        RESOLVED: "bg-green-500",
                        CLOSED: "bg-gray-500",
                        DUPLICATE: "bg-purple-500",
                      };

                      return (
                        <div
                          key={report.id}
                          className="bg-[#2A3133] rounded-lg p-4 border border-[#4A5A70]"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-bold text-white">
                                  {report.title}
                                </h4>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                                    priorityColors[report.priority] ||
                                    "bg-gray-500"
                                  }`}
                                >
                                  {report.priority}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                                    statusColors[report.status] || "bg-gray-500"
                                  }`}
                                >
                                  {report.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 mb-2">
                                Page:{" "}
                                <span className="text-white">
                                  {report.page}
                                </span>
                              </p>
                              <p className="text-sm text-gray-400 mb-2">
                                Device:{" "}
                                <span className="text-white">
                                  {report.device || "Not specified"}
                                </span>
                              </p>
                              <p className="text-sm text-gray-400">
                                Reported by:{" "}
                                <span className="text-white">
                                  {report.user?.name || report.user?.email} (
                                  {report.userRole})
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">
                                {new Date(
                                  report.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">
                              {report.description}
                            </p>
                          </div>

                          {report.imageUrl && (
                            <div className="mb-3">
                              <img
                                src={report.imageUrl}
                                alt="Bug screenshot"
                                className="max-w-md rounded-lg border border-[#4A5A70]"
                              />
                            </div>
                          )}

                          {report.videoUrl && (
                            <div className="mb-3">
                              <a
                                href={report.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline text-sm"
                              >
                                View Video →
                              </a>
                            </div>
                          )}

                          <div className="flex gap-2 mt-4">
                            {report.status === "OPEN" && (
                              <button
                                onClick={() => {
                                  updateBugStatusMutation.mutate({
                                    id: report.id,
                                    status: "IN_PROGRESS",
                                  });
                                }}
                                disabled={updateBugStatusMutation.isPending}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                Mark In Progress
                              </button>
                            )}
                            {report.status === "IN_PROGRESS" && (
                              <button
                                onClick={() => {
                                  updateBugStatusMutation.mutate({
                                    id: report.id,
                                    status: "RESOLVED",
                                  });
                                }}
                                disabled={updateBugStatusMutation.isPending}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                Mark Resolved
                              </button>
                            )}
                            <button
                              onClick={() => {
                                updateBugStatusMutation.mutate({
                                  id: report.id,
                                  status: "CLOSED",
                                });
                              }}
                              disabled={updateBugStatusMutation.isPending}
                              className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                              Close
                            </button>
                            <button
                              onClick={() => {
                                archiveBugReportMutation.mutate({
                                  id: report.id,
                                  isArchived: true,
                                });
                              }}
                              disabled={archiveBugReportMutation.isPending}
                              className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bug className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">No bug reports yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Archived Bug Reports Section */}
            {showArchivedBugReports && (
              <div className="bg-[#1A1D1E] rounded-xl border border-[#4A5A70] mt-6">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-400">Archived Bug Reports</h3>
                  {archivedBugReportsData?.bugReports &&
                  archivedBugReportsData.bugReports.filter((b: any) => b.isArchived).length > 0 ? (
                    <div className="space-y-4">
                      {archivedBugReportsData.bugReports.filter((b: any) => b.isArchived).map((report: any) => {
                        const priorityColors: Record<string, string> = {
                          CRITICAL: "bg-red-500",
                          HIGH: "bg-orange-500",
                          MEDIUM: "bg-yellow-500",
                          LOW: "bg-green-500",
                        };
                        const statusColors: Record<string, string> = {
                          OPEN: "bg-yellow-500",
                          IN_PROGRESS: "bg-blue-500",
                          RESOLVED: "bg-green-500",
                          CLOSED: "bg-gray-500",
                          DUPLICATE: "bg-purple-500",
                        };

                        return (
                          <div
                            key={report.id}
                            className="bg-[#2A3133] rounded-lg p-4 border border-[#4A5A70] opacity-75"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-bold text-white">
                                    {report.title}
                                  </h4>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                                      priorityColors[report.priority] ||
                                      "bg-gray-500"
                                    }`}
                                  >
                                    {report.priority}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                                      statusColors[report.status] || "bg-gray-500"
                                    }`}
                                  >
                                    {report.status}
                                  </span>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium text-white bg-purple-600">
                                    ARCHIVED
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400 mb-2">
                                  Page:{" "}
                                  <span className="text-white">
                                    {report.page}
                                  </span>
                                </p>
                                <p className="text-sm text-gray-400 mb-2">
                                  Device:{" "}
                                  <span className="text-white">
                                    {report.device || "Not specified"}
                                  </span>
                                </p>
                                <p className="text-sm text-gray-400">
                                  Reported by:{" "}
                                  <span className="text-white">
                                    {report.user?.name || report.user?.email} (
                                    {report.userRole})
                                  </span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-400">
                                  {new Date(
                                    report.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="mb-3">
                              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                {report.description}
                              </p>
                            </div>

                            {report.imageUrl && (
                              <div className="mb-3">
                                <img
                                  src={report.imageUrl}
                                  alt="Bug screenshot"
                                  className="max-w-md rounded-lg border border-[#4A5A70]"
                                />
                              </div>
                            )}

                            {report.videoUrl && (
                              <div className="mb-3">
                                <a
                                  href={report.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline text-sm"
                                >
                                  View Video →
                                </a>
                              </div>
                            )}

                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => {
                                  archiveBugReportMutation.mutate({
                                    id: report.id,
                                    isArchived: false,
                                  });
                                }}
                                disabled={archiveBugReportMutation.isPending}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                Unarchive
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Bug className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-50" />
                      <p className="text-gray-400">No archived bug reports</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
              <h2 className="text-xl font-bold mb-4">Admin Settings</h2>
              <p className="text-gray-400 mb-6">
                Admin settings features coming soon...
              </p>
            </div>

            {/* Email Announcements */}
            <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
              <h2 className="text-xl font-bold mb-4">Email Announcements</h2>
              <p className="text-gray-400 mb-4">
                Send website-wide announcements to all users
              </p>

              <div className="space-y-4">
                <div className="bg-[#2A3133] rounded-lg p-4 border border-[#4A5A70]">
                  <h3 className="text-lg font-semibold mb-2">
                    Bug Report Feature Announcement
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Send an email to all users announcing the new bug report
                    feature and how to use it.
                  </p>
                  <SendBugReportAnnouncementButton />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Resource Modal */}
        {isAddResourceModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1A1D1E] rounded-xl p-6 w-full max-w-2xl mx-4 border border-[#4A5A70]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Add Training Video to Master Library
                </h2>
                <button
                  onClick={() => setIsAddResourceModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={async e => {
                  e.preventDefault();

                  // Check if either a file, OnForm URL, or YouTube URL is provided
                  if (
                    !selectedFile &&
                    !newResource.onformUrl &&
                    !newResource.youtubeUrl
                  ) {
                    alert(
                      "Please either select a file to upload, provide an OnForm URL, or provide a YouTube URL"
                    );
                    return;
                  }

                  // Validate category is selected
                  if (!newResource.category) {
                    alert("Please select a category");
                    return;
                  }

                  setIsUploading(true);
                  setUploadProgress(0);

                  try {
                    setIsUploading(true);
                    setUploadProgress(50);

                    let fileUrl = "";
                    let resourceType = "video";
                    let isOnForm = false;
                    let onformId = "";
                    let isYoutube = false;
                    let youtubeId: string | null = null;
                    let youtubeThumbnail = "";
                    let youtubeTitle = "";
                    let youtubeDescription = "";

                    // Check if YouTube URL is provided
                    if (newResource.youtubeUrl) {
                      console.log(
                        "Processing YouTube URL:",
                        newResource.youtubeUrl
                      );

                      if (!isYouTubeUrl(newResource.youtubeUrl)) {
                        alert("Please enter a valid YouTube URL");
                        setIsUploading(false);
                        setUploadProgress(0);
                        return;
                      }

                      youtubeId = extractYouTubeVideoId(newResource.youtubeUrl);
                      if (!youtubeId) {
                        alert("Could not extract video ID from YouTube URL");
                        setIsUploading(false);
                        setUploadProgress(0);
                        return;
                      }

                      // For YouTube videos, we'll let the server fetch the info
                      // Just set basic values here
                      fileUrl = newResource.youtubeUrl;
                      isYoutube = true;
                      resourceType = "video";
                      youtubeTitle =
                        newResource.title || `YouTube Video ${youtubeId}`;
                      youtubeDescription =
                        newResource.description || "Imported from YouTube";
                      youtubeThumbnail = getYouTubeThumbnail(youtubeId);
                    }
                    // Check if OnForm URL is provided
                    else if (newResource.onformUrl) {

                      // Import OnForm utilities
                      const { extractOnFormId, isOnFormUrl } = await import(
                        "@/lib/onform-utils"
                      );


                      if (isOnFormUrl(newResource.onformUrl)) {
                        onformId = extractOnFormId(newResource.onformUrl) || "";
                        fileUrl = newResource.onformUrl;
                        isOnForm = true;
                        resourceType = "video";

                        console.log("OnForm import successful:", {
                          onformId,
                          fileUrl,
                          isOnForm,
                          resourceType,
                        });
                      } else {
                        console.error(
                          "Invalid OnForm URL format:",
                          newResource.onformUrl
                        );
                        throw new Error("Invalid OnForm URL format");
                      }
                    } else {
                      // File is already uploaded via UploadThing, get the URL from the stored file
                      fileUrl = (selectedFile as any).url;

                      if (!fileUrl) {
                        throw new Error(
                          "No file URL found. Please re-upload the file or provide an OnForm URL."
                        );
                      }

                      // Determine the correct type based on content type
                      resourceType = newResource.contentType.startsWith(
                        "video/"
                      )
                        ? "video"
                        : "document";
                    }

                    console.log("Submitting to admin mutation:", {
                      title: newResource.title,
                      description: newResource.description,
                      category: newResource.category,
                      type: resourceType,
                      url: fileUrl,
                      filename: newResource.filename,
                      contentType: newResource.contentType,
                      size: newResource.size,
                      isOnForm,
                      onformId,
                    });

                    // Now save the metadata to the database using the admin mutation
                    addResourceMutation.mutate({
                      title: isYoutube ? youtubeTitle : newResource.title,
                      description: isYoutube
                        ? youtubeDescription
                        : newResource.description,
                      category: newResource.category,
                      type: resourceType,
                      url: fileUrl,
                      filename: newResource.filename,
                      contentType: newResource.contentType,
                      size: newResource.size,
                      thumbnail: isYoutube
                        ? youtubeThumbnail
                        : newResource.thumbnail || "",
                      isYoutube: isYoutube,
                      youtubeId: youtubeId || undefined,
                      isOnForm,
                      onformId,
                    });

                    // Trigger thumbnail generation after successful upload
                    setTimeout(async () => {
                      try {
                        await fetch("/api/generate-thumbnail", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            filename: newResource.filename,
                            videoType: "master",
                          }),
                        });
                      } catch (error) {
                        console.error("Thumbnail generation failed:", error);
                      }
                    }, 1000); // Wait 1 second for the database to be updated
                  } catch (error) {
                    console.error("Upload error:", error);
                    const errorMessage =
                      error instanceof Error ? error.message : "Upload failed";
                    alert(`Upload failed: ${errorMessage}`);
                    setIsUploading(false);
                    setUploadProgress(0);
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newResource.title}
                      onChange={e =>
                        setNewResource({
                          ...newResource,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#2A3133] border border-[#4A5A70] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                      placeholder="Enter training video title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={newResource.category}
                      onChange={e =>
                        setNewResource({
                          ...newResource,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#2A3133] border border-[#4A5A70] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newResource.description}
                    onChange={e =>
                      setNewResource({
                        ...newResource,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-[#2A3133] border border-[#4A5A70] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                    placeholder="Describe the training content (e.g., 'Advanced pitching mechanics demonstration')"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      YouTube URL (Optional)
                    </label>
                    <div className="relative">
                      <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                      <input
                        type="url"
                        value={newResource.youtubeUrl || ""}
                        onChange={e => {
                          const url = e.target.value;
                          setNewResource({
                            ...newResource,
                            youtubeUrl: url,
                          });
                        }}
                        className="w-full pl-10 pr-3 py-2 bg-[#2A3133] border border-[#4A5A70] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Paste a YouTube video URL to import it to the master
                      library
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      OnForm URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={newResource.onformUrl || ""}
                      onChange={e =>
                        setNewResource({
                          ...newResource,
                          onformUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#2A3133] border border-[#4A5A70] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                      placeholder="https://onform.net/video/12345 or https://onform.net/embed/12345"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Paste an OnForm video URL to embed it instead of uploading
                      a file
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Training Video File{" "}
                    {!newResource.onformUrl && !newResource.youtubeUrl
                      ? "*"
                      : "(Optional if YouTube or OnForm URL provided)"}
                  </label>
                  {!selectedFile ? (
                    <div className="border-2 border-dashed border-[#4A5A70] rounded-lg p-6 text-center hover:border-[#606364] transition-colors">
                      {(newResource.onformUrl || newResource.youtubeUrl) && (
                        <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                          <p className="text-green-400 text-sm">
                            ✓ {newResource.youtubeUrl ? "YouTube" : "OnForm"}{" "}
                            URL provided - file upload is optional
                          </p>
                        </div>
                      )}
                      {/* @ts-expect-error - effect version conflict workaround */}
                      <UploadButton<OurFileRouter, "videoUploader">
                        endpoint="videoUploader"
                        onClientUploadComplete={(res: any) => {
                          const file = res[0];
                          if (file) {
                            console.log("UploadThing file data:", {
                              name: file.name,
                              type: file.type,
                              size: file.size,
                              url: file.url,
                            });

                            // Create a proper File object with correct size
                            const mockFile = new File(
                              [new ArrayBuffer(file.size)],
                              file.name,
                              {
                                type: file.type,
                              }
                            );
                            // Override the size property to match the actual file size
                            Object.defineProperty(mockFile, "size", {
                              value: file.size,
                              writable: false,
                            });
                            setSelectedFile(mockFile);
                            setNewResource(prev => ({
                              ...prev,
                              filename: file.name,
                              contentType: file.type,
                              size: file.size,
                            }));
                            // Store the actual file data for later use
                            (mockFile as any).url = file.url;
                          }
                        }}
                        onUploadError={(error: Error) => {
                          console.error("Upload error:", error);
                          alert(`Upload failed: ${error.message}`);
                        }}
                        appearance={{
                          button: {
                            background: "#4A5A70",
                            color: "#C3BCC2",
                            border: "none",
                            borderRadius: "8px",
                            padding: "12px 24px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          },
                          container: {
                            width: "100%",
                          },
                          allowedContent: {
                            color: "#ABA4AA",
                            fontSize: "12px",
                            marginTop: "8px",
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="border border-[#4A5A70] rounded-lg p-4 bg-[#2A3133]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <div>
                            <p className="text-white font-medium">
                              {selectedFile.name}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setNewResource(prev => ({
                              ...prev,
                              filename: "",
                              contentType: "",
                              size: 0,
                            }));
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:bg-[#4A5A70] hover:text-white transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-[#1A1D1E] border border-[#4A5A70] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-500">
                      Security Notice
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    This video contains sensitive training content and will be
                    stored securely. It cannot be downloaded by clients or
                    coaches - only streamed within the app.
                  </p>
                </div>

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-[#2A3133] rounded-full h-2">
                      <div
                        className="bg-[#4A5A70] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddResourceModalOpen(false)}
                    disabled={isUploading}
                    className="px-4 py-2 text-gray-400 border border-[#4A5A70] rounded-lg hover:bg-[#2A3133] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addResourceMutation.isPending || isUploading}
                    className="px-4 py-2 bg-[#4A5A70] text-white rounded-lg hover:bg-[#606364] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : addResourceMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Resource
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Resource Modal */}
        {isEditModalOpen && selectedResource && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#2A3133] rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Edit Resource
                </h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedResource(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (!selectedResource?.id) return;

                  updateResourceMutation.mutate({
                    id: selectedResource.id,
                    title: editResource.title,
                    description: editResource.description,
                    category: editResource.category,
                    type: editResource.type,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editResource.title}
                    onChange={e =>
                      setEditResource(prev => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#4A5A70] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editResource.description}
                    onChange={e =>
                      setEditResource(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#4A5A70] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={editResource.category}
                    onChange={e =>
                      setEditResource(prev => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#4A5A70] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Hitting">Hitting</option>
                    <option value="Pitching">Pitching</option>
                    <option value="Fielding">Fielding</option>
                    <option value="Base Running">Base Running</option>
                    <option value="Mental Game">Mental Game</option>
                    <option value="Strength & Conditioning">
                      Strength & Conditioning
                    </option>
                    <option value="Strategy">Strategy</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type *
                  </label>
                  <select
                    value={editResource.type}
                    onChange={e =>
                      setEditResource(prev => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#4A5A70] rounded-lg text-white focus:outline-none focus:border-[#606364]"
                    required
                  >
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedResource(null);
                    }}
                    className="px-4 py-2 text-gray-400 border border-[#4A5A70] rounded-lg hover:bg-[#2A3133] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateResourceMutation.isPending}
                    className="px-4 py-2 bg-[#4A5A70] text-white rounded-lg hover:bg-[#606364] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {updateResourceMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4" />
                        Update Resource
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
