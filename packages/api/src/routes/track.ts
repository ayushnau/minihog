import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';
import { validateApiKey } from '../middleware/apiKeyAuth';

const router = Router();

// Validation schema for track event
const trackEventSchema = z.object({
  event: z.string().min(1, 'Event name is required'),
  distinct_id: z.string().min(1, 'Distinct ID is required'),
  timestamp: z.number().int().positive().optional(),
  properties: z.record(z.any()).optional().default({}),
  event_id: z.string().optional(), // For idempotency
});

/**
 * POST /track
 * Ingests a user event
 * Requires API key authentication
 */
router.post('/', validateApiKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const body = trackEventSchema.parse(req.body);
    const apiKeyId = (req as any).apiKeyId;

    // Use provided timestamp or current time
    const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

    // Check for idempotency if event_id is provided
    if (body.event_id) {
      const existing = await prisma.event.findUnique({
        where: { id: body.event_id },
      });

      if (existing) {
        return res.status(200).json({
          success: true,
          event_id: existing.id,
          message: 'Event already processed',
        });
      }
    }

    // Create event with API key association
    const event = await prisma.event.create({
      data: {
        id: body.event_id || undefined, // Use provided ID or let Prisma generate
        eventName: body.event,
        distinctId: body.distinct_id,
        timestamp,
        properties: body.properties || {},
        apiKeyId: apiKeyId || null, // Associate event with API key
      } as any, // Type assertion - Prisma types should include apiKeyId after regeneration
    });

    res.status(201).json({
      success: true,
      event_id: event.id,
    });
  } catch (error) {
    // Let the global error handler deal with it
    next(error);
  }
});

export { router as trackRouter };

