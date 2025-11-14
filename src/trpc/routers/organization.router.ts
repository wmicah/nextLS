import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { publicProcedure, router } from "../trpc";
import { format, addWeeks, addMonths } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { ensureUserId } from "./_helpers";

// Organization creation schema
const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
  tier: z.enum(["SOLO", "TEAM", "CLUB", "ACADEMY"]).default("SOLO"),
});

// Update organization schema
const updateOrganizationSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
});

// Invite coach schema
const inviteCoachSchema = z.object({
  organizationId: z.string(),
  coachEmail: z.string().email("Invalid email address"),
});

// Accept invitation schema
const acceptInvitationSchema = z.object({
  organizationId: z.string(),
});

// Decline invitation schema
const declineInvitationSchema = z.object({
  organizationId: z.string(),
});

// Share resource schema
const shareResourceSchema = z.object({
  resourceType: z.enum(["PROGRAM", "ROUTINE"]),
  resourceId: z.string(),
  organizationId: z.string(),
});

// Share multiple resources schema
const shareMultipleResourcesSchema = z.object({
  resourceType: z.enum(["PROGRAM", "ROUTINE"]),
  resourceIds: z.array(z.string()),
  organizationId: z.string(),
});

export const organizationRouter = router({
  // Create a new organization
  create: publicProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ input, ctx }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create an organization",
        });
      }

      // Check if user already has an organization
      const existingOrg = await db.organization.findUnique({
        where: { ownerId: user.id },
      });

      if (existingOrg) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already own an organization",
        });
      }

      // Create the organization
      const organization = await db.organization.create({
        data: {
          name: input.name,
          description: input.description,
          tier: input.tier,
          coachLimit:
            input.tier === "SOLO"
              ? 1
              : input.tier === "TEAM"
              ? 5
              : input.tier === "CLUB"
              ? 10
              : 20,
          clientLimit:
            input.tier === "SOLO"
              ? 50
              : input.tier === "TEAM"
              ? 250
              : input.tier === "CLUB"
              ? 500
              : 1000,
          ownerId: user.id,
        },
      });

      // Add the owner as a coach with OWNER role
      await db.coachOrganization.create({
        data: {
          coachId: user.id,
          organizationId: organization.id,
          role: "OWNER",
        },
      });

      // Update user's organizationId
      await db.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id },
      });

      return organization;
    }),

  // Update organization
  update: publicProcedure
    .input(updateOrganizationSchema)
    .mutation(async ({ input, ctx }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Check if user is the owner
      const organization = await db.organization.findUnique({
        where: { id: input.organizationId },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      if (organization.ownerId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can update the organization",
        });
      }

      // Update the organization
      const updatedOrganization = await db.organization.update({
        where: { id: input.organizationId },
        data: {
          name: input.name,
          description: input.description,
        },
      });

      return updatedOrganization;
    }),

  // Get organization details
  get: publicProcedure
    .input(z.object({ organizationId: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Fetch user from database to get updated organizationId
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { organizationId: true },
      });

      const organizationId = input?.organizationId || dbUser?.organizationId;

      if (!organizationId) {
        return null;
      }

      // Get organization with proper coach relationships
      const organization = await db.organization.findUnique({
        where: { id: organizationId },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          coachOrganizations: {
            where: { isActive: true },
            include: {
              coach: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Transform the data to match expected structure
      const coaches = organization.coachOrganizations.map(co => ({
        ...co.coach,
        role: co.role,
        joinedAt: co.joinedAt,
      }));

      // Count total active clients from all coaches in the organization
      const coachIds = coaches.map(c => c.id);
      const totalClients = await db.client.count({
        where: {
          coachId: { in: coachIds },
          archived: false, // Only count active clients
        },
      });

      // Check if user has access to this organization
      const userAccess = await db.coachOrganization.findFirst({
        where: {
          coachId: user.id,
          organizationId: organization.id,
          isActive: true,
        },
      });

      if (!userAccess && user.id !== organization.ownerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this organization",
        });
      }

      // Return organization with transformed coaches and counts
      return {
        ...organization,
        coaches,
        _count: {
          coaches: coaches.length,
          clients: totalClients,
        },
      };
    }),

  // Invite a coach to the organization
  inviteCoach: publicProcedure
    .input(inviteCoachSchema)
    .mutation(async ({ input, ctx }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Get the current user's details from database
      const currentUser = await db.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true },
      });

      if (!currentUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if user has permission to invite coaches
      const organization = await db.organization.findUnique({
        where: { id: input.organizationId },
        include: {
          _count: { select: { coaches: true } },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Check if user is owner or admin
      const userRole = await db.coachOrganization.findFirst({
        where: {
          coachId: user.id,
          organizationId: input.organizationId,
          role: { in: ["OWNER", "ADMIN"] },
          isActive: true,
        },
      });

      if (!userRole && user.id !== organization.ownerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to invite coaches",
        });
      }

      // Check coach limit
      if (organization._count.coaches >= organization.coachLimit) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organization has reached its coach limit",
        });
      }

      // Find the coach by email
      const coach = await db.user.findUnique({
        where: { email: input.coachEmail },
        select: { id: true, name: true, email: true, organizationId: true },
      });

      if (!coach) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach not found with this email",
        });
      }

      // Check if already in this organization (active or pending)
      const existingInvite = await db.coachOrganization.findFirst({
        where: {
          coachId: coach.id,
          organizationId: input.organizationId,
        },
      });

      if (existingInvite) {
        if (existingInvite.isActive) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This coach is already a member of this organization",
          });
        } else {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This coach has already been invited",
          });
        }
      }

      // Create invitation
      const invitation = await db.coachOrganization.create({
        data: {
          coachId: coach.id,
          organizationId: input.organizationId,
          role: "COACH",
          isActive: false, // Will be true when they accept
        },
      });

      // Create notification for the invited coach
      await db.notification.create({
        data: {
          userId: coach.id,
          type: "ORGANIZATION_INVITATION",
          title: "Organization Invitation",
          message: `You've been invited to join ${organization.name}`,
          data: {
            organizationId: input.organizationId,
            organizationName: organization.name,
            invitedBy: currentUser.name || currentUser.email,
          },
        },
      });

      return { success: true, invitation };
    }),

  // Accept organization invitation
  acceptInvitation: publicProcedure
    .input(acceptInvitationSchema)
    .mutation(async ({ input, ctx }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Find the invitation
      const invitation = await db.coachOrganization.findFirst({
        where: {
          coachId: user.id,
          organizationId: input.organizationId,
          isActive: false,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No pending invitation found",
        });
      }

      // Activate the invitation
      await db.coachOrganization.update({
        where: { id: invitation.id },
        data: { isActive: true },
      });

      // Update user's organizationId
      await db.user.update({
        where: { id: user.id },
        data: { organizationId: input.organizationId },
      });

      // Mark notification as read
      await db.notification.updateMany({
        where: {
          userId: user.id,
          type: "ORGANIZATION_INVITATION",
          data: {
            path: ["organizationId"],
            equals: input.organizationId,
          },
        },
        data: { isRead: true },
      });

      return { success: true };
    }),

  // Decline organization invitation
  declineInvitation: publicProcedure
    .input(declineInvitationSchema)
    .mutation(async ({ input, ctx }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Find and delete the invitation
      const invitation = await db.coachOrganization.findFirst({
        where: {
          coachId: user.id,
          organizationId: input.organizationId,
          isActive: false,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No pending invitation found",
        });
      }

      // Delete the invitation
      await db.coachOrganization.delete({
        where: { id: invitation.id },
      });

      // Mark notification as read
      await db.notification.updateMany({
        where: {
          userId: user.id,
          type: "ORGANIZATION_INVITATION",
          data: {
            path: ["organizationId"],
            equals: input.organizationId,
          },
        },
        data: { isRead: true },
      });

      return { success: true };
    }),

  // Leave organization
  leaveOrganization: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Get the current user's details from database
      const currentUser = await db.user.findUnique({
        where: { id: user.id },
        select: { organizationId: true },
      });

      if (!currentUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Find the organization membership
      const membership = await db.coachOrganization.findFirst({
        where: {
          coachId: user.id,
          organizationId: input.organizationId,
          isActive: true,
        },
        include: {
          organization: true,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not a member of this organization",
        });
      }

      // Prevent owner from leaving their own organization
      if (membership.organization.ownerId === user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Organization owners cannot leave their organization. Delete the organization instead.",
        });
      }

      // Remove the membership
      await db.coachOrganization.delete({
        where: { id: membership.id },
      });

      // Clear user's organizationId if it matches
      if (currentUser.organizationId === input.organizationId) {
        await db.user.update({
          where: { id: user.id },
          data: { organizationId: null },
        });
      }

      return { success: true };
    }),

  // Get pending invitations for the current user
  getPendingInvitations: publicProcedure.query(async ({ ctx }) => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      });
    }

    // Get all pending invitations for this user
    const invitations = await db.coachOrganization.findMany({
      where: {
        coachId: user.id,
        isActive: false,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            description: true,
            tier: true,
          },
        },
      },
    });

    return invitations;
  }),

  // Share a program or routine with the organization
  shareResource: publicProcedure
    .input(shareResourceSchema)
    .mutation(async ({ input, ctx }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Check if user has access to the organization
      const userAccess = await db.coachOrganization.findFirst({
        where: {
          coachId: user.id,
          organizationId: input.organizationId,
          isActive: true,
        },
      });

      if (!userAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this organization",
        });
      }

      if (input.resourceType === "PROGRAM") {
        // Update program to be shared
        const program = await db.program.update({
          where: {
            id: input.resourceId,
            coachId: user.id, // Only the creator can share
          },
          data: {
            sharedWithOrg: true,
            organizationId: input.organizationId,
            createdByCoachId: user.id,
          },
        });

        return { success: true, resource: program };
      } else if (input.resourceType === "ROUTINE") {
        // Update routine to be shared
        const routine = await db.routine.update({
          where: {
            id: input.resourceId,
            coachId: user.id, // Only the creator can share
          },
          data: {
            sharedWithOrg: true,
            organizationId: input.organizationId,
            createdByCoachId: user.id,
          },
        });

        return { success: true, resource: routine };
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid resource type",
      });
    }),

  // Get all invitations for an organization (for owners/admins to manage)
  getOrganizationInvitations: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Check if user has permission to view invitations
      const userAccess = await db.coachOrganization.findFirst({
        where: {
          coachId: user.id,
          organizationId: input.organizationId,
          role: { in: ["OWNER", "ADMIN"] },
          isActive: true,
        },
      });

      if (!userAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view invitations",
        });
      }

      // Get all invitations for this organization
      const invitations = await db.coachOrganization.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          joinedAt: "desc",
        },
      });

      return invitations;
    }),

  // Resend invitation
  resendInvitation: publicProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Get the current user's details from database
      const currentUser = await db.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true },
      });

      if (!currentUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Get the invitation
      const invitation = await db.coachOrganization.findUnique({
        where: { id: input.invitationId },
        include: {
          organization: true,
          coach: true,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Check if user has permission
      const userAccess = await db.coachOrganization.findFirst({
        where: {
          coachId: user.id,
          organizationId: invitation.organizationId,
          role: { in: ["OWNER", "ADMIN"] },
          isActive: true,
        },
      });

      if (!userAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to resend invitations",
        });
      }

      // Create a new notification
      await db.notification.create({
        data: {
          userId: invitation.coachId,
          type: "ORGANIZATION_INVITATION",
          title: "Organization Invitation",
          message: `You've been invited to join ${invitation.organization.name}`,
          data: {
            organizationId: invitation.organizationId,
            organizationName: invitation.organization.name,
            invitedBy: currentUser.name || currentUser.email,
          },
        },
      });

      return { success: true };
    }),

  // Cancel invitation
  cancelInvitation: publicProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Get the invitation
      const invitation = await db.coachOrganization.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Check if user has permission
      const userAccess = await db.coachOrganization.findFirst({
        where: {
          coachId: user.id,
          organizationId: invitation.organizationId,
          role: { in: ["OWNER", "ADMIN"] },
          isActive: true,
        },
      });

      if (!userAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to cancel invitations",
        });
      }

      // Delete the invitation if it's not active
      if (!invitation.isActive) {
        await db.coachOrganization.delete({
          where: { id: input.invitationId },
        });
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel an active membership",
        });
      }

      return { success: true };
    }),

  // Get shared resources for the organization
  getSharedResources: publicProcedure
    .input(z.object({ organizationId: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Fetch user from database to get updated organizationId
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { organizationId: true },
      });

      const organizationId = input?.organizationId || dbUser?.organizationId;

      if (!organizationId) {
        return { programs: [], routines: [] };
      }

      // Check if user has access to the organization
      const userAccess = await db.coachOrganization.findFirst({
        where: {
          coachId: user.id,
          organizationId,
          isActive: true,
        },
      });

      if (!userAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this organization",
        });
      }

      // Get shared programs and routines
      const [programs, routines] = await Promise.all([
        db.program.findMany({
          where: {
            organizationId,
            sharedWithOrg: true,
          },
          include: {
            createdByCoach: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        db.routine.findMany({
          where: {
            organizationId,
            sharedWithOrg: true,
          },
          include: {
            createdByCoach: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
      ]);

      return { programs, routines };
    }),

  // Get all lessons from all coaches in the organization
  getOrganizationLessons: publicProcedure
    .input(
      z.object({
        month: z.number(),
        year: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Fetch user from database to get updated organizationId
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { organizationId: true },
      });

      if (!dbUser?.organizationId) {
        return [];
      }

      // Check if user has access to the organization
      const userAccess = await db.coachOrganization.findFirst({
        where: {
          coachId: user.id,
          organizationId: dbUser.organizationId,
          isActive: true,
        },
      });

      if (!userAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this organization",
        });
      }

      // Get all coaches in the organization
      const organization = await db.organization.findUnique({
        where: { id: dbUser.organizationId },
        select: {
          coaches: {
            select: { id: true },
          },
        },
      });

      if (!organization) {
        return [];
      }

      const coachIds = organization.coaches.map((c: any) => c.id);

      // Calculate month start and end dates
      const monthStart = new Date(input.year, input.month, 1);
      const monthEnd = new Date(input.year, input.month + 1, 0, 23, 59, 59);

      // Get all CONFIRMED lessons from all coaches in the organization
      const lessons = await db.event.findMany({
        where: {
          coachId: { in: coachIds },
          status: "CONFIRMED",
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
          client: {
            archived: false, // Only include lessons for active clients
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          coach: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      return lessons;
    }),

  // Get all clients from all coaches in the organization
  getOrganizationClients: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      });
    }

    // Fetch user from database to get updated organizationId
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return [];
    }

    // Check if user has access to the organization
    const userAccess = await db.coachOrganization.findFirst({
      where: {
        coachId: user.id,
        organizationId: dbUser.organizationId,
        isActive: true,
      },
    });

    if (!userAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have access to this organization",
      });
    }

    // Get all coaches in the organization
    const organization = await db.organization.findUnique({
      where: { id: dbUser.organizationId },
      select: {
        coaches: {
          select: { id: true },
        },
      },
    });

    if (!organization) {
      return [];
    }

    const coachIds = organization.coaches.map((c: any) => c.id);

    // Get all clients from all coaches in the organization
    const clients = await db.client.findMany({
      where: {
        coachId: { in: coachIds },
        archived: false, // Only include active clients
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return clients;
  }),

  // Share multiple resources at once
  shareMultipleResources: publicProcedure
    .input(shareMultipleResourcesSchema)
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Check if user has access to the organization
      const userAccess = await db.coachOrganization.findFirst({
        where: {
          coachId: user.id,
          organizationId: input.organizationId,
          isActive: true,
        },
      });

      if (!userAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this organization",
        });
      }

      if (input.resourceType === "PROGRAM") {
        // Update programs to be shared
        await db.program.updateMany({
          where: {
            id: { in: input.resourceIds },
            coachId: user.id, // Only the creator can share
          },
          data: {
            sharedWithOrg: true,
            organizationId: input.organizationId,
            createdByCoachId: user.id,
          },
        });
      } else {
        // Update routines to be shared
        await db.routine.updateMany({
          where: {
            id: { in: input.resourceIds },
            coachId: user.id, // Only the creator can share
          },
          data: {
            sharedWithOrg: true,
            organizationId: input.organizationId,
            createdByCoachId: user.id,
          },
        });
      }

      return { success: true, count: input.resourceIds.length };
    }),

  // Get user's unshared programs
  getUnsharablePrograms: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      });
    }

    // Fetch user from database to get updated organizationId
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return [];
    }

    // Get programs created by this user that are NOT shared
    const programs = await db.program.findMany({
      where: {
        coachId: user.id,
        NOT: {
          sharedWithOrg: true,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return programs;
  }),

  // Get user's unshared routines
  getUnsharableRoutines: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      });
    }

    // Fetch user from database to get updated organizationId
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return [];
    }

    // Get routines created by this user that are NOT shared
    const routines = await db.routine.findMany({
      where: {
        coachId: user.id,
        NOT: {
          sharedWithOrg: true,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        exercises: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return routines;
  }),

  // Get all videos from all coaches in the organization
  getOrganizationLibrary: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      });
    }

    // Fetch user from database to get updated organizationId
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return [];
    }

    // Check if user has access to the organization
    const userAccess = await db.coachOrganization.findFirst({
      where: {
        coachId: user.id,
        organizationId: dbUser.organizationId,
        isActive: true,
      },
    });

    if (!userAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have access to this organization",
      });
    }

    // Get all coaches in the organization through CoachOrganization
    const coachOrganizations = await db.coachOrganization.findMany({
      where: {
        organizationId: dbUser.organizationId,
        isActive: true,
      },
      select: {
        coachId: true,
      },
    });

    if (coachOrganizations.length === 0) {
      return [];
    }

    const coachIds = coachOrganizations.map(co => co.coachId);

    // Get all videos from all coaches in the organization
    const videos = await db.libraryResource.findMany({
      where: {
        coachId: { in: coachIds },
        isActive: true,
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return videos;
  }),

  // Schedule a lesson for any client in the organization
  scheduleOrganizationLesson: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
        lessonDate: z.string(),
        sendEmail: z.boolean().optional(),
        timeZone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can schedule lessons",
        });
      }

      // Check if coach is in an organization
      const coachOrganization = await db.coachOrganization.findFirst({
        where: {
          coachId: ensureUserId(user.id),
          isActive: true,
        },
      });

      if (!coachOrganization) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You must be part of an organization to schedule organization lessons",
        });
      }

      // Verify the client belongs to the same organization
      const client = await db.client.findFirst({
        where: {
          id: input.clientId,
        },
        include: {
          coach: {
            include: {
              coachOrganizations: {
                where: {
                  organizationId: coachOrganization.organizationId,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Check if client's coach is in the same organization
      if (
        !client.coach?.coachOrganizations ||
        client.coach.coachOrganizations.length === 0
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Client's coach is not in your organization",
        });
      }

      // Convert string to Date object (this is local time from client)
      const localLessonDate = new Date(input.lessonDate);

      // Convert local time to UTC using the user's timezone
      const timeZone = input.timeZone || "America/New_York";
      const utcLessonDate = fromZonedTime(localLessonDate, timeZone);

      // Validate the date
      if (isNaN(utcLessonDate.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid date format",
        });
      }

      // Check if the lesson is in the past
      const now = new Date();
      if (utcLessonDate <= now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot schedule lessons in the past",
        });
      }

      // Note: Working days validation is skipped for organization lessons
      // to allow coaches to schedule lessons on any day

      // Create the lesson (using Event model) - automatically CONFIRMED when coach schedules
      const lesson = await db.event.create({
        data: {
          title: `Lesson - ${coach.name || "Coach"}`,
          description: "Organization lesson",
          date: utcLessonDate,
          startTime: utcLessonDate,
          endTime: new Date(utcLessonDate.getTime() + 60 * 60 * 1000), // Default 1 hour
          status: "CONFIRMED",
          type: "LESSON",
          clientId: input.clientId,
          coachId: ensureUserId(user.id),
          organizationId: coachOrganization.organizationId,
        },
      });

      // Send email notification if requested
      if (input.sendEmail && client.email) {
        // TODO: Implement email notification

      }

      return lesson;
    }),

  // Schedule recurring lessons for organization
  scheduleRecurringOrganizationLessons: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        recurrencePattern: z.enum([
          "weekly",
          "biweekly",
          "triweekly",
          "monthly",
        ]),
        recurrenceInterval: z.number().min(1),
        sendEmail: z.boolean().optional(),
        timeZone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can schedule lessons",
        });
      }

      // Check if coach is in an organization
      const coachOrganization = await db.coachOrganization.findFirst({
        where: {
          coachId: ensureUserId(user.id),
          isActive: true,
        },
      });

      if (!coachOrganization) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You must be part of an organization to schedule organization lessons",
        });
      }

      // Verify the client belongs to the same organization
      const client = await db.client.findFirst({
        where: {
          id: input.clientId,
        },
        include: {
          coach: {
            include: {
              coachOrganizations: {
                where: {
                  organizationId: coachOrganization.organizationId,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Check if client's coach is in the same organization
      if (
        !client.coach?.coachOrganizations ||
        client.coach.coachOrganizations.length === 0
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Client's coach is not in your organization",
        });
      }

      // Parse start and end dates
      const localStartDate = new Date(input.startDate);
      const localEndDate = new Date(input.endDate);
      const timeZone = input.timeZone || "America/New_York";

      // Generate all lesson dates
      const lessonDates: Date[] = [];
      let currentDate = new Date(localStartDate);

      while (currentDate <= localEndDate) {
        // Note: Working days validation is skipped for organization lessons
        // to allow coaches to schedule lessons on any day
        lessonDates.push(new Date(currentDate));

        // Calculate next lesson date based on recurrence pattern
        switch (input.recurrencePattern) {
          case "weekly":
            currentDate = addWeeks(currentDate, input.recurrenceInterval);
            break;
          case "biweekly":
            currentDate = addWeeks(currentDate, 2 * input.recurrenceInterval);
            break;
          case "triweekly":
            currentDate = addWeeks(currentDate, 3 * input.recurrenceInterval);
            break;
          case "monthly":
            currentDate = addMonths(currentDate, input.recurrenceInterval);
            break;
        }
      }

      // Create all lessons
      const lessons = await Promise.all(
        lessonDates.map(async localDate => {
          const utcDate = fromZonedTime(localDate, timeZone);

          return await db.event.create({
            data: {
              title: `Lesson - ${coach.name || "Coach"}`,
              description: "Organization lesson",
              date: utcDate,
              startTime: utcDate,
              endTime: new Date(utcDate.getTime() + 60 * 60 * 1000), // Default 1 hour
              status: "CONFIRMED",
              type: "LESSON",
              clientId: input.clientId,
              coachId: ensureUserId(user.id),
              organizationId: coachOrganization.organizationId,
            },
          });
        })
      );

      // Send email notification if requested
      if (input.sendEmail && client.email) {
        // TODO: Implement email notification

      }

      return {
        totalLessons: lessons.length,
        lessons,
      };
    }),

  // Get organization schedule
  getOrganizationSchedule: publicProcedure
    .input(
      z.object({
        month: z.number().min(0).max(11),
        year: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Check if user is in an organization
      const coachOrganization = await db.coachOrganization.findFirst({
        where: {
          coachId: ensureUserId(user.id),
          isActive: true,
        },
      });

      if (!coachOrganization) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be part of an organization",
        });
      }

      // Get all lessons for the organization in the specified month
      const startDate = new Date(input.year, input.month, 1);
      const endDate = new Date(input.year, input.month + 1, 0, 23, 59, 59);

      // Get all coaches in the organization
      const organization = await db.organization.findUnique({
        where: { id: coachOrganization.organizationId },
        select: {
          coaches: {
            select: { id: true },
          },
        },
      });

      if (!organization) {
        return [];
      }

      const coachIds = organization.coaches.map((c: any) => c.id);

      // Get ALL lessons from all coaches in the organization (not just org-scheduled ones)
      const lessons = await db.event.findMany({
        where: {
          coachId: { in: coachIds },
          date: {
            gte: startDate,
            lte: endDate,
          },
          client: {
            archived: false, // Only include lessons for active clients
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          coach: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      return lessons;
    }),

  // Delete organization (owner only, all coaches keep their clients)
  deleteOrganization: publicProcedure.mutation(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      });
    }

    // Get the organization where user is owner
    const organization = await db.organization.findFirst({
      where: {
        ownerId: user.id,
      },
    });

    if (!organization) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "You do not own an organization",
      });
    }

    // Get all active coaches in the organization
    const activeCoaches = await db.coachOrganization.findMany({
      where: {
        organizationId: organization.id,
        isActive: true,
      },
      select: {
        coachId: true,
      },
    });

    // Remove organizationId from all clients in the organization
    await db.client.updateMany({
      where: {
        organizationId: organization.id,
      },
      data: {
        organizationId: null,
      },
    });

    // Clear organizationId from all coaches
    const coachIds = activeCoaches.map(c => c.coachId);
    await db.user.updateMany({
      where: {
        id: { in: coachIds },
      },
      data: {
        organizationId: null,
      },
    });

    // Delete all coach organization relationships
    await db.coachOrganization.deleteMany({
      where: {
        organizationId: organization.id,
      },
    });

    // Delete the organization
    await db.organization.delete({
      where: { id: organization.id },
    });

    return { success: true };
  }),
});
