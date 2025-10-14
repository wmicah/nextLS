"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Activity,
  Plus,
  Settings,
  Crown,
  Shield,
  User,
  ArrowRight,
  Target,
  FolderOpen,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import OrganizationCreateModal from "./OrganizationCreateModal";
import OrganizationInviteModal from "./OrganizationInviteModal";
import Link from "next/link";

const ROLE_ICONS: Record<string, any> = {
  OWNER: Crown,
  ADMIN: Shield,
  COACH: User,
};

const TIER_COLORS: Record<string, string> = {
  SOLO: "from-blue-500 to-cyan-500",
  TEAM: "from-green-500 to-emerald-500",
  CLUB: "from-purple-500 to-pink-500",
  ACADEMY: "from-yellow-500 to-orange-500",
};

export default function OrganizationOverviewContent() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
  });

  const { data: currentUser } = trpc.user.getProfile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const {
    data: organization,
    isLoading,
    refetch,
  } = trpc.organization.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const { data: sharedResources } =
    trpc.organization.getSharedResources.useQuery(undefined, {
      staleTime: 2 * 60 * 1000,
    });
  const { data: pendingInvitations = [], refetch: refetchInvitations } =
    trpc.organization.getPendingInvitations.useQuery(undefined, {
      staleTime: 1 * 60 * 1000, // Only refetch after 1 minute
      refetchOnMount: false, // Don't refetch on every mount
      refetchOnWindowFocus: false, // Don't refetch on every focus
    });

  const updateOrganizationMutation = trpc.organization.update.useMutation({
    onSuccess: async () => {
      toast.success("Organization updated successfully!");
      setIsEditing(false);
      await refetch();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update organization");
    },
  });

  const acceptInvitationMutation =
    trpc.organization.acceptInvitation.useMutation({
      onSuccess: async () => {
        toast.success("Invitation accepted!");
        await refetch();
        await refetchInvitations();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to accept invitation");
      },
    });

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

  const handleEditClick = () => {
    if (organization) {
      setEditFormData({
        name: organization.name,
        description: organization.description || "",
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    updateOrganizationMutation.mutate({
      organizationId: organization.id,
      name: editFormData.name.trim(),
      description: editFormData.description.trim() || undefined,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({ name: "", description: "" });
  };

  const handleAcceptInvitation = (organizationId: string) => {
    acceptInvitationMutation.mutate({ organizationId });
  };

  const handleDeclineInvitation = (organizationId: string) => {
    declineInvitationMutation.mutate({ organizationId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#4A5A70" }}
          ></div>
          <p style={{ color: "#ABA4AA" }}>Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center p-6">
        {/* Pending Invitations */}
        <div className="max-w-4xl w-full space-y-6">
          {pendingInvitations.length > 0 && (
            <div
              className="rounded-2xl shadow-xl border p-6"
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
              }}
            >
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Pending Invitations
              </h3>
              <p className="text-sm mb-4" style={{ color: "#ABA4AA" }}>
                You have been invited to join these organizations
              </p>
              <div className="space-y-3">
                {pendingInvitations.map(invitation => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 rounded-xl border"
                    style={{
                      backgroundColor: "#2A3133",
                      borderColor: "#606364",
                    }}
                  >
                    <div>
                      <h4 className="font-medium" style={{ color: "#C3BCC2" }}>
                        {invitation.organization.name}
                      </h4>
                      {invitation.organization.description && (
                        <p className="text-sm" style={{ color: "#ABA4AA" }}>
                          {invitation.organization.description}
                        </p>
                      )}
                      <div
                        className={`inline-block mt-2 px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${
                          TIER_COLORS[invitation.organization.tier]
                        } text-white`}
                      >
                        {invitation.organization.tier}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          handleAcceptInvitation(invitation.organization.id)
                        }
                        disabled={
                          acceptInvitationMutation.isPending ||
                          declineInvitationMutation.isPending
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleDeclineInvitation(invitation.organization.id)
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

          {/* Create Organization */}
          <div
            className="rounded-2xl shadow-xl border p-8 text-center"
            style={{
              backgroundColor: "#353A3A",
              borderColor: "#606364",
            }}
          >
            <div className="flex items-center justify-center mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                }}
              >
                <Building2 className="h-8 w-8" style={{ color: "#C3BCC2" }} />
              </div>
            </div>
            <h3
              className="text-2xl font-bold mb-2"
              style={{ color: "#C3BCC2" }}
            >
              Create Your Organization
            </h3>
            <p className="mb-6" style={{ color: "#ABA4AA" }}>
              Set up your coaching organization to collaborate with other
              coaches, share resources, and manage clients together.
            </p>
            <Button onClick={() => setShowCreateModal(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </div>
        </div>

        <OrganizationCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => refetch()}
        />
      </div>
    );
  }

  const currentUserMembership = organization.coaches.find(
    c => c.id === currentUser?.id
  );
  const userRole = currentUserMembership?.role || "COACH";
  const canInviteCoaches = userRole === "OWNER" || userRole === "ADMIN";
  const canManageOrganization = userRole === "OWNER";

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hero Header */}
      <div className="rounded-2xl border relative overflow-hidden group">
        <div
          className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
          }}
        />
        <div
          className="relative p-4 md:p-6"
          style={{ backgroundColor: "#353A3A" }}
        >
          {!isEditing ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-5 w-5" style={{ color: "#C3BCC2" }} />
                  <h1
                    className="text-xl md:text-2xl font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    {organization.name}
                  </h1>
                  <div
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r ${
                      TIER_COLORS[organization.tier]
                    } text-white`}
                  >
                    {organization.tier}
                  </div>
                </div>
                {organization.description && (
                  <p className="mt-1 text-sm" style={{ color: "#ABA4AA" }}>
                    {organization.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: "#ABA4AA" }} />
                    <span className="text-sm" style={{ color: "#ABA4AA" }}>
                      {organization._count.coaches} / {organization.coachLimit}{" "}
                      coaches
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck
                      className="h-4 w-4"
                      style={{ color: "#ABA4AA" }}
                    />
                    <span className="text-sm" style={{ color: "#ABA4AA" }}>
                      {organization._count.clients} / {organization.clientLimit}{" "}
                      clients
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {canManageOrganization && (
                  <Button variant="outline" onClick={handleEditClick}>
                    <Settings className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                {canInviteCoaches && (
                  <Button onClick={() => setShowInviteModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Coach
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#C3BCC2" }}
                >
                  Organization Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={e =>
                    setEditFormData({
                      ...editFormData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                  disabled={updateOrganizationMutation.isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#C3BCC2" }}
                >
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={e =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                  rows={3}
                  disabled={updateOrganizationMutation.isPending}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={updateOrganizationMutation.isPending}
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={updateOrganizationMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Coaches"
          value={organization._count.coaches}
          max={organization.coachLimit}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={UserCheck}
          label="Clients"
          value={organization._count.clients}
          max={organization.clientLimit}
          gradient="from-green-500 to-emerald-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Shared Programs"
          value={sharedResources?.programs?.length || 0}
          gradient="from-purple-500 to-pink-500"
        />
        <StatCard
          icon={Activity}
          label="Shared Routines"
          value={sharedResources?.routines?.length || 0}
          gradient="from-orange-500 to-red-500"
        />
      </div>

      {/* Quick Links - Note: These won't work with Link since we're using client-side routing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <QuickLinkCard
          icon={Calendar}
          title="Organization Calendar"
          description="See all scheduled lessons across your organization with color-coded coaches"
        />
        <QuickLinkCard
          icon={Video}
          title="Organization Library"
          description="Browse and assign videos from all coaches' libraries"
        />
        <QuickLinkCard
          icon={FolderOpen}
          title="Shared Resources"
          description="Browse programs and routines shared by all coaches in your organization"
        />
        <QuickLinkCard
          icon={UserCheck}
          title="All Clients"
          description="View and manage all clients from all coaches in your organization"
        />
        <QuickLinkCard
          icon={Users}
          title="Team Management"
          description="Invite coaches, manage roles, and view team members"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamMembersCard organization={organization} />
        <SharedResourcesCard sharedResources={sharedResources} />
      </div>

      {/* Modals */}
      <OrganizationInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        organizationId={organization.id}
        organizationName={organization.name}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  max,
  gradient,
}: {
  icon: any;
  label: string;
  value: number;
  max?: number;
  gradient: string;
}) {
  return (
    <div
      className="rounded-2xl shadow-xl border relative overflow-hidden group"
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
        <div className="flex items-center justify-between mb-4">
          <Icon className="h-8 w-8" style={{ color: "#ABA4AA" }} />
        </div>
        <div className="text-3xl font-bold mb-2" style={{ color: "#C3BCC2" }}>
          {value}
        </div>
        <div className="text-sm" style={{ color: "#ABA4AA" }}>
          {label}
          {max && ` • Max: ${max}`}
        </div>
      </div>
    </div>
  );
}

// Quick Link Card Component
function QuickLinkCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div
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
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
            }}
          >
            <Icon className="h-6 w-6" style={{ color: "#C3BCC2" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2" style={{ color: "#C3BCC2" }}>
              {title}
            </h3>
            <p className="text-sm" style={{ color: "#ABA4AA" }}>
              {description}
            </p>
          </div>
          <ArrowRight
            className="h-5 w-5 group-hover:translate-x-1 transition-transform"
            style={{ color: "#ABA4AA" }}
          />
        </div>
      </div>
    </div>
  );
}

// Team Members Card Component
function TeamMembersCard({ organization }: { organization: any }) {
  const ROLE_ICONS: Record<string, any> = {
    OWNER: Crown,
    ADMIN: Shield,
    COACH: User,
  };

  return (
    <div
      className="rounded-2xl shadow-xl border relative overflow-hidden"
      style={{
        backgroundColor: "#353A3A",
        borderColor: "#606364",
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ color: "#C3BCC2" }}>
            Team Members
          </h3>
        </div>
        <div className="space-y-3">
          {organization.coaches.slice(0, 5).map((coach: any) => {
            const role = coach.role || "COACH";
            const RoleIcon = ROLE_ICONS[role];

            return (
              <div
                key={coach.id}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: "#2A3133" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                    }}
                  >
                    <User className="h-5 w-5" style={{ color: "#C3BCC2" }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: "#C3BCC2" }}>
                      {coach.name || "Unknown"}
                    </p>
                    <p className="text-sm" style={{ color: "#ABA4AA" }}>
                      {coach.email}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold"
                  style={{
                    backgroundColor: "#606364",
                    color: "#C3BCC2",
                  }}
                >
                  <RoleIcon className="h-3 w-3" />
                  {role}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Shared Resources Card Component
function SharedResourcesCard({ sharedResources }: { sharedResources: any }) {
  return (
    <div
      className="rounded-2xl shadow-xl border relative overflow-hidden"
      style={{
        backgroundColor: "#353A3A",
        borderColor: "#606364",
      }}
    >
      <div className="p-6">
        <h3 className="text-xl font-bold mb-6" style={{ color: "#C3BCC2" }}>
          Shared Resources
        </h3>
        <div className="space-y-4">
          {sharedResources?.programs && sharedResources.programs.length > 0 ? (
            <div>
              <h4
                className="font-medium mb-2 text-sm"
                style={{ color: "#ABA4AA" }}
              >
                Programs ({sharedResources.programs.length})
              </h4>
              <div className="space-y-2">
                {sharedResources.programs.slice(0, 3).map((program: any) => (
                  <div
                    key={program.id}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "#2A3133" }}
                  >
                    <p className="font-medium" style={{ color: "#C3BCC2" }}>
                      {program.title}
                    </p>
                    <p className="text-sm" style={{ color: "#ABA4AA" }}>
                      Created by {program.createdByCoach?.name || "Unknown"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center py-8" style={{ color: "#ABA4AA" }}>
              No shared programs yet
            </p>
          )}

          {sharedResources?.routines && sharedResources.routines.length > 0 && (
            <div>
              <h4
                className="font-medium mb-2 text-sm"
                style={{ color: "#ABA4AA" }}
              >
                Routines ({sharedResources.routines.length})
              </h4>
              <div className="space-y-2">
                {sharedResources.routines.slice(0, 3).map((routine: any) => (
                  <div
                    key={routine.id}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "#2A3133" }}
                  >
                    <p className="font-medium" style={{ color: "#C3BCC2" }}>
                      {routine.name}
                    </p>
                    <p className="text-sm" style={{ color: "#ABA4AA" }}>
                      Created by {routine.createdByCoach?.name || "Unknown"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
