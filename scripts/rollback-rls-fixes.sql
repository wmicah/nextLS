-- ROLLBACK RLS Performance Fixes
-- Use this if you need to remove the optimized policies and go back to original

-- Drop the optimized policies (if they exist)
DROP POLICY IF EXISTS "message_access_optimized" ON "public"."Message";
DROP POLICY IF EXISTS "message_insert_optimized" ON "public"."Message";
DROP POLICY IF EXISTS "message_update_optimized" ON "public"."Message";
DROP POLICY IF EXISTS "inbox_access_optimized" ON "public"."UserInbox";
DROP POLICY IF EXISTS "inbox_insert_optimized" ON "public"."UserInbox";
DROP POLICY IF EXISTS "inbox_update_optimized" ON "public"."UserInbox";

-- Drop the optimized indexes (if they exist)
DROP INDEX IF EXISTS "idx_message_conversation_sender_opt";
DROP INDEX IF EXISTS "idx_message_isread_opt";
DROP INDEX IF EXISTS "idx_userinbox_userid_opt";

-- Drop the optimized function (if it exists)
DROP FUNCTION IF EXISTS public.ensure_inbox_row_optimized();

-- Note: This rollback script is safe to run
-- It only removes the optimized policies we added
-- Your original policies will remain intact
