import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { publicProcedure, router } from "@/trpc/trpc";

export const notesRouter = router({
  // Get all notes for a specific client (coach view)
  getClientNotes: publicProcedure
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
          message: "Only coaches can view client notes",
        });
      }

      const notes = await db.clientNote.findMany({
        where: {
          clientId: input.clientId,
          coachId: user.id,
        },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
          tags: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return notes;
    }),

  // Get all notes for the current client (client view)
  getMyNotes: publicProcedure.query(async () => {
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

    const notes = await db.clientNote.findMany({
      where: { clientId: client.id },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: true,
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("getMyNotes - client.id:", client.id);
    console.log("getMyNotes - found notes:", notes.length);
    console.log("getMyNotes - notes:", notes);

    return notes;
  }),

  // Create a new note
  createNote: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
        title: z.string().optional(),
        content: z.string().min(1, "Content is required"),
        type: z
          .enum([
            "GENERAL",
            "PROGRESS",
            "FEEDBACK",
            "GOAL",
            "INJURY",
            "TECHNIQUE",
            "MOTIVATION",
            "SCHEDULE",
          ])
          .default("GENERAL"),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
        isPrivate: z.boolean().default(false),
        tags: z.array(z.string()).optional(),
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
          message: "Only coaches can create notes",
        });
      }

      console.log("createNote - input.clientId:", input.clientId);
      console.log("createNote - coachId:", user.id);

      // Create the note
      const note = await db.clientNote.create({
        data: {
          clientId: input.clientId,
          coachId: user.id,
          title: input.title,
          content: input.content,
          type: input.type,
          priority: input.priority,
          isPrivate: input.isPrivate,
          tags: input.tags
            ? {
                create: input.tags.map(tag => ({
                  name: tag,
                  color: "#4A5A70",
                })),
              }
            : undefined,
        },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
          tags: true,
        },
      });

      return note;
    }),

  // Update a note
  updateNote: publicProcedure
    .input(
      z.object({
        noteId: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: z
          .enum([
            "GENERAL",
            "PROGRESS",
            "FEEDBACK",
            "GOAL",
            "INJURY",
            "TECHNIQUE",
            "MOTIVATION",
            "SCHEDULE",
          ])
          .optional(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
        isPrivate: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
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
          message: "Only coaches can update notes",
        });
      }

      // Get the existing note to save to history
      const existingNote = await db.clientNote.findUnique({
        where: {
          id: input.noteId,
          coachId: user.id,
        },
        include: {
          client: true,
        },
      });

      if (!existingNote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      // Create history entry before updating
      await db.clientNoteHistory.create({
        data: {
          clientId: existingNote.clientId,
          coachId: user.id,
          notes: existingNote.content,
          action: "UPDATED",
        },
      });

      // Prepare update data
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.isPrivate !== undefined) updateData.isPrivate = input.isPrivate;

      // Update tags if provided
      if (input.tags !== undefined) {
        // Delete existing tags
        await db.noteTag.deleteMany({
          where: { noteId: input.noteId },
        });

        // Create new tags if any
        if (input.tags.length > 0) {
          updateData.tags = {
            create: input.tags.map(tag => ({
              name: tag,
              color: "#4A5A70",
            })),
          };
        }
      }

      // Update the note
      const note = await db.clientNote.update({
        where: {
          id: input.noteId,
          coachId: user.id,
        },
        data: updateData,
        include: {
          coach: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
          tags: true,
        },
      });

      return note;
    }),

  // Delete a note
  deleteNote: publicProcedure
    .input(z.object({ noteId: z.string() }))
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
          message: "Only coaches can delete notes",
        });
      }

      await db.clientNote.delete({
        where: {
          id: input.noteId,
          coachId: user.id,
        },
      });

      return { success: true };
    }),

  // Add attachment to a note
  addAttachment: publicProcedure
    .input(
      z.object({
        noteId: z.string(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
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
          message: "Only coaches can add attachments",
        });
      }

      const attachment = await db.noteAttachment.create({
        data: {
          noteId: input.noteId,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileType: input.fileType,
          fileSize: input.fileSize,
        },
      });

      return attachment;
    }),

  // Remove attachment from a note
  removeAttachment: publicProcedure
    .input(z.object({ attachmentId: z.string() }))
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
          message: "Only coaches can remove attachments",
        });
      }

      await db.noteAttachment.delete({
        where: { id: input.attachmentId },
      });

      return { success: true };
    }),
});
