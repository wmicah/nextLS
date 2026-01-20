# Supabase Realtime Setup for Messaging

Since you're using Supabase, we can use **Supabase Realtime** instead of Socket.io! This is much simpler and works directly with your database.

## ✅ What's Already Done

1. **Supabase Client** (`src/lib/supabase-client.ts`)

   - Creates Supabase client instance
   - Checks for environment variables

2. **Realtime Hook** (`src/hooks/useSupabaseRealtime.ts`)

   - Listens to Message table changes
   - Automatically updates UI when new messages arrive
   - Handles connection/disconnection

3. **Updated MessagingServiceProvider**
   - Uses Supabase Realtime instead of Socket.io
   - Automatically invalidates queries on new messages

## 🚀 Setup Steps

### Step 1: Enable Realtime in Supabase Dashboard

**Important:** Realtime is NOT the same as "Replication" (which is in alpha). Realtime is a separate feature.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Database** → **Tables**
4. Find the **`Message`** table and click on it
5. Look for the **"Realtime"** section or tab in the table view
6. **Enable Realtime** for the `Message` table (toggle ON)
7. Also enable for **`Conversation`** table (for conversation updates)

**Alternative Method (if Realtime toggle isn't visible):**

1. Go to **Database** → **Settings**
2. Look for **"Realtime"** section
3. Enable Realtime globally, or
4. Use SQL to enable it (see Step 3 below)

### Step 2: Add Environment Variables

Add these to your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**How to find these:**

1. Go to Supabase Dashboard
2. Project Settings → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 3: Enable Realtime via SQL (If UI Option Not Available)

If you can't find the Realtime toggle in the UI, enable it via SQL:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL:

```sql
-- Enable Realtime for Message table
ALTER PUBLICATION supabase_realtime ADD TABLE "Message";

-- Enable Realtime for Conversation table
ALTER PUBLICATION supabase_realtime ADD TABLE "Conversation";
```

This adds your tables to Supabase's Realtime publication, which allows them to broadcast changes.

### Step 4: Enable Row Level Security (RLS)

Supabase Realtime requires RLS policies. Add these in Supabase SQL Editor:

```sql
-- Enable RLS on Message table
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- Allow users to read messages in their conversations
CREATE POLICY "Users can read messages in their conversations"
ON "Message"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Conversation"
    WHERE "Conversation".id = "Message"."conversationId"
    AND (
      "Conversation"."coachId" = auth.uid()::text
      OR "Conversation"."clientId" = auth.uid()::text
      OR "Conversation"."client1Id" = auth.uid()::text
      OR "Conversation"."client2Id" = auth.uid()::text
    )
  )
);

-- Allow users to insert messages in their conversations
CREATE POLICY "Users can insert messages in their conversations"
ON "Message"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Conversation"
    WHERE "Conversation".id = "Message"."conversationId"
    AND (
      "Conversation"."coachId" = auth.uid()::text
      OR "Conversation"."clientId" = auth.uid()::text
      OR "Conversation"."client1Id" = auth.uid()::text
      OR "Conversation"."client2Id" = auth.uid()::text
    )
  )
);
```

**Note:** If you're using Kinde Auth (not Supabase Auth), you'll need to use a different approach. See "Alternative Setup" below.

### Step 5: Test the Connection

1. Restart your dev server:

   ```bash
   npm run dev
   ```

2. Open your app and check the browser console
3. You should see: `✅ Supabase Realtime connected`
4. Send a test message - it should appear instantly!

## 🔧 Alternative Setup (If Using Kinde Auth)

If you're using Kinde Auth instead of Supabase Auth, you have two options:

### Option A: Use Service Role Key (Development Only)

⚠️ **Warning:** Only use this in development! The service role key bypasses RLS.

```env
# Add to .env (development only!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Then update `src/lib/supabase-client.ts` to use service role for Realtime:

```typescript
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
```

### Option B: Disable RLS for Realtime (Recommended)

Since you're using Kinde Auth, you can disable RLS for Realtime subscriptions:

```sql
-- Disable RLS for Realtime (messages are already protected by your app logic)
ALTER TABLE "Message" DISABLE ROW LEVEL SECURITY;
```

Then add a policy that allows Realtime subscriptions:

```sql
-- Allow Realtime subscriptions
CREATE POLICY "Allow Realtime subscriptions"
ON "Message"
FOR SELECT
USING (true);
```

## 📊 How It Works

1. **New Message Created** → Supabase triggers Realtime event
2. **Realtime Hook Receives Event** → Calls `onNewMessage` callback
3. **Queries Invalidated** → React Query refetches data
4. **UI Updates** → New message appears instantly!

## ✅ Benefits

- ✅ **No polling needed** - Real-time updates from database
- ✅ **No separate server** - Uses Supabase infrastructure
- ✅ **Automatic scaling** - Supabase handles connections
- ✅ **Built-in security** - RLS policies protect data
- ✅ **Lower database load** - Only queries on actual changes

## 🐛 Troubleshooting

### "Supabase not configured" warning

- Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart your dev server after adding env variables

### Realtime not connecting

- Check Supabase Dashboard → Database → Replication
- Make sure Realtime is enabled for `Message` table
- Check browser console for connection errors

### Messages not updating

- Verify RLS policies are set correctly
- Check that Realtime is enabled in Supabase Dashboard
- Look for errors in browser console

### Still seeing polling

- The system falls back to polling if Realtime isn't connected
- Once Realtime connects, polling stops automatically

## 🎯 Next Steps

1. Enable Realtime in Supabase Dashboard
2. Add environment variables
3. Set up RLS policies (or disable RLS if using Kinde)
4. Test the connection
5. Enjoy real-time messaging! 🎉
