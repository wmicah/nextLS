# Database Connection Issues - Fix Guide

## Problem
You're getting `Can't reach database server` errors with Supabase connection pooler.

## Root Causes
1. **Connection pool exhaustion** - Too many connections being created
2. **Premature disconnection** - Shutdown handlers closing connections during development
3. **Supabase pooler configuration** - Wrong connection string or pooler settings

## Solutions Applied

### 1. Fixed Database Configuration (`src/db/index.ts`)
- ✅ Increased connection limits: `connection_limit=20` (was 10)
- ✅ Increased timeouts: `pool_timeout=30`, `connect_timeout=15`
- ✅ Removed query logging in development (reduces overhead)
- ✅ Disabled graceful shutdown handlers in development
- ✅ Proper connection caching in development mode

### 2. Additional Steps You Need to Take

#### Option A: Use Supabase Direct Connection (Recommended for Development)
In your `.env` file, use the **direct connection string** instead of the pooler:

```env
# Instead of:
# DATABASE_URL="postgresql://postgres:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Use the direct connection:
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

**How to get it:**
1. Go to Supabase Dashboard
2. Project Settings > Database
3. Copy the "Connection string" under "Direct connection"
4. Replace `[password]` with your database password

#### Option B: Configure Supabase Pooler Correctly
If you want to use the pooler, update your connection string:

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Important:** When using pgbouncer, set `connection_limit=1` per connection.

#### Option C: Use Transaction Mode for Pooler
Update your Prisma schema to use transaction mode:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Add this line
}
```

Then in your `.env`:
```env
# Pooler connection (for queries)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

### 3. Verify Supabase Project Status
Check if your Supabase project is:
- ✅ Active (not paused)
- ✅ Not hitting connection limits
- ✅ Database is running

Go to: Supabase Dashboard > Project Settings > Database > Connection pooling

### 4. Restart Your Development Server
After making changes:
```bash
# Stop the dev server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Restart
pnpm dev
```

### 5. Check Connection Limits in Supabase
1. Go to Supabase Dashboard
2. Project Settings > Database
3. Check "Max connections" - should be at least 50
4. If using pooler, check "Pool mode" - should be "Transaction" or "Session"

## Testing the Fix

Run this command to test your connection:
```bash
npx prisma db execute --stdin <<< "SELECT 1"
```

If successful, you should see: `Executed the query successfully.`

## Still Having Issues?

### Check Logs
Look for these patterns in your logs:
- `Shutting down database connections...` (should only appear in production)
- `prisma:query` logs (should be minimal in development now)

### Monitor Active Connections
In Supabase Dashboard:
- Database > Logs
- Look for connection spikes

### Alternative: Use Supabase's Built-in Pooler
Supabase provides a built-in pooler at port 6543:
```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

## Production Deployment

For Vercel deployment, use environment variables:
```
DATABASE_URL=postgresql://... (use pooler for production)
DIRECT_URL=postgresql://... (direct connection for migrations)
```

## Summary of Changes Made
1. ✅ Increased connection pool limits
2. ✅ Removed premature disconnection in development
3. ✅ Reduced logging overhead
4. ✅ Proper connection caching

**Next Step:** Update your `.env` file with the correct Supabase connection string (Option A recommended).

