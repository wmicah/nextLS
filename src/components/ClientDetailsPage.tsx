"use client";

import React from "react";
import { trpc } from "@/app/_trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { extractNoteContent } from "@/lib/note-utils";
import {
  Mail,
  Phone,
  Calendar,
  Activity,
  Edit,
  ArrowLeft,
  Dumbbell,
  MessageCircle,
  Plus,
  Save,
  X,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AssignProgramModal from "@/components/AssignProgramModal";
import AssignRoutineModal from "@/components/AssignRoutineModal";
import ScheduleLessonModal from "@/components/ScheduleLessonModal";
import EditClientModal from "@/components/EditClientModal";
import ClientProgressCard from "@/components/ProgressTracking/ClientProgressCard";

interface ClientDetailsPageProps {
  clientId: string;
  noSidebar?: boolean;
}

export default function ClientDetailsPage({
  clientId,
  noSidebar = false,
}: ClientDetailsPageProps) {
  const router = useRouter();
  const wrap = (content: React.ReactNode) =>
    noSidebar ? content : <Sidebar>{content}</Sidebar>;
  const [showAssignProgramModal, setShowAssignProgramModal] = useState(false);
  const [showAssignRoutineModal, setShowAssignRoutineModal] = useState(false);
  const [showScheduleLessonModal, setShowScheduleLessonModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "progress">(
    "overview"
  );

  // Inline editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const utils = trpc.useUtils();

  const {
    data: client,
    isLoading,
    error,
  } = trpc.clients.getById.useQuery({ id: clientId });
  const { data: clientWorkouts = [] } =
    trpc.workouts.getClientWorkouts.useQuery({
      clientId: clientId,
    });
  // const { data: clientProgress = [] } =
  // 	trpc.progress.getClientProgressById.useQuery({
  // 		clientId: clientId,
  // 	})
  // const { data: assignedVideos = [] } =
  // 	trpc.library.getClientAssignedVideos.useQuery({
  // 		clientId: clientId,
  // 	})
  const { data: assignedPrograms = [] } =
    trpc.clients.getAssignedPrograms.useQuery({
      clientId: clientId,
    });
  const {
    data: assignedRoutines = [],
    isLoading: isLoadingRoutines,
    error: routinesError,
  } = trpc.routines.getClientRoutineAssignments.useQuery({
    clientId: clientId,
  });

  // TRPC mutation for updating client name
  const updateClientMutation = (trpc.clients.update as any).useMutation({
    onSuccess: () => {
      setIsEditingName(false);
      setEditedName("");
      // Refetch client data to get updated name
      utils.clients.getById.invalidate({ id: clientId });
    },
    onError: (error: Error) => {
      console.error("Failed to update client name:", error);
      // Reset to original name on error
      setEditedName(client?.name || "");
    },
  });

  // Debug logging
  console.log("Assigned routines:", assignedRoutines);
  console.log("Routines loading:", isLoadingRoutines);
  console.log("Routines error:", routinesError);

  // Handle name editing
  const handleEditName = () => {
    setEditedName(client?.name || "");
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== client?.name) {
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

  if (isLoading) {
    return wrap(
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: "#4A5A70" }}
        />
      </div>
    );
  }

  if (error || !client) {
    return wrap(
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Client Not Found
          </h2>
          <p className="text-gray-400 mb-4">
            The client you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: "#4A5A70",
              color: "#FFFFFF",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return wrap(
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-opacity-80"
              style={{
                backgroundColor: "#4A5A70",
                color: "#FFFFFF",
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white">Client Details</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-opacity-80 hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: "#10B981",
                color: "#FFFFFF",
              }}
              onClick={() => setShowAssignRoutineModal(true)}
            >
              <Plus className="h-4 w-4" />
              Assign Routine
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-opacity-80 hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: "#4A5A70",
                color: "#FFFFFF",
              }}
              onClick={() => setShowEditClientModal(true)}
            >
              <Edit className="h-4 w-4" />
              Edit Client
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "overview"
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
            style={{
              backgroundColor:
                activeTab === "overview" ? "#4A5A70" : "transparent",
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "progress"
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
            style={{
              backgroundColor:
                activeTab === "progress" ? "#4A5A70" : "transparent",
            }}
          >
            Progress
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" ? (
          <>
            {/* Client Info Card */}
            <div
              className="rounded-2xl shadow-xl border p-6"
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
              }}
            >
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xl">
                    {client.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>

                {/* Client Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    {isEditingName ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={e => setEditedName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleSaveName();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          className="text-2xl font-bold text-white bg-gray-700 border-2 border-blue-400 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                          style={{ backgroundColor: "#2A2F2F" }}
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
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-white">
                          {client.name}
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
                    <div className="flex items-center gap-6 text-sm">
                      {client.email && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="h-4 w-4" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Phone className="h-4 w-4" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div
                      className="text-center p-3 rounded-lg"
                      style={{ backgroundColor: "#2A2F2F" }}
                    >
                      <div className="text-2xl font-bold text-white">
                        {clientWorkouts.length}
                      </div>
                      <div className="text-xs text-gray-400">
                        Total Workouts
                      </div>
                    </div>
                    <div
                      className="text-center p-3 rounded-lg"
                      style={{ backgroundColor: "#2A2F2F" }}
                    >
                      <div className="text-2xl font-bold text-white">
                        {assignedPrograms.length}
                      </div>
                      <div className="text-xs text-gray-400">
                        Assigned Programs
                      </div>
                    </div>
                    <div
                      className="text-center p-3 rounded-lg"
                      style={{ backgroundColor: "#2A2F2F" }}
                    >
                      <div className="text-2xl font-bold text-white">
                        {
                          clientWorkouts.filter(
                            (w: { completed: boolean }) => w.completed
                          ).length
                        }
                      </div>
                      <div className="text-xs text-gray-400">Completed</div>
                    </div>
                    <div
                      className="text-center p-3 rounded-lg"
                      style={{ backgroundColor: "#2A2F2F" }}
                    >
                      <div className="text-2xl font-bold text-white">
                        {assignedRoutines.length}
                      </div>
                      <div className="text-xs text-gray-400">
                        Assigned Routines
                      </div>
                    </div>
                    <div
                      className="text-center p-3 rounded-lg"
                      style={{ backgroundColor: "#2A2F2F" }}
                    >
                      <div className="text-2xl font-bold text-white">
                        {client.createdAt
                          ? format(new Date(client.createdAt), "MMM yyyy")
                          : "N/A"}
                      </div>
                      <div className="text-xs text-gray-400">Member Since</div>
                    </div>
                  </div>

                  {/* Client Status */}
                  {!client.userId && (
                    <div
                      className="mt-4 p-3 rounded-lg border border-yellow-500/20"
                      style={{ backgroundColor: "#2A2F2F" }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-sm text-yellow-400 font-medium">
                          Pending Registration
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        This client hasn&apos;t signed up yet. They&apos;ll see
                        their assigned content once they create an account.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes removed - now using NotesDisplay component with pinning functionality */}
            </div>

            {/* Client Information */}
            <div
              className="rounded-2xl shadow-xl border p-6"
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
              }}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Client Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Default Fields */}
                {client?.age && (
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "#2A2F2F" }}
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
                    style={{ backgroundColor: "#2A2F2F" }}
                  >
                    <div className="text-xs text-gray-400 mb-1">Height</div>
                    <div className="text-sm font-medium text-white">
                      {client.height}
                    </div>
                  </div>
                )}

                {/* Custom Fields Display */}
                {client?.customFields &&
                  typeof client.customFields === "object" &&
                  !Array.isArray(client.customFields) &&
                  Object.keys(client.customFields as Record<string, any>)
                    .length > 0 && (
                    <>
                      <div
                        className="mt-6 pt-6 border-t"
                        style={{ borderColor: "#606364" }}
                      >
                        <h4 className="text-md font-semibold mb-4 text-white">
                          Custom Metrics
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {Object.entries(
                            client.customFields as Record<string, any>
                          ).map(([key, value]) => (
                            <div
                              key={key}
                              className="p-3 rounded-lg"
                              style={{ backgroundColor: "#2A2F2F" }}
                            >
                              <div className="text-xs text-gray-400 mb-1">
                                {key}
                              </div>
                              <div className="text-sm font-medium text-white">
                                {typeof value === "boolean"
                                  ? value
                                    ? "Yes"
                                    : "No"
                                  : String(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className="rounded-2xl shadow-xl border p-6"
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  Recent Activity
                </h3>
                {clientWorkouts.length > 0 && (
                  <button
                    className="text-sm text-sky-400 hover:text-sky-300 hover:underline font-medium cursor-pointer transition-all duration-200"
                    onClick={() => {
                      // Navigate to all workouts for this client
                      router.push(`/workouts?clientId=${clientId}`);
                    }}
                  >
                    View All
                  </button>
                )}
              </div>

              {clientWorkouts.length > 0 ? (
                <div className="space-y-3">
                  {clientWorkouts
                    .slice(0, 5)
                    .map(
                      (workout: {
                        id: string;
                        title: string;
                        createdAt: string;
                        completed: boolean;
                      }) => (
                        <div
                          key={workout.id}
                          className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-opacity-80 hover:scale-[1.02] hover:shadow-lg transition-all duration-200 border border-transparent hover:border-sky-500/20"
                          style={{ backgroundColor: "#2A2F2F" }}
                          onClick={() => {
                            // Navigate to workout details page
                            router.push(`/workouts/${workout.id}`);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Dumbbell className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-white">
                                {workout.title}
                              </div>
                              <div className="text-xs text-gray-400">
                                {workout.createdAt
                                  ? format(
                                      new Date(workout.createdAt),
                                      "MMM dd, yyyy"
                                    )
                                  : "N/A"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {workout.completed ? (
                              <span className="text-xs px-2 py-1 rounded-full text-green-400 bg-green-400 bg-opacity-10">
                                Completed
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full text-yellow-400 bg-yellow-400 bg-opacity-10">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                </div>
              )}
            </div>

            {/* Assigned Programs */}
            {assignedPrograms.length > 0 && (
              <div
                className="rounded-2xl shadow-xl border p-6"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                }}
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  Assigned Programs
                </h3>
                <div className="space-y-3">
                  {assignedPrograms.map(
                    (assignment: {
                      id: string;
                      program: {
                        sport: string | null;
                        title: string;
                        level: string;
                      };
                      progress: number;
                      assignedAt: string;
                    }) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ backgroundColor: "#2A2F2F" }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {(assignment.program.sport || "G")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {assignment.program.title}
                            </div>
                            <div className="text-xs text-gray-400">
                              {assignment.program.sport || "General"} •{" "}
                              {assignment.program.level}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-sm text-white">
                              {assignment.progress}% Complete
                            </div>
                            <div className="text-xs text-gray-400">
                              Assigned{" "}
                              {format(
                                new Date(assignment.assignedAt),
                                "MMM dd, yyyy"
                              )}
                            </div>
                          </div>
                          <div className="w-16 bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${assignment.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Assigned Routines */}
            {(assignedRoutines.length > 0 || isLoadingRoutines) && (
              <div
                className="rounded-2xl shadow-xl border p-6"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                }}
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  Assigned Routines
                </h3>
                {isLoadingRoutines ? (
                  <div className="text-center py-4">
                    <div
                      className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2"
                      style={{ borderColor: "#10B981" }}
                    />
                    <p className="text-gray-400">Loading routines...</p>
                  </div>
                ) : assignedRoutines.length === 0 ? (
                  <div className="text-center py-8">
                    <div
                      className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#10B981" }}
                    >
                      <span className="text-white text-xl">📋</span>
                    </div>
                    <p className="text-gray-400 mb-2">
                      No routine assignments yet
                    </p>
                    <p className="text-sm text-gray-500">
                      Assign routines to this client using the "Assign Routine"
                      button above
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignedRoutines.map(
                      (assignment: {
                        id: string;
                        routine: {
                          name: string;
                          description: string | null;
                          exercises: {
                            id: string;
                            title: string;
                            order: number;
                          }[];
                        };
                        progress: number;
                        assignedAt: string;
                        startDate: string | null;
                      }) => (
                        <div
                          key={assignment.id}
                          className="p-4 rounded-lg border"
                          style={{
                            backgroundColor: "#2A2F2F",
                            borderColor: "#10B981",
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-white">
                                  {assignment.routine.name}
                                </h4>
                                <span
                                  className="px-2 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: "#10B981",
                                    color: "#FFFFFF",
                                  }}
                                >
                                  Routine
                                </span>
                              </div>
                              {assignment.routine.description && (
                                <p className="text-sm text-gray-300 mb-2">
                                  {assignment.routine.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span>
                                  {assignment.routine.exercises.length}{" "}
                                  exercises
                                </span>
                                <span>
                                  Assigned{" "}
                                  {format(
                                    new Date(assignment.assignedAt),
                                    "MMM dd, yyyy"
                                  )}
                                </span>
                                {assignment.startDate && (
                                  <span>
                                    Starts{" "}
                                    {format(
                                      new Date(assignment.startDate),
                                      "MMM dd, yyyy"
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-sm font-medium text-white">
                                  {assignment.progress}%
                                </div>
                                <div className="text-xs text-gray-400">
                                  Progress
                                </div>
                              </div>
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: "#10B981" }}
                              >
                                <div className="text-white font-bold text-sm">
                                  {assignment.progress}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div
              className="rounded-2xl shadow-xl border p-6"
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
              }}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  className="flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 hover:bg-opacity-80 hover:scale-105 hover:shadow-lg cursor-pointer border border-transparent hover:border-sky-500/30"
                  style={{ backgroundColor: "#4A5A70" }}
                  onClick={() => setShowAssignProgramModal(true)}
                >
                  <Plus className="h-6 w-6 text-white" />
                  <span className="text-sm font-medium text-white">
                    Assign Program
                  </span>
                </button>
                <button
                  className="flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 hover:bg-opacity-80 hover:scale-105 hover:shadow-lg cursor-pointer border border-transparent hover:border-sky-500/30"
                  style={{ backgroundColor: "#4A5A70" }}
                  onClick={() => {
                    // Navigate to messaging page with this client
                    if (client?.userId) {
                      router.push(`/messages?clientId=${client.userId}`);
                    } else {
                      alert(
                        "This client hasn't signed up yet. They need to create an account before you can message them."
                      );
                    }
                  }}
                >
                  <MessageCircle className="h-6 w-6 text-white" />
                  <span className="text-sm font-medium text-white">
                    Send Message
                  </span>
                </button>
                <button
                  className="flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 hover:bg-opacity-80 hover:scale-105 hover:shadow-lg cursor-pointer border border-transparent hover:border-sky-500/30"
                  style={{ backgroundColor: "#4A5A70" }}
                  onClick={() => setShowScheduleLessonModal(true)}
                >
                  <Calendar className="h-6 w-6 text-white" />
                  <span className="text-sm font-medium text-white">
                    Schedule Lesson
                  </span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Progress Tab Content */}
            <ClientProgressCard
              clientId={clientId}
              clientName={client.name}
              timeRange="4"
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AssignProgramModal
        isOpen={showAssignProgramModal}
        onClose={() => setShowAssignProgramModal(false)}
        clientId={clientId}
        clientName={client.name}
      />

      <AssignRoutineModal
        isOpen={showAssignRoutineModal}
        onClose={() => setShowAssignRoutineModal(false)}
        clientId={clientId}
        clientName={client.name}
      />

      <ScheduleLessonModal
        isOpen={showScheduleLessonModal}
        onClose={() => setShowScheduleLessonModal(false)}
        clientId={clientId}
        clientName={client.name}
        clientEmail={client.email}
      />

      <EditClientModal
        isOpen={showEditClientModal}
        onClose={() => setShowEditClientModal(false)}
        client={
          {
            ...client,
            customFields:
              client.customFields &&
              typeof client.customFields === "object" &&
              !Array.isArray(client.customFields)
                ? (client.customFields as Record<
                    string,
                    string | number | boolean
                  >)
                : null,
          } as any
        }
      />
    </>
  );
}
