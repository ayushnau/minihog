import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateJWT } from '../middleware/jwtAuth';
import { getEventCounts } from '../services/analytics/eventCount';
import { getFunnelAnalysis } from '../services/analytics/funnel';
import { getRetentionAnalysis } from '../services/analytics/retention';
import { prisma } from '../db/client';

const router = Router();

// All dashboard analytics routes require JWT authentication
router.use(validateJWT);

/**
 * GET /dashboard/analytics/events
 * Returns event count and unique users for a given event
 * Filtered by the authenticated user's API keys
 */
router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      event: z.string().min(1),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });

    const params = schema.parse(req.query);
    const apiKeyIds = (req as any).apiKeyIds || [];

    // If user has no API keys, return empty results
    if (apiKeyIds.length === 0) {
      return res.json({
        success: true,
        event: params.event,
        from: params.from ? new Date(params.from).toISOString() : new Date(0).toISOString(),
        to: params.to ? new Date(params.to + 'T23:59:59.999Z').toISOString() : new Date().toISOString(),
        total_count: 0,
        unique_users: 0,
      });
    }

    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    const result = await getEventCounts(params.event, fromDate, toDate, apiKeyIds);

    res.json({
      success: true,
      event: params.event,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      ...result,
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
    const steps = params.steps.split(',').map(s => s.trim()).filter(Boolean);

    if (steps.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 steps required for funnel analysis',
      });
    }

    // If user has no API keys, return empty results
    if (apiKeyIds.length === 0) {
      const fromDate = params.from ? new Date(params.from) : new Date(0);
      const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();
      return res.json({
        success: true,
        steps,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        funnel: [],
        total_users_at_first_step: 0,
      });
    }

    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    const result = await getFunnelAnalysis(steps, fromDate, toDate, apiKeyIds);

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

    // If user has no API keys, return empty results
    if (apiKeyIds.length === 0) {
      const fromDate = params.from ? new Date(params.from) : new Date(0);
      const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();
      return res.json({
        success: true,
        cohort: params.cohort,
        day: params.day,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        cohort_size: 0,
        retained_users: 0,
        retention_percentage: 0,
      });
    }

    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    const result = await getRetentionAnalysis(
      params.cohort,
      params.day,
      fromDate,
      toDate,
      apiKeyIds
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

    // Get installs by campaign (filtered by API keys)
    const installsByCampaign = await prisma.event.groupBy({
      by: ['attributedCampaignId'],
      where: {
        eventName: 'install',
        apiKeyId: apiKeyIds.length > 0 ? { in: apiKeyIds } : undefined,
      },
      _count: {
        id: true,
      },
    });

    // Get purchases by campaign (filtered by API keys)
    const purchasesByCampaign = await prisma.event.groupBy({
      by: ['attributedCampaignId'],
      where: {
        eventName: 'purchase',
        apiKeyId: apiKeyIds.length > 0 ? { in: apiKeyIds } : undefined,
      },
      _count: {
        id: true,
      },
    });

    res.json({
      success: true,
      installs_by_campaign: installsByCampaign.map(item => ({
        campaign_id: item.attributedCampaignId,
        install_count: item._count.id,
      })),
      purchases_by_campaign: purchasesByCampaign.map(item => ({
        campaign_id: item.attributedCampaignId,
        purchase_count: item._count.id,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export { router as dashboardAnalyticsRouter };

