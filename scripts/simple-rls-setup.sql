-- Simple RLS Setup for NextLevel Coaching
-- This is a simplified version for easier implementation

-- ==============================================
-- 1. ENABLE RLS ON CORE TABLES
-- ==============================================

-- Enable RLS on the most important tables first
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 2. BASIC HELPER FUNCTIONS
-- ==============================================

-- Simple function to get current user ID
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('request.jwt.claims', true)::json->>'user_id'
  );
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE id = auth.user_id() 
    AND is_admin = true
  );
$$;

-- ==============================================
-- 3. BASIC POLICIES
-- ==============================================

-- Users: Can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (id = auth.user_id());

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (id = auth.user_id());

-- Admins: Can see all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (is_admin());

-- Clients: Users can see their own client profile
CREATE POLICY "Users can view own client profile" ON clients
  FOR SELECT USING (user_id = auth.user_id());

-- Clients: Coaches can see their clients
CREATE POLICY "Coaches can view their clients" ON clients
  FOR SELECT USING (
    coach_id = auth.user_id() 
    OR primary_coach_id = auth.user_id()
  );

-- Events: Users can see events they're involved in
CREATE POLICY "Users can view their events" ON events
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.user_id()
    )
    OR coach_id = auth.user_id()
  );

-- Conversations: Users can see their conversations
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    client1_id = auth.user_id()
    OR client2_id = auth.user_id()
    OR coach_id = auth.user_id()
  );

-- Messages: Users can see messages in their conversations
CREATE POLICY "Users can view conversation messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client1_id = auth.user_id()
         OR client2_id = auth.user_id()
         OR coach_id = auth.user_id()
    )
  );

-- Notifications: Users can see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.user_id());

-- ==============================================
-- 4. GRANT PERMISSIONS
-- ==============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ==============================================
-- 5. TEST QUERIES
-- ==============================================

-- Test that RLS is working
-- These should only return data the current user can access:

-- SELECT COUNT(*) FROM users; -- Should return 1 (current user)
-- SELECT COUNT(*) FROM clients; -- Should return user's clients
-- SELECT COUNT(*) FROM events; -- Should return user's events
-- SELECT COUNT(*) FROM conversations; -- Should return user's conversations
-- SELECT COUNT(*) FROM messages; -- Should return user's messages
-- SELECT COUNT(*) FROM notifications; -- Should return user's notifications

-- ==============================================
-- 6. VERIFICATION
-- ==============================================

-- Check RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  COUNT(*) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN ('users', 'clients', 'events', 'conversations', 'messages', 'notifications')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
