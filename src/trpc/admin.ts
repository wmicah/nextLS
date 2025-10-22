import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { publicProcedure } from "./trpc";
import { validateAdminAccess, logAdminAction } from "@/lib/admin-security";

// Enhanced admin role check helper with audit logging
const requireAdmin = async (userId: string, action?: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, email: true, name: true },
  });

  if (!user || !user.isAdmin) {
    // Log unauthorized access attempt
    if (action) {
      await logAdminAction(
        "unauthorized_access_attempt",
        {
          attemptedAction: action,
          userEmail: user?.email || "unknown",
        },
        userId
      );
    }

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return user.isAdmin;
};

export const adminRouter = {
  // Get master library resources (viewable by all authenticated users)
  getMasterLibrary: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(10000).optional().default(1000),
        search: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      console.log(
        "getMasterLibrary called by user:",
        user.id,
        "email:",
        user.email
      );

      // Get user from database to check role and admin status
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true, isAdmin: true },
      });

      console.log("Database user data:", dbUser);

      // Build where clause for filtering
      const where: any = {
        isMasterLibrary: true,
        isActive: true,
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

      // Calculate pagination
      const skip = (input.page - 1) * input.limit;

      // Get total count for pagination
      const totalCount = await db.libraryResource.count({ where });

      // Get paginated resources
      const resources = await db.libraryResource.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: input.limit,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          type: true,
          url: true,
          thumbnail: true,
          duration: true,
          views: true,
          rating: true,
          isYoutube: true,
          isOnForm: true,
          youtubeId: true,
          onformId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const totalPages = Math.ceil(totalCount / input.limit);

      console.log(
        `Found ${resources.length} master library resources (page ${input.page}/${totalPages})`
      );

      return {
        items: resources,
        pagination: {
          currentPage: input.page,
          totalPages,
          totalCount,
          hasNextPage: input.page < totalPages,
          hasPreviousPage: input.page > 1,
        },
      };
    }),

  // Get master library resources (admin only - for editing)
  getMasterLibraryForAdmin: publicProcedure.query(async ({ ctx }) => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Check if user is admin with audit logging
    await requireAdmin(user.id, "get_master_library_admin");

    const resources = await db.libraryResource.findMany({
      where: {
        isMasterLibrary: true,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Log admin action
    await logAdminAction(
      "viewed_master_library_admin",
      {
        resourceCount: resources.length,
      },
      user.id
    );

    return resources;
  }),

  // Get admin statistics
  getStats: publicProcedure.query(async ({ ctx }) => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Check if user is admin
    await requireAdmin(user.id);

    const [totalResources, masterLibraryCount, activeUsers, totalViews] =
      await Promise.all([
        db.libraryResource.count(),
        db.libraryResource.count({
          where: { isMasterLibrary: true, isActive: true },
        }),
        db.user.count({
          where: { role: { in: ["COACH", "CLIENT"] } },
        }),
        db.libraryResource.aggregate({
          _sum: { views: true },
        }),
      ]);

    return {
      totalResources,
      masterLibraryCount,
      activeUsers,
      totalViews: totalViews._sum.views || 0,
    };
  }),

  // Add resource to master library
  addToMasterLibrary: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.string(),
        type: z.string(),
        url: z.string(),
        youtubeId: z.string().optional(),
        isYoutube: z.boolean().default(false),
        onformId: z.string().optional(),
        isOnForm: z.boolean().default(false),
        filename: z.string().optional(),
        contentType: z.string().optional(),
        size: z.number().optional(),
        thumbnail: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user is admin with audit logging
      await requireAdmin(user.id, "add_to_master_library");

      const resource = await db.libraryResource.create({
        data: {
          ...input,
          isMasterLibrary: true,
          isActive: true,
          isFeatured: false,
          coachId: user.id, // Admin who created it
          views: 0,
          rating: 0,
        },
      });

      // Log admin action
      await logAdminAction(
        "added_master_library_resource",
        {
          resourceId: resource.id,
          title: input.title,
          category: input.category,
          type: input.type,
        },
        user.id
      );

      return {
        id: resource.id,
        message: "Resource added to master library successfully",
        resource,
      };
    }),

  // Update master library resource
  updateMasterResource: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        type: z.string().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user is admin
      await requireAdmin(user.id);

      const { id, ...updateData } = input;

      const resource = await db.libraryResource.findFirst({
        where: {
          id,
          isMasterLibrary: true,
        },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Master library resource not found",
        });
      }

      const updatedResource = await db.libraryResource.update({
        where: { id },
        data: updateData,
      });

      return {
        id: updatedResource.id,
        message: "Resource updated successfully",
        resource: updatedResource,
      };
    }),

  // Toggle resource active status
  toggleResourceStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user is admin
      await requireAdmin(user.id);

      const resource = await db.libraryResource.findFirst({
        where: {
          id: input.id,
          isMasterLibrary: true,
        },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Master library resource not found",
        });
      }

      const updatedResource = await db.libraryResource.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });

      return {
        id: updatedResource.id,
        message: `Resource ${
          input.isActive ? "activated" : "deactivated"
        } successfully`,
        resource: updatedResource,
      };
    }),

  // Delete master library resource
  deleteMasterResource: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user is admin
      await requireAdmin(user.id);

      const resource = await db.libraryResource.findFirst({
        where: {
          id: input.id,
          isMasterLibrary: true,
        },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Master library resource not found",
        });
      }

      await db.libraryResource.delete({
        where: { id: input.id },
      });

      return {
        message: "Resource deleted successfully",
      };
    }),

  // Get all users (for user management)
  getUsers: publicProcedure.query(async ({ ctx }) => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Check if user is admin
    await requireAdmin(user.id);

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  }),

  // Update user admin status
  updateUserAdminStatus: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user is admin with audit logging
      await requireAdmin(user.id, "update_user_admin_status");

      // Prevent admin from changing their own admin status
      if (input.userId === user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot change your own admin status",
        });
      }

      const updatedUser = await db.user.update({
        where: { id: input.userId },
        data: { isAdmin: input.isAdmin },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isAdmin: true,
        },
      });

      // Log admin action
      await logAdminAction(
        "updated_user_admin_status",
        {
          targetUserId: input.userId,
          newAdminStatus: input.isAdmin,
          targetUserEmail: updatedUser.email,
        },
        user.id
      );

      return {
        message: "User admin status updated successfully",
        user: updatedUser,
      };
    }),

  // Get admin audit logs
  getAuditLogs: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Check if user is admin
    await requireAdmin(user.id, "get_audit_logs");

    const auditLogs = await db.adminAuditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 100, // Limit to last 100 entries
    });

    return auditLogs;
  }),
};
