# Row Level Security (RLS) Implementation Guide

## 🎯 Overview

This guide will help you implement Row Level Security (RLS) for your NextLevel Coaching application to ensure data privacy and security at the database level.

## 📋 Prerequisites

1. **Supabase Project**: You need access to your Supabase project dashboard
2. **Database Access**: Admin access to your PostgreSQL database
3. **Backup**: Always backup your database before implementing RLS

## 🚀 Step-by-Step Implementation

### Step 1: Backup Your Database

```bash
# Create a backup before implementing RLS
pg_dump "your_database_url" > backup_before_rls.sql
```

### Step 2: Access Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### Step 3: Run the RLS Implementation Script

1. Copy the contents of `scripts/implement-rls.sql`
2. Paste into Supabase SQL Editor
3. **Execute the script** (this will take a few minutes)

### Step 4: Test RLS Implementation

Run these test queries in Supabase SQL Editor:

```sql
-- Test 1: Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Test 2: Check policy count
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Test 3: Test user data access
SELECT * FROM users LIMIT 5;
SELECT * FROM clients LIMIT 5;
SELECT * FROM events LIMIT 5;
```

### Step 5: Update Your Application Code

#### 5.1 Update Database Connection

Update your `src/db/index.ts` to use the service role key for admin operations:

```typescript
// Add this to your environment variables
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role for admin operations
const adminPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.replace(
        "postgresql://",
        `postgresql://postgres:${serviceRoleKey}@`
      ),
    },
  },
});
```

#### 5.2 Update tRPC Procedures

Add RLS context to your tRPC procedures:

```typescript
// Example: Update a procedure to work with RLS
export const getClientEvents = publicProcedure
  .input(z.object({ clientId: z.string() }))
  .query(async ({ input, ctx }) => {
    // RLS will automatically filter based on user context
    const events = await db.event.findMany({
      where: { clientId: input.clientId },
      // RLS policies will automatically apply
    });
    return events;
  });
```

### Step 6: Environment Variables

Add these to your `.env` file:

```env
# Supabase Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Secret for RLS
JWT_SECRET=your_jwt_secret_here
```

## 🔍 Testing RLS

### Test 1: User Data Isolation

```sql
-- This should only return the current user's data
SELECT id, email, name, role FROM users;
```

### Test 2: Client Data Access

```sql
-- This should only return clients the current user can access
SELECT id, name, email, coach_id FROM clients;
```

### Test 3: Event Data Access

```sql
-- This should only return events the current user is involved in
SELECT id, title, date, client_id, coach_id FROM events;
```

### Test 4: Message Data Access

```sql
-- This should only return messages in conversations the user is part of
SELECT id, content, sender_id, conversation_id FROM messages;
```

## 🚨 Troubleshooting

### Common Issues

1. **"Permission denied" errors**

   - Check if RLS policies are correctly applied
   - Verify user authentication context

2. **"Function does not exist" errors**

   - Ensure all helper functions were created
   - Check function permissions

3. **Data not showing**
   - Verify RLS policies match your access patterns
   - Check if policies are too restrictive

### Debug Queries

```sql
-- Check RLS status
SELECT * FROM rls_policy_status;

-- Test RLS functions
SELECT auth.user_id();
SELECT is_admin();
SELECT is_coach();
SELECT user_organization_id();

-- Check current user context
SELECT current_user, session_user;
```

## 🔧 Customization

### Adding New Policies

```sql
-- Example: Add policy for new table
CREATE POLICY "Users can view own data" ON your_new_table
  FOR SELECT USING (user_id = auth.user_id());
```

### Modifying Existing Policies

```sql
-- Example: Update existing policy
DROP POLICY "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (id = auth.user_id() OR is_admin());
```

## 📊 Monitoring

### Check Policy Performance

```sql
-- Monitor policy usage
SELECT
  schemaname,
  tablename,
  policyname,
  COUNT(*) as usage_count
FROM pg_stat_user_tables
JOIN pg_policies ON pg_stat_user_tables.relname = pg_policies.tablename
GROUP BY schemaname, tablename, policyname;
```

### Monitor RLS Impact

```sql
-- Check if RLS is affecting performance
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM users;
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM clients;
```

## 🛡️ Security Best Practices

1. **Regular Audits**: Review RLS policies monthly
2. **Test Changes**: Always test RLS changes in development first
3. **Monitor Access**: Log and monitor data access patterns
4. **Backup Policies**: Keep a backup of your RLS policies
5. **Document Changes**: Document any RLS policy changes

## 📞 Support

If you encounter issues:

1. Check the Supabase logs for RLS-related errors
2. Verify your JWT tokens are properly configured
3. Test with a simple query first
4. Contact support if policies aren't working as expected

## ✅ Verification Checklist

- [ ] RLS enabled on all tables
- [ ] Policies created for all tables
- [ ] Helper functions working
- [ ] User data isolation working
- [ ] Admin access working
- [ ] Organization access working
- [ ] Application still functioning
- [ ] Performance acceptable
- [ ] Backup created
- [ ] Documentation updated
