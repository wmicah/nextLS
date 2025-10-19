import lessonReminderService from "./lesson-reminder-service";

/**
 * App Startup Service
 * Handles initialization of background services when the app starts
 */
class AppStartupService {
  private static instance: AppStartupService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): AppStartupService {
    if (!AppStartupService.instance) {
      AppStartupService.instance = new AppStartupService();
    }
    return AppStartupService.instance;
  }

  /**
   * Initialize all background services
   */
  async initializeServices(): Promise<void> {
    if (this.isInitialized) {
      console.log("🚀 Services already initialized");
      return;
    }

    try {
      console.log("🚀 Initializing app services...");

      // Start lesson reminder service
      lessonReminderService.start();
      console.log("✅ Lesson reminder service started");

      this.isInitialized = true;
      console.log("🎉 All services initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize services:", error);
      throw error;
    }
  }

  /**
   * Get initialization status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      services: {
        lessonReminder: lessonReminderService.getStatus(),
      },
    };
  }
}

export default AppStartupService.getInstance();
