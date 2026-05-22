import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateJWT } from '../middleware/jwtAuth';
import { getEventCounts } from '../services/analytics/eventCount';
import { getFunnelAnalysis } from '../services/analytics/funnel';
import { getRetentionAnalysis } from '../services/analytics/retention';
import { getEventTimeSeries } from '../services/analytics/timeSeries';
import { getEventPropertiesBreakdown, getAvailablePropertyKeys } from '../services/analytics/propertiesBreakdown';
import { getUserJourneys, getCommonUserPaths } from '../services/analytics/userJourney';
import { getCohortHeatmap } from '../services/analytics/cohortHeatmap';
import { prisma } from '../db/client';

const router = Router();
router.use(validateJWT);

/**
 * GET /dashboard/analytics/events
 */
router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  const startMs = Date.now();
  try {
    const schema = z.object({
      event: z.string().min(1),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      include_time_series: z.string().optional().transform(val => val === 'true'),
      include_properties: z.string().optional().transform(val => val === 'true'),
      include_journeys: z.string().optional().transform(val => val === 'true'),
      property_key: z.string().optional(),
      granularity: z.enum(['day', 'hour']).optional().default('day'),
      // Property filter — narrows all queries to events where properties[filter_key] = filter_value
      filter_key: z.string().optional(),
      filter_value: z.string().optional(),
    });

    const params = schema.parse(req.query);
    const apiKeyIds = (req as any).apiKeyIds || [];
    const requestUserId = (req as any).userId;
    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    const propertyFilter = params.filter_key && params.filter_value
      ? { key: params.filter_key, value: params.filter_value }
      : undefined;

    const [counts, timeSeries, availableProperties, journeyData] = await Promise.all([
      getEventCounts(params.event, fromDate, toDate, apiKeyIds, requestUserId, propertyFilter),
      params.include_time_series
        ? getEventTimeSeries(params.event, fromDate, toDate, apiKeyIds, requestUserId, params.granularity, propertyFilter)
        : Promise.resolve([]),
      params.include_properties
        ? getAvailablePropertyKeys(params.event, fromDate, toDate, apiKeyIds, requestUserId)
        : Promise.resolve([]),
      params.include_journeys
        ? Promise.all([
            getUserJourneys(fromDate, toDate, apiKeyIds, requestUserId, 20),
            getCommonUserPaths(fromDate, toDate, apiKeyIds, requestUserId, 2, 10),
          ])
        : Promise.resolve([[] as any[], [] as any[]]),
    ]);

    const [userJourneys, commonPaths] = journeyData;

    let propertiesBreakdown: any[] = [];
    const propertyKey = params.property_key || 'page';
    if (params.include_properties && availableProperties.includes(propertyKey)) {
      propertiesBreakdown = await getEventPropertiesBreakdown(
        params.event, fromDate, toDate, propertyKey, apiKeyIds, requestUserId, propertyFilter
      );
    }

    console.log(`[events] total=${Date.now() - startMs}ms`);
    res.json({
      success: true,
      event: params.event,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      filter_key: params.filter_key,
      filter_value: params.filter_value,
      total_count: counts.total_count,
      unique_users: counts.unique_users,
      time_series: timeSeries,
      properties_breakdown: propertiesBreakdown,
      available_properties: availableProperties,
      user_journeys: userJourneys,
      common_paths: commonPaths,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /dashboard/analytics/event-names
 */
router.get('/event-names', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKeyIds = (req as any).apiKeyIds || [];
    const requestUserId = (req as any).userId;
    const whereClause: any = {};
    if (requestUserId) {
      whereClause.userId = requestUserId;
    } else if (apiKeyIds.length > 0) {
      whereClause.apiKeyId = { in: apiKeyIds };
    }
    const events = await prisma.event.groupBy({
      by: ['eventName'],
      where: whereClause,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    res.json({
      success: true,
      event_names: events.map(e => ({ name: e.eventName, count: e._count.id })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /dashboard/analytics/property-keys?event=page_view
 * Returns all property keys for a given event (so UI can populate the filter key dropdown)
 */
router.get('/property-keys', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      event: z.string().min(1),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });
    const params = schema.parse(req.query);
    const apiKeyIds = (req as any).apiKeyIds || [];
    const requestUserId = (req as any).userId;
    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    const keys = await getAvailablePropertyKeys(params.event, fromDate, toDate, apiKeyIds, requestUserId);
    res.json({ success: true, keys });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /dashboard/analytics/property-values?event=page_view&key=page
 * Returns all distinct values for a property key on an event (so UI can populate the filter value dropdown)
 */
router.get('/property-values', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      event: z.string().min(1),
      key: z.string().min(1),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });
    const params = schema.parse(req.query);
    const apiKeyIds = (req as any).apiKeyIds || [];
    const requestUserId = (req as any).userId;
    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    const whereClause: any = {
      eventName: params.event,
      timestamp: { gte: fromDate, lte: toDate },
    };
    if (requestUserId) {
      whereClause.userId = requestUserId;
    } else if (apiKeyIds.length > 0) {
      whereClause.apiKeyId = { in: apiKeyIds };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      select: { properties: true },
      take: 2000,
    });

    const values = new Set<string>();
    events.forEach(e => {
      const props = e.properties as Record<string, any>;
      const v = props?.[params.key];
      if (v !== null && v !== undefined && v !== '') values.add(String(v));
    });

    res.json({ success: true, values: Array.from(values).sort() });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /dashboard/analytics/funnel
 * steps param is JSON: [{"event":"page_view","propertyKey":"page","propertyValue":"/home"},{"event":"signup"}]
 */
router.get('/funnel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      steps: z.string().min(1),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });
    const params = schema.parse(req.query);
    const apiKeyIds = (req as any).apiKeyIds || [];
    const requestUserId = (req as any).userId;
    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    // Support both legacy comma-string and new JSON array formats
    let steps: Array<{ event: string; propertyKey?: string; propertyValue?: string }>;
    try {
      const parsed = JSON.parse(params.steps);
      if (Array.isArray(parsed)) {
        steps = parsed;
      } else {
        throw new Error('Not an array');
      }
    } catch {
      // Legacy: comma-separated event names
      steps = params.steps.split(',').map(s => ({ event: s.trim() })).filter(s => s.event);
    }

    if (steps.length < 2) {
      return res.status(400).json({ success: false, error: 'At least 2 steps required' });
    }

    const result = await getFunnelAnalysis(steps, fromDate, toDate, apiKeyIds, requestUserId);
    res.json({ success: true, steps, from: fromDate.toISOString(), to: toDate.toISOString(), ...result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /dashboard/analytics/retention
 */
router.get('/retention', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      cohort: z.string().min(1),
      day: z.string().regex(/^\d+$/).transform(Number),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      filter_key: z.string().optional(),
      filter_value: z.string().optional(),
    });
    const params = schema.parse(req.query);
    const apiKeyIds = (req as any).apiKeyIds || [];
    const requestUserId = (req as any).userId;
    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    const propertyFilter = params.filter_key && params.filter_value
      ? { key: params.filter_key, value: params.filter_value }
      : undefined;

    const result = await getRetentionAnalysis(
      params.cohort, params.day, fromDate, toDate, apiKeyIds, requestUserId, propertyFilter
    );
    res.json({
      success: true,
      cohort: params.cohort,
      day: params.day,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      filter_key: params.filter_key,
      filter_value: params.filter_value,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /dashboard/analytics/attribution
 */
router.get('/attribution', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKeyIds = (req as any).apiKeyIds || [];
    const requestUserId = (req as any).userId;
    const installWhere: any = { eventName: 'install' };
    const purchaseWhere: any = { eventName: 'purchase' };
    if (requestUserId) {
      installWhere.userId = requestUserId;
      purchaseWhere.userId = requestUserId;
    } else if (apiKeyIds.length > 0) {
      installWhere.apiKeyId = { in: apiKeyIds };
      purchaseWhere.apiKeyId = { in: apiKeyIds };
    }
    const [installsByCampaign, purchasesByCampaign] = await Promise.all([
      prisma.event.groupBy({ by: ['attributedCampaignId'], where: installWhere, _count: { id: true } }),
      prisma.event.groupBy({ by: ['attributedCampaignId'], where: purchaseWhere, _count: { id: true } }),
    ]);
    res.json({
      success: true,
      installs_by_campaign: installsByCampaign.map(item => ({ campaign_id: item.attributedCampaignId, install_count: item._count?.id || 0 })),
      purchases_by_campaign: purchasesByCampaign.map(item => ({ campaign_id: item.attributedCampaignId, purchase_count: item._count?.id || 0 })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /dashboard/analytics/retention/heatmap
 * Returns weekly cohort × day-interval retention matrix
 */
router.get('/retention/heatmap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      cohort: z.string().min(1),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });
    const params = schema.parse(req.query);
    const apiKeyIds = (req as any).apiKeyIds || [];
    const requestUserId = (req as any).userId;
    const fromDate = params.from ? new Date(params.from) : new Date(Date.now() - 30 * 86_400_000);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    const result = await getCohortHeatmap(params.cohort, fromDate, toDate, apiKeyIds, requestUserId);
    res.json({ success: true, cohort: params.cohort, from: fromDate.toISOString(), to: toDate.toISOString(), ...result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /dashboard/analytics/live
 * Returns the 30 most recent raw events for the live stream panel
 */
router.get('/live', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const apiKeyIds = (req as any).apiKeyIds || [];
    const where: any = {};
    if (userId) where.userId = userId;
    else if (apiKeyIds.length > 0) where.apiKeyId = { in: apiKeyIds };

    const events = await prisma.event.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 30,
      select: { id: true, eventName: true, distinctId: true, timestamp: true, properties: true },
    });

    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
});

export { router as dashboardAnalyticsRouter };
