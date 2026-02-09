/**
 * Script to apply migration directly via SQL
 * This bypasses Prisma's migration system and applies changes directly
 * Useful when prisma db push times out
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔄 Applying migration directly via SQL...\n');

    // Check if columns already exist
    console.log('📋 Checking existing columns...');
    const checkEvents = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events' AND column_name = 'user_id'
    `;
    const checkApiKeys = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'api_keys' AND column_name = 'deleted_at'
    `;

    const hasUserId = Array.isArray(checkEvents) && checkEvents.length > 0;
    const hasDeletedAt = Array.isArray(checkApiKeys) && checkApiKeys.length > 0;

    if (hasUserId && hasDeletedAt) {
      console.log('✅ Migration already applied! Columns exist.');
      return;
    }

    // Apply migration step by step
    if (!hasUserId) {
      console.log('➕ Adding user_id column to events table...');
      await prisma.$executeRaw`
        ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "user_id" TEXT
      `;
      console.log('✅ Added user_id column');

      console.log('📊 Creating index on user_id...');
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "events_user_id_idx" ON "events"("user_id")
      `;
      console.log('✅ Created index');

      console.log('🔗 Adding foreign key constraint...');
      try {
        await prisma.$executeRaw`
          ALTER TABLE "events" 
          ADD CONSTRAINT "events_user_id_fkey" 
          FOREIGN KEY ("user_id") REFERENCES "users"("id") 
          ON DELETE SET NULL ON UPDATE CASCADE
        `;
        console.log('✅ Added foreign key');
      } catch (error) {
        // Constraint might already exist
        if (error.message && error.message.includes('already exists')) {
          console.log('⚠️  Foreign key constraint already exists (skipping)');
        } else {
          throw error;
        }
      }
    } else {
      console.log('⏭️  user_id column already exists');
    }

    if (!hasDeletedAt) {
      console.log('➕ Adding deleted_at column to api_keys table...');
      await prisma.$executeRaw`
        ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3)
      `;
      console.log('✅ Added deleted_at column');

      console.log('📊 Creating index on deleted_at...');
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "api_keys_deleted_at_idx" ON "api_keys"("deleted_at")
      `;
      console.log('✅ Created index');
    } else {
      console.log('⏭️  deleted_at column already exists');
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('🔄 Regenerating Prisma client...');

    // Note: Prisma client regeneration needs to be done separately
    console.log('⚠️  Please run: npx prisma generate');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
