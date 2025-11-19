"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  FileText,
  Dumbbell,
  User,
  Share2,
  TrendingUp,
  Activity,
  Clock,
  Target,
  Plus,
} from "lucide-react";
import Link from "next/link";
import ShareResourcesModal from "./ShareResourcesModal";

export default function OrganizationResourcesView() {
  const [activeTab, setActiveTab] = useState<"programs" | "routines">(
    "programs"
  );
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: currentUser } = trpc.user.getProfile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const { data: organization } = trpc.organization.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const {
    data: sharedResources,
    isLoading,
    refetch,
  } = trpc.organization.getSharedResources.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
  });

  if (!organization) return null;

  const currentUserMembership = organization.coaches.find(
    c => c.id === currentUser?.id
  );
  const userRole = currentUserMembership?.role || "COACH";

  const programs = sharedResources?.programs || [];
  const routines = sharedResources?.routines || [];

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl border"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div>
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: "#C3BCC2" }}
          >
            Organization Resources
          </h1>
          <p className="text-xs" style={{ color: "#ABA4AA" }}>
            {programs.length} programs • {routines.length} routines shared
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "programs" ? "default" : "outline"}
            onClick={() => setActiveTab("programs")}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Programs ({programs.length})
          </Button>
          <Button
            variant={activeTab === "routines" ? "default" : "outline"}
            onClick={() => setActiveTab("routines")}
            className="flex items-center gap-2"
          >
            <Dumbbell className="h-4 w-4" />
            Routines ({routines.length})
          </Button>
        </div>
        <Button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Share {activeTab === "programs" ? "Programs" : "Routines"}
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div
          className="rounded-2xl shadow-xl border p-12 text-center"
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#606364",
          }}
        >
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#4A5A70" }}
          ></div>
          <p style={{ color: "#ABA4AA" }}>Loading resources...</p>
        </div>
      ) : activeTab === "programs" ? (
        <ProgramsTab programs={programs} />
      ) : (
        <RoutinesTab routines={routines} />
      )}

      {/* Share Resources Modal */}
      <ShareResourcesModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        organizationId={organization.id}
        resourceType={activeTab === "programs" ? "PROGRAM" : "ROUTINE"}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

// Programs Tab Component
function ProgramsTab({ programs }: { programs: any[] }) {
  if (programs.length === 0) {
    return (
      <div
        className="rounded-2xl shadow-xl border p-12 text-center"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div className="flex items-center justify-center mb-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
            }}
          >
            <FileText className="h-10 w-10" style={{ color: "#C3BCC2" }} />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: "#C3BCC2" }}>
          No Shared Programs Yet
        </h3>
        <p className="mb-6 max-w-2xl mx-auto" style={{ color: "#ABA4AA" }}>
          When coaches share their programs with the organization, they'll
          appear here. All coaches in your organization can view and use shared
          programs.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programs.map((program: any) => (
        <Link key={program.id} href={`/programs/${program.id}`}>
          <div
            className="rounded-2xl shadow-xl border relative overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-2xl h-full"
            style={{
              backgroundColor: "#353A3A",
              borderColor: "#606364",
            }}
          >
            <div
              className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
              style={{
                background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
              }}
            />
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                  }}
                >
                  <FileText className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                </div>
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                  style={{
                    backgroundColor: "#606364",
                    color: "#C3BCC2",
                  }}
                >
                  <Share2 className="h-3 w-3" />
                  Shared
                </div>
              </div>

              <h3
                className="text-lg font-bold mb-2 line-clamp-2"
                style={{ color: "#C3BCC2" }}
              >
                {program.title}
              </h3>

              {program.description && (
                <p
                  className="text-sm mb-4 line-clamp-2"
                  style={{ color: "#ABA4AA" }}
                >
                  {program.description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                  }}
                >
                  <User className="h-4 w-4" style={{ color: "#C3BCC2" }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#ABA4AA" }}>
                    Created by
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#C3BCC2" }}
                  >
                    {program.createdByCoach?.name || "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Routines Tab Component
function RoutinesTab({ routines }: { routines: any[] }) {
  if (routines.length === 0) {
    return (
      <div
        className="rounded-2xl shadow-xl border p-12 text-center"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div className="flex items-center justify-center mb-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
            }}
          >
            <Dumbbell className="h-10 w-10" style={{ color: "#C3BCC2" }} />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: "#C3BCC2" }}>
          No Shared Routines Yet
        </h3>
        <p className="mb-6 max-w-2xl mx-auto" style={{ color: "#ABA4AA" }}>
          When coaches share their routines with the organization, they'll
          appear here. All coaches in your organization can view and use shared
          routines.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {routines.map((routine: any) => (
        <div
          key={routine.id}
          className="rounded-2xl shadow-xl border relative overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-2xl"
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#606364",
          }}
        >
          <div
            className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
            }}
          />
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                }}
              >
                <Dumbbell className="h-6 w-6" style={{ color: "#C3BCC2" }} />
              </div>
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                style={{
                  backgroundColor: "#606364",
                  color: "#C3BCC2",
                }}
              >
                <Share2 className="h-3 w-3" />
                Shared
              </div>
            </div>

            <h3
              className="text-lg font-bold mb-2 line-clamp-2"
              style={{ color: "#C3BCC2" }}
            >
              {routine.name}
            </h3>

            {routine.description && (
              <p
                className="text-sm mb-4 line-clamp-2"
                style={{ color: "#ABA4AA" }}
              >
                {routine.description}
              </p>
            )}

            <div className="space-y-2 mb-4">
              {routine.exercises && routine.exercises.length > 0 && (
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "#ABA4AA" }}
                >
                  <Activity className="h-4 w-4" />
                  {routine.exercises.length} exercises
                </div>
              )}
            </div>

            <div
              className="flex items-center gap-2 mt-4 pt-4 border-t"
              style={{ borderColor: "#606364" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                }}
              >
                <User className="h-4 w-4" style={{ color: "#C3BCC2" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "#ABA4AA" }}>
                  Created by
                </p>
                <p className="text-sm font-medium" style={{ color: "#C3BCC2" }}>
                  {routine.createdByCoach?.name || "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
