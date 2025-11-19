// NextLevel Coaching - Email Templates
// Professional email templates for the coaching platform

export const emailTemplates = {
  // Welcome email for new clients
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

  // Coach notification for new client requests
  coachNotification: (
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

  // Lesson reminder email
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

  // Program assignment notification
  programAssignment: (
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
             <a href="https://nxlvlcoach.com/client-programs" 
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
};
