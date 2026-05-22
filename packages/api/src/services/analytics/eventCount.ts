import { prisma } from '../../db/client';

export async function getEventCounts(
  eventName: string,
  from: Date,
  to: Date,
  apiKeyIds?: string[],
  userId?: string,
  propertyFilter?: { key: string; value: string }
): Promise<{ total_count: number; unique_users: number }> {
  const whereClause: any = {
    eventName,
    timestamp: { gte: from, lte: to },
  };

  let useUserId = false;
  if (userId) {
    whereClause.userId = userId;
    useUserId = true;
  } else if (apiKeyIds && apiKeyIds.length > 0) {
    whereClause.apiKeyId = { in: apiKeyIds };
  } else {
    return { total_count: 0, unique_users: 0 };
  }

  if (propertyFilter) {
    whereClause.properties = { path: [propertyFilter.key], equals: propertyFilter.value };
  }

  let totalCount: number;
  let uniqueUsers: number;

  try {
    [totalCount, uniqueUsers] = await Promise.all([
      prisma.event.count({ where: whereClause }),
      prisma.event.findMany({ where: whereClause, select: { distinctId: true }, distinct: ['distinctId'] })
        .then(r => r.length),
    ]);
  } catch (error: any) {
    if (error.code === 'P2022' && error.meta?.column?.includes('user_id') && useUserId && apiKeyIds && apiKeyIds.length > 0) {
      const fallbackWhere: any = {
        eventName,
        timestamp: { gte: from, lte: to },
        apiKeyId: { in: apiKeyIds },
      };
      if (propertyFilter) {
        fallbackWhere.properties = { path: [propertyFilter.key], equals: propertyFilter.value };
      }
      [totalCount, uniqueUsers] = await Promise.all([
        prisma.event.count({ where: fallbackWhere }),
        prisma.event.findMany({ where: fallbackWhere, select: { distinctId: true }, distinct: ['distinctId'] })
          .then(r => r.length),
      ]);
    } else {
      throw error;
    }
  }

  return { total_count: totalCount, unique_users: uniqueUsers };
}
