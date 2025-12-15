-- Fix Supabase RLS Performance Warnings
-- Run this script directly in your Supabase SQL Editor
-- This addresses all the linter warnings you received

-- ============================================
-- FIX 1: UserInbox Table - Optimize auth function calls
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "inbox_owner_select" ON "public"."UserInbox";
DROP POLICY IF EXISTS "inbox_owner_update" ON "public"."UserInbox";
DROP POLICY IF EXISTS "inbox_owner_insert" ON "public"."UserInbox";
DROP POLICY IF EXISTS "allow_anon_read_inbox" ON "public"."UserInbox";

-- Create optimized policies using (select auth.uid()) pattern
-- This prevents the function from being re-evaluated for each row
CREATE POLICY "inbox_owner_select" ON "public"."UserInbox"
  FOR SELECT
  USING (
    "userId" = (SELECT auth.uid())
  );

CREATE POLICY "inbox_owner_update" ON "public"."UserInbox"
  FOR UPDATE
  USING (
    "userId" = (SELECT auth.uid())
  )
  WITH CHECK (
    "userId" = (SELECT auth.uid())
  );

CREATE POLICY "inbox_owner_insert" ON "public"."UserInbox"
  FOR INSERT
  WITH CHECK (
    "userId" = (SELECT auth.uid())
  );

-- ============================================
-- FIX 2: Message Table - Consolidate multiple permissive policies
-- Combine all SELECT policies into one to improve performance
-- ============================================

-- Drop existing policies (these are causing the "multiple permissive policies" warning)
DROP POLICY IF EXISTS "Allow Realtime subscriptions" ON "public"."Message";
DROP POLICY IF EXISTS "message_participant_select" ON "public"."Message";
DROP POLICY IF EXISTS "participant_can_read_message" ON "public"."Message";

-- Create a single consolidated SELECT policy
-- This combines all the previous policies into one optimized policy
CREATE POLICY "message_participant_select_optimized" ON "public"."Message"
  FOR SELECT
  USING (
    -- Allow if user is a participant in the conversation
    EXISTS (
      SELECT 1 FROM "public"."Conversation" c
      WHERE c.id = "Message"."conversationId"
      AND (
        c."coachId" = (SELECT auth.uid())
        OR c."clientId" = (SELECT auth.uid())
        OR c."client1Id" = (SELECT auth.uid())
        OR c."client2Id" = (SELECT auth.uid())
      )
    )
    -- OR allow for realtime subscriptions (anon role)
    OR (SELECT auth.role()) = 'anon'
  );

-- Update INSERT policy if it exists, or create optimized one
DROP POLICY IF EXISTS "message_participant_insert" ON "public"."Message";
DROP POLICY IF EXISTS "participant_can_send_message" ON "public"."Message";

CREATE POLICY "message_participant_insert_optimized" ON "public"."Message"
  FOR INSERT
  WITH CHECK (
    -- User must be a participant in the conversation
    EXISTS (
      SELECT 1 FROM "public"."Conversation" c
      WHERE c.id = "Message"."conversationId"
      AND (
        c."coachId" = (SELECT auth.uid())
        OR c."clientId" = (SELECT auth.uid())
        OR c."client1Id" = (SELECT auth.uid())
        OR c."client2Id" = (SELECT auth.uid())
      )
    )
    -- AND the sender must be the current user
    AND "senderId" = (SELECT auth.uid())
  );

-- Update UPDATE policy if it exists, or create optimized one
DROP POLICY IF EXISTS "message_participant_update" ON "public"."Message";
DROP POLICY IF EXISTS "participant_can_update_message" ON "public"."Message";

CREATE POLICY "message_participant_update_optimized" ON "public"."Message"
  FOR UPDATE
  USING (
    -- User must be a participant in the conversation
    EXISTS (
      SELECT 1 FROM "public"."Conversation" c
      WHERE c.id = "Message"."conversationId"
      AND (
        c."coachId" = (SELECT auth.uid())
        OR c."clientId" = (SELECT auth.uid())
        OR c."client1Id" = (SELECT auth.uid())
        OR c."client2Id" = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    -- User must be a participant in the conversation
    EXISTS (
      SELECT 1 FROM "public"."Conversation" c
      WHERE c.id = "Message"."conversationId"
      AND (
        c."coachId" = (SELECT auth.uid())
        OR c."clientId" = (SELECT auth.uid())
        OR c."client1Id" = (SELECT auth.uid())
        OR c."client2Id" = (SELECT auth.uid())
      )
    )
  );

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

