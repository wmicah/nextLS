import { trpc } from "@/app/_trpc/client";

// Helper function to create notifications (for testing and development)
export const createTestNotification = async (
  userId: string,
  type:
    | "MESSAGE"
    | "WORKOUT_ASSIGNED"
    | "WORKOUT_COMPLETED"
    | "LESSON_SCHEDULED"
    | "LESSON_CANCELLED"
    | "PROGRAM_ASSIGNED"
    | "PROGRESS_UPDATE"
    | "SYSTEM",
  title: string,
  message: string,
  data?: any
) => {
  try {
    const response = await fetch("/api/trpc/notifications.createNotification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        type,
        title,
        message,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create notification");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Notification type helpers
export const notificationTypes = {
  MESSAGE: "MESSAGE",
  WORKOUT_ASSIGNED: "WORKOUT_ASSIGNED",
  WORKOUT_COMPLETED: "WORKOUT_COMPLETED",
  LESSON_SCHEDULED: "LESSON_SCHEDULED",
  LESSON_CANCELLED: "LESSON_CANCELLED",
  PROGRAM_ASSIGNED: "PROGRAM_ASSIGNED",
  PROGRESS_UPDATE: "PROGRESS_UPDATE",
  SYSTEM: "SYSTEM",
} as const;

// Helper to get notification icon and color
export const getNotificationStyle = (type: string) => {
  switch (type) {
    case "MESSAGE":
      return { icon: "💬", color: "text-blue-400" };
    case "WORKOUT_ASSIGNED":
      return { icon: "🏋️", color: "text-green-400" };
    case "WORKOUT_COMPLETED":
      return { icon: "✅", color: "text-emerald-400" };
    case "LESSON_SCHEDULED":
      return { icon: "📅", color: "text-purple-400" };
    case "LESSON_CANCELLED":
      return { icon: "❌", color: "text-red-400" };
    case "PROGRAM_ASSIGNED":
      return { icon: "📚", color: "text-orange-400" };
    case "PROGRESS_UPDATE":
      return { icon: "📈", color: "text-cyan-400" };
    default:
      return { icon: "🔔", color: "text-gray-400" };
  }
};

// Notification utilities for sending emails and other notifications

interface EmailNotificationData {
  to: string;
  subject: string;
  body: string;
  coachName?: string;
  clientName?: string;
  clientEmail?: string;
}

export async function sendEmailNotification(
  data: EmailNotificationData
): Promise<boolean> {
  try {
    // Check if we're in a server-side context (has process.env)
    const isServerSide = typeof window === "undefined";

    if (isServerSide) {
      // Server-side: Use Resend directly
      if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY not configured");
        return false;
      }

      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const { data: emailData, error } = await resend.emails.send({
        from: "Coach Platform <onboarding@resend.dev>",
        to: [data.to],
        subject: data.subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${data.subject}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #4A5A70 0%, #606364 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .button {
                display: inline-block;
                background: #4A5A70;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🏆 Coach Platform</h1>
            </div>
            <div class="content">
              ${data.body.replace(/\n/g, "<br>")}
              <br><br>
              <a href="${appUrl}/dashboard" class="button">
                View Dashboard
              </a>
            </div>
            <div class="footer">
              <p>This email was sent from your Coach Platform.</p>
              <p>If you have any questions, please contact support.</p>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error("❌ Resend error:", error);
        return false;
      }

      console.log("✅ Email sent successfully:", emailData);
      return true;
    } else {
      // Client-side: Use API route with absolute URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const response = await fetch(`${appUrl}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Email API error:", errorData);
        return false;
      }

      const result = await response.json();
      console.log("📧 Email sent successfully:", result);
      return true;
    }
  } catch (error) {
    console.error("Failed to send email notification:", error);
    return false;
  }
}

export function createClientJoinEmailNotification(
  coachEmail: string,
  coachName: string,
  clientName: string,
  clientEmail: string
): EmailNotificationData {
  return {
    to: coachEmail,
    subject: `New Client Request: ${clientName} wants to join your coaching program`,
    body: `
Hi ${coachName},

You have a new client request!

${clientName} (${clientEmail}) wants to join your coaching program.

To review and manage this client:
1. Log into your coaching dashboard
2. Go to the Clients section
3. You'll see ${clientName} in your client list

You can also click the notification bell in your dashboard to see this request.

Best regards,
Your Coaching Platform Team
    `.trim(),
    coachName,
    clientName,
    clientEmail,
  };
}

export async function sendClientJoinNotification(
  coachEmail: string,
  coachName: string,
  clientName: string,
  clientEmail: string
): Promise<boolean> {
  const emailData = createClientJoinEmailNotification(
    coachEmail,
    coachName,
    clientName,
    clientEmail
  );

  return await sendEmailNotification(emailData);
}

// Welcome email functions
export function createWelcomeEmailForCoach(
  coachEmail: string,
  coachName: string
): EmailNotificationData {
  return {
    to: coachEmail,
    subject: `Welcome to NextLevel Coaching, ${coachName}! 🎉`,
    body: `
Hi ${coachName},

Welcome to NextLevel Coaching! We're thrilled to have you join our community of dedicated fitness professionals.

Your coaching dashboard is now ready and you can start:

🏋️ Creating workout programs and routines
📅 Scheduling lessons and sessions  
👥 Managing your clients and their progress
📊 Tracking analytics and performance metrics
💬 Communicating with clients through our messaging system
📚 Accessing our extensive exercise library

Getting Started:
1. Complete your profile setup
2. Create your first workout program
3. Invite your first client using our invitation system

Need help getting started? Check out our help center or reach out to our support team.

We're here to help you take your coaching business to the next level!

Best regards,
The NextLevel Coaching Team

P.S. Don't forget to check out our resource library for tips on building successful coaching relationships!
    `.trim(),
    coachName,
  };
}

export function createWelcomeEmailForClient(
  clientEmail: string,
  clientName: string,
  coachName?: string
): EmailNotificationData {
  const coachWelcome = coachName ? ` with your coach ${coachName}` : "";

  return {
    to: clientEmail,
    subject: `Welcome to NextLevel Coaching, ${clientName}! 🎯`,
    body: `
Hi ${clientName},

Welcome to NextLevel Coaching${coachWelcome}! You're about to embark on an amazing fitness journey.

Your client dashboard is now ready and you can:

🏋️ View your personalized workout programs
📅 Schedule and manage your training sessions
📊 Track your progress and achievements
💬 Communicate directly with your coach
📱 Access your workouts on any device
📈 Monitor your fitness analytics

Getting Started:
1. Complete your fitness profile
2. Review your assigned programs
3. Schedule your first session with your coach
4. Start your first workout!

Your coach is here to guide you every step of the way. Don't hesitate to reach out if you have any questions.

Ready to achieve your fitness goals? Let's get started!

Best regards,
The NextLevel Coaching Team

P.S. Download our mobile app for the best experience on the go!
    `.trim(),
    clientName,
    coachName,
  };
}

export async function sendWelcomeEmailForCoach(
  coachEmail: string,
  coachName: string
): Promise<boolean> {
  const emailData = createWelcomeEmailForCoach(coachEmail, coachName);
  return await sendEmailNotification(emailData);
}

export async function sendWelcomeEmailForClient(
  clientEmail: string,
  clientName: string,
  coachName?: string
): Promise<boolean> {
  const emailData = createWelcomeEmailForClient(
    clientEmail,
    clientName,
    coachName
  );
  return await sendEmailNotification(emailData);
}
