-- RLS Testing Script for NextLevel Coaching
-- Run this after implementing RLS to verify it's working correctly

-- ==============================================
-- 1. CHECK RLS STATUS
-- ==============================================

-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  hasrls
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check policy count per table
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ==============================================
-- 2. TEST HELPER FUNCTIONS
-- ==============================================

-- Test auth functions
SELECT 
  'Current User ID' as test,
  auth.user_id() as result;

SELECT 
  'Is Admin' as test,
  is_admin() as result;

SELECT 
  'Is Coach' as test,
  is_coach() as result;

SELECT 
  'Is Client' as test,
  is_client() as result;

SELECT 
  'User Organization ID' as test,
  user_organization_id() as result;

-- ==============================================
-- 3. TEST DATA ACCESS PATTERNS
-- ==============================================

-- Test 1: Users table access
SELECT 
  'Users Access Test' as test_name,
  COUNT(*) as accessible_users,
  COUNT(CASE WHEN id = auth.user_id() THEN 1 END) as own_user,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_users
FROM users;

-- Test 2: Clients table access
SELECT 
  'Clients Access Test' as test_name,
  COUNT(*) as accessible_clients,
  COUNT(CASE WHEN user_id = auth.user_id() THEN 1 END) as own_client_profile,
  COUNT(CASE WHEN coach_id = auth.user_id() THEN 1 END) as coached_clients
FROM clients;

-- Test 3: Events table access
SELECT 
  'Events Access Test' as test_name,
  COUNT(*) as accessible_events,
  COUNT(CASE WHEN coach_id = auth.user_id() THEN 1 END) as coach_events,
  COUNT(CASE WHEN client_id IN (
    SELECT id FROM clients WHERE user_id = auth.user_id()
  ) THEN 1 END) as client_events
FROM events;

-- Test 4: Conversations table access
SELECT 
  'Conversations Access Test' as test_name,
  COUNT(*) as accessible_conversations,
  COUNT(CASE WHEN client1_id = auth.user_id() THEN 1 END) as client1_conversations,
  COUNT(CASE WHEN client2_id = auth.user_id() THEN 1 END) as client2_conversations,
  COUNT(CASE WHEN coach_id = auth.user_id() THEN 1 END) as coach_conversations
FROM conversations;

-- Test 5: Messages table access
SELECT 
  'Messages Access Test' as test_name,
  COUNT(*) as accessible_messages,
  COUNT(CASE WHEN sender_id = auth.user_id() THEN 1 END) as sent_messages
FROM messages;

-- Test 6: Notifications table access
SELECT 
  'Notifications Access Test' as test_name,
  COUNT(*) as accessible_notifications
FROM notifications;

-- ==============================================
-- 4. TEST ORGANIZATION ACCESS
-- ==============================================

-- Test organization data access
SELECT 
  'Organization Access Test' as test_name,
  COUNT(*) as accessible_organizations,
  COUNT(CASE WHEN id = user_organization_id() THEN 1 END) as user_organization
FROM organizations;

-- Test coach organization access
SELECT 
  'Coach Organization Access Test' as test_name,
  COUNT(*) as accessible_coach_orgs,
  COUNT(CASE WHEN coach_id = auth.user_id() THEN 1 END) as own_coach_orgs
FROM coach_organizations;

-- ==============================================
-- 5. TEST PROGRAM ACCESS
-- ==============================================

-- Test program access
SELECT 
  'Programs Access Test' as test_name,
  COUNT(*) as accessible_programs,
  COUNT(CASE WHEN coach_id = auth.user_id() THEN 1 END) as own_programs,
  COUNT(CASE WHEN shared_with_org = true AND organization_id = user_organization_id() THEN 1 END) as shared_programs
FROM programs;

-- Test program assignments
SELECT 
  'Program Assignments Access Test' as test_name,
  COUNT(*) as accessible_assignments,
  COUNT(CASE WHEN client_id IN (
    SELECT id FROM clients WHERE user_id = auth.user_id()
  ) THEN 1 END) as client_assignments
FROM program_assignments;

-- ==============================================
-- 6. TEST VIDEO ACCESS
-- ==============================================

-- Test video access
SELECT 
  'Videos Access Test' as test_name,
  COUNT(*) as accessible_videos,
  COUNT(CASE WHEN user_id = auth.user_id() THEN 1 END) as own_videos,
  COUNT(CASE WHEN client_id IN (
    SELECT id FROM clients WHERE coach_id = auth.user_id()
  ) THEN 1 END) as client_videos
FROM videos;

-- ==============================================
-- 7. TEST ANALYTICS ACCESS
-- ==============================================

-- Test client analytics access
SELECT 
  'Client Analytics Access Test' as test_name,
  COUNT(*) as accessible_analytics,
  COUNT(CASE WHEN client_id IN (
    SELECT id FROM clients WHERE user_id = auth.user_id()
  ) THEN 1 END) as own_analytics
FROM client_analytics;

-- ==============================================
-- 8. TEST LIBRARY ACCESS
-- ==============================================

-- Test library resource access
SELECT 
  'Library Resources Access Test' as test_name,
  COUNT(*) as accessible_resources,
  COUNT(CASE WHEN is_master_library = true THEN 1 END) as master_library,
  COUNT(CASE WHEN user_id = auth.user_id() THEN 1 END) as own_resources,
  COUNT(CASE WHEN shared_with_org = true AND organization_id = user_organization_id() THEN 1 END) as shared_resources
FROM library_resources;

-- ==============================================
-- 9. TEST TIME SWAP ACCESS
-- ==============================================

-- Test time swap request access
SELECT 
  'Time Swap Requests Access Test' as test_name,
  COUNT(*) as accessible_swaps,
  COUNT(CASE WHEN requester_id IN (
    SELECT id FROM clients WHERE user_id = auth.user_id()
  ) THEN 1 END) as sent_swaps,
  COUNT(CASE WHEN target_id IN (
    SELECT id FROM clients WHERE user_id = auth.user_id()
  ) THEN 1 END) as received_swaps
FROM time_swap_requests;

-- ==============================================
-- 10. PERFORMANCE TEST
-- ==============================================

-- Test query performance with RLS
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users WHERE id = auth.user_id();

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM clients WHERE user_id = auth.user_id();

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM events WHERE coach_id = auth.user_id();

-- ==============================================
-- 11. SECURITY TEST
-- ==============================================

-- Test that users cannot access other users' data
-- This should return 0 or only the current user's data
SELECT 
  'Security Test - Other Users Data' as test_name,
  COUNT(*) as other_users_accessible,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS - No unauthorized access'
    WHEN COUNT(*) = 1 AND COUNT(CASE WHEN id = auth.user_id() THEN 1 END) = 1 THEN 'PASS - Only own data accessible'
    ELSE 'FAIL - Unauthorized access detected'
  END as result
FROM users
WHERE id != auth.user_id() AND is_admin() = false;

-- ==============================================
-- 12. SUMMARY REPORT
-- ==============================================

-- Generate a summary report
WITH rls_status AS (
  SELECT 
    COUNT(*) as total_tables,
    COUNT(CASE WHEN rowsecurity = true THEN 1 END) as rls_enabled_tables
  FROM pg_tables 
  WHERE schemaname = 'public'
),
policy_status AS (
  SELECT 
    COUNT(*) as total_policies,
    COUNT(DISTINCT tablename) as tables_with_policies
  FROM pg_policies 
  WHERE schemaname = 'public'
)
SELECT 
  'RLS Implementation Summary' as report_type,
  rls_status.total_tables,
  rls_status.rls_enabled_tables,
  policy_status.total_policies,
  policy_status.tables_with_policies,
  CASE 
    WHEN rls_status.rls_enabled_tables = rls_status.total_tables 
    AND policy_status.tables_with_policies = rls_status.total_tables
    THEN 'PASS - RLS fully implemented'
    ELSE 'FAIL - RLS not fully implemented'
  END as implementation_status
FROM rls_status, policy_status;

-- ==============================================
-- 13. CLEANUP (Optional)
-- ==============================================

-- Uncomment these lines if you need to remove RLS for testing
-- (DO NOT run in production!)

-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE events DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE videos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE library_resources DISABLE ROW LEVEL SECURITY;
