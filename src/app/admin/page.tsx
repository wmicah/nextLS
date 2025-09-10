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
} from "lucide-react";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import AdminSecurityDashboard from "@/components/AdminSecurityDashboard";

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
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Check if user is admin
  const { data: authData } = trpc.authCallback.useQuery();
  const { data: masterLibrary = [], refetch: refetchMasterLibrary } =
    trpc.admin.getMasterLibraryForAdmin.useQuery();
  const { data: stats } = trpc.admin.getStats.useQuery();

  const addResourceMutation = trpc.admin.addToMasterLibrary.useMutation({
    onSuccess: () => {
      refetchMasterLibrary();
      setIsAddResourceModalOpen(false);
      setNewResource({
        title: "",
        description: "",
        category: "",
        type: "Video",
        filename: "",
        contentType: "",
        size: 0,
        thumbnail: "",
      });
      setSelectedFile(null);
      setUploadProgress(0);
    },
    onError: error => {
      console.error("Failed to add resource:", error);
      alert(`Failed to add resource: ${error.message}`);
    },
  });

  // Redirect if not admin
  useEffect(() => {
    if (authData?.user && !authData.user.isAdmin) {
      router.push("/dashboard");
    }
  }, [authData, router]);

  if (!authData?.user || !authData.user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2A3133]">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">
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
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "security", label: "Security", icon: Shield },
    { id: "settings", label: "Admin Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#2A3133] text-white">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#1A1D1E] border-b border-[#4A5A70] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4A5A70] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin</h1>
              <p className="text-xs text-gray-400">
                {authData.user.name || authData.user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#4A5A70] text-white">
              {authData.user.role}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-600 text-white">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-[#1A1D1E] border-b border-[#4A5A70] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#4A5A70] flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-400">
                  Welcome back, {authData.user.name || authData.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#4A5A70] text-white">
                  {authData.user.role}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-600 text-white">
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
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-[#2D3748] rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        {/* Desktop Back Button */}
        <div className="hidden md:block mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2D3748] rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden mb-4">
          <div className="flex space-x-1 bg-[#1A1D1E] rounded-lg p-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-[#4A5A70] text-white"
                      : "text-gray-400 hover:text-white hover:bg-[#2D3748]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex space-x-1 bg-[#1A1D1E] rounded-lg p-1 mb-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-[#4A5A70] text-white"
                    : "text-gray-400 hover:text-white hover:bg-[#2D3748]"
                }`}
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
                      {stats?.totalUsers || 0}
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
              <button
                onClick={() => setIsAddResourceModalOpen(true)}
                className="px-4 py-2 bg-[#4A5A70] text-white rounded-lg hover:bg-[#606364] transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </button>
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

        {activeTab === "settings" && (
          <div className="bg-[#1A1D1E] rounded-xl p-6 border border-[#4A5A70]">
            <h2 className="text-xl font-bold mb-4">Admin Settings</h2>
            <p className="text-gray-400">
              Admin settings features coming soon...
            </p>
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
                  if (!selectedFile) {
                    alert("Please select a file to upload");
                    return;
                  }

                  try {
                    // First upload the file
                    const formData = new FormData();
                    formData.append("file", selectedFile);

                    const uploadResponse = await fetch(
                      "/api/upload-master-video",
                      {
                        method: "POST",
                        body: formData,
                      }
                    );

                    if (!uploadResponse.ok) {
                      const errorData = await uploadResponse.json();
                      throw new Error(errorData.error || "Upload failed");
                    }

                    const uploadData = await uploadResponse.json();

                    // Create a proper HTTP URL for the file (this replaces the old secure://master-library/ protocol)
                    const secureUrl = `/api/master-video/${encodeURIComponent(
                      uploadData.filename
                    )}`;

                    // Now save the metadata to the database
                    addResourceMutation.mutate({
                      title: newResource.title,
                      description: newResource.description,
                      category: newResource.category,
                      type: newResource.type,
                      url: secureUrl,
                      filename: uploadData.filename,
                      contentType: uploadData.contentType,
                      size: uploadData.size,
                      thumbnail: "",
                      isYoutube: false,
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
                            filename: uploadData.filename,
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Training Video File *
                  </label>
                  <div className="border-2 border-dashed border-[#4A5A70] rounded-lg p-6 text-center hover:border-[#606364] transition-colors">
                    <input
                      type="file"
                      accept="video/*,.mp4,.mov,.avi,.mkv"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setNewResource({
                            ...newResource,
                            filename: file.name,
                            contentType: file.type,
                            size: file.size,
                          });
                        }
                      }}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      {selectedFile ? (
                        <>
                          <div className="text-4xl">🎥</div>
                          <div className="text-white font-medium">
                            {selectedFile.name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-4xl">📁</div>
                          <div className="text-white font-medium">
                            Click to select video file
                          </div>
                          <div className="text-gray-400 text-sm">
                            Supports MP4, MOV, AVI, MKV (Max 500MB)
                          </div>
                        </>
                      )}
                    </label>
                  </div>
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddResourceModalOpen(false)}
                    className="px-4 py-2 text-gray-400 border border-[#4A5A70] rounded-lg hover:bg-[#2A3133] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addResourceMutation.isPending}
                    className="px-4 py-2 bg-[#4A5A70] text-white rounded-lg hover:bg-[#606364] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {addResourceMutation.isPending ? (
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
      </div>
    </div>
  );
}
