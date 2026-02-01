import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';
import { ATTRIBUTION_WINDOW_HOURS } from '../index';
import { performAttribution } from '../services/attribution';

const router = Router();

// Validation schema for install event
const installSchema = z.object({
  device_id: z.string().min(1, 'Device ID is required'),
  timestamp: z.number().int().positive().optional(),
});

/**
 * POST /install
 * Records an install event and performs attribution
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const body = installSchema.parse(req.body);

    // Use provided timestamp or current time
    const installTime = body.timestamp ? new Date(body.timestamp) : new Date();

    // Perform attribution (last-click attribution)
    const attributedCampaignId = await performAttribution(
      body.device_id,
      installTime,
      ATTRIBUTION_WINDOW_HOURS
    );

    // Create install record
    const install = await prisma.install.create({
      data: {
        deviceId: body.device_id,
        installTime,
        attributedCampaignId: attributedCampaignId || null,
      },
    });

    // Also create an event for the install
    await prisma.event.create({
      data: {
        eventName: 'install',
        distinctId: body.device_id,
        timestamp: installTime,
        properties: {},
        attributedCampaignId: attributedCampaignId || null,
      },
    });

    res.status(201).json({
      success: true,
      install_id: install.id,
      attributed_campaign_id: attributedCampaignId || null,
    });
  } catch (error) {
    next(error);
  }
});

export { router as installRouter };

