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
import {
  getTierRestrictions,
  canAddClient,
  canAccessMasterLibrary,
  canAccessPremadeRoutines,
} from "@/lib/subscription-restrictions";

/**
 * Settings Router
 */
export const settingsRouter = router({
  getSettings: publicProcedure.query(async () => {
    try {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        // Return null instead of throwing error for unauthenticated users
        return null;
      }

      // First, ensure the user exists in the database
      const existingUser = await db.user.findUnique({
        where: { id: user.id },
      });

      if (!existingUser) {
        // Return null instead of throwing error for users who haven't completed setup
        return null;
      }

      // Get user settings from database
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
      // Return null instead of throwing error to prevent crashes
      return null;
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
        lessonRemindersEnabled: z.boolean().optional(),

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
        clientScheduleAdvanceLimitDays: z.number().min(0).optional(),

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

      const { workingDays, clientScheduleAdvanceLimitDays, ...otherInput } =
        input;

      const transformedData = {
        ...otherInput,
        workingDays: workingDays
          ? (JSON.stringify(workingDays) as any)
          : undefined,
        clientScheduleAdvanceLimitDays:
          clientScheduleAdvanceLimitDays ?? undefined,
      };

      if (existingSettings) {
        // Update existing settings
        const updatedSettings = await db.userSettings.update({
          where: { userId: user.id },
          data: transformedData,
        });
        return updatedSettings;
      } else {
        // Create new settings
        const newSettings = await db.userSettings.create({
          data: {
            userId: user.id,
            ...transformedData,
          },
        });
        return newSettings;
      }
    }),

  /** Dismiss a client detail walkthrough hint (persisted per user). */
  dismissClientDetailHint: publicProcedure
    .input(z.object({ hintId: z.string() }))
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const existing = await db.userSettings.findUnique({
        where: { userId: user.id },
      });

      const current =
        existing?.dismissedClientDetailHints != null
          ? Array.isArray(existing.dismissedClientDetailHints)
            ? (existing.dismissedClientDetailHints as string[])
            : (JSON.parse(
                String(existing.dismissedClientDetailHints)
              ) as string[])
          : [];

      if (current.includes(input.hintId)) return existing;

      const updated = [...current, input.hintId];

      if (existing) {
        return db.userSettings.update({
          where: { userId: user.id },
          data: { dismissedClientDetailHints: updated as unknown as any },
        });
      }

      return db.userSettings.create({
        data: {
          userId: user.id,
          dismissedClientDetailHints: updated as unknown as any,
        },
      });
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

  /**
   * Get subscription restrictions and current usage for the current user
   * Used by the UI to display limits and check if actions are allowed
   */
  getSubscriptionRestrictions: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a COACH (restrictions only apply to coaches)
    const coach = await db.user.findFirst({
      where: { id: user.id, role: "COACH" },
      select: {
        subscriptionTier: true,
        clientLimit: true,
      },
    });

    if (!coach) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only coaches have subscription restrictions",
      });
    }

    // Count current active (non-archived) clients
    const currentClientCount = await db.client.count({
      where: {
        coachId: user.id,
        archived: false,
      },
    });

    // Get tier restrictions
    const restrictions = getTierRestrictions(
      coach.subscriptionTier,
      coach.clientLimit
    );

    // Check if user can add more clients
    const canAdd = canAddClient(
      coach.subscriptionTier,
      coach.clientLimit,
      currentClientCount
    );

    return {
      tier: coach.subscriptionTier,
      restrictions: {
        ...restrictions,
        currentClientCount,
        canAddClient: canAdd.allowed,
        clientLimitReached: !canAdd.allowed,
        clientLimitExceeded: canAdd.isOverLimit ?? false,
        clientLimitMessage: canAdd.reason,
      },
      access: {
        hasMasterLibraryAccess: canAccessMasterLibrary(coach.subscriptionTier),
        hasPremadeRoutinesAccess: canAccessPremadeRoutines(
          coach.subscriptionTier
        ),
      },
    };
  }),
});
