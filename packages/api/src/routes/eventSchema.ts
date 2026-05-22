import { Router, Request, Response } from 'express';
import { validateJWT } from '../middleware/jwtAuth';
import { prisma } from '../db/client';

export const eventSchemaRouter = Router();

eventSchemaRouter.use(validateJWT);

// GET /event-schema — list all schemas for userId, ordered by name
eventSchemaRouter.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;

  const schemas = await prisma.eventSchema.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, description: true, properties: true, createdAt: true },
  });

  res.json({ success: true, schemas });
});

// POST /event-schema — create a new schema
eventSchemaRouter.post('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { name, description = '', properties = [] } = req.body as {
    name?: string;
    description?: string;
    properties?: unknown[];
  };

  if (!name?.trim()) {
    return res.status(400).json({ success: false, error: 'Event name is required' });
  }

  // Validate name: no spaces, snake_case-ish (letters, numbers, underscores, hyphens)
  if (!/^[a-z][a-z0-9_-]*$/.test(name.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Event name must be lowercase, start with a letter, and contain only letters, numbers, underscores, or hyphens (e.g. reservation_completed)',
    });
  }

  try {
    const schema = await prisma.eventSchema.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() ?? '',
        properties: (properties ?? []) as any,
      },
      select: { id: true, name: true, description: true, properties: true, createdAt: true },
    });
    res.json({ success: true, schema });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ success: false, error: `Event schema "${name}" already exists` });
    }
    throw err;
  }
});

// PUT /event-schema/:id — update description and/or properties
eventSchemaRouter.put('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { id } = req.params;
  const { description, properties } = req.body as {
    description?: string;
    properties?: unknown[];
  };

  // Verify ownership
  const existing = await prisma.eventSchema.findFirst({ where: { id, userId } });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Event schema not found' });
  }

  const updateData: any = {};
  if (description !== undefined) updateData.description = description.trim();
  if (properties !== undefined) updateData.properties = properties;

  const schema = await prisma.eventSchema.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, description: true, properties: true, createdAt: true },
  });

  res.json({ success: true, schema });
});

// DELETE /event-schema/:id — delete (only if userId matches)
eventSchemaRouter.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { id } = req.params;

  const deleted = await prisma.eventSchema.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) {
    return res.status(404).json({ success: false, error: 'Event schema not found' });
  }

  res.json({ success: true });
});
