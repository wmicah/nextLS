// NextLevel Coaching - Complete Email Templates
// All email templates for the coaching platform

export const completeEmailTemplates = {
  // 1. CLIENT ONBOARDING & WELCOME
  welcomeClient: (clientName: string, coachName: string) => ({
    subject: `Welcome to NextLevel Coaching - ${coachName} is your coach!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            Welcome to NextLevel Coaching
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            Professional Coaching Platform
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${clientName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            Your coach <strong>${coachName}</strong> has invited you to join NextLevel Coaching, 
            the professional platform for athletic development and training.
          </p>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
            You can now access your personalized training dashboard, view your programs, 
            track your progress, and communicate directly with your coach.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/client-dashboard" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          
          <div style="background: #F7FAFC; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #2D3748; margin: 0 0 15px 0; font-size: 18px;">
              What you can do:
            </h3>
            <ul style="color: #4A5568; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">View your personalized training programs</li>
              <li style="margin-bottom: 8px;">Track your progress and analytics</li>
              <li style="margin-bottom: 8px;">Communicate with your coach</li>
              <li style="margin-bottom: 8px;">Submit video assignments for feedback</li>
              <li style="margin-bottom: 8px;">Access your training schedule</li>
            </ul>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            If you have any questions, feel free to reach out to your coach or contact our support team.
          </p>
          
          <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
            Best regards,<br>
            The NextLevel Coaching Team
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            New Client Request
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            NextLevel Coaching Platform
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${coachName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            <strong>${clientName}</strong> (${clientEmail}) has requested to join your coaching program 
            on NextLevel Coaching.
          </p>
          
          <div style="background: #F9FAFB; border: 1px solid #D1D5DB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">
              Client Details:
            </h3>
            <p style="color: #374151; margin: 0; font-size: 16px;">
              <strong>Name:</strong> ${clientName}<br>
              <strong>Email:</strong> ${clientEmail}<br>
              <strong>Request Date:</strong> ${new Date().toLocaleDateString()}
            </p>
          </div>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            Click below to review and manage this client request:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/clients" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Manage Clients
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            You can approve, decline, or request more information from this client.
          </p>
          
          <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
            Best regards,<br>
            The NextLevel Coaching Team
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  // 3. LESSON & SCHEDULE NOTIFICATIONS
  lessonReminder: (
    clientName: string,
    coachName: string,
    lessonDate: string,
    lessonTime: string
  ) => ({
    subject: `Lesson Reminder: ${lessonDate} at ${lessonTime}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            Lesson Reminder
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            NextLevel Coaching Platform
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${clientName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            This is a reminder that you have a lesson with <strong>${coachName}</strong> 
            on <strong>${lessonDate}</strong> at <strong>${lessonTime}</strong>.
          </p>
          
          <div style="background: #F9FAFB; border: 1px solid #D1D5DB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">
              Lesson Details:
            </h3>
            <p style="color: #374151; margin: 0; font-size: 16px;">
              <strong>Coach:</strong> ${coachName}<br>
              <strong>Date:</strong> ${lessonDate}<br>
              <strong>Time:</strong> ${lessonTime}
            </p>
          </div>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            Make sure to check your dashboard for any updates or changes to your schedule.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/messages" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              View Schedule
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            If you need to reschedule, please contact your coach as soon as possible.
          </p>
          
          <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
            Best regards,<br>
            The NextLevel Coaching Team
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            New Lesson Scheduled
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            NextLevel Coaching Platform
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${clientName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            Your coach <strong>${coachName}</strong> has scheduled a new lesson for you.
          </p>
          
          <div style="background: #F9FAFB; border: 1px solid #D1D5DB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">
              Lesson Details:
            </h3>
            <p style="color: #374151; margin: 0; font-size: 16px;">
              <strong>Coach:</strong> ${coachName}<br>
              <strong>Date:</strong> ${lessonDate}<br>
              <strong>Time:</strong> ${lessonTime}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/client-schedule" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              View Schedule
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            If you need to reschedule, please contact your coach as soon as possible.
          </p>
          
          <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
            Best regards,<br>
            The NextLevel Coaching Team
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            New Program Assigned
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            NextLevel Coaching Platform
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${clientName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            Your coach <strong>${coachName}</strong> has assigned you a new training program: 
            <strong>${programName}</strong>.
          </p>
          
          <div style="background: #F9FAFB; border: 1px solid #D1D5DB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">
              Program Details:
            </h3>
            <p style="color: #374151; margin: 0; font-size: 16px;">
              <strong>Program:</strong> ${programName}<br>
              <strong>Assigned by:</strong> ${coachName}<br>
              <strong>Date Assigned:</strong> ${new Date().toLocaleDateString()}
            </p>
          </div>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            You can now access this program in your dashboard and start your training journey.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/client-dashboard" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              View Program
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            If you have any questions about the program, feel free to reach out to your coach.
          </p>
          
          <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
            Best regards,<br>
            The NextLevel Coaching Team
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  workoutAssigned: (
    clientName: string,
    coachName: string,
    workoutName: string
  ) => ({
    subject: `New Workout Assigned: ${workoutName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            New Workout Assigned
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            NextLevel Coaching Platform
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${clientName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            Your coach <strong>${coachName}</strong> has assigned you a new workout: 
            <strong>${workoutName}</strong>.
          </p>
          
          <div style="background: #F9FAFB; border: 1px solid #D1D5DB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">
              Workout Details:
            </h3>
            <p style="color: #374151; margin: 0; font-size: 16px;">
              <strong>Workout:</strong> ${workoutName}<br>
              <strong>Assigned by:</strong> ${coachName}<br>
              <strong>Date Assigned:</strong> ${new Date().toLocaleDateString()}
            </p>
          </div>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            You can now access this workout in your dashboard and start training.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/client-dashboard" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              View Workout
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            If you have any questions about the workout, feel free to reach out to your coach.
          </p>
          
          <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
            Best regards,<br>
            The NextLevel Coaching Team
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  // 5. MESSAGE NOTIFICATIONS
  newMessage: (
    clientName: string,
    coachName: string,
    messagePreview: string
  ) => ({
    subject: `New Message from ${coachName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            New Message
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            NextLevel Coaching Platform
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${clientName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            You have a new message from your coach <strong>${coachName}</strong>.
          </p>
          
          <div style="background: #F9FAFB; border: 1px solid #D1D5DB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">
              Message Preview:
            </h3>
            <p style="color: #374151; margin: 0; font-size: 16px; font-style: italic;">
              "${messagePreview}"
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/client-messages" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              View Message
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            You can reply directly to your coach through the platform.
          </p>
          
          <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
            Best regards,<br>
            The NextLevel Coaching Team
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            Video Feedback
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            NextLevel Coaching Platform
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${clientName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            Your coach <strong>${coachName}</strong> has provided feedback on your video: 
            <strong>${videoTitle}</strong>.
          </p>
          
          <div style="background: #F9FAFB; border: 1px solid #D1D5DB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">
              Video Details:
            </h3>
            <p style="color: #374151; margin: 0; font-size: 16px;">
              <strong>Video:</strong> ${videoTitle}<br>
              <strong>Coach:</strong> ${coachName}<br>
              <strong>Feedback Date:</strong> ${new Date().toLocaleDateString()}
            </p>
          </div>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            Check your dashboard to view the detailed feedback and continue improving your technique.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/client-dashboard" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              View Feedback
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            Keep up the great work and continue submitting videos for feedback!
          </p>
          
          <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
            Best regards,<br>
            The NextLevel Coaching Team
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  videoAssigned: (
    clientName: string,
    coachName: string,
    videoTitle: string
  ) => ({
    subject: `New Video Assignment from ${coachName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            New Video Assignment
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            NextLevel Coaching Platform
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${clientName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            Your coach <strong>${coachName}</strong> has assigned you a new video to watch: 
            <strong>${videoTitle}</strong>.
          </p>
          
          <div style="background: #F9FAFB; border: 1px solid #D1D5DB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">
              Video Assignment Details:
            </h3>
            <p style="color: #374151; margin: 0; font-size: 16px;">
              <strong>Video:</strong> ${videoTitle}<br>
              <strong>Coach:</strong> ${coachName}<br>
              <strong>Assigned Date:</strong> ${new Date().toLocaleDateString()}
            </p>
          </div>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            Log in to your dashboard to watch the video and continue your training.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/client-dashboard" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              View Assignment
            </a>
          </div>
          
          <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              This is an automated notification from NextLevel Coaching Platform.
            </p>
          </div>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            Organization Invitation
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            NextLevel Coaching Platform
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${coachName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            <strong>${inviterName}</strong> has invited you to join the organization 
            <strong>${organizationName}</strong> on NextLevel Coaching.
          </p>
          
          <div style="background: #F9FAFB; border: 1px solid #D1D5DB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">
              Organization Details:
            </h3>
            <p style="color: #374151; margin: 0; font-size: 16px;">
              <strong>Organization:</strong> ${organizationName}<br>
              <strong>Invited by:</strong> ${inviterName}<br>
              <strong>Invitation Date:</strong> ${new Date().toLocaleDateString()}
            </p>
          </div>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            Join this organization to collaborate with other coaches and access shared resources.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/organization" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              View Invitation
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            You can accept or decline this invitation in your dashboard.
          </p>
          
          <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
            Best regards,<br>
            The NextLevel Coaching Team
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  // 8. SYSTEM & ADMIN NOTIFICATIONS
  accountSuspended: (userName: string, reason: string) => ({
    subject: `Account Suspension Notice`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            Account Suspension
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            NextLevel Coaching Platform
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${userName},
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            Your NextLevel Coaching account has been suspended due to a violation of our terms of service.
          </p>
          
          <div style="background: #FEF2F2; border: 1px solid #FECACA; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #DC2626; margin: 0 0 10px 0; font-size: 18px;">
              Suspension Details:
            </h3>
            <p style="color: #DC2626; margin: 0; font-size: 16px;">
              <strong>Reason:</strong> ${reason}<br>
              <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
              <strong>Status:</strong> Account Suspended
            </p>
          </div>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            If you believe this is an error, please contact our support team immediately.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/support" 
               style="background: #DC2626; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Contact Support
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            This is an automated message. Please do not reply to this email.
          </p>
          
          <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
            NextLevel Coaching Support Team
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  // 9. PAYMENT & BILLING NOTIFICATIONS
  paymentReminder: (userName: string, amount: string, dueDate: string) => ({
    subject: `Payment Reminder: ${amount} due ${dueDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            Payment Reminder
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            NextLevel Coaching Platform
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${userName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            This is a friendly reminder that your NextLevel Coaching subscription payment is due soon.
          </p>
          
          <div style="background: #F9FAFB; border: 1px solid #D1D5DB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">
              Payment Details:
            </h3>
            <p style="color: #374151; margin: 0; font-size: 16px;">
              <strong>Amount:</strong> ${amount}<br>
              <strong>Due Date:</strong> ${dueDate}<br>
              <strong>Service:</strong> NextLevel Coaching Subscription
            </p>
          </div>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            Please update your payment method or make a payment to continue using our services.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/billing" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Update Payment
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            If you have any questions about your billing, please contact our support team.
          </p>
          
          <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
            Best regards,<br>
            The NextLevel Coaching Team
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            Lesson Confirmation Required
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            Please confirm your attendance within 24 hours
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${clientName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            Your lesson with <strong>Coach ${coachName}</strong> is scheduled for <strong>${lessonDate}</strong> at <strong>${lessonTime}</strong> (in ${hoursUntilLesson} hours).
          </p>
          
          <div style="background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400E; margin: 0; font-size: 16px; font-weight: bold;">
              IMPORTANT: Please confirm your attendance within 24 hours or your spot will be released.
            </p>
          </div>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            To confirm your attendance:
          </p>
          
          <ol style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px; padding-left: 20px;">
            <li>Log into your NextLevel Coaching account</li>
            <li>Go to your Messages section</li>
            <li>Find the lesson confirmation message from Coach ${coachName}</li>
            <li>Click the "Acknowledge" button to confirm your attendance</li>
          </ol>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            If you can't make it, please let Coach ${coachName} know as soon as possible so they can offer the spot to someone else.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/messages" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Go to Messages
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            Best regards,<br>
            Coach ${coachName}
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            Lesson Cancelled
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            Automatic cancellation due to no confirmation
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${clientName},
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            Your lesson scheduled for <strong>${lessonDateTime}</strong> has been automatically cancelled because we didn't receive confirmation within the required timeframe.
          </p>
          
          <div style="background: #FEE2E2; border: 2px solid #DC2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #991B1B; margin: 0; font-size: 16px; font-weight: bold;">
              The time slot is now available for other bookings.
            </p>
          </div>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            If you'd like to reschedule, please let Coach ${coachName} know and they'll help you find a new time.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nxlvlcoach.com/messages" 
               style="background: #6B7280; color: #ffffff; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Contact Coach
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0;">
            Best regards,<br>
            Coach ${coachName}
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © 2024 NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  // DAILY DIGEST NOTIFICATIONS
  dailyDigest: (userName: string, unreadCount: number) => ({
    subject: `Daily Summary - ${unreadCount} unread message${
      unreadCount !== 1 ? "s" : ""
    }`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            Daily Summary
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            Your NextLevel Coaching Updates
          </p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 24px;">
            Hi ${userName}!
          </h2>
          
          <p style="color: #4A5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            You have <strong>${unreadCount} unread message${
      unreadCount !== 1 ? "s" : ""
    }</strong> in your NextLevel Coaching account.
          </p>
          
          <div style="background: #F7FAFC; border-left: 4px solid #4299E1; padding: 20px; margin: 20px 0;">
            <p style="color: #2D3748; margin: 0; font-size: 16px; font-weight: 600;">
              Don't miss important updates from your coach!
            </p>
            <p style="color: #4A5568; margin: 10px 0 0 0; font-size: 14px;">
              Log in to your dashboard to view and respond to your messages.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.NEXT_PUBLIC_APP_URL || "https://nextlevelcoaching.com"
            }/dashboard" 
               style="background: #4299E1; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              View Messages
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
            This is a daily summary. You can adjust your notification preferences in your account settings.
          </p>
        </div>
        
        <div style="background: #F7FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} NextLevel Coaching. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),
};
