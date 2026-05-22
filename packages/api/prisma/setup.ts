/**
 * Recreates the ayushbro account and API key with the same IDs used by seed.ts
 * Run this after a DB reset: npx tsx prisma/setup.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const USER_ID    = '5d610d2e-1ac5-4436-a16d-926a1ec77878';
const API_KEY_ID = '4a576c38-e4b5-4458-ae8a-b583ec4fd4c6';
const API_KEY    = 'mh_ayushbro_default_key';
const PASSWORD   = 'ayushbro123'; // change after setup if you want

async function setup() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  await prisma.user.upsert({
    where: { id: USER_ID },
    create: {
      id: USER_ID,
      username: 'ayushbro',
      email: 'ayush@minihog.dev',
      passwordHash: hash,
    },
    update: {},
  });
  console.log('✓ User: ayushbro / ayushbro123');

  await prisma.apiKey.upsert({
    where: { id: API_KEY_ID },
    create: {
      id: API_KEY_ID,
      userId: USER_ID,
      key: API_KEY,
      name: 'Default Key',
    },
    update: {},
  });
  console.log('✓ API key:', API_KEY);
  console.log('\nRun the seed next:  npx tsx prisma/seed.ts');
}

setup()
  .catch(e => { console.error('Setup failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
