import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { ensureUserId } from "./_helpers";
import { z } from "zod";

/**
 * Sidebar Router
 * Batched queries for sidebar data to reduce database calls
 */
export const sidebarRouter = router({
  getSidebarData: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const userId = ensureUserId(user.id);

    // Get all sidebar data in parallel
    const [
      unreadCountsObj,
      unreadNotificationCount,
      userSettings,
      organization,
    ] = await Promise.all([
      // Get conversation unread counts
      db.message
        .groupBy({
          by: ["conversationId"],
          where: {
            conversation: {
              OR: [
                { coachId: userId },
                { clientId: userId },
                { client1Id: userId },
                { client2Id: userId },
              ],
            },
            isRead: false,
            senderId: { not: userId }, // Don't count own messages
          },
          _count: {
            id: true,
          },
        })
        .then(result =>
          result.reduce((acc, item) => {
            acc[item.conversationId] = item._count.id;
            return acc;
          }, {} as Record<string, number>)
        ),

      // Get unread notification count
      db.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),

      // Get user settings
      db.userSettings.findUnique({
        where: { userId },
        select: {
          avatarUrl: true,
          theme: true,
          compactSidebar: true,
        },
      }),

      // Get organization data
      db.user.findUnique({
        where: { id: userId },
        select: {
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
              tier: true,
            },
          },
        },
      }),
    ]);

    // Calculate total unread count
    const totalUnreadCount = Object.values(unreadCountsObj).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      unreadCountsObj,
      totalUnreadCount,
      unreadNotificationCount,
      userSettings,
      organization: organization?.organization,
      isInOrganization: !!organization?.organizationId,
    };
  }),

  getRecentConversations: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const userId = ensureUserId(user.id);

    // Get recent conversations with unread counts
    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { coachId: userId },
          { clientId: userId },
          { client1Id: userId },
          { client2Id: userId },
        ],
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
            settings: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            settings: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        client1: {
          select: {
            id: true,
            name: true,
            email: true,
            settings: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        client2: {
          select: {
            id: true,
            name: true,
            email: true,
            settings: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    return conversations;
  }),

  getDashboardData: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const userId = ensureUserId(user.id);

    // Get all dashboard data in parallel
    const [clients, events, programs, todaysLessons] = await Promise.all([
      // Get active clients
      db.client.findMany({
        where: {
          coachId: userId,
          archived: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          lastActivity: true,
        },
        orderBy: { lastActivity: "desc" },
        take: 10,
      }),

      // Get upcoming events
      db.event.findMany({
        where: {
          coachId: userId,
          date: {
            gte: new Date(),
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { date: "asc" },
        take: 10,
      }),

      // Get programs
      db.program.findMany({
        where: {
          coachId: userId,
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Get today's lessons
      db.event.findMany({
        where: {
          coachId: userId,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { date: "asc" },
      }),
    ]);

    // Calculate stats
    const totalClients = clients.length;
    const totalPrograms = programs.length;
    const totalLessons = todaysLessons.length;
    const completionRate = 0; // TODO: Calculate from actual data when needed

    return {
      clients,
      events,
      programs,
      todaysLessons,
      stats: {
        totalClients,
        totalPrograms,
        totalLessons,
        completionRate,
      },
    };
  }),

  getLibraryData: publicProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          category: z.string().optional(),
          tab: z.enum(["master", "local"]).default("local"),
        })
        .optional()
    )
    .query(async ({ input = {} }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const userId = ensureUserId(user.id);
      const { search, category, tab = "local" } = input;

      // Get all library data in parallel
      const [userCategories, libraryItems] = await Promise.all([
        // Get user's custom categories
        db.libraryResource
          .findMany({
            where: {
              coachId: userId,
            },
            select: {
              category: true,
            },
            distinct: ["category"],
          })
          .then(result => result.map(item => ({ name: item.category }))),

        // Get library items based on tab
        tab === "master"
          ? db.libraryResource.findMany({
              where: {
                isMasterLibrary: true,
                isActive: true,
                ...(search && {
                  OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                  ],
                }),
                ...(category && category !== "All" && { category }),
              },
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                category: true,
                url: true,
                thumbnail: true,
                duration: true,
                rating: true,
                views: true,
                createdAt: true,
                isYoutube: true,
                youtubeId: true,
                filename: true,
                contentType: true,
                size: true,
              },
              orderBy: [
                { isFeatured: "desc" },
                { rating: "desc" },
                { views: "desc" },
                { createdAt: "desc" },
              ],
            })
          : db.libraryResource.findMany({
              where: {
                coachId: userId,
                isActive: true,
                ...(search && {
                  OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                  ],
                }),
                ...(category && category !== "All" && { category }),
              },
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
                category: true,
                url: true,
                thumbnail: true,
                duration: true,
                rating: true,
                views: true,
                createdAt: true,
                isYoutube: true,
                youtubeId: true,
                filename: true,
                contentType: true,
                size: true,
              },
              orderBy: [
                { isFeatured: "desc" },
                { rating: "desc" },
                { views: "desc" },
                { createdAt: "desc" },
              ],
            }),
      ]);

      return {
        userCategories,
        libraryItems,
        totalItems: libraryItems.length,
        tab,
        search: search || "",
        category: category || "All",
      };
    }),
});
