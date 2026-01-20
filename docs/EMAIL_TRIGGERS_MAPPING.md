# NextLevel Coaching - Email Triggers Mapping

## 📧 **Complete Email System for NextLevel Coaching**

Based on your codebase analysis, here are ALL the email triggers and procedures you need:

## 🎯 **Email Notification Categories**

### **1. CLIENT ONBOARDING & WELCOME**

- ✅ **Welcome Email** - When client joins via invite code
- ✅ **Coach Notification** - When client requests to join
- ✅ **Account Activation** - When client account is activated

### **2. LESSON & SCHEDULE NOTIFICATIONS**

- ✅ **Lesson Reminder** - 24 hours before lesson (automated)
- ✅ **Lesson Scheduled** - When coach schedules new lesson
- ✅ **Lesson Cancelled** - When lesson is cancelled
- ✅ **Lesson Rescheduled** - When lesson time changes
- ✅ **Schedule Update** - When coach updates availability

### **3. PROGRAM & TRAINING NOTIFICATIONS**

- ✅ **Program Assigned** - When coach assigns new program
- ✅ **Workout Assigned** - When coach assigns specific workout
- ✅ **Program Updated** - When program is modified
- ✅ **Training Reminder** - Daily workout reminders
- ✅ **Progress Milestone** - When client reaches goals

### **4. MESSAGE NOTIFICATIONS**

- ✅ **New Message** - When coach sends message
- ✅ **Message Reply** - When client replies to coach
- ✅ **Urgent Message** - For important communications
- ✅ **Message Thread** - For ongoing conversations

### **5. VIDEO & FEEDBACK NOTIFICATIONS**

- ✅ **Video Feedback** - When coach provides video feedback
- ✅ **Video Uploaded** - When client submits video
- ✅ **Feedback Request** - When coach requests video
- ✅ **Technique Analysis** - AI-powered feedback

### **6. ORGANIZATION & TEAM NOTIFICATIONS**

- ✅ **Organization Invite** - When invited to join organization
- ✅ **Team Update** - When organization settings change
- ✅ **Role Change** - When user role is updated
- ✅ **Organization News** - Important announcements

### **7. SYSTEM & ADMIN NOTIFICATIONS**

- ✅ **Account Suspended** - When account is suspended
- ✅ **Security Alert** - When suspicious activity detected
- ✅ **System Maintenance** - Scheduled maintenance notices
- ✅ **Feature Update** - New feature announcements

### **8. PAYMENT & BILLING NOTIFICATIONS**

- ✅ **Payment Reminder** - When payment is due
- ✅ **Payment Confirmed** - When payment is received
- ✅ **Subscription Renewal** - When subscription renews
- ✅ **Billing Update** - When billing information changes

## 🔧 **Implementation Checklist**

### **Email Templates Created:**

- [x] Welcome Client
- [x] New Client Request (Coach Notification)
- [x] Lesson Reminder
- [x] Lesson Scheduled
- [x] Program Assigned
- [x] Workout Assigned
- [x] New Message
- [x] Video Feedback
- [x] Organization Invite
- [x] Account Suspended
- [x] Payment Reminder

### **Email Service Methods:**

- [x] `sendWelcomeEmail()`
- [x] `sendNewClientRequest()`
- [x] `sendLessonReminder()`
- [x] `sendLessonScheduled()`
- [x] `sendProgramAssigned()`
- [x] `sendWorkoutAssigned()`
- [x] `sendNewMessage()` (Rate limited: 24 hours)
- [x] `sendVideoFeedback()`
- [x] `sendOrganizationInvite()`
- [x] `sendAccountSuspended()`
- [x] `sendPaymentReminder()`

## 🎛️ **User Settings Integration**

### **Email Notification Settings:**

```typescript
// From your UserSettings model
emailNotifications: Boolean; // Master email toggle
newClientNotifications: Boolean; // New client requests
messageNotifications: Boolean; // New messages
scheduleNotifications: Boolean; // Lesson reminders
```

### **Implementation in Components:**

- [x] **ClientSettingsPage.tsx** - Client notification preferences
- [x] **SettingsPageClient.tsx** - Coach notification preferences
- [x] **MobileSettingsPage.tsx** - Mobile notification settings
- [x] **ScheduleLessonModal.tsx** - "Send email" checkbox
- [x] **OrganizationScheduleLessonModal.tsx** - Email toggle

## 🚀 **Integration Points**

### **1. tRPC Routers**

```typescript
// Add to your tRPC routers
import { completeEmailService } from "@/lib/complete-email-service";

// Example in clients.router.ts
async addClient({ input, ctx }) {
  // ... existing logic ...

  // Send welcome email
  await completeEmailService.sendWelcomeEmail(
    clientEmail,
    clientName,
    coachName
  );

  // Send coach notification
  await completeEmailService.sendNewClientRequest(
    coachEmail,
    coachName,
    clientName,
    clientEmail
  );
}
```

### **2. Lesson Scheduling**

```typescript
// In ScheduleLessonModal.tsx
const handleSchedule = async () => {
  // ... existing logic ...

  if (sendEmail) {
    await completeEmailService.sendLessonScheduled(
      clientEmail,
      clientName,
      coachName,
      lessonDate,
      lessonTime
    );
  }
};
```

### **3. Program Assignment**

```typescript
// In ProgramsPage.tsx
const handleAssignProgram = async () => {
  // ... existing logic ...

  await completeEmailService.sendProgramAssigned(
    clientEmail,
    clientName,
    coachName,
    programName
  );
};
```

### **4. Message System**

```typescript
// In messaging router
async sendMessage({ input, ctx }) {
  // ... existing logic ...

  // Send email notification
  await completeEmailService.sendNewMessage(
    recipientEmail,
    recipientName,
    senderName,
    messagePreview
  );
}
```

## 📋 **Email Testing**

### **Test All Email Types:**

```bash
# Test welcome email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"testType": "welcome", "email": "test@example.com", "name": "Test Client", "coachName": "Test Coach"}'

# Test lesson reminder
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"testType": "lesson-reminder", "email": "test@example.com", "name": "Test Client", "coachName": "Test Coach"}'

# Test program assignment
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"testType": "program-assignment", "email": "test@example.com", "name": "Test Client", "coachName": "Test Coach"}'
```

## 🎯 **Next Steps**

1. **Update tRPC Routers** - Integrate email service into existing routers
2. **Add Email Triggers** - Add email calls to relevant mutations
3. **Test Email Delivery** - Test all email types with Resend
4. **Configure DNS** - Set up domain verification
5. **Deploy & Monitor** - Deploy and monitor email delivery

## 📊 **Email Analytics**

Track email performance:

- **Delivery Rate** - Percentage of emails delivered
- **Open Rate** - Percentage of emails opened
- **Click Rate** - Percentage of links clicked
- **Bounce Rate** - Percentage of emails bounced

## 🔒 **Email Security & Rate Limiting**

- **SPF Records** - Prevent email spoofing
- **DKIM Signing** - Verify email authenticity
- **DMARC Policy** - Protect against phishing
- **Rate Limiting** - Prevent email abuse
- **Message Notifications** - Limited to once per 24 hours per recipient

---

**NextLevel Coaching** - Complete Email System
Domain: `nxlvlcoach.com`

# 📧 Email System - Quick Reference

Simple list of all automated emails in NextLevel Coaching.

## Current Emails (13 Total)

### Welcome & Onboarding

1. **🎉 Coach Welcome Email**

   - **When**: New coach signs up
   - **Who gets it**: The new coach
   - **Subject**: "Welcome to NextLevel Coaching, [Name]! 🎉"

2. **🎯 Client Welcome Email**
   - **When**: New client signs up
   - **Who gets it**: The new client
   - **Subject**: "Welcome to NextLevel Coaching, [Name]! 🎯"

### Client Requests

3. **📬 Client Join Notification**

   - **When**: Client joins using an invite code
   - **Who gets it**: The coach
   - **Subject**: "New Client Request: [Client Name] wants to join your coaching program"

4. **📧 New Client Request Email**
   - **When**: Client requests to join via email (no invite code)
   - **Who gets it**: The coach

### Lesson & Scheduling

5. **⏰ Lesson Reminder**

   - **When**: 24 hours before a lesson
   - **Who gets it**: The client
   - **What it says**: Reminder about upcoming lesson

6. **📅 Lesson Scheduled**
   - **When**: New lesson is scheduled
   - **Who gets it**: The client
   - **What it says**: Confirmation of new lesson booking

### Programs & Workouts

7. **🏋️ Program Assigned**

   - **When**: Coach assigns a program to client
   - **Who gets it**: The client
   - **What it says**: New program details and instructions

8. **💪 Workout Assigned**
   - **When**: Coach assigns a workout to client
   - **Who gets it**: The client
   - **What it says**: New workout details

### Messages & Communication

9. **💬 New Message Notification**

   - **When**: Coach sends message to client
   - **Who gets it**: The client
   - **Note**: Rate limited to once per 24 hours per client

10. **📊 Daily Digest**
    - **When**: Daily (if user has unread messages)
    - **Who gets it**: Users with unread messages
    - **What it says**: Summary of unread messages

### Video & Feedback

11. **🎥 Video Feedback**

    - **When**: Coach provides feedback on client video
    - **Who gets it**: The client

12. **📹 Video Assigned**
    - **When**: Coach assigns video to client
    - **Who gets it**: The client

### Organization & Admin

13. **🏢 Organization Invite**
    - **When**: Coach invites another coach to organization
    - **Who gets it**: The invited coach

## Email Services

**Main Service**: CompleteEmailService (`src/lib/complete-email-service.ts`)  
**New Notifications**: notification-utils (`src/lib/notification-utils.ts`)  
**Lesson Reminders**: lesson-reminder-service (`src/lib/lesson-reminder-service.ts`)  
**Daily Digests**: daily-digest-service (`src/lib/daily-digest-service.ts`)

## Additional Features

- **Rate Limiting**: Message notifications limited to once per 24 hours per client
- **Automatic Reminders**: Lesson reminders sent exactly 24 hours before lessons
- **Daily Digests**: Automatic daily emails for users with unread messages
- **Bulk Email**: Support for sending emails to multiple recipients
- **Custom Templates**: All emails use professional HTML templates

## Future Ideas

- Program completion notifications
- Weekly progress summaries
- Payment reminder emails
- Account suspension notifications

---

-Updated: October 25
