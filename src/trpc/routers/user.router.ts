import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import { ensureUserId, sendWelcomeMessage } from "./_helpers";
import { CompleteEmailService } from "@/lib/complete-email-service";
import {
  sendWelcomeEmailForCoach,
  sendWelcomeEmailForClient,
  sendClientJoinNotification,
} from "@/lib/notification-utils";

/**
 * User Router
 * Handles user profile, settings, notifications, and account management
 */
export const userRouter = router({
  updateRole: publicProcedure
    .input(
      z.object({
        role: z.enum(["COACH", "CLIENT"]),
        coachId: z.string().optional(),
        inviteCode: z.string().optional(),
        coachEmail: z.string().email().optional(),
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

      // Handle client joining a coach
      if (input.role === "CLIENT") {
        let coachId = input.coachId;

        // If invite code is provided, find the coach by invite code
        if (input.inviteCode && !coachId) {
          const coach = await db.user.findFirst({
            where: {
              role: "COACH",
              inviteCode: input.inviteCode,
            },
          });

          if (!coach) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "Invalid invite code. Please check with your coach and try again.",
            });
          }

          coachId = coach.id;
        }

        // If coach email is provided (and no invite code), find the coach and send approval request
        if (input.coachEmail && !input.inviteCode && !coachId) {
          const coach = await db.user.findFirst({
            where: {
              role: "COACH",
              email: input.coachEmail,
            },
          });

          if (!coach) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "No coach found with that email address. Please verify the email and try again.",
            });
          }

          // Create notification for coach to approve
          await db.notification.create({
            data: {
              userId: coach.id,
              type: "CLIENT_JOIN_REQUEST",
              title: "New Athlete Join Request",
              message: `${updatedUser.name || "A new athlete"} (${
                updatedUser.email
              }) has requested to join your coaching program.`,
              data: {
                clientUserId: ensureUserId(user.id),
                clientName: updatedUser.name,
                clientEmail: updatedUser.email,
                requiresApproval: true,
              },
            },
          });

          // Send email notification to coach about new client request
          try {
            const emailService = CompleteEmailService.getInstance();
            await emailService.sendNewClientRequest(
              coach.email,
              coach.name || "Coach",
              updatedUser.name || "New Client",
              updatedUser.email
            );
            console.log(`📧 New client request email sent to ${coach.email}`);
          } catch (error) {
            console.error(
              `Failed to send new client request email to ${coach.email}:`,
              error
            );
          }

          // Create client record WITHOUT coach assignment (pending approval)
          await db.client.upsert({
            where: { userId: user.id },
            update: {
              name: updatedUser.name || "New Client",
              email: updatedUser.email,
              coachId: null, // No coach until approved
            },
            create: {
              userId: user.id,
              name: updatedUser.name || "New Client",
              email: updatedUser.email,
              coachId: null, // No coach until approved
            },
          });

          return updatedUser;
        }

        // If we have a coachId (from invite code), set up the relationship
        if (coachId) {
          // Verify the coach exists
          const coach = await db.user.findFirst({
            where: { id: coachId, role: "COACH" },
          });

          if (!coach) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Coach not found",
            });
          }

          // Create or update client record with coach
          await db.client.upsert({
            where: { userId: user.id },
            update: {
              coachId: coachId,
              name: updatedUser.name || "New Client",
              email: updatedUser.email,
            },
            create: {
              userId: user.id,
              coachId: coachId,
              name: updatedUser.name || "New Client",
              email: updatedUser.email,
            },
          });

          // Create notification for the coach
          await db.notification.create({
            data: {
              userId: coachId,
              type: "CLIENT_JOIN_REQUEST",
              title: "New Athlete Joined",
              message: `${
                updatedUser.name || "A new athlete"
              } has joined your coaching program using your invite code!`,
              data: {
                clientId: ensureUserId(user.id),
                clientName: updatedUser.name,
                clientEmail: updatedUser.email,
              },
            },
          });

          // Send email notification to coach about new client
          try {
            await sendClientJoinNotification(
              coach.email,
              coach.name || "Coach",
              updatedUser.name || "New Client",
              updatedUser.email
            );
            console.log(
              `📧 Client join notification sent to coach: ${coach.email}`
            );
          } catch (error) {
            console.error(
              "Failed to send client join notification email:",
              error
            );
          }

          // Send welcome message from coach to client
          await sendWelcomeMessage(coachId, user.id);
        } else {
          // Client without coach - create a placeholder client record
          await db.client.upsert({
            where: { userId: user.id },
            update: {
              name: updatedUser.name || "New Client",
              email: updatedUser.email,
            },
            create: {
              userId: user.id,
              name: updatedUser.name || "New Client",
              email: updatedUser.email,
            },
          });
        }
      }

      // Send welcome email based on role
      try {
        if (input.role === "COACH") {
          await sendWelcomeEmailForCoach(
            updatedUser.email,
            updatedUser.name || "Coach"
          );
          console.log(`📧 Welcome email sent to coach: ${updatedUser.email}`);
        } else if (input.role === "CLIENT") {
          // For clients, we need to determine if they have a coach
          let coachName: string | undefined;
          if (input.coachId || input.inviteCode) {
            const coach = await db.user.findFirst({
              where: {
                id: input.coachId || undefined,
                role: "COACH",
              },
            });
            coachName = coach?.name || undefined;
          }

          await sendWelcomeEmailForClient(
            updatedUser.email,
            updatedUser.name || "Client",
            coachName
          );
          console.log(`📧 Welcome email sent to client: ${updatedUser.email}`);
        }
      } catch (error) {
        console.error("Failed to send welcome email:", error);
        // Don't throw error - email failure shouldn't break user creation
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

  // Get combined inbox counts (messages + notifications)
  getInboxCounts: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Ensure UserInbox row exists for this user
    await db.$executeRaw`
      SELECT public.ensure_inbox_row()
    `;

    // Try to get from UserInbox aggregate table first
    const inbox = await db.userInbox.findUnique({
      where: { userId: user.id },
      select: {
        totalUnread: true,
        totalNotifications: true,
      },
    });

    if (inbox) {
      return {
        totalUnread: inbox.totalUnread,
        totalNotifications: inbox.totalNotifications,
      };
    }

    // Fallback to counting individual records if aggregate doesn't exist
    const [messageCount, notificationCount] = await Promise.all([
      db.message.count({
        where: {
          isRead: false,
          senderId: { not: ensureUserId(user.id) },
          conversation: {
            OR: [
              { coachId: ensureUserId(user.id) },
              { clientId: ensureUserId(user.id) },
            ],
          },
        },
      }),
      db.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),
    ]);

    return {
      totalUnread: messageCount,
      totalNotifications: notificationCount,
    };
  }),

  updateWorkingHours: publicProcedure
    .input(
      z.object({
        startTime: z.string(),
        endTime: z.string(),
        workingDays: z.array(z.string()).optional(),
        timeSlotInterval: z.number().min(15).max(120).optional(),
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
          workingDays: input.workingDays || [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          timeSlotInterval: input.timeSlotInterval || 60,
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

  // Check if a coach exists by email
  checkCoachExists: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const coach = await db.user.findFirst({
        where: {
          email: input.email,
          role: "COACH",
        },
        select: {
          id: true,
          email: true,
          name: true,
          inviteCode: true,
        },
      });

      return {
        exists: !!coach,
        coach: coach || null,
      };
    }),

  // Check if an invite code is valid and get coach info
  validateInviteCode: publicProcedure
    .input(z.object({ inviteCode: z.string() }))
    .query(async ({ input }) => {
      const coach = await db.user.findFirst({
        where: {
          inviteCode: input.inviteCode,
          role: "COACH",
        },
        select: {
          id: true,
          email: true,
          name: true,
          inviteCode: true,
        },
      });

      return {
        valid: !!coach,
        coach: coach || null,
      };
    }),

  // Generate or get existing invite code for coach
  generateInviteCode: publicProcedure.mutation(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const dbUser = await db.user.findFirst({
      where: { id: user.id },
    });

    if (!dbUser || dbUser.role !== "COACH") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only coaches can generate invite codes",
      });
    }

    // If coach already has an invite code, return it
    if (dbUser.inviteCode) {
      return {
        inviteCode: dbUser.inviteCode,
        isNew: false,
      };
    }

    // Generate new invite code
    const inviteCode = `NLS-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}-${Date.now().toString(36).substring(2, 6).toUpperCase()}`;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { inviteCode },
    });

    return {
      inviteCode: updatedUser.inviteCode!,
      isNew: true,
    };
  }),

  // Accept a client join request
  acceptClientRequest: publicProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const notification = await db.notification.findFirst({
        where: {
          id: input.notificationId,
          userId: user.id,
          type: "CLIENT_JOIN_REQUEST",
        },
      });

      if (!notification || !(notification.data as any)?.clientUserId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client request not found",
        });
      }

      const clientUserId = (notification.data as any).clientUserId as string;

      // Check if client record exists before trying to update
      const clientRecord = await db.client.findFirst({
        where: { userId: clientUserId },
      });

      if (!clientRecord) {
        // Client/user has been deleted, just mark notification as read
        console.log(
          `Client record for user ${clientUserId} not found - may have been deleted already`
        );
        await db.notification.update({
          where: { id: input.notificationId },
          data: { isRead: true },
        });
        return { success: true, message: "Client no longer exists" };
      }

      // Update the client record to assign the coach
      await db.client.update({
        where: { userId: clientUserId },
        data: { coachId: user.id },
      });

      // Mark notification as read
      await db.notification.update({
        where: { id: input.notificationId },
        data: { isRead: true },
      });

      // Send welcome message to the client
      await sendWelcomeMessage(user.id, clientUserId);

      return { success: true };
    }),

  // Reject a client join request
  rejectClientRequest: publicProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const notification = await db.notification.findFirst({
        where: {
          id: input.notificationId,
          userId: user.id,
          type: "CLIENT_JOIN_REQUEST",
        },
      });

      if (!notification || !(notification.data as any)?.clientUserId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client request not found",
        });
      }

      const clientUserId = (notification.data as any).clientUserId as string;

      // Check if client record exists before trying to delete
      const clientRecord = await db.client.findFirst({
        where: { userId: clientUserId },
      });

      // Only delete if the client record exists
      // It might already be deleted if the user deleted their account
      if (clientRecord) {
        try {
          await db.client.delete({
            where: { userId: clientUserId },
          });
        } catch (error) {
          // If deletion fails (e.g., record already deleted), log but continue
          console.warn(
            `Could not delete client record for user ${clientUserId}:`,
            error
          );
        }
      } else {
        console.log(
          `Client record for user ${clientUserId} not found - may have been deleted already`
        );
      }

      // Mark notification as read
      await db.notification.update({
        where: { id: input.notificationId },
        data: { isRead: true },
      });

      return { success: true };
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
              workingDays: dbUser.workingDays || [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ],
              timeSlotInterval: dbUser.timeSlotInterval || 60,
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

  // Delete user account and all associated data
  deleteAccount: publicProcedure
    .input(
      z.object({
        confirmationText: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Require confirmation text for safety
      if (input.confirmationText !== "DELETE MY ACCOUNT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Please type 'DELETE MY ACCOUNT' to confirm account deletion",
        });
      }

      try {
        // Store account deletion analytics before deleting user
        await db.accountDeletionLog.create({
          data: {
            userId: user.id,
            userEmail: user.email || "unknown",
            reason: input.reason || "no_reason_provided",
            deletedAt: new Date(),
            userAgent: "web_app",
          },
        });

        // Step 1: Delete from Kinde first (if configured)
        const { deleteKindeUser, isKindeManagementApiConfigured } =
          await import("@/lib/kinde-api");

        let kindeDeleted = false;
        if (isKindeManagementApiConfigured()) {
          const kindeResult = await deleteKindeUser(user.id);
          kindeDeleted = kindeResult.success;

          if (!kindeResult.success) {
            console.warn(
              `⚠️ Failed to delete user from Kinde: ${kindeResult.error}. Proceeding with database deletion.`
            );
          }
        } else {
          console.warn(
            "⚠️ Kinde Management API not configured. User will only be deleted from database."
          );
        }

        // Step 2: Delete from database
        await db.user.delete({
          where: { id: user.id },
        });

        console.log(
          `✅ User account deleted from database: ${user.id} - Reason: ${
            input.reason || "No reason provided"
          } - Kinde deleted: ${kindeDeleted}`
        );

        return {
          success: true,
          message: "Account deleted successfully",
          kindeDeleted,
        };
      } catch (error) {
        console.error("❌ Error deleting user account:", error);

        // Provide more specific error messages
        let errorMessage =
          "Failed to delete account. Please try again or contact support.";

        if (error instanceof Error) {
          // Check for foreign key constraint errors
          if (
            error.message.includes("foreign key") ||
            error.message.includes("Foreign key")
          ) {
            errorMessage =
              "Cannot delete account because it's still referenced by other data. Please contact support for assistance.";
          } else if (error.message.includes("constraint")) {
            errorMessage =
              "Account deletion failed due to database constraints. Please contact support.";
          } else {
            errorMessage = error.message || errorMessage;
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errorMessage,
        });
      }
    }),

  // Get account deletion analytics (admin only)
  getAccountDeletionAnalytics: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Check if user is admin
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    });

    if (!dbUser?.isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    // Get deletion analytics
    const deletions = await db.accountDeletionLog.findMany({
      orderBy: { deletedAt: "desc" },
      take: 100,
    });

    // Calculate time-based stats
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const deletionsThisWeek = deletions.filter(
      d => new Date(d.deletedAt) >= oneWeekAgo
    ).length;

    const deletionsThisMonth = deletions.filter(
      d => new Date(d.deletedAt) >= oneMonthAgo
    ).length;

    // Aggregate by reason
    const reasonCounts = deletions.reduce((acc, deletion) => {
      const reason = deletion.reason || "no_reason_provided";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and sort by count
    const topReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Check if Kinde Management API is configured
    const { isKindeManagementApiConfigured } = await import("@/lib/kinde-api");

    return {
      totalDeletions: deletions.length,
      deletionsThisWeek,
      deletionsThisMonth,
      topReasons,
      recentDeletions: deletions.slice(0, 20),
      kindeIntegrationEnabled: isKindeManagementApiConfigured(),
    };
  }),
});
