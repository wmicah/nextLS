# Quick Supabase Realtime Setup

## ⚠️ Important: Realtime vs Replication

- **Replication** (in alpha) = Sending data to external warehouses (BigQuery, etc.)
- **Realtime** (available now) = Listening to database changes in your app ✅

You need **Realtime**, not Replication!

## 🚀 Quick Setup (3 Steps)

### Step 1: Enable Realtime via SQL

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Paste and run this:

```sql
-- Enable Realtime for Message table
ALTER PUBLICATION supabase_realtime ADD TABLE "Message";

-- Enable Realtime for Conversation table  
ALTER PUBLICATION supabase_realtime ADD TABLE "Conversation";
```

4. Click **Run** (or press Cmd/Ctrl + Enter)

You should see: `Success. No rows returned`

### Step 2: Add Environment Variables

Add to your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Find these:**
- Dashboard → **Settings** → **API**
- Copy **Project URL** and **anon/public key**

### Step 3: Disable RLS (Since Using Kinde Auth)

In SQL Editor, run:

```sql
-- Disable RLS for Message table (your app handles auth)
ALTER TABLE "Message" DISABLE ROW LEVEL SECURITY;
```

## ✅ Test It

1. Restart dev server: `npm run dev`
2. Check browser console: Should see `✅ Supabase Realtime connected`
3. Send a message - it appears instantly!

## 🎉 Done!

Your messaging now uses Supabase Realtime instead of polling. Messages update in real-time!

## 🐛 Troubleshooting

**"Supabase not configured" warning:**
- Make sure env variables are set
- Restart dev server after adding them

**Realtime not connecting:**
- Verify SQL ran successfully (check SQL Editor history)
- Check browser console for errors
- Make sure tables are added to `supabase_realtime` publication

**Still seeing polling:**
- System falls back to polling if Realtime isn't connected
- Once connected, polling stops automatically

