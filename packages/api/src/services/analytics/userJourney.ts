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

  // Group events by user, tracking latest timestamp per user
  const userEvents: Record<string, Array<{
    event_name: string;
    timestamp: string;
    properties: Record<string, any>;
  }>> = {};
  const userLatest: Record<string, number> = {};

  events.forEach((event) => {
    if (!userEvents[event.distinctId]) {
      userEvents[event.distinctId] = [];
    }

    userEvents[event.distinctId].push({
      event_name: event.eventName,
      timestamp: event.timestamp.toISOString(),
      properties: event.properties as Record<string, any>,
    });

    const ts = event.timestamp.getTime();
    if (!userLatest[event.distinctId] || ts > userLatest[event.distinctId]) {
      userLatest[event.distinctId] = ts;
    }
  });

  // Convert to array, sort by most recent activity first, and limit
  return Object.entries(userEvents)
    .map(([user_id, events]) => ({
      user_id,
      events,
      total_events: events.length,
    }))
    .sort((a, b) => (userLatest[b.user_id] ?? 0) - (userLatest[a.user_id] ?? 0))
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

  const PRIMARY_PROP: Record<string, string> = {
    page_view:           'page',
    button_click:        'button_id',
    signup:              'method',
    purchase:            'product',
    add_to_cart:         'product',
    search:              'query',
    share:               'target',
    settings_change:     'setting',
    onboarding_complete: 'steps_completed',
  };

  function getPrimaryPropValue(eventName: string, properties: Record<string, any>): string | undefined {
    const key = PRIMARY_PROP[eventName];
    if (key && properties[key] !== null && properties[key] !== undefined && properties[key] !== '') {
      return String(properties[key]);
    }
    return undefined;
  }

  // Build per-user ordered step list with primary property value
  const userSteps: Record<string, Array<{ event_name: string; prop_value?: string }>> = {};
  allEvents.forEach((event) => {
    if (!userSteps[event.distinctId]) userSteps[event.distinctId] = [];
    const props = event.properties as Record<string, any>;
    userSteps[event.distinctId].push({
      event_name: event.eventName,
      prop_value: getPrimaryPropValue(event.eventName, props),
    });
  });

  // Sliding window: extract every consecutive window of size 2 and 3
  // This surfaces recurring short patterns across users rather than unique full sessions
  const windowSizes = [3, 2];
  const windowCounts: Record<string, { steps: Array<{ event_name: string; prop_value?: string }>; users: Set<string> }> = {};

  for (const [distinctId, steps] of Object.entries(userSteps)) {
    for (const size of windowSizes) {
      for (let i = 0; i <= steps.length - size; i++) {
        const window = steps.slice(i, i + size);
        const key = window.map(s => s.prop_value ? `${s.event_name}(${s.prop_value})` : s.event_name).join(' → ');
        if (!windowCounts[key]) windowCounts[key] = { steps: window, users: new Set() };
        // One entry per user per window pattern — counts unique users, not occurrences
        windowCounts[key].users.add(distinctId);
      }
    }
  }

  const totalUsers = Object.keys(userSteps).length || 1;

  return Object.values(windowCounts)
    .filter(w => w.users.size >= 1)
    .sort((a, b) => b.users.size - a.users.size || b.steps.length - a.steps.length)
    .slice(0, maxResults)
    .map(w => ({
      path: w.steps.map(s => s.prop_value ? `${s.event_name}(${s.prop_value})` : s.event_name),
      path_with_ids: w.steps.map(s => ({ event_name: s.event_name, prop_value: s.prop_value })),
      count: w.users.size,
      percentage: (w.users.size / totalUsers) * 100,
    }));
}

