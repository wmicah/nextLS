import { config, isDevelopment, isProduction } from "./env"

export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogContext {
	[key: string]: unknown
}

export interface LogEntry {
	timestamp: string
	level: LogLevel
	message: string
	context?: LogContext
	error?: Error
	userId?: string
	requestId?: string
	path?: string
}

class Logger {
	private logLevel: LogLevel
	private isDevelopment: boolean

	constructor() {
		this.logLevel = (process.env.LOG_LEVEL as LogLevel) || "info"
		this.isDevelopment = isDevelopment
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: Record<LogLevel, number> = {
			debug: 0,
			info: 1,
			warn: 2,
			error: 3,
		}
		return levels[level] >= levels[this.logLevel]
	}

	private formatLog(entry: LogEntry): string {
		const {
			timestamp,
			level,
			message,
			context,
			error,
			userId,
			requestId,
			path,
		} = entry

		let logString = `[${timestamp}] ${level.toUpperCase()}: ${message}`

		if (userId) logString += ` | User: ${userId}`
		if (requestId) logString += ` | Request: ${requestId}`
		if (path) logString += ` | Path: ${path}`

		if (context && Object.keys(context).length > 0) {
			logString += ` | Context: ${JSON.stringify(context)}`
		}

		if (error) {
			logString += ` | Error: ${error.message}`
			if (this.isDevelopment && error.stack) {
				logString += `\nStack: ${error.stack}`
			}
		}

		return logString
	}

	private log(
		level: LogLevel,
		message: string,
		context?: LogContext,
		error?: Error,
		metadata?: { userId?: string; requestId?: string; path?: string }
	) {
		if (!this.shouldLog(level)) return

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context,
			error,
			...metadata,
		}

		const formattedLog = this.formatLog(entry)

		// Console logging for development
		if (this.isDevelopment) {
			const consoleMethod =
				level === "error" ? "error" : level === "warn" ? "warn" : "log"
			console[consoleMethod](formattedLog)
		}

		// Production logging (can be extended with external services)
		if (isProduction) {
			this.logToProduction(entry)
		}
	}

	private logToProduction(entry: LogEntry) {
		// TODO: Integrate with production logging services like:
		// - Sentry for error tracking
		// - DataDog for application monitoring
		// - CloudWatch for AWS environments
		// - LogRocket for session replay

		// For now, we'll use console.error for production errors
		if (entry.level === "error") {
			console.error(this.formatLog(entry))
		}
	}

	debug(
		message: string,
		context?: LogContext,
		metadata?: { userId?: string; requestId?: string; path?: string }
	) {
		this.log("debug", message, context, undefined, metadata)
	}

	info(
		message: string,
		context?: LogContext,
		metadata?: { userId?: string; requestId?: string; path?: string }
	) {
		this.log("info", message, context, undefined, metadata)
	}

	warn(
		message: string,
		context?: LogContext,
		metadata?: { userId?: string; requestId?: string; path?: string }
	) {
		this.log("warn", message, context, undefined, metadata)
	}

	error(
		message: string,
		error?: Error,
		context?: LogContext,
		metadata?: { userId?: string; requestId?: string; path?: string }
	) {
		this.log("error", message, context, error, metadata)
	}

	// Convenience methods for common scenarios
	logApiRequest(
		method: string,
		path: string,
		statusCode: number,
		duration: number,
		userId?: string,
		requestId?: string
	) {
		const level =
			statusCode >= 400 ? "error" : statusCode >= 300 ? "warn" : "info"
		const message = `${method} ${path} - ${statusCode} (${duration}ms)`

		this.log(
			level,
			message,
			{ method, path, statusCode, duration },
			undefined,
			{ userId, requestId, path }
		)
	}

	logDatabaseQuery(
		operation: string,
		table: string,
		duration: number,
		userId?: string
	) {
		const level = duration > 1000 ? "warn" : "debug"
		const message = `DB ${operation} on ${table} (${duration}ms)`

		this.log(level, message, { operation, table, duration }, undefined, {
			userId,
		})
	}

	logUserAction(
		action: string,
		userId: string,
		details?: unknown,
		path?: string
	) {
		this.info(`User action: ${action}`, { action, details }, { userId, path })
	}
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export const logDebug = logger.debug.bind(logger)
export const logInfo = logger.info.bind(logger)
export const logWarn = logger.warn.bind(logger)
export const logError = logger.error.bind(logger)
export const logApiRequest = logger.logApiRequest.bind(logger)
export const logDatabaseQuery = logger.logDatabaseQuery.bind(logger)
export const logUserAction = logger.logUserAction.bind(logger)
