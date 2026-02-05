import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client
// Connection pooling is configured via DATABASE_URL connection string parameters
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Connection Pooling Configuration
 * 
 * Prisma uses connection pooling automatically. For optimal performance with write-heavy workloads:
 * 
 * 1. Configure via DATABASE_URL query parameters:
 *    postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
 * 
 * 2. Recommended settings for write-heavy applications:
 *    - connection_limit: 10-20 (adjust based on your database's max_connections)
 *    - pool_timeout: 20 seconds
 * 
 * 3. For Supabase:
 *    - Use the connection pooler URL (port 6543) instead of direct connection (port 5432)
 *    - Pooler URL format: postgresql://user:pass@host.supabase.co:6543/db?pgbouncer=true
 *    - This provides better connection management for serverless environments
 * 
 * 4. For high-scale deployments, consider:
 *    - PgBouncer for connection pooling
 *    - Read replicas for analytics queries
 *    - Separate connection pools for reads vs writes
 */
const prismaClient = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Connection pool settings are configured via DATABASE_URL
  // Prisma automatically manages the connection pool based on the connection string
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


