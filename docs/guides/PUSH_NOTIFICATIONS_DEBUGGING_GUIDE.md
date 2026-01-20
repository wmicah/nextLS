# 🔍 Push Notifications Debugging Guide

## Quick Diagnostic Tool

Use the new diagnostic endpoint to check your push notification setup:

**GET** `/api/push/diagnose` - Returns comprehensive diagnostic information
**POST** `/api/push/diagnose` with `{ "action": "test" }` - Sends a test notification

## Step-by-Step Debugging

### Step 1: Check Diagnostic Endpoint

1. Open your browser and navigate to: `https://yourdomain.com/api/push/diagnose`
2. You should see a JSON response with:
   - `checks`: All configuration checks
   - `issues`: List of problems found
   - `recommendations`: How to fix each issue
   - `subscriptions`: Your current subscriptions
   - `settings`: Your notification settings

### Step 2: Common Issues and Fixes

#### Issue 1: "No push subscriptions found"

**Symptoms:**
- `checks.hasSubscriptions: false`
- `subscriptions.count: 0`

**Fix:**
1. Go to Settings → Notifications
2. Toggle "Push Notifications" OFF then ON
3. Click "Enable" when prompted
4. Grant browser permission if asked
5. Check browser console for errors

**Verify:**
- Check `/api/push/diagnose` again - should show `subscriptions.count > 0`

#### Issue 2: "Push notifications are disabled in user settings"

**Symptoms:**
- `checks.pushNotificationsEnabled: false`
- `settings.pushNotifications: false`

**Fix:**
1. Go to Settings → Notifications
2. Enable "Push Notifications" toggle
3. If prompted, click "Enable" to subscribe

#### Issue 3: "VAPID keys may not be configured"

**Symptoms:**
- `checks.vapidKeys.usingDefaults: true`
- `checks.vapidKeys.publicKeySet: false`

**Fix:**
1. Check your `.env` or `.env.local` file
2. Ensure these variables are set:
   ```
   NEXT_PUBLIC_VAPID_KEY=your_public_key_here
   VAPID_PRIVATE_KEY=your_private_key_here
   VAPID_SUBJECT=mailto:notifications@yourdomain.com
   ```
3. Restart your development server or redeploy

**Generate new keys:**
```bash
npx web-push generate-vapid-keys
```

#### Issue 4: "Service worker not registered"

**Symptoms:**
- No service worker in DevTools → Application → Service Workers
- Browser console shows "Service worker registration failed"

**Fix:**
1. Check that `/public/sw.js` exists
2. Clear browser cache and reload
3. Check browser console for service worker errors
4. Ensure you're using HTTPS (required for push notifications)

#### Issue 5: "Subscription exists but notifications not received"

**Possible causes:**

1. **Invalid subscription (expired/revoked)**
   - The system auto-removes invalid subscriptions
   - Try unsubscribing and resubscribing
   - Check server logs for 410/404 errors

2. **Service worker not active**
   - Open DevTools → Application → Service Workers
   - Verify service worker is "activated and running"
   - If not, click "Unregister" then reload page

3. **Browser notification permission denied**
   - Check browser settings → Site Settings → Notifications
   - Ensure your site is allowed
   - Try resetting permissions and re-enabling

4. **Mobile PWA specific**
   - Must open app from home screen (not browser)
   - Service worker must be active
   - Check device notification permissions

### Step 3: Test Notification Flow

1. **Check subscription status:**
   ```
   GET /api/push/diagnose
   ```
   Should show `overall.canReceiveNotifications: true`

2. **Send test notification:**
   ```
   POST /api/push/diagnose
   Body: { "action": "test" }
   ```
   Should return `success: true`

3. **Check server logs:**
   Look for:
   ```
   📱 Sending push notification to user...
   📤 Attempting to send to X subscription(s)...
   ✅ Successfully sent to subscription X
   ```

4. **Check browser console:**
   Look for:
   ```
   📬 Push event received
   📬 Showing notification: Test Notification
   ✅ Notification shown successfully
   ```

### Step 4: Verify Real Notifications

1. **Send a test message** (if you have another user)
2. **Check server logs** for:
   ```
   📨 sendMessageNotification called for user...
   📱 Sending push notification to user...
   ✅ Push notification sent successfully
   ```

3. **If notifications don't arrive:**
   - Check `/api/push/diagnose` for issues
   - Check server logs for errors
   - Check browser console for service worker errors
   - Verify subscription is still valid

## Debugging Checklist

- [ ] User exists in database
- [ ] Push notifications enabled in settings
- [ ] Message notifications enabled in settings (for messages)
- [ ] At least one subscription exists
- [ ] VAPID keys are configured
- [ ] Service worker is registered and active
- [ ] Browser notification permission is granted
- [ ] Test notification works (`/api/push/diagnose` POST)
- [ ] Server logs show notification attempts
- [ ] No errors in server logs
- [ ] No errors in browser console

## Server-Side Debugging

### Check Server Logs

When a notification should be sent, look for:

```
📱 Sending push notification to user USER_ID (X subscription(s))
📤 Attempting to send to X subscription(s)...
📤 Notification payload: { title: "...", body: "..." }
```

**If you see:**
- `📱 No push subscriptions found` → User needs to subscribe
- `📱 Push notifications disabled` → User disabled in settings
- `❌ Failed to send to subscription` → Subscription is invalid (will be auto-removed)
- `✅ Successfully sent` → Notification was sent successfully

### Common Server Errors

1. **VAPID key mismatch**
   - Error: "VAPID key error" or "Invalid VAPID key"
   - Fix: Ensure `NEXT_PUBLIC_VAPID_KEY` and `VAPID_PRIVATE_KEY` match

2. **Invalid subscription**
   - Error: Status code 410 or 404
   - Fix: System auto-removes these. User needs to resubscribe.

3. **Network error**
   - Error: "ECONNREFUSED" or timeout
   - Fix: Check internet connection, verify push service is accessible

## Client-Side Debugging

### Browser Console

Check for these messages:

**During subscription:**
```
🚀 Starting push notification subscription...
📱 Checking service worker registration...
✅ Service worker registered
📱 Creating new push subscription...
✅ Push subscription created
📤 Sending subscription to server...
✅ Subscription saved to server
```

**When notification arrives:**
```
📬 Push event received
📬 Parsed payload: { title: "...", body: "..." }
📬 Showing notification: ...
✅ Notification shown successfully
```

### Service Worker Status

1. Open DevTools → Application → Service Workers
2. Check:
   - Service worker is registered
   - Status is "activated and running"
   - No errors in console

### Notification Permission

1. Open DevTools → Application → Notifications
2. Check permission status
3. If denied, user must enable in browser settings

## Mobile-Specific Issues

### iOS (Safari)

- Push notifications ONLY work when app is installed as PWA
- Must open from home screen, not Safari browser
- Requires iOS 16.4+
- Check: iOS Settings → [Your App] → Notifications

### Android (Chrome)

- Works in browser, but better as PWA
- Check: Chrome Settings → Site Settings → Notifications
- Ensure site is allowed

## Still Not Working?

1. **Run full diagnostic:**
   ```
   GET /api/push/diagnose
   ```

2. **Check all issues listed:**
   - Fix each issue in order
   - Re-run diagnostic after each fix

3. **Test with test endpoint:**
   ```
   POST /api/push/diagnose
   Body: { "action": "test" }
   ```

4. **Check server logs:**
   - Look for errors when sending
   - Check subscription validity
   - Verify VAPID keys

5. **Check browser console:**
   - Service worker errors
   - Subscription errors
   - Notification permission errors

6. **Try resubscribing:**
   - Unsubscribe (disable in settings)
   - Clear browser cache
   - Re-enable and subscribe again

## Quick Test Script

```javascript
// Run in browser console to test subscription
async function testPushNotifications() {
  // Check permission
  console.log("Permission:", Notification.permission);
  
  // Check service worker
  const registration = await navigator.serviceWorker.getRegistration();
  console.log("Service worker:", registration ? "Registered" : "Not registered");
  
  // Check subscription
  if (registration) {
    const subscription = await registration.pushManager.getSubscription();
    console.log("Subscription:", subscription ? "Active" : "None");
  }
  
  // Test diagnostic endpoint
  const response = await fetch("/api/push/diagnose");
  const data = await response.json();
  console.log("Diagnostic:", data);
  
  // Send test notification
  const testResponse = await fetch("/api/push/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "test" })
  });
  const testData = await testResponse.json();
  console.log("Test result:", testData);
}

testPushNotifications();
```

