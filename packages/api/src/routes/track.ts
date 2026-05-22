import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
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

// Validation schema for batch events
const batchEventSchema = z.object({
  events: z.array(trackEventSchema).min(1).max(1000), // Limit to 1000 events per batch
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

    // Get userId from API key for direct user association
    let userId: string | null = null;
    if (apiKeyId) {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyId },
        select: { userId: true },
      });
      userId = apiKey?.userId || null;
    }

    // Create event with API key and user association
    // Migration applied - userId column exists now
    const event = await prisma.event.create({
      data: {
        id: body.event_id || undefined, // Use provided ID or let Prisma generate
        eventName: body.event,
        distinctId: body.distinct_id,
        timestamp,
        properties: body.properties || {},
        apiKeyId: apiKeyId || null, // Associate event with API key
        userId: userId || null, // Associate event directly with user (for data persistence after key revocation)
      } as any, // Type assertion - Prisma types should include apiKeyId and userId after regeneration
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

/**
 * POST /track/batch
 * Ingests multiple events in a single request
 * Requires API key authentication
 * Uses bulk insert for better performance
 */
router.post('/batch', validateApiKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const body = batchEventSchema.parse(req.body);
    const apiKeyId = (req as any).apiKeyId;

    // Get userId from API key for direct user association (cache this for batch)
    let userId: string | null = null;
    if (apiKeyId) {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyId },
        select: { userId: true },
      });
      userId = apiKey?.userId || null;
    }

    // Prepare events for bulk insert
    const now = new Date();
    const eventsToInsert = body.events.map((event) => {
      const timestamp = event.timestamp ? new Date(event.timestamp) : now;
      const eventId = event.event_id || randomUUID();
      
      return {
        id: eventId,
        event_name: event.event,
        distinct_id: event.distinct_id,
        timestamp,
        properties: event.properties || {},
        api_key_id: apiKeyId || null,
        user_id: userId || null,
        created_at: now,
      };
    });

    // Check for idempotency - filter out events that already exist
    const eventIds = eventsToInsert.map(e => e.id).filter(Boolean);
    let existingEventIds: string[] = [];
    
    if (eventIds.length > 0) {
      const existing = await prisma.event.findMany({
        where: { id: { in: eventIds } },
        select: { id: true },
      });
      existingEventIds = existing.map(e => e.id);
    }

    // Filter out events that already exist
    const newEvents = eventsToInsert.filter(e => !existingEventIds.includes(e.id));

    if (newEvents.length === 0) {
      // All events already exist
      return res.status(200).json({
        success: true,
        processed: 0,
        skipped: eventsToInsert.length,
        event_ids: eventIds,
        message: 'All events already processed',
      });
    }

    // Perform bulk insert using transaction for better performance
    // Using transaction batches all inserts into a single database round-trip
    if (newEvents.length === 1) {
      // Single event - use Prisma for consistency
      const event = newEvents[0];
      await prisma.event.create({
        data: {
          id: event.id,
          eventName: event.event_name,
          distinctId: event.distinct_id,
          timestamp: event.timestamp,
          properties: event.properties,
          apiKeyId: event.api_key_id,
          userId: event.user_id,
        } as any,
      });
    } else {
      // Bulk insert using transaction with multiple creates
      // This batches all inserts into a single database transaction
      // While not as fast as raw SQL bulk insert, it's safer and still much faster than sequential creates
      await prisma.$transaction(
        async (tx) => {
          // Create all events in parallel within the transaction
          await Promise.all(
            newEvents.map((event) =>
              tx.event.create({
                data: {
                  id: event.id,
                  eventName: event.event_name,
                  distinctId: event.distinct_id,
                  timestamp: event.timestamp,
                  properties: event.properties,
                  apiKeyId: event.api_key_id,
                  userId: event.user_id,
                } as any,
              })
            )
          );
        },
        {
          // Increase timeout for large batches (maxWait: time to wait for transaction, timeout: total time)
          maxWait: 10000, // 10 seconds to wait for transaction lock
          timeout: 30000, // 30 seconds total timeout
        }
      );
    }

    const insertedCount = newEvents.length;
    const skippedCount = existingEventIds.length;

    res.status(201).json({
      success: true,
      processed: insertedCount,
      skipped: skippedCount,
      total: eventsToInsert.length,
      event_ids: newEvents.map(e => e.id),
    });
  } catch (error) {
    // Let the global error handler deal with it
    next(error);
  }
});

/**
 * DELETE /track?distinct_id=xxx
 * Deletes all events for a given distinct_id scoped to the authenticated API key.
 * Requires API key authentication.
 */
router.delete('/', validateApiKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ distinct_id: z.string().min(1) });
    const { distinct_id } = schema.parse(req.query);
    const apiKeyId = (req as any).apiKeyId;

    const where: any = { distinctId: distinct_id };
    if (apiKeyId) where.apiKeyId = apiKeyId;

    const result = await prisma.event.deleteMany({ where });
    res.json({ success: true, deleted: result.count });
  } catch (error) {
    next(error);
  }
});

export { router as trackRouter };

