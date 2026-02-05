-- Fix RLS Performance Issues
-- This script optimizes RLS policies for better performance

-- 1. Drop existing policies that have performance issues
DROP POLICY IF EXISTS "participant_can_read_message" ON "public"."Message";
DROP POLICY IF EXISTS "message_participant_select" ON "public"."Message";
DROP POLICY IF EXISTS "inbox_owner_select" ON "public"."UserInbox";
DROP POLICY IF EXISTS "inbox_owner_update" ON "public"."UserInbox";
DROP POLICY IF EXISTS "inbox_owner_insert" ON "public"."UserInbox";
DROP POLICY IF EXISTS "allow_anon_read_inbox" ON "public"."UserInbox";

-- 2. Create optimized Message policies
-- Single consolidated policy for Message SELECT
CREATE POLICY "message_access_policy" ON "public"."Message"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "public"."Conversation" c
    WHERE c.id = "Message"."conversationId"
    AND (
      c."coachId" = (SELECT auth.uid())
      OR c."clientId" = (SELECT auth.uid())
    )
  )
);

-- Message INSERT policy
CREATE POLICY "message_insert_policy" ON "public"."Message"
FOR INSERT
WITH CHECK (
  "senderId" = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM "public"."Conversation" c
    WHERE c.id = "Message"."conversationId"
    AND (
      c."coachId" = (SELECT auth.uid())
      OR c."clientId" = (SELECT auth.uid())
    )
  )
);

-- Message UPDATE policy (for read status)
CREATE POLICY "message_update_policy" ON "public"."Message"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "public"."Conversation" c
    WHERE c.id = "Message"."conversationId"
    AND (
      c."coachId" = (SELECT auth.uid())
      OR c."clientId" = (SELECT auth.uid())
    )
  )
);

-- 3. Create optimized UserInbox policies
-- Single consolidated policy for UserInbox SELECT
CREATE POLICY "inbox_access_policy" ON "public"."UserInbox"
FOR SELECT
USING ("userId" = (SELECT auth.uid()));

-- UserInbox INSERT policy
CREATE POLICY "inbox_insert_policy" ON "public"."UserInbox"
FOR INSERT
WITH CHECK ("userId" = (SELECT auth.uid()));

-- UserInbox UPDATE policy
CREATE POLICY "inbox_update_policy" ON "public"."UserInbox"
FOR UPDATE
USING ("userId" = (SELECT auth.uid()))
WITH CHECK ("userId" = (SELECT auth.uid()));

-- 4. Ensure RLS is enabled
ALTER TABLE "public"."Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."UserInbox" ENABLE ROW LEVEL SECURITY;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_message_conversation_sender" ON "public"."Message" ("conversationId", "senderId");
CREATE INDEX IF NOT EXISTS "idx_message_isread" ON "public"."Message" ("isRead") WHERE "isRead" = false;
CREATE INDEX IF NOT EXISTS "idx_userinbox_userid" ON "public"."UserInbox" ("userId");

-- 6. Create function to ensure inbox row exists (optimized)
CREATE OR REPLACE FUNCTION public.ensure_inbox_row()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_id uuid := (SELECT auth.uid());
BEGIN
  IF user_id IS NOT NULL THEN
    INSERT INTO "public"."UserInbox" ("userId", "totalUnread", "totalNotifications", "lastMessageAt", "createdAt", "updatedAt")
    VALUES (user_id, 0, 0, NOW(), NOW(), NOW())
    ON CONFLICT ("userId") DO NOTHING;
  END IF;
END;
$$;
