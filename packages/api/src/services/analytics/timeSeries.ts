import { prisma } from '../../db/client';

export async function getEventTimeSeries(
  eventName: string,
  from: Date,
  to: Date,
  apiKeyIds?: string[],
  userId?: string,
  granularity: 'day' | 'hour' = 'day',
  propertyFilter?: { key: string; value: string }
): Promise<Array<{ date: string; count: number; unique_users: number }>> {
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
  }

  if (propertyFilter) {
    whereClause.properties = { path: [propertyFilter.key], equals: propertyFilter.value };
  }

  let events: any[];
  try {
    events = await prisma.event.findMany({
      where: whereClause,
      select: { timestamp: true, distinctId: true },
      orderBy: { timestamp: 'asc' },
    });
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
      events = await prisma.event.findMany({
        where: fallbackWhere,
        select: { timestamp: true, distinctId: true },
        orderBy: { timestamp: 'asc' },
      });
    } else {
      throw error;
    }
  }

  const grouped: Record<string, { count: number; users: Set<string> }> = {};
  events.forEach((event) => {
    const date = new Date(event.timestamp);
    let key: string;
    if (granularity === 'hour') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    if (!grouped[key]) grouped[key] = { count: 0, users: new Set() };
    grouped[key].count++;
    grouped[key].users.add(event.distinctId);
  });

  return Object.entries(grouped)
    .map(([date, data]) => ({ date, count: data.count, unique_users: data.users.size }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
