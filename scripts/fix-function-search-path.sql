-- Fix "Function Search Path Mutable" security warnings (Supabase linter 0011)
-- Run in Supabase SQL Editor. Sets search_path = 'public' on each function so the
-- search_path is not role-mutable (prevents search_path injection).
-- No data loss; only function configuration is changed.

BEGIN;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name,
           p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'ensure_inbox_row',
        'inbox_dec_on_mark_read',
        'inbox_inc_on_message',
        'mark_conversation_read'
      )
  LOOP
    IF r.args = '' THEN
      EXECUTE format(
        'ALTER FUNCTION %I.%I() SET search_path = ''public''',
        r.schema_name,
        r.func_name
      );
    ELSE
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = ''public''',
        r.schema_name,
        r.func_name,
        r.args
      );
    END IF;
    RAISE NOTICE 'Set search_path for %.%(%)', r.schema_name, r.func_name, r.args;
  END LOOP;
END;
$$;

COMMIT;
