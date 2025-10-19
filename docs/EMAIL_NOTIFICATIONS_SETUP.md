# 📧 Email Notifications Setup Guide

## Overview

Your NextLevel Coaching platform now has a comprehensive email notification system that automatically sends emails for all important events.

## 🚀 Initialization

### Automatic Service Startup

The lesson reminder service and email notifications are now properly initialized to avoid Edge Runtime conflicts. To start the services:

```bash
# Initialize all app services
curl -X POST http://localhost:3000/api/init-app-services

# Or initialize just the lesson reminder service
curl -X POST http://localhost:3000/api/init-reminder-service
```

### Production Deployment

For production, you can call the initialization endpoint when your app starts, or set up a cron job to ensure services are running.

## 📧 Email Notifications

### Automatic Notifications

The system now sends emails for:

#### **Program & Training Assignments**

- ✅ **Program Assignment** - When coaches assign programs to clients
- ✅ **Routine Assignment** - When coaches assign routines to clients
- ✅ **Video Assignment** - When coaches assign videos to clients

#### **Lesson & Scheduling**

- ✅ **Lesson Scheduled** - When coaches schedule lessons (with sendEmail option)
- ✅ **48-Hour Confirmation Reminder** - 48 hours before lessons requiring confirmation
- ✅ **Lesson Auto-Cancellation** - When lessons are cancelled due to no confirmation

#### **Client Onboarding**

- ✅ **New Client Request** - When clients request to join coaches
- ✅ **Welcome Email** - For new clients

#### **Messaging System**

- ✅ **New Message Notifications** - When users receive new messages (rate limited to 24 hours)
- ✅ **Daily Digest** - Daily summary for users with unread messages

## 🔄 Background Services

### Lesson Reminder Service

- **Runs automatically** once initialized
- **Checks every hour** for lessons needing reminders
- **Sends 24-hour reminders** for regular lessons
- **Sends 48-hour confirmation reminders** for lessons requiring confirmation
- **Auto-cancels lessons** if no confirmation within 24 hours
- **Sends daily digest emails** once per day

### Email Rate Limiting

- **Message notifications**: Limited to once per 24 hours per user
- **Daily digest**: Sent only once per day
- **Professional templates**: Clean design without emojis

## 🧪 Testing Endpoints

### Service Management

```bash
# Check service status
curl -X GET http://localhost:3000/api/service-status

# Initialize services
curl -X POST http://localhost:3000/api/init-app-services

# Test lesson reminders
curl -X GET http://localhost:3000/api/test-reminders
```

### Email Testing

```bash
# Test daily digest
curl -X POST http://localhost:3000/api/daily-digest

# Test lesson reminder
curl -X POST http://localhost:3000/api/test-reminder
```

## 📊 What Happens Automatically

1. **When coaches assign programs/routines/videos** → Clients get email notifications
2. **When coaches schedule lessons** → Clients get email notifications (if enabled)
3. **48 hours before lessons** → Clients get confirmation reminder emails
4. **24 hours before lessons** → Clients get regular reminder emails
5. **If no confirmation** → Lessons auto-cancel and clients/coaches get cancellation emails
6. **Daily at 9 AM** → Users with unread messages get daily digest emails
7. **When new messages arrive** → Recipients get email notifications (rate limited)

## 🎯 Key Features

- **Fully automated** - No manual intervention needed
- **Rate limited** - Prevents email spam
- **Professional design** - Clean, branded email templates
- **Timezone aware** - Handles UTC conversions properly
- **Error handling** - Graceful failure with logging
- **Production ready** - Runs continuously in background

## 🔧 Troubleshooting

### Service Not Running

If the lesson reminder service isn't running:

```bash
# Check status
curl -X GET http://localhost:3000/api/service-status

# Initialize if needed
curl -X POST http://localhost:3000/api/init-app-services
```

### Email Issues

- Check your Resend API key in environment variables
- Verify email templates are working
- Check console logs for error messages

### Edge Runtime Issues

The services are now properly separated from Edge Runtime to avoid conflicts. All background services run in Node.js runtime only.

## 📝 Notes

- Services must be initialized manually or via API call
- Daily digest runs once per day automatically
- All email notifications are rate limited to prevent spam
- Professional email templates without emojis
- Full error handling and logging
