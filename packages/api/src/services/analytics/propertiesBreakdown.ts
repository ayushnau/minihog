import { prisma } from '../../db/client';

/**
 * Gets breakdown of events by a specific property
 * @param eventName - Name of the event
 * @param from - Start date
 * @param to - End date
 * @param propertyKey - Property key to group by (e.g., 'page', 'button_name')
 * @param apiKeyIds - Optional array of API key IDs to filter by
 * @param userId - Optional user ID to filter by (for data persistence after key revocation)
 */
export async function getEventPropertiesBreakdown(
  eventName: string,
  from: Date,
  to: Date,
  propertyKey: string,
  apiKeyIds?: string[],
  userId?: string
): Promise<Array<{ value: string; count: number; unique_users: number }>> {
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

  // Get all events with their properties - handle missing userId column
  let events: any[];
  try {
    events = await prisma.event.findMany({
      where: whereClause,
      select: {
        properties: true,
        distinctId: true,
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
          properties: true,
          distinctId: true,
        },
      });
    } else {
      throw error;
    }
  }

  // Group by property value
  const grouped: Record<string, { count: number; users: Set<string> }> = {};

  events.forEach((event) => {
    const properties = event.properties as Record<string, any>;
    const value = properties[propertyKey];

    // Skip if property doesn't exist or is null/undefined
    if (value === null || value === undefined || value === '') {
      return;
    }

    const valueStr = String(value);

    if (!grouped[valueStr]) {
      grouped[valueStr] = { count: 0, users: new Set() };
    }

    grouped[valueStr].count++;
    grouped[valueStr].users.add(event.distinctId);
  });

  // Convert to array, sort by count (descending), and limit to top 20
  return Object.entries(grouped)
    .map(([value, data]) => ({
      value,
      count: data.count,
      unique_users: data.users.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 values
}

/**
 * Gets all available property keys for an event
 * @param eventName - Name of the event
 * @param from - Start date
 * @param to - End date
 * @param apiKeyIds - Optional array of API key IDs to filter by
 * @param userId - Optional user ID to filter by (for data persistence after key revocation)
 */
export async function getAvailablePropertyKeys(
  eventName: string,
  from: Date,
  to: Date,
  apiKeyIds?: string[],
  userId?: string
): Promise<string[]> {
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

  // Get a sample of events to determine available properties - handle missing userId column
  let events: any[];
  try {
    events = await prisma.event.findMany({
      where: whereClause,
      select: {
        properties: true,
      },
      take: 1000, // Sample size
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
          properties: true,
        },
        take: 1000,
      });
    } else {
      throw error;
    }
  }

  const propertyKeys = new Set<string>();

  events.forEach((event) => {
    const properties = event.properties as Record<string, any>;
    Object.keys(properties).forEach((key) => {
      if (properties[key] !== null && properties[key] !== undefined && properties[key] !== '') {
        propertyKeys.add(key);
      }
    });
  });

  return Array.from(propertyKeys).sort();
}

