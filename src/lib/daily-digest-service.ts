import { db } from "@/db";
import { CompleteEmailService } from "./complete-email-service";

/**
 * Daily Digest Service
 * Sends daily email summaries to users with unread messages
 */
class DailyDigestService {
  private static instance: DailyDigestService;
  private emailService: CompleteEmailService;

  private constructor() {
    this.emailService = CompleteEmailService.getInstance();
  }

  public static getInstance(): DailyDigestService {
    if (!DailyDigestService.instance) {
      DailyDigestService.instance = new DailyDigestService();
    }
    return DailyDigestService.instance;
  }

  /**
   * Send daily digest emails to users with unread messages
   */
  async sendDailyDigests(): Promise<void> {
    try {

      // Get all users
      const allUsers = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      // Filter users who have email addresses
      const usersWithEmail = allUsers.filter(user => user.email !== null);

      // Filter users who have unread messages
      const usersWithUnreadMessages = [];
      for (const user of usersWithEmail) {
        const unreadCount = await this.getUnreadMessageCount(user.id);
        if (unreadCount > 0) {
          usersWithUnreadMessages.push(user);
        }
      }


      let emailsSent = 0;
      let emailsFailed = 0;

      for (const user of usersWithUnreadMessages) {
        try {
          // Get unread message count for this user
          const unreadCount = await this.getUnreadMessageCount(user.id);

          if (unreadCount > 0) {
            // Send daily digest email
            await this.emailService.sendDailyDigest(
              user.email!,
              user.name || "User",
              unreadCount
            );

            emailsSent++;
          }
        } catch (error) {
          emailsFailed++;
          console.error(
            `❌ Failed to send daily digest to ${user.email}:`,
            error
          );
        }
      }

    } catch (error) {
      console.error("❌ Error in daily digest service:", error);
    }
  }

  /**
   * Get unread message count for a user
   */
  private async getUnreadMessageCount(userId: string): Promise<number> {
    const count = await db.message.count({
      where: {
        isRead: false,
        senderId: { not: userId },
        conversation: {
          OR: [{ clientId: userId }, { coachId: userId }],
        },
      },
    });

    return count;
  }

  /**
   * Manual trigger for testing
   */
  async manualDigest(): Promise<void> {
    await this.sendDailyDigests();
  }
}

export default DailyDigestService.getInstance();
