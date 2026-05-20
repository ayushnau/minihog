import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateJWT } from '../middleware/jwtAuth';
import { getEventCounts } from '../services/analytics/eventCount';
import { getFunnelAnalysis } from '../services/analytics/funnel';
import { getRetentionAnalysis } from '../services/analytics/retention';
import { getEventTimeSeries } from '../services/analytics/timeSeries';
import { getEventPropertiesBreakdown, getAvailablePropertyKeys } from '../services/analytics/propertiesBreakdown';
import { getUserJourneys, getCommonUserPaths } from '../services/analytics/userJourney';
import { prisma } from '../db/client';

const router = Router();

// All dashboard analytics routes require JWT authentication
router.use(validateJWT);

/**
 * GET /dashboard/analytics/events
 * Returns comprehensive event analytics including:
 * - Total count and unique users
 * - Time series data (daily/hourly)
 * - Properties breakdown (by page, etc.)
 * - User journeys
 * Filtered by the authenticated user's API keys
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
      property_key: z.string().optional(), // e.g., 'page' for page breakdown
      granularity: z.enum(['day', 'hour']).optional().default('day'),
    });

    const params = schema.parse(req.query);
    const apiKeyIds = (req as any).apiKeyIds || [];
    const requestUserId = (req as any).userId;

    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    // Use userId for data persistence after key revocation
    const userIdToUse = requestUserId;

    // Run independent data fetches in parallel to reduce total latency
    const parallelStart = Date.now();
    const [counts, timeSeries, availableProperties, journeyData] = await Promise.all([
      getEventCounts(params.event, fromDate, toDate, apiKeyIds, userIdToUse),
      params.include_time_series
        ? getEventTimeSeries(params.event, fromDate, toDate, apiKeyIds, userIdToUse, params.granularity)
        : Promise.resolve([]),
      params.include_properties
        ? getAvailablePropertyKeys(params.event, fromDate, toDate, apiKeyIds, userIdToUse)
        : Promise.resolve([]),
      params.include_journeys
        ? Promise.all([
            getUserJourneys(fromDate, toDate, apiKeyIds, userIdToUse, 20),
            getCommonUserPaths(fromDate, toDate, apiKeyIds, userIdToUse, 2, 10),
          ])
        : Promise.resolve([[] as any[], [] as any[]]),
    ]);

    const [userJourneys, commonPaths] = journeyData;
    const parallelMs = Date.now() - parallelStart;

    // Properties breakdown depends on available property keys; run after we have them
    let propertiesBreakdown: any[] = [];
    const propertyKey = params.property_key || 'page';
    let propertiesBreakdownMs = 0;
    if (params.include_properties && availableProperties.includes(propertyKey)) {
      const t0 = Date.now();
      propertiesBreakdown = await getEventPropertiesBreakdown(
        params.event,
        fromDate,
        toDate,
        propertyKey,
        apiKeyIds,
        userIdToUse
      );
      propertiesBreakdownMs = Date.now() - t0;
    }

    const totalMs = Date.now() - startMs;
    // Log timing so you can see where the remaining latency is (Vercel logs / dashboard)
    console.log(
      `[events] parallel=${parallelMs}ms propertiesBreakdown=${propertiesBreakdownMs}ms total=${totalMs}ms`
    );

    res.json({
      success: true,
      event: params.event,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
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
 * Returns all distinct event names for the authenticated user
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
      event_names: events.map((e) => ({
        name: e.eventName,
        count: e._count.id,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /dashboard/analytics/funnel
 * Returns funnel analysis for a sequence of events
 * Filtered by the authenticated user's API keys
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
    const steps = params.steps.split(',').map(s => s.trim()).filter(Boolean);

    if (steps.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 steps required for funnel analysis',
      });
    }

    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    // Use userId for data persistence after key revocation
    const userIdToUse = requestUserId;
    const result = await getFunnelAnalysis(steps, fromDate, toDate, apiKeyIds, userIdToUse);

    res.json({
      success: true,
      steps,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /dashboard/analytics/retention
 * Returns retention analysis for users
 * Filtered by the authenticated user's API keys
 */
router.get('/retention', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      cohort: z.string().min(1),
      day: z.string().regex(/^\d+$/).transform(Number),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });

    const params = schema.parse(req.query);
    const apiKeyIds = (req as any).apiKeyIds || [];
    const requestUserId = (req as any).userId;

    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    // Use userId for data persistence after key revocation
    const userIdToUse = requestUserId;
    const result = await getRetentionAnalysis(
      params.cohort,
      params.day,
      fromDate,
      toDate,
      apiKeyIds,
      userIdToUse
    );

    res.json({
      success: true,
      cohort: params.cohort,
      day: params.day,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /dashboard/analytics/attribution
 * Returns attribution analytics (installs per campaign, revenue per campaign, etc.)
 * Filtered by the authenticated user's API keys
 */
router.get('/attribution', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKeyIds = (req as any).apiKeyIds || [];
    const requestUserId = (req as any).userId;

    // Build where clause for attribution
    const installWhere: any = {
      eventName: 'install',
    };
    const purchaseWhere: any = {
      eventName: 'purchase',
    };

    // Filter by userId (primary) OR apiKeyIds (fallback)
    if (requestUserId) {
      installWhere.userId = requestUserId;
      purchaseWhere.userId = requestUserId;
    } else if (apiKeyIds.length > 0) {
      installWhere.apiKeyId = { in: apiKeyIds };
      purchaseWhere.apiKeyId = { in: apiKeyIds };
    }

    // Get installs by campaign (filtered by API keys)
    const installsByCampaign = await prisma.event.groupBy({
      by: ['attributedCampaignId'],
      where: installWhere,
      _count: {
        id: true,
      },
    });

    // Get purchases by campaign (filtered by API keys)
    const purchasesByCampaign = await prisma.event.groupBy({
      by: ['attributedCampaignId'],
      where: purchaseWhere,
      _count: {
        id: true,
      },
    });

    res.json({
      success: true,
      installs_by_campaign: installsByCampaign.map(item => ({
        campaign_id: item.attributedCampaignId,
        install_count: item._count?.id || 0,
      })),
      purchases_by_campaign: purchasesByCampaign.map(item => ({
        campaign_id: item.attributedCampaignId,
        purchase_count: item._count?.id || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export { router as dashboardAnalyticsRouter };

