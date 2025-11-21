# Push Notifications Setup Guide

## Overview

This guide will help you set up push notifications for your PWA. Push notifications allow you to send notifications to users even when they're not actively using your app.

## Prerequisites

- PWA is already configured (service worker, manifest, etc.)
- `web-push` package is installed (already in package.json)

## Step 1: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for push notifications. You need to generate a public/private key pair.

### Option 1: Using npx (Recommended - No Installation Needed)

```bash
npx web-push generate-vapid-keys
```

This will output your keys. **Your generated keys are:**

```
Public Key: BJmY1hCwoFMlFc67g3k8ehL0RAyf72sPxkVjNzMn8OPk-nv9BwR1xF8hLQwWvkj-mPFtNCPoySRFRitF80l3j44
Private Key: QBIAsh2xty8paP3Zbd33kCWzOnXLjnP5on5k4xHol9Y
```

### Option 2: Using Global Installation

```bash
npm install -g web-push
web-push generate-vapid-keys
```

### Option 2: Using Online Tool

Visit: https://web-push-codelab.glitch.me/

## Step 2: Configure Environment Variables

**Important:**

- Replace `mailto:notifications@nextlevelcoaching.com` with your actual email or website URL
- The `NEXT_PUBLIC_VAPID_KEY` is exposed to the client (that's why it has `NEXT_PUBLIC_` prefix)
- The `VAPID_PRIVATE_KEY` should NEVER be exposed to the client - keep it server-side only

**Important:**

- The `NEXT_PUBLIC_VAPID_KEY` is exposed to the client (that's why it has `NEXT_PUBLIC_` prefix)
- The `VAPID_PRIVATE_KEY` should NEVER be exposed to the client - keep it server-side only
- `VAPID_SUBJECT` should be a mailto: link or your website URL

## Step 3: Run Database Migration

After adding the `PushSubscription` model to Prisma schema:

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migration
npx prisma migrate dev --name add_push_subscriptions

# Or if you prefer to push directly (dev only)
npx prisma db push
```

## Step 4: Test Push Notifications

1. **Enable Notifications in Browser:**

   - Users need to grant notification permission
   - This is handled automatically by the `PushNotificationSetup` component

2. **Subscribe to Notifications:**

   - Navigate to a page with the `PushNotificationSetup` component (e.g., Settings)
   - Click "Enable" to request permission and subscribe

3. **Send Test Notification:**
   - Use the "Test Notification" button in the component
   - Or use the API endpoint: `POST /api/push/send`

## Step 5: Send Notifications from Your Code

### Example: Send Notification When Message is Received

```typescript
import { sendPushNotification } from "@/lib/pushNotificationService";

// In your message handler
await sendPushNotification(
  recipientUserId,
  "New Message",
  `${senderName}: ${messagePreview}`,
  {
    type: "message",
    conversationId: conversationId,
    url: `/messages?conversationId=${conversationId}`,
  }
);
```

### Example: Send Lesson Reminder

```typescript
await sendPushNotification(
  userId,
  "Lesson Reminder",
  `You have a lesson in 1 hour: ${lessonTitle}`,
  {
    type: "lesson",
    lessonId: lessonId,
    url: "/schedule",
    tag: `lesson-${lessonId}`,
    requireInteraction: true, // Requires user to interact before closing
  }
);
```

## API Endpoints

### POST `/api/push/subscribe`

Subscribes a user to push notifications. Requires authentication.

**Request Body:**

```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

### POST `/api/push/send`

Sends a push notification (for testing or admin use).

**Request Body:**

```json
{
  "subscription": { ... },
  "payload": {
    "title": "Notification Title",
    "body": "Notification body text",
    "data": { ... }
  }
}
```

## Features

- ✅ Multiple device support (one user can have multiple subscriptions)
- ✅ Automatic cleanup of expired/invalid subscriptions
- ✅ Respects user notification preferences (from UserSettings)
- ✅ Handles notification clicks and navigation
- ✅ Works offline (service worker handles push events)

## Browser Support

- ✅ Chrome/Edge (desktop & Android)
- ✅ Firefox (desktop & Android)
- ✅ Safari (macOS & iOS 16.4+)
- ❌ iOS Safari (limited support, requires iOS 16.4+)

## Troubleshooting

### Notifications not working?

1. Check browser console for errors
2. Verify VAPID keys are set correctly
3. Ensure service worker is registered
4. Check that user granted notification permission
5. Verify subscription is saved in database

### "Push messaging is not supported"

- Browser doesn't support push notifications
- Service worker not registered
- Not using HTTPS (required for push notifications)

### Notifications not being received?

1. Check if subscription exists in database
2. Verify VAPID keys match between client and server
3. Check browser notification settings
4. Ensure user has `pushNotifications: true` in settings

## Security Notes

- VAPID private key must be kept secret
- Always authenticate subscription requests
- Validate subscription data before storing
- Clean up expired subscriptions regularly
