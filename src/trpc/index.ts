import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import { format } from "date-fns";
import {
  extractYouTubeVideoId,
  extractPlaylistId,
  getYouTubeThumbnail,
  fetchYouTubeVideoInfo,
  fetchPlaylistVideos,
} from "@/lib/youtube";
import { deleteFileFromUploadThing } from "@/lib/uploadthing-utils";
import { adminRouter } from "./admin";
// Removed circular dependency - notification will be handled differently

export const appRouter = router({
  authCallback: publicProcedure.query(
    async (): Promise<{
      success: boolean;
      needsRoleSelection: boolean;
      user: {
        id: string;
        email: string;
        role?: "COACH" | "CLIENT";
        isAdmin?: boolean;
        name: string;
      };
    }> => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id || !user.email)
        throw new TRPCError({ code: "UNAUTHORIZED" });

      const dbUser = await db.user.findFirst({
        where: { id: user.id },
      });

      if (dbUser) {
        // EXISTING USER - This is the key fix
        if (dbUser.role) {
          // User exists AND has a role - skip role selection
          console.log("Existing user with role:", dbUser.role); // Add for debugging
          return {
            success: true,
            needsRoleSelection: false, // ← This should be FALSE for existing users with roles
            user: {
              id: dbUser.id,
              email: dbUser.email,
              role: dbUser.role as "COACH" | "CLIENT",
              isAdmin: dbUser.isAdmin || false,
              name:
                dbUser.name || user.given_name || user.family_name || "User",
            },
          };
        } else {
          // User exists but no role - needs role selection
          console.log("Existing user without role"); // Add for debugging
          return {
            success: true,
            needsRoleSelection: true,
            user: {
              id: dbUser.id,
              email: dbUser.email,
              isAdmin: dbUser.isAdmin || false,
              name:
                dbUser.name || user.given_name || user.family_name || "User",
            },
          };
        }
      }

      // NEW USER LOGIC (rest stays the same)
      const existingClientRecord = await db.client.findFirst({
        where: {
          email: user.email,
          userId: null,
        },
      });

      if (existingClientRecord) {
        const newClientUser = await db.user.create({
          data: {
            id: user.id,
            email: user.email,
            name:
              user.given_name && user.family_name
                ? `${user.given_name} ${user.family_name}`
                : null,
            role: "CLIENT",
          },
        });

        await db.client.update({
          where: { id: existingClientRecord.id },
          data: {
            userId: newClientUser.id,
            name: newClientUser.name || existingClientRecord.name,
          },
        });

        return {
          success: true,
          needsRoleSelection: false,
          user: {
            id: newClientUser.id,
            email: newClientUser.email,
            role: "CLIENT",
            name: newClientUser.name || existingClientRecord.name || "Client",
          },
        };
      }

      // Completely new user
      return {
        success: true,
        needsRoleSelection: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.given_name || user.family_name || "User",
        },
      };
    }
  ),

  user: router({
    updateRole: publicProcedure
      .input(
        z.object({
          role: z.enum(["COACH", "CLIENT"]),
          coachId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // First check if user exists
        const existingUser = await db.user.findFirst({
          where: { id: user.id },
        });

        let updatedUser;

        if (existingUser) {
          // User exists, update it
          updatedUser = await db.user.update({
            where: { id: user.id },
            data: {
              role: input.role,
            },
          });
        } else {
          // User doesn't exist, create it
          if (!user.email) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Email is required to create user",
            });
          }

          updatedUser = await db.user.create({
            data: {
              id: user.id,
              email: user.email,
              name:
                user.given_name && user.family_name
                  ? `${user.given_name} ${user.family_name}`
                  : user.given_name || user.family_name || null,
              role: input.role,
            },
          });
        }

        // If client is joining a coach, create notification and client record
        if (input.role === "CLIENT" && input.coachId) {
          // Verify the coach exists
          const coach = await db.user.findFirst({
            where: { id: input.coachId, role: "COACH" },
          });

          if (!coach) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Coach not found",
            });
          }

          // Create or update client record
          await db.client.upsert({
            where: { userId: user.id },
            update: {
              coachId: input.coachId,
              name: updatedUser.name || "New Client",
              email: updatedUser.email,
            },
            create: {
              userId: user.id,
              coachId: input.coachId,
              name: updatedUser.name || "New Client",
              email: updatedUser.email,
            },
          });

          // Create notification for the coach
          await db.notification.create({
            data: {
              userId: input.coachId,
              type: "CLIENT_JOIN_REQUEST",
              title: "New Client Request",
              message: `${
                updatedUser.name || "A new client"
              } wants to join your coaching program.`,
              data: {
                clientId: user.id,
                clientName: updatedUser.name,
                clientEmail: updatedUser.email,
              },
            },
          });
        }

        return updatedUser;
      }),

    // Get notifications for the current user
    getNotifications: publicProcedure
      .input(
        z.object({
          limit: z.number().optional().default(10),
          unreadOnly: z.boolean().optional().default(false),
        })
      )
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const whereClause: any = { userId: user.id };

        if (input.unreadOnly) {
          whereClause.isRead = false;
        }

        const notifications = await db.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          take: input.limit,
        });

        return notifications;
      }),

    // Mark notification as read
    markNotificationRead: publicProcedure
      .input(z.object({ notificationId: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const notification = await db.notification.update({
          where: {
            id: input.notificationId,
            userId: user.id, // Ensure user owns the notification
          },
          data: { isRead: true },
        });

        return notification;
      }),

    // Get unread notification count
    getUnreadCount: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const count = await db.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      });

      return count;
    }),

    updateWorkingHours: publicProcedure
      .input(
        z.object({
          startTime: z.string(),
          endTime: z.string(),
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
            message: "Only coaches can update working hours",
          });
        }

        // First check if user exists
        const existingUser = await db.user.findFirst({
          where: { id: user.id },
        });

        if (!existingUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found in database",
          });
        }

        const updatedUser = await db.user.update({
          where: { id: user.id },
          data: {
            workingHoursStart: input.startTime,
            workingHoursEnd: input.endTime,
          },
        });

        return updatedUser;
      }),

    getCoaches: publicProcedure.query(async () => {
      return await db.user.findMany({
        where: { role: "COACH" },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    }),

    getProfile: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const dbUser = await db.user.findFirst({
        where: { id: user.id },
      });

      if (!dbUser) return null;

      // Transform the data to include workingHours object
      return {
        ...dbUser,
        workingHours:
          dbUser.workingHoursStart && dbUser.workingHoursEnd
            ? {
                startTime: dbUser.workingHoursStart,
                endTime: dbUser.workingHoursEnd,
              }
            : null,
      };
    }),

    checkEmailExists: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const user = await db.user.findUnique({
          where: { email: input.email },
        });
        return !!user;
      }),
  }),

  clients: router({
    list: publicProcedure
      .input(
        z
          .object({
            archived: z.boolean().optional(),
          })
          .optional()
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
            message: "Only coaches can view clients",
          });
        }

        const whereClause: any = { coachId: user.id };

        // Filter by archived status if provided
        if (input?.archived !== undefined) {
          whereClause.archived = input.archived;
        }

        const clients = await db.client.findMany({
          where: whereClause,
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
            programAssignments: {
              include: {
                program: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    sport: true,
                    level: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
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

      return await db.client.findMany({
        where: {
          coachId: user.id,
          archived: false, // Exclude archived clients
          nextLessonDate: {
            lte: threeDaysFromNow,
            gte: new Date(),
          },
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
        orderBy: { nextLessonDate: "asc" },
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

      return await db.client.findMany({
        where: {
          coachId: user.id,
          archived: false, // Exclude archived clients
          OR: [
            { nextLessonDate: null },
            { nextLessonDate: { lt: new Date() } },
          ],
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
        orderBy: { nextLessonDate: "asc" },
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
              coachId: user.id,
              userId: userId, // Link to their user account
              // Update other fields if provided
              ...(input.name && { name: input.name }),
              ...(input.phone && { phone: input.phone }),
              ...(input.notes && { notes: input.notes }),
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
              notes: input.notes || null,
              coachId: user.id,
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
            coachId: user.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          });
        }

        await db.client.delete({
          where: { id: input.id },
        });

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
            coachId: user.id,
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
            archived: true,
            archivedAt: new Date(),
          },
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
            coachId: user.id,
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

        const client = await db.client.findFirst({
          where: {
            id: input.id,
            coachId: user.id,
            archived: false, // Only allow access to active clients
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
                settings: { select: { avatarUrl: true } },
              },
            },
            programAssignments: {
              include: {
                program: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    sport: true,
                    level: true,
                  },
                },
              },
              orderBy: {
                assignedAt: "desc",
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

        // Verify the client belongs to this coach and is not archived
        const client = await db.client.findFirst({
          where: {
            id: input.clientId,
            coachId: user.id,
            archived: false, // Only allow access to active clients
          },
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
            program: true,
          },
          orderBy: {
            assignedAt: "desc",
          },
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
            coachId: user.id,
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
              include: {
                program: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    sport: true,
                    level: true,
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

        await db.client.update({
          where: { id: input.clientId, coachId: user.id },
          data: { notes: input.notes || null },
        });

        return { success: true };
      }),
  }),

  library: router({
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          category: z.string().optional(),
          type: z.enum(["video", "document", "all"]).optional(),
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
            message: "Only coaches can view library",
          });
        }

        const where: any = {
          coachId: user.id,
        };

        if (input.search) {
          where.OR = [
            { title: { contains: input.search, mode: "insensitive" } },
            { description: { contains: input.search, mode: "insensitive" } },
          ];
        }

        if (input.category && input.category !== "All") {
          where.category = input.category;
        }

        if (input.type && input.type !== "all") {
          where.type = input.type;
        }

        const resources = await db.libraryResource.findMany({
          where,
          orderBy: { createdAt: "desc" },
        });

        return resources;
      }),

    getStats: publicProcedure.query(async () => {
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
          message: "Only coaches can view library stats",
        });
      }

      const totalResources = await db.libraryResource.count({
        where: { coachId: user.id },
      });

      const videoCount = await db.libraryResource.count({
        where: {
          coachId: user.id,
          OR: [{ type: "video" }, { isYoutube: true }],
        },
      });

      const documentCount = await db.libraryResource.count({
        where: { coachId: user.id, type: "document" },
      });

      return {
        total: totalResources,
        videos: videoCount,
        documents: documentCount,
      };
    }),

    getClientCommentsForVideo: publicProcedure
      .input(z.object({ videoId: z.string() }))
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
            message: "Only coaches can access this endpoint",
          });
        }

        // Get client video submissions that reference this library item
        const comments = await db.clientVideoSubmission.findMany({
          where: {
            coachId: user.id,
            drillId: input.videoId, // This links to the library item
            comment: { not: null }, // Only get submissions with comments
          },
          include: {
            client: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return comments;
      }),

    getAssignedVideos: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get videos specifically assigned to this client
      return await db.libraryResource.findMany({
        where: {
          assignments: {
            some: {
              clientId: user.id,
            },
          },
          type: "video",
        },
        include: {
          assignments: {
            where: {
              clientId: user.id,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

    getClientAssignedVideos: publicProcedure
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
            message: "Only coaches can view client assigned videos",
          });
        }

        // Verify the client belongs to this coach and get the userId
        const client = await db.client.findFirst({
          where: {
            id: input.clientId,
            coachId: user.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          });
        }

        // If client has a userId, get videos assigned to this specific client
        if (!client.userId) {
          return [];
        }

        return await db.libraryResource.findMany({
          where: {
            assignments: {
              some: {
                clientId: client.userId,
              },
            },
            type: "video",
          },
          include: {
            assignments: {
              where: {
                clientId: client.userId,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      }),

    // New procedure for coaches to assign videos to clients
    assignVideoToClient: publicProcedure
      .input(
        z.object({
          videoId: z.string(),
          clientId: z.string(),
          dueDate: z.date().optional(),
          notes: z.string().optional(),
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
            message: "Only coaches can assign videos",
          });
        }

        // Verify the video belongs to the coach
        const video = await db.libraryResource.findFirst({
          where: {
            id: input.videoId,
            coachId: user.id,
          },
        });

        if (!video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found or you don't own it",
          });
        }

        // Verify the client exists and is assigned to this coach
        const client = await db.client.findFirst({
          where: {
            userId: input.clientId,
            coachId: user.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found or not assigned to you",
          });
        }

        // Create or update the assignment
        const assignment = await db.videoAssignment.upsert({
          where: {
            videoId_clientId: {
              videoId: input.videoId,
              clientId: input.clientId,
            },
          },
          update: {
            dueDate: input.dueDate,
            notes: input.notes,
          },
          create: {
            videoId: input.videoId,
            clientId: input.clientId,
            dueDate: input.dueDate,
            notes: input.notes,
          },
        });

        return assignment;
      }),

    // New procedure for clients to mark videos as completed
    markVideoAsCompleted: publicProcedure
      .input(
        z.object({
          videoId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Update the assignment to mark as completed
        const assignment = await db.videoAssignment.update({
          where: {
            videoId_clientId: {
              videoId: input.videoId,
              clientId: user.id,
            },
          },
          data: {
            completed: true,
            completedAt: new Date(),
          },
        });

        return assignment;
      }),

    // New procedure for coaches to get assignments for a specific client
    getClientAssignments: publicProcedure
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
            message: "Only coaches can view client assignments",
          });
        }

        // Verify the client is assigned to this coach
        const client = await db.client.findFirst({
          where: {
            userId: input.clientId,
            coachId: user.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found or not assigned to you",
          });
        }

        return await db.videoAssignment.findMany({
          where: {
            clientId: input.clientId,
          },
          include: {
            video: true,
          },
          orderBy: { assignedAt: "desc" },
        });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const resource = await db.libraryResource.findUnique({
          where: { id: input.id },
        });

        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          });
        }

        // Only increment views for the resource owner or allow access based on your business logic
        const dbUser = await db.user.findFirst({
          where: { id: user.id },
        });

        if (dbUser?.role === "COACH" && resource.coachId === user.id) {
          await db.libraryResource.update({
            where: { id: input.id },
            data: { views: { increment: 1 } },
          });
        }

        return resource;
      }),

    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().min(1, "Description is required"),
          category: z.string().min(1, "Category is required"),
          type: z.enum(["video", "document"]),
          url: z.string().url(),
          duration: z.string().optional(),
          thumbnail: z.string().optional(),
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
            message: "Only coaches can create library resources",
          });
        }

        const newResource = await db.libraryResource.create({
          data: {
            title: input.title,
            description: input.description,
            category: input.category,
            type: input.type,
            url: input.url,
            duration: input.duration,
            thumbnail: input.thumbnail || "📚",
            coachId: user.id,
            views: 0,
            rating: 0,
          },
        });

        return newResource;
      }),

    upload: publicProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          description: z.string().optional(),
          category: z.enum([
            "Conditioning",
            "Drive",
            "Whip",
            "Separation",
            "Stability",
            "Extension",
          ]),
          fileUrl: z.string().url(),
          filename: z.string(),
          contentType: z.string(),
          size: z.number(),
          thumbnail: z.string().optional(),
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
            message: "Only coaches can upload resources",
          });
        }

        const type = input.contentType.startsWith("video/")
          ? "video"
          : "document";

        const newResource = await db.libraryResource.create({
          data: {
            title: input.title,
            description: input.description || "",
            category: input.category,
            type: type as any,
            url: input.fileUrl,
            filename: input.filename,
            thumbnail: input.thumbnail || (type === "video" ? "🎥" : "📄"),
            coachId: user.id,
            views: 0,
            rating: 0,
          },
        });

        return {
          id: newResource.id,
          message: "Resource uploaded successfully",
          resource: newResource,
        };
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          type: z.enum(["video", "document"]).optional(),
          url: z.string().url().optional(),
          duration: z.string().optional(),
          thumbnail: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const resource = await db.libraryResource.findFirst({
          where: {
            id: input.id,
            coachId: user.id,
          },
        });

        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          });
        }

        const { id, ...updateData } = input;

        const updatedResource = await db.libraryResource.update({
          where: { id: input.id },
          data: updateData,
        });

        return updatedResource;
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const resource = await db.libraryResource.findUnique({
          where: { id: input.id },
        });

        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          });
        }

        if (resource.coachId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own resources",
          });
        }

        if (!resource.isYoutube && resource.url) {
          const fileDeleted = await deleteFileFromUploadThing(resource.url);
          if (!fileDeleted) {
            console.warn(
              `Warning: Could not delete file from UploadThing for resource ${input.id}`
            );
          }
        }

        await db.libraryResource.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: "Resource deleted successfully",
        };
      }),

    rate: publicProcedure
      .input(
        z.object({
          id: z.string(),
          rating: z.number().min(1).max(5),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const resource = await db.libraryResource.findUnique({
          where: { id: input.id },
        });

        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          });
        }

        const updatedResource = await db.libraryResource.update({
          where: { id: input.id },
          data: { rating: input.rating },
        });

        return updatedResource;
      }),

    getCategories: publicProcedure.query(async () => {
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
          message: "Only coaches can view categories",
        });
      }

      const categories = await db.libraryResource.groupBy({
        by: ["category"],
        where: { coachId: user.id },
        _count: { category: true },
      });

      return categories.map(cat => ({
        name: cat.category,
        count: cat._count.category,
      }));
    }),

    importYouTubeVideo: publicProcedure
      .input(
        z.object({
          url: z.string().url(),
          category: z.string().min(1, "Category is required"),
          customTitle: z.string().optional(),
          customDescription: z.string().optional(),
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
            message: "Only coaches can import YouTube videos",
          });
        }

        const videoId = extractYouTubeVideoId(input.url);
        if (!videoId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid YouTube URL",
          });
        }

        const youtubeInfo = await fetchYouTubeVideoInfo(
          videoId,
          process.env.YOUTUBE_API_KEY
        );

        const newResource = await db.libraryResource.create({
          data: {
            title:
              input.customTitle ||
              youtubeInfo?.title ||
              `YouTube Video ${videoId}`,
            description:
              input.customDescription ||
              youtubeInfo?.description ||
              "Imported from YouTube",
            category: input.category,
            type: "video",
            url: input.url,
            youtubeId: videoId,
            thumbnail: youtubeInfo?.thumbnail || getYouTubeThumbnail(videoId),
            duration: youtubeInfo?.duration,
            isYoutube: true,
            coachId: user.id,
            views: 0,
            rating: 0,
          },
        });

        return newResource;
      }),

    importYouTubePlaylist: publicProcedure
      .input(
        z.object({
          playlistUrl: z.string().url(),
          category: z.string().min(1, "Category is required"),
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
            message: "Only coaches can import YouTube playlists",
          });
        }

        const playlistId = extractPlaylistId(input.playlistUrl);
        if (!playlistId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid YouTube playlist URL",
          });
        }

        const videos = await fetchPlaylistVideos(
          playlistId,
          process.env.YOUTUBE_API_KEY
        );

        if (videos.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No videos found in playlist or API key not configured",
          });
        }

        const createdResources = await Promise.all(
          videos.map(async (video: any) => {
            return await db.libraryResource.create({
              data: {
                title: video.title,
                description:
                  video.description || "Imported from YouTube playlist",
                category: input.category,
                type: "video",
                url: `https://www.youtube.com/watch?v=${video.videoId}`,
                youtubeId: video.videoId,
                playlistId: playlistId,
                thumbnail:
                  video.thumbnail || getYouTubeThumbnail(video.videoId),
                isYoutube: true,
                coachId: user.id,
                views: 0,
                rating: 0,
              },
            });
          })
        );

        return {
          success: true,
          imported: createdResources.length,
          resources: createdResources,
        };
      }),

    getClientVideoSubmissions: publicProcedure.query(async () => {
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
          message: "Only coaches can view client video submissions",
        });
      }

      // Get client video submissions for this coach
      const submissions = await db.clientVideoSubmission.findMany({
        where: {
          coachId: user.id,
          isPublic: true, // Only show public submissions in library
        },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
          drill: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return submissions;
    }),
  }),

  messaging: router({
    getConversations: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const userRole = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      if (!userRole?.role) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get conversations based on user role
      let conversations;

      if (userRole.role === "COACH") {
        // Coaches see all conversations with their clients
        conversations = await db.conversation.findMany({
          where: {
            type: "COACH_CLIENT",
            coachId: user.id,
          },
          include: {
            coach: {
              select: {
                id: true,
                name: true,
                email: true,
                settings: { select: { avatarUrl: true } },
              },
            },
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                settings: { select: { avatarUrl: true } },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                sender: { select: { id: true, name: true } },
              },
            },
            _count: {
              select: {
                messages: {
                  where: {
                    isRead: false,
                    senderId: { not: user.id },
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 50, // Limit for coaches
        });
      } else {
        // Clients see conversations with their coach AND other clients with the same coach
        const client = await db.client.findFirst({
          where: { userId: user.id },
          select: { coachId: true },
        });

        if (!client)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client profile not found",
          });

        // Get coach-client conversations
        const coachClientConversations = await db.conversation.findMany({
          where: {
            type: "COACH_CLIENT",
            clientId: user.id,
          },
          include: {
            coach: {
              select: {
                id: true,
                name: true,
                email: true,
                settings: { select: { avatarUrl: true } },
              },
            },
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                settings: { select: { avatarUrl: true } },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                sender: { select: { id: true, name: true } },
              },
            },
            _count: {
              select: {
                messages: {
                  where: {
                    isRead: false,
                    senderId: { not: user.id },
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        });

        // Get client-client conversations where this user is either client1 or client2
        const clientClientConversations = await db.conversation.findMany({
          where: {
            type: "CLIENT_CLIENT",
            OR: [{ client1Id: user.id }, { client2Id: user.id }],
          },
          include: {
            client1: {
              select: {
                id: true,
                name: true,
                email: true,
                settings: { select: { avatarUrl: true } },
              },
            },
            client2: {
              select: {
                id: true,
                name: true,
                email: true,
                settings: { select: { avatarUrl: true } },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                sender: { select: { id: true, name: true } },
              },
            },
            _count: {
              select: {
                messages: {
                  where: {
                    isRead: false,
                    senderId: { not: user.id },
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        });

        conversations = [
          ...coachClientConversations,
          ...clientClientConversations,
        ];
      }

      return conversations;
    }),

    getMessages: publicProcedure
      .input(z.object({ conversationId: z.string() }))
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const conversation = await db.conversation.findFirst({
          where: {
            id: input.conversationId,
            OR: [
              { coachId: user.id },
              { clientId: user.id },
              { client1Id: user.id },
              { client2Id: user.id },
            ],
          },
        });

        if (!conversation) throw new TRPCError({ code: "FORBIDDEN" });

        const messages = await db.message.findMany({
          where: { conversationId: input.conversationId },
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        });

        await db.message.updateMany({
          where: {
            conversationId: input.conversationId,
            senderId: { not: user.id },
            isRead: false,
          },
          data: { isRead: true },
        });

        return messages;
      }),

    sendMessage: publicProcedure
      .input(
        z
          .object({
            conversationId: z.string(),
            content: z.string().max(1000),
            attachmentUrl: z.string().optional(),
            attachmentType: z.string().optional(),
            attachmentName: z.string().optional(),
            attachmentSize: z.number().optional(),
          })
          .refine(
            data => {
              // Either content must have at least 1 character OR there must be an attachment
              return data.content.length > 0 || data.attachmentUrl;
            },
            {
              message:
                "Message must contain either text content or a file attachment",
              path: ["content"],
            }
          )
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const conversation = await db.conversation.findFirst({
          where: {
            id: input.conversationId,
            OR: [
              { coachId: user.id },
              { clientId: user.id },
              { client1Id: user.id },
              { client2Id: user.id },
            ],
          },
        });

        if (!conversation) throw new TRPCError({ code: "FORBIDDEN" });

        const message = await db.message.create({
          data: {
            conversationId: input.conversationId,
            senderId: user.id,
            content: input.content,
            attachmentUrl: input.attachmentUrl,
            attachmentType: input.attachmentType,
            attachmentName: input.attachmentName,
            attachmentSize: input.attachmentSize,
          },
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
        });

        await db.conversation.update({
          where: { id: input.conversationId },
          data: { updatedAt: new Date() },
        });

        return message;
      }),

    createConversation: publicProcedure
      .input(
        z.object({
          otherUserId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const currentUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        const otherUser = await db.user.findUnique({
          where: { id: input.otherUserId },
          select: { role: true },
        });

        if (!currentUser?.role || !otherUser?.role) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid users",
          });
        }

        let coachId: string, clientId: string;

        if (currentUser.role === "COACH" && otherUser.role === "CLIENT") {
          coachId = user.id;
          clientId = input.otherUserId;
        } else if (
          currentUser.role === "CLIENT" &&
          otherUser.role === "COACH"
        ) {
          coachId = input.otherUserId;
          clientId = user.id;
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only create conversations between coach and client",
          });
        }

        const existingConversation = await db.conversation.findUnique({
          where: {
            coachId_clientId: {
              coachId,
              clientId,
            },
          },
        });

        if (existingConversation) {
          return existingConversation;
        }

        const conversation = await db.conversation.create({
          data: { coachId, clientId },
          include: {
            coach: { select: { id: true, name: true, email: true } },
            client: { select: { id: true, name: true, email: true } },
          },
        });

        return conversation;
      }),

    createConversationWithClient: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Verify current user is a COACH
        const currentUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (currentUser?.role !== "COACH") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can create conversations with clients",
          });
        }

        // Get the client
        const client = await db.client.findUnique({
          where: { id: input.clientId },
          select: {
            id: true,
            name: true,
            email: true,
            userId: true,
            coachId: true,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          });
        }

        // Verify the client belongs to this coach
        if (client.coachId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Client not found",
          });
        }

        let clientUserId: string;

        // If client doesn't have a user account, create one
        if (!client.userId) {
          const newClientUser = await db.user.create({
            data: {
              email: client.email || `client-${client.id}@placeholder.com`,
              name: client.name,
              role: "CLIENT",
            },
          });

          // Update the client to link to the new user
          await db.client.update({
            where: { id: client.id },
            data: { userId: newClientUser.id },
          });

          clientUserId = newClientUser.id;
        } else {
          clientUserId = client.userId;
        }

        // Check if conversation already exists
        const existingConversation = await db.conversation.findUnique({
          where: {
            coachId_clientId: {
              coachId: user.id,
              clientId: clientUserId,
            },
          },
        });

        if (existingConversation) {
          return existingConversation;
        }

        // Create the conversation
        const conversation = await db.conversation.create({
          data: {
            coachId: user.id,
            clientId: clientUserId,
          },
          include: {
            coach: { select: { id: true, name: true, email: true } },
            client: { select: { id: true, name: true, email: true } },
          },
        });

        return conversation;
      }),

    createConversationWithAnotherClient: publicProcedure
      .input(
        z.object({
          otherClientId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Verify current user is a CLIENT
        const currentUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (currentUser?.role !== "CLIENT") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only clients can create conversations with other clients",
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

        // Get the other client and verify they have the same coach
        const otherClient = await db.client.findFirst({
          where: {
            id: input.otherClientId,
            coachId: currentClient.coachId, // Must have same coach
          },
          select: {
            id: true,
            userId: true,
            coachId: true,
          },
        });

        if (!otherClient) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Other client not found or doesn't share the same coach",
          });
        }

        if (!otherClient.userId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Other client doesn't have a user account. They need to create an account first to receive messages.",
          });
        }

        // Ensure we order the client IDs consistently to avoid duplicates
        const client1Id =
          user.id < otherClient.userId ? user.id : otherClient.userId;
        const client2Id =
          user.id < otherClient.userId ? otherClient.userId : user.id;

        // Check if conversation already exists
        const existingConversation = await db.conversation.findUnique({
          where: {
            client1Id_client2Id: {
              client1Id,
              client2Id,
            },
          },
        });

        if (existingConversation) {
          return existingConversation;
        }

        // Create the conversation
        const conversation = await db.conversation.create({
          data: {
            type: "CLIENT_CLIENT",
            client1Id,
            client2Id,
          },
          include: {
            client1: { select: { id: true, name: true, email: true } },
            client2: { select: { id: true, name: true, email: true } },
          },
        });

        return conversation;
      }),

    getConversation: publicProcedure
      .input(z.object({ conversationId: z.string() }))
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const conversation = await db.conversation.findFirst({
          where: {
            id: input.conversationId,
            OR: [{ coachId: user.id }, { clientId: user.id }],
          },
          include: {
            coach: { select: { id: true, name: true, email: true } },
            client: { select: { id: true, name: true, email: true } },
          },
        });

        if (!conversation) throw new TRPCError({ code: "FORBIDDEN" });

        return conversation;
      }),

    markAsRead: publicProcedure
      .input(z.object({ conversationId: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Verify user has access to this conversation
        const conversation = await db.conversation.findFirst({
          where: {
            id: input.conversationId,
            OR: [{ coachId: user.id }, { clientId: user.id }],
          },
        });

        if (!conversation) throw new TRPCError({ code: "FORBIDDEN" });

        // Mark all unread messages as read
        await db.message.updateMany({
          where: {
            conversationId: input.conversationId,
            senderId: { not: user.id },
            isRead: false,
          },
          data: { isRead: true },
        });

        return { success: true };
      }),

    deleteConversation: publicProcedure
      .input(z.object({ conversationId: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Verify user has access to this conversation
        const conversation = await db.conversation.findFirst({
          where: {
            id: input.conversationId,
            OR: [{ coachId: user.id }, { clientId: user.id }],
          },
        });

        if (!conversation) throw new TRPCError({ code: "FORBIDDEN" });

        // Delete the conversation and all its messages
        await db.conversation.delete({
          where: { id: input.conversationId },
        });

        return { success: true };
      }),

    getUnreadCount: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const unreadCount = await db.message.count({
        where: {
          isRead: false,
          senderId: { not: user.id },
          conversation: {
            OR: [{ coachId: user.id }, { clientId: user.id }],
          },
        },
      });

      return unreadCount;
    }),
  }),

  workouts: router({
    getTodaysWorkouts: publicProcedure.query(async () => {
      try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();
        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        console.log("Getting today's program for user:", user.id);

        // Verify user is a CLIENT
        const dbUser = await db.user.findFirst({
          where: { id: user.id, role: "CLIENT" },
        });

        if (!dbUser) {
          console.log("User is not a CLIENT");
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only clients can access this endpoint",
          });
        }

        // First, find the client record for this user
        const client = await db.client.findFirst({
          where: { userId: user.id },
          include: {
            coach: true,
          },
        });

        console.log(
          "Client found:",
          client?.id,
          client?.name,
          "Coach:",
          client?.coach?.name
        );

        if (!client) {
          console.log("No client record found for user:", user.id);
          return [];
        }

        // Get the client's assigned program
        const programAssignment = await db.programAssignment.findFirst({
          where: {
            clientId: client.id,
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
          },
        });

        console.log(
          "Program assignment found:",
          programAssignment?.id,
          programAssignment?.program?.title
        );

        if (!programAssignment) {
          console.log("No program assigned to client");
          return [];
        }

        // Calculate which week and day we're on based on start date
        const startDate =
          programAssignment.startDate || programAssignment.assignedAt;
        const today = new Date();
        const daysSinceStart = Math.floor(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const currentWeek = Math.floor(daysSinceStart / 7) + 1;
        const currentDay = (daysSinceStart % 7) + 1;

        console.log("Program progress:", {
          daysSinceStart,
          currentWeek,
          currentDay,
        });

        // Get today's program day
        const currentWeekData = programAssignment.program.weeks.find(
          w => w.weekNumber === currentWeek
        );
        if (!currentWeekData) {
          console.log("No week data found for week:", currentWeek);
          return [];
        }

        const todayProgramDay = currentWeekData.days.find(
          d => d.dayNumber === currentDay
        );
        if (!todayProgramDay) {
          console.log("No day data found for day:", currentDay);
          return [];
        }

        console.log(
          "Today's program day:",
          todayProgramDay.title,
          "Drills:",
          todayProgramDay.drills.length
        );

        // Return the drills for today as "workouts"
        return todayProgramDay.drills.map(drill => ({
          id: drill.id,
          title: drill.title,
          description: drill.description,
          duration: drill.duration,
          completed: false, // We'll track this separately
          template: null, // Not using workout templates for program drills
        }));
      } catch (error) {
        console.error("Get today's program error:", error);
        return [];
      }
    }),

    // Debug endpoint to see what's in the database
    debugWorkouts: publicProcedure.query(async () => {
      try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();
        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Get all clients
        const allClients = await db.client.findMany({
          include: {
            coach: true,
          },
        });

        // Get all program assignments
        const allProgramAssignments = await db.programAssignment.findMany({
          include: {
            client: true,
            program: true,
          },
        });

        // Get all assigned workouts
        const allWorkouts = await db.assignedWorkout.findMany({
          include: {
            client: true,
            coach: true,
            template: true,
          },
        });

        return {
          user: { id: user.id, email: user.email },
          clients: allClients,
          programAssignments: allProgramAssignments,
          workouts: allWorkouts,
        };
      } catch (error) {
        console.error("Debug endpoint error:", error);
        return {
          user: { id: "error", email: "error" },
          clients: [],
          programAssignments: [],
          workouts: [],
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

    getClientWorkouts: publicProcedure
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
            message: "Only coaches can view client workouts",
          });
        }

        // Verify the client belongs to this coach and get the userId
        const client = await db.client.findFirst({
          where: {
            id: input.clientId,
            coachId: user.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          });
        }

        // If client has a userId, use that for workouts, otherwise return empty array
        if (!client.userId) {
          return [];
        }

        return await db.workout.findMany({
          where: {
            clientId: client.userId,
          },
          orderBy: { date: "desc" },
        });
      }),

    markComplete: publicProcedure
      .input(
        z.object({
          workoutId: z.string(),
          completed: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
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
            message: "Only clients can mark workouts as complete",
          });
        }

        // Find the client record for this user
        const client = await db.client.findFirst({
          where: { userId: user.id },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client record not found",
          });
        }

        // Find the assigned workout
        const assignedWorkout = await db.assignedWorkout.findFirst({
          where: {
            id: input.workoutId,
            clientId: client.id,
          },
        });

        if (!assignedWorkout) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workout not found or not assigned to you",
          });
        }

        // Update the workout completion status
        const updatedWorkout = await db.assignedWorkout.update({
          where: { id: input.workoutId },
          data: {
            completed: input.completed,
            completedAt: input.completed ? new Date() : null,
          },
        });

        return updatedWorkout;
      }),
  }),

  progress: router({
    getClientProgress: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Example: Fetch streak and skill progress for the client
      // Replace with your actual logic
      return {
        currentStreak: 5,
        streakPercentage: 80,
        skills: [
          { name: "Speed", progress: 78 },
          { name: "Endurance", progress: 65 },
          { name: "Technique", progress: 82 },
        ],
      };
    }),

    getClientProgressById: publicProcedure
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
            message: "Only coaches can view client progress",
          });
        }

        // Verify the client belongs to this coach and get the userId
        const client = await db.client.findFirst({
          where: {
            id: input.clientId,
            coachId: user.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          });
        }

        // If client has a userId, fetch progress data, otherwise return empty data
        if (!client.userId) {
          return {
            currentStreak: 0,
            streakPercentage: 0,
            skills: [],
          };
        }

        // Example: Fetch progress data for the specific client
        // Replace with your actual progress logic
        return {
          currentStreak: 5,
          streakPercentage: 80,
          skills: [
            { name: "Speed", progress: 78 },
            { name: "Endurance", progress: 65 },
            { name: "Technique", progress: 82 },
          ],
        };
      }),
  }),

  events: router({
    getUpcoming: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Example: Fetch upcoming events for the client
      // Replace with your actual logic
      return await db.event.findMany({
        where: {
          clientId: user.id, // Changed from userId to clientId
          date: { gte: new Date() },
        },
        orderBy: { date: "asc" },
      });
    }),

    createConfirmationToken: publicProcedure
      .input(z.object({ lessonId: z.string() }))
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
            message: "Only coaches can create lesson confirmation tokens",
          });
        }

        // Find the lesson and verify it belongs to this coach
        const lesson = await db.event.findFirst({
          where: {
            id: input.lessonId,
            coachId: user.id,
          },
          include: {
            client: true,
          },
        });

        if (!lesson) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lesson not found",
          });
        }

        // Import the JWT utility
        const { createLessonToken } = await import("@/lib/jwt");

        // Create the confirmation token
        const token = await createLessonToken({
          lessonId: lesson.id,
          clientId: lesson.clientId,
          coachId: lesson.coachId,
        });

        return {
          token,
          confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/lesson/confirm/${token}`,
        };
      }),
  }),

  workoutTemplates: router({
    // Get all workout templates for a coach
    list: publicProcedure.query(async () => {
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
          message: "Only coaches can view workout templates",
        });
      }

      return (await db.workoutTemplate.findMany({
        where: { coachId: user.id },
        orderBy: { createdAt: "desc" },
      })) as any; // or create a specific type
    }),

    // Create a new workout template
    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          exercises: z.array(
            z.object({
              name: z.string(),
              sets: z.number(),
              reps: z.string(),
              weight: z.string().optional(),
              notes: z.string().optional(),
            })
          ),
          duration: z.string().optional(),
          difficulty: z.string().optional(),
          category: z.string().optional(),
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
            message: "Only coaches can create workout templates",
          });
        }

        return await db.workoutTemplate.create({
          data: {
            ...input,
            exercises: input.exercises as any,
            coachId: user.id,
          },
        });
      }),

    // Copy a workout template to create a new one
    copy: publicProcedure
      .input(z.object({ templateId: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const originalTemplate = await db.workoutTemplate.findFirst({
          where: {
            id: input.templateId,
            coachId: user.id,
          },
        });

        if (!originalTemplate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        return await db.workoutTemplate.create({
          data: {
            title: `${originalTemplate.title} (Copy)`,
            description: originalTemplate.description,
            exercises: originalTemplate.exercises as any,
            duration: originalTemplate.duration,
            difficulty: originalTemplate.difficulty,
            category: originalTemplate.category,
            coachId: user.id,
          },
        });
      }),
  }),

  scheduling: router({
    // Schedule a lesson for a client
    scheduleLesson: publicProcedure
      .input(
        z.object({
          clientId: z.string(), // This is Client.id
          lessonDate: z.string(), // Changed from z.date() to z.string()
          sendEmail: z.boolean().optional(),
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

        // Verify the client belongs to this coach
        const client = await db.client.findFirst({
          where: {
            id: input.clientId,
            coachId: user.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found or not assigned to you",
          });
        }

        // Convert string to Date object
        const lessonDate = new Date(input.lessonDate);

        // Validate the date
        if (isNaN(lessonDate.getTime())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid date format",
          });
        }

        // Check if the lesson is in the past
        const now = new Date();
        if (lessonDate <= now) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot schedule lessons in the past",
          });
        }

        // Create the lesson (using Event model) - automatically CONFIRMED when coach schedules
        const lesson = await db.event.create({
          data: {
            title: `Lesson with ${client.name || client.email || "Client"}`,
            description: "Scheduled lesson",
            date: lessonDate,
            status: "CONFIRMED", // Coach-scheduled lessons are automatically confirmed
            clientId: input.clientId, // Use Client.id directly
            coachId: user.id,
          },
        });

        // Update client's next lesson date
        await db.client.update({
          where: { id: input.clientId },
          data: { nextLessonDate: lessonDate },
        });

        // Create notification for the client
        if (client.userId) {
          await db.notification.create({
            data: {
              userId: client.userId,
              type: "LESSON_SCHEDULED",
              title: "New Lesson Scheduled",
              message: `Your coach has scheduled a lesson for ${format(
                lessonDate,
                "MMM d, yyyy 'at' h:mm a"
              )}`,
            },
          });
        }

        // TODO: Send email notification if requested
        if (input.sendEmail && client.email) {
          // This would integrate with your email service
          // For now, we'll just log it
          console.log(
            `Email notification would be sent to ${client.email} for lesson on ${lessonDate}`
          );
        }

        return lesson;
      }),

    // Get weekly schedule for a client
    getWeeklySchedule: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          weekStart: z.date(),
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
            message: "Only coaches can view schedules",
          });
        }

        const weekEnd = new Date(input.weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        return await db.weeklySchedule.findFirst({
          where: {
            clientId: input.clientId,
            coachId: user.id,
            weekStart: input.weekStart,
            weekEnd: weekEnd,
          },
          include: {
            days: {
              include: {
                workoutTemplate: true,
                videoAssignments: {
                  include: {
                    video: true,
                  },
                },
              },
              orderBy: { dayOfWeek: "asc" },
            },
          },
        });
      }),

    // Create or update weekly schedule
    updateWeeklySchedule: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          weekStart: z.date(),
          days: z.array(
            z.object({
              dayOfWeek: z.number(),
              workoutTemplateId: z.string().optional(),
              title: z.string(),
              description: z.string().optional(),
              exercises: z
                .array(
                  z.object({
                    name: z.string(),
                    sets: z.number(),
                    reps: z.string(),
                    weight: z.string().optional(),
                    notes: z.string().optional(),
                  })
                )
                .optional(),
              duration: z.string().optional(),
              videoIds: z.array(z.string()).optional(),
            })
          ),
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
            message: "Only coaches can update schedules",
          });
        }

        const weekEnd = new Date(input.weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Use transaction to ensure data consistency
        return await db.$transaction(async tx => {
          // Create or update weekly schedule
          const weeklySchedule = await tx.weeklySchedule.upsert({
            where: {
              clientId_coachId_weekStart: {
                clientId: input.clientId,
                coachId: user.id,
                weekStart: input.weekStart,
              },
            },
            update: {},
            create: {
              clientId: input.clientId,
              coachId: user.id,
              weekStart: input.weekStart,
              weekEnd: weekEnd,
            },
          });

          // Delete existing days
          await tx.scheduledDay.deleteMany({
            where: { weeklyScheduleId: weeklySchedule.id },
          });

          // Create new days
          const createdDays = await Promise.all(
            input.days.map(async day => {
              const createdDay = await tx.scheduledDay.create({
                data: {
                  weeklyScheduleId: weeklySchedule.id,
                  dayOfWeek: day.dayOfWeek,
                  workoutTemplateId: day.workoutTemplateId,
                  title: day.title,
                  description: day.description,
                  exercises: day.exercises as any,
                  duration: day.duration,
                },
              });

              // Assign videos if provided
              if (day.videoIds && day.videoIds.length > 0) {
                await Promise.all(
                  day.videoIds.map(videoId =>
                    tx.videoAssignment.upsert({
                      where: {
                        videoId_clientId: {
                          videoId: videoId,
                          clientId: input.clientId,
                        },
                      },
                      update: {
                        scheduledDayId: createdDay.id,
                      },
                      create: {
                        videoId: videoId,
                        clientId: input.clientId,
                        scheduledDayId: createdDay.id,
                        assignedAt: new Date(),
                      },
                    })
                  )
                );
              }

              return createdDay;
            })
          );

          return {
            weeklySchedule,
            days: createdDays,
          };
        });
      }),

    // Copy previous week's schedule to current week
    copyPreviousWeek: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          currentWeekStart: z.date(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Calculate previous week start
        const previousWeekStart = new Date(input.currentWeekStart);
        previousWeekStart.setDate(previousWeekStart.getDate() - 7);

        const previousWeekEnd = new Date(previousWeekStart);
        previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);

        // Get previous week's schedule
        const previousSchedule = await db.weeklySchedule.findFirst({
          where: {
            clientId: input.clientId,
            coachId: user.id,
            weekStart: previousWeekStart,
            weekEnd: previousWeekEnd,
          },
          include: {
            days: {
              include: {
                videoAssignments: true,
              },
            },
          },
        });

        if (!previousSchedule) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No previous week schedule found to copy",
          });
        }

        // Copy to current week
        const currentWeekEnd = new Date(input.currentWeekStart);
        currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

        return await db.$transaction(async tx => {
          const newSchedule = await tx.weeklySchedule.create({
            data: {
              clientId: input.clientId,
              coachId: user.id,
              weekStart: input.currentWeekStart,
              weekEnd: currentWeekEnd,
            },
          });

          const copiedDays = await Promise.all(
            previousSchedule.days.map(async day => {
              const newDay = await tx.scheduledDay.create({
                data: {
                  weeklyScheduleId: newSchedule.id,
                  dayOfWeek: day.dayOfWeek,
                  workoutTemplateId: day.workoutTemplateId,
                  title: day.title,
                  description: day.description,
                  exercises: day.exercises as any,
                  duration: day.duration,
                },
              });

              // Copy video assignments
              if (day.videoAssignments.length > 0) {
                await Promise.all(
                  day.videoAssignments.map(assignment =>
                    tx.videoAssignment.create({
                      data: {
                        videoId: assignment.videoId,
                        clientId: assignment.clientId,
                        scheduledDayId: newDay.id,
                        assignedAt: new Date(),
                        dueDate: assignment.dueDate,
                        notes: assignment.notes,
                      },
                    })
                  )
                );
              }

              return newDay;
            })
          );

          return {
            weeklySchedule: newSchedule,
            days: copiedDays,
          };
        });
      }),

    // Get coach's schedule for a specific month
    getCoachSchedule: publicProcedure
      .input(
        z.object({
          month: z.number(),
          year: z.number(),
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
            message: "Only coaches can view their schedule",
          });
        }

        // Calculate month start and end dates
        const monthStart = new Date(input.year, input.month, 1);
        const monthEnd = new Date(input.year, input.month + 1, 0, 23, 59, 59);
        const now = new Date();

        // Get all CONFIRMED events (lessons) for the coach in the specified month
        const events = await db.event.findMany({
          where: {
            coachId: user.id,
            status: "CONFIRMED", // Only return confirmed lessons
            date: {
              gte: monthStart,
              lte: monthEnd,
              gt: now, // Only return future lessons
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
          },
          orderBy: {
            date: "asc",
          },
        });

        return events;
      }),

    // Delete a lesson
    deleteLesson: publicProcedure
      .input(
        z.object({
          lessonId: z.string(),
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
            message: "Only coaches can delete lessons",
          });
        }

        // Find the lesson and verify it belongs to this coach
        const lesson = await db.event.findFirst({
          where: {
            id: input.lessonId,
            coachId: user.id,
          },
        });

        if (!lesson) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Lesson not found or you don't have permission to delete it",
          });
        }

        // Delete the lesson
        await db.event.delete({
          where: {
            id: input.lessonId,
          },
        });

        return { success: true };
      }),

    // Get upcoming lessons for the coach
    getCoachUpcomingLessons: publicProcedure.query(async () => {
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
          message: "Only coaches can view their lessons",
        });
      }

      const now = new Date();

      // Get upcoming lessons for this coach
      const upcomingLessons = await db.event.findMany({
        where: {
          coachId: user.id,
          date: {
            gte: now.toISOString(),
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
        },
        orderBy: {
          date: "asc",
        },
        take: 10, // Limit to next 10 lessons
      });

      return upcomingLessons;
    }),
  }),

  programs: router({
    // Get all programs for the coach
    list: publicProcedure.query(async () => {
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
          message: "Only coaches can view programs",
        });
      }

      // Get all programs created by this coach
      const programs = await db.program.findMany({
        where: { coachId: user.id },
        include: {
          // Include client assignments to count active clients
          assignments: {
            where: {
              // Only count active assignments (not completed)
              completedAt: null,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transform to include active client count
      return programs.map(program => ({
        id: program.id,
        title: program.title,
        description: program.description,
        activeClientCount: program.assignments.length,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt,
      }));
    }),

    // Create a new program
    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1, "Program title is required"),
          description: z.string().optional(),
          level: z.enum([
            "Drive",
            "Whip",
            "Separation",
            "Stability",
            "Extension",
          ]),
          duration: z.number().min(1, "Duration must be at least 1 week"),
          weeks: z.array(
            z.object({
              weekNumber: z.number(),
              title: z.string().min(1, "Week title is required"),
              description: z.string().optional(),
              days: z.array(
                z.object({
                  dayNumber: z.number(),
                  title: z.string().min(1, "Day title is required"),
                  description: z.string().optional(),
                  drills: z.array(
                    z.object({
                      order: z.number(),
                      title: z.string().min(1, "Drill title is required"),
                      description: z.string().optional(),
                      duration: z.string().optional(),
                      videoUrl: z.string().optional(),
                      notes: z.string().optional(),
                      sets: z.number().optional(),
                      reps: z.number().optional(),
                      tempo: z.string().optional(),
                    })
                  ),
                })
              ),
            })
          ),
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
            message: "Only coaches can create programs",
          });
        }

        // Create the program with all its structure
        const program = await db.program.create({
          data: {
            title: input.title,
            description: input.description || "",
            sport: "General", // Default value since sport field is removed from UI
            level: input.level,
            duration: input.duration,
            coachId: user.id,
            weeks: {
              create: input.weeks.map(week => ({
                weekNumber: week.weekNumber,
                title: week.title,
                description: week.description || "",
                days: {
                  create: week.days.map(day => {
                    // Check if this is a rest day (only has one drill with "Rest Day" title)
                    const isRestDay =
                      day.drills.length === 1 &&
                      day.drills[0].title === "Rest Day";

                    return {
                      dayNumber: day.dayNumber,
                      title: day.title,
                      description: day.description || "",
                      isRestDay: isRestDay,
                      drills: {
                        create: day.drills.map(drill => ({
                          order: drill.order,
                          title: drill.title,
                          description: drill.description || "",
                          duration: drill.duration || "",
                          videoUrl: drill.videoUrl || "",
                          notes: drill.notes || "",
                          sets: null, // Optional field, set to null if not provided
                          reps: null, // Optional field, set to null if not provided
                          tempo: null, // Optional field, set to null if not provided
                        })),
                      },
                    };
                  }),
                },
              })),
            },
          },
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
        });

        return program;
      }),

    // Get a specific program
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
            message: "Only coaches can view programs",
          });
        }

        // Get the program
        const program = await db.program.findFirst({
          where: {
            id: input.id,
            coachId: user.id, // Ensure coach owns this program
          },
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
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Program not found",
          });
        }

        return program;
      }),

    // Update a program
    update: publicProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
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
            message: "Only coaches can update programs",
          });
        }

        // Update the program
        const program = await db.program.update({
          where: {
            id: input.id,
            coachId: user.id, // Ensure coach owns this program
          },
          data: {
            ...(input.title && { title: input.title }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
          },
        });

        return program;
      }),

    // Duplicate a program
    duplicate: publicProcedure
      .input(z.object({ id: z.string() }))
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
            message: "Only coaches can duplicate programs",
          });
        }

        // Get the original program
        const originalProgram = await db.program.findFirst({
          where: {
            id: input.id,
            coachId: user.id,
          },
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
        });

        if (!originalProgram) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Program not found",
          });
        }

        // Create the duplicated program
        const duplicatedProgram = await db.program.create({
          data: {
            title: `${originalProgram.title} (Copy)`,
            description: originalProgram.description,
            sport: originalProgram.sport,
            level: originalProgram.level,
            duration: originalProgram.duration,
            coachId: user.id,
          },
        });

        // Duplicate weeks and days
        for (const week of originalProgram.weeks) {
          const duplicatedWeek = await db.programWeek.create({
            data: {
              weekNumber: week.weekNumber,
              title: week.title,
              description: week.description,
              programId: duplicatedProgram.id,
            },
          });

          // Duplicate days
          for (const day of week.days) {
            const duplicatedDay = await db.programDay.create({
              data: {
                dayNumber: day.dayNumber,
                title: day.title,
                description: day.description,
                weekId: duplicatedWeek.id,
              },
            });

            // Duplicate drills
            for (const drill of day.drills) {
              await db.programDrill.create({
                data: {
                  order: drill.order,
                  title: drill.title,
                  description: drill.description,
                  duration: drill.duration,
                  videoUrl: drill.videoUrl,
                  notes: drill.notes,
                  dayId: duplicatedDay.id,
                },
              });
            }
          }
        }

        return duplicatedProgram;
      }),

    // Delete a program
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
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
            message: "Only coaches can delete programs",
          });
        }

        // Check if program exists and belongs to coach
        const program = await db.program.findFirst({
          where: {
            id: input.id,
            coachId: user.id,
          },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Program not found or you don't have permission to delete it",
          });
        }

        // Delete the program (cascade will handle related records)
        await db.program.delete({
          where: {
            id: input.id,
          },
        });

        return { success: true };
      }),

    // Get active client count for a program
    getActiveClientCount: publicProcedure
      .input(z.object({ programId: z.string() }))
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
            message: "Only coaches can view program statistics",
          });
        }

        // Count active client assignments for this program (excluding archived clients)
        const count = await db.programAssignment.count({
          where: {
            programId: input.programId,
            completedAt: null, // Not completed = active
            client: {
              archived: false, // Exclude archived clients
            },
          },
        });

        return count;
      }),

    // Update program week (for autosave functionality)
    updateWeek: publicProcedure
      .input(
        z.object({
          programId: z.string(),
          weekNumber: z.number(),
          days: z.array(
            z.object({
              dayNumber: z.number(),
              title: z.string(),
              description: z.string().optional(),
              isRestDay: z.boolean().optional(),
              warmupTitle: z.string().optional(),
              warmupDescription: z.string().optional(),
              drills: z.array(
                z.object({
                  id: z.string().optional(), // Optional for new drills
                  order: z.number(),
                  title: z.string(),
                  description: z.string().optional(),
                  duration: z.string().optional(),
                  videoUrl: z.string().optional(),
                  notes: z.string().optional(),
                  sets: z.number().optional(),
                  reps: z.number().optional(),
                  tempo: z.string().optional(),
                  supersetWithId: z.string().optional(),
                })
              ),
            })
          ),
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
            message: "Only coaches can update programs",
          });
        }

        // Verify program exists and belongs to coach
        const program = await db.program.findFirst({
          where: {
            id: input.programId,
            coachId: user.id,
          },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Program not found",
          });
        }

        // Find or create the week
        let week = await db.programWeek.findFirst({
          where: {
            programId: input.programId,
            weekNumber: input.weekNumber,
          },
        });

        if (!week) {
          week = await db.programWeek.create({
            data: {
              programId: input.programId,
              weekNumber: input.weekNumber,
              title: `Week ${input.weekNumber}`,
            },
          });
        }

        // Update each day
        for (const dayData of input.days) {
          // Find or create the day
          let day = await db.programDay.findFirst({
            where: {
              weekId: week.id,
              dayNumber: dayData.dayNumber,
            },
          });

          if (!day) {
            day = await db.programDay.create({
              data: {
                weekId: week.id,
                dayNumber: dayData.dayNumber,
                title: dayData.title,
                description: dayData.description || "",
                isRestDay: dayData.isRestDay || false,
                warmupTitle: dayData.warmupTitle || "",
                warmupDescription: dayData.warmupDescription || "",
              },
            });
          } else {
            // Update existing day
            await db.programDay.update({
              where: { id: day.id },
              data: {
                title: dayData.title,
                description: dayData.description || "",
                isRestDay: dayData.isRestDay || false,
                warmupTitle: dayData.warmupTitle || "",
                warmupDescription: dayData.warmupDescription || "",
              },
            });
          }

          // Clear existing drills and recreate them
          await db.programDrill.deleteMany({
            where: { dayId: day.id },
          });

          // Create new drills
          for (const drillData of dayData.drills) {
            await db.programDrill.create({
              data: {
                dayId: day.id,
                order: drillData.order,
                title: drillData.title,
                description: drillData.description || "",
                duration: drillData.duration || "",
                videoUrl: drillData.videoUrl || "",
                notes: drillData.notes || "",
                sets: drillData.sets || 0,
                reps: drillData.reps || 0,
                tempo: drillData.tempo || "",
                supersetWithId: drillData.supersetWithId || "",
              },
            });
          }
        }

        return { success: true };
      }),

    // Add exercise to a day
    addExercise: publicProcedure
      .input(
        z.object({
          programId: z.string(),
          weekNumber: z.number(),
          dayNumber: z.number(),
          title: z.string(),
          description: z.string().optional(),
          duration: z.string().optional(),
          videoUrl: z.string().optional(),
          notes: z.string().optional(),
          sets: z.number().optional(),
          reps: z.number().optional(),
          tempo: z.string().optional(),
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
            message: "Only coaches can add exercises",
          });
        }

        // Verify program exists and belongs to coach
        const program = await db.program.findFirst({
          where: {
            id: input.programId,
            coachId: user.id,
          },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Program not found",
          });
        }

        // Find the week
        let week = await db.programWeek.findFirst({
          where: {
            programId: input.programId,
            weekNumber: input.weekNumber,
          },
        });

        if (!week) {
          // Create the week if it doesn't exist
          week = await db.programWeek.create({
            data: {
              programId: input.programId,
              weekNumber: input.weekNumber,
              title: `Week ${input.weekNumber}`,
            },
          });
        }

        // Find the day
        let day = await db.programDay.findFirst({
          where: {
            weekId: week.id,
            dayNumber: input.dayNumber,
          },
        });

        if (!day) {
          // Create the day if it doesn't exist
          day = await db.programDay.create({
            data: {
              weekId: week.id,
              dayNumber: input.dayNumber,
              title: `Day ${input.dayNumber}`,
            },
          });
        }

        // Get the next order number
        const maxOrder = await db.programDrill.aggregate({
          where: { dayId: day.id },
          _max: { order: true },
        });

        const newOrder = (maxOrder._max.order || 0) + 1;

        // Create the exercise
        const exercise = await db.programDrill.create({
          data: {
            dayId: day.id,
            order: newOrder,
            title: input.title,
            description: input.description,
            duration: input.duration,
            videoUrl: input.videoUrl,
            notes: input.notes,
            sets: input.sets,
            reps: input.reps,
            tempo: input.tempo,
          },
        });

        return exercise;
      }),

    // Delete exercise
    deleteExercise: publicProcedure
      .input(z.object({ exerciseId: z.string() }))
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
            message: "Only coaches can delete exercises",
          });
        }

        // Get the exercise and verify ownership
        const exercise = await db.programDrill.findFirst({
          where: { id: input.exerciseId },
          include: {
            day: {
              include: {
                week: {
                  include: {
                    program: true,
                  },
                },
              },
            },
          },
        });

        if (!exercise || exercise.day.week.program.coachId !== user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Exercise not found or you don't have permission",
          });
        }

        // Delete the exercise
        await db.programDrill.delete({
          where: { id: input.exerciseId },
        });

        return { success: true };
      }),

    // Update exercise
    updateExercise: publicProcedure
      .input(
        z.object({
          exerciseId: z.string(),
          title: z.string(),
          description: z.string().optional(),
          duration: z.string().optional(),
          notes: z.string().optional(),
          sets: z.number().optional(),
          reps: z.number().optional(),
          tempo: z.string().optional(),
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
            message: "Only coaches can update exercises",
          });
        }

        // Get the exercise and verify ownership
        const exercise = await db.programDrill.findFirst({
          where: { id: input.exerciseId },
          include: {
            day: {
              include: {
                week: {
                  include: {
                    program: true,
                  },
                },
              },
            },
          },
        });

        if (!exercise || exercise.day.week.program.coachId !== user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Exercise not found or you don't have permission",
          });
        }

        // Update the exercise
        const updatedExercise = await db.programDrill.update({
          where: { id: input.exerciseId },
          data: {
            title: input.title,
            description: input.description,
            duration: input.duration,
            notes: input.notes,
            sets: input.sets,
            reps: input.reps,
            tempo: input.tempo,
          },
        });

        return updatedExercise;
      }),

    // Toggle rest day
    toggleRestDay: publicProcedure
      .input(
        z.object({
          programId: z.string(),
          weekNumber: z.number(),
          dayNumber: z.number(),
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
            message: "Only coaches can modify programs",
          });
        }

        // Verify program exists and belongs to coach
        const program = await db.program.findFirst({
          where: {
            id: input.programId,
            coachId: user.id,
          },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Program not found",
          });
        }

        // Find the week
        let week = await db.programWeek.findFirst({
          where: {
            programId: input.programId,
            weekNumber: input.weekNumber,
          },
        });

        if (!week) {
          // Create the week if it doesn't exist
          week = await db.programWeek.create({
            data: {
              programId: input.programId,
              weekNumber: input.weekNumber,
              title: `Week ${input.weekNumber}`,
            },
          });
        }

        // Find the day
        let day = await db.programDay.findFirst({
          where: {
            weekId: week.id,
            dayNumber: input.dayNumber,
          },
        });

        if (!day) {
          // Create the day if it doesn't exist
          day = await db.programDay.create({
            data: {
              weekId: week.id,
              dayNumber: input.dayNumber,
              title: `Day ${input.dayNumber}`,
              isRestDay: true, // Set as rest day when creating
            },
          });
        } else {
          // Toggle the rest day status
          day = await db.programDay.update({
            where: { id: day.id },
            data: { isRestDay: !day.isRestDay },
          });
        }

        return day;
      }),

    // Create week
    createWeek: publicProcedure
      .input(
        z.object({
          programId: z.string(),
          weekNumber: z.number(),
          title: z.string(),
          description: z.string().optional(),
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
            message: "Only coaches can create weeks",
          });
        }

        // Verify program exists and belongs to coach
        const program = await db.program.findFirst({
          where: {
            id: input.programId,
            coachId: user.id,
          },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Program not found",
          });
        }

        // Create the week
        const week = await db.programWeek.create({
          data: {
            programId: input.programId,
            weekNumber: input.weekNumber,
            title: input.title,
            description: input.description,
          },
        });

        return week;
      }),

    // Create day
    createDay: publicProcedure
      .input(
        z.object({
          programId: z.string(),
          weekNumber: z.number(),
          dayNumber: z.number(),
          title: z.string(),
          description: z.string().optional(),
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
            message: "Only coaches can create days",
          });
        }

        // Verify program exists and belongs to coach
        const program = await db.program.findFirst({
          where: {
            id: input.programId,
            coachId: user.id,
          },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Program not found",
          });
        }

        // Find or create the week
        let week = await db.programWeek.findFirst({
          where: {
            programId: input.programId,
            weekNumber: input.weekNumber,
          },
        });

        if (!week) {
          week = await db.programWeek.create({
            data: {
              programId: input.programId,
              weekNumber: input.weekNumber,
              title: `Week ${input.weekNumber}`,
            },
          });
        }

        // Create the day
        const day = await db.programDay.create({
          data: {
            weekId: week.id,
            dayNumber: input.dayNumber,
            title: input.title,
            description: input.description,
          },
        });

        return day;
      }),

    // Assign program to clients
    assignToClients: publicProcedure
      .input(
        z.object({
          programId: z.string(),
          clientIds: z.array(z.string()),
          startDate: z.string(),
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
            message: "Only coaches can assign programs",
          });
        }

        // Verify program exists and belongs to coach
        const program = await db.program.findFirst({
          where: {
            id: input.programId,
            coachId: user.id,
          },
          include: {
            weeks: {
              include: {
                days: {
                  orderBy: { dayNumber: "asc" },
                },
              },
              orderBy: { weekNumber: "asc" },
            },
          },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Program not found",
          });
        }

        // Verify all clients belong to this coach
        const clients = await db.client.findMany({
          where: {
            id: { in: input.clientIds },
            coachId: user.id,
          },
          include: {
            programAssignments: {
              include: {
                program: {
                  include: {
                    weeks: {
                      include: {
                        days: {
                          orderBy: { dayNumber: "asc" },
                        },
                      },
                      orderBy: { weekNumber: "asc" },
                    },
                  },
                },
              },
            },
          },
        });

        if (clients.length !== input.clientIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Some clients not found or don't belong to you",
          });
        }

        // Check for conflicts and limits for each client
        const assignments = [];
        const errors = [];

        for (const client of clients) {
          // Check if client already has 5 programs assigned
          if (client.programAssignments.length >= 5) {
            errors.push(
              `${client.name} already has 5 programs assigned. Please unassign a program first.`
            );
            continue;
          }

          // Check if this specific program is already assigned to this client
          const existingAssignment = client.programAssignments.find(
            assignment => assignment.programId === input.programId
          );
          if (existingAssignment) {
            errors.push(`${client.name} already has this program assigned.`);
            continue;
          }

          // Check for time conflicts with existing programs
          // Parse the date string and create a date at midnight in local timezone
          const [year, month, day] = input.startDate.split("-").map(Number);
          const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);

          console.log("Assignment startDate input:", input.startDate);
          console.log("Parsed startDate:", startDate);
          console.log("startDate.toISOString():", startDate.toISOString());
          const programEndDate = new Date(
            startDate.getTime() + program.duration * 7 * 24 * 60 * 60 * 1000
          );

          for (const existingAssignment of client.programAssignments) {
            const existingStartDate = existingAssignment.assignedAt;
            const existingEndDate = new Date(
              existingStartDate.getTime() +
                existingAssignment.program.duration * 7 * 24 * 60 * 60 * 1000
            );

            // Check if date ranges overlap
            if (
              (startDate <= existingEndDate &&
                programEndDate >= existingStartDate) ||
              (existingStartDate <= programEndDate &&
                existingEndDate >= startDate)
            ) {
              errors.push(
                `${
                  client.name
                } has a conflicting program from ${existingStartDate.toLocaleDateString()} to ${existingEndDate.toLocaleDateString()}. Please choose a different start date.`
              );
              break;
            }
          }

          // If no conflicts, create the assignment
          if (!errors.some(error => error.includes(client.name))) {
            const assignment = await db.programAssignment.create({
              data: {
                programId: input.programId,
                clientId: client.id,
                startDate,
              },
            });
            assignments.push(assignment);
          }
        }

        if (errors.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: errors.join(" "),
          });
        }

        return assignments;
      }),

    // Unassign program from clients
    unassignFromClients: publicProcedure
      .input(
        z.object({
          programId: z.string(),
          clientIds: z.array(z.string()),
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
            message: "Only coaches can unassign programs",
          });
        }

        // Verify program exists and belongs to coach
        const program = await db.program.findFirst({
          where: {
            id: input.programId,
            coachId: user.id,
          },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Program not found",
          });
        }

        // Delete assignments
        const result = await db.programAssignment.deleteMany({
          where: {
            programId: input.programId,
            clientId: { in: input.clientIds },
          },
        });

        return { deletedCount: result.count };
      }),

    // Update assignment progress
    updateAssignmentProgress: publicProcedure
      .input(
        z.object({
          assignmentId: z.string(),
          progress: z.number().min(0).max(100),
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
            message: "Only coaches can update progress",
          });
        }

        // Verify assignment exists and belongs to coach's program
        const assignment = await db.programAssignment.findFirst({
          where: {
            id: input.assignmentId,
            program: {
              coachId: user.id,
            },
          },
        });

        if (!assignment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Assignment not found",
          });
        }

        // Update progress
        const updatedAssignment = await db.programAssignment.update({
          where: { id: input.assignmentId },
          data: {
            progress: input.progress,
            completedAt: input.progress === 100 ? new Date() : null,
          },
          include: {
            client: true,
            program: true,
          },
        });

        return updatedAssignment;
      }),

    // Get all assignments for a program
    getProgramAssignments: publicProcedure
      .input(z.object({ programId: z.string() }))
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
            message: "Only coaches can view program assignments",
          });
        }

        // Verify program exists and belongs to coach
        const program = await db.program.findFirst({
          where: {
            id: input.programId,
            coachId: user.id,
          },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Program not found",
          });
        }

        // Get all assignments for this program (excluding archived clients)
        const assignments = await db.programAssignment.findMany({
          where: {
            programId: input.programId,
            client: {
              archived: false, // Exclude archived clients
            },
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            assignedAt: "desc",
          },
        });

        return assignments;
      }),

    // Delete week
    deleteWeek: publicProcedure
      .input(
        z.object({
          programId: z.string(),
          weekNumber: z.number(),
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
            message: "Only coaches can delete weeks",
          });
        }

        // Verify program exists and belongs to coach
        const program = await db.program.findFirst({
          where: {
            id: input.programId,
            coachId: user.id,
          },
        });

        if (!program) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Program not found",
          });
        }

        // Find the week
        const week = await db.programWeek.findFirst({
          where: {
            programId: input.programId,
            weekNumber: input.weekNumber,
          },
        });

        if (!week) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Week not found",
          });
        }

        // Delete the week (this will cascade delete all days and exercises)
        await db.programWeek.delete({
          where: { id: week.id },
        });

        return { success: true };
      }),
  }),

  notifications: router({
    getNotifications: publicProcedure
      .input(
        z.object({
          limit: z.number().optional().default(20),
          unreadOnly: z.boolean().optional().default(false),
        })
      )
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const whereClause: any = { userId: user.id };

        if (input.unreadOnly) {
          whereClause.isRead = false;
        }

        const notifications = await db.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          take: input.limit,
        });

        return notifications;
      }),

    getUnreadCount: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const count = await db.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      });

      return count;
    }),

    markAsRead: publicProcedure
      .input(z.object({ notificationId: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const notification = await db.notification.update({
          where: {
            id: input.notificationId,
            userId: user.id,
          },
          data: { isRead: true },
        });

        return notification;
      }),

    markAllAsRead: publicProcedure.mutation(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      await db.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false,
        },
        data: { isRead: true },
      });

      return { success: true };
    }),

    createNotification: publicProcedure
      .input(
        z.object({
          userId: z.string(),
          type: z.enum([
            "MESSAGE",
            "WORKOUT_ASSIGNED",
            "WORKOUT_COMPLETED",
            "LESSON_SCHEDULED",
            "LESSON_CANCELLED",
            "PROGRAM_ASSIGNED",
            "PROGRESS_UPDATE",
            "CLIENT_JOIN_REQUEST",
            "SYSTEM",
          ]),
          title: z.string(),
          message: z.string(),
          data: z.any().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Verify the current user is a COACH and can create notifications for clients
        const currentUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (currentUser?.role !== "COACH") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can create notifications",
          });
        }

        // Verify the target user exists and is a client of this coach
        const targetUser = await db.user.findUnique({
          where: { id: input.userId },
          select: { role: true },
        });

        if (!targetUser || targetUser.role !== "CLIENT") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Target user not found or is not a client",
          });
        }

        // Check if the client belongs to this coach
        const client = await db.client.findFirst({
          where: {
            userId: input.userId,
            coachId: user.id,
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only create notifications for your own clients",
          });
        }

        const notification = await db.notification.create({
          data: {
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            data: input.data,
          },
        });

        return notification;
      }),
  }),

  // Library Resources
  libraryResources: router({
    getAll: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get all library resources for the coach
      const resources = await db.libraryResource.findMany({
        where: {
          coachId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return resources;
    }),

    getCategories: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get unique categories with counts
      const categories = await db.libraryResource.groupBy({
        by: ["category"],
        where: {
          coachId: user.id,
        },
        _count: {
          category: true,
        },
      });

      return categories.map(cat => ({
        name: cat.category,
        count: cat._count.category,
      }));
    }),
  }),

  // Analytics
  analytics: router({
    getDashboardData: publicProcedure
      .input(z.object({ timeRange: z.enum(["7d", "30d", "90d", "1y"]) }))
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
            message: "Only coaches can access analytics",
          });
        }

        // Calculate date ranges
        const now = new Date();
        const currentPeriodStart = new Date();
        const previousPeriodStart = new Date();

        switch (input.timeRange) {
          case "7d":
            currentPeriodStart.setDate(now.getDate() - 7);
            previousPeriodStart.setDate(now.getDate() - 14);
            break;
          case "30d":
            currentPeriodStart.setDate(now.getDate() - 30);
            previousPeriodStart.setDate(now.getDate() - 60);
            break;
          case "90d":
            currentPeriodStart.setDate(now.getDate() - 90);
            previousPeriodStart.setDate(now.getDate() - 180);
            break;
          case "1y":
            currentPeriodStart.setFullYear(now.getFullYear() - 1);
            previousPeriodStart.setFullYear(now.getFullYear() - 2);
            break;
        }

        // Get all active clients (not just those in programs)
        const allActiveClients = await db.client.findMany({
          where: {
            coachId: user.id,
            archived: false,
          },
          include: {
            programAssignments: {
              include: {
                program: true,
              },
            },
          },
        });

        const activeClients = allActiveClients.length;

        // Debug: Log what we found
        console.log(`Analytics Debug - Coach ${user.id}:`);
        console.log(
          `- Total clients: ${await db.client.count({
            where: { coachId: user.id },
          })}`
        );
        console.log(`- Clients in programs: ${activeClients}`);
        console.log(
          `- Program assignments: ${await db.programAssignment.count({
            where: { program: { coachId: user.id } },
          })}`
        );
        console.log(
          `- Assigned workouts: ${await db.assignedWorkout.count({
            where: { coachId: user.id },
          })}`
        );
        console.log(
          `- Completed workouts: ${await db.assignedWorkout.count({
            where: { coachId: user.id, completed: true },
          })}`
        );

        // Get previous period active clients for trend calculation
        const previousActiveClients = await db.client.count({
          where: {
            coachId: user.id,
            archived: false,
            createdAt: {
              lt: currentPeriodStart,
            },
          },
        });

        const activeClientsTrend =
          previousActiveClients > 0
            ? ((activeClients - previousActiveClients) /
                previousActiveClients) *
              100
            : 0;

        // Get workout completion data
        const assignedWorkouts = await db.assignedWorkout.findMany({
          where: {
            coachId: user.id,
            scheduledDate: {
              gte: currentPeriodStart,
            },
          },
        });

        const completedWorkouts = assignedWorkouts.filter(
          workout => workout.completed
        ).length;

        const workoutCompletionRate =
          assignedWorkouts.length > 0
            ? (completedWorkouts / assignedWorkouts.length) * 100
            : 0;

        // Get program assignments and calculate average progress
        const programAssignments = await db.programAssignment.findMany({
          where: {
            program: {
              coachId: user.id,
            },
          },
          include: {
            program: true,
          },
        });

        const averageProgress =
          programAssignments.length > 0
            ? programAssignments.reduce(
                (sum, assignment) => sum + assignment.progress,
                0
              ) / programAssignments.length
            : 0;

        // Calculate program completion rate
        const completedPrograms = programAssignments.filter(
          assignment => assignment.progress >= 100
        ).length;
        const completionRate =
          programAssignments.length > 0
            ? (completedPrograms / programAssignments.length) * 100
            : 0;

        // Calculate retention rate (clients who have completed workouts in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const recentWorkoutActivity = await db.assignedWorkout.findMany({
          where: {
            coachId: user.id,
            completed: true,
            completedAt: {
              gte: thirtyDaysAgo,
            },
          },
          select: {
            clientId: true,
          },
        });

        const uniqueActiveClients = new Set(
          recentWorkoutActivity.map(a => a.clientId)
        ).size;
        const retentionRate =
          activeClients > 0 ? (uniqueActiveClients / activeClients) * 100 : 0;

        // Calculate trends based on previous period data
        const previousPeriodAssignments = await db.programAssignment.findMany({
          where: {
            program: {
              coachId: user.id,
            },
            updatedAt: {
              gte: previousPeriodStart,
              lt: currentPeriodStart,
            },
          },
        });

        const previousPeriodWorkouts = await db.assignedWorkout.findMany({
          where: {
            coachId: user.id,
            scheduledDate: {
              gte: previousPeriodStart,
              lt: currentPeriodStart,
            },
          },
        });

        const previousAverageProgress =
          previousPeriodAssignments.length > 0
            ? previousPeriodAssignments.reduce(
                (sum, assignment) => sum + assignment.progress,
                0
              ) / previousPeriodAssignments.length
            : 0;

        const previousCompletedPrograms = previousPeriodAssignments.filter(
          assignment => assignment.progress >= 100
        ).length;
        const previousCompletionRate =
          previousPeriodAssignments.length > 0
            ? (previousCompletedPrograms / previousPeriodAssignments.length) *
              100
            : 0;

        const previousCompletedWorkouts = previousPeriodWorkouts.filter(
          workout => workout.completed
        ).length;
        const previousWorkoutCompletionRate =
          previousPeriodWorkouts.length > 0
            ? (previousCompletedWorkouts / previousPeriodWorkouts.length) * 100
            : 0;

        const averageProgressTrend =
          previousAverageProgress > 0
            ? ((averageProgress - previousAverageProgress) /
                previousAverageProgress) *
              100
            : 0;

        const completionRateTrend =
          previousCompletionRate > 0
            ? ((completionRate - previousCompletionRate) /
                previousCompletionRate) *
              100
            : 0;

        const workoutCompletionRateTrend =
          previousWorkoutCompletionRate > 0
            ? ((workoutCompletionRate - previousWorkoutCompletionRate) /
                previousWorkoutCompletionRate) *
              100
            : 0;

        // Calculate retention trend based on workout completion
        const previousRetentionWorkouts = await db.assignedWorkout.findMany({
          where: {
            coachId: user.id,
            completed: true,
            completedAt: {
              gte: previousPeriodStart,
              lt: currentPeriodStart,
            },
          },
          select: {
            clientId: true,
          },
        });

        const previousUniqueActiveClients = new Set(
          previousRetentionWorkouts.map(a => a.clientId)
        ).size;
        const previousRetentionRate =
          previousActiveClients > 0
            ? (previousUniqueActiveClients / previousActiveClients) * 100
            : 0;

        const retentionRateTrend =
          previousRetentionRate > 0
            ? ((retentionRate - previousRetentionRate) /
                previousRetentionRate) *
              100
            : 0;

        // If no real data exists, provide meaningful defaults
        const hasRealData = activeClients > 0 || assignedWorkouts.length > 0;

        if (!hasRealData) {
          console.log("No real analytics data found - using demo data");
          return {
            activeClients: 0,
            activeClientsTrend: 0,
            averageProgress: 0,
            averageProgressTrend: 0,
            completionRate: 0,
            completionRateTrend: 0,
            workoutCompletionRate: 0,
            workoutCompletionRateTrend: 0,
            retentionRate: 0,
            retentionRateTrend: 0,
          };
        }

        return {
          activeClients,
          activeClientsTrend,
          averageProgress,
          averageProgressTrend,
          completionRate,
          completionRateTrend,
          workoutCompletionRate,
          workoutCompletionRateTrend,
          retentionRate,
          retentionRateTrend,
        };
      }),

    getClientProgress: publicProcedure
      .input(z.object({ timeRange: z.enum(["7d", "30d", "90d", "1y"]) }))
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
            message: "Only coaches can access analytics",
          });
        }

        // Get all active clients with their program data
        const clients = await db.client.findMany({
          where: {
            coachId: user.id,
            archived: false,
          },
          include: {
            programAssignments: {
              include: {
                program: true,
              },
            },
          },
        });

        // Get workout data for all clients
        const clientIds = clients.map(client => client.id);
        const assignedWorkouts = await db.assignedWorkout.findMany({
          where: {
            coachId: user.id,
            clientId: {
              in: clientIds,
            },
          },
        });

        // Calculate progress for each client
        const clientProgress = clients.map(client => {
          // Program progress
          const totalProgress = client.programAssignments.reduce(
            (sum, assignment) => sum + assignment.progress,
            0
          );
          const averageProgress =
            client.programAssignments.length > 0
              ? totalProgress / client.programAssignments.length
              : 0;

          const programsCompleted = client.programAssignments.filter(
            assignment => assignment.progress >= 100
          ).length;

          // Workout completion data
          const clientWorkouts = assignedWorkouts.filter(
            workout => workout.clientId === client.id
          );
          const completedWorkouts = clientWorkouts.filter(
            workout => workout.completed
          ).length;
          const workoutCompletionRate =
            clientWorkouts.length > 0
              ? (completedWorkouts / clientWorkouts.length) * 100
              : 0;

          // Calculate trend based on recent workout activity
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const recentWorkouts = clientWorkouts.filter(
            workout => workout.scheduledDate >= thirtyDaysAgo
          );
          const recentCompletedWorkouts = recentWorkouts.filter(
            workout => workout.completed
          ).length;
          const recentWorkoutRate =
            recentWorkouts.length > 0
              ? (recentCompletedWorkouts / recentWorkouts.length) * 100
              : 0;

          const trend =
            workoutCompletionRate > 0
              ? ((recentWorkoutRate - workoutCompletionRate) /
                  workoutCompletionRate) *
                100
              : 0;

          return {
            id: client.id,
            name: client.name,
            progress: averageProgress,
            programsCompleted,
            workoutCompletionRate,
            totalWorkouts: clientWorkouts.length,
            completedWorkouts,
            trend,
          };
        });

        // Sort by workout completion rate (highest first) - most important metric
        return clientProgress.sort(
          (a, b) => b.workoutCompletionRate - a.workoutCompletionRate
        );
      }),

    getProgramPerformance: publicProcedure
      .input(z.object({ timeRange: z.enum(["7d", "30d", "90d", "1y"]) }))
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
            message: "Only coaches can access analytics",
          });
        }

        // Get programs with their assignments
        const programs = await db.program.findMany({
          where: {
            coachId: user.id,
          },
          include: {
            assignments: true,
          },
        });

        // Calculate performance for each program
        const programPerformance = programs.map(program => {
          const totalProgress = program.assignments.reduce(
            (sum, assignment) => sum + assignment.progress,
            0
          );
          const averageProgress =
            program.assignments.length > 0
              ? totalProgress / program.assignments.length
              : 0;

          const completedAssignments = program.assignments.filter(
            assignment => assignment.progress >= 100
          ).length;
          const completionRate =
            program.assignments.length > 0
              ? (completedAssignments / program.assignments.length) * 100
              : 0;

          return {
            id: program.id,
            title: program.title,
            activeClients: program.assignments.length,
            averageProgress,
            completionRate,
          };
        });

        // Sort by completion rate (highest first)
        return programPerformance.sort(
          (a, b) => b.completionRate - a.completionRate
        );
      }),

    getEngagementMetrics: publicProcedure
      .input(z.object({ timeRange: z.enum(["7d", "30d", "90d", "1y"]) }))
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
            message: "Only coaches can access analytics",
          });
        }

        // Calculate date range
        const now = new Date();
        const periodStart = new Date();

        switch (input.timeRange) {
          case "7d":
            periodStart.setDate(now.getDate() - 7);
            break;
          case "30d":
            periodStart.setDate(now.getDate() - 30);
            break;
          case "90d":
            periodStart.setDate(now.getDate() - 90);
            break;
          case "1y":
            periodStart.setFullYear(now.getFullYear() - 1);
            break;
        }

        // Get real workout completion data
        const assignedWorkouts = await db.assignedWorkout.findMany({
          where: {
            coachId: user.id,
            scheduledDate: {
              gte: periodStart,
            },
          },
        });

        const completedWorkouts = assignedWorkouts.filter(
          workout => workout.completed
        ).length;

        const workoutCompletion =
          assignedWorkouts.length > 0
            ? (completedWorkouts / assignedWorkouts.length) * 100
            : 0;

        // Get video engagement from client video submissions
        const videoSubmissions = await db.clientVideoSubmission.findMany({
          where: {
            coachId: user.id,
            createdAt: {
              gte: periodStart,
            },
          },
        });

        // Calculate video engagement based on submissions vs assigned videos
        const videoAssignments = await db.videoAssignment.findMany({
          where: {
            assignedAt: {
              gte: periodStart,
            },
          },
          include: {
            client: {
              include: {
                clients: true,
              },
            },
          },
        });

        // Filter assignments for clients of this coach
        const coachVideoAssignments = videoAssignments.filter(
          assignment => assignment.client.clients?.[0]?.coachId === user.id
        );

        const videoEngagement =
          coachVideoAssignments.length > 0
            ? (videoSubmissions.length / coachVideoAssignments.length) * 100
            : 0;

        return {
          videoEngagement,
          workoutCompletion,
        };
      }),

    getCoachAnalytics: publicProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
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
            message: "Only coaches can access analytics",
          });
        }

        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        // Get all clients for this coach
        const clients = await db.client.findMany({
          where: { coachId: coach.id },
          include: {
            programAssignments: {
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
              },
            },
          },
        });

        // Get all drill completions for this coach's clients in the time range
        const allDrillCompletions = await db.drillCompletion.findMany({
          where: {
            completedAt: {
              gte: startDate,
              lte: endDate,
            },
            client: {
              coachId: coach.id,
            },
          },
          include: {
            client: true,
            drill: true,
          },
        });

        // Calculate analytics
        const activeClients = clients.filter(client => {
          return client.programAssignments.length > 0;
        }).length;

        const totalDrillsCompleted = allDrillCompletions.length;

        // Calculate average completion rate across all clients
        const clientAnalytics = clients.map(client => {
          // Get total drills assigned to this client
          let totalDrillsAssigned = 0;
          let clientCompletions = 0;

          client.programAssignments.forEach(assignment => {
            const programStartDate = new Date(
              (assignment as any).startDate || assignment.assignedAt
            );
            const program = assignment.program;

            program.weeks.forEach((week: any) => {
              week.days.forEach((day: any) => {
                // Only count drills that fall within the date range
                const dayDate = new Date(programStartDate);
                dayDate.setDate(
                  dayDate.getDate() +
                    (week.weekNumber - 1) * 7 +
                    (day.dayNumber - 1)
                );

                if (dayDate >= startDate && dayDate <= endDate) {
                  if (!day.isRestDay) {
                    totalDrillsAssigned += day.drills.length;
                  }
                }
              });
            });
          });

          // Count completions for this client
          clientCompletions = allDrillCompletions.filter(
            completion => completion.client.id === client.id
          ).length;

          const completionRate =
            totalDrillsAssigned > 0
              ? Math.min((clientCompletions / totalDrillsAssigned) * 100, 100)
              : 0;

          return {
            name: client.name,
            totalDrillsCompleted: clientCompletions,
            totalDrillsAssigned,
            averageCompletionRate: Math.round(completionRate),
            lastActivityDate: allDrillCompletions
              .filter(completion => completion.client.id === client.id)
              .sort(
                (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
              )[0]?.completedAt,
            streak: 0, // Placeholder for now
          };
        });

        // Calculate overall metrics
        const overallCompletionRate = Math.round(
          clientAnalytics.length > 0
            ? clientAnalytics.reduce(
                (sum, client) => sum + client.averageCompletionRate,
                0
              ) / clientAnalytics.length
            : 0
        );

        // Recent activity (last 10 drill completions)
        const recentActivity = allDrillCompletions
          .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
          .slice(0, 10)
          .map(completion => ({
            clientName: completion.client?.name || "Unknown Client",
            drillName: completion.drill?.title || "Unknown Drill",
            completedAt: completion.completedAt,
            type: "drill_completion",
          }));

        return {
          activeClients,
          newClients: clients.filter(client => {
            const clientCreatedAt = new Date(client.createdAt);
            return clientCreatedAt >= startDate && clientCreatedAt <= endDate;
          }).length,
          overallCompletionRate,
          retentionRate: Math.round(
            clientAnalytics.length > 0
              ? clientAnalytics.reduce(
                  (sum, client) => sum + client.averageCompletionRate,
                  0
                ) / clientAnalytics.length
              : 0
          ),
          clientAnalytics,
          recentActivity,
        };
      }),
  }),

  // Analytics Goals Management
  analyticsGoals: router({
    getGoals: publicProcedure.query(async () => {
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
          message: "Only coaches can access analytics goals",
        });
      }

      const settings = await db.userSettings.findUnique({
        where: { userId: user.id },
      });

      // Return default goals if no custom goals are set
      const defaultGoals = {
        activeClients: Math.max(
          5,
          await db.client.count({
            where: { coachId: user.id, archived: false },
          })
        ),
        workoutCompletion: 75,
        programProgress: 70,
        clientRetention: 85,
      };

      return settings?.analyticsGoals
        ? (settings.analyticsGoals as typeof defaultGoals)
        : defaultGoals;
    }),

    updateGoals: publicProcedure
      .input(
        z.object({
          activeClients: z.number().min(1).max(1000),
          workoutCompletion: z.number().min(0).max(100),
          programProgress: z.number().min(0).max(100),
          clientRetention: z.number().min(0).max(100),
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
            message: "Only coaches can update analytics goals",
          });
        }

        const existingSettings = await db.userSettings.findUnique({
          where: { userId: user.id },
        });

        if (existingSettings) {
          await db.userSettings.update({
            where: { userId: user.id },
            data: { analyticsGoals: input },
          });
        } else {
          await db.userSettings.create({
            data: {
              userId: user.id,
              analyticsGoals: input,
            },
          });
        }

        return input;
      }),
  }),

  settings: router({
    getSettings: publicProcedure.query(async () => {
      try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const settings = await db.userSettings.findUnique({
          where: { userId: user.id },
        });

        if (!settings) {
          // Create default settings if they don't exist
          const defaultSettings = await db.userSettings.create({
            data: {
              userId: user.id,
            },
          });
          return defaultSettings;
        }

        return settings;
      } catch (error) {
        console.error("Error in getSettings:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user settings",
        });
      }
    }),

    updateSettings: publicProcedure
      .input(
        z.object({
          // Profile settings
          phone: z.string().optional(),
          location: z.string().optional(),
          bio: z.string().optional(),
          avatarUrl: z.string().optional(),

          // Notification preferences
          emailNotifications: z.boolean().optional(),
          pushNotifications: z.boolean().optional(),
          soundNotifications: z.boolean().optional(),
          newClientNotifications: z.boolean().optional(),
          messageNotifications: z.boolean().optional(),
          scheduleNotifications: z.boolean().optional(),

          // Messaging settings
          defaultWelcomeMessage: z.string().optional(),
          messageRetentionDays: z.number().optional(),
          maxFileSizeMB: z.number().optional(),

          // Client management settings
          defaultLessonDuration: z.number().optional(),
          autoArchiveDays: z.number().optional(),
          requireClientEmail: z.boolean().optional(),

          // Schedule settings
          timezone: z.string().optional(),
          workingDays: z.array(z.string()).optional(),

          // Privacy & Security
          twoFactorEnabled: z.boolean().optional(),

          // Appearance settings
          compactSidebar: z.boolean().optional(),
          showAnimations: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Check if settings exist
        const existingSettings = await db.userSettings.findUnique({
          where: { userId: user.id },
        });

        if (existingSettings) {
          // Update existing settings
          const updatedSettings = await db.userSettings.update({
            where: { userId: user.id },
            data: {
              ...input,
              workingDays: input.workingDays
                ? (JSON.stringify(input.workingDays) as any)
                : undefined,
            },
          });
          return updatedSettings;
        } else {
          // Create new settings
          const newSettings = await db.userSettings.create({
            data: {
              userId: user.id,
              ...input,
              workingDays: input.workingDays
                ? (JSON.stringify(input.workingDays) as any)
                : undefined,
            },
          });
          return newSettings;
        }
      }),

    updateProfile: publicProcedure
      .input(
        z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          location: z.string().optional(),
          bio: z.string().optional(),
          avatarUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Update user profile
        const updatedUser = await db.user.update({
          where: { id: user.id },
          data: {
            name: input.name,
          },
        });

        // Update or create settings
        const existingSettings = await db.userSettings.findUnique({
          where: { userId: user.id },
        });

        if (existingSettings) {
          await db.userSettings.update({
            where: { userId: user.id },
            data: {
              phone: input.phone,
              location: input.location,
              bio: input.bio,
              avatarUrl: input.avatarUrl,
            },
          });
        } else {
          await db.userSettings.create({
            data: {
              userId: user.id,
              phone: input.phone,
              location: input.location,
              bio: input.bio,
              avatarUrl: input.avatarUrl,
            },
          });
        }

        return updatedUser;
      }),
  }),

  exportData: publicProcedure.mutation(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Get all user data
    const userData = await db.user.findUnique({
      where: { id: user.id },
      include: {
        settings: true,
        clients: true,
        programs: true,
        libraryResources: true,
        notifications: true,
        coachConversations: {
          include: {
            messages: true,
          },
        },
      },
    });

    if (!userData) throw new TRPCError({ code: "NOT_FOUND" });

    return {
      success: true,
      data: userData,
      exportedAt: new Date().toISOString(),
    };
  }),

  deleteAccount: publicProcedure.mutation(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Delete user and all associated data (cascade will handle related records)
    await db.user.delete({
      where: { id: user.id },
    });

    return { success: true };
  }),

  // Video Feedback System
  videos: router({
    list: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const videos = await db.video.findMany({
        where: {
          OR: [
            { uploadedBy: user.id },
            {
              clientId: {
                in: await db.client
                  .findMany({ where: { coachId: user.id } })
                  .then(clients => clients.map(c => c.id)),
              },
            },
          ],
        },
        include: {
          uploader: { select: { name: true, email: true } },
          client: { select: { name: true, email: true } },
          feedback: { include: { coach: { select: { name: true } } } },
          annotations: { include: { coach: { select: { name: true } } } },
          audioNotes: { include: { coach: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      return videos;
    }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const video = await db.video.findFirst({
          where: {
            id: input.id,
            OR: [
              { uploadedBy: user.id },
              {
                clientId: {
                  in: await db.client
                    .findMany({ where: { coachId: user.id } })
                    .then(clients => clients.map(c => c.id)),
                },
              },
            ],
          },
          include: {
            uploader: { select: { name: true, email: true } },
            client: { select: { name: true, email: true } },
            feedback: { include: { coach: { select: { name: true } } } },
            annotations: { include: { coach: { select: { name: true } } } },
            audioNotes: { include: { coach: { select: { name: true } } } },
          },
        });

        if (!video) throw new TRPCError({ code: "NOT_FOUND" });

        return video;
      }),

    create: publicProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          url: z.string(),
          thumbnail: z.string().optional(),
          duration: z.number().optional(),
          fileSize: z.number().optional(),
          clientId: z.string().optional(),
          category: z
            .enum([
              "BULLPEN",
              "PRACTICE",
              "GAME_FOOTAGE",
              "REFERENCE",
              "COMPARISON",
              "OTHER",
            ])
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const video = await db.video.create({
          data: {
            ...input,
            uploadedBy: user.id,
          },
          include: {
            uploader: { select: { name: true, email: true } },
            client: { select: { name: true, email: true } },
          },
        });

        return video;
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(["PENDING_REVIEW", "REVIEWED", "ARCHIVED"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const video = await db.video.update({
          where: { id: input.id },
          data: input,
          include: {
            uploader: { select: { name: true, email: true } },
            client: { select: { name: true, email: true } },
          },
        });

        return video;
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        await db.video.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),

    // Video Annotations
    createAnnotation: publicProcedure
      .input(
        z.object({
          videoId: z.string(),
          type: z.enum([
            "PEN",
            "HIGHLIGHT",
            "ARROW",
            "CIRCLE",
            "TEXT",
            "ERASE",
          ]),
          data: z.any(),
          timestamp: z.number(),
          duration: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const annotation = await db.videoAnnotation.create({
          data: {
            ...input,
            coachId: user.id,
          },
          include: {
            coach: { select: { name: true } },
          },
        });

        return annotation;
      }),

    deleteAnnotation: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Get user from database to check role
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found in database",
          });
        }

        // Check if user is a coach
        if (dbUser.role !== "COACH") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can delete annotations",
          });
        }

        // Check if annotation exists and belongs to this coach
        const annotation = await db.videoAnnotation.findUnique({
          where: { id: input.id },
          select: { coachId: true },
        });

        if (!annotation) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (annotation.coachId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own annotations",
          });
        }

        await db.videoAnnotation.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),

    // Video Audio Notes
    createAudioNote: publicProcedure
      .input(
        z.object({
          videoId: z.string(),
          url: z.string(),
          duration: z.number(),
          timestamp: z.number(),
          title: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const audioNote = await db.videoAudioNote.create({
          data: {
            ...input,
            coachId: user.id,
          },
          include: {
            coach: { select: { name: true } },
          },
        });

        return audioNote;
      }),

    deleteAudioNote: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        await db.videoAudioNote.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),

    // Video Feedback
    createFeedback: publicProcedure
      .input(
        z.object({
          videoId: z.string(),
          feedback: z.string(),
          rating: z.number().min(1).max(5).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const feedback = await db.videoFeedback.create({
          data: {
            ...input,
            coachId: user.id,
          },
          include: {
            coach: { select: { name: true } },
          },
        });

        return feedback;
      }),

    updateFeedback: publicProcedure
      .input(
        z.object({
          id: z.string(),
          feedback: z.string().optional(),
          rating: z.number().min(1).max(5).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const feedback = await db.videoFeedback.update({
          where: { id: input.id },
          data: input,
          include: {
            coach: { select: { name: true } },
          },
        });

        return feedback;
      }),

    deleteFeedback: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Get user from database to check role
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found in database",
          });
        }

        // Check if user is a coach
        if (dbUser.role !== "COACH") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can delete feedback",
          });
        }

        // Check if feedback exists and belongs to this coach
        const feedback = await db.videoFeedback.findUnique({
          where: { id: input.id },
          select: { coachId: true },
        });

        if (!feedback) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (feedback.coachId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own feedback",
          });
        }

        await db.videoFeedback.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),

    // Get annotations for a video
    getAnnotations: publicProcedure
      .input(z.object({ videoId: z.string() }))
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const annotations = await db.videoAnnotation.findMany({
          where: { videoId: input.videoId },
          include: {
            coach: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        return annotations;
      }),

    // Screen Recording procedures
    createScreenRecording: publicProcedure
      .input(
        z.object({
          videoId: z.string(),
          title: z.string(),
          description: z.string().optional(),
          videoUrl: z.string(),
          audioUrl: z.string(),
          duration: z.number(),
          maxDuration: z.number().default(300), // 5 minutes default
          annotations: z.any().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Get user from database to check role
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found in database",
          });
        }

        // Check if user is a coach
        if (dbUser.role !== "COACH") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can create screen recordings",
          });
        }

        // Validate duration limit
        if (input.duration > input.maxDuration) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Recording duration (${input.duration}s) exceeds maximum allowed duration (${input.maxDuration}s)`,
          });
        }

        const screenRecording = await db.screenRecording.create({
          data: {
            ...input,
            coachId: user.id,
          },
          include: {
            coach: { select: { name: true } },
            video: { select: { title: true } },
          },
        });

        return screenRecording;
      }),

    getScreenRecordings: publicProcedure
      .input(z.object({ videoId: z.string() }))
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        const screenRecordings = await db.screenRecording.findMany({
          where: { videoId: input.videoId },
          include: {
            coach: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        return screenRecordings;
      }),

    deleteScreenRecording: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Get user from database to check role
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found in database",
          });
        }

        // Check if user is a coach
        if (dbUser.role !== "COACH") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can delete screen recordings",
          });
        }

        // Check if recording exists and belongs to this coach
        const recording = await db.screenRecording.findUnique({
          where: { id: input.id },
          select: { coachId: true },
        });

        if (!recording) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (recording.coachId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own screen recordings",
          });
        }

        await db.screenRecording.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),
  }),

  clientRouter: router({
    getAssignedPrograms: publicProcedure.query(async () => {
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

      // Get client's assigned programs
      const client = await db.client.findFirst({
        where: { userId: user.id },
        include: {
          coach: { select: { name: true } },
          programAssignments: {
            include: {
              program: true,
            },
            orderBy: { assignedAt: "desc" },
          },
        },
      });

      if (!client || client.programAssignments.length === 0) {
        return [];
      }

      const currentDate = new Date();
      const programs = client.programAssignments.map(assignment => {
        const program = assignment.program;
        const startDate = new Date(assignment.assignedAt);
        const weeksDiff = Math.floor(
          (currentDate.getTime() - startDate.getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        );
        const currentWeek = Math.min(weeksDiff + 1, program.duration);
        const overallProgress = Math.min(
          (currentWeek / program.duration) * 100,
          100
        );

        return {
          id: program.id,
          title: program.title,
          description: program.description,
          startDate: assignment.assignedAt.toISOString(),
          endDate: new Date(
            startDate.getTime() + program.duration * 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          currentWeek,
          totalWeeks: program.duration,
          overallProgress,
          coachName: client.coach.name,
          assignmentId: assignment.id,
        };
      });

      return programs;
    }),

    getPitchingData: publicProcedure.query(async () => {
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

      // Get client record with pitching data
      const client = await db.client.findFirst({
        where: { userId: user.id },
        select: {
          id: true,
          name: true,
          averageSpeed: true,
          topSpeed: true,
          dropSpinRate: true,
          changeupSpinRate: true,
          riseSpinRate: true,
          curveSpinRate: true,
          age: true,
          height: true,
          dominantHand: true,
          movementStyle: true,
          reachingAbility: true,
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      return {
        averageSpeed: client.averageSpeed,
        topSpeed: client.topSpeed,
        dropSpinRate: client.dropSpinRate,
        changeupSpinRate: client.changeupSpinRate,
        riseSpinRate: client.riseSpinRate,
        curveSpinRate: client.curveSpinRate,
        age: client.age,
        height: client.height,
        dominantHand: client.dominantHand,
        movementStyle: client.movementStyle,
        reachingAbility: client.reachingAbility,
      };
    }),

    getNextLesson: publicProcedure.query(async () => {
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

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get next confirmed lesson
      const nextLesson = await db.event.findFirst({
        where: {
          clientId: client.id,
          status: "CONFIRMED",
          date: {
            gte: new Date(),
          },
        },
        orderBy: { date: "asc" },
      });

      return nextLesson;
    }),

    getVideoAssignments: publicProcedure.query(async () => {
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

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get video assignments for the client
      const videoAssignments = await db.videoAssignment.findMany({
        where: { clientId: client.id },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              description: true,
              url: true,
              type: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      });

      return videoAssignments;
    }),

    getCoachNotes: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });
      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      const client = await db.client.findFirst({
        where: { userId: user.id },
        select: { notes: true, updatedAt: true },
      });
      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      return { notes: client.notes || "", updatedAt: client.updatedAt };
    }),

    // Keep the old query for backward compatibility
    getAssignedProgram: publicProcedure.query(async () => {
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

      // Get client's assigned programs
      const client = await db.client.findFirst({
        where: { userId: user.id },
        include: {
          coach: { select: { name: true } },
          programAssignments: {
            include: {
              program: true,
            },
            orderBy: { assignedAt: "desc" },
          },
        },
      });

      if (!client || client.programAssignments.length === 0) {
        return null;
      }

      // If multiple programs are assigned, return information about all of them
      if (client.programAssignments.length > 1) {
        const programs = client.programAssignments.map(assignment => {
          const program = assignment.program;
          const startDate =
            assignment.startDate || new Date(assignment.assignedAt);
          const currentDate = new Date();
          const weeksDiff = Math.floor(
            (currentDate.getTime() - startDate.getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          );
          const currentWeek = Math.min(weeksDiff + 1, program.duration);
          const overallProgress = Math.min(
            (currentWeek / program.duration) * 100,
            100
          );

          return {
            id: program.id,
            title: program.title,
            description: program.description,
            startDate: startDate.toISOString(),
            endDate: new Date(
              startDate.getTime() + program.duration * 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            currentWeek,
            totalWeeks: program.duration,
            overallProgress,
            coachName: client.coach.name,
            assignmentId: assignment.id,
            assignedAt: assignment.assignedAt.toISOString(),
          };
        });

        // Return the most recent program as primary, but include all programs
        return {
          ...programs[0],
          allPrograms: programs,
          totalPrograms: programs.length,
        };
      }

      // Single program assignment (original behavior)
      const assignment = client.programAssignments[0];
      const program = assignment.program;

      // Calculate current week and progress
      const startDate = assignment.startDate || new Date(assignment.assignedAt);
      const currentDate = new Date();
      const weeksDiff = Math.floor(
        (currentDate.getTime() - startDate.getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );
      const currentWeek = Math.min(weeksDiff + 1, program.duration);
      const overallProgress = Math.min(
        (currentWeek / program.duration) * 100,
        100
      );

      return {
        id: program.id,
        title: program.title,
        description: program.description,
        startDate: startDate.toISOString(),
        endDate: new Date(
          startDate.getTime() + program.duration * 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        currentWeek,
        totalWeeks: program.duration,
        overallProgress,
        coachName: client.coach.name,
        allPrograms: [
          {
            id: program.id,
            title: program.title,
            description: program.description,
            startDate: startDate.toISOString(),
            endDate: new Date(
              startDate.getTime() + program.duration * 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            currentWeek,
            totalWeeks: program.duration,
            overallProgress,
            coachName: client.coach.name,
            assignmentId: assignment.id,
            assignedAt: assignment.assignedAt.toISOString(),
          },
        ],
        totalPrograms: 1,
      };
    }),

    getProgramCalendar: publicProcedure
      .input(
        z.object({
          year: z.number(),
          month: z.number(),
          viewMode: z.enum(["month", "week"]),
        })
      )
      .query(async ({ input }) => {
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

        // Get client's assigned programs
        const client = await db.client.findFirst({
          where: { userId: user.id },
          include: {
            programAssignments: {
              include: {
                program: {
                  include: {
                    weeks: {
                      include: {
                        days: {
                          include: {
                            drills: {
                              include: {
                                completions: {
                                  where: {
                                    clientId: user.id,
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              orderBy: { assignedAt: "desc" },
            },
          },
        });

        if (!client || client.programAssignments.length === 0) {
          return {};
        }

        // Build calendar data for the requested month
        const calendarData: Record<string, any> = {};

        // Process all assigned programs
        client.programAssignments.forEach(assignment => {
          const program = assignment.program;
          const startDate =
            assignment.startDate || new Date(assignment.assignedAt);

          // Get all days in the program
          program.weeks.forEach((week: any) => {
            week.days.forEach((day: any) => {
              // Calculate the day date by adding the appropriate number of days
              const dayDate = new Date(startDate);
              const daysToAdd = (week.weekNumber - 1) * 7 + (day.dayNumber - 1);
              dayDate.setDate(startDate.getDate() + daysToAdd);

              const dateString = dayDate.toISOString().split("T")[0];

              // Debug logging for first few days
              if (week.weekNumber === 1 && day.dayNumber <= 3) {
                console.log(`Week ${week.weekNumber}, Day ${day.dayNumber}:`, {
                  startDate: startDate.toISOString(),
                  daysToAdd,
                  dayDate: dayDate.toISOString(),
                  dateString,
                });
              }

              // Only include days in the requested month
              if (
                dayDate.getFullYear() === input.year &&
                dayDate.getMonth() + 1 === input.month
              ) {
                const drills = day.drills.map((drill: any) => ({
                  id: drill.id,
                  title: drill.title,
                  sets: drill.sets,
                  reps: drill.reps,
                  tempo: drill.tempo,
                  tags: drill.tags ? JSON.parse(drill.tags) : [],
                  videoUrl: drill.videoUrl,
                  completed: drill.completions && drill.completions.length > 0,
                }));

                const completedDrills = drills.filter(
                  (drill: any) => drill.completed
                ).length;

                // Check if this day already has content from another program
                if (calendarData[dateString]) {
                  // Merge drills from multiple programs
                  calendarData[dateString].drills = [
                    ...calendarData[dateString].drills,
                    ...drills,
                  ];
                  calendarData[dateString].completedDrills += completedDrills;
                  calendarData[dateString].totalDrills += drills.length;
                  calendarData[dateString].expectedTime += drills.reduce(
                    (total: number, drill: any) =>
                      total + (drill.sets || 0) * 2,
                    0
                  );
                  // If either day is a rest day, keep it as rest day
                  calendarData[dateString].isRestDay =
                    calendarData[dateString].isRestDay || day.isRestDay;
                } else {
                  // Create entry for this program day
                  calendarData[dateString] = {
                    date: dateString,
                    drills,
                    isRestDay: day.isRestDay || drills.length === 0, // Mark as rest day if no drills or explicitly marked as rest
                    expectedTime: drills.reduce(
                      (total: number, drill: any) =>
                        total + (drill.sets || 0) * 2,
                      0
                    ), // Rough estimate
                    completedDrills,
                    totalDrills: drills.length,
                  };
                }
              }
            });
          });
        });

        // Don't fill empty days with rest days - leave them blank

        return calendarData;
      }),

    getProgramWeekCalendar: publicProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ input }) => {
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

        // Get client record first
        const client = await db.client.findFirst({
          where: { userId: user.id },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client profile not found",
          });
        }

        // Get client's program assignments with all the nested data
        const clientWithPrograms = await db.client.findFirst({
          where: { userId: user.id },
          include: {
            programAssignments: {
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
              },
            },
          },
        });

        if (
          !clientWithPrograms ||
          clientWithPrograms.programAssignments.length === 0
        ) {
          return {};
        }

        const calendarData: Record<string, any> = {};
        const startDateTime = new Date(input.startDate);
        const endDateTime = new Date(input.endDate);
        // Include the entire end date
        endDateTime.setHours(23, 59, 59, 999);

        // Get all drill completions for this client
        const completions = await db.drillCompletion.findMany({
          where: { clientId: client.id },
        });

        // Process each program assignment
        clientWithPrograms.programAssignments.forEach((assignment: any) => {
          const programStartDate = new Date(
            assignment.startDate || assignment.assignedAt
          );
          const program = assignment.program;

          // Process each week of the program
          program.weeks.forEach((week: any) => {
            // Process each day of the week
            week.days.forEach((day: any) => {
              // Calculate the actual date for this program day
              const dayDate = new Date(programStartDate);
              dayDate.setDate(
                dayDate.getDate() +
                  (week.weekNumber - 1) * 7 +
                  (day.dayNumber - 1)
              );

              // Check if this day falls within our requested date range
              if (dayDate >= startDateTime && dayDate <= endDateTime) {
                const dateString = dayDate.toISOString().split("T")[0];

                // Get drills for this day and check completion status
                const drills = day.drills.map((drill: any) => {
                  const completion = completions.find(
                    (c: any) => c.drillId === drill.id
                  );
                  return {
                    ...drill,
                    completed: !!completion,
                  };
                });

                const completedDrills = drills.filter(
                  (drill: any) => drill.completed
                ).length;

                // Check if this day already has content from another program
                if (calendarData[dateString]) {
                  // Merge drills from multiple programs
                  calendarData[dateString].drills = [
                    ...calendarData[dateString].drills,
                    ...drills,
                  ];
                  calendarData[dateString].completedDrills += completedDrills;
                  calendarData[dateString].totalDrills += drills.length;
                  calendarData[dateString].expectedTime += drills.reduce(
                    (total: number, drill: any) =>
                      total + (drill.sets || 0) * 2,
                    0
                  );
                  // If either day is a rest day, keep it as rest day
                  calendarData[dateString].isRestDay =
                    calendarData[dateString].isRestDay || day.isRestDay;
                } else {
                  // Create entry for this program day
                  calendarData[dateString] = {
                    date: dateString,
                    drills,
                    isRestDay: day.isRestDay || drills.length === 0,
                    expectedTime: drills.reduce(
                      (total: number, drill: any) =>
                        total + (drill.sets || 0) * 2,
                      0
                    ),
                    completedDrills,
                    totalDrills: drills.length,
                  };
                }
              }
            });
          });
        });

        return calendarData;
      }),

    markDrillComplete: publicProcedure
      .input(
        z.object({
          drillId: z.string(),
          completed: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
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

        // Get client record
        const client = await db.client.findFirst({
          where: { userId: user.id },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client profile not found",
          });
        }

        if (input.completed) {
          // Mark drill as complete
          await db.drillCompletion.create({
            data: {
              drillId: input.drillId,
              clientId: client.id,
            },
          });
        } else {
          // Mark drill as incomplete (remove completion record)
          await db.drillCompletion.deleteMany({
            where: {
              drillId: input.drillId,
              clientId: client.id,
            },
          });
        }

        return { success: true };
      }),

    sendNoteToCoach: publicProcedure
      .input(
        z.object({
          date: z.string(),
          note: z.string(),
          drillId: z.string().optional(),
          drillTitle: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
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

        // Get client's coach
        const client = await db.client.findFirst({
          where: { userId: user.id },
          include: { coach: { select: { name: true } } },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client profile not found",
          });
        }

        // Create a message in the messaging system to send to the coach
        const conversation = await db.conversation.findFirst({
          where: {
            coachId: client.coachId,
            clientId: user.id,
          },
        });

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation with coach not found",
          });
        }

        // Create the message
        const message = await db.message.create({
          data: {
            conversationId: conversation.id,
            senderId: user.id,
            content: input.drillTitle
              ? `**${input.drillTitle}** - ${input.note}`
              : input.note,
          },
        });

        // Create a notification for the coach
        await db.notification.create({
          data: {
            userId: client.coachId,
            type: "MESSAGE",
            title: `New message from ${client.name}`,
            message: input.drillTitle
              ? `Client feedback on "${
                  input.drillTitle
                }": ${input.note.substring(0, 100)}${
                  input.note.length > 100 ? "..." : ""
                }`
              : `Client note: ${input.note.substring(0, 100)}${
                  input.note.length > 100 ? "..." : ""
                }`,
            data: {
              messageId: message.id,
              conversationId: conversation.id,
              drillId: input.drillId || undefined,
              drillTitle: input.drillTitle || undefined,
            },
          },
        });

        return { success: true, messageId: message.id };
      }),

    getClientLessons: publicProcedure
      .input(
        z.object({
          month: z.number(),
          year: z.number(),
        })
      )
      .query(async ({ input }) => {
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

        // Get client record to find their coach
        const client = await db.client.findFirst({
          where: { userId: user.id },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client profile not found",
          });
        }

        // Get client's CONFIRMED lessons for the specified month (excluding Schedule Request lessons and lessons for other clients)
        const lessons = await db.event.findMany({
          where: {
            clientId: client.id,
            status: "CONFIRMED", // Only return confirmed lessons
            NOT: {
              OR: [
                {
                  title: {
                    contains: "Schedule Request",
                  },
                },
                {
                  title: {
                    contains: "test user 2",
                  },
                },
              ],
            },
            date: {
              gte: new Date(input.year, input.month, 1),
              lt: new Date(input.year, input.month + 1, 1),
            },
          },
          include: {
            coach: { select: { name: true } },
          },
          orderBy: { date: "asc" },
        });

        return lessons;
      }),

    // Get client's pending schedule requests
    getClientPendingRequests: publicProcedure
      .input(
        z.object({
          month: z.number(),
          year: z.number(),
        })
      )
      .query(async ({ input }) => {
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

        // Get client record to find their coach
        const client = await db.client.findFirst({
          where: { userId: user.id },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client profile not found",
          });
        }

        // Get client's PENDING schedule requests for the specified month
        const pendingRequests = await db.event.findMany({
          where: {
            clientId: client.id,
            status: "PENDING", // Only return pending requests
            date: {
              gte: new Date(input.year, input.month, 1),
              lt: new Date(input.year, input.month + 1, 1),
            },
          },
          include: {
            coach: { select: { name: true } },
          },
          orderBy: { date: "asc" },
        });

        return pendingRequests;
      }),

    // Get coach's schedule for client to view
    getCoachScheduleForClient: publicProcedure
      .input(
        z.object({
          month: z.number(),
          year: z.number(),
        })
      )
      .query(async ({ input }) => {
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

        // Get client record to find their coach
        const client = await db.client.findFirst({
          where: { userId: user.id },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client profile not found",
          });
        }

        // Calculate month start and end dates
        const monthStart = new Date(input.year, input.month, 1);
        const monthEnd = new Date(input.year, input.month + 1, 0, 23, 59, 59);
        const now = new Date();

        // Get all events (lessons) for the coach in the specified month
        const events = await db.event.findMany({
          where: {
            coachId: client.coachId,
            date: {
              gte: monthStart,
              lte: monthEnd,
              gt: now, // Only return future lessons
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
          },
          orderBy: {
            date: "asc",
          },
        });

        // Filter out this client's own pending requests from the coach's schedule
        const filteredEvents = events.filter(
          event => !(event.clientId === client.id && event.status === "PENDING")
        );

        return filteredEvents;
      }),

    // Get pending schedule requests for coach
    getPendingScheduleRequests: publicProcedure.query(async () => {
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
          message: "Only coaches can view pending schedule requests",
        });
      }

      // Get all pending events for this coach (only client-requested lessons)
      const pendingRequests = await db.event.findMany({
        where: {
          coachId: user.id,
          status: "PENDING",
          // Only include lessons that were requested by clients
          description: {
            contains: "Client requested",
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
        },
        orderBy: {
          date: "asc",
        },
      });

      return pendingRequests;
    }),

    // Fix incorrectly pending coach-scheduled lessons (one-time fix)
    fixPendingCoachLessons: publicProcedure.mutation(async () => {
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
          message: "Only coaches can fix lessons",
        });
      }

      // Update all pending lessons that were created by the coach to confirmed status
      const updatedLessons = await db.event.updateMany({
        where: {
          coachId: user.id,
          status: "PENDING",
          description: "Scheduled lesson",
        },
        data: {
          status: "CONFIRMED",
        },
      });

      return { updatedCount: updatedLessons.count };
    }),

    // Fix confirmed lessons that still have "Schedule Request" in title
    fixConfirmedLessonTitles: publicProcedure.mutation(async () => {
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
          message: "Only coaches can fix lessons",
        });
      }

      // Find all confirmed lessons that still have "Schedule Request" in title
      const lessonsToFix = await db.event.findMany({
        where: {
          coachId: user.id,
          status: "CONFIRMED",
          title: {
            contains: "Schedule Request",
          },
        },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Update each lesson's title
      const updatePromises = lessonsToFix.map(lesson =>
        db.event.update({
          where: { id: lesson.id },
          data: {
            title: `Lesson with ${
              lesson.client.name || lesson.client.email || "Client"
            }`,
          },
        })
      );

      await Promise.all(updatePromises);

      return { updatedCount: lessonsToFix.length };
    }),

    // Approve a schedule request (COACH ONLY)
    approveScheduleRequest: publicProcedure
      .input(
        z.object({
          eventId: z.string(),
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
            message: "Only coaches can approve schedule requests",
          });
        }

        // Find the event and verify it belongs to this coach
        const event = await db.event.findFirst({
          where: {
            id: input.eventId,
            coachId: user.id,
            status: "PENDING",
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                userId: true, // Include userId to get the User.id for notifications
              },
            },
          },
        });

        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Schedule request not found or already processed",
          });
        }

        // Update the event status to CONFIRMED and change the title
        const updatedEvent = await db.event.update({
          where: { id: input.eventId },
          data: {
            status: "CONFIRMED",
            title: `Lesson with ${
              event.client.name || event.client.email || "Client"
            }`,
          },
        });

        // Create notification for the client
        if (event.client.userId) {
          await db.notification.create({
            data: {
              userId: event.client.userId,
              type: "LESSON_SCHEDULED",
              title: "Schedule Request Approved",
              message: `Your schedule request for ${format(
                new Date(event.date),
                "MMM d, yyyy 'at' h:mm a"
              )} has been approved!`,
              data: {
                eventId: event.id,
                coachId: user.id,
                coachName: coach.name,
              },
            },
          });
        }

        return updatedEvent;
      }),

    // Reject a schedule request (COACH ONLY)
    rejectScheduleRequest: publicProcedure
      .input(
        z.object({
          eventId: z.string(),
          reason: z.string().optional(),
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
            message: "Only coaches can reject schedule requests",
          });
        }

        // Find the event and verify it belongs to this coach
        const event = await db.event.findFirst({
          where: {
            id: input.eventId,
            coachId: user.id,
            status: "PENDING",
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                userId: true, // Include userId to get the User.id for notifications
              },
            },
          },
        });

        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Schedule request not found or already processed",
          });
        }

        // Update the event status to DECLINED
        const updatedEvent = await db.event.update({
          where: { id: input.eventId },
          data: { status: "DECLINED" },
        });

        // Create notification for the client
        if (event.client.userId) {
          await db.notification.create({
            data: {
              userId: event.client.userId,
              type: "LESSON_CANCELLED",
              title: "Schedule Request Declined",
              message: `Your schedule request for ${format(
                new Date(event.date),
                "MMM d, yyyy 'at' h:mm a"
              )} has been declined.${
                input.reason ? ` Reason: ${input.reason}` : ""
              }`,
              data: {
                eventId: event.id,
                coachId: user.id,
                coachName: coach.name,
                reason: input.reason,
              },
            },
          });
        }

        return updatedEvent;
      }),

    // Request a schedule change
    requestScheduleChange: publicProcedure
      .input(
        z.object({
          requestedDate: z.string(),
          requestedTime: z.string(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
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
            message: "Only clients can request schedule changes",
          });
        }

        // Get client record to find their coach
        const client = await db.client.findFirst({
          where: { userId: user.id },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client profile not found",
          });
        }

        // Parse the requested date and time
        const dateStr = input.requestedDate;
        const timeStr = input.requestedTime;

        // Parse the time string (e.g., "2:00 PM")
        const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeMatch) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid time format",
          });
        }

        const [_, hour, minute, period] = timeMatch;
        let hour24 = parseInt(hour);

        // Convert to 24-hour format
        if (period.toUpperCase() === "PM" && hour24 !== 12) {
          hour24 += 12;
        } else if (period.toUpperCase() === "AM" && hour24 === 12) {
          hour24 = 0;
        }

        // Create the full date string
        const fullDateStr = `${dateStr}T${hour24
          .toString()
          .padStart(2, "0")}:${minute}:00`;
        const requestedDateTime = new Date(fullDateStr);

        // Validate the date
        if (isNaN(requestedDateTime.getTime())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid date/time combination",
          });
        }

        // Check if the requested time is in the past
        const now = new Date();
        if (requestedDateTime <= now) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot request lessons in the past",
          });
        }

        // Check if the requested time slot is already booked
        const existingLesson = await db.event.findFirst({
          where: {
            coachId: client.coachId,
            date: requestedDateTime,
          },
        });

        if (existingLesson) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This time slot is already booked",
          });
        }

        // Create a schedule change request
        const scheduleRequest = await db.event.create({
          data: {
            title: `Schedule Request - ${client.name}`,
            description: input.reason || "Client requested schedule change",
            date: requestedDateTime,
            clientId: client.id,
            coachId: client.coachId,
            status: "PENDING", // New status field for pending requests
          },
        });

        // Create notification for the coach
        await db.notification.create({
          data: {
            userId: client.coachId,
            type: "SCHEDULE_REQUEST",
            title: "New Schedule Request",
            message: `${
              client.name
            } has requested a schedule change for ${format(
              requestedDateTime,
              "MMM d, yyyy 'at' h:mm a"
            )}`,
            data: {
              eventId: scheduleRequest.id,
              clientId: client.id,
              clientName: client.name,
              requestedDate: requestedDateTime,
              reason: input.reason,
            },
          },
        });

        return scheduleRequest;
      }),

    getVideoSubmissions: publicProcedure.query(async () => {
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

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get client's video submissions
      const submissions = await db.clientVideoSubmission.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: "desc" },
      });

      return submissions;
    }),

    getVideoSubmissionByDrill: publicProcedure
      .input(z.object({ drillId: z.string() }))
      .query(async ({ input }) => {
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

        // Get client record
        const client = await db.client.findFirst({
          where: { userId: user.id },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client profile not found",
          });
        }

        // Get video submission for specific drill
        const submission = await db.clientVideoSubmission.findFirst({
          where: {
            clientId: client.id,
            drillId: input.drillId,
          },
        });

        return submission;
      }),

    getClientVideoSubmissions: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a COACH
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can access this endpoint",
        });
      }

      // Get coach's client video submissions
      const submissions = await db.clientVideoSubmission.findMany({
        where: { coachId: user.id },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
          drill: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return submissions;
    }),

    getClientVideoSubmissionById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession();
        const user = await getUser();
        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Verify user is a COACH
        const dbUser = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can access this endpoint",
          });
        }

        // Get specific client video submission
        const submission = await db.clientVideoSubmission.findFirst({
          where: {
            id: input.id,
            coachId: user.id,
          },
          include: {
            client: {
              select: {
                name: true,
                email: true,
              },
            },
            drill: {
              select: {
                title: true,
              },
            },
          },
        });

        if (!submission) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client video submission not found",
          });
        }

        return submission;
      }),

    submitVideo: publicProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          comment: z.string().optional(),
          videoUrl: z.string(),
          thumbnail: z.string().optional(),
          drillId: z.string().optional(),
          isPublic: z.boolean().default(false),
        })
      )
      .mutation(async ({ input }) => {
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

        // Get client record
        const client = await db.client.findFirst({
          where: { userId: user.id },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client profile not found",
          });
        }

        // Create video submission
        const videoSubmission = await db.clientVideoSubmission.create({
          data: {
            clientId: client.id,
            coachId: client.coachId,
            title: input.title,
            description: input.description,
            comment: input.comment,
            videoUrl: input.videoUrl,
            thumbnail: input.thumbnail,
            drillId: input.drillId,
            isPublic: input.isPublic,
          },
        });

        return { success: true, videoSubmission };
      }),

    addVideoComment: publicProcedure
      .input(
        z.object({
          videoSubmissionId: z.string(),
          comment: z.string(),
        })
      )
      .mutation(async ({ input }) => {
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
            message: "Only clients can add comments to videos",
          });
        }

        // Get client record
        const client = await db.client.findFirst({
          where: { userId: user.id },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client profile not found",
          });
        }

        // Verify the video submission belongs to this client
        const videoSubmission = await db.clientVideoSubmission.findFirst({
          where: {
            id: input.videoSubmissionId,
            clientId: client.id,
          },
        });

        if (!videoSubmission) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video submission not found or doesn't belong to you",
          });
        }

        // Update the video submission with the comment
        const updatedSubmission = await db.clientVideoSubmission.update({
          where: { id: input.videoSubmissionId },
          data: { comment: input.comment },
        });

        // Create a notification for the coach
        await db.notification.create({
          data: {
            userId: client.coachId,
            type: "MESSAGE",
            title: `New video comment from ${client.name}`,
            message: `Client added a comment to their video submission: "${input.comment.substring(
              0,
              100
            )}${input.comment.length > 100 ? "..." : ""}"`,
            data: {
              videoSubmissionId: input.videoSubmissionId,
              clientId: client.id,
              clientName: client.name,
            },
          },
        });

        return { success: true, videoSubmission: updatedSubmission };
      }),

    addCommentToDrill: publicProcedure
      .input(
        z.object({
          drillId: z.string(),
          comment: z.string(),
        })
      )
      .mutation(async ({ input }) => {
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

        // Get client record
        const client = await db.client.findFirst({
          where: { userId: user.id },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client profile not found",
          });
        }

        // Find video submission for this drill
        const videoSubmission = await db.clientVideoSubmission.findFirst({
          where: {
            clientId: client.id,
            drillId: input.drillId,
          },
        });

        if (videoSubmission) {
          // Update existing video submission with comment
          const updatedSubmission = await db.clientVideoSubmission.update({
            where: { id: videoSubmission.id },
            data: { comment: input.comment },
          });

          // Create notification for coach
          await db.notification.create({
            data: {
              userId: client.coachId,
              type: "MESSAGE",
              title: `New video comment from ${client.name}`,
              message: `Client added a comment to their video submission: "${input.comment.substring(
                0,
                100
              )}${input.comment.length > 100 ? "..." : ""}"`,
              data: {
                videoSubmissionId: videoSubmission.id,
                clientId: client.id,
                clientName: client.name,
              },
            },
          });

          return {
            success: true,
            videoSubmission: updatedSubmission,
            type: "video_comment",
          };
        } else {
          // No video submission found, create one with just the comment
          const newVideoSubmission = await db.clientVideoSubmission.create({
            data: {
              clientId: client.id,
              coachId: client.coachId,
              title: `Comment for Drill ${input.drillId}`,
              description: "Client feedback and comments",
              comment: input.comment,
              videoUrl: "", // Empty since no video was uploaded
              drillId: input.drillId,
              isPublic: false,
            },
          });

          // Create notification for coach
          await db.notification.create({
            data: {
              userId: client.coachId,
              type: "MESSAGE",
              title: `New client comment from ${client.name}`,
              message: `Client added a comment for drill ${
                input.drillId
              }: "${input.comment.substring(0, 100)}${
                input.comment.length > 100 ? "..." : ""
              }"`,
              data: {
                videoSubmissionId: newVideoSubmission.id,
                clientId: client.id,
                clientName: client.name,
              },
            },
          });

          return {
            success: true,
            videoSubmission: newVideoSubmission,
            type: "video_comment",
          };
        }
      }),

    // Get all upcoming lessons for the client (no date filter)
    getClientUpcomingLessons: publicProcedure.query(async () => {
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

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      const now = new Date();

      // Get all upcoming lessons for this client
      const upcomingLessons = await db.event.findMany({
        where: {
          clientId: client.id,
          date: {
            gte: now.toISOString(),
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
        },
        orderBy: {
          date: "asc",
        },
      });

      return upcomingLessons;
    }),
  }),

  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
