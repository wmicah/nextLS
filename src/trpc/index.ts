import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { publicProcedure, router } from "./trpc"
import { TRPCError } from "@trpc/server"
import { db } from "@/db"
import { z } from "zod"
import {
	extractYouTubeVideoId,
	extractPlaylistId,
	getYouTubeThumbnail,
	fetchYouTubeVideoInfo,
	fetchPlaylistVideos,
} from "@/lib/youtube"
import { deleteFileFromUploadThing } from "@/lib/uploadthing-utils"

export const appRouter = router({
	authCallback: publicProcedure.query(
		async (): Promise<{
			success: boolean
			needsRoleSelection: boolean
			user: {
				id: string
				email: string
				role?: "COACH" | "CLIENT"
				name: string
			}
		}> => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()

			if (!user || !user.id || !user.email)
				throw new TRPCError({ code: "UNAUTHORIZED" })

			const dbUser = await db.user.findFirst({
				where: { id: user.id },
			})

			if (dbUser) {
				// EXISTING USER - This is the key fix
				if (dbUser.role) {
					// User exists AND has a role - skip role selection
					console.log("Existing user with role:", dbUser.role) // Add for debugging
					return {
						success: true,
						needsRoleSelection: false, // ← This should be FALSE for existing users with roles
						user: {
							id: dbUser.id,
							email: dbUser.email,
							role: dbUser.role as "COACH" | "CLIENT",
							name:
								dbUser.name || user.given_name || user.family_name || "User",
						},
					}
				} else {
					// User exists but no role - needs role selection
					console.log("Existing user without role") // Add for debugging
					return {
						success: true,
						needsRoleSelection: true,
						user: {
							id: dbUser.id,
							email: dbUser.email,
							name:
								dbUser.name || user.given_name || user.family_name || "User",
						},
					}
				}
			}

			// NEW USER LOGIC (rest stays the same)
			const existingClientRecord = await db.client.findFirst({
				where: {
					email: user.email,
					userId: null,
				},
			})

			if (existingClientRecord) {
				const newClientUser = await db.user.create({
					data: {
						id: user.id,
						email: user.email,
						name:
							user.given_name && user.family_name
								? `${user.given_name} ${user.family_name}`
								: null,
						role: "CLIENT",
					},
				})

				await db.client.update({
					where: { id: existingClientRecord.id },
					data: {
						userId: newClientUser.id,
						name: newClientUser.name || existingClientRecord.name,
					},
				})

				return {
					success: true,
					needsRoleSelection: false,
					user: {
						id: newClientUser.id,
						email: newClientUser.email,
						role: "CLIENT",
						name: newClientUser.name || existingClientRecord.name || "Client",
					},
				}
			}

			// Completely new user
			return {
				success: true,
				needsRoleSelection: true,
				user: {
					id: user.id,
					email: user.email,
					name: user.given_name || user.family_name || "User",
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

				// First check if user exists
				const existingUser = await db.user.findFirst({
					where: { id: user.id },
				})

				let updatedUser

				if (existingUser) {
					// User exists, update it
					updatedUser = await db.user.update({
						where: { id: user.id },
						data: {
							role: input.role,
						},
					})
				} else {
					// User doesn't exist, create it
					if (!user.email) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Email is required to create user",
						})
					}

					updatedUser = await db.user.create({
						data: {
							id: user.id,
							email: user.email,
							name:
								user.given_name && user.family_name
									? `${user.given_name} ${user.family_name}`
									: user.given_name || user.family_name || null,
							role: input.role,
						},
					})
				}

				return updatedUser
			}),

		updateWorkingHours: publicProcedure
			.input(
				z.object({
					startTime: z.string(),
					endTime: z.string(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can update working hours",
					})
				}

				// First check if user exists
				const existingUser = await db.user.findFirst({
					where: { id: user.id },
				})

				if (!existingUser) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User not found in database",
					})
				}

				const updatedUser = await db.user.update({
					where: { id: user.id },
					data: {
						workingHoursStart: input.startTime,
						workingHoursEnd: input.endTime,
					},
				})

				return updatedUser
			}),

		getCoaches: publicProcedure.query(async () => {
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

			const dbUser = await db.user.findFirst({
				where: { id: user.id },
			})

			if (!dbUser) return null

			// Transform the data to include workingHours object
			return {
				...dbUser,
				workingHours:
					dbUser.workingHoursStart && dbUser.workingHoursEnd
						? {
								startTime: dbUser.workingHoursStart,
								endTime: dbUser.workingHoursEnd,
						  }
						: null,
			}
		}),

		checkEmailExists: publicProcedure
			.input(z.object({ email: z.string().email() }))
			.query(async ({ input }) => {
				const user = await db.user.findUnique({
					where: { email: input.email },
				})
				return !!user
			}),
	}),

	clients: router({
		list: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()

			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			// Verify user is a COACH
			const coach = await db.user.findFirst({
				where: { id: user.id, role: "COACH" },
			})

			if (!coach) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only coaches can view clients",
				})
			}

			const clients = await db.client.findMany({
				where: { coachId: user.id },
				include: {
					programAssignments: {
						include: {
							program: {
								select: {
									id: true,
									title: true,
									status: true,
									sport: true,
									level: true,
								},
							},
						},
					},
				},
				orderBy: { createdAt: "desc" },
			})

			return clients
		}),

		dueSoon: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()

			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			// Verify user is a COACH
			const coach = await db.user.findFirst({
				where: { id: user.id, role: "COACH" },
			})

			if (!coach) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only coaches can view clients",
				})
			}

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

			// Verify user is a COACH
			const coach = await db.user.findFirst({
				where: { id: user.id, role: "COACH" },
			})

			if (!coach) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only coaches can view clients",
				})
			}

			return await db.client.findMany({
				where: {
					coachId: user.id,
					OR: [
						{ nextLessonDate: null },
						{ nextLessonDate: { lt: new Date() } },
					],
				},
				orderBy: { nextLessonDate: "asc" },
			})
		}),

		create: publicProcedure
			.input(
				z.object({
					name: z.string().min(1, "Name is required"),
					email: z.string().email().optional().or(z.literal("")),
					phone: z.string().optional().or(z.literal("")),
					notes: z.string().optional().or(z.literal("")),
					nextLessonDate: z.string().optional(),
					lastCompletedWorkout: z.string().optional(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can create clients",
					})
				}

				const newClient = await db.client.create({
					data: {
						name: input.name,
						email: input.email || null,
						phone: input.phone || null,
						notes: input.notes || null,
						coachId: user.id,
						nextLessonDate: input.nextLessonDate
							? new Date(input.nextLessonDate)
							: null,
						lastCompletedWorkout: input.lastCompletedWorkout || null,
					},
				})

				return newClient
			}),

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

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can delete clients",
					})
				}

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

		getById: publicProcedure
			.input(z.object({ id: z.string() }))
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can view client details",
					})
				}

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

				return client
			}),

		getAssignedPrograms: publicProcedure
			.input(
				z.object({
					clientId: z.string(),
				})
			)
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can view client programs",
					})
				}

				// Verify the client belongs to this coach
				const client = await db.client.findFirst({
					where: {
						id: input.clientId,
						coachId: user.id,
					},
				})

				if (!client) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Client not found or not assigned to you",
					})
				}

				// Get assigned programs
				const assignments = await db.programAssignment.findMany({
					where: {
						clientId: input.clientId,
					},
					include: {
						program: true,
					},
					orderBy: {
						assignedAt: "desc",
					},
				})

				return assignments
			}),
	}),

	library: router({
		list: publicProcedure
			.input(
				z.object({
					search: z.string().optional(),
					category: z.string().optional(),
					difficulty: z.string().optional(),
					type: z.enum(["video", "document", "all"]).optional(),
				})
			)
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can view library",
					})
				}

				const where: any = {
					coachId: user.id,
				}

				if (input.search) {
					where.OR = [
						{ title: { contains: input.search, mode: "insensitive" } },
						{ description: { contains: input.search, mode: "insensitive" } },
					]
				}

				if (input.category && input.category !== "All") {
					where.category = input.category
				}

				if (input.difficulty && input.difficulty !== "All") {
					where.difficulty = input.difficulty
				}

				if (input.type && input.type !== "all") {
					where.type = input.type
				}

				const resources = await db.libraryResource.findMany({
					where,
					orderBy: { createdAt: "desc" },
				})

				return resources
			}),

		getStats: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()

			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			// Verify user is a COACH
			const coach = await db.user.findFirst({
				where: { id: user.id, role: "COACH" },
			})

			if (!coach) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only coaches can view library stats",
				})
			}

			const totalResources = await db.libraryResource.count({
				where: { coachId: user.id },
			})

			const videoCount = await db.libraryResource.count({
				where: {
					coachId: user.id,
					OR: [{ type: "video" }, { isYoutube: true }],
				},
			})

			const documentCount = await db.libraryResource.count({
				where: { coachId: user.id, type: "document" },
			})

			return {
				total: totalResources,
				videos: videoCount,
				documents: documentCount,
			}
		}),

		getAssignedVideos: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()
			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			// Get videos specifically assigned to this client
			return await db.libraryResource.findMany({
				where: {
					assignments: {
						some: {
							clientId: user.id,
						},
					},
					type: "video",
				},
				include: {
					assignments: {
						where: {
							clientId: user.id,
						},
					},
				},
				orderBy: { createdAt: "desc" },
			})
		}),

		getClientAssignedVideos: publicProcedure
			.input(z.object({ clientId: z.string() }))
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can view client assigned videos",
					})
				}

				// Verify the client belongs to this coach and get the userId
				const client = await db.client.findFirst({
					where: {
						id: input.clientId,
						coachId: user.id,
					},
				})

				if (!client) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Client not found",
					})
				}

				// If client has a userId, get videos assigned to this specific client
				if (!client.userId) {
					return []
				}

				return await db.libraryResource.findMany({
					where: {
						assignments: {
							some: {
								clientId: client.userId,
							},
						},
						type: "video",
					},
					include: {
						assignments: {
							where: {
								clientId: client.userId,
							},
						},
					},
					orderBy: { createdAt: "desc" },
				})
			}),

		// New procedure for coaches to assign videos to clients
		assignVideoToClient: publicProcedure
			.input(
				z.object({
					videoId: z.string(),
					clientId: z.string(),
					dueDate: z.date().optional(),
					notes: z.string().optional(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can assign videos",
					})
				}

				// Verify the video belongs to the coach
				const video = await db.libraryResource.findFirst({
					where: {
						id: input.videoId,
						coachId: user.id,
					},
				})

				if (!video) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Video not found or you don't own it",
					})
				}

				// Verify the client exists and is assigned to this coach
				const client = await db.client.findFirst({
					where: {
						userId: input.clientId,
						coachId: user.id,
					},
				})

				if (!client) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Client not found or not assigned to you",
					})
				}

				// Create or update the assignment
				const assignment = await db.videoAssignment.upsert({
					where: {
						videoId_clientId: {
							videoId: input.videoId,
							clientId: input.clientId,
						},
					},
					update: {
						dueDate: input.dueDate,
						notes: input.notes,
					},
					create: {
						videoId: input.videoId,
						clientId: input.clientId,
						dueDate: input.dueDate,
						notes: input.notes,
					},
				})

				return assignment
			}),

		// New procedure for clients to mark videos as completed
		markVideoAsCompleted: publicProcedure
			.input(
				z.object({
					videoId: z.string(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Update the assignment to mark as completed
				const assignment = await db.videoAssignment.update({
					where: {
						videoId_clientId: {
							videoId: input.videoId,
							clientId: user.id,
						},
					},
					data: {
						completed: true,
						completedAt: new Date(),
					},
				})

				return assignment
			}),

		// New procedure for coaches to get assignments for a specific client
		getClientAssignments: publicProcedure
			.input(
				z.object({
					clientId: z.string(),
				})
			)
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can view client assignments",
					})
				}

				// Verify the client is assigned to this coach
				const client = await db.client.findFirst({
					where: {
						userId: input.clientId,
						coachId: user.id,
					},
				})

				if (!client) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Client not found or not assigned to you",
					})
				}

				return await db.videoAssignment.findMany({
					where: {
						clientId: input.clientId,
					},
					include: {
						video: true,
					},
					orderBy: { assignedAt: "desc" },
				})
			}),

		getById: publicProcedure
			.input(z.object({ id: z.string() }))
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				const resource = await db.libraryResource.findUnique({
					where: { id: input.id },
				})

				if (!resource) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Resource not found",
					})
				}

				// Only increment views for the resource owner or allow access based on your business logic
				const dbUser = await db.user.findFirst({
					where: { id: user.id },
				})

				if (dbUser?.role === "COACH" && resource.coachId === user.id) {
					await db.libraryResource.update({
						where: { id: input.id },
						data: { views: { increment: 1 } },
					})
				}

				return resource
			}),

		create: publicProcedure
			.input(
				z.object({
					title: z.string().min(1, "Title is required"),
					description: z.string().min(1, "Description is required"),
					category: z.string().min(1, "Category is required"),
					difficulty: z.enum([
						"Beginner",
						"Intermediate",
						"Advanced",
						"All Levels",
					]),
					type: z.enum(["video", "document"]),
					url: z.string().url(),
					duration: z.string().optional(),
					thumbnail: z.string().optional(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can create library resources",
					})
				}

				const newResource = await db.libraryResource.create({
					data: {
						title: input.title,
						description: input.description,
						category: input.category,
						difficulty: input.difficulty,
						type: input.type,
						url: input.url,
						duration: input.duration,
						thumbnail: input.thumbnail || "📚",
						coachId: user.id,
						views: 0,
						rating: 0,
					},
				})

				return newResource
			}),

		upload: publicProcedure
			.input(
				z.object({
					title: z.string().min(1).max(255),
					description: z.string().min(1).max(1000),
					category: z.string(),
					difficulty: z.string(),
					fileUrl: z.string().url(),
					filename: z.string(),
					contentType: z.string(),
					size: z.number(),
					thumbnail: z.string().optional(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can upload resources",
					})
				}

				const type = input.contentType.startsWith("video/")
					? "video"
					: "document"

				const newResource = await db.libraryResource.create({
					data: {
						title: input.title,
						description: input.description,
						category: input.category,
						difficulty: input.difficulty as any,
						type: type as any,
						url: input.fileUrl,
						filename: input.filename,
						thumbnail: input.thumbnail || (type === "video" ? "🎥" : "📄"),
						coachId: user.id,
						views: 0,
						rating: 0,
					},
				})

				return {
					id: newResource.id,
					message: "Resource uploaded successfully",
					resource: newResource,
				}
			}),

		update: publicProcedure
			.input(
				z.object({
					id: z.string(),
					title: z.string().optional(),
					description: z.string().optional(),
					category: z.string().optional(),
					difficulty: z
						.enum(["Beginner", "Intermediate", "Advanced", "All Levels"])
						.optional(),
					type: z.enum(["video", "document"]).optional(),
					url: z.string().url().optional(),
					duration: z.string().optional(),
					thumbnail: z.string().optional(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				const resource = await db.libraryResource.findFirst({
					where: {
						id: input.id,
						coachId: user.id,
					},
				})

				if (!resource) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Resource not found",
					})
				}

				const { id, ...updateData } = input

				const updatedResource = await db.libraryResource.update({
					where: { id: input.id },
					data: updateData,
				})

				return updatedResource
			}),

		delete: publicProcedure
			.input(z.object({ id: z.string() }))
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				const resource = await db.libraryResource.findUnique({
					where: { id: input.id },
				})

				if (!resource) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Resource not found",
					})
				}

				if (resource.coachId !== user.id) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You can only delete your own resources",
					})
				}

				if (!resource.isYoutube && resource.url) {
					const fileDeleted = await deleteFileFromUploadThing(resource.url)
					if (!fileDeleted) {
						console.warn(
							`Warning: Could not delete file from UploadThing for resource ${input.id}`
						)
					}
				}

				await db.libraryResource.delete({
					where: { id: input.id },
				})

				return {
					success: true,
					message: "Resource deleted successfully",
				}
			}),

		rate: publicProcedure
			.input(
				z.object({
					id: z.string(),
					rating: z.number().min(1).max(5),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				const resource = await db.libraryResource.findUnique({
					where: { id: input.id },
				})

				if (!resource) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Resource not found",
					})
				}

				const updatedResource = await db.libraryResource.update({
					where: { id: input.id },
					data: { rating: input.rating },
				})

				return updatedResource
			}),

		getCategories: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()

			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			// Verify user is a COACH
			const coach = await db.user.findFirst({
				where: { id: user.id, role: "COACH" },
			})

			if (!coach) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only coaches can view categories",
				})
			}

			const categories = await db.libraryResource.groupBy({
				by: ["category"],
				where: { coachId: user.id },
				_count: { category: true },
			})

			return categories.map((cat) => ({
				name: cat.category,
				count: cat._count.category,
			}))
		}),

		importYouTubeVideo: publicProcedure
			.input(
				z.object({
					url: z.string().url(),
					category: z.string().min(1, "Category is required"),
					difficulty: z.enum([
						"Beginner",
						"Intermediate",
						"Advanced",
						"All Levels",
					]),
					customTitle: z.string().optional(),
					customDescription: z.string().optional(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can import YouTube videos",
					})
				}

				const videoId = extractYouTubeVideoId(input.url)
				if (!videoId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid YouTube URL",
					})
				}

				const youtubeInfo = await fetchYouTubeVideoInfo(
					videoId,
					process.env.YOUTUBE_API_KEY
				)

				const newResource = await db.libraryResource.create({
					data: {
						title:
							input.customTitle ||
							youtubeInfo?.title ||
							`YouTube Video ${videoId}`,
						description:
							input.customDescription ||
							youtubeInfo?.description ||
							"Imported from YouTube",
						category: input.category,
						difficulty: input.difficulty,
						type: "video",
						url: input.url,
						youtubeId: videoId,
						thumbnail: youtubeInfo?.thumbnail || getYouTubeThumbnail(videoId),
						duration: youtubeInfo?.duration,
						isYoutube: true,
						coachId: user.id,
						views: 0,
						rating: 0,
					},
				})

				return newResource
			}),

		importYouTubePlaylist: publicProcedure
			.input(
				z.object({
					playlistUrl: z.string().url(),
					category: z.string().min(1, "Category is required"),
					difficulty: z.enum([
						"Beginner",
						"Intermediate",
						"Advanced",
						"All Levels",
					]),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can import YouTube playlists",
					})
				}

				const playlistId = extractPlaylistId(input.playlistUrl)
				if (!playlistId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid YouTube playlist URL",
					})
				}

				const videos = await fetchPlaylistVideos(
					playlistId,
					process.env.YOUTUBE_API_KEY
				)

				if (videos.length === 0) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "No videos found in playlist or API key not configured",
					})
				}

				const createdResources = await Promise.all(
					videos.map(async (video: any) => {
						return await db.libraryResource.create({
							data: {
								title: video.title,
								description:
									video.description || "Imported from YouTube playlist",
								category: input.category,
								difficulty: input.difficulty,
								type: "video",
								url: `https://www.youtube.com/watch?v=${video.videoId}`,
								youtubeId: video.videoId,
								playlistId: playlistId,
								thumbnail:
									video.thumbnail || getYouTubeThumbnail(video.videoId),
								isYoutube: true,
								coachId: user.id,
								views: 0,
								rating: 0,
							},
						})
					})
				)

				return {
					success: true,
					imported: createdResources.length,
					resources: createdResources,
				}
			}),
	}),

	messaging: router({
		getConversations: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()

			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			const userRole = await db.user.findUnique({
				where: { id: user.id },
				select: { role: true },
			})

			if (!userRole?.role) throw new TRPCError({ code: "UNAUTHORIZED" })

			const conversations = await db.conversation.findMany({
				where:
					userRole.role === "COACH"
						? { coachId: user.id }
						: { clientId: user.id },
				include: {
					coach: { select: { id: true, name: true, email: true } },
					client: { select: { id: true, name: true, email: true } },
					messages: {
						orderBy: { createdAt: "desc" },
						take: 1,
						include: {
							sender: { select: { id: true, name: true } },
						},
					},
					_count: {
						select: {
							messages: {
								where: {
									isRead: false,
									senderId: { not: user.id },
								},
							},
						},
					},
				},
				orderBy: { updatedAt: "desc" },
			})

			return conversations
		}),

		getMessages: publicProcedure
			.input(z.object({ conversationId: z.string() }))
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				const conversation = await db.conversation.findFirst({
					where: {
						id: input.conversationId,
						OR: [{ coachId: user.id }, { clientId: user.id }],
					},
				})

				if (!conversation) throw new TRPCError({ code: "FORBIDDEN" })

				const messages = await db.message.findMany({
					where: { conversationId: input.conversationId },
					include: {
						sender: { select: { id: true, name: true, email: true } },
					},
					orderBy: { createdAt: "asc" },
				})

				await db.message.updateMany({
					where: {
						conversationId: input.conversationId,
						senderId: { not: user.id },
						isRead: false,
					},
					data: { isRead: true },
				})

				return messages
			}),

		sendMessage: publicProcedure
			.input(
				z.object({
					conversationId: z.string(),
					content: z.string().min(1).max(1000),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				const conversation = await db.conversation.findFirst({
					where: {
						id: input.conversationId,
						OR: [{ coachId: user.id }, { clientId: user.id }],
					},
				})

				if (!conversation) throw new TRPCError({ code: "FORBIDDEN" })

				const message = await db.message.create({
					data: {
						conversationId: input.conversationId,
						senderId: user.id,
						content: input.content,
					},
					include: {
						sender: { select: { id: true, name: true, email: true } },
					},
				})

				await db.conversation.update({
					where: { id: input.conversationId },
					data: { updatedAt: new Date() },
				})

				return message
			}),

		createConversation: publicProcedure
			.input(
				z.object({
					otherUserId: z.string(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				const currentUser = await db.user.findUnique({
					where: { id: user.id },
					select: { role: true },
				})

				const otherUser = await db.user.findUnique({
					where: { id: input.otherUserId },
					select: { role: true },
				})

				if (!currentUser?.role || !otherUser?.role) {
					throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid users" })
				}

				let coachId: string, clientId: string

				if (currentUser.role === "COACH" && otherUser.role === "CLIENT") {
					coachId = user.id
					clientId = input.otherUserId
				} else if (
					currentUser.role === "CLIENT" &&
					otherUser.role === "COACH"
				) {
					coachId = input.otherUserId
					clientId = user.id
				} else {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Can only create conversations between coach and client",
					})
				}

				const existingConversation = await db.conversation.findUnique({
					where: {
						coachId_clientId: {
							coachId,
							clientId,
						},
					},
				})

				if (existingConversation) {
					return existingConversation
				}

				const conversation = await db.conversation.create({
					data: { coachId, clientId },
					include: {
						coach: { select: { id: true, name: true, email: true } },
						client: { select: { id: true, name: true, email: true } },
					},
				})

				return conversation
			}),

		getUnreadCount: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()

			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			const unreadCount = await db.message.count({
				where: {
					isRead: false,
					senderId: { not: user.id },
					conversation: {
						OR: [{ coachId: user.id }, { clientId: user.id }],
					},
				},
			})

			return unreadCount
		}),
	}),

	workouts: router({
		getTodaysWorkouts: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()
			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			// Find today's workouts for the logged-in client
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			const tomorrow = new Date(today)
			tomorrow.setDate(today.getDate() + 1)

			return await db.workout.findMany({
				where: {
					clientId: user.id, // Changed from userId to clientId
					date: {
						gte: today,
						lt: tomorrow,
					},
				},
				orderBy: { date: "asc" },
			})
		}),

		getClientWorkouts: publicProcedure
			.input(z.object({ clientId: z.string() }))
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can view client workouts",
					})
				}

				// Verify the client belongs to this coach and get the userId
				const client = await db.client.findFirst({
					where: {
						id: input.clientId,
						coachId: user.id,
					},
				})

				if (!client) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Client not found",
					})
				}

				// If client has a userId, use that for workouts, otherwise return empty array
				if (!client.userId) {
					return []
				}

				return await db.workout.findMany({
					where: {
						clientId: client.userId,
					},
					orderBy: { date: "desc" },
				})
			}),
	}),

	progress: router({
		getClientProgress: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()
			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			// Example: Fetch streak and skill progress for the client
			// Replace with your actual logic
			return {
				currentStreak: 5,
				streakPercentage: 80,
				skills: [
					{ name: "Speed", progress: 78 },
					{ name: "Endurance", progress: 65 },
					{ name: "Technique", progress: 82 },
				],
			}
		}),

		getClientProgressById: publicProcedure
			.input(z.object({ clientId: z.string() }))
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can view client progress",
					})
				}

				// Verify the client belongs to this coach and get the userId
				const client = await db.client.findFirst({
					where: {
						id: input.clientId,
						coachId: user.id,
					},
				})

				if (!client) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Client not found",
					})
				}

				// If client has a userId, fetch progress data, otherwise return empty data
				if (!client.userId) {
					return {
						currentStreak: 0,
						streakPercentage: 0,
						skills: [],
					}
				}

				// Example: Fetch progress data for the specific client
				// Replace with your actual progress logic
				return {
					currentStreak: 5,
					streakPercentage: 80,
					skills: [
						{ name: "Speed", progress: 78 },
						{ name: "Endurance", progress: 65 },
						{ name: "Technique", progress: 82 },
					],
				}
			}),
	}),

	events: router({
		getUpcoming: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()
			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			// Example: Fetch upcoming events for the client
			// Replace with your actual logic
			return await db.event.findMany({
				where: {
					clientId: user.id, // Changed from userId to clientId
					date: { gte: new Date() },
				},
				orderBy: { date: "asc" },
			})
		}),
	}),

	workoutTemplates: router({
		// Get all workout templates for a coach
		list: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()

			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			// Verify user is a COACH
			const coach = await db.user.findFirst({
				where: { id: user.id, role: "COACH" },
			})

			if (!coach) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only coaches can view workout templates",
				})
			}

			return (await db.workoutTemplate.findMany({
				where: { coachId: user.id },
				orderBy: { createdAt: "desc" },
			})) as any // or create a specific type
		}),

		// Create a new workout template
		create: publicProcedure
			.input(
				z.object({
					title: z.string().min(1),
					description: z.string().optional(),
					exercises: z.array(
						z.object({
							name: z.string(),
							sets: z.number(),
							reps: z.string(),
							weight: z.string().optional(),
							notes: z.string().optional(),
						})
					),
					duration: z.string().optional(),
					difficulty: z.string().optional(),
					category: z.string().optional(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can create workout templates",
					})
				}

				return await db.workoutTemplate.create({
					data: {
						...input,
						exercises: input.exercises as any,
						coachId: user.id,
					},
				})
			}),

		// Copy a workout template to create a new one
		copy: publicProcedure
			.input(z.object({ templateId: z.string() }))
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				const originalTemplate = await db.workoutTemplate.findFirst({
					where: {
						id: input.templateId,
						coachId: user.id,
					},
				})

				if (!originalTemplate) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Template not found",
					})
				}

				return await db.workoutTemplate.create({
					data: {
						title: `${originalTemplate.title} (Copy)`,
						description: originalTemplate.description,
						exercises: originalTemplate.exercises as any,
						duration: originalTemplate.duration,
						difficulty: originalTemplate.difficulty,
						category: originalTemplate.category,
						coachId: user.id,
					},
				})
			}),
	}),

	scheduling: router({
		// Schedule a lesson for a client
		scheduleLesson: publicProcedure
			.input(
				z.object({
					clientId: z.string(), // This is Client.id
					lessonDate: z.string(), // Changed from z.date() to z.string()
					sendEmail: z.boolean().optional(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can schedule lessons",
					})
				}

				// Verify the client belongs to this coach
				const client = await db.client.findFirst({
					where: {
						id: input.clientId,
						coachId: user.id,
					},
				})

				if (!client) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Client not found or not assigned to you",
					})
				}

				// Convert string to Date object
				const lessonDate = new Date(input.lessonDate)

				// Validate the date
				if (isNaN(lessonDate.getTime())) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid date format",
					})
				}

				// Check if the lesson is in the past
				const now = new Date()
				if (lessonDate <= now) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Cannot schedule lessons in the past",
					})
				}

				// Create the lesson (using Event model)
				const lesson = await db.event.create({
					data: {
						title: `Lesson with ${client.name}`,
						description: "Scheduled lesson",
						date: lessonDate,
						clientId: input.clientId, // Use Client.id directly
						coachId: user.id,
					},
				})

				// Update client's next lesson date
				await db.client.update({
					where: { id: input.clientId },
					data: { nextLessonDate: lessonDate },
				})

				// TODO: Send email notification if requested
				if (input.sendEmail && client.email) {
					// This would integrate with your email service
					// For now, we'll just log it
					console.log(
						`Email notification would be sent to ${client.email} for lesson on ${lessonDate}`
					)
				}

				return lesson
			}),

		// Get weekly schedule for a client
		getWeeklySchedule: publicProcedure
			.input(
				z.object({
					clientId: z.string(),
					weekStart: z.date(),
				})
			)
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can view schedules",
					})
				}

				const weekEnd = new Date(input.weekStart)
				weekEnd.setDate(weekEnd.getDate() + 6)

				return await db.weeklySchedule.findFirst({
					where: {
						clientId: input.clientId,
						coachId: user.id,
						weekStart: input.weekStart,
						weekEnd: weekEnd,
					},
					include: {
						days: {
							include: {
								workoutTemplate: true,
								videoAssignments: {
									include: {
										video: true,
									},
								},
							},
							orderBy: { dayOfWeek: "asc" },
						},
					},
				})
			}),

		// Create or update weekly schedule
		updateWeeklySchedule: publicProcedure
			.input(
				z.object({
					clientId: z.string(),
					weekStart: z.date(),
					days: z.array(
						z.object({
							dayOfWeek: z.number(),
							workoutTemplateId: z.string().optional(),
							title: z.string(),
							description: z.string().optional(),
							exercises: z
								.array(
									z.object({
										name: z.string(),
										sets: z.number(),
										reps: z.string(),
										weight: z.string().optional(),
										notes: z.string().optional(),
									})
								)
								.optional(),
							duration: z.string().optional(),
							videoIds: z.array(z.string()).optional(),
						})
					),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can update schedules",
					})
				}

				const weekEnd = new Date(input.weekStart)
				weekEnd.setDate(weekEnd.getDate() + 6)

				// Use transaction to ensure data consistency
				return await db.$transaction(async (tx) => {
					// Create or update weekly schedule
					const weeklySchedule = await tx.weeklySchedule.upsert({
						where: {
							clientId_coachId_weekStart: {
								clientId: input.clientId,
								coachId: user.id,
								weekStart: input.weekStart,
							},
						},
						update: {},
						create: {
							clientId: input.clientId,
							coachId: user.id,
							weekStart: input.weekStart,
							weekEnd: weekEnd,
						},
					})

					// Delete existing days
					await tx.scheduledDay.deleteMany({
						where: { weeklyScheduleId: weeklySchedule.id },
					})

					// Create new days
					const createdDays = await Promise.all(
						input.days.map(async (day) => {
							const createdDay = await tx.scheduledDay.create({
								data: {
									weeklyScheduleId: weeklySchedule.id,
									dayOfWeek: day.dayOfWeek,
									workoutTemplateId: day.workoutTemplateId,
									title: day.title,
									description: day.description,
									exercises: day.exercises as any,
									duration: day.duration,
								},
							})

							// Assign videos if provided
							if (day.videoIds && day.videoIds.length > 0) {
								await Promise.all(
									day.videoIds.map((videoId) =>
										tx.videoAssignment.upsert({
											where: {
												videoId_clientId: {
													videoId: videoId,
													clientId: input.clientId,
												},
											},
											update: {
												scheduledDayId: createdDay.id,
											},
											create: {
												videoId: videoId,
												clientId: input.clientId,
												scheduledDayId: createdDay.id,
												assignedAt: new Date(),
											},
										})
									)
								)
							}

							return createdDay
						})
					)

					return {
						weeklySchedule,
						days: createdDays,
					}
				})
			}),

		// Copy previous week's schedule to current week
		copyPreviousWeek: publicProcedure
			.input(
				z.object({
					clientId: z.string(),
					currentWeekStart: z.date(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Calculate previous week start
				const previousWeekStart = new Date(input.currentWeekStart)
				previousWeekStart.setDate(previousWeekStart.getDate() - 7)

				const previousWeekEnd = new Date(previousWeekStart)
				previousWeekEnd.setDate(previousWeekEnd.getDate() + 6)

				// Get previous week's schedule
				const previousSchedule = await db.weeklySchedule.findFirst({
					where: {
						clientId: input.clientId,
						coachId: user.id,
						weekStart: previousWeekStart,
						weekEnd: previousWeekEnd,
					},
					include: {
						days: {
							include: {
								videoAssignments: true,
							},
						},
					},
				})

				if (!previousSchedule) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "No previous week schedule found to copy",
					})
				}

				// Copy to current week
				const currentWeekEnd = new Date(input.currentWeekStart)
				currentWeekEnd.setDate(currentWeekEnd.getDate() + 6)

				return await db.$transaction(async (tx) => {
					const newSchedule = await tx.weeklySchedule.create({
						data: {
							clientId: input.clientId,
							coachId: user.id,
							weekStart: input.currentWeekStart,
							weekEnd: currentWeekEnd,
						},
					})

					const copiedDays = await Promise.all(
						previousSchedule.days.map(async (day) => {
							const newDay = await tx.scheduledDay.create({
								data: {
									weeklyScheduleId: newSchedule.id,
									dayOfWeek: day.dayOfWeek,
									workoutTemplateId: day.workoutTemplateId,
									title: day.title,
									description: day.description,
									exercises: day.exercises as any,
									duration: day.duration,
								},
							})

							// Copy video assignments
							if (day.videoAssignments.length > 0) {
								await Promise.all(
									day.videoAssignments.map((assignment) =>
										tx.videoAssignment.create({
											data: {
												videoId: assignment.videoId,
												clientId: assignment.clientId,
												scheduledDayId: newDay.id,
												assignedAt: new Date(),
												dueDate: assignment.dueDate,
												notes: assignment.notes,
											},
										})
									)
								)
							}

							return newDay
						})
					)

					return {
						weeklySchedule: newSchedule,
						days: copiedDays,
					}
				})
			}),

		// Get coach's schedule for a specific month
		getCoachSchedule: publicProcedure
			.input(
				z.object({
					month: z.number(),
					year: z.number(),
				})
			)
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can view their schedule",
					})
				}

				// Calculate month start and end dates
				const monthStart = new Date(input.year, input.month, 1)
				const monthEnd = new Date(input.year, input.month + 1, 0, 23, 59, 59)
				const now = new Date()

				// Get all events (lessons) for the coach in the specified month
				const events = await db.event.findMany({
					where: {
						coachId: user.id,
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
				})

				return events
			}),

		// Delete a lesson
		deleteLesson: publicProcedure
			.input(
				z.object({
					lessonId: z.string(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can delete lessons",
					})
				}

				// Find the lesson and verify it belongs to this coach
				const lesson = await db.event.findFirst({
					where: {
						id: input.lessonId,
						coachId: user.id,
					},
				})

				if (!lesson) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message:
							"Lesson not found or you don't have permission to delete it",
					})
				}

				// Delete the lesson
				await db.event.delete({
					where: {
						id: input.lessonId,
					},
				})

				return { success: true }
			}),
	}),

	programs: router({
		// Get all programs for the coach
		list: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()

			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			// Verify user is a COACH
			const coach = await db.user.findFirst({
				where: { id: user.id, role: "COACH" },
			})

			if (!coach) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only coaches can view programs",
				})
			}

			// Get all programs created by this coach
			const programs = await db.program.findMany({
				where: { coachId: user.id },
				include: {
					// Include client assignments to count active clients
					assignments: {
						where: {
							// Only count active assignments (not completed)
							completedAt: null,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			})

			// Transform to include active client count
			return programs.map((program) => ({
				id: program.id,
				title: program.title,
				description: program.description,
				activeClientCount: program.assignments.length,
				createdAt: program.createdAt,
				updatedAt: program.updatedAt,
			}))
		}),

		// Create a new program
		create: publicProcedure
			.input(
				z.object({
					name: z.string().min(1, "Program name is required"),
					description: z.string().optional(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can create programs",
					})
				}

				// Create the program
				const program = await db.program.create({
					data: {
						title: input.name,
						description: input.description || "",
						sport: "General", // Default sport
						level: "Beginner", // Default level
						duration: 1, // Default duration
						coachId: user.id,
					},
				})

				return program
			}),

		// Get a specific program
		getById: publicProcedure
			.input(z.object({ id: z.string() }))
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can view programs",
					})
				}

				// Get the program
				const program = await db.program.findFirst({
					where: {
						id: input.id,
						coachId: user.id, // Ensure coach owns this program
					},
					include: {
						weeks: {
							include: {
								days: {
									include: {
										drills: {
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
				})

				if (!program) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Program not found",
					})
				}

				return program
			}),

		// Update a program
		update: publicProcedure
			.input(
				z.object({
					id: z.string(),
					title: z.string().optional(),
					description: z.string().optional(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can update programs",
					})
				}

				// Update the program
				const program = await db.program.update({
					where: {
						id: input.id,
						coachId: user.id, // Ensure coach owns this program
					},
					data: {
						...(input.title && { title: input.title }),
						...(input.description !== undefined && {
							description: input.description,
						}),
					},
				})

				return program
			}),

		// Duplicate a program
		duplicate: publicProcedure
			.input(z.object({ id: z.string() }))
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can duplicate programs",
					})
				}

				// Get the original program
				const originalProgram = await db.program.findFirst({
					where: {
						id: input.id,
						coachId: user.id,
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
				})

				if (!originalProgram) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Program not found",
					})
				}

				// Create the duplicated program
				const duplicatedProgram = await db.program.create({
					data: {
						title: `${originalProgram.title} (Copy)`,
						description: originalProgram.description,
						sport: originalProgram.sport,
						level: originalProgram.level,
						duration: originalProgram.duration,
						coachId: user.id,
					},
				})

				// Duplicate weeks and days
				for (const week of originalProgram.weeks) {
					const duplicatedWeek = await db.programWeek.create({
						data: {
							weekNumber: week.weekNumber,
							title: week.title,
							description: week.description,
							programId: duplicatedProgram.id,
						},
					})

					// Duplicate days
					for (const day of week.days) {
						const duplicatedDay = await db.programDay.create({
							data: {
								dayNumber: day.dayNumber,
								title: day.title,
								description: day.description,
								weekId: duplicatedWeek.id,
							},
						})

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
							})
						}
					}
				}

				return duplicatedProgram
			}),

		// Delete a program
		delete: publicProcedure
			.input(z.object({ id: z.string() }))
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can delete programs",
					})
				}

				// Check if program exists and belongs to coach
				const program = await db.program.findFirst({
					where: {
						id: input.id,
						coachId: user.id,
					},
				})

				if (!program) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message:
							"Program not found or you don't have permission to delete it",
					})
				}

				// Delete the program (cascade will handle related records)
				await db.program.delete({
					where: {
						id: input.id,
					},
				})

				return { success: true }
			}),

		// Get active client count for a program
		getActiveClientCount: publicProcedure
			.input(z.object({ programId: z.string() }))
			.query(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can view program statistics",
					})
				}

				// Count active client assignments for this program
				const count = await db.programAssignment.count({
					where: {
						programId: input.programId,
						completedAt: null, // Not completed = active
					},
				})

				return count
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
									supersetWithId: z.string().optional(),
								})
							),
						})
					),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can update programs",
					})
				}

				// Verify program exists and belongs to coach
				const program = await db.program.findFirst({
					where: {
						id: input.programId,
						coachId: user.id,
					},
				})

				if (!program) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Program not found",
					})
				}

				// Find or create the week
				let week = await db.programWeek.findFirst({
					where: {
						programId: input.programId,
						weekNumber: input.weekNumber,
					},
				})

				if (!week) {
					week = await db.programWeek.create({
						data: {
							programId: input.programId,
							weekNumber: input.weekNumber,
							title: `Week ${input.weekNumber}`,
						},
					})
				}

				// Update each day
				for (const dayData of input.days) {
					// Find or create the day
					let day = await db.programDay.findFirst({
						where: {
							weekId: week.id,
							dayNumber: dayData.dayNumber,
						},
					})

					if (!day) {
						day = await db.programDay.create({
							data: {
								weekId: week.id,
								dayNumber: dayData.dayNumber,
								title: dayData.title,
								description: dayData.description,
								isRestDay: dayData.isRestDay || false,
								warmupTitle: dayData.warmupTitle,
								warmupDescription: dayData.warmupDescription,
							},
						})
					} else {
						// Update existing day
						await db.programDay.update({
							where: { id: day.id },
							data: {
								title: dayData.title,
								description: dayData.description,
								isRestDay: dayData.isRestDay || false,
								warmupTitle: dayData.warmupTitle,
								warmupDescription: dayData.warmupDescription,
							},
						})
					}

					// Clear existing drills and recreate them
					await db.programDrill.deleteMany({
						where: { dayId: day.id },
					})

					// Create new drills
					for (const drillData of dayData.drills) {
						await db.programDrill.create({
							data: {
								dayId: day.id,
								order: drillData.order,
								title: drillData.title,
								description: drillData.description,
								duration: drillData.duration,
								videoUrl: drillData.videoUrl,
								notes: drillData.notes,
								sets: drillData.sets,
								reps: drillData.reps,
								tempo: drillData.tempo,
								supersetWithId: drillData.supersetWithId,
							},
						})
					}
				}

				return { success: true }
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
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can add exercises",
					})
				}

				// Verify program exists and belongs to coach
				const program = await db.program.findFirst({
					where: {
						id: input.programId,
						coachId: user.id,
					},
				})

				if (!program) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Program not found",
					})
				}

				// Find the week
				let week = await db.programWeek.findFirst({
					where: {
						programId: input.programId,
						weekNumber: input.weekNumber,
					},
				})

				if (!week) {
					// Create the week if it doesn't exist
					week = await db.programWeek.create({
						data: {
							programId: input.programId,
							weekNumber: input.weekNumber,
							title: `Week ${input.weekNumber}`,
						},
					})
				}

				// Find the day
				let day = await db.programDay.findFirst({
					where: {
						weekId: week.id,
						dayNumber: input.dayNumber,
					},
				})

				if (!day) {
					// Create the day if it doesn't exist
					day = await db.programDay.create({
						data: {
							weekId: week.id,
							dayNumber: input.dayNumber,
							title: `Day ${input.dayNumber}`,
						},
					})
				}

				// Get the next order number
				const maxOrder = await db.programDrill.aggregate({
					where: { dayId: day.id },
					_max: { order: true },
				})

				const newOrder = (maxOrder._max.order || 0) + 1

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
					},
				})

				return exercise
			}),

		// Delete exercise
		deleteExercise: publicProcedure
			.input(z.object({ exerciseId: z.string() }))
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can delete exercises",
					})
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
				})

				if (!exercise || exercise.day.week.program.coachId !== user.id) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Exercise not found or you don't have permission",
					})
				}

				// Delete the exercise
				await db.programDrill.delete({
					where: { id: input.exerciseId },
				})

				return { success: true }
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
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can update exercises",
					})
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
				})

				if (!exercise || exercise.day.week.program.coachId !== user.id) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Exercise not found or you don't have permission",
					})
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
					},
				})

				return updatedExercise
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
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can modify programs",
					})
				}

				// Verify program exists and belongs to coach
				const program = await db.program.findFirst({
					where: {
						id: input.programId,
						coachId: user.id,
					},
				})

				if (!program) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Program not found",
					})
				}

				// Find the week
				let week = await db.programWeek.findFirst({
					where: {
						programId: input.programId,
						weekNumber: input.weekNumber,
					},
				})

				if (!week) {
					// Create the week if it doesn't exist
					week = await db.programWeek.create({
						data: {
							programId: input.programId,
							weekNumber: input.weekNumber,
							title: `Week ${input.weekNumber}`,
						},
					})
				}

				// Find the day
				let day = await db.programDay.findFirst({
					where: {
						weekId: week.id,
						dayNumber: input.dayNumber,
					},
				})

				if (!day) {
					// Create the day if it doesn't exist
					day = await db.programDay.create({
						data: {
							weekId: week.id,
							dayNumber: input.dayNumber,
							title: `Day ${input.dayNumber}`,
							isRestDay: true, // Set as rest day when creating
						},
					})
				} else {
					// Toggle the rest day status
					day = await db.programDay.update({
						where: { id: day.id },
						data: { isRestDay: !day.isRestDay },
					})
				}

				return day
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
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can create weeks",
					})
				}

				// Verify program exists and belongs to coach
				const program = await db.program.findFirst({
					where: {
						id: input.programId,
						coachId: user.id,
					},
				})

				if (!program) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Program not found",
					})
				}

				// Create the week
				const week = await db.programWeek.create({
					data: {
						programId: input.programId,
						weekNumber: input.weekNumber,
						title: input.title,
						description: input.description,
					},
				})

				return week
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
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can create days",
					})
				}

				// Verify program exists and belongs to coach
				const program = await db.program.findFirst({
					where: {
						id: input.programId,
						coachId: user.id,
					},
				})

				if (!program) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Program not found",
					})
				}

				// Find or create the week
				let week = await db.programWeek.findFirst({
					where: {
						programId: input.programId,
						weekNumber: input.weekNumber,
					},
				})

				if (!week) {
					week = await db.programWeek.create({
						data: {
							programId: input.programId,
							weekNumber: input.weekNumber,
							title: `Week ${input.weekNumber}`,
						},
					})
				}

				// Create the day
				const day = await db.programDay.create({
					data: {
						weekId: week.id,
						dayNumber: input.dayNumber,
						title: input.title,
						description: input.description,
					},
				})

				return day
			}),

		// Assign program to clients
		assignToClients: publicProcedure
			.input(
				z.object({
					programId: z.string(),
					clientIds: z.array(z.string()),
					startDate: z.date().optional(),
				})
			)
			.mutation(async ({ input }) => {
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can assign programs",
					})
				}

				// Verify program exists and belongs to coach
				const program = await db.program.findFirst({
					where: {
						id: input.programId,
						coachId: user.id,
					},
				})

				if (!program) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Program not found",
					})
				}

				// Verify all clients belong to this coach
				const clients = await db.client.findMany({
					where: {
						id: { in: input.clientIds },
						coachId: user.id,
					},
				})

				if (clients.length !== input.clientIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Some clients not found or don't belong to you",
					})
				}

				// Create assignments
				const assignments = []
				for (const clientId of input.clientIds) {
					const assignment = await db.programAssignment.create({
						data: {
							programId: input.programId,
							clientId,
							startDate: input.startDate || new Date(),
						},
					})
					assignments.push(assignment)
				}

				return assignments
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
				const { getUser } = getKindeServerSession()
				const user = await getUser()

				if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

				// Verify user is a COACH
				const coach = await db.user.findFirst({
					where: { id: user.id, role: "COACH" },
				})

				if (!coach) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only coaches can delete weeks",
					})
				}

				// Verify program exists and belongs to coach
				const program = await db.program.findFirst({
					where: {
						id: input.programId,
						coachId: user.id,
					},
				})

				if (!program) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Program not found",
					})
				}

				// Find the week
				const week = await db.programWeek.findFirst({
					where: {
						programId: input.programId,
						weekNumber: input.weekNumber,
					},
				})

				if (!week) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Week not found",
					})
				}

				// Delete the week (this will cascade delete all days and exercises)
				await db.programWeek.delete({
					where: { id: week.id },
				})

				return { success: true }
			}),
	}),

	// Library Resources
	libraryResources: router({
		getAll: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()

			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			// Get all library resources for the coach
			const resources = await db.libraryResource.findMany({
				where: {
					coachId: user.id,
				},
				orderBy: {
					createdAt: "desc",
				},
			})

			return resources
		}),

		getCategories: publicProcedure.query(async () => {
			const { getUser } = getKindeServerSession()
			const user = await getUser()

			if (!user?.id) throw new TRPCError({ code: "UNAUTHORIZED" })

			// Get unique categories with counts
			const categories = await db.libraryResource.groupBy({
				by: ["category"],
				where: {
					coachId: user.id,
				},
				_count: {
					category: true,
				},
			})

			return categories.map((cat) => ({
				name: cat.category,
				count: cat._count.category,
			}))
		}),
	}),
})

export type AppRouter = typeof appRouter
