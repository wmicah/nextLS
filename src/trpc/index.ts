import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { publicProcedure, router } from "./trpc"
import { TRPCError } from "@trpc/server"
import { db } from "@/db"
import { z } from "zod"

export const appRouter = router({
  authCallback: publicProcedure.query(
    async (): Promise<{
      success: boolean
      needsRoleSelection: boolean
      user: {
        id: string
        email: string
        role?: "COACH" | "CLIENT" // Make role optional
        name: string
      }
    }> => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user || !user.id || !user.email)
        throw new TRPCError({ code: "UNAUTHORIZED" })

      // Check if user exists in database
      const dbUser = await db.user.findFirst({
        where: { id: user.id },
      })

      if (!dbUser) {
        // Create new user WITHOUT a role
        const newUser = await db.user.create({
          data: {
            id: user.id,
            email: user.email,
            name:
              user.given_name && user.family_name
                ? `${user.given_name} ${user.family_name}`
                : null,
            // ✅ Don't set role initially - let them choose
          },
        })

        return {
          success: true,
          needsRoleSelection: true, // Always true for new users
          user: {
            id: newUser.id,
            email: newUser.email,
            // role: undefined, // No role set yet
            name:
              newUser.name ||
              user.given_name ||
              user.family_name ||
              user.email?.split("@")[0] ||
              "User",
          },
        }
      }

      // For existing users, check if they have a role
      if (!dbUser.role) {
        return {
          success: true,
          needsRoleSelection: true, // They need to select a role
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

        // If user is a client and selected a coach, create the client record
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

        // ✅ Return the role that was actually set
        return {
          role: updatedUser.role as "COACH" | "CLIENT",
          success: true,
        }
      }),

    getCoaches: publicProcedure.query(async () => {
      // This queries Users who have the role of COACH
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

  // ✅ Keep this query - it's working correctly
  getMyClients: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    console.log("🔍 SERVER: getMyClients - User ID:", user?.id) // Debug log

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

    // Get the coach's clients
    const clients = await db.client.findMany({
      where: { coachId: user.id },
      orderBy: { nextLessonDate: "asc" }, // Show upcoming lessons first
    })

    console.log(
      "🔍 SERVER: getMyClients - Found clients:",
      clients.length,
      clients
    ) // Debug log

    return clients
  }),

  clients: router({
    // ✅ FIX: Make this query actually return the coach's clients
    list: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      console.log("🔍 SERVER: clients.list - User ID:", user?.id) // Debug log

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      // Get the coach's clients - same as getMyClients
      const clients = await db.client.findMany({
        where: { coachId: user.id },
        orderBy: { createdAt: "desc" },
      })

      console.log(
        "🔍 SERVER: clients.list - Found clients:",
        clients.length,
        clients
      ) // Debug log

      return clients
    }),
    dueSoon: publicProcedure.query(async () => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

      // Return clients with lessons due soon
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

      // Return clients who haven't had a lesson in a while or have no upcoming lessons
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      return await db.client.findMany({
        where: {
          coachId: user.id,
          OR: [
            { nextLessonDate: null },
            { nextLessonDate: { lt: new Date() } }, // Past due lessons
          ],
        },
        orderBy: { nextLessonDate: "asc" },
      })
    }),
    // Add this to your clients router
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
    // Add this to your clients router
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

        // Verify the client belongs to the user
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
})

export type AppRouter = typeof appRouter
