import { prisma } from '../../db/client';

/**
 * Performs funnel analysis for a sequence of events
 * 
 * A funnel shows how many users progress through each step:
 * - Step 1: Users who completed event 1
 * - Step 2: Users who completed event 1 AND event 2 (in order)
 * - Step 3: Users who completed event 1, 2, AND 3 (in order)
 * 
 * Returns drop-off percentages between steps
 */
export async function getFunnelAnalysis(
  steps: string[],
  from: Date,
  to: Date
): Promise<{
  funnel: Array<{
    step: number;
    event_name: string;
    users: number;
    drop_off_percentage: number;
  }>;
  total_users_at_first_step: number;
}> {
  if (steps.length === 0) {
    return {
      funnel: [],
      total_users_at_first_step: 0,
    };
  }

  // Step 1: Get all users who completed the first event
  const firstStepUsers = await prisma.event.findMany({
    where: {
      eventName: steps[0],
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

  const firstStepUserIds = new Set(firstStepUsers.map(e => e.distinctId));
  const totalUsersAtFirstStep = firstStepUserIds.size;

  const funnel: Array<{
    step: number;
    event_name: string;
    users: number;
    drop_off_percentage: number;
  }> = [];

  // For each subsequent step, find users who completed all previous steps
  let previousStepUsers = new Map<string, Date>(); // distinctId -> last timestamp of previous step

  // Initialize with first step
  firstStepUsers.forEach(event => {
    const existing = previousStepUsers.get(event.distinctId);
    if (!existing || event.timestamp > existing) {
      previousStepUsers.set(event.distinctId, event.timestamp);
    }
  });

  funnel.push({
    step: 1,
    event_name: steps[0],
    users: previousStepUsers.size,
    drop_off_percentage: 0,
  });

  // Process remaining steps
  for (let i = 1; i < steps.length; i++) {
    const currentStep = steps[i];
    const currentStepUsers = new Map<string, Date>();

    // Get all events for current step
    const currentStepEvents = await prisma.event.findMany({
      where: {
        eventName: currentStep,
        distinctId: {
          in: Array.from(previousStepUsers.keys()),
        },
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

    // Filter: user must have completed previous step AND current step
    // Current step must occur after previous step
    currentStepEvents.forEach(event => {
      const previousTimestamp = previousStepUsers.get(event.distinctId);
      if (previousTimestamp && event.timestamp >= previousTimestamp) {
        const existing = currentStepUsers.get(event.distinctId);
        if (!existing || event.timestamp > existing) {
          currentStepUsers.set(event.distinctId, event.timestamp);
        }
      }
    });

    const currentStepUserCount = currentStepUsers.size;
    const previousStepUserCount = previousStepUsers.size;
    const dropOffPercentage =
      previousStepUserCount > 0
        ? ((previousStepUserCount - currentStepUserCount) / previousStepUserCount) * 100
        : 0;

    funnel.push({
      step: i + 1,
      event_name: currentStep,
      users: currentStepUserCount,
      drop_off_percentage: Math.round(dropOffPercentage * 100) / 100,
    });

    previousStepUsers = currentStepUsers;
  }

  return {
    funnel,
    total_users_at_first_step: totalUsersAtFirstStep,
  };
}


