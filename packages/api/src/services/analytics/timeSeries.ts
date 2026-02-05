import { prisma } from '../../db/client';

/**
 * Gets time series data for events (daily or hourly breakdown)
 * @param eventName - Name of the event
 * @param from - Start date
 * @param to - End date
 * @param apiKeyIds - Optional array of API key IDs to filter by
 * @param userId - Optional user ID to filter by (for data persistence after key revocation)
 * @param granularity - 'day' or 'hour' (default: 'day')
 */
export async function getEventTimeSeries(
  eventName: string,
  from: Date,
  to: Date,
  apiKeyIds?: string[],
  userId?: string,
  granularity: 'day' | 'hour' = 'day'
): Promise<Array<{ date: string; count: number; unique_users: number }>> {
  // Build where clause
  const whereClause: any = {
    eventName,
    timestamp: {
      gte: from,
      lte: to,
    },
  };

  // Filter by userId (primary) OR apiKeyIds (fallback)
  // Handle missing userId column gracefully until migration is applied
  let useUserId = false;
  if (userId) {
    whereClause.userId = userId;
    useUserId = true;
  } else if (apiKeyIds && apiKeyIds.length > 0) {
    whereClause.apiKeyId = {
      in: apiKeyIds,
    };
  }

  // Get all events in the date range - handle missing userId column
  let events: any[];
  try {
    events = await prisma.event.findMany({
      where: whereClause,
      select: {
        timestamp: true,
        distinctId: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
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
      
      events = await prisma.event.findMany({
        where: fallbackWhere,
        select: {
          timestamp: true,
          distinctId: true,
        },
        orderBy: {
          timestamp: 'asc',
        },
      });
    } else {
      throw error;
    }
  }

  // Group by date/hour
  const grouped: Record<string, { count: number; users: Set<string> }> = {};

  events.forEach((event) => {
    const date = new Date(event.timestamp);
    let key: string;

    if (granularity === 'hour') {
      // Format: YYYY-MM-DD HH:00
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
    } else {
      // Format: YYYY-MM-DD
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    if (!grouped[key]) {
      grouped[key] = { count: 0, users: new Set() };
    }

    grouped[key].count++;
    grouped[key].users.add(event.distinctId);
  });

  // Convert to array and sort by date
  return Object.entries(grouped)
    .map(([date, data]) => ({
      date,
      count: data.count,
      unique_users: data.users.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

