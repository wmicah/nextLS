# Settings Implementation Guide

## Overview

All client management settings in the Coach Settings page are now fully functional. This document explains how each setting works and how to test it.

---

## ✅ Implemented Settings

### 1. **Default Welcome Message** (`defaultWelcomeMessage`)

**What it does:**

- When a new client is assigned to a coach, they receive an automatic welcome message
- Uses the coach's custom message from settings if configured
- Falls back to default message if not set

**How it works:**

- Location: `src/trpc/index.ts` - `sendWelcomeMessage()` function (lines 62-89)
- Fetches coach's `UserSettings.defaultWelcomeMessage`
- Sends message when client is first assigned to coach

**How to test:**

1. Go to Coach Settings → Client Management
2. Set a custom welcome message (e.g., "Hey! Welcome to my coaching program!")
3. Add a new client
4. Check the Messages page - the new client should have received your custom welcome message

**Default message:**

```
Welcome to Next Level Softball! Hi there, I'm [Coach Name], your softball coach.
I'm excited to work with you and help you reach your goals. Feel free to message me
anytime with questions, concerns, or just to chat about your progress.
```

---

### 2. **Require Client Email** (`requireClientEmail`)

**What it does:**

- When enabled, coaches MUST provide an email address when creating new clients
- Prevents client creation without email

**How it works:**

- Location: `src/trpc/index.ts` - `clients.create` mutation (lines 1061-1072)
- Checks coach's `UserSettings.requireClientEmail` setting
- Throws error if email is required but not provided

**How to test:**

1. Go to Coach Settings → Client Management
2. Enable "Require client email for new registrations"
3. Try to add a new client WITHOUT an email
4. Should see error: "Email is required for new clients. Please provide a client email address."
5. Try again WITH an email - should work

---

### 3. **Auto-Archive After X Months** (`autoArchiveDays`)

**What it does:**

- Automatically archives clients who haven't been active
- Based on the `updatedAt` timestamp of the client record
- Archives occur when coach views their client list

**How it works:**

- Location: `src/trpc/index.ts` - `clients.list` query (lines 772-814)
- Converts months to days (months × 30)
- Checks `Client.updatedAt` against threshold
- Archives matching clients automatically

**How to test:**

1. Go to Coach Settings → Client Management
2. Set "Auto-Archive After Months of Inactivity" to 3 months (90 days)
3. In database, manually update a client's `updatedAt` to 4 months ago:
   ```sql
   UPDATE clients
   SET "updatedAt" = NOW() - INTERVAL '120 days'
   WHERE id = 'client-id-here';
   ```
4. Visit the Clients page
5. Client should automatically move to "Archived" tab
6. Check console logs for: `📦 Auto-archived X inactive clients`

**Note:** Auto-archiving happens every time the client list is loaded. Consider this behavior for optimization.

---

### 4. **Message Retention** (`messageRetentionDays`)

**What it does:**

- Deletes old messages from conversations with archived clients
- Keeps message history clean and reduces database size
- Manual cleanup - coach triggers it when needed

**How it works:**

- Location: `src/trpc/index.ts` - `utils.cleanupArchivedMessages` mutation (lines 14217-14316)
- Converts months to days (months × 30)
- Finds all archived client conversations
- Deletes messages older than threshold

**How to test:**

1. Go to Coach Settings → Client Management
2. Set "Message Retention" to 3 months (90 days)
3. Archive a client who has message history
4. To trigger cleanup, you need to call the TRPC endpoint:
   ```typescript
   // In browser console on any authenticated coach page:
   await fetch("/api/trpc/utils.cleanupArchivedMessages", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
   });
   ```
5. Check console logs for: `🧹 Cleaned up X old messages from archived clients`

**Future Enhancement:**
Consider adding:

- A "Cleanup Now" button in settings UI
- Automated cron job to run cleanup daily/weekly
- Display last cleanup date and message count

---

## 📊 Database Schema

All settings are stored in the `UserSettings` model:

```prisma
model UserSettings {
  // Messaging settings
  defaultWelcomeMessage String?
  messageRetentionDays  Int      @default(90)

  // Client management settings
  autoArchiveDays       Int      @default(90)
  requireClientEmail    Boolean  @default(false)
}
```

---

## 🔄 Data Conversion

The UI displays settings in **months** but stores them in **days**:

**Frontend → Backend:**

- User inputs: 3 months
- Saved as: 90 days (3 × 30)

**Backend → Frontend:**

- Stored as: 90 days
- Displayed as: 3 months (90 ÷ 30, rounded)

**Note:** Uses 30-day months for simplicity. Legacy odd-day values normalize on next save.

---

## 🧪 Testing Checklist

- [ ] Custom welcome message appears for new clients
- [ ] Client creation fails without email when required
- [ ] Inactive clients auto-archive based on threshold
- [ ] Old messages delete from archived client conversations
- [ ] Settings save correctly (check Settings page reload)
- [ ] Settings persist across sessions
- [ ] Default values work when settings not configured

---

## 🚀 Future Enhancements

### Priority 1: Add Cleanup UI

Create a button in settings to manually trigger message cleanup:

```typescript
const cleanupMutation = trpc.utils.cleanupArchivedMessages.useMutation();
<button onClick={() => cleanupMutation.mutate()}>Clean Up Old Messages</button>;
```

### Priority 2: Automated Cleanup Job

Create a cron job or scheduled task:

- File: `src/app/api/cron/cleanup-messages/route.ts`
- Schedule: Daily at 2 AM
- Loops through all coaches and runs cleanup

### Priority 3: Better Archive Detection

Currently uses `updatedAt` timestamp. Consider:

- Last lesson date
- Last message sent/received
- Last program assignment
- Combination of activity metrics

### Priority 4: Notification System

- Notify coach before auto-archiving
- Show list of clients about to be archived
- Allow manual override/prevention

---

## 📝 Notes

- Auto-archiving is **not destructive** - archived clients can be restored
- Message cleanup **is permanent** - messages are deleted forever
- Settings are **per-coach** - each coach has independent settings
- All operations are **logged** to console for debugging

---

## 🐛 Debugging

**Check if settings are saving:**

```sql
SELECT * FROM user_settings WHERE "userId" = 'your-user-id';
```

**Check auto-archive log:**
Look for console message: `📦 Auto-archived X inactive clients`

**Check cleanup log:**
Look for console message: `🧹 Cleaned up X old messages from archived clients`

**Verify client last activity:**

```sql
SELECT id, name, "updatedAt", archived
FROM clients
WHERE "coachId" = 'your-user-id'
ORDER BY "updatedAt" DESC;
```

---

## ✅ Conclusion

All client management settings are now **fully functional** and ready for production use!

