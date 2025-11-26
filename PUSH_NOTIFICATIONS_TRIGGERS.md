# 📱 Push Notification Triggers

## Where Push Notifications Are Sent

### ✅ **1. New Messages** (`src/trpc/routers/messaging.router.ts`)
- **Trigger**: When a message is sent in a conversation
- **Function**: `sendMessageNotification()`
- **Recipient**: The other person in the conversation (not the sender)
- **Requirements**:
  - User must have `pushNotifications: true` in settings
  - User must have `messageNotifications: true` in settings
  - User must have an active push subscription

### ✅ **2. Program Assignments** (`src/trpc/routers/programs.router.ts`)
- **Trigger**: When a coach assigns a program to a client
- **Function**: `sendProgramAssignmentNotification()`
- **Recipient**: The client who received the program
- **Requirements**:
  - User must have `pushNotifications: true` in settings
  - User must have an active push subscription

### ✅ **3. Routine/Workout Assignments** (`src/trpc/routers/routines.router.ts`)
- **Trigger**: When a coach assigns a routine/workout to a client
- **Function**: `sendRoutineAssignmentNotification()`
- **Recipient**: The client who received the routine
- **Requirements**:
  - User must have `pushNotifications: true` in settings
  - User must have an active push subscription

### ✅ **4. Lesson Reminders** (`src/lib/lesson-reminder-service.ts`)
- **Trigger**: 24 hours before a lesson (via automated service)
- **Function**: `sendLessonReminderNotification()`
- **Recipient**: The client with the upcoming lesson
- **Requirements**:
  - User must have `pushNotifications: true` in settings
  - User must have an active push subscription

### ✅ **5. Time Swap Requests** (`src/trpc/routers/timeSwap.router.ts`)
- **Trigger**: When a client requests a time swap
- **Function**: `sendSwapRequestNotification()`
- **Recipient**: The target client for the swap
- **Requirements**:
  - User must have `pushNotifications: true` in settings
  - User must have an active push subscription

## Debugging Checklist

### 1. **Check if Subscription Exists**
```sql
SELECT * FROM push_subscriptions WHERE "userId" = 'your-user-id';
```

### 2. **Check User Settings**
```sql
SELECT "pushNotifications", "messageNotifications" 
FROM user_settings 
WHERE "userId" = 'your-user-id';
```

### 3. **Check Server Logs**
Look for these log messages:
- `📨 Sending message notification to user...`
- `✅ Message notification sent successfully...`
- `❌ Failed to send push notification...`
- `📱 Push notifications disabled for user...`
- `📱 No push subscriptions found for user...`

### 4. **Test Notification**
Use the test endpoint:
```bash
POST /api/push/test
```

This will:
- Show your subscription status
- Send a test notification
- Show any errors

## Common Issues

### **"No notifications received"**

1. **Check subscription exists**:
   - Visit `/api/push/test` (GET) to see your subscriptions
   - If empty, you need to subscribe again

2. **Check settings**:
   - Go to Settings → Notifications
   - Make sure "Push Notifications" is ON
   - For messages, also check "Message Notifications" is ON

3. **Check service worker**:
   - Open DevTools → Application → Service Workers
   - Verify service worker is registered and active

4. **Check browser permissions**:
   - Make sure notifications are allowed in browser settings
   - On mobile: Check device notification settings

5. **Check console logs**:
   - Look for errors in browser console
   - Check server logs for notification errors

### **"Subscription exists but no notifications"**

1. **Subscription might be invalid**:
   - Try unsubscribing and resubscribing
   - The system automatically removes invalid subscriptions

2. **VAPID keys might be wrong**:
   - Verify `NEXT_PUBLIC_VAPID_KEY` and `VAPID_PRIVATE_KEY` match
   - Keys must be the same on client and server

3. **Service worker not active**:
   - Check DevTools → Application → Service Workers
   - Service worker must be active for push to work

## Testing

### **Test Message Notification**
1. Have someone send you a message
2. Check server logs for: `📨 Sending message notification...`
3. Check if notification appears on your device

### **Test with API**
```bash
# Check subscription status
curl https://yourdomain.com/api/push/test

# Send test notification
curl -X POST https://yourdomain.com/api/push/test
```

## Next Steps

If notifications still don't work:
1. Check browser console for errors
2. Check server logs for notification attempts
3. Verify subscription exists in database
4. Test with `/api/push/test` endpoint
5. Try unsubscribing and resubscribing

