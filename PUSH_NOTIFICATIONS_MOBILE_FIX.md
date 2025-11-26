# 📱 Mobile Push Notifications Fix

## Issues Fixed

### 1. **Service Worker Registration**

- **Problem**: Service worker was only registered in production mode
- **Fix**: Now registers in both development and production
- **Impact**: Push notifications can now be tested locally

### 2. **Service Worker Ready State**

- **Problem**: Subscription attempted before service worker was ready
- **Fix**: Added proper waiting for service worker registration and ready state
- **Impact**: Prevents subscription failures due to timing issues

### 3. **Better Error Handling**

- **Problem**: Errors were silent, making debugging difficult
- **Fix**: Added comprehensive logging and specific error messages
- **Impact**: Easier to diagnose issues

### 4. **Subscription Management**

- **Problem**: No check for existing subscriptions
- **Fix**: Checks for existing subscriptions and updates server if found
- **Impact**: Prevents duplicate subscriptions and ensures server is in sync

## Testing Push Notifications

### 1. **Check Subscription Status**

```bash
# GET request to check your subscriptions
curl https://yourdomain.com/api/push/test
```

Or visit: `https://yourdomain.com/api/push/test` in your browser (while logged in)

### 2. **Send Test Notification**

```bash
# POST request to send a test notification
curl -X POST https://yourdomain.com/api/push/test
```

### 3. **Browser Console**

Open your browser's developer console and look for:

- ✅ `Service Worker registered successfully`
- ✅ `Service Worker is ready`
- ✅ `Push subscription created`
- ✅ `Push subscription saved to server`

### 4. **Check Database**

Verify your subscription is saved:

```sql
SELECT * FROM push_subscriptions WHERE "userId" = 'your-user-id';
```

## Mobile-Specific Notes

### **iOS Safari**

- ⚠️ **Important**: Push notifications only work when the app is installed as a PWA (Progressive Web App)
- To install as PWA:
  1. Open the site in Safari
  2. Tap the Share button
  3. Select "Add to Home Screen"
  4. Open the app from the home screen
  5. Then enable push notifications

### **Android Chrome**

- Push notifications work in the browser
- Better support than iOS
- No PWA installation required (but recommended)

### **Common Issues**

1. **"Push messaging is not supported"**

   - Check if you're using HTTPS (required for push notifications)
   - Check if service worker is supported in your browser

2. **"Permission not granted"**

   - User needs to allow notifications in browser settings
   - On mobile: Check browser notification permissions in device settings

3. **"VAPID key error"**

   - Verify `NEXT_PUBLIC_VAPID_KEY` and `VAPID_PRIVATE_KEY` are set correctly
   - Keys must match between client and server

4. **Notifications not received**
   - Check if push notifications are enabled in user settings
   - Verify subscription exists in database
   - Check server logs for errors
   - Test with `/api/push/test` endpoint

## Debugging Steps

1. **Check Service Worker**

   - Open DevTools → Application → Service Workers
   - Verify service worker is registered and active
   - Check for any errors

2. **Check Subscriptions**

   - Open DevTools → Application → Service Workers → Push
   - Verify subscription exists
   - Check subscription endpoint

3. **Check Console Logs**

   - Look for error messages in browser console
   - Check server logs for subscription errors

4. **Test Notification**
   - Use `/api/push/test` endpoint
   - Check if notification is sent successfully
   - Verify notification appears on device

## Environment Variables

Make sure these are set in your `.env` file:

```bash
NEXT_PUBLIC_VAPID_KEY=your_public_vapid_key
VAPID_PRIVATE_KEY=your_private_vapid_key
VAPID_SUBJECT=mailto:notifications@yourdomain.com
```

## Next Steps

1. **Test on your device**:

   - Enable push notifications in settings
   - Check browser console for any errors
   - Try sending a test notification

2. **If still not working**:

   - Check browser console for specific errors
   - Verify VAPID keys are correct
   - Check if service worker is registered
   - Test with `/api/push/test` endpoint

3. **For iOS users**:
   - Make sure they install the app as PWA
   - Push notifications won't work in regular Safari browser
