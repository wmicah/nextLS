import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { ensureUserId } from "./_helpers";
import { z } from "zod";
import { format } from "date-fns";

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

  // Optimized batched query for entire dashboard - reduces round trips
  getDashboardDataBatched: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const userId = ensureUserId(user.id);

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    // Get all dashboard data in a single batched query
    const [
      clients,
      todaysLessons,
      todaysEvents,
      thisMonthLessons,
      upcomingEvents,
      programs,
      totalClientsCount,
      totalProgramsCount,
      thisWeekLessons,
      clientIds,
    ] = await Promise.all([
      // Active clients
      db.client.findMany({
        where: { coachId: userId, archived: false },
        select: { id: true, name: true, email: true, avatar: true, lastActivity: true },
        orderBy: { lastActivity: "desc" },
        take: 10,
      }),

      // Today's lessons
      db.event.findMany({
        where: {
          coachId: userId,
          date: { gte: today, lte: endOfToday },
        },
        include: {
          client: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { date: "asc" },
      }),

      // Today's reminders (events without client)
      db.event.findMany({
        where: {
          coachId: userId,
          date: { gte: today, lte: endOfToday },
          clientId: null,
          status: "PENDING",
        },
        orderBy: { date: "asc" },
      }),

      // This month's lessons (for WeekAtAGlance)
      db.event.findMany({
        where: {
          coachId: userId,
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
        },
        include: {
          client: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { date: "asc" },
      }),

      // Upcoming events
      db.event.findMany({
        where: { coachId: userId, date: { gte: now } },
        include: {
          client: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { date: "asc" },
        take: 10,
      }),

      // Programs
      db.program.findMany({
        where: { coachId: userId },
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Counts
      db.client.count({ where: { coachId: userId, archived: false } }),
      db.program.count({ where: { coachId: userId } }),
      db.event.count({
        where: { coachId: userId, date: { gte: startOfWeek, lte: endOfWeek } },
      }),

      // Get client IDs for completions query
      db.client.findMany({
        where: { coachId: userId, archived: false },
        select: { id: true },
      }),
    ]);

    const clientIdList = clientIds.map((c) => c.id);

      // Get completions and attention items in parallel (only if we have clients)
      const [recentCompletions, attentionItems, conversations] = await Promise.all([
        // Recent completions - match the original getRecentCompletions logic
        clientIdList.length > 0
          ? Promise.all([
              db.programDrillCompletion.findMany({
                where: {
                  clientId: { in: clientIdList },
                  completedAt: { gte: threeDaysAgo },
                },
                select: {
                  id: true,
                  clientId: true,
                  completedAt: true,
                  client: { select: { id: true, name: true } },
                  drill: { select: { id: true, title: true } },
                  programAssignment: {
                    select: {
                      program: { select: { id: true, title: true } },
                    },
                  },
                },
                orderBy: { completedAt: "desc" },
                take: 100,
              }).catch(() => []),
              db.routineExerciseCompletion.findMany({
                where: {
                  clientId: { in: clientIdList },
                  completedAt: { gte: threeDaysAgo },
                },
                select: {
                  id: true,
                  clientId: true,
                  completedAt: true,
                  client: { select: { id: true, name: true } },
                  routineAssignment: {
                    select: {
                      routine: { select: { id: true, name: true } },
                    },
                  },
                },
                orderBy: { completedAt: "desc" },
                take: 100,
              }).catch(() => []),
              db.exerciseCompletion.findMany({
                where: {
                  clientId: { in: clientIdList },
                  completed: true,
                  completedAt: {
                    not: null,
                    gte: threeDaysAgo,
                  },
                },
                select: {
                  id: true,
                  clientId: true,
                  completedAt: true,
                  programDrillId: true,
                  exerciseId: true,
                  client: { select: { id: true, name: true } },
                },
                orderBy: { completedAt: "desc" },
                take: 100,
              }).catch(() => []),
            ]).then(async ([programCompletions, routineCompletions, exerciseCompletions]) => {
              // Combine all completions into a unified format (matching original logic)
              const allCompletions: any[] = [];

              // Add program drill completions
              programCompletions.forEach((c) => {
                if (c.client && c.drill && c.programAssignment?.program) {
                  allCompletions.push({
                    id: `program-${c.id}`,
                    clientId: c.clientId,
                    clientName: c.client.name,
                    type: "program",
                    title: c.drill.title,
                    programTitle: c.programAssignment.program.title,
                    completedAt: c.completedAt,
                  });
                }
              });

              // Add routine exercise completions
              routineCompletions.forEach((c) => {
                if (c.client && c.routineAssignment?.routine) {
                  allCompletions.push({
                    id: `routine-${c.id}`,
                    clientId: c.clientId,
                    clientName: c.client.name,
                    type: "routine",
                    title: "Routine exercise",
                    programTitle: c.routineAssignment.routine.name,
                    completedAt: c.completedAt,
                  });
                }
              });

              // Handle exercise completions - need to fetch program/routine info
              const exerciseCompletionsWithProgramDrill = exerciseCompletions.filter(
                (c) => c.client && c.completedAt && c.programDrillId && c.programDrillId !== "standalone-routine"
              );
              const exerciseCompletionsWithStandaloneRoutine = exerciseCompletions.filter(
                (c) => c.client && c.completedAt && c.programDrillId === "standalone-routine"
              );
              const exerciseCompletionsStandalone = exerciseCompletions.filter(
                (c) => c.client && c.completedAt && !c.programDrillId
              );

              // Fetch program drill info for exercise completions
              const uniqueProgramDrillIds = [
                ...new Set(exerciseCompletionsWithProgramDrill.map((c) => c.programDrillId).filter(Boolean)),
              ] as string[];
              const programDrillsMap = new Map<string, string | null>();
              if (uniqueProgramDrillIds.length > 0) {
                try {
                  const programDrills = await db.programDrill.findMany({
                    where: { id: { in: uniqueProgramDrillIds } },
                    select: {
                      id: true,
                      day: {
                        select: {
                          week: {
                            select: {
                              program: { select: { title: true } },
                            },
                          },
                        },
                      },
                    },
                  });
                  programDrills.forEach((drill) => {
                    programDrillsMap.set(drill.id, drill.day?.week?.program?.title || null);
                  });
                } catch (err) {
                  console.error("Error batch fetching program drills:", err);
                }
              }

              // Fetch routine info for standalone routine exercises
              const uniqueExerciseIds = [
                ...new Set(exerciseCompletionsWithStandaloneRoutine.map((c) => c.exerciseId).filter(Boolean)),
              ] as string[];
              const routineMap = new Map<string, string | null>();
              if (uniqueExerciseIds.length > 0) {
                try {
                  const routineExercises = await db.routineExercise.findMany({
                    where: { id: { in: uniqueExerciseIds } },
                    select: {
                      id: true,
                      routine: { select: { id: true, name: true } },
                    },
                  });
                  routineExercises.forEach((exercise) => {
                    routineMap.set(exercise.id, exercise.routine?.name || null);
                  });
                } catch (err) {
                  console.error("Error batch fetching routine exercises:", err);
                }
              }

              // Add exercise completions with program info
              exerciseCompletionsWithProgramDrill.forEach((c) => {
                allCompletions.push({
                  id: `exercise-${c.id}`,
                  clientId: c.clientId,
                  clientName: c.client!.name,
                  type: "exercise",
                  title: "Exercise",
                  programTitle: programDrillsMap.get(c.programDrillId!) || null,
                  completedAt: c.completedAt,
                });
              });

              // Add standalone routine exercise completions
              exerciseCompletionsWithStandaloneRoutine.forEach((c) => {
                allCompletions.push({
                  id: `exercise-${c.id}`,
                  clientId: c.clientId,
                  clientName: c.client!.name,
                  type: "routine",
                  title: "Routine exercise",
                  programTitle: routineMap.get(c.exerciseId) || null,
                  completedAt: c.completedAt,
                });
              });

              // Add standalone exercises
              exerciseCompletionsStandalone.forEach((c) => {
                allCompletions.push({
                  id: `exercise-${c.id}`,
                  clientId: c.clientId,
                  clientName: c.client!.name,
                  type: "exercise",
                  title: "Exercise",
                  programTitle: null,
                  completedAt: c.completedAt,
                });
              });

              // Group by client and date (day) - matching original logic
              const groupedByDay = new Map<string, any>();
              allCompletions
                .filter((c) => c.completedAt)
                .forEach((completion) => {
                  const date = new Date(completion.completedAt);
                  const dateKey = `${completion.clientId}-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

                  if (!groupedByDay.has(dateKey)) {
                    groupedByDay.set(dateKey, {
                      id: dateKey,
                      clientId: completion.clientId,
                      clientName: completion.clientName,
                      completedAt: completion.completedAt,
                      count: 1,
                      types: new Set([completion.type]),
                      latestCompletion: completion,
                      programTitle: completion.programTitle || null,
                      completionType: completion.type,
                    });
                  } else {
                    const group = groupedByDay.get(dateKey)!;
                    group.count += 1;
                    group.types.add(completion.type);
                    if (new Date(completion.completedAt) > new Date(group.completedAt)) {
                      group.completedAt = completion.completedAt;
                      group.latestCompletion = completion;
                      if (completion.programTitle) {
                        group.programTitle = completion.programTitle;
                      }
                      if (completion.programTitle) {
                        group.completionType = completion.type;
                      }
                    } else {
                      if (completion.programTitle && !group.programTitle) {
                        group.programTitle = completion.programTitle;
                        group.completionType = completion.type;
                      }
                    }
                  }
                });

              // Convert to array, sort, and limit to top 9
              return Array.from(groupedByDay.values())
                .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                .slice(0, 9);
            })
        : Promise.resolve([]),

      // Attention items - use ClientVideoSubmission (has direct client relationship)
      db.clientVideoSubmission.findMany({
        where: {
          coachId: userId,
          comment: null, // No comment means not reviewed yet
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          drill: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }).then((videos) =>
        videos
          .filter((v) => v.client && v.client.name) // Filter out videos without a client or client name
          .map((v) => ({
            id: `video-${v.id}`,
            type: "video_review",
            priority: 1,
            clientName: v.client.name.trim() || "Unknown", // Ensure we have a name, fallback to Unknown if empty
            clientId: v.client.id,
            title: v.drill?.title 
              ? `submitted a video: ${v.drill.title}` 
              : `submitted a video: ${v.title}`,
            description: v.description || v.title || "",
            timestamp: v.createdAt.toISOString(),
            href: `/videos/${v.id}`,
            actionButton: "Review",
          }))
      ),

      // Conversations for unread messages
      db.conversation.findMany({
        where: {
          OR: [{ coachId: userId }, { clientId: userId }],
        },
        include: {
          coach: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
          messages: {
            where: { isRead: false, senderId: { not: userId } },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, content: true, createdAt: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
    ]);

    // Calculate completion rate - match original getDashboardData logic
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Only include clients that are NOT archived AND have at least one assignment
    const clientsWithAssignments = await db.client.findMany({
      where: {
        coachId: userId,
        archived: false,
        OR: [
          {
            programAssignments: {
              some: {
                program: {
                  status: {
                    not: "ARCHIVED",
                  },
                },
              },
            },
          },
          {
            routineAssignments: {
              some: {},
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    const clientIdsWithAssignments = clientsWithAssignments.map((c) => c.id);
    let completionRate = 0;

    if (clientIdsWithAssignments.length > 0) {
      const [recentCompletions, totalAssignments] = await Promise.all([
        // Get recent completions (last 30 days) - only from clients with assignments
        Promise.all([
          db.programDrillCompletion.count({
            where: {
              clientId: { in: clientIdsWithAssignments },
              completedAt: { gte: thirtyDaysAgo },
            },
          }),
          db.routineExerciseCompletion.count({
            where: {
              clientId: { in: clientIdsWithAssignments },
              completedAt: { gte: thirtyDaysAgo },
            },
          }),
          db.exerciseCompletion.count({
            where: {
              completed: true,
              completedAt: {
                gte: thirtyDaysAgo,
              },
              clientId: { in: clientIdsWithAssignments },
            },
          }),
        ]).then(([a, b, c]) => a + b + c),
        // Get total active assignments - only from clients with assignments
        Promise.all([
          db.programAssignment.count({
            where: {
              clientId: { in: clientIdsWithAssignments },
              program: {
                status: {
                  not: "ARCHIVED",
                },
              },
            },
          }),
          db.routineAssignment.count({
            where: {
              clientId: { in: clientIdsWithAssignments },
            },
          }),
        ]).then(([a, b]) => a + b),
      ]);

      // Calculate completion rate: estimate ~7 items per assignment
      // Only calculate if we have assignments
      if (totalAssignments > 0) {
        completionRate = Math.min(
          Math.round((recentCompletions / (totalAssignments * 7)) * 100),
          100
        );
      }
    }

    // Combine today's schedule
    const todaysSchedule = [
      ...todaysLessons.map((lesson) => ({
        ...lesson,
        type: "lesson" as const,
        time: new Date(lesson.date).getTime(),
      })),
      ...todaysEvents.map((event) => ({
        ...event,
        type: "reminder" as const,
        time: new Date(event.date).getTime(),
      })),
    ].sort((a, b) => a.time - b.time);

    // Add unread messages to attention items
    const attentionItemsWithMessages = [
      ...attentionItems,
      ...conversations
        .filter((conv) => conv.messages.length > 0)
        .map((conv) => {
          const otherUser = conv.coach?.id === userId ? conv.client : conv.coach;
          const lastMessage = conv.messages[0];
          return {
            id: `message-${conv.id}`,
            type: "message" as const,
            priority: 2,
            clientName: otherUser?.name || "Unknown",
            clientId: otherUser?.id,
            title: "sent a message",
            description: lastMessage?.content || "New message",
            timestamp: lastMessage?.createdAt.toISOString() || conv.updatedAt.toISOString(),
            href: `/messages/${conv.id}`,
            actionButton: "Reply",
          };
        }),
    ].sort((a, b) => {
      if (a.priority !== b.priority) return (a.priority || 99) - (b.priority || 99);
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return {
      // Stats
      stats: {
        totalClients: totalClientsCount,
        totalPrograms: totalProgramsCount,
        totalLessons: thisWeekLessons,
        completionRate,
      },
      // Today's schedule
      todaysSchedule,
      // This month's lessons (for WeekAtAGlance)
      thisMonthLessons,
      // Upcoming events
      upcomingEvents,
      // Attention items
      attentionItems: attentionItemsWithMessages,
      // Recent completions
      recentCompletions,
      // Clients
      clients,
      // Programs
      programs,
    };
  }),

  getDashboardData: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const userId = ensureUserId(user.id);

    // Calculate date range for this week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    // Get all dashboard data in parallel
    const [
      clients,
      events,
      programs,
      todaysLessons,
      totalClientsCount,
      totalProgramsCount,
      thisWeekLessons,
      completionData,
    ] = await Promise.all([
      // Get active clients (for display, limit to 10)
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

      // Get programs (for display, limit to 10)
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

      // Get total count of active clients
      db.client.count({
        where: {
          coachId: userId,
          archived: false,
        },
      }),

      // Get total count of programs
      db.program.count({
        where: {
          coachId: userId,
        },
      }),

      // Get lessons for this week
      db.event.count({
        where: {
          coachId: userId,
          date: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
        },
      }),

      // Get completion rate data - calculate after Promise.all resolves
      Promise.resolve(0), // Placeholder, will calculate below
    ]);

    // Calculate completion rate separately after getting other data
    // Only include clients that are NOT archived AND have at least one assignment
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // First, get all active clients with assignments (exclude archived and those with no assignments)
    const clientsWithAssignments = await db.client.findMany({
      where: {
        coachId: userId,
        archived: false,
        OR: [
          {
            programAssignments: {
              some: {
                program: {
                  status: {
                    not: "ARCHIVED",
                  },
                },
              },
            },
          },
          {
            routineAssignments: {
              some: {},
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    const clientIdsWithAssignments = clientsWithAssignments.map((c) => c.id);

    // Only calculate if we have clients with assignments
    let completionRate = 0;
    if (clientIdsWithAssignments.length > 0) {
      const [recentCompletions, totalAssignments] = await Promise.all([
        // Get recent completions (last 30 days) - only from clients with assignments
        Promise.all([
          db.programDrillCompletion.count({
            where: {
              clientId: {
                in: clientIdsWithAssignments,
              },
              completedAt: {
                gte: thirtyDaysAgo,
              },
            },
          }),
          db.routineExerciseCompletion.count({
            where: {
              clientId: {
                in: clientIdsWithAssignments,
              },
              completedAt: {
                gte: thirtyDaysAgo,
              },
            },
          }),
          db.exerciseCompletion.count({
            where: {
              completed: true,
              completedAt: {
                gte: thirtyDaysAgo,
              },
              clientId: {
                in: clientIdsWithAssignments,
              },
            },
          }),
        ]).then(([a, b, c]) => a + b + c),
        // Get total active assignments - only from clients with assignments
        Promise.all([
          db.programAssignment.count({
            where: {
              clientId: {
                in: clientIdsWithAssignments,
              },
              program: {
                status: {
                  not: "ARCHIVED",
                },
              },
            },
          }),
          db.routineAssignment.count({
            where: {
              clientId: {
                in: clientIdsWithAssignments,
              },
            },
          }),
        ]).then(([a, b]) => a + b),
      ]);

      // Calculate completion rate: estimate ~7 items per assignment
      // Only calculate if we have assignments
      if (totalAssignments > 0) {
        completionRate = Math.min(
          Math.round((recentCompletions / (totalAssignments * 7)) * 100),
          100
        );
      }
    }

    // Calculate stats
    const totalClients = totalClientsCount;
    const totalPrograms = totalProgramsCount;
    const totalLessons = thisWeekLessons;

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

  getRecentCompletions: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const userId = ensureUserId(user.id);

    // Get all clients for this coach
    const clients = await db.client.findMany({
      where: {
        coachId: userId,
        archived: false,
      },
      select: {
        id: true,
      },
    });

    const clientIds = clients.map((c) => c.id);

    if (clientIds.length === 0) {
      return [];
    }

    // Only show completions from the last 3 days (reduced from 7 for performance)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    // Limit to most recent 100 completions per type for performance
    // We only need the top 9 grouped results, so fetching 100 should be plenty
    const [programCompletions, routineCompletions, exerciseCompletions] =
      await Promise.all([
        // Program drill completions - limited to 100 most recent
        db.programDrillCompletion.findMany({
          where: {
            clientId: { in: clientIds },
            completedAt: {
              gte: threeDaysAgo,
            },
          },
          select: {
            id: true,
            clientId: true,
            completedAt: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
            drill: {
              select: {
                id: true,
                title: true,
              },
            },
            programAssignment: {
              select: {
                program: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
          orderBy: { completedAt: "desc" },
          take: 100, // Limit to 100 most recent
        }).catch((err) => {
          console.error("Error fetching program completions:", err);
          return [];
        }),

        // Routine exercise completions - limited to 100 most recent
        db.routineExerciseCompletion.findMany({
          where: {
            clientId: { in: clientIds },
            completedAt: {
              gte: threeDaysAgo,
            },
          },
          select: {
            id: true,
            clientId: true,
            completedAt: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
            routineAssignment: {
              select: {
                routine: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { completedAt: "desc" },
          take: 100, // Limit to 100 most recent
        }).catch((err) => {
          console.error("Error fetching routine completions:", err);
          return [];
        }),

        // Exercise completions (newer system) - limited to 100 most recent
        db.exerciseCompletion.findMany({
          where: {
            clientId: { in: clientIds },
            completed: true,
            completedAt: {
              not: null,
              gte: threeDaysAgo,
            },
          },
          select: {
            id: true,
            clientId: true,
            completedAt: true,
            programDrillId: true,
            exerciseId: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { completedAt: "desc" },
          take: 100, // Limit to 100 most recent
        }).catch((err) => {
          console.error("Error fetching exercise completions:", err);
          return [];
        }),
      ]);

    // Combine all completions into a unified format
    const allCompletions: any[] = [];

    // Add program drill completions
    programCompletions.forEach((completion) => {
      if (completion.client && completion.drill) {
        // Only add if we have the program info - it should always be there
        if (completion.programAssignment?.program) {
          allCompletions.push({
            id: `program-${completion.id}`,
            clientId: completion.clientId,
            clientName: completion.client.name,
            type: "program",
            title: completion.drill.title,
            programTitle: completion.programAssignment.program.title,
            completedAt: completion.completedAt,
          });
        } else {
          console.warn("Program completion missing program info:", completion.id);
        }
      }
    });

    // Add routine exercise completions
    routineCompletions.forEach((completion) => {
      if (completion.client) {
        // Only add if we have the routine info - it should always be there
        if (completion.routineAssignment?.routine) {
          allCompletions.push({
            id: `routine-${completion.id}`,
            clientId: completion.clientId,
            clientName: completion.client.name,
            type: "routine",
            title: "Routine exercise",
            programTitle: completion.routineAssignment.routine.name,
            completedAt: completion.completedAt,
          });
        }
      }
    });

    // Add exercise completions
    // Separate into: program drills, standalone routines, and standalone exercises
    const exerciseCompletionsWithProgramDrill = exerciseCompletions.filter(
      (c) => c.client && c.completedAt && c.programDrillId && c.programDrillId !== "standalone-routine"
    );
    const exerciseCompletionsWithStandaloneRoutine = exerciseCompletions.filter(
      (c) => c.client && c.completedAt && c.programDrillId === "standalone-routine"
    );
    const exerciseCompletionsStandalone = exerciseCompletions.filter(
      (c) => c.client && c.completedAt && !c.programDrillId
    );


    // 1. Handle program drill exercises - fetch program info
    const uniqueProgramDrillIds = [
      ...new Set(
        exerciseCompletionsWithProgramDrill.map((c) => c.programDrillId).filter(Boolean)
      ),
    ] as string[];

    const programDrillsMap = new Map<string, string | null>();
    if (uniqueProgramDrillIds.length > 0) {
      try {
        const programDrills = await db.programDrill.findMany({
          where: { id: { in: uniqueProgramDrillIds } },
          select: {
            id: true,
            day: {
              select: {
                week: {
                  select: {
                    program: {
                      select: {
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        programDrills.forEach((drill) => {
          programDrillsMap.set(
            drill.id,
            drill.day?.week?.program?.title || null
          );
        });
      } catch (err) {
        console.error("Error batch fetching program drills:", err);
      }
    }

    // 2. Handle standalone routine exercises - fetch routine info via exerciseId
    const uniqueExerciseIds = [
      ...new Set(
        exerciseCompletionsWithStandaloneRoutine.map((c) => c.exerciseId).filter(Boolean)
      ),
    ] as string[];

    const routineMap = new Map<string, string | null>();
    if (uniqueExerciseIds.length > 0) {
      try {
        const routineExercises = await db.routineExercise.findMany({
          where: { id: { in: uniqueExerciseIds } },
          select: {
            id: true,
            routine: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        routineExercises.forEach((exercise) => {
          routineMap.set(exercise.id, exercise.routine?.name || null);
        });
      } catch (err) {
        console.error("Error batch fetching routine exercises:", err);
      }
    }

    // Add exercise completions with program info
    exerciseCompletionsWithProgramDrill.forEach((completion) => {
      allCompletions.push({
        id: `exercise-${completion.id}`,
        clientId: completion.clientId,
        clientName: completion.client!.name,
        type: "exercise",
        title: "Exercise",
        programTitle: programDrillsMap.get(completion.programDrillId!) || null,
        completedAt: completion.completedAt,
      });
    });

    // Add standalone routine exercise completions with routine name
    exerciseCompletionsWithStandaloneRoutine.forEach((completion) => {
      allCompletions.push({
        id: `exercise-${completion.id}`,
        clientId: completion.clientId,
        clientName: completion.client!.name,
        type: "routine",
        title: "Routine exercise",
        programTitle: routineMap.get(completion.exerciseId) || null,
        completedAt: completion.completedAt,
      });
    });

    // Add exercise completions without programDrillId (standalone exercises)
    exerciseCompletions
      .filter((c) => c.client && c.completedAt && !c.programDrillId)
      .forEach((completion) => {
        allCompletions.push({
          id: `exercise-${completion.id}`,
          clientId: completion.clientId,
          clientName: completion.client!.name,
          type: "exercise",
          title: "Exercise",
          programTitle: null,
          completedAt: completion.completedAt,
        });
      });

    // Group by client and date (day)
    const groupedByDay = new Map<string, any>();

    allCompletions
      .filter((c) => c.completedAt) // Only include items with completedAt
      .forEach((completion) => {
        const date = new Date(completion.completedAt);
        // Get date string in YYYY-MM-DD format (local timezone)
        const dateKey = `${completion.clientId}-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        if (!groupedByDay.has(dateKey)) {
          const newGroup = {
            id: dateKey,
            clientId: completion.clientId,
            clientName: completion.clientName,
            completedAt: completion.completedAt,
            count: 1,
            types: new Set([completion.type]),
            latestCompletion: completion,
            // Preserve program/routine title from the completion
            programTitle: completion.programTitle || null,
            completionType: completion.type,
          };
          groupedByDay.set(dateKey, newGroup);
        } else {
          const group = groupedByDay.get(dateKey);
          group.count += 1;
          group.types.add(completion.type);
          // Update to most recent completion time for this day
          if (new Date(completion.completedAt) > new Date(group.completedAt)) {
            group.completedAt = completion.completedAt;
            group.latestCompletion = completion;
            // Update program/routine title - prefer the new one if it exists, otherwise keep the old one
            if (completion.programTitle) {
              group.programTitle = completion.programTitle;
            }
            // Only update completionType if we have a programTitle (to prioritize program/routine over exercise)
            if (completion.programTitle) {
              group.completionType = completion.type;
            }
          } else {
            // If this completion is older but has a programTitle and we don't have one, use it
            if (completion.programTitle && !group.programTitle) {
              group.programTitle = completion.programTitle;
              group.completionType = completion.type;
            }
          }
        }
      });

    // Convert map to array and sort by completedAt (most recent first)
    // Limit to top 9 results
    const groupedArray = Array.from(groupedByDay.values())
      .sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )
      .slice(0, 9);

    return groupedArray;
  }),

  getAttentionItems: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const userId = ensureUserId(user.id);

    // Get all clients for this coach
    const clients = await db.client.findMany({
      where: {
        coachId: userId,
        archived: false,
      },
      select: {
        id: true,
      },
    });

    const clientIds = clients.map((c) => c.id);

    if (clientIds.length === 0) {
      return [];
    }

    const attentionItems: any[] = [];

    // Only show items from the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 1. Pending Video Reviews (highest priority)
    const pendingVideos = await db.clientVideoSubmission.findMany({
      where: {
        coachId: userId,
        comment: null, // No comment means not reviewed yet
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        drill: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    pendingVideos.forEach((video) => {
      attentionItems.push({
        id: `video-${video.id}`,
        type: "video_review",
        priority: 1,
        clientName: video.client.name,
        clientId: video.client.id,
        title: `submitted a video: ${video.drill?.title || video.title}`,
        description: video.description || "",
        timestamp: video.createdAt,
        href: `/videos/${video.id}`,
        actionButton: "Review",
      });
    });

    // 3. Missed/Incomplete Drills
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Get active program assignments
    const activeAssignments = await db.programAssignment.findMany({
      where: {
        clientId: { in: clientIds },
        completed: false,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        program: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Simplified check for missed drills - check yesterday's drills
    for (const assignment of activeAssignments) {
      if (assignment.startDate) {
        const startDate = new Date(assignment.startDate);
        const dayDiff = Math.floor((yesterday.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff >= 0) {
          const program = await db.program.findUnique({
            where: { id: assignment.programId },
            include: {
              weeks: {
                include: {
                  days: {
                    include: {
                      drills: true,
                    },
                  },
                },
              },
            },
          });

          if (program) {
            let targetDay = null;
            for (const week of program.weeks) {
              for (const day of week.days) {
                if (day.isRestDay) continue;
                const dayNumber = (week.weekNumber - 1) * 7 + (day.dayNumber - 1);
                if (dayNumber === dayDiff) {
                  targetDay = day;
                  break;
                }
              }
              if (targetDay) break;
            }

            if (targetDay && targetDay.drills.length > 0) {
              const drillIds = targetDay.drills.map((d) => d.id);
              const dayStart = new Date(yesterday);
              dayStart.setHours(0, 0, 0, 0);
              const dayEnd = new Date(yesterday);
              dayEnd.setHours(23, 59, 59, 999);
              
              const completions = await db.programDrillCompletion.findMany({
                where: {
                  clientId: assignment.clientId,
                  drillId: { in: drillIds },
                  programAssignmentId: assignment.id,
                  completedAt: {
                    gte: dayStart,
                    lte: dayEnd,
                  },
                },
              });

              const completedDrillIds = new Set(completions.map((c) => c.drillId));
              const missedDrills = targetDay.drills.filter((d) => !completedDrillIds.has(d.id));

              if (missedDrills.length > 0) {
                // Get drill titles, limit to first 3 for display
                const drillTitles = missedDrills
                  .slice(0, 3)
                  .map((d) => d.title)
                  .join(", ");
                const remainingCount = missedDrills.length - 3;
                const drillList = remainingCount > 0 
                  ? `${drillTitles}${drillTitles ? ", " : ""}+${remainingCount} more`
                  : drillTitles;

                attentionItems.push({
                  id: `missed-${assignment.id}-${targetDay.id}`,
                  type: "missed_drill",
                  priority: 3,
                  clientName: assignment.client.name,
                  clientId: assignment.clientId,
                  title: `missed yesterday's drill: ${targetDay.title}`,
                  description: drillList || `${missedDrills.length} drill${missedDrills.length > 1 ? "s" : ""} incomplete`,
                  timestamp: yesterday,
                  href: `/clients/${assignment.clientId}/detail`,
                  badge: "MISSED",
                });
              }
            }
          }
        }
      }
    }

    // 4. Upcoming Lessons Needing Confirmation (within next week)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const pendingLessons = await db.event.findMany({
      where: {
        coachId: userId,
        status: "PENDING",
        date: {
          gte: new Date(),
          lte: nextWeek,
        },
        clientId: { not: null },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: "asc" },
      take: 10,
    });

    pendingLessons.forEach((lesson) => {
      attentionItems.push({
        id: `lesson-${lesson.id}`,
        type: "lesson_confirmation",
        priority: 4,
        clientName: lesson.client?.name || "Unknown",
        clientId: lesson.clientId || undefined,
        title: "Lesson unconfirmed",
        description: format(new Date(lesson.date), "MMM d, h:mm a"),
        timestamp: lesson.createdAt,
        href: `/schedule`,
        eventId: lesson.id,
        actionButton: "Confirm",
      });
    });

    // 5. Programs Needing Updates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const endingPrograms = await db.programAssignment.findMany({
      where: {
        clientId: { in: clientIds },
        completed: false,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        program: {
          select: {
            id: true,
            title: true,
            weeks: {
              orderBy: {
                weekNumber: "desc",
              },
              take: 1,
              select: {
                weekNumber: true,
              },
            },
          },
        },
      },
    });

    for (const assignment of endingPrograms) {
      if (assignment.startDate && assignment.program.weeks.length > 0) {
        const startDate = new Date(assignment.startDate);
        const lastWeek = assignment.program.weeks[0]?.weekNumber || 1;
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (lastWeek * 7));

        if (endDate <= tomorrow && endDate >= new Date()) {
          attentionItems.push({
            id: `program-${assignment.id}`,
            type: "program_update",
            priority: 5,
            clientName: assignment.client.name,
            clientId: assignment.clientId,
            title: "Program ending",
            description: `${assignment.program.title} ends ${endDate <= new Date() ? "today" : "tomorrow"}`,
            timestamp: assignment.updatedAt,
            href: `/clients/${assignment.clientId}/detail`,
          });
        }
      }
    }

    // Check for clients without active programs
    const clientsWithPrograms = new Set(
      endingPrograms.map((a) => a.clientId)
    );
    const clientsWithoutPrograms = clients.filter(
      (c) => !clientsWithPrograms.has(c.id)
    );

    if (clientsWithoutPrograms.length > 0) {
      attentionItems.push({
        id: `no-program-${clientsWithoutPrograms.length}`,
        type: "program_update",
        priority: 5,
        clientName: `${clientsWithoutPrograms.length} client${clientsWithoutPrograms.length > 1 ? "s" : ""}`,
        title: "No assigned program",
        description: `${clientsWithoutPrograms.length} client${clientsWithoutPrograms.length > 1 ? "s have" : " has"} no program for this week`,
        timestamp: new Date(),
        href: `/clients`,
      });
    }

    // Filter items to only show from last week
    const filteredItems = attentionItems.filter((item) => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= oneWeekAgo;
    });

    // Sort by priority and timestamp
    return filteredItems
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, 5);
    }),
});
