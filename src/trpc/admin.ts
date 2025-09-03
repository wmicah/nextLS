import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { publicProcedure } from "./trpc";

// Admin role check helper
const requireAdmin = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user || !user.isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return user.isAdmin;
};

export const adminRouter = {
  // Get master library resources (viewable by all authenticated users)
  getMasterLibrary: publicProcedure.query(async ({ ctx }) => {
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

    // All authenticated users (coaches and admins) can view master library
    // For debugging, let's also check what resources exist
    const allResources = await db.libraryResource.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(
      "All resources:",
      allResources.map(r => ({
        id: r.id,
        title: r.title,
        isMasterLibrary: r.isMasterLibrary,
        isActive: r.isActive,
      }))
    );

    const resources = allResources.filter(r => r.isMasterLibrary && r.isActive);

    console.log("Found", resources.length, "master library resources");
    return resources;
  }),

  // Get master library resources (admin only - for editing)
  getMasterLibraryForAdmin: publicProcedure.query(async ({ ctx }) => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Check if user is admin
    await requireAdmin(user.id);

    const resources = await db.libraryResource.findMany({
      where: {
        isMasterLibrary: true,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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

      // Check if user is admin
      await requireAdmin(user.id);

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

      // Check if user is admin
      await requireAdmin(user.id);

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

      return {
        message: "User admin status updated successfully",
        user: updatedUser,
      };
    }),
};
