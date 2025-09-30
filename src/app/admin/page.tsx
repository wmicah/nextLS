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
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

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
  const [isUploading, setIsUploading] = useState(false);

  // Check if user is admin
  const { data: authData } = trpc.authCallback.useQuery();
  const { data: masterLibrary = [], refetch: refetchMasterLibrary } =
    trpc.admin.getMasterLibraryForAdmin.useQuery();
  const { data: stats } = trpc.admin.getStats.useQuery();

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

                  setIsUploading(true);
                  setUploadProgress(0);

                  try {
                    // File is already uploaded via UploadThing, get the URL from the stored file
                    const fileUrl = (selectedFile as any).url;

                    if (!fileUrl) {
                      throw new Error(
                        "No file URL found. Please re-upload the file."
                      );
                    }

                    setIsUploading(true);
                    setUploadProgress(50);

                    // Determine the correct type based on content type
                    const resourceType = newResource.contentType.startsWith(
                      "video/"
                    )
                      ? "video"
                      : "document";

                    console.log("Submitting to admin mutation:", {
                      title: newResource.title,
                      description: newResource.description,
                      category: newResource.category,
                      type: resourceType,
                      url: fileUrl,
                      filename: newResource.filename,
                      contentType: newResource.contentType,
                      size: newResource.size,
                    });

                    // Now save the metadata to the database using the admin mutation
                    addResourceMutation.mutate({
                      title: newResource.title,
                      description: newResource.description,
                      category: newResource.category,
                      type: resourceType,
                      url: fileUrl,
                      filename: newResource.filename,
                      contentType: newResource.contentType,
                      size: newResource.size,
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Training Video File *
                  </label>
                  {!selectedFile ? (
                    <div className="border-2 border-dashed border-[#4A5A70] rounded-lg p-6 text-center hover:border-[#606364] transition-colors">
                      <UploadButton<OurFileRouter, "videoUploader">
                        endpoint="videoUploader"
                        onClientUploadComplete={res => {
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
      </div>
    </div>
  );
}
