// NextLevel Coaching - Email Service
// Centralized email service using Resend

import { Resend } from "resend";
import { emailTemplates } from "./email-templates";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  private static instance: EmailService;
  private fromEmail = "NextLevel Coaching <noreply@nxlvlcoach.com>";

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Send welcome email to new client
  async sendWelcomeEmail(
    clientEmail: string,
    clientName: string,
    coachName: string
  ): Promise<boolean> {
    try {
      const template = emailTemplates.welcomeClient(clientName, coachName);

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: [clientEmail],
        subject: template.subject,
        html: template.html,
      });

      console.log("Welcome email sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      return false;
    }
  }

  // Send coach notification for new client request
  async sendCoachNotification(
    coachEmail: string,
    coachName: string,
    clientName: string,
    clientEmail: string
  ): Promise<boolean> {
    try {
      const template = emailTemplates.coachNotification(
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

      console.log("Coach notification sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send coach notification:", error);
      return false;
    }
  }

  // Send lesson reminder
  async sendLessonReminder(
    clientEmail: string,
    clientName: string,
    coachName: string,
    lessonDate: string,
    lessonTime: string
  ): Promise<boolean> {
    try {
      const template = emailTemplates.lessonReminder(
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

      console.log("Lesson reminder sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send lesson reminder:", error);
      return false;
    }
  }

  // Send program assignment notification
  async sendProgramAssignment(
    clientEmail: string,
    clientName: string,
    coachName: string,
    programName: string
  ): Promise<boolean> {
    try {
      const template = emailTemplates.programAssignment(
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

      console.log("Program assignment sent:", result);
      return true;
    } catch (error) {
      console.error("Failed to send program assignment:", error);
      return false;
    }
  }

  // Send custom email
  async sendCustomEmail(
    to: string | string[],
    subject: string,
    html: string,
    from?: string
  ): Promise<boolean> {
    try {
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

  // Send bulk emails
  async sendBulkEmails(
    recipients: Array<{ email: string; name: string }>,
    subject: string,
    htmlTemplate: (name: string) => string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

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
}

// Export singleton instance
export const emailService = EmailService.getInstance();
