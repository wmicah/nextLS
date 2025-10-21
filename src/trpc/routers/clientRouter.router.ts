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
import { isYouTubeUrl, extractYouTubeId } from "@/lib/youtube-utils";
import { ensureUserId, sendWelcomeMessage } from "./_helpers";

/**
 * ClientRouter Router
 */
export const clientRouterRouter = router({
  getAssignedPrograms: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access this endpoint",
      });
    }

    // Get client's assigned programs
    const client = await db.client.findFirst({
      where: { userId: user.id },
      include: {
        coach: { select: { name: true } },
        programAssignments: {
          include: {
            program: true,
          },
          orderBy: { assignedAt: "desc" },
        },
      },
    });

    if (!client || client.programAssignments.length === 0) {
      return [];
    }

    const currentDate = new Date();
    const programs = client.programAssignments.map(assignment => {
      const program = assignment.program;
      const startDate = new Date(assignment.assignedAt);
      const weeksDiff = Math.floor(
        (currentDate.getTime() - startDate.getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );
      const currentWeek = Math.min(weeksDiff + 1, program.duration);
      const overallProgress = Math.min(
        (currentWeek / program.duration) * 100,
        100
      );

      return {
        id: program.id,
        title: program.title,
        description: program.description,
        startDate: assignment.assignedAt.toISOString(),
        endDate: new Date(
          startDate.getTime() + program.duration * 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        currentWeek,
        totalWeeks: program.duration,
        overallProgress,
        coachName: client.coach?.name || "Unknown Coach",
        assignmentId: assignment.id,
      };
    });

    return programs;
  }),

  getAssignedProgram: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access this endpoint",
      });
    }

    // Get client's current assigned program
    const client = await db.client.findFirst({
      where: { userId: user.id },
      include: {
        coach: { select: { name: true } },
        programAssignments: {
          where: { completedAt: null }, // Only active assignments
          include: {
            program: {
              include: {
                weeks: {
                  include: {
                    days: {
                      include: {
                        drills: {
                          include: {
                            completions: {
                              where: { clientId: user.id },
                            },
                          },
                          orderBy: { order: "asc" },
                        },
                      },
                      orderBy: { dayNumber: "asc" },
                    },
                  },
                  orderBy: { weekNumber: "asc" },
                },
              },
            },
          },
          orderBy: { assignedAt: "desc" },
          take: 1, // Get the most recent active assignment
        },
      },
    });

    if (!client || client.programAssignments.length === 0) {
      return null;
    }

    const assignment = client.programAssignments[0];
    const program = assignment.program;
    const startDate = new Date(assignment.assignedAt);
    const currentDate = new Date();
    const weeksDiff = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const currentWeek = Math.min(weeksDiff + 1, program.duration);
    const overallProgress = Math.min(
      (currentWeek / program.duration) * 100,
      100
    );

    // Debug: Check if superset fields are present in the database data
    console.log(
      "🔍 CLIENT ROUTER - program.weeks:",
      JSON.stringify(program.weeks, null, 2)
    );

    return {
      id: program.id,
      title: program.title,
      description: program.description,
      startDate: assignment.assignedAt.toISOString(),
      endDate: new Date(
        startDate.getTime() + program.duration * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      currentWeek,
      totalWeeks: program.duration,
      overallProgress,
      coachName: client.coach?.name || "Unknown Coach",
      assignmentId: assignment.id,
      weeks: program.weeks,
    };
  }),

  getPitchingData: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access this endpoint",
      });
    }

    // Get client record with pitching data
    const client = await db.client.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        averageSpeed: true,
        topSpeed: true,
        dropSpinRate: true,
        changeupSpinRate: true,
        riseSpinRate: true,
        curveSpinRate: true,
        age: true,
        height: true,
        dominantHand: true,
        movementStyle: true,
        reachingAbility: true,
      },
    });

    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    return {
      averageSpeed: client.averageSpeed,
      topSpeed: client.topSpeed,
      dropSpinRate: client.dropSpinRate,
      changeupSpinRate: client.changeupSpinRate,
      riseSpinRate: client.riseSpinRate,
      curveSpinRate: client.curveSpinRate,
      age: client.age,
      height: client.height,
      dominantHand: client.dominantHand,
      movementStyle: client.movementStyle,
      reachingAbility: client.reachingAbility,
    };
  }),

  getNextLesson: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access this endpoint",
      });
    }

    // Get client record
    const client = await db.client.findFirst({
      where: { userId: user.id },
    });

    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    // Get next confirmed lesson
    const nextLesson = await db.event.findFirst({
      where: {
        clientId: client.id,
        status: "CONFIRMED",
        date: {
          gte: new Date(),
        },
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    return nextLesson;
  }),

  getVideoAssignments: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access this endpoint",
      });
    }

    // Get client record
    const client = await db.client.findFirst({
      where: { userId: user.id },
    });

    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    // Get video assignments for the client
    const videoAssignments = await db.videoAssignment.findMany({
      where: { clientId: client.id },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            type: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    return videoAssignments;
  }),

  getCoachNotes: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });
    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access this endpoint",
      });
    }

    const client = await db.client.findFirst({
      where: { userId: user.id },
      select: { notes: true, updatedAt: true },
    });
    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    return { notes: client.notes || "", updatedAt: client.updatedAt };
  }),

  getRoutineAssignments: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access this endpoint",
      });
    }

    // Get client record
    const client = await db.client.findFirst({
      where: { userId: user.id },
    });

    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    // Get routine assignments for the client
    // Note: We're not filtering by date here - routines are ongoing assignments
    // unlike programs which are date-specific
    const assignments = await db.routineAssignment.findMany({
      where: {
        clientId: client.id,
      },
      include: {
        routine: {
          include: {
            exercises: {
              orderBy: { order: "asc" },
            },
          },
        },
        completions: {
          orderBy: { completedAt: "desc" },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    return assignments;
  }),

  getProgramCalendar: publicProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number(),
        viewMode: z.enum(["month", "week"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();
        if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Verify user is a CLIENT
        const dbUser = await db.user.findFirst({
          where: { id: user.id, role: "CLIENT" },
        });

        if (!dbUser) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only clients can access this endpoint",
          });
        }

        // Get client's assigned programs
        const client = await db.client.findFirst({
          where: { userId: user.id },
          include: {
            programAssignments: {
              include: {
                program: {
                  include: {
                    weeks: {
                      include: {
                        days: {
                          include: {
                            drills: {
                              select: {
                                id: true,
                                order: true,
                                title: true,
                                description: true,
                                duration: true,
                                videoUrl: true,
                                notes: true,
                                sets: true,
                                reps: true,
                                tempo: true,
                                type: true,
                                routineId: true,
                                supersetId: true,
                                supersetOrder: true,
                                supersetDescription: true,
                                supersetInstructions: true,
                                supersetNotes: true,
                                videoId: true,
                                videoThumbnail: true,
                                videoTitle: true,
                                // Coach Instructions
                                coachInstructionsWhatToDo: true,
                                coachInstructionsHowToDoIt: true,
                                coachInstructionsKeyPoints: true,
                                coachInstructionsCommonMistakes: true,
                                coachInstructionsEasier: true,
                                coachInstructionsHarder: true,
                                coachInstructionsEquipment: true,
                                coachInstructionsSetup: true,
                                completions: {
                                  where: { clientId: user.id },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                replacements: {
                  orderBy: {
                    replacedDate: "asc",
                  },
                },
              },
              orderBy: { assignedAt: "desc" },
            },
          },
        });

        if (!client || client.programAssignments.length === 0) {
          return {};
        }

        // Build calendar data for the requested month
        const calendarData: Record<string, any> = {};

        // Get all drill completions for this client
        const allCompletions = await db.drillCompletion.findMany({
          where: { clientId: client.id },
        });

        // Process all assigned programs
        for (const assignment of client.programAssignments) {
          const program = assignment.program;
          // Parse startDate as a pure date (no time component)
          let startDate: Date;
          if (assignment.startDate) {
            // Parse the date string directly as YYYY-MM-DD format
            const dateStr = assignment.startDate.toString();
            if (dateStr.includes("-") && dateStr.length === 10) {
              // It's in YYYY-MM-DD format, parse it directly
              const [year, month, day] = dateStr.split("-").map(Number);
              startDate = new Date(year, month - 1, day);
            } else {
              // It's an ISO string or other format, extract just the date part
              const tempDate = new Date(assignment.startDate);
              startDate = new Date(
                tempDate.getFullYear(),
                tempDate.getMonth(),
                tempDate.getDate()
              );
            }
          } else {
            // Fallback to assignedAt date
            const assignedDate = new Date(assignment.assignedAt);
            startDate = new Date(
              assignedDate.getFullYear(),
              assignedDate.getMonth(),
              assignedDate.getDate()
            );
          }

          // Get all days in the program
          for (const week of program.weeks) {
            for (const day of week.days) {
              // Calculate the day date by adding the appropriate number of days
              // Ensure we work with local dates to avoid timezone issues
              const startDateLocal = new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate()
              );
              const daysToAdd = (week.weekNumber - 1) * 7 + (day.dayNumber - 1);
              const dayDate = new Date(startDateLocal);
              dayDate.setDate(startDateLocal.getDate() + daysToAdd);

              // Use local date format to avoid timezone conversion issues
              const dateString = `${dayDate.getFullYear()}-${(
                dayDate.getMonth() + 1
              )
                .toString()
                .padStart(2, "0")}-${dayDate
                .getDate()
                .toString()
                .padStart(2, "0")}`;

              // Debug logging for first few days

              // Check if this specific date has been replaced with a lesson
              const hasReplacement = assignment.replacements?.some(
                (replacement: any) => {
                  const replacementDate = new Date(replacement.replacedDate);
                  const replacementDateOnly = new Date(
                    replacementDate.getFullYear(),
                    replacementDate.getMonth(),
                    replacementDate.getDate()
                  );
                  const dayDateOnly = new Date(
                    dayDate.getFullYear(),
                    dayDate.getMonth(),
                    dayDate.getDate()
                  );
                  return (
                    replacementDateOnly.getTime() === dayDateOnly.getTime()
                  );
                }
              );

              // Skip this day if it has been replaced
              if (hasReplacement) {
                continue;
              }

              // Include all days from all program assignments
              // (Remove the month filter to show all program data)
              if (true) {
                // Process drills and expand routines
                const expandedDrills = [];
                for (const drill of day.drills) {
                  // Find completion status for this drill
                  const completion = allCompletions.find(
                    (c: any) => c.drillId === drill.id
                  );

                  console.log(
                    `🎯 Calendar: Checking drill ${drill.id}, completion found:`,
                    !!completion
                  );

                  if (drill.routineId) {
                    // This is a routine drill - fetch and expand the routine
                    const routine = await db.routine.findUnique({
                      where: { id: drill.routineId },
                      include: {
                        exercises: {
                          orderBy: { order: "asc" },
                        },
                      },
                    });

                    if (routine) {
                      // Add each exercise from the routine as a separate drill
                      for (const exercise of routine.exercises) {
                        // For routine exercises within programs, use the program drill completion status
                        // The completion is stored with the program drill ID, not the individual exercise ID
                        const isCompleted = !!completion;
                        expandedDrills.push({
                          id: `${drill.id}-routine-${exercise.id}`, // Unique ID for tracking
                          title: exercise.title,
                          sets: exercise.sets,
                          reps: exercise.reps,
                          tempo: exercise.tempo,
                          tags: [], // Routine exercises don't have tags
                          videoUrl: exercise.videoUrl,
                          completed: isCompleted, // Use routine completion status
                          description: exercise.description,
                          notes: exercise.notes,
                          duration: exercise.duration,
                          type: exercise.type,
                          videoId: exercise.videoId,
                          videoTitle: exercise.videoTitle,
                          videoThumbnail: exercise.videoThumbnail,
                          // Superset fields
                          supersetId: exercise.supersetId,
                          supersetOrder: exercise.supersetOrder,
                          supersetDescription: exercise.supersetDescription,
                          supersetInstructions: exercise.supersetInstructions,
                          supersetNotes: exercise.supersetNotes,
                          routineId: drill.routineId, // Keep reference to original routine
                          originalDrillId: drill.id, // Keep reference to original drill
                        });
                      }
                    }
                  } else {
                    // Regular drill - add as-is
                    // Filter completions for this client
                    const clientCompletions =
                      drill.completions?.filter(
                        c => c.clientId === client.id
                      ) || [];
                    const isCompleted = !!completion; // Use the completion we found
                    expandedDrills.push({
                      id: drill.id,
                      title: drill.title,
                      sets: drill.sets,
                      reps: drill.reps,
                      tempo: drill.tempo,
                      tags: (drill as any).tags
                        ? JSON.parse((drill as any).tags)
                        : [],
                      videoUrl: drill.videoUrl,
                      completed: isCompleted,
                      description: drill.description,
                      notes: drill.notes,
                      duration: drill.duration,
                      type: drill.type,
                      videoId: drill.videoId,
                      videoTitle: drill.videoTitle,
                      videoThumbnail: drill.videoThumbnail,
                      // Superset fields
                      supersetId: drill.supersetId,
                      supersetOrder: drill.supersetOrder,
                      supersetDescription: drill.supersetDescription,
                      supersetInstructions: drill.supersetInstructions,
                      supersetNotes: drill.supersetNotes,
                      // Coach Instructions
                      coachInstructions: (() => {
                        const hasInstructions =
                          drill.coachInstructionsWhatToDo ||
                          drill.coachInstructionsHowToDoIt ||
                          drill.coachInstructionsKeyPoints?.length > 0 ||
                          drill.coachInstructionsCommonMistakes?.length > 0 ||
                          drill.coachInstructionsEquipment;

                        const instructions = hasInstructions
                          ? {
                              whatToDo: drill.coachInstructionsWhatToDo || "",
                              howToDoIt: drill.coachInstructionsHowToDoIt || "",
                              keyPoints: drill.coachInstructionsKeyPoints || [],
                              commonMistakes:
                                drill.coachInstructionsCommonMistakes || [],
                              equipment: drill.coachInstructionsEquipment || "",
                            }
                          : undefined;

                        // Debug logging for ALL drills with coach instructions

                        return instructions;
                      })(),
                      // Add YouTube-specific information
                      isYoutube: isYouTubeUrl(drill.videoUrl || ""),
                      youtubeId: extractYouTubeId(drill.videoUrl || ""),
                    });
                  }
                }

                const drills = expandedDrills;

                const completedDrills = drills.filter(
                  (drill: any) => drill.completed
                ).length;

                // Create program data for this day
                const programData = {
                  programId: program.id,
                  programTitle: program.title,
                  programDescription: program.description,
                  drills,
                  isRestDay: day.isRestDay || drills.length === 0,
                  expectedTime: drills.reduce(
                    (total: number, drill: any) =>
                      total + (drill.sets || 0) * 2,
                    0
                  ),
                  completedDrills,
                  totalDrills: drills.length,
                };

                // Check if this day already has content from another program
                if (calendarData[dateString]) {
                  // Add this program to the existing day
                  calendarData[dateString].programs.push(programData);
                  // Update totals for the day
                  calendarData[dateString].completedDrills += completedDrills;
                  calendarData[dateString].totalDrills += drills.length;
                  calendarData[dateString].expectedTime += drills.reduce(
                    (total: number, drill: any) =>
                      total + (drill.sets || 0) * 2,
                    0
                  );
                  // If either day is a rest day, keep it as rest day
                  calendarData[dateString].isRestDay =
                    calendarData[dateString].isRestDay || day.isRestDay;
                } else {
                  // Create entry for this program day
                  calendarData[dateString] = {
                    date: dateString,
                    programs: [programData],
                    isRestDay: day.isRestDay || drills.length === 0, // Mark as rest day if no drills or explicitly marked as rest
                    expectedTime: drills.reduce(
                      (total: number, drill: any) =>
                        total + (drill.sets || 0) * 2,
                      0
                    ), // Rough estimate
                    completedDrills,
                    totalDrills: drills.length,
                    // Keep drills array for backward compatibility
                    drills: drills,
                  };
                }
              }
            }
          }
        }

        // Add video assignments to calendar data
        const videoAssignments = await db.videoAssignment.findMany({
          where: {
            client: {
              id: user.id,
            },
          },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                description: true,
                url: true,
                thumbnail: true,
              },
            },
          },
        });

        // Add video assignments to calendar data
        videoAssignments.forEach(assignment => {
          if (!assignment.dueDate) return; // Skip assignments without due dates
          const assignmentDate = new Date(assignment.dueDate);
          const dateString = assignmentDate.toISOString().split("T")[0];

          if (calendarData[dateString]) {
            // Add video assignment to existing day
            if (!calendarData[dateString].videoAssignments) {
              calendarData[dateString].videoAssignments = [];
            }
            calendarData[dateString].videoAssignments.push({
              id: assignment.id,
              title: assignment.video.title,
              description: assignment.video.description,
              videoUrl: assignment.video.url,
              thumbnailUrl: assignment.video.thumbnail,
              dueDate: assignment.dueDate,
              completed: assignment.completed,
            });
          } else {
            // Create new day entry for video assignment
            calendarData[dateString] = {
              date: dateString,
              programs: [],
              videoAssignments: [
                {
                  id: assignment.id,
                  title: assignment.video.title,
                  description: assignment.video.description,
                  videoUrl: assignment.video.url,
                  thumbnailUrl: assignment.video.thumbnail,
                  dueDate: assignment.dueDate,
                  completed: assignment.completed,
                },
              ],
              isRestDay: false,
              expectedTime: 0,
              completedDrills: 0,
              totalDrills: 0,
            };
          }
        });

        // Don't fill empty days with rest days - leave them blank

        return calendarData;
      } catch (error) {
        console.error("Error in getProgramCalendar:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load program calendar",
        });
      }
    }),

  getProgramWeekCalendar: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // Get client record first
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get client's program assignments with all the nested data
      const clientWithPrograms = await db.client.findFirst({
        where: { userId: user.id },
        include: {
          programAssignments: {
            include: {
              program: {
                include: {
                  weeks: {
                    include: {
                      days: {
                        include: {
                          drills: {
                            select: {
                              id: true,
                              order: true,
                              title: true,
                              description: true,
                              duration: true,
                              videoUrl: true,
                              notes: true,
                              sets: true,
                              reps: true,
                              tempo: true,
                              type: true,
                              routineId: true,
                              supersetId: true,
                              supersetOrder: true,
                              supersetDescription: true,
                              supersetInstructions: true,
                              supersetNotes: true,
                              videoId: true,
                              videoThumbnail: true,
                              videoTitle: true,
                              // Coach Instructions
                              coachInstructionsWhatToDo: true,
                              coachInstructionsHowToDoIt: true,
                              coachInstructionsKeyPoints: true,
                              coachInstructionsCommonMistakes: true,
                              coachInstructionsEasier: true,
                              coachInstructionsHarder: true,
                              coachInstructionsEquipment: true,
                              coachInstructionsSetup: true,
                              routine: {
                                include: {
                                  exercises: {
                                    orderBy: { order: "asc" },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (
        !clientWithPrograms ||
        clientWithPrograms.programAssignments.length === 0
      ) {
        return {};
      }

      const calendarData: Record<string, any> = {};
      const startDateTime = new Date(input.startDate);
      const endDateTime = new Date(input.endDate);
      // Include the entire end date
      endDateTime.setHours(23, 59, 59, 999);

      // Get all drill completions for this client
      const completions = await db.drillCompletion.findMany({
        where: { clientId: client.id },
      });

      // Process each program assignment
      for (const assignment of clientWithPrograms.programAssignments) {
        // Parse startDate as a pure date (no time component)
        let programStartDate: Date;
        if (assignment.startDate) {
          const dateStr = assignment.startDate.toString();
          if (dateStr.includes("-") && dateStr.length === 10) {
            // It's in YYYY-MM-DD format, parse it directly
            const [year, month, day] = dateStr.split("-").map(Number);
            programStartDate = new Date(year, month - 1, day);
          } else {
            // It's an ISO string or other format, extract just the date part
            const tempDate = new Date(assignment.startDate);
            programStartDate = new Date(
              tempDate.getFullYear(),
              tempDate.getMonth(),
              tempDate.getDate()
            );
          }
        } else {
          // Fallback to assignedAt date
          const assignedDate = new Date(assignment.assignedAt);
          programStartDate = new Date(
            assignedDate.getFullYear(),
            assignedDate.getMonth(),
            assignedDate.getDate()
          );
        }
        const program = assignment.program;

        // Process each week of the program
        for (const week of program.weeks) {
          // Process each day of the week
          for (const day of week.days) {
            // Calculate the actual date for this program day
            // Ensure we work with local dates to avoid timezone issues
            const programStartDateLocal = new Date(
              programStartDate.getFullYear(),
              programStartDate.getMonth(),
              programStartDate.getDate()
            );
            const dayDate = new Date(programStartDateLocal);
            dayDate.setDate(
              programStartDateLocal.getDate() +
                (week.weekNumber - 1) * 7 +
                (day.dayNumber - 1)
            );

            // Check if this day falls within our requested date range
            if (dayDate >= startDateTime && dayDate <= endDateTime) {
              // Use local date format to avoid timezone conversion issues
              const dateString = `${dayDate.getFullYear()}-${(
                dayDate.getMonth() + 1
              )
                .toString()
                .padStart(2, "0")}-${dayDate
                .getDate()
                .toString()
                .padStart(2, "0")}`;

              // Process drills and expand routines
              const expandedDrills = [];
              for (const drill of day.drills) {
                const completion = completions.find(
                  (c: any) => c.drillId === drill.id
                );

                if (drill.routineId) {
                  // This is a routine drill - fetch and expand the routine
                  const routine = await db.routine.findUnique({
                    where: { id: drill.routineId },
                    include: {
                      exercises: {
                        orderBy: { order: "asc" },
                      },
                    },
                  });

                  if (routine) {
                    // Add each exercise from the routine as a separate drill
                    for (const exercise of routine.exercises) {
                      expandedDrills.push({
                        id: `${drill.id}-routine-${exercise.id}`, // Unique ID for tracking
                        title: exercise.title,
                        sets: exercise.sets,
                        reps: exercise.reps,
                        tempo: exercise.tempo,
                        tags: [], // Routine exercises don't have tags
                        videoUrl: exercise.videoUrl,
                        completed: !!completion, // Use routine completion status
                        description: exercise.description,
                        notes: exercise.notes,
                        duration: exercise.duration,
                        type: exercise.type,
                        videoId: exercise.videoId,
                        videoTitle: exercise.videoTitle,
                        videoThumbnail: exercise.videoThumbnail,
                        // Superset fields
                        supersetId: exercise.supersetId,
                        supersetOrder: exercise.supersetOrder,
                        supersetDescription: exercise.supersetDescription,
                        supersetInstructions: exercise.supersetInstructions,
                        supersetNotes: exercise.supersetNotes,
                        routineId: drill.routineId, // Keep reference to original routine
                        originalDrillId: drill.id, // Keep reference to original drill
                      });
                    }
                  }
                } else {
                  // Regular drill - add as-is with coach instructions mapping
                  const hasInstructions =
                    drill.coachInstructionsWhatToDo ||
                    drill.coachInstructionsHowToDoIt ||
                    drill.coachInstructionsKeyPoints?.length > 0 ||
                    drill.coachInstructionsCommonMistakes?.length > 0 ||
                    drill.coachInstructionsEquipment;

                  const coachInstructions = hasInstructions
                    ? {
                        whatToDo: drill.coachInstructionsWhatToDo || "",
                        howToDoIt: drill.coachInstructionsHowToDoIt || "",
                        keyPoints: drill.coachInstructionsKeyPoints || [],
                        commonMistakes:
                          drill.coachInstructionsCommonMistakes || [],
                        equipment: drill.coachInstructionsEquipment || "",
                      }
                    : undefined;

                  expandedDrills.push({
                    ...drill,
                    completed: !!completion,
                    coachInstructions,
                  });
                }
              }

              const drills = expandedDrills;

              const completedDrills = drills.filter(
                (drill: any) => drill.completed
              ).length;

              // Check if this day already has content from another program
              if (calendarData[dateString]) {
                // Merge drills from multiple programs
                calendarData[dateString].drills = [
                  ...calendarData[dateString].drills,
                  ...drills,
                ];
                calendarData[dateString].completedDrills += completedDrills;
                calendarData[dateString].totalDrills += drills.length;
                calendarData[dateString].expectedTime += drills.reduce(
                  (total: number, drill: any) => total + (drill.sets || 0) * 2,
                  0
                );
                // If either day is a rest day, keep it as rest day
                calendarData[dateString].isRestDay =
                  calendarData[dateString].isRestDay || day.isRestDay;
              } else {
                // Create entry for this program day
                calendarData[dateString] = {
                  date: dateString,
                  drills,
                  isRestDay: day.isRestDay || drills.length === 0,
                  expectedTime: drills.reduce(
                    (total: number, drill: any) =>
                      total + (drill.sets || 0) * 2,
                    0
                  ),
                  completedDrills,
                  totalDrills: drills.length,
                };
              }
            }
          }
        }
      }

      return calendarData;
    }),

  markVideoAssignmentComplete: publicProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // First, verify the assignment exists and belongs to this client
      const existingAssignment = await db.videoAssignment.findFirst({
        where: {
          id: input.assignmentId,
          clientId: user.id, // Use the user ID, not the client model ID
        },
      });

      if (!existingAssignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video assignment not found or not assigned to you",
        });
      }

      // Update the video assignment completion status
      const updatedAssignment = await db.videoAssignment.update({
        where: {
          id: input.assignmentId,
        },
        data: {
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
        },
      });

      return updatedAssignment;
    }),

  removeVideoAssignment: publicProcedure
    .input(
      z.object({
        assignmentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // First, verify the assignment exists and belongs to this client
      const existingAssignment = await db.videoAssignment.findFirst({
        where: {
          id: input.assignmentId,
          clientId: user.id, // Use the user ID, not the client model ID
        },
      });

      if (!existingAssignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video assignment not found or not assigned to you",
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

  markDrillComplete: publicProcedure
    .input(
      z.object({
        drillId: z.string(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Check if this is a routine exercise ID
      console.log("🎯 Processing drill ID:", input.drillId);

      // Format 1: "drillId-routine-exerciseId" (routine exercises within programs)
      const isRoutineExercise = input.drillId.includes("-routine-");

      // Format 2: "assignmentId-exerciseId" (standalone routine exercises)
      // We need to be more specific to avoid false positives with regular drill IDs
      const isRoutineExerciseInProgram =
        input.drillId.includes("-") &&
        !input.drillId.includes("-routine-") &&
        input.drillId.split("-").length === 2; // Exactly 2 parts when split by dash

      console.log("🎯 ID analysis:", {
        drillId: input.drillId,
        isRoutineExercise,
        isRoutineExerciseInProgram,
        parts: input.drillId.split("-"),
      });

      if (isRoutineExercise) {
        // For routine exercises, we need to find the original drill ID
        const originalDrillId = input.drillId.split("-routine-")[0];

        // Verify the original drill exists and belongs to the client's program
        const drill = await db.programDrill.findFirst({
          where: {
            id: originalDrillId,
            day: {
              week: {
                program: {
                  assignments: {
                    some: {
                      clientId: client.id,
                    },
                  },
                },
              },
            },
          },
        });

        if (!drill) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Drill not found or not assigned to client",
          });
        }

        // Check if the completion date is valid (not in the future)
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        if (new Date() > today) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot complete drills for future dates",
          });
        }

        if (input.completed) {
          // Mark drill as complete (using the original drill ID)
          console.log(
            "✅ Creating drill completion for routine exercise:",
            originalDrillId
          );
          await db.drillCompletion.create({
            data: {
              drillId: originalDrillId,
              clientId: client.id,
            },
          });
          console.log("✅ Drill completion created successfully");
        } else {
          // Mark drill as incomplete (remove completion record)
          console.log(
            "❌ Removing drill completion for routine exercise:",
            originalDrillId
          );
          await db.drillCompletion.deleteMany({
            where: {
              drillId: originalDrillId,
              clientId: client.id,
            },
          });
          console.log("✅ Drill completion removed successfully");
        }
      } else if (isRoutineExerciseInProgram) {
        // This is a standalone routine exercise (format: "assignmentId-exerciseId")
        const [routineAssignmentId, exerciseId] = input.drillId.split("-");

        console.log("🎯 Handling standalone routine exercise:", {
          drillId: input.drillId,
          routineAssignmentId,
          exerciseId,
          completed: input.completed,
        });

        // For standalone routine exercises, find the routine assignment directly
        console.log("🎯 Looking for routine assignment:", {
          routineAssignmentId,
          clientId: client.id,
        });

        // Find the routine assignment directly
        const routineAssignment = await db.routineAssignment.findFirst({
          where: {
            id: routineAssignmentId,
            clientId: client.id,
          },
          include: {
            routine: {
              include: {
                exercises: true,
              },
            },
          },
        });

        console.log("🎯 Routine assignment found:", !!routineAssignment);
        console.log("🎯 Routine assignment details:", {
          id: routineAssignment?.id,
          routineId: routineAssignment?.routineId,
          hasRoutine: !!routineAssignment?.routine,
          routineName: routineAssignment?.routine?.name,
        });

        if (!routineAssignment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Routine assignment not found or not assigned to client. Assignment ID: ${routineAssignmentId}, Client: ${client.id}`,
          });
        }

        // We already have the routine assignment, no need to look it up again

        // Verify the exercise exists in the routine
        const exercise = routineAssignment.routine.exercises.find(
          (ex: any) => ex.id === exerciseId
        );

        if (!exercise) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Exercise not found in routine. Exercise ID: ${exerciseId}, Available: ${routineAssignment.routine.exercises
              .map((ex: any) => `${ex.id} (${ex.title})`)
              .join(", ")}`,
          });
        }

        // Handle completion using RoutineExerciseCompletion for standalone routine exercises
        if (input.completed) {
          await db.routineExerciseCompletion.upsert({
            where: {
              routineAssignmentId_exerciseId_clientId_completedAt: {
                routineAssignmentId: routineAssignmentId,
                exerciseId: exerciseId,
                clientId: client.id,
                completedAt: new Date(),
              },
            },
            update: {
              completedAt: new Date(),
              updatedAt: new Date(),
            },
            create: {
              routineAssignmentId: routineAssignmentId,
              exerciseId: exerciseId,
              clientId: client.id,
              completedAt: new Date(),
            },
          });
        } else {
          await db.routineExerciseCompletion.deleteMany({
            where: {
              routineAssignmentId: routineAssignmentId,
              exerciseId: exerciseId,
              clientId: client.id,
            },
          });
        }

        return {
          success: true,
          message: input.completed
            ? "Routine exercise marked as complete"
            : "Routine exercise marked as incomplete",
        };
      } else {
        // Handle regular drill completion
        console.log("🎯 Handling regular drill completion:", {
          drillId: input.drillId,
          completed: input.completed,
        });

        if (input.completed) {
          await db.drillCompletion.create({
            data: {
              drillId: input.drillId,
              clientId: client.id,
            },
          });
          console.log("✅ Drill completion created successfully");
        } else {
          await db.drillCompletion.deleteMany({
            where: {
              drillId: input.drillId,
              clientId: client.id,
            },
          });
          console.log("✅ Drill completion removed successfully");
        }
      }

      return { success: true };
    }),

  markProgramComplete: publicProcedure
    .input(
      z.object({
        programId: z.string(),
        programAssignmentId: z.string(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      console.log("🎯 markProgramComplete mutation called with:", input);

      console.log("🔍 Debug - Client ID:", client.id);
      console.log(
        "🔍 Debug - Program Assignment ID:",
        input.programAssignmentId
      );

      // Verify the program assignment belongs to this client
      const programAssignment = await db.programAssignment.findFirst({
        where: {
          id: input.programAssignmentId,
          clientId: client.id,
        },
        include: {
          program: true,
        },
      });

      if (!programAssignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program assignment not found or not assigned to client",
        });
      }

      // Update the program assignment completion status
      const updatedAssignment = await db.programAssignment.update({
        where: {
          id: input.programAssignmentId,
        },
        data: {
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
        },
      });

      console.log("✅ Program completion updated:", updatedAssignment);

      return {
        success: true,
        message: input.completed
          ? "Program marked as complete"
          : "Program marked as incomplete",
        assignment: updatedAssignment,
      };
    }),

  markProgramDrillComplete: publicProcedure
    .input(
      z.object({
        drillId: z.string(),
        programAssignmentId: z.string(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      console.log("🎯 markProgramDrillComplete mutation called with:", input);

      // Verify the program assignment belongs to this client
      const programAssignment = await db.programAssignment.findFirst({
        where: {
          id: input.programAssignmentId,
          clientId: client.id,
        },
        include: {
          program: true,
        },
      });

      if (!programAssignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program assignment not found or not assigned to client",
        });
      }

      // Find the program drill
      const programDrill = await db.programDrill.findFirst({
        where: {
          id: input.drillId,
        },
        include: {
          day: {
            include: {
              week: {
                include: {
                  program: true,
                },
              },
            },
          },
        },
      });

      if (!programDrill) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program drill not found",
        });
      }

      // Verify the drill belongs to the assigned program
      if (programDrill.day.week.program.id !== programAssignment.programId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Drill does not belong to the assigned program",
        });
      }

      // Create or update program drill completion
      if (input.completed) {
        // Create completion record
        await db.programDrillCompletion.upsert({
          where: {
            drillId_programAssignmentId: {
              drillId: input.drillId,
              programAssignmentId: input.programAssignmentId,
            },
          },
          create: {
            drillId: input.drillId,
            programAssignmentId: input.programAssignmentId,
            clientId: client.id,
            completedAt: new Date(),
          },
          update: {
            completedAt: new Date(),
          },
        });
      } else {
        // Remove completion record
        await db.programDrillCompletion.deleteMany({
          where: {
            drillId: input.drillId,
            programAssignmentId: input.programAssignmentId,
            clientId: client.id,
          },
        });
      }

      console.log("✅ Program drill completion updated");

      return {
        success: true,
        message: input.completed
          ? "Program drill marked as complete"
          : "Program drill marked as incomplete",
      };
    }),

  markRoutineExerciseComplete: publicProcedure
    .input(
      z.object({
        exerciseId: z.string(),
        routineAssignmentId: z.string(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      console.log(
        "🎯 markRoutineExerciseComplete mutation called with:",
        input
      );

      console.log("🔍 Debug - Client ID:", client.id);
      console.log(
        "🔍 Debug - Routine Assignment ID:",
        input.routineAssignmentId
      );

      // Debug: Check what routine assignments exist for this client
      const allClientAssignments = await db.routineAssignment.findMany({
        where: { clientId: client.id },
        select: { id: true, routineId: true, assignedAt: true },
      });
      console.log(
        "🔍 Debug - All client routine assignments:",
        allClientAssignments
      );

      // Debug: Check if the specific routine assignment exists
      const specificAssignment = await db.routineAssignment.findFirst({
        where: { id: input.routineAssignmentId },
        select: { id: true, clientId: true, routineId: true, assignedAt: true },
      });
      console.log(
        "🔍 Debug - Specific routine assignment:",
        specificAssignment
      );

      // Verify the routine assignment belongs to this client
      const routineAssignment = await db.routineAssignment.findFirst({
        where: {
          id: input.routineAssignmentId,
          clientId: client.id,
        },
        include: {
          routine: {
            include: {
              exercises: true,
            },
          },
        },
      });

      if (!routineAssignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Routine assignment not found or not assigned to client",
        });
      }

      // Verify the exercise exists in this routine
      const exercise = routineAssignment.routine.exercises.find(
        ex => ex.id === input.exerciseId
      );

      if (!exercise) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Exercise not found in this routine",
        });
      }

      // Check if the completion date is valid (not in the future)
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (new Date() > today) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot complete exercises for future dates",
        });
      }

      if (input.completed) {
        console.log(
          "✅ Marking routine exercise as complete:",
          input.exerciseId
        );
        await db.routineExerciseCompletion.create({
          data: {
            routineAssignmentId: input.routineAssignmentId,
            exerciseId: input.exerciseId,
            clientId: client.id,
          },
        });
        console.log("✅ Routine exercise completion created successfully");
      } else {
        console.log(
          "❌ Marking routine exercise as incomplete:",
          input.exerciseId
        );
        await db.routineExerciseCompletion.deleteMany({
          where: {
            routineAssignmentId: input.routineAssignmentId,
            exerciseId: input.exerciseId,
            clientId: client.id,
          },
        });
        console.log("✅ Routine exercise completion removed successfully");
      }

      return { success: true };
    }),

  sendNoteToCoach: publicProcedure
    .input(
      z.object({
        date: z.string(),
        note: z.string(),
        drillId: z.string().optional(),
        drillTitle: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // Get client's coach
      const client = await db.client.findFirst({
        where: { userId: user.id },
        include: { coach: { select: { name: true } } },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Create a message in the messaging system to send to the coach
      const conversation = await db.conversation.findFirst({
        where: {
          coachId: client.coachId!,
          clientId: ensureUserId(user.id),
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation with coach not found",
        });
      }

      // Create the message with clear identifier
      const workoutDate = new Date(input.date).toLocaleDateString();
      const messageContent = input.drillTitle
        ? `📝 **Workout Note** - ${input.drillTitle}\n📅 ${workoutDate}\n\n${
            input.note || ""
          }`
        : `📝 **Daily Workout Note**\n📅 ${workoutDate}\n\n${input.note || ""}`;

      const message = await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: messageContent,
        },
      });

      // Debug logging for workout note creation
      console.log("🔍 Workout Note Created:", {
        messageId: message.id,
        senderId: user.id,
        clientName: client.name,
        coachId: client.coachId,
        conversationId: conversation.id,
        content: messageContent.substring(0, 100),
      });

      // Create a notification for the coach (only if coach exists)
      if (client.coachId) {
        await db.notification.create({
          data: {
            userId: client.coachId,
            type: "MESSAGE",
            title: `📝 Workout Note from ${client.name}`,
            message: input.drillTitle
              ? `New workout feedback on "${input.drillTitle}" (${new Date(
                  input.date
                ).toLocaleDateString()}): ${(input.note || "").substring(
                  0,
                  80
                )}${(input.note || "").length > 80 ? "..." : ""}`
              : `New daily workout note (${new Date(
                  input.date
                ).toLocaleDateString()}): ${(input.note || "").substring(
                  0,
                  80
                )}${(input.note || "").length > 80 ? "..." : ""}`,
            data: {
              messageId: message.id,
              conversationId: conversation.id,
              drillId: input.drillId || undefined,
              drillTitle: input.drillTitle || undefined,
            },
          },
        });
      }

      return { success: true, messageId: message.id };
    }),

  getClientLessons: publicProcedure
    .input(
      z.object({
        month: z.number(),
        year: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // Get client record to find their coach
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get client's lessons for the specified month (including PENDING and CONFIRMED)
      const lessons = await db.event.findMany({
        where: {
          clientId: client.id,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          NOT: {
            title: {
              contains: "test user 2",
            },
          },
          date: {
            gte: new Date(input.year, input.month, 1),
            lt: new Date(input.year, input.month + 1, 1),
          },
        },
        include: {
          coach: { select: { name: true } },
        },
        orderBy: { date: "asc" },
      });

      return lessons;
    }),

  // Get client's pending schedule requests
  getClientPendingRequests: publicProcedure
    .input(
      z.object({
        month: z.number(),
        year: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // Get client record to find their coach
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get client's PENDING schedule requests for the specified month
      const pendingRequests = await db.event.findMany({
        where: {
          clientId: client.id,
          status: "PENDING", // Only return pending requests
          date: {
            gte: new Date(input.year, input.month, 1),
            lt: new Date(input.year, input.month + 1, 1),
          },
        },
        include: {
          coach: { select: { name: true } },
        },
        orderBy: { date: "asc" },
      });

      return pendingRequests;
    }),

  // Get coach's schedule for client to view
  getCoachScheduleForClient: publicProcedure
    .input(
      z.object({
        month: z.number(),
        year: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // Get client record to find their coach
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Only proceed if client has a coach
      if (!client.coachId) {
        return [];
      }

      // Calculate month start and end dates
      const monthStart = new Date(input.year, input.month, 1);
      const monthEnd = new Date(input.year, input.month + 1, 0, 23, 59, 59);
      const now = new Date();

      // Get all events (lessons) for the coach in the specified month
      // Exclude reminders (events without clientId) - those are coach-only
      const events = await db.event.findMany({
        where: {
          coachId: client.coachId!,
          clientId: { not: null }, // Only show events with a client (not reminders)
          date: {
            gte: monthStart,
            lte: monthEnd,
            gt: now, // Only return future lessons
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      // Filter out this client's own pending requests from the coach's schedule
      const filteredEvents = events.filter(
        event => !(event.clientId === client.id && event.status === "PENDING")
      );

      return filteredEvents;
    }),

  // Get current client record for the logged-in user
  getCurrentClient: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access this endpoint",
      });
    }

    // Get client record
    const client = await db.client.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        coachId: true,
      },
    });

    return client;
  }),

  // Get coach's profile for client (including working hours)
  getCoachProfile: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access this endpoint",
      });
    }

    // Get client record to find their coach
    const client = await db.client.findFirst({
      where: { userId: user.id },
    });

    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    // Get coach's profile including working hours
    const coach = await db.user.findFirst({
      where: { id: client.coachId || undefined },
      select: {
        id: true,
        name: true,
        email: true,
        workingHoursStart: true,
        workingHoursEnd: true,
        workingDays: true,
        timeSlotInterval: true,
      },
    });

    if (!coach) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Coach not found",
      });
    }

    // Format the working hours data to match the expected structure
    return {
      id: coach.id,
      name: coach.name,
      email: coach.email,
      workingHours: {
        startTime: coach.workingHoursStart || "9:00 AM",
        endTime: coach.workingHoursEnd || "6:00 PM",
        workingDays: coach.workingDays || [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        timeSlotInterval: coach.timeSlotInterval || 60,
      },
    };
  }),

  // Get pending schedule requests for coach
  getPendingScheduleRequests: publicProcedure.query(async () => {
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
        message: "Only coaches can view pending schedule requests",
      });
    }

    // Get all pending events for this coach (only client-requested lessons)
    const pendingRequests = await db.event.findMany({
      where: {
        coachId: ensureUserId(user.id),
        status: "PENDING",
        // Only include lessons that were requested by clients
        description: {
          contains: "Client requested",
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return pendingRequests;
  }),

  // Fix incorrectly pending coach-scheduled lessons (one-time fix)
  fixPendingCoachLessons: publicProcedure.mutation(async () => {
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
        message: "Only coaches can fix lessons",
      });
    }

    // Update all pending lessons that were created by the coach to confirmed status
    const updatedLessons = await db.event.updateMany({
      where: {
        coachId: ensureUserId(user.id),
        status: "PENDING",
        description: "Scheduled lesson",
      },
      data: {
        status: "CONFIRMED",
      },
    });

    return { updatedCount: updatedLessons.count };
  }),

  // Fix confirmed lessons that still have "Schedule Request" in title
  fixConfirmedLessonTitles: publicProcedure.mutation(async () => {
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
        message: "Only coaches can fix lessons",
      });
    }

    // Find all confirmed lessons that still have "Schedule Request" in title
    const lessonsToFix = await db.event.findMany({
      where: {
        coachId: ensureUserId(user.id),
        status: "CONFIRMED",
        title: {
          contains: "Schedule Request",
        },
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Update each lesson's title
    const updatePromises = lessonsToFix.map(lesson =>
      db.event.update({
        where: { id: lesson.id },
        data: {
          title: `Lesson with ${
            lesson.client?.name || lesson.client?.email || "Client"
          }`,
        },
      })
    );

    await Promise.all(updatePromises);

    return { updatedCount: lessonsToFix.length };
  }),

  // Approve a schedule request (COACH ONLY)
  approveScheduleRequest: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
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
          message: "Only coaches can approve schedule requests",
        });
      }

      // Find the event and verify it belongs to this coach
      const event = await db.event.findFirst({
        where: {
          id: input.eventId,
          coachId: ensureUserId(user.id),
          status: "PENDING",
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              userId: true, // Include userId to get the User.id for notifications
            },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule request not found or already processed",
        });
      }

      // Update the event status to CONFIRMED and change the title
      const updatedEvent = await db.event.update({
        where: { id: input.eventId },
        data: {
          status: "CONFIRMED",
          title: `Lesson with ${
            event.client?.name || event.client?.email || "Client"
          }`,
        },
      });

      // Create notification for the client
      if (event.client?.userId) {
        await db.notification.create({
          data: {
            userId: event.client.userId,
            type: "LESSON_SCHEDULED",
            title: "Schedule Request Approved",
            message: `Your schedule request for ${format(
              new Date(event.date),
              "MMM d, yyyy 'at' h:mm a"
            )} has been approved!`,
            data: {
              eventId: event.id,
              coachId: ensureUserId(user.id),
              coachName: coach.name,
            },
          },
        });
      }

      return updatedEvent;
    }),

  // Reject a schedule request (COACH ONLY)
  rejectScheduleRequest: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
        reason: z.string().optional(),
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
          message: "Only coaches can reject schedule requests",
        });
      }

      // Find the event and verify it belongs to this coach
      const event = await db.event.findFirst({
        where: {
          id: input.eventId,
          coachId: ensureUserId(user.id),
          status: "PENDING",
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              userId: true, // Include userId to get the User.id for notifications
            },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule request not found or already processed",
        });
      }

      // Delete the declined event to free up the time slot
      const deletedEvent = await db.event.delete({
        where: { id: input.eventId },
      });

      // Create notification for the client
      if (event.client?.userId) {
        await db.notification.create({
          data: {
            userId: event.client.userId,
            type: "LESSON_CANCELLED",
            title: "Schedule Request Declined",
            message: `Your schedule request for ${format(
              new Date(event.date),
              "MMM d, yyyy 'at' h:mm a"
            )} has been declined and the time slot is now available.${
              input.reason ? ` Reason: ${input.reason}` : ""
            }`,
            data: {
              eventId: event.id,
              coachId: ensureUserId(user.id),
              coachName: coach.name,
              reason: input.reason,
            },
          },
        });
      }

      return deletedEvent;
    }),

  // Request a schedule change
  requestScheduleChange: publicProcedure
    .input(
      z.object({
        requestedDate: z.string(),
        requestedTime: z.string(),
        reason: z.string().optional(),
        timeZone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can request schedule changes",
        });
      }

      // Get client record to find their coach
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Parse the requested date and time
      const dateStr = input.requestedDate;
      const timeStr = input.requestedTime;

      // Parse the time string (e.g., "2:00 PM")
      const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid time format",
        });
      }

      const [_, hour, minute, period] = timeMatch;
      let hour24 = parseInt(hour);

      // Convert to 24-hour format
      if (period.toUpperCase() === "PM" && hour24 !== 12) {
        hour24 += 12;
      } else if (period.toUpperCase() === "AM" && hour24 === 12) {
        hour24 = 0;
      }

      // Create the full date string in local time
      const fullDateStr = `${dateStr}T${hour24
        .toString()
        .padStart(2, "0")}:${minute}:00`;

      // Convert local time to UTC using the user's timezone
      const timeZone = input.timeZone || "America/New_York";
      const utcDateTime = fromZonedTime(fullDateStr, timeZone);

      // Validate the date
      if (isNaN(utcDateTime.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid date/time combination",
        });
      }

      // Check if the requested time is in the past
      const now = new Date();
      if (utcDateTime <= now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot request lessons in the past",
        });
      }

      // Check if the requested date is on a working day
      const coach = await db.user.findFirst({
        where: { id: client.coachId || undefined },
      });

      if (coach?.workingDays) {
        const dayName = format(new Date(fullDateStr), "EEEE");
        if (!coach.workingDays.includes(dayName)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Coach is not available on ${dayName}s`,
          });
        }
      }

      // Check if the requested time slot is already booked
      const existingLesson = await db.event.findFirst({
        where: {
          coachId: client.coachId!,
          date: utcDateTime,
        },
      });

      if (existingLesson) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This time slot is already booked",
        });
      }

      // Create a schedule change request
      // Only create schedule request if client has a coach
      if (!client.coachId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Client must have an assigned coach to request schedule changes",
        });
      }

      const scheduleRequest = await db.event.create({
        data: {
          title: `Schedule Request - ${client.name}`,
          description: input.reason || "Client requested schedule change",
          date: utcDateTime,
          clientId: client.id,
          coachId: client.coachId!,
          status: "PENDING", // New status field for pending requests
        },
      });

      // Create notification for the coach (only if coach exists)
      if (client.coachId) {
        await db.notification.create({
          data: {
            userId: client.coachId,
            type: "SCHEDULE_REQUEST",
            title: "New Schedule Request",
            message: `${
              client.name
            } has requested a schedule change for ${format(
              new Date(fullDateStr),
              "MMM d, yyyy 'at' h:mm a"
            )}`,
            data: {
              eventId: scheduleRequest.id,
              clientId: client.id,
              clientName: client.name,
              requestedDate: utcDateTime,
              reason: input.reason,
            },
          },
        });
      }

      return scheduleRequest;
    }),

  getVideoSubmissions: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access this endpoint",
      });
    }

    // Get client record
    const client = await db.client.findFirst({
      where: { userId: user.id },
    });

    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    // Get client's video submissions
    const submissions = await db.clientVideoSubmission.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    });

    return submissions;
  }),

  getVideoSubmissionByDrill: publicProcedure
    .input(z.object({ drillId: z.string() }))
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get video submission for specific drill
      const submission = await db.clientVideoSubmission.findFirst({
        where: {
          clientId: client.id,
          drillId: input.drillId,
        },
      });

      return submission;
    }),

  getClientVideoSubmissions: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a COACH
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "COACH" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only coaches can access this endpoint",
      });
    }

    // Get coach's client video submissions
    const submissions = await db.clientVideoSubmission.findMany({
      where: { coachId: user.id },
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

  getClientVideoSubmissionById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a COACH
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can access this endpoint",
        });
      }

      // Get specific client video submission
      const submission = await db.clientVideoSubmission.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id),
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
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client video submission not found",
        });
      }

      return submission;
    }),

  submitVideo: publicProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        comment: z.string().optional(),
        videoUrl: z.string(),
        thumbnail: z.string().optional(),
        drillId: z.string().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Create video submission (only if client has a coach)
      if (!client.coachId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Client must have an assigned coach to submit videos",
        });
      }

      const videoSubmission = await db.clientVideoSubmission.create({
        data: {
          clientId: client.id,
          coachId: client.coachId!,
          title: input.title,
          description: input.description,
          comment: input.comment,
          videoUrl: input.videoUrl,
          thumbnail: input.thumbnail,
          drillId: input.drillId,
          isPublic: input.isPublic,
        },
      });

      // Create or find conversation between client and coach
      let conversation = await db.conversation.findFirst({
        where: {
          coachId: client.coachId!,
          clientId: ensureUserId(user.id),
        },
      });

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            coachId: client.coachId!,
            clientId: ensureUserId(user.id),
            type: "COACH_CLIENT",
          },
        });
      }

      // Create message in conversation
      const messageContent = input.comment
        ? `📹 **Video Submission: ${input.title}**\n\n${input.comment}`
        : `📹 **Video Submission: ${input.title}**`;

      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: messageContent,
          attachmentUrl: input.videoUrl,
          attachmentType: "video/mp4", // Set proper MIME type for video
          attachmentName: input.title,
          attachmentSize: null, // We don't have size info from UploadThing
        },
      });

      // Update conversation timestamp
      await db.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      // Create notification for the coach (only if coach exists)
      if (client.coachId) {
        await db.notification.create({
          data: {
            userId: client.coachId,
            type: "MESSAGE",
            title: `New video submission from ${client.name}`,
            message: `Client submitted a video: "${input.title}"`,
            data: {
              videoSubmissionId: videoSubmission.id,
              clientId: client.id,
              clientName: client.name,
            },
          },
        });
      }

      return { success: true, videoSubmission };
    }),

  addVideoComment: publicProcedure
    .input(
      z.object({
        videoSubmissionId: z.string(),
        comment: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can add comments to videos",
        });
      }

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Verify the video submission belongs to this client
      const videoSubmission = await db.clientVideoSubmission.findFirst({
        where: {
          id: input.videoSubmissionId,
          clientId: client.id,
        },
      });

      if (!videoSubmission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video submission not found or doesn't belong to you",
        });
      }

      // Update the video submission with the comment
      const updatedSubmission = await db.clientVideoSubmission.update({
        where: { id: input.videoSubmissionId },
        data: { comment: input.comment },
      });

      // Create or find conversation between client and coach
      let conversation = await db.conversation.findFirst({
        where: {
          coachId: client.coachId!,
          clientId: ensureUserId(user.id),
        },
      });

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            coachId: client.coachId!,
            clientId: ensureUserId(user.id),
            type: "COACH_CLIENT",
          },
        });
      }

      // Create message in conversation
      const messageContent = `💬 **Comment on Video: ${videoSubmission.title}**\n\n${input.comment}`;

      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: messageContent,
          attachmentUrl: videoSubmission.videoUrl,
          attachmentType: "video",
          attachmentName: videoSubmission.title,
        },
      });

      // Update conversation timestamp
      await db.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      // Create a notification for the coach (only if coach exists)
      if (client.coachId) {
        await db.notification.create({
          data: {
            userId: client.coachId,
            type: "MESSAGE",
            title: `New video comment from ${client.name}`,
            message: `Client added a comment to their video submission: "${input.comment.substring(
              0,
              100
            )}${input.comment.length > 100 ? "..." : ""}"`,
            data: {
              videoSubmissionId: input.videoSubmissionId,
              clientId: client.id,
              clientName: client.name,
            },
          },
        });
      }

      return { success: true, videoSubmission: updatedSubmission };
    }),

  addCommentToDrill: publicProcedure
    .input(
      z.object({
        drillId: z.string(),
        comment: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`🎯 addCommentToDrill called with drillId: ${input.drillId}`);
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Find video submission for this drill
      // First try with the exact drillId, then try with null for routine exercises
      let videoSubmission = await db.clientVideoSubmission.findFirst({
        where: {
          clientId: client.id,
          drillId: input.drillId,
        },
      });

      // If not found and drillId is a composite key, try with null drillId
      if (!videoSubmission && input.drillId.includes("-")) {
        videoSubmission = await db.clientVideoSubmission.findFirst({
          where: {
            clientId: client.id,
            drillId: null,
            title: {
              contains: input.drillId,
            },
          },
        });
      }

      // Create or find conversation between client and coach
      let conversation = await db.conversation.findFirst({
        where: {
          coachId: client.coachId!,
          clientId: ensureUserId(user.id),
        },
      });

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            coachId: client.coachId!,
            clientId: ensureUserId(user.id),
            type: "COACH_CLIENT",
          },
        });
      }

      if (videoSubmission) {
        // Update existing video submission with comment
        const updatedSubmission = await db.clientVideoSubmission.update({
          where: { id: videoSubmission.id },
          data: { comment: input.comment },
        });

        // Create message in conversation
        const messageContent = `💬 **Comment on Video: ${videoSubmission.title}**\n\n${input.comment}`;

        await db.message.create({
          data: {
            conversationId: conversation.id,
            senderId: user.id,
            content: messageContent,
            attachmentUrl: videoSubmission.videoUrl,
            attachmentType: "video",
            attachmentName: videoSubmission.title,
          },
        });

        // Update conversation timestamp
        await db.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });

        // Create notification for coach (only if coach exists)
        if (client.coachId) {
          await db.notification.create({
            data: {
              userId: client.coachId,
              type: "MESSAGE",
              title: `New video comment from ${client.name}`,
              message: `Client added a comment to their video submission: "${input.comment.substring(
                0,
                100
              )}${input.comment.length > 100 ? "..." : ""}"`,
              data: {
                videoSubmissionId: videoSubmission.id,
                clientId: client.id,
                clientName: client.name,
              },
            },
          });
        }

        return {
          success: true,
          videoSubmission: updatedSubmission,
          type: "video_comment",
        };
      } else {
        // No video submission found, create one with just the comment
        // Check if drillId is a valid ProgramDrill ID or a composite key
        let validDrillId: string | null = null;

        // First, try to find if it's a real ProgramDrill ID
        const existingDrill = await db.programDrill.findUnique({
          where: { id: input.drillId },
        });

        if (existingDrill) {
          validDrillId = input.drillId;
        } else {
          // If it's a composite key (routineAssignmentId-exerciseId),
          // we'll set drillId to null since it's not a real ProgramDrill
          console.log(
            `Drill ID ${input.drillId} is not a valid ProgramDrill ID, treating as routine exercise`
          );
        }

        const newVideoSubmission = await db.clientVideoSubmission.create({
          data: {
            clientId: client.id,
            coachId: client.coachId!,
            title: `Comment for Exercise ${input.drillId}`,
            description: "Client feedback and comments",
            comment: input.comment,
            videoUrl: "", // Empty since no video was uploaded
            drillId: validDrillId, // Will be null for routine exercises
            isPublic: false,
          },
        });

        // Create message in conversation
        const messageContent = validDrillId
          ? `💬 **Exercise Feedback for Drill ${input.drillId}**\n\n${input.comment}`
          : `💬 **Exercise Feedback for Routine Exercise ${input.drillId}**\n\n${input.comment}`;

        await db.message.create({
          data: {
            conversationId: conversation.id,
            senderId: user.id,
            content: messageContent,
          },
        });

        // Update conversation timestamp
        await db.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });

        // Create notification for coach (only if coach exists)
        if (client.coachId) {
          await db.notification.create({
            data: {
              userId: client.coachId,
              type: "MESSAGE",
              title: `New client comment from ${client.name}`,
              message: `Client added a comment for drill ${
                input.drillId
              }: "${input.comment.substring(0, 100)}${
                input.comment.length > 100 ? "..." : ""
              }"`,
              data: {
                videoSubmissionId: newVideoSubmission.id,
                clientId: client.id,
                clientName: client.name,
              },
            },
          });
        }

        return {
          success: true,
          videoSubmission: newVideoSubmission,
          type: "video_comment",
        };
      }
    }),

  // Get all upcoming lessons for the client (no date filter)
  getClientUpcomingLessons: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const dbUser = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access this endpoint",
      });
    }

    // Get client record
    const client = await db.client.findFirst({
      where: { userId: user.id },
    });

    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    const now = new Date();

    // Get all upcoming lessons for this client
    const upcomingLessons = await db.event.findMany({
      where: {
        clientId: client.id,
        date: {
          gte: now.toISOString(),
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return upcomingLessons;
  }),

  // Get all coach's lessons for conflict checking (for time slot generation)
  getAllCoachLessons: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user is a CLIENT
      const dbUser = await db.user.findFirst({
        where: { id: user.id, role: "CLIENT" },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access this endpoint",
        });
      }

      // Get client record to find their coach
      const client = await db.client.findFirst({
        where: { userId: user.id },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Only proceed if client has a coach
      if (!client.coachId) {
        return [];
      }

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      // Get ALL events (lessons) for the coach in the specified date range
      // This includes ALL lessons, not filtered like getCoachScheduleForClient
      const events = await db.event.findMany({
        where: {
          coachId: client.coachId!,
          clientId: { not: null }, // Only show events with a client (not reminders)
          status: "CONFIRMED", // Only confirmed lessons
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          date: true,
          endTime: true,
          title: true,
          clientId: true,
        },
        orderBy: {
          date: "asc",
        },
      });

      return events;
    }),
});
