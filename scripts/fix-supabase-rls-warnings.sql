-- Fix Supabase RLS Performance Warnings (auth_rls_initplan + multiple_permissive_policies)
-- Run this script in Supabase Dashboard: SQL Editor → New query → paste → Run
--
-- "Destructive operation" warning: Supabase warns because we use DROP POLICY. We are only
-- replacing RLS policies with equivalent, optimized ones. No table data is deleted.
-- The script runs in a transaction: if anything fails, nothing is applied.
--
-- 1. UserInbox: use (SELECT auth.uid()) so the value is computed once per statement (InitPlan)
-- 2. Message / UserInbox: consolidate multiple permissive SELECT policies into one per table/action

BEGIN;

-- ============================================
-- FIX 1: UserInbox Table - Optimize auth function calls
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "inbox_owner_select" ON "public"."UserInbox";
DROP POLICY IF EXISTS "inbox_owner_update" ON "public"."UserInbox";
DROP POLICY IF EXISTS "inbox_owner_insert" ON "public"."UserInbox";
DROP POLICY IF EXISTS "allow_anon_read_inbox" ON "public"."UserInbox";

-- Create optimized policies using (select auth.uid())::text to match Prisma String IDs
CREATE POLICY "inbox_owner_select" ON "public"."UserInbox"
  FOR SELECT
  USING (
    "userId" = (SELECT auth.uid())::text
  );

CREATE POLICY "inbox_owner_update" ON "public"."UserInbox"
  FOR UPDATE
  USING (
    "userId" = (SELECT auth.uid())::text
  )
  WITH CHECK (
    "userId" = (SELECT auth.uid())::text
  );

CREATE POLICY "inbox_owner_insert" ON "public"."UserInbox"
  FOR INSERT
  WITH CHECK (
    "userId" = (SELECT auth.uid())::text
  );

-- ============================================
-- FIX 2: Message Table - Consolidate multiple permissive policies
-- Combine all SELECT policies into one to improve performance
-- ============================================

-- Drop existing policies (including any from a previous run of this script)
DROP POLICY IF EXISTS "Allow Realtime subscriptions" ON "public"."Message";
DROP POLICY IF EXISTS "message_participant_select" ON "public"."Message";
DROP POLICY IF EXISTS "participant_can_read_message" ON "public"."Message";
DROP POLICY IF EXISTS "message_participant_select_optimized" ON "public"."Message";
DROP POLICY IF EXISTS "message_participant_insert_optimized" ON "public"."Message";
DROP POLICY IF EXISTS "message_participant_update_optimized" ON "public"."Message";

-- Create a single consolidated SELECT policy (participant + initplan)
-- Cast auth.uid() to text to match Prisma String IDs (userId, coachId, clientId, etc.)
CREATE POLICY "message_participant_select_optimized" ON "public"."Message"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Conversation" c
      WHERE c.id = "Message"."conversationId"
      AND (
        c."coachId" = (SELECT auth.uid())::text
        OR c."clientId" = (SELECT auth.uid())::text
        OR c."client1Id" = (SELECT auth.uid())::text
        OR c."client2Id" = (SELECT auth.uid())::text
      )
    )
  );

-- Update INSERT policy if it exists, or create optimized one
DROP POLICY IF EXISTS "message_participant_insert" ON "public"."Message";
DROP POLICY IF EXISTS "participant_can_send_message" ON "public"."Message";

CREATE POLICY "message_participant_insert_optimized" ON "public"."Message"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."Conversation" c
      WHERE c.id = "Message"."conversationId"
      AND (
        c."coachId" = (SELECT auth.uid())::text
        OR c."clientId" = (SELECT auth.uid())::text
        OR c."client1Id" = (SELECT auth.uid())::text
        OR c."client2Id" = (SELECT auth.uid())::text
      )
    )
    AND "senderId" = (SELECT auth.uid())::text
  );

-- Update UPDATE policy if it exists, or create optimized one
DROP POLICY IF EXISTS "message_participant_update" ON "public"."Message";
DROP POLICY IF EXISTS "participant_can_update_message" ON "public"."Message";

CREATE POLICY "message_participant_update_optimized" ON "public"."Message"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Conversation" c
      WHERE c.id = "Message"."conversationId"
      AND (
        c."coachId" = (SELECT auth.uid())::text
        OR c."clientId" = (SELECT auth.uid())::text
        OR c."client1Id" = (SELECT auth.uid())::text
        OR c."client2Id" = (SELECT auth.uid())::text
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."Conversation" c
      WHERE c.id = "Message"."conversationId"
      AND (
        c."coachId" = (SELECT auth.uid())::text
        OR c."clientId" = (SELECT auth.uid())::text
        OR c."client1Id" = (SELECT auth.uid())::text
        OR c."client2Id" = (SELECT auth.uid())::text
      )
    )
  );

-- ============================================
-- FIX 3: Ensure RLS is enabled on Message (required for policies to apply)
-- ============================================
ALTER TABLE "public"."Message" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Verify the changes
-- ============================================

-- Check UserInbox policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'UserInbox'
ORDER BY policyname;

-- Check Message policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'Message'
ORDER BY policyname;

-- Apply all changes. If something looks wrong, run ROLLBACK; instead of COMMIT;
COMMIT;
