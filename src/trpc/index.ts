import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { publicProcedure, router } from "./trpc"
import { TRPCError } from "@trpc/server"
import { db } from "@/db"
import { z } from "zod"
import {
  extractYouTubeVideoId,
  extractPlaylistId,
  getYouTubeThumbnail,
  fetchYouTubeVideoInfo,
  fetchPlaylistVideos,
} from "@/lib/youtube"
import { deleteFileFromUploadThing } from "@/lib/uploadthing-utils"

export const appRouter = router({
  authCallback: publicProcedure.query(
    async (): Promise<{
      success: boolean
      needsRoleSelection: boolean
      user: {
        id: string
        email: string
        role?: "COACH" | "CLIENT"
        name: string
      }
    }> => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user || !user.id || !user.email)
        throw new TRPCError({ code: "UNAUTHORIZED" })

      const dbUser = await db.user.findFirst({
        where: { id: user.id },
      })

      if (dbUser) {
        // EXISTING USER - This is the key fix
        if (dbUser.role) {
          // User exists AND has a role - skip role selection
          console.log("Existing user with role:", dbUser.role) // Add for debugging
          return {
            success: true,
            needsRoleSelection: false, // ← This should be FALSE for existing users with roles
            user: {
              id: dbUser.id,
              email: dbUser.email,
              role: dbUser.role as "COACH" | "CLIENT",
              name:
                dbUser.name || user.given_name || user.family_name || "User",
            },
          }
        } else {
          // User exists but no role - needs role selection
          console.log("Existing user without role") // Add for debugging
          return {
            success: true,
            needsRoleSelection: true,
            user: {
              id: dbUser.id,
              email: dbUser.email,
              name:
                dbUser.name || user.given_name || user.family_name || "User",
            },
          }
        }
      }

      // NEW USER LOGIC (rest stays the same)
      const existingClientRecord = await db.client.findFirst({
        where: {
          email: user.email,
          userId: null,
        },
      })

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
        })

        await db.client.update({
          where: { id: existingClientRecord.id },
          data: {
            userId: newClientUser.id,
            name: newClientUser.name || existingClientRecord.name,
          },
        })

        return {
          success: true,
          needsRoleSelection: false,
          user: {
            id: newClientUser.id,
            email: newClientUser.email,
            role: "CLIENT",
            name: newClientUser.name || existingClientRecord.name || "Client",
          },
        }
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
      }
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
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // First create the user record with no existing data check since this is role selection
        const updatedUser = await db.user.upsert({
          where: { id: user.id },
          update: { role: input.role },
          create: {
            id: user.id,
            email: user.email!,
            name:
              user.given_name && user.family_name
                ? `${user.given_name} ${user.family_name}`
                : null,
            role: input.role,
          },
        })

        // If they're selecting CLIENT role and provided a coachId, create client record
        if (input.role === "CLIENT" && input.coachId) {
          // Verify the coach exists
          const coach = await db.user.findFirst({
            where: { id: input.coachId, role: "COACH" },
          })

          if (!coach) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid coach selected",
            })
          }

          await db.client.create({
            data: {
              name: updatedUser.name || user.email?.split("@")[0] || "Client",
              email: user.email,
              coachId: input.coachId,
              userId: user.id,
            },
          })
        }

        return {
          role: updatedUser.role as "COACH" | "CLIENT",
          success: true,
        }
      }),

    getCoaches: publicProcedure.query(async () => {
      return await db.user.findMany({
        where: { role: "COACH" },
        select: {
          id: true,
          email: true,
          name: true,
        },
      })
    }),

    getProfile: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      return await db.user.findFirst({
        where: { id: user.id },
      })
    }),

    checkEmailExists: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const user = await db.user.findUnique({
          where: { email: input.email },
        })
        return !!user
      }),
  }),

  clients: router({
    list: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      })

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can view clients",
        })
      }

      const clients = await db.client.findMany({
        where: { coachId: user.id },
        orderBy: { createdAt: "desc" },
      })

      return clients
    }),

    dueSoon: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      })

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can view clients",
        })
      }

      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      return await db.client.findMany({
        where: {
          coachId: user.id,
          nextLessonDate: {
            lte: threeDaysFromNow,
            gte: new Date(),
          },
        },
        orderBy: { nextLessonDate: "asc" },
      })
    }),

    needsAttention: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      })

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can view clients",
        })
      }

      return await db.client.findMany({
        where: {
          coachId: user.id,
          OR: [
            { nextLessonDate: null },
            { nextLessonDate: { lt: new Date() } },
          ],
        },
        orderBy: { nextLessonDate: "asc" },
      })
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
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        })

        if (!coach) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can create clients",
          })
        }

        const newClient = await db.client.create({
          data: {
            name: input.name,
            email: input.email || null,
            phone: input.phone || null,
            notes: input.notes || null,
            coachId: user.id,
            nextLessonDate: input.nextLessonDate
              ? new Date(input.nextLessonDate)
              : null,
            lastCompletedWorkout: input.lastCompletedWorkout || null,
          },
        })

        return newClient
      }),

    delete: publicProcedure
      .input(
        z.object({
          id: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        })

        if (!coach) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can delete clients",
          })
        }

        const client = await db.client.findFirst({
          where: {
            id: input.id,
            coachId: user.id,
          },
        })

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          })
        }

        await db.client.delete({
          where: { id: input.id },
        })

        return { success: true }
      }),
  }),

  library: router({
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          category: z.string().optional(),
          difficulty: z.string().optional(),
          type: z.enum(["video", "document", "all"]).optional(),
        })
      )
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        })

        if (!coach) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can view library",
          })
        }

        const where: any = {
          coachId: user.id,
        }

        if (input.search) {
          where.OR = [
            { title: { contains: input.search, mode: "insensitive" } },
            { description: { contains: input.search, mode: "insensitive" } },
          ]
        }

        if (input.category && input.category !== "All") {
          where.category = input.category
        }

        if (input.difficulty && input.difficulty !== "All") {
          where.difficulty = input.difficulty
        }

        if (input.type && input.type !== "all") {
          where.type = input.type
        }

        const resources = await db.libraryResource.findMany({
          where,
          orderBy: { createdAt: "desc" },
        })

        return resources
      }),

    getStats: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      })

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can view library stats",
        })
      }

      const totalResources = await db.libraryResource.count({
        where: { coachId: user.id },
      })

      const videoCount = await db.libraryResource.count({
        where: { coachId: user.id, type: "video" },
      })

      const documentCount = await db.libraryResource.count({
        where: { coachId: user.id, type: "document" },
      })

      return {
        total: totalResources,
        videos: videoCount,
        documents: documentCount,
      }
    }),

    getAssignedVideos: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

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
      })
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
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        })

        if (!coach) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can assign videos",
          })
        }

        // Verify the video belongs to the coach
        const video = await db.libraryResource.findFirst({
          where: {
            id: input.videoId,
            coachId: user.id,
          },
        })

        if (!video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found or you don't own it",
          })
        }

        // Verify the client exists and is assigned to this coach
        const client = await db.client.findFirst({
          where: {
            userId: input.clientId,
            coachId: user.id,
          },
        })

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found or not assigned to you",
          })
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
        })

        return assignment
      }),

    // New procedure for clients to mark videos as completed
    markVideoAsCompleted: publicProcedure
      .input(
        z.object({
          videoId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

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
        })

        return assignment
      }),

    // New procedure for coaches to get assignments for a specific client
    getClientAssignments: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
        })
      )
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        })

        if (!coach) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can view client assignments",
          })
        }

        // Verify the client is assigned to this coach
        const client = await db.client.findFirst({
          where: {
            userId: input.clientId,
            coachId: user.id,
          },
        })

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found or not assigned to you",
          })
        }

        return await db.videoAssignment.findMany({
          where: {
            clientId: input.clientId,
          },
          include: {
            video: true,
          },
          orderBy: { assignedAt: "desc" },
        })
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        const resource = await db.libraryResource.findUnique({
          where: { id: input.id },
        })

        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          })
        }

        // Only increment views for the resource owner or allow access based on your business logic
        const dbUser = await db.user.findFirst({
          where: { id: user.id },
        })

        if (dbUser?.role === "COACH" && resource.coachId === user.id) {
          await db.libraryResource.update({
            where: { id: input.id },
            data: { views: { increment: 1 } },
          })
        }

        return resource
      }),

    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().min(1, "Description is required"),
          category: z.string().min(1, "Category is required"),
          difficulty: z.enum([
            "Beginner",
            "Intermediate",
            "Advanced",
            "All Levels",
          ]),
          type: z.enum(["video", "document"]),
          url: z.string().url(),
          duration: z.string().optional(),
          thumbnail: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        })

        if (!coach) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can create library resources",
          })
        }

        const newResource = await db.libraryResource.create({
          data: {
            title: input.title,
            description: input.description,
            category: input.category,
            difficulty: input.difficulty,
            type: input.type,
            url: input.url,
            duration: input.duration,
            thumbnail: input.thumbnail || "📚",
            coachId: user.id,
            views: 0,
            rating: 0,
          },
        })

        return newResource
      }),

    upload: publicProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          description: z.string().min(1).max(1000),
          category: z.string(),
          difficulty: z.string(),
          fileUrl: z.string().url(),
          filename: z.string(),
          contentType: z.string(),
          size: z.number(),
          thumbnail: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        })

        if (!coach) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can upload resources",
          })
        }

        const type = input.contentType.startsWith("video/")
          ? "video"
          : "document"

        const newResource = await db.libraryResource.create({
          data: {
            title: input.title,
            description: input.description,
            category: input.category,
            difficulty: input.difficulty as any,
            type: type as any,
            url: input.fileUrl,
            filename: input.filename,
            thumbnail: input.thumbnail || (type === "video" ? "🎥" : "📄"),
            coachId: user.id,
            views: 0,
            rating: 0,
          },
        })

        return {
          id: newResource.id,
          message: "Resource uploaded successfully",
          resource: newResource,
        }
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          difficulty: z
            .enum(["Beginner", "Intermediate", "Advanced", "All Levels"])
            .optional(),
          type: z.enum(["video", "document"]).optional(),
          url: z.string().url().optional(),
          duration: z.string().optional(),
          thumbnail: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        const resource = await db.libraryResource.findFirst({
          where: {
            id: input.id,
            coachId: user.id,
          },
        })

        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          })
        }

        const { id, ...updateData } = input

        const updatedResource = await db.libraryResource.update({
          where: { id: input.id },
          data: updateData,
        })

        return updatedResource
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        const resource = await db.libraryResource.findUnique({
          where: { id: input.id },
        })

        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          })
        }

        if (resource.coachId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own resources",
          })
        }

        if (!resource.isYoutube && resource.url) {
          const fileDeleted = await deleteFileFromUploadThing(resource.url)
          if (!fileDeleted) {
            console.warn(
              `Warning: Could not delete file from UploadThing for resource ${input.id}`
            )
          }
        }

        await db.libraryResource.delete({
          where: { id: input.id },
        })

        return {
          success: true,
          message: "Resource deleted successfully",
        }
      }),

    rate: publicProcedure
      .input(
        z.object({
          id: z.string(),
          rating: z.number().min(1).max(5),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        const resource = await db.libraryResource.findUnique({
          where: { id: input.id },
        })

        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          })
        }

        const updatedResource = await db.libraryResource.update({
          where: { id: input.id },
          data: { rating: input.rating },
        })

        return updatedResource
      }),

    getCategories: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      })

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can view categories",
        })
      }

      const categories = await db.libraryResource.groupBy({
        by: ["category"],
        where: { coachId: user.id },
        _count: { category: true },
      })

      return categories.map((cat) => ({
        name: cat.category,
        count: cat._count.category,
      }))
    }),

    importYouTubeVideo: publicProcedure
      .input(
        z.object({
          url: z.string().url(),
          category: z.string().min(1, "Category is required"),
          difficulty: z.enum([
            "Beginner",
            "Intermediate",
            "Advanced",
            "All Levels",
          ]),
          customTitle: z.string().optional(),
          customDescription: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        })

        if (!coach) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can import YouTube videos",
          })
        }

        const videoId = extractYouTubeVideoId(input.url)
        if (!videoId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid YouTube URL",
          })
        }

        const youtubeInfo = await fetchYouTubeVideoInfo(
          videoId,
          process.env.YOUTUBE_API_KEY
        )

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
            difficulty: input.difficulty,
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
        })

        return newResource
      }),

    importYouTubePlaylist: publicProcedure
      .input(
        z.object({
          playlistUrl: z.string().url(),
          category: z.string().min(1, "Category is required"),
          difficulty: z.enum([
            "Beginner",
            "Intermediate",
            "Advanced",
            "All Levels",
          ]),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        })

        if (!coach) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can import YouTube playlists",
          })
        }

        const playlistId = extractPlaylistId(input.playlistUrl)
        if (!playlistId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid YouTube playlist URL",
          })
        }

        const videos = await fetchPlaylistVideos(
          playlistId,
          process.env.YOUTUBE_API_KEY
        )

        if (videos.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No videos found in playlist or API key not configured",
          })
        }

        const createdResources = await Promise.all(
          videos.map(async (video: any) => {
            return await db.libraryResource.create({
              data: {
                title: video.title,
                description:
                  video.description || "Imported from YouTube playlist",
                category: input.category,
                difficulty: input.difficulty,
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
            })
          })
        )

        return {
          success: true,
          imported: createdResources.length,
          resources: createdResources,
        }
      }),
  }),

  messaging: router({
    getConversations: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      const userRole = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      })

      if (!userRole?.role) throw new TRPCError({ code: "UNAUTHORIZED" })

      const conversations = await db.conversation.findMany({
        where:
          userRole.role === "COACH"
            ? { coachId: user.id }
            : { clientId: user.id },
        include: {
          coach: { select: { id: true, name: true, email: true } },
          client: { select: { id: true, name: true, email: true } },
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
      })

      return conversations
    }),

    getMessages: publicProcedure
      .input(z.object({ conversationId: z.string() }))
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        const conversation = await db.conversation.findFirst({
          where: {
            id: input.conversationId,
            OR: [{ coachId: user.id }, { clientId: user.id }],
          },
        })

        if (!conversation) throw new TRPCError({ code: "FORBIDDEN" })

        const messages = await db.message.findMany({
          where: { conversationId: input.conversationId },
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        })

        await db.message.updateMany({
          where: {
            conversationId: input.conversationId,
            senderId: { not: user.id },
            isRead: false,
          },
          data: { isRead: true },
        })

        return messages
      }),

    sendMessage: publicProcedure
      .input(
        z.object({
          conversationId: z.string(),
          content: z.string().min(1).max(1000),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        const conversation = await db.conversation.findFirst({
          where: {
            id: input.conversationId,
            OR: [{ coachId: user.id }, { clientId: user.id }],
          },
        })

        if (!conversation) throw new TRPCError({ code: "FORBIDDEN" })

        const message = await db.message.create({
          data: {
            conversationId: input.conversationId,
            senderId: user.id,
            content: input.content,
          },
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
        })

        await db.conversation.update({
          where: { id: input.conversationId },
          data: { updatedAt: new Date() },
        })

        return message
      }),

    createConversation: publicProcedure
      .input(
        z.object({
          otherUserId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        const currentUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })

        const otherUser = await db.user.findUnique({
          where: { id: input.otherUserId },
          select: { role: true },
        })

        if (!currentUser?.role || !otherUser?.role) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid users" })
        }

        let coachId: string, clientId: string

        if (currentUser.role === "COACH" && otherUser.role === "CLIENT") {
          coachId = user.id
          clientId = input.otherUserId
        } else if (
          currentUser.role === "CLIENT" &&
          otherUser.role === "COACH"
        ) {
          coachId = input.otherUserId
          clientId = user.id
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only create conversations between coach and client",
          })
        }

        const existingConversation = await db.conversation.findUnique({
          where: {
            coachId_clientId: {
              coachId,
              clientId,
            },
          },
        })

        if (existingConversation) {
          return existingConversation
        }

        const conversation = await db.conversation.create({
          data: { coachId, clientId },
          include: {
            coach: { select: { id: true, name: true, email: true } },
            client: { select: { id: true, name: true, email: true } },
          },
        })

        return conversation
      }),

    getUnreadCount: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      const unreadCount = await db.message.count({
        where: {
          isRead: false,
          senderId: { not: user.id },
          conversation: {
            OR: [{ coachId: user.id }, { clientId: user.id }],
          },
        },
      })

      return unreadCount
    }),
  }),

  workouts: router({
    getTodaysWorkouts: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      // Find today's workouts for the logged-in client
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      return await db.workout.findMany({
        where: {
          clientId: user.id, // Changed from userId to clientId
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        orderBy: { date: "asc" },
      })
    }),
  }),

  progress: router({
    getClientProgress: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

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
      }
    }),
  }),

  events: router({
    getUpcoming: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      // Example: Fetch upcoming events for the client
      // Replace with your actual logic
      return await db.event.findMany({
        where: {
          clientId: user.id, // Changed from userId to clientId
          date: { gte: new Date() },
        },
        orderBy: { date: "asc" },
      })
    }),
  }),

  workoutTemplates: router({
    // Get all workout templates for a coach
    list: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      })

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can view workout templates",
        })
      }

      return (await db.workoutTemplate.findMany({
        where: { coachId: user.id },
        orderBy: { createdAt: "desc" },
      })) as any // or create a specific type
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
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        })

        if (!coach) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can create workout templates",
          })
        }

        return await db.workoutTemplate.create({
          data: {
            ...input,
            exercises: input.exercises as any,
            coachId: user.id,
          },
        })
      }),

    // Copy a workout template to create a new one
    copy: publicProcedure
      .input(z.object({ templateId: z.string() }))
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        const originalTemplate = await db.workoutTemplate.findFirst({
          where: {
            id: input.templateId,
            coachId: user.id,
          },
        })

        if (!originalTemplate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          })
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
        })
      }),
  }),

  scheduling: router({
    // Get weekly schedule for a client
    getWeeklySchedule: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          weekStart: z.date(),
        })
      )
      .query(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        })

        if (!coach) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can view schedules",
          })
        }

        const weekEnd = new Date(input.weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)

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
        })
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
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Verify user is a COACH
        const coach = await db.user.findFirst({
          where: { id: user.id, role: "COACH" },
        })

        if (!coach) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only coaches can update schedules",
          })
        }

        const weekEnd = new Date(input.weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)

        // Use transaction to ensure data consistency
        return await db.$transaction(async (tx) => {
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
          })

          // Delete existing days
          await tx.scheduledDay.deleteMany({
            where: { weeklyScheduleId: weeklySchedule.id },
          })

          // Create new days
          const createdDays = await Promise.all(
            input.days.map(async (day) => {
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
              })

              // Assign videos if provided
              if (day.videoIds && day.videoIds.length > 0) {
                await Promise.all(
                  day.videoIds.map((videoId) =>
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
                )
              }

              return createdDay
            })
          )

          return {
            weeklySchedule,
            days: createdDays,
          }
        })
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
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        // Calculate previous week start
        const previousWeekStart = new Date(input.currentWeekStart)
        previousWeekStart.setDate(previousWeekStart.getDate() - 7)

        const previousWeekEnd = new Date(previousWeekStart)
        previousWeekEnd.setDate(previousWeekEnd.getDate() + 6)

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
        })

        if (!previousSchedule) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No previous week schedule found to copy",
          })
        }

        // Copy to current week
        const currentWeekEnd = new Date(input.currentWeekStart)
        currentWeekEnd.setDate(currentWeekEnd.getDate() + 6)

        return await db.$transaction(async (tx) => {
          const newSchedule = await tx.weeklySchedule.create({
            data: {
              clientId: input.clientId,
              coachId: user.id,
              weekStart: input.currentWeekStart,
              weekEnd: currentWeekEnd,
            },
          })

          const copiedDays = await Promise.all(
            previousSchedule.days.map(async (day) => {
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
              })

              // Copy video assignments
              if (day.videoAssignments.length > 0) {
                await Promise.all(
                  day.videoAssignments.map((assignment) =>
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
                )
              }

              return newDay
            })
          )

          return {
            weeklySchedule: newSchedule,
            days: copiedDays,
          }
        })
      }),
  }),
})

export type AppRouter = typeof appRouter
