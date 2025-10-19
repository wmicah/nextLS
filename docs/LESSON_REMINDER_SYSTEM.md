# Lesson Reminder System

## Overview

The automated lesson reminder system sends 48-hour advance notices to clients and requires confirmation within 24 hours. If clients don't confirm, their lesson spots are automatically released.

## How It Works

### 1. **48-Hour Reminder**

- System checks every hour for lessons 48 hours away
- Sends reminder notification to client (both in-app message and email)
- Sets 24-hour confirmation deadline
- Creates unique confirmation token
- Email notification with clear instructions for confirmation

### 2. **24-Hour Confirmation Window**

- Client receives reminder with "Acknowledge" button
- Must click "Acknowledge" button within 24 hours to confirm attendance
- Confirmation happens directly in the messaging system

### 3. **Automatic Cancellation**

- If no confirmation within 24 hours, lesson is cancelled
- Time slot becomes available for other bookings
- Both client and coach receive notifications (in-app and email)
- Email notification explains the cancellation and offers rescheduling

## Database Schema

### Event Model Updates

```prisma
model Event {
  // ... existing fields
  reminderSent          Boolean     @default(false)
  reminderSentAt        DateTime?
  confirmationRequired  Boolean     @default(false)
  confirmationDeadline DateTime?
  confirmedAt          DateTime?
}
```

### New LessonReminder Model

```prisma
model LessonReminder {
  id                String         @id @default(cuid())
  eventId           String
  clientId          String
  coachId           String
  reminderType      ReminderType
  sentAt            DateTime       @default(now())
  confirmationToken String         @unique
  expiresAt         DateTime
  confirmedAt       DateTime?
  status            ReminderStatus @default(SENT)
}
```

## API Endpoints

### Cron Job Endpoint

```
GET /api/cron/lesson-reminders
Authorization: Bearer {CRON_SECRET}
```

### Client Confirmation

Confirmation happens through the existing messaging system:

1. Client receives 48-hour reminder message
2. Client clicks "Acknowledge" button in the message
3. System automatically processes the confirmation
4. Coach receives confirmation notification

## Setup Instructions

### 1. Environment Variables

```bash
CRON_SECRET=your-secret-key-here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Database Migration

```bash
npx prisma migrate dev --name add_lesson_reminder_system
```

### 3. Cron Job Setup

#### Option A: External Cron Service (Recommended)

Use services like:

- Vercel Cron
- Railway Cron
- GitHub Actions
- AWS EventBridge

**Schedule:** Every hour (`0 * * * *`)
**URL:** `https://your-domain.com/api/cron/lesson-reminders`
**Headers:** `Authorization: Bearer {CRON_SECRET}`

#### Option B: Internal Cron (Node.js)

```bash
npm install node-cron
node scripts/setup-cron.js
```

### 4. Testing

#### Test Reminder System

```bash
# Manually trigger reminder check
curl -X GET "https://your-domain.com/api/cron/lesson-reminders" \
  -H "Authorization: Bearer your-secret-key"
```

#### Test Confirmation

```bash
# 1. Create a test lesson 48+ hours in the future
# 2. Check the client's messages for the confirmation reminder
# 3. Click the "Acknowledge" button to test confirmation
# 4. Verify the coach receives the confirmation message
```

## Workflow Examples

### Successful Confirmation

1. **Day -2:** Lesson scheduled for Day 0
2. **Day -2:** 48-hour reminder sent to client
3. **Day -1:** Client clicks "Acknowledge" button in message
4. **Day -1:** Lesson confirmed, coach notified
5. **Day 0:** Lesson proceeds as scheduled

### No Confirmation (Auto-Cancel)

1. **Day -2:** Lesson scheduled for Day 0
2. **Day -2:** 48-hour reminder sent to client
3. **Day -1:** No confirmation received
4. **Day -1:** Lesson automatically cancelled
5. **Day -1:** Time slot becomes available
6. **Day -1:** Both client and coach notified

## Monitoring

### Check Reminder Status

```sql
-- View lessons with pending confirmations
SELECT e.*, lr.confirmationToken, lr.expiresAt
FROM events e
JOIN lesson_reminders lr ON e.id = lr.eventId
WHERE e.confirmationRequired = true
AND e.confirmedAt IS NULL
AND e.status = 'CONFIRMED';
```

### View Reminder History

```sql
-- View all reminders sent
SELECT lr.*, e.title, e.date, c.name as client_name
FROM lesson_reminders lr
JOIN events e ON lr.eventId = e.id
JOIN clients c ON lr.clientId = c.id
ORDER BY lr.sentAt DESC;
```

## Troubleshooting

### Common Issues

1. **Reminders not sending**

   - Check cron job is running
   - Verify CRON_SECRET is set
   - Check API endpoint is accessible

2. **Confirmations not working**

   - Verify confirmation token is valid
   - Check if deadline has passed
   - Ensure client has access to confirmation page

3. **Lessons not auto-cancelling**
   - Check cron job is processing expired confirmations
   - Verify database connections
   - Check for error logs

### Debug Commands

```bash
# Check cron job status
curl -X GET "https://your-domain.com/api/cron/lesson-reminders" \
  -H "Authorization: Bearer your-secret-key"

# Test confirmation through messaging system
# 1. Send a test lesson reminder
# 2. Check client's messages for the reminder
# 3. Click "Acknowledge" button to test confirmation flow
```

## Customization

### Modify Reminder Timing

Edit `src/lib/lesson-reminders.ts`:

```typescript
// Change from 48 hours to 72 hours
const reminderTime = addHours(now, 72);

// Change confirmation window from 24 hours to 12 hours
const confirmationDeadline = addHours(new Date(), 12);
```

### Custom Email Templates

Add email service integration in `sendSingleLessonReminder()`:

```typescript
// TODO: Send email notification
await sendReminderEmail({
  to: lesson.client.email,
  subject: "Lesson Reminder - Confirmation Required",
  template: "lesson-reminder",
  data: { clientName, coachName, lessonDate, confirmationLink },
});
```

## Security

- Confirmation tokens are cryptographically secure (32 bytes)
- Tokens expire after 24 hours
- Cron endpoint requires authentication
- No sensitive data in confirmation URLs
