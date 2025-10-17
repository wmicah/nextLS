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
import {
  validateAndCleanProgramData,
  logProgramCreation,
} from "@/lib/program-debug-utils";

/**
 * Programs Router
 */
export const programsRouter = router({
  // Get program categories with counts
  getCategories: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Get all programs for this coach and group by level (category)
    const programs = await db.program.findMany({
      where: { coachId: user.id },
      select: { level: true },
    });

    // Count occurrences of each category
    const categoryCounts = programs.reduce(
      (acc: { [key: string]: number }, program) => {
        const category = program.level;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {}
    );

    // Convert to array format with name and count
    return Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
    }));
  }),

  // Get all programs for the coach
  list: publicProcedure.query(async () => {
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
        message: "Only coaches can view programs",
      });
    }

    // Check if coach is in an organization
    const coachOrganization = await db.coachOrganization.findFirst({
      where: {
        coachId: user.id,
        isActive: true,
      },
    });

    // Build where clause - include own programs and organization-shared programs
    let whereClause: any = {
      OR: [
        { coachId: user.id }, // Own programs
      ],
    };

    // If in an organization, also include shared programs
    if (coachOrganization?.organizationId) {
      whereClause.OR.push({
        organizationId: coachOrganization.organizationId,
        sharedWithOrg: true,
      });
    }

    // Get all programs created by this coach and shared with organization
    const programs = await db.program.findMany({
      where: whereClause,
      include: {
        // Include client assignments to count active clients
        assignments: {
          where: {
            // Only count active assignments (not completed)
            completedAt: null,
          },
        },
        // Include weeks with days and drills for detailed structure
        weeks: {
          include: {
            days: {
              include: {
                drills: true,
              },
              orderBy: {
                dayNumber: "asc",
              },
            },
          },
          orderBy: {
            weekNumber: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to include active client count and all necessary fields
    return programs.map(program => ({
      id: program.id,
      title: program.title,
      description: program.description,
      level: program.level,
      duration: program.duration,
      status: program.status,
      activeClientCount: program.assignments.length,
      totalWeeks: program.weeks.length,
      weeks: program.weeks,
      assignments: program.assignments,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    }));
  }),

  // Create a new program
  create: publicProcedure
    .input(
      z.object({
        title: z
          .string()
          .min(1, "Program title is required")
          .max(60, "Title must be 60 characters or less"),
        description: z.string().optional(),
        level: z.enum([
          "Drive",
          "Whip",
          "Separation",
          "Stability",
          "Extension",
        ]),
        duration: z.number().min(1, "Duration must be at least 1 week"),
        weeks: z.array(
          z.object({
            weekNumber: z.number(),
            title: z.string().min(1, "Week title is required"),
            description: z.string().optional(),
            days: z.array(
              z.object({
                dayNumber: z.number(),
                title: z.string().min(1, "Day title is required"),
                description: z.string().optional(),
                drills: z.array(
                  z.object({
                    order: z.number(),
                    title: z.string().min(1, "Drill title is required"),
                    description: z.string().optional(),
                    duration: z.string().optional(),
                    videoUrl: z.string().optional(),
                    notes: z.string().optional(),
                    sets: z.number().optional(),
                    reps: z.number().optional(),
                    tempo: z.string().optional(),
                    supersetId: z.string().optional(),
                    supersetOrder: z.number().optional(),
                    // Coach Instructions
                    coachInstructions: z
                      .object({
                        whatToDo: z.string().optional(),
                        howToDoIt: z.string().optional(),
                        keyPoints: z.array(z.string()).optional(),
                        commonMistakes: z.array(z.string()).optional(),
                        equipment: z.string().optional(),
                      })
                      .optional(),
                  })
                ),
              })
            ),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      console.log("=== PROGRAM CREATE MUTATION STARTED ===");

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
          message: "Only coaches can create programs",
        });
      }

      // Debug and validate the input data
      const payloadCheck = logProgramCreation(input, "program-create");

      if (payloadCheck.isTooLarge) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message:
            "Program data is too large. Please reduce the number of weeks, days, or drills.",
        });
      }

      // Validate and clean the data
      const validation = validateAndCleanProgramData(input);
      if (!validation.success) {
        console.error("Program validation failed:", validation.errors);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Validation failed: ${
            validation.errors?.map(e => e.message).join(", ") ||
            "Unknown validation error"
          }`,
        });
      }

      const cleanedData = validation.data;

      if (!cleanedData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process program data",
        });
      }

      try {
        // Create the program with all its structure
        const program = await db.program.create({
          data: {
            title: cleanedData.title,
            description: cleanedData.description || "",
            sport: "General", // Default value since sport field is removed from UI
            level: cleanedData.level,
            duration: cleanedData.duration,
            coachId: ensureUserId(user.id),
            weeks: {
              create: cleanedData.weeks.map(week => ({
                weekNumber: week.weekNumber,
                title: week.title,
                description: week.description || "",
                days: {
                  create: week.days.map(day => {
                    // Check if this is a rest day (has no drills)
                    const isRestDay = day.drills.length === 0;

                    return {
                      dayNumber: day.dayNumber,
                      title: day.title,
                      description: day.description || "",
                      isRestDay: isRestDay,
                      drills: {
                        create: day.drills.map(drill => {
                          // Debug logging for coach instructions in create mutation
                          if (
                            drill.title === "RPR Spiral Lines" ||
                            drill.title.includes("RPR")
                          ) {
                            console.log(
                              "🔍 CREATE MUTATION - Processing drill:",
                              drill.title
                            );
                            console.log("Drill object:", drill);
                            console.log(
                              "Coach instructions:",
                              (drill as any).coachInstructions
                            );
                          }

                          return {
                            order: drill.order,
                            title: drill.title,
                            description: drill.description || "",
                            duration: drill.duration || "",
                            videoUrl: drill.videoUrl || "",
                            notes: drill.notes || "",
                            sets: drill.sets || null, // Optional field, set to null if not provided
                            reps: drill.reps || null, // Optional field, set to null if not provided
                            tempo: drill.tempo || null, // Optional field, set to null if not provided
                            supersetId: drill.supersetId || null,
                            supersetOrder: drill.supersetOrder || null,
                            // Coach Instructions
                            coachInstructionsWhatToDo: (drill as any)
                              .coachInstructions?.whatToDo,
                            coachInstructionsHowToDoIt: (drill as any)
                              .coachInstructions?.howToDoIt,
                            coachInstructionsKeyPoints:
                              (drill as any).coachInstructions?.keyPoints || [],
                            coachInstructionsCommonMistakes:
                              (drill as any).coachInstructions
                                ?.commonMistakes || [],
                            coachInstructionsEquipment: (drill as any)
                              .coachInstructions?.equipment,
                          };
                        }),
                      },
                    };
                  }),
                },
              })),
            },
          },
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

        console.log("=== PROGRAM CREATE COMPLETED SUCCESSFULLY ===");
        return program;
      } catch (error) {
        console.error("=== PROGRAM CREATE FAILED ===");
        console.error("Error details:", error);

        // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes("timeout")) {
            throw new TRPCError({
              code: "TIMEOUT",
              message:
                "Program creation timed out. Please try with fewer weeks or drills.",
            });
          }
          if (
            error.message.includes("too large") ||
            error.message.includes("size")
          ) {
            throw new TRPCError({
              code: "PAYLOAD_TOO_LARGE",
              message: "Program data is too large. Please reduce complexity.",
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to create program. Please try again with simpler data.",
        });
      }
    }),

  // Get a specific program
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
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
          message: "Only coaches can view programs",
        });
      }

      // Get the program
      const program = await db.program.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id), // Ensure coach owns this program
        },
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
                    },
                    orderBy: {
                      order: "asc",
                    },
                  },
                },
                orderBy: {
                  dayNumber: "asc",
                },
              },
            },
            orderBy: {
              weekNumber: "asc",
            },
          },
        },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      return program;
    }),

  // Update a program
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z
          .string()
          .max(60, "Title must be 60 characters or less")
          .optional(),
        description: z.string().optional(),
        weeks: z
          .array(
            z.object({
              weekNumber: z.number(),
              title: z.string(),
              description: z.string().optional(),
              days: z.array(
                z.object({
                  dayNumber: z.number(),
                  title: z.string(),
                  description: z.string().optional(),
                  drills: z.array(
                    z.object({
                      id: z.string(),
                      title: z.string(),
                      description: z.string().optional(),
                      duration: z.string().optional(),
                      videoUrl: z.string().optional(),
                      notes: z.string().optional(),
                      type: z.string().optional(),
                      sets: z.number().optional(),
                      reps: z.number().optional(),
                      tempo: z.string().optional(),
                      videoId: z.string().optional(),
                      videoTitle: z.string().optional(),
                      videoThumbnail: z.string().optional(),
                      routineId: z.string().optional(),
                      supersetId: z.string().optional(),
                      supersetOrder: z.number().optional(),
                      // Coach Instructions
                      coachInstructionsWhatToDo: z
                        .string()
                        .nullable()
                        .optional(),
                      coachInstructionsHowToDoIt: z
                        .string()
                        .nullable()
                        .optional(),
                      coachInstructionsKeyPoints: z
                        .array(z.string())
                        .nullable()
                        .optional(),
                      coachInstructionsCommonMistakes: z
                        .array(z.string())
                        .nullable()
                        .optional(),
                      coachInstructionsEasier: z.string().nullable().optional(),
                      coachInstructionsHarder: z.string().nullable().optional(),
                      coachInstructionsEquipment: z
                        .string()
                        .nullable()
                        .optional(),
                      coachInstructionsSetup: z.string().nullable().optional(),
                    })
                  ),
                })
              ),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("=== PROGRAMS.UPDATE MUTATION CALLED ===");
      console.log("Input:", input);
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
          message: "Only coaches can update programs",
        });
      }

      // Start a transaction to update the program and its structure
      const result = await db.$transaction(async tx => {
        // Update the program basic info
        const program = await tx.program.update({
          where: {
            id: input.id,
            coachId: ensureUserId(user.id), // Ensure coach owns this program
          },
          data: {
            ...(input.title && { title: input.title }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
          },
        });

        // If weeks data is provided, update the program structure
        if (input.weeks) {
          // Delete existing weeks and recreate them
          await tx.programWeek.deleteMany({
            where: { programId: input.id },
          });

          // Create new weeks structure
          for (const week of input.weeks) {
            const newWeek = await tx.programWeek.create({
              data: {
                programId: input.id,
                weekNumber: week.weekNumber,
                title: week.title,
                description: week.description || "",
              },
            });

            // Create days for this week
            for (const day of week.days) {
              // Check if this is a rest day (has no drills)
              const isRestDay = day.drills.length === 0;

              const newDay = await tx.programDay.create({
                data: {
                  weekId: newWeek.id,
                  dayNumber: day.dayNumber,
                  title: day.title,
                  description: day.description || "",
                  isRestDay: isRestDay,
                },
              });

              // Create drills for this day
              for (
                let drillIndex = 0;
                drillIndex < day.drills.length;
                drillIndex++
              ) {
                const drill = day.drills[drillIndex];
                await tx.programDrill.create({
                  data: {
                    dayId: newDay.id,
                    order: drillIndex + 1, // Use proper order
                    title: drill.title,
                    description: drill.description || "",
                    duration: drill.duration || "",
                    videoUrl: drill.videoUrl || "",
                    notes: drill.notes || "",
                    sets: drill.sets,
                    reps: drill.reps,
                    tempo: drill.tempo || "",
                    type: drill.type || "exercise",
                    videoId: drill.videoId,
                    videoTitle: drill.videoTitle,
                    videoThumbnail: drill.videoThumbnail,
                    routineId: drill.routineId,
                    supersetId: drill.supersetId,
                    supersetOrder: drill.supersetOrder,
                    // Coach Instructions
                    coachInstructionsWhatToDo: (drill as any).coachInstructions
                      ?.whatToDo,
                    coachInstructionsHowToDoIt: (drill as any).coachInstructions
                      ?.howToDoIt,
                    coachInstructionsKeyPoints:
                      (drill as any).coachInstructions?.keyPoints || [],
                    coachInstructionsCommonMistakes:
                      (drill as any).coachInstructions?.commonMistakes || [],
                    coachInstructionsEquipment: (drill as any).coachInstructions
                      ?.equipment,
                  },
                });
              }
            }
          }
        }

        return program;
      });

      console.log("=== PROGRAMS.UPDATE COMPLETED ===");
      console.log("Returning result:", result);
      return result;
    }),

  // Duplicate a program
  duplicate: publicProcedure
    .input(z.object({ id: z.string() }))
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
          message: "Only coaches can duplicate programs",
        });
      }

      // Get the original program
      const originalProgram = await db.program.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id),
        },
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

      if (!originalProgram) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Create the duplicated program
      const duplicatedProgram = await db.program.create({
        data: {
          title: `${originalProgram.title} (Copy)`,
          description: originalProgram.description,
          sport: originalProgram.sport,
          level: originalProgram.level,
          duration: originalProgram.duration,
          coachId: ensureUserId(user.id),
        },
      });

      // Duplicate weeks and days
      for (const week of originalProgram.weeks) {
        const duplicatedWeek = await db.programWeek.create({
          data: {
            weekNumber: week.weekNumber,
            title: week.title,
            description: week.description,
            programId: duplicatedProgram.id,
          },
        });

        // Duplicate days
        for (const day of week.days) {
          const duplicatedDay = await db.programDay.create({
            data: {
              dayNumber: day.dayNumber,
              title: day.title,
              description: day.description,
              weekId: duplicatedWeek.id,
            },
          });

          // Duplicate drills
          for (const drill of day.drills) {
            await db.programDrill.create({
              data: {
                order: drill.order,
                title: drill.title,
                description: drill.description,
                duration: drill.duration,
                videoUrl: drill.videoUrl,
                notes: drill.notes,
                dayId: duplicatedDay.id,
              },
            });
          }
        }
      }

      return duplicatedProgram;
    }),

  // Delete a program
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
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
          message: "Only coaches can delete programs",
        });
      }

      // Check if program exists and belongs to coach
      const program = await db.program.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id),
        },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Program not found or you don't have permission to delete it",
        });
      }

      // Delete the program (cascade will handle related records)
      await db.program.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),

  // Get active client count for a program
  getActiveClientCount: publicProcedure
    .input(z.object({ programId: z.string() }))
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
          message: "Only coaches can view program statistics",
        });
      }

      // Count active client assignments for this program (excluding archived clients)
      const count = await db.programAssignment.count({
        where: {
          programId: input.programId,
          completedAt: null, // Not completed = active
          client: {
            archived: false, // Exclude archived clients
          },
        },
      });

      return count;
    }),

  // Update program week (for autosave functionality)
  updateWeek: publicProcedure
    .input(
      z.object({
        programId: z.string(),
        weekNumber: z.number(),
        days: z.array(
          z.object({
            dayNumber: z.number(),
            title: z.string(),
            description: z.string().optional(),
            isRestDay: z.boolean().optional(),
            warmupTitle: z.string().optional(),
            warmupDescription: z.string().optional(),
            drills: z.array(
              z.object({
                id: z.string().optional(), // Optional for new drills
                order: z.number(),
                title: z.string(),
                description: z.string().optional(),
                duration: z.string().optional(),
                videoUrl: z.string().optional(),
                notes: z.string().optional(),
                sets: z.number().optional(),
                reps: z.number().optional(),
                tempo: z.string().optional(),
                supersetId: z.string().optional(),
                supersetOrder: z.number().optional(),
              })
            ),
          })
        ),
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
          message: "Only coaches can update programs",
        });
      }

      // Verify program exists and belongs to coach
      const program = await db.program.findFirst({
        where: {
          id: input.programId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Find or create the week
      let week = await db.programWeek.findFirst({
        where: {
          programId: input.programId,
          weekNumber: input.weekNumber,
        },
      });

      if (!week) {
        week = await db.programWeek.create({
          data: {
            programId: input.programId,
            weekNumber: input.weekNumber,
            title: `Week ${input.weekNumber}`,
          },
        });
      }

      // Update each day
      for (const dayData of input.days) {
        // Find or create the day
        let day = await db.programDay.findFirst({
          where: {
            weekId: week.id,
            dayNumber: dayData.dayNumber,
          },
        });

        if (!day) {
          day = await db.programDay.create({
            data: {
              weekId: week.id,
              dayNumber: dayData.dayNumber,
              title: dayData.title,
              description: dayData.description || "",
              isRestDay: dayData.isRestDay || false,
              warmupTitle: dayData.warmupTitle || "",
              warmupDescription: dayData.warmupDescription || "",
            },
          });
        } else {
          // Update existing day
          await db.programDay.update({
            where: { id: day.id },
            data: {
              title: dayData.title,
              description: dayData.description || "",
              isRestDay: dayData.isRestDay || false,
              warmupTitle: dayData.warmupTitle || "",
              warmupDescription: dayData.warmupDescription || "",
            },
          });
        }

        // Clear existing drills and recreate them
        await db.programDrill.deleteMany({
          where: { dayId: day.id },
        });

        // Create new drills
        for (const drillData of dayData.drills) {
          await db.programDrill.create({
            data: {
              dayId: day.id,
              order: drillData.order,
              title: drillData.title,
              description: drillData.description || "",
              duration: drillData.duration || "",
              videoUrl: drillData.videoUrl || "",
              notes: drillData.notes || "",
              sets: drillData.sets || 0,
              reps: drillData.reps || 0,
              tempo: drillData.tempo || "",
              supersetId: drillData.supersetId || null,
              supersetOrder: drillData.supersetOrder || null,
            },
          });
        }
      }

      return { success: true };
    }),

  // Add exercise to a day
  addExercise: publicProcedure
    .input(
      z.object({
        programId: z.string(),
        weekNumber: z.number(),
        dayNumber: z.number(),
        title: z.string(),
        description: z.string().optional(),
        duration: z.string().optional(),
        videoUrl: z.string().optional(),
        notes: z.string().optional(),
        sets: z.number().optional(),
        reps: z.number().optional(),
        tempo: z.string().optional(),
        // Coach Instructions
        coachInstructions: z
          .object({
            whatToDo: z.string().optional(),
            howToDoIt: z.string().optional(),
            keyPoints: z.array(z.string()).optional(),
            commonMistakes: z.array(z.string()).optional(),
            modifications: z
              .object({
                easier: z.string().optional(),
                harder: z.string().optional(),
              })
              .optional(),
            equipment: z.string().optional(),
            setup: z.string().optional(),
          })
          .optional(),
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
          message: "Only coaches can add exercises",
        });
      }

      // Verify program exists and belongs to coach
      const program = await db.program.findFirst({
        where: {
          id: input.programId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Find the week
      let week = await db.programWeek.findFirst({
        where: {
          programId: input.programId,
          weekNumber: input.weekNumber,
        },
      });

      if (!week) {
        // Create the week if it doesn't exist
        week = await db.programWeek.create({
          data: {
            programId: input.programId,
            weekNumber: input.weekNumber,
            title: `Week ${input.weekNumber}`,
          },
        });
      }

      // Find the day
      let day = await db.programDay.findFirst({
        where: {
          weekId: week.id,
          dayNumber: input.dayNumber,
        },
      });

      if (!day) {
        // Create the day if it doesn't exist
        day = await db.programDay.create({
          data: {
            weekId: week.id,
            dayNumber: input.dayNumber,
            title: `Day ${input.dayNumber}`,
          },
        });
      }

      // Get the next order number
      const maxOrder = await db.programDrill.aggregate({
        where: { dayId: day.id },
        _max: { order: true },
      });

      const newOrder = (maxOrder._max.order || 0) + 1;

      // Create the exercise
      const exercise = await db.programDrill.create({
        data: {
          dayId: day.id,
          order: newOrder,
          title: input.title,
          description: input.description,
          duration: input.duration,
          videoUrl: input.videoUrl,
          notes: input.notes,
          sets: input.sets,
          reps: input.reps,
          tempo: input.tempo,
          // Coach Instructions
          coachInstructionsWhatToDo: input.coachInstructions?.whatToDo,
          coachInstructionsHowToDoIt: input.coachInstructions?.howToDoIt,
          coachInstructionsKeyPoints: input.coachInstructions?.keyPoints || [],
          coachInstructionsCommonMistakes:
            input.coachInstructions?.commonMistakes || [],
          coachInstructionsEasier:
            input.coachInstructions?.modifications?.easier,
          coachInstructionsHarder:
            input.coachInstructions?.modifications?.harder,
          coachInstructionsEquipment: input.coachInstructions?.equipment,
          coachInstructionsSetup: input.coachInstructions?.setup,
        },
      });

      return exercise;
    }),

  // Delete exercise
  deleteExercise: publicProcedure
    .input(z.object({ exerciseId: z.string() }))
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
          message: "Only coaches can delete exercises",
        });
      }

      // Get the exercise and verify ownership
      const exercise = await db.programDrill.findFirst({
        where: { id: input.exerciseId },
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

      if (!exercise || exercise.day.week.program.coachId !== user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Exercise not found or you don't have permission",
        });
      }

      // Delete the exercise
      await db.programDrill.delete({
        where: { id: input.exerciseId },
      });

      return { success: true };
    }),

  // Update exercise
  updateExercise: publicProcedure
    .input(
      z.object({
        exerciseId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        duration: z.string().optional(),
        notes: z.string().optional(),
        sets: z.number().optional(),
        reps: z.number().optional(),
        tempo: z.string().optional(),
        // Coach Instructions
        coachInstructions: z
          .object({
            whatToDo: z.string().optional(),
            howToDoIt: z.string().optional(),
            keyPoints: z.array(z.string()).optional(),
            commonMistakes: z.array(z.string()).optional(),
            equipment: z.string().optional(),
          })
          .optional(),
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
          message: "Only coaches can update exercises",
        });
      }

      // Get the exercise and verify ownership
      const exercise = await db.programDrill.findFirst({
        where: { id: input.exerciseId },
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

      if (!exercise || exercise.day.week.program.coachId !== user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Exercise not found or you don't have permission",
        });
      }

      // Update the exercise
      const updatedExercise = await db.programDrill.update({
        where: { id: input.exerciseId },
        data: {
          title: input.title,
          description: input.description,
          duration: input.duration,
          notes: input.notes,
          sets: input.sets,
          reps: input.reps,
          tempo: input.tempo,
          // Coach Instructions
          coachInstructionsWhatToDo: input.coachInstructions?.whatToDo,
          coachInstructionsHowToDoIt: input.coachInstructions?.howToDoIt,
          coachInstructionsKeyPoints: input.coachInstructions?.keyPoints || [],
          coachInstructionsCommonMistakes:
            input.coachInstructions?.commonMistakes || [],
          coachInstructionsEquipment: input.coachInstructions?.equipment,
        },
      });

      return updatedExercise;
    }),

  // Toggle rest day
  toggleRestDay: publicProcedure
    .input(
      z.object({
        programId: z.string(),
        weekNumber: z.number(),
        dayNumber: z.number(),
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
          message: "Only coaches can modify programs",
        });
      }

      // Verify program exists and belongs to coach
      const program = await db.program.findFirst({
        where: {
          id: input.programId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Find the week
      let week = await db.programWeek.findFirst({
        where: {
          programId: input.programId,
          weekNumber: input.weekNumber,
        },
      });

      if (!week) {
        // Create the week if it doesn't exist
        week = await db.programWeek.create({
          data: {
            programId: input.programId,
            weekNumber: input.weekNumber,
            title: `Week ${input.weekNumber}`,
          },
        });
      }

      // Find the day
      let day = await db.programDay.findFirst({
        where: {
          weekId: week.id,
          dayNumber: input.dayNumber,
        },
      });

      if (!day) {
        // Create the day if it doesn't exist
        day = await db.programDay.create({
          data: {
            weekId: week.id,
            dayNumber: input.dayNumber,
            title: `Day ${input.dayNumber}`,
            isRestDay: true, // Set as rest day when creating
          },
        });
      } else {
        // Toggle the rest day status
        day = await db.programDay.update({
          where: { id: day.id },
          data: { isRestDay: !day.isRestDay },
        });
      }

      return day;
    }),

  // Create week
  createWeek: publicProcedure
    .input(
      z.object({
        programId: z.string(),
        weekNumber: z.number(),
        title: z.string(),
        description: z.string().optional(),
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
          message: "Only coaches can create weeks",
        });
      }

      // Verify program exists and belongs to coach
      const program = await db.program.findFirst({
        where: {
          id: input.programId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Create the week
      const week = await db.programWeek.create({
        data: {
          programId: input.programId,
          weekNumber: input.weekNumber,
          title: input.title,
          description: input.description,
        },
      });

      return week;
    }),

  // Create day
  createDay: publicProcedure
    .input(
      z.object({
        programId: z.string(),
        weekNumber: z.number(),
        dayNumber: z.number(),
        title: z.string(),
        description: z.string().optional(),
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
          message: "Only coaches can create days",
        });
      }

      // Verify program exists and belongs to coach
      const program = await db.program.findFirst({
        where: {
          id: input.programId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Find or create the week
      let week = await db.programWeek.findFirst({
        where: {
          programId: input.programId,
          weekNumber: input.weekNumber,
        },
      });

      if (!week) {
        week = await db.programWeek.create({
          data: {
            programId: input.programId,
            weekNumber: input.weekNumber,
            title: `Week ${input.weekNumber}`,
          },
        });
      }

      // Create the day
      const day = await db.programDay.create({
        data: {
          weekId: week.id,
          dayNumber: input.dayNumber,
          title: input.title,
          description: input.description,
        },
      });

      return day;
    }),

  // Assign program to clients
  assignToClients: publicProcedure
    .input(
      z.object({
        programId: z.string(),
        clientIds: z.array(z.string()),
        startDate: z.string(),
        repetitions: z.number().min(1).default(1), // Allow unlimited repetitions
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
          message: "Only coaches can assign programs",
        });
      }

      // Check if coach is in an organization
      const coachOrganization = await db.coachOrganization.findFirst({
        where: {
          coachId: ensureUserId(user.id),
          isActive: true,
        },
      });

      // Build where clause for program - include own programs and organization-shared programs
      let programWhereClause: any = {
        id: input.programId,
      };

      if (coachOrganization?.organizationId) {
        programWhereClause.OR = [
          { coachId: ensureUserId(user.id) },
          {
            organizationId: coachOrganization.organizationId,
            sharedWithOrg: true,
          },
        ];
      } else {
        programWhereClause.coachId = ensureUserId(user.id);
      }

      // Verify program exists and is accessible
      const program = await db.program.findFirst({
        where: programWhereClause,
        include: {
          weeks: {
            include: {
              days: {
                orderBy: { dayNumber: "asc" },
              },
            },
            orderBy: { weekNumber: "asc" },
          },
        },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found or not accessible",
        });
      }

      // Build where clause for clients
      let clientWhereClause: any = {
        id: { in: input.clientIds },
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
        clientWhereClause.coachId = { in: orgCoachIds };
      } else {
        // Not in an organization, only allow access to own clients
        clientWhereClause.coachId = ensureUserId(user.id);
      }

      // Verify all clients are accessible
      const clients = await db.client.findMany({
        where: clientWhereClause,
        include: {
          programAssignments: {
            include: {
              program: {
                include: {
                  weeks: {
                    include: {
                      days: {
                        orderBy: { dayNumber: "asc" },
                      },
                    },
                    orderBy: { weekNumber: "asc" },
                  },
                },
              },
            },
          },
        },
      });

      if (clients.length !== input.clientIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some clients not found or not accessible",
        });
      }

      // Create program assignments for each client
      const assignments = [];

      for (const client of clients) {
        // Parse the date string and create local date, then convert to UTC properly
        const [year, month, day] = input.startDate.split("-").map(Number);
        const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);

        // Use the same timezone approach as lessons - convert local to UTC
        const timeZone = "America/New_York"; // Default timezone
        const startDate = fromZonedTime(localDate, timeZone);

        // Check for existing assignments for this program and client
        const existingAssignments = await db.programAssignment.findMany({
          where: {
            programId: input.programId,
            clientId: client.id,
          },
          orderBy: {
            currentCycle: "desc",
          },
        });

        // Find the next available cycle number
        const maxCycle =
          existingAssignments.length > 0
            ? Math.max(...existingAssignments.map(a => a.currentCycle))
            : 0;

        // Create the assignments (one for each repetition)
        for (let cycle = 1; cycle <= input.repetitions; cycle++) {
          const cycleNumber = maxCycle + cycle;
          const cycleStartDate = new Date(
            startDate.getTime() +
              (cycle - 1) * program.duration * 7 * 24 * 60 * 60 * 1000
          );

          const assignment = await db.programAssignment.create({
            data: {
              programId: input.programId,
              clientId: client.id,
              startDate: cycleStartDate,
              repetitions: input.repetitions,
              currentCycle: cycleNumber,
            },
          });
          assignments.push(assignment);
        }
      }

      return assignments;
    }),

  // Unassign program from clients
  unassignFromClients: publicProcedure
    .input(
      z.object({
        programId: z.string(),
        clientIds: z.array(z.string()),
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
          message: "Only coaches can unassign programs",
        });
      }

      // Verify program exists and belongs to coach
      const program = await db.program.findFirst({
        where: {
          id: input.programId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Delete assignments
      const result = await db.programAssignment.deleteMany({
        where: {
          programId: input.programId,
          clientId: { in: input.clientIds },
        },
      });

      return { deletedCount: result.count };
    }),

  // Unassign specific program assignment (by assignment ID)
  unassignSpecificProgram: publicProcedure
    .input(
      z.object({
        assignmentId: z.string(),
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
          message: "Only coaches can unassign programs",
        });
      }

      // Verify the assignment exists and belongs to the coach
      const assignment = await db.programAssignment.findFirst({
        where: {
          id: input.assignmentId,
          program: {
            coachId: ensureUserId(user.id),
          },
        },
        include: {
          program: true,
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program assignment not found",
        });
      }

      // Delete only this specific assignment
      const result = await db.programAssignment.delete({
        where: {
          id: input.assignmentId,
        },
      });

      return {
        success: true,
        unassignedCount: 1,
        assignment,
      };
    }),

  // Unassign multiple program assignments (by assignment IDs)
  unassignMultiplePrograms: publicProcedure
    .input(
      z.object({
        assignmentIds: z.array(z.string()),
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
          message: "Only coaches can unassign programs",
        });
      }

      // Delete multiple assignments
      const result = await db.programAssignment.deleteMany({
        where: {
          id: { in: input.assignmentIds },
        },
      });

      return { deletedCount: result.count };
    }),

  // Update assignment progress
  updateAssignmentProgress: publicProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        progress: z.number().min(0).max(100),
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
          message: "Only coaches can update progress",
        });
      }

      // Verify assignment exists and belongs to coach's program
      const assignment = await db.programAssignment.findFirst({
        where: {
          id: input.assignmentId,
          program: {
            coachId: ensureUserId(user.id),
          },
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }

      // Update progress
      const updatedAssignment = await db.programAssignment.update({
        where: { id: input.assignmentId },
        data: {
          progress: input.progress,
          completedAt: input.progress === 100 ? new Date() : null,
        },
        include: {
          client: true,
          program: true,
        },
      });

      return updatedAssignment;
    }),

  // Get all assignments for a program
  getProgramAssignments: publicProcedure
    .input(z.object({ programId: z.string() }))
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
          message: "Only coaches can view program assignments",
        });
      }

      // Verify program exists and belongs to coach
      const program = await db.program.findFirst({
        where: {
          id: input.programId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Get all assignments for this program (excluding archived clients)
      const assignments = await db.programAssignment.findMany({
        where: {
          programId: input.programId,
          client: {
            archived: false, // Exclude archived clients
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
      });

      return assignments;
    }),

  // Delete week
  deleteWeek: publicProcedure
    .input(
      z.object({
        programId: z.string(),
        weekNumber: z.number(),
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
          message: "Only coaches can delete weeks",
        });
      }

      // Verify program exists and belongs to coach
      const program = await db.program.findFirst({
        where: {
          id: input.programId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Find the week
      const week = await db.programWeek.findFirst({
        where: {
          programId: input.programId,
          weekNumber: input.weekNumber,
        },
      });

      if (!week) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Week not found",
        });
      }

      // Delete the week (this will cascade delete all days and exercises)
      await db.programWeek.delete({
        where: { id: week.id },
      });

      return { success: true };
    }),
});
