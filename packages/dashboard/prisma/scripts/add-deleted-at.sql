-- One-off: add soft-delete column to api_keys (same as schema).
-- Safe to run multiple times (IF NOT EXISTS).
-- Use when you update schema with db push and need this column on an existing DB.
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
