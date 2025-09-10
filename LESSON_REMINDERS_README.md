# 🚀 Automatic Lesson Reminder System

This system automatically sends reminder messages from coaches to clients 24 hours before their scheduled lessons. The reminders appear as regular messages in your existing messaging system.

## ✨ Features

- **Automatic Reminders**: Sends reminders exactly 24 hours before lessons
- **Coach Messages**: Reminders appear to come from the coach (not system)
- **Duplicate Prevention**: Won't send multiple reminders for the same lesson
- **Smart Filtering**: Only sends reminders for confirmed lessons
- **Conversation Creation**: Automatically creates coach-client conversations if they don't exist
- **Professional Formatting**: Beautiful, formatted reminder messages

## 🛠️ Setup

### 1. Environment Variables

Add this to your `.env` file:

```bash
# Secret key to secure the reminder API (generate a random string)
LESSON_REMINDER_SECRET=your_super_secret_key_here_12345

# Your app URL (optional, defaults to localhost:3000)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Generate a Secure Secret

You can generate a secure secret using:

```bash
# Option 1: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Use online generator
# Visit: https://generate-secret.vercel.app/32
```

## 🚀 How to Use

### Option 1: Vercel Cron (Recommended for Production)

If you're using Vercel, add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/lesson-reminders?secret=YOUR_SECRET_HERE",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This will run the reminder system every day at 9:00 AM.

### Option 2: Manual Testing

Use the provided script to test the system:

```bash
# Install tsx if you haven't already
npm install -g tsx

# Run the reminder script
tsx scripts/send-lesson-reminders.ts
```

### Option 3: External Cron Service

Use services like:

- **GitHub Actions** (free)
- **Cron-job.org** (free)
- **EasyCron** (paid)

Set them to call: `POST https://yourdomain.com/api/lesson-reminders?secret=YOUR_SECRET`

## 📱 How It Works

### 1. **Daily Check**

- System runs daily to find lessons happening tomorrow
- Only processes lessons with status "CONFIRMED"

### 2. **Message Creation**

- Creates or finds existing coach-client conversation
- Sends a formatted reminder message from the coach
- Updates conversation timestamp

### 3. **Duplicate Prevention**

- Checks if a reminder was already sent today
- Prevents multiple reminders for the same lesson

### 4. **Client Experience**

- Client receives reminder in their normal messaging interface
- Message appears to come from their coach
- Professional, friendly tone with clear instructions

## 📋 Reminder Message Format

```
🔔 **Lesson Reminder**

Hi [Client Name]!

This is a friendly reminder that you have a lesson scheduled for **tomorrow** (Monday, January 15) at **2:00 PM**.

Please make sure to:
• Arrive 5-10 minutes early
• Bring any equipment you need
• Let me know if you need to reschedule

Looking forward to seeing you!

- Coach [Coach Name]
```

## 🔒 Security

- **Secret Key Required**: All requests must include the correct secret
- **No Public Access**: API endpoints are protected
- **Coach Verification**: Only sends reminders for confirmed lessons
- **User Validation**: Checks client has valid user account

## 🧪 Testing

### Test the API Endpoint

```bash
# Test GET endpoint (shows system status)
curl "https://yourdomain.com/api/lesson-reminders"

# Test POST endpoint (triggers reminders)
curl -X POST "https://yourdomain.com/api/lesson-reminders?secret=YOUR_SECRET"
```

### Test with Script

```bash
# Set your secret in .env file first
tsx scripts/send-lesson-reminders.ts
```

## 📊 Monitoring

The system provides detailed results:

```json
{
  "success": true,
  "message": "Processed 3 lessons",
  "results": [
    {
      "lessonId": "clxxx",
      "clientName": "John Smith",
      "status": "sent",
      "messageId": "msgxxx"
    },
    {
      "lessonId": "clyyy",
      "clientName": "Jane Doe",
      "status": "skipped",
      "reason": "Reminder already sent today"
    }
  ],
  "timestamp": "2025-01-14T09:00:00.000Z"
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"Unauthorized" Error**

   - Check your `LESSON_REMINDER_SECRET` environment variable
   - Ensure the secret in your cron job matches

2. **No Reminders Sent**

   - Verify you have confirmed lessons scheduled for tomorrow
   - Check lesson status is "CONFIRMED"
   - Ensure clients have user accounts linked

3. **Duplicate Reminders**
   - System automatically prevents duplicates
   - Check if reminders were sent manually

### Debug Mode

Add logging to see what's happening:

```bash
# Check your app logs for detailed information
# The system logs all actions and errors
```

## 🔄 Customization

### Modify Reminder Message

Edit the message template in `src/app/api/lesson-reminders/route.ts`:

```typescript
const reminderMessage = `🔔 **Lesson Reminder**

Hi ${lesson.client.name}! 

Your custom message here...

- Coach ${lesson.coach.name}`;
```

### Change Timing

Modify the reminder timing by changing the `addDays(now, 1)` to your preferred offset:

```typescript
// Send reminders 2 days before
const reminderDate = addDays(now, 2);

// Send reminders same day
const reminderDate = now;
```

## 📈 Scaling

The system is designed to handle:

- **Multiple coaches** with many clients
- **High lesson volumes** efficiently
- **Concurrent requests** safely
- **Database optimization** with proper indexing

## 🎯 Best Practices

1. **Test First**: Always test with the script before setting up cron
2. **Monitor Results**: Check the response logs regularly
3. **Secure Secret**: Use a strong, unique secret key
4. **Backup Plan**: Keep the manual script for emergencies
5. **Client Communication**: Let clients know about the reminder system

## 🆘 Support

If you encounter issues:

1. Check the logs for error details
2. Verify environment variables are set
3. Test with the manual script
4. Check lesson data in your database
5. Ensure proper database permissions

---

**Happy Coaching! 🏆**

Your clients will now receive professional, timely reminders that help reduce no-shows and improve your business efficiency.




