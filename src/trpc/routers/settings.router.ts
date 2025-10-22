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
      console.error("Error in getSettings:", error);
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
});
