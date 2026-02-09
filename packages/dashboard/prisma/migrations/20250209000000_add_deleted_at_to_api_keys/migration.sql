-- AlterTable: add soft-delete column to api_keys for revoked keys
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
