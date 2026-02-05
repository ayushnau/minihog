import { prisma } from '../../db/client';

/**
 * Gets event count and unique users for a specific event within a date range
 * @param eventName - Name of the event
 * @param from - Start date
 * @param to - End date
 * @param apiKeyIds - Optional array of API key IDs to filter by (for user-specific data)
 * @param userId - Optional user ID to filter by (for data persistence after key revocation)
 */
export async function getEventCounts(
  eventName: string,
  from: Date,
  to: Date,
  apiKeyIds?: string[],
  userId?: string
): Promise<{
  total_count: number;
  unique_users: number;
}> {
  // Build where clause with optional API key and user filter
  const whereClause: any = {
    eventName,
    timestamp: {
      gte: from,
      lte: to,
    },
  };

  // Filter by userId (primary) OR apiKeyIds (fallback for backward compatibility)
  // This ensures events are visible even after API key revocation
  // Handle missing userId column gracefully until migration is applied
  let useUserId = false;
  if (userId) {
    whereClause.userId = userId;
    useUserId = true;
  } else if (apiKeyIds && apiKeyIds.length > 0) {
    whereClause.apiKeyId = {
      in: apiKeyIds,
    };
  } else {
    // If no userId and no apiKeyIds, return empty results
    return {
      total_count: 0,
      unique_users: 0,
    };
  }

  // Get total count - handle missing userId column
  let totalCount: number;
  let uniqueUsersResult: any[];
  
  try {
    totalCount = await prisma.event.count({
      where: whereClause,
    });

    uniqueUsersResult = await prisma.event.groupBy({
      by: ['distinctId'],
      where: whereClause,
    });
  } catch (error: any) {
    // If userId column doesn't exist, fall back to apiKeyIds filtering
    if (error.code === 'P2022' && error.meta?.column?.includes('user_id') && useUserId && apiKeyIds && apiKeyIds.length > 0) {
      const fallbackWhere: any = {
        eventName,
        timestamp: {
          gte: from,
          lte: to,
        },
        apiKeyId: {
          in: apiKeyIds,
        },
      };
      
      totalCount = await prisma.event.count({
        where: fallbackWhere,
      });

      uniqueUsersResult = await prisma.event.groupBy({
        by: ['distinctId'],
        where: fallbackWhere,
      });
    } else {
      throw error;
    }
  }

  return {
    total_count: totalCount,
    unique_users: uniqueUsersResult.length,
  };
}


