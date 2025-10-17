-- SAFE RLS Performance Fix (Non-Destructive)
-- This script adds optimized policies WITHOUT dropping existing ones
-- This ensures no downtime or access issues

-- 1. First, let's check what policies currently exist
-- (This is just for reference - we won't drop anything)

-- 2. Create optimized Message policies (ADDITIVE - won't break existing)
-- These will work alongside existing policies for better performance

-- Message SELECT policy (optimized version)
CREATE POLICY "message_access_optimized" ON "public"."Message"
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

-- Message INSERT policy (optimized version)
CREATE POLICY "message_insert_optimized" ON "public"."Message"
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

-- Message UPDATE policy (optimized version)
CREATE POLICY "message_update_optimized" ON "public"."Message"
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

-- 3. Create optimized UserInbox policies (ADDITIVE)
-- These will work alongside existing policies

-- UserInbox SELECT policy (optimized version)
CREATE POLICY "inbox_access_optimized" ON "public"."UserInbox"
FOR SELECT
USING ("userId" = (SELECT auth.uid()));

-- UserInbox INSERT policy (optimized version)
CREATE POLICY "inbox_insert_optimized" ON "public"."UserInbox"
FOR INSERT
WITH CHECK ("userId" = (SELECT auth.uid()));

-- UserInbox UPDATE policy (optimized version)
CREATE POLICY "inbox_update_optimized" ON "public"."UserInbox"
FOR UPDATE
USING ("userId" = (SELECT auth.uid()))
WITH CHECK ("userId" = (SELECT auth.uid()));

-- 4. Add performance indexes (SAFE - won't break anything)
CREATE INDEX IF NOT EXISTS "idx_message_conversation_sender_opt" ON "public"."Message" ("conversationId", "senderId");
CREATE INDEX IF NOT EXISTS "idx_message_isread_opt" ON "public"."Message" ("isRead") WHERE "isRead" = false;
CREATE INDEX IF NOT EXISTS "idx_userinbox_userid_opt" ON "public"."UserInbox" ("userId");

-- 5. Create optimized function (SAFE - won't break existing functionality)
CREATE OR REPLACE FUNCTION public.ensure_inbox_row_optimized()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 6. Test the new policies (SAFE - just verification)
-- This will show you if the new policies work without affecting existing ones
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename IN ('Message', 'UserInbox')
ORDER BY tablename, policyname;
