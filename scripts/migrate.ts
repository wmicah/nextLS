#!/usr/bin/env tsx

import { PrismaClient } from "../generated/prisma"
import { execSync } from "child_process"
import { logger } from "../src/lib/logger"

const prisma = new PrismaClient()

interface MigrationResult {
	success: boolean
	message: string
	error?: string
}

async function runMigrations(): Promise<MigrationResult> {
	try {
		logger.info("Starting database migration process...")

		// Check database connection
		await prisma.$connect()
		logger.info("Database connection established")

		// Run Prisma migrations
		logger.info("Running Prisma migrations...")
		execSync("npx prisma migrate deploy", { stdio: "inherit" })

		// Generate Prisma client
		logger.info("Generating Prisma client...")
		execSync("npx prisma generate", { stdio: "inherit" })

		// Verify database schema
		logger.info("Verifying database schema...")
		await prisma.$queryRaw`SELECT 1`

		logger.info("Database migration completed successfully")

		return {
			success: true,
			message: "Database migration completed successfully",
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error"
		logger.error("Database migration failed", error as Error)

		return {
			success: false,
			message: "Database migration failed",
			error: errorMessage,
		}
	} finally {
		await prisma.$disconnect()
	}
}

async function rollbackMigration(): Promise<MigrationResult> {
	try {
		logger.info("Starting migration rollback...")

		// Get the last migration
		const migrations = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" 
      ORDER BY finished_at DESC 
      LIMIT 1
    `

		if (!migrations || (migrations as any[]).length === 0) {
			return {
				success: false,
				message: "No migrations to rollback",
			}
		}

		const lastMigration = (migrations as any[])[0]
		logger.info(`Rolling back migration: ${lastMigration.migration_name}`)

		// Note: Prisma doesn't support automatic rollbacks
		// This would require manual SQL execution or using a tool like Flyway
		logger.warn(
			"Automatic rollback not supported. Manual intervention required."
		)

		return {
			success: false,
			message: "Rollback requires manual intervention",
			error: "Prisma doesn't support automatic rollbacks",
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error"
		logger.error("Migration rollback failed", error as Error)

		return {
			success: false,
			message: "Migration rollback failed",
			error: errorMessage,
		}
	}
}

async function checkMigrationStatus(): Promise<void> {
	try {
		logger.info("Checking migration status...")

		const migrations = await prisma.$queryRaw`
      SELECT 
        migration_name,
        started_at,
        finished_at,
        CASE 
          WHEN finished_at IS NULL THEN 'PENDING'
          ELSE 'COMPLETED'
        END as status
      FROM "_prisma_migrations" 
      ORDER BY started_at DESC
    `

		console.log("\nMigration Status:")
		console.log("==================")

		;(migrations as any[]).forEach((migration: any) => {
			const status = migration.status === "COMPLETED" ? "✅" : "⏳"
			const date = migration.finished_at || migration.started_at
			console.log(
				`${status} ${migration.migration_name} - ${date} (${migration.status})`
			)
		})

		console.log("")
	} catch (error) {
		logger.error("Failed to check migration status", error as Error)
	}
}

async function main() {
	const command = process.argv[2]

	switch (command) {
		case "migrate":
			const result = await runMigrations()
			if (result.success) {
				console.log(`✅ ${result.message}`)
				process.exit(0)
			} else {
				console.error(`❌ ${result.message}: ${result.error}`)
				process.exit(1)
			}
			break

		case "rollback":
			const rollbackResult = await rollbackMigration()
			if (rollbackResult.success) {
				console.log(`✅ ${rollbackResult.message}`)
				process.exit(0)
			} else {
				console.error(`❌ ${rollbackResult.message}: ${rollbackResult.error}`)
				process.exit(1)
			}
			break

		case "status":
			await checkMigrationStatus()
			break

		default:
			console.log(`
Database Migration Script

Usage:
  npm run migrate:deploy    - Run pending migrations
  npm run migrate:status   - Check migration status
  npm run migrate:rollback - Rollback last migration (manual)

Commands:
  migrate  - Run all pending migrations
  status   - Show migration status
  rollback - Attempt to rollback last migration
      `)
			break
	}
}

// Handle process termination
process.on("SIGINT", async () => {
	logger.info("Migration process interrupted")
	await prisma.$disconnect()
	process.exit(0)
})

process.on("SIGTERM", async () => {
	logger.info("Migration process terminated")
	await prisma.$disconnect()
	process.exit(0)
})

// Run the script
main().catch(async (error) => {
	logger.error("Migration script failed", error)
	await prisma.$disconnect()
	process.exit(1)
})
