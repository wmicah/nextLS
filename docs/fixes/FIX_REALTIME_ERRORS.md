# Fix Supabase Realtime Channel Errors

## The Problem

You're seeing repeated `❌ Supabase Realtime channel error` messages. This means Realtime is trying to connect but failing.

## Common Causes

### 1. Realtime Not Enabled for Tables (Most Common)

The tables need to be added to the `supabase_realtime` publication.

**Fix:**
1. Go to Supabase Dashboard → **SQL Editor**
2. Run this SQL:

```sql
-- Enable Realtime for Message table
ALTER PUBLICATION supabase_realtime ADD TABLE "Message";

-- Enable Realtime for Conversation table
ALTER PUBLICATION supabase_realtime ADD TABLE "Conversation";
```

3. Verify it worked:
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('Message', 'Conversation');
```

Should show both tables.

### 2. Row Level Security (RLS) Blocking

If RLS is enabled, it might be blocking Realtime subscriptions.

**Fix:**
Since you're using Kinde Auth (not Supabase Auth), disable RLS:

```sql
ALTER TABLE "Message" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" DISABLE ROW LEVEL SECURITY;
```

**OR** create a policy that allows reads:

```sql
-- Enable RLS
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- Allow all reads (your app logic protects writes)
CREATE POLICY "Allow Realtime subscriptions"
ON "Message"
FOR SELECT
USING (true);
```

### 3. Environment Variables Not Set

Check your `.env` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Find these:**
- Dashboard → **Settings** → **API**
- Copy **Project URL** and **anon/public key**

### 4. Realtime Disabled Globally

Check if Realtime is disabled in Supabase settings.

**Check:**
1. Dashboard → **Settings** → **Database**
2. Look for **Realtime** section
3. Make sure it's **enabled**

## Quick Fix Checklist

- [ ] Run SQL to add tables to publication (see #1 above)
- [ ] Disable RLS or add read policy (see #2 above)
- [ ] Check environment variables are set
- [ ] Restart dev server after changes
- [ ] Check browser console for connection status

## Verify It's Working

After fixing, you should see in browser console:

```
✅ Supabase Realtime connected - NO MORE POLLING!
🔌 Supabase Realtime Status: ✅ Connected
```

**NOT:**
```
❌ Supabase Realtime channel error
🔌 Supabase Realtime Status: ❌ Not Connected
```

## Still Not Working?

1. **Check Supabase Dashboard:**
   - Database → **Replication** (not the alpha feature!)
   - Should show Realtime is enabled

2. **Check Network Tab:**
   - Look for WebSocket connections to `wss://your-project.supabase.co`
   - Should see a WebSocket connection, not just HTTP

3. **Try a simpler test:**
   - Create a test table in Supabase
   - Add it to Realtime publication
   - See if that works

4. **Check Supabase Status:**
   - Visit https://status.supabase.com
   - Make sure Realtime service is operational

