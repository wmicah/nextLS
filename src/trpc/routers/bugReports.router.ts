import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import { ensureUserId } from "./_helpers";
import { CompleteEmailService } from "@/lib/complete-email-service";

/**
 * Bug Reports Router
 */
export const bugReportsRouter = router({
  // Submit a new bug report
  submit: publicProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required").max(200),
        description: z.string().min(1, "Description is required").max(5000),
        page: z.string().min(1, "Page is required").max(200),
        device: z.string().min(1, "Device is required").max(200).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        imageUrl: z.string().url().optional().nullable(),
        videoUrl: z.string().url().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to submit a bug report",
        });
      }

      // Get user from database to get their role
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      if (!dbUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Create bug report
      let bugReport;
      try {
        bugReport = await db.bugReport.create({
          data: {
            title: input.title,
            description: input.description,
            page: input.page,
            device: input.device || null,
            priority: input.priority || "MEDIUM",
            userId: ensureUserId(user.id),
            userRole: dbUser.role || "CLIENT",
            imageUrl: input.imageUrl || null,
            videoUrl: input.videoUrl || null,
            userAgent: null,
            browserInfo: null,
          } as any,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      } catch (dbError: any) {
        console.error("Database error creating bug report:", dbError);
        // Check if it's a table doesn't exist error
        if (
          dbError?.message?.includes("does not exist") ||
          dbError?.code === "P2021" ||
          dbError?.code === "P2001"
        ) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Bug reports table not found. Please run database migration: npx prisma migrate dev",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create bug report: ${
            dbError?.message || "Unknown error"
          }`,
        });
      }

      // Send email notification to wmicah56@gmail.com
      try {
        const emailService = CompleteEmailService.getInstance();
        const priorityLabel = input.priority || "MEDIUM";
        const priorityColor =
          priorityLabel === "CRITICAL"
            ? "#ef4444"
            : priorityLabel === "HIGH"
            ? "#f97316"
            : priorityLabel === "MEDIUM"
            ? "#eab308"
            : "#22c55e";

        // Escape HTML to prevent XSS and template issues
        const escapeHtml = (text: string) => {
          return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        };

        const safeTitle = escapeHtml(input.title);
        const safeDescription = escapeHtml(input.description);
        const safePage = escapeHtml(input.page);
        const safeUserName = escapeHtml(
          (bugReport as any).user?.name ||
            (bugReport as any).user?.email ||
            "Unknown"
        );
        const safeUserRole = escapeHtml(bugReport.userRole);

        await emailService.sendCustomEmail(
          "wmicah56@gmail.com",
          `New Bug Report: ${safeTitle}`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                   New Bug Report
                </h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
                  NextLevel Coaching Platform
                </p>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
                  ${safeTitle}
                </h2>
                
                <div style="background: #F7FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <div style="margin-bottom: 15px;">
                    <strong style="color: #2D3748;">Priority:</strong>
                    <span style="background: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 4px; margin-left: 10px; font-size: 12px; font-weight: bold;">
                      ${priorityLabel}
                    </span>
                  </div>
                  <div style="margin-bottom: 15px;">
                    <strong style="color: #2D3748;">Page:</strong>
                    <span style="color: #4A5568; margin-left: 10px;">${safePage}</span>
                  </div>
                  <div style="margin-bottom: 15px;">
                    <strong style="color: #2D3748;">Device:</strong>
                    <span style="color: #4A5568; margin-left: 10px;">${escapeHtml(
                      input.device || "Not specified"
                    )}</span>
                  </div>
                  <div style="margin-bottom: 15px;">
                    <strong style="color: #2D3748;">Reported by:</strong>
                    <span style="color: #4A5568; margin-left: 10px;">${safeUserName} (${safeUserRole})</span>
                  </div>
                </div>
                
                <div style="background: #F7FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #2D3748; margin: 0 0 15px 0; font-size: 18px;">
                    Description:
                  </h3>
                  <p style="color: #4A5568; line-height: 1.6; margin: 0; white-space: pre-wrap;">
                    ${safeDescription}
                  </p>
                </div>
                
                ${
                  input.imageUrl
                    ? `
                  <div style="margin: 20px 0;">
                    <strong style="color: #2D3748;">Screenshot:</strong>
                    <div style="margin-top: 10px;">
                      <img src="${escapeHtml(
                        input.imageUrl
                      )}" alt="Bug screenshot" style="max-width: 100%; border-radius: 8px; border: 1px solid #E2E8F0;" />
                    </div>
                  </div>
                `
                    : ""
                }
                
                ${
                  input.videoUrl
                    ? `
                  <div style="margin: 20px 0;">
                    <strong style="color: #2D3748;">Video:</strong>
                    <div style="margin-top: 10px;">
                      <a href="${escapeHtml(
                        input.videoUrl
                      )}" style="color: #4A5A70; text-decoration: underline;">View Video</a>
                    </div>
                  </div>
                `
                    : ""
                }
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${
                    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                  }/admin" 
                     style="background: #ef4444; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                            border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                      View in Admin Dashboard
                    </a>
                </div>
                
                <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
                  Bug Report ID: ${bugReport.id}
                </p>
                <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
                  Submitted: ${new Date().toLocaleString()}
                </p>
              </div>
              
              <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
                <p style="color: #718096; font-size: 12px; margin: 0;">
                  © 2024 NextLevel Coaching. All rights reserved.
                </p>
              </div>
            </div>
          `
        );
        console.log("Bug report email notification sent to wmicah56@gmail.com");
      } catch (error) {
        console.error("Failed to send bug report email notification:", error);
        // Don't fail the mutation if email fails
      }

      return bugReport;
    }),

  // Get all bug reports (admin only)
  list: publicProcedure
    .input(
      z
        .object({
          status: z
            .enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "DUPLICATE"])
            .optional(),
          priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user is admin
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { isAdmin: true },
      });

      if (!dbUser?.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view bug reports",
        });
      }

      const where: any = {};
      if (input?.status) {
        where.status = input.status;
      }
      if (input?.priority) {
        where.priority = input.priority;
      }

      const [bugReports, total] = await Promise.all([
        db.bugReport.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            resolver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: input?.limit || 50,
          skip: input?.offset || 0,
        }),
        db.bugReport.count({ where }),
      ]);

      return {
        bugReports,
        total,
        hasMore: (input?.offset || 0) + (input?.limit || 50) < total,
      };
    }),

  // Get user's own bug reports
  getMyReports: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const bugReports = await db.bugReport.findMany({
      where: {
        userId: ensureUserId(user.id),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return bugReports;
  }),

  // Update bug report status (admin only)
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "OPEN",
          "IN_PROGRESS",
          "RESOLVED",
          "CLOSED",
          "DUPLICATE",
        ]),
        resolution: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if user is admin
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { isAdmin: true },
      });

      if (!dbUser?.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update bug report status",
        });
      }

      const updateData: any = {
        status: input.status,
        updatedAt: new Date(),
      };

      if (input.status === "RESOLVED" || input.status === "CLOSED") {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = ensureUserId(user.id);
        if (input.resolution) {
          updateData.resolution = input.resolution;
        }
      }

      const bugReport = await db.bugReport.update({
        where: { id: input.id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return bugReport;
    }),
});
