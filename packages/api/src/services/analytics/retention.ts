import { prisma } from '../../db/client';

export async function getRetentionAnalysis(
  cohortEvent: string,
  day: number,
  from: Date,
  to: Date,
  apiKeyIds?: string[],
  userId?: string,
  propertyFilter?: { key: string; value: string }
): Promise<{ cohort_size: number; retained_users: number; retention_percentage: number }> {
  const baseWhereClause: any = {
    timestamp: { gte: from, lte: to },
  };

  let useUserId = false;
  if (userId) {
    baseWhereClause.userId = userId;
    useUserId = true;
  } else if (apiKeyIds && apiKeyIds.length > 0) {
    baseWhereClause.apiKeyId = { in: apiKeyIds };
  }

  // Property filter applies to cohort event only
  const cohortWhere: any = { eventName: cohortEvent, ...baseWhereClause };
  if (propertyFilter) {
    cohortWhere.properties = { path: [propertyFilter.key], equals: propertyFilter.value };
  }

  let cohortEvents: any[];
  try {
    cohortEvents = await prisma.event.findMany({
      where: cohortWhere,
      select: { distinctId: true, timestamp: true },
    });
  } catch (error: any) {
    if (error.code === 'P2022' && error.meta?.column?.includes('user_id') && useUserId && apiKeyIds && apiKeyIds.length > 0) {
      const fallbackWhere: any = {
        eventName: cohortEvent,
        timestamp: { gte: from, lte: to },
        apiKeyId: { in: apiKeyIds },
      };
      if (propertyFilter) {
        fallbackWhere.properties = { path: [propertyFilter.key], equals: propertyFilter.value };
      }
      cohortEvents = await prisma.event.findMany({
        where: fallbackWhere,
        select: { distinctId: true, timestamp: true },
      });
    } else {
      throw error;
    }
  }

  const cohortSize = new Set(cohortEvents.map(e => e.distinctId)).size;
  if (cohortSize === 0) return { cohort_size: 0, retained_users: 0, retention_percentage: 0 };

  const userCohortTimes = new Map<string, Date[]>();
  cohortEvents.forEach(event => {
    const existing = userCohortTimes.get(event.distinctId) || [];
    existing.push(event.timestamp);
    userCohortTimes.set(event.distinctId, existing);
  });

  const retainedUserIds = new Set<string>();

  for (const [distinctId, cohortTimestamps] of userCohortTimes.entries()) {
    for (const cohortTime of cohortTimestamps) {
      const retentionWindowStart = new Date(cohortTime);
      retentionWindowStart.setDate(retentionWindowStart.getDate() + day);
      const retentionWindowEnd = new Date(retentionWindowStart);
      retentionWindowEnd.setDate(retentionWindowEnd.getDate() + 1);

      const retentionWhereClause: any = {
        distinctId,
        timestamp: { gte: retentionWindowStart, lt: retentionWindowEnd },
      };
      if (apiKeyIds && apiKeyIds.length > 0) {
        retentionWhereClause.apiKeyId = { in: apiKeyIds };
      }

      const hasRetentionEvent = await prisma.event.findFirst({ where: retentionWhereClause });
      if (hasRetentionEvent) {
        retainedUserIds.add(distinctId);
        break;
      }
    }
  }

  const retainedUsers = retainedUserIds.size;
  return {
    cohort_size: cohortSize,
    retained_users: retainedUsers,
    retention_percentage: Math.round((retainedUsers / cohortSize) * 10000) / 100,
  };
}
