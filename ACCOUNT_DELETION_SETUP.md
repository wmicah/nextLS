# 🗑️ Complete Account Deletion Setup

This guide explains how to enable **complete account deletion** that removes users from both your database AND Kinde authentication system.

## 📌 Current Status

✅ **What's Already Working:**

- Users can delete their accounts from the UI
- Account deletion removes all user data from your database (cascading deletes)
- Analytics are logged for each deletion
- User is logged out after deletion
- Success message shown on home page

⚠️ **What Needs Setup (Optional):**

- Deletion from Kinde authentication system (requires Management API token)

## 🔧 Without Kinde Management API Token

**Current Behavior:**

- User account is deleted from your database ✅
- User is logged out ✅
- BUT: User still exists in Kinde

**What This Means:**

- If the user signs in again, Kinde will recreate their account
- They'll go through role selection again (which is what you wanted!)
- This is actually **fine for your use case** - users can re-register with a different role

## 🚀 With Kinde Management API Token (Complete Deletion)

**Enhanced Behavior:**

- User account is deleted from your database ✅
- User account is deleted from Kinde ✅
- User is logged out ✅
- User is **completely removed** from your system

**When to Use This:**

- You want complete GDPR compliance
- You don't want users to be able to re-register
- You want to permanently remove all traces of a user

## 📋 Setup Instructions (Optional)

### Step 1: Create Machine-to-Machine Application in Kinde

1. Go to your [Kinde Dashboard](https://app.kinde.com)
2. Navigate to **Settings** → **Applications**
3. Click **Add Application**
4. Select **Machine to Machine (M2M)** application type
5. Name it something like "Account Management API"
6. Click **Save**

### Step 2: Get Your Management API Token

1. In your new M2M application, go to **APIs**
2. Click **Kinde Management API**
3. Enable the following scopes:
   - `delete:users` (required for deleting users)
   - `read:users` (optional, for verification)
4. Copy the **Client ID** and **Client Secret**
5. Generate an access token using these credentials

**Generate Token (using curl):**

```bash
curl --request POST \
  --url https://YOUR_DOMAIN.kinde.com/oauth2/token \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data grant_type=client_credentials \
  --data client_id=YOUR_M2M_CLIENT_ID \
  --data client_secret=YOUR_M2M_CLIENT_SECRET \
  --data audience=https://YOUR_DOMAIN.kinde.com/api
```

### Step 3: Add Token to Environment Variables

Add this to your `.env` file:

```env
# Kinde Management API Token (optional - for complete account deletion)
KINDE_MANAGEMENT_API_TOKEN=your_management_api_token_here
```

### Step 4: Restart Your Application

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

## ✅ Verification

After setup, when a user deletes their account, you should see in the console:

```
🗑️ Attempting to delete user from Kinde: user_xxxxx
✅ Successfully deleted user from Kinde: user_xxxxx
✅ User account deleted from database: user_xxxxx - Reason: wrong_role - Kinde deleted: true
```

Without the token, you'll see:

```
⚠️ Kinde Management API not configured. User will only be deleted from database.
✅ User account deleted from database: user_xxxxx - Reason: wrong_role - Kinde deleted: false
```

## 🎯 Recommendation

**For your use case (allowing users to switch roles):**

- You **don't need** the Kinde Management API token
- The current setup works perfectly - users can delete and re-register
- Database deletion + logout is sufficient

**Only add the Management API token if:**

- You need complete GDPR compliance
- You want to permanently ban users from re-registering
- You're required to completely remove user data from all systems

## 🔒 Security Notes

- The Management API token has powerful permissions
- Keep it secret and never commit it to version control
- Rotate it periodically
- Only use it server-side (never expose to client)
- Consider using environment-specific tokens (dev vs production)

## 📊 Analytics

All account deletions are logged in the `account_deletion_logs` table with:

- User ID and email (for analytics before deletion)
- Deletion reason (wrong_role, privacy_concerns, etc.)
- Timestamp
- Whether Kinde deletion was successful

Admins can view deletion analytics in the admin dashboard.

## 🆘 Troubleshooting

**Issue:** "Failed to delete user from Kinde"

- Check that your Management API token is valid
- Verify the token has `delete:users` scope
- Ensure your Kinde domain is correct in `.env`

**Issue:** User can still log in after deletion

- This is expected without the Management API token
- User will go through role selection again (which is the desired behavior)

**Issue:** Database deletion fails

- Check Prisma schema has `onDelete: Cascade` on all User relations
- Review console logs for specific error messages

