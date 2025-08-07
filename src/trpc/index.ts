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

      if (!dbUser) {
        const newUser = await db.user.create({
          data: {
            id: user.id,
            email: user.email,
            name:
              user.given_name && user.family_name
                ? `${user.given_name} ${user.family_name}`
                : null,
          },
        })

        return {
          success: true,
          needsRoleSelection: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            name:
              newUser.name ||
              user.given_name ||
              user.family_name ||
              user.email?.split("@")[0] ||
              "User",
          },
        }
      }

      if (!dbUser.role) {
        return {
          success: true,
          needsRoleSelection: true,
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name:
              dbUser.name ||
              user.given_name ||
              user.family_name ||
              user.email?.split("@")[0] ||
              "User",
          },
        }
      }

      return {
        success: true,
        needsRoleSelection: false,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role as "COACH" | "CLIENT",
          name:
            dbUser.name ||
            user.given_name ||
            user.family_name ||
            user.email?.split("@")[0] ||
            "User",
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

        const updatedUser = await db.user.update({
          where: { id: user.id },
          data: { role: input.role },
        })

        if (input.role === "CLIENT" && input.coachId) {
          await db.client.create({
            data: {
              name:
                user.given_name && user.family_name
                  ? `${user.given_name} ${user.family_name}`
                  : user.email?.split("@")[0] || "Client",
              coachId: input.coachId,
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
  }),

  getMyClients: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

    const clients = await db.client.findMany({
      where: { coachId: user.id },
      orderBy: { nextLessonDate: "asc" },
    })

    return clients
  }),

  clients: router({
    list: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

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
          nextLessonDate: z.string().optional(),
          lastCompletedWorkout: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

        const newClient = await db.client.create({
          data: {
            name: input.name,
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

        const where: any = {}

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

        await db.libraryResource.update({
          where: { id: input.id },
          data: { views: { increment: 1 } },
        })

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
          url: z.string().url("Valid URL is required"),
          duration: z.string().optional(),
          thumbnail: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

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

        await db.libraryResource.delete({
          where: { id: input.id },
        })

        return { success: true }
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

    getStats: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      const totalResources = await db.libraryResource.count()
      const videoCount = await db.libraryResource.count({
        where: { type: "video" },
      })
      const documentCount = await db.libraryResource.count({
        where: { type: "document" },
      })

      const avgRating = await db.libraryResource.aggregate({
        _avg: { rating: true },
      })

      return {
        totalResources,
        videoCount,
        documentCount,
        avgRating: avgRating._avg.rating || 0,
      }
    }),

    getCategories: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      const categories = await db.libraryResource.groupBy({
        by: ["category"],
        _count: { category: true },
      })

      return categories.map((cat) => ({
        name: cat.category,
        count: cat._count.category,
      }))
    }),

    // YouTube import procedures
    importYouTubeVideo: publicProcedure
      .input(
        z.object({
          url: z.string().url("Valid YouTube URL is required"),
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
            type: "youtube",
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
          playlistUrl: z.string().url("Valid YouTube playlist URL is required"),
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
                type: "youtube",
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
})

export type AppRouter = typeof appRouter
