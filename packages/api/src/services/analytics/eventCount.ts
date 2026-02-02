import { prisma } from '../../db/client';

/**
 * Gets event count and unique users for a specific event within a date range
 */
export async function getEventCounts(
  eventName: string,
  from: Date,
  to: Date
): Promise<{
  total_count: number;
  unique_users: number;
}> {
  // Get total count
  const totalCount = await prisma.event.count({
    where: {
      eventName,
      timestamp: {
        gte: from,
        lte: to,
      },
    },
  });

  // Get unique users (distinct distinct_ids)
  const uniqueUsersResult = await prisma.event.groupBy({
    by: ['distinctId'],
    where: {
      eventName,
      timestamp: {
        gte: from,
        lte: to,
      },
    },
  });

  return {
    total_count: totalCount,
    unique_users: uniqueUsersResult.length,
  };
}


