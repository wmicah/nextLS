-- Safe migration: Adding indexes for performance optimization
-- This migration ONLY adds indexes - it does NOT modify or delete any data
-- Indexes are safe to add and can be removed without data loss

-- Add index to routine_exercise_completions table
-- This speeds up queries filtering by clientId and completedAt
CREATE INDEX IF NOT EXISTS "routine_exercise_completions_clientId_completedAt_idx" 
ON "routine_exercise_completions"("clientId", "completedAt");

-- Add index to program_drill_completions table
-- This speeds up queries filtering by clientId and completedAt
CREATE INDEX IF NOT EXISTS "program_drill_completions_clientId_completedAt_idx" 
ON "program_drill_completions"("clientId", "completedAt");

-- Add index to exercise_completions table
-- This speeds up queries filtering by clientId and completedAt
CREATE INDEX IF NOT EXISTS "exercise_completions_clientId_completedAt_idx" 
ON "exercise_completions"("clientId", "completedAt");

-- Note: These indexes will:
-- 1. Speed up queries that filter by clientId and completedAt (like our recent activity query)
-- 2. Take a few seconds to create (depending on table size)
-- 3. Use some additional disk space (minimal)
-- 4. NOT affect any existing data whatsoever


