import { prisma } from '../../db/client';

export interface FunnelStep {
  event: string;
  propertyKey?: string;
  propertyValue?: string;
}

export async function getFunnelAnalysis(
  steps: FunnelStep[],
  from: Date,
  to: Date,
  apiKeyIds?: string[],
  userId?: string
): Promise<{
  funnel: Array<{ step: number; event_name: string; property_filter?: string; users: number; drop_off_percentage: number }>;
  total_users_at_first_step: number;
}> {
  if (steps.length === 0) return { funnel: [], total_users_at_first_step: 0 };

  const baseWhereClause: any = { timestamp: { gte: from, lte: to } };
  let useUserId = false;
  if (userId) {
    baseWhereClause.userId = userId;
    useUserId = true;
  } else if (apiKeyIds && apiKeyIds.length > 0) {
    baseWhereClause.apiKeyId = { in: apiKeyIds };
  }

  const buildWhere = (step: FunnelStep, extra: any = {}) => {
    const where: any = { eventName: step.event, ...baseWhereClause, ...extra };
    if (step.propertyKey && step.propertyValue !== undefined && step.propertyValue !== '') {
      where.properties = { path: [step.propertyKey], equals: step.propertyValue };
    }
    return where;
  };

  const queryStep = async (where: any): Promise<any[]> => {
    try {
      return await prisma.event.findMany({ where, select: { distinctId: true, timestamp: true } });
    } catch (error: any) {
      if (error.code === 'P2022' && error.meta?.column?.includes('user_id') && useUserId && apiKeyIds && apiKeyIds.length > 0) {
        const fallback = { ...where };
        delete fallback.userId;
        fallback.apiKeyId = { in: apiKeyIds };
        return await prisma.event.findMany({ where: fallback, select: { distinctId: true, timestamp: true } });
      }
      throw error;
    }
  };

  // Step 1
  const firstStepEvents = await queryStep(buildWhere(steps[0]));
  let previousStepUsers = new Map<string, Date>();
  firstStepEvents.forEach(event => {
    const existing = previousStepUsers.get(event.distinctId);
    if (!existing || event.timestamp < existing) {
      previousStepUsers.set(event.distinctId, event.timestamp);
    }
  });

  const funnel: Array<{ step: number; event_name: string; property_filter?: string; users: number; drop_off_percentage: number }> = [];
  funnel.push({
    step: 1,
    event_name: steps[0].event,
    property_filter: steps[0].propertyKey && steps[0].propertyValue ? `${steps[0].propertyKey}=${steps[0].propertyValue}` : undefined,
    users: previousStepUsers.size,
    drop_off_percentage: 0,
  });

  for (let i = 1; i < steps.length; i++) {
    const currentStep = steps[i];
    const extra = { distinctId: { in: Array.from(previousStepUsers.keys()) } };
    const currentStepEvents = await queryStep(buildWhere(currentStep, extra));

    const currentStepUsers = new Map<string, Date>();
    currentStepEvents.forEach(event => {
      const previousTimestamp = previousStepUsers.get(event.distinctId);
      if (previousTimestamp && event.timestamp >= previousTimestamp) {
        const existing = currentStepUsers.get(event.distinctId);
        if (!existing || event.timestamp < existing) {
          currentStepUsers.set(event.distinctId, event.timestamp);
        }
      }
    });

    const dropOff = previousStepUsers.size > 0
      ? ((previousStepUsers.size - currentStepUsers.size) / previousStepUsers.size) * 100
      : 0;

    funnel.push({
      step: i + 1,
      event_name: currentStep.event,
      property_filter: currentStep.propertyKey && currentStep.propertyValue ? `${currentStep.propertyKey}=${currentStep.propertyValue}` : undefined,
      users: currentStepUsers.size,
      drop_off_percentage: Math.round(dropOff * 100) / 100,
    });

    previousStepUsers = currentStepUsers;
  }

  return { funnel, total_users_at_first_step: previousStepUsers.size > 0 ? funnel[0].users : 0 };
}
