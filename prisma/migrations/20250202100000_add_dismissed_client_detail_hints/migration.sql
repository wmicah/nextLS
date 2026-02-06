-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "dismissed_client_detail_hints" JSONB DEFAULT '[]';
