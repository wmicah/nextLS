import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import { format, addDays, addMonths } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import {
  extractYouTubeVideoId,
  extractPlaylistId,
  getYouTubeThumbnail,
  fetchYouTubeVideoInfo,
  fetchPlaylistVideos,
} from "@/lib/youtube";
import { deleteFileFromUploadThing } from "@/lib/uploadthing-utils";
import { ensureUserId, sendWelcomeMessage } from "./_helpers";

/**
 * Clients Router
 */
export const clientsRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          archived: z.boolean().optional(),
          scope: z.enum(["coach", "organization"]).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const scope = input?.scope ?? "coach";
      const ensuredUserId = ensureUserId(user.id);

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can view clients",
        });
      }

      // Get coach settings for auto-archive
      const coachSettings = await db.userSettings.findUnique({
        where: { userId: user.id },
        select: { autoArchiveDays: true },
      });

      // Auto-archive inactive clients based on coach settings
      if (coachSettings?.autoArchiveDays) {
        const inactivityThreshold = new Date();
        inactivityThreshold.setDate(
          inactivityThreshold.getDate() - coachSettings.autoArchiveDays
        );

        // Find clients that should be auto-archived
        const clientsToArchive = await db.client.findMany({
          where: {
            coachId: ensureUserId(user.id),
            archived: false,
            updatedAt: {
              lt: inactivityThreshold,
            },
          },
          select: { id: true },
        });

        // Archive them if any found
        if (clientsToArchive.length > 0) {
          await db.client.updateMany({
            where: {
              id: {
                in: clientsToArchive.map(c => c.id),
              },
            },
            data: {
              archived: true,
              archivedAt: new Date(),
            },
          });
        }
      }

      const whereClause: any = {};
      if (input?.archived !== undefined) {
        whereClause.archived = input.archived;
      }

      if (scope === "organization") {
        // Find all active organizations for the coach
        const activeMemberships = await db.coachOrganization.findMany({
          where: {
            coachId: ensuredUserId,
            isActive: true,
          },
          select: {
            organizationId: true,
          },
        });

        const organizationIds = activeMemberships.map(
          membership => membership.organizationId
        );

        if (organizationIds.length > 0) {
          const orgCoaches = await db.coachOrganization.findMany({
            where: {
              organizationId: { in: organizationIds },
              isActive: true,
            },
            select: {
              coachId: true,
            },
          });

          const accessibleCoachIds = Array.from(
            new Set([ensuredUserId, ...orgCoaches.map(c => c.coachId)])
          );

          const orConditions: any[] = [
            { coachId: { in: accessibleCoachIds } },
            { primaryCoachId: { in: accessibleCoachIds } },
            {
              assignedCoaches: {
                some: {
                  coachId: { in: accessibleCoachIds },
                  isActive: true,
                },
              },
            },
          ];

          if (organizationIds.length > 0) {
            orConditions.push({ organizationId: { in: organizationIds } });
          }

          // Always include the requesting coach's direct clients
          orConditions.push({ coachId: ensuredUserId });

          whereClause.OR = orConditions;
        } else {
          whereClause.coachId = ensuredUserId;
        }
      } else {
        whereClause.coachId = ensuredUserId;
      }

      // Get clients with their basic info
      const clients = await db.client.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              settings: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },
          coach: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          primaryCoach: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          notes: {
            select: {
              id: true,
              title: true,
              content: true,
              createdAt: true,
              coachId: true,
              type: true,
              priority: true,
              isPrivate: true,
              updatedAt: true,
              clientId: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          programAssignments: {
            select: {
              id: true,
              programId: true,
              clientId: true,
              assignedAt: true,
              startDate: true,
              progress: true,
              completed: true,
              completedAt: true,
              program: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  sport: true,
                  level: true,
                  duration: true,
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return clients;
    }),

  dueSoon: publicProcedure.query(async () => {
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
        message: "Only coaches can view clients",
      });
    }

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Get all active clients
    const clients = await db.client.findMany({
      where: {
        coachId: ensureUserId(user.id),
        archived: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        notes: true,
        coachId: true,
        createdAt: true,
        updatedAt: true,
        nextLessonDate: true,
        lastCompletedWorkout: true,
        avatar: true,
        dueDate: true,
        lastActivity: true,
        updates: true,
        userId: true,
        archived: true,
        archivedAt: true,
        age: true,
        height: true,
        dominantHand: true,
        movementStyle: true,
        reachingAbility: true,
        averageSpeed: true,
        topSpeed: true,
        dropSpinRate: true,
        changeupSpinRate: true,
        riseSpinRate: true,
        curveSpinRate: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            settings: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Simple filter for clients with lessons due soon
    const now = new Date();
    const clientsWithLessonsDueSoon = clients.filter(client => {
      if (client.nextLessonDate) {
        const lessonDate = new Date(client.nextLessonDate);
        return lessonDate >= now && lessonDate <= threeDaysFromNow;
      }
      return false;
    });

    // Sort by lesson date (earliest first)
    return clientsWithLessonsDueSoon.sort((a, b) => {
      const aDate = new Date(a.nextLessonDate!);
      const bDate = new Date(b.nextLessonDate!);
      return aDate.getTime() - bDate.getTime();
    });
  }),

  needsAttention: publicProcedure.query(async () => {
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
        message: "Only coaches can view clients",
      });
    }

    // Get all active clients
    const clients = await db.client.findMany({
      where: {
        coachId: ensureUserId(user.id),
        archived: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        notes: true,
        coachId: true,
        createdAt: true,
        updatedAt: true,
        nextLessonDate: true,
        lastCompletedWorkout: true,
        avatar: true,
        dueDate: true,
        lastActivity: true,
        updates: true,
        userId: true,
        archived: true,
        archivedAt: true,
        age: true,
        height: true,
        dominantHand: true,
        movementStyle: true,
        reachingAbility: true,
        averageSpeed: true,
        topSpeed: true,
        dropSpinRate: true,
        changeupSpinRate: true,
        riseSpinRate: true,
        curveSpinRate: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            settings: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Simple filter for clients needing attention
    const now = new Date();
    const clientsNeedingAttention = clients.filter(client => {
      if (client.nextLessonDate) {
        const lessonDate = new Date(client.nextLessonDate);
        // Client needs attention if lesson is in the past or no lesson scheduled
        return lessonDate <= now;
      }
      // No lesson date means they need attention
      return true;
    });

    // Sort by creation date (newest first)
    return clientsNeedingAttention.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional().or(z.literal("")),
        notes: z.string().optional().or(z.literal("")),
        nextLessonDate: z.string().optional(),
        lastCompletedWorkout: z.string().optional(),
        // Client physical information
        age: z.number().int().positive().optional(),
        height: z.string().optional(),
        dominantHand: z.enum(["RIGHT", "LEFT"]).optional(),
        movementStyle: z.enum(["AIRPLANE", "HELICOPTER"]).optional(),
        reachingAbility: z.enum(["REACHER", "NON_REACHER"]).optional(),
        averageSpeed: z.number().positive().optional(),
        topSpeed: z.number().positive().optional(),
        dropSpinRate: z.number().int().positive().optional(),
        changeupSpinRate: z.number().int().positive().optional(),
        riseSpinRate: z.number().int().positive().optional(),
        curveSpinRate: z.number().int().positive().optional(),
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
          message: "Only coaches can create clients",
        });
      }

      // Check if coach requires client email
      const coachSettings = await db.userSettings.findUnique({
        where: { userId: user.id },
        select: { requireClientEmail: true },
      });

      if (coachSettings?.requireClientEmail && !input.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Email is required for new clients. Please provide a client email address.",
        });
      }

      // Check if client with this email already exists in the system
      let existingClient = null;
      if (input.email) {
        existingClient = await db.client.findFirst({
          where: { email: input.email },
        });
      }

      let client;
      if (existingClient) {
        // Find the user account for this client
        let userId = existingClient.userId;
        if (input.email && !userId) {
          const userAccount = await db.user.findFirst({
            where: { email: input.email },
          });
          if (userAccount) {
            userId = userAccount.id;
          }
        }

        // Update existing client to assign them to this coach
        client = await db.client.update({
          where: { id: existingClient.id },
          data: {
            coachId: ensureUserId(user.id),
            userId: userId, // Link to their user account
            // Update other fields if provided
            ...(input.name && { name: input.name }),
            ...(input.phone && { phone: input.phone }),
            ...(input.age && { age: input.age }),
            ...(input.height && { height: input.height }),
            ...(input.dominantHand && { dominantHand: input.dominantHand }),
            ...(input.movementStyle && {
              movementStyle: input.movementStyle,
            }),
            ...(input.reachingAbility && {
              reachingAbility: input.reachingAbility,
            }),
            ...(input.averageSpeed && { averageSpeed: input.averageSpeed }),
            ...(input.topSpeed && { topSpeed: input.topSpeed }),
            ...(input.dropSpinRate && { dropSpinRate: input.dropSpinRate }),
            ...(input.changeupSpinRate && {
              changeupSpinRate: input.changeupSpinRate,
            }),
            ...(input.riseSpinRate && { riseSpinRate: input.riseSpinRate }),
            ...(input.curveSpinRate && {
              curveSpinRate: input.curveSpinRate,
            }),
          },
        });
      } else {
        // Find user account if email is provided
        let userId = null;
        if (input.email) {
          const userAccount = await db.user.findFirst({
            where: { email: input.email },
          });
          if (userAccount) {
            userId = userAccount.id;
          }
        }

        // Create new client
        client = await db.client.create({
          data: {
            name: input.name,
            email: input.email || null,
            phone: input.phone || null,
            coachId: ensureUserId(user.id),
            userId: userId, // Link to user account if found
            nextLessonDate: input.nextLessonDate
              ? new Date(input.nextLessonDate)
              : null,
            lastCompletedWorkout: input.lastCompletedWorkout || null,
            // Client physical information
            age: input.age || null,
            height: input.height || null,
            dominantHand: input.dominantHand || null,
            movementStyle: input.movementStyle || null,
            reachingAbility: input.reachingAbility || null,
            averageSpeed: input.averageSpeed || null,
            topSpeed: input.topSpeed || null,
            dropSpinRate: input.dropSpinRate || null,
            changeupSpinRate: input.changeupSpinRate || null,
            riseSpinRate: input.riseSpinRate || null,
            curveSpinRate: input.curveSpinRate || null,
          },
        });
      }

      // Send welcome message and push notification if client has a user account
      if (client.userId) {
        await sendWelcomeMessage(user.id, client.userId);

        // Send push notification to coach about new client
        try {
          const { sendClientJoinNotification } = await import(
            "@/lib/pushNotificationService"
          );
          await sendClientJoinNotification(
            user.id,
            client.name || "New Client",
            client.id
          );
        } catch (error) {
          console.error("Failed to send push notification:", error);
        }
      }

      return client;
    }),

  checkClientExistsForCoach: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
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
          message: "Only coaches can check clients",
        });
      }

      // Check if client with this email is already assigned to this coach
      const existingClient = await db.client.findFirst({
        where: {
          email: input.email,
          coachId: coach.id,
        },
      });

      return !!existingClient;
    }),

  // Debug endpoint to check client-coach relationship
  debugClientCoach: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get client record
      const client = await db.client.findFirst({
        where: { email: input.email },
        include: {
          coach: true,
          user: true,
        },
      });

      // Get user account
      const userAccount = await db.user.findFirst({
        where: { email: input.email },
      });

      return {
        client,
        userAccount,
        currentUser: user,
      };
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.string(),
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
          message: "Only coaches can delete clients",
        });
      }

      const client = await db.client.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id),
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Only allow permanent deletion of archived clients
      if (!client.archived) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Client must be archived before permanent deletion. Please archive the client first.",
        });
      }

      // Permanently delete the client - remove coach relationship but keep client record
      // so they can request a new coach from the waiting page
      await db.client.update({
        where: { id: input.id },
        data: {
          coachId: null,
          archived: true,
          archivedAt: new Date(),
        },
      });

      // Note: We don't actually delete the client record - we just remove the coach relationship
      // This allows the client to stay on the waiting page and request a new coach

      return { success: true };
    }),

  archive: publicProcedure
    .input(
      z.object({
        id: z.string(),
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
          message: "Only coaches can archive clients",
        });
      }

      const client = await db.client.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id),
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Archive the client and remove all their assignments
      await db.$transaction(async tx => {
        // Archive the client
        await tx.client.update({
          where: { id: input.id },
          data: {
            archived: true,
            archivedAt: new Date(),
          },
        });

        // Remove all lessons for this client
        const deletedLessons = await tx.event.deleteMany({
          where: {
            clientId: input.id,
          },
        });

        // Remove all program assignments for this client
        const deletedPrograms = await tx.programAssignment.deleteMany({
          where: {
            clientId: input.id,
          },
        });

        // Remove all routine assignments for this client
        const deletedRoutines = await tx.routineAssignment.deleteMany({
          where: {
            clientId: input.id,
          },
        });

        // Remove all video assignments for this client
        const deletedVideos = await tx.videoAssignment.deleteMany({
          where: {
            clientId: input.id,
          },
        });

        // Log the cleanup results for debugging
      });

      return { success: true };
    }),

  unarchive: publicProcedure
    .input(
      z.object({
        id: z.string(),
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
          message: "Only coaches can unarchive clients",
        });
      }

      const client = await db.client.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id),
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      await db.client.update({
        where: { id: input.id },
        data: {
          archived: false,
          archivedAt: null,
        },
      });

      return { success: true };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
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
          message: "Only coaches can view client details",
        });
      }

      // Check if coach is in an organization
      const ensuredUserId = ensureUserId(user.id);
      const memberships = await db.coachOrganization.findMany({
        where: {
          coachId: ensuredUserId,
          isActive: true,
        },
        select: {
          organizationId: true,
        },
      });

      const organizationIds = memberships.map(member => member.organizationId);

      // Build the where clause - if coach is in an organization, allow access to:
      // 1. Clients directly assigned to this coach
      // 2. Clients whose coach is in the same organization
      let whereClause: any = {
        id: input.id,
        archived: false,
      };

      if (organizationIds.length > 0) {
        const orgCoaches = await db.coachOrganization.findMany({
          where: {
            organizationId: { in: organizationIds },
            isActive: true,
          },
          select: {
            coachId: true,
          },
        });

        const accessibleCoachIds = Array.from(
          new Set([ensuredUserId, ...orgCoaches.map(c => c.coachId)])
        );

        whereClause.OR = [
          { coachId: { in: accessibleCoachIds } },
          { primaryCoachId: { in: accessibleCoachIds } },
          { organizationId: { in: organizationIds } },
          {
            assignedCoaches: {
              some: {
                coachId: { in: accessibleCoachIds },
                isActive: true,
              },
            },
          },
        ];
      } else {
        // Not in an organization, only allow access to own clients
        whereClause.coachId = ensuredUserId;
      }

      const client = await db.client.findFirst({
        where: whereClause,
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          primaryCoach: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedCoaches: {
            where: { isActive: true },
            select: {
              coachId: true,
              coach: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              role: true,
            },
          },
          notes: {
            select: {
              id: true,
              title: true,
              content: true,
              createdAt: true,
              coachId: true,
              type: true,
              priority: true,
              isPrivate: true,
              updatedAt: true,
              clientId: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              settings: { select: { avatarUrl: true } },
            },
          },
          programAssignments: {
            select: {
              id: true,
              programId: true,
              clientId: true,
              assignedAt: true,
              startDate: true,
              progress: true,
              completed: true,
              completedAt: true,
              program: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  sport: true,
                  level: true,
                  duration: true,
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

      return client;
    }),

  getAssignedPrograms: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
      })
    )
    .query(async ({ input }) => {
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
          message: "Only coaches can view client programs",
        });
      }

      // Check if coach is in an organization
      const coachOrganization = await db.coachOrganization.findFirst({
        where: {
          coachId: ensureUserId(user.id),
          isActive: true,
        },
      });

      // Build the where clause
      let whereClause: any = {
        id: input.clientId,
        archived: false,
      };

      if (coachOrganization?.organizationId) {
        // Get all coaches in the organization
        const orgCoaches = await db.coachOrganization.findMany({
          where: {
            organizationId: coachOrganization.organizationId,
            isActive: true,
          },
          select: {
            coachId: true,
          },
        });

        const orgCoachIds = orgCoaches.map(c => c.coachId);

        // Allow access if client belongs to any coach in the organization
        whereClause.coachId = { in: orgCoachIds };
      } else {
        // Not in an organization, only allow access to own clients
        whereClause.coachId = ensureUserId(user.id);
      }

      // Verify the client belongs to this coach or is in the same organization
      const client = await db.client.findFirst({
        where: whereClause,
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found, not assigned to you, or is archived",
        });
      }

      // Get assigned programs
      const assignments = await db.programAssignment.findMany({
        where: {
          clientId: input.clientId,
        },
        include: {
          program: {
            include: {
              weeks: {
                include: {
                  days: {
                    include: {
                      drills: {
                        orderBy: {
                          order: "asc",
                        },
                      },
                    },
                    orderBy: {
                      dayNumber: "asc",
                    },
                  },
                },
                orderBy: {
                  weekNumber: "asc",
                },
              },
            },
          },
          replacements: {
            orderBy: {
              replacedDate: "asc",
            },
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
      });

      // Validate that all weeks are included (debug check)
      assignments.forEach(assignment => {
        const program = assignment.program;
        if (program.weeks.length !== program.duration) {
          // Program weeks/duration mismatch - handle silently
        }
      });

      return assignments;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional().or(z.literal("")),
        notes: z.string().optional().or(z.literal("")),
        nextLessonDate: z.string().optional(),
        lastCompletedWorkout: z.string().optional(),
        // Client physical information
        age: z.number().int().positive().optional(),
        height: z.string().optional(),
        dominantHand: z.enum(["RIGHT", "LEFT"]).optional(),
        movementStyle: z.enum(["AIRPLANE", "HELICOPTER"]).optional(),
        reachingAbility: z.enum(["REACHER", "NON_REACHER"]).optional(),
        averageSpeed: z.number().positive().optional(),
        topSpeed: z.number().positive().optional(),
        dropSpinRate: z.number().int().positive().optional(),
        changeupSpinRate: z.number().int().positive().optional(),
        riseSpinRate: z.number().int().positive().optional(),
        curveSpinRate: z.number().int().positive().optional(),
        // Custom fields - flexible JSON object for coach-defined metrics
        customFields: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
          .optional(),
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
          message: "Only coaches can update clients",
        });
      }

      // Verify the client belongs to this coach and is not archived
      const client = await db.client.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id),
          archived: false, // Only allow updating active clients
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found or is archived",
        });
      }

      const { id, ...updateData } = input;

      // Convert date strings to Date objects if provided
      const data: any = { ...updateData };
      if (data.nextLessonDate === "") {
        data.nextLessonDate = null;
      } else if (data.nextLessonDate) {
        data.nextLessonDate = new Date(data.nextLessonDate);
      }

      if (data.lastCompletedWorkout === "") {
        data.lastCompletedWorkout = null;
      } else if (data.lastCompletedWorkout) {
        data.lastCompletedWorkout = new Date(data.lastCompletedWorkout);
      }

      // Convert empty strings to null for optional fields
      if (data.email === "") data.email = null;
      if (data.phone === "") data.phone = null;
      if (data.notes === "") data.notes = null;

      const updatedClient = await db.client.update({
        where: { id: input.id },
        data,
        include: {
          programAssignments: {
            select: {
              id: true,
              programId: true,
              clientId: true,
              assignedAt: true,
              startDate: true,
              progress: true,
              completed: true,
              completedAt: true,
              program: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  sport: true,
                  level: true,
                  duration: true,
                },
              },
            },
          },
        },
      });

      return updatedClient;
    }),

  getOtherClients: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access other clients",
      });
    }

    // Get the current client's coach
    const currentClient = await db.client.findFirst({
      where: { userId: user.id },
      select: { coachId: true },
    });

    if (!currentClient) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    // Get other clients with the same coach (excluding current user)
    const otherClients = await db.client.findMany({
      where: {
        coachId: currentClient.coachId,
        archived: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        avatar: true,
      },
      orderBy: { name: "asc" },
    });

    // Filter out the current user after fetching
    const filteredClients = otherClients.filter(
      client => client.userId !== user.id
    );

    return filteredClients;
  }),

  updateNotes: publicProcedure
    .input(z.object({ clientId: z.string(), notes: z.string().optional() }))
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
          message: "Only coaches can update client notes",
        });
      }

      // Get current notes to determine action
      const currentClient = await db.client.findFirst({
        where: { id: input.clientId, coachId: user.id },
        select: { notes: true },
      });

      if (!currentClient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Determine action type
      let action: "CREATED" | "UPDATED" | "DELETED" = "UPDATED";
      if (!currentClient.notes && input.notes) {
        action = "CREATED";
      } else if (currentClient.notes && !input.notes) {
        action = "DELETED";
      }

      // For now, we'll skip updating the notes field since it's now handled by the ClientNote model
      // This is a temporary solution until we fully migrate to the new note system

      // Create history entry
      await db.clientNoteHistory.create({
        data: {
          clientId: input.clientId,
          coachId: user.id,
          notes: input.notes || "",
          action: action,
        },
      });

      return { success: true };
    }),

  getNoteHistory: publicProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input }) => {
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
          message: "Only coaches can view note history",
        });
      }

      // Get note history for the client
      const noteHistory = await db.clientNoteHistory.findMany({
        where: {
          clientId: input.clientId,
          coachId: user.id,
        },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return noteHistory;
    }),

  getClientNotes: publicProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input }) => {
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
          message: "Only coaches can view client notes",
        });
      }

      // Get notes for the client, ordered by pinned first, then by createdAt
      const notes = await db.clientNote.findMany({
        where: {
          clientId: input.clientId,
          coachId: user.id,
        },
        orderBy: [
          { isPinned: "desc" }, // Pinned notes first
          { createdAt: "desc" }, // Then by creation date
        ],
      });

      return notes;
    }),

  togglePinNote: publicProcedure
    .input(z.object({ noteId: z.string() }))
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
          message: "Only coaches can pin notes",
        });
      }

      // Get the note to check ownership
      const note = await db.clientNote.findFirst({
        where: {
          id: input.noteId,
          coachId: user.id,
        },
      });

      if (!note) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found or access denied",
        });
      }

      // Toggle pin status
      const updatedNote = await db.clientNote.update({
        where: { id: input.noteId },
        data: { isPinned: !note.isPinned },
      });

      return updatedNote;
    }),

  getComplianceData: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
        period: z.enum(["4", "6", "8", "all"]),
      })
    )
    .query(async ({ input }) => {
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
          message: "Only coaches can view client compliance data",
        });
      }

      // Verify the client belongs to this coach
      const client = await db.client.findFirst({
        where: {
          id: input.clientId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found or not assigned to you",
        });
      }

      // Calculate date range based on period
      const now = new Date();
      // Normalize to end of today (23:59:59.999) to ensure today is included
      const endOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
      let startDate: Date;

      switch (input.period) {
        case "4":
          startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);
          break;
        case "6":
          startDate = new Date(now.getTime() - 6 * 7 * 24 * 60 * 60 * 1000);
          break;
        case "8":
          startDate = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
          break;
        case "all":
          startDate = new Date(0); // Beginning of time
          break;
      }

      // Get all drill completions for this client in the time range (up to end of today)
      const drillCompletions = await db.drillCompletion.findMany({
        where: {
          clientId: client.id,
          completedAt: {
            gte: startDate,
            lte: endOfToday,
          },
        },
      });

      // Get routine exercise completions from BOTH tables:
      // 1. RoutineExerciseCompletion (legacy/alternative system)
      const allRoutineExerciseCompletions =
        await db.routineExerciseCompletion.findMany({
          where: {
            clientId: client.id,
          },
        });

      // 2. ExerciseCompletion (new system used by exerciseCompletion.markExerciseComplete)
      const allExerciseCompletions = await db.exerciseCompletion.findMany({
        where: {
          clientId: client.id,
          completed: true, // Only completed ones
        },
      });

      // Filter both by date range
      const routineExerciseCompletions = allRoutineExerciseCompletions.filter(
        completion => {
          const completedAt = new Date(completion.completedAt);
          return completedAt >= startDate && completedAt <= endOfToday;
        }
      );

      // Get all assigned programs for this client (regardless of when assigned)
      const programAssignments = await db.programAssignment.findMany({
        where: {
          clientId: client.id,
          completedAt: null, // Only active assignments
        },
        include: {
          program: {
            include: {
              weeks: {
                include: {
                  days: {
                    include: {
                      drills: true,
                    },
                  },
                },
              },
            },
          },
          replacements: {
            orderBy: {
              replacedDate: "asc",
            },
          },
        },
      });

      // Get routine assignments for this client
      const routineAssignments = await db.routineAssignment.findMany({
        where: {
          clientId: client.id,
          completedAt: null, // Only active assignments
        },
        include: {
          routine: {
            include: {
              exercises: true,
            },
          },
        },
      });

      // Get video assignments for this client
      const videoAssignments = await db.videoAssignment.findMany({
        where: {
          clientId: client.id,
        },
      });

      // Calculate total drills assigned and completed
      let totalDrills = 0;
      let completedDrills = 0;

      // Track assigned drill IDs for program drills
      const assignedProgramDrillIds = new Set<string>();

      // Track assigned routine exercises (assignmentId + exerciseId)
      const assignedRoutineExercises = new Set<string>();

      // Track assigned video IDs
      const assignedVideoIds = new Set<string>();

      // Count program drills and track their IDs
      programAssignments.forEach(assignment => {
        if (!assignment.startDate) return;

        const assignmentStartDate = new Date(assignment.startDate);

        assignment.program.weeks.forEach((week, weekIndex) => {
          week.days.forEach((day, dayIndex) => {
            // Calculate the actual date this day should be completed
            // Day 0 = startDate, Day 1 = startDate + 1, etc.
            const dayDate = new Date(assignmentStartDate);
            dayDate.setDate(dayDate.getDate() + weekIndex * 7 + dayIndex);

            // Check if this day has been replaced with a lesson
            const hasReplacement = assignment.replacements?.some(
              (replacement: any) => {
                const replacementDate = new Date(replacement.replacedDate);
                const replacementDateOnly = new Date(
                  replacementDate.getFullYear(),
                  replacementDate.getMonth(),
                  replacementDate.getDate()
                );
                const dayDateOnly = new Date(
                  dayDate.getFullYear(),
                  dayDate.getMonth(),
                  dayDate.getDate()
                );
                return replacementDateOnly.getTime() === dayDateOnly.getTime();
              }
            );

            // Only count drills from days that were due within the time period (past or today, not future) and haven't been replaced
            // Normalize dayDate to midnight for comparison
            const dayDateOnly = new Date(
              dayDate.getFullYear(),
              dayDate.getMonth(),
              dayDate.getDate()
            );
            const todayOnly = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );

            if (
              dayDateOnly <= todayOnly &&
              dayDate >= startDate &&
              !hasReplacement
            ) {
              day.drills.forEach(drill => {
                assignedProgramDrillIds.add(drill.id);
                totalDrills += 1;
              });
            }
          });
        });
      });

      // Count routine exercises that were active during the time period
      // Routines are ongoing assignments, so we count them if they were active during any part of the period
      routineAssignments.forEach(assignment => {
        // If no startDate, use assignedAt as the start date
        const assignmentStartDate = assignment.startDate
          ? new Date(assignment.startDate)
          : new Date(assignment.assignedAt);

        // For routines, count exercises if the routine was active during the period
        // Routines are ongoing, so we count them if:
        // 1. They were assigned before or during the period AND
        // 2. They are still active (or were completed during/after the period)
        const routineEndDate = assignment.completedAt
          ? new Date(assignment.completedAt)
          : endOfToday;

        // Normalize dates for comparison
        const assignmentStartDateOnly = new Date(
          assignmentStartDate.getFullYear(),
          assignmentStartDate.getMonth(),
          assignmentStartDate.getDate()
        );
        const todayOnly = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        // Count if the routine was assigned before or during the period and is active up to today
        // This ensures routines assigned today are included
        const wasActiveDuringPeriod =
          assignmentStartDateOnly <= todayOnly && routineEndDate >= startDate;

        if (wasActiveDuringPeriod) {
          assignment.routine.exercises.forEach(exercise => {
            const routineKey = `${assignment.id}-${exercise.id}`;
            assignedRoutineExercises.add(routineKey);
            totalDrills += 1;
          });
        }
      });

      // Count video assignments that were due during the time period (past or today, not future)
      videoAssignments.forEach(assignment => {
        // If there's a dueDate, use it; otherwise use assignedAt
        const dueDate = assignment.dueDate
          ? new Date(assignment.dueDate)
          : new Date(assignment.assignedAt);

        // Normalize to date only for comparison
        const dueDateOnly = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate()
        );
        const todayOnly = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        // Only count videos that were due within the time period and are due today or earlier (not future)
        if (
          dueDateOnly <= todayOnly &&
          dueDate >= startDate &&
          dueDate <= endOfToday
        ) {
          assignedVideoIds.add(assignment.videoId);
          totalDrills += 1;
        }
      });

      // Count completed program drills
      completedDrills += drillCompletions.filter(completion =>
        assignedProgramDrillIds.has(completion.drillId)
      ).length;

      // Count completed routine exercises from RoutineExerciseCompletion table
      const completedRoutineExercisesSet = new Set<string>();
      routineExerciseCompletions.forEach(completion => {
        const routineKey = `${completion.routineAssignmentId}-${completion.exerciseId}`;
        if (assignedRoutineExercises.has(routineKey)) {
          completedRoutineExercisesSet.add(routineKey);
        }
      });

      // Count completed routine exercises from ExerciseCompletion table
      // For ExerciseCompletion, we need to match by exerciseId and check if it belongs to an assigned routine
      const routineExerciseIds = new Set(
        routineAssignments.flatMap(assignment =>
          assignment.routine.exercises.map(ex => ex.id)
        )
      );

      const exerciseCompletionsForRoutines = allExerciseCompletions.filter(
        completion => {
          // Check if this completion is for a routine exercise
          const isRoutineExercise = routineExerciseIds.has(
            completion.exerciseId
          );
          if (!isRoutineExercise) return false;

          // Check date range
          if (!completion.completedAt) return false;
          const completedAt = new Date(completion.completedAt);
          return completedAt >= startDate && completedAt <= endOfToday;
        }
      );

      // Match ExerciseCompletion entries to routine assignments
      exerciseCompletionsForRoutines.forEach(completion => {
        // Find which routine assignment this exercise belongs to
        for (const assignment of routineAssignments) {
          const exercise = assignment.routine.exercises.find(
            ex => ex.id === completion.exerciseId
          );
          if (exercise) {
            const routineKey = `${assignment.id}-${completion.exerciseId}`;
            if (assignedRoutineExercises.has(routineKey)) {
              completedRoutineExercisesSet.add(routineKey);
            }
          }
        }
      });

      completedDrills += completedRoutineExercisesSet.size;

      // Count completed videos (videos that were assigned and completed)
      completedDrills += videoAssignments.filter(assignment => {
        const dueDate = assignment.dueDate
          ? new Date(assignment.dueDate)
          : new Date(assignment.assignedAt);

        const dueDateOnly = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate()
        );
        const todayOnly = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        return (
          assignedVideoIds.has(assignment.videoId) &&
          assignment.completed &&
          assignment.completedAt &&
          new Date(assignment.completedAt) >= startDate &&
          new Date(assignment.completedAt) <= endOfToday &&
          dueDateOnly <= todayOnly
        );
      }).length;

      // Count completed videos (videos that were assigned and completed)
      const completedVideoCount = videoAssignments.filter(assignment => {
        const dueDate = assignment.dueDate
          ? new Date(assignment.dueDate)
          : new Date(assignment.assignedAt);

        const dueDateOnly = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate()
        );
        const todayOnly = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        return (
          assignedVideoIds.has(assignment.videoId) &&
          assignment.completed &&
          assignment.completedAt &&
          new Date(assignment.completedAt) >= startDate &&
          new Date(assignment.completedAt) <= endOfToday &&
          dueDateOnly <= todayOnly
        );
      }).length;

      // Calculate completion rate
      const completionRate =
        totalDrills > 0 ? Math.round((completedDrills / totalDrills) * 100) : 0;

      return {
        completionRate,
        completed: completedDrills,
        total: totalDrills,
        period: input.period,
      };
    }),

  // Replace workout day with lesson
  replaceWorkoutWithLesson: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
        programId: z.string(),
        dayDate: z.string(), // The specific day to replace
        lessonData: z.object({
          time: z.string(),
          title: z.string(),
          description: z.string().optional(),
        }),
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
          message: "Only coaches can replace workouts with lessons",
        });
      }

      // Verify the client belongs to this coach
      const client = await db.client.findFirst({
        where: {
          id: input.clientId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found or not assigned to you",
        });
      }

      // Let's also check what assignments exist for this client
      const allClientAssignments = await db.programAssignment.findMany({
        where: {
          clientId: input.clientId,
        },
        select: {
          id: true,
          programId: true,
          clientId: true,
        },
      });

      // Verify the program assignment exists and belongs to this coach
      const programAssignment = await db.programAssignment.findFirst({
        where: {
          programId: input.programId,
          clientId: input.clientId,
          client: {
            coachId: ensureUserId(user.id), // Ensure the client belongs to this coach
          },
        },
        include: {
          program: true,
          client: true,
        },
      });

      if (!programAssignment) {
        // Let's also check what assignments DO exist for this client
        const allAssignments = await db.programAssignment.findMany({
          where: {
            clientId: input.clientId,
            client: {
              coachId: ensureUserId(user.id),
            },
          },
          include: {
            program: true,
          },
        });

        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Program assignment not found. Looking for programId: ${input.programId}, clientId: ${input.clientId}. Found ${allAssignments.length} other assignments.`,
        });
      }

      // Create a note/annotation for this replacement
      const replacementNote = `Workout replaced with lesson: ${input.lessonData.title}`;

      // Create the lesson

      // Parse and format the date properly
      const [year, month, day] = input.dayDate.split("-").map(Number);
      const [time, period] = input.lessonData.time.split(" ");
      const [hours, minutes] = time.split(":").map(Number);

      // Convert to 24-hour format if needed
      let hour24 = hours;
      if (period === "PM" && hours !== 12) {
        hour24 = hours + 12;
      } else if (period === "AM" && hours === 12) {
        hour24 = 0;
      }

      const lessonDate = new Date(
        year,
        month - 1,
        day,
        hour24,
        minutes || 0,
        0,
        0
      );

      const lessonDuration = coach.timeSlotInterval || 60; // Use coach's lesson duration or default to 60 minutes
      const lessonEndTime = new Date(
        lessonDate.getTime() + lessonDuration * 60000
      );
      const lesson = await db.event.create({
        data: {
          title: input.lessonData.title,
          description: input.lessonData.description || replacementNote,
          date: lessonDate,
          endTime: lessonEndTime,
          status: "CONFIRMED",
          clientId: input.clientId,
          coachId: ensureUserId(user.id),
        },
      });

      // Create a program day replacement record to track that this day was replaced
      const replacementRecord = await db.programDayReplacement.create({
        data: {
          assignmentId: programAssignment.id,
          programId: input.programId,
          clientId: input.clientId,
          coachId: ensureUserId(user.id),
          replacedDate: lessonDate,
          lessonId: lesson.id,
          replacementReason: `Replaced with lesson: ${input.lessonData.title}`,
        },
      });

      return {
        success: true,
        lesson,
        replacementRecord,
        message: `Workout replaced with lesson successfully`,
      };
    }),

  // Get current user's client record (for clients to check their status)
  getMyClientRecord: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access this endpoint",
      });
    }

    const clientRecord = await db.client.findFirst({
      where: { userId: user.id },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return clientRecord;
  }),
});
