# 🔍 Push Notification Debugging Guide

## When a Client Sends You a Message

### Step 1: Check Server Logs

When a client sends you a message, check your server logs for these messages:

```
🔍 Determining recipient for conversation...
👤 Determined recipient: YOUR_USER_ID (sender: CLIENT_ID)
📬 Message sent from CLIENT_ID to YOUR_USER_ID
📱 Attempting to send push notification to recipient YOUR_USER_ID...
📨 Sending message notification to user YOUR_USER_ID from CLIENT_NAME
📱 Sending push notification to user YOUR_USER_ID (X subscription(s))
📤 Attempting to send to X subscription(s)...
```

### Step 2: Check What Happens

**If you see:**
- `📱 No push subscriptions found for user...` → **You need to subscribe**
- `📱 Push notifications disabled for user...` → **Check your settings**
- `💬 Message notifications disabled for user...` → **Check your message notification settings**
- `❌ Failed to send to subscription...` → **Subscription is invalid (will be auto-removed)**

### Step 3: Verify Your Subscription

1. **Check if you have a subscription:**
   - Visit: `https://yourdomain.com/api/push/test` (GET request while logged in)
   - This shows your subscription count and details

2. **Test sending a notification:**
   - POST to: `https://yourdomain.com/api/push/test`
   - This sends a test notification to your device

### Step 4: Common Issues

#### **Issue: No Subscription**
**Solution:**
1. Go to Settings → Notifications
2. Toggle "Push Notifications" OFF then ON
3. Click "Enable" when prompted
4. Check browser console for errors

#### **Issue: Subscription Exists But No Notifications**
**Possible causes:**
1. **Service worker not active**:
   - Open DevTools → Application → Service Workers
   - Verify service worker is registered and active
   - On mobile PWA: Service worker must be active

2. **Invalid subscription**:
   - The system auto-removes invalid subscriptions
   - Try unsubscribing and resubscribing

3. **VAPID keys mismatch**:
   - Verify `NEXT_PUBLIC_VAPID_KEY` matches on client and server
   - Verify `VAPID_PRIVATE_KEY` is set correctly

4. **Mobile PWA specific**:
   - Make sure you opened the app from home screen (not browser)
   - Service worker must be active
   - Check device notification permissions

#### **Issue: Notifications Disabled**
**Check:**
1. Settings → Notifications → "Push Notifications" = ON
2. Settings → Notifications → "Message Notifications" = ON
3. Browser notification permissions = Allowed
4. Device notification permissions = Allowed (for mobile)

### Step 5: Mobile PWA Specific

**For iOS:**
- Push notifications ONLY work when app is installed as PWA
- Must open from home screen, not Safari browser
- Check iOS Settings → [Your App] → Notifications

**For Android:**
- Works in browser, but better as PWA
- Check Chrome Settings → Site Settings → Notifications

### Step 6: Test the Flow

1. **Have someone send you a message**
2. **Check server logs** - you should see:
   ```
   📱 Attempting to send push notification...
   📨 Sending message notification...
   📱 Sending push notification to user... (X subscription(s))
   ✅ Push notification sent successfully to X device(s)
   ```

3. **If you see errors**, check:
   - Subscription exists?
   - Settings enabled?
   - Service worker active?
   - VAPID keys correct?

### Quick Debug Checklist

- [ ] Subscription exists (check `/api/push/test`)
- [ ] Push notifications enabled in settings
- [ ] Message notifications enabled in settings
- [ ] Browser notification permission = Allowed
- [ ] Service worker registered and active
- [ ] Test notification works (`/api/push/test` POST)
- [ ] Server logs show notification attempt
- [ ] No errors in server logs

### Next Steps

If notifications still don't work:
1. Check server logs when message is sent
2. Check browser console for errors
3. Test with `/api/push/test` endpoint
4. Verify subscription exists in database
5. Try unsubscribing and resubscribing

