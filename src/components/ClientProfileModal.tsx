"use client";

import React from "react";
import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { useUIStore } from "@/lib/stores/uiStore";
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ProfilePictureUploader from "./ProfilePictureUploader";
import NotesDisplay from "./NotesDisplay";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Target,
  Clock,
  Mail,
  Phone,
  FileText,
  X,
  Edit,
  TrendingUp,
  Activity,
  BookOpen,
  BarChart3,
  History,
  Save,
} from "lucide-react";
import { format } from "date-fns";

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientNotes?: string | null;
  clientAvatar?: string | null;
}

// interface Client {
// 	id: string
// 	name: string
// 	email: string | null
// 	phone: string | null
// 	notes: string | null
// 	avatar: string | null
// 	createdAt: string
// 	updatedAt: string
// 	nextLessonDate: string | null
// 	lastCompletedWorkout: string | null
// 	// Pitching Information
// 	age?: number | null
// 	height?: string | null
// 	dominantHand?: string | null
// 	movementStyle?: string | null
// 	reachingAbility?: string | null
// 	averageSpeed?: number | null
// 	topSpeed?: number | null
// 	dropSpinRate?: number | null
// 	changeupSpinRate?: number | null
// 	riseSpinRate?: number | null
// 	curveSpinRate?: number | null
// 	user?: {
// 		id: string
// 		name: string | null
// 		email: string
// 		settings: {
// 			avatarUrl: string | null
// 		} | null
// 	} | null
// 	programAssignments?: {
// 		id: string
// 		programId: string
// 		assignedAt: string
// 		progress: number
// 		program: {
// 			id: string
// 			title: string
// 			status: string
// 			sport: string
// 			level: string
// 		}
// 	}[]
// }

export default function ClientProfileModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientEmail,
  clientPhone,
  clientNotes,
}: // clientAvatar,
ClientProfileModalProps) {
  console.log("ClientProfileModal rendered with props:", {
    isOpen,
    clientId,
    clientName,
  });

  const [editedPitchingData, setEditedPitchingData] = useState({
    age: "",
    height: "",
    dominantHand: "",
    movementStyle: "",
    reachingAbility: "",
    averageSpeed: "",
    topSpeed: "",
    dropSpinRate: "",
    changeupSpinRate: "",
    riseSpinRate: "",
    curveSpinRate: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview">("overview");

  // Inline editing state for client name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const { addToast } = useUIStore();
  const utils = trpc.useUtils();

  // Handle name editing
  const handleEditName = () => {
    setEditedName(clientName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== clientName) {
      setIsUpdating(true);
      updateClientMutation.mutate({
        id: clientId,
        name: editedName.trim(),
      });
    } else {
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  // Get detailed client data
  const { data: client, isLoading } = trpc.clients.getById.useQuery(
    { id: clientId },
    { enabled: isOpen && !!clientId }
  );

  // Update editedPitchingData when client data is loaded
  useEffect(() => {
    if (client) {
      setEditedPitchingData({
        age: client.age?.toString() || "",
        height: client.height || "",
        dominantHand: client.dominantHand || "",
        movementStyle: client.movementStyle || "",
        reachingAbility: client.reachingAbility || "",
        averageSpeed: client.averageSpeed?.toString() || "",
        topSpeed: client.topSpeed?.toString() || "",
        dropSpinRate: client.dropSpinRate?.toString() || "",
        changeupSpinRate: client.changeupSpinRate?.toString() || "",
        riseSpinRate: client.riseSpinRate?.toString() || "",
        curveSpinRate: client.curveSpinRate?.toString() || "",
      });
    }
  }, [client]);

  // Update client mutation
  const updateClientMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      setIsUpdating(false);
      setIsEditingName(false);
      setEditedName("");
      addToast({
        type: "success",
        title: "Profile updated",
        message: "Client profile has been updated successfully.",
      });
      utils.clients.list.invalidate();
      utils.clients.getById.invalidate({ id: clientId });
    },
    onError: error => {
      setIsUpdating(false);
      setIsEditingName(false);
      setEditedName(clientName);
      addToast({
        type: "error",
        title: "Update failed",
        message: error.message || "Failed to update client profile.",
      });
    },
  });

  const handleSavePitchingData = () => {
    setIsUpdating(true);
    updateClientMutation.mutate({
      id: clientId,
      age: editedPitchingData.age
        ? parseInt(editedPitchingData.age)
        : undefined,
      height: editedPitchingData.height.trim() || undefined,
      dominantHand:
        (editedPitchingData.dominantHand as "RIGHT" | "LEFT") || undefined,
      movementStyle:
        (editedPitchingData.movementStyle as "AIRPLANE" | "HELICOPTER") ||
        undefined,
      reachingAbility:
        (editedPitchingData.reachingAbility as "REACHER" | "NON_REACHER") ||
        undefined,
      averageSpeed: editedPitchingData.averageSpeed
        ? parseFloat(editedPitchingData.averageSpeed)
        : undefined,
      topSpeed: editedPitchingData.topSpeed
        ? parseFloat(editedPitchingData.topSpeed)
        : undefined,
      dropSpinRate: editedPitchingData.dropSpinRate
        ? parseInt(editedPitchingData.dropSpinRate)
        : undefined,
      changeupSpinRate: editedPitchingData.changeupSpinRate
        ? parseInt(editedPitchingData.changeupSpinRate)
        : undefined,
      riseSpinRate: editedPitchingData.riseSpinRate
        ? parseInt(editedPitchingData.riseSpinRate)
        : undefined,
      curveSpinRate: editedPitchingData.curveSpinRate
        ? parseInt(editedPitchingData.curveSpinRate)
        : undefined,
    });
  };

  const handlePitchingInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditedPitchingData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) {
    console.log("Modal not open, returning null");
    return null;
  }

  console.log("Modal is open, rendering content");

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl border max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl shadow-black/50"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        {/* Header - Fixed */}
        <div className="p-6 border-b" style={{ borderColor: "#606364" }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold" style={{ color: "#C3BCC2" }}>
                Client Profile
              </h3>
              <p className="text-sm mt-1" style={{ color: "#ABA4AA" }}>
                Overview of {clientName}&apos;s information and progress
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{ color: "#ABA4AA" }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#C3BCC2";
                  e.currentTarget.style.backgroundColor = "#3A4040";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "#ABA4AA";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="h-[calc(95vh-180px)]">
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-2"
                  style={{ borderColor: "#4A5A70", borderTopColor: "#C3BCC2" }}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Client Info Card */}
                <div
                  className="rounded-2xl shadow-xl border p-6"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: "#606364",
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <ProfilePictureUploader
                      currentAvatarUrl={
                        client?.user?.settings?.avatarUrl || client?.avatar
                      }
                      userName={clientName}
                      onAvatarChange={() => {}} // No-op for profile modal
                      size="lg"
                      readOnly={true}
                      className="flex-shrink-0"
                    />
                    <div>
                      {isEditingName ? (
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="text"
                            value={editedName}
                            onChange={e => setEditedName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") handleSaveName();
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            className="text-2xl font-bold bg-gray-700 border-2 border-blue-400 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                            style={{
                              color: "#C3BCC2",
                              backgroundColor: "#2A2F2F",
                            }}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveName}
                            disabled={updateClientMutation.isPending}
                            className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                            title="Save"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={updateClientMutation.isPending}
                            className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <h2
                            className="text-2xl font-bold"
                            style={{ color: "#C3BCC2" }}
                          >
                            {clientName}
                          </h2>
                          <button
                            onClick={handleEditName}
                            className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            title="Edit name"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm mt-1">
                        {clientEmail && (
                          <div
                            className="flex items-center gap-1"
                            style={{ color: "#ABA4AA" }}
                          >
                            <Mail className="h-3 w-3" />
                            {clientEmail}
                          </div>
                        )}
                        {clientPhone && (
                          <div
                            className="flex items-center gap-1"
                            style={{ color: "#ABA4AA" }}
                          >
                            <Phone className="h-3 w-3" />
                            {clientPhone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: "#353A3A" }}
                    >
                      <Calendar
                        className="h-5 w-5"
                        style={{ color: "#4A5A70" }}
                      />
                      <div>
                        <p className="text-sm" style={{ color: "#ABA4AA" }}>
                          Member Since
                        </p>
                        <p className="font-medium" style={{ color: "#C3BCC2" }}>
                          {client?.createdAt
                            ? format(new Date(client.createdAt), "MMM dd, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: "#353A3A" }}
                    >
                      <Clock className="h-5 w-5" style={{ color: "#10B981" }} />
                      <div>
                        <p className="text-sm" style={{ color: "#ABA4AA" }}>
                          Next Lesson
                        </p>
                        <p className="font-medium" style={{ color: "#C3BCC2" }}>
                          {client?.nextLessonDate
                            ? format(
                                new Date(client.nextLessonDate),
                                "MMM dd, yyyy"
                              )
                            : "No upcoming lessons"}
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: "#353A3A" }}
                    >
                      <Activity
                        className="h-5 w-5"
                        style={{ color: "#8B5CF6" }}
                      />
                      <div>
                        <p className="text-sm" style={{ color: "#ABA4AA" }}>
                          Last Activity
                        </p>
                        <p className="font-medium" style={{ color: "#C3BCC2" }}>
                          {client?.lastCompletedWorkout
                            ? format(
                                new Date(client.lastCompletedWorkout),
                                "MMM dd, yyyy"
                              )
                            : "No recent activity"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pitching Information Section */}
                <div
                  className="rounded-2xl shadow-xl border p-6"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: "#606364",
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5" style={{ color: "#C3BCC2" }} />
                    <h3 className="font-bold" style={{ color: "#C3BCC2" }}>
                      Pitching Information
                    </h3>
                  </div>
                  {false ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="age"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#C3BCC2" }}
                          >
                            Age
                          </label>
                          <input
                            type="number"
                            id="age"
                            name="age"
                            value={editedPitchingData.age}
                            onChange={handlePitchingInputChange}
                            className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                              color: "#C3BCC2",
                            }}
                            placeholder="Age"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="height"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#C3BCC2" }}
                          >
                            Height
                          </label>
                          <input
                            type="text"
                            id="height"
                            name="height"
                            value={editedPitchingData.height}
                            onChange={handlePitchingInputChange}
                            className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                              color: "#C3BCC2",
                            }}
                            placeholder="e.g., 5'10&quot;, 178cm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="dominantHand"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#C3BCC2" }}
                          >
                            Dominant Hand
                          </label>
                          <select
                            id="dominantHand"
                            name="dominantHand"
                            value={editedPitchingData.dominantHand}
                            onChange={handlePitchingInputChange}
                            className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                              color: "#C3BCC2",
                            }}
                          >
                            <option value="">Select hand</option>
                            <option value="RIGHT">Right</option>
                            <option value="LEFT">Left</option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="movementStyle"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#C3BCC2" }}
                          >
                            Movement Style
                          </label>
                          <select
                            id="movementStyle"
                            name="movementStyle"
                            value={editedPitchingData.movementStyle}
                            onChange={handlePitchingInputChange}
                            className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                              color: "#C3BCC2",
                            }}
                          >
                            <option value="">Select style</option>
                            <option value="AIRPLANE">Airplane</option>
                            <option value="HELICOPTER">Helicopter</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="reachingAbility"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#C3BCC2" }}
                          >
                            Reaching Ability
                          </label>
                          <select
                            id="reachingAbility"
                            name="reachingAbility"
                            value={editedPitchingData.reachingAbility}
                            onChange={handlePitchingInputChange}
                            className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                              color: "#C3BCC2",
                            }}
                          >
                            <option value="">Select ability</option>
                            <option value="REACHER">Reacher</option>
                            <option value="NON_REACHER">Non Reacher</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="averageSpeed"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#C3BCC2" }}
                          >
                            Average Speed (mph)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            id="averageSpeed"
                            name="averageSpeed"
                            value={editedPitchingData.averageSpeed}
                            onChange={handlePitchingInputChange}
                            className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                              color: "#C3BCC2",
                            }}
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="topSpeed"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#C3BCC2" }}
                          >
                            Top Speed (mph)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            id="topSpeed"
                            name="topSpeed"
                            value={editedPitchingData.topSpeed}
                            onChange={handlePitchingInputChange}
                            className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                              color: "#C3BCC2",
                            }}
                            placeholder="0.0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="dropSpinRate"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#C3BCC2" }}
                          >
                            Drop Spin Rate (rpm)
                          </label>
                          <input
                            type="number"
                            id="dropSpinRate"
                            name="dropSpinRate"
                            value={editedPitchingData.dropSpinRate}
                            onChange={handlePitchingInputChange}
                            className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                              color: "#C3BCC2",
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="changeupSpinRate"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#C3BCC2" }}
                          >
                            Changeup Spin Rate (rpm)
                          </label>
                          <input
                            type="number"
                            id="changeupSpinRate"
                            name="changeupSpinRate"
                            value={editedPitchingData.changeupSpinRate}
                            onChange={handlePitchingInputChange}
                            className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                              color: "#C3BCC2",
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="riseSpinRate"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#C3BCC2" }}
                          >
                            Rise Spin Rate (rpm)
                          </label>
                          <input
                            type="number"
                            id="riseSpinRate"
                            name="riseSpinRate"
                            value={editedPitchingData.riseSpinRate}
                            onChange={handlePitchingInputChange}
                            className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                              color: "#C3BCC2",
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="curveSpinRate"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "#C3BCC2" }}
                          >
                            Curve Spin Rate (rpm)
                          </label>
                          <input
                            type="number"
                            id="curveSpinRate"
                            name="curveSpinRate"
                            value={editedPitchingData.curveSpinRate}
                            onChange={handlePitchingInputChange}
                            className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{
                              backgroundColor: "#353A3A",
                              borderColor: "#606364",
                              color: "#C3BCC2",
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSavePitchingData}
                          disabled={isUpdating}
                          className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: "#4A5A70",
                            color: "#FFFFFF",
                          }}
                        >
                          {isUpdating ? "Saving..." : "Save Pitching Data"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {client?.age && (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#353A3A" }}
                        >
                          <div className="text-xs text-gray-400 mb-1">Age</div>
                          <div className="text-sm font-medium text-white">
                            {client.age}
                          </div>
                        </div>
                      )}
                      {client?.height && (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#353A3A" }}
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            Height
                          </div>
                          <div className="text-sm font-medium text-white">
                            {client.height}
                          </div>
                        </div>
                      )}
                      {client?.dominantHand && (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#353A3A" }}
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            Dominant Hand
                          </div>
                          <div className="text-sm font-medium text-white">
                            {client.dominantHand === "RIGHT" ? "Right" : "Left"}
                          </div>
                        </div>
                      )}
                      {client?.movementStyle && (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#353A3A" }}
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            Movement Style
                          </div>
                          <div className="text-sm font-medium text-white">
                            {client.movementStyle === "AIRPLANE"
                              ? "Airplane"
                              : "Helicopter"}
                          </div>
                        </div>
                      )}
                      {client?.reachingAbility && (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#353A3A" }}
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            Reaching Ability
                          </div>
                          <div className="text-sm font-medium text-white">
                            {client.reachingAbility === "REACHER"
                              ? "Reacher"
                              : "Non Reacher"}
                          </div>
                        </div>
                      )}
                      {client?.averageSpeed && (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#353A3A" }}
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            Average Speed
                          </div>
                          <div className="text-sm font-medium text-white">
                            {client.averageSpeed} mph
                          </div>
                        </div>
                      )}
                      {client?.topSpeed && (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#353A3A" }}
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            Top Speed
                          </div>
                          <div className="text-sm font-medium text-white">
                            {client.topSpeed} mph
                          </div>
                        </div>
                      )}
                      {client?.dropSpinRate && (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#353A3A" }}
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            Drop Spin Rate
                          </div>
                          <div className="text-sm font-medium text-white">
                            {client.dropSpinRate} rpm
                          </div>
                        </div>
                      )}
                      {client?.changeupSpinRate && (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#353A3A" }}
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            Changeup Spin Rate
                          </div>
                          <div className="text-sm font-medium text-white">
                            {client.changeupSpinRate} rpm
                          </div>
                        </div>
                      )}
                      {client?.riseSpinRate && (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#353A3A" }}
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            Rise Spin Rate
                          </div>
                          <div className="text-sm font-medium text-white">
                            {client.riseSpinRate} rpm
                          </div>
                        </div>
                      )}
                      {client?.curveSpinRate && (
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "#353A3A" }}
                        >
                          <div className="text-xs text-gray-400 mb-1">
                            Curve Spin Rate
                          </div>
                          <div className="text-sm font-medium text-white">
                            {client.curveSpinRate} rpm
                          </div>
                        </div>
                      )}
                    </div>
                  )}{" "}
                  (
                  <div className="text-center py-8">
                    <p className="text-gray-400">
                      Pitching information editing is disabled
                    </p>
                  </div>
                  )
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div
              className="rounded-2xl shadow-xl border p-6"
              style={{
                backgroundColor: "#2A2F2F",
                borderColor: "#606364",
              }}
            >
              <NotesDisplay
                clientId={clientId}
                isClientView={false}
                showComposer={true}
              />
            </div>

            {/* Assigned Programs Section */}
            <div
              className="rounded-2xl shadow-xl border p-6"
              style={{
                backgroundColor: "#2A2F2F",
                borderColor: "#606364",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5" style={{ color: "#C3BCC2" }} />
                <h3 className="font-bold" style={{ color: "#C3BCC2" }}>
                  Assigned Programs ({client?.programAssignments?.length || 0})
                </h3>
              </div>
              <div>
                {client?.programAssignments &&
                client.programAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {client.programAssignments.map(assignment => (
                      <div
                        key={assignment.id}
                        className="p-4 rounded-lg borderoadt"
                        style={{
                          backgroundColor: "#353A3A",
                          borderColor: "#606364",
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4
                              className="font-medium mb-1"
                              style={{ color: "#C3BCC2" }}
                            >
                              {assignment.program.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: "#4A5A70",
                                  color: "#C3BCC2",
                                }}
                              >
                                {assignment.program.sport || "General"}
                              </span>
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: "#10B981",
                                  color: "#FFFFFF",
                                }}
                              >
                                {assignment.program.level}
                              </span>
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: "#8B5CF6",
                                  color: "#FFFFFF",
                                }}
                              >
                                {assignment.program.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className="text-sm"
                              style={{ color: "#ABA4AA" }}
                            >
                              Assigned{" "}
                              {format(
                                new Date(assignment.assignedAt),
                                "MMM dd, yyyy"
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-sm"
                              style={{ color: "#ABA4AA" }}
                            >
                              Progress
                            </span>
                            <span
                              className="font-medium"
                              style={{ color: "#C3BCC2" }}
                            >
                              {assignment.progress}%
                            </span>
                          </div>
                          <div
                            className="w-full rounded-full h-2"
                            style={{ backgroundColor: "#2A2F2F" }}
                          >
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor: "#4A5A70",
                                width: `${assignment.progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen
                      className="h-12 w-12 mx-auto mb-3"
                      style={{ color: "#ABA4AA" }}
                    />
                    <p style={{ color: "#ABA4AA" }}>
                      No programs assigned to this client
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Section */}
            <div
              className="rounded-2xl shadow-xl border p-6"
              style={{
                backgroundColor: "#2A2F2F",
                borderColor: "#606364",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5" style={{ color: "#C3BCC2" }} />
                <h3 className="font-bold" style={{ color: "#C3BCC2" }}>
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-3">
                {client?.lastCompletedWorkout ? (
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: "#353A3A" }}
                  >
                    <Target className="h-5 w-5" style={{ color: "#10B981" }} />
                    <div>
                      <p className="font-medium" style={{ color: "#C3BCC2" }}>
                        Last Completed Workout
                      </p>
                      <p className="text-sm" style={{ color: "#ABA4AA" }}>
                        {format(
                          new Date(client.lastCompletedWorkout),
                          "MMM dd, yyyy 'at' h:mm a"
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: "#353A3A" }}
                  >
                    <Clock className="h-5 w-5" style={{ color: "#ABA4AA" }} />
                    <div>
                      <p className="font-medium" style={{ color: "#C3BCC2" }}>
                        No Recent Activity
                      </p>
                      <p className="text-sm" style={{ color: "#ABA4AA" }}>
                        This client hasn&apos;t completed any workouts yet
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
