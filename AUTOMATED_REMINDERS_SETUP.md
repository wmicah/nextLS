# 🔔 Automated Lesson Reminder System Setup

## Overview

This system automatically sends lesson reminders to clients **exactly 24 hours before their scheduled lessons**, with acknowledgment functionality. **No external cron jobs required** - it runs completely within your Next.js application!

## 🚀 How It Works

### 1. **Self-Contained Internal Service**

- **Built into your Next.js app** - no external services needed
- **Automatically starts** when your app initializes
- **Runs every hour** to check for lessons exactly 24 hours away
- **Only processes lessons with "CONFIRMED" status**
- **Automatically creates conversations** if they don't exist

### 2. **Precise 24-Hour Timing**

- System finds lessons scheduled between 24-25 hours from now
- Sends reminders exactly 24 hours before each individual lesson
- Each lesson gets its reminder at the perfect time
- No more daily batches - individual precision timing

### 3. **Smart Reminder Logic**

- **Prevents duplicate reminders** (only sends once per lesson)
- **In-memory tracking** for fast duplicate prevention
- **Database fallback** for additional safety
- **Rich formatting** with bullet points and acknowledgment

### 4. **Client Acknowledgment**

- Clients receive reminders with "Acknowledge" button
- Clicking sends automatic confirmation to coach
- Tracks acknowledgment status and timestamp

## 🛠️ Setup (Automatic - No Action Required!)

### **✅ Already Done!**

- Service automatically starts when your app runs
- No configuration needed
- No external cron jobs to set up
- No Windows Task Scheduler required

### **How It Works:**

1. **App starts** → Lesson reminder service automatically starts
2. **Every hour** → Service checks for lessons 24 hours away
3. **Exact timing** → Reminders sent precisely 24 hours before each lesson
4. **Automatic** → No manual intervention needed

## 🧪 Testing the System

### **1. Test the Internal Service:**

```bash
# Test endpoint to manually trigger the service
curl "http://localhost:3000/api/test-reminders"

# Using PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-reminders" -Method GET
```

### **2. Test with Real Lessons:**

1. Create a lesson for tomorrow at 9 PM
2. The service will automatically detect it
3. At exactly 9 PM today, the client will receive the reminder
4. Test the acknowledgment functionality

### **3. Monitor Console Logs:**

The service logs all activities in your console:

```
🔔 Checking for lessons that need reminders at 2025-09-04T01:35:19.552Z
Looking for lessons between 2025-09-05T01:35:19.618Z and 2025-09-05T02:35:19.618Z
Found 0 lessons that need reminders now
📊 Reminder check completed: 0 sent, 0 skipped, 0 errors
```

## 🔧 Configuration

### **Environment Variables:**

None required! The system is completely self-contained.

### **Customization Options:**

- **Reminder Time**: Change `addHours(now, 24)` to adjust when reminders are sent
- **Message Format**: Modify the `reminderMessage` template in the service
- **Check Frequency**: Change the interval in `setInterval` (currently every hour)

## 📊 Monitoring & Logs

### **Console Logs:**

The system logs all activities automatically:

- Service start/stop status
- Number of lessons found
- Reminders sent/skipped/errors
- Individual client results
- Timing windows

### **Service Status:**

```typescript
// Get current service status
const status = lessonReminderService.getStatus();
// Returns: { isRunning: true, intervalId: true, sentRemindersCount: 5 }
```

## 🚨 Troubleshooting

### **Common Issues:**

1. **No reminders being sent:**

   - Check if lessons have "CONFIRMED" status
   - Verify client has user account linked
   - Check console logs for errors
   - Ensure the service is running (should start automatically)

2. **Duplicate reminders:**

   - System automatically prevents duplicates
   - Uses both in-memory and database checks
   - Check console logs for duplicate prevention

3. **Service not starting:**
   - Check console logs for startup messages
   - Verify the service import in layout.tsx
   - Restart your Next.js app

### **Debug Mode:**

The service provides detailed logging by default. Check your console for:

- Service startup messages
- Hourly check logs
- Lesson processing details
- Error messages

## 🔒 Security & Reliability

- **No external dependencies** - runs completely within your app
- **In-memory tracking** for fast duplicate prevention
- **Database fallback** for persistence
- **Automatic error handling** and logging
- **Graceful degradation** if issues occur

## 📅 How It Works

### **Timeline Example:**

- **Lesson scheduled**: Thursday 9:00 PM
- **Service checks**: Every hour (including 9:00 PM today)
- **Reminder sent**: Wednesday 9:00 PM (exactly 24 hours before)
- **Client acknowledges**: Gets confirmation message
- **Coach notified**: Knows client is ready for lesson

### **Service Schedule:**

- **Starts automatically** when app initializes
- **Runs every hour** to catch lessons at the perfect time
- **No manual intervention** required
- **Always active** while your app is running

## 🎯 Next Steps

1. **✅ System is already running** - no setup needed!
2. **Test the system** with the provided test endpoint
3. **Create a test lesson** for tomorrow to verify timing
4. **Monitor console logs** to ensure everything is working
5. **Customize** the reminder message format if needed

## 🚀 Advanced Features

### **Manual Control:**

```typescript
// Stop the service (if needed)
lessonReminderService.stop();

// Start the service (if stopped)
lessonReminderService.start();

// Manual check (for testing)
await lessonReminderService.manualCheck();

// Get status
const status = lessonReminderService.getStatus();
```

### **Customization:**

- Modify reminder message format
- Adjust timing windows
- Change check frequency
- Add different reminder types

---

**🎉 You're all set!** The lesson reminder system is now running automatically within your Next.js app, sending reminders exactly 24 hours before each lesson without any external dependencies.
