import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { captureError, captureMetric, timeAsyncFunction } from "./monitoring"
import { validateCsrfToken } from "./validation"

// API response types
export interface ApiResponse<T = any> {
	success: boolean
	data?: T
	error?: string
	message?: string
	timestamp: string
	requestId: string
}

export interface ApiError extends ApiResponse {
	success: false
	error: string
	code?: string
	details?: any
}

export interface ApiSuccess<T> extends ApiResponse<T> {
	success: true
	data: T
}

// Create standardized API responses
export function createApiResponse<T>(data: T): ApiSuccess<T> {
	return {
		success: true,
		data,
		timestamp: new Date().toISOString(),
		requestId: crypto.randomUUID(),
	}
}

export function createApiError(
	error: string,
	code?: string,
	details?: any
): ApiError {
	return {
		success: false,
		error,
		code,
		details,
		timestamp: new Date().toISOString(),
		requestId: crypto.randomUUID(),
	}
}

// Secure API handler wrapper
export function withApiSecurity<T extends any[]>(
	handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
	return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
		const startTime = Date.now()
		const requestId = crypto.randomUUID()

		try {
			// Add request ID to headers for tracking
			req.headers.set("X-Request-ID", requestId)

			// Validate request method
			const allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"]
			if (!allowedMethods.includes(req.method)) {
				return NextResponse.json(
					createApiError("Method not allowed", "METHOD_NOT_ALLOWED"),
					{ status: 405 }
				)
			}

			// Check content type for POST/PUT requests
			if (["POST", "PUT", "PATCH"].includes(req.method)) {
				const contentType = req.headers.get("content-type")
				if (!contentType?.includes("application/json")) {
					return NextResponse.json(
						createApiError("Invalid content type", "INVALID_CONTENT_TYPE"),
						{ status: 400 }
					)
				}
			}

			// Validate CSRF token for state-changing operations
			if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
				const csrfToken = req.headers.get("X-CSRF-Token")
				if (csrfToken) {
					// In production, validate against stored token
					// For now, we'll just check if it exists
					if (!csrfToken || csrfToken.length < 32) {
						return NextResponse.json(
							createApiError("Invalid CSRF token", "INVALID_CSRF_TOKEN"),
							{ status: 403 }
						)
					}
				}
			}

			// Execute the handler with timing
			const response = await timeAsyncFunction(
				`api-${req.nextUrl.pathname}`,
				() => handler(req, ...args)
			)

			// Capture API performance metrics
			const duration = Date.now() - startTime
			captureMetric(`api-${req.nextUrl.pathname}`, duration, "ms")

			return response
		} catch (error) {
			// Capture error in monitoring
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error"
			captureError(errorMessage, {
				requestId,
				url: req.nextUrl.pathname,
				method: req.method,
				error: error instanceof Error ? error : undefined,
			})

			// Return error response
			return NextResponse.json(
				createApiError(
					"Internal server error",
					"INTERNAL_ERROR",
					process.env.NODE_ENV === "development"
						? { error: errorMessage }
						: undefined
				),
				{ status: 500 }
			)
		}
	}
}

// Input validation wrapper
export function withValidation<T>(
	schema: z.ZodSchema<T>,
	handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
) {
	return async (req: NextRequest): Promise<NextResponse> => {
		try {
			let data: T

			if (req.method === "GET") {
				// Parse query parameters
				const url = new URL(req.url)
				const queryParams: Record<string, string> = {}
				url.searchParams.forEach((value, key) => {
					queryParams[key] = value
				})
				data = schema.parse(queryParams)
			} else {
				// Parse request body
				const body = await req.json()
				data = schema.parse(body)
			}

			return handler(req, data)
		} catch (error) {
			if (error instanceof z.ZodError) {
				return NextResponse.json(
					createApiError("Validation failed", "VALIDATION_ERROR", {
						details: error.issues,
					}),
					{ status: 400 }
				)
			}
			throw error
		}
	}
}

// Higher-order validation wrapper for use with withApiHandlers
export function withValidationSchema<T>(schema: z.ZodSchema<T>) {
	return (handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>) => {
		return withValidation(schema, handler);
	};
}

// Rate limiting wrapper
export function withRateLimit(
	limit: number,
	windowMs: number,
	handler: (req: NextRequest) => Promise<NextResponse>
) {
	return async (req: NextRequest): Promise<NextResponse> => {
		const ip =
			req.headers.get("x-forwarded-for") ||
			req.headers.get("x-real-ip") ||
			req.headers.get("cf-connecting-ip") ||
			"unknown"
		const key = `rate_limit:${ip}:${req.nextUrl.pathname}`

		// Simple in-memory rate limiting (use Redis in production)
		const now = Date.now()
		const rateLimitStore = (globalThis as any).rateLimitStore as
			| Map<string, { count: number; resetTime: number }>
			| undefined
		const stored = rateLimitStore?.get(key)

		if (!stored || now > stored.resetTime) {
			if (rateLimitStore) {
				rateLimitStore.set(key, {
					count: 1,
					resetTime: now + windowMs,
				})
			}
		} else if (stored.count >= limit) {
			return NextResponse.json(
				createApiError("Rate limit exceeded", "RATE_LIMIT_EXCEEDED"),
				{
					status: 429,
					headers: {
						"Retry-After": Math.ceil(windowMs / 1000).toString(),
						"X-RateLimit-Limit": limit.toString(),
						"X-RateLimit-Remaining": "0",
						"X-RateLimit-Reset": new Date(stored.resetTime).toISOString(),
					},
				}
			)
		} else {
			stored.count++
		}

		return handler(req)
	}
}

// Authentication wrapper
export function withAuth(
	handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
	return async (req: NextRequest): Promise<NextResponse> => {
		try {
			// Get authorization header
			const authHeader = req.headers.get("authorization")
			if (!authHeader?.startsWith("Bearer ")) {
				return NextResponse.json(
					createApiError("Unauthorized", "UNAUTHORIZED"),
					{ status: 401 }
				)
			}

			const token = authHeader.substring(7)

			// In production, validate JWT token here
			// For now, we'll just check if it exists
			if (!token || token.length < 10) {
				return NextResponse.json(
					createApiError("Invalid token", "INVALID_TOKEN"),
					{ status: 401 }
				)
			}

			// Extract user ID from token (in production, decode JWT)
			// For demo purposes, we'll use a placeholder
			const userId = "user_" + Date.now() // Replace with actual JWT decoding

			return handler(req, userId)
		} catch (error) {
			return NextResponse.json(
				createApiError("Authentication failed", "AUTH_FAILED"),
				{ status: 401 }
			)
		}
	}
}

// Combine multiple wrappers
export function withApiHandlers<T extends any[]>(
	handlers: Array<(handler: any) => any>,
	finalHandler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
	return handlers.reduceRight((acc, handler) => handler(acc), finalHandler)
}

// Example usage:
// export const GET = withApiHandlers(
//   [withApiSecurity, withRateLimit(100, 60000), withValidation(schema)],
//   async (req: NextRequest, data: ValidatedData) => {
//     // Your API logic here
//     return NextResponse.json(createApiResponse({ message: 'Success' }))
//   }
// )
