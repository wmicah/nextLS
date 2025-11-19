/**
 * Debug Logger Utility
 * Replaces console.log with proper logging that can be disabled in production
 * 
 * Benefits:
 * - Users don't see debug logs in production
 * - Important info still captured via monitoring service
 * - Development debugging still works
 * - Easy to find and remove temporary logs
 * 
 * Usage:
 *   import { debugLog, infoLog, warnLog } from "@/lib/debug-logger";
 *   
 *   // Instead of: console.log("User clicked button", data)
 *   debugLog("User clicked button", data);
 *   
 *   // For important info that should be tracked
 *   infoLog("Client request accepted", { clientId, coachId });
 *   
 *   // For warnings
 *   warnLog("Large payload detected", { size: payloadSize });
 */

import { captureAction, captureData, captureWarning } from "./monitoring";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Debug log - only shows in development, uses monitoring in production
 * Use this for temporary debugging that you want to remove later
 */
export function debugLog(message: string, data?: any) {
  if (isDevelopment) {
    // Only log in development - users won't see this
    console.log(`[DEBUG] ${message}`, data || "");
  } else {
    // In production, silently capture via monitoring (no console output)
    captureData(`debug:${message}`, data);
  }
}

/**
 * Info log - for informational messages you want to track
 * Use this for important events that should be logged
 */
export function infoLog(message: string, data?: any) {
  if (isDevelopment) {
    console.log(`[INFO] ${message}`, data || "");
  } else {
    // In production, capture via monitoring service
    captureAction("info_log", "system", { message, data });
  }
}

/**
 * Warning log - for warnings that should be tracked
 * Use this instead of console.warn
 */
export function warnLog(message: string, data?: any) {
  if (isDevelopment) {
    console.warn(`[WARN] ${message}`, data || "");
  } else {
    // In production, capture via monitoring service
    captureWarning(message, data);
  }
}

/**
 * Error log - for errors (use this instead of console.error for non-critical errors)
 * For critical errors, still use console.error or throw Error
 */
export function errorLog(message: string, error?: Error | any, data?: any) {
  if (isDevelopment) {
    console.error(`[ERROR] ${message}`, error || "", data || "");
  } else {
    // In production, capture via monitoring service
    const errorInfo = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    captureWarning(message, { error: errorInfo, ...data });
  }
}

