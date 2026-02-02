import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client
// In production, you might want to use connection pooling
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client instance
const prismaClient = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient;
}

// Export the Prisma client
export const prisma = prismaClient;

// Add connection timeout handling (non-blocking)
// Prisma will throw an error if connection fails, but we want to handle it gracefully
if (process.env.DATABASE_URL) {
  // Test connection on startup (non-blocking)
  prismaClient.$connect().catch((err) => {
    console.error('Prisma connection error (non-fatal):', err.message);
  });
}


