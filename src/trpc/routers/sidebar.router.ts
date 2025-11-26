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

    // Only show completions from the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    // Fetch all completions from the last week to ensure we see all clients
    // The date filter limits the results, so we don't need a take limit
    // This ensures we capture activity from ALL clients, not just the most active ones
    const [programCompletions, routineCompletions, exerciseCompletions] =
      await Promise.all([
        // Program drill completions
        db.programDrillCompletion.findMany({
          where: {
            clientId: { in: clientIds },
            completedAt: {
              gte: oneWeekAgo,
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
          // No take limit - we want all completions from the last week
          // The date filter already limits the scope
        }).catch((err) => {
          console.error("Error fetching program completions:", err);
          return [];
        }),

        // Routine exercise completions
        db.routineExerciseCompletion.findMany({
          where: {
            clientId: { in: clientIds },
            completedAt: {
              gte: oneWeekAgo,
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
          // No take limit - we want all completions from the last week
        }).catch((err) => {
          console.error("Error fetching routine completions:", err);
          return [];
        }),

        // Exercise completions (newer system)
        // These might be linked to program drills via programDrillId
        // We need to fetch the program info through the drill -> day -> week -> program chain
        db.exerciseCompletion.findMany({
          where: {
            clientId: { in: clientIds },
            completed: true,
            completedAt: {
              not: null,
              gte: oneWeekAgo,
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
          // No take limit - we want all completions from the last week
        }).catch((err) => {
          console.error("Error fetching exercise completions:", err);
          return [];
        }),
      ]);

    // Combine all completions into a unified format
    const allCompletions: any[] = [];

    // Debug: Log what we're getting from the queries
    console.log("Raw completions data:", {
      programCount: programCompletions.length,
      routineCount: routineCompletions.length,
      exerciseCount: exerciseCompletions.length,
      sampleProgram: programCompletions[0] ? {
        hasClient: !!programCompletions[0].client,
        hasDrill: !!programCompletions[0].drill,
        hasProgramAssignment: !!programCompletions[0].programAssignment,
        hasProgram: !!programCompletions[0].programAssignment?.program,
        programTitle: programCompletions[0].programAssignment?.program?.title,
      } : null,
    });

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

    console.log("Exercise completions breakdown:", {
      total: exerciseCompletions.length,
      withProgramDrill: exerciseCompletionsWithProgramDrill.length,
      withStandaloneRoutine: exerciseCompletionsWithStandaloneRoutine.length,
      standalone: exerciseCompletionsStandalone.length,
    });

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

        // Debug: Log each completion being processed
        if (completion.programTitle) {
          console.log("Processing completion with programTitle:", {
            clientName: completion.clientName,
            type: completion.type,
            programTitle: completion.programTitle,
            dateKey,
          });
        }

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
          if (completion.programTitle) {
            console.log("Created new group with programTitle:", newGroup.programTitle);
          }
        } else {
          const group = groupedByDay.get(dateKey);
          group.count += 1;
          group.types.add(completion.type);
          // Update to most recent completion time for this day
          if (new Date(completion.completedAt) > new Date(group.completedAt)) {
            group.completedAt = completion.completedAt;
            group.latestCompletion = completion;
            // Update program/routine title - prefer the new one if it exists, otherwise keep the old one
            // This ensures we don't lose the program/routine name if the latest completion doesn't have it
            if (completion.programTitle) {
              group.programTitle = completion.programTitle;
              console.log("Updated group programTitle to:", completion.programTitle);
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
              console.log("Added programTitle from older completion:", completion.programTitle);
            }
          }
        }
      });

    // Convert map to array and sort by completedAt (most recent first)
    const groupedArray = Array.from(groupedByDay.values())
      .sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )
      .slice(0, 9);

    // Debug logging to see what we're returning
    console.log("Recent completions - grouped results:", {
      totalGroups: groupedArray.length,
      sample: groupedArray.slice(0, 3).map((g: any) => ({
        clientName: g.clientName,
        programTitle: g.programTitle,
        completionType: g.completionType,
        latestCompletionType: g.latestCompletion?.type,
        latestProgramTitle: g.latestCompletion?.programTitle,
        count: g.count,
      })),
    });

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
