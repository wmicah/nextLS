// NextLevel Coaching - Complete Email Templates
// All email templates for the coaching platform
// Updated to match the new design system with golden accents

// Design system colors
const COLORS = {
  GOLDEN_ACCENT: "#E5B232",
  GOLDEN_HOVER: "#F5C242",
  GOLDEN_DARK: "#B1872E",
  BACKGROUND_DARK: "#2A3133",
  BACKGROUND_CARD: "#353A3A",
  TEXT_PRIMARY: "#2A3133",
  TEXT_SECONDARY: "#606364",
  TEXT_MUTED: "#8A8288",
  BORDER_SUBTLE: "#E5E7EB",
  SUCCESS: "#70CF70",
  ERROR: "#D9534F",
  WARNING: "#F59E0B",
};

// Base email wrapper styles
const baseEmailStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
`;

const headerGradient = `linear-gradient(135deg, ${COLORS.GOLDEN_DARK} 0%, ${COLORS.GOLDEN_ACCENT} 100%)`;

export const completeEmailTemplates = {
  // 1. CLIENT ONBOARDING & WELCOME
  welcomeClient: (clientName: string, coachName: string) => ({
    subject: `Welcome to NextLevel Coaching - ${coachName} is your coach!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              Welcome to NextLevel Coaching
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              Professional Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${clientName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              Your coach <strong style="color: ${COLORS.GOLDEN_DARK};">${coachName}</strong> has invited you to join NextLevel Coaching, 
              the professional platform for athletic development and training.
            </p>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 30px 0; font-size: 16px;">
              You can now access your personalized training dashboard, view your programs, 
              track your progress, and communicate directly with your coach.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/client-dashboard" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3); transition: all 0.2s;">
                Access Your Dashboard
              </a>
            </div>
            
            <div style="background: #f9fafb; border-left: 4px solid ${COLORS.GOLDEN_ACCENT}; padding: 20px; border-radius: 4px; margin: 30px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                What you can do:
              </h3>
              <ul style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li style="margin-bottom: 8px;">View your personalized training programs</li>
                <li style="margin-bottom: 8px;">Track your progress and analytics</li>
                <li style="margin-bottom: 8px;">Communicate with your coach</li>
                <li style="margin-bottom: 8px;">Submit video assignments for feedback</li>
                <li style="margin-bottom: 8px;">Access your training schedule</li>
              </ul>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              If you have any questions, feel free to reach out to your coach or contact our support team.
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 2. COACH NOTIFICATIONS
  newClientRequest: (
    coachName: string,
    clientName: string,
    clientEmail: string
  ) => ({
    subject: `New Client Request: ${clientName} wants to join NextLevel Coaching`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              New Client Request
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              NextLevel Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${coachName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              <strong style="color: ${COLORS.GOLDEN_DARK};">${clientName}</strong> (${clientEmail}) has requested to join your coaching program 
              on NextLevel Coaching.
            </p>
            
            <div style="background: #f9fafb; border: 1px solid ${COLORS.BORDER_SUBTLE}; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                Client Details:
              </h3>
              <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px; line-height: 1.8;">
                <strong>Name:</strong> ${clientName}<br>
                <strong>Email:</strong> ${clientEmail}<br>
                <strong>Request Date:</strong> ${new Date().toLocaleDateString()}
              </p>
            </div>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              Click below to review and manage this client request:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/clients" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                Manage Clients
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              You can approve, decline, or request more information from this client.
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 3. LESSON & SCHEDULE NOTIFICATIONS
  scheduleExchangeRequest: (
    coachName: string,
    clientName: string,
    oldLessonDate: string,
    oldLessonTime: string,
    newRequestedDate: string,
    newRequestedTime: string,
    reason?: string
  ) => ({
    subject: `Lesson Exchange Request: ${clientName} wants to reschedule`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              Lesson Exchange Request
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              NextLevel Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${coachName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              <strong style="color: ${COLORS.GOLDEN_DARK};">${clientName}</strong> has requested to exchange their lesson time.
            </p>
            
            <div style="background: #f9fafb; border: 1px solid ${COLORS.BORDER_SUBTLE}; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                Exchange Details:
              </h3>
              <div style="margin-bottom: 15px;">
                <p style="color: ${COLORS.TEXT_SECONDARY}; margin: 0 0 5px 0; font-size: 14px; font-weight: 600;">
                  Current Lesson:
                </p>
                <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px;">
                  ${oldLessonDate} at ${oldLessonTime}
                </p>
              </div>
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid ${COLORS.BORDER_SUBTLE};">
                <p style="color: ${COLORS.TEXT_SECONDARY}; margin: 0 0 5px 0; font-size: 14px; font-weight: 600;">
                  Requested New Time:
                </p>
                <p style="color: ${COLORS.GOLDEN_DARK}; margin: 0; font-size: 16px; font-weight: 600;">
                  ${newRequestedDate} at ${newRequestedTime}
                </p>
              </div>
              ${reason ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid ${COLORS.BORDER_SUBTLE};">
                <p style="color: ${COLORS.TEXT_SECONDARY}; margin: 0 0 5px 0; font-size: 14px; font-weight: 600;">
                  Reason:
                </p>
                <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px; line-height: 1.6;">
                  ${reason}
                </p>
              </div>
              ` : ''}
            </div>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              <strong>Note:</strong> The client's current lesson has been removed. If you reject this request, their original lesson will be automatically restored.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/schedule" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                Review Schedule Request
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              You can approve or reject this exchange request from your schedule page.
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  lessonReminder: (
    clientName: string,
    coachName: string,
    lessonDate: string,
    lessonTime: string
  ) => ({
    subject: `Lesson Reminder: ${lessonDate} at ${lessonTime}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              Lesson Reminder
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              NextLevel Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${clientName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              This is a reminder that you have a lesson with <strong style="color: ${COLORS.GOLDEN_DARK};">${coachName}</strong> 
              on <strong>${lessonDate}</strong> at <strong style="color: ${COLORS.GOLDEN_ACCENT};">${lessonTime}</strong>.
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid ${COLORS.GOLDEN_ACCENT}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                Lesson Details:
              </h3>
              <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px; line-height: 1.8;">
                <strong>Coach:</strong> ${coachName}<br>
                <strong>Date:</strong> ${lessonDate}<br>
                <strong>Time:</strong> <span style="color: ${COLORS.GOLDEN_ACCENT}; font-weight: 600;">${lessonTime}</span>
              </p>
            </div>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              Make sure to check your dashboard for any updates or changes to your schedule.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/client-schedule" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                View Schedule
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              If you need to reschedule, please contact your coach as soon as possible.
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  lessonScheduled: (
    clientName: string,
    coachName: string,
    lessonDate: string,
    lessonTime: string
  ) => ({
    subject: `New Lesson Scheduled: ${lessonDate} at ${lessonTime}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              New Lesson Scheduled
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              NextLevel Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${clientName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              Your coach <strong style="color: ${COLORS.GOLDEN_DARK};">${coachName}</strong> has scheduled a new lesson for you.
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid ${COLORS.GOLDEN_ACCENT}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                Lesson Details:
              </h3>
              <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px; line-height: 1.8;">
                <strong>Coach:</strong> ${coachName}<br>
                <strong>Date:</strong> ${lessonDate}<br>
                <strong>Time:</strong> <span style="color: ${COLORS.GOLDEN_ACCENT}; font-weight: 600;">${lessonTime}</span>
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/client-schedule" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                View Schedule
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              If you need to reschedule, please contact your coach as soon as possible.
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 4. PROGRAM & TRAINING NOTIFICATIONS
  programAssigned: (
    clientName: string,
    coachName: string,
    programName: string
  ) => ({
    subject: `New Program Assigned: ${programName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              New Program Assigned
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              NextLevel Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${clientName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              Your coach <strong style="color: ${COLORS.GOLDEN_DARK};">${coachName}</strong> has assigned you a new training program: 
              <strong style="color: ${COLORS.GOLDEN_ACCENT};">${programName}</strong>.
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid ${COLORS.GOLDEN_ACCENT}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                Program Details:
              </h3>
              <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px; line-height: 1.8;">
                <strong>Program:</strong> <span style="color: ${COLORS.GOLDEN_ACCENT}; font-weight: 600;">${programName}</span><br>
                <strong>Assigned by:</strong> ${coachName}<br>
                <strong>Date Assigned:</strong> ${new Date().toLocaleDateString()}
              </p>
            </div>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              You can now access this program in your dashboard and start your training journey.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/client-dashboard" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                View Program
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              If you have any questions about the program, feel free to reach out to your coach.
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  workoutAssigned: (
    clientName: string,
    coachName: string,
    workoutName: string
  ) => ({
    subject: `New Workout Assigned: ${workoutName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              New Workout Assigned
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              NextLevel Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${clientName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              Your coach <strong style="color: ${COLORS.GOLDEN_DARK};">${coachName}</strong> has assigned you a new workout: 
              <strong style="color: ${COLORS.GOLDEN_ACCENT};">${workoutName}</strong>.
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid ${COLORS.GOLDEN_ACCENT}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                Workout Details:
              </h3>
              <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px; line-height: 1.8;">
                <strong>Workout:</strong> <span style="color: ${COLORS.GOLDEN_ACCENT}; font-weight: 600;">${workoutName}</span><br>
                <strong>Assigned by:</strong> ${coachName}<br>
                <strong>Date Assigned:</strong> ${new Date().toLocaleDateString()}
              </p>
            </div>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              You can now access this workout in your dashboard and start training.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/client-dashboard" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                View Workout
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              If you have any questions about the workout, feel free to reach out to your coach.
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Daily workout reminder - sent at 8 AM if user has workouts for that day
  dailyWorkoutReminder: (
    clientName: string,
    coachName: string,
    workouts: Array<{ title: string; description?: string; duration?: string; type: 'assigned' | 'program' }>
  ) => {
    const workoutCount = workouts.length;
    const workoutText = workoutCount === 1 ? 'workout' : 'workouts';
    
    const workoutItems = workouts.map(workout => `
      <div style="background: #f9fafb; border-left: 4px solid ${COLORS.GOLDEN_ACCENT}; padding: 20px; border-radius: 4px; margin: 15px 0;">
        <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
          ${workout.title}
        </h3>
        ${workout.description ? `<p style="color: ${COLORS.TEXT_SECONDARY}; margin: 8px 0; font-size: 14px; line-height: 1.6;">${workout.description}</p>` : ''}
        ${workout.duration ? `<p style="color: ${COLORS.TEXT_MUTED}; margin: 8px 0 0 0; font-size: 13px;"><strong>Duration:</strong> ${workout.duration}</p>` : ''}
      </div>
    `).join('');

    return {
      subject: `Hey ${clientName}, you've got ${workoutCount} ${workoutText} to do today! 💪`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="${baseEmailStyles}">
            <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
                💪 You've Got This!
              </h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
                Daily Workout Reminder
              </p>
            </div>
            
            <div style="padding: 40px 30px; background: #ffffff;">
              <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                Hey ${clientName}!
              </h2>
              
              <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
                You have <strong style="color: ${COLORS.GOLDEN_ACCENT};">${workoutCount} ${workoutText}</strong> scheduled for today. 
                Let's get it done! 💪
              </p>
              
              <div style="margin: 30px 0;">
                <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">
                  Today's Workouts:
                </h3>
                ${workoutItems}
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://nxlvlcoach.com/client-dashboard" 
                   style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                          border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                          box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                  View Your Workouts
                </a>
              </div>
              
              <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
                Keep pushing forward! If you have any questions, feel free to reach out to your coach <strong>${coachName}</strong>.
              </p>
              
              <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
                Best regards,<br>
                <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
              <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
                © 2025 NextLevel Coaching. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },

  // 5. MESSAGE NOTIFICATIONS
  newMessage: (
    clientName: string,
    coachName: string,
    messagePreview: string
  ) => ({
    subject: `New Message from ${coachName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              New Message
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              NextLevel Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${clientName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              You have a new message from your coach <strong style="color: ${COLORS.GOLDEN_DARK};">${coachName}</strong>.
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid ${COLORS.GOLDEN_ACCENT}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                Message Preview:
              </h3>
              <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px; font-style: italic; line-height: 1.6;">
                "${messagePreview}"
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/client-messages" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                View Message
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              You can reply directly to your coach through the platform.
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 6. VIDEO & FEEDBACK NOTIFICATIONS
  videoFeedback: (
    clientName: string,
    coachName: string,
    videoTitle: string
  ) => ({
    subject: `Video Feedback from ${coachName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              Video Feedback
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              NextLevel Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${clientName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              Your coach <strong style="color: ${COLORS.GOLDEN_DARK};">${coachName}</strong> has provided feedback on your video: 
              <strong style="color: ${COLORS.GOLDEN_ACCENT};">${videoTitle}</strong>.
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid ${COLORS.GOLDEN_ACCENT}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                Video Details:
              </h3>
              <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px; line-height: 1.8;">
                <strong>Video:</strong> <span style="color: ${COLORS.GOLDEN_ACCENT}; font-weight: 600;">${videoTitle}</span><br>
                <strong>Coach:</strong> ${coachName}<br>
                <strong>Feedback Date:</strong> ${new Date().toLocaleDateString()}
              </p>
            </div>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              Check your dashboard to view the detailed feedback and continue improving your technique.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/client-dashboard" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                View Feedback
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              Keep up the great work and continue submitting videos for feedback!
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  videoAssigned: (
    clientName: string,
    coachName: string,
    videoTitle: string
  ) => ({
    subject: `New Video Assignment from ${coachName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              New Video Assignment
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              NextLevel Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${clientName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              Your coach <strong style="color: ${COLORS.GOLDEN_DARK};">${coachName}</strong> has assigned you a new video to watch: 
              <strong style="color: ${COLORS.GOLDEN_ACCENT};">${videoTitle}</strong>.
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid ${COLORS.GOLDEN_ACCENT}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                Video Assignment Details:
              </h3>
              <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px; line-height: 1.8;">
                <strong>Video:</strong> <span style="color: ${COLORS.GOLDEN_ACCENT}; font-weight: 600;">${videoTitle}</span><br>
                <strong>Coach:</strong> ${coachName}<br>
                <strong>Assigned Date:</strong> ${new Date().toLocaleDateString()}
              </p>
            </div>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              Log in to your dashboard to watch the video and continue your training.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/client-dashboard" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                View Assignment
              </a>
            </div>
            
            <div style="border-top: 1px solid ${COLORS.BORDER_SUBTLE}; padding-top: 20px; margin-top: 30px;">
              <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 0;">
                This is an automated notification from NextLevel Coaching Platform.
              </p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 7. ORGANIZATION & TEAM NOTIFICATIONS
  organizationInvite: (
    coachName: string,
    organizationName: string,
    inviterName: string
  ) => ({
    subject: `Invitation to Join ${organizationName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              Organization Invitation
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              NextLevel Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${coachName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              <strong style="color: ${COLORS.GOLDEN_DARK};">${inviterName}</strong> has invited you to join the organization 
              <strong style="color: ${COLORS.GOLDEN_ACCENT};">${organizationName}</strong> on NextLevel Coaching.
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid ${COLORS.GOLDEN_ACCENT}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                Organization Details:
              </h3>
              <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px; line-height: 1.8;">
                <strong>Organization:</strong> <span style="color: ${COLORS.GOLDEN_ACCENT}; font-weight: 600;">${organizationName}</span><br>
                <strong>Invited by:</strong> ${inviterName}<br>
                <strong>Invitation Date:</strong> ${new Date().toLocaleDateString()}
              </p>
            </div>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              Join this organization to collaborate with other coaches and access shared resources.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/organization" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                View Invitation
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              You can accept or decline this invitation in your dashboard.
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 8. SYSTEM & ADMIN NOTIFICATIONS
  accountSuspended: (userName: string, reason: string) => ({
    subject: `Account Suspension Notice`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: linear-gradient(135deg, ${COLORS.ERROR} 0%, #B91C1C 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              Account Suspension
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              NextLevel Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${userName},
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              Your NextLevel Coaching account has been suspended due to a violation of our terms of service.
            </p>
            
            <div style="background: #FEF2F2; border-left: 4px solid ${COLORS.ERROR}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: ${COLORS.ERROR}; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                Suspension Details:
              </h3>
              <p style="color: ${COLORS.ERROR}; margin: 0; font-size: 16px; line-height: 1.8;">
                <strong>Reason:</strong> ${reason}<br>
                <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
                <strong>Status:</strong> Account Suspended
              </p>
            </div>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              If you believe this is an error, please contact our support team immediately.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/support" 
                 style="background: ${COLORS.ERROR}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(217, 83, 79, 0.3);">
                Contact Support
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              This is an automated message. Please do not reply to this email.
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              NextLevel Coaching Support Team
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 9. PAYMENT & BILLING NOTIFICATIONS
  paymentReminder: (userName: string, amount: string, dueDate: string) => ({
    subject: `Payment Reminder: ${amount} due ${dueDate}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              Payment Reminder
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              NextLevel Coaching Platform
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${userName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              This is a friendly reminder that your NextLevel Coaching subscription payment is due soon.
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid ${COLORS.GOLDEN_ACCENT}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                Payment Details:
              </h3>
              <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px; line-height: 1.8;">
                <strong>Amount:</strong> <span style="color: ${COLORS.GOLDEN_ACCENT}; font-weight: 600; font-size: 18px;">${amount}</span><br>
                <strong>Due Date:</strong> ${dueDate}<br>
                <strong>Service:</strong> NextLevel Coaching Subscription
              </p>
            </div>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              Please update your payment method or make a payment to continue using our services.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/billing" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                Update Payment
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              If you have any questions about your billing, please contact our support team.
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 10. LESSON CONFIRMATION REMINDER
  lessonConfirmationReminder: (
    clientName: string,
    coachName: string,
    lessonDate: string,
    lessonTime: string,
    hoursUntilLesson: number
  ) => ({
    subject: `Lesson Confirmation Required - ${lessonDate} at ${lessonTime}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: linear-gradient(135deg, ${COLORS.WARNING} 0%, #D97706 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              Lesson Confirmation Required
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              Please confirm your attendance within 24 hours
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${clientName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              Your lesson with <strong style="color: ${COLORS.GOLDEN_DARK};">Coach ${coachName}</strong> is scheduled for 
              <strong>${lessonDate}</strong> at <strong style="color: ${COLORS.GOLDEN_ACCENT};">${lessonTime}</strong> 
              (in ${hoursUntilLesson} hours).
            </p>
            
            <div style="background: #FEF3C7; border-left: 4px solid ${COLORS.WARNING}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #92400E; margin: 0; font-size: 16px; font-weight: 600; line-height: 1.6;">
                ⚠️ IMPORTANT: Please confirm your attendance within 24 hours or your spot will be released.
              </p>
            </div>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              To confirm your attendance:
            </p>
            
            <ol style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.8; margin: 20px 0; font-size: 16px; padding-left: 20px;">
              <li style="margin-bottom: 10px;">Log into your NextLevel Coaching account</li>
              <li style="margin-bottom: 10px;">Go to your Messages section</li>
              <li style="margin-bottom: 10px;">Find the lesson confirmation message from Coach ${coachName}</li>
              <li style="margin-bottom: 10px;">Click the "Acknowledge" button to confirm your attendance</li>
            </ol>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              If you can't make it, please let Coach ${coachName} know as soon as possible so they can offer the spot to someone else.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/messages" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                Go to Messages
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">Coach ${coachName}</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 11. LESSON AUTO-CANCELLED
  lessonAutoCancelled: (
    clientName: string,
    coachName: string,
    lessonDateTime: string
  ) => ({
    subject: `Lesson Cancelled - ${lessonDateTime}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: linear-gradient(135deg, ${COLORS.ERROR} 0%, #B91C1C 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              Lesson Cancelled
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              Automatic cancellation due to no confirmation
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${clientName},
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              Your lesson scheduled for <strong>${lessonDateTime}</strong> has been automatically cancelled because we didn't receive confirmation within the required timeframe.
            </p>
            
            <div style="background: #FEE2E2; border-left: 4px solid ${COLORS.ERROR}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #991B1B; margin: 0; font-size: 16px; font-weight: 600; line-height: 1.6;">
                The time slot is now available for other bookings.
              </p>
            </div>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 20px 0; font-size: 16px;">
              If you'd like to reschedule, please let Coach ${coachName} know and they'll help you find a new time.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nxlvlcoach.com/messages" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                Contact Coach
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">Coach ${coachName}</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // DAILY DIGEST NOTIFICATIONS
  dailyDigest: (userName: string, unreadCount: number) => ({
    subject: `Daily Summary - ${unreadCount} unread message${
      unreadCount !== 1 ? "s" : ""
    }`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: ${headerGradient}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              Daily Summary
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              Your NextLevel Coaching Updates
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${userName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              You have <strong style="color: ${COLORS.GOLDEN_ACCENT}; font-size: 18px;">${unreadCount} unread message${
      unreadCount !== 1 ? "s" : ""
    }</strong> in your NextLevel Coaching account.
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid ${COLORS.GOLDEN_ACCENT}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <p style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; font-size: 16px; font-weight: 600; line-height: 1.6;">
                Don't miss important updates from your coach!
              </p>
              <p style="color: ${COLORS.TEXT_SECONDARY}; margin: 10px 0 0 0; font-size: 14px; line-height: 1.6;">
                Log in to your dashboard to view and respond to your messages.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
              process.env.NEXT_PUBLIC_APP_URL || "https://nxlvlcoach.com"
            }/dashboard" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                View Messages
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; text-align: center; line-height: 1.6;">
              This is a daily summary. You can adjust your notification preferences in your account settings.
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // BUG REPORT ANNOUNCEMENT
  bugReportAnnouncement: (userName: string) => ({
    subject: "New Feature: Report Bugs & Help Us Improve!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="${baseEmailStyles}">
          <div style="background: linear-gradient(135deg, ${COLORS.ERROR} 0%, #dc2626 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
              New Feature Available!
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
              Bug Reporting System
            </p>
          </div>
          
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Hi ${userName}!
            </h2>
            
            <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 20px 0; font-size: 16px;">
              We're excited to announce a new feature that makes it easier than ever to help us improve the platform!
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid ${COLORS.ERROR}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">
               Bug Report Feature
              </h3>
              <p style="color: ${COLORS.TEXT_PRIMARY}; line-height: 1.7; margin: 0 0 15px 0; font-size: 16px;">
                Found a bug or issue? We've made it super easy to report it! Our new bug reporting system allows you to quickly document and submit any problems you encounter.
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: ${COLORS.TEXT_PRIMARY}; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                How to Report a Bug:
              </h3>
              <ol style="color: ${COLORS.TEXT_PRIMARY}; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">
                  <strong>On Desktop:</strong> Look for the red bug icon button in the bottom right corner of your screen (next to the AI chat button)
                </li>
                <li style="margin-bottom: 10px;">
                  <strong>On Mobile:</strong> Tap the "Report Bug" button in the bottom navigation bar
                </li>
                <li style="margin-bottom: 10px;">
                  Fill out the form with:
                  <ul style="margin-top: 8px; padding-left: 20px; line-height: 1.6;">
                    <li>Title and description of the issue</li>
                    <li>Page where you found the bug (auto-detected)</li>
                    <li>Your device information (e.g., "iPhone 15 Pro", "Samsung Galaxy S24")</li>
                    <li>Optional: Screenshot or video showing the bug</li>
                    <li>Optional: Priority level (Low, Medium, High, Critical)</li>
                  </ul>
                </li>
                <li style="margin-bottom: 10px;">
                  Click "Submit Bug Report" and you're done!
                </li>
              </ol>
            </div>
            
            <div style="background: #FEF3C7; border-left: 4px solid ${COLORS.WARNING}; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #92400E; margin: 0; font-size: 14px; line-height: 1.7;">
                <strong>Tip:</strong> The more details you provide (especially screenshots or videos), the faster we can fix the issue!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
              process.env.NEXT_PUBLIC_APP_URL || "https://nxlvlcoach.com"
            }/dashboard" 
                 style="background: ${COLORS.GOLDEN_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; 
                        border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; 
                        box-shadow: 0 4px 6px rgba(229, 178, 50, 0.3);">
                Go to Dashboard
              </a>
            </div>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 30px 0 0 0; line-height: 1.7;">
              Your feedback helps us make NextLevel Coaching better for everyone. Thank you for being part of our community!
            </p>
            
            <p style="color: ${COLORS.TEXT_SECONDARY}; font-size: 14px; margin: 10px 0 0 0;">
              Best regards,<br>
              <strong style="color: ${COLORS.TEXT_PRIMARY};">The NextLevel Coaching Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.BORDER_SUBTLE}; border-radius: 0 0 8px 8px;">
            <p style="color: ${COLORS.TEXT_MUTED}; font-size: 12px; margin: 0;">
              © 2025 NextLevel Coaching. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};
