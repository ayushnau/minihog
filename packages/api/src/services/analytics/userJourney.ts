import { prisma } from '../../db/client';

/**
 * Gets user journey data - sequence of events for individual users
 * @param from - Start date
 * @param to - End date
 * @param apiKeyIds - Optional array of API key IDs to filter by
 * @param userId - Optional user ID to filter by (for data persistence after key revocation)
 * @param limit - Maximum number of users to return (default: 50)
 */
export async function getUserJourneys(
  from: Date,
  to: Date,
  apiKeyIds?: string[],
  userId?: string,
  limit: number = 50
): Promise<Array<{
  user_id: string;
  events: Array<{
    event_name: string;
    timestamp: string;
    properties: Record<string, any>;
  }>;
  total_events: number;
}>> {
  // Build where clause
  const whereClause: any = {
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

  // Get all events ordered by user and timestamp - handle missing userId column
  let events: any[];
  try {
    events = await prisma.event.findMany({
      where: whereClause,
      select: {
        distinctId: true,
        eventName: true,
        timestamp: true,
        properties: true,
      },
      orderBy: [
        { distinctId: 'asc' },
        { timestamp: 'asc' },
      ],
    });
  } catch (error: any) {
    // If userId column doesn't exist, fall back to apiKeyIds filtering
    if (error.code === 'P2022' && error.meta?.column?.includes('user_id') && useUserId && apiKeyIds && apiKeyIds.length > 0) {
      const fallbackWhere: any = {
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
          distinctId: true,
          eventName: true,
          timestamp: true,
          properties: true,
        },
        orderBy: [
          { distinctId: 'asc' },
          { timestamp: 'asc' },
        ],
      });
    } else {
      throw error;
    }
  }

  // Group events by user
  const userEvents: Record<string, Array<{
    event_name: string;
    timestamp: string;
    properties: Record<string, any>;
  }>> = {};

  events.forEach((event) => {
    if (!userEvents[event.distinctId]) {
      userEvents[event.distinctId] = [];
    }

    userEvents[event.distinctId].push({
      event_name: event.eventName,
      timestamp: event.timestamp.toISOString(),
      properties: event.properties as Record<string, any>,
    });
  });

  // Convert to array, sort by total events (descending), and limit
  return Object.entries(userEvents)
    .map(([user_id, events]) => ({
      user_id,
      events,
      total_events: events.length,
    }))
    .sort((a, b) => b.total_events - a.total_events)
    .slice(0, limit);
}

/**
 * Gets aggregated user journey patterns - common paths users take
 * @param from - Start date
 * @param to - End date
 * @param apiKeyIds - Optional array of API key IDs to filter by
 * @param userId - Optional user ID to filter by (for data persistence after key revocation)
 * @param minPathLength - Minimum path length to include (default: 2)
 * @param maxResults - Maximum number of paths to return (default: 20)
 */
export async function getCommonUserPaths(
  from: Date,
  to: Date,
  apiKeyIds?: string[],
  userId?: string,
  minPathLength: number = 2,
  maxResults: number = 20
): Promise<Array<{
  path: string[];
  path_with_ids?: Array<{ event_name: string; button_id?: string }>;
  count: number;
  percentage: number;
}>> {
  // Build where clause
  const whereClause: any = {
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

  // Get all events with properties to extract button_id - handle missing userId column
  let allEvents: any[];
  try {
    allEvents = await prisma.event.findMany({
      where: whereClause,
      select: {
        distinctId: true,
        eventName: true,
        timestamp: true,
        properties: true,
      },
      orderBy: [
        { distinctId: 'asc' },
        { timestamp: 'asc' },
      ],
    });
  } catch (error: any) {
    // If userId column doesn't exist, fall back to apiKeyIds filtering
    if (error.code === 'P2022' && error.meta?.column?.includes('user_id') && useUserId && apiKeyIds && apiKeyIds.length > 0) {
      const fallbackWhere: any = {
        timestamp: {
          gte: from,
          lte: to,
        },
        apiKeyId: {
          in: apiKeyIds,
        },
      };
      
      allEvents = await prisma.event.findMany({
        where: fallbackWhere,
        select: {
          distinctId: true,
          eventName: true,
          timestamp: true,
          properties: true,
        },
        orderBy: [
          { distinctId: 'asc' },
          { timestamp: 'asc' },
        ],
      });
    } else {
      throw error;
    }
  }

  // Build a map of user paths with event details (including button_id)
  const userPathsWithDetails: Record<string, Array<{
    event_name: string;
    button_id?: string;
  }>> = {};

  // Group events by user with button_id info
  allEvents.forEach((event) => {
    if (!userPathsWithDetails[event.distinctId]) {
      userPathsWithDetails[event.distinctId] = [];
    }
    
    const properties = event.properties as Record<string, any>;
    userPathsWithDetails[event.distinctId].push({
      event_name: event.eventName,
      button_id: properties?.button_id,
    });
  });

  // Count path occurrences with button_id info
  const pathCounts: Record<string, { count: number; buttonIds: Map<string, number> }> = {};
  let totalPaths = 0;

  Object.values(userPathsWithDetails).forEach((path) => {
    // Only consider paths of minimum length
    if (path.length >= minPathLength) {
      // Create path string with button_id if available
      const pathStr = path.map(p => {
        if (p.button_id) {
          return `${p.event_name} [${p.button_id}]`;
        }
        return p.event_name;
      }).join(' → ');
      
      if (!pathCounts[pathStr]) {
        pathCounts[pathStr] = { count: 0, buttonIds: new Map() };
      }
      pathCounts[pathStr].count++;
      totalPaths++;
    }
  });

  // Convert to array, sort by count, and limit results
  const paths = Object.entries(pathCounts)
    .map(([pathStr, data]) => {
      // Parse the path string back to array, keeping button_id info
      const pathArray = pathStr.split(' → ').map(step => {
        // Check if step contains button_id in format "event_name [button_id]"
        const match = step.match(/^(.+?)\s\[(.+?)\]$/);
        if (match) {
          return { event_name: match[1], button_id: match[2] };
        }
        return { event_name: step };
      });
      
      return {
        path: pathArray.map(p => p.event_name),
        path_with_ids: pathArray,
        count: data.count,
        percentage: totalPaths > 0 ? (data.count / totalPaths) * 100 : 0,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, maxResults);

  return paths;
}

