-- AlterTable
ALTER TABLE "events" ADD COLUMN "api_key_id" TEXT;

-- CreateIndex
CREATE INDEX "events_api_key_id_idx" ON "events"("api_key_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

