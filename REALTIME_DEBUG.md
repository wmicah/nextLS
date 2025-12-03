# Debugging Supabase Realtime

## Check if Realtime is Actually Connected

Open your browser console and look for:

### ✅ Success Messages:
- `✅ Supabase Realtime connected - NO MORE POLLING!`
- `🔌 Supabase Realtime Status: ✅ Connected`

### ❌ Failure Messages:
- `⚠️ Supabase not configured, skipping Realtime connection`
- `❌ Supabase Realtime channel error - will fall back to polling`
- `🔌 Supabase Realtime Status: ❌ Not Connected`

## What Those HTTP Requests Mean

The HTTP GET requests you're seeing could be:

### 1. **Initial Load** (Normal)
- First time loading the page
- These are expected

### 2. **Query Invalidation** (Good - Real-time!)
- When a new message arrives via Realtime
- Realtime triggers `invalidate()` which causes ONE refetch
- This is how real-time updates work!

### 3. **Polling** (Bad - Shouldn't happen if Realtime connected)
- If you see requests every 30 seconds
- Means Realtime is NOT connected
- System is falling back to polling

## How to Tell the Difference

### Real-time (Good):
```
1. Send message
2. See ONE HTTP request (invalidation refetch)
3. Message appears instantly
4. No more requests until next message
```

### Polling (Bad):
```
1. See HTTP requests every 30 seconds
2. Even when no new messages
3. This means Realtime isn't working
```

## Fix Realtime Connection

If you see `❌ Not Connected`:

1. **Check Environment Variables:**
   ```bash
   # Make sure these are set in .env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```

2. **Verify Realtime is Enabled:**
   - Go to Supabase Dashboard → SQL Editor
   - Run: `SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';`
   - Should show the publication exists

3. **Check Tables are Added:**
   ```sql
   SELECT * FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
   AND tablename IN ('Message', 'Conversation');
   ```
   - Should show both tables

4. **Restart Dev Server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

## Expected Behavior When Working

✅ **Realtime Connected:**
- Console: `✅ Supabase Realtime connected`
- No polling (no requests every 30s)
- When message sent: ONE request (invalidation)
- Message appears instantly

❌ **Realtime NOT Connected:**
- Console: `❌ Not Connected` or warnings
- Requests every 30 seconds (polling)
- Messages appear with delay

