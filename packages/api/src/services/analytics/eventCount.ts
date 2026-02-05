import { prisma } from '../../db/client';

/**
 * Gets event count and unique users for a specific event within a date range
 * @param eventName - Name of the event
 * @param from - Start date
 * @param to - End date
 * @param apiKeyIds - Optional array of API key IDs to filter by (for user-specific data)
 */
export async function getEventCounts(
  eventName: string,
  from: Date,
  to: Date,
  apiKeyIds?: string[]
): Promise<{
  total_count: number;
  unique_users: number;
}> {
  // Build where clause with optional API key filter
  const whereClause: any = {
    eventName,
    timestamp: {
      gte: from,
      lte: to,
    },
  };

  // Filter by API keys if provided
  if (apiKeyIds && apiKeyIds.length > 0) {
    whereClause.apiKeyId = {
      in: apiKeyIds,
    };
  }

  // Get total count
  const totalCount = await prisma.event.count({
    where: whereClause,
  });

  // Get unique users (distinct distinct_ids)
  const uniqueUsersResult = await prisma.event.groupBy({
    by: ['distinctId'],
    where: whereClause,
  });

  return {
    total_count: totalCount,
    unique_users: uniqueUsersResult.length,
  };
}


