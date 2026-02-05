import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';

/**
 * Middleware to validate API key from request
 * Supports:
 * - Header: X-API-Key
 * - Header: Authorization: Bearer <key>
 * - Query param: api_key (for GET requests)
 */
export async function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Try to get API key from various sources
    let apiKey: string | undefined;

    // 1. Check X-API-Key header
    apiKey = req.headers['x-api-key'] as string;

    // 2. Check Authorization Bearer header
    if (!apiKey) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7);
      }
    }

    // 3. Check query parameter (for GET requests)
    if (!apiKey && req.query.api_key) {
      apiKey = req.query.api_key as string;
    }

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required. Provide it via X-API-Key header, Authorization Bearer header, or api_key query parameter.',
      });
    }

    // Validate API key exists and is active (not revoked)
    const keyRecord = await (prisma.apiKey as any).findUnique({
      where: { key: apiKey },
      select: {
        id: true,
        userId: true,
        key: true,
        name: true,
        lastUsed: true,
        createdAt: true,
        deletedAt: true, // Migration applied - column exists now
      },
    });
    
    // Check if key is revoked (deletedAt is set)
    if (keyRecord && keyRecord.deletedAt) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or revoked API key',
      });
    }

    if (!keyRecord) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or revoked API key',
      });
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: {
        lastUsed: new Date(),
      },
    });

    // Attach API key info to request for use in route handlers
    (req as any).apiKeyId = keyRecord.id;
    (req as any).apiKey = keyRecord;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional API key validation - doesn't fail if missing
 * Useful for endpoints that can work with or without API key
 */
export async function optionalApiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let apiKey: string | undefined;

    apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7);
      }
    }

    if (!apiKey && req.query.api_key) {
      apiKey = req.query.api_key as string;
    }

    if (apiKey) {
      const keyRecord = await (prisma.apiKey as any).findUnique({
        where: { key: apiKey },
        select: {
          id: true,
          userId: true,
          key: true,
          name: true,
          lastUsed: true,
          createdAt: true,
          deletedAt: true, // Migration applied - column exists now
        },
      });
      
      // Skip if key is revoked
      if (keyRecord && keyRecord.deletedAt) {
        return next(); // Skip revoked keys
      }
      
      if (keyRecord) {
        await prisma.apiKey.update({
          where: { id: keyRecord.id },
          data: {
            lastUsed: new Date(),
          },
        });

        (req as any).apiKeyId = keyRecord.id;
        (req as any).apiKey = keyRecord;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

