import { prisma } from '../../db/client';

export const HEATMAP_DAYS = [1, 3, 7, 14, 21, 28];

export interface CohortRow {
  week: string;
  weekStart: string;
  size: number;
  /** retention % at each HEATMAP_DAYS index; null = day hasn't passed yet */
  retentions: (number | null)[];
}

export interface CohortHeatmapResult {
  days: number[];
  cohorts: CohortRow[];
  /** column-wise averages across all cohorts that have data */
  avg_retentions: (number | null)[];
  total_cohort_size: number;
}

/** Monday of the week containing `d` */
function weekStart(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(m.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

export async function getCohortHeatmap(
  cohortEvent: string,
  from: Date,
  to: Date,
  apiKeyIds?: string[],
  userId?: string,
): Promise<CohortHeatmapResult> {
  const base: any = { timestamp: { gte: from, lte: to } };
  if (userId) base.userId = userId;
  else if (apiKeyIds?.length) base.apiKeyId = { in: apiKeyIds };

  // 1. All cohort events — to find each user's first occurrence
  const cohortEvents = await prisma.event.findMany({
    where: { ...base, eventName: cohortEvent },
    select: { distinctId: true, timestamp: true },
    orderBy: { timestamp: 'asc' },
  });

  if (cohortEvents.length === 0) {
    return { days: HEATMAP_DAYS, cohorts: [], avg_retentions: HEATMAP_DAYS.map(() => null), total_cohort_size: 0 };
  }

  // 2. Per-user earliest cohort timestamp
  const userFirst = new Map<string, Date>();
  for (const e of cohortEvents) {
    if (!userFirst.has(e.distinctId) || e.timestamp < userFirst.get(e.distinctId)!) {
      userFirst.set(e.distinctId, e.timestamp);
    }
  }

  const allUserIds = Array.from(userFirst.keys());

  // 3. Fetch ALL events for these users (for return-visit check)
  const allEvents = await prisma.event.findMany({
    where: { ...base, distinctId: { in: allUserIds } },
    select: { distinctId: true, timestamp: true },
  });

  // Build userId → sorted timestamps
  const userEvents = new Map<string, number[]>();
  for (const e of allEvents) {
    if (!userEvents.has(e.distinctId)) userEvents.set(e.distinctId, []);
    userEvents.get(e.distinctId)!.push(e.timestamp.getTime());
  }

  // 4. Group users into weekly cohorts by their first cohort event
  const weekMap = new Map<string, { ws: Date; users: string[] }>();
  for (const [uid, first] of userFirst.entries()) {
    const ws = weekStart(first);
    const key = ws.toISOString();
    if (!weekMap.has(key)) weekMap.set(key, { ws, users: [] });
    weekMap.get(key)!.users.push(uid);
  }

  const now = Date.now();
  const MS_DAY = 86_400_000;

  // 5. For each cohort week, compute retention at each interval day
  const sorted = Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  const cohorts: CohortRow[] = [];

  for (const [, { ws, users }] of sorted) {
    const retentions: (number | null)[] = HEATMAP_DAYS.map(d => {
      // Null if the minimum possible D-day window hasn't passed yet
      // (most recent user in cohort is ws + 7 days, add D days → ws + d + 7 days)
      if (ws.getTime() + (d + 7) * MS_DAY > now) return null;

      let retained = 0;
      for (const uid of users) {
        // "Forward retention": user is retained at D if they had ANY event
        // at T0 + D days or later (up to end of measurement period).
        // This guarantees monotonically decreasing values across columns.
        const t0 = userFirst.get(uid)!.getTime();
        const windowStart = t0 + d * MS_DAY;
        const timestamps  = userEvents.get(uid) || [];
        if (timestamps.some(ts => ts >= windowStart)) retained++;
      }
      return Math.round((retained / users.length) * 100);
    });

    cohorts.push({
      week: ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekStart: ws.toISOString(),
      size: users.length,
      retentions,
    });
  }

  // 6. Column averages (skip nulls)
  const avg_retentions: (number | null)[] = HEATMAP_DAYS.map((_, di) => {
    const vals = cohorts.map(c => c.retentions[di]).filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  });

  return {
    days: HEATMAP_DAYS,
    cohorts,
    avg_retentions,
    total_cohort_size: allUserIds.length,
  };
}
