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
 * AuthCallback Router
 */
export const authCallbackRouter = router({
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
           // Add for debugging
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
           // Add for debugging
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

      // NEW USER LOGIC
      // Check if user previously had an account (check deletion logs)
      const wasDeleted = await db.accountDeletionLog.findFirst({
        where: {
          userId: user.id,
        },
        orderBy: {
          deletedAt: "desc",
        },
      });

      // If user previously deleted their account, they should go through role selection again
      // Don't auto-recreate their account or auto-assign them as CLIENT
      if (wasDeleted) {

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

      // Check for orphaned client record (only for truly new users who never had an account)
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

      // Completely new user - send to role selection
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
});

// Export the procedure directly for easy access
export const authCallbackProcedure =
  authCallbackRouter._def.record.authCallback;
