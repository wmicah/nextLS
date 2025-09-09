import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { TRPCError } from "@trpc/server";
import { captureAction, captureError } from "./monitoring";

/**
 * Server-side admin validation
 * This should be used in all admin pages and procedures
 */
export async function validateAdminAccess(): Promise<{
  user: {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
  };
}> {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id || !user.email) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // Get user from database with admin status
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        role: true,
        lastLoginAt: true,
      },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found in database",
      });
    }

    if (!dbUser.isAdmin) {
      // Log unauthorized admin access attempt
      await captureAction("admin_access_denied", "security", {
        userId: user.id,
        email: user.email,
        userAgent: "server-side",
        timestamp: new Date().toISOString(),
      });

      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    // Update last login time for admin users
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log successful admin access
    await captureAction("admin_access_granted", "security", {
      userId: user.id,
      email: user.email,
      role: dbUser.role,
      timestamp: new Date().toISOString(),
    });

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name || "Admin User",
        isAdmin: dbUser.isAdmin,
      },
    };
  } catch (error) {
    await captureError(error as Error, {
      context: "validateAdminAccess",
    });
    throw error;
  }
}

/**
 * Enhanced admin procedure creator
 * Creates tRPC procedures with comprehensive admin validation
 */
export function createAdminProcedure(publicProcedure: any) {
  return publicProcedure.use(async ({ next, ctx }: { next: any; ctx: any }) => {
    const adminData = await validateAdminAccess();

    return next({
      ctx: {
        ...ctx,
        admin: adminData.user,
      },
    });
  });
}

/**
 * Check if user has admin privileges (for client-side checks)
 * This is a helper function, but server-side validation is always required
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    return user?.isAdmin || false;
  } catch (error) {
    await captureError(error as Error, {
      context: "isUserAdmin",
      userId,
    });
    return false;
  }
}

/**
 * Admin session validation
 * Checks if admin session is still valid and not expired
 */
export async function validateAdminSession(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        isAdmin: true,
        lastLoginAt: true,
        role: true,
      },
    });

    if (!user?.isAdmin) {
      return false;
    }

    // Check if session is not too old (24 hours)
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = new Date();
    const lastLogin = user.lastLoginAt || new Date(0);

    if (now.getTime() - lastLogin.getTime() > sessionTimeout) {
      await captureAction("admin_session_expired", "security", {
        userId,
        lastLogin: lastLogin.toISOString(),
        timestamp: now.toISOString(),
      });
      return false;
    }

    return true;
  } catch (error) {
    await captureError(error as Error, {
      context: "validateAdminSession",
      userId,
    });
    return false;
  }
}

/**
 * Admin audit logging
 * Logs all admin actions for security monitoring
 */
export async function logAdminAction(
  action: string,
  details: Record<string, any>,
  userId: string
): Promise<void> {
  try {
    await captureAction(`admin_${action}`, "admin", {
      userId,
      timestamp: new Date().toISOString(),
      ...details,
    });

    // Also store in database for audit trail
    await db.adminAuditLog.create({
      data: {
        userId,
        action,
        details: JSON.stringify(details),
        timestamp: new Date(),
      },
    });
  } catch (error) {
    await captureError(error as Error, {
      context: "logAdminAction",
      action,
      userId,
    });
  }
}
