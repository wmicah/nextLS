# 🏋️ Daily Workout Reminders Setup

## Overview

The daily workout reminder system sends emails at **8 AM every day** to clients who have workouts or program drills scheduled for that day. This replaces the one-time workout/program assignment emails.

## Setup

### 1. Environment Variable

Make sure you have `CRON_SECRET` set in your Vercel environment variables (same secret used for all reminder cron jobs).

### 2. Vercel Cron Configuration

The cron job is already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/daily-workout-reminders?secret=YOUR_SECRET_HERE",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**⚠️ IMPORTANT:** Replace `YOUR_SECRET_HERE` in `vercel.json` with your actual `CRON_SECRET` value before deploying.

### 3. Schedule

- **Time:** 8:00 AM (server time)
- **Frequency:** Once per day
- **Timezone:** Server timezone (UTC by default on Vercel)

## How It Works

1. **Daily at 8 AM:** Vercel cron triggers `/api/daily-workout-reminders`
2. **Service checks all clients** for:
   - `AssignedWorkout` records scheduled for today
   - `ProgramAssignment` drills calculated for today (based on program start date)
3. **If client has workouts:** They receive one consolidated email listing all workouts for that day
4. **If client has workouts every day:** They get one email per day at 8 AM

## Email Content

The email includes:
- Friendly greeting: "Hey [Name], you've got X workouts to do today! 💪"
- List of all workouts with:
  - Workout title
  - Description (if available)
  - Duration (if available)
- Link to view workouts in dashboard

## Testing

### Manual Test

You can manually trigger the reminder service:

```bash
curl -X POST "https://yourdomain.com/api/daily-workout-reminders?secret=YOUR_SECRET"
```

### Local Testing

For local testing, you can call the service directly:

```typescript
import dailyWorkoutReminderService from "@/lib/daily-workout-reminder-service";

// Trigger manually
await dailyWorkoutReminderService.sendDailyWorkoutReminders();
```

## Disabled Features

The following one-time email notifications have been **disabled** in favor of daily reminders:
- `sendWorkoutAssigned()` - No longer sent when workout is assigned
- `sendProgramAssigned()` - No longer sent when program is assigned

Clients now receive daily reminders at 8 AM if they have workouts scheduled for that day.

## Notes

- The service respects user email notification preferences
- Only sends to clients with email addresses
- Only includes incomplete workouts
- Skips clients who have disabled email notifications

