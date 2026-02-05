-- AlterTable: Add userId to events for data persistence after key revocation
ALTER TABLE "events" ADD COLUMN "user_id" TEXT;

-- CreateIndex: Index on userId for efficient filtering
CREATE INDEX "events_user_id_idx" ON "events"("user_id");

-- AddForeignKey: Link events to users (onDelete: SetNull to preserve events if user is deleted)
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add deletedAt to api_keys for soft delete
ALTER TABLE "api_keys" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex: Index on deletedAt for efficient filtering of active keys
CREATE INDEX "api_keys_deleted_at_idx" ON "api_keys"("deleted_at");

