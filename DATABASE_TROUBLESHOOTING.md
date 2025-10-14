# Database Troubleshooting Guide

## Common Database Connection Issues

### Symptoms

- Random application crashes or freezes
- "Connection timeout" errors
- "Too many connections" errors
- Database queries hanging indefinitely
- Application becomes unresponsive

### Root Causes

1. **Connection Pool Exhaustion**

   - Too many concurrent database connections
   - Connections not being properly released
   - Connection pool size too small

2. **Connection Timeouts**

   - Network latency issues
   - Database server overloaded
   - Firewall or security rules blocking connections

3. **Idle Connections**

   - Connections left open without being used
   - Application not properly closing connections
   - Long-running transactions

4. **Database Server Issues**
   - Server running out of resources
   - Too many active connections
   - Slow queries blocking other connections

## Solutions Implemented

### 1. Connection Pool Configuration

We've added connection pool settings to your Prisma configuration:

```typescript
// Connection pool settings
connection_limit = 10; // Maximum connections in pool
pool_timeout = 20; // Timeout when acquiring connection (seconds)
connect_timeout = 10; // Timeout when establishing connection (seconds)
```

### 2. Graceful Shutdown Handling

The application now properly closes database connections on shutdown:

```typescript
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
```

### 3. Error Handling

Added proper error handling for database connection failures:

```typescript
process.on("uncaughtException", async error => {
  console.error("Uncaught exception:", error);
  await prisma.$disconnect();
  process.exit(1);
});
```

## Running Health Checks

### Quick Health Check

```bash
npm run db:health
```

This will check:

- ✅ Database connection status
- ✅ Connection pool health
- ✅ Query performance
- ✅ Database size
- ✅ Active connections
- ✅ Idle connections
- ✅ Long-running queries
- ✅ Connection string configuration

### Manual Checks

#### Check Active Connections

```sql
SELECT count(*)
FROM pg_stat_activity
WHERE datname = current_database();
```

#### Check Idle Connections

```sql
SELECT count(*)
FROM pg_stat_activity
WHERE datname = current_database()
AND state = 'idle';
```

#### Check Long-Running Queries

```sql
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE datname = current_database()
AND state = 'active'
AND query_start < now() - interval '5 minutes';
```

#### Check Database Size

```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

## Environment Variables

Make sure your `.env` file has the correct database configuration:

```env
# Main database connection
DATABASE_URL="postgresql://user:password@host:5432/database?connection_limit=10&pool_timeout=20&connect_timeout=10"

# Direct connection (for migrations)
DIRECT_URL="postgresql://user:password@host:5432/database"
```

## Monitoring and Alerts

### Set Up Monitoring

1. **Enable Query Logging** (Development only)

   ```typescript
   log: ["query", "error", "warn"];
   ```

2. **Monitor Connection Pool**

   - Run `npm run db:health` regularly
   - Set up automated health checks
   - Monitor application logs for connection errors

3. **Set Up Alerts**
   - Alert when active connections > 50
   - Alert when idle connections > 20
   - Alert when query response time > 500ms

## Best Practices

### 1. Connection Management

✅ **DO:**

- Use connection pooling
- Close connections properly
- Use transactions for related queries
- Set appropriate timeouts

❌ **DON'T:**

- Create new Prisma clients for each request
- Leave connections open indefinitely
- Run queries without timeouts
- Ignore connection errors

### 2. Query Optimization

✅ **DO:**

- Use indexes on frequently queried columns
- Limit query results with `take()`
- Use `select()` to fetch only needed fields
- Use transactions for multiple related queries

❌ **DON'T:**

- Fetch all data when you only need a few records
- Run N+1 queries
- Use `SELECT *` unnecessarily
- Ignore slow queries

### 3. Error Handling

✅ **DO:**

- Catch and handle database errors
- Log errors with context
- Implement retry logic for transient errors
- Gracefully handle connection failures

❌ **DON'T:**

- Let errors crash the application
- Ignore connection errors
- Retry indefinitely
- Expose database errors to users

## Troubleshooting Steps

### 1. Application Won't Start

**Symptoms:**

- Application crashes on startup
- "Cannot connect to database" error

**Solution:**

```bash
# Check if database is accessible
npm run db:health

# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL
```

### 2. Random Crashes

**Symptoms:**

- Application crashes randomly
- "Connection timeout" errors
- "Too many connections" error

**Solution:**

```bash
# Check connection pool status
npm run db:health

# Check for long-running queries
# Run the SQL query from "Manual Checks" section

# Restart the application
pm2 restart your-app
```

### 3. Slow Queries

**Symptoms:**

- Queries taking > 1 second
- Application feels slow
- Database CPU usage high

**Solution:**

```bash
# Enable query logging
# Add to src/db/index.ts:
log: ["query", "error", "warn"]

# Identify slow queries
# Check logs for queries taking > 500ms

# Optimize queries
# Add indexes, use select(), limit results
```

### 4. Connection Pool Exhaustion

**Symptoms:**

- "Too many connections" error
- Application becomes unresponsive
- Database rejects new connections

**Solution:**

```bash
# Check active connections
npm run db:health

# Kill idle connections (use with caution)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
AND state = 'idle'
AND state_change < now() - interval '10 minutes';

# Restart application
pm2 restart your-app
```

## Supabase-Specific Issues

If you're using Supabase, be aware of these limitations:

### Connection Limits

- **Free tier:** 60 concurrent connections
- **Pro tier:** 200 concurrent connections
- **Team tier:** 400 concurrent connections

### Connection Pooling

Supabase uses PgBouncer for connection pooling. Make sure to:

1. Use the connection pooler URL for your application
2. Keep connection pool size reasonable (10-20 connections)
3. Monitor connection usage in Supabase dashboard

### Realtime Connections

The log you showed earlier is from Supabase Realtime (Phoenix/Elixir). This is separate from your database connections and shouldn't affect your application unless:

- You're using Supabase Realtime features
- You have too many active subscriptions
- Your application is creating too many WebSocket connections

## Getting Help

If you're still experiencing issues:

1. **Run the health check:**

   ```bash
   npm run db:health
   ```

2. **Check the logs:**

   ```bash
   # Application logs
   pm2 logs

   # Database logs (if accessible)
   # Check your database provider's dashboard
   ```

3. **Collect diagnostics:**

   - Database URL (without credentials)
   - Health check output
   - Error messages
   - Application logs
   - Database provider and tier

4. **Contact support:**
   - Database provider support
   - Application monitoring tools
   - Development team

## Prevention

To prevent future database issues:

1. ✅ **Monitor regularly** - Run health checks daily
2. ✅ **Set up alerts** - Get notified of connection issues
3. ✅ **Optimize queries** - Keep queries fast and efficient
4. ✅ **Use connection pooling** - Don't create too many connections
5. ✅ **Handle errors gracefully** - Don't let errors crash the app
6. ✅ **Test under load** - Simulate production traffic
7. ✅ **Keep dependencies updated** - Use latest Prisma version
8. ✅ **Review logs** - Check for patterns in errors

## Additional Resources

- [Prisma Connection Management](https://www.prisma.io/docs/concepts/components/prisma-client/connection-management)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Database Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
