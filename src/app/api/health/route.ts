import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "../../../../generated/prisma"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
	// During build time or when DATABASE_URL is not available, return a simple response
	if (!process.env.DATABASE_URL) {
		return new NextResponse(
			JSON.stringify({
				status: "healthy",
				timestamp: new Date().toISOString(),
				message:
					"Health check endpoint available (database connection not configured)",
				buildTime: true,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-cache, no-store, must-revalidate",
				},
			}
		)
	}

	// Only import logger and Prisma when we have environment variables
	const { logger } = await import("@/lib/logger")
	const prisma = new PrismaClient()
	const startTime = Date.now()
	const requestId = request.headers.get("x-request-id") || `req_${Date.now()}`

	try {
		logger.info("Health check request received", {
			requestId,
			path: "/api/health",
		})

		// Check database connectivity
		let dbStatus = "unknown"
		let dbResponseTime = 0

		try {
			const dbStartTime = Date.now()
			await prisma.$connect()
			await prisma.$queryRaw`SELECT 1 as health_check`
			await prisma.$disconnect()
			dbResponseTime = Date.now() - dbStartTime
			dbStatus = "healthy"
		} catch (error) {
			dbStatus = "unhealthy"
			logger.error("Database health check failed", error as Error, {
				requestId,
			})
		}

		// Check memory usage
		const memUsage = process.memoryUsage()
		const memUsageMB = {
			rss: Math.round(memUsage.rss / 1024 / 1024),
			heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
			heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
			external: Math.round(memUsage.external / 1024 / 1024),
		}

		// Check uptime
		const uptime = process.uptime()
		const uptimeHours = Math.round(uptime / 3600)

		// Determine overall health
		const isHealthy = dbStatus === "healthy"
		const status = isHealthy ? "healthy" : "unhealthy"

		const responseTime = Date.now() - startTime

		const healthData = {
			status,
			timestamp: new Date().toISOString(),
			uptime: {
				seconds: Math.round(uptime),
				hours: uptimeHours,
				formatted: `${uptimeHours}h ${Math.round((uptime % 3600) / 60)}m`,
			},
			database: {
				status: dbStatus,
				responseTime: dbResponseTime,
			},
			memory: memUsageMB,
			system: {
				nodeVersion: process.version,
				platform: process.platform,
				arch: process.arch,
				pid: process.pid,
			},
			response: {
				time: responseTime,
				requestId,
			},
		}

		// Log the health check
		logger.info("Health check completed", {
			requestId,
			status,
			responseTime,
			dbStatus,
			dbResponseTime,
		})

		// Set appropriate status code
		const statusCode = isHealthy ? 200 : 503

		return NextResponse.json(healthData, {
			status: statusCode,
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				"X-Request-ID": requestId,
				"X-Response-Time": responseTime.toString(),
			},
		})
	} catch (error) {
		logger.error("Health check endpoint error", error as Error, { requestId })

		return NextResponse.json(
			{
				status: "error",
				timestamp: new Date().toISOString(),
				message: "Health check failed",
				requestId,
			},
			{
				status: 500,
				headers: {
					"X-Request-ID": requestId,
				},
			}
		)
	}
}

// Health check for load balancers (simple ping)
export async function HEAD() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Cache-Control": "no-cache, no-store, must-revalidate",
		},
	})
}
