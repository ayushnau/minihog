import { prisma } from '../../db/client';

/**
 * Calculates retention: % of users who returned after N days
 * 
 * @param cohortEvent - Event that defines the cohort (e.g., "install")
 * @param day - Number of days to check retention for (e.g., 7 for day-7 retention)
 * @param from - Start date for cohort
 * @param to - End date for cohort
 * 
 * Returns the percentage of users who performed any event N days after their cohort event
 */
export async function getRetentionAnalysis(
  cohortEvent: string,
  day: number,
  from: Date,
  to: Date
): Promise<{
  cohort_size: number;
  retained_users: number;
  retention_percentage: number;
}> {
  // Get all users who performed the cohort event in the date range
  const cohortEvents = await prisma.event.findMany({
    where: {
      eventName: cohortEvent,
      timestamp: {
        gte: from,
        lte: to,
      },
    },
    select: {
      distinctId: true,
      timestamp: true,
    },
  });

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
      const hasRetentionEvent = await prisma.event.findFirst({
        where: {
          distinctId,
          timestamp: {
            gte: retentionWindowStart,
            lt: retentionWindowEnd,
          },
        },
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


