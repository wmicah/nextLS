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
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { COLORS } from "@/lib/colors";

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
  });
  const [customFields, setCustomFields] = useState<
    Array<{ key: string; value: string; type: "text" | "number" | "boolean" }>
  >([]);
  const [isEditingClientInfo, setIsEditingClientInfo] = useState(false);
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

  // Update editedPitchingData when client data is loaded or when entering edit mode
  useEffect(() => {
    if (client && isEditingClientInfo) {
      setEditedPitchingData({
        age: client.age?.toString() || "",
        height: client.height || "",
      });
      setCustomFields(
        (client as any)?.customFields &&
          typeof (client as any).customFields === "object" &&
          !Array.isArray((client as any).customFields)
          ? Object.entries((client as any).customFields).map(
              ([key, value]) => ({
                key,
                value: String(value),
                type:
                  typeof value === "number"
                    ? "number"
                    : typeof value === "boolean"
                    ? "boolean"
                    : "text",
              })
            )
          : []
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(client as any)?.id, (client as any)?.age, (client as any)?.height, isEditingClientInfo]);

  // Update client mutation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateClientMutation = (trpc.clients.update as any).useMutation({
    onSuccess: () => {
      setIsUpdating(false);
      setIsEditingName(false);
      setIsEditingClientInfo(false);
      setEditedName("");
      addToast({
        type: "success",
        title: "Profile updated",
        message: "Client profile has been updated successfully.",
      });
      utils.clients.list.invalidate();
      utils.clients.getById.invalidate({ id: clientId });
    },
    onError: (error: { message?: string }) => {
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
      customFields:
        customFields.length > 0
          ? customFields.reduce((acc, field) => {
              if (field.key.trim()) {
                let value: string | number | boolean = field.value;
                if (field.type === "number") {
                  value = parseFloat(field.value) || 0;
                } else if (field.type === "boolean") {
                  value =
                    field.value.toLowerCase() === "true" || field.value === "1";
                }
                acc[field.key.trim()] = value;
              }
              return acc;
            }, {} as Record<string, string | number | boolean>)
          : undefined,
    });
    // Note: isEditingClientInfo will be set to false in the onClick handler
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


  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-lg border max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl shadow-black/50"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        {/* Header - Fixed */}
        <div className="px-4 py-3 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                Client Profile
              </h3>
              <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                Overview of {clientName}&apos;s information and progress
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-1.5 rounded-md transition-all duration-200"
                style={{ color: COLORS.TEXT_SECONDARY }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="h-[calc(95vh-140px)]">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div
                  className="animate-spin rounded-full h-6 w-6 border-2"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, borderTopColor: COLORS.GOLDEN_ACCENT }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Client Info Card */}
                <div
                  className="rounded-lg shadow-lg border p-4"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
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
                        <div className="flex items-center gap-1.5 mb-1">
                          <input
                            type="text"
                            value={editedName}
                            onChange={e => setEditedName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") handleSaveName();
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            className="text-lg font-bold border-2 rounded px-2 py-1 focus:outline-none"
                            style={{
                              color: COLORS.TEXT_PRIMARY,
                              backgroundColor: COLORS.BACKGROUND_DARK,
                              borderColor: COLORS.GOLDEN_ACCENT,
                            }}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveName}
                            disabled={updateClientMutation.isPending}
                            className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                            style={{
                              backgroundColor: COLORS.GREEN_PRIMARY,
                              color: COLORS.BACKGROUND_DARK,
                            }}
                            title="Save"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={updateClientMutation.isPending}
                            className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                            style={{
                              backgroundColor: COLORS.RED_ALERT,
                              color: "#FFFFFF",
                            }}
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mb-1">
                          <h2
                            className="text-lg font-bold"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            {clientName}
                          </h2>
                          <button
                            onClick={handleEditName}
                            className="p-1 rounded-md transition-colors"
                            style={{ 
                              color: COLORS.TEXT_SECONDARY,
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                            }}
                            title="Edit name"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs mt-0.5">
                        {clientEmail && (
                          <div
                            className="flex items-center gap-1"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            <Mail className="h-3 w-3" />
                            {clientEmail}
                          </div>
                        )}
                        {clientPhone && (
                          <div
                            className="flex items-center gap-1"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            <Phone className="h-3 w-3" />
                            {clientPhone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div
                      className="flex items-center gap-2 p-2.5 rounded-lg"
                      style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                    >
                      <Calendar
                        className="h-4 w-4"
                        style={{ color: COLORS.GOLDEN_ACCENT }}
                      />
                      <div>
                        <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                          Member Since
                        </p>
                        <p className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                          {client?.createdAt
                            ? format(new Date(client.createdAt), "MMM dd, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2 p-2.5 rounded-lg"
                      style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                    >
                      <Clock className="h-4 w-4" style={{ color: COLORS.GREEN_PRIMARY }} />
                      <div>
                        <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                          Next Lesson
                        </p>
                        <p className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
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
                      className="flex items-center gap-2 p-2.5 rounded-lg"
                      style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                    >
                      <Activity
                        className="h-4 w-4"
                        style={{ color: COLORS.GOLDEN_ACCENT }}
                      />
                      <div>
                        <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                          Last Activity
                        </p>
                        <p className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
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

                {/* Client Information Section */}
                <div
                  className="rounded-lg shadow-lg border p-4"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target
                        className="h-4 w-4"
                        style={{ color: COLORS.GOLDEN_ACCENT }}
                      />
                      <h3 className="text-sm font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                        Client Information
                      </h3>
                    </div>
                    {!isEditingClientInfo && (
                      <button
                        onClick={() => setIsEditingClientInfo(true)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1"
                        style={{
                          backgroundColor: COLORS.GOLDEN_DARK,
                          color: COLORS.TEXT_PRIMARY,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                        }}
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </button>
                    )}
                  </div>
                  {isEditingClientInfo ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="age"
                            className="block text-xs font-medium mb-1.5"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            Age
                          </label>
                          <input
                            type="number"
                            id="age"
                            name="age"
                            value={editedPitchingData.age}
                            onChange={handlePitchingInputChange}
                            className="w-full px-2.5 py-1.5 rounded-md border text-sm transition-colors focus:outline-none"
                            style={{
                              backgroundColor: COLORS.BACKGROUND_DARK,
                              borderColor: COLORS.BORDER_SUBTLE,
                              color: COLORS.TEXT_PRIMARY,
                            }}
                            placeholder="Age"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="height"
                            className="block text-xs font-medium mb-1.5"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            Height
                          </label>
                          <input
                            type="text"
                            id="height"
                            name="height"
                            value={editedPitchingData.height}
                            onChange={handlePitchingInputChange}
                            className="w-full px-2.5 py-1.5 rounded-md border text-sm transition-colors focus:outline-none"
                            style={{
                              backgroundColor: COLORS.BACKGROUND_DARK,
                              borderColor: COLORS.BORDER_SUBTLE,
                              color: COLORS.TEXT_PRIMARY,
                            }}
                            placeholder="e.g., 5'10&quot;, 178cm"
                          />
                        </div>
                      </div>

                      {/* Custom Fields Editing */}
                      <div
                        className="mt-4 pt-4 border-t"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4
                            className="text-sm font-semibold"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            Custom Metrics
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomFields([
                                ...customFields,
                                { key: "", value: "", type: "text" },
                              ])
                            }
                            className="px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1"
                            style={{
                              backgroundColor: COLORS.GREEN_PRIMARY,
                              color: COLORS.BACKGROUND_DARK,
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                            }}
                          >
                            <Plus className="h-3 w-3" />
                            Add Field
                          </button>
                        </div>

                        {customFields.length === 0 ? (
                          <p
                            className="text-xs mb-3"
                            style={{ color: COLORS.TEXT_MUTED }}
                          >
                            Add custom metrics specific to your coaching needs.
                            For example: "Wing Span", "Weight", "Grip Strength",
                            etc.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {customFields.map((field, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2 p-2 rounded-md"
                                style={{
                                  backgroundColor: COLORS.BACKGROUND_DARK,
                                  border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                                }}
                              >
                                <div className="flex-1 grid grid-cols-12 gap-1.5">
                                  <div className="col-span-4">
                                    <input
                                      placeholder="Field name"
                                      value={field.key}
                                      onChange={e => {
                                        const updated = [...customFields];
                                        updated[index].key = e.target.value;
                                        setCustomFields(updated);
                                      }}
                                      className="w-full px-2 py-1 rounded-md border text-xs"
                                      style={{
                                        backgroundColor: COLORS.BACKGROUND_CARD,
                                        borderColor: COLORS.BORDER_SUBTLE,
                                        color: COLORS.TEXT_PRIMARY,
                                      }}
                                    />
                                  </div>
                                  <div className="col-span-3">
                                    <select
                                      value={field.type}
                                      onChange={e => {
                                        const updated = [...customFields];
                                        updated[index].type = e.target.value as
                                          | "text"
                                          | "number"
                                          | "boolean";
                                        updated[index].value = "";
                                        setCustomFields(updated);
                                      }}
                                      className="w-full px-2 py-1 rounded-md border text-xs"
                                      style={{
                                        backgroundColor: COLORS.BACKGROUND_CARD,
                                        borderColor: COLORS.BORDER_SUBTLE,
                                        color: COLORS.TEXT_PRIMARY,
                                      }}
                                    >
                                      <option value="text">Text</option>
                                      <option value="number">Number</option>
                                      <option value="boolean">Yes/No</option>
                                    </select>
                                  </div>
                                  <div className="col-span-4">
                                    {field.type === "boolean" ? (
                                      <select
                                        value={field.value}
                                        onChange={e => {
                                          const updated = [...customFields];
                                          updated[index].value = e.target.value;
                                          setCustomFields(updated);
                                        }}
                                        className="w-full px-2 py-1 rounded-md border text-xs"
                                        style={{
                                          backgroundColor: COLORS.BACKGROUND_CARD,
                                          borderColor: COLORS.BORDER_SUBTLE,
                                          color: COLORS.TEXT_PRIMARY,
                                        }}
                                      >
                                        <option value="">Select...</option>
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                      </select>
                                    ) : (
                                      <input
                                        placeholder={
                                          field.type === "number"
                                            ? "Value"
                                            : "Enter value"
                                        }
                                        type={
                                          field.type === "number"
                                            ? "number"
                                            : "text"
                                        }
                                        step={
                                          field.type === "number"
                                            ? "0.1"
                                            : undefined
                                        }
                                        value={field.value}
                                        onChange={e => {
                                          const updated = [...customFields];
                                          updated[index].value = e.target.value;
                                          setCustomFields(updated);
                                        }}
                                        className="w-full px-2 py-1 rounded-md border text-xs"
                                        style={{
                                          backgroundColor: COLORS.BACKGROUND_CARD,
                                          borderColor: COLORS.BORDER_SUBTLE,
                                          color: COLORS.TEXT_PRIMARY,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCustomFields(
                                      customFields.filter((_, i) => i !== index)
                                    )
                                  }
                                  className="p-1.5 rounded-md transition-all"
                                  style={{
                                    backgroundColor: COLORS.RED_ALERT,
                                    color: "#FFFFFF",
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = COLORS.RED_DARK;
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = COLORS.RED_ALERT;
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3">
                        <button
                          onClick={() => {
                            setIsEditingClientInfo(false);
                            // Reset form data to original values
                            if (client) {
                              setEditedPitchingData({
                                age: client.age?.toString() || "",
                                height: client.height || "",
                              });
                              setCustomFields(
                                (client as any)?.customFields &&
                                  typeof (client as any).customFields ===
                                    "object" &&
                                  !Array.isArray((client as any).customFields)
                                  ? Object.entries(
                                      (client as any).customFields
                                    ).map(([key, value]) => ({
                                      key,
                                      value: String(value),
                                      type:
                                        typeof value === "number"
                                          ? "number"
                                          : typeof value === "boolean"
                                          ? "boolean"
                                          : "text",
                                    }))
                                  : []
                              );
                            }
                          }}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_CARD,
                            color: COLORS.TEXT_SECONDARY,
                            border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                            e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSavePitchingData}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                          style={{
                            backgroundColor: COLORS.GOLDEN_DARK,
                            color: COLORS.TEXT_PRIMARY,
                          }}
                          onMouseEnter={e => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                            }
                          }}
                          onMouseLeave={e => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                            }
                          }}
                        >
                          {isUpdating ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {client?.age && (
                        <div
                          className="p-2.5 rounded-lg"
                          style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                        >
                          <div className="text-xs mb-1" style={{ color: COLORS.TEXT_SECONDARY }}>Age</div>
                          <div className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                            {client.age}
                          </div>
                        </div>
                      )}
                      {client?.height && (
                        <div
                          className="p-2.5 rounded-lg"
                          style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                        >
                          <div className="text-xs mb-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                            Height
                          </div>
                          <div className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                            {client.height}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Fields Display */}
                  {(client as any)?.customFields &&
                    typeof (client as any).customFields === "object" &&
                    !Array.isArray((client as any).customFields) &&
                    Object.keys((client as any).customFields).length > 0 && (
                      <>
                        <div
                          className="mt-4 pt-4 border-t"
                          style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        >
                          <h4
                            className="text-sm font-semibold mb-3"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            Custom Metrics
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                            {Object.entries((client as any).customFields).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="p-2.5 rounded-lg"
                                  style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                                >
                                  <div className="text-xs mb-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                                    {key}
                                  </div>
                                  <div className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                                    {typeof value === "boolean"
                                      ? value
                                        ? "Yes"
                                        : "No"
                                      : String(value)}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div
              className="rounded-lg shadow-lg border p-4"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
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
              className="rounded-lg shadow-lg border p-4"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4" style={{ color: COLORS.GOLDEN_ACCENT }} />
                <h3 className="text-sm font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Assigned Programs ({client?.programAssignments?.length || 0})
                </h3>
              </div>
              <div>
                {client?.programAssignments &&
                client.programAssignments.length > 0 ? (
                  <div className="space-y-2.5">
                    {client.programAssignments.map(assignment => (
                      <div
                        key={assignment.id}
                        className="p-3 rounded-lg border"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4
                              className="text-sm font-medium mb-1"
                              style={{ color: COLORS.TEXT_PRIMARY }}
                            >
                              {assignment.program.title}
                            </h4>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                style={{
                                  backgroundColor: COLORS.BACKGROUND_CARD,
                                  color: COLORS.TEXT_SECONDARY,
                                }}
                              >
                                {assignment.program.sport || "General"}
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                style={{
                                  backgroundColor: COLORS.GREEN_PRIMARY,
                                  color: COLORS.BACKGROUND_DARK,
                                }}
                              >
                                {assignment.program.level}
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                style={{
                                  backgroundColor: COLORS.GOLDEN_ACCENT,
                                  color: COLORS.BACKGROUND_DARK,
                                }}
                              >
                                {assignment.program.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className="text-xs"
                              style={{ color: COLORS.TEXT_SECONDARY }}
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
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className="text-xs"
                              style={{ color: COLORS.TEXT_SECONDARY }}
                            >
                              Progress
                            </span>
                            <span
                              className="text-xs font-medium"
                              style={{ color: COLORS.TEXT_PRIMARY }}
                            >
                              {assignment.progress}%
                            </span>
                          </div>
                          <div
                            className="w-full rounded-full h-1.5"
                            style={{ backgroundColor: COLORS.BACKGROUND_CARD }}
                          >
                            <div
                              className="h-1.5 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor: COLORS.GOLDEN_ACCENT,
                                width: `${assignment.progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookOpen
                      className="h-8 w-8 mx-auto mb-2"
                      style={{ color: COLORS.TEXT_MUTED }}
                    />
                    <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                      No programs assigned to this client
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Section */}
            <div
              className="rounded-lg shadow-lg border p-4"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4" style={{ color: COLORS.GOLDEN_ACCENT }} />
                <h3 className="text-sm font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-2">
                {client?.lastCompletedWorkout ? (
                  <div
                    className="flex items-center gap-2 p-2.5 rounded-lg"
                    style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                  >
                    <Target className="h-4 w-4" style={{ color: COLORS.GREEN_PRIMARY }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                        Last Completed Workout
                      </p>
                      <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                        {format(
                          new Date(client.lastCompletedWorkout),
                          "MMM dd, yyyy 'at' h:mm a"
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 p-2.5 rounded-lg"
                    style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                  >
                    <Clock className="h-4 w-4" style={{ color: COLORS.TEXT_MUTED }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                        No Recent Activity
                      </p>
                      <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
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
