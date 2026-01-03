import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import { format, addDays, addMonths, differenceInCalendarDays } from "date-fns";
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

const convertTimeStringToMinutes = (time: string | null | undefined) => {
  if (!time) return null;
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }
  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minute;
};

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
                          // CRITICAL: Explicitly include description field to ensure it's always returned
                          // Even if it's null in the database, we need it to normalize it to empty string
                          select: {
                            id: true,
                            order: true,
                            title: true,
                            description: true, // Explicitly include description
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
                            videoId: true,
                            videoThumbnail: true,
                            videoTitle: true,
                            supersetDescription: true,
                            supersetInstructions: true,
                            supersetNotes: true,
                            coachInstructionsWhatToDo: true,
                            coachInstructionsHowToDoIt: true,
                            coachInstructionsKeyPoints: true,
                            coachInstructionsCommonMistakes: true,
                            coachInstructionsEquipment: true,
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

    // CRITICAL: Verify the program ID matches the assignment's programId
    if (assignment.programId !== program.id) {
      // Program ID mismatch - handle silently
    }

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

    // CRITICAL: Normalize descriptions like routines do - ensure descriptions are always strings
    // This ensures consistency with how routine exercises handle descriptions
    const normalizedWeeks = program.weeks.map(week => ({
      ...week,
      days: week.days.map(day => ({
        ...day,
        drills: day.drills.map(drill => {
          // CRITICAL: Ensure description is always a string (never null/undefined)
          // This is essential for client-side display logic
          const normalizedDescription =
            drill.description !== null && drill.description !== undefined
              ? String(drill.description) // Convert to string if it exists
              : ""; // Use empty string if null/undefined

          // Normalize superset drill descriptions

          // CRITICAL: Explicitly set description to ensure it's always included
          // Even if the field was missing from the query, we want it to be an empty string
          const normalizedDrill = {
            ...drill,
            // Convert null/undefined descriptions to empty strings for consistency
            // This matches how routine exercises handle descriptions
            // CRITICAL: Always ensure this is a string, never null/undefined
            description: normalizedDescription,
            notes: drill.notes ?? "",
          };

          // Double-check that description is set (defensive programming)
          // Also check if description field exists in the drill object at all
          const hasDescriptionField = "description" in drill;

          if (
            normalizedDrill.description === null ||
            normalizedDrill.description === undefined
          ) {
            console.warn(
              "⚠️ WARNING: Description is still null/undefined after normalization!",
              {
                drillId: drill.id,
                title: drill.title,
                hasDescriptionField,
                originalDescription: drill.description,
                originalType: typeof drill.description,
                normalizedDescription,
                drillKeys: Object.keys(drill),
              }
            );
            normalizedDrill.description = "";
          }

          return normalizedDrill;
        }),
      })),
    }));

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
      weeks: normalizedWeeks,
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
      select: {
        notes: {
          select: {
            id: true,
            content: true,
            title: true,
            type: true,
            priority: true,
            isPrivate: true,
            isPinned: true,
            createdAt: true,
            updatedAt: true,
            coachId: true,
            clientId: true,
          },
          orderBy: [
            { isPinned: "desc" }, // Pinned notes first
            { createdAt: "desc" }, // Then by creation date
          ],
        },
        updatedAt: true,
      },
    });
    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    return { notes: client.notes, updatedAt: client.updatedAt };
  }),

  getNoteHistory: publicProcedure.query(async () => {
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

    // Get the client record
    const client = await db.client.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    // Get note history for this client
    const noteHistory = await db.clientNoteHistory.findMany({
      where: { clientId: client.id },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return noteHistory;
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

  // Lightweight calendar query - only loads basic day info
  getProgramCalendarLight: publicProcedure
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

        // Get client's assigned programs with minimal data
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
                          select: {
                            id: true,
                            dayNumber: true, // CRITICAL: needed for day matching!
                            title: true,
                            description: true,
                            isRestDay: true,
                            // Only get basic drill info for counting
                            drills: {
                              select: {
                                id: true,
                                title: true,
                                type: true,
                                routineId: true,
                                routine: {
                                  select: {
                                    id: true,
                                    exercises: {
                                      select: {
                                        id: true,
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
                replacements: {
                  include: {
                    program: {
                      include: {
                        weeks: {
                          include: {
                            days: {
                              select: {
                                id: true,
                                dayNumber: true, // CRITICAL: needed for day matching!
                                title: true,
                                description: true,
                                isRestDay: true,
                                drills: {
                                  select: {
                                    id: true,
                                    title: true,
                                    type: true,
                                    routineId: true,
                                    routine: {
                                      select: {
                                        id: true,
                                        name: true,
                                        exercises: {
                                          select: {
                                            id: true,
                                            title: true,
                                            description: true,
                                            sets: true,
                                            reps: true,
                                            tempo: true,
                                            type: true,
                                            videoUrl: true,
                                            videoId: true,
                                            videoThumbnail: true,
                                            videoTitle: true,
                                            order: true,
                                          },
                                          orderBy: {
                                            order: "asc",
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
              },
            },
            routineAssignments: {
              include: {
                routine: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    exercises: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          });
        }

        // Get exercise completions for the client
        // This is used for both program drills and standalone items
        const completions = await db.exerciseCompletion.findMany({
          where: { clientId: client.id },
          select: {
            exerciseId: true,
            programDrillId: true,
            completed: true,
            date: true,
          },
        });

        // Build completion map
        // Keys must match what's being saved by the modal/hook
        const completionMap = new Map<string, boolean>();
        completions.forEach(c => {
          // Skip completions without dates - they're invalid
          if (!c.date) {
            return;
          }

          if (
            c.programDrillId === "standalone-routine" ||
            c.programDrillId === "standalone-drill"
          ) {
            // Standalone item
            const key = `standalone-${c.exerciseId}-${c.date}`;
            completionMap.set(key, !!c.completed);
          } else if (c.programDrillId && c.programDrillId !== "") {
            // Routine exercise within a program: programDrillId is the parent drill ID
            const key = `${c.programDrillId}-${c.exerciseId}-${c.date}`;
            completionMap.set(key, !!c.completed);
          } else {
            // Regular program drill: exerciseId is the drill ID
            const key = `${c.exerciseId}-${c.date}`;
            completionMap.set(key, !!c.completed);
          }
        });

        // Generate calendar data with minimal information
        const calendarData: Record<string, any> = {};
        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 0);

        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          const dateString = d.toISOString().split("T")[0];
          const dayData: any = {
            date: dateString,
            programs: [],
            isRestDay: true,
            totalDrills: 0,
            completedDrills: 0,
            expectedTime: 0,
          };

          // Check for program assignments on this date
          for (const assignment of (client as any).programAssignments) {
            // First check if this specific date has been deleted (replacement with empty lessonId)
            // Compare dates as strings (YYYY-MM-DD) to avoid timezone issues
            // Use UTC methods to avoid timezone shifts when database returns UTC
            const deletedReplacement = assignment.replacements?.find(
              (r: any) => {
                const replacementDate = new Date(r.replacedDate);
                const replacementDateStr = `${replacementDate.getUTCFullYear()}-${(
                  replacementDate.getUTCMonth() + 1
                )
                  .toString()
                  .padStart(2, "0")}-${replacementDate
                  .getUTCDate()
                  .toString()
                  .padStart(2, "0")}`;
                const currentDateStr = dateString; // Already in YYYY-MM-DD format
                return (
                  replacementDateStr === currentDateStr &&
                  (!r.lessonId || r.lessonId === "") // Empty lessonId means deletion
                );
              }
            );

            // If this day was deleted, skip it
            if (deletedReplacement) {
              continue;
            }

            const program =
              assignment.replacements.find(
                (r: any) =>
                  new Date(r.startDate) <= d && new Date(r.endDate) >= d
              )?.program || assignment.program;

            if (program) {
              // Use startDate if available, otherwise fall back to assignedAt
              const programStartDate =
                assignment.startDate || assignment.assignedAt;

              // Skip dates before program starts - compare date components directly
              const startDateObj = new Date(programStartDate);
              const startYear = startDateObj.getFullYear();
              const startMonth = startDateObj.getMonth();
              const startDay = startDateObj.getDate();

              const currentYear = d.getFullYear();
              const currentMonth = d.getMonth();
              const currentDay = d.getDate();

              // Compare dates by components to avoid timezone issues
              if (
                currentYear < startYear ||
                (currentYear === startYear && currentMonth < startMonth) ||
                (currentYear === startYear &&
                  currentMonth === startMonth &&
                  currentDay < startDay)
              ) {
                continue; // Skip this date - program hasn't started yet
              }

              // Calculate which week and day this date corresponds to
              // Normalize both dates to local midnight to avoid timezone drift
              const startDt = new Date(programStartDate);
              const startLocal = new Date(
                startDt.getFullYear(),
                startDt.getMonth(),
                startDt.getDate()
              );
              const currentLocal = new Date(
                d.getFullYear(),
                d.getMonth(),
                d.getDate()
              );
              const daysSinceStart = Math.round(
                (currentLocal.getTime() - startLocal.getTime()) /
                  (24 * 60 * 60 * 1000)
              );
              const weekNumber = Math.floor(daysSinceStart / 7) + 1;
              const dayNumberInWeek = (daysSinceStart % 7) + 1;

              const week = program.weeks.find(
                (w: any) => w.weekNumber === weekNumber
              );

              if (week) {
                const day = week.days.find(
                  (day: any) => day.dayNumber === dayNumberInWeek
                );

                if (day) {
                  dayData.isRestDay = day.isRestDay;
                  dayData.expectedTime = 0; // Default value since expectedTime is not in the select

                  // Count drills and completions
                  let totalDrills = 0;
                  let completedDrills = 0;

                  for (const drill of day.drills) {
                    if (
                      drill.type === "routine" &&
                      drill.routineId &&
                      (drill as any).routine
                    ) {
                      // Count routine exercises - check each exercise individually
                      const routine = (drill as any).routine;
                      if (routine?.exercises) {
                        totalDrills += routine.exercises.length;
                        // Count completed exercises for this routine
                        routine.exercises.forEach((exercise: any) => {
                          const key = `${drill.id}-${exercise.id}-${dateString}`;
                          const isCompleted = completionMap.get(key);
                          if (isCompleted) {
                            completedDrills++;
                          }
                        });
                      }
                    } else {
                      // Regular drill
                      totalDrills++;
                      const key = `${drill.id}-${dateString}`;
                      const isCompleted = completionMap.get(key);
                      if (isCompleted) {
                        completedDrills++;
                      }
                    }
                  }

                  dayData.totalDrills = totalDrills;
                  dayData.completedDrills = completedDrills;


                  dayData.programs.push({
                    id: program.id,
                    title: program.title,
                    programTitle: program.title, // Add programTitle for calendar display
                    isRestDay: day.isRestDay,
                    totalDrills,
                    completedDrills,
                  });
                }
              }
            }
          }

          // Check for routine assignments on this date
          for (const routineAssignment of (client as any).routineAssignments) {
            if (
              new Date(routineAssignment.startDate) <= d &&
              new Date(routineAssignment.endDate) >= d
            ) {
              const routine = routineAssignment.routine;
              const totalExercises = routine.exercises.length;
              let completedExercises = 0;

              routine.exercises.forEach((exercise: any) => {
                const key = `standalone-${exercise.id}-${dateString}`;
                if (completionMap.get(key)) completedExercises++;
              });

              if (totalExercises > 0) {
                dayData.programs.push({
                  id: `routine-${routine.id}`,
                  title: routine.name,
                  programTitle: routine.name, // Add programTitle for calendar display
                  isRestDay: false,
                  totalDrills: totalExercises,
                  completedDrills: completedExercises,
                });
                dayData.totalDrills += totalExercises;
                dayData.completedDrills += completedExercises;
                dayData.isRestDay = false;
              }
            }
          }

          calendarData[dateString] = dayData;
        }

        return calendarData;
      } catch (error) {
        console.error("Error in getProgramCalendarLight:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load program calendar",
        });
      }
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
                                // Include routine with exercises for proper expansion
                                routine: {
                                  select: {
                                    id: true,
                                    name: true,
                                    description: true,
                                    exercises: {
                                      select: {
                                        id: true,
                                        title: true,
                                        description: true,
                                        sets: true,
                                        reps: true,
                                        tempo: true,
                                        type: true,
                                        videoUrl: true,
                                        videoId: true,
                                        videoThumbnail: true,
                                        videoTitle: true,
                                        order: true,
                                        // Superset/Circuit fields
                                        supersetId: true,
                                        supersetOrder: true,
                                        supersetDescription: true,
                                        supersetInstructions: true,
                                        supersetNotes: true,
                                      },
                                      orderBy: {
                                        order: "asc",
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

        // Get all program drill completions for routine exercises within programs
        const programDrillCompletions =
          await db.programDrillCompletion.findMany({
            where: { clientId: client.id },
          });

        // Get all routine exercise completions
        const routineExerciseCompletions =
          await db.routineExerciseCompletion.findMany({
            where: { clientId: client.id },
          });

        console.log("🎯 Retrieved completions:", {
          drillCompletions: allCompletions.length,
          programDrillCompletions: programDrillCompletions.length,
          routineExerciseCompletions: routineExerciseCompletions.length,
          routineExerciseCompletionsData: routineExerciseCompletions.map(c => ({
            exerciseId: c.exerciseId,
            routineAssignmentId: c.routineAssignmentId,
            completedAt: c.completedAt,
          })),
        });

        // Combine all completion types
        const allCompletionsCombined = [
          ...allCompletions,
          ...programDrillCompletions.map(completion => ({
            drillId: completion.drillId,
            clientId: completion.clientId,
            completedAt: completion.completedAt,
          })),
          // Add routine exercise completions with a special format for lookup
          ...routineExerciseCompletions.map(completion => ({
            drillId: `routine-${completion.exerciseId}`, // Special format for routine exercises
            clientId: completion.clientId,
            completedAt: completion.completedAt,
            exerciseId: completion.exerciseId, // Keep original exercise ID for reference
          })),
        ];

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
            // Sort days by dayNumber to ensure correct order
            const sortedDays = week.days.sort(
              (a, b) => a.dayNumber - b.dayNumber
            );
            for (const day of sortedDays) {
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
                  const completion = allCompletionsCombined.find(
                    (c: any) => c.drillId === drill.id
                  );


                  if (drill.routineId && drill.type === "routine") {
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
                        // For routine exercises within programs, use the original drill completion status
                        const exerciseId = `${drill.id}-routine-${exercise.id}`;
                        // Check if the original drill is completed by looking in the completions
                        const drillCompletion = allCompletionsCombined.find(
                          (c: any) => c.drillId === drill.id
                        );
                        const isCompleted = !!drillCompletion;

                        expandedDrills.push({
                          id: `${drill.id}-routine-${exercise.id}`, // Unique ID for tracking
                          title: exercise.title,
                          sets: exercise.sets,
                          reps: exercise.reps,
                          tempo: exercise.tempo,
                          tags: [], // Routine exercises don't have tags
                          videoUrl: exercise.videoUrl,
                          completed: isCompleted, // Use original drill completion status
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
                  programAssignmentId: assignment.id,
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

  // Detailed day query - loads full drill/exercise data for a specific date
  getProgramDayDetails: publicProcedure
    .input(
      z.object({
        date: z.string(), // YYYY-MM-DD format
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

        // Parse the clicked date as LOCAL date to avoid UTC shift
        const [ty, tm, td] = input.date.split("-").map(Number);
        const targetDate = new Date(ty, tm - 1, td);
        const dayOfWeek = targetDate.getDay();
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const dayName = dayNames[dayOfWeek]; // Keep for logging

        // Get client's assigned programs with full drill data
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
                                // Include routine with exercises for proper expansion
                                routine: {
                                  select: {
                                    id: true,
                                    name: true,
                                    description: true,
                                    exercises: {
                                      select: {
                                        id: true,
                                        title: true,
                                        description: true,
                                        sets: true,
                                        reps: true,
                                        tempo: true,
                                        type: true,
                                        videoUrl: true,
                                        videoId: true,
                                        videoThumbnail: true,
                                        videoTitle: true,
                                        order: true,
                                        // Superset/Circuit fields
                                        supersetId: true,
                                        supersetOrder: true,
                                        supersetDescription: true,
                                        supersetInstructions: true,
                                        supersetNotes: true,
                                      },
                                      orderBy: {
                                        order: "asc",
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
                replacements: {
                  include: {
                    program: {
                      include: {
                        weeks: {
                          include: {
                            days: {
                              where: {
                                title: {
                                  equals: dayName,
                                  mode: "insensitive",
                                },
                              },
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
                                    // Include routine with exercises for proper expansion
                                    routine: {
                                      select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                        exercises: {
                                          select: {
                                            id: true,
                                            title: true,
                                            description: true,
                                            sets: true,
                                            reps: true,
                                            tempo: true,
                                            type: true,
                                            videoUrl: true,
                                            videoId: true,
                                            videoThumbnail: true,
                                            videoTitle: true,
                                            order: true,
                                          },
                                          orderBy: {
                                            order: "asc",
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
              },
            },
            routineAssignments: {
              include: {
                routine: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    exercises: {
                      select: {
                        id: true,
                        title: true,
                        description: true,
                        sets: true,
                        reps: true,
                        tempo: true,
                        type: true,
                        videoUrl: true,
                        videoId: true,
                        videoThumbnail: true,
                        videoTitle: true,
                        order: true,
                      },
                      orderBy: {
                        order: "asc",
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found",
          });
        }

        // Get exercise completions for this specific date
        const completions = await db.exerciseCompletion.findMany({
          where: {
            clientId: client.id,
            date: input.date,
          },
          select: {
            exerciseId: true,
            programDrillId: true,
            completed: true,
            completedAt: true,
            date: true,
          },
        });

        // Create completion map for quick lookup
        const completionMap = new Map();
        completions.forEach(completion => {
          let key: string;
          const dateSuffix = completion.date
            ? `-${completion.date}`
            : `-${input.date}`;
          if (completion.programDrillId === "standalone-routine") {
            key = `standalone-routine-${completion.exerciseId}${dateSuffix}`;
          } else if (completion.programDrillId === "standalone-drill") {
            key = `standalone-${completion.exerciseId}${dateSuffix}`;
          } else {
            key = `${completion.programDrillId || "standalone"}-${
              completion.exerciseId
            }${dateSuffix}`;
          }
          completionMap.set(key, {
            completed: completion.completed,
            completedAt: completion.completedAt,
          });
        });

        // Build detailed day data
        const dayData: any = {
          date: input.date,
          programs: [],
          isRestDay: true,
          totalDrills: 0,
          completedDrills: 0,
          expectedTime: 0,
          drills: [], // For backward compatibility
        };


        // Process program assignments for this date
        for (const assignment of (client as any).programAssignments) {
          // First check if this specific date has been deleted (replacement with empty lessonId)
          // Compare dates as strings (YYYY-MM-DD) to avoid timezone issues
          // Use UTC methods to avoid timezone shifts when database returns UTC
          const deletedReplacement = assignment.replacements?.find((r: any) => {
            const replacementDate = new Date(r.replacedDate);
            const replacementDateStr = `${replacementDate.getUTCFullYear()}-${(
              replacementDate.getUTCMonth() + 1
            )
              .toString()
              .padStart(2, "0")}-${replacementDate
              .getUTCDate()
              .toString()
              .padStart(2, "0")}`;
            const targetDateStr = input.date; // Already in YYYY-MM-DD format
            return (
              replacementDateStr === targetDateStr &&
              (!r.lessonId || r.lessonId === "") // Empty lessonId means deletion
            );
          });

          // If this day was deleted, skip it
          if (deletedReplacement) {
            console.log(
              "🔍 getProgramDayDetails - Skipping deleted day:",
              input.date
            );
            continue;
          }

          const program =
            assignment.replacements.find(
              (r: any) =>
                new Date(r.startDate) <= targetDate &&
                new Date(r.endDate) >= targetDate
            )?.program || assignment.program;

          console.log("🔍 getProgramDayDetails - Assignment:", {
            assignmentId: assignment.id,
            startDate: assignment.startDate,
            endDate: assignment.endDate,
            hasProgram: !!program,
            programId: program?.id,
          });

          if (program) {
            console.log("🔍 getProgramDayDetails - Processing program:", {
              programId: program.id,
              programTitle: program.title,
              weeksCount: program.weeks?.length || 0,
            });

            // Use startDate if available, otherwise fall back to assignedAt
            const programStartDate =
              assignment.startDate || assignment.assignedAt;

            // Skip if target date is before program starts - compare date components directly
            const startDateObj = new Date(programStartDate);
            const startYear = startDateObj.getFullYear();
            const startMonth = startDateObj.getMonth();
            const startDay = startDateObj.getDate();

            const targetYear = targetDate.getFullYear();
            const targetMonth = targetDate.getMonth();
            const targetDay = targetDate.getDate();

            // Compare dates by components to avoid timezone issues
            if (
              targetYear < startYear ||
              (targetYear === startYear && targetMonth < startMonth) ||
              (targetYear === startYear &&
                targetMonth === startMonth &&
                targetDay < startDay)
            ) {
              continue; // Skip this program - it hasn't started yet
            }

            // Calculate which week and day this date corresponds to
            // Normalize both dates to local midnight to avoid timezone drift
            const startDt2 = new Date(programStartDate);
            const startLocal2 = new Date(
              startDt2.getFullYear(),
              startDt2.getMonth(),
              startDt2.getDate()
            );
            const targetLocal = new Date(
              targetDate.getFullYear(),
              targetDate.getMonth(),
              targetDate.getDate()
            );
            const daysSinceStart = Math.round(
              (targetLocal.getTime() - startLocal2.getTime()) /
                (24 * 60 * 60 * 1000)
            );
            const weekNumber = Math.floor(daysSinceStart / 7) + 1;
            const dayNumberInWeek = (daysSinceStart % 7) + 1;

            console.log("🔍 getProgramDayDetails - Week finding:", {
              daysSinceStart,
              weekNumber,
              dayNumberInWeek,
              foundWeek: !!program.weeks.find(
                (w: any) => w.weekNumber === weekNumber
              ),
              weeksAvailable:
                program.weeks?.map((w: any) => w.weekNumber) || [],
            });

            const week = program.weeks.find(
              (w: any) => w.weekNumber === weekNumber
            );

            if (week) {
              // Match by dayNumber (sequential days from start)
              const day = week.days.find(
                (day: any) => day.dayNumber === dayNumberInWeek
              );

              console.log("🔍 getProgramDayDetails - Day finding:", {
                dayName,
                dayNumberInWeek,
                foundDay: !!day,
                daysAvailable:
                  week.days?.map((d: any) => ({
                    dayNumber: d.dayNumber,
                    title: d.title,
                  })) || [],
              });

              if (day) {
                // Debug: Log drill data from database
                console.log("🔍 getProgramDayDetails - Day drills from DB:", {
                  dayNumber: day.dayNumber,
                  drillCount: day.drills?.length || 0,
                  drills:
                    day.drills?.map((d: any) => ({
                      id: d.id,
                      title: d.title,
                      hasSupersetId: !!d.supersetId,
                      supersetId: d.supersetId,
                      supersetOrder: d.supersetOrder,
                      hasRoutineId: !!d.routineId,
                      routineExerciseCount: d.routine?.exercises?.length || 0,
                      routineExercisesWithSuperset:
                        d.routine?.exercises?.filter((e: any) => e.supersetId)
                          ?.length || 0,
                    })) || [],
                });

                dayData.isRestDay = day.isRestDay;
                dayData.expectedTime = 0; // Default value since expectedTime is not in the select

                const programData: any = {
                  id: program.id,
                  programId: program.id, // Add programId for modal compatibility
                  programTitle: program.title,
                  isRestDay: day.isRestDay,
                  drills: [] as any[],
                };

                // Process drills and expand routines with correct completion checks
                for (const drill of day.drills) {
                  if (drill.routineId && drill.type === "routine") {
                    // Routine drill - expand exercises
                    const routine = drill.routine;
                    if (routine?.exercises?.length) {
                      for (const exercise of routine.exercises) {
                        // For program routines: inherit parent drill completion (by drillId+assignment)
                        const pdKey = `${drill.id}-${assignment.id}`;
                        const isCompleted = completionMap.get(pdKey);

                        programData.drills.push({
                          id: `${drill.id}-routine-${exercise.id}`,
                          title: exercise.title,
                          description: exercise.description,
                          sets: exercise.sets,
                          reps: exercise.reps,
                          tempo: exercise.tempo,
                          notes: exercise.notes,
                          duration: exercise.duration,
                          type: exercise.type,
                          videoUrl: exercise.videoUrl,
                          videoId: exercise.videoId,
                          videoTitle: exercise.videoTitle,
                          videoThumbnail: exercise.videoThumbnail,
                          completed: !!isCompleted,
                          // Superset fields
                          supersetId: exercise.supersetId,
                          supersetOrder: exercise.supersetOrder,
                          supersetDescription: exercise.supersetDescription,
                          supersetInstructions: exercise.supersetInstructions,
                          supersetNotes: exercise.supersetNotes,
                          routineId: drill.routineId,
                          originalDrillId: drill.id,
                        });
                      }
                    }
                  } else {
                    // Regular drill - completion key format: `standalone-<exerciseId>-<date>`
                    const pdKey = `${drill.id}-${assignment.id}`;
                    let isCompleted = completionMap.get(pdKey);
                    // Fallback to standalone if any (e.g., non-program use)
                    if (!isCompleted) {
                      const standaloneKey = `standalone-${drill.id}-${input.date}`;
                      isCompleted = completionMap.get(standaloneKey);
                    }

                    programData.drills.push({
                      id: drill.id,
                      title: drill.title,
                      sets: drill.sets,
                      reps: drill.reps,
                      tempo: drill.tempo,
                      notes: drill.notes,
                      duration: drill.duration,
                      type: drill.type,
                      videoUrl: drill.videoUrl,
                      videoId: drill.videoId,
                      videoTitle: drill.videoTitle,
                      videoThumbnail: drill.videoThumbnail,
                      completed: !!isCompleted,
                      // Superset/Circuit fields
                      supersetId: drill.supersetId,
                      supersetOrder: drill.supersetOrder,
                      supersetDescription: drill.supersetDescription,
                      supersetInstructions: drill.supersetInstructions,
                      supersetNotes: drill.supersetNotes,
                    });
                  }
                }

                if (!programData.isRestDay) {
                  dayData.programs.push(programData);
                } else if (programData.drills.length > 0) {
                  // If drills exist, it's not a rest day
                  programData.isRestDay = false;
                  dayData.programs.push(programData);
                }
              }
            }
          }
        }

        // Process routine assignments for this date
        for (const routineAssignment of (client as any).routineAssignments) {
          if (
            new Date(routineAssignment.startDate) <= targetDate &&
            new Date(routineAssignment.endDate) >= targetDate
          ) {
            const routine = routineAssignment.routine;
            const routineData: any = {
              id: `routine-${routine.id}`,
              programId: `routine-${routine.id}`, // Add programId for modal compatibility
              title: routine.name,
              programTitle: routine.name, // Add programTitle for modal compatibility
              isRestDay: false,
              drills: [],
              totalDrills: routine.exercises.length,
              completedDrills: 0,
            };

            for (const exercise of routine.exercises) {
              const exerciseId = `${routineAssignment.id}-${exercise.id}`;
              const completionKey = `${exercise.id}-standalone-routine`;
              const completion = completionMap.get(completionKey);

              const exerciseData = {
                id: exerciseId,
                title: exercise.title,
                description: exercise.description,
                sets: exercise.sets,
                reps: exercise.reps,
                tempo: exercise.tempo,
                type: exercise.type,
                videoUrl: exercise.videoUrl,
                videoId: exercise.videoId,
                videoThumbnail: exercise.videoThumbnail,
                videoTitle: exercise.videoTitle,
                completed: completion?.completed || false,
                completedAt: completion?.completedAt,
              };

              routineData.drills.push(exerciseData);
              dayData.drills.push(exerciseData);
              if (exerciseData.completed) {
                routineData.completedDrills++;
                dayData.completedDrills++;
              }
            }

            dayData.totalDrills += routineData.totalDrills;
            dayData.programs.push(routineData);
            dayData.isRestDay = false;
          }
        }

        console.log("🔍 getProgramDayDetails - Final dayData:", {
          date: dayData.date,
          programsCount: dayData.programs?.length || 0,
          isRestDay: dayData.isRestDay,
          totalDrills: dayData.totalDrills,
          completedDrills: dayData.completedDrills,
          programs:
            dayData.programs?.map((p: any) => ({
              id: p.id,
              programId: p.programId,
              title: p.title,
              programTitle: p.programTitle,
              isRestDay: p.isRestDay,
              drillsCount: p.drills?.length || 0,
            })) || [],
        });

        return dayData;
      } catch (error) {
        console.error("Error in getProgramDayDetails:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load program day details",
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
              replacements: {
                orderBy: {
                  replacedDate: "asc",
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

      // Get all program drill completions for this client
      const programDrillCompletions = await db.programDrillCompletion.findMany({
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
            // Calculate the day offset properly for Monday-first week structure
            // dayNumber 1 = Monday (offset 0), dayNumber 7 = Sunday (offset 6)
            const dayOffset = day.dayNumber - 1;
            dayDate.setDate(
              programStartDateLocal.getDate() +
                (week.weekNumber - 1) * 7 +
                dayOffset
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

              // Check if this specific date has been deleted (replacement with empty lessonId)
              // Compare dates as strings (YYYY-MM-DD) to avoid timezone issues
              // Use UTC methods to avoid timezone shifts when database returns UTC
              const deletedReplacement = assignment.replacements?.find(
                (r: any) => {
                  const replacementDate = new Date(r.replacedDate);
                  const replacementDateStr = `${replacementDate.getUTCFullYear()}-${(
                    replacementDate.getUTCMonth() + 1
                  )
                    .toString()
                    .padStart(2, "0")}-${replacementDate
                    .getUTCDate()
                    .toString()
                    .padStart(2, "0")}`;
                  const dayDateStr = dateString; // Already in YYYY-MM-DD format
                  return (
                    replacementDateStr === dayDateStr &&
                    (!r.lessonId || r.lessonId === "") // Empty lessonId means deletion
                  );
                }
              );

              // If this day was deleted, skip it
              if (deletedReplacement) {
                continue;
              }

              // Process drills and expand routines
              const expandedDrills = [];
              for (const drill of day.drills) {
                const completion = programDrillCompletions.find(
                  (c: any) =>
                    c.drillId === drill.id &&
                    c.programAssignmentId === assignment.id
                );

                if (drill.routineId && drill.type === "routine") {
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
                        completed: !!completion, // Use program drill completion status
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
        // For routine exercises within programs, these are now individual drill records
        // The drill ID format is "drillId-routine-exerciseId" and this ID exists in the database

        // Find the program assignment that contains this drill
        const allProgramAssignments = await db.programAssignment.findMany({
          where: {
            clientId: client.id,
            completedAt: null,
          },
          include: {
            program: {
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
            },
          },
        });

        // Find the program assignment that contains this drill
        let programAssignment = null;
        console.log("🎯 Looking for drill ID:", input.drillId);

        for (const assignment of allProgramAssignments) {
          console.log("🎯 Checking assignment:", assignment.id);
          const hasDrill = assignment.program.weeks.some(week =>
            week.days.some(day =>
              day.drills.some(drill => {
                return drill.id === input.drillId;
              })
            )
          );
          if (hasDrill) {
            programAssignment = assignment;
            console.log("🎯 Found matching program assignment:", assignment.id);
            break;
          }
        }

        if (!programAssignment) {
          // Fallback: try to find the original drill ID for existing programs
          const originalDrillId = input.drillId.split("-routine-")[0];
          console.log("🎯 Looking for original drill ID:", originalDrillId);

          for (const assignment of allProgramAssignments) {
            const hasDrill = assignment.program.weeks.some(week =>
              week.days.some(day =>
                day.drills.some(drill => drill.id === originalDrillId)
              )
            );
            if (hasDrill) {
              programAssignment = assignment;
              break;
            }
          }

          if (!programAssignment) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Program assignment not found for this drill",
            });
          }
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

        // Determine which drill ID to use for completion records
        const drillIdForCompletion =
          input.drillId.includes("-routine-") &&
          !programAssignment.program.weeks.some(week =>
            week.days.some(day =>
              day.drills.some(drill => drill.id === input.drillId)
            )
          )
            ? input.drillId.split("-routine-")[0] // Use original drill ID for existing programs
            : input.drillId; // Use full drill ID for new programs

        console.log("🎯 Using drill ID for completion:", drillIdForCompletion);

        if (input.completed) {
          // Use upsert to handle both create and update cases
          await db.programDrillCompletion.upsert({
            where: {
              drillId_programAssignmentId: {
                drillId: drillIdForCompletion,
                programAssignmentId: programAssignment.id,
              },
            },
            update: {
              completedAt: new Date(),
            },
            create: {
              drillId: drillIdForCompletion,
              programAssignmentId: programAssignment.id,
              clientId: client.id,
              completedAt: new Date(),
            },
          });
        } else {
          // Remove program drill completion
          await db.programDrillCompletion.deleteMany({
            where: {
              drillId: drillIdForCompletion,
              programAssignmentId: programAssignment.id,
              clientId: client.id,
            },
          });
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
        } else {
          await db.drillCompletion.deleteMany({
            where: {
              drillId: input.drillId,
              clientId: client.id,
            },
          });
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


      console.log("🔍 Debug - Client ID:", client.id);

      // Debug: Check what routine assignments exist for this client
      const allClientAssignments = await db.routineAssignment.findMany({
        where: { clientId: client.id },
        select: { id: true, routineId: true, assignedAt: true },
      });

      // Debug: Check if the specific routine assignment exists
      const specificAssignment = await db.routineAssignment.findFirst({
        where: { id: input.routineAssignmentId },
        select: { id: true, clientId: true, routineId: true, assignedAt: true },
      });

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
      } else {
        await db.routineExerciseCompletion.deleteMany({
          where: {
            routineAssignmentId: input.routineAssignmentId,
            exerciseId: input.exerciseId,
            clientId: client.id,
          },
        });
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
          coachId: ensureUserId(user.id),
          status: "PENDING",
          clientId: { not: null },
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

  // Get ALL organization coaches' schedules for client to view
  getOrganizationCoachesSchedules: publicProcedure
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
        include: {
          coach: {
            include: {
              coachOrganizations: {
                where: { isActive: true },
              },
            },
          },
          organization: true, // Include client's organization
        },
      });

      if (!client || !client.coachId) {
        return { coaches: [], events: [] };
      }

      // Determine organization ID - prioritize client's organizationId, then coach's organization
      let organizationId = client.organizationId;

      if (!organizationId) {
        // Check if coach is in an organization
        const coachOrganization = client.coach?.coachOrganizations?.[0];
        if (coachOrganization) {
          organizationId = coachOrganization.organizationId;
        }
      }

      if (!organizationId) {
        // Not in an organization, fall back to single coach
        return { coaches: [], events: [] };
      }

      // Get all coaches in the organization
      const orgCoaches = await db.coachOrganization.findMany({
        where: {
          organizationId: organizationId,
          isActive: true,
        },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              email: true,
              workingDays: true,
              workingHoursStart: true,
              workingHoursEnd: true,
              timeSlotInterval: true,
              customWorkingHours: true,
            },
          },
        },
      });

      const coachIds = orgCoaches.map(c => c.coachId);

      const coachSettings = await db.userSettings.findMany({
        where: {
          userId: { in: coachIds },
        },
      });

      const coachSettingsMap = coachSettings.reduce((acc, setting) => {
        acc[setting.userId] =
          (setting as any)?.clientScheduleAdvanceLimitDays ?? null;
        return acc;
      }, {} as Record<string, number | null>);

      // Calculate month start and end dates
      const monthStart = new Date(input.year, input.month, 1);
      const monthEnd = new Date(input.year, input.month + 1, 0, 23, 59, 59);
      const now = new Date();

      // Get all events (lessons) from ALL coaches in the organization
      const events = await db.event.findMany({
        where: {
          coachId: { in: coachIds },
          clientId: { not: null }, // Only show events with a client (not reminders)
          status: "CONFIRMED", // Only show confirmed lessons
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
          coach: {
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

      // Filter out this client's own pending requests
      const filteredEvents = events.filter(
        event => !(event.clientId === client.id && event.status === "PENDING")
      );

      const result = {
        coaches: orgCoaches.map(co => ({
          id: co.coach.id,
          name: co.coach.name,
          email: co.coach.email,
          workingDays: co.coach.workingDays,
          workingHoursStart: co.coach.workingHoursStart,
          workingHoursEnd: co.coach.workingHoursEnd,
          timeSlotInterval: co.coach.timeSlotInterval,
          scheduleAdvanceLimitDays: coachSettingsMap[co.coach.id] ?? null,
          customWorkingHours:
            (co.coach as any)?.customWorkingHours &&
            typeof (co.coach as any)?.customWorkingHours === "object"
              ? (co.coach as any)?.customWorkingHours
              : null,
        })),
        events: filteredEvents,
      };

      // Debug logging
      console.log("🔍 CLIENT SCHEDULE DEBUG:", {
        clientId: client.id,
        clientName: client.name,
        clientOrganizationId: client.organizationId,
        coachOrganizationId: organizationId,
        totalCoachesInOrg: result.coaches.length,
        coachNames: result.coaches.map(c => c.name),
        totalEvents: result.events.length,
        eventsByCoach: result.events.reduce((acc: any, event: any) => {
          const coachName = event.coach?.name || "Unknown";
          acc[coachName] = (acc[coachName] || 0) + 1;
          return acc;
        }, {}),
      });

      return result;
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
        customWorkingHours: true,
      },
    });

    if (!coach) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Coach not found",
      });
    }

    const coachSettings = await db.userSettings.findUnique({
      where: { userId: coach.id },
    });

    // Format the working hours data to match the expected structure
    const customWorkingHours =
      (coach as any)?.customWorkingHours &&
      typeof (coach as any)?.customWorkingHours === "object"
        ? (coach as any).customWorkingHours
        : null;

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
        customWorkingHours: customWorkingHours,
      },
      scheduleAdvanceLimitDays:
        (coachSettings as any)?.clientScheduleAdvanceLimitDays ?? null,
      customWorkingHours,
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
        clientId: { not: null },
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
        const notification = await db.notification.create({
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
              clientId: event.clientId,
              coachId: ensureUserId(user.id),
              coachName: coach.name,
            },
          },
        });

        // Send push notification
        try {
          const { sendNotificationPush } = await import(
            "@/lib/pushNotificationService"
          );
          await sendNotificationPush(
            event.client.userId,
            "LESSON_SCHEDULED",
            notification.title,
            notification.message,
            notification.data as any
          );
        } catch (error) {
          console.error("Failed to send push notification for schedule request approved:", error);
        }
      }

      return updatedEvent;
    }),

  // Reject a schedule request (COACH ONLY) - restores old lesson if it was an exchange
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

      // Check if this was an exchange (old lesson data stored in description)
      const reasonText = event.description || "";
      
      // Extract the outermost [OLD_LESSON_DATA] tag (handle nested patterns)
      // Find the first [OLD_LESSON_DATA] and match to the last [/OLD_LESSON_DATA] to get outermost
      const firstIndex = reasonText.indexOf("[OLD_LESSON_DATA]");
      const lastIndex = reasonText.lastIndexOf("[/OLD_LESSON_DATA]");
      
      let restoredLesson = null;
      if (firstIndex !== -1 && lastIndex !== -1 && lastIndex > firstIndex) {
        try {
          // Extract the content between first [OLD_LESSON_DATA] and last [/OLD_LESSON_DATA]
          const dataStart = firstIndex + "[OLD_LESSON_DATA]".length;
          const dataEnd = lastIndex;
          let extractedData = reasonText.substring(dataStart, dataEnd);
          
          // Remove any nested [OLD_LESSON_DATA] tags from the extracted data
          let cleanedData = extractedData;
          let dataPreviousLength = 0;
          while (cleanedData.length !== dataPreviousLength) {
            dataPreviousLength = cleanedData.length;
            cleanedData = cleanedData.replace(/\[OLD_LESSON_DATA\][\s\S]*?\[\/OLD_LESSON_DATA\]/g, "");
          }
          
          const oldLessonData = JSON.parse(cleanedData);
          
          // Clean the description field if it contains nested tags
          let cleanDescription = oldLessonData.description || "";
          if (cleanDescription) {
            let descPreviousLength = 0;
            while (cleanDescription.length !== descPreviousLength) {
              descPreviousLength = cleanDescription.length;
              cleanDescription = cleanDescription.replace(/\[OLD_LESSON_DATA\][\s\S]*?\[\/OLD_LESSON_DATA\]/g, "");
            }
            cleanDescription = cleanDescription.trim();
          }
          
          // Restore the old lesson
          restoredLesson = await db.event.create({
            data: {
              coachId: event.coachId,
              clientId: event.clientId,
              date: new Date(oldLessonData.date),
              title: oldLessonData.title,
              description: cleanDescription,
              status: oldLessonData.status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
            },
          });
        } catch (error) {
          console.error("Error restoring old lesson:", error);
          console.error("Failed to parse old lesson data. First index:", firstIndex, "Last index:", lastIndex);
          // Continue with rejection even if restoration fails
        }
      }

      // Delete the declined event to free up the time slot
      const deletedEvent = await db.event.delete({
        where: { id: input.eventId },
      });

      // Create notification for the client
      if (event.client?.userId) {
        const message = restoredLesson
          ? `Your schedule request for ${format(
              new Date(event.date),
              "MMM d, yyyy 'at' h:mm a"
            )} has been declined. Your original lesson has been restored.${
              input.reason ? ` Reason: ${input.reason}` : ""
            }`
          : `Your schedule request for ${format(
              new Date(event.date),
              "MMM d, yyyy 'at' h:mm a"
            )} has been declined and the time slot is now available.${
              input.reason ? ` Reason: ${input.reason}` : ""
            }`;

        const notification = await db.notification.create({
          data: {
            userId: event.client.userId,
            type: restoredLesson ? "LESSON_RESTORED" : "LESSON_CANCELLED",
            title: restoredLesson ? "Schedule Request Declined - Lesson Restored" : "Schedule Request Declined",
            message: message,
            data: {
              eventId: event.id,
              clientId: event.clientId,
              coachId: ensureUserId(user.id),
              coachName: coach.name,
              reason: input.reason,
              restoredLessonId: restoredLesson?.id,
            },
          },
        });

        // Send push notification
        try {
          const { sendNotificationPush } = await import(
            "@/lib/pushNotificationService"
          );
          await sendNotificationPush(
            event.client.userId,
            restoredLesson ? "LESSON_RESTORED" : "LESSON_CANCELLED",
            notification.title,
            notification.message,
            notification.data as any
          );
        } catch (error) {
          console.error("Failed to send push notification for schedule request declined:", error);
        }
      }

      return { deletedEvent, restoredLesson };
    }),

  // Request a schedule change
  requestScheduleChange: publicProcedure
    .input(
      z.object({
        requestedDate: z.string(),
        requestedTime: z.string(),
        reason: z.string().optional(),
        timeZone: z.string().optional(),
        coachId: z.string().optional(), // Allow selecting a specific coach in organization
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
        include: {
          coach: {
            include: {
              coachOrganizations: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Determine which coach to send the request to
      let targetCoachId = input.coachId || client.coachId;

      // If a specific coach was selected, verify they're in the same organization
      if (input.coachId && input.coachId !== client.coachId) {
        const coachOrganization = client.coach?.coachOrganizations?.[0];

        if (!coachOrganization) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You can only request lessons from coaches in your organization",
          });
        }

        // Verify the selected coach is in the same organization
        const targetCoachInOrg = await db.coachOrganization.findFirst({
          where: {
            coachId: input.coachId,
            organizationId: coachOrganization.organizationId,
            isActive: true,
          },
        });

        if (!targetCoachInOrg) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Selected coach is not in your organization",
          });
        }
      }

      if (!targetCoachId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No coach specified",
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
        where: { id: targetCoachId },
        select: {
          id: true,
          name: true,
          workingDays: true,
          workingHoursStart: true,
          workingHoursEnd: true,
          timeSlotInterval: true,
          customWorkingHours: true,
        },
      });

      const minuteInt = parseInt(minute, 10);
      const requestedMinutes = hour24 * 60 + minuteInt;

      if (coach) {
        const dayName = format(new Date(fullDateStr), "EEEE");
        const defaultWorkingDays =
          coach.workingDays && coach.workingDays.length > 0
            ? coach.workingDays
            : [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ];

        const customWorkingHours =
          (coach as any)?.customWorkingHours &&
          typeof (coach as any)?.customWorkingHours === "object"
            ? (coach as any)?.customWorkingHours
            : null;

        let isWorkingDay = defaultWorkingDays.includes(dayName);
        let allowedStart = coach.workingHoursStart || "9:00 AM";
        let allowedEnd = coach.workingHoursEnd || "6:00 PM";

        if (customWorkingHours) {
          const dayConfig = customWorkingHours[dayName];
          if (dayConfig && typeof dayConfig === "object") {
            if (
              (dayConfig as any).enabled !== undefined &&
              (dayConfig as any).enabled === false
            ) {
              isWorkingDay = false;
            } else {
              isWorkingDay =
                (dayConfig as any).enabled === undefined
                  ? isWorkingDay
                  : (dayConfig as any).enabled !== false;
            }

            if ((dayConfig as any).startTime) {
              allowedStart = (dayConfig as any).startTime;
            }
            if ((dayConfig as any).endTime) {
              allowedEnd = (dayConfig as any).endTime;
            }
          }
        }

        if (!isWorkingDay) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${
              coach.name || "This coach"
            } is not available on ${dayName}s`,
          });
        }

        const startMinutes = convertTimeStringToMinutes(allowedStart);
        const endMinutes = convertTimeStringToMinutes(allowedEnd);

        if (
          startMinutes !== null &&
          endMinutes !== null &&
          (requestedMinutes < startMinutes || requestedMinutes >= endMinutes)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${
              coach.name || "This coach"
            } accepts requests between ${allowedStart} and ${allowedEnd} on ${dayName}s.`,
          });
        }
      }

      const coachSettings = await db.userSettings.findUnique({
        where: { userId: targetCoachId },
      });

      const advanceLimitDays =
        (coachSettings as any)?.clientScheduleAdvanceLimitDays ?? null;

      if (advanceLimitDays && advanceLimitDays > 0) {
        const today = new Date();
        const startOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const requestedDateOnly = new Date(
          utcDateTime.getFullYear(),
          utcDateTime.getMonth(),
          utcDateTime.getDate()
        );
        const diff = differenceInCalendarDays(requestedDateOnly, startOfToday);

        if (diff > advanceLimitDays) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `You can only request lessons up to ${advanceLimitDays} days in advance.`,
          });
        }
      }

      // Check if the requested time slot is already booked
      const existingLesson = await db.event.findFirst({
        where: {
          coachId: targetCoachId,
          date: utcDateTime,
        },
      });

      if (existingLesson) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This time slot is already booked",
        });
      }

      const scheduleRequest = await db.event.create({
        data: {
          title: `Schedule Request - ${client.name}${
            input.coachId && input.coachId !== client.coachId
              ? ` (requesting ${coach?.name})`
              : ""
          }`,
          description: input.reason || "Client requested schedule change",
          date: utcDateTime,
          clientId: client.id,
          coachId: targetCoachId,
          status: "PENDING", // New status field for pending requests
        },
      });

      // Create notification for the coach
      const notification = await db.notification.create({
        data: {
          userId: targetCoachId,
          type: "SCHEDULE_REQUEST",
          title: "New Schedule Request",
          message: `${client.name} has requested a lesson for ${format(
            new Date(fullDateStr),
            "MMM d, yyyy 'at' h:mm a"
          )}${input.reason ? `: ${input.reason}` : ""}`,
          data: {
            eventId: scheduleRequest.id,
            clientId: client.id,
            clientName: client.name,
            clientUserId: client.userId,
            requestedDate: utcDateTime,
            reason: input.reason,
            coachId: targetCoachId,
          },
        },
      });

      // Send push notification
      try {
        const { sendNotificationPush } = await import(
          "@/lib/pushNotificationService"
        );
        await sendNotificationPush(
          targetCoachId,
          "SCHEDULE_REQUEST",
          notification.title,
          notification.message,
          notification.data as any
        );
      } catch (error) {
        console.error("Failed to send push notification for schedule request:", error);
      }

      return scheduleRequest;
    }),

  // Exchange lesson - removes old lesson and creates new request (can restore if rejected)
  exchangeLesson: publicProcedure
    .input(
      z.object({
        oldLessonId: z.string(),
        requestedDate: z.string(),
        requestedTime: z.string(),
        reason: z.string().optional(),
        timeZone: z.string().optional(),
        coachId: z.string().optional(),
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
          message: "Only clients can exchange lessons",
        });
      }

      // Get client record
      const client = await db.client.findFirst({
        where: { userId: user.id },
        include: {
          coach: {
            include: {
              coachOrganizations: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      // Get the old lesson
      const oldLesson = await db.event.findFirst({
        where: {
          id: input.oldLessonId,
          clientId: client.id,
        },
        include: {
          client: true,
        },
      });

      if (!oldLesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson not found",
        });
      }

      // Determine which coach to send the request to
      let targetCoachId = input.coachId || client.coachId;

      if (!targetCoachId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No coach specified",
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
      const { fromZonedTime } = await import("date-fns-tz");
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

      // Get coach name for the title
      const targetCoach = await db.user.findFirst({
        where: { id: targetCoachId },
        select: { name: true },
      });

      // Store old lesson data in the description field (we'll use a special format)
      const oldLessonData = JSON.stringify({
        id: oldLesson.id,
        date: oldLesson.date.toISOString(),
        title: oldLesson.title,
        description: oldLesson.description,
        status: oldLesson.status,
      });

      // Delete the old lesson
      await db.event.delete({
        where: { id: input.oldLessonId },
      });

      // Create new schedule request (as Event) with old lesson data stored in description
      const scheduleRequest = await db.event.create({
        data: {
          title: `Schedule Request - ${client.name}${
            input.coachId && input.coachId !== client.coachId
              ? ` (requesting ${targetCoach?.name || "Coach"})`
              : ""
          }`,
          description: `${input.reason || "Client requested to exchange lesson time"}\n\n[OLD_LESSON_DATA]${oldLessonData}[/OLD_LESSON_DATA]`,
          date: utcDateTime,
          clientId: client.id,
          coachId: targetCoachId,
          status: "PENDING",
        },
      });

      // Format dates in UTC for notification/email
      const { formatInTimeZone } = await import("date-fns-tz");
      const utcTimeZone = "UTC";
      
      // Format dates explicitly in UTC timezone
      const oldLessonDate = formatInTimeZone(oldLesson.date, utcTimeZone, "MMM d, yyyy 'at' h:mm a");
      const newRequestedDate = formatInTimeZone(utcDateTime, utcTimeZone, "MMM d, yyyy 'at' h:mm a");

      // Create notification for the coach
      const notification = await db.notification.create({
        data: {
          userId: targetCoachId,
          type: "SCHEDULE_REQUEST",
          title: "Lesson Exchange Request",
          message: `${client.name} wants to exchange their lesson on ${oldLessonDate} UTC for ${newRequestedDate} UTC${input.reason ? `: ${input.reason}` : ""}`,
          data: {
            eventId: scheduleRequest.id,
            clientId: client.id,
            clientName: client.name,
            clientUserId: client.userId,
            requestedDate: utcDateTime,
            reason: input.reason,
            coachId: targetCoachId,
            oldLessonId: oldLesson.id,
            oldLessonDate: oldLesson.date.toISOString(),
            isExchange: true,
          },
        },
      });

      // Send push notification
      try {
        const { sendNotificationPush } = await import(
          "@/lib/pushNotificationService"
        );
        await sendNotificationPush(
          targetCoachId,
          "SCHEDULE_REQUEST",
          notification.title,
          notification.message,
          notification.data as any
        );
      } catch (error) {
        console.error("Failed to send push notification for lesson exchange request:", error);
      }

      // Send email notification to coach
      const { CompleteEmailService } = await import("@/lib/complete-email-service");
      const emailService = CompleteEmailService.getInstance();
      
      // Get coach user record for email
      const coachUser = await db.user.findFirst({
        where: { id: targetCoachId },
        select: { email: true, name: true },
      });

      if (coachUser?.email) {
        // Format dates in coach's timezone for email (not UTC)
        const { getUserTimezoneFromDB, formatTimeInTimezone, formatDateInTimezone } = await import("@/lib/timezone-utils");
        const coachTimezone = await getUserTimezoneFromDB(targetCoachId);
        
        const oldLessonDateFormatted = formatDateInTimezone(oldLesson.date, coachTimezone, "MMM d, yyyy");
        const oldLessonTimeFormatted = formatTimeInTimezone(oldLesson.date, coachTimezone, "h:mm a");
        const newDateFormatted = formatDateInTimezone(utcDateTime, coachTimezone, "MMM d, yyyy");
        const newTimeFormatted = formatTimeInTimezone(utcDateTime, coachTimezone, "h:mm a");

        await emailService.sendScheduleExchangeRequest(
          coachUser.email,
          coachUser.name || "Coach",
          client.name,
          oldLessonDateFormatted,
          oldLessonTimeFormatted,
          newDateFormatted,
          newTimeFormatted,
          input.reason,
          targetCoachId
        ).catch((error) => {
          console.error("Failed to send exchange request email to coach:", error);
          // Don't throw - email failure shouldn't break the exchange
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

      // Validate video URL
      try {
        new URL(input.videoUrl);
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid video URL. Please upload the video again.",
        });
      }

      // Validate drillId if provided - ensure it exists and belongs to a valid program
      let validDrillId: string | null = null;
      if (input.drillId && input.drillId.trim() !== "") {
        const drill = await db.programDrill.findUnique({
          where: { id: input.drillId },
          select: { id: true },
        });

        if (!drill) {
          // Drill doesn't exist - log warning but allow submission without drillId
          console.warn(`Drill ID ${input.drillId} not found, submitting video without drill reference`);
          validDrillId = null;
        } else {
          validDrillId = input.drillId;
        }
      }

      // Create video submission with error handling
      let videoSubmission;
      try {
        videoSubmission = await db.clientVideoSubmission.create({
          data: {
            clientId: client.id,
            coachId: client.coachId,
            title: input.title,
            description: input.description || null,
            comment: input.comment || null,
            videoUrl: input.videoUrl,
            thumbnail: input.thumbnail || null,
            drillId: validDrillId,
            isPublic: input.isPublic ?? false,
          },
        });
      } catch (error: any) {
        console.error("Error creating video submission:", {
          error: error.message,
          code: error.code,
          meta: error.meta,
          clientId: client.id,
          coachId: client.coachId,
          drillId: validDrillId,
          videoUrl: input.videoUrl,
        });
        
        // Provide more specific error messages
        if (error.code === "P2002") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A video submission with this information already exists. Please try again.",
          });
        }
        
        // Handle foreign key constraint violations
        if (error.code === "P2003") {
          const field = error.meta?.field_name || "unknown field";
          if (field.includes("drillId") || field.includes("drill")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "The program drill reference is invalid. The video has been submitted without the drill reference.",
            });
          }
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid reference: ${field}. Please try again.`,
          });
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to submit video: ${
            error.message || "Please try again or contact support if the problem persists."
          }`,
        });
      }

      // Create or find conversation between client and coach
      let conversation = await db.conversation.findFirst({
        where: {
          coachId: client.coachId,
          clientId: user.id,
        },
      });

      if (!conversation) {
        try {
          conversation = await db.conversation.create({
            data: {
              coachId: client.coachId,
              clientId: user.id,
              type: "COACH_CLIENT",
            },
          });
        } catch (error: any) {
          console.error("Error creating conversation:", error);
          // Don't fail the entire request if conversation creation fails
          // The video submission was successful
        }
      }

      // Create message in conversation (only if conversation exists)
      if (conversation) {
        const messageContent = input.comment
          ? `📹 **Video Submission: ${input.title}**\n\n${input.comment}`
          : `📹 **Video Submission: ${input.title}**`;

        try {
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
        } catch (error: any) {
          console.error("Error creating message:", error);
          // Don't fail the entire request if message creation fails
          // The video submission was successful
        }
      }

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
        let drillTitle = "Unknown Exercise";
        let programName = "";
        let exerciseName = "";


        // First, try to find if it's a real ProgramDrill ID
        const existingDrill = await db.programDrill.findUnique({
          where: { id: input.drillId },
          include: {
            day: {
              include: {
                week: {
                  include: {
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

        if (existingDrill) {
          console.log(`✅ Found ProgramDrill: ${existingDrill.title}`);
          validDrillId = input.drillId;
          drillTitle = existingDrill.title;
          programName = existingDrill.day?.week?.program?.title || "";
        } else {
          // If it's a composite key, check if it's a routine exercise
          // Format could be: "drillId-routine-exerciseId" or "routineAssignmentId-exerciseId"
          if (input.drillId.includes("-routine-")) {
            // Format: "drillId-routine-exerciseId" (routine exercise within a program)
            const parts = input.drillId.split("-routine-");
            const programDrillId = parts[0];
            const exerciseId = parts[1];


            // Try to find the program drill and exercise
            const programDrill = await db.programDrill.findUnique({
              where: { id: programDrillId },
              include: {
                day: {
                  include: {
                    week: {
                      include: {
                        program: {
                          select: {
                            title: true,
                          },
                        },
                      },
                    },
                  },
                },
                routine: {
                  include: {
                    exercises: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            });

            if (programDrill) {
              console.log(
                `✅ Found program drill: ${
                  programDrill.title
                }, routine exercises: ${
                  programDrill.routine?.exercises?.length || 0
                }`
              );
              if (programDrill.routine?.exercises) {
                const exercise = programDrill.routine.exercises.find(
                  ex => ex.id === exerciseId
                );
                if (exercise) {
                  programName = programDrill.day?.week?.program?.title || "";
                  exerciseName = exercise.title;
                  drillTitle = exerciseName;
                } else {
                }
              } else {
              }
            } else {
            }
          } else if (
            input.drillId.includes("-") &&
            !input.drillId.includes("-routine-")
          ) {
            // Format: "routineAssignmentId-exerciseId" (standalone routine exercise)
            // Split on first dash only, in case exerciseId has dashes (unlikely but safe)
            const firstDashIndex = input.drillId.indexOf("-");
            const routineAssignmentId = input.drillId.substring(
              0,
              firstDashIndex
            );
            const exerciseId = input.drillId.substring(firstDashIndex + 1);


            const routineAssignment = await db.routineAssignment.findUnique({
              where: { id: routineAssignmentId },
              include: {
                routine: {
                  select: {
                    name: true,
                    exercises: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            });

            if (routineAssignment) {
              console.log(
                `✅ Found routine assignment: ${
                  routineAssignment.routine?.name
                }, exercises: ${
                  routineAssignment.routine?.exercises?.length || 0
                }`
              );
              if (routineAssignment.routine?.exercises) {
                const exercise = routineAssignment.routine.exercises.find(
                  ex => ex.id === exerciseId
                );
                if (exercise) {
                  programName = routineAssignment.routine.name;
                  exerciseName = exercise.title;
                  drillTitle = exerciseName;
                } else {
                }
              } else {
              }
            } else {
            }
          } else {
            console.log(`❌ Drill ID format not recognized: ${input.drillId}`);

            // Fallback: Try to find the drill in the client's assigned programs
            const programAssignments = await db.programAssignment.findMany({
              where: {
                clientId: client.id,
                completedAt: null, // Only active assignments
              },
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
                                title: true,
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

            // Search through all program assignments for the drill
            for (const assignment of programAssignments) {
              for (const week of assignment.program.weeks) {
                for (const day of week.days) {
                  const foundDrill = day.drills.find(
                    d => d.id === input.drillId
                  );
                  if (foundDrill) {
                    drillTitle = foundDrill.title;
                    programName = assignment.program.title;
                    validDrillId = input.drillId; // Mark as valid since we found it
                    break;
                  }
                }
                if (drillTitle !== "Unknown Exercise") break;
              }
              if (drillTitle !== "Unknown Exercise") break;
            }
          }

          // If it's a composite key (routineAssignmentId-exerciseId),
          // we'll set drillId to null since it's not a real ProgramDrill
        }

        // Create human-readable title for the video submission
        const submissionTitle = programName
          ? `Comment for "${drillTitle}" in ${programName}`
          : `Comment for "${drillTitle}"`;

        const newVideoSubmission = await db.clientVideoSubmission.create({
          data: {
            clientId: client.id,
            coachId: client.coachId!,
            title: submissionTitle,
            description: "Client feedback and comments",
            comment: input.comment,
            videoUrl: "", // Empty since no video was uploaded
            drillId: validDrillId, // Will be null for routine exercises
            isPublic: false,
          },
        });

        // Create message in conversation with human-readable names
        const messageContent = programName
          ? `💬 **Exercise Feedback: "${drillTitle}"**\n📋 Program: ${programName}\n\n${input.comment}`
          : `💬 **Exercise Feedback: "${drillTitle}"**\n\n${input.comment}`;

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

        // Create notification for coach (only if coach exists) with human-readable names
        if (client.coachId) {
          const notificationMessage = programName
            ? `Client commented on "${drillTitle}" in ${programName}: "${input.comment.substring(
                0,
                100
              )}${input.comment.length > 100 ? "..." : ""}"`
            : `Client commented on "${drillTitle}": "${input.comment.substring(
                0,
                100
              )}${input.comment.length > 100 ? "..." : ""}"`;

          await db.notification.create({
            data: {
              userId: client.coachId,
              type: "MESSAGE",
              title: `New client comment from ${client.name}`,
              message: notificationMessage,
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
        coach: {
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
          coachId: true,
          status: true,
          description: true,
        },
        orderBy: {
          date: "asc",
        },
      });

      return events;
    }),
});
