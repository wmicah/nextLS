#!/usr/bin/env tsx

import { PrismaClient } from "../generated/prisma"
import { logger } from "../src/lib/logger"

const prisma = new PrismaClient()

interface HealthCheckResult {
	status: "healthy" | "unhealthy" | "degraded"
	timestamp: string
	checks: {
		database: HealthCheck
		api: HealthCheck
		memory: HealthCheck
		uptime: HealthCheck
	}
	summary: string
}

interface HealthCheck {
	status: "pass" | "fail" | "warn"
	message: string
	details?: any
	responseTime?: number
}

async function checkDatabase(): Promise<HealthCheck> {
	const startTime = Date.now()

	try {
		await prisma.$connect()
		const result = await prisma.$queryRaw`SELECT 1 as health_check`
		await prisma.$disconnect()

		const responseTime = Date.now() - startTime

		return {
			status: "pass",
			message: "Database connection successful",
			details: { result },
			responseTime,
		}
	} catch (error) {
		const responseTime = Date.now() - startTime

		return {
			status: "fail",
			message: "Database connection failed",
			details: {
				error: error instanceof Error ? error.message : "Unknown error",
			},
			responseTime,
		}
	}
}

async function checkApi(): Promise<HealthCheck> {
	const startTime = Date.now()

	try {
		// Check if the app is responding (basic health check)
		const response = await fetch("http://localhost:3000/api/health", {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		})

		const responseTime = Date.now() - startTime

		if (response.ok) {
			return {
				status: "pass",
				message: "API endpoint responding",
				details: { statusCode: response.status },
				responseTime,
			}
		} else {
			return {
				status: "warn",
				message: "API endpoint responding with non-OK status",
				details: { statusCode: response.status },
				responseTime,
			}
		}
	} catch (error) {
		const responseTime = Date.now() - startTime

		return {
			status: "fail",
			message: "API endpoint not responding",
			details: {
				error: error instanceof Error ? error.message : "Unknown error",
			},
			responseTime,
		}
	}
}

function checkMemory(): HealthCheck {
	const memUsage = process.memoryUsage()
	const memUsageMB = {
		rss: Math.round(memUsage.rss / 1024 / 1024),
		heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
		heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
		external: Math.round(memUsage.external / 1024 / 1024),
	}

	// Warning if memory usage is high
	const totalMemory = memUsageMB.heapUsed + memUsageMB.external
	const memoryThreshold = 500 // 500MB

	if (totalMemory > memoryThreshold) {
		return {
			status: "warn",
			message: "High memory usage detected",
			details: memUsageMB,
		}
	}

	return {
		status: "pass",
		message: "Memory usage normal",
		details: memUsageMB,
	}
}

function checkUptime(): HealthCheck {
	const uptime = process.uptime()
	const uptimeHours = Math.round(uptime / 3600)

	if (uptimeHours > 24) {
		return {
			status: "pass",
			message: "System uptime normal",
			details: { uptimeHours, uptimeSeconds: Math.round(uptime) },
		}
	} else if (uptimeHours > 1) {
		return {
			status: "warn",
			message: "System recently restarted",
			details: { uptimeHours, uptimeSeconds: Math.round(uptime) },
		}
	} else {
		return {
			status: "warn",
			message: "System very recently started",
			details: { uptimeHours, uptimeSeconds: Math.round(uptime) },
		}
	}
}

async function runHealthCheck(): Promise<HealthCheckResult> {
	logger.info("Starting health check...")

	const [databaseCheck, apiCheck] = await Promise.all([
		checkDatabase(),
		checkApi(),
	])

	const memoryCheck = checkMemory()
	const uptimeCheck = checkUptime()

	const checks = {
		database: databaseCheck,
		api: apiCheck,
		memory: memoryCheck,
		uptime: uptimeCheck,
	}

	// Determine overall status
	const failedChecks = Object.values(checks).filter(
		(check) => check.status === "fail"
	)
	const warningChecks = Object.values(checks).filter(
		(check) => check.status === "warn"
	)

	let status: "healthy" | "unhealthy" | "degraded"
	let summary: string

	if (failedChecks.length > 0) {
		status = "unhealthy"
		summary = `System unhealthy: ${failedChecks.length} critical failures`
	} else if (warningChecks.length > 0) {
		status = "degraded"
		summary = `System degraded: ${warningChecks.length} warnings`
	} else {
		status = "healthy"
		summary = "All systems operational"
	}

	const result: HealthCheckResult = {
		status,
		timestamp: new Date().toISOString(),
		checks,
		summary,
	}

	return result
}

function printHealthCheck(result: HealthCheckResult): void {
	const { status, timestamp, checks, summary } = result

	console.log("\n🏥 Health Check Report")
	console.log("======================")
	console.log(`Status: ${status.toUpperCase()}`)
	console.log(`Time: ${timestamp}`)
	console.log(`Summary: ${summary}`)

	console.log("\n📊 Detailed Results:")
	console.log("-------------------")

	Object.entries(checks).forEach(([name, check]) => {
		const emoji =
			check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌"
		const statusText = check.status.toUpperCase()

		console.log(`${emoji} ${name.toUpperCase()}: ${statusText}`)
		console.log(`   Message: ${check.message}`)

		if (check.responseTime) {
			console.log(`   Response Time: ${check.responseTime}ms`)
		}

		if (check.details) {
			console.log(`   Details: ${JSON.stringify(check.details, null, 2)}`)
		}

		console.log("")
	})

	// Exit with appropriate code
	if (result.status === "unhealthy") {
		process.exit(1)
	} else if (result.status === "degraded") {
		process.exit(2)
	} else {
		process.exit(0)
	}
}

async function main() {
	try {
		const healthResult = await runHealthCheck()
		printHealthCheck(healthResult)
	} catch (error) {
		logger.error("Health check failed", error as Error)
		console.error("❌ Health check script failed:", error)
		process.exit(1)
	}
}

// Handle process termination
process.on("SIGINT", async () => {
	logger.info("Health check interrupted")
	await prisma.$disconnect()
	process.exit(0)
})

process.on("SIGTERM", async () => {
	logger.info("Health check terminated")
	await prisma.$disconnect()
	process.exit(0)
})

// Run the health check
main().catch(async (error) => {
	logger.error("Health check script failed", error)
	await prisma.$disconnect()
	process.exit(1)
})
