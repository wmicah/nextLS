-- Row Level Security (RLS) Implementation for NextLevel Coaching
-- This script implements comprehensive RLS policies for data privacy and security

-- ==============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ==============================================

-- Core user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_organizations ENABLE ROW LEVEL SECURITY;

-- Event and scheduling tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_swap_requests ENABLE ROW LEVEL SECURITY;

-- Communication tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Program and workout tables
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_workouts ENABLE ROW LEVEL SECURITY;

-- Video and media tables
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_video_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_feedback ENABLE ROW LEVEL SECURITY;

-- Analytics and progress tables
ALTER TABLE client_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Library and resources
ALTER TABLE library_resources ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 2. HELPER FUNCTIONS FOR RLS
-- ==============================================

-- Function to get current user ID from JWT
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

-- Function to check if user is admin
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

-- Function to check if user is coach
CREATE OR REPLACE FUNCTION is_coach()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE id = auth.user_id() 
    AND role = 'COACH'
  );
$$;

-- Function to check if user is client
CREATE OR REPLACE FUNCTION is_client()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE id = auth.user_id() 
    AND role = 'CLIENT'
  );
$$;

-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION user_organization_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT organization_id FROM users WHERE id = auth.user_id();
$$;

-- Function to check if user can access client data
CREATE OR REPLACE FUNCTION can_access_client(client_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM clients c
    LEFT JOIN coach_organizations co1 ON c.coach_id = co1.coach_id
    LEFT JOIN coach_organizations co2 ON c.organization_id = co2.organization_id
    WHERE c.id = client_id
    AND (
      -- Direct coach-client relationship
      c.coach_id = auth.user_id()
      OR c.primary_coach_id = auth.user_id()
      -- Organization access
      OR (co1.organization_id = user_organization_id() AND co1.is_active = true)
      OR (co2.organization_id = user_organization_id() AND co2.is_active = true)
      -- Admin access
      OR is_admin()
    )
  );
$$;

-- ==============================================
-- 3. USERS TABLE POLICIES
-- ==============================================

-- Users can see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (id = auth.user_id());

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (id = auth.user_id());

-- Admins can see all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (is_admin());

-- Coaches can see users in their organization
CREATE POLICY "Coaches can view organization users" ON users
  FOR SELECT USING (
    is_coach() AND (
      organization_id = user_organization_id()
      OR id = auth.user_id()
    )
  );

-- ==============================================
-- 4. CLIENTS TABLE POLICIES
-- ==============================================

-- Users can see their own client profile
CREATE POLICY "Users can view own client profile" ON clients
  FOR SELECT USING (user_id = auth.user_id());

-- Coaches can see their clients
CREATE POLICY "Coaches can view their clients" ON clients
  FOR SELECT USING (
    is_coach() AND (
      coach_id = auth.user_id()
      OR primary_coach_id = auth.user_id()
    )
  );

-- Organization coaches can see organization clients
CREATE POLICY "Organization coaches can view org clients" ON clients
  FOR SELECT USING (
    is_coach() AND organization_id = user_organization_id()
  );

-- Admins can see all clients
CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (is_admin());

-- Coaches can update their clients
CREATE POLICY "Coaches can update their clients" ON clients
  FOR UPDATE USING (
    is_coach() AND (
      coach_id = auth.user_id()
      OR primary_coach_id = auth.user_id()
    )
  );

-- ==============================================
-- 5. EVENTS TABLE POLICIES
-- ==============================================

-- Users can see events they're involved in
CREATE POLICY "Users can view their events" ON events
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.user_id()
    )
    OR coach_id = auth.user_id()
  );

-- Organization coaches can see organization events
CREATE POLICY "Organization coaches can view org events" ON events
  FOR SELECT USING (
    is_coach() AND organization_id = user_organization_id()
  );

-- Coaches can manage their events
CREATE POLICY "Coaches can manage their events" ON events
  FOR ALL USING (coach_id = auth.user_id());

-- Admins can see all events
CREATE POLICY "Admins can view all events" ON events
  FOR SELECT USING (is_admin());

-- ==============================================
-- 6. CONVERSATIONS TABLE POLICIES
-- ==============================================

-- Users can see conversations they're part of
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    client1_id = auth.user_id()
    OR client2_id = auth.user_id()
    OR coach_id = auth.user_id()
  );

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    client1_id = auth.user_id()
    OR client2_id = auth.user_id()
    OR coach_id = auth.user_id()
  );

-- ==============================================
-- 7. MESSAGES TABLE POLICIES
-- ==============================================

-- Users can see messages in their conversations
CREATE POLICY "Users can view conversation messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client1_id = auth.user_id()
         OR client2_id = auth.user_id()
         OR coach_id = auth.user_id()
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.user_id()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE client1_id = auth.user_id()
         OR client2_id = auth.user_id()
         OR coach_id = auth.user_id()
    )
  );

-- ==============================================
-- 8. NOTIFICATIONS TABLE POLICIES
-- ==============================================

-- Users can see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.user_id());

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.user_id());

-- ==============================================
-- 9. PROGRAMS TABLE POLICIES
-- ==============================================

-- Coaches can see their programs
CREATE POLICY "Coaches can view their programs" ON programs
  FOR SELECT USING (coach_id = auth.user_id());

-- Organization coaches can see shared programs
CREATE POLICY "Organization coaches can view shared programs" ON programs
  FOR SELECT USING (
    is_coach() AND (
      shared_with_org = true AND organization_id = user_organization_id()
    )
  );

-- Clients can see assigned programs
CREATE POLICY "Clients can view assigned programs" ON programs
  FOR SELECT USING (
    is_client() AND id IN (
      SELECT program_id FROM program_assignments
      WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.user_id()
      )
    )
  );

-- ==============================================
-- 10. VIDEOS TABLE POLICIES
-- ==============================================

-- Users can see their own videos
CREATE POLICY "Users can view own videos" ON videos
  FOR SELECT USING (user_id = auth.user_id());

-- Coaches can see client videos
CREATE POLICY "Coaches can view client videos" ON videos
  FOR SELECT USING (
    is_coach() AND client_id IN (
      SELECT id FROM clients WHERE coach_id = auth.user_id()
    )
  );

-- Organization coaches can see organization videos
CREATE POLICY "Organization coaches can view org videos" ON videos
  FOR SELECT USING (
    is_coach() AND organization_id = user_organization_id()
  );

-- ==============================================
-- 11. ANALYTICS TABLE POLICIES
-- ==============================================

-- Users can see their own analytics
CREATE POLICY "Users can view own analytics" ON client_analytics
  FOR SELECT USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.user_id()
  ));

-- Coaches can see their clients' analytics
CREATE POLICY "Coaches can view client analytics" ON client_analytics
  FOR SELECT USING (
    is_coach() AND client_id IN (
      SELECT id FROM clients WHERE coach_id = auth.user_id()
    )
  );

-- ==============================================
-- 12. LIBRARY RESOURCES POLICIES
-- ==============================================

-- All authenticated users can see master library
CREATE POLICY "Authenticated users can view master library" ON library_resources
  FOR SELECT USING (
    is_master_library = true
    OR user_id = auth.user_id()
  );

-- Coaches can see organization shared resources
CREATE POLICY "Coaches can view org shared resources" ON library_resources
  FOR SELECT USING (
    is_coach() AND (
      shared_with_org = true AND organization_id = user_organization_id()
    )
  );

-- ==============================================
-- 13. ORGANIZATION POLICIES
-- ==============================================

-- Organization members can see their organization
CREATE POLICY "Members can view their organization" ON organizations
  FOR SELECT USING (
    id = user_organization_id()
    OR owner_id = auth.user_id()
  );

-- Organization owners can manage their organization
CREATE POLICY "Owners can manage their organization" ON organizations
  FOR ALL USING (owner_id = auth.user_id());

-- ==============================================
-- 14. TIME SWAP REQUESTS POLICIES
-- ==============================================

-- Users can see swap requests they're involved in
CREATE POLICY "Users can view their swap requests" ON time_swap_requests
  FOR SELECT USING (
    requester_id IN (
      SELECT id FROM clients WHERE user_id = auth.user_id()
    )
    OR target_id IN (
      SELECT id FROM clients WHERE user_id = auth.user_id()
    )
  );

-- ==============================================
-- 15. ADMIN OVERRIDE POLICIES
-- ==============================================

-- Admins can bypass all RLS (use with caution)
CREATE POLICY "Admins can bypass RLS" ON users
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can bypass RLS" ON clients
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can bypass RLS" ON events
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can bypass RLS" ON conversations
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can bypass RLS" ON messages
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can bypass RLS" ON notifications
  FOR ALL USING (is_admin());

-- ==============================================
-- 16. GRANT NECESSARY PERMISSIONS
-- ==============================================

-- Grant usage on auth schema
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION auth.user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_coach() TO authenticated;
GRANT EXECUTE ON FUNCTION is_client() TO authenticated;
GRANT EXECUTE ON FUNCTION user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_client(text) TO authenticated;

-- ==============================================
-- 17. TESTING QUERIES
-- ==============================================

-- Test RLS is working
-- These should only return data the current user can access:

-- SELECT * FROM users; -- Should only show current user
-- SELECT * FROM clients; -- Should only show user's clients
-- SELECT * FROM events; -- Should only show user's events
-- SELECT * FROM conversations; -- Should only show user's conversations
-- SELECT * FROM messages; -- Should only show user's messages
-- SELECT * FROM notifications; -- Should only show user's notifications

-- ==============================================
-- 18. MONITORING AND DEBUGGING
-- ==============================================

-- Create a view to monitor RLS policies
CREATE OR REPLACE VIEW rls_policy_status AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Create a function to test RLS
CREATE OR REPLACE FUNCTION test_rls()
RETURNS TABLE(
  table_name text,
  policy_count bigint,
  rls_enabled boolean
)
LANGUAGE sql
AS $$
  SELECT 
    t.tablename,
    COUNT(p.policyname),
    t.rowsecurity
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
$$;
