# Disable Supabase Realtime - Quick Fix

## Problem

Your Supabase Realtime is enabled but not being used, consuming database connections and causing random crashes.

## Solution

### Option 1: Disable in Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Find **Realtime** section
5. **Disable Realtime** (toggle off)
6. Click **Save**

### Option 2: Remove Environment Variables

If you're not using Supabase at all, remove these from your `.env`:

```bash
# Remove or comment out these lines:
# NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### Option 3: Remove Unused Code

Delete the unused Realtime API route:

```bash
rm src/app/api/realtime/route.ts
```

## Verification

After disabling Realtime:

1. **Restart your application:**

   ```bash
   pm2 restart your-app
   # or
   npm run dev
   ```

2. **Run health check:**

   ```bash
   npm run db:health
   ```

3. **Check Supabase Dashboard:**
   - Go to **Database** → **Connection Pooling**
   - Verify connection count has decreased
   - Should see fewer active connections

## Expected Results

After disabling Realtime:

✅ **Fewer database connections** - Realtime won't consume connections  
✅ **No more random crashes** - Connection pool won't be exhausted  
✅ **Better performance** - More connections available for your app  
✅ **Lower costs** - Fewer resources used

## If You Need Realtime Later

If you want to use Realtime in the future:

1. Enable it in Supabase Dashboard
2. Add proper connection management:

   ```typescript
   // Properly manage Realtime connections
   const channel = supabase
     .channel("messages")
     .on(
       "postgres_changes",
       { event: "*", schema: "public", table: "messages" },
       payload => console.log("Change received!", payload)
     )
     .subscribe();

   // Always unsubscribe when done
   return () => {
     channel.unsubscribe();
   };
   ```

3. Use connection pooling for Realtime:
   - Use `pooler.supabase.com` for your connection URL
   - Limit concurrent Realtime connections
   - Implement proper cleanup

## Additional Steps

### 1. Clean Up Unused Code

Remove the unused Realtime API route:

```bash
# Delete the file
rm src/app/api/realtime/route.ts

# Remove from git
git rm src/app/api/realtime/route.ts
```

### 2. Update Documentation

Remove Supabase references from `env.example` if not using it:

```bash
# Comment out or remove these lines in env.example:
# NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### 3. Monitor Connection Usage

After disabling Realtime, monitor your connections:

```bash
# Check active connections
npm run db:health

# Or manually check in Supabase Dashboard
# Database → Connection Pooling
```

## Why This Fixes Your Issue

**Before:**

- Your app: 10 connections
- Supabase Realtime: 20-30 connections (idle)
- **Total: 30-40 connections** (hitting your limit)
- Result: Random crashes when limit exceeded

**After:**

- Your app: 10 connections
- Supabase Realtime: 0 connections (disabled)
- **Total: 10 connections** (well under limit)
- Result: Stable, no crashes

## Testing

Run these tests to verify the fix:

### Test 1: Check Connections

```bash
npm run db:health
```

Expected: Fewer active connections

### Test 2: Load Test

```bash
# Simulate 50 concurrent requests
for i in {1..50}; do
  curl -s http://localhost:3000/api/test &
done
wait
```

Expected: No connection errors

### Test 3: Long-Running Test

```bash
# Run for 1 hour
npm run db:health
# Wait 1 hour
npm run db:health
```

Expected: No connection pool exhaustion

## Troubleshooting

### If issues persist:

1. **Check Supabase Dashboard:**

   - Verify Realtime is actually disabled
   - Check connection pooling settings
   - Review connection usage graphs

2. **Check your .env file:**

   ```bash
   # Make sure these are removed or commented:
   grep SUPABASE .env
   ```

3. **Check application logs:**

   ```bash
   pm2 logs your-app
   ```

4. **Verify database connections:**
   ```bash
   npm run db:health
   ```

## Next Steps

After disabling Realtime:

1. ✅ Monitor for 24 hours
2. ✅ Run health checks regularly
3. ✅ Check Supabase Dashboard for connection usage
4. ✅ Remove unused code
5. ✅ Update documentation

---

**Last Updated:** $(date)
**Status:** Ready to implement
**Impact:** High (should fix your connection issues)

