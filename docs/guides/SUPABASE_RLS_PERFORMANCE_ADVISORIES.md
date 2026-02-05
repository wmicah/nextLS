# Supabase RLS performance advisories

This doc summarizes the Supabase database linter performance warnings and how to fix them.

## Advisories you may see

### 1. Auth RLS Initialization Plan (`auth_rls_initplan`)

**What it means:** Policies that use `auth.uid()` (or `current_setting()` / other auth helpers) without wrapping them in a subquery are re-evaluated **for every row**. That hurts performance at scale.

**Fix:** Use `(SELECT auth.uid())` instead of `auth.uid()` so Postgres can compute it once per statement (InitPlan) and reuse the value.

**Affected in this project:**

- Table `public.UserInbox`, policies: `inbox_owner_select`, `inbox_owner_update`, `inbox_owner_insert`

### 2. Multiple Permissive Policies (`multiple_permissive_policies`)

**What it means:** Several permissive RLS policies for the same table, role, and action (e.g. SELECT) cause the database to evaluate **each** policy for every row. One consolidated policy per (table, role, action) is more efficient.

**Fix:** Replace multiple policies with a single policy whose `USING` / `WITH CHECK` expresses the combined logic (e.g. “participant OR realtime” if needed).

**Affected in this project:**

- Table `public.Message`: three SELECT policies → one (`message_participant_select_optimized`)
- Table `public.UserInbox`: two SELECT policies → one (`inbox_owner_select`)

## How to apply the fix

1. Open **Supabase Dashboard** → your project → **SQL Editor**.
2. Open the script: `scripts/fix-supabase-rls-warnings.sql`.
3. Copy its contents, paste into a new query, and **Run**.

The script:

- Drops the old policies and creates optimized ones for `UserInbox` and `Message`.
- Uses `(SELECT auth.uid())` everywhere for auth (InitPlan).
- Leaves only one permissive SELECT policy per table/action where consolidation was needed.

## After running

- Re-run the Supabase database linter (or wait for the next run); the listed performance advisories for these policies should clear.
- Test messaging and inbox flows (and Realtime if you use it) to confirm behavior is unchanged.

## Security advisories

### 3. Function Search Path Mutable (`function_search_path_mutable`)

**What it means:** Functions without a fixed `search_path` can be affected by role-specific search_path settings, which is a security concern (search_path injection).

**Fix:** Set `search_path = 'public'` on each function (via `ALTER FUNCTION ... SET search_path = 'public'` or `SET search_path = 'public'` in the function definition).

**Affected in this project:** `public.ensure_inbox_row`, `public.inbox_dec_on_mark_read`, `public.inbox_inc_on_message`, `public.mark_conversation_read`.

**How to apply:** Run `scripts/fix-function-search-path.sql` in the Supabase SQL Editor. The script alters all four functions in one go.

### 4. Vulnerable Postgres version

**What it means:** Supabase has a newer Postgres image with security patches.

**Fix:** Upgrade via **Supabase Dashboard** → **Project Settings** → **Infrastructure** → upgrade the database (see [Supabase upgrading](https://supabase.com/docs/guides/platform/upgrading)). No SQL script; this is a dashboard action.

## References

- [Supabase: Call functions with SELECT](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [Supabase database linter – auth_rls_initplan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)
- [Supabase database linter – multiple permissive policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)
- [Supabase database linter – function search path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
