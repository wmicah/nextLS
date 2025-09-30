import lessonReminderService from "./lesson-reminder-service";

/**
 * Production-ready startup script for the lesson reminder service
 * This ensures the service starts reliably even in production environments
 */

let startupAttempts = 0;
const MAX_STARTUP_ATTEMPTS = 3;

export async function initializeLessonReminderService() {
  try {
    console.log("🚀 Initializing lesson reminder service...");

    // Start the service
    lessonReminderService.start();

    // Wait a moment for the service to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the service is running
    const status = lessonReminderService.getStatus();

    if (status.isRunning) {
      console.log("✅ Lesson reminder service started successfully");
      startupAttempts = 0; // Reset counter on success
      return true;
    } else {
      throw new Error("Service failed to start");
    }
  } catch (error) {
    startupAttempts++;
    console.error(
      `❌ Failed to start lesson reminder service (attempt ${startupAttempts}/${MAX_STARTUP_ATTEMPTS}):`,
      error
    );

    if (startupAttempts < MAX_STARTUP_ATTEMPTS) {
      console.log(`🔄 Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return initializeLessonReminderService();
    } else {
      console.error(
        "💥 Failed to start lesson reminder service after maximum attempts"
      );
      return false;
    }
  }
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown() {
  const shutdownHandler = () => {
    console.log("🛑 Shutting down lesson reminder service gracefully...");
    lessonReminderService.stop();
    process.exit(0);
  };

  // Handle various shutdown signals
  process.on("SIGTERM", shutdownHandler);
  process.on("SIGINT", shutdownHandler);
  process.on("SIGUSR2", shutdownHandler); // For nodemon restarts

  console.log("🔄 Graceful shutdown handlers configured");
}

/**
 * Health check function for production monitoring
 */
export function getServiceHealth() {
  return lessonReminderService.getHealth();
}

/**
 * Auto-restart service if it stops unexpectedly
 */
export function setupAutoRestart() {
  setInterval(() => {
    const status = lessonReminderService.getStatus();

    if (!status.isRunning && startupAttempts < MAX_STARTUP_ATTEMPTS) {
      console.log("🔄 Service stopped unexpectedly, attempting restart...");
      initializeLessonReminderService();
    }
  }, 30000); // Check every 30 seconds

  console.log("🔄 Auto-restart monitoring configured");
}

// Initialize everything when this module is imported
if (typeof window === "undefined") {
  // Only run on server side
  initializeLessonReminderService();
  setupGracefulShutdown();
  setupAutoRestart();
}









