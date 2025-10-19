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
import { CompleteEmailService } from "@/lib/complete-email-service";

/**
 * Library Router
 */
export const libraryRouter = router({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        type: z.enum(["video", "document", "all"]).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log("🔍 Library list query called with input:", input);

        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) {
          console.error("❌ Library list: No user ID");
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        console.log("✅ Library list: User authenticated:", user.id);

        // Verify user is a COACH or CLIENT
        const dbUser = await db.user.findFirst({
          where: { id: user.id, role: { in: ["COACH", "CLIENT"] } },
        });

        if (!dbUser) {
          console.error("❌ Library list: User is not a coach or client");
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches and clients can view library",
          });
        }

        console.log("✅ Library list: User verification passed");

        const where: any = {};

        // If user is a COACH, show their own library items
        if (dbUser.role === "COACH") {
          where.coachId = user.id;
        } else if (dbUser.role === "CLIENT") {
          // If user is a CLIENT, find their assigned coach and show that coach's library items
          const client = await db.client.findFirst({
            where: { userId: user.id },
            select: { coachId: true },
          });

          if (!client) {
            console.error("❌ Library list: Client not found");
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Client profile not found",
            });
          }

          where.coachId = client.coachId || undefined;
        }

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

        console.log(
          "🔍 Library list: Query where clause:",
          JSON.stringify(where, null, 2)
        );

        const resources = await db.libraryResource.findMany({
          where,
          orderBy: { createdAt: "desc" },
        });

        console.log(`✅ Library list: Found ${resources.length} resources`);
        console.log(
          "📋 Library list: Resources:",
          resources.map(r => ({
            id: r.id,
            title: r.title,
            type: r.type,
            category: r.category,
          }))
        );

        return resources;
      } catch (error) {
        console.error("❌ Library list query failed:", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          input,
          timestamp: new Date().toISOString(),
        });

        // Re-throw TRPC errors as-is
        if (error instanceof TRPCError) {
          throw error;
        }

        // Wrap other errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Library list failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
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
        coachId: ensureUserId(user.id),
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
          coachId: ensureUserId(user.id),
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
            clientId: ensureUserId(user.id),
          },
        },
        type: "video",
      },
      include: {
        assignments: {
          where: {
            clientId: ensureUserId(user.id),
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
          coachId: ensureUserId(user.id),
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
        dueDate: z.string().transform(str => {
          // Parse the date string and create a date at midnight UTC to avoid timezone issues
          const [year, month, day] = str.split("-").map(Number);
          return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        }),
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
          coachId: ensureUserId(user.id),
        },
      });

      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not found or you don't own it",
        });
      }

      // Verify the client exists and is assigned to this coach
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

      const client = await db.client.findFirst({
        where: whereClause,
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found or not assigned to you",
        });
      }

      // Get the user ID from the client record
      if (!client.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client user not found",
        });
      }

      // Create or update the assignment using the user ID
      const assignment = await db.videoAssignment.upsert({
        where: {
          videoId_clientId: {
            videoId: input.videoId,
            clientId: client.userId, // Use the user ID instead of client ID
          },
        },
        update: {
          dueDate: input.dueDate,
          notes: input.notes,
        },
        create: {
          videoId: input.videoId,
          clientId: client.userId, // Use the user ID instead of client ID
          dueDate: input.dueDate,
          notes: input.notes,
        },
      });

      // Send email notification to client about video assignment
      if (client.email) {
        try {
          // Get video details for the email
          const video = await db.libraryResource.findFirst({
            where: { id: input.videoId },
            select: { title: true, description: true },
          });

          // Get coach details
          const coach = await db.user.findFirst({
            where: { id: ensureUserId(user.id) },
            select: { name: true, email: true },
          });

          const emailService = CompleteEmailService.getInstance();
          await emailService.sendVideoAssigned(
            client.email,
            client.name || "Client",
            coach?.name || "Coach",
            video?.title || "New Video Assignment"
          );
          console.log(`📧 Video assignment email sent to ${client.email}`);
        } catch (error) {
          console.error(
            `Failed to send video assignment email to ${client.email}:`,
            error
          );
        }
      }

      return assignment;
    }),

  // New procedure for coaches to remove video assignments from clients
  removeVideoAssignment: publicProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        clientId: z.string(),
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
          message: "Only coaches can remove video assignments",
        });
      }

      // Find the client to verify the coach has access
      const client = await db.client.findFirst({
        where: { id: input.clientId },
        select: { id: true, coachId: true, userId: true },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      if (!client.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client user ID not found",
        });
      }

      if (!client.coachId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client coach ID not found",
        });
      }

      // Check if coach has access to this client
      if (client.coachId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this client",
        });
      }

      // Verify the assignment exists and belongs to this client
      const existingAssignment = await db.videoAssignment.findFirst({
        where: {
          id: input.assignmentId,
          clientId: client.userId, // Use the user ID from the client record
        },
      });

      if (!existingAssignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video assignment not found or not assigned to this client",
        });
      }

      // Delete the video assignment
      await db.videoAssignment.delete({
        where: {
          id: input.assignmentId,
        },
      });

      return { success: true };
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
            clientId: ensureUserId(user.id),
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

      // Check if coach is in an organization
      const coachOrganization = await db.coachOrganization.findFirst({
        where: {
          coachId: ensureUserId(user.id),
          isActive: true,
        },
      });

      // First, get the client record to verify it exists and get the user ID
      const client = await db.client.findFirst({
        where: { id: input.clientId },
        select: {
          id: true,
          userId: true,
          coachId: true,
          archived: true,
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      if (client.archived) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client is archived",
        });
      }

      if (!client.coachId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client coach ID not found",
        });
      }

      // Check if coach has access to this client
      let hasAccess = false;

      if (coachOrganization?.organizationId) {
        // Check if client belongs to any coach in the organization
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
        hasAccess = orgCoachIds.includes(client.coachId);
      } else {
        // Not in an organization, only allow access to own clients
        hasAccess = client.coachId === ensureUserId(user.id);
      }

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this client",
        });
      }

      if (!client.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client user ID not found",
        });
      }

      // Get all types of assignments for this client
      const [videoAssignments, routineAssignments, programAssignments] =
        await Promise.all([
          // Video assignments - use userId since video assignments are stored with user ID
          db.videoAssignment.findMany({
            where: { clientId: client.userId },
            include: { video: true },
            orderBy: { assignedAt: "desc" },
          }),
          // Routine assignments - use client ID (Client model ID)
          db.routineAssignment.findMany({
            where: { clientId: input.clientId },
            include: { routine: true },
            orderBy: { assignedAt: "desc" },
          }),
          // Program assignments - use client ID (Client model ID)
          db.programAssignment.findMany({
            where: { clientId: input.clientId },
            include: { program: true },
            orderBy: { assignedAt: "desc" },
          }),
        ]);

      return {
        videoAssignments,
        routineAssignments,
        programAssignments,
      };
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
          coachId: ensureUserId(user.id),
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
        category: z.string().min(1).max(100), // Allow any category name
        fileUrl: z.string().url(),
        filename: z.string(),
        contentType: z.string(),
        size: z.number(),
        thumbnail: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log("🚀 Starting upload mutation for user:", input.title);

        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) {
          console.error("❌ Upload failed: No user ID");
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        console.log("✅ User authenticated:", user.id);

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        });

        if (!coach) {
          console.error("❌ Upload failed: User is not a coach");
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can upload resources",
          });
        }

        console.log("✅ Coach verification passed");

        const type = input.contentType.startsWith("video/")
          ? "video"
          : "document";

        console.log("📝 Creating database record with data:", {
          title: input.title,
          type,
          fileUrl: input.fileUrl,
          filename: input.filename,
          coachId: ensureUserId(user.id),
        });

        // Use transaction to ensure data consistency
        const newResource = await db.$transaction(async tx => {
          const resource = await tx.libraryResource.create({
            data: {
              title: input.title,
              description: input.description || "",
              category: input.category,
              type: type as any,
              url: input.fileUrl,
              filename: input.filename,
              thumbnail: input.thumbnail || (type === "video" ? "🎥" : "📄"),
              coachId: ensureUserId(user.id),
              views: 0,
              rating: 0,
            },
          });

          console.log("✅ Database record created successfully:", resource.id);
          return resource;
        });

        console.log("🎉 Upload completed successfully:", newResource.id);

        return {
          id: newResource.id,
          message: "Resource uploaded successfully",
          resource: newResource,
        };
      } catch (error) {
        console.error("❌ Upload mutation failed:", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          input: {
            title: input.title,
            filename: input.filename,
            contentType: input.contentType,
          },
          timestamp: new Date().toISOString(),
        });

        // Re-throw TRPC errors as-is
        if (error instanceof TRPCError) {
          throw error;
        }

        // Wrap other errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Upload failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
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
          coachId: ensureUserId(user.id),
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
      try {
        console.log("🚀 Starting YouTube import for URL:", input.url);

        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user?.id) {
          console.error("❌ YouTube import failed: No user ID");
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        console.log("✅ User authenticated:", user.id);

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        });

        if (!coach) {
          console.error("❌ YouTube import failed: User is not a coach");
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can import YouTube videos",
          });
        }

        console.log("✅ Coach verification passed");

        const videoId = extractYouTubeVideoId(input.url);
        if (!videoId) {
          console.error("❌ YouTube import failed: Invalid URL");
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid YouTube URL",
          });
        }

        console.log("✅ YouTube video ID extracted:", videoId);

        const youtubeInfo = await fetchYouTubeVideoInfo(
          videoId,
          process.env.YOUTUBE_API_KEY
        );

        console.log("✅ YouTube info fetched:", youtubeInfo?.title);

        // Use transaction to ensure data consistency
        const newResource = await db.$transaction(async tx => {
          const resource = await tx.libraryResource.create({
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
              coachId: ensureUserId(user.id),
              views: 0,
              rating: 0,
            },
          });

          console.log("✅ YouTube video imported successfully:", resource.id);
          return resource;
        });

        console.log(
          "🎉 YouTube import completed successfully:",
          newResource.id
        );
        return newResource;
      } catch (error) {
        console.error("❌ YouTube import failed:", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          input: {
            url: input.url,
            category: input.category,
          },
          timestamp: new Date().toISOString(),
        });

        // Re-throw TRPC errors as-is
        if (error instanceof TRPCError) {
          throw error;
        }

        // Wrap other errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `YouTube import failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    }),

  importYouTubePlaylist: publicProcedure
    .input(
      z.object({
        playlistUrl: z.string().url(),
        category: z.string().min(1, "Category is required"),
        customName: z.string().optional(),
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
              title: input.customName || video.title,
              description:
                video.description || "Imported from YouTube playlist",
              category: input.category,
              type: "video",
              url: `https://www.youtube.com/watch?v=${video.videoId}`,
              youtubeId: video.videoId,
              playlistId: playlistId,
              thumbnail: video.thumbnail || getYouTubeThumbnail(video.videoId),
              isYoutube: true,
              coachId: ensureUserId(user.id),
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

  // Import OnForm video
  importOnFormVideo: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
        category: z.string().min(1, "Category is required"),
        customTitle: z.string().optional(),
        customDescription: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log("🚀 Starting OnForm import for URL:", input.url);

        const { getUser } = getKindeServerSession();
        const user = await getUser();

        console.log("🔍 OnForm import - User session:", {
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
        });

        if (!user?.id) {
          console.error("❌ OnForm import failed: No user ID");
          console.error("❌ OnForm import - Full user object:", user);
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        console.log("✅ User authenticated:", user.id);

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        });

        if (!coach) {
          console.error("❌ OnForm import failed: User is not a coach");
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can import OnForm videos",
          });
        }

        console.log("✅ Coach verification passed");

        // Import OnForm utilities
        const { extractOnFormId, isOnFormUrl, convertOnFormLinkToEmbed } =
          await import("@/lib/onform-utils");

        if (!isOnFormUrl(input.url)) {
          console.error("❌ OnForm import failed: Invalid URL");
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid OnForm URL. Please use a valid OnForm video URL.",
          });
        }

        const onformId = extractOnFormId(input.url);
        if (!onformId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Could not extract OnForm video ID from URL",
          });
        }

        console.log("✅ OnForm video ID extracted:", onformId);

        console.log("✅ OnForm original URL:", input.url);

        // Use transaction to ensure data consistency
        const newResource = await db.$transaction(async tx => {
          const resource = await tx.libraryResource.create({
            data: {
              title: input.customTitle || `OnForm Video ${onformId}`,
              description: input.customDescription || "Imported from OnForm",
              category: input.category,
              type: "video",
              url: input.url, // Store the original OnForm share URL
              onformId: onformId,
              isOnForm: true,
              coachId: ensureUserId(user.id),
              views: 0,
              rating: 0,
            },
          });

          console.log("✅ OnForm video imported successfully:", resource.id);
          return resource;
        });

        console.log("🎉 OnForm import completed successfully:", newResource.id);
        return newResource;
      } catch (error) {
        console.error("❌ OnForm import failed:", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          input: {
            url: input.url,
            category: input.category,
          },
          timestamp: new Date().toISOString(),
        });

        // Re-throw TRPC errors as-is
        if (error instanceof TRPCError) {
          throw error;
        }

        // Wrap other errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `OnForm import failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
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
        coachId: ensureUserId(user.id),
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
});
