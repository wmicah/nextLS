-- Add lesson reminder setting to UserSettings
ALTER TABLE "UserSettings" ADD COLUMN "lessonRemindersEnabled" BOOLEAN NOT NULL DEFAULT true;
