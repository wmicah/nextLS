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
 * Routines Router
 */
export const routinesRouter = router({
  // Get all routines for the coach
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
        message: "Only coaches can view routines",
      });
    }

    // Check if coach is in an organization
    const coachOrganization = await db.coachOrganization.findFirst({
      where: {
        coachId: user.id,
        isActive: true,
      },
    });

    // Build where clause - include own routines and organization-shared routines
    let whereClause: any = {
      OR: [
        { coachId: user.id }, // Own routines
      ],
    };

    // If in an organization, also include shared routines
    if (coachOrganization?.organizationId) {
      whereClause.OR.push({
        organizationId: coachOrganization.organizationId,
        sharedWithOrg: true,
      });
    }

    // Get all routines created by this coach and shared with organization
    const routines = await db.routine.findMany({
      where: whereClause,
      include: {
        exercises: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return routines;
  }),

  // Get a specific routine by ID
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      const routine = await db.routine.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id),
        },
        include: {
          exercises: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!routine) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Routine not found",
        });
      }

      return routine;
    }),

  // Create a new routine
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Routine name is required"),
        description: z.string().optional(),
        exercises: z.array(
          z.object({
            title: z.string().min(1, "Exercise title is required"),
            description: z.string().optional(),
            type: z.string().optional(),
            notes: z.string().optional(),
            sets: z.number().optional(),
            reps: z.number().optional(),
            tempo: z.string().optional(),
            duration: z.string().optional(),
            videoId: z.string().optional(),
            videoTitle: z.string().optional(),
            videoThumbnail: z.string().optional(),
            videoUrl: z.string().optional(),
            supersetId: z.string().optional(),
            supersetOrder: z.number().optional(),
            supersetDescription: z.string().optional(),
            supersetInstructions: z.string().optional(),
            supersetNotes: z.string().optional(),
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
          message: "Only coaches can create routines",
        });
      }

      // Create the routine with exercises
      const routine = await db.routine.create({
        data: {
          name: input.name,
          description: input.description,
          coachId: ensureUserId(user.id),
          exercises: {
            create: input.exercises.map((exercise, index) => ({
              order: index + 1,
              title: exercise.title,
              description: exercise.description,
              type: exercise.type,
              notes: exercise.notes,
              sets: exercise.sets,
              reps: exercise.reps,
              tempo: exercise.tempo,
              duration: exercise.duration,
              videoId: exercise.videoId,
              videoTitle: exercise.videoTitle,
              videoThumbnail: exercise.videoThumbnail,
              videoUrl: exercise.videoUrl,
              supersetId: exercise.supersetId,
              supersetOrder: exercise.supersetOrder,
              supersetDescription: exercise.supersetDescription,
              supersetInstructions: exercise.supersetInstructions,
              supersetNotes: exercise.supersetNotes,
            })),
          },
        },
        include: {
          exercises: {
            orderBy: { order: "asc" },
          },
        },
      });

      return routine;
    }),

  // Update a routine
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Routine name is required"),
        description: z.string().optional(),
        exercises: z.array(
          z.object({
            id: z.string().optional(), // For existing exercises
            title: z.string().min(1, "Exercise title is required"),
            description: z.string().optional(),
            type: z.string().optional(),
            notes: z.string().optional(),
            sets: z.number().optional(),
            reps: z.number().optional(),
            tempo: z.string().optional(),
            duration: z.string().optional(),
            videoId: z.string().optional(),
            videoTitle: z.string().optional(),
            videoThumbnail: z.string().optional(),
            videoUrl: z.string().optional(),
            supersetId: z.string().optional(),
            supersetOrder: z.number().optional(),
            supersetDescription: z.string().optional(),
            supersetInstructions: z.string().optional(),
            supersetNotes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify the routine exists and belongs to the coach
      const existingRoutine = await db.routine.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id),
        },
      });

      if (!existingRoutine) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Routine not found",
        });
      }

      // Update the routine and its exercises
      const routine = await db.routine.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          exercises: {
            deleteMany: {}, // Delete all existing exercises
            create: input.exercises.map((exercise, index) => ({
              order: index + 1,
              title: exercise.title,
              description: exercise.description,
              type: exercise.type,
              notes: exercise.notes,
              sets: exercise.sets,
              reps: exercise.reps,
              tempo: exercise.tempo,
              duration: exercise.duration,
              videoId: exercise.videoId,
              videoTitle: exercise.videoTitle,
              videoThumbnail: exercise.videoThumbnail,
              videoUrl: exercise.videoUrl,
              supersetId: exercise.supersetId,
              supersetOrder: exercise.supersetOrder,
              supersetDescription: exercise.supersetDescription,
              supersetInstructions: exercise.supersetInstructions,
              supersetNotes: exercise.supersetNotes,
            })),
          },
        },
        include: {
          exercises: {
            orderBy: { order: "asc" },
          },
        },
      });

      return routine;
    }),

  // Delete a routine
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify the routine exists and belongs to the coach
      const existingRoutine = await db.routine.findFirst({
        where: {
          id: input.id,
          coachId: ensureUserId(user.id),
        },
      });

      if (!existingRoutine) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Routine not found",
        });
      }

      // Check for program references before deletion
      const programDrillsUsingRoutine = await db.programDrill.findMany({
        where: {
          routineId: input.id,
        },
        include: {
          day: {
            include: {
              week: {
                include: {
                  program: {
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

      // If routine is used in programs, replace with rest day
      if (programDrillsUsingRoutine.length > 0) {
        // Get unique programs that will be affected
        const affectedPrograms = Array.from(
          new Set(
            programDrillsUsingRoutine.map(drill => drill.day.week.program.title)
          )
        );

        // Replace routine references with rest day
        await db.programDrill.updateMany({
          where: {
            routineId: input.id,
          },
          data: {
            title: "Rest Day",
            description: `Routine "${existingRoutine.name}" was deleted and replaced with a rest day`,
            type: "rest",
            routineId: null,
            sets: null,
            reps: null,
            tempo: null,
            duration: "Rest",
            notes: `Original routine: ${existingRoutine.name} (deleted)`,
          },
        });
      }

      // Delete the routine (this will cascade delete all exercises)
      await db.routine.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        affectedPrograms:
          programDrillsUsingRoutine.length > 0
            ? Array.from(
                new Set(
                  programDrillsUsingRoutine.map(
                    drill => drill.day.week.program.title
                  )
                )
              )
            : [],
        replacedDrills: programDrillsUsingRoutine.length,
      };
    }),

  // Assign routine to clients
  assign: publicProcedure
    .input(
      z.object({
        routineId: z.string(),
        clientIds: z.array(z.string()),
        startDate: z.string(),
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
          message: "Only coaches can assign routines",
        });
      }

      // Verify the routine exists and belongs to the coach
      const routine = await db.routine.findFirst({
        where: {
          id: input.routineId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!routine) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Routine not found",
        });
      }

      // Verify all clients belong to the coach
      const clients = await db.client.findMany({
        where: {
          id: { in: input.clientIds },
          coachId: ensureUserId(user.id),
          archived: false,
        },
      });

      if (clients.length !== input.clientIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more clients not found or not accessible",
        });
      }

      // Create routine assignments
      console.log("Server: Received startDate:", input.startDate);

      // Parse the date string and create local date, then convert to UTC properly
      const [year, month, day] = input.startDate.split("-").map(Number);
      const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);

      // Use the same timezone approach as lessons - convert local to UTC
      const timeZone = "America/New_York"; // Default timezone
      const startDate = fromZonedTime(localDate, timeZone);

      console.log("Server: Local date:", localDate);
      console.log("Server: UTC date:", startDate);
      console.log("Server: Local date string:", startDate.toLocaleDateString());

      const assignments = await Promise.all(
        input.clientIds.map(clientId =>
          db.routineAssignment.create({
            data: {
              routineId: input.routineId,
              clientId,
              assignedAt: new Date(),
              startDate: startDate,
            },
          })
        )
      );

      // Send email notifications to clients about routine assignment
      const emailService = CompleteEmailService.getInstance();
      for (const client of clients) {
        if (client.email) {
          try {
            await emailService.sendWorkoutAssigned(
              client.email,
              client.name || "Client",
              coach.name || "Coach",
              routine.name
            );
            console.log(`📧 Routine assignment email sent to ${client.email}`);
          } catch (error) {
            console.error(
              `Failed to send routine assignment email to ${client.email}:`,
              error
            );
          }
        }
      }

      return {
        success: true,
        assignedCount: assignments.length,
        assignments,
      };
    }),

  // Unassign routine from clients
  unassign: publicProcedure
    .input(
      z.object({
        routineId: z.string(),
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
          message: "Only coaches can unassign routines",
        });
      }

      // Verify the routine exists and belongs to the coach
      const routine = await db.routine.findFirst({
        where: {
          id: input.routineId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!routine) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Routine not found",
        });
      }

      // Delete routine assignments
      const result = await db.routineAssignment.deleteMany({
        where: {
          routineId: input.routineId,
          clientId: { in: input.clientIds },
        },
      });

      return {
        success: true,
        unassignedCount: result.count,
      };
    }),

  // Unassign specific routine assignment (by assignment ID)
  unassignSpecificRoutine: publicProcedure
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
          message: "Only coaches can unassign routines",
        });
      }

      // Verify the assignment exists and belongs to the coach
      const assignment = await db.routineAssignment.findFirst({
        where: {
          id: input.assignmentId,
          routine: {
            coachId: ensureUserId(user.id),
          },
        },
        include: {
          routine: true,
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Routine assignment not found",
        });
      }

      // Delete only this specific assignment
      const result = await db.routineAssignment.delete({
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

  // Get routine assignments
  getRoutineAssignments: publicProcedure
    .input(z.object({ routineId: z.string() }))
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
          message: "Only coaches can view routine assignments",
        });
      }

      // Verify the routine exists and belongs to the coach
      const routine = await db.routine.findFirst({
        where: {
          id: input.routineId,
          coachId: ensureUserId(user.id),
        },
      });

      if (!routine) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Routine not found",
        });
      }

      // Get routine assignments
      const assignments = await db.routineAssignment.findMany({
        where: {
          routineId: input.routineId,
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
          assignedAt: "desc",
        },
      });

      return assignments;
    }),

  // Get routine assignments for a specific client
  getClientRoutineAssignments: publicProcedure
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
          message: "Only coaches can view client routine assignments",
        });
      }

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
        archived: false,
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

      // Verify the client belongs to the coach or is in the same organization
      const client = await db.client.findFirst({
        where: whereClause,
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found or not accessible",
        });
      }

      // Get routine assignments for this client
      const assignments = await db.routineAssignment.findMany({
        where: {
          clientId: input.clientId,
        },
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
                  order: true,
                },
                orderBy: {
                  order: "asc",
                },
              },
            },
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
      });

      return assignments;
    }),

  // Get routine assignments for the current client (CLIENT ONLY)
  getMyRoutineAssignments: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Verify user is a CLIENT
    const client = await db.user.findFirst({
      where: { id: user.id, role: "CLIENT" },
    });

    if (!client) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can view their own routine assignments",
      });
    }

    // Get the client record
    const clientRecord = await db.client.findFirst({
      where: { userId: user.id },
    });

    if (!clientRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client profile not found",
      });
    }

    // Get routine assignments for the client
    const assignments = await db.routineAssignment.findMany({
      where: {
        clientId: clientRecord.id,
      },
      include: {
        routine: {
          include: {
            exercises: true,
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    return assignments;
  }),

  // Get routine assignments for calendar view
  getRoutineAssignmentsForCalendar: publicProcedure
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

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!coach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can view routine assignments",
        });
      }

      // Get routine assignments for the specified month/year
      const startDate = new Date(input.year, input.month, 1);
      const endDate = new Date(input.year, input.month + 1, 0);

      const assignments = await db.routineAssignment.findMany({
        where: {
          client: {
            coachId: ensureUserId(user.id),
            archived: false,
          },
          assignedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          routine: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          assignedAt: "asc",
        },
      });

      return assignments;
    }),

  downloadVideoFromMessage: publicProcedure
    .input(
      z.object({
        messageId: z.string(),
      })
    )
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
          message: "Only coaches can download videos from messages",
        });
      }

      // Get the message and verify it belongs to a conversation the coach is part of
      const message = await db.message.findFirst({
        where: {
          id: input.messageId,
          conversation: {
            OR: [
              { coachId: ensureUserId(user.id) },
              { clientId: ensureUserId(user.id) },
            ],
          },
          attachmentType: "video",
          attachmentUrl: { not: null },
        },
        include: {
          conversation: {
            include: {
              client: { select: { name: true } },
              coach: { select: { name: true } },
            },
          },
        },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found or doesn't contain a video",
        });
      }

      // Return the video URL and metadata for download
      return {
        videoUrl: message.attachmentUrl!,
        filename: message.attachmentName || `video_${message.id}.mp4`,
        title: message.attachmentName || "Video from message",
        messageId: message.id,
      };
    }),
});
