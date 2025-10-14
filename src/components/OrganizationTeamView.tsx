"use client";

import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Crown, Shield, Plus, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import OrganizationInviteModal from "./OrganizationInviteModal";

const ROLE_ICONS: Record<string, any> = {
  OWNER: Crown,
  ADMIN: Shield,
  COACH: User,
};

export default function OrganizationTeamView() {
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: currentUser } = trpc.user.getProfile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const { data: organization, refetch } = trpc.organization.get.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000,
    }
  );
  const { data: allInvitations = [] } =
    trpc.organization.getOrganizationInvitations.useQuery(
      { organizationId: organization?.id || "" },
      {
        enabled: !!organization,
        staleTime: 1 * 60 * 1000,
      }
    );

  if (!organization) return null;

  const currentUserMembership = organization.coaches.find(
    c => c.id === currentUser?.id
  );
  const userRole = currentUserMembership?.role || "COACH";
  const canInviteCoaches = userRole === "OWNER" || userRole === "ADMIN";
  const isOwner = userRole === "OWNER";

  // Mutations
  const leaveOrganizationMutation =
    trpc.organization.leaveOrganization.useMutation({
      onSuccess: () => {
        toast.success("You have left the organization");
        router.push("/dashboard");
      },
      onError: error => {
        toast.error(error.message || "Failed to leave organization");
      },
    });

  const deleteOrganizationMutation =
    trpc.organization.deleteOrganization.useMutation({
      onSuccess: () => {
        toast.success("Organization deleted successfully");
        router.push("/dashboard");
      },
      onError: error => {
        toast.error(error.message || "Failed to delete organization");
      },
    });

  const handleLeaveOrganization = () => {
    leaveOrganizationMutation.mutate();
  };

  const handleDeleteOrganization = () => {
    deleteOrganizationMutation.mutate();
  };

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
            Team Management
          </h1>
          <p className="text-xs" style={{ color: "#ABA4AA" }}>
            {organization.coaches.length} coaches • {allInvitations.length}{" "}
            pending invitations
          </p>
        </div>
        {canInviteCoaches && (
          <Button onClick={() => setShowInviteModal(true)} size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            <span className="text-xs">Invite</span>
          </Button>
        )}
      </div>

      {/* Team Members */}
      <div
        className="rounded-2xl shadow-xl border"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div className="p-6">
          <h3 className="text-xl font-bold mb-6" style={{ color: "#C3BCC2" }}>
            Team Members
          </h3>
          <div className="space-y-3">
            {organization.coaches.map((coach: any) => {
              const role = coach.role || "COACH";
              const RoleIcon = ROLE_ICONS[role];

              return (
                <div
                  key={coach.id}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: "#2A3133" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                      }}
                    >
                      <User className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: "#C3BCC2" }}>
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

      {/* Pending Invitations */}
      {allInvitations.some((inv: any) => !inv.isActive) && (
        <div
          className="rounded-2xl shadow-xl border"
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#606364",
          }}
        >
          <div className="p-6">
            <h3 className="text-xl font-bold mb-6" style={{ color: "#C3BCC2" }}>
              Pending Invitations
            </h3>
            <div className="space-y-3">
              {allInvitations
                .filter((inv: any) => !inv.isActive)
                .map((invitation: any) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ backgroundColor: "#2A3133" }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          background:
                            "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                        }}
                      >
                        <User
                          className="h-6 w-6"
                          style={{ color: "#C3BCC2" }}
                        />
                      </div>
                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: "#C3BCC2" }}
                        >
                          {invitation.coach.name || "Unknown"}
                        </p>
                        <p className="text-sm" style={{ color: "#ABA4AA" }}>
                          {invitation.coach.email}
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "#ABA4AA" }}
                        >
                          Invited{" "}
                          {new Date(invitation.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: "#606364",
                        color: "#C3BCC2",
                      }}
                    >
                      Pending
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div
        className="rounded-2xl shadow-xl border"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#DC2626",
        }}
      >
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2" style={{ color: "#DC2626" }}>
            Danger Zone
          </h3>
          <p className="text-sm mb-6" style={{ color: "#ABA4AA" }}>
            {isOwner
              ? "Deleting the organization will remove all coaches and shared resources. All coaches will keep their respective clients."
              : "Leaving the organization will remove your clients from the organization, but you will keep them in your personal roster."}
          </p>
          {isOwner ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Organization
            </Button>
          ) : (
            <Button
              onClick={() => setShowLeaveConfirm(true)}
              variant="destructive"
              className="bg-orange-600 hover:bg-orange-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Leave Organization
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <OrganizationInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        organizationId={organization.id}
        organizationName={organization.name}
        onSuccess={() => refetch()}
      />

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLeaveConfirm(false)}
        >
          <div
            className="rounded-2xl shadow-2xl p-6 max-w-md w-full"
            style={{ backgroundColor: "#353A3A" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: "#C3BCC2" }}>
              Leave Organization?
            </h3>
            <p className="text-sm mb-6" style={{ color: "#ABA4AA" }}>
              Are you sure you want to leave {organization.name}? Your clients
              will be removed from the organization, but you will keep them in
              your personal roster.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowLeaveConfirm(false)}
                variant="outline"
                disabled={leaveOrganizationMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleLeaveOrganization();
                  setShowLeaveConfirm(false);
                }}
                variant="destructive"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={leaveOrganizationMutation.isPending}
              >
                {leaveOrganizationMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Leaving...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Organization
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="rounded-2xl shadow-2xl p-6 max-w-md w-full"
            style={{ backgroundColor: "#353A3A" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: "#DC2626" }}>
              Delete Organization?
            </h3>
            <p className="text-sm mb-4" style={{ color: "#ABA4AA" }}>
              Are you sure you want to delete {organization.name}? This action
              cannot be undone.
            </p>
            <p className="text-sm mb-6" style={{ color: "#ABA4AA" }}>
              All coaches will be removed from the organization and will keep
              their respective clients. All shared resources will be deleted.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                disabled={deleteOrganizationMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleDeleteOrganization();
                  setShowDeleteConfirm(false);
                }}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteOrganizationMutation.isPending}
              >
                {deleteOrganizationMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Organization
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
