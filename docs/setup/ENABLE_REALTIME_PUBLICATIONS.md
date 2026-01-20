# Enable Realtime Publications

## What You're Seeing

You're looking at **Database Publications** which control what changes Realtime can track.

## What to Enable

For messaging to work in real-time, you need to enable:

### For `supabase_realtime` publication:

1. **Click on "4 tables"** to see which tables are included
2. Make sure **Message** and **Conversation** tables are in the list
3. **Enable INSERT toggle** (at minimum)
4. Optionally enable **UPDATE** if you want to track conversation updates

### For `supabase_realtime_messages_publication`:

1. **Click on "1 table"** to see which table is included
2. If it's the **Message** table, enable **INSERT** toggle

## Quick Steps

1. Find the row for `supabase_realtime`
2. **Turn ON the INSERT toggle** (click it so it's green/on)
3. Optionally turn ON **UPDATE** if you want conversation updates
4. **Click "4 tables"** to verify Message and Conversation are included
5. If Message/Conversation aren't there, you'll need to add them (see below)

## If Tables Are Missing

If Message or Conversation tables aren't in the publication, add them via SQL:

```sql
-- Add Message table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE "Message";

-- Add Conversation table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE "Conversation";
```

## What Each Toggle Does

- **INSERT** - Tracks new messages (REQUIRED for new messages)
- **UPDATE** - Tracks message/conversation updates (optional but recommended)
- **DELETE** - Tracks deletions (usually not needed)
- **TRUNCATE** - Tracks table truncations (usually not needed)

## Minimum Required

For basic messaging:

- ✅ **INSERT** must be ON for Message table
- ✅ Message table must be in `supabase_realtime` publication

## After Enabling

1. **Restart your dev server**
2. **Check browser console** - should see `✅ Supabase Realtime connected`
3. **Send a test message** - should appear instantly!
