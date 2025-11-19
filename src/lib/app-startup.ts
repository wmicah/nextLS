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

      // Start lesson reminder service
      lessonReminderService.start();

      this.isInitialized = true;
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
