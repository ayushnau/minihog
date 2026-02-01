import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';
import { getEventCounts } from '../services/analytics/eventCount';
import { getFunnelAnalysis } from '../services/analytics/funnel';
import { getRetentionAnalysis } from '../services/analytics/retention';

const router = Router();

/**
 * GET /analytics/events
 * Returns event count and unique users for a given event
 * Query params: event, from (YYYY-MM-DD), to (YYYY-MM-DD)
 */
router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      event: z.string().min(1),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });

    const params = schema.parse(req.query);

    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    const result = await getEventCounts(params.event, fromDate, toDate);

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
 * GET /analytics/funnel
 * Returns funnel analysis for a sequence of events
 * Query params: steps (comma-separated event names), from, to
 */
router.get('/funnel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      steps: z.string().min(1), // Comma-separated event names
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });

    const params = schema.parse(req.query);
    const steps = params.steps.split(',').map(s => s.trim()).filter(Boolean);

    if (steps.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 steps required for funnel analysis',
      });
    }

    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    const result = await getFunnelAnalysis(steps, fromDate, toDate);

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
 * GET /analytics/retention
 * Returns retention analysis for users
 * Query params: cohort (event name), day (number of days)
 */
router.get('/retention', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      cohort: z.string().min(1), // Event name that defines the cohort
      day: z.string().regex(/^\d+$/).transform(Number),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });

    const params = schema.parse(req.query);

    const fromDate = params.from ? new Date(params.from) : new Date(0);
    const toDate = params.to ? new Date(params.to + 'T23:59:59.999Z') : new Date();

    const result = await getRetentionAnalysis(
      params.cohort,
      params.day,
      fromDate,
      toDate
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
 * GET /analytics/attribution
 * Returns attribution analytics (installs per campaign, revenue per campaign, etc.)
 */
router.get('/attribution', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get installs per campaign
    const installsByCampaign = await prisma.install.groupBy({
      by: ['attributedCampaignId'],
      where: {
        attributedCampaignId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get revenue per campaign (from purchase events with attributed campaigns)
    // Note: Revenue extraction from JSON properties requires raw SQL or a separate column
    // For now, we'll just count purchases per campaign
    const revenueByCampaign = await prisma.event.groupBy({
      by: ['attributedCampaignId'],
      where: {
        eventName: 'purchase',
        attributedCampaignId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
    });

    // Format results
    const installs = installsByCampaign.map(item => ({
      campaign_id: item.attributedCampaignId,
      install_count: item._count.id,
    }));

    const purchases = revenueByCampaign.map(item => ({
      campaign_id: item.attributedCampaignId,
      purchase_count: item._count.id,
    }));

    res.json({
      success: true,
      installs_by_campaign: installs,
      purchases_by_campaign: purchases,
    });
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRouter };

