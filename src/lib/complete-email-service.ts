// NextLevel Coaching - Complete Email Service
// Handles all email notifications for the coaching platform

import { Resend } from "resend";
import { completeEmailTemplates } from "./complete-email-templates";
import { db } from "@/db";

export class CompleteEmailService {
  private static instance: CompleteEmailService;
  private fromEmail = "NextLevel Coaching <noreply@nxlvlcoach.com>";
  private resendInstance: Resend | null = null;

  // Rate limiting for message notifications (24 hours)
  private messageNotificationCooldown = new Map<string, number>();
  private readonly MESSAGE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  // Lazy initialization of Resend - only when needed and API key is available
  private getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY not configured - cannot send emails");
      return null;
    }

    if (!this.resendInstance) {
      this.resendInstance = new Resend(process.env.RESEND_API_KEY);
    }

    return this.resendInstance;
  }

  // Helper method to safely send emails with error handling
  private async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    from?: string
  ): Promise<{ success: boolean; error?: any }> {
    const resend = this.getResend();
    if (!resend) {
      return { success: false, error: "RESEND_API_KEY not configured" };
    }

    try {
      const result = await resend.emails.send({
        from: from || this.fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });

      if (result.error) {
        console.error("❌ Resend API error:", result.error);
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      return { success: false, error };
    }
  }

  public static getInstance(): CompleteEmailService {
    if (!CompleteEmailService.instance) {
      CompleteEmailService.instance = new CompleteEmailService();
    }
    return CompleteEmailService.instance;
  }

  // Check if user has email notifications enabled
  private async checkEmailNotificationsEnabled(
    userId: string
  ): Promise<boolean> {
    try {
      const userSettings = await db.userSettings.findUnique({
        where: { userId },
        select: { emailNotifications: true },
      });

      // Default to true if no settings found
      return userSettings?.emailNotifications ?? true;
    } catch (error) {
      console.error("Error checking email notification preferences:", error);
      // Default to true on error to avoid blocking notifications
      return true;
    }
  }

  // 1. CLIENT ONBOARDING & WELCOME
  async sendWelcomeEmail(
    clientEmail: string,
    clientName: string,
    coachName: string,
    clientUserId?: string
  ): Promise<boolean> {
    try {
      // Check if client has email notifications enabled
      if (clientUserId) {
        const emailEnabled = await this.checkEmailNotificationsEnabled(
          clientUserId
        );
        if (!emailEnabled) {
          console.log(
            `Email notifications disabled for user ${clientUserId}, skipping welcome email`
          );
          return false;
        }
      }

      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.welcomeClient(
        clientName,
        coachName
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [clientEmail],
        subject: template.subject,
        html: template.html,
      });

      if (result.error) {
        console.error("❌ Failed to send welcome email:", result.error);
        return false;
      }

      console.log("✅ Welcome email sent successfully:", result.data?.id);
      return true;
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      return false;
    }
  }

  // 2. COACH NOTIFICATIONS
  async sendNewClientRequest(
    coachEmail: string,
    coachName: string,
    clientName: string,
    clientEmail: string,
    coachUserId?: string
  ): Promise<boolean> {
    try {
      // Check if coach has email notifications enabled
      if (coachUserId) {
        const emailEnabled = await this.checkEmailNotificationsEnabled(
          coachUserId
        );
        if (!emailEnabled) {
          console.log(
            `Email notifications disabled for coach ${coachUserId}, skipping new client request email`
          );
          return false;
        }
      }

      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.newClientRequest(
        coachName,
        clientName,
        clientEmail
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [coachEmail],
        subject: template.subject,
        html: template.html,
      });

      if (result.error) {
        console.error("❌ Failed to send new client request email:", result.error);
        return false;
      }

      console.log("✅ New client request email sent successfully:", result.data?.id);
      return true;
    } catch (error) {
      console.error("Failed to send new client request email:", error);
      return false;
    }
  }

  // 3. LESSON & SCHEDULE NOTIFICATIONS
  async sendScheduleExchangeRequest(
    coachEmail: string,
    coachName: string,
    clientName: string,
    oldLessonDate: string,
    oldLessonTime: string,
    newRequestedDate: string,
    newRequestedTime: string,
    reason: string | undefined,
    coachUserId?: string
  ): Promise<boolean> {
    try {
      // Check if RESEND_API_KEY is configured
      if (!process.env.RESEND_API_KEY) {
        console.error("❌ RESEND_API_KEY not configured - cannot send email");
        return false;
      }

      // Check if coach has email notifications enabled
      if (coachUserId) {
        const emailEnabled = await this.checkEmailNotificationsEnabled(
          coachUserId
        );
        if (!emailEnabled) {
          console.log(
            `📧 Email notifications disabled for coach ${coachUserId}, skipping schedule exchange request email`
          );
          return false;
        }
      }

      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.scheduleExchangeRequest(
        coachName,
        clientName,
        oldLessonDate,
        oldLessonTime,
        newRequestedDate,
        newRequestedTime,
        reason
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [coachEmail],
        subject: template.subject,
        html: template.html,
      });

      if (result.error) {
        console.error("❌ Failed to send schedule exchange request email:", result.error);
        return false;
      }

      console.log("✅ Schedule exchange request email sent successfully:", result.data?.id);
      return true;
    } catch (error) {
      console.error("❌ Failed to send schedule exchange request email:", error);
      return false;
    }
  }

  async sendLessonReminder(
    clientEmail: string,
    clientName: string,
    coachName: string,
    lessonDate: string,
    lessonTime: string,
    clientUserId?: string
  ): Promise<boolean> {
    try {
      // Check if RESEND_API_KEY is configured
      if (!process.env.RESEND_API_KEY) {
        console.error("❌ RESEND_API_KEY not configured - cannot send email");
        return false;
      }

      // Check if client has email notifications enabled
      if (clientUserId) {
        const emailEnabled = await this.checkEmailNotificationsEnabled(
          clientUserId
        );
        if (!emailEnabled) {
          console.log(
            `📧 Email notifications disabled for user ${clientUserId}, skipping lesson reminder email`
          );
          return false;
        }
      }

      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.lessonReminder(
        clientName,
        coachName,
        lessonDate,
        lessonTime
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [clientEmail],
        subject: template.subject,
        html: template.html,
      });

      if (result.error) {
        console.error("❌ Failed to send lesson reminder email:", result.error);
        return false;
      }

      console.log("✅ Lesson reminder email sent successfully:", result.data?.id);
      return true;
    } catch (error) {
      console.error("❌ Failed to send lesson reminder email:", error);
      return false;
    }
  }

  async sendLessonScheduled(
    clientEmail: string,
    clientName: string,
    coachName: string,
    lessonDate: string,
    lessonTime: string,
    clientUserId?: string
  ): Promise<boolean> {
    try {
      // Check if RESEND_API_KEY is configured
      if (!process.env.RESEND_API_KEY) {
        console.error("❌ RESEND_API_KEY not configured - cannot send email");
        return false;
      }

      // Check if client has email notifications enabled
      if (clientUserId) {
        const emailEnabled = await this.checkEmailNotificationsEnabled(
          clientUserId
        );
        if (!emailEnabled) {
          console.log(
            `📧 Email notifications disabled for user ${clientUserId}, skipping lesson scheduled email`
          );
          return false;
        }
      }

      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.lessonScheduled(
        clientName,
        coachName,
        lessonDate,
        lessonTime
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [clientEmail],
        subject: template.subject,
        html: template.html,
      });

      if (result.error) {
        console.error("❌ Failed to send lesson scheduled email:", result.error);
        return false;
      }

      console.log("✅ Lesson scheduled email sent successfully:", result.data?.id);
      return true;
    } catch (error) {
      console.error("❌ Failed to send lesson scheduled email:", error);
      return false;
    }
  }

  // 4. PROGRAM & TRAINING NOTIFICATIONS
  async sendProgramAssigned(
    clientEmail: string,
    clientName: string,
    coachName: string,
    programName: string
  ): Promise<boolean> {
    try {
      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.programAssigned(
        clientName,
        coachName,
        programName
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [clientEmail],
        subject: template.subject,
        html: template.html,
      });

      console.log("Program assignment email sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send program assignment email:", error);
      return false;
    }
  }

  async sendWorkoutAssigned(
    clientEmail: string,
    clientName: string,
    coachName: string,
    workoutName: string
  ): Promise<boolean> {
    try {
      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.workoutAssigned(
        clientName,
        coachName,
        workoutName
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [clientEmail],
        subject: template.subject,
        html: template.html,
      });

      console.log("Workout assignment email sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send workout assignment email:", error);
      return false;
    }
  }

  // Daily workout reminder - sent at 8 AM if user has workouts for that day
  async sendDailyWorkoutReminder(
    clientEmail: string,
    clientName: string,
    coachName: string,
    workouts: Array<{ title: string; description?: string; duration?: string; type: 'assigned' | 'program' }>
  ): Promise<boolean> {
    try {
      // Check if RESEND_API_KEY is configured
      if (!process.env.RESEND_API_KEY) {
        console.error("❌ RESEND_API_KEY not configured - cannot send daily workout reminder email");
        return false;
      }

      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.dailyWorkoutReminder(
        clientName,
        coachName,
        workouts
      );

      console.log(`📧 Attempting to send daily workout reminder to ${clientEmail} (${clientName})`);

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [clientEmail],
        subject: template.subject,
        html: template.html,
      });

      if (result.error) {
        console.error(`❌ Resend API error for ${clientEmail}:`, result.error);
        return false;
      }

      console.log(`✅ Daily workout reminder email sent successfully to ${clientEmail}:`, result.data?.id);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send daily workout reminder email to ${clientEmail}:`, error);
      if (error instanceof Error) {
        console.error(`   Error message: ${error.message}`);
        console.error(`   Error stack: ${error.stack}`);
      }
      return false;
    }
  }

  // 5. MESSAGE NOTIFICATIONS
  async sendNewMessage(
    clientEmail: string,
    clientName: string,
    coachName: string,
    messagePreview: string,
    clientUserId?: string
  ): Promise<boolean> {
    try {
      // Check if RESEND_API_KEY is configured
      if (!process.env.RESEND_API_KEY) {
        console.error("❌ RESEND_API_KEY not configured - cannot send email");
        return false;
      }

      // Check if client has email notifications enabled
      if (clientUserId) {
        const emailEnabled = await this.checkEmailNotificationsEnabled(
          clientUserId
        );
        if (!emailEnabled) {
          console.log(
            `📧 Email notifications disabled for user ${clientUserId}, skipping message notification email`
          );
          return false;
        }
      }

      // Check rate limiting for message notifications (24 hours)
      const now = Date.now();
      const lastSent = this.messageNotificationCooldown.get(clientEmail);

      if (lastSent && now - lastSent < this.MESSAGE_COOLDOWN_MS) {
        console.log(
          `📧 Message notification skipped for ${clientEmail} - still in cooldown period`
        );
        return false; // Skip sending due to rate limiting
      }

      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.newMessage(
        clientName,
        coachName,
        messagePreview
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [clientEmail],
        subject: template.subject,
        html: template.html,
      });

      if (result.error) {
        console.error("❌ Failed to send new message email:", result.error);
        return false;
      }

      // Update cooldown timestamp
      this.messageNotificationCooldown.set(clientEmail, now);

      console.log("✅ New message email sent successfully:", result.data?.id);
      return true;
    } catch (error) {
      console.error("❌ Failed to send new message email:", error);
      return false;
    }
  }

  // 6. VIDEO & FEEDBACK NOTIFICATIONS
  async sendVideoFeedback(
    clientEmail: string,
    clientName: string,
    coachName: string,
    videoTitle: string
  ): Promise<boolean> {
    try {
      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.videoFeedback(
        clientName,
        coachName,
        videoTitle
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [clientEmail],
        subject: template.subject,
        html: template.html,
      });

      console.log("Video feedback email sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send video feedback email:", error);
      return false;
    }
  }

  async sendVideoAssigned(
    clientEmail: string,
    clientName: string,
    coachName: string,
    videoTitle: string
  ): Promise<boolean> {
    try {
      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.videoAssigned(
        clientName,
        coachName,
        videoTitle
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [clientEmail],
        subject: template.subject,
        html: template.html,
      });

      console.log("Video assignment email sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send video assignment email:", error);
      return false;
    }
  }

  // 7. ORGANIZATION & TEAM NOTIFICATIONS
  async sendOrganizationInvite(
    coachEmail: string,
    coachName: string,
    organizationName: string,
    inviterName: string
  ): Promise<boolean> {
    try {
      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.organizationInvite(
        coachName,
        organizationName,
        inviterName
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [coachEmail],
        subject: template.subject,
        html: template.html,
      });

      console.log("Organization invite email sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send organization invite email:", error);
      return false;
    }
  }

  // 9. SYSTEM & ADMIN NOTIFICATIONS
  async sendAccountSuspended(
    userEmail: string,
    userName: string,
    reason: string
  ): Promise<boolean> {
    try {
      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.accountSuspended(
        userName,
        reason
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [userEmail],
        subject: template.subject,
        html: template.html,
      });

      console.log("Account suspension email sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send account suspension email:", error);
      return false;
    }
  }

  // 8. PAYMENT & BILLING NOTIFICATIONS
  async sendPaymentReminder(
    userEmail: string,
    userName: string,
    amount: string,
    dueDate: string
  ): Promise<boolean> {
    try {
      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.paymentReminder(
        userName,
        amount,
        dueDate
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [userEmail],
        subject: template.subject,
        html: template.html,
      });

      console.log("Payment reminder email sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send payment reminder email:", error);
      return false;
    }
  }

  // UTILITY METHODS
  async sendCustomEmail(
    to: string | string[],
    subject: string,
    html: string,
    from?: string
  ): Promise<boolean> {
    try {
      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const result = await resend.emails.send({
        from: from || this.fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });

      console.log("Custom email sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send custom email:", error);
      return false;
    }
  }

  async sendBulkEmails(
    recipients: Array<{ email: string; name: string }>,
    subject: string,
    htmlTemplate: (name: string) => string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const resend = this.getResend();
    if (!resend) {
      return { success: 0, failed: recipients.length };
    }

    for (const recipient of recipients) {
      try {
        const result = await resend.emails.send({
          from: this.fromEmail,
          to: [recipient.email],
          subject,
          html: htmlTemplate(recipient.name),
        });

        if (result.error) {
          failed++;
          console.error(`Failed to send to ${recipient.email}:`, result.error);
        } else {
          success++;
        }
      } catch (error) {
        failed++;
        console.error(`Failed to send to ${recipient.email}:`, error);
      }
    }

    return { success, failed };
  }

  // Test email configuration
  async testEmailConfiguration(): Promise<boolean> {
    try {
      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [process.env.ADMIN_EMAIL || "admin@nxlvlcoach.com"],
        subject: "NextLevel Coaching - Email Configuration Test",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                Email Configuration Test
              </h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
                NextLevel Coaching Platform
              </p>
            </div>
            <div style="padding: 40px 30px;">
              <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                This is a test email to verify that your NextLevel Coaching email service is working correctly.
              </p>
              <div style="background: #F9FAFB; border: 1px solid #D1D5DB; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  <strong>Timestamp:</strong> ${new Date().toISOString()}<br>
                  <strong>Domain:</strong> nxlvlcoach.com<br>
                  <strong>Status:</strong> ✅ Working properly!
                </p>
              </div>
              <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
                If you received this email, your email configuration is working properly!
              </p>
            </div>
          </div>
        `,
      });

      console.log("Test email sent successfully:", result);
      return true;
    } catch (error) {
      console.error("Failed to send test email:", error);
      return false;
    }
  }

  // 10. LESSON CONFIRMATION REMINDER
  async sendLessonConfirmationReminder(
    clientEmail: string,
    clientName: string,
    coachName: string,
    lessonDate: string,
    lessonTime: string,
    hoursUntilLesson: number,
    clientUserId?: string
  ): Promise<boolean> {
    try {
      // Check if RESEND_API_KEY is configured
      if (!process.env.RESEND_API_KEY) {
        console.error("❌ RESEND_API_KEY not configured - cannot send email");
        return false;
      }

      // Check if client has email notifications enabled
      if (clientUserId) {
        const emailEnabled = await this.checkEmailNotificationsEnabled(
          clientUserId
        );
        if (!emailEnabled) {
          console.log(
            `📧 Email notifications disabled for user ${clientUserId}, skipping lesson confirmation reminder email`
          );
          return false;
        }
      }

      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.lessonConfirmationReminder(
        clientName,
        coachName,
        lessonDate,
        lessonTime,
        hoursUntilLesson
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [clientEmail],
        subject: template.subject,
        html: template.html,
      });

      if (result.error) {
        console.error("❌ Failed to send lesson confirmation reminder email:", result.error);
        return false;
      }

      console.log("✅ Lesson confirmation reminder email sent successfully:", result.data?.id);
      return true;
    } catch (error) {
      console.error(
        "❌ Failed to send lesson confirmation reminder email:",
        error
      );
      return false;
    }
  }

  // 11. LESSON AUTO-CANCELLED
  async sendLessonAutoCancelled(
    clientEmail: string,
    clientName: string,
    coachName: string,
    lessonDateTime: string,
    clientUserId?: string
  ): Promise<boolean> {
    try {
      // Check if RESEND_API_KEY is configured
      if (!process.env.RESEND_API_KEY) {
        console.error("❌ RESEND_API_KEY not configured - cannot send email");
        return false;
      }

      // Check if client has email notifications enabled
      if (clientUserId) {
        const emailEnabled = await this.checkEmailNotificationsEnabled(
          clientUserId
        );
        if (!emailEnabled) {
          console.log(
            `📧 Email notifications disabled for user ${clientUserId}, skipping lesson auto-cancellation email`
          );
          return false;
        }
      }

      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.lessonAutoCancelled(
        clientName,
        coachName,
        lessonDateTime
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [clientEmail],
        subject: template.subject,
        html: template.html,
      });

      if (result.error) {
        console.error("❌ Failed to send lesson auto-cancellation email:", result.error);
        return false;
      }

      console.log("✅ Lesson auto-cancellation email sent successfully:", result.data?.id);
      return true;
    } catch (error) {
      console.error("❌ Failed to send lesson auto-cancellation email:", error);
      return false;
    }
  }

  // DAILY DIGEST NOTIFICATIONS
  async sendDailyDigest(
    userEmail: string,
    userName: string,
    unreadCount: number
  ): Promise<boolean> {
    try {
      const resend = this.getResend();
      if (!resend) {
        return false;
      }

      const template = completeEmailTemplates.dailyDigest(
        userName,
        unreadCount
      );

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [userEmail],
        subject: template.subject,
        html: template.html,
      });

      console.log("Daily digest email sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send daily digest email:", error);
      return false;
    }
  }

  // SEND BUG REPORT ANNOUNCEMENT TO ALL USERS
  async sendBugReportAnnouncement(): Promise<{
    success: number;
    failed: number;
  }> {
    try {

      // Get all users with email addresses
      const allUsers = await db.user.findMany({
        where: {
          email: { not: null as any },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });


      const resend = this.getResend();
      if (!resend) {
        return { success: 0, failed: 0 };
      }

      let success = 0;
      let failed = 0;

      for (const user of allUsers) {
        try {
          const template = completeEmailTemplates.bugReportAnnouncement(
            user.name || "User"
          );

          const result = await resend.emails.send({
            from: this.fromEmail,
            to: [user.email!],
            subject: template.subject,
            html: template.html,
          });

          if (result.error) {
            failed++;
            console.error(`❌ Failed to send to ${user.email}:`, result.error);
          } else {
            success++;
          }

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          failed++;
          console.error(`❌ Failed to send to ${user.email}:`, error);
        }
      }


      return { success, failed };
    } catch (error) {
      console.error("❌ Error in bug report announcement service:", error);
      return { success: 0, failed: 0 };
    }
  }
}

// Export singleton instance
export const completeEmailService = CompleteEmailService.getInstance();
