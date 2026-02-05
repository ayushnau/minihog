import { prisma } from '../../db/client';

/**
 * Helper function to execute Prisma queries with userId fallback
 * If userId column doesn't exist, falls back to apiKeyIds filtering
 */
export async function executeWithUserIdFallback<T>(
  queryFn: () => Promise<T>,
  fallbackQueryFn: () => Promise<T>,
  useUserId: boolean
): Promise<T> {
  if (!useUserId) {
    return fallbackQueryFn();
  }

  try {
    return await queryFn();
  } catch (error: any) {
    // If userId column doesn't exist, fall back to apiKeyIds filtering
    if (error.code === 'P2022' && error.meta?.column?.includes('user_id')) {
      return fallbackQueryFn();
    }
    throw error;
  }
}

