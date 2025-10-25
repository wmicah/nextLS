/**
 * Admin Utilities
 * Helper functions for managing admin users
 */

import { db } from "@/db";

/**
 * Get all admin users
 */
export async function getAdminUsers() {
  try {
    const admins = await db.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return admins;
  } catch (error) {
    // Error logging removed - use proper error handling
    return [];
  }
}

/**
 * Make a user an admin
 */
export async function makeUserAdmin(userId: string) {
  try {
    const user = await db.user.update({
      where: { id: userId },
      data: { isAdmin: true },
      select: { id: true, email: true, name: true },
    });

    // Debug logging removed for production
    return user;
  } catch (error) {
    // Error logging removed - use proper error handling
    throw error;
  }
}

/**
 * Remove admin privileges from a user
 */
export async function removeUserAdmin(userId: string) {
  try {
    const user = await db.user.update({
      where: { id: userId },
      data: { isAdmin: false },
      select: { id: true, email: true, name: true },
    });

    // Debug logging removed for production
    return user;
  } catch (error) {
    // Error logging removed - use proper error handling
    throw error;
  }
}

/**
 * Check if a user is admin by email
 */
export async function isUserAdminByEmail(email: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { isAdmin: true },
    });

    return user?.isAdmin === true;
  } catch (error) {
    // Error logging removed - use proper error handling
    return false;
  }
}

/**
 * Get admin statistics
 */
export async function getAdminStats() {
  try {
    const totalAdmins = await db.user.count({
      where: { isAdmin: true },
    });

    const totalUsers = await db.user.count();

    const recentAdmins = await db.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { lastLoginAt: "desc" },
      take: 5,
    });

    return {
      totalAdmins,
      totalUsers,
      adminPercentage:
        totalUsers > 0 ? ((totalAdmins / totalUsers) * 100).toFixed(2) : 0,
      recentAdmins,
    };
  } catch (error) {
    // Error logging removed - use proper error handling
    return {
      totalAdmins: 0,
      totalUsers: 0,
      adminPercentage: 0,
      recentAdmins: [],
    };
  }
}
