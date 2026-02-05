import { prisma } from '../../db/client';

/**
 * Calculates retention: % of users who returned after N days
 * 
 * @param cohortEvent - Event that defines the cohort (e.g., "install")
 * @param day - Number of days to check retention for (e.g., 7 for day-7 retention)
 * @param from - Start date for cohort
 * @param to - End date for cohort
 * @param apiKeyIds - Optional array of API key IDs to filter by (for user-specific data)
 * @param userId - Optional user ID to filter by (for data persistence after key revocation)
 * 
 * Returns the percentage of users who performed any event N days after their cohort event
 */
export async function getRetentionAnalysis(
  cohortEvent: string,
  day: number,
  from: Date,
  to: Date,
  apiKeyIds?: string[],
  userId?: string
): Promise<{
  cohort_size: number;
  retained_users: number;
  retention_percentage: number;
}> {
  // Build where clause with optional API key or user filter
  const baseWhereClause: any = {
    timestamp: {
      gte: from,
      lte: to,
    },
  };

  // Filter by userId (primary) OR apiKeyIds (fallback)
  // Handle missing userId column gracefully until migration is applied
  let useUserId = false;
  if (userId) {
    baseWhereClause.userId = userId;
    useUserId = true;
  } else if (apiKeyIds && apiKeyIds.length > 0) {
    baseWhereClause.apiKeyId = {
      in: apiKeyIds,
    };
  }

  // Get all users who performed the cohort event in the date range - handle missing userId column
  let cohortEvents: any[];
  try {
    cohortEvents = await prisma.event.findMany({
      where: {
        eventName: cohortEvent,
        ...baseWhereClause,
      },
      select: {
        distinctId: true,
        timestamp: true,
      },
    });
  } catch (error: any) {
    // If userId column doesn't exist, fall back to apiKeyIds filtering
    if (error.code === 'P2022' && error.meta?.column?.includes('user_id') && useUserId && apiKeyIds && apiKeyIds.length > 0) {
      const fallbackWhere: any = {
        eventName: cohortEvent,
        timestamp: {
          gte: from,
          lte: to,
        },
        apiKeyId: {
          in: apiKeyIds,
        },
      };
      
      cohortEvents = await prisma.event.findMany({
        where: fallbackWhere,
        select: {
          distinctId: true,
          timestamp: true,
        },
      });
    } else {
      throw error;
    }
  }

  const cohortSize = new Set(cohortEvents.map(e => e.distinctId)).size;

  if (cohortSize === 0) {
    return {
      cohort_size: 0,
      retained_users: 0,
      retention_percentage: 0,
    };
  }

  // For each user in the cohort, check if they performed any event N days later
  const retainedUserIds = new Set<string>();

  // Group cohort events by user
  const userCohortTimes = new Map<string, Date[]>();
  cohortEvents.forEach(event => {
    const existing = userCohortTimes.get(event.distinctId) || [];
    existing.push(event.timestamp);
    userCohortTimes.set(event.distinctId, existing);
  });

  // For each user, check if they have any event after their cohort event + N days
  for (const [distinctId, cohortTimestamps] of userCohortTimes.entries()) {
    for (const cohortTime of cohortTimestamps) {
      const retentionWindowStart = new Date(cohortTime);
      retentionWindowStart.setDate(retentionWindowStart.getDate() + day);

      const retentionWindowEnd = new Date(retentionWindowStart);
      retentionWindowEnd.setDate(retentionWindowEnd.getDate() + 1); // Check within 1 day window

      // Check if user has any event in the retention window
      const retentionWhereClause: any = {
        distinctId,
        timestamp: {
          gte: retentionWindowStart,
          lt: retentionWindowEnd,
        },
      };

      if (apiKeyIds && apiKeyIds.length > 0) {
        retentionWhereClause.apiKeyId = {
          in: apiKeyIds,
        };
      }

      const hasRetentionEvent = await prisma.event.findFirst({
        where: retentionWhereClause,
      });

      if (hasRetentionEvent) {
        retainedUserIds.add(distinctId);
        break; // User is retained, no need to check other cohort timestamps
      }
    }
  }

  const retainedUsers = retainedUserIds.size;
  const retentionPercentage = (retainedUsers / cohortSize) * 100;

  return {
    cohort_size: cohortSize,
    retained_users: retainedUsers,
    retention_percentage: Math.round(retentionPercentage * 100) / 100,
  };
}


