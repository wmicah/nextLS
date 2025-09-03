import { z } from "zod"
import DOMPurify from "isomorphic-dompurify"

// Base validation schemas
export const emailSchema = z
	.string()
	.email("Invalid email address")
	.min(1, "Email is required")
	.max(254, "Email is too long")
	.transform((email) => email.toLowerCase().trim())

export const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(128, "Password is too long")
	.regex(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
		"Password must contain at least one lowercase letter, one uppercase letter, and one number"
	)
	.regex(
		/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/,
		"Password contains invalid characters"
	)

export const nameSchema = z
	.string()
	.min(1, "Name is required")
	.max(100, "Name is too long")
	.regex(/^[a-zA-Z\s\-']+$/, "Name contains invalid characters")
	.transform((name) => name.trim())

export const phoneSchema = z
	.string()
	.regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format")
	.transform((phone) => phone.replace(/[\s\-\(\)]/g, ""))

// Sanitization functions
export function sanitizeHtml(html: string): string {
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
		ALLOWED_ATTR: ["href", "target"],
		ALLOW_DATA_ATTR: false,
	})
}

export function sanitizeText(text: string): string {
	return text
		.replace(/[<>]/g, "") // Remove potential HTML tags
		.replace(/javascript:/gi, "") // Remove javascript: protocol
		.replace(/on\w+=/gi, "") // Remove event handlers
		.trim()
}

export function sanitizeUrl(url: string): string {
	try {
		const parsed = new URL(url)
		// Only allow http and https protocols
		if (!["http:", "https:"].includes(parsed.protocol)) {
			throw new Error("Invalid protocol")
		}
		return parsed.toString()
	} catch {
		return ""
	}
}

// CSRF token validation
export function validateCsrfToken(token: string, storedToken: string): boolean {
	if (!token || !storedToken) return false

	// Use timing-safe comparison to prevent timing attacks
	if (token.length !== storedToken.length) return false

	let result = 0
	for (let i = 0; i < token.length; i++) {
		result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i)
	}

	return result === 0
}

// Rate limiting validation
export function validateRateLimit(
	identifier: string,
	limit: number,
	windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
	const now = Date.now()
	const key = `rate_limit:${identifier}`

	// In production, use Redis or similar for distributed rate limiting
	const rateLimitStore = (globalThis as any).rateLimitStore as
		| Map<string, { count: number; resetTime: number }>
		| undefined
	const stored = rateLimitStore?.get(key)

	if (!stored || now > stored.resetTime) {
		const newRecord = {
			count: 1,
			resetTime: now + windowMs,
		}
		if (rateLimitStore) {
			rateLimitStore.set(key, newRecord)
		}

		return {
			allowed: true,
			remaining: limit - 1,
			resetTime: newRecord.resetTime,
		}
	}

	if (stored.count >= limit) {
		return {
			allowed: false,
			remaining: 0,
			resetTime: stored.resetTime,
		}
	}

	stored.count++
	return {
		allowed: true,
		remaining: limit - stored.count,
		resetTime: stored.resetTime,
	}
}

// File upload validation
export const fileUploadSchema = z.object({
	name: z.string().min(1).max(255),
	size: z.number().max(10 * 1024 * 1024), // 10MB max
	type: z.string().refine((type) => {
		const allowedTypes = [
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp",
			"application/pdf",
			"text/plain",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		]
		return allowedTypes.includes(type)
	}, "File type not allowed"),
})

// API request validation
export const apiRequestSchema = z.object({
	method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
	headers: z.record(z.string(), z.string()),
	body: z.any().optional(),
	query: z.record(z.string(), z.string()).optional(),
})

// User input validation
export const userInputSchema = z.object({
	email: emailSchema,
	password: passwordSchema.optional(),
	firstName: nameSchema,
	lastName: nameSchema,
	phone: phoneSchema.optional(),
	role: z.enum(["coach", "client", "visitor"]).optional(),
})

// Message validation
export const messageSchema = z.object({
	content: z
		.string()
		.min(1, "Message cannot be empty")
		.max(1000, "Message is too long"),
	recipientId: z.string().uuid("Invalid recipient ID"),
	attachments: z.array(fileUploadSchema).optional(),
})

// Program validation
export const programSchema = z.object({
	name: z
		.string()
		.min(1, "Program name is required")
		.max(200, "Program name is too long"),
	description: z.string().max(2000, "Description is too long"),
	duration: z.number().positive("Duration must be positive"),
	difficulty: z.enum(["beginner", "intermediate", "advanced"]),
	exercises: z
		.array(z.string().uuid())
		.min(1, "At least one exercise is required"),
})

// Export types
export type EmailInput = z.infer<typeof emailSchema>
export type PasswordInput = z.infer<typeof passwordSchema>
export type NameInput = z.infer<typeof nameSchema>
export type PhoneInput = z.infer<typeof phoneSchema>
export type UserInput = z.infer<typeof userInputSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type ProgramInput = z.infer<typeof programSchema>
export type FileUpload = z.infer<typeof fileUploadSchema>
export type ApiRequest = z.infer<typeof apiRequestSchema>
