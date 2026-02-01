import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';

const router = Router();

// Validation schema for click event
const clickSchema = z.object({
  device_id: z.string().min(1, 'Device ID is required'),
  campaign_id: z.string().min(1, 'Campaign ID is required'),
  timestamp: z.number().int().positive().optional(),
});

/**
 * POST /click
 * Records a marketing click interaction for attribution
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const body = clickSchema.parse(req.body);

    // Use provided timestamp or current time
    const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

    // Create click record
    const click = await prisma.click.create({
      data: {
        deviceId: body.device_id,
        campaignId: body.campaign_id,
        timestamp,
      },
    });

    res.status(201).json({
      success: true,
      click_id: click.id,
    });
  } catch (error) {
    next(error);
  }
});

export { router as clickRouter };

